/**
 * StoryLab Voice — teacher dashboard
 *
 * Exports: window.StoryLabTeacher
 *   mount(root)                    -> cleanup    (#/teacher)
 *   mountStudentDetail(root, id)   -> cleanup    (#/teacher/student/:id)
 */
;(function () {
  'use strict';

  var UI = window.StoryLabUI;
  var DB = window.DB;
  var Auth = window.StoryLabAuth;

  var _gen = 0;

  function escape(value) {
    return UI && typeof UI.escape === 'function' ? UI.escape(value) : String(value == null ? '' : value);
  }

  function formatDate(value) {
    if (!value) return '—';
    return UI && UI.formatDate ? UI.formatDate(value, false) : new Date(value).toLocaleDateString();
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
      console.error('[Teacher] Export failed:', err);
      if (UI && UI.toast) UI.toast({ title: 'Export failed', message: String(err.message || err), kind: 'error' });
    }
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  async function progressFor(studentId) {
    var progress = null;
    try {
      progress = await DB.load('progress', studentId);
    } catch (err) { /* store may be empty */ }
    if (!progress) {
      try {
        progress = await DB.load('progress', 'student');
      } catch (err) { /* ignore */ }
    }
    return progress || {};
  }

  function countCompleted(bucket) {
    if (!bucket || typeof bucket !== 'object') return 0;
    return Object.keys(bucket).filter(function (key) {
      var item = bucket[key];
      return item && item.completed;
    }).length;
  }

  function emptyRow(message) {
    return '<p class="empty-note">' + escape(message) + '</p>';
  }

  /* ------------------------------------------------------------
     Data
     ------------------------------------------------------------ */
  async function loadDash(session) {
    var account = null;
    try {
      account = await DB.load('accounts', session.accountId);
    } catch (err) { /* ignore */ }

    var isAdmin = session.role === 'admin';
    var meta = (account && account.metadata) || {};
    var ids = Array.isArray(meta.assignedStudentIds) ? meta.assignedStudentIds.slice() : [];

    var all = await Auth.getStudents();
    var students = isAdmin ? all : all.filter(function (student) {
      return ids.indexOf(student.id) !== -1;
    });

    var sessions = [];
    try {
      sessions = await DB.getAll('sessions');
    } catch (err) { /* ignore */ }

    var todayStart = startOfToday();
    var studentIds = students.map(function (student) { return student.id; });
    var sessionsToday = sessions.filter(function (item) {
      if (!item || !item.startedAt || item.startedAt < todayStart) return false;
      if (!item.studentId || !studentIds.length) return true;
      return studentIds.indexOf(item.studentId) !== -1;
    }).length;

    var rows = [];
    var storyTotal = 0;
    var labTotal = 0;
    for (var i = 0; i < students.length; i += 1) {
      var progress = await progressFor(students[i].id);
      var stories = countCompleted(progress.stories);
      var labs = countCompleted(progress.labs);
      storyTotal += stories;
      labTotal += labs;
      rows.push({ student: students[i], stories: stories, labs: labs });
    }

    var assignments = [];
    try {
      assignments = await DB.getAll('assignments');
    } catch (err) { /* ignore */ }
    assignments = assignments.filter(function (item) {
      return item && (isAdmin || item.teacherId === session.accountId);
    }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    return {
      account: account,
      isAdmin: isAdmin,
      students: students,
      rows: rows,
      sessionsToday: sessionsToday,
      storyTotal: storyTotal,
      labTotal: labTotal,
      assignments: assignments
    };
  }

  /* ------------------------------------------------------------
     Dashboard markup
     ------------------------------------------------------------ */
  function assignmentFormHtml(rows) {
    var options = rows.map(function (row) {
      return '<option value="' + escape(row.student.id) + '">' + escape(row.student.name) + '</option>';
    }).join('');

    return (
      '<form class="role-form is-hidden" data-form="new-assignment" id="assignment-form">' +
      '  <div class="field-grid">' +
      '    <div>' +
      '      <label for="assign-module-type">Module type</label>' +
      '      <select id="assign-module-type" name="moduleType">' +
      '        <option value="story">Story</option>' +
      '        <option value="lab">Lab</option>' +
      '      </select>' +
      '    </div>' +
      '    <div>' +
      '      <label for="assign-module-id">Module ID</label>' +
      '      <input id="assign-module-id" name="moduleId" type="text" placeholder="rainforest" required>' +
      '    </div>' +
      '  </div>' +
      '  <div class="field-grid">' +
      '    <div>' +
      '      <label for="assign-target-type">Target</label>' +
      '      <select id="assign-target-type" name="targetType">' +
      '        <option value="all">Everyone</option>' +
      '        <option value="grade">A grade</option>' +
      '        <option value="student">One student</option>' +
      '      </select>' +
      '    </div>' +
      '    <div>' +
      '      <label for="assign-target-id">Target ID / grade</label>' +
      '      <input id="assign-target-id" name="targetId" type="text" placeholder="5 or SLV-…" list="assign-students">' +
      '      <datalist id="assign-students">' + options + '</datalist>' +
      '    </div>' +
      '  </div>' +
      '  <div>' +
      '    <label for="assign-due">Due date (optional)</label>' +
      '    <input id="assign-due" name="dueAt" type="date">' +
      '  </div>' +
      '  <div class="form-actions">' +
      '    <button type="submit" class="btn btn-primary btn--sm">SAVE ASSIGNMENT</button>' +
      '  </div>' +
      '</form>'
    );
  }

  function render(root, session, data) {
    var name = (data.account && data.account.name) || session.name || 'Teacher';
    var meta = (data.account && data.account.metadata) || {};
    var batch = meta.batchLabel || (data.isAdmin ? 'All batches' : 'No batch assigned');

    var roster = data.rows.length
      ? data.rows.map(function (row) {
        return (
          '<div class="student-row">' +
          '  <span><strong>' + escape(row.student.name) + '</strong>' +
          '    <span class="role-row__sub">' + escape(row.student.id) + '</span></span>' +
          '  <span class="mono-label">GRADE ' + escape((row.student.metadata || {}).grade || '—') + '</span>' +
          '  <span class="mono-label">' + row.stories + ' STORIES</span>' +
          '  <span class="mono-label">' + row.labs + ' LABS</span>' +
          '  <a class="btn btn-secondary btn--xs" href="#/teacher/student/' + escape(row.student.id) + '">VIEW</a>' +
          '</div>'
        );
      }).join('')
      : emptyRow(data.isAdmin ? 'No students on this tablet yet.' : 'No students are assigned to you yet. Ask the admin.');

    var assignments = data.assignments.length
      ? data.assignments.map(function (item) {
        var target = item.targetType === 'all'
          ? 'Everyone'
          : (item.targetType === 'grade' ? 'Grade ' + escape(item.targetId) : escape(item.targetId || '—'));
        return (
          '<div class="assignment-row">' +
          '  <span><strong>' + escape(item.moduleType || 'module') + '</strong> · ' + escape(item.moduleId || '—') +
          '    <span class="role-row__sub">' + target + (item.dueAt ? ' · due ' + escape(formatDate(item.dueAt)) : '') + '</span></span>' +
          '  <span class="role-badge role-badge--teacher">' + escape(item.moduleType || 'MODULE') + '</span>' +
          '</div>'
        );
      }).join('')
      : emptyRow('No assignments yet.');

    root.innerHTML =
      '<div class="screen teacher">' +
      '  <section class="panel teacher-full role-head">' +
      '    <div>' +
      '      <p class="eyebrow">TEACHER DASHBOARD</p>' +
      '      <h1 class="step-title" style="font-size:26px;margin-top:8px">' + escape(name) + '</h1>' +
      '      <p class="mono-label" style="margin-top:6px">' + escape(batch) + ' · ' + data.students.length + ' STUDENTS</p>' +
      '    </div>' +
      '    <div class="role-actions">' +
      '      <span class="role-badge role-badge--teacher">TEACHER</span>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="signout">SIGN OUT</button>' +
      '    </div>' +
      '  </section>' +

      '  <section class="panel teacher-full">' +
      '    <div class="stat-strip">' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + data.students.length + '</div><div class="stat-cell__label">Students</div></div>' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + data.sessionsToday + '</div><div class="stat-cell__label">Sessions today</div></div>' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + data.storyTotal + '</div><div class="stat-cell__label">Stories completed</div></div>' +
      '      <div class="stat-cell"><div class="stat-cell__value">' + data.labTotal + '</div><div class="stat-cell__label">Labs completed</div></div>' +
      '    </div>' +
      '  </section>' +

      '  <section class="panel teacher-full">' +
      '    <p class="role-section-title">Student roster</p>' +
      '    <div class="role-table">' + roster + '</div>' +
      '  </section>' +

      '  <section class="panel teacher-full">' +
      '    <div class="role-head">' +
      '      <p class="role-section-title" style="margin-bottom:0">Assignments</p>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="toggle-assign">+ NEW ASSIGNMENT</button>' +
      '    </div>' +
      '    <div class="role-table" style="margin-top:10px">' + assignments + '</div>' +
      assignmentFormHtml(data.rows) +
      '  </section>' +
      '</div>';

    bind(root, session);
  }

  function bind(root, session) {
    var signout = root.querySelector('[data-action="signout"]');
    if (signout) {
      signout.addEventListener('click', async function () {
        await Auth.logout();
        window.StoryLabRouter.navigate('login');
      });
    }

    var toggle = root.querySelector('[data-action="toggle-assign"]');
    var form = root.querySelector('#assignment-form');
    if (toggle && form) {
      toggle.addEventListener('click', function () {
        form.classList.toggle('is-hidden');
      });
    }

    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        var moduleType = form.querySelector('[name="moduleType"]').value;
        var moduleId = form.querySelector('[name="moduleId"]').value.trim();
        var targetType = form.querySelector('[name="targetType"]').value;
        var targetId = form.querySelector('[name="targetId"]').value.trim();
        var due = form.querySelector('[name="dueAt"]').value;

        if (!moduleId) {
          if (UI && UI.toast) UI.toast({ title: 'Module ID required', kind: 'error' });
          return;
        }

        try {
          await DB.save('assignments', undefined, {
            teacherId: session.accountId,
            targetType: targetType,
            targetId: targetType === 'all' ? null : (targetId || null),
            moduleType: moduleType,
            moduleId: moduleId,
            dueAt: due ? new Date(due).getTime() : null,
            createdAt: Date.now(),
            completedBy: []
          });
          await Auth.writeAuditLog('assign_module', targetType === 'all' ? null : targetId, moduleType + ': ' + moduleId);
          if (UI && UI.toast) UI.toast({ title: 'Assigned', message: moduleId + ' assigned.', kind: 'ok' });
          mount(root);
        } catch (err) {
          console.error('[Teacher] Could not save assignment:', err);
          if (UI && UI.toast) UI.toast({ title: 'Could not assign', message: String(err.message || err), kind: 'error' });
        }
      });
    }
  }

  async function loadAndRender(root, session) {
    var data = await loadDash(session);
    render(root, session, data);
  }

  function mount(root) {
    var gen = ++_gen;
    var session = Auth.getSession();
    if (!session) {
      window.StoryLabRouter.navigate('login');
      return function () {};
    }

    root.innerHTML =
      '<div class="screen teacher">' +
      '  <section class="panel teacher-full"><p class="mono-label">◈ LOADING DASHBOARD…</p></section>' +
      '</div>';

    loadAndRender(root, session).catch(function (err) {
      console.error('[Teacher] Dashboard failed:', err);
      if (gen !== _gen) return;
      root.innerHTML =
        '<div class="screen teacher"><section class="panel teacher-full">' +
        '<p class="eyebrow">DASHBOARD / PROBLEM</p>' +
        '<h2 class="step-title" style="font-size:24px;margin-top:8px">The dashboard could not load.</h2>' +
        '<p class="lede" style="margin-top:10px">' + escape(err.message || err) + '</p>' +
        '<a class="btn btn-secondary" style="margin-top:16px" href="#/login">← BACK TO SIGN IN</a>' +
        '</section></div>';
    });

    return function cleanup() { _gen += 1; };
  }

  /* ------------------------------------------------------------
     Student detail
     ------------------------------------------------------------ */
  function renderMissing(root, studentId) {
    root.innerHTML =
      '<div class="screen admin">' +
      '  <section class="panel">' +
      '    <p class="eyebrow">STUDENT / NOT FOUND</p>' +
      '    <h1 class="step-title" style="font-size:24px;margin-top:8px">No student with ID ' + escape(studentId) + '.</h1>' +
      '    <a class="btn btn-secondary" style="margin-top:16px" href="#/teacher">← BACK TO DASHBOARD</a>' +
      '  </section>' +
      '</div>';
  }

  function detailHtml(session, student, data) {
    var meta = student.metadata || {};
    var journey = data.journey || {};
    var orientation = journey.orientation || {};
    var stats = journey.stats || {};
    var badges = Array.isArray(journey.badges) ? journey.badges : [];

    var notes = data.notes.length
      ? data.notes.map(function (note) {
        return (
          '<div class="note-row">' +
          '  <div class="note-row__meta">' + escape(formatDateTime(note.createdAt)) + '</div>' +
          '  <div>' + escape(note.text) + '</div>' +
          '</div>'
        );
      }).join('')
      : emptyRow('No teacher notes yet.');

    var activity = data.events.length
      ? data.events.map(function (event) {
        return (
          '<div class="activity-row">' +
          '  <span class="activity-row__time">' + escape(formatDateTime(event.ts)) + '</span>' +
          '  <span>' + escape(event.label || event.type || 'Activity') + '</span>' +
          '</div>'
        );
      }).join('')
      : emptyRow('No activity recorded yet.');

    var assignments = data.assignments.length
      ? data.assignments.map(function (item) {
        return (
          '<div class="assignment-row">' +
          '  <span><strong>' + escape(item.moduleType || 'module') + '</strong> · ' + escape(item.moduleId || '—') +
          '    <span class="role-row__sub">' + escape(formatDate(item.createdAt)) + '</span></span>' +
          '  <span class="role-badge role-badge--teacher">' + escape(item.moduleType || 'MODULE') + '</span>' +
          '</div>'
        );
      }).join('')
      : emptyRow('Nothing assigned to this student.');

    var totalTime = (stats.totalTimeMs || 0) + (data.durationMs || 0);
    var timeText = UI && UI.formatMinutes ? UI.formatMinutes(totalTime) : Math.round(totalTime / 60000) + ' min';

    return (
      '<div class="screen admin">' +
      '  <section class="panel role-head">' +
      '    <div>' +
      '      <p class="eyebrow">STUDENT DETAIL</p>' +
      '      <h1 class="step-title" style="font-size:26px;margin-top:8px">' + escape(student.name) + '</h1>' +
      '      <p class="mono-label" style="margin-top:6px">' + escape(student.id) + ' · GRADE ' + escape(meta.grade || '—') + '</p>' +
      '    </div>' +
      '    <div class="role-actions">' +
      '      <span class="account-card__avatar">' + escape(String(student.name || '?').trim().charAt(0).toUpperCase()) + '</span>' +
      '      <span class="role-badge role-badge--student">STUDENT</span>' +
      '    </div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Progress</p>' +
      '    <div class="detail-grid">' +
      '      <div class="detail-cell"><div class="detail-cell__label">Orientation</div><div class="detail-cell__value">' +
      (orientation.completed ? 'Complete' : 'Not complete') + '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Score</div><div class="detail-cell__value">' +
      escape((orientation.score || 0) + ' / ' + (orientation.total || 0)) + '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Sessions</div><div class="detail-cell__value">' +
      data.sessions.length + '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Total time</div><div class="detail-cell__value">' +
      escape(timeText) + '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Stories</div><div class="detail-cell__value">' +
      data.stories + '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Labs</div><div class="detail-cell__value">' +
      data.labs + '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Badges</div><div class="detail-cell__value">' +
      escape(badges.length ? badges.map(function (badge) { return badge.label || badge.id; }).join(', ') : 'None') +
      '</div></div>' +
      '      <div class="detail-cell"><div class="detail-cell__label">Language</div><div class="detail-cell__value">' +
      escape(meta.language || 'en') + '</div></div>' +
      '    </div>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <div class="role-head">' +
      '      <p class="role-section-title" style="margin-bottom:0">Teacher notes</p>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="toggle-note">+ ADD NOTE</button>' +
      '    </div>' +
      '    <div class="role-table" style="margin-top:10px">' + notes + '</div>' +
      '    <form class="note-editor is-hidden" data-form="add-note" id="note-form">' +
      '      <textarea name="text" placeholder="What did you observe?" maxlength="600"></textarea>' +
      '      <div class="form-actions">' +
      '        <button type="submit" class="btn btn-primary btn--sm">SAVE NOTE</button>' +
      '      </div>' +
      '    </form>' +
      '  </section>' +

      '  <section class="panel">' +
      '    <div class="role-head">' +
      '      <p class="role-section-title" style="margin-bottom:0">Quick actions</p>' +
      '    </div>' +
      '    <div class="role-table" style="margin-top:10px">' + assignments + '</div>' +
      '    <div class="form-actions" style="margin-top:12px">' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="toggle-assign">ASSIGN MODULE</button>' +
      '      <button type="button" class="btn btn-secondary btn--sm" data-action="export">EXPORT RECORD</button>' +
      '      <a class="btn btn-ghost btn--sm" href="#/teacher">← BACK</a>' +
      '    </div>' +
      assignmentFormHtml([{ student: student }]) +
      '  </section>' +

      '  <section class="panel">' +
      '    <p class="role-section-title">Activity log</p>' +
      '    <div class="role-table">' + activity + '</div>' +
      '  </section>' +
      '</div>'
    );
  }

  function bindDetail(root, session, student) {
    var toggleNote = root.querySelector('[data-action="toggle-note"]');
    var noteForm = root.querySelector('#note-form');
    if (toggleNote && noteForm) {
      toggleNote.addEventListener('click', function () {
        noteForm.classList.toggle('is-hidden');
      });
    }

    if (noteForm) {
      noteForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var textarea = noteForm.querySelector('textarea');
        var text = textarea ? textarea.value.trim() : '';
        if (!text) return;
        try {
          await DB.save('teacher_notes', undefined, {
            teacherId: session.accountId,
            studentId: student.id,
            text: text,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          await Auth.writeAuditLog('add_note', student.id, 'Note added for ' + student.name);
          if (UI && UI.toast) UI.toast({ title: 'Note saved', kind: 'ok' });
          mountStudentDetail(root, student.id);
        } catch (err) {
          console.error('[Teacher] Could not save note:', err);
          if (UI && UI.toast) UI.toast({ title: 'Could not save note', message: String(err.message || err), kind: 'error' });
        }
      });
    }

    var toggleAssign = root.querySelector('[data-action="toggle-assign"]');
    var form = root.querySelector('#assignment-form');
    if (toggleAssign && form) {
      toggleAssign.addEventListener('click', function () {
        form.classList.toggle('is-hidden');
      });
    }

    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        var moduleType = form.querySelector('[name="moduleType"]').value;
        var moduleId = form.querySelector('[name="moduleId"]').value.trim();
        var targetType = form.querySelector('[name="targetType"]').value;
        var targetId = form.querySelector('[name="targetId"]').value.trim();
        var due = form.querySelector('[name="dueAt"]').value;
        if (!moduleId) return;
        try {
          await DB.save('assignments', undefined, {
            teacherId: session.accountId,
            targetType: targetType,
            targetId: targetType === 'all' ? null : (targetId || null),
            moduleType: moduleType,
            moduleId: moduleId,
            dueAt: due ? new Date(due).getTime() : null,
            createdAt: Date.now(),
            completedBy: []
          });
          await Auth.writeAuditLog('assign_module', targetType === 'all' ? null : targetId, moduleType + ': ' + moduleId);
          if (UI && UI.toast) UI.toast({ title: 'Assigned', message: moduleId + ' assigned.', kind: 'ok' });
          mountStudentDetail(root, student.id);
        } catch (err) {
          console.error('[Teacher] Could not save assignment:', err);
          if (UI && UI.toast) UI.toast({ title: 'Could not assign', message: String(err.message || err), kind: 'error' });
        }
      });
    }

    var exportBtn = root.querySelector('[data-action="export"]');
    if (exportBtn) {
      exportBtn.addEventListener('click', async function () {
        try {
          var record = await window.StoryLabState.exportRecord();
          download('storylab-' + student.id + '-record.json', record);
        } catch (err) {
          console.error('[Teacher] Export failed:', err);
          if (UI && UI.toast) UI.toast({ title: 'Export failed', message: String(err.message || err), kind: 'error' });
        }
      });
    }
  }

  async function loadDetail(root, studentId, session) {
    var student = null;
    try {
      student = await DB.load('accounts', studentId);
    } catch (err) { /* ignore */ }

    if (!student) {
      renderMissing(root, studentId);
      return;
    }

    var journey = null;
    try {
      journey = await DB.load('journey', studentId);
    } catch (err) { /* ignore */ }
    if (!journey) {
      try {
        journey = await DB.load('journey', 'student');
      } catch (err) { /* ignore */ }
    }

    var progress = await progressFor(studentId);

    var sessions = [];
    try {
      sessions = await DB.getAll('sessions');
    } catch (err) { /* ignore */ }
    var anyStudentIds = sessions.some(function (item) { return item && item.studentId; });
    if (anyStudentIds) {
      sessions = sessions.filter(function (item) { return item && item.studentId === studentId; });
    }
    sessions.sort(function (a, b) { return (b.startedAt || 0) - (a.startedAt || 0); });
    var durationMs = sessions.reduce(function (sum, item) { return sum + (item.durationMs || 0); }, 0);

    var events = [];
    try {
      events = await DB.getAll('events');
    } catch (err) { /* ignore */ }
    var anyEventStudentIds = events.some(function (item) { return item && item.studentId; });
    if (anyEventStudentIds) {
      events = events.filter(function (item) { return item && item.studentId === studentId; });
    }
    events.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    events = events.slice(0, 14);

    var notes = [];
    try {
      notes = await DB.getAll('teacher_notes');
    } catch (err) { /* ignore */ }
    notes = notes.filter(function (item) { return item && item.studentId === studentId; })
      .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    var assignments = [];
    try {
      assignments = await DB.getAll('assignments');
    } catch (err) { /* ignore */ }
    assignments = assignments.filter(function (item) {
      return item && (item.targetId === studentId || item.targetType === 'all');
    }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    root.innerHTML = detailHtml(session, student, {
      journey: journey,
      sessions: sessions,
      durationMs: durationMs,
      events: events,
      notes: notes,
      assignments: assignments,
      stories: countCompleted(progress.stories),
      labs: countCompleted(progress.labs)
    });

    bindDetail(root, session, student);
  }

  function mountStudentDetail(root, studentId) {
    var gen = ++_gen;
    var session = Auth.getSession();
    if (!session) {
      window.StoryLabRouter.navigate('login');
      return function () {};
    }
    if (session.role === 'student') {
      window.StoryLabRouter.navigate('home');
      return function () {};
    }
    if (!studentId) {
      window.StoryLabRouter.navigate('teacher');
      return function () {};
    }

    root.innerHTML =
      '<div class="screen admin"><section class="panel"><p class="mono-label">◈ LOADING STUDENT…</p></section></div>';

    loadDetail(root, studentId, session).catch(function (err) {
      console.error('[Teacher] Student detail failed:', err);
      if (gen !== _gen) return;
      root.innerHTML =
        '<div class="screen admin"><section class="panel">' +
        '<p class="eyebrow">STUDENT / PROBLEM</p>' +
        '<h2 class="step-title" style="font-size:24px;margin-top:8px">This record could not load.</h2>' +
        '<p class="lede" style="margin-top:10px">' + escape(err.message || err) + '</p>' +
        '<a class="btn btn-secondary" style="margin-top:16px" href="#/teacher">← BACK TO DASHBOARD</a>' +
        '</section></div>';
    });

    return function cleanup() { _gen += 1; };
  }

  window.StoryLabTeacher = {
    mount: mount,
    mountStudentDetail: mountStudentDetail
  };

  console.log('[Teacher] window.StoryLabTeacher ready');
})();
