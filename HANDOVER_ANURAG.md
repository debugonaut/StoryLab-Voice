# Handover — LabInBox (Part 3)

**Owner:** Anurag Kumbhar  
**From:** Aadesh Khande (Foundation)  
**Date:** 31 October 2026  
**Status:** Foundation is complete and verified. LabInBox is still the foundation stub and is yours to finish.

---

## Read these first

- [PART_3_LABINBOX.md](./PART_3_LABINBOX.md) — full canvas-engine and lab-runner brief.
- [current stub](../src/labinbox/labinbox.js) — the file you will replace.
- [PART_0_FOUNDATION.md](./PART_0_FOUNDATION.md) — platform contract and state model.
- [BUILD_LOG.md](./BUILD_LOG.md) — verified foundation status.

---

## What is already done for you

- The route `#/labinbox` is registered and the shell mounts `window.LabInBox.mount(root)` inside `#module-mount`. You do **not** need to change the router.
- The host adds the page breadcrumb, live status, app header, footer, mobile bottom tab bar, and the Google Sans design system. Your screen inherits all of it.
- The experiment data already exists and is precached offline:
  - `data/labs/index.json`
  - `data/labs/acid-base.json` — two beakers, a flask, six steps, pour and react actions.
- A working voice API is available: `window.Chatbot.speak(text)` and `window.Chatbot.listen()` (the stub has real Web Speech API support; Ritesh is improving it).
- The record page already reads LabInBox progress from `progress.labs` on the `progress` store. Completion will appear in the module ledger automatically once you write it.
- The app is offline-first: service worker cache v3, local fonts, IndexedDB, and no build step.

**The current LabInBox screen** is a list of the one lab with a `START` button that speaks the first instruction and shows an alert. Replace that behaviour completely.

---

## What you own

- `src/labinbox/labinbox.js` — required; keep exporting `window.LabInBox`.
- `src/labinbox/canvas-engine.js` — optional; recommended for the drawing primitives.
- `src/labinbox/lab-runner.js` — optional; recommended for the step executor.
- `data/labs/*.json` — you may add more labs and update `index.json`.

Do **not** edit the shell, tokens, global CSS, `index.html`, `sw.js`, or the other modules.

---

## The contract

```js
window.LabInBox = {
  mount(root) {
    // Render the lab list or the active experiment inside root.
  },
  unmount() {
    // Optional: cancel animation frames, timers, speech, and listeners.
  }
};
```

- `root` is `#module-mount`. Render only inside it.
- The host already provides the deck breadcrumb. Use an internal **← ALL EXPERIMENTS** button inside the runner; do not add a second deck-navigation header.
- Do not use `document.getElementById('app-root')` to render the lab. The old spec does this; the host contract passes the correct root for a reason.
- Use `window.StoryLabRouter.navigate('home')` only when you deliberately want the deck.
- Escape all JSON instructions before injecting them: `window.StoryLabUI.escape(text)`.

---

## Required data behaviour

### Progress must be merged, never replaced

The record page expects this exact shape:

```js
// progress.labs[labId] = { completed: true, timestamp: <ms> }
const all = (await window.DB.load('progress', 'student')) || {};
all.labs = all.labs || {};
all.labs[labId] = { completed: true, timestamp: Date.now() };
await window.DB.save('progress', 'student', all);
```

If you overwrite the whole `progress` object, you will erase StoryLearn progress.

### Optional: put the completion in the activity timeline

```js
await window.StoryLabState.logEvent(
  'lab.completed',
  'Completed ' + lab.title,
  { labId: lab.id, subject: lab.subject }
);
```

This is recommended. It makes the completion appear in the record timeline and adds it to the sync queue.

---

## What to build

1. **Lab list**
   - Fetch `data/labs/index.json`, render the existing `module-card` / `module-grid` language, handle load errors, and remove the stub note.

