# Handover — StoryLearn (Part 1)

**Owner:** Pritam Tatkari  
**From:** Aadesh Khande (Foundation)  
**Date:** 31 October 2026  
**Status:** Foundation is complete and verified. StoryLearn is still the foundation stub and is yours to finish.

---

## Read these first

- [PART_1_STORYLEARN.md](./PART_1_STORYLEARN.md) — full story-player brief and JSON example.
- [current stub](../src/storylearn/storylearn.js) — the file you will replace.
- [PART_0_FOUNDATION.md](./PART_0_FOUNDATION.md) — platform contract and state model.
- [BUILD_LOG.md](./BUILD_LOG.md) — what is already proven.

---

## What is already done for you

- The route `#/storylearn` is registered and the shell mounts `window.StoryLearn.mount(root)` inside `#module-mount`. You do **not** need to change the router.
- The host adds the page breadcrumb, live status, app header, footer, mobile bottom tab bar, and the Google Sans design system. Your screen inherits all of it.
- Both stories and their index already exist and are precached offline:
  - `data/stories/index.json`
  - `data/stories/math-market.json`
  - `data/stories/science-plants.json`
- A working voice API is available: `window.Chatbot.speak(text)` and `window.Chatbot.listen()` (the stub already has real Web Speech API support; Ritesh is improving it).
- The record page already reads StoryLearn progress from `progress.stories` on the `progress` store. Completion will appear in the module ledger automatically once you write it.
- The app is offline-first: service worker cache v3, local fonts, IndexedDB, and no build step.

**The current StoryLearn screen** is a list of the two stories with a `START` button that shows an alert and speaks the first line. Replace that behaviour completely.

---

## What you own

- `src/storylearn/storylearn.js` — required; keep exporting `window.StoryLearn`.
- `src/storylearn/story-player.js` — optional, only if you want to split the player out.
- `data/stories/*.json` — you may add more stories and update `index.json`.

Do **not** edit the shell, tokens, global CSS, `index.html`, `sw.js`, or the other modules.

---

## The contract

```js
window.StoryLearn = {
  mount(root) {
    // Render the story list or the active player inside root.
  },
  unmount() {
    // Optional: cancel timers, speech, or listeners when the route changes.
  }
};
```

- `root` is the `#module-mount` element. Render only inside it.
- The host already provides the deck breadcrumb. Use an internal **← ALL STORIES** button inside the player; do not add a second deck-navigation header.
- Use `window.StoryLabRouter.navigate('home')` only when you deliberately want the deck.
- Escape all JSON text before injecting it: `window.StoryLabUI.escape(text)`.

---

## Required data behaviour

### Progress must be merged, never replaced

The record page expects this exact shape:

```js
// progress.stories[storyId] = { completed: true, timestamp: <ms> }
const all = (await window.DB.load('progress', 'student')) || {};
all.stories = all.stories || {};
all.stories[storyId] = { completed: true, timestamp: Date.now() };
await window.DB.save('progress', 'student', all);
```

If you overwrite the whole `progress` object, you will erase LabInBox progress.

### Optional: put the completion in the activity timeline

```js
await window.StoryLabState.logEvent(
  'story.completed',
  'Completed ' + story.title,
  { storyId: story.id, subject: story.subject }
);
```

This is recommended. It makes the completion appear in the record timeline and adds it to the sync queue.

---

## Suggested build order

1. **Story list** — fetch `data/stories/index.json`, render the existing `module-card` / `module-grid` language, handle load errors with a readable panel, and remove the stub note.
2. **Load a story** — fetch `data/stories/<id>.json`, index steps by `id`, and start at `steps[0]` or the `next` chain.
3. **Narration** — render the step text immediately, then call `Chatbot.speak(step.text)`. Never make the text wait for audio.
4. **Questions** — render each option as a button. Also call `Chatbot.listen()` and match the transcript to an option label. Tap always works when speech is unavailable or returns `''`.
5. **Branches** — follow `option.next`; prevent double-advance while a step is running; announce the result.
6. **Completion** — speak the final text, merge-save progress, optionally log the event, and show a completion card with a **READ AGAIN** and **ALL STORIES** action.
7. **Cleanup** — implement `unmount()` if you use timers, intervals, or long-running speech. Avoid recursive step calls that can stack up.
8. **Test** — desktop, tablet, mobile, offline, and a denied-microphone browser.

---

## Acceptance checklist

- [ ] `#/storylearn` lists both stories from `index.json`.
- [ ] Opening a story narrates via `window.Chatbot.speak()` and shows the text on screen.
- [ ] Narration steps advance correctly.
- [ ] Question options render as tappable buttons and use the correct branch.
- [ ] A spoken answer advances the same step; a failed/no-speech answer still allows tapping.
- [ ] A wrong answer produces the `s3_wrong` branch, not a dead end.
- [ ] Completion writes `progress.stories[id]` and appears in **Record → Module ledger**.
- [ ] The completion appears in the activity timeline if you call `logEvent`.
- [ ] Reloading the page and opening the story again does not break.
- [ ] Works with DevTools set to Offline after the first load.
- [ ] 390px mobile layout has no horizontal scroll and no controls behind the bottom tab bar.
- [ ] Browser console is clean.
- [ ] No `STUB` text, `alert()`, or placeholder copy remains in StoryLearn.
- [ ] `unmount()` stops any timers or speech you started.

---

## Known traps

- `window.Chatbot.listen()` resolves an **empty string** on timeout, denial, or unsupported browsers. Always keep tap as the primary fallback.
- `speechSynthesis` can be blocked until the first user gesture; do not assume narration played just because the promise resolved.
- Do not save progress at story start as `completed: true`. Only the `end` / `complete` step completes the story.
- `window.DB.save('progress', ...)` replaces the whole object. Merge first, as shown above.
- If you add a new JS file, ask Aadesh to add it to `index.html` and the `sw.js` precache array. Otherwise offline mode will not load it.
- If you add a new story JSON, update `data/stories/index.json` and request the same SW precache update.
- The host can remount your screen after navigation. Make sure a second mount starts from the story list, not stale state.

---

## When you are done

1. Update the Part 1 rows in [BUILD_LOG.md](./BUILD_LOG.md).
2. Send Aadesh:
   - files changed or added,
   - the routes you tested,
   - desktop and mobile screenshots,
   - the result of the offline test.
3. Keep the module inside its two files. Shared shell/design changes go through Aadesh.
