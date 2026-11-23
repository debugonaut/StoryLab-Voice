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

  window.StoryLabAuth = {
    init: init,
    getSession: getSession,
    getRole: getRole,
    can: can,
    loginStudent: loginStudent,
    loginTeacher: loginTeacher,
    loginAdmin: loginAdmin,
    logout: logout,
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
    migrateExistingStudent: migrateExistingStudent,
    writeAuditLog: writeAuditLog,
    getAppSettings: getAppSettings,
    saveAppSettings: saveAppSettings,
    defaultSettings: function () { return Object.assign({}, DEFAULT_SETTINGS); },
    ADMIN_ID: ADMIN_ID
  };

  console.log('[Auth] window.StoryLabAuth ready');
})();
