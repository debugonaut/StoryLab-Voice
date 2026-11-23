/**
 * StoryLab Voice — accounts, sessions and role gates
 *
 * Exports: window.StoryLabAuth
 *   init(), getSession(), getRole(), can(role)
 *   loginStudent(accountId, pin), loginTeacher(accountId, pin), loginAdmin(pin)
 *   logout(), createAccount(role, data, pin), updateAccount(id, partial)
 *   resetPin(id, newPin), disableAccount(id), deleteAccount(id)
 *   getStudents(), getTeachers(), getAccounts(role)
 *   hashPin(pin), checkPin(pin, hash), isFirstBoot(), migrateExistingStudent()
 *   writeAuditLog(action, targetId, detail), getAppSettings(), saveAppSettings()
 *
 * Sessions live in sessionStorage so a shared tablet forgets the operator when
 * the tab closes. PINs are hashed with crypto.subtle — nothing leaves the device.
 */
;(function () {
  'use strict';

  var SESSION_KEY = 'storylab:session';
  var ADMIN_ID = 'ADM-ROOT';
  var SETTINGS_KEY = '__app_settings';
  var TEACHER_HOURS = 8;
  var ADMIN_HOURS = 8;

  var DEFAULT_SETTINGS = {
    schoolName: 'StoryLab School',
    defaultLanguage: 'en',
    studentPinDigits: 4,
    teacherSessionHours: 8,
    aiTutorUrl: ''
  };

  var _session = null;

  /* ------------------------------------------------------------
     PIN hashing
     ------------------------------------------------------------ */
  async function hashPin(pin) {
    var enc = new TextEncoder();
    var buf = await crypto.subtle.digest('SHA-256', enc.encode(String(pin)));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  async function checkPin(pin, hash) {
    if (!hash) return false;
    return (await hashPin(pin)) === hash;
  }

  /* ------------------------------------------------------------
     IDs
     ------------------------------------------------------------ */
  function generateStudentId() {
    return 'SLV-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function generateTeacherId() {
    return 'TCH-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function uuid() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (err) { /* fall through */ }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  function now() {
    return Date.now();
  }

  /* ------------------------------------------------------------
     Session
     ------------------------------------------------------------ */
  function persist(session) {
    _session = session;
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.warn('[Auth] Could not write the session:', err);
    }
    if (session) {
      document.documentElement.setAttribute('data-role', session.role);
    } else {
      document.documentElement.setAttribute('data-role', '');
    }
  }

  function clearSession() {
    _session = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) { /* storage may be unavailable */ }
    document.documentElement.setAttribute('data-role', '');
  }

  async function init() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        _session = null;
        document.documentElement.setAttribute('data-role', '');
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.accountId || !parsed.role) {
        clearSession();
        return null;
      }
      if (parsed.expiresAt && now() > parsed.expiresAt) {
        clearSession();
        return null;
      }
      _session = parsed;
      document.documentElement.setAttribute('data-role', parsed.role);
      return parsed;
    } catch (err) {
      console.warn('[Auth] Session could not be restored:', err);
      clearSession();
      return null;
    }
  }

  function getSession() {
    return _session;
  }

  function getRole() {
    return _session ? _session.role : null;
  }

  function can(role) {
    return getRole() === role;
  }

  /* ------------------------------------------------------------
     Login
     ------------------------------------------------------------ */
  async function loadAccount(accountId) {
    if (!accountId) return null;
    var account = await window.DB.load('accounts', accountId);
    return account && account.id ? account : null;
  }

  async function sessionHours() {
    try {
      var settings = await getAppSettings();
      var hours = Number(settings.teacherSessionHours);
      if (isFinite(hours) && hours >= 0) return hours;
    } catch (err) { /* fall back to the default */ }
    return TEACHER_HOURS;
  }

  function expiryFor(hours) {
    // Students pass null: their session lives until the tab closes.
    if (hours === null || hours === undefined || hours === 0) return null;
    var value = isFinite(Number(hours)) && Number(hours) > 0 ? Number(hours) : TEACHER_HOURS;
    return now() + value * 60 * 60 * 1000;
  }

  async function buildSession(account, hours, detail) {
    var session = {
      token: uuid(),
      accountId: account.id,
      role: account.role,
      name: account.name,
      loginAt: now(),
      expiresAt: expiryFor(hours)
    };
    persist(session);

    try {
      var next = Object.assign({}, account, {
        metadata: Object.assign({}, account.metadata || {}, { lastLogin: session.loginAt })
      });
      await window.DB.save('accounts', account.id, next);
    } catch (err) {
      console.warn('[Auth] Could not stamp last login:', err);
    }

    await writeAuditLog('login', account.id, detail);
    return session;
  }

  async function loginWithPin(accountId, pin, expectedRole, hours, detail) {
    var account = await loadAccount(accountId);
    if (!account) throw new Error('Account not found');
    if (account.role !== expectedRole) throw new Error('Account not found');
    if (account.active === false) throw new Error('This account is disabled');
    var ok = await checkPin(pin, account.pinHash);
    if (!ok) throw new Error('Wrong PIN');
    return buildSession(account, hours, detail);
  }

  async function loginStudent(accountId, pin) {
    return loginWithPin(accountId, pin, 'student', null, 'Student login');
  }

  async function loginTeacher(accountId, pin) {
    return loginWithPin(accountId, pin, 'teacher', await sessionHours(), 'Teacher login');
  }

  async function loginAdmin(pin) {
    var account = await loadAccount(ADMIN_ID);
    if (!account) throw new Error('Admin account not found');
    if (account.active === false) throw new Error('This account is disabled');
    var ok = await checkPin(pin, account.pinHash);
    if (!ok) throw new Error('Wrong PIN');
    return buildSession(account, ADMIN_HOURS, 'Admin login');
  }

  async function logout() {
    var session = getSession();
    if (session) {
      await writeAuditLog('logout', session.accountId, session.role + ' signed out');
    }
    clearSession();
    try {
      window.dispatchEvent(new CustomEvent('storylab:logout'));
    } catch (err) { /* ignore */ }
  }

  /* ------------------------------------------------------------
     Account creation / mutation
     ------------------------------------------------------------ */
  function buildMetadata(role, data) {
    var payload = data || {};
    var metadata = { lastLogin: null };
    if (role === 'student') {
      metadata.grade = payload.grade != null ? String(payload.grade) : '5';
      metadata.avatar = payload.avatar || 'sun';
      metadata.language = payload.language || 'en';
    }
    if (role === 'teacher') {
      metadata.subjects = Array.isArray(payload.subjects)
        ? payload.subjects.slice()
        : String(payload.subjects || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean);
      metadata.batchLabel = String(payload.batchLabel || '').trim();
      metadata.assignedStudentIds = Array.isArray(payload.assignedStudentIds)
        ? payload.assignedStudentIds.slice()
        : [];
    }
    return metadata;
  }

  async function createAccount(role, data, pin) {
    if (role !== 'student' && role !== 'teacher' && role !== 'admin') {
      throw new Error('Unknown role: ' + role);
    }

    var firstBoot = await isFirstBoot();
    // A tablet upgraded from v2 can hold students but no admin yet, so the
    // first admin may also be created without a session.
    var adminMissing = role === 'admin' && !(await loadAccount(ADMIN_ID));
    if (!firstBoot && getRole() !== 'admin' && !adminMissing) {
      throw new Error('Only an admin can create accounts');
    }
    if (!pin) throw new Error('A PIN is required');

    var payload = data || {};
    var id = role === 'admin'
      ? ADMIN_ID
      : (payload.id || (role === 'teacher' ? generateTeacherId() : generateStudentId()));

    var existing = await loadAccount(id);
    if (existing) throw new Error('An account with that ID already exists');

    var account = {
      id: id,
      role: role,
      name: String(payload.name || '').trim() || (role === 'admin' ? 'Administrator' : 'Unnamed ' + role),
      pinHash: await hashPin(pin),
      createdAt: now(),
      createdBy: getRole() === 'admin' ? _session.accountId : null,
      active: true,
      metadata: buildMetadata(role, payload)
    };

    if (role === 'admin') {
      account.pinHash = await hashPin(pin);
    }

    await window.DB.save('accounts', id, account);
    await writeAuditLog('create_account', id, 'Created ' + role + ': ' + account.name);
    return account;
  }

  async function updateAccount(accountId, partialData) {
    var account = await loadAccount(accountId);
    if (!account) throw new Error('Account not found');
    var partial = partialData || {};
    var next = Object.assign({}, account, partial);
    next.id = account.id;
    next.role = account.role;
    next.metadata = Object.assign({}, account.metadata || {}, partial.metadata || {});
    await window.DB.save('accounts', accountId, next);
    if (getSession() && getSession().accountId === accountId) {
      var session = Object.assign({}, getSession(), { name: next.name });
      persist(session);
    }
    return next;
  }

  async function resetPin(accountId, newPin) {
    var account = await loadAccount(accountId);
    if (!account) throw new Error('Account not found');
    if (!newPin) throw new Error('A new PIN is required');
    account.pinHash = await hashPin(newPin);
    await window.DB.save('accounts', accountId, account);
    await writeAuditLog('reset_pin', accountId, 'PIN reset for ' + account.name);
  }

  async function disableAccount(accountId) {
    var account = await loadAccount(accountId);
    if (!account) throw new Error('Account not found');
    account.active = false;
    await window.DB.save('accounts', accountId, account);
    await writeAuditLog('disable_account', accountId, 'Disabled ' + account.name);
  }

  async function deleteAccount(accountId) {
    var account = await loadAccount(accountId);
    await window.DB.remove('accounts', accountId);
    await writeAuditLog('delete_account', accountId, 'Deleted ' + (account ? account.name : accountId));
  }

  /* ------------------------------------------------------------
     Listing
     ------------------------------------------------------------ */
  function byName(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  }

  async function getAccounts(role) {
    var all = [];
    try {
      all = await window.DB.getAll('accounts');
    } catch (err) {
      return [];
    }
    var list = all.filter(function (item) {
      return item && item.id && item.id !== SETTINGS_KEY && item.role;
    });
    if (role) {
      list = list.filter(function (item) { return item.role === role; });
    }
    return list.sort(byName);
  }

  async function getStudents() {
    var list = await getAccounts('student');
    return list.filter(function (item) { return item.active !== false; });
  }

  async function getTeachers() {
    var list = await getAccounts('teacher');
    return list.filter(function (item) { return item.active !== false; });
  }

  async function isFirstBoot() {
    try {
      return (await getAccounts()).length === 0;
    } catch (err) {
      return true;
    }
  }

  /* ------------------------------------------------------------
     Legacy migration (v2 profile -> v3 account)
     ------------------------------------------------------------ */
  async function migrateExistingStudent() {
    try {
      var profile = await window.DB.load('profile', 'student');
      if (!profile || !profile.id) return;
      var existing = await loadAccount(profile.id);
      if (existing) return;

      var account = {
        id: profile.id,
        role: 'student',
        name: profile.name || 'Student',
        pinHash: await hashPin('1234'),
        createdAt: profile.createdAt || now(),
        createdBy: null,
        active: true,
        metadata: {
          grade: profile.grade || '5',
          avatar: profile.avatar || 'sun',
          language: profile.language || 'en',
          lastLogin: null
        }
      };
      await window.DB.save('accounts', account.id, account);
      console.log('[Auth] Migrated existing student to accounts store');
    } catch (err) {
      console.warn('[Auth] Could not migrate the existing student:', err);
    }
  }

  /* ------------------------------------------------------------
     Audit log
     ------------------------------------------------------------ */
  async function writeAuditLog(action, targetId, detail) {
    var session = getSession();
    try {
      await window.DB.save('audit_log', undefined, {
        actorId: session ? session.accountId : 'system',
        actorRole: session ? session.role : 'system',
        action: action,
        targetId: targetId || null,
        detail: detail || action,
        ts: now()
      });
    } catch (err) {
      console.warn('[Auth] Could not write the audit log:', err);
    }
  }

  /* ------------------------------------------------------------
     App settings (stored in the accounts store under a reserved key)
     ------------------------------------------------------------ */
  async function getAppSettings() {
    var stored = null;
    try {
      stored = await window.DB.load('accounts', SETTINGS_KEY);
    } catch (err) { /* fall back to defaults */ }
    var settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
    delete settings.id;
    delete settings.role;
    return settings;
  }

  async function saveAppSettings(settings) {
    var next = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    await window.DB.save('accounts', SETTINGS_KEY, next);
    await writeAuditLog('change_settings', null, 'Updated app settings');
    return next;
  }

  async function seedDemoData(force) {
    var DB = window.DB;
    if (!DB) return;

    if (!force) {
      try {
        var existing = await getAccounts();
        if (existing && existing.length > 0) return;
      } catch (e) {}
    }

    console.log('[Auth] Seeding interconnected demo roles and records into IndexedDB...');

    // 1. Accounts
    var accounts = [
      {
        id: 'ADM-ROOT',
        role: 'admin',
        name: 'Principal Sharma',
        pinHash: 'e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea', // 112233
        createdAt: now() - 86400000 * 7,
        active: true,
        metadata: {
          title: 'School Administrator',
          school: 'Z.P. Primary School, Pune',
          assignedStudentIds: []
        }
      },
      {
        id: 'TCH-2026-SCIE',
        role: 'teacher',
        name: 'Anjali Patil',
        pinHash: 'bcac371b54f59945a14aa49e2e408e5d6e4dbc59387f5d8cfc6b015d40d5bb02', // 2233
        createdAt: now() - 86400000 * 6,
        active: true,
        metadata: {
          batchLabel: 'Grade 6 - Science & Math',
          subject: 'Science & Mathematics',
          assignedStudentIds: ['SLV-2026-AARV', 'SLV-2026-PRYA']
        }
      },
      {
        id: 'TCH-2026-LANG',
        role: 'teacher',
        name: 'Vikram Deshmukh',
        pinHash: 'dec1ab2f6d6e994cfe718666751e27a22a3c8c2e7c2708b995fb1e021197136e', // 4455
        createdAt: now() - 86400000 * 6,
        active: true,
        metadata: {
          batchLabel: 'Grade 5 - EVS & Social',
          subject: 'Environmental Studies & Social',
          assignedStudentIds: ['SLV-2026-RHAN', 'SLV-2026-SNHA']
        }
      },
      {
        id: 'SLV-2026-AARV',
        role: 'student',
        name: 'Aarav Shinde',
        pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
        createdAt: now() - 86400000 * 5,
        active: true,
        metadata: {
          grade: '6',
          avatar: 'sun',
          language: 'mr',
          teacherId: 'TCH-2026-SCIE',
          teacherName: 'Anjali Patil'
        }
      },
      {
        id: 'SLV-2026-PRYA',
        role: 'student',
        name: 'Priya Sharma',
        pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
        createdAt: now() - 86400000 * 5,
        active: true,
        metadata: {
          grade: '5',
          avatar: 'star',
          language: 'hi',
          teacherId: 'TCH-2026-SCIE',
          teacherName: 'Anjali Patil'
        }
      },
      {
        id: 'SLV-2026-RHAN',
        role: 'student',
        name: 'Rohan Kadam',
        pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
        createdAt: now() - 86400000 * 4,
        active: true,
        metadata: {
          grade: '5',
          avatar: 'bolt',
          language: 'mr',
          teacherId: 'TCH-2026-LANG',
          teacherName: 'Vikram Deshmukh'
        }
      },
      {
        id: 'SLV-2026-SNHA',
        role: 'student',
        name: 'Sneha Patil',
        pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
        createdAt: now() - 86400000 * 4,
        active: true,
        metadata: {
          grade: '6',
          avatar: 'atom',
          language: 'en',
          teacherId: 'TCH-2026-LANG',
          teacherName: 'Vikram Deshmukh'
        }
      }
    ];

    for (var a = 0; a < accounts.length; a++) {
      await DB.save('accounts', accounts[a].id, accounts[a]);
    }

    // 2. Student Progress
    var aaravProgress = {
      stories: {
        'science-plants': {
          id: 'science-plants',
          title: 'How Plants Eat Light',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000 * 2,
          answers: { s2: 0 }
        },
        'math-market': {
          id: 'math-market',
          title: 'Market Day',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000,
          answers: { s2: 0 }
        }
      },
      labs: {
        'acid-base': {
          id: 'acid-base',
          title: 'Acids, Bases and Turmeric Indicator',
          completed: true,
          completedAt: now() - 86400000,
          durationMs: 360000
        }
      }
    };
    await DB.save('progress', 'SLV-2026-AARV', aaravProgress);
    await DB.save('progress', 'student', aaravProgress);

    var priyaProgress = {
      stories: {
        'math-fractions': {
          id: 'math-fractions',
          title: 'Pizza Fractions',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000 * 2,
          answers: { s2: 0 }
        },
        'math-market': {
          id: 'math-market',
          title: 'Market Day',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000,
          answers: { s2: 0 }
        }
      },
      labs: {
        'salt-dissolving': {
          id: 'salt-dissolving',
          title: 'Salt Dissolving and Saturation',
          completed: true,
          completedAt: now() - 86400000,
          durationMs: 420000
        }
      }
    };
    await DB.save('progress', 'SLV-2026-PRYA', priyaProgress);

    var rohanProgress = {
      stories: {
        'social-village': {
          id: 'social-village',
          title: 'Our Village Community',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000 * 3
        },
        'evs-animals': {
          id: 'evs-animals',
          title: 'Animals and Habitats',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000
        }
      },
      labs: {}
    };
    await DB.save('progress', 'SLV-2026-RHAN', rohanProgress);

    var snehaProgress = {
      stories: {
        'science-solar': {
          id: 'science-solar',
          title: 'Touring the Solar System',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: now() - 86400000 * 2
        }
      },
      labs: {
        'acid-base': {
          id: 'acid-base',
          title: 'Acids, Bases and Turmeric Indicator',
          completed: true,
          completedAt: now() - 86400000,
          durationMs: 310000
        }
      }
    };
    await DB.save('progress', 'SLV-2026-SNHA', snehaProgress);

    // 3. Journeys
    var aaravJourney = {
      version: 1,
      createdAt: now() - 86400000 * 7,
      orientation: { completed: true, score: 1, total: 1, completedAt: now() - 86400000 * 5 },
      badges: [
        { id: 'first-story', label: 'Story Starter', earnedAt: now() - 86400000 * 2 },
        { id: 'curious-mind', label: 'Curious Mind', earnedAt: now() - 86400000 },
        { id: 'lab-explorer', label: 'Lab Explorer', earnedAt: now() - 86400000 },
        { id: 'marathi-scholar', label: 'मराठी भाषा', earnedAt: now() - 86400000 }
      ],
      stats: { sessionsStarted: 4, totalTimeMs: 42 * 60 * 1000 }
    };
    await DB.save('journey', 'SLV-2026-AARV', aaravJourney);
    await DB.save('journey', 'student', aaravJourney);

    // 4. Default Profile
    var curProf = await DB.load('profile', 'student');
    if (!curProf || !curProf.name) {
      await DB.save('profile', 'student', {
        id: 'SLV-2026-AARV',
        name: 'Aarav Shinde',
        avatar: 'sun',
        grade: '6',
        language: 'mr',
        languageTag: 'mr-IN',
        mic: 'verified',
        onboardedAt: now() - 86400000 * 5
      });
    }

    // 5. Assignments (Teacher Anjali Patil -> Aarav & Priya, Vikram Deshmukh -> All)
    var assignments = [
      {
        id: 1,
        teacherId: 'TCH-2026-SCIE',
        teacherName: 'Anjali Patil',
        targetType: 'student',
        targetId: 'SLV-2026-AARV',
        moduleType: 'story',
        moduleId: 'science-water',
        notes: 'Please listen to the water cycle story before our Tuesday practical lab.',
        dueAt: now() + 86400000 * 2,
        createdAt: now() - 86400000,
        completedBy: []
      },
      {
        id: 2,
        teacherId: 'TCH-2026-SCIE',
        teacherName: 'Anjali Patil',
        targetType: 'student',
        targetId: 'SLV-2026-PRYA',
        moduleType: 'lab',
        moduleId: 'acid-base',
        notes: 'Complete the turmeric paper indicator test experiment.',
        dueAt: now() + 86400000 * 3,
        createdAt: now() - 86400000,
        completedBy: []
      },
      {
        id: 3,
        teacherId: 'TCH-2026-LANG',
        teacherName: 'Vikram Deshmukh',
        targetType: 'all',
        targetId: null,
        moduleType: 'story',
        moduleId: 'social-map',
        notes: 'Class 5 & 6 reading assignment: Map symbols and directions.',
        dueAt: now() + 86400000 * 4,
        createdAt: now() - 86400000 * 2,
        completedBy: []
      }
    ];
    for (var i = 0; i < assignments.length; i++) {
      await DB.save('assignments', assignments[i].id, assignments[i]);
    }

    // 6. Teacher Notes
    var notes = [
      {
        id: 1,
        teacherId: 'TCH-2026-SCIE',
        studentId: 'SLV-2026-AARV',
        text: 'Aarav demonstrated excellent understanding of photosynthesis and asked insightful questions about chlorophyll in the voice tutor.',
        createdAt: now() - 86400000 * 2
      },
      {
        id: 2,
        teacherId: 'TCH-2026-SCIE',
        studentId: 'SLV-2026-PRYA',
        text: 'Priya quickly grasped fraction division using the pizza story visualizer. Recommended for advanced math modules.',
        createdAt: now() - 86400000 * 2
      },
      {
        id: 3,
        teacherId: 'TCH-2026-LANG',
        studentId: 'SLV-2026-RHAN',
        text: 'Rohan completed the village community mapping story with high accuracy and fluent Marathi voice answers.',
        createdAt: now() - 86400000
      }
    ];
    for (var n = 0; n < notes.length; n++) {
      await DB.save('teacher_notes', notes[n].id, notes[n]);
    }

    // 7. Sessions
    var sessions = [
      {
        id: 'SES-AARV-01',
        studentId: 'SLV-2026-AARV',
        startedAt: now() - 86400000 * 2,
        endedAt: now() - 86400000 * 2 + (22 * 60 * 1000),
        durationMs: 22 * 60 * 1000
      },
      {
        id: 'SES-AARV-02',
        studentId: 'SLV-2026-AARV',
        startedAt: now() - 86400000,
        endedAt: now() - 86400000 + (20 * 60 * 1000),
        durationMs: 20 * 60 * 1000
      },
      {
        id: 'SES-PRYA-01',
        studentId: 'SLV-2026-PRYA',
        startedAt: now() - 86400000,
        endedAt: now() - 86400000 + (35 * 60 * 1000),
        durationMs: 35 * 60 * 1000
      },
      {
        id: 'SES-RHAN-01',
        studentId: 'SLV-2026-RHAN',
        startedAt: now() - 86400000,
        endedAt: now() - 86400000 + (18 * 60 * 1000),
        durationMs: 18 * 60 * 1000
      }
    ];
    for (var s = 0; s < sessions.length; s++) {
      await DB.save('sessions', sessions[s].id, sessions[s]);
    }

    // 8. Audit Log
    var logs = [
      { id: 1, actorId: 'ADM-ROOT', actorRole: 'admin', action: 'system_init', targetId: null, detail: 'Principal Sharma initialized school tablet ledger', ts: now() - 86400000 * 7 },
      { id: 2, actorId: 'ADM-ROOT', actorRole: 'admin', action: 'teacher_enrolled', targetId: 'TCH-2026-SCIE', detail: 'Registered teacher Anjali Patil (Grade 6 Science & Math)', ts: now() - 86400000 * 6 },
      { id: 3, actorId: 'ADM-ROOT', actorRole: 'admin', action: 'teacher_enrolled', targetId: 'TCH-2026-LANG', detail: 'Registered teacher Vikram Deshmukh (Grade 5 EVS & Social)', ts: now() - 86400000 * 6 },
      { id: 4, actorId: 'TCH-2026-SCIE', actorRole: 'teacher', action: 'student_enrolled', targetId: 'SLV-2026-AARV', detail: 'Enrolled Aarav Shinde into Grade 6 Science & Math batch', ts: now() - 86400000 * 5 },
      { id: 5, actorId: 'TCH-2026-SCIE', actorRole: 'teacher', action: 'assign_module', targetId: 'SLV-2026-AARV', detail: 'story: science-water assigned to Aarav Shinde', ts: now() - 86400000 },
      { id: 6, actorId: 'TCH-2026-SCIE', actorRole: 'teacher', action: 'assign_module', targetId: 'SLV-2026-PRYA', detail: 'lab: acid-base assigned to Priya Sharma', ts: now() - 86400000 },
      { id: 7, actorId: 'SLV-2026-AARV', actorRole: 'student', action: 'story_complete', targetId: 'science-plants', detail: 'Completed story: How Plants Eat Light (100% score)', ts: now() - 86400000 * 2 },
      { id: 8, actorId: 'SLV-2026-PRYA', actorRole: 'student', action: 'lab_complete', targetId: 'salt-dissolving', detail: 'Completed virtual lab: Salt Dissolving and Saturation', ts: now() - 86400000 }
    ];
    for (var l = 0; l < logs.length; l++) {
      await DB.save('audit_log', logs[l].id, logs[l]);
    }

    console.log('[Auth] ✓ Demo seed complete in IndexedDB!');
  }

  window.StoryLabAuth = {
    init: init,
    getSession: getSession,
    getRole: getRole,
    can: can,
    loginStudent: loginStudent,
    loginTeacher: loginTeacher,
    loginAdmin: loginAdmin,
    logout: logout,
    loadAccount: loadAccount,
    createAccount: createAccount,
    updateAccount: updateAccount,
    resetPin: resetPin,
    disableAccount: disableAccount,
    deleteAccount: deleteAccount,
    getStudents: getStudents,
    getTeachers: getTeachers,
    getAccounts: getAccounts,
    hashPin: hashPin,
    checkPin: checkPin,
    isFirstBoot: isFirstBoot,
    seedDemoData: seedDemoData,
    migrateExistingStudent: migrateExistingStudent,
    writeAuditLog: writeAuditLog,
    getAppSettings: getAppSettings,
    saveAppSettings: saveAppSettings,
    defaultSettings: function () { return Object.assign({}, DEFAULT_SETTINGS); },
    ADMIN_ID: ADMIN_ID
  };

  console.log('[Auth] window.StoryLabAuth ready');
})();
