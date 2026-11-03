# Offline Strategy — StoryLab Voice

> **Goal:** 100% functional classroom session with zero internet. Sync happens opportunistically on 2G/3G.

---

## The Problem

Rural schools: no WiFi, intermittent mobile data, Android tablets shared between students.  
The app must boot, run stories, run labs, and save progress **completely offline**.

---

## The Solution Stack (all built into the browser — no libraries needed)

| Layer | Technology | What it does |
|-------|-----------|--------------|
| Asset Cache | **Service Worker + CacheStorage** | Caches HTML, CSS, JS, JSON on first install |
| Data Store | **IndexedDB** (via thin wrapper `window.DB`) | Stores student progress, session state |
| Sync Queue | **Background Sync API** | Queues analytics events; flushes when back online |
| Voice | **Web Speech API** (SpeechSynthesis + SpeechRecognition) | 100% on-device, no network |
| Install | **PWA manifest + beforeinstallprompt** | "Add to Home Screen" = native-like app |

---

## Service Worker Strategy

### Cache-First for Static Assets

```
sw.js install event:
  - Pre-cache: index.html, styles/tokens.css, styles/global.css
  - Pre-cache: src/**/*.js
  - Pre-cache: data/stories/*.json
  - Pre-cache: data/labs/*.json
  - Pre-cache: manifest.webmanifest
```

**Fetch strategy:** Cache-first. If asset is in cache → serve immediately (no network hit).  
If not in cache → try network → cache the response → serve.

### Network-First for Analytics (when online)

Analytics POSTs go straight to server when online. When offline → Background Sync queue.

---

## IndexedDB Schema (simple — prototype only)

```
DB: storylab_v1
  store: progress
    key: studentId (string — set on first launch, stored in localStorage)
    value: {
      stories: { [storyId]: { completed: bool, score: int, lastStep: int } },
      labs:    { [labId]:   { completed: bool, steps:  string[] } }
    }

  store: sync_queue
    key: autoIncrement
    value: { type: "analytics", payload: {...}, timestamp: number }
```

**`window.DB` wrapper (Foundation builds this):**
```js
window.DB = {
  save(storeName, key, value) → Promise,
  load(storeName, key)        → Promise,
  getAll(storeName)           → Promise<Array>
}
```

Everyone calls `window.DB` — never touches IndexedDB directly.

---

## Background Sync for Analytics

1. When student completes a story/lab, write event to `sync_queue` store.
2. Register a Background Sync tag: `sw.registration.sync.register('analytics-flush')`.
3. Service Worker `sync` event handler:
   - Reads all rows from `sync_queue`
   - POSTs to `/api/sync` (teacher dashboard backend — out of scope for prototype, just `console.log`)
   - Clears queue on success.

> **For prototype:** teacher dashboard is out of scope. The sync queue just logs to console. The infrastructure is in place for real sync later.

---

## Offline Banner (Foundation builds this)

```js
window.addEventListener('online',  () => hideBanner());
window.addEventListener('offline', () => showBanner());
```

Banner style: amber strip at top of viewport. Mechanical stencil text: `◈ OFFLINE MODE — DATA SAVED LOCALLY`.

---

## Budget Check

| Asset | Estimated Size |
|-------|----------------|
| App shell (HTML/CSS/JS) | ~150 kB |
| Story JSON (10 stories × ~5 kB each) | ~50 kB |
| Lab JSON (5 labs × ~10 kB each) | ~50 kB |
| Web Speech API | 0 kB (browser built-in) |
| **Total** | **~250 kB** — well under 25 MB limit |

> Voice synthesis uses `SpeechSynthesis` (browser built-in). No audio files to cache.  
> If we add audio files later, budget accordingly. For prototype: zero audio files.

---

## PWA Install Flow

1. `manifest.webmanifest` declares: name, icons, `display: standalone`, `start_url: /`
2. On first visit, browser triggers `beforeinstallprompt` → app shows "Add to Home Screen" prompt.
3. Service Worker registers and pre-caches on `install` event.
4. On subsequent visits: loads from cache in < 200 ms regardless of connectivity.

---

## What Works Offline (Prototype Scope)

| Feature | Offline? | Notes |
|---------|----------|-------|
| Story reading/playback | ✅ Yes | JSON pre-cached, TTS is on-device |
| Voice Q&A within stories | ✅ Yes | Web Speech API on-device |
| Lab simulation | ✅ Yes | Pure canvas + JS |
| Lab voice commands | ✅ Yes | Web Speech API on-device |
| Chatbot Q&A | ✅ Yes | Static intent-matching, no cloud AI needed for prototype |
| Progress save | ✅ Yes | IndexedDB |
| Analytics sync | ⏳ Queued | Flushes automatically when online |
| Teacher dashboard | ❌ No | Out of scope for prototype |

---

## Gotchas & Mitigations

| Risk | Mitigation |
|------|-----------|
| `SpeechRecognition` not available on some Android browsers | Feature-detect; fall back to text input with a keyboard icon |
| Service Worker update breaks old cache | Use cache versioning: `CACHE_NAME = 'storylab-v1'`. Bump on deploy. |
| IndexedDB quota exceeded | Progress data is tiny (~5 kB). Not a real risk for prototype. |
| iOS Safari Service Worker quirks | Prototype targets Android Chrome. Note iOS limitation in README. |
| Background Sync not supported everywhere | Graceful degradation — sync on next `online` event instead |

