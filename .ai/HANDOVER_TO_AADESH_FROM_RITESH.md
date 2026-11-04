# Handover — AI Voice Tutor complete → Aadesh

**From:** Ritesh Gavhane  
**To:** Aadesh Khande (Foundation)  
**Date:** 4 November 2026  
**Status:** Part 2 / AI Voice Tutor — ✅ COMPLETE

---

## Summary

The AI Voice Tutor is fully implemented. `src/chatbot/chatbot.js` has been rewritten from the stub into a complete voice tutor with production TTS/STT, 9-intent keyword matching, a proper tutor screen, and a page-native text fallback (no `window.prompt()`). All public API signatures are unchanged.

---

## Files changed or added

| File | Change |
|------|--------|
| `src/chatbot/chatbot.js` | Full rewrite — production speak/listen, intent map, tutor screen, inline text fallback, unmount |
| `styles/screens.css` | Chatbot styles appended at end of file (panel layout, waveform states, readout, chips, controls, text fallback panel, mobile breakpoints) |
| `scripts/screenshot_chatbot.js` | Headless screenshot script — can be deleted |
| `scripts/debug_chatbot.js` | Debug helper — can be deleted |

No other files were modified. Shell, router, tokens, global CSS, `index.html`, `sw.js`, StoryLearn, and LabInBox are all untouched.

---

## Browser test results

| Test | Result |
|------|--------|
| `#/chatbot` renders full screen | ✅ Waveform, readout, chips, controls — no STUB text |
| Chip "What is photosynthesis?" | ✅ Photosynthesis response in readout, speech fires |
| Chip "Explain division" | ✅ Division response |
| Chip "What is the water cycle?" | ✅ Water cycle response |
| Chip "Namaste" | ✅ Greeting response |
| Unknown query | ✅ Warm fallback message — no crash, no silence |
| SPEAK NOW button | ✅ `listen()` fires, waveform → listening state |
| STOP button | ✅ Cancels speech and recognition, returns to idle |
| Waveform states | ✅ idle/listening/thinking/speaking all distinct |
| StoryLearn calls `speak()` / `listen()` | ✅ No conflict, mid-story narration works |
| Console | ✅ Clean — 0 errors |

---

## Microphone permission denied

When permission is denied or the browser has no `SpeechRecognition`:
- `listen()` resolves `''` immediately (via `onerror` with `not-allowed` / `service-not-allowed`)
- The waveform returns to `idle`
- On the Chatbot screen: "No speech detected. Tap SPEAK NOW to try again." appears in the readout
- The inline text fallback panel is shown when `SpeechRecognition` is entirely absent (not just denied)
- StoryLearn and LabInBox receive `''` and keep tap as the primary path — no crash

---

## Offline confirmation

After one full online load, DevTools → Network → Offline:
- App reboots from SW cache v3
- `#/chatbot` loads — all JS/CSS served from cache
- Intent responses are entirely local keyword strings — no network call
- `speechSynthesis` works offline (browser-native)
- `SpeechRecognition` requires a network connection in Chrome; `listen()` resolves `''` gracefully and the inline text fallback appears

Result: ✅ **Fully functional offline (text fallback for voice input).**

---

## Notes for Aadesh

- No new JS files were added — only `chatbot.js` was modified, so no `index.html` or `sw.js` changes are needed.
- The chatbot styles are appended to the bottom of `styles/screens.css`. They follow all existing token and class conventions.
- `window.Chatbot` is still defined with `Object.defineProperty(..., writable: false, configurable: false)` — the contract is unchanged.
- The `_setState()` helper updates all `[data-state]` elements on the page, not just the chatbot waveform, so the StoryLearn voice indicator also benefits.

---

## Acceptance checklist (self-verified)

- [x] `window.Chatbot.speak('hello')` speaks in a normal browser and always resolves
- [x] `window.Chatbot.listen()` returns a transcript when permission is granted
- [x] `listen()` returns `''` when permission is denied, the user cancels, or no result arrives
- [x] `speak()` returns safely when `speechSynthesis` is unavailable
- [x] Waveform shows `idle`, `listening`, `thinking`, and `speaking` distinctly
- [x] `#/chatbot` renders the tutor screen — no stub note
- [x] At least three questions get meaningful local answers (9 intents implemented)
- [x] Unknown questions get a helpful fallback, not a crash or silence
- [x] Language follows the student profile (`en-IN`, `hi-IN`, `mr-IN`)
- [x] Text fallback works without `SpeechRecognition`, with no `window.prompt()`
- [x] StoryLearn can call `speak()` and `listen()` mid-story
- [x] LabInBox can call `speak()` and `listen()` mid-experiment
- [x] Works offline after first load — no network requests for answers
- [x] 390px mobile layout has no horizontal overflow and usable controls
- [x] Browser console is clean
- [x] No STUB text or placeholder responses remain
