# StoryLab Voice — Project Plan (4 Members)

> **Prototype only.** No over-engineering. Vanilla JS PWA, runs in browser, works offline.

---

## Team Division

| # | Module | Owner | Plan File |
|---|--------|-------|-----------|
| **0** | **Foundation** — shell, landing page, offline infra, design system, backend data layer | **Aadesh** | [`PART_0_FOUNDATION.md`](./PART_0_FOUNDATION.md) |
| **1** | **StoryLearn** — branching story player, story JSON, voice Q&A | **Pritam** | [`PART_1_STORYLEARN.md`](./PART_1_STORYLEARN.md) |
| **2** | **AI Voice Chatbot Core** — `window.Chatbot`, TTS/STT, waveform UI | **Ritesh** | [`PART_2_CHATBOT.md`](./PART_2_CHATBOT.md) |
| **3** | **LabInBox** — Canvas 2D lab, pour animations, voice step runner | **Anurag** | [`PART_3_LABINBOX.md`](./PART_3_LABINBOX.md) |

---

## Handover — Foundation → Modules

The foundation is frozen for this milestone. Each owner gets a self-contained handover with what is already built, the exact module contract, and the acceptance tests. Start at [HANDOVER_INDEX.md](./HANDOVER_INDEX.md).

| Owner | Handover |
|---|---|
| **Pritam Tatkari** — StoryLearn | [`HANDOVER_PRITAM.md`](./HANDOVER_PRITAM.md) |
| **Ritesh Gavhane** — AI Voice Tutor | [`HANDOVER_RITESH.md`](./HANDOVER_RITESH.md) |
| **Anurag Kumbhar** — LabInBox | [`HANDOVER_ANURAG.md`](./HANDOVER_ANURAG.md) |

Shared rules: work only in your module folder and JSON data, keep the published `mount()` API, merge into `progress.stories` / `progress.labs`, and ask Aadesh to add any new file to `index.html` and the `sw.js` precache.

---

## Repo Layout (everyone follows this)

```
/
├── index.html              # Shell entry
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service Worker (Foundation owns)
├── PRODUCT.md              # Impeccable product context
├── styles/
│   ├── tokens.css          # Design tokens + local Google Sans faces
│   ├── global.css          # Shell, typography, panels, controls
│   └── screens.css         # Onboarding, deck, record, certificate
├── assets/fonts/           # Self-hosted Google Sans Flex + Google Sans Code
├── src/
│   ├── shell/
│   │   ├── db.js           # window.DB — IndexedDB wrapper
│   │   ├── state.js        # window.StoryLabState — profile/journey/sessions/sync
│   │   ├── ui.js           # shared icons, toasts, dialogs, formatting
│   │   ├── router.js       # window.StoryLabRouter (guard + module host)
│   │   ├── onboarding.js   # first-run enrolment + First Shift briefing
│   │   ├── dashboard.js    # Control Deck
│   │   ├── record.js       # Learning record, sessions, sync centre
│   │   └── offline.js      # Offline banner + queue drain
│   ├── storylearn/         # Part 1 — Pritam
│   │   └── storylearn.js
│   ├── chatbot/            # Part 2 — Ritesh
│   │   └── chatbot.js
│   └── labinbox/           # Part 3 — Anurag
│       └── labinbox.js
├── data/
│   ├── stories/            # JSON story scripts (Part 1)
│   │   ├── index.json
│   │   └── math-market.json
│   ├── labs/               # JSON lab scripts (Part 3)
│   │   ├── index.json
│   │   └── acid-base.json
│   └── orientation/        # First Shift panels (Foundation)
│       └── first-shift.json
└── .ai/                    # Planning + build log
    ├── PLAN.md             # This file
    ├── DESIGN.md           # Design system reference
    ├── OFFLINE.md          # Offline strategy
    ├── BUILD_LOG.md        # ← Checkpoint log (updated as we build)
    └── PART_*.md           # Per-member task docs
```

---

## Integration Contracts (public API — don't break signatures)

| Contract | Owner | Consumer |
|----------|-------|----------|
| `window.StoryLabRouter.navigate(route)` | Foundation | All modules |
| `window.Chatbot.speak(text)` → Promise | Chatbot | StoryLearn, LabInBox |
| `window.Chatbot.listen()` → Promise\<string\> | Chatbot | StoryLearn, LabInBox |
| `window.DB.save(store, key, val)` → Promise | Foundation | All modules |
| `window.DB.load(store, key)` → Promise | Foundation | All modules |
| CSS custom props in `tokens.css` | Foundation | All modules |
| `window.LabCanvas.init/load/pour/react` | LabInBox (internal) | — |

---

## Design System

**Industrial style** — full tokens in [`DESIGN.md`](./DESIGN.md)

- Warm graphite: `#0a0c0b` base, `#141815` panels, `#1b201c` raised
- Amber accent: `#f59e0b`
- Fonts: **Google Sans Flex** everywhere, **Google Sans Code** for instrument readouts — self-hosted, no external font request
- Hard edges — `border-radius: 0` everywhere
- Steel plates, etched mono labels, amber readouts, rivet corners, real depth

Run `npx impeccable context` at session start.

---

## Offline Strategy

See [`OFFLINE.md`](./OFFLINE.md) — TL;DR: SW caches every shell asset, font, and data file on install; IndexedDB stores profile, journey, sessions, progress, activity, and a sync queue; Background Sync drains the queue into a local archive when a tab is closed. Voice = Web Speech API (zero bytes, on-device). App payload is under 1 MB; total budget ≤ 25 MB.

---

## Build Progress

See [`BUILD_LOG.md`](./BUILD_LOG.md) for checkpoint-by-checkpoint status.

---

## Ground Rules

1. **Vanilla JS only** — no React, no Vue, no bundler
2. **One global per module** — `window.StoryLearn`, `window.Chatbot`, `window.LabInBox`, `window.DB`, `window.StoryLabRouter`
3. **All content is JSON** — no backend required for prototype
4. **Voice = Web Speech API** — free, in-browser, no API key
5. **Progress = IndexedDB via `window.DB`** — never touch IDB directly
6. **Mark BUILD_LOG.md** after every successful checkpoint
