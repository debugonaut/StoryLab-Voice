# Part 3 — LabInBox
## Owner: Anurag Kumbhar

> **Note:** Foundation has already built the stub in `src/labinbox/labinbox.js` and  
> created the lab JSON file (`acid-base.json`).  
> Your job: replace the stub `mount()` with the full Canvas engine + lab runner below.

> 2D voice-guided virtual science experiment simulator on HTML5 Canvas.

---

## What You Build

- `src/labinbox/labinbox.js` — module entry, exports `window.LabInBox`
- `src/labinbox/lab-runner.js` — step-by-step lab executor
- `src/labinbox/canvas-engine.js` — draws apparatus on canvas
- `data/labs/*.json` — lab step scripts (1 lab minimum for prototype)

---

## Data Format (`data/labs/acid-base.json`)

```json
{
  "id": "acid-base",
  "title": "Acids & Bases",
  "subject": "Science",
  "grade": "6-8",
  "apparatus": [
    { "id": "beaker-red",  "type": "beaker", "label": "Red Liquid (Acid)",  "color": "#ef4444", "x": 80,  "y": 200 },
    { "id": "beaker-blue", "type": "beaker", "label": "Blue Liquid (Base)", "color": "#3b82f6", "x": 220, "y": 200 },
    { "id": "flask",       "type": "flask",  "label": "Flask",              "color": "#1c1c1c", "x": 150, "y": 300, "contents": [] }
  ],
  "steps": [
    {
      "id": "step1",
      "instruction": "Look at the two beakers. The red one contains an acid. The blue one contains a base.",
      "action": null,
      "next": "step2"
    },
    {
      "id": "step2",
      "instruction": "Tell me: which liquid should we pour into the flask first? Say: red or blue.",
      "action": { "type": "wait_voice", "accepts": ["red", "acid"] },
      "next": "step3"
    },
    {
      "id": "step3",
      "instruction": "Correct! We pour the red acid into the flask.",
      "action": { "type": "pour", "from": "beaker-red", "into": "flask", "color": "#ef4444" },
      "next": "step4"
    },
    {
      "id": "step4",
      "instruction": "Now pour the blue base into the flask. Say: pour blue.",
      "action": { "type": "wait_voice", "accepts": ["blue", "base"] },
      "next": "step5"
    },
    {
      "id": "step5",
      "instruction": "The acid and base react! The mixture turns purple — this is a neutralization reaction!",
      "action": { "type": "react", "target": "flask", "result_color": "#9333ea" },
      "next": "end"
    },
    {
      "id": "end",
      "instruction": "Excellent work! You completed the Acids and Bases experiment.",
      "action": { "type": "complete" }
    }
  ]
}
```

---

## Canvas Engine (canvas-engine.js)

Keep it dead simple — primitives only, no external libraries.

```js
window.LabCanvas = {
  canvas: null,
  ctx: null,
  apparatus: [],

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.apparatus = [];
  },

  load(apparatusArr) {
    this.apparatus = JSON.parse(JSON.stringify(apparatusArr));
    this.draw();
  },

  draw() {
    const { ctx, canvas, apparatus } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark background (instrument panel)
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    apparatus.forEach(item => {
      if (item.type === 'beaker') drawBeaker(ctx, item);
      if (item.type === 'flask')  drawFlask(ctx, item);
    });
  },

  // Animate a pour action
  async pour(fromId, intoId, color) {
    const from  = this.apparatus.find(a => a.id === fromId);
    const into  = this.apparatus.find(a => a.id === intoId);
    if (!from || !into) return;

    // Simple animation: draw a colored line from source to target over 1s
    // Then update flask contents color
    into.contents.push(color);
    into.display_color = mixColors(into.contents);
    this.draw();
  },

  react(targetId, resultColor) {
    const target = this.apparatus.find(a => a.id === targetId);
    if (target) { target.display_color = resultColor; this.draw(); }
  }
};

function drawBeaker(ctx, item) {
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(item.x, item.y, 60, 80);

  // Fill with liquid color
  ctx.fillStyle = item.display_color || item.color;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(item.x + 2, item.y + 20, 56, 58);
  ctx.globalAlpha = 1;

  // Label
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '10px "Google Sans Code", monospace';
  ctx.fillText(item.label, item.x, item.y - 6);
}

function drawFlask(ctx, item) {
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  // Simplified flask shape: trapezoid
  ctx.beginPath();
  ctx.moveTo(item.x + 15, item.y);
  ctx.lineTo(item.x + 45, item.y);
  ctx.lineTo(item.x + 70, item.y + 80);
  ctx.lineTo(item.x - 10, item.y + 80);
  ctx.closePath();
  ctx.stroke();

  if (item.display_color) {
    ctx.fillStyle = item.display_color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#e8e8e8';
  ctx.font = '10px "Google Sans Code", monospace';
  ctx.fillText('FLASK', item.x, item.y - 6);
}

function mixColors(colors) {
  // Prototype: just return the last color added (real mixing not needed)
  return colors[colors.length - 1] || '#1c1c1c';
}
```

