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
    home: { title: 'Control Deck', nav: 'home' },
    record: { title: 'Learning Record', nav: 'record' },
    onboarding: { title: 'Enrolment', nav: '' },
    orientation: { title: 'First Shift', nav: 'guide' },
    storylearn: { title: 'StoryLearn', nav: 'home' },
    chatbot: { title: 'AI Voice Tutor', nav: 'home' },
    labinbox: { title: 'Lab In Box', nav: 'home' }
  };

  var currentRoute = null;
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

  function parseHash() {
    var hash = window.location.hash || '#/home';
    var cleaned = hash.replace(/^#\/?/, '').split('?')[0].trim();
    if (!cleaned) return 'home';
    return ROUTES[cleaned] ? cleaned : 'home';
  }

  function navigate(route) {
    var target = ROUTES[route] ? route : 'home';
    var nextHash = '#/' + target;
    if (window.location.hash === nextHash) {
      render(target);
    } else {
      window.location.hash = nextHash;
    }
  }

  function updateHeader(route) {
    var profile = window.StoryLabState ? window.StoryLabState.getProfile() : null;
    var body = document.body;
    body.classList.toggle('has-no-profile', !profile);
    body.dataset.route = route;

    var navRoute = ROUTES[route] ? ROUTES[route].nav : '';
    document.querySelectorAll('.app-nav__link').forEach(function (link) {
      var isActive = link.getAttribute('data-nav') === navRoute;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

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

    var title = ROUTES[route] ? ROUTES[route].title : 'Control Deck';
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

  function guard(route) {
    var hasProfile = window.StoryLabState && window.StoryLabState.hasProfile();
    if (!hasProfile && route !== 'onboarding') return 'onboarding';
    if (hasProfile && route === 'onboarding') return 'home';
    return route;
  }

  function render(route) {
    var root = getRoot();
    if (!root) return;
    cleanup();

    var resolved = guard(route || parseHash());
    if (resolved !== route && route) {
      // Replace the URL without stacking history when a guard redirects.
      window.history.replaceState(null, '', '#/' + resolved);
    }

    currentRoute = resolved;
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

    renderModule(resolved, root);
  }

  function renderModule(route, root) {
    var config = {
      storylearn: {
        label: 'BAY 01 / STORYLEARN',
        title: 'StoryLearn',
        index: 'StoryLearn module',
        owner: 'Pritam Tatkari',
        api: window.StoryLearn
      },
      chatbot: {
        label: 'BAY 02 / AI VOICE TUTOR',
        title: 'AI Voice Tutor',
        index: 'Voice module',
        owner: 'Ritesh Gavhane',
        api: window.Chatbot
      },
      labinbox: {
        label: 'BAY 03 / LAB IN BOX',
        title: 'Lab In Box',
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
      '      <a href="#/home" aria-label="Back to control deck">' + window.StoryLabUI.icon('arrow-left') + ' DECK</a>' +
      '      <span>/</span><span>' + config.label + '</span>' +
      '    </div>' +
      '    <span class="module-stage__meta">' +
      '      <span class="status-dot status-dot--ok"></span>' +
      '      <span class="mono-label">MODULE LIVE</span>' +
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
      '  <p class="eyebrow">MODULE UNAVAILABLE</p>' +
      '  <h2 class="step-title" style="font-size:32px;margin-top:10px">' + config.title + ' is not responding.</h2>' +
      '  <p class="lede" style="margin-top:12px">The bay is installed, but its controller did not load. ' +
      'Refresh the terminal, or return to the control deck.</p>' +
      (error ? '<div class="onboard-error" style="margin-top:16px">' + window.StoryLabUI.escape(error.message || String(error)) + '</div>' : '') +
      '  <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">' +
      '    <a class="btn btn-primary" href="#/home">RETURN TO DECK</a>' +
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
      { label: 'CORE SHELL', detail: 'GOOGLE SANS / v1.0' },
      { label: 'LOCAL LEDGER', detail: 'INDEXEDDB v2' },
      { label: 'OFFLINE CACHE', detail: 'SERVICE WORKER' },
      { label: 'STUDENT RECORD', detail: 'LOCAL PROFILE' },
      { label: 'VOICE BUS', detail: 'WEB SPEECH API' }
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
    markBootLine(0, 'OK', 'SHELL ONLINE');
    setBootBar(28);

    var initError = null;
    try {
      await window.StoryLabState.init();
    } catch (err) {
      initError = err;
    }
    markBootLine(1, initError ? 'FAULT' : 'OK', initError ? 'CHECK STORAGE' : 'LEDGER READY');
    setBootBar(52);

    await delay(180);
    var swReady = 'serviceWorker' in navigator;
    markBootLine(2, swReady ? 'OK' : 'WAIT', swReady ? 'CACHE ARMED' : 'NOT SUPPORTED');
    setBootBar(68);

    await delay(120);
    var profile = window.StoryLabState ? window.StoryLabState.getProfile() : null;
    markBootLine(3, 'OK', profile ? 'STUDENT FOUND' : 'NEW UNIT');
    setBootBar(82);

    await delay(120);
    var voice = ('speechSynthesis' in window) ? 'READY' : 'TEXT MODE';
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

    render(routeFromHash());
  }

  window.addEventListener('hashchange', function () {
    if (!bootFinished) return;
    render(routeFromHash());
  });

  window.StoryLabRouter = {
    navigate: navigate,
    render: render,
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
