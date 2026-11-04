/**
 * StoryLab Voice — Control Deck
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * window.StoryLabDashboard.mount(root) -> cleanup
 */
;(function () {
  'use strict';

  var UI = window.StoryLabUI;
  var State = window.StoryLabState;

  var LANG_NAMES = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
  var clockTimer = null;

  function bayArt(kind) {
    if (kind === 'story') {
      return (
        '<svg viewBox="0 0 360 142" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
        '<g stroke="currentColor" stroke-opacity=".18">' +
        '<path d="M0 118h360M40 0v142M318 0v142"/>' +
        '<circle cx="278" cy="42" r="56" stroke-dasharray="2 7"/>' +
        '</g>' +
        '<path d="M74 92c24-7 42-7 66 3V53c-24-10-42-10-66-3v42Z" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M140 95c24-10 42-10 66-3V56c-24-7-42-7-66 3v36Z" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M140 59v36" stroke="currentColor" stroke-opacity=".55"/>' +
        '<g stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 4" stroke-opacity=".7">' +
        '<path d="M254 92c-24-14-54-17-78-8"/>' +
        '</g>' +
        '<g stroke="currentColor" stroke-width="1.2">' +
        '<path d="M254 92v-22M254 70l12-6M254 77l-9-5"/>' +
        '<circle cx="254" cy="94" r="2" fill="currentColor"/>' +
        '</g>' +
        '<g font-family="Google Sans Code, monospace" font-size="6" letter-spacing="1.4" fill="currentColor" fill-opacity=".55">' +
        '<text x="74" y="122">STORY ROUTE / 01</text>' +
        '<text x="270" y="122" text-anchor="middle">ASK / LISTEN</text>' +
        '</g>' +
        '<g stroke="currentColor" stroke-width="1" stroke-opacity=".35">' +
        '<path d="M238 46h34M246 40h18M250 52h26"/>' +
        '</g>' +
        '</svg>'
      );
    }

    if (kind === 'tutor') {
      return (
        '<svg viewBox="0 0 360 142" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
        '<g stroke="currentColor" stroke-opacity=".16">' +
        '<path d="M0 118h360M40 0v142M318 0v142"/>' +
        '</g>' +
        '<g stroke="currentColor" stroke-opacity=".35">' +
        '<circle cx="180" cy="66" r="40" stroke-dasharray="2 7"/>' +
        '<circle cx="180" cy="66" r="58" stroke-dasharray="2 11"/>' +
        '</g>' +
        '<rect x="166" y="26" width="28" height="50" rx="14" stroke="currentColor" stroke-width="1.5"/>' +
        '<path d="M154 58v5a26 26 0 0 0 52 0v-5M180 90v18M166 110h28" stroke="currentColor" stroke-width="1.3" stroke-linecap="square"/>' +
        '<g stroke="currentColor" stroke-width="2" stroke-linecap="square">' +
        '<path d="M84 80V64M98 88V56M112 94V50M126 82V62"/>' +
        '<path d="M234 82V62M248 94V50M262 88V56M276 80V64"/>' +
        '</g>' +
        '<g fill="currentColor">' +
        '<circle cx="300" cy="38" r="2"/><circle cx="58" cy="88" r="1.6"/>' +
        '</g>' +
        '<g font-family="Google Sans Code, monospace" font-size="6" letter-spacing="1.4" fill="currentColor" fill-opacity=".55">' +
        '<text x="42" y="126">VOICE BUS / LIVE</text>' +
        '<text x="318" y="126" text-anchor="end">48 kHz / LOCAL</text>' +
        '</g>' +
        '</svg>'
      );
    }

    return (
      '<svg viewBox="0 0 360 142" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
      '<g stroke="currentColor" stroke-opacity=".17">' +
      '<path d="M0 118h360M40 0v142M318 0v142"/>' +
      '<path d="M64 34h44M64 40h22" stroke-opacity=".7"/>' +
      '</g>' +
      '<path d="M180 20h38M184 20v12l-30 58a12 12 0 0 0 11 17h56a12 12 0 0 0 11-17l-30-58V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/>' +
      '<path d="M158 88c12-5 36-5 48 0l16 19H142l16-19Z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1"/>' +
      '<g fill="currentColor" fill-opacity=".55">' +
      '<circle cx="192" cy="96" r="2.2"/><circle cx="212" cy="104" r="1.5"/><circle cx="178" cy="106" r="1.2"/>' +
      '</g>' +
      '<g stroke="currentColor" stroke-width="1" stroke-opacity=".45">' +
      '<path d="M128 36v56M132 36h-8M132 47h-8M132 58h-8M132 69h-8M132 80h-8M132 92h-8"/>' +
      '<path d="M276 42c14 6 22 16 22 28s-8 22-22 28"/>' +
      '</g>' +
      '<g font-family="Google Sans Code, monospace" font-size="6" letter-spacing="1.4" fill="currentColor" fill-opacity=".55">' +
      '<text x="64" y="122">REAGENT / 01</text>' +
      '<text x="318" y="122" text-anchor="end">CANVAS / 2D</text>' +
      '</g>' +
      '</svg>'
    );
  }

  function mount(root) {
    var disposed = false;
    var offNetwork = null;
    var stateHandler = null;

    root.innerHTML = loadingMarkup();

    Promise.all([State.getSnapshot(), loadIndexCounts()]).then(function (results) {
      if (disposed) return;
      var snapshot = results[0];
      var indexes = results[1];
      if (!snapshot.profile) {
        window.StoryLabRouter.navigate('onboarding');
        return;
      }
      root.innerHTML = deckMarkup(snapshot, indexes);
      hydrateStorage();
      startClock(snapshot);
      bindLiveUpdates(snapshot);
    }).catch(function (err) {
      console.error('[Deck] Could not load dashboard:', err);
      if (disposed) return;
      root.innerHTML = faultMarkup(err);
    });

    function bindLiveUpdates(snapshot) {
      stateHandler = function () {
        if (disposed) return;
        State.getPendingCount().then(function (pending) {
          var cell = document.getElementById('station-sync');
          if (cell) cell.textContent = pending ? String(pending).padStart(2, '0') + ' WAITING' : 'ALL SENT';
        });
      };
      window.addEventListener('storylab:state', stateHandler);
      if (window.StoryLabNetwork) {
        offNetwork = window.StoryLabNetwork.onChange(function (online) {
          var cell = document.getElementById('station-net');
          if (cell) cell.textContent = online ? 'ONLINE' : 'OFFLINE';
          cell && cell.classList.toggle('is-warn', !online);
        });
      }
    }

    return function cleanup() {
      disposed = true;
      if (clockTimer) {
        window.clearInterval(clockTimer);
        clockTimer = null;
      }
      if (stateHandler) window.removeEventListener('storylab:state', stateHandler);
      if (typeof offNetwork === 'function') offNetwork();
    };
  }

  function startClock(snapshot) {
    var active = snapshot.sessions && snapshot.sessions.active;
    var started = active ? active.startedAt : 0;

    function tick() {
      var now = new Date();
      var clock = document.getElementById('station-clock');
      var date = document.getElementById('station-date');
      var timer = document.getElementById('station-session');
      if (clock) clock.textContent = UI.formatClock(now);
      if (date) date.textContent = UI.formatDate(now, true);
      if (timer) {
        timer.textContent = started ? UI.formatDuration(Date.now() - started) : '00:00';
      }
    }

    tick();
    if (clockTimer) window.clearInterval(clockTimer);
    clockTimer = window.setInterval(tick, 1000);
  }

  async function loadIndexCounts() {
    var result = { stories: 2, labs: 1, storySubjects: 4 };
    try {
      var responses = await Promise.all([
        fetch('data/stories/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }),
        fetch('data/labs/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; })
      ]);
      if (Array.isArray(responses[0]) && responses[0].length) {
        result.stories = responses[0].length;
        var subjects = {};
        responses[0].forEach(function (story) { if (story.subject) subjects[story.subject] = true; });
        result.storySubjects = Object.keys(subjects).length || 4;
      }
      if (Array.isArray(responses[1]) && responses[1].length) result.labs = responses[1].length;
    } catch (err) {
      /* Index metadata is decorative; keep the known counts. */
    }
    return result;
  }

  function loadingMarkup() {
    return (
      '<section class="screen deck">' +
      '  <div class="panel panel--accent" style="padding:34px">' +
      '    <p class="eyebrow">HOME</p>' +
      '    <h1 class="deck-title" style="font-size:clamp(2.2rem,4vw,3.4rem);margin-top:12px">Loading…</h1>' +
      '    <div class="meter" style="margin-top:20px;max-width:360px"><div class="meter__fill" style="width:44%"></div></div>' +
      '  </div>' +
      '</section>'
    );
  }

  function deckMarkup(snapshot, indexes) {
    var profile = snapshot.profile;
    var journey = snapshot.journey;
    var progress = snapshot.progress;
    var orientationDone = !!(journey.orientation && journey.orientation.completed);
    var next = nextDirective(snapshot, indexes);
    var sessionActive = snapshot.sessions && snapshot.sessions.active;
    var elapsed = snapshot.sessions ? snapshot.sessions.activeElapsed : 0;
    var pending = snapshot.pending || 0;
    var sessionsCount = snapshot.sessions ? snapshot.sessions.count : 0;
    var totalTime = snapshot.sessions ? snapshot.sessions.totalTimeMs : 0;

    var storiesDone = progress.completedStories || 0;
    var labsDone = progress.completedLabs || 0;
    var checkpoints = storiesDone + labsDone;

    var storyMeta = [
      indexes.stories + ' STORIES',
      indexes.storySubjects + ' SUBJECTS',
      storiesDone ? storiesDone + ' DONE' : 'NEW'
    ];
    var labMeta = [
      indexes.labs + ' EXPERIMENTS',
      'CANVAS 2D',
      labsDone ? labsDone + ' DONE' : 'NEW'
    ];
    var tutorMeta = [
      'ALWAYS ON',
      'VOICE + TOUCH',
      'OFFLINE'
    ];

    var greeting = UI.greeting();
    var dateLabel = UI.formatDate(new Date(), true);
    var language = LANG_NAMES[profile.language] || 'English';
    var badges = journey.badges || [];

    var activity = snapshot.events && snapshot.events.length
      ? snapshot.events.slice(0, 4).map(function (event) {
        return (
          '<div class="activity-item">' +
          '<span class="activity-item__dot"></span>' +
          '<div>' +
          '<div class="activity-item__type">' + UI.escape(event.label) + '</div>' +
          '<div class="activity-item__meta">' + UI.escape((event.type || 'activity').toUpperCase()) + '</div>' +
          '</div>' +
          '<span class="activity-item__time">' + UI.escape(UI.relativeTime(event.ts)) + '</span>' +
          '</div>'
        );
      }).join('')
      : '<div class="empty-state" style="padding:16px"><p class="empty-state__text">No activity yet. Finish the First Shift briefing to start the log.</p></div>';

    return (
      '<section class="screen deck">' +
      '  <header class="deck-head">' +
      '    <div class="deck-head__main">' +
      '      <p class="eyebrow">STUDENT / ' + UI.escape(profile.id || 'LOCAL') + '</p>' +
      '      <h1 class="deck-title">' + greeting + ',<br><span>' + UI.escape(profile.name) + '.</span></h1>' +
      '      <p class="deck-sub">' + (orientationDone
        ? 'Pick up where you left off, or open something new.'
        : 'Start with a story, ask the tutor, or finish the short intro first.') + '</p>' +
      '      <div class="deck-tags">' +
      '        <span class="deck-tag"><span class="led led--ok"></span> SAVED ON THIS DEVICE</span>' +
      '        <span class="deck-tag">' + UI.escape(String(sessionActive ? 'TIMER RUNNING' : 'NO TIMER')) + '</span>' +
      '        <span class="deck-tag">' + UI.escape(language.toUpperCase()) + '</span>' +
      '      </div>' +
      '    </div>' +
      '    <aside class="station-panel" aria-label="Station status">' +
      '      <div class="station-panel__top">' +
      '        <span class="station-panel__label">LOCAL TIME</span>' +
      '        <span class="led led--ok led--pulse"></span>' +
      '      </div>' +
      '      <div class="station-clock" id="station-clock">' + UI.formatClock(new Date()) + '</div>' +
      '      <div class="station-date" id="station-date">' + dateLabel + '</div>' +
      '      <div class="station-grid">' +
      '        <div class="station-cell"><em>INTERNET</em><strong id="station-net">' + (navigator.onLine ? 'ONLINE' : 'OFFLINE') + '</strong></div>' +
      '        <div class="station-cell"><em>TIMER</em><strong class="is-live" id="station-session">' + UI.formatDuration(elapsed) + '</strong></div>' +
      '        <div class="station-cell"><em>TO UPLOAD</em><strong id="station-sync">' + (pending ? String(pending).padStart(2, '0') + ' WAITING' : 'ALL SENT') + '</strong></div>' +
      '        <div class="station-cell"><em>MIC</em><strong>' + (profile.mic === 'verified' ? 'VERIFIED' : profile.mic === 'touch' ? 'TOUCH MODE' : 'NOT TESTED') + '</strong></div>' +
      '      </div>' +
      '    </aside>' +
      '  </header>' +

      '  <section class="directive" aria-label="Next directive">' +
      '    <div class="directive__glyph">' + UI.icon(next.icon) + '</div>' +
      '    <div class="directive__body">' +
      '      <p class="directive__tag">NEXT / ' + next.code + '</p>' +
      '      <h2>' + UI.escape(next.title) + '</h2>' +
      '      <p>' + UI.escape(next.desc) + '</p>' +
      '    </div>' +
      '    <div class="directive__actions">' +
      '      <a class="btn btn-primary" href="' + next.href + '">' + next.cta + ' ' + UI.icon('arrow-right') + '</a>' +
      '    </div>' +
      '  </section>' +

      '  <div class="section-head">' +
      '    <h2 class="section-title">Learn</h2>' +
      '    <span class="section-head__meta">3 MODULES / WORKS OFFLINE</span>' +
      '  </div>' +

      '  <div class="bay-grid" id="bays">' +
      bayCard('story', '01', 'Stories', 'Voice-guided stories with one question inside.', storyMeta, '#/storylearn', 'OPEN', bayArt('story')) +
      bayCard('tutor', '02', 'Voice Tutor', 'Ask anything. Answers out loud, without internet.', tutorMeta, '#/chatbot', 'OPEN', bayArt('tutor')) +
      bayCard('lab', '03', 'Virtual Lab', 'Try science experiments on screen. No apparatus needed.', labMeta, '#/labinbox', 'OPEN', bayArt('lab')) +
      '  </div>' +

      '  <div class="section-head">' +
      '    <h2 class="section-title">Your progress</h2>' +
      '    <a class="section-head__link" href="#/record">OPEN FULL RECORD ' + UI.icon('arrow-right') + '</a>' +
      '  </div>' +

      '  <div class="dossier-grid">' +
      '    <section class="dossier-card">' +
      '      <div class="dossier-card__head"><h3>Student</h3><span class="mono-label">ON THIS DEVICE</span></div>' +
      '      <div class="student-file">' +
      '        <div class="avatar avatar--lg">' + UI.avatar(profile.avatar) + '</div>' +
      '        <div class="student-file__info">' +
      '          <div class="student-file__name">' + UI.escape(profile.name) + '</div>' +
      '          <div class="student-file__id">' + UI.escape(profile.id) + '</div>' +
      '          <div class="student-file__badge">' +
      (orientationDone
        ? '<span class="badge badge--ok"><i class="led led--ok"></i> GETTING STARTED DONE</span>'
        : '<span class="badge badge--warn"><i class="led led--warn"></i> GETTING STARTED</span>') +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="student-file__grid">' +
      '        <div class="field-pair"><em>GRADE</em><strong>' + UI.escape(profile.grade) + '</strong></div>' +
      '        <div class="field-pair"><em>LANGUAGE</em><strong>' + UI.escape(language) + ' / ' + UI.escape(profile.languageTag || profile.language.toUpperCase()) + '</strong></div>' +
      '        <div class="field-pair"><em>SESSIONS</em><strong>' + sessionsCount + ' CLOSED</strong></div>' +
      '        <div class="field-pair"><em>MEMBER SINCE</em><strong>' + UI.formatDate(profile.createdAt, false) + '</strong></div>' +
      '      </div>' +
      '      <div class="barcode" aria-hidden="true"></div>' +
      '    </section>' +

      '    <section class="dossier-card">' +
      '      <div class="dossier-card__head"><h3>Numbers</h3><span class="mono-label">LIVE</span></div>' +
      '      <div class="telemetry-grid">' +
      '        <div class="telemetry-tile"><div class="telemetry-tile__value' + (orientationDone ? ' is-accent' : '') + '">' + (orientationDone ? 'DONE' : '—') + '</div><div class="telemetry-tile__label">GETTING STARTED</div><div class="telemetry-tile__sub">' + (orientationDone ? 'Done' : 'Not done yet') + '</div></div>' +
      '        <div class="telemetry-tile"><div class="telemetry-tile__value">' + String(checkpoints).padStart(2, '0') + '</div><div class="telemetry-tile__label">COMPLETED</div><div class="telemetry-tile__sub">Stories + labs</div></div>' +
      '        <div class="telemetry-tile"><div class="telemetry-tile__value">' + UI.formatMinutes(totalTime) + '</div><div class="telemetry-tile__label">TIME ON TASK</div><div class="telemetry-tile__sub">Across ' + Math.max(1, sessionsCount) + ' session' + (sessionsCount === 1 ? '' : 's') + '</div></div>' +
      '        <div class="telemetry-tile"><div class="telemetry-tile__value">' + String(badges.length).padStart(2, '0') + '</div><div class="telemetry-tile__label">BADGES</div><div class="telemetry-tile__sub">' + (badges.length ? 'Earned locally' : 'Earn your first') + '</div></div>' +
      '      </div>' +
      '    </section>' +

      '    <section class="dossier-card">' +
      '      <div class="dossier-card__head"><h3>Status</h3><span class="mono-label">ON THIS DEVICE</span></div>' +
      '      <div class="system-list">' +
      '        <div class="system-item"><span class="led led--ok"></span><span class="system-item__label">Saved data</span><span class="system-item__value is-ok">READY</span></div>' +
      '        <div class="system-item"><span class="led ' + (navigator.onLine ? 'led--ok' : 'led--error') + '"></span><span class="system-item__label">Internet</span><span class="system-item__value ' + (navigator.onLine ? 'is-ok' : 'is-error') + '">' + (navigator.onLine ? 'ONLINE' : 'OFFLINE') + '</span></div>' +
      '        <div class="system-item"><span class="led ' + (('speechSynthesis' in window) ? 'led--ok' : 'led--warn') + '"></span><span class="system-item__label">Voice</span><span class="system-item__value">' + (('speechSynthesis' in window) ? 'READY' : 'TEXT MODE') + '</span></div>' +
      '        <div class="system-item"><span class="led led--ok"></span><span class="system-item__label">Offline files</span><span class="system-item__value" id="cache-chip">' + (navigator.serviceWorker && navigator.serviceWorker.controller ? 'READY' : 'STARTING') + '</span></div>' +
      '      </div>' +
      '      <div class="storage-line">' +
      '        <div class="storage-line__labels"><span>STORAGE USED</span><span id="storage-value">READING…</span></div>' +
      '        <div class="meter"><div class="meter__fill" id="storage-fill" style="width:6%"></div></div>' +
      '      </div>' +
      '    </section>' +

      '    <section class="dossier-card">' +
      '      <div class="dossier-card__head"><h3>Recent activity</h3><a class="dossier-card__link" href="#/record">VIEW ALL →</a></div>' +
      '      <div class="activity-list">' + activity + '</div>' +
      '    </section>' +
      '  </div>' +
      '</section>'
    );
  }

  function bayCard(tone, index, title, desc, meta, href, cta, art) {
    return (
      '<a class="bay bay--' + tone + '" href="' + href + '" aria-label="Open ' + title + '">' +
      '  <div class="bay__top">' +
      '    <span class="bay__index">' + index + '</span>' +
      '    <span class="bay__status"><span class="led"></span> READY</span>' +
      '  </div>' +
      '  <div class="bay__art">' + art + '</div>' +
      '  <div class="bay__body">' +
      '    <h2 class="bay__title">' + title + '</h2>' +
      '    <p class="bay__desc">' + desc + '</p>' +
      '    <div class="bay__meta">' + meta.map(function (item) {
        return '<span>' + UI.escape(item) + '</span>';
      }).join('') + '</div>' +
      '  </div>' +
      '  <div class="bay__foot">' +
      '    <span class="bay__cta">' + cta + '</span>' +
      '    <span class="bay__arrow">' + UI.icon('arrow-right') + '</span>' +
      '  </div>' +
      '</a>'
    );
  }

  function nextDirective(snapshot) {
    var journey = snapshot.journey;
    var progress = snapshot.progress;
    var orientation = journey.orientation || {};
    var completed = progress.completedStories + progress.completedLabs;

    if (!orientation.completed) {
      var step = (orientation.lastStep || 0) + 1;
      return {
        code: '01 / START',
        icon: 'compass',
        title: orientation.lastStep ? 'Continue getting started' : 'Finish getting started',
        desc: 'Five short screens and one question, then you are ready.',
        href: '#/orientation',
        cta: orientation.lastStep ? 'CONTINUE' : 'START'
      };
    }

    if (completed === 0) {
      return {
        code: '02 / FIRST STORY',
        icon: 'book',
        title: 'Open your first story',
        desc: 'Listen, answer one question, and your progress is saved.',
        href: '#/storylearn',
        cta: 'OPEN STORIES'
      };
    }

    return {
      code: '03 / KEEP GOING',
      icon: 'flag',
      title: 'Keep going',
      desc: 'You have ' + completed + ' finished item' + (completed === 1 ? '' : 's') + ' on this device. Open something new, or review your progress.',
      href: '#/record',
      cta: 'OPEN PROGRESS'
    };
  }

  async function hydrateStorage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      var value = document.getElementById('storage-value');
      if (value) value.textContent = 'NOT REPORTED';
      return;
    }
    try {
      var estimate = await navigator.storage.estimate();
      var usage = (estimate.usage || 0) + 290 * 1024; // app shell + fonts are not always counted
      var quota = estimate.quota || 25 * 1024 * 1024;
      var percent = Math.min(100, Math.max(2, (usage / Math.min(quota, 25 * 1024 * 1024)) * 100));
      var valueEl = document.getElementById('storage-value');
      var fill = document.getElementById('storage-fill');
      if (valueEl) valueEl.textContent = UI.formatBytes(usage) + ' / 25 MB';
      if (fill) fill.style.width = percent.toFixed(1) + '%';
    } catch (err) {
      var fallback = document.getElementById('storage-value');
      if (fallback) fallback.textContent = 'READY / LOCAL';
    }
  }

  function faultMarkup(err) {
    return (
      '<section class="screen deck">' +
      '  <div class="panel panel--accent" style="padding:32px;border-left:2px solid var(--color-error)">' +
      '    <p class="eyebrow">HOME / PROBLEM</p>' +
      '    <h1 class="deck-title" style="font-size:clamp(2.2rem,4vw,3.4rem);margin-top:12px">Your saved work could not be loaded.</h1>' +
      '    <p class="lede" style="margin-top:12px">The app is running, but the student record could not be read. Check that this browser allows storage, then reload.</p>' +
      '    <div class="onboard-error" style="margin-top:16px">' + UI.escape(err && (err.message || String(err)) || 'Unknown storage error') + '</div>' +
      '    <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">' +
      '      <button class="btn btn-primary" onclick="location.reload()">RELOAD</button>' +
      '      <a class="btn btn-secondary" href="#/record">OPEN PROGRESS</a>' +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  window.StoryLabDashboard = { mount: mount };
  console.log('[Dashboard] window.StoryLabDashboard ready');
})();
