# Part 2 — AI Voice Chatbot Core
## Owner: Ritesh Gavhane

> **Note:** Foundation has already built a working stub in `src/chatbot/chatbot.js`  
> with real Web Speech API (TTS + STT) and the waveform CSS. Your job is to expand  
> the `mount()` function with full intent matching and clean up the chatbot screen UI.

> The voice engine everyone else calls. The "instrument readout" at the heart of the panel.

---

## What You Build

- `src/chatbot/chatbot.js` — exports `window.Chatbot`
- Chatbot UI screen (when navigated to directly)
- Intent matching for Q&A (static keyword map — no cloud AI needed for prototype)

---

## Public API (the contract — don't change signatures)

```js
window.Chatbot = {
  // Speak text aloud using TTS. Returns Promise that resolves when done speaking.
  speak(text) → Promise<void>,

  // Start listening. Returns Promise<string> (the transcript).
  // Resolves after the user stops speaking (or times out after 8s).
  listen() → Promise<string>,

  // Mount the chatbot UI into a DOM element (called by router).
  mount(rootElement) → void,

  // Current state: 'idle' | 'listening' | 'thinking' | 'speaking'
  state: 'idle'
}
```

---

## Implementation

### TTS — `Chatbot.speak(text)`

```js
speak(text) {
  return new Promise(resolve => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';   // Indian English — closer to students' accent
    utter.rate = 0.9;        // Slightly slower for comprehension
    utter.pitch = 1.0;
    utter.onend = () => { this.state = 'idle'; resolve(); };
    this.state = 'speaking';
    updateWaveform('speaking');
    speechSynthesis.speak(utter);
  });
},
```

### STT — `Chatbot.listen()`

```js
listen() {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Fallback: text input
      return resolve(promptTextFallback());
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.timeout = 8000;

    this.state = 'listening';
    updateWaveform('listening');

    rec.onresult  = e => resolve(e.results[0][0].transcript);
    rec.onerror   = e => { console.warn('STT error', e); resolve(''); };
    rec.onend     = ()  => { this.state = 'idle'; updateWaveform('idle'); };
    rec.start();
  });
},
```

### Text Fallback

When `SpeechRecognition` is unavailable, show a simple text input modal:
```js
function promptTextFallback() {
  return new Promise(resolve => {
    const answer = prompt('Type your answer:');
    resolve(answer || '');
  });
}
```

---

## Waveform UI

The chatbot waveform is the **signature visual** — it must always reflect current state.

```js
function updateWaveform(state) {
  const wf = document.getElementById('chatbot-waveform');
  if (!wf) return;

  // states: idle → bars static; listening → bars pulse green; speaking → bars pulse amber
  wf.dataset.state = state;
}
```

```html
<div id="chatbot-waveform" class="waveform-bar" data-state="idle">
  <span></span><span></span><span></span><span></span><span></span>
</div>
```

```css
/* tokens already define --color-ok and --color-accent */
.waveform-bar[data-state="listening"] span { background: var(--color-ok);     animation: pulse 0.5s ease-in-out infinite alternate; }
.waveform-bar[data-state="speaking"]  span { background: var(--color-accent);  animation: pulse 0.7s ease-in-out infinite alternate; }
.waveform-bar[data-state="idle"]      span { background: var(--color-text-muted); animation: none; height: 6px; }
.waveform-bar[data-state="thinking"]  span { background: var(--color-warn);    animation: pulse 1.2s ease-in-out infinite alternate; }
```

---

## Intent Matching (Chatbot Screen Q&A)

When a student asks a free question on the Chatbot screen (not inside a story), use a simple keyword-intent map:

```js
const INTENTS = [
  {
    keywords: ['photosynthesis', 'plants', 'food', 'sunlight'],
    response: 'Plants make their own food using sunlight, water, and carbon dioxide. This process is called photosynthesis.'
  },
  {
    keywords: ['division', 'divide', 'share', 'split'],
    response: 'Division means splitting a number into equal parts. For example, 50 divided by 8 equals 6, with 2 left over.'
  },
  {
    keywords: ['hello', 'hi', 'namaste', 'helo'],
    response: 'Namaste! I am your StoryLab Voice tutor. You can ask me a question, or go to Story Learn to start a lesson!'
  },
  // Add more as needed
];

function matchIntent(transcript) {
  const lower = transcript.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keywords.some(k => lower.includes(k))) {
      return intent.response;
    }
  }
  return "I'm not sure about that yet. Try asking about plants, division, or say hello!";
}
```

---

## Chatbot Screen Layout

```js
mount(root) {
  root.innerHTML = `
    <section class="chatbot-screen panel">
      <header class="panel__header">
        <span class="panel__label">AI VOICE TUTOR / ACTIVE SESSION</span>
        <span class="status-dot status-dot--ok"></span>
      </header>
      <div class="vent-divider"></div>

      <div class="chatbot-readout" id="chatbot-readout">
        <p class="chatbot-readout__text">Ask me anything. I am listening.</p>
      </div>

      <div id="chatbot-waveform" class="waveform-bar" data-state="idle">
        <span></span><span></span><span></span><span></span><span></span>
      </div>

      <div class="chatbot-controls">
        <button class="btn-primary" id="btn-speak">◉ SPEAK NOW</button>
        <button class="btn-secondary" onclick="StoryLabRouter.navigate('home')">← BACK</button>
      </div>
    </section>
  `;

  document.getElementById('btn-speak').addEventListener('click', async () => {
    const transcript = await window.Chatbot.listen();
    if (!transcript) return;

    updateReadout(`You: ${transcript}`);
    // `Chatbot.state` is a read-only getter; the module owns its state
    // transitions. The screen mirrors the waveform while matching.
    updateWaveform('thinking');

    await new Promise(r => setTimeout(r, 400)); // brief "thinking" pause
    const response = matchIntent(transcript);
    updateReadout(`Tutor: ${response}`);
    await window.Chatbot.speak(response);
  });
},
```

---

## Acceptance Criteria

- [ ] `window.Chatbot.speak("hello")` plays audio
- [ ] `window.Chatbot.listen()` returns a transcript string
- [ ] Waveform animates correctly in each state
- [ ] Text fallback shows when SpeechRecognition is unavailable
- [ ] Chatbot screen renders and responds to at least 3 different questions
- [ ] `window.StoryLearn` can call `Chatbot.speak()` and `Chatbot.listen()` mid-story
- [ ] No errors in console when offline

