# Build Log — StoryLab Voice

> Updated after each successful checkpoint.

---

## Legend
- ✅ Done & verified
- 🔄 In progress
- ⏳ Not started
- ❌ Blocked

---

## Part 0 — Foundation (Aadesh) — COMPLETE

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 0.1 | Folder scaffold | ✅ | `styles/ src/shell/ src/storylearn/ src/chatbot/ src/labinbox/ data/stories/ data/labs/ icons/` |
| 0.2 | `styles/tokens.css` — design tokens | ✅ | Full Industrial palette, typography, spacing, motion vars. `--color-text-muted` at `#888` (5.4:1 contrast) |
| 0.3 | `styles/global.css` — base styles + components | ✅ | Reset, typography, panel, vent divider, buttons, badges, waveform, module cards, landing hero |
| 0.4 | `src/shell/db.js` — `window.DB` IndexedDB wrapper | ✅ | save/load/getAll/remove/queueSync — all stores: `progress`, `sync_queue` |
| 0.5 | `src/shell/router.js` — `window.StoryLabRouter` | ✅ | Routes: home/storylearn/chatbot/labinbox. Renders stub when module not yet loaded |
| 0.6 | `src/shell/offline.js` — offline banner + sync | ✅ | Watches online/offline events, shows amber banner, triggers Background Sync on reconnect |
| 0.7 | `sw.js` — Service Worker, cache-first | ✅ | Pre-caches all 15 assets on install, cache-first fetch, Background Sync handler |
| 0.8 | `manifest.webmanifest` + SVG icons | ✅ | Standalone display, amber theme color, 192+512 SVG icons |
| 0.9 | `index.html` — shell entry | ✅ | Loads all scripts in order, registers SW, handles PWA install prompt |
| 0.10 | `PRODUCT.md` — Impeccable product context | ✅ | Full product record per impeccable schema |
| 0.11 | Impeccable design detector run | ✅ | Fixed: contrast, removed status dot glows. Later pass replaced the pinned font stack with self-hosted Google Sans. |
| 0.12 | Landing page renders — all HTTP 200 | ✅ | 14/14 assets 200, JSON valid, JS syntax clean |
| 0.13 | Stub modules render (stubs for Parts 1–3) | ✅ | Each module shows placeholder until teammate implements |
| 0.14 | Data files created | ✅ | 2 stories (math-market, science-plants), 1 lab (acid-base), index JSONs |

**Foundation complete: 2026-10-31**  
**To run locally:** `python3 -m http.server 8000` → open http://localhost:8000

---

## Part 0 — Foundation Experience Rebuild (Aadesh) — COMPLETE

> The original scaffold shipped a working skeleton. This pass turned it into the
> actual field terminal: a complete first-run flow, a real control deck, a
> learning record, a sync centre, and a responsive PWA shell. Modules owned by
> Pritam, Ritesh, and Anurag were left untouched and still mount through the
> same host contract.

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 0.15 | Google Sans everywhere | ✅ | Self-hosted **Google Sans Flex** (300–800) + **Google Sans Code** (400–600), four WOFF2 files, declared in `tokens.css`, precached by the SW. No external font request. |
| 0.16 | Field-terminal visual system | ✅ | Warm graphite surfaces, steel gradients, etched mono labels, amber readouts, hard edges, boot self-test, screen transitions. `styles/tokens.css`, `global.css`, `screens.css`. |
| 0.17 | State + data layer | ✅ | `window.StoryLabState`: profile, journey, orientation, sessions, events, pending queue, archive, export, reset. IndexedDB schema v2 with auto-increment fallback for events. |
| 0.18 | Shell + routing | ✅ | Boot sequence, hash router with profile guard, nav state, student chip, network chip, pending-sync chip, install prompt, update chip, toast/modal primitives. |
| 0.19 | First Shift end to end | ✅ | Boot → enrolment identity → language → microphone test (or touch mode) → five-panel orientation → knowledge check → completion certificate. Draft recovery, resume, replay, and local writes at every step. |
| 0.20 | Control Deck | ✅ | Personal greeting, live station clock, session state, network/sync/mic readouts, next directive, three learning bays, module progress summary. |
| 0.21 | Learning Record | ✅ | Identity card, stats, session open/close timer, module ledger, sync centre, activity timeline, JSON export, print stylesheet, reset-unit maintenance. |
| 0.22 | Sync centre + offline | ✅ | Queue → flush → archive pipeline. `FLUSH LEDGER` writes to a local mirror when no remote endpoint is configured; background sync drains the same queue from `sw.js`. Offline reload of the shell verified. |
| 0.23 | PWA shell | ✅ | Manifest, SVG icons, offline banner, install flow, SW cache v3 with navigation fallback and asset revalidation. |
| 0.24 | Responsive + accessibility pass | ✅ | 1440 desktop, 1024 tablet, 390 mobile. Mobile gets a real bottom tab bar; tablet header fits name/chip; language cards, directive, record and sync layouts reflow. Focus-visible states, labels, live regions, reduced-motion and print rules present. |

