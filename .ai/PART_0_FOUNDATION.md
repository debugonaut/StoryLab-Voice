# Part 0 — Foundation (Aadesh Khande)

**Status:** ✅ Built & verified — 2026-10-31  
**Scope:** the shell, design system, offline layer, PWA, first-run flow, Control Deck, and learning record.  
**Boundary:** Parts 1–3 own their module screens. The foundation mounts them through a published API and never rewrites their files.

---

## Run it

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step, no npm install, no backend. Everything is vanilla ES5-compatible JS, CSS, JSON, and local fonts. The app is a PWA and keeps working after the first load with the network disabled.

---

## The end-to-end flow

The primary demo flow is intentionally complete:

1. **Boot** — power-on self test, local services check, then the router.
2. **Enrolment** — name, callsign avatar, grade, language. Drafts are saved as the student types.
3. **Language** — English / हिन्दी / मराठी. Choice drives the voice bus and is written to the profile.
4. **Microphone check** — live input meter, or an explicit **TOUCH MODE** skip. The result is stored.
5. **First Shift briefing** — five panels loaded from `data/orientation/first-shift.json`: welcome, voice, bays, ledger, check. Progress resumes after a reload.
6. **Knowledge check** — one mandatory question. The first attempt is recorded for analytics; the badge is issued on completion.
7. **Completion record** — certificate with score, duration, badge, record ID, and links into the deck or a replay.
8. **Control Deck** — personal greeting, live clock, open session timer, network/sync/mic readouts, next directive, and the three bays.
9. **Learning Record** — identity card, stats, session control, module ledger, sync centre, activity timeline, JSON export, print, reset.
10. **Close session / flush ledger** — session stops and writes to the ledger; queued records flush into the local archive, and the screen stays where the operator was working.

Every step writes locally. Nothing in this flow requires a server.

---

## Routes

| Hash | Screen | Owner |
|---|---|---|
| `#/home` | Control Deck | Foundation |
| `#/record` | Learning record + sync centre | Foundation |
| `#/onboarding` | First-run enrolment | Foundation |
| `#/orientation` | First Shift briefing / replay | Foundation |
| `#/storylearn` | StoryLearn module host | Pritam |
| `#/chatbot` | AI Voice Tutor host | Ritesh |
| `#/labinbox` | Lab In Box host | Anurag |

The router guards private routes: no profile → onboarding; profile + `#/onboarding` → deck. Module hosts render a shared breadcrumb, a live status, and the owner credit, then call the module's `mount(root)`.

---

## Files

```
index.html                 shell, boot screen, offline strip, header, footer
manifest.webmanifest       PWA identity + shortcuts
sw.js                      cache v3, navigation fallback, background sync
styles/tokens.css          palette, type, spacing, motion, @font-face
styles/global.css          reset, shell, buttons, panels, toasts, module host
styles/screens.css         onboarding, deck, record, certificate, print
assets/fonts/              Google Sans Flex + Google Sans Code WOFF2
src/shell/ui.js            icons, avatar set, toast, modal, formatting
src/shell/db.js            window.DB IndexedDB wrapper
src/shell/state.js         window.StoryLabState
src/shell/router.js        window.StoryLabRouter + boot
src/shell/onboarding.js    enrolment, mic check, briefing, certificate
src/shell/dashboard.js     Control Deck
src/shell/record.js        learning record, sessions, sync centre
src/shell/offline.js       window.StoryLabNetwork + banner + queue
data/orientation/          first-shift.json
```

---

## Design rules

- **Google Sans at all times.** Headings, body, buttons, and labels use **Google Sans Flex**; instrument labels, serials, and numbers use **Google Sans Code**. Both are self-hosted in `assets/fonts/` and precached, so the terminal does not lose its type offline. No Google Fonts `<link>`.
- **Warm graphite, not flat black.** Base `#0a0c0b`, panel `#141815`, raised `#1b201c`.
- **Amber is the readout, not wallpaper.** `#f59e0b` for action, focus, and live values. Green for healthy, amber for offline, warm red for faults.
- **Hard edges.** `border-radius: 0`. Steel gradients, hairline borders, rivet marks, vent strips, etched uppercase labels.
- **Depth without glass.** Panels use inset highlights and long soft shadows. Avoid blurry cards.
- **Contrast floor.** Muted `#94988c` and faint `#7c8075` are the lowest text colours on base/panel surfaces.

