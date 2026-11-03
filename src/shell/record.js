/**
 * StoryLab Voice — learning record
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * window.StoryLabRecord.mount(root) -> cleanup
 */
;(function () {
  'use strict';

  var UI = window.StoryLabUI;
  var State = window.StoryLabState;
  var LANG_NAMES = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
  var LANG_TAGS = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
  var recordTimer = null;
  var pendingScroll = null;

  function mount(root) {
    var disposed = false;
    if (recordTimer) {
      window.clearInterval(recordTimer);
      recordTimer = null;
    }

    root.innerHTML = loadingMarkup();

    Promise.all([
      State.getSnapshot(),
      State.getSessions(),
      State.getSyncEntries(8),
      window.DB.getAll('sync_archive'),
      loadIndexes()
    ]).then(function (results) {
      if (disposed) return;
      var snapshot = results[0];
      var sessions = results[1];
      var queue = results[2];
      var archive = results[3] || [];
      var indexes = results[4];

      if (!snapshot.profile) {
        pendingScroll = null;
        window.StoryLabRouter.navigate('onboarding');
        return;
      }

      var lastSync = archive.reduce(function (latest, item) {
        return (item && item.syncedAt && item.syncedAt > latest) ? item.syncedAt : latest;
      }, 0);

      root.innerHTML = recordMarkup(snapshot, sessions, queue, archive.length, lastSync, indexes);
      bindActions(root, snapshot, queue, archive.length);
      startSessionTimer(snapshot.sessions.active);

      if (pendingScroll != null) {
        var target = pendingScroll;
        pendingScroll = null;
        window.requestAnimationFrame(function () {
          window.scrollTo({ top: target, left: 0, behavior: 'auto' });
        });
      }
    }).catch(function (err) {
      console.error('[Record] Could not load record:', err);
      pendingScroll = null;
      if (disposed) return;
      root.innerHTML =
        '<div class="panel panel--accent" style="padding:32px">' +
        '<p class="eyebrow">RECORD / FAULT</p>' +
        '<h1 class="step-title" style="margin-top:10px">The learning record could not be read.</h1>' +
        '<p class="lede" style="margin-top:12px">' + UI.escape(err.message || String(err)) + '</p>' +
        '<a class="btn btn-secondary" style="margin-top:18px" href="#/home">← BACK TO DECK</a>' +
        '</div>';
    });

    return function cleanup() {
      disposed = true;
      if (recordTimer) {
        window.clearInterval(recordTimer);
        recordTimer = null;
      }
    };
  }

  function loadingMarkup() {
    return (
      '<section class="screen record">' +
      '  <div class="panel panel--accent" style="padding:32px">' +
      '    <p class="eyebrow">LEARNING RECORD / OPENING FILE</p>' +
      '    <h1 class="deck-title" style="font-size:clamp(2rem,4vw,3rem);margin-top:10px">Pulling the record.</h1>' +
      '    <div class="meter" style="margin-top:18px;max-width:320px"><div class="meter__fill" style="width:52%"></div></div>' +
      '  </div>' +
      '</section>'
    );
  }

  async function loadIndexes() {
    var result = { stories: [], labs: [] };
    try {
      var responses = await Promise.all([
        fetch('data/stories/index.json').then(function (r) { return r.ok ? r.json() : []; }),
        fetch('data/labs/index.json').then(function (r) { return r.ok ? r.json() : []; })
      ]);
      if (Array.isArray(responses[0])) result.stories = responses[0];
      if (Array.isArray(responses[1])) result.labs = responses[1];
    } catch (err) {
      /* Titles are optional; IDs still render. */
    }
    return result;
  }

  function recordMarkup(snapshot, sessions, queue, archiveCount, lastSync, indexes) {
    var profile = snapshot.profile;
    var journey = snapshot.journey;
    var progress = snapshot.progress;
    var orientationDone = !!(journey.orientation && journey.orientation.completed);
    var active = snapshot.sessions.active;
    var sessionCount = snapshot.sessions.count;
    var totalTime = snapshot.sessions.totalTimeMs;
    var pending = snapshot.pending || 0;
    var badges = journey.badges || [];
    var events = snapshot.events || [];
    var language = LANG_NAMES[profile.language] || 'English';
    var checkpoints = progress.completedStories + progress.completedLabs + (orientationDone ? 1 : 0);
    var activeElapsed = snapshot.sessions.activeElapsed || 0;

    return (
      '<section class="screen record">' +
      '  <div class="print-only">STORYLAB VOICE / LEARNING RECORD / ' + UI.escape(profile.id) + ' / PRINTED ' + UI.formatDateTime(new Date()) + '</div>' +
      '  <header class="screen-head record-head">' +
      '    <div>' +
      '      <p class="eyebrow">STUDENT FILE / ' + UI.escape(profile.id) + '</p>' +
      '      <h1 class="screen-head__title">Learning record</h1>' +
      '      <p class="screen-head__sub">Everything the terminal has saved on this device: orientation, sessions, module progress, and the sync ledger.</p>' +
      '    </div>' +
      '    <div class="record-actions">' +
      '      <button type="button" class="btn btn-secondary" id="export-record">' + UI.icon('download') + ' EXPORT JSON</button>' +
      '      <button type="button" class="btn btn-secondary" id="print-record">' + UI.icon('printer') + ' PRINT</button>' +
      '    </div>' +
      '  </header>' +

      '  <div class="record-grid">' +
      '    <aside class="id-card panel">' +
      '      <div class="id-card__top">' +
      '        <div class="avatar avatar--lg">' + UI.avatar(profile.avatar) + '</div>' +
      '        <div>' +
      '          <div class="badge ' + (orientationDone ? 'badge--ok' : 'badge--warn') + '"><i class="led ' + (orientationDone ? 'led--ok' : 'led--warn') + '"></i> ' + (orientationDone ? 'COMMISSIONED' : 'PENDING') + '</div>' +
      '          <div class="id-card__name">' + UI.escape(profile.name) + '</div>' +
      '          <div class="id-card__id">' + UI.escape(profile.id) + '</div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="id-card__body">' +
      '        <div class="id-card__row"><em>GRADE</em><strong>' + UI.escape(profile.grade) + '</strong></div>' +
      '        <div class="id-card__row"><em>LANGUAGE</em><strong>' +
      '          <select class="language-select" id="language-select" aria-label="Change language">' +
      [['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']].map(function (pair) {
        return '<option value="' + pair[0] + '"' + (profile.language === pair[0] ? ' selected' : '') + '>' + pair[1] + '</option>';
      }).join('') +
      '          </select>' +
      '        </strong></div>' +
      '        <div class="id-card__row"><em>MICROPHONE</em><strong>' + (profile.mic === 'verified' ? 'VERIFIED' : profile.mic === 'touch' ? 'TOUCH MODE' : 'NOT TESTED') + '</strong></div>' +
      '        <div class="id-card__row"><em>MEMBER SINCE</em><strong>' + UI.formatDate(profile.createdAt, false) + '</strong></div>' +
      '        <div class="id-card__row"><em>RECORD</em><strong>LOCAL / DEVICE</strong></div>' +
      '      </div>' +
      '      <div class="badge-strip" style="margin-top:14px">' +
      (badges.length
        ? badges.map(function (badge) {
          return '<span class="badge badge--warn">' + UI.escape(badge.label || badge.id) + '</span>';
        }).join('')
        : '<span class="badge badge--muted">NO BADGES YET</span>') +
      '      </div>' +
      '      <div class="barcode" aria-hidden="true"></div>' +
      '      <div class="id-card__foot">This file is stored in IndexedDB on this device. It is not a cloud account. Closing the session does not delete it.</div>' +
      '    </aside>' +

      '    <div class="record-main">' +
      '      <div class="stat-row">' +
      '        <div class="stat-tile"><div class="stat-tile__value">' + String(sessionCount).padStart(2, '0') + '</div><div class="stat-tile__label">SESSIONS CLOSED</div><div class="stat-tile__sub">' + (active ? '01 open now' : 'No open session') + '</div></div>' +
      '        <div class="stat-tile"><div class="stat-tile__value">' + UI.formatMinutes(totalTime) + '</div><div class="stat-tile__label">TIME ON TASK</div><div class="stat-tile__sub">Including the open session</div></div>' +
      '        <div class="stat-tile"><div class="stat-tile__value is-accent">' + String(checkpoints).padStart(2, '0') + '</div><div class="stat-tile__label">CHECKPOINTS</div><div class="stat-tile__sub">Orientation + modules</div></div>' +
      '        <div class="stat-tile"><div class="stat-tile__value">' + String(pending).padStart(2, '0') + '</div><div class="stat-tile__label">SYNC QUEUE</div><div class="stat-tile__sub">' + (archiveCount ? archiveCount + ' archived' : 'Nothing archived yet') + '</div></div>' +
      '      </div>' +

      '      <section class="panel record-section">' +
      '        <div class="panel__header"><span class="panel__label">SESSION CONTROL</span><span class="panel__header-spacer"></span><span class="mono-label">' + (active ? 'OPEN' : 'CLOSED') + '</span></div>' +
      sessionMarkup(snapshot, sessions, active, activeElapsed) +
      '      </section>' +

      '      <section class="panel record-section">' +
      '        <div class="panel__header"><span class="panel__label">MODULE LEDGER / STORYLEARN + LAB IN BOX</span><span class="panel__header-spacer"></span><span class="mono-label">READ-ONLY AGGREGATE</span></div>' +
      ledgerMarkup(progress, indexes) +
      '      </section>' +

      '      <section class="panel record-section">' +
      '        <div class="panel__header"><span class="panel__label">SYNC CENTRE / LOCAL LEDGER</span><span class="panel__header-spacer"></span><span class="mono-label">' + (window.STORYLAB_SYNC_ENDPOINT ? 'REMOTE ENDPOINT' : 'LOCAL MIRROR') + '</span></div>' +
      syncMarkup(pending, queue, archiveCount, lastSync) +
      '      </section>' +

      '      <section class="panel record-section">' +
      '        <div class="panel__header"><span class="panel__label">ACTIVITY TIMELINE</span><span class="panel__header-spacer"></span><span class="mono-label">' + events.length + ' LOCAL EVENTS</span></div>' +
      timelineMarkup(events) +
      '      </section>' +

      '      <details class="panel record-section maintenance">' +
      '        <summary><span>UNIT CONTROLS / MAINTENANCE</span><span>' + UI.icon('chevron-down') + '</span></summary>' +
      '        <div class="maintenance__body">' +
      '          <p>These controls affect this device only. Export the learning record before wiping the unit if you need to hand it to a facilitator.</p>' +
      '          <div class="maintenance__row">' +
      '            <span class="mono-label">Replay the First Shift briefing</span>' +
      '            <a class="btn btn-secondary btn--sm" href="#/orientation">REPLAY BRIEFING</a>' +
      '          </div>' +
      '          <div class="maintenance__row">' +
      '            <span class="mono-label">Wipe profile, progress, sessions, and queue</span>' +
      '            <button type="button" class="btn btn-danger btn--sm" id="reset-unit">' + UI.icon('trash') + ' RESET UNIT</button>' +
      '          </div>' +
      '        </div>' +
      '      </details>' +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function sessionMarkup(snapshot, sessions, active, activeElapsed) {
    if (active) {
      return (
        '<div class="session-card">' +
        '  <div class="session-card__main">' +
        '    <div class="session-kicker"><span class="led led--ok led--pulse"></span> SESSION OPEN / ' + UI.escape(active.id) + '</div>' +
        '    <div class="session-clock is-live" id="session-clock">' + UI.formatDuration(activeElapsed) + '</div>' +
        '    <div class="session-meta">STARTED ' + UI.formatDateTime(active.startedAt) + ' / RECORD WRITES TO LOCAL LEDGER</div>' +
        '  </div>' +
        '  <div class="session-actions">' +
        '    <button type="button" class="btn btn-primary" id="end-session">' + UI.icon('power') + ' CLOSE SESSION</button>' +
        '  </div>' +
        '</div>'
      );
    }

    var last = sessions && sessions[0];
    return (
      '<div class="session-summary">' +
      '  <div class="session-card__main">' +
      '    <div class="session-kicker"><span class="led led--off"></span> NO OPEN SESSION</div>' +
      '    <div class="session-clock">—</div>' +
      '    <div class="session-meta">' + (last
        ? 'LAST SESSION ' + UI.formatDateTime(last.endedAt || last.startedAt) + ' / ' + UI.formatMinutes(last.durationMs || 0)
        : 'START A SESSION TO TIME THE NEXT STUDENT') + '</div>' +
      '  </div>' +
      '  <div class="session-actions">' +
      '    <button type="button" class="btn btn-primary" id="start-session">' + UI.icon('plus') + ' START NEW SESSION</button>' +
      '  </div>' +
      '</div>'
    );
  }

  function ledgerMarkup(progress, indexes) {
    var storyTitles = {};
    indexes.stories.forEach(function (item) { storyTitles[item.id] = item; });
    var labTitles = {};
    indexes.labs.forEach(function (item) { labTitles[item.id] = item; });

    var storyRows = Object.keys(progress.stories || {}).map(function (id) {
      var entry = progress.stories[id] || {};
      var meta = storyTitles[id] || {};
      return row(
        meta.title || id,
        meta.subject || 'StoryLearn',
        entry.completed ? 'COMPLETE' : 'IN PROGRESS',
        entry.timestamp || entry.completedAt || null
      );
    });

    var labRows = Object.keys(progress.labs || {}).map(function (id) {
      var entry = progress.labs[id] || {};
      var meta = labTitles[id] || {};
      return row(
        meta.title || id,
        meta.subject || 'LabInBox',
        entry.completed ? 'COMPLETE' : 'IN PROGRESS',
        entry.timestamp || entry.completedAt || null
      );
    });

    function row(title, subject, status, timestamp) {
      var cls = status === 'COMPLETE' ? 'badge--ok' : 'badge--warn';
      return (
        '<tr>' +
        '<td><strong>' + UI.escape(title) + '</strong></td>' +
        '<td class="mono">' + UI.escape(String(subject).toUpperCase()) + '</td>' +
        '<td><span class="badge ' + cls + '">' + status + '</span></td>' +
        '<td class="mono is-right">' + (timestamp ? UI.escape(UI.formatDate(timestamp, false)) : '—') + '</td>' +
        '</tr>'
      );
    }

    var hasRows = storyRows.length + labRows.length > 0;

    return (
      '<div class="record-section__body record-section__body--flush">' +
      '<table class="ledger-table">' +
      '<thead><tr><th>Module record</th><th>Subject</th><th>Status</th><th class="is-right">Last touched</th></tr></thead>' +
      '<tbody>' +
      (hasRows
        ? storyRows.join('') + labRows.join('')
        : '<tr><td colspan="4"><span class="text-muted" style="font-size:12px">No module progress has been written to this device yet.</span></td></tr>') +
      '</tbody>' +
      '</table>' +
      (hasRows ? '' :
        '<div class="ledger-empty"><span>Start with StoryLearn, or run a virtual experiment in Lab In Box.</span><a href="#/storylearn">OPEN A BAY →</a></div>') +
      '</div>'
    );
  }

  function syncMarkup(pending, queue, archiveCount, lastSync) {
    var online = navigator.onLine;
    var items = queue.length
      ? queue.map(function (entry) {
        return (
          '<div class="sync-item">' +
          '<span class="sync-item__type">' + UI.escape(entry.type || 'event') + '</span>' +
          '<span class="sync-item__time">' + UI.escape(UI.relativeTime(entry.timestamp)) + '</span>' +
          '</div>'
        );
      }).join('')
      : '<div class="sync-empty"><strong>QUEUE CLEAR</strong>Every local record has been moved to the sync archive.</div>';

    return (
      '<div class="sync-grid">' +
      '  <div class="sync-summary">' +
      '    <div class="sync-big ' + (pending ? '' : 'is-zero') + '">' + String(pending).padStart(2, '0') + '</div>' +
      '    <div class="sync-big-label">RECORDS WAITING</div>' +
      '    <div class="sync-meta">' +
      '      <div class="sync-meta__row"><span>NETWORK</span><strong style="color:' + (online ? 'var(--color-ok)' : 'var(--color-error)') + '">' + (online ? 'ONLINE' : 'OFFLINE') + '</strong></div>' +
      '      <div class="sync-meta__row"><span>LAST FLUSH</span><strong>' + (lastSync ? UI.relativeTime(lastSync) : 'NEVER') + '</strong></div>' +
      '      <div class="sync-meta__row"><span>ARCHIVED</span><strong>' + archiveCount + '</strong></div>' +
      '      <div class="sync-meta__row"><span>TARGET</span><strong>' + (window.STORYLAB_SYNC_ENDPOINT ? 'REMOTE' : 'LOCAL MIRROR') + '</strong></div>' +
      '    </div>' +
      '    <div class="sync-actions">' +
      '      <button type="button" class="btn btn-primary" id="sync-now"' + (!pending || !online ? ' disabled' : '') + '>' + UI.icon('sync') + ' FLUSH LEDGER</button>' +
      '      <button type="button" class="btn btn-secondary" id="sync-refresh">REFRESH</button>' +
      '    </div>' +
      '    <p class="sync-note">' + (window.STORYLAB_SYNC_ENDPOINT
        ? 'Queued records are POSTed to the configured endpoint, then archived locally. Failed flushes stay in the queue.'
        : 'Prototype mode: no cloud endpoint is configured, so flushed records land in a local archive. The queue, retry, and archive pipeline is real.') + '</p>' +
      '  </div>' +
      '  <div class="sync-list">' + items + '</div>' +
      '</div>'
    );
  }

  function timelineMarkup(events) {
    if (!events.length) {
      return '<div class="empty-state" style="margin:20px"><div class="empty-state__title">No activity recorded.</div><p class="empty-state__text">Enrolment, orientation, sessions, and sync flushes appear here automatically.</p></div>';
    }
    return (
      '<div class="timeline">' +
      events.map(function (event) {
        return (
          '<div class="timeline-item">' +
          '<div class="timeline-item__time">' + UI.escape(UI.formatClock(new Date(event.ts))) + '</div>' +
          '<div class="timeline-item__rail"></div>' +
          '<div class="timeline-item__body">' +
          '<div class="timeline-item__title">' + UI.escape(event.label) + '</div>' +
          '<div class="timeline-item__meta">' + UI.escape((event.type || 'activity').toUpperCase()) + ' / ' + UI.escape(UI.formatDate(event.ts, false)) + '</div>' +
          '</div>' +
          '</div>'
        );
      }).join('') +
      '</div>'
    );
  }

  function startSessionTimer(active) {
    if (recordTimer) {
      window.clearInterval(recordTimer);
      recordTimer = null;
    }
    if (!active) return;
    var started = active.startedAt;
    recordTimer = window.setInterval(function () {
      var clock = document.getElementById('session-clock');
      if (!clock) return;
      clock.textContent = UI.formatDuration(Date.now() - started);
    }, 1000);
  }

  // The record screen is rebuilt after every write so all aggregates stay in
  // sync. Keep the operator's place instead of snapping back to the top.
  function refreshRecord() {
    pendingScroll = window.scrollY;
    window.StoryLabRouter.navigate('record');
  }

  function bindActions(root, snapshot, queue) {
    var exportBtn = document.getElementById('export-record');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportRecord();
      });
    }

    var printBtn = document.getElementById('print-record');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    var endBtn = document.getElementById('end-session');
    if (endBtn) {
      endBtn.addEventListener('click', async function () {
        var confirmed = await UI.confirm({
          title: 'Close this learning session?',
          message: 'The session timer stops and the record is written to the local ledger. Progress from the learning modules stays intact. Start a new session for the next student.',
          confirmLabel: 'CLOSE SESSION',
          cancelLabel: 'KEEP OPEN'
        });
        if (!confirmed) return;
        endBtn.disabled = true;
        endBtn.textContent = 'CLOSING…';
        try {
          await State.endSession();
          await window.StoryLabNetwork.refresh();
          UI.toast({
            title: 'Session closed',
            message: 'Saved locally and queued for the sync ledger.',
            kind: 'ok'
          });
          refreshRecord();
        } catch (err) {
          console.error('[Record] Could not close session:', err);
          endBtn.disabled = false;
          endBtn.textContent = 'CLOSE SESSION';
          UI.toast({
            title: 'Session not closed',
            message: err.message || 'The local ledger rejected the write.',
            kind: 'error'
          });
        }
      });
    }

    var startBtn = document.getElementById('start-session');
    if (startBtn) {
      startBtn.addEventListener('click', async function () {
        startBtn.disabled = true;
        startBtn.textContent = 'STARTING…';
        await State.startSession();
        UI.toast({
          title: 'Session open',
          message: 'The timer is running. Work in any bay.',
          kind: 'ok'
        });
        refreshRecord();
      });
    }

    var syncBtn = document.getElementById('sync-now');
    if (syncBtn) {
      syncBtn.addEventListener('click', async function () {
        syncBtn.disabled = true;
        syncBtn.textContent = 'FLUSHING…';
        var result = await window.StoryLabNetwork.syncNow();
        if (result) {
          refreshRecord();
        } else {
          syncBtn.disabled = false;
          syncBtn.innerHTML = UI.icon('sync') + ' FLUSH LEDGER';
        }
      });
    }

    var refreshBtn = document.getElementById('sync-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        refreshRecord();
      });
    }

    var languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.addEventListener('change', async function () {
        var language = languageSelect.value;
        try {
          await State.saveProfile({
            language: language,
            languageTag: LANG_TAGS[language] || 'en-IN'
          });
          await State.logEvent('profile.language', 'Changed terminal language to ' + (LANG_NAMES[language] || language), {
            language: language
          }, { sync: false });
          UI.toast({
            title: 'Language updated',
            message: 'The terminal will use ' + (LANG_NAMES[language] || language) + ' for voice support.',
            kind: 'ok'
          });
          refreshRecord();
        } catch (err) {
          UI.toast({
            title: 'Language not saved',
            message: err.message || 'The local ledger rejected the update.',
            kind: 'error'
          });
        }
      });
    }

    var resetBtn = document.getElementById('reset-unit');
    if (resetBtn) {
      resetBtn.addEventListener('click', async function () {
        var confirmed = await UI.confirm({
          title: 'Reset this terminal?',
          message: 'This wipes the student profile, orientation, module progress, sessions, activity, and sync queue from this device. Export the record first if you need it. This cannot be undone.',
          confirmLabel: 'WIPE AND RESET',
          cancelLabel: 'KEEP EVERYTHING',
          danger: true
        });
        if (!confirmed) return;
        await State.resetUnit();
        if (window.StoryLabOnboarding && window.StoryLabOnboarding.reset) {
          window.StoryLabOnboarding.reset();
        }
        UI.toast({
          title: 'Unit reset',
          message: 'The terminal is ready for a new student.',
          kind: 'ok'
        });
        window.StoryLabRouter.navigate('onboarding');
      });
    }
  }

  async function exportRecord() {
    try {
      var data = await State.exportRecord();
      var filename = 'storylab-record-' + (data.profile && data.profile.id ? data.profile.id : 'local') + '.json';
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      UI.toast({
        title: 'Record exported',
        message: filename + ' downloaded.',
        kind: 'ok'
      });
    } catch (err) {
      console.error('[Record] Export failed:', err);
      UI.toast({
        title: 'Export failed',
        message: err.message || 'The record could not be assembled.',
        kind: 'error'
      });
    }
  }

  window.StoryLabRecord = { mount: mount };
  console.log('[Record] window.StoryLabRecord ready');
})();