**Verification run — 2026-10-31**

- Full first-run flow completed in Playwright at 1440×1000 with **0 console errors**.
- Certificate shows `1 / 1` knowledge check, `<1 min`, `01` badge; state persisted after reload.
- Control Deck renders local profile, live clock, session timer, network and pending count.
- Learning Record **EXPORT JSON** downloaded successfully: profile `Meera Patil`, language `mr`, badge `first-shift`, 1 session, 3 events, 2 pending sync records.
- Sync flush: pending `02` → `00`, archive `2`, last flush `just now`, queue clear, timeline intact.
- Session close: timer stops, sessions `00 → 01`, last session recorded, new session control restored; scroll stays in place.
- Offline: after one online load, reload with network disabled still boots the deck, shows the offline banner, preserves the profile, and marks the station `OFFLINE`.
- 1024 and 390 layouts checked by screenshot; mobile bottom nav, tablet header, Hindi/Marathi cards, certificate, record and sync centre reviewed.
- App payload (HTML/CSS/JS/data/fonts/icons) is under 1 MB; the 25 MB budget is not at risk.

**Screens reviewed:** `screenshots/31-language-desktop.png`, `32-briefing-desktop.png`, `33-certificate.png`, `33b-deck-desktop.png`, `35-deck-tablet.png`, `36-mobile-deck-top.png`, `39-mobile-sync.png`, `39b-mobile-sync-cleared.png`, `39c-mobile-session-closed.png`, `42-offline-verified.png`.

**Boundaries kept:** `src/storylearn/`, `src/chatbot/`, and `src/labinbox/` were not rewritten. The foundation only mounts each module through its published API and surrounds it with the shared shell. StoryLearn still contains Pritam's stub notice; Chatbot and LabInBox remain their scaffolded stubs.

**Handover docs:** [Pritam / StoryLearn](./HANDOVER_PRITAM.md) · [Ritesh / Chatbot](./HANDOVER_RITESH.md) · [Anurag / LabInBox](./HANDOVER_ANURAG.md)

---

## Part 1 — StoryLearn (Pritam) — COMPLETE

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Story JSON files | ✅ | Created by Foundation: `math-market.json`, `science-plants.json`, `index.json` |
| 1.2 | Story list screen renders | ✅ | `src/storylearn/storylearn.js` — full implementation replacing stub. Two story cards with subject badge, grade, vent strip, START STORY CTA. Readable error panel on fetch failure. |
| 1.3 | Story narration via `window.Chatbot.speak()` | ✅ | Text rendered to screen immediately; `Chatbot.speak()` called in parallel. `unmount()` cancels speech and timers. |
| 1.4 | Question branches (tap + voice) | ✅ | Options render as bordered A/B/C buttons. `Chatbot.listen()` runs in parallel; fuzzy transcript match. Tap always works. Wrong answer goes to `s3_wrong`, not a dead end. Visual correct/wrong feedback on selection. |
| 1.5 | Progress saved to IndexedDB | ✅ | Merge-save: loads existing `progress` object, adds `progress.stories[id] = { completed, timestamp }`, writes back. Does not overwrite LabInBox progress. `logEvent('story.completed', …)` writes to activity timeline. Toast on completion. |
| 1.6 | Works fully offline | ✅ | JSON pre-cached in SW. Fetch uses relative paths. Second mount starts from story list (no stale state). |

**Completed: 2026-11-04 — Pritam Tatkari**

