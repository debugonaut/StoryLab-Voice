# StoryLab Voice — Team Handover Index

> **For teammates:** Start here. Everything you need is linked below.

---

## Project at a Glance

**StoryLab Voice** is an offline-first PWA for rural schools — voice-guided stories + virtual science labs.  
No internet required after first load. No build step. Vanilla JS + HTML/CSS.

**To run locally:** from this project folder, run `python3 -m http.server 8000` → open `http://localhost:8000`

---

## Who Does What

| Part | Module | Owner | Your Handover Doc |
|------|--------|-------|-------------------|
| **0 — Foundation** | Shell, routing, offline infra, landing, onboarding, deck, record | **Aadesh Khande** | [PART_0_FOUNDATION.md](./PART_0_FOUNDATION.md) |
| **1 — StoryLearn** | Branching story player, voice Q&A | **Pritam Tatkari** | 👉 [HANDOVER_PRITAM.md](./HANDOVER_PRITAM.md) |
| **2 — AI Voice Tutor** | TTS/STT engine, intent matching, tutor screen | **Ritesh Gavhane** | 👉 [HANDOVER_RITESH.md](./HANDOVER_RITESH.md) |
| **3 — LabInBox** | Canvas 2D science lab, pour/react animations | **Anurag Kumbhar** | 👉 [HANDOVER_ANURAG.md](./HANDOVER_ANURAG.md) |

---

## What Aadesh Has Already Built (Foundation)

You inherit a **complete, verified PWA shell**. Do not modify any of the following:

| File / Folder | What it is |
|---------------|-----------|
| `index.html` | App entry — loads all scripts, registers Service Worker |
| `styles/tokens.css` | Full Industrial design token system (colours, type, spacing) |
| `styles/global.css` | Base styles, buttons, panels, waveform, badges |
| `styles/screens.css` | Screen-specific layouts (deck, record, onboarding, orientation) |
| `assets/fonts/` | Self-hosted Google Sans Flex + Google Sans Code (no network needed) |
| `sw.js` | Service Worker — cache-first, offline, Background Sync |
| `manifest.webmanifest` | PWA manifest — installable, standalone, amber theme |
| `src/shell/db.js` | `window.DB` — IndexedDB wrapper. Use this, never raw IDB |
| `src/shell/router.js` | `window.StoryLabRouter` — hash router, boot sequence, nav |
| `src/shell/state.js` | `window.StoryLabState` — profile, sessions, events, sync queue |
| `src/shell/ui.js` | `window.StoryLabUI` — toast, modal, escape helper |
| `src/shell/offline.js` | Offline banner + Background Sync trigger |
| `src/shell/onboarding.js` | First-run enrolment (language, name, mic test) |
| `src/shell/dashboard.js` | Control Deck (home screen with session stats, module tiles) |
| `src/shell/record.js` | Learning Record (progress, sync centre, JSON export) |
| `data/stories/` | Story JSON files — index + 2 stories |
| `data/labs/` | Lab JSON files — index + 1 lab |
| `icons/` | SVG icons (192 + 512) |

---

## The Three APIs You Must Not Break

These are the shared contracts. Your module consumes them — **don't change signatures**.

```js
// 1. Database (Foundation owns)
await window.DB.save('progress', 'student', mergedObject);
await window.DB.load('progress', 'student');          // → object or undefined
await window.DB.queueSync({ type: 'analytics', ... });

// 2. Voice (Ritesh owns — stub working now, full impl coming)
await window.Chatbot.speak(text);          // → Promise<void> — always resolves
const transcript = await window.Chatbot.listen(); // → Promise<string> — '' on fail

// 3. Router (Foundation owns)
window.StoryLabRouter.navigate('home');       // → Control Deck
window.StoryLabRouter.navigate('storylearn'); // → calls window.StoryLearn.mount()
window.StoryLabRouter.navigate('chatbot');    // → calls window.Chatbot.mount()
window.StoryLabRouter.navigate('labinbox');   // → calls window.LabInBox.mount()
```

---

## Progress Data Shape (do not break this)

The Record screen reads from `window.DB.load('progress', 'student')`. It expects:

```json
{
  "stories": {
    "math-market":    { "completed": true, "timestamp": 1730000000000 },
    "science-plants": { "completed": true, "timestamp": 1730000001000 }
  },
  "labs": {
    "acid-base": { "completed": true, "timestamp": 1730000002000 }
  }
}
```

**Always merge — never overwrite.** Load first, update the relevant key, save back:

```js
const all = (await window.DB.load('progress', 'student')) || {};
all.stories = all.stories || {};
all.stories['math-market'] = { completed: true, timestamp: Date.now() };
await window.DB.save('progress', 'student', all);
```

---

## Design Rules (3 you must follow)

1. **No border-radius** — all edges are hard. Industrial = machine, not app.
2. **Use design tokens** — `var(--color-accent)`, `var(--font-heading)`, `var(--sp-4)`, etc. Don't hardcode `#f59e0b` or `16px`.
3. **Render inside `root`** — the `root` argument passed to `mount(root)` is `#module-mount`. Never write to `#app-root` or `document.body` directly.

---

## If You Need to Add a JS File

Tell **Aadesh** and he will:
1. Add a `<script src="...">` tag to `index.html`
2. Add the path to the `PRECACHE_URLS` array in `sw.js`

Otherwise your file will not be cached and the module breaks offline.

---

## Build Log & Checkpoints

Track your progress in [`BUILD_LOG.md`](./BUILD_LOG.md). Update your Part rows when each checkpoint is done.

---

## Questions?

Everything is documented. Read order:

1. **Your handover doc** (the one with your name)
2. **Your PART_N spec** (detailed build instructions + copy-paste code)
3. **BUILD_LOG.md** (what's verified and what's pending)
4. **PLAN.md** (overall architecture and team contracts)

