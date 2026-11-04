# Handover — StoryLearn complete → Aadesh

**From:** Pritam Tatkari  
**To:** Aadesh Khande (Foundation)  
**Date:** 4 November 2026  
**Status:** Part 1 / StoryLearn — ✅ COMPLETE

---

## Summary

StoryLearn is fully implemented. The stub in `src/storylearn/storylearn.js` has been replaced with a complete branching story player. Both stories run end-to-end, progress is saved to IndexedDB, and the activity timeline is updated on completion.

---

## Files changed or added

| File | Change |
|------|--------|
| `src/storylearn/storylearn.js` | Full replacement — story list, story player, question branching, voice input, progress save, completion card, unmount cleanup |
| `styles/screens.css` | StoryLearn styles appended at end of file (story cards, player shell, option buttons, hint bar, voice indicator, completion card, mobile breakpoints) |
| `scripts/screenshot_storylearn.js` | Headless Chrome CDP script used to capture verification screenshots — can be deleted or kept for CI |

No other files were modified. The shell, router, tokens, global CSS, `index.html`, `sw.js`, and all other module files are untouched.

---

## Routes tested

| Route | Result |
|-------|--------|
| `#/storylearn` | Story list renders — 2 cards (Math + Science) |
| Click "The Market Day" | Player opens, narrates s1, auto-advances to question s2 |
| Click wrong answer (7 / 5 mangoes) | Branches to `s3_wrong`, narrates correction, reaches `end` / `complete` |
| Click correct answer (6 mangoes) | Branches to `s3_correct`, narrates praise, reaches `end` / `complete` |
| `#/storylearn` → open "How Plants Eat Light" | Same flow — correct/wrong branches work |
| Completion card → READ AGAIN | Replays from step 1 cleanly |
| Completion card → ALL STORIES | Returns to story list |
| `← ALL STORIES` in player header | Returns to story list, speech cancelled |
| `#/record` after completing a story | Story appears in Module Ledger and Activity Timeline |

---

## Desktop and mobile screenshots

All screenshots are in `screenshots/`:

| File | Description |
|------|-------------|
| `50-storylearn-list-desktop.png` | Story list — 1440px desktop |
| `51-storylearn-list-mobile.png` | Story list — 390px mobile |
| `52-storylearn-player-desktop.png` | Player open (narrate step) — 1440px desktop |
| `53-storylearn-player-mobile.png` | Player open (narrate step) — 390px mobile |
| `54-storylearn-question-desktop.png` | Question step with A/B/C options — 1440px desktop |
| `55-storylearn-question-mobile.png` | Question step — 390px mobile |

---

## Offline test result

The dev server was taken offline (DevTools → Network → Offline) after one full load. The app reloaded from the service worker cache (SW cache v3), the shell booted, and `#/storylearn` loaded both story cards from the precached `data/stories/index.json`. Opening a story loaded `math-market.json` from cache. The story played fully offline. Progress was written to IndexedDB without any network call.

Result: ✅ **Fully functional offline after first load.**

---

## Notes for Aadesh

- No new JS files were added — only `storylearn.js` was modified, so no `index.html` or `sw.js` changes are needed from your side.
- No new story JSON files were added — the two existing stories (`math-market.json`, `science-plants.json`) and `index.json` are already in the SW precache.
- The StoryLearn styles are appended to the bottom of `styles/screens.css`. They follow the existing design system conventions (tokens, panel classes, module-grid, badge, vent, btn variants).
- `window.StoryLearn` now exports both `mount(root)` and `unmount()` — the router already calls `unmount()` via the `currentCleanup` mechanism.

---

## Acceptance checklist (self-verified)

- [x] `#/storylearn` lists both stories from `index.json`
- [x] Opening a story narrates via `window.Chatbot.speak()` and shows text on screen
- [x] Narration steps advance correctly
- [x] Question options render as tappable buttons and use the correct branch
- [x] A spoken answer advances the same step; failed/no-speech answer still allows tapping
- [x] A wrong answer produces the `s3_wrong` branch, not a dead end
- [x] Completion writes `progress.stories[id]` and appears in Record → Module Ledger
- [x] Completion appears in the activity timeline (`logEvent` called)
- [x] Reloading the page and opening the story again does not break
- [x] Works with DevTools set to Offline after first load
- [x] 390px mobile layout — no horizontal scroll, no controls behind bottom tab bar
- [x] Browser console clean
- [x] No `STUB` text, `alert()`, or placeholder copy
- [x] `unmount()` stops speech and timers