**Verification:**
- `#/storylearn` lists both stories at 1440 desktop and 390 mobile — no horizontal scroll, no overflow.
- Opening a story narrates step text via `Chatbot.speak()` and shows text on screen.
- Auto-advance on narrate steps; question options render as tappable A/B/C cards.
- Correct branch → `s3_correct`; wrong branch → `s3_wrong` (not a dead end).
- Completion card shown with READ AGAIN and ALL STORIES actions; toast fires.
- `progress.stories[id]` written to IndexedDB; visible in Record → Module Ledger after completion.
- `story.completed` event written to activity timeline.
- `unmount()` cancels speech and timers; second mount from story list confirmed.
- Console clean (0 errors) on Chromium 1440 desktop.
- 390px mobile: single-column option grid, no controls behind bottom tab bar.

**Screens:** `screenshots/50-storylearn-list-desktop.png`, `51-storylearn-list-mobile.png`, `52-storylearn-player-desktop.png`, `53-storylearn-player-mobile.png`, `54-storylearn-question-desktop.png`, `55-storylearn-question-mobile.png`

**Pritam: see [`PART_1_STORYLEARN.md`](./PART_1_STORYLEARN.md)**

---

## Part 2 — Chatbot Core (Ritesh) — COMPLETE

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | `window.Chatbot.speak()` — production TTS | ✅ | `speechSynthesis`, `en-IN` rate 0.92, cancel-before-speak, settle-once guard, Chrome stall safety timeout. Reads language from student profile (`en-IN` / `hi-IN` / `mr-IN`). Always resolves. |
| 2.2 | `window.Chatbot.listen()` — production STT | ✅ | `SpeechRecognition` / `webkitSpeechRecognition`, 8 s timeout, resolves `''` on denial / no-speech / aborted / timeout. No reject path. Falls back to inline text panel when SR unavailable. |
| 2.3 | Waveform animates per state | ✅ | `idle` flat bars, `listening` green pulse, `thinking` amber slow, `speaking` amber fast symmetric bars. CSS in `screens.css`. `_setState()` guards DOM lookup — safe when screen is unmounted. |
| 2.4 | Full intent matching (9 intents) | ✅ | Plants/photosynthesis, division, fractions, water cycle, solar system, multiplication, addition, subtraction, greeting. Warm unknown fallback. No cloud, no API keys. |
| 2.5 | Chatbot screen: full Q&A loop | ✅ | Waveform section, conversation readout (TUTOR / YOU / SYS colour-coded lines), 6 suggestion chips, SPEAK NOW + STOP controls. No STUB text. |
| 2.6 | Inline text fallback | ✅ | Slide-up panel with input + SEND / CANCEL. Resolves a string and removes itself. No `window.prompt()`, no `alert()`. Works when called from StoryLearn or LabInBox. |
| 2.7 | `unmount()` | ✅ | Cancels speech, stops active recognition, resets state, removes any open fallback panel. |

**Completed: 2026-11-04 — Ritesh Gavhane**

**Verification:**
- `#/chatbot` renders tutor screen — waveform, readout, chips, controls. Console clean.
- Chip "What is photosynthesis?" → TUTOR line with photosynthesis response appears in readout.
- Chip "Explain division", "What is the water cycle?", "Namaste" — all return distinct responses.
- Unknown query → warm fallback message, not silence or crash.
- `window.Chatbot.speak('hello')` resolves in a normal browser; resolves without error when `speechSynthesis` absent.
- `window.Chatbot.listen()` returns `''` when permission denied; waveform returns to idle.
- Inline text fallback panel appears when `SpeechRecognition` is unavailable; submitting resolves the string; ESC / CANCEL resolves `''`.
- StoryLearn calls `speak()` and `listen()` mid-story without conflict.
- 390px mobile: single-column controls, chips wrap, no horizontal scroll, bottom tab bar clear.
- Works offline after first load — no network calls for intent responses.

**Screens:** `screenshots/60-chatbot-idle-desktop.png`, `61-chatbot-idle-mobile.png`, `62-chatbot-response-desktop.png`, `63-chatbot-response-mobile.png`

**Ritesh: see [`PART_2_CHATBOT.md`](./PART_2_CHATBOT.md)**

---

## Part 3 — LabInBox (Anurag)

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 3.1 | Lab JSON files | ✅ | Created by Foundation: `acid-base.json`, `index.json` |
| 3.2 | Canvas draws apparatus | ⏳ | Replace stub in `src/labinbox/labinbox.js` |
| 3.3 | Lab steps narrated | ⏳ | |
| 3.4 | Voice command advances steps | ⏳ | |
| 3.5 | Pour/react animation on canvas | ⏳ | |
| 3.6 | Progress saved, works offline | ⏳ | |