2. **Canvas engine**
   - Init on a `<canvas>` with a CSS size and a backing store scaled by `devicePixelRatio`.
   - Draw at least two beakers and one flask from the JSON `apparatus` array.
   - The JSON coordinates are authored for a **400×400** area. Scale them to the actual canvas size; do not assume 1 CSS pixel = 1 unit on mobile.
   - Redraw on resize; clear and redraw rather than stacking frames.
   - Keep the canvas visual language: amber outlines, dark inset panel, readable labels. Do not import Fabric/Konva or any external canvas library.

3. **Lab runner**
   - Render the current instruction outside the canvas (HTML, not canvas text) and speak it with `Chatbot.speak()`.
   - Follow the step `next` chain. Prevent double-advance while a step is running.
   - `action: null` steps advance after narration.
   - `wait_voice` steps must show **tap buttons** derived from `accepts` as well as calling `Chatbot.listen()`. A student without a microphone must be able to finish the lab.
   - `pour` must animate a stream/transfer and update the flask content colour.
   - `react` must change the flask to the result colour with a clear visual change.
   - `complete` saves progress and shows a completion card with **RUN AGAIN** and **ALL EXPERIMENTS**.

4. **Cleanup**
   - Implement `unmount()` to cancel animation frames, timers, speech, and listeners.
   - Stop drawing when the route changes; do not leave a loop running in the background.

5. **Clean the stub**
   - Remove the “STUB: …” developer note and the “Anurag will implement” alert.
   - Remove the temporary `window._LB_run` global; keep helpers inside the module.

---

## Acceptance checklist

- [ ] `#/labinbox` lists the lab from `index.json`.
- [ ] Starting the lab renders the canvas with two beakers and a flask.
- [ ] Each step's instruction is visible and narrated via `window.Chatbot.speak()`.
- [ ] The `wait_voice` steps advance by voice when available.
- [ ] The same steps advance by tapping when speech is unavailable or returns `''`.
- [ ] Wrong/unrecognised voice input prompts a retry without getting stuck.
- [ ] Pouring changes the flask contents.
- [ ] The react step changes the flask to the result colour.
- [ ] Completion writes `progress.labs[id]` and appears in **Record → Module ledger**.
- [ ] The completion appears in the activity timeline if you call `logEvent`.
- [ ] The canvas is sharp and correctly scaled on a 390px phone, 1024 tablet and desktop.
- [ ] No horizontal overflow, no controls hidden behind the mobile tab bar.
- [ ] Works with DevTools set to Offline after the first load.
- [ ] Browser console is clean.
- [ ] No `STUB` text, `alert()`, or placeholder copy remains in LabInBox.
- [ ] `unmount()` stops all animation/timers.

---

## Known traps

- The old spec renders into `#app-root`; the host mounts you inside `#module-mount`. Rendering into `#app-root` will wipe the shell.
- `window.Chatbot.listen()` resolves an **empty string** on timeout, denial, or unsupported browsers. Always show tap options for `wait_voice`.
- Voice recognition can fail even when the browser supports it. Do not make voice the only path through a step.
- The JSON apparatus coordinates assume a 400×400 canvas. Scale them and recalculate on resize.
- A canvas with `width=400` stretched by CSS will look blurry. Scale the backing store with `devicePixelRatio`.
- Do not advance the step index twice when both a tap and a voice result arrive. Lock the step while it is processing.
- Never save `completed: true` until the `complete` action is reached.
- `window.DB.save('progress', ...)` replaces the whole object. Merge first, as shown above.
- If you add a new JS file, ask Aadesh to add it to `index.html` and the `sw.js` precache array.
- If you add a new lab JSON, update `data/labs/index.json` and request the same SW precache update.
- Ritesh's voice API is still being finished. Build the tap fallback first so the lab is demoable even if voice is temporarily incomplete.

---

## When you are done

1. Update the Part 3 rows in [BUILD_LOG.md](./BUILD_LOG.md).
2. Send Aadesh:
   - files changed or added,
   - desktop and mobile screenshots,
   - the voice and tap test results,
   - confirmation that completion appears in the record and offline still works.
3. Keep the module inside its own files. Shared shell/design changes go through Aadesh.
