/**
 * StoryLab Voice — shell router + boot sequence
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Routes
 *   #/home       Control Deck (foundation)
 *   #/record     Learning Record + sync centre (foundation)
 *   #/onboarding First-run enrolment (foundation)
 *   #/orientation First Shift briefing (foundation)
 *   #/storylearn  Module 01 host (Pritam)
 *   #/chatbot     Module 02 host (Ritesh)
 *   #/labinbox    Module 03 host (Anurag)
 *
 * Public contract: window.StoryLabRouter.navigate(route)
 */
;(function () {
  'use strict';

  var ROUTES = {
    home: { title: 'Home', nav: 'home' },
    record: { title: 'My Progress', nav: 'record' },
    onboarding: { title: 'Student setup', nav: '' },
    orientation: { title: 'Getting started', nav: 'guide' },
    storylearn: { title: 'Stories', nav: 'home' },
    chatbot: { title: 'Voice Tutor', nav: 'home' },
    labinbox: { title: 'Virtual Lab', nav: 'home' },
    login: { title: 'Sign in', nav: '' },
    teacher: { title: 'Teacher Dashboard', nav: 'teacher' },
    'teacher/student': { title: 'Student Detail', nav: 'teacher' },
    admin: { title: 'Admin Panel', nav: 'admin' },
    'admin/accounts': { title: 'Accounts', nav: 'admin-accounts' },
    'admin/settings': { title: 'Settings', nav: 'admin-settings' },
    'admin/log': { title: 'Audit Log', nav: 'admin-log' }
  };

  /* Sub-routes carry a parameter after the first slash. The admin student view
     reuses the teacher detail screen, so both prefixes resolve to one page. */
  var SUB_ROUTE_PREFIXES = ['teacher/student', 'admin/student', 'admin/accounts', 'admin/settings', 'admin/log'];
  var SUB_ROUTE_PAGES = {
    'teacher/student': 'teacher/student',
    'admin/student': 'teacher/student',
    'admin/accounts': 'admin/accounts',
    'admin/settings': 'admin/settings',
    'admin/log': 'admin/log'
  };

  var currentRoute = null;
  var currentParam = null;
  var currentCleanup = null;
  var bootFinished = false;
  var bootStarted = false;
  var appRoot = null;

  function $(id) {
    return document.getElementById(id);
  }

  function getRoot() {
    if (!appRoot) appRoot = $('app-root');
    return appRoot;
  }

  function normalizeRoutePath(path) {
    var cleaned = String(path || '').replace(/^#\/?/, '').split('?')[0].trim();
    if (!cleaned) return { page: 'home', param: null };
    if (ROUTES[cleaned]) return { page: cleaned, param: null };

    for (var i = 0; i < SUB_ROUTE_PREFIXES.length; i += 1) {
      var prefix = SUB_ROUTE_PREFIXES[i];
      if (cleaned === prefix) return { page: SUB_ROUTE_PAGES[prefix], param: null };
      if (cleaned.indexOf(prefix + '/') === 0) {
        return { page: SUB_ROUTE_PAGES[prefix], param: cleaned.slice(prefix.length + 1) || null };
      }
    }

    var parts = cleaned.split('/');
    return { page: ROUTES[parts[0]] ? parts[0] : 'home', param: parts[1] || null };
  }

  function parseHash() {
    return normalizeRoutePath(window.location.hash || '#/home');
  }

  function navigate(route) {
    var target = normalizeRoutePath(route);
    var nextHash = '#/' + target.page + (target.param ? '/' + target.param : '');
    if (window.location.hash === nextHash) {
      render(target.page, target.param);
    } else {
      window.location.hash = nextHash;
    }
  }

  function updateHeader(route) {
    var profile = window.StoryLabState ? window.StoryLabState.getProfile() : null;
    var body = document.body;
    body.classList.toggle('has-no-profile', !profile);
    body.dataset.route = route;

    var nav = document.querySelector('.app-nav');
    if (nav) {
      var role = window.StoryLabAuth ? (window.StoryLabAuth.getRole() || '') : '';
      nav.setAttribute('data-role', role);
    }

    var navRoute = ROUTES[route] ? ROUTES[route].nav : '';
    document.querySelectorAll('.app-nav__link').forEach(function (link) {
      var navKey = link.getAttribute('data-nav');
      var isActive = navKey === navRoute;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
      if (window.StoryLabUI && typeof window.StoryLabUI.t === 'function') {
        if (navKey === 'home') link.textContent = window.StoryLabUI.t('nav.home', 'HOME');
        else if (navKey === 'record') link.textContent = window.StoryLabUI.t('nav.progress', 'PROGRESS');
        else if (navKey === 'guide') link.textContent = window.StoryLabUI.t('nav.intro', 'INTRO');
      }
    });

    var subEl = document.querySelector('.brand__type em');
    if (subEl && window.StoryLabUI && typeof window.StoryLabUI.t === 'function') {
      subEl.textContent = window.StoryLabUI.t('shell.brand_sub', 'LEARNING APP / v1.0');
    }

    var footerMeta = document.querySelector('.app-footer__meta');
    if (footerMeta && window.StoryLabUI && typeof window.StoryLabUI.t === 'function') {
      footerMeta.textContent = window.StoryLabUI.t('shell.footer_credits', 'WORKS OFFLINE / NO ACCOUNT');
    }

    var chip = $('student-chip');
    var nameEl = $('student-chip-name');
    var avatarEl = $('student-chip-avatar');
    if (chip) {
      chip.hidden = !profile;
      if (profile) {
        chip.setAttribute('href', '#/record');
        chip.setAttribute('aria-label', 'Open learning record for ' + profile.name);
        if (nameEl) nameEl.textContent = profile.name;
        if (avatarEl) avatarEl.innerHTML = window.StoryLabUI.avatar(profile.avatar);
      }
    }

    /* Sync language picker buttons */
    var activeLang = (window.StoryLabI18n && window.StoryLabI18n.getLanguage) ? window.StoryLabI18n.getLanguage() : 'en';
    document.querySelectorAll('[data-lang-choice]').forEach(function (btn) {
      var selected = btn.getAttribute('data-lang-choice') === activeLang;
      btn.classList.toggle('is-active', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    var title = ROUTES[route] ? ROUTES[route].title : 'Home';
    document.title = title + ' — StoryLab Voice';
  }

  function cleanup() {
    if (typeof currentCleanup === 'function') {
      try {
        currentCleanup();
      } catch (err) {
        console.warn('[Router] Cleanup failed:', err);
      }
    }
    currentCleanup = null;
  }

  function roleHome(role) {
    if (role === 'teacher') return 'teacher';
    if (role === 'admin') return 'admin';
    return 'home';
  }

  function guard(route) {
    var Auth = window.StoryLabAuth;
    if (!Auth) {
      // Auth not loaded yet — fall back to the original enrolment guard.
      var hasProfileOnly = window.StoryLabState && window.StoryLabState.hasProfile();
      if (!hasProfileOnly && route !== 'onboarding') return 'onboarding';
      if (hasProfileOnly && route === 'onboarding') return 'home';
      return route;
    }

    var session = Auth.getSession();
    var role = session ? session.role : null;

    if (!session) {
      if (route === 'login') return 'login';
      // Backward compat: an enrolled student with no session still reaches
      // their learning screens after the v2 -> v3 upgrade.
      var hasProfile = window.StoryLabState && window.StoryLabState.hasProfile();
      if (hasProfile && (route === 'home' || route === 'record' || route === 'orientation' || route === 'storylearn' || route === 'chatbot' || route === 'labinbox')) {
        return route;
      }
      return 'login';
    }

    if (route === 'login') return roleHome(role);

    if (role === 'student') {
      var studentRoutes = ['home', 'record', 'orientation', 'storylearn', 'chatbot', 'labinbox'];
      if (studentRoutes.indexOf(route) === -1) return 'home';
    }

    if (role === 'teacher') {
      var teacherRoutes = ['teacher', 'teacher/student'];
      if (teacherRoutes.indexOf(route) === -1) return 'teacher';
    }

    if (role === 'admin') {
      var adminRoutes = ['admin', 'admin/accounts', 'admin/settings', 'admin/log', 'teacher', 'teacher/student'];
      if (adminRoutes.indexOf(route) === -1) return 'admin';
    }

    return route;
  }

  function render(route, param) {
    var root = getRoot();
    if (!root) return;
    cleanup();

    var parsed = parseHash();
    var page = route || parsed.page;
    var activeParam = (param === undefined) ? parsed.param : param;

    var resolved = guard(page);
    if (resolved !== page) {
      // Replace the URL without stacking history when a guard redirects.
      window.history.replaceState(null, '', '#/' + resolved);
      activeParam = null;
    }

    currentRoute = resolved;
    currentParam = activeParam;
    updateHeader(resolved);
    root.innerHTML = '';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (resolved === 'onboarding') {
      currentCleanup = window.StoryLabOnboarding.mount(root);
      return;
    }

    if (resolved === 'orientation') {
      currentCleanup = window.StoryLabOnboarding.mountOrientation(root, { replay: false });
      return;
    }

    if (resolved === 'home') {
      currentCleanup = window.StoryLabDashboard.mount(root);
      return;
    }

    if (resolved === 'record') {
      currentCleanup = window.StoryLabRecord.mount(root);
      return;
    }

    if (resolved === 'login') {
      currentCleanup = window.StoryLabLogin ? window.StoryLabLogin.mount(root) : null;
      return;
    }

    if (resolved === 'teacher') {
      currentCleanup = window.StoryLabTeacher ? window.StoryLabTeacher.mount(root) : null;
      return;
    }

    if (resolved === 'teacher/student') {
      currentCleanup = window.StoryLabTeacher ? window.StoryLabTeacher.mountStudentDetail(root, currentParam) : null;
      return;
    }

    if (resolved === 'admin') {
      currentCleanup = window.StoryLabAdmin ? window.StoryLabAdmin.mount(root) : null;
      return;
    }

    if (resolved === 'admin/accounts') {
      currentCleanup = window.StoryLabAdmin ? window.StoryLabAdmin.mountAccounts(root) : null;
      return;
    }

    if (resolved === 'admin/settings') {
      currentCleanup = window.StoryLabAdmin ? window.StoryLabAdmin.mountSettings(root) : null;
      return;
    }

    if (resolved === 'admin/log') {
      currentCleanup = window.StoryLabAdmin ? window.StoryLabAdmin.mountLog(root) : null;
      return;
    }

    renderModule(resolved, root);
  }

  function renderModule(route, root) {
    var config = {
      storylearn: {
        label: 'STORIES',
        title: 'Stories',
        index: 'StoryLearn module',
        owner: 'Pritam Tatkari',
        api: window.StoryLearn
      },
      chatbot: {
        label: 'VOICE TUTOR',
        title: 'Voice Tutor',
        index: 'Voice module',
        owner: 'Ritesh Gavhane',
        api: window.Chatbot
      },
      labinbox: {
        label: 'VIRTUAL LAB',
        title: 'Virtual Lab',
        index: 'Virtual lab module',
        owner: 'Anurag Kumbhar',
        api: window.LabInBox
      }
    }[route];

    if (!config) {
      render('home');
      return;
    }

    root.innerHTML =
      '<section class="module-stage screen">' +
      '  <header class="module-stage__head">' +
      '    <div class="module-stage__crumb">' +
      '      <a href="#/home" aria-label="Back to home">' + window.StoryLabUI.icon('arrow-left') + ' HOME</a>' +
      '      <span>/</span><span>' + config.label + '</span>' +
      '    </div>' +
      '    <span class="module-stage__meta">' +
      '      <span class="status-dot status-dot--ok"></span>' +
      '      <span class="mono-label">READY</span>' +
      '    </span>' +
      '  </header>' +
      '  <div class="module-stage__body" id="module-mount"></div>' +
      '</section>';

    var mountEl = $('module-mount');
    if (config.api && typeof config.api.mount === 'function') {
      try {
        config.api.mount(mountEl);
        if (typeof config.api.unmount === 'function') {
          currentCleanup = function () { config.api.unmount(); };
        }
      } catch (err) {
        console.error('[Router] Module mount failed:', err);
        mountEl.innerHTML = renderModuleFault(config, err);
      }
    } else {
      mountEl.innerHTML = renderModuleFault(config, null);
    }
  }

  function renderModuleFault(config, error) {
    return (
      '<div class="panel panel--accent" style="padding:32px">' +
      '  <p class="eyebrow">NOT AVAILABLE</p>' +
      '  <h2 class="step-title" style="font-size:32px;margin-top:10px">' + config.title + ' did not load.</h2>' +
      '  <p class="lede" style="margin-top:12px">Refresh the page, or go back home.</p>' +
      (error ? '<div class="onboard-error" style="margin-top:16px">' + window.StoryLabUI.escape(error.message || String(error)) + '</div>' : '') +
      '  <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">' +
      '    <a class="btn btn-primary" href="#/home">BACK TO HOME</a>' +
      '    <button class="btn btn-secondary" onclick="location.reload()">REFRESH</button>' +
      '  </div>' +
      '</div>'
    );
  }

  function routeFromHash() {
    return parseHash();
  }

  function markBootLine(index, state, detail) {
    var line = document.querySelector('[data-boot-line="' + index + '"]');
    if (!line) return;
    var stateEl = line.querySelector('.boot-line__state');
    var detailEl = line.querySelector('.boot-line__detail');
    if (stateEl) stateEl.textContent = state;
    if (detailEl && detail !== undefined) detailEl.textContent = detail;
    line.classList.toggle('is-pending', state === 'WAIT' || state === '—');
  }

  function buildBootLog(checks) {
    var log = $('boot-log');
    if (!log) return;
    log.innerHTML = checks.map(function (check, index) {
      return (
        '<div class="boot-line is-pending" data-boot-line="' + index + '" style="animation-delay:' + (index * 80) + 'ms">' +
        '<span class="boot-line__state">WAIT</span>' +
        '<span class="boot-line__label">' + check.label + '</span>' +
        '<span class="boot-line__detail">' + check.detail + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function setBootBar(percent) {
    var bar = $('boot-bar-fill');
    if (bar) bar.style.width = percent + '%';
  }

  function finishBoot() {
    if (bootFinished) return;
    bootFinished = true;
    setBootBar(100);
    var screen = $('boot-screen');
    if (screen) screen.classList.add('is-done');
    window.setTimeout(function () {
      if (screen) screen.hidden = true;
    }, 520);
  }

  function delay(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  async function boot() {
    if (bootStarted) return;
    bootStarted = true;

    var checks = [
      { label: 'APP', detail: 'v1.0' },
      { label: 'SAVED DATA', detail: 'ON DEVICE' },
      { label: 'OFFLINE FILES', detail: 'CACHED' },
      { label: 'STUDENT', detail: 'LOCAL' },
      { label: 'VOICE', detail: 'READY' }
    ];
    buildBootLog(checks);
    setBootBar(12);

    var skip = $('boot-skip');
    if (skip) {
      skip.addEventListener('click', function () {
        finishBoot();
      });
    }

    await delay(120);
    markBootLine(0, 'OK', 'READY');
    setBootBar(28);

    var initError = null;
    try {
      await window.StoryLabState.init();
    } catch (err) {
      initError = err;
    }
    markBootLine(1, initError ? 'FAULT' : 'OK', initError ? 'CHECK STORAGE' : 'DATA READY');
    setBootBar(52);

    // Accounts layer: restore the session, then lift a legacy profile into the
    // accounts store so an enrolled student can still sign in with PIN 1234.
    if (window.StoryLabAuth) {
      try {
        await window.StoryLabAuth.init();
        await window.StoryLabAuth.migrateExistingStudent();
      } catch (err) {
        console.warn('[Boot] Accounts layer failed:', err);
      }
    }

    await delay(180);
    var swReady = 'serviceWorker' in navigator;
    markBootLine(2, swReady ? 'OK' : 'WAIT', swReady ? 'CACHED' : 'NOT AVAILABLE');
    setBootBar(68);

    await delay(120);
    var profile = window.StoryLabState ? window.StoryLabState.getProfile() : null;
    markBootLine(3, 'OK', profile ? 'FOUND' : 'NEW');
    setBootBar(82);

    await delay(120);
    var voice = ('speechSynthesis' in window) ? 'READY' : 'TEXT ONLY';
    markBootLine(4, 'OK', voice);
    setBootBar(100);

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    await delay(reduced ? 120 : 420);

    if (initError) {
      console.error('[Boot] Local ledger fault:', initError);
    }

    finishBoot();

    if (profile) {
      var active = window.StoryLabState.getActiveSession();
      if (!active) {
        window.StoryLabState.startSession().catch(function (err) {
          console.warn('[Boot] Session could not start:', err);
        });
      }
    }

    initLangPicker();
    initNavSignout();
    var initial = routeFromHash();
    render(initial.page, initial.param);
  }

  function refresh() {
    if (!bootFinished) return;
    updateHeader(currentRoute || parseHash().page);
    if (currentRoute) {
      render(currentRoute, currentParam);
    }
  }

  function initNavSignout() {
    var signout = document.getElementById('nav-signout');
    if (!signout) return;
    signout.addEventListener('click', function () {
      if (!window.StoryLabAuth) return;
      window.StoryLabAuth.logout().then(function () {
        window.StoryLabRouter.navigate('login');
      });
    });
  }

  function initLangPicker() {
    document.querySelectorAll('[data-lang-choice]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var lang = btn.getAttribute('data-lang-choice');
        if (window.StoryLabI18n && typeof window.StoryLabI18n.setLanguage === 'function') {
          window.StoryLabI18n.setLanguage(lang);
        } else if (window.StoryLabState && typeof window.StoryLabState.setLanguage === 'function') {
          window.StoryLabState.setLanguage(lang);
        }
      });
    });
  }

  window.addEventListener('storylab:language', function () {
    refresh();
  });

  window.addEventListener('hashchange', function () {
    if (!bootFinished) return;
    var next = routeFromHash();
    render(next.page, next.param);
  });

  window.StoryLabRouter = {
    navigate: navigate,
    render: render,
    refresh: refresh,
    getRoute: function () { return currentRoute; },
    boot: boot
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  console.log('[Router] window.StoryLabRouter ready');
})();
