/**
 * StoryLab Voice — Service Worker
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Strategy
 *   navigation  network-first, cache fallback (offline shell)
 *   assets      stale-while-revalidate
 *   fonts/icons cache-first
 *   background sync  drain sync_queue into sync_archive
 */

var CACHE_VERSION = 'storylab-v8';
var DB_NAME = 'storylab_v1';
var DB_VERSION = 2;

var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/tokens.css',
  './styles/global.css',
  './styles/screens.css',
  './src/shell/ui.js',
  './src/shell/db.js',
  './src/shell/state.js',
  './src/shell/onboarding.js',
  './src/shell/dashboard.js',
  './src/shell/record.js',
  './src/shell/offline.js',
  './src/shell/router.js',
  './src/storylearn/storylearn.js',
  './src/chatbot/chatbot.js',
  './src/labinbox/labinbox.js',
  './data/stories/index.json',
  './data/stories/math-market.json',
  './data/stories/math-fractions.json',
  './data/stories/math-shapes.json',
  './data/stories/science-plants.json',
  './data/stories/science-water.json',
  './data/stories/science-solar.json',
  './data/stories/social-map.json',
  './data/stories/social-village.json',
  './data/stories/evs-animals.json',
  './assets/stories/math-market.jpg',
  './assets/stories/math-fractions.jpg',
  './assets/stories/math-shapes.jpg',
  './assets/stories/science-plants.jpg',
  './assets/stories/science-water.jpg',
  './assets/stories/science-solar.jpg',
  './assets/stories/social-map.jpg',
  './assets/stories/social-village.jpg',
  './assets/stories/evs-animals.jpg',
  './data/labs/index.json',
  './data/labs/acid-base.json',
  './data/labs/salt-dissolving.json',
  './data/orientation/first-shift.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './assets/fonts/google-sans-flex-300-800-latin.woff2',
  './assets/fonts/google-sans-flex-300-800-latin-ext.woff2',
  './assets/fonts/google-sans-code-400-600-latin.woff2',
  './assets/fonts/google-sans-code-400-600-latin-ext.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(url).catch(function (err) {
          console.warn('[SW] Could not precache:', url, err.message);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE_VERSION;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isNavigation(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept') &&
      request.headers.get('accept').indexOf('text/html') !== -1);
}

function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200 && response.type === 'basic') {
      var copy = response.clone();
      caches.open(CACHE_VERSION).then(function (cache) {
        cache.put(request, copy);
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      return cached || caches.match('./index.html');
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(function (cached) {
    var network = fetch(request).then(function (response) {
      if (response && response.status === 200 && response.type === 'basic') {
        var copy = response.clone();
        caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    }).catch(function () {
      return cached;
    });
    return cached || network;
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response && response.status === 200) {
        var copy = response.clone();
        caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    });
  });
}

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigation(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (/\.(woff2|svg|png|jpg|jpeg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

/* ------------------------------------------------------------
   Background Sync — flush the queue from the service worker
   so records move even if the app tab is closed.
   ------------------------------------------------------------ */
self.addEventListener('sync', function (event) {
  if (event.tag === 'storylab-sync') {
    event.waitUntil(flushQueue());
  }
});

function openLedger() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function (event) {
      var db = event.target.result;
      if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress');
      if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile');
      if (!db.objectStoreNames.contains('journey')) db.createObjectStore('journey');
      if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { autoIncrement: true });
      if (!db.objectStoreNames.contains('sync_archive')) db.createObjectStore('sync_archive', { autoIncrement: true });
    };
    req.onsuccess = function (event) { resolve(event.target.result); };
    req.onerror = function (event) { reject(event.target.error); };
  });
}

function flushQueue() {
  return openLedger().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(['sync_queue', 'sync_archive'], 'readwrite');
      var queue = tx.objectStore('sync_queue');
      var archive = tx.objectStore('sync_archive');
      var count = 0;
      var cursorReq = queue.openCursor();

      cursorReq.onsuccess = function (event) {
        var cursor = event.target.result;
        if (!cursor) return;
        var value = cursor.value || {};
        archive.add(Object.assign({}, value, {
          syncedAt: Date.now(),
          mode: 'background-sync'
        }));
        cursor.delete();
        count += 1;
        cursor.continue();
      };

      tx.oncomplete = function () {
        if (count > 0) {
          self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
            clients.forEach(function (client) {
              client.postMessage({ type: 'SYNC_COMPLETE', count: count, mode: 'background-sync' });
            });
          });
        }
        resolve(count);
      };
      tx.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }).then(function (count) {
    return count;
  }).catch(function (err) {
    console.warn('[SW] Background flush failed:', err);
    throw err;
  });
}
