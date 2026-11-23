/**
 * StoryLab Voice — sign-in gate
 *
 * Exports: window.StoryLabLogin = { mount }
 *
 * States
 *   setup     first boot — create the admin PIN
 *   roles     pick STUDENT / TEACHER / ADMIN
 *   students  pick a student account
 *   teachers  pick a teacher account
 *   pin       PIN entry for the chosen account
 *   admin-pin admin PIN entry
 */
;(function () {
  'use strict';

  var UI = window.StoryLabUI;
  var Auth = window.StoryLabAuth;

  var LOCKOUT_MS = 10000;
  var MAX_FAILURES = 3;

  var state = {
    view: 'boot',
    role: 'student',
    accountId: null,
    name: '',
    subtitle: '',
    digits: 4,
    pin: '',
    error: '',
    failures: 0,
    lockedUntil: 0,
    busy: false,
    list: [],
    mode: 'first-boot',
    timer: 0
  };

  var _root = null;
  var _gate = null;

  function escape(value) {
    return UI && typeof UI.escape === 'function' ? UI.escape(value) : String(value == null ? '' : value);
  }

  function roleLabel(role) {
    if (role === 'teacher') return 'TEACHER';
    if (role === 'admin') return 'ADMIN';
    return 'STUDENT';
  }

  function roleHome(role) {
    if (role === 'teacher') return 'teacher';
    if (role === 'admin') return 'admin';
    return 'home';
  }

  function resetState() {
    if (state.timer) window.clearInterval(state.timer);
    state.view = 'boot';
    state.role = 'student';
    state.accountId = null;
    state.name = '';
    state.subtitle = '';
    state.digits = 4;
    state.pin = '';
    state.error = '';
    state.failures = 0;
    state.lockedUntil = 0;
    state.busy = false;
    state.list = [];
    state.mode = 'first-boot';
    state.timer = 0;
  }

  function isLocked() {
    return state.lockedUntil > Date.now();
  }

  /* ------------------------------------------------------------
     Markup
     ------------------------------------------------------------ */
  function brand(title, sub) {
    return (
      '<div class="login-gate__brand">' +
      '  <span class="mono-label">STORYLAB VOICE</span>' +
      '  <h1 class="step-title" style="font-size:26px;margin-top:4px">' + title + '</h1>' +
      (sub ? '  <p class="login-gate__who">' + sub + '</p>' : '') +
      '</div>'
    );
  }

  function setupHtml() {
    var hint = state.mode === 'admin-setup'
      ? 'This tablet has no administrator yet. Create the admin PIN to manage teachers and students.'
      : 'This tablet has no accounts yet. Create the administrator PIN first — it unlocks teacher and student management.';
    return (
      brand('FIRST-TIME SETUP', 'CREATE THE ADMIN PIN') +
      '<div class="login-setup">' +
      '  <p class="login-setup__hint">' + hint + '</p>' +
      '  <form class="role-form" data-form="setup" novalidate>' +
      '    <div>' +
      '      <label for="setup-name">Admin name</label>' +
      '      <input id="setup-name" name="name" type="text" maxlength="40" autocomplete="name" placeholder="School administrator" required>' +
      '    </div>' +
      '    <div class="field-grid">' +
      '      <div>' +
      '        <label for="setup-pin">6-digit PIN</label>' +
      '        <input id="setup-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" placeholder="••••••" required>' +
      '      </div>' +
      '      <div>' +
      '        <label for="setup-confirm">Confirm PIN</label>' +
      '        <input id="setup-confirm" name="confirm" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" placeholder="••••••" required>' +
      '      </div>' +
      '    </div>' +
      '    <p class="pin-error" id="setup-error"></p>' +
      '    <div class="form-actions" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">' +
      '      <button type="submit" class="btn btn-primary">CREATE ADMIN →</button>' +
      '      <button type="button" class="btn btn-secondary" data-action="reseed-demo" style="border:1px dashed var(--color-accent);color:var(--color-accent);">⚡ LOAD DEMO DATA</button>' +
      '      <a href="#/home" class="btn btn-ghost">← CONTINUE AS GUEST</a>' +
      '    </div>' +
      '  </form>' +
      '</div>'
    );
  }

  function rolesHtml() {
    return (
      brand('SIGN IN', 'CHOOSE WHO IS USING THIS TABLET') +
      '<div class="role-picker" role="group" aria-label="Choose a role">' +
      '  <button type="button" class="role-picker__btn role-picker__btn--student" data-role-pick="student">' +
      '    <span class="role-badge role-badge--student">STUDENT</span>LEARN' +
      '  </button>' +
      '  <button type="button" class="role-picker__btn role-picker__btn--teacher" data-role-pick="teacher">' +
      '    <span class="role-badge role-badge--teacher">TEACHER</span>TEACH' +
      '  </button>' +
      '  <button type="button" class="role-picker__btn role-picker__btn--admin" data-role-pick="admin">' +
      '    <span class="role-badge role-badge--admin">ADMIN</span>MANAGE' +
      '  </button>' +
      '</div>' +
      '<div class="demo-credentials-card" style="margin-top:24px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid var(--color-border);border-radius:4px;text-align:left;">' +
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">' +
      '    <span class="mono-label" style="color:var(--color-accent);">◈ DEMO CREDENTIALS (INTERCONNECTED)</span>' +
      '    <button type="button" class="btn btn-ghost btn--sm" data-action="reseed-demo" style="font-size:11px;padding:3px 8px;border:1px dashed var(--color-border);">⚡ RE-SEED DATA</button>' +
      '  </div>' +
      '  <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;font-size:12px;">' +
      '    <div>' +
      '      <strong style="color:var(--color-role-admin);">ADMIN (PIN: 112233)</strong><br>' +
      '      <span style="color:var(--color-text-muted);">Principal Sharma · Full School Overview & Audit</span>' +
      '    </div>' +
      '    <div>' +
      '      <strong style="color:var(--color-role-teacher);">TEACHERS (2233 / 4455)</strong><br>' +
      '      <span style="color:var(--color-text-muted);">Anjali Patil (2233) · Vikram Deshmukh (4455)</span>' +
      '    </div>' +
      '    <div>' +
      '      <strong style="color:var(--color-role-student);">STUDENTS (PIN: 1234)</strong><br>' +
      '      <span style="color:var(--color-text-muted);">Aarav (Grade 6) · Priya (Grade 5)</span>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div style="margin-top:20px;text-align:center;">' +
      '  <a href="#/home" class="btn btn-ghost">← CONTINUE AS GUEST</a>' +
      '</div>'
    );
  }

  function listHtml() {
    var isStudent = state.view === 'students';
    var rows = state.list.map(function (account) {
      var meta = account.metadata || {};
      var initial = String(account.name || '?').trim().charAt(0).toUpperCase();
      var detail = isStudent
        ? 'GRADE ' + escape(meta.grade || '—') + ' · ' + escape(account.id)
        : escape(meta.batchLabel || 'NO BATCH') + ' · ' + escape(account.id);
      return (
        '<button type="button" class="account-card" data-account="' + escape(account.id) + '" ' +
        'data-name="' + escape(account.name) + '">' +
        '  <span class="account-card__avatar">' + initial + '</span>' +
        '  <span class="account-card__info">' +
        '    <span class="account-card__name">' + escape(account.name) + '</span>' +
        '    <span class="account-card__meta">' + detail + '</span>' +
        '  </span>' +
        '</button>'
      );
    }).join('');

    var empty = isStudent
      ? 'No students yet. Ask your teacher.'
      : 'No teachers yet. See admin.';

    var emptyActions = isStudent
      ? '<div style="display:flex;gap:10px;margin:12px 0 16px;flex-wrap:wrap;">' +
        '  <a href="#/onboarding" class="btn btn-primary">ENROL AS STUDENT →</a>' +
        '  <a href="#/home" class="btn btn-ghost">CONTINUE AS GUEST</a>' +
        '</div>'
      : '';

    return (
      brand(isStudent ? 'STUDENT' : 'TEACHER', isStudent ? 'PICK YOUR NAME' : 'PICK YOUR ACCOUNT') +
      (state.list.length
        ? '<div class="account-list">' + rows + '</div>'
        : '<p class="login-setup__hint">' + empty + '</p>' + emptyActions) +
      '<button type="button" class="btn btn-ghost" data-action="back">← BACK</button>'
    );
  }

  function pinHtml() {
    var dots = '';
    for (var i = 0; i < state.digits; i += 1) {
      dots += '<span class="pin-dot' + (i < state.pin.length ? ' is-filled' : '') + '"></span>';
    }

    var keys = '';
    for (var n = 1; n <= 9; n += 1) {
      keys += '<button type="button" class="pin-btn" data-key="' + n + '">' + n + '</button>';
    }
    keys += '<button type="button" class="pin-btn pin-btn--zero" data-key="0">0</button>';
    keys += '<button type="button" class="pin-btn pin-btn--del" data-key="del" aria-label="Delete">⌫</button>';

    var who = roleLabel(state.role) + (state.name ? ' · ' + state.name : '');
    var lockText = isLocked()
      ? 'Too many attempts. Try again in ' + Math.ceil((state.lockedUntil - Date.now()) / 1000) + 's.'
      : '';

    return (
      brand('ENTER PIN', escape(who)) +
      '<div class="pin-pad">' +
      '  <div class="pin-dots" id="pin-dots">' + dots + '</div>' +
      '  <p class="pin-error" id="pin-error">' + escape(state.error) + '</p>' +
      '  <p class="pin-lockout" id="pin-lockout">' + escape(lockText) + '</p>' +
      '  <div class="pin-grid" id="pin-grid">' + keys + '</div>' +
      '</div>' +
      '<button type="button" class="btn btn-ghost" data-action="back">← BACK</button>'
    );
  }

  function renderGate() {
    if (!_gate) return;
    if (state.view === 'boot') {
      _gate.innerHTML = '<p class="mono-label">◈ CHECKING TERMINAL…</p>';
      return;
    }
    if (state.view === 'setup') {
      _gate.innerHTML = setupHtml();
      var name = document.getElementById('setup-name');
      if (name) name.focus();
      return;
    }
    if (state.view === 'roles') {
      _gate.innerHTML = rolesHtml();
      return;
    }
    if (state.view === 'students' || state.view === 'teachers') {
      _gate.innerHTML = listHtml();
      return;
    }
    _gate.innerHTML = pinHtml();
    syncLock();
  }

  function updateDots() {
    var dots = document.getElementById('pin-dots');
    if (!dots) return;
    Array.prototype.forEach.call(dots.children, function (dot, index) {
      dot.classList.toggle('is-filled', index < state.pin.length);
    });
  }

  function syncLock() {
    var grid = document.getElementById('pin-grid');
    if (!grid) return;
    var locked = isLocked();
    Array.prototype.forEach.call(grid.querySelectorAll('.pin-btn'), function (btn) {
      btn.disabled = locked || state.busy;
    });
    var label = document.getElementById('pin-lockout');
    if (label) {
      label.textContent = locked
        ? 'Too many attempts. Try again in ' + Math.ceil((state.lockedUntil - Date.now()) / 1000) + 's.'
        : '';
    }
  }

  function startLockTicker() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = 0;
    }
    if (!isLocked()) return;
    state.timer = window.setInterval(function () {
      if (!isLocked()) {
        window.clearInterval(state.timer);
        state.timer = 0;
        state.pin = '';
        state.error = '';
        state.failures = 0;
        if (state.view.indexOf('pin') !== -1) {
          state.view = state.role === 'admin' ? 'admin-pin' : 'pin';
          renderGate();
        }
        return;
      }
      syncLock();
    }, 500);
  }

  function shakeDots() {
    var dots = document.getElementById('pin-dots');
    if (!dots) return;
    dots.classList.add('is-error');
    window.setTimeout(function () {
      dots.classList.remove('is-error');
    }, 460);
  }

  /* ------------------------------------------------------------
     Views
     ------------------------------------------------------------ */
  function showRoles() {
    state.view = 'roles';
    state.error = '';
    state.busy = false;
    state.pin = '';
    renderGate();
  }

  async function pickRole(role) {
    state.role = role;
    state.error = '';
    state.accountId = null;
    state.name = '';
    if (role === 'admin') {
      var admins = await Auth.getAccounts('admin');
      state.digits = 6;
      state.pin = '';
      state.error = '';
      if (!admins.length) {
        state.mode = 'admin-setup';
        state.view = 'setup';
        renderGate();
        return;
      }
      state.view = 'admin-pin';
      state.name = 'Administrator';
      renderGate();
      return;
    }

    state.view = 'boot';
    renderGate();
    var list = role === 'student' ? await Auth.getStudents() : await Auth.getTeachers();
    state.list = list;
    state.view = role === 'student' ? 'students' : 'teachers';
    renderGate();
  }

  function pickAccount(accountId, name) {
    state.accountId = accountId;
    state.name = name || '';
    state.digits = 4;
    state.pin = '';
    state.error = '';
    state.failures = 0;
    state.view = 'pin';
    renderGate();
  }

  /* ------------------------------------------------------------
     PIN entry
     ------------------------------------------------------------ */
  function pressKey(key) {
    if (state.busy || isLocked()) return;
    if (key === 'del') {
      state.pin = state.pin.slice(0, -1);
      updateDots();
      return;
    }
    if (!/^[0-9]$/.test(key)) return;
    if (state.pin.length >= state.digits) return;
    state.pin += key;
    updateDots();
    if (state.pin.length === state.digits) submitPin();
  }

  async function submitPin() {
    if (state.busy) return;
    state.busy = true;
    state.error = '';
    syncLock();

    var pin = state.pin;
    try {
      var session;
      if (state.role === 'admin') session = await Auth.loginAdmin(pin);
      else if (state.role === 'teacher') session = await Auth.loginTeacher(state.accountId, pin);
      else {
        session = await Auth.loginStudent(state.accountId, pin);
        if (Auth.loadAccount && window.StoryLabState) {
          try {
            var studentAcc = await Auth.loadAccount(state.accountId);
            if (studentAcc) {
              var meta = studentAcc.metadata || {};
              await window.StoryLabState.saveProfile({
                id: studentAcc.id,
                name: studentAcc.name,
                grade: meta.grade || '5',
                avatar: meta.avatar || 'sun',
                language: meta.language || 'en',
                languageTag: (meta.language === 'hi' ? 'hi-IN' : meta.language === 'mr' ? 'mr-IN' : 'en-IN'),
                mic: 'touch',
                onboardedAt: Date.now()
              });
              await window.StoryLabState.startSession();
            }
          } catch (e) {
            console.warn('[Login] Could not activate student profile in state:', e);
          }
        }
      }

      if (UI && UI.toast) {
        UI.toast({ title: 'Signed in', message: 'Welcome, ' + session.name + '.', kind: 'ok' });
      }
      window.StoryLabRouter.navigate(roleHome(session.role));
    } catch (err) {
      state.busy = false;
      state.failures += 1;
      state.pin = '';
      state.error = (err && err.message) ? err.message : 'Could not sign in';
      if (state.failures >= MAX_FAILURES) {
        state.failures = 0;
        state.lockedUntil = Date.now() + LOCKOUT_MS;
        state.error = 'Too many attempts';
        startLockTicker();
      }
      renderGate();
      shakeDots();
    }
  }

  /* ------------------------------------------------------------
     First-boot admin setup
     ------------------------------------------------------------ */
  async function submitSetup(form) {
    var nameInput = form.querySelector('[name="name"]');
    var pinInput = form.querySelector('[name="pin"]');
    var confirmInput = form.querySelector('[name="confirm"]');
    var errorEl = document.getElementById('setup-error');

    var name = nameInput ? nameInput.value.trim() : '';
    var pin = pinInput ? pinInput.value : '';
    var confirm = confirmInput ? confirmInput.value : '';

    function fail(message) {
      if (errorEl) errorEl.textContent = message;
    }

    if (name.length < 2) return fail('Enter an admin name.');
    if (!/^[0-9]{6}$/.test(pin)) return fail('The PIN must be exactly 6 digits.');
    if (pin !== confirm) return fail('The two PINs do not match.');

    var submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'CREATING…';
    }

    try {
      await Auth.createAccount('admin', { name: name }, pin);
      await Auth.loginAdmin(pin);
      if (UI && UI.toast) {
        UI.toast({ title: 'Admin created', message: 'Welcome, ' + name + '.', kind: 'ok' });
      }
      window.StoryLabRouter.navigate('admin');
    } catch (err) {
      if (submit) {
        submit.disabled = false;
        submit.textContent = 'CREATE ADMIN →';
      }
      fail((err && err.message) || 'Could not create the admin account.');
    }
  }

  /* ------------------------------------------------------------
     Events
     ------------------------------------------------------------ */
  function onClick(event) {
    var reseedBtn = event.target.closest('[data-action="reseed-demo"]');
    if (reseedBtn) {
      if (Auth && typeof Auth.seedDemoData === 'function') {
        reseedBtn.disabled = true;
        reseedBtn.textContent = 'SEEDING…';
        Auth.seedDemoData(true).then(function () {
          fetch('/api/seed', { method: 'POST' }).catch(function () {});
          if (UI && UI.toast) UI.toast({ title: 'Demo ready', message: 'Demo roles and records interconnected.', kind: 'ok' });
          mount(_root);
        }).catch(function (err) {
          reseedBtn.disabled = false;
          reseedBtn.textContent = '⚡ RE-SEED DATA';
        });
      }
      return;
    }

    var roleBtn = event.target.closest('[data-role-pick]');
    if (roleBtn) {
      pickRole(roleBtn.getAttribute('data-role-pick'));
      return;
    }

    var accountBtn = event.target.closest('[data-account]');
    if (accountBtn) {
      pickAccount(accountBtn.getAttribute('data-account'), accountBtn.getAttribute('data-name'));
      return;
    }

    var keyBtn = event.target.closest('[data-key]');
    if (keyBtn) {
      pressKey(keyBtn.getAttribute('data-key'));
      return;
    }

    if (event.target.closest('[data-action="back"]')) {
      if (state.view === 'pin' || state.view === 'admin-pin') {
        if (state.role === 'admin') {
          showRoles();
          return;
        }
        pickRole(state.role);
        return;
      }
      showRoles();
    }
  }

  function onSubmit(event) {
    var form = event.target.closest('[data-form="setup"]');
    if (!form) return;
    event.preventDefault();
    submitSetup(form);
  }

  /* ------------------------------------------------------------
     Mount
     ------------------------------------------------------------ */
  function mount(root) {
    resetState();
    _root = root;

    root.innerHTML =
      '<section class="screen login">' +
      '  <div class="login-gate" id="login-gate"><p class="mono-label">◈ CHECKING TERMINAL…</p></div>' +
      '</section>';

    _gate = document.getElementById('login-gate');
    var screen = root.querySelector('.screen.login');
    if (screen) {
      screen.addEventListener('click', onClick);
      screen.addEventListener('submit', onSubmit);
    }

    (async function () {
      var first = true;
      try {
        first = await Auth.isFirstBoot();
      } catch (err) {
        console.warn('[Login] Could not read the accounts store:', err);
      }
      if (!_root) return;
      state.mode = 'first-boot';
      state.view = first ? 'setup' : 'roles';
      renderGate();
    })();

    return function cleanup() {
      if (state.timer) window.clearInterval(state.timer);
      state.timer = 0;
      _root = null;
      _gate = null;
    };
  }

  window.StoryLabLogin = { mount: mount };
  console.log('[Login] window.StoryLabLogin ready');
})();
