/**
 * StoryLab Voice — admin panel
 *
 * Exports: window.StoryLabAdmin
 *   mount(root)          (#/admin)
 *   mountAccounts(root)  (#/admin/accounts)
 *   mountSettings(root)  (#/admin/settings)
 *   mountLog(root)       (#/admin/log)
 */
;(function () {
  'use strict';

  var UI = window.StoryLabUI;
  var DB = window.DB;
  var Auth = window.StoryLabAuth;

  var _gen = 0;
  var ALL_STORES = [
    'progress', 'profile', 'journey', 'sessions', 'events',
    'sync_queue', 'sync_archive', 'accounts',
    'teacher_notes', 'assignments', 'audit_log'
  ];

  function escape(value) {
    return UI && typeof UI.escape === 'function' ? UI.escape(value) : String(value == null ? '' : value);
  }

  function formatDateTime(value) {
    if (!value) return '—';
    return UI && UI.formatDateTime ? UI.formatDateTime(value) : new Date(value).toLocaleString();
  }

  function download(filename, data) {
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    } catch (err) {
      console.error('[Admin] Export failed:', err);
      if (UI && UI.toast) UI.toast({ title: 'Export failed', message: String(err.message || err), kind: 'error' });
    }
  }

  function toast(title, message, kind) {
    if (UI && UI.toast) UI.toast({ title: title, message: message, kind: kind || 'info' });
  }

  function guardAdmin(root) {
    var session = Auth.getSession();
    if (!session) {
      window.StoryLabRouter.navigate('login');
      return null;
    }
    if (session.role !== 'admin') {
      window.StoryLabRouter.navigate(session.role === 'teacher' ? 'teacher' : 'home');
      return null;
    }
    return session;
  }

  function roleBadge(role) {
    if (role !== 'teacher' && role !== 'admin' && role !== 'student') {
      return '<span class="mono-label">SYSTEM</span>';
    }
    return '<span class="role-badge role-badge--' + role + '">' + escape(role.toUpperCase()) + '</span>';
  }

  /* ------------------------------------------------------------
     Overview
     ------------------------------------------------------------ */
  async function loadOverview() {
    var teachers = await Auth.getTeachers();
    var students = await Auth.getStudents();
    var audit = [];
    try {
      audit = await DB.getAll('audit_log');
    } catch (err) { /* ignore */ }
    audit.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return {
      teachers: teachers,
      students: students,
      version: (window.DB && window.DB.version) || '—',
      lastAction: audit[0] || null
    };
  }

  function renderOverview(root, session, data) {
    var school = 'StoryLab School';
    root.innerHTML =
      '<div class="screen admin">' +
      '  <section class="panel role-head">' +
      '    <div>' +
      '      <p class="eyebrow">ADMIN PANEL</p>' +
      '      <h1 class="step-title" style="font-size:26px;margin-top:8px">' + escape(session.name || 'Administrator') + '</h1>' +
      '      <p class="mono-label" style="margin-top:6px">' + escape(school) + ' · LOCAL TERMINAL</p>' +
      '    </div>' +
      '    <div class="role-actions">' +
      '      <span class="role-badge role-badge--admin">ADMIN</span>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="signout">SIGN OUT</button>' +
      '    </div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">System status</p>' +
      '    <div class="stat-strip">' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + data.teachers.length + '</div><div class="stat-cell__label">Teachers</div></div>' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + data.students.length + '</div><div class="stat-cell__label">Students</div></div>' +
      '      <div class="stat-cell"><div class="stat-cell__value">v' + escape(data.version) + '</div><div class="stat-cell__label">DB version</div></div>' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + (data.lastAction ? escape(data.lastAction.action) : '—') +
      '</div><div class="stat-cell__label">Last audit action</div></div>' +
      '    </div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Quick actions</p>' +
      '    <div class="form-actions">' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="accounts">MANAGE ACCOUNTS</button>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="settings">APP SETTINGS</button>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="log">VIEW AUDIT LOG</button>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="export">EXPORT ALL DATA</button>' +
      '      <button type="button" class="btn btn-danger btn--sm" data-action="factory">FACTORY RESET</button>' +
      '    </div>' +
      '  </section>' +
      '</div>';

    var signout = root.querySelector('[data-action="signout"]');
    if (signout) {
      signout.addEventListener('click', async function () {
        await Auth.logout();
        window.StoryLabRouter.navigate('login');
      });
    }

    root.querySelector('[data-action="accounts"]').addEventListener('click', function () {
      window.StoryLabRouter.navigate('admin/accounts');
    });
    root.querySelector('[data-action="settings"]').addEventListener('click', function () {
      window.StoryLabRouter.navigate('admin/settings');
    });
    root.querySelector('[data-action="log"]').addEventListener('click', function () {
      window.StoryLabRouter.navigate('admin/log');
    });

    root.querySelector('[data-action="export"]').addEventListener('click', async function () {
      var dump = {
        product: 'StoryLab Voice',
        schema: 'slv-full-export/1',
        exportedAt: new Date().toISOString(),
        stores: {}
      };
      for (var i = 0; i < ALL_STORES.length; i += 1) {
        try {
          dump.stores[ALL_STORES[i]] = await DB.getAll(ALL_STORES[i]);
        } catch (err) {
          dump.stores[ALL_STORES[i]] = [];
        }
      }
      download('storylab-all-data.json', dump);
      toast('Export ready', 'The full data set was downloaded.', 'ok');
    });

    root.querySelector('[data-action="factory"]').addEventListener('click', async function () {
      var ok = true;
      if (UI && typeof UI.confirm === 'function') {
        ok = await UI.confirm({
          title: 'Factory reset this terminal?',
          message: 'All accounts, progress, notes and the audit log will be erased. This cannot be undone.',
          confirmLabel: 'Erase everything',
          danger: true
        });
      }
      if (!ok) return;
      try {
        await window.StoryLabState.resetUnit();
        await DB.clear('accounts');
        await DB.clear('teacher_notes');
        await DB.clear('assignments');
        await DB.clear('audit_log');
        await Auth.logout();
        toast('Terminal reset', 'All local data was erased.', 'ok');
        window.StoryLabRouter.navigate('login');
      } catch (err) {
        console.error('[Admin] Factory reset failed:', err);
        toast('Reset failed', String(err.message || err), 'error');
      }
    });
  }

  function mount(root) {
    var gen = ++_gen;
    var session = guardAdmin(root);
    if (!session) return function () {};

    root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ LOADING ADMIN PANEL…</p></section></div>';

    loadOverview().then(function (data) {
      if (gen !== _gen) return;
      renderOverview(root, session, data);
    }).catch(function (err) {
      console.error('[Admin] Overview failed:', err);
      if (gen !== _gen) return;
      root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ ADMIN PANEL UNAVAILABLE</p></section></div>';
    });

    return function cleanup() { _gen += 1; };
  }

  /* ------------------------------------------------------------
     Accounts
     ------------------------------------------------------------ */
  function teacherFormHtml() {
    return (
      '<form class="role-form" data-form="new-teacher" id="new-teacher-form">' +
      '  <div class="field-grid">' +
      '    <div><label for="t-name">Teacher name</label><input id="t-name" name="name" type="text" maxlength="40" required></div>' +
      '    <div><label for="t-batch">Batch label</label><input id="t-batch" name="batchLabel" type="text" maxlength="24" placeholder="Class 5A"></div>' +
      '  </div>' +
      '  <div class="field-grid">' +
      '    <div><label for="t-subjects">Subjects (comma separated)</label><input id="t-subjects" name="subjects" type="text" placeholder="Science, Maths"></div>' +
      '    <div><label for="t-pin">4-digit PIN</label><input id="t-pin" name="pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" required></div>' +
      '  </div>' +
      '  <div class="field-grid">' +
      '    <div><label for="t-confirm">Confirm PIN</label><input id="t-confirm" name="confirm" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" required></div>' +
      '  </div>' +
      '  <div class="form-actions"><button type="submit" class="btn btn-primary btn--sm">ADD TEACHER</button></div>' +
      '</form>'
    );
  }

  function studentFormHtml(teachers) {
    var options = teachers.map(function (teacher) {
      return '<option value="' + escape(teacher.id) + '">' + escape(teacher.name) + '</option>';
    }).join('');

    return (
      '<form class="role-form" data-form="new-student" id="new-student-form">' +
      '  <div class="field-grid">' +
      '    <div><label for="s-name">Student name</label><input id="s-name" name="name" type="text" maxlength="40" required></div>' +
      '    <div><label for="s-grade">Grade</label><input id="s-grade" name="grade" type="text" maxlength="2" value="5"></div>' +
      '  </div>' +
      '  <div class="field-grid">' +
      '    <div><label for="s-language">Language</label>' +
      '      <select id="s-language" name="language">' +
      '        <option value="en">English</option>' +
      '        <option value="hi">Hindi</option>' +
      '        <option value="mr">Marathi</option>' +
      '      </select></div>' +
      '    <div><label for="s-teacher">Assign to teacher</label>' +
      '      <select id="s-teacher" name="teacherId"><option value="">— none —</option>' + options + '</select></div>' +
      '  </div>' +
      '  <div class="field-grid">' +
      '    <div><label for="s-pin">4-digit PIN</label><input id="s-pin" name="pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" required></div>' +
      '    <div><label for="s-confirm">Confirm PIN</label><input id="s-confirm" name="confirm" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" required></div>' +
      '  </div>' +
      '  <div class="form-actions"><button type="submit" class="btn btn-primary btn--sm">ADD STUDENT</button></div>' +
      '</form>'
    );
  }

  function accountsHtml(teachers, allTeachers, students) {
    var teacherRows = teachers.length
      ? teachers.map(function (teacher) {
        var meta = teacher.metadata || {};
        return (
          '<div class="role-row role-row--teacher">' +
          '  <span><strong>' + escape(teacher.name) + '</strong>' +
          '    <div class="role-row__sub">' + escape(teacher.id) + ' · ' + escape(meta.batchLabel || 'no batch') + '</div></span>' +
          '  <span class="mono-label">' + escape((meta.subjects || []).join(', ') || '—') + '</span>' +
          '  <span class="role-row__actions">' +
          '    <button type="button" class="btn btn-secondary btn--xs" data-teacher-edit="' + escape(teacher.id) + '">EDIT</button>' +
          '    <button type="button" class="btn btn-secondary btn--xs" data-reset-pin="' + escape(teacher.id) + '">RESET PIN</button>' +
          '    <button type="button" class="btn btn-danger btn--xs" data-disable="' + escape(teacher.id) + '">DISABLE</button>' +
          '  </span>' +
          '</div>'
        );
      }).join('')
      : '<p class="empty-note">No teachers yet.</p>';

    var studentRows = students.length
      ? students.map(function (student) {
        var meta = student.metadata || {};
        var owner = '';
        allTeachers.forEach(function (teacher) {
          var ids = (teacher.metadata && teacher.metadata.assignedStudentIds) || [];
          if (ids.indexOf(student.id) !== -1) owner = teacher.name;
        });
        return (
          '<div class="role-row role-row--student">' +
          '  <span><strong>' + escape(student.name) + '</strong>' +
          '    <div class="role-row__sub">' + escape(student.id) + ' · ' + escape(owner || 'unassigned') + '</div></span>' +
          '  <span class="mono-label">GR ' + escape(meta.grade || '—') + '</span>' +
          '  <span class="role-row__actions">' +
          '    <a class="btn btn-secondary btn--xs" href="#/admin/student/' + escape(student.id) + '">VIEW</a>' +
          '    <button type="button" class="btn btn-secondary btn--xs" data-reset-pin="' + escape(student.id) + '">RESET PIN</button>' +
          '    <button type="button" class="btn btn-danger btn--xs" data-delete="' + escape(student.id) + '">DELETE</button>' +
          '  </span>' +
          '</div>'
        );
      }).join('')
      : '<p class="empty-note">No students yet.</p>';

    return (
      '<div class="screen admin">' +
      '  <section class="panel role-head">' +
      '    <div>' +
      '      <p class="eyebrow">ACCOUNT MANAGEMENT</p>' +
      '      <h1 class="step-title" style="font-size:24px;margin-top:8px">People on this tablet</h1>' +
      '    </div>' +
      '    <div class="role-actions"><a class="btn btn-ghost btn--sm" href="#/admin">← OVERVIEW</a></div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Add teacher</p>' +
      teacherFormHtml() +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Add student</p>' +
      studentFormHtml(allTeachers) +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Teachers</p>' +
      '    <div class="role-table">' +
      '      <div class="role-table__head role-table__head--teacher"><span>Name</span><span>Subjects</span><span></span></div>' +
      teacherRows +
      '    </div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Students</p>' +
      '    <div class="role-table">' +
      '      <div class="role-table__head role-table__head--student"><span>Name</span><span>Grade</span><span></span></div>' +
      studentRows +
      '    </div>' +
      '  </section>' +
      '</div>'
    );
  }

  function validPin(pin) {
    return /^[0-9]{4}$/.test(pin);
  }

  function bindAccounts(root) {
    var teacherForm = root.querySelector('#new-teacher-form');
    if (teacherForm) {
      teacherForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var name = teacherForm.querySelector('[name="name"]').value.trim();
        var batchLabel = teacherForm.querySelector('[name="batchLabel"]').value.trim();
        var subjects = teacherForm.querySelector('[name="subjects"]').value;
        var pin = teacherForm.querySelector('[name="pin"]').value;
        var confirm = teacherForm.querySelector('[name="confirm"]').value;

        if (name.length < 2) return toast('Name required', 'Enter the teacher name.', 'error');
        if (!validPin(pin)) return toast('PIN required', 'The PIN must be 4 digits.', 'error');
        if (pin !== confirm) return toast('PIN mismatch', 'The two PINs do not match.', 'error');

        try {
          await Auth.createAccount('teacher', {
            name: name,
            batchLabel: batchLabel,
            subjects: subjects
          }, pin);
          toast('Teacher added', name + ' can sign in now.', 'ok');
          mountAccounts(root);
        } catch (err) {
          toast('Could not add teacher', String(err.message || err), 'error');
        }
      });
    }

    var studentForm = root.querySelector('#new-student-form');
    if (studentForm) {
      studentForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var name = studentForm.querySelector('[name="name"]').value.trim();
        var grade = studentForm.querySelector('[name="grade"]').value.trim() || '5';
        var language = studentForm.querySelector('[name="language"]').value;
        var teacherId = studentForm.querySelector('[name="teacherId"]').value;
        var pin = studentForm.querySelector('[name="pin"]').value;
        var confirm = studentForm.querySelector('[name="confirm"]').value;

        if (name.length < 2) return toast('Name required', 'Enter the student name.', 'error');
        if (!validPin(pin)) return toast('PIN required', 'The PIN must be 4 digits.', 'error');
        if (pin !== confirm) return toast('PIN mismatch', 'The two PINs do not match.', 'error');

        try {
          var account = await Auth.createAccount('student', {
            name: name,
            grade: grade,
            language: language
          }, pin);

          if (teacherId) {
            var teacher = await DB.load('accounts', teacherId);
            if (teacher) {
              var meta = teacher.metadata || {};
              var ids = Array.isArray(meta.assignedStudentIds) ? meta.assignedStudentIds.slice() : [];
              if (ids.indexOf(account.id) === -1) ids.push(account.id);
              await Auth.updateAccount(teacherId, { metadata: { assignedStudentIds: ids } });
            }
          }

          toast('Student added', name + ' can sign in now.', 'ok');
          mountAccounts(root);
        } catch (err) {
          toast('Could not add student', String(err.message || err), 'error');
        }
      });
    }

    root.addEventListener('click', async function (event) {
      var resetBtn = event.target.closest('[data-reset-pin]');
      if (resetBtn) {
        var resetId = resetBtn.getAttribute('data-reset-pin');
        var newPin = window.prompt('New 4-digit PIN for ' + resetId + ':');
        if (newPin === null) return;
        if (!validPin(newPin)) return toast('Invalid PIN', 'Enter exactly 4 digits.', 'error');
        try {
          await Auth.resetPin(resetId, newPin);
          toast('PIN reset', 'The new PIN is active.', 'ok');
        } catch (err) {
          toast('Could not reset PIN', String(err.message || err), 'error');
        }
        return;
      }

      var disableBtn = event.target.closest('[data-disable]');
      if (disableBtn) {
        var disableId = disableBtn.getAttribute('data-disable');
        try {
          await Auth.disableAccount(disableId);
          toast('Account disabled', disableId + ' can no longer sign in.', 'ok');
          mountAccounts(root);
        } catch (err) {
          toast('Could not disable', String(err.message || err), 'error');
        }
        return;
      }

      var deleteBtn = event.target.closest('[data-delete]');
      if (deleteBtn) {
        var deleteId = deleteBtn.getAttribute('data-delete');
        var ok = true;
        if (UI && typeof UI.confirm === 'function') {
          ok = await UI.confirm({
            title: 'Delete this student?',
            message: 'The account ' + deleteId + ' will be removed from this tablet.',
            confirmLabel: 'Delete account',
            danger: true
          });
        }
        if (!ok) return;
        try {
          await Auth.deleteAccount(deleteId);
          toast('Student deleted', deleteId + ' was removed.', 'ok');
          mountAccounts(root);
        } catch (err) {
          toast('Could not delete', String(err.message || err), 'error');
        }
        return;
      }

      var editBtn = event.target.closest('[data-teacher-edit]');
      if (editBtn) {
        var editId = editBtn.getAttribute('data-teacher-edit');
        var batch = window.prompt('Batch label for ' + editId + ':', '');
        if (batch === null) return;
        try {
          await Auth.updateAccount(editId, { metadata: { batchLabel: batch.trim() } });
          toast('Teacher updated', 'Batch label saved.', 'ok');
          mountAccounts(root);
        } catch (err) {
          toast('Could not update', String(err.message || err), 'error');
        }
      }
    });
  }

  async function loadAccounts(root) {
    var teachers = await Auth.getTeachers();
    var students = await Auth.getStudents();
    var allTeachers = await Auth.getAccounts('teacher');
    root.innerHTML = accountsHtml(teachers, allTeachers, students);
    bindAccounts(root);
  }

  function mountAccounts(root) {
    var gen = ++_gen;
    if (!guardAdmin(root)) return function () {};

    root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ LOADING ACCOUNTS…</p></section></div>';

    loadAccounts(root).catch(function (err) {
      console.error('[Admin] Accounts failed:', err);
      if (gen !== _gen) return;
      root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ ACCOUNTS UNAVAILABLE</p></section></div>';
    });

    return function cleanup() { _gen += 1; };
  }

  /* ------------------------------------------------------------
     Settings
     ------------------------------------------------------------ */
  async function loadSettings(root) {
    var settings = await Auth.getAppSettings();
    var aiDefault = window.STORYLAB_AI_ENDPOINT || '';
    var hours = Number(settings.teacherSessionHours);

    function option(value, label, current) {
      return '<option value="' + value + '"' + (String(value) === String(current) ? ' selected' : '') + '>' + label + '</option>';
    }

    root.innerHTML =
      '<div class="screen admin">' +
      '  <section class="panel role-head">' +
      '    <div>' +
      '      <p class="eyebrow">APP SETTINGS</p>' +
      '      <h1 class="step-title" style="font-size:24px;margin-top:8px">Terminal configuration</h1>' +
      '    </div>' +
      '    <div class="role-actions"><a class="btn btn-ghost btn--sm" href="#/admin">← OVERVIEW</a></div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <form class="role-form" id="settings-form">' +
      '      <div><label for="set-school">School name</label>' +
      '        <input id="set-school" name="schoolName" type="text" maxlength="60" value="' + escape(settings.schoolName) + '"></div>' +
      '      <div class="field-grid">' +
      '        <div><label for="set-language">Default language</label>' +
      '          <select id="set-language" name="defaultLanguage">' +
      option('en', 'English', settings.defaultLanguage) +
      option('hi', 'Hindi', settings.defaultLanguage) +
      option('mr', 'Marathi', settings.defaultLanguage) +
      '          </select></div>' +
      '        <div><label for="set-pin-digits">Student PIN digits</label>' +
      '          <select id="set-pin-digits" name="studentPinDigits">' +
      option(4, '4 digits', settings.studentPinDigits) +
      option(6, '6 digits', settings.studentPinDigits) +
      '          </select></div>' +
      '      </div>' +
      '      <div class="field-grid">' +
      '        <div><label for="set-hours">Auto-logout for teachers</label>' +
      '          <select id="set-hours" name="teacherSessionHours">' +
      option(4, '4 hours', hours) +
      option(8, '8 hours', hours) +
      option(12, '12 hours', hours) +
      option(0, 'Never', hours) +
      '          </select></div>' +
      '        <div><label for="set-ai">AI tutor URL</label>' +
      '          <input id="set-ai" name="aiTutorUrl" type="text" placeholder="https://…" value="' +
      escape(settings.aiTutorUrl || aiDefault) + '"></div>' +
      '      </div>' +
      '      <div class="form-actions"><button type="submit" class="btn btn-primary btn--sm">SAVE SETTINGS</button></div>' +
      '    </form>' +
      '  </section>' +
      '</div>';

    var form = root.querySelector('#settings-form');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var payload = {
        schoolName: form.querySelector('[name="schoolName"]').value.trim(),
        defaultLanguage: form.querySelector('[name="defaultLanguage"]').value,
        studentPinDigits: Number(form.querySelector('[name="studentPinDigits"]').value),
        teacherSessionHours: Number(form.querySelector('[name="teacherSessionHours"]').value),
        aiTutorUrl: form.querySelector('[name="aiTutorUrl"]').value.trim()
      };
      try {
        await Auth.saveAppSettings(payload);
        toast('Settings saved', 'The terminal configuration was updated.', 'ok');
      } catch (err) {
        toast('Could not save', String(err.message || err), 'error');
      }
    });
  }

  function mountSettings(root) {
    var gen = ++_gen;
    if (!guardAdmin(root)) return function () {};

    root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ LOADING SETTINGS…</p></section></div>';

    loadSettings(root).catch(function (err) {
      console.error('[Admin] Settings failed:', err);
      if (gen !== _gen) return;
      root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ SETTINGS UNAVAILABLE</p></section></div>';
    });

    return function cleanup() { _gen += 1; };
  }

  /* ------------------------------------------------------------
     Audit log
     ------------------------------------------------------------ */
  async function loadLog(root) {
    var entries = [];
    try {
      entries = await DB.getAll('audit_log');
    } catch (err) { /* ignore */ }

    var accounts = await Auth.getAccounts();
    var names = {};
    accounts.forEach(function (account) { names[account.id] = account.name; });

    entries.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    entries = entries.slice(0, 100);

    var rows = entries.length
      ? entries.map(function (entry) {
        var actor = entry.actorId === 'system' ? 'SYSTEM' : (names[entry.actorId] || entry.actorId || 'unknown');
        var target = entry.targetId ? (names[entry.targetId] || entry.targetId) : '—';
        return (
          '<div class="audit-row">' +
          '  <span class="audit-row__time">' + escape(formatDateTime(entry.ts)) + '</span>' +
          '  <span class="audit-row__action">' + escape(entry.action || '—') + '</span>' +
          '  <span><strong>' + escape(actor) + '</strong> ' + roleBadge(entry.actorRole) +
          '    <div class="role-row__sub">target: ' + escape(target) + ' · ' + escape(entry.detail || '') + '</div></span>' +
          '</div>'
        );
      }).join('')
      : '<p class="empty-note">No audit entries yet.</p>';

    root.innerHTML =
      '<div class="screen admin">' +
      '  <section class="panel role-head">' +
      '    <div>' +
      '      <p class="eyebrow">AUDIT LOG</p>' +
      '      <h1 class="step-title" style="font-size:24px;margin-top:8px">Last 100 actions</h1>' +
      '    </div>' +
      '    <div class="role-actions"><a class="btn btn-ghost btn--sm" href="#/admin">← OVERVIEW</a></div>' +
      '  </section>' +
      '  <section class="panel"><div class="role-table">' + rows + '</div></section>' +
      '</div>';
  }

  function mountLog(root) {
    var gen = ++_gen;
    if (!guardAdmin(root)) return function () {};

    root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ LOADING AUDIT LOG…</p></section></div>';

    loadLog(root).catch(function (err) {
      console.error('[Admin] Audit log failed:', err);
      if (gen !== _gen) return;
      root.innerHTML = '<div class="screen admin"><section class="panel"><p class="mono-label">◈ AUDIT LOG UNAVAILABLE</p></section></div>';
    });

    return function cleanup() { _gen += 1; };
  }

  window.StoryLabAdmin = {
    mount: mount,
    mountAccounts: mountAccounts,
    mountSettings: mountSettings,
    mountLog: mountLog
  };

  console.log('[Admin] window.StoryLabAdmin ready');
})();