---

## Data model

Database `storylab_v1`, version 2.

| Store | Key | Contents |
|---|---|---|
| `profile` | `student` | id, name, avatar, grade, language, mic mode, timestamps |
| `journey` | `student` | orientation state, badges, attempts |
| `sessions` | `id` | open/closed sessions, started/ended, duration |
| `events` | auto-increment (+ explicit `E-…` fallback) | activity ledger; syncable |
| `progress` | `student` / module keys | written by Parts 1 & 3 through `window.DB` |
| `sync_queue` | auto-increment | pending events awaiting flush |
| `sync_archive` | auto-increment | flushed records with `syncedAt` and mode |

`window.StoryLabState` is the only foundation code that should write these stores. Module code may use `window.DB.save('progress', …)` for its own progress.

---

## Public contracts

```js
window.StoryLabRouter.navigate(route)        // guarded route change
window.StoryLabState.getProfile()            // current profile or null
window.StoryLabState.getSnapshot()           // profile + journey + sessions + progress + queue
window.StoryLabState.logEvent(type, label, meta, opts)
window.StoryLabState.exportRecord()          // full JSON record
window.StoryLabNetwork.refresh()             // repaint network/pending UI
window.StoryLabNetwork.syncNow()             // flush queue -> archive
window.DB.save(store, key, value)
window.DB.load(store, key)
window.DB.getAll(store)
```

---

## Offline + sync behaviour

- The service worker precaches the shell, all JS/CSS, fonts, icons, story/lab indexes, and `data/orientation/first-shift.json`.
- Navigations are network-first with a cached `index.html` fallback.
- Assets are stale-while-revalidate; fonts/icons are cache-first.
- `online`/`offline` events repaint the banner and header chip. The full record flow keeps working offline.
- Writes append to `sync_queue`. `StoryLabNetwork.syncNow()` drains it into `sync_archive` (or a remote endpoint if `window.STORYLAB_SYNC_ENDPOINT` is set). Background Sync uses the same queue from `sw.js` so a closed tab can still drain it.
- No cloud credentials or personal data leave the device in the prototype.

---

## Verification (2026-10-31)

- Full first-run flow completed in Chromium at 1440×1000 with **0 console errors**.
- Certificate: `1 / 1`, `<1 min`, `01` badge; survives reload.
- Control Deck: profile, clock, session timer, network, pending count render correctly.
- Record: JSON export downloaded with the correct profile (`Meera Patil`), language (`mr`), badge, 1 session, 3 events, 2 pending records.
- Sync: `02 pending` → `00`, archive `2`, last flush `just now`, queue clear.
- Session close: sessions `00 → 01`, timer stops, history row appears, new-session control returns.
- Offline: after one online load, network-disabled reload boots the deck, shows OFFLINE, and keeps the profile.
- Responsive: 1440 desktop, 1024 tablet, 390 mobile. Mobile has a fixed bottom tab bar with a 110px content reserve; tablet header fits brand + nav + sync + student.
- Payload under 1 MB; 25 MB budget intact.

Screens are in `screenshots/` (`31`–`42` cover the final pass).

---

## Known limits

- StoryLearn, AI Voice Tutor, and Lab In Box are still their teammates' stubs. The foundation does not implement their content.
- No remote sync endpoint is configured; the sync centre is honest about using a local mirror.
- Voice output depends on the browser's Web Speech API; the mic check gracefully falls back to touch mode.
- Print styles exist and the JSON export is verified, but no physical printer was tested.
- Devanagari samples rely on the device font because Google Sans Flex does not ship that script. All Latin-script UI surfaces are Google Sans.
