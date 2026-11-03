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

**Handover docs:** [Index](./HANDOVER_INDEX.md) · [Pritam / StoryLearn](./HANDOVER_PRITAM.md) · [Ritesh / Chatbot](./HANDOVER_RITESH.md) · [Anurag / LabInBox](./HANDOVER_ANURAG.md)

---

## Part 1 — StoryLearn (Pritam)

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Story JSON files | ✅ | Created by Foundation: `math-market.json`, `science-plants.json`, `index.json` |
| 1.2 | Story list screen renders | ⏳ | Replace stub in `src/storylearn/storylearn.js` |
| 1.3 | Story narration via `window.Chatbot.speak()` | ⏳ | |
| 1.4 | Question branches (tap + voice) | ⏳ | |
| 1.5 | Progress saved to IndexedDB | ⏳ | Use `window.DB.save('progress', 'student', {...})` |
| 1.6 | Works fully offline | ⏳ | JSON already pre-cached in SW |

**Pritam: see [`PART_1_STORYLEARN.md`](./PART_1_STORYLEARN.md)**

---

## Part 2 — Chatbot Core (Ritesh)

| # | Checkpoint | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | `window.Chatbot.speak()` stub works | ✅ | Foundation stub uses Web Speech API |
| 2.2 | `window.Chatbot.listen()` stub works | ✅ | Foundation stub with text fallback |
| 2.3 | Waveform animates per state | ✅ | CSS animations in global.css |
| 2.4 | Full intent matching (3+ questions) | ⏳ | Replace stub logic in `src/chatbot/chatbot.js` |
| 2.5 | Chatbot screen: full Q&A loop | ⏳ | |

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

## Integration Milestone

| Milestone | Status | Notes |
|-----------|--------|-------|
| Foundation shell loads all modules | ✅ | Stubs load cleanly |
| All assets 200 / JSON valid / JS syntax clean | ✅ | verified again after the rebuild |
| Impeccable design check: no blocking issues | ✅ | contrast floor raised in tokens |
| StoryLearn calls Chatbot.speak() | ⏳ | After Part 1 + 2 |
| LabInBox calls Chatbot.listen() | ⏳ | After Part 2 + 3 |
| Full offline session (DevTools → Offline) | ✅ | foundation shell, record data and fonts reload with no network; module content still stubs |
| Demo-ready build | ✅ | Foundation flow: enrolment → orientation → deck → record → sync/export/close session |