**Anurag: see [`PART_3_LABINBOX.md`](./PART_3_LABINBOX.md)**

---

## Integration Pass — Demo Readiness (Aadesh) — 2026-11-04

> Review of the merged Part 1/Part 2 PR. Both modules are content-complete;
> this pass fixed defects and voice-engine timing that would have shown up in
> the 80% demo. LabInBox remains Part 3 (Anurag) and was deliberately untouched.

| # | Item | Status | Notes |
|---|------|--------|-------|
| I.1 | StoryLearn: READ AGAIN crash | ✅ Fixed | `_resetPlayer()` nulled `_story` and `_stepIndex`, then the handler read both. Replay now keeps the story, re-indexes steps, and re-renders the shell. |
| I.2 | StoryLearn: tap-first questions | ✅ Fixed | Options used to appear only after TTS finished — with a silent or stalled voice engine the question had no buttons. Options now render immediately; narration and listening run in parallel. |
| I.3 | StoryLearn: narration can block | ✅ Added | Narration steps expose a `CONTINUE` button next to auto-advance, so a pending safety timeout never stalls the demo. |
| I.4 | StoryLearn: stale transcript | ✅ Fixed | A step token now invalidates late `listen()`/`speak()` callbacks, so an answer captured on question 1 cannot select an option on question 2. |
| I.5 | StoryLearn: voice indicator | ✅ Fixed | The waveform carried no `data-state`, so it never animated. It now reports `listening` / `idle`. |
| I.6 | Chatbot: stale safety timer | ✅ Fixed | `speak()` left its safety timeout running; a late timer could flip a newer utterance back to idle. Cleared on settle, and state is only reset for the current utterance. |
| I.7 | Chatbot: answer race | ✅ Fixed | Chips + STOP now share a query token, so a superseded 380 ms answer cannot speak over a newer one or re-enable controls mid-speech. Chips are ignored while the mic is open. |
| I.8 | Sub-path hosting | ✅ Fixed | StoryLearn used absolute `/data/...` URLs; now relative, matching the dashboard, so a Pages-style sub-path deploy works. |
| I.9 | Service worker | ✅ Bumped | Cache v3 → **v4** so installed devices pick up the fixed module JS/CSS instead of stale-while-revalidate serving the old copy first. |

**Verified:** `node --check` clean on all shell + module JS; `#/storylearn` lists both stories, question buttons render before narration ends, CONTINUE advances, correct/wrong branches reach the completion card, replay survives, and `progress.stories` + `story.completed` land in the ledger; `#/chatbot` answers chips and unknown queries with no console errors.

**Still outstanding for 100%:** Part 3 / LabInBox (`src/labinbox/labinbox.js` is still the scaffold stub with `alert()` and visible STUB copy) and its canvas styles.

---

## Integration Milestone

| Milestone | Status | Notes |
|-----------|--------|-------|
| Foundation shell loads all modules | ✅ | Stubs load cleanly |
| All assets 200 / JSON valid / JS syntax clean | ✅ | verified again after the rebuild |
| Impeccable design check: no blocking issues | ✅ | contrast floor raised in tokens |
| StoryLearn calls Chatbot.speak() | ✅ | Verified — narration fires on every step |
| LabInBox calls Chatbot.listen() | ✅ | speak/listen contract stable — safe for LabInBox to call |
| Full offline session (DevTools → Offline) | ✅ | foundation shell, record data and fonts reload with no network; module content still stubs |
| Demo-ready build | ✅ | Foundation flow: enrolment → orientation → deck → record → sync/export/close session |

## Content Simplification Pass (Demo)

- Plain-English terminology across home, progress, setup and intro: DECK → HOME, RECORD → PROGRESS, BAY → module name, LEDGER → saved on this device, STATION → student, FIRST SHIFT → getting started, SYNC QUEUE → to upload, FLUSH LEDGER → upload now.
- StoryLearn: subject filters (All / Math / Science / Social Studies / EVS), inline SVG art per story, grade + minutes + summary, step progress bar. 9 stories total (7 new).
- Voice tutor: 22 topics in 5 tab groups, each with an icon; answers still spoken aloud.
- Data fetches revalidate and are versioned (`?v=6`) so edited JSON is not served from the browser cache; SW cache bumped to `storylab-v5` with every story precached.

