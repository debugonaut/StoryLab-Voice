/**
 * StoryLab Voice — local ledger (IndexedDB)
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Stores
 *   progress      module-owned progress (StoryLearn, LabInBox write here)
 *   profile       the student currently using this terminal
 *   journey       foundation-owned completion, badges, orientation record
 *   sessions      start/close records for a learning session
 *   events        local activity log
 *   sync_queue    outbound events waiting for a connection
 *   sync_archive  events already handed to the sync mirror
 *
 * Public API (contract — do not break)
 *   DB.save(store, key, value) -> Promise
 *   DB.load(store, key)        -> Promise<value>
 *   DB.getAll(store)           -> Promise<Array>
 *   DB.remove(store, key)      -> Promise
 *   DB.getAllWithKeys(store)   -> Promise<[{key, value}]>
 *   DB.count(store)            -> Promise<number>
 *   DB.clear(store)            -> Promise
 *   DB.queueSync(payload)      -> Promise
 */
;(function () {
  'use strict';

  var DB_NAME = 'storylab_v1';
  var DB_VERSION = 2;
  var _db = null;

  var STORES = {
    progress: { keyPath: null, autoIncrement: false },
    profile: { keyPath: null, autoIncrement: false },
    journey: { keyPath: null, autoIncrement: false },
    sessions: { keyPath: 'id', autoIncrement: false },
    events: { keyPath: 'id', autoIncrement: true },
    sync_queue: { keyPath: null, autoIncrement: true },
    sync_archive: { keyPath: null, autoIncrement: true }
  };

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (_db) return resolve(_db);
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available on this device.'));
        return;
      }

      var req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (event) {
        var db = event.target.result;
        Object.keys(STORES).forEach(function (name) {
          if (db.objectStoreNames.contains(name)) return;
          var config = STORES[name];
          var options = { autoIncrement: !!config.autoIncrement };
          if (config.keyPath) options.keyPath = config.keyPath;
          db.createObjectStore(name, options);
        });
      };

      req.onsuccess = function (event) {
        _db = event.target.result;
        _db.onversionchange = function () {
          _db.close();
          _db = null;
        };
        resolve(_db);
      };

      req.onerror = function (event) {
        console.error('[DB] Open failed:', event.target.error);
        reject(event.target.error || new Error('Could not open local ledger.'));
      };

      req.onblocked = function () {
        console.warn('[DB] Upgrade blocked by another open tab.');
      };
    });
  }

  function assertStore(storeName) {
    if (!STORES[storeName]) {
      throw new Error('[DB] Unknown store: ' + storeName);
    }
  }

  function save(storeName, key, value) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var req;
        if (STORES[storeName].keyPath) {
          // Older v2 databases created the events store without autoIncrement.
          // Give every key-path record an explicit id so both schemas work.
          if (STORES[storeName].keyPath === 'id' && (value.id === undefined || value.id === null)) {
            value = Object.assign({}, value, {
              id: 'E-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 900 + 100)
            });
          }
          req = store.put(value);
        } else if (key === undefined || key === null) {
          req = store.put(value);
        } else {
          req = store.put(value, key);
        }
        tx.oncomplete = function () {
          resolve(req.result);
        };
        tx.onerror = function (event) {
          console.error('[DB] Save failed:', event.target.error);
          reject(event.target.error);
        };
        tx.onabort = function () {
          reject(tx.error || new Error('Transaction aborted'));
        };
      });
    });
  }

  function load(storeName, key) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).get(key);
        req.onsuccess = function (event) {
          resolve(event.target.result);
        };
        req.onerror = function (event) {
          reject(event.target.error);
        };
      });
    });
  }

  function getAll(storeName) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).getAll();
        req.onsuccess = function (event) {
          resolve(event.target.result || []);
        };
        req.onerror = function (event) {
          reject(event.target.error);
        };
      });
    });
  }

  function getAllWithKeys(storeName) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var out = [];
        var req = store.openCursor();
        req.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            out.push({ key: cursor.key, value: cursor.value });
            cursor.continue();
          } else {
            resolve(out);
          }
        };
        req.onerror = function (event) {
          reject(event.target.error);
        };
      });
    });
  }

  function remove(storeName, key) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function (event) { reject(event.target.error); };
      });
    });
  }

  function count(storeName) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).count();
        req.onsuccess = function (event) { resolve(event.target.result || 0); };
        req.onerror = function (event) { reject(event.target.error); };
      });
    });
  }

  function clear(storeName) {
    assertStore(storeName);
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function (event) { reject(event.target.error); };
      });
    });
  }

  function queueSync(payload) {
    var event = {
      type: (payload && payload.type) || 'analytics',
      payload: (payload && payload.payload) || payload || {},
      studentId: (payload && payload.studentId) || null,
      sessionId: (payload && payload.sessionId) || null,
      timestamp: (payload && payload.timestamp) || Date.now(),
      attempts: 0
    };
    return save('sync_queue', undefined, event);
  }

  window.DB = {
    save: save,
    load: load,
    getAll: getAll,
    getAllWithKeys: getAllWithKeys,
    remove: remove,
    count: count,
    clear: clear,
    queueSync: queueSync,
    open: openDB,
    name: DB_NAME,
    version: DB_VERSION
  };

  console.log('[DB] window.DB ready (v' + DB_VERSION + ')');
})();
