# Part 1 — StoryLearn
## Owner: Pritam Tatkari

> **Note:** Foundation has already built the stub in `src/storylearn/storylearn.js` and  
> created both story JSON files (`math-market.json`, `science-plants.json`).  
> Your job: replace the stub `mount()` with the full branching story player below.
> Interactive, voice-narrated, branching educational stories across Math, Science, Social Studies, EVS.

---

## What You Build

- `src/storylearn/storylearn.js` — module entry, exports `window.StoryLearn`
- `src/storylearn/story-player.js` — plays through a story step by step
- `data/stories/*.json` — story content files (at least 2 stories for prototype)
- Story list screen + story player screen (HTML generated in JS)

---

## Data Format (`data/stories/math-market.json`)

```json
{
  "id": "math-market",
  "title": "The Market Day",
  "subject": "Math",
  "grade": "3-5",
  "steps": [
    {
      "id": "s1",
      "type": "narrate",
      "text": "Rani went to the village market with 50 rupees. She wants to buy mangoes that cost 8 rupees each.",
      "next": "s2"
    },
    {
      "id": "s2",
      "type": "question",
      "text": "How many mangoes can Rani buy with 50 rupees?",
      "hint": "Try dividing 50 by 8.",
      "options": [
        { "label": "6 mangoes", "correct": true,  "next": "s3_correct" },
        { "label": "7 mangoes", "correct": false, "next": "s3_wrong"   },
        { "label": "5 mangoes", "correct": false, "next": "s3_wrong"   }
      ]
    },
    {
      "id": "s3_correct",
      "type": "narrate",
      "text": "Correct! 50 divided by 8 is 6, with 2 rupees left over. Rani buys 6 mangoes!",
      "next": "end"
    },
    {
      "id": "s3_wrong",
      "type": "narrate",
      "text": "Not quite. Let's think again — 8 times 6 is 48, which is less than 50. 8 times 7 is 56, which is more than 50. So the answer is 6.",
      "next": "end"
    },
    {
      "id": "end",
      "type": "complete",
      "text": "Great job! You finished The Market Day story."
    }
  ]
}
```

---

## Story Player Logic

```js
window.StoryLearn = {
  mount(root) {
    // Render story list
    fetch('/data/stories/index.json')
      .then(r => r.json())
      .then(stories => renderList(root, stories));
  }
};

function renderList(root, stories) {
  root.innerHTML = `
    <section class="story-list panel">
      <header class="panel__header">
        <span class="panel__label">STORY LEARN / SELECT MODULE</span>
      </header>
      <div class="vent-divider"></div>
      ${stories.map(s => `
        <div class="story-item" onclick="playStory('${s.id}')">
          <span class="story-item__subject badge badge--${s.subject.toLowerCase()}">${s.subject}</span>
          <span class="story-item__title">${s.title}</span>
          <span class="story-item__grade">GR ${s.grade}</span>
        </div>
      `).join('')}
    </section>
  `;
}

async function playStory(id) {
  const story = await fetch(`/data/stories/${id}.json`).then(r => r.json());
  let currentStepId = story.steps[0].id;

  async function playStep() {
    const step = story.steps.find(s => s.id === currentStepId);
    if (!step) return;

    // Speak the text
    await window.Chatbot.speak(step.text);

    if (step.type === 'narrate') {
      currentStepId = step.next;
      await playStep();
    }

    if (step.type === 'question') {
      renderQuestion(step, async (chosen) => {
        currentStepId = chosen.next;
        await playStep();
      });
    }

    if (step.type === 'complete') {
      await saveProgress(id);
    }
  }

  await playStep();
}

async function saveProgress(storyId) {
  const progress = (await window.DB.load('progress', 'student')) || {};
  progress.stories = progress.stories || {};
  progress.stories[storyId] = { completed: true, timestamp: Date.now() };
  await window.DB.save('progress', 'student', progress);
}
```

---

## Voice Input for Questions

When a question step loads:
1. **Display** the options as tappable buttons (for touch users).
2. **Also call** `window.Chatbot.listen()` to accept a spoken answer.
3. Match the transcript to an option label (fuzzy match — `includes()` is fine for prototype).
4. Highlight the matched option, then proceed.

```js
async function listenForAnswer(options) {
  const transcript = await window.Chatbot.listen();
  const match = options.find(o =>
    transcript.toLowerCase().includes(o.label.toLowerCase().split(' ')[0])
  );
  return match || null;
}
```

---

## Stories to Build (Prototype — 2 minimum)

| File | Subject | Topic |
|------|---------|-------|
| `math-market.json` | Math | Division / marketplace |
| `science-plants.json` | Science | Photosynthesis |

Add an `index.json` listing both:
```json
[
  { "id": "math-market",    "title": "The Market Day",     "subject": "Math",    "grade": "3-5" },
  { "id": "science-plants", "title": "How Plants Eat Light","subject": "Science", "grade": "4-6" }
]
```

**Add both JSON file paths to `sw.js` PRECACHE array** (coordinate with Foundation owner).

---

## Acceptance Criteria

- [ ] Story list screen renders and shows 2+ stories
- [ ] Tapping a story plays narration via `window.Chatbot.speak()`
- [ ] Question options render as tappable buttons
- [ ] Correct/wrong branches work
- [ ] Completion saves progress to IndexedDB
- [ ] Works with no internet (JSON is pre-cached by SW)
- [ ] Voice answer recognition works (at least tap fallback)