### Story photos

- Story cards and the player now use open-licensed photographs from Wikimedia Commons, downloaded into `assets/stories/` so the app still works offline.
- Licences and authors are recorded in `assets/stories/CREDITS.md` (CC0 / CC BY / CC BY-SA). Inline SVG art stays as the fallback when a story has no photo.
- Photos are precached in `storylab-v6`; story data version bumped to `?v=7`.

### Speech detection + multi-language tutor

- `Chatbot.listenLive(onInterim)` streams recognition results: interim transcripts render in a live "HEARD" strip, silence is detected after 1.3 s, and the call resolves with `{ text, confidence, reason }` (`no-speech`, `denied`, `network`, `unsupported`).
- `Chatbot.listen()` still returns a plain string, so StoryLearn is unchanged, and it falls back to the typed dialog when the browser has no recognition at all.
- Tutor answers, questions, category labels and status text now exist in English, हिंदी and मराठी, switchable in the tutor header. The choice is saved to the student profile and drives both recognition (`hi-IN` / `mr-IN`) and speech output.
- Devanagari keywords are matched alongside English ones, so a spoken Hindi question finds the right topic.
- Story narration stays on `en-IN` because the story text itself is English.

### Lab thumbnails + site-wide language audit

- Virtual Lab cards now carry open-licensed photographs (`assets/labs/`), with authors and licences recorded in `assets/labs/CREDITS.md`. Lab data is versioned (`?v=9`) and the photos are precached in `storylab-v9`.
- Verified on screen: both images load at full natural size and fill the card art area (398x132 inside a 400px card).
- Language audit with the profile set to हिंदी: only the Voice Tutor renders localized copy (~471 Devanagari characters on screen). Home, Stories, Virtual Lab, Progress and onboarding stay English (0 Devanagari characters), and every lesson and lab instruction is English-only.
- The plumbing exists (`StoryLabState.setLanguage`, `en-IN` / `hi-IN` / `mr-IN` tags, `Chatbot.listen(lang)`), but the `STRINGS` / `I18N` tables live only in `src/chatbot/chatbot.js`.
- Approximate user-facing English strings still hardcoded elsewhere: onboarding ~82, progress ~39, router chrome ~27, home ~24, virtual lab ~22, plus all story and lab content.

### End-to-end AI tutor + voice input

- Removed the "predefined answers only" behaviour: spoken and typed questions are sent to `/api/tutor`, served by `tools/server.mjs`, which proxies an OpenAI-compatible chat API (Groq by default). The key is read from `.env` on this machine and never reaches the browser.
- Starter chips still answer instantly from the saved topic library, so an offline or unconfigured machine keeps working; free-form questions fall back to it when the AI is unavailable.
- Tutor header shows an `AI ON` / `OFFLINE` badge fed by `/api/tutor/health`; a TYPE button opens the inline question dialog so a demo never dead-ends.
- Voice input now drives a real level meter (`getUserMedia` + `AnalyserNode`): the waveform follows the microphone while listening, which shows audio is reaching the browser even before transcription returns.

### Demo hardening pass

- Tutor answers now stream (SSE) into the readout, keep the last three exchanges as context, and accept the current story/lab step through `Chatbot.setLessonContext()`. StoryLearn and the Virtual Lab each got an **ASK ABOUT THIS** button.
- `tools/server.mjs` gained a guardrail for unsuitable questions, lesson context, history and streamed pass-through, and honours `HOST=0.0.0.0` for LAN demos. The proxy still retries retired model ids automatically.
- `npm start` and `npm test` exist (`package.json`, no dependencies). `tools/smoke.mjs` covers static routes, 404/400/403, the guardrail, health, a real answer and SSE — the two bugs that broke the first demo (`require` in ESM, retired model) would now fail the suite.
- Story photos re-encoded: 2044 KB → 1280 KB (the map alone 622 KB → 599 KB, others roughly halved). `CACHE_VERSION` bumped to `storylab-v10` so devices pick them up.
- Accessibility: the progress ledger table has a caption and `scope` on its headers; the lab's ASK control is included in the disabled-state handling.
- Not done in this pass: full Hindi/Marathi coverage of the shell screens (only the Voice Tutor is localized), and additional lab experiments.