---

## Lab Runner (lab-runner.js)

```js
window.LabInBox = {
  mount(root) {
    // Render lab list
    fetch('/data/labs/index.json')
      .then(r => r.json())
      .then(labs => renderLabList(root, labs));
  }
};

function renderLabList(root, labs) {
  root.innerHTML = `
    <section class="lab-list panel">
      <header class="panel__header">
        <span class="panel__label">LAB IN BOX / SELECT EXPERIMENT</span>
      </header>
      <div class="vent-divider"></div>
      ${labs.map(l => `
        <div class="lab-item" onclick="runLab('${l.id}')">
          <span class="lab-item__title">${l.title}</span>
          <span class="lab-item__subject badge">${l.subject}</span>
        </div>
      `).join('')}
    </section>
  `;
}

async function runLab(id) {
  const lab = await fetch(`/data/labs/${id}.json`).then(r => r.json());
  // The router mounts you inside #module-mount; pass root into runLab.
  const root = document.getElementById('module-mount');

  root.innerHTML = `
    <section class="lab-screen panel">
      <header class="panel__header">
        <span class="panel__label">LAB IN BOX / ${lab.title.toUpperCase()}</span>
      </header>
      <div class="vent-divider"></div>
      <canvas id="lab-canvas" width="400" height="400" style="border:1px solid var(--color-border)"></canvas>
      <div class="lab-instruction panel__readout" id="lab-instruction">Initializing...</div>
      <div class="lab-controls">
        <button class="btn-primary" id="btn-lab-listen">◉ SPEAK COMMAND</button>
        <button class="btn-secondary" onclick="StoryLabRouter.navigate('labinbox')">← BACK</button>
      </div>
    </section>
  `;

  window.LabCanvas.init(document.getElementById('lab-canvas'));
  window.LabCanvas.load(lab.apparatus);

  let stepIndex = 0;

  async function runStep() {
    const step = lab.steps[stepIndex];
    if (!step) return;

    document.getElementById('lab-instruction').textContent = step.instruction;
    await window.Chatbot.speak(step.instruction);

    if (step.action === null) {
      stepIndex++;
      await runStep();
      return;
    }

    if (step.action.type === 'wait_voice') {
      const transcript = await window.Chatbot.listen();
      const accepted = step.action.accepts.some(a => transcript.toLowerCase().includes(a));
      if (!accepted) {
        await window.Chatbot.speak('I did not catch that. Try again.');
        await runStep(); // retry same step
        return;
      }
      stepIndex++;
      await runStep();
      return;
    }

    if (step.action.type === 'pour') {
      await window.LabCanvas.pour(step.action.from, step.action.into, step.action.color);
      stepIndex++;
      await runStep();
      return;
    }

    if (step.action.type === 'react') {
      window.LabCanvas.react(step.action.target, step.action.result_color);
      stepIndex++;
      await runStep();
      return;
    }

    if (step.action.type === 'complete') {
      await saveLabProgress(id);
    }
  }

  await runStep();
}

async function saveLabProgress(labId) {
  const progress = (await window.DB.load('progress', 'student')) || {};
  progress.labs = progress.labs || {};
  progress.labs[labId] = { completed: true, timestamp: Date.now() };
  await window.DB.save('progress', 'student', progress);
}
```

---

## Labs to Build (Prototype — 1 minimum)

| File | Subject | Experiment |
|------|---------|-----------|
| `acid-base.json` | Science | Acid-Base Neutralization |

Add `data/labs/index.json`:
```json
[
  { "id": "acid-base", "title": "Acids & Bases", "subject": "Science", "grade": "6-8" }
]
```

**Add lab JSON paths to `sw.js` PRECACHE** (coordinate with Foundation owner).

---

## Acceptance Criteria

- [ ] Lab list screen renders
- [ ] Canvas draws at least 2 beakers and a flask
- [ ] Narration plays each step via `window.Chatbot.speak()`
- [ ] Voice command `"red"` advances the pour step
- [ ] Pour action changes flask color on canvas
- [ ] React action changes flask to result color
- [ ] Completion saves to IndexedDB
- [ ] Works offline (JSON pre-cached)

