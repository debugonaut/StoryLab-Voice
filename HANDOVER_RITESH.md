# Handover — AI Voice Tutor (Part 2)

**Owner:** Ritesh Gavhane  
**From:** Aadesh Khande (Foundation)  
**Date:** 31 October 2026  
**Status:** Foundation is complete and verified. The voice core has a working stub; the full tutor screen and intent layer are yours.

---

## Read these first

- [PART_2_CHATBOT.md](./PART_2_CHATBOT.md) — full voice/tutor brief.
- [current implementation](../src/chatbot/chatbot.js) — real TTS/STT already present, but the screen is still a stub.
- [PART_0_FOUNDATION.md](./PART_0_FOUNDATION.md) — platform contract, profile and language model.
- [BUILD_LOG.md](./BUILD_LOG.md) — verified foundation status.

---

## What is already done for you

The current `src/chatbot/chatbot.js` is **not an empty stub**. It already contains:

- `Chatbot.speak(text)` using `window.speechSynthesis`, Indian English (`en-IN`), rate `0.9`, cancel-before-speak, and resolve-on-end/error.
- `Chatbot.listen()` using `SpeechRecognition` / `webkitSpeechRecognition`, an 8-second timeout, and a text fallback. It resolves a transcript string and never rejects.
- A shared waveform markup pattern: `.waveform` with `.waveform__bar` children and a `data-state` attribute. The CSS and state animations already exist.
- The `#/chatbot` route, module host, page chrome, Google Sans design system, mobile bottom tab bar, and responsive layout.
- A student profile with `language` and `languageTag` (`en-IN`, `hi-IN`, `mr-IN`) in `window.StoryLabState`.
- The app shell, offline cache, and IndexedDB layer. No build step.

StoryLearn and LabInBox call this API. Your work is the shared dependency for both modules.

---

## What you own

- `src/chatbot/chatbot.js` — required.
- Optional helper files under `src/chatbot/` if you split the intent map or speech helper out.
- The `#/chatbot` screen content and interactions.

Do **not** edit the shell, shared CSS, `index.html`, `sw.js`, or the other modules.

---

## The contract (do not change signatures)

```js
window.Chatbot = {
  speak(text) -> Promise<void>,       // always resolves
  listen() -> Promise<string>,        // always resolves; '' on cancel/error
  mount(root) -> void,                // render the tutor screen inside root
  unmount() -> void,                  // optional but recommended
  state: 'idle' | 'listening' | 'thinking' | 'speaking'
};
```

- `window.Chatbot` is defined with `Object.defineProperty(..., writable: false, configurable: false)` in the current file. To add methods, **rewrite the file**; do not try to reassign the global at runtime.
- `root` is `#module-mount`. Render only inside it; the host owns the breadcrumb and page frame.
- `speak()` must resolve even when speech synthesis is missing or blocked. Do not leave callers waiting forever.
- `listen()` must resolve `''` on denial, timeout, cancel, or unsupported browsers. It must not throw.
- `state` must reflect the current mode. Update the waveform with the existing `data-state` pattern; guard the DOM lookup because the waveform only exists while your screen is mounted.

---

## What to build

1. **Tutor screen**
   - Conversation readout: system prompt, `You:` transcript, `Tutor:` response.
   - Large waveform/reaction area using the existing `.waveform` classes and state colours.
   - Primary **SPEAK NOW** control, a **STOP SPEAKING** control, and a back link to the deck if useful.
   - Suggested starter questions as tappable chips (e.g. “What is photosynthesis?”, “Explain division”, “Namaste”).
   - Accessible live region for the current tutor response and button labels.

2. **Intent matching**
   - A local keyword map with at least three real intents: plants/photosynthesis, division/share, greeting.
   - A warm unknown fallback that invites a supported topic.
   - No cloud calls, API keys, or external requests.

3. **Voice behaviour**
   - Read the profile language and use its `languageTag` for `utter.lang` and `rec.lang`; fall back to `en-IN`.
   - `speak()`: cancel any current utterance, set state `speaking`, render the text immediately, resolve on end/error.
   - `listen()`: state `listening`, capture one result, stop on timeout, state `idle` after.
   - `thinking`: set it while matching, briefly, so the waveform has a real state.
   - `unmount()`: cancel speech, stop active recognition, reset state.

4. **Text fallback**
   - Replace `window.prompt()` with an inline fallback that works on touch and does not block the page.
   - It must also work when `listen()` is called from StoryLearn or LabInBox, not just from the Chatbot screen.
   - A small modal/panel with an input and submit/cancel is enough; it must resolve a string and clean itself up.

5. **Clean the stub**
   - Remove the “STUB: …” developer note and the “This is the stub chatbot” response.
   - Remove the prompt-based fallback from the final user flow.

---

## Acceptance checklist

- [ ] `window.Chatbot.speak('hello')` speaks in a normal browser and always resolves.
- [ ] `window.Chatbot.listen()` returns a transcript when permission is granted.
- [ ] `listen()` returns `''` when permission is denied, the user cancels, or no result arrives.
- [ ] `speak()` returns safely when `speechSynthesis` is unavailable.
- [ ] Waveform shows `idle`, `listening`, `thinking`, and `speaking` distinctly.
- [ ] `#/chatbot` renders the tutor screen, not the stub note.
- [ ] At least three questions get meaningful local answers.
- [ ] Unknown questions get a helpful fallback, not a crash or silence.
- [ ] The language follows the student profile (`en-IN`, `hi-IN`, `mr-IN`).
- [ ] Text fallback works without `SpeechRecognition`, with no `window.prompt()`.
- [ ] StoryLearn can call `speak()` and `listen()` mid-story.
- [ ] LabInBox can call `speak()` and `listen()` mid-experiment.
- [ ] Works offline after the first load; no network requests for answers.
- [ ] 390px mobile layout has no horizontal overflow and usable controls.
- [ ] Browser console is clean.
- [ ] No `STUB` text or placeholder responses remain.

---

## Known traps

- Browser speech recognition generally requires a secure context. `http://127.0.0.1` and localhost work; `file://` does not.
- Voice lists load asynchronously. Never block UI while waiting for an ideal voice; set the language and speak.
- `speechSynthesis` may fire `onend` inconsistently after `cancel()`. Settle the promise exactly once.
- If recognition never ends, the 8-second timeout must still resolve. Clear the timeout in every terminal path.
- Chrome can emit `no-speech` and `aborted` errors. Both should resolve `''`, not reject.
- Do not use `alert()` or `prompt()` in the final flow. Both are blocked/ugly on mobile and break the field-terminal language.
- The waveform element only exists on the Chatbot screen. `_setState()` must not throw when it is absent.
- The current global is non-writable/non-configurable; rewrite the file instead of assigning a new object.
- If you add a new JS file, ask Aadesh to add it to `index.html` and the `sw.js` precache array.
- StoryLearn and LabInBox depend on your API. Tell them when `speak/listen` are stable.

---

## When you are done

1. Update the Part 2 rows in [BUILD_LOG.md](./BUILD_LOG.md).
2. Send Aadesh:
   - files changed or added,
   - browser and mobile test results,
   - what happens with microphone permission denied,
   - confirmation that offline mode still works.
3. Message Pritam and Anurag that the voice contract is stable, including any language or fallback quirks they should know.
