/**
 * StoryLab Voice — offline / network layer
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Exports: window.StoryLabNetwork
 *   isOnline(), onChange(fn), syncNow(), requestBackgroundSync(), refresh()
 *
 * Owns the offline banner, header network state, sync badge, PWA install
 * trigger, service worker registration, and update prompt.
 */
;(function () {
  'use strict';

  var _lastOnline = navigator.onLine;
  var _listeners = [];
  var _registration = null;
  var _booted = false;
  var _updateShown = false;
  var _reloadOnControllerChange = false;

  function $(id) {
    return document.getElementById(id);
  }

  function emit() {
    _listeners.forEach(function (listener) {
      try {
        listener(isOnline());
      } catch (err) {
        console.warn('[Network] listener failed:', err);
      }
    });
  }

  function isOnline() {
    return navigator.onLine;
  }

  function onChange(listener) {
    if (typeof listener === 'function') _listeners.push(listener);
    return function () {
      _listeners = _listeners.filter(function (item) { return item !== listener; });
    };
  }

  async function refresh() {
    var online = isOnline();
    var pending = 0;
    try {
      if (window.StoryLabState) pending = await window.StoryLabState.getPendingCount();
    } catch (err) {
      pending = 0;
    }
    paint(online, pending);
    return { online: online, pending: pending };
  }

  function paint(online, pending) {
    var banner = $('offline-banner');
    if (banner) banner.hidden = online;

    var chip = $('net-chip');
    if (chip) {
      chip.classList.toggle('status-chip--offline', !online);
      chip.classList.toggle('status-chip--ok', online);
      var label = $('net-label');
      if (label) label.textContent = online ? 'ONLINE' : 'OFFLINE';
      var dot = chip.querySelector('.status-dot');
      if (dot) {
        dot.className = 'status-dot ' + (online ? 'status-dot--ok' : 'status-dot--error');
      }
    }

    var syncChip = $('sync-chip');
    if (syncChip) {
      var count = $('sync-count');
      if (count) count.textContent = String(pending || 0);
      syncChip.hidden = !pending;
      syncChip.setAttribute(
        'aria-label',
        pending + ' record' + (pending === 1 ? '' : 's') + ' waiting to sync'
      );
    }

    document.body.classList.toggle('is-offline', !online);
  }

  function announce(message, kind) {
    if (!_booted || !window.StoryLabUI) return;
    window.StoryLabUI.toast({
      title: kind === 'ok' ? 'Connection restored' : 'Offline mode',
      message: message,
      kind: kind || 'info',
      timeout: 3800
    });
  }

  async function flush(silent) {
    if (!window.StoryLabState || !isOnline()) return null;
    try {
      var result = await window.StoryLabState.flushQueue();
      await refresh();
      if (!silent && result && result.count > 0) {
        var mode = result.mode === 'remote' ? 'server' : 'local archive';
        if (window.StoryLabUI) {
          window.StoryLabUI.toast({
            title: 'Sync ledger cleared',
            message: result.count + ' record' + (result.count === 1 ? '' : 's') + ' written to the ' + mode + '.',
            kind: 'ok'
          });
        }
      }
      return result;
    } catch (err) {
      if (err && err.code === 'offline') {
        if (!silent) {
          window.StoryLabUI && window.StoryLabUI.toast({
            title: 'Still offline',
            message: 'The ledger is safe. It will sync when the terminal reconnects.',
            kind: 'error'
          });
        }
      } else {
        console.warn('[Network] Sync failed:', err);
        if (!silent) {
          window.StoryLabUI && window.StoryLabUI.toast({
            title: 'Sync interrupted',
            message: err.message || 'The ledger could not be flushed.',
            kind: 'error'
          });
        }
      }
      return null;
    }
  }

  async function syncNow() {
    return flush(false);
  }

  function requestBackgroundSync() {
    if (!_registration || !('sync' in _registration)) return;
    _registration.sync.register('storylab-sync').catch(function () {
      /* Background Sync is a progressive enhancement. */
    });
  }

  function showUpdate(worker) {
    if (_updateShown) return;
    var chip = $('update-chip');
    if (!chip) return;
    _updateShown = true;
    chip.hidden = false;
    chip.addEventListener('click', function () {
      if (!worker) return;
      _reloadOnControllerChange = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      var cacheChip = $('cache-chip');
      if (cacheChip) cacheChip.textContent = 'NO CACHE';
      return;
    }

    navigator.serviceWorker.register('sw.js').then(function (registration) {
      _registration = registration;

      registration.addEventListener('updatefound', function () {
        var installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', function () {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdate(installing);
          }
        });
      });

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdate(registration.waiting);
      }

      var cacheChip = $('cache-chip');
      if (cacheChip) {
        cacheChip.textContent = navigator.serviceWorker.controller ? 'CACHE READY' : 'CACHING';
      }
    }).catch(function (err) {
      console.warn('[Network] Service Worker registration failed:', err);
    });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      var cacheChip = $('cache-chip');
      if (cacheChip) cacheChip.textContent = 'CACHE READY';
      if (_reloadOnControllerChange) window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', function (event) {
      if (!event.data || event.data.type !== 'SYNC_COMPLETE') return;
      refresh();
      if (window.StoryLabUI) {
        window.StoryLabUI.toast({
          title: 'Background sync complete',
          message: (event.data.count || 0) + ' queued record' + (event.data.count === 1 ? '' : 's') + ' archived.',
          kind: 'ok'
        });
      }
    });
  }

  function initInstallPrompt() {
    var installBtn = $('install-trigger');
    var deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      if (installBtn) installBtn.hidden = false;
    });

    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          if (choice && choice.outcome === 'accepted') {
            window.StoryLabUI && window.StoryLabUI.toast({
              title: 'Terminal installed',
              message: 'StoryLab Voice is now available from the home screen.',
              kind: 'ok'
            });
          }
          deferredPrompt = null;
          installBtn.hidden = true;
        });
      });
    }

    window.addEventListener('appinstalled', function () {
      if (installBtn) installBtn.hidden = true;
    });
  }

  function init() {
    initInstallPrompt();
    registerServiceWorker();

    window.addEventListener('online', function () {
      refresh().then(function () {
        announce('Everything saved locally is now being sent to the ledger.', 'ok');
        flush(false);
        emit();
      });
    });

    window.addEventListener('offline', function () {
      refresh().then(function () {
        announce('The terminal keeps working. Progress is saved on this device.', 'warn');
        emit();
      });
    });

    window.addEventListener('storylab:state', function () {
      if (window.StoryLabState) {
        window.StoryLabState.getPendingCount().then(function (pending) {
          paint(isOnline(), pending);
        });
      }
    });

    window.addEventListener('storylab:synced', function () {
      refresh();
    });

    window.addEventListener('online', emit);
    window.addEventListener('offline', emit);

    refresh();

    // Allow the boot animation to finish before showing network toasts.
    window.setTimeout(function () {
      _booted = true;
    }, 1600);

    if (isOnline()) {
      // Opportunistic flush: only archives if there is actually a queue.
      window.setTimeout(function () {
        if (window.StoryLabState) flush(true);
      }, 2600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.StoryLabNetwork = {
    isOnline: isOnline,
    onChange: onChange,
    refresh: refresh,
    syncNow: syncNow,
    requestBackgroundSync: requestBackgroundSync,
    get registration() { return _registration; }
  };

  console.log('[Network] window.StoryLabNetwork ready. Online:', isOnline());
})();
