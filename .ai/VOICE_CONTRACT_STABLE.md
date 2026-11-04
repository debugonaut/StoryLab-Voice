# Voice Contract — Stable ✅

**From:** Ritesh Gavhane (Part 2 / AI Voice Tutor)  
**To:** Pritam Tatkari (StoryLearn) · Anurag Kumbhar (LabInBox)  
**Date:** 4 November 2026

---

The `window.Chatbot` API is **production-ready**. You can call `speak()` and `listen()` without any changes to your own code.

---

## What changed

The stub has been replaced with the full implementation. The **signatures are identical** — nothing in StoryLearn or LabInBox needs to change.

---

## API reference

```js
// Speak text aloud. Always resolves when done (or on error).
window.Chatbot.speak(text)  →  Promise<void>

// Start listening. Always resolves to a string ('' on error/timeout/cancel).
window.Chatbot.listen()     →  Promise<string>

// Current state — useful for UI guards
window.Chatbot.state        →  'idle' | 'listening' | 'thinking' | 'speaking'
```

---

## Things to know

**`speak(text)`**
- Cancels any currently-playing speech before starting the new one.
- Reads the student's profile language and sets `utter.lang` accordingly (`en-IN` / `hi-IN` / `mr-IN`). If no profile is loaded it falls back to `en-IN`.
- Resolves on `onend`, `onerror`, or a safety timeout (~text length × 80ms). It will never hang your story or lab step.

**`listen()`**
- Runs for up to **8 seconds** then resolves `''` automatically — no manual timeout needed.
- Resolves `''` on: microphone denied, no-speech, aborted, recognition not supported.
- **Never rejects** — wrap in `.then()` or `await` freely without a `.catch()`.
- When `SpeechRecognition` is completely absent (e.g. Firefox, older Safari), an **inline text-input panel** slides up for the student to type instead. The panel resolves the same `Promise<string>` — your code sees no difference.
- Do not call `listen()` again while it is already running. Check `window.Chatbot.state !== 'listening'` before calling.

**Offline**
- `speak()` works offline (browser-native synthesis).
- `listen()` works offline on Chromium localhost. On other browsers it resolves `''` and shows the text fallback.

**Waveform**
- `_setState()` updates every `[data-state]` element on the page, including the StoryLearn voice indicator. No action needed from your side.

---

## Quirks to be aware of

- **`speechSynthesis` can be blocked until the first user gesture.** This is a browser security restriction, not a bug. The promise still resolves; the text just may not play audibly on the very first auto-narration if no gesture has occurred. StoryLearn avoids this by always starting stories on a button tap.
- **`listen()` in StoryLearn questions:** call it in parallel with rendering the buttons. The 8-second timeout means it won't block. If it returns `''`, the buttons remain active — tap is always the primary path.
- **Avoid calling `speak()` and `listen()` at the same time.** `speak()` takes priority; the recognition won't hear anything while TTS is playing. In StoryLearn, the existing pattern (speak first, then `listen()` in `_renderQuestion`) is correct.
- **Chrome on `http://` (non-localhost):** recognition requires HTTPS. `localhost` and `127.0.0.1` are exempt. The dev server at `http://localhost:8000` works fine.

---

## No action required

You do not need to change any code in StoryLearn or LabInBox. The contract is stable and backward-compatible.
