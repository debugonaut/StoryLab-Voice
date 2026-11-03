/**
 * StoryLab Voice — foundation state
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Exports: window.StoryLabState
 *   init(), getSnapshot(), getProfile(), saveProfile(), hasProfile()
 *   getJourney(), saveJourney(), completeOrientation(), saveOrientationStep()
 *   getModuleProgress(), getProgressSummary()
 *   startSession(), endSession(), getActiveSession(), getSessions(), getSessionStats()
 *   logEvent(), getEvents(), getPendingCount(), flushQueue(), requestBackgroundSync()
 *   exportRecord(), resetUnit(), setLanguage()
 *
 * This layer owns only foundation data. Module progress is read from the
 * 'progress' store that Parts 1 and 3 write through window.DB.
 */
;(function () {
  'use strict';

  var PROFILE_KEY = 'student';
  var JOURNEY_KEY = 'student';
  var ACTIVE_SESSION_KEY = 'storylab_active_session';
  var LANG_MAP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

  var _profile = null;
  var _journey = null;
  var _events = [];
  var _pending = 0;
  var _initialized = false;
  var _initPromise = null;
  var _flushing = null;
  var _error = null;

  function now() {
    return Date.now();
  }

  function emit(type) {
    try {
      window.dispatchEvent(new CustomEvent('storylab:state', {
        detail: { type: type || 'change', pending: _pending }
      }));
    } catch (err) {
      /* CustomEvent is available in target browsers; ignore if not. */
    }
  }

  function defaultJourney() {
    return {
      version: 1,
      createdAt: now(),
      orientation: {
        completed: false,
        score: 0,
        total: 0,
        attempts: 0,
        lastStep: 0,
        startedAt: null,
        completedAt: null
      },
      badges: [],
      stats: {
        sessionsStarted: 0,
        totalTimeMs: 0
      }
    };
  }

  function normalizeJourney(value) {
    var base = defaultJourney();
    if (!value || typeof value !== 'object') return base;
    return {
      version: 1,
      createdAt: value.createdAt || base.createdAt,
      orientation: Object.assign({}, base.orientation, value.orientation || {}),
      badges: Array.isArray(value.badges) ? value.badges.slice() : [],
      stats: Object.assign({}, base.stats, value.stats || {})
    };
  }

  function generateStudentId() {
    var year = new Date().getFullYear();
    var random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return 'SLV-' + year + '-' + random;
  }

  function applyLanguage(language) {
    var tag = LANG_MAP[language] || LANG_MAP.en;
    document.documentElement.lang = tag;
  }

  function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async function () {
      try {
        var profile = await window.DB.load('profile', PROFILE_KEY);
        var journey = await window.DB.load('journey', JOURNEY_KEY);
        _profile = profile || null;
        _journey = normalizeJourney(journey);
        if (_profile) applyLanguage(_profile.language);
        _events = await loadRecentEvents(14);
        _pending = await window.DB.count('sync_queue');
        _error = null;
      } catch (err) {
        _error = err;
        console.error('[State] init failed:', err);
      }
      _initialized = true;
      emit('init');
      return getCachedSnapshot();
    })();
    return _initPromise;
  }

  async function loadRecentEvents(limit) {
    var all = await window.DB.getAll('events');
    all.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return all.slice(0, limit || 14);
  }

  function hasProfile() {
    return !!(_profile && _profile.name);
  }

  function getProfile() {
    return _profile;
  }

  async function saveProfile(partial) {
    var current = _profile || {};
    var next = Object.assign({}, current, partial || {});
    next.updatedAt = now();
    if (!next.id) next.id = generateStudentId();
    if (!next.createdAt) next.createdAt = now();
    if (!next.language) next.language = 'en';
    if (!next.avatar) next.avatar = 'sun';
    if (!next.grade) next.grade = '5';
    _profile = next;
    applyLanguage(next.language);
    await window.DB.save('profile', PROFILE_KEY, next);
    emit('profile');
    return next;
  }

  function getJourney() {
    return _journey || defaultJourney();
  }

  async function saveJourney(next) {
    _journey = normalizeJourney(next);
    await window.DB.save('journey', JOURNEY_KEY, _journey);
    emit('journey');
    return _journey;
  }

  async function saveOrientationStep(stepIndex) {
    var journey = getJourney();
    journey.orientation.lastStep = Math.max(0, Number(stepIndex) || 0);
    if (!journey.orientation.startedAt) journey.orientation.startedAt = now();
    await saveJourney(journey);
  }

  async function completeOrientation(result) {
    var journey = getJourney();
    var score = Number(result && result.score) || 0;
    var total = Number(result && result.total) || 0;
    journey.orientation.completed = true;
    journey.orientation.score = score;
    journey.orientation.total = total;
    journey.orientation.attempts = (journey.orientation.attempts || 0) + 1;
    journey.orientation.firstTry = Number(result && result.firstTry) || 0;
    journey.orientation.completedAt = now();
    journey.orientation.lastStep = 0;
    if (!journey.orientation.startedAt) journey.orientation.startedAt = now();

    var badgeExists = journey.badges.some(function (badge) {
      return badge && badge.id === 'first-shift';
    });
    if (!badgeExists) {
      journey.badges.push({
        id: 'first-shift',
        label: 'First Shift',
        detail: 'Completed terminal orientation',
        awardedAt: now()
      });
    }

    await saveJourney(journey);
    await logEvent('orientation.completed', 'Completed First Shift briefing', {
      score: score,
      total: total,
      durationMs: (result && result.durationMs) || 0,
      correct: result && typeof result.correct === 'number' ? result.correct : score,
      firstTry: Number(result && result.firstTry) || 0
    });
    return journey;
  }

  async function getModuleProgress() {
    try {
      var progress = await window.DB.load('progress', 'student');
      return progress && typeof progress === 'object' ? progress : {};
    } catch (err) {
      console.warn('[State] Could not read module progress:', err);
      return {};
    }
  }

  function summarizeProgress(progress) {
    var data = progress || {};
    var stories = data.stories && typeof data.stories === 'object' ? data.stories : {};
    var labs = data.labs && typeof data.labs === 'object' ? data.labs : {};
    var storyValues = Object.keys(stories).map(function (key) { return stories[key]; });
    var labValues = Object.keys(labs).map(function (key) { return labs[key]; });

    var completedStories = storyValues.filter(function (item) {
      return item && item.completed;
    }).length;
    var completedLabs = labValues.filter(function (item) {
      return item && item.completed;
    }).length;

    var lastTouched = 0;
    storyValues.concat(labValues).forEach(function (item) {
      if (item && item.timestamp && item.timestamp > lastTouched) lastTouched = item.timestamp;
    });

    return {
      stories: stories,
      labs: labs,
      storyCount: storyValues.length,
      labCount: labValues.length,
      completedStories: completedStories,
      completedLabs: completedLabs,
      totalCompleted: completedStories + completedLabs,
      lastTouched: lastTouched
    };
  }

  async function getProgressSummary() {
    return summarizeProgress(await getModuleProgress());
  }

  async function logEvent(type, label, meta, options) {
    var opts = options || {};
    var profile = _profile;
    var active = getActiveSession();
    var event = {
      type: type || 'activity',
      label: label || type || 'Activity',
      meta: meta || {},
      ts: now(),
      studentId: profile ? profile.id : null,
      sessionId: active ? active.id : null
    };

    try {
      await window.DB.save('events', undefined, event);
      _events.unshift(event);
      _events = _events.slice(0, 14);

      if (opts.sync !== false) {
        await window.DB.queueSync({
          type: event.type,
          payload: {
            label: event.label,
            meta: event.meta,
            ts: event.ts
          },
          studentId: event.studentId,
          sessionId: event.sessionId,
          timestamp: event.ts
        });
        _pending += 1;
        requestBackgroundSync();
      }
      emit('event');
    } catch (err) {
      console.error('[State] Could not record event:', err);
    }
    return event;
  }

  function getEvents() {
    return _events.slice();
  }

  async function getEventsFromStore(limit) {
    var all = await window.DB.getAll('events');
    all.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return all.slice(0, limit || 40);
  }

  function getActiveSession() {
    try {
      var raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.id ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  async function startSession() {
    var existing = getActiveSession();
    if (existing) return existing;

    var profile = _profile;
    if (!profile) return null;

    var session = {
      id: 'S-' + now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 900 + 100),
      studentId: profile.id,
      startedAt: now(),
      endedAt: null,
      durationMs: 0,
      routes: []
    };

    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      await window.DB.save('sessions', session.id, session);
      var journey = getJourney();
      journey.stats.sessionsStarted = (journey.stats.sessionsStarted || 0) + 1;
      await saveJourney(journey);
      await logEvent('session.started', 'Opened a learning session', {}, { sync: false });
    } catch (err) {
      console.error('[State] Could not start session:', err);
    }
    return session;
  }

  async function endSession() {
    var active = getActiveSession();
    if (!active) return null;

    var endedAt = now();
    var durationMs = Math.max(0, endedAt - (active.startedAt || endedAt));
    var record = Object.assign({}, active, { endedAt: endedAt, durationMs: durationMs });

    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      await window.DB.save('sessions', record.id, record);

      var journey = getJourney();
      journey.stats.totalTimeMs = (journey.stats.totalTimeMs || 0) + durationMs;
      await saveJourney(journey);

      await logEvent('session.closed', 'Closed the learning session', {
        durationMs: durationMs
      });
    } catch (err) {
      console.error('[State] Could not close session:', err);
    }
    return record;
  }

  async function getSessions() {
    try {
      var sessions = await window.DB.getAll('sessions');
      sessions.sort(function (a, b) { return (b.startedAt || 0) - (a.startedAt || 0); });
      return sessions;
    } catch (err) {
      return [];
    }
  }

  async function getSessionStats() {
    var sessions = await getSessions();
    var closed = sessions.filter(function (item) { return item.endedAt; });
    var totalTime = closed.reduce(function (sum, item) {
      return sum + (item.durationMs || 0);
    }, 0);
    var active = getActiveSession();
    var activeElapsed = active ? Math.max(0, now() - active.startedAt) : 0;
    return {
      count: closed.length,
      totalTimeMs: totalTime + activeElapsed,
      active: active,
      activeElapsed: activeElapsed,
      sessions: sessions
    };
  }

  async function getPendingCount() {
    try {
      _pending = await window.DB.count('sync_queue');
    } catch (err) {
      _pending = 0;
    }
    return _pending;
  }

  async function getArchiveCount() {
    try {
      return await window.DB.count('sync_archive');
    } catch (err) {
      return 0;
    }
  }

  function requestBackgroundSync() {
    if (!('serviceWorker' in navigator)) return;
    // Register while offline so the browser replays the queue on reconnect.
    // When online, the record's sync centre is the visible control; a manual
    // flush or the online handler drains it, which keeps the ledger demoable.
    if (navigator.onLine) return;
    navigator.serviceWorker.ready.then(function (registration) {
      if (registration && 'sync' in registration) {
        registration.sync.register('storylab-sync').catch(function () {
          /* Background Sync is optional; the online handler also flushes. */
        });
      }
    }).catch(function () {});
  }

  function delay(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  async function flushQueue() {
    if (_flushing) return _flushing;

    _flushing = (async function () {
      var entries = await window.DB.getAllWithKeys('sync_queue');
      if (!entries.length) {
        _pending = 0;
        emit('sync');
        return { count: 0, mode: 'idle', at: now() };
      }

      if (!navigator.onLine) {
        var offlineError = new Error('No connection. The ledger will sync when the terminal is back online.');
        offlineError.code = 'offline';
        throw offlineError;
      }

      var endpoint = window.STORYLAB_SYNC_ENDPOINT || null;
      var mode = endpoint ? 'remote' : 'local-mirror';

      if (endpoint) {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student: _profile ? { id: _profile.id, grade: _profile.grade, language: _profile.language } : null,
            events: entries.map(function (entry) { return entry.value; })
          })
        });
        if (!response.ok) {
          throw new Error('Sync endpoint returned HTTP ' + response.status);
        }
      } else {
        /* Prototype: no cloud backend exists yet, so the queue is
           mirrored into the local archive. The pipeline is the same. */
        await delay(420);
      }

      var syncedAt = now();
      var archived = 0;
      for (var i = 0; i < entries.length; i += 1) {
        var entry = entries[i];
        await window.DB.save('sync_archive', undefined, Object.assign({}, entry.value, {
          syncedAt: syncedAt,
          mode: mode
        }));
        await window.DB.remove('sync_queue', entry.key);
        archived += 1;
      }

      _pending = await window.DB.count('sync_queue');
      emit('sync');
      return { count: archived, mode: mode, at: syncedAt };
    })();

    try {
      return await _flushing;
    } finally {
      _flushing = null;
    }
  }

  async function getSyncEntries(limit) {
    try {
      var entries = await window.DB.getAllWithKeys('sync_queue');
      return entries.slice(0, limit || 8).map(function (entry) { return entry.value; });
    } catch (err) {
      return [];
    }
  }

  function getCachedSnapshot() {
    return {
      profile: _profile,
      journey: getJourney(),
      events: getEvents(),
      pending: _pending,
      activeSession: getActiveSession(),
      error: _error
    };
  }

  async function getSnapshot() {
    await init();
    var progress = await getProgressSummary();
    var sessions = await getSessionStats();
    var pending = await getPendingCount();
    var archiveCount = await getArchiveCount();
    var events = await getEventsFromStore(14);
    _events = events;
    return {
      profile: _profile,
      journey: getJourney(),
      progress: progress,
      sessions: sessions,
      pending: pending,
      archiveCount: archiveCount,
      events: events,
      activeSession: sessions.active,
      error: _error
    };
  }

  async function exportRecord() {
    var snapshot = await getSnapshot();
    var allEvents = await getEventsFromStore(500);
    var sessions = await getSessions();
    var archiveCount = await getArchiveCount();
    return {
      product: 'StoryLab Voice',
      schema: 'slv-learning-record/1',
      exportedAt: new Date().toISOString(),
      foundationVersion: '1.0.0',
      profile: snapshot.profile,
      journey: snapshot.journey,
      moduleProgress: snapshot.progress,
      sessions: sessions,
      events: allEvents,
      sync: {
        pending: snapshot.pending,
        archived: archiveCount,
        mode: window.STORYLAB_SYNC_ENDPOINT ? 'remote' : 'local-mirror'
      }
    };
  }

  async function resetUnit() {
    await window.DB.clear('profile');
    await window.DB.clear('journey');
    await window.DB.clear('sessions');
    await window.DB.clear('events');
    await window.DB.clear('sync_queue');
    await window.DB.clear('sync_archive');
    await window.DB.clear('progress');
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem('storylab_profile_draft');
    } catch (err) { /* ignore storage restrictions */ }
    _profile = null;
    _journey = defaultJourney();
    _events = [];
    _pending = 0;
    _initialized = false;
    _initPromise = null;
    document.documentElement.lang = 'en-IN';
    emit('reset');
  }

  async function setLanguage(language) {
    if (!_profile) return;
    await saveProfile({ language: language });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (event) {
      if (!event.data || event.data.type !== 'SYNC_COMPLETE') return;
      getPendingCount().then(function () {
        emit('sync');
        window.dispatchEvent(new CustomEvent('storylab:synced', {
          detail: { count: event.data.count || 0 }
        }));
      });
    });
  }

  window.StoryLabState = {
    init: init,
    getSnapshot: getSnapshot,
    getCachedSnapshot: getCachedSnapshot,
    getProfile: getProfile,
    saveProfile: saveProfile,
    hasProfile: hasProfile,
    getJourney: getJourney,
    saveJourney: saveJourney,
    saveOrientationStep: saveOrientationStep,
    completeOrientation: completeOrientation,
    getModuleProgress: getModuleProgress,
    getProgressSummary: getProgressSummary,
    startSession: startSession,
    endSession: endSession,
    getActiveSession: getActiveSession,
    getSessions: getSessions,
    getSessionStats: getSessionStats,
    logEvent: logEvent,
    getEvents: getEvents,
    getEventsFromStore: getEventsFromStore,
    getPendingCount: getPendingCount,
    getArchiveCount: getArchiveCount,
    getSyncEntries: getSyncEntries,
    flushQueue: flushQueue,
    requestBackgroundSync: requestBackgroundSync,
    exportRecord: exportRecord,
    resetUnit: resetUnit,
    setLanguage: setLanguage
  };

  console.log('[State] window.StoryLabState ready');
})();
