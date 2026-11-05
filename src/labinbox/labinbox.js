/**
 * StoryLab Voice — LabInBox
 * Owner: Anurag Kumbhar (Part 3)
 * Offline-first, voice-guided virtual science laboratory.
 */
;(function () {
  'use strict';

  var active = null;
  var STYLE_ID = 'labinbox-module-styles';

  function escapeHtml(value) {
    if (window.StoryLabUI && typeof window.StoryLabUI.escape === 'function') {
      return window.StoryLabUI.escape(String(value == null ? '' : value));
    }
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function addStyles(root) {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = [
        '.lb-wrap{margin-top:var(--sp-6);padding-bottom:calc(var(--sp-8) + 100px)}',
        '.lb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:var(--sp-4);margin-top:var(--sp-5)}',
        '.lb-card{min-width:0;border:1px solid var(--color-border);background:var(--color-panel);padding:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-3)}',
        '.lb-meta{font:var(--text-xs) var(--font-mono);letter-spacing:.1em;color:var(--color-text-muted);text-transform:uppercase}',
        '.lb-card h3{font-size:var(--text-xl);margin:0;color:var(--color-text-primary)}',
        '.lb-card p{margin:0;color:var(--color-text-secondary);line-height:1.6}',
        '.lb-screen{margin-top:var(--sp-5)}',
        '.lb-toolbar{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);flex-wrap:wrap}',
        '.lb-stage{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,1fr);gap:var(--sp-4);padding:var(--sp-4)}',
        '.lb-canvas-shell{min-width:0;border:1px solid var(--color-border);background:#0d100e;overflow:hidden}',
        '.lb-canvas{display:block;width:100%;height:auto;aspect-ratio:1/1;max-height:620px}',
        '.lb-side{display:flex;flex-direction:column;gap:var(--sp-3);min-width:0}',
        '.lb-readout{background:var(--color-bg-inset);border:1px solid var(--color-border);padding:var(--sp-4);min-height:145px}',
        '.lb-step{font:var(--text-xs) var(--font-mono);letter-spacing:.1em;color:var(--color-accent);text-transform:uppercase;margin-bottom:var(--sp-3)}',
        '.lb-instruction{font-size:var(--text-md);line-height:1.65;color:var(--color-text-primary);margin:0}',
        '.lb-hint{font-size:var(--text-xs);line-height:1.5;color:var(--color-text-muted);margin:0}',
        '.lb-actions{display:flex;flex-wrap:wrap;gap:var(--sp-2)}',
        '.lb-actions button{flex:1 1 110px}',
        '.lb-progress{height:5px;background:var(--color-border);overflow:hidden}',
        '.lb-progress span{display:block;height:100%;background:var(--color-accent);transition:width .25s ease}',
        '.lb-complete{border:1px solid var(--color-accent);background:var(--color-panel-raised,var(--color-panel));padding:var(--sp-5);margin-top:var(--sp-4)}',
        '.lb-complete h3{margin:0 0 var(--sp-2);color:var(--color-accent)}',
        '.lb-status{display:flex;align-items:center;gap:var(--sp-2);font:var(--text-xs) var(--font-mono);color:var(--color-text-muted)}',
        '.lb-status:before{content:"";width:7px;height:7px;background:var(--color-accent);border-radius:50%;display:inline-block}',
        '@media(max-width:760px){.lb-stage{grid-template-columns:1fr;padding:var(--sp-3)}.lb-canvas{max-height:none}.lb-wrap{padding-bottom:130px}.lb-readout{min-height:0}}',
        '@media(prefers-reduced-motion:reduce){.lb-progress span{transition:none}}'
      ].join('\n');
      document.head.appendChild(style);
    }
    if (root) root.setAttribute('data-labinbox', '');
  }

  function fetchJson(path) {
    return fetch(path).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + path + ' (' + response.status + ').');
      return response.json();
    });
  }

  function renderList(root, labs, error) {
    var cards = (labs || []).map(function (lab) {
      return '<article class="lb-card">' +
        '<div class="lb-meta">' + escapeHtml(lab.subject || 'Science') + ' / GRADE ' + escapeHtml(lab.grade || '—') + '</div>' +
        '<h3>' + escapeHtml(lab.title) + '</h3>' +
        '<p>Explore the apparatus, follow guided instructions and complete this interactive experiment.</p>' +
        '<div class="lb-toolbar"><span class="lb-status">' + escapeHtml(lab.duration || 'Guided experiment') + '</span>' +
        '<button class="btn btn-primary" type="button" data-start-lab="' + escapeHtml(lab.id) + '">START EXPERIMENT →</button></div>' +
        '</article>';
    }).join('');

    root.innerHTML = '<div class="lb-wrap">' +
      '<section class="panel"><div class="panel__header"><span class="panel__label">LAB IN BOX / MODULE 03 / SELECT EXPERIMENT</span><span class="status-dot status-dot--ok" style="margin-left:auto"></span></div>' +
      '<div class="panel__body" style="padding:var(--sp-5)"><p style="margin:0;color:var(--color-text-secondary);line-height:1.6">A guided virtual laboratory. Follow each instruction, identify the materials and observe the reaction.</p></div></section>' +
      (error ? '<div class="panel" role="alert" style="margin-top:var(--sp-4);padding:var(--sp-5)"><p class="text-secondary">' + escapeHtml(error) + '</p><button class="btn btn-secondary" type="button" data-retry-labs>RETRY</button></div>' : '') +
      (cards ? '<div class="lb-grid">' + cards + '</div>' : '<div class="panel" style="margin-top:var(--sp-4);padding:var(--sp-5)"><p class="text-secondary">No experiments are available yet.</p></div>') +
      '<div style="margin-top:var(--sp-5)"><button class="btn btn-secondary" type="button" data-home>← BACK HOME</button></div></div>';

    root.querySelectorAll('[data-start-lab]').forEach(function (button) {
      button.addEventListener('click', function () { startLab(root, button.getAttribute('data-start-lab')); });
    });
    var retry = root.querySelector('[data-retry-labs]');
    if (retry) retry.addEventListener('click', function () { loadList(root); });
    var home = root.querySelector('[data-home]');
    if (home) home.addEventListener('click', function () { navigateHome(); });
  }

  function loadList(root) {
    fetchJson('/data/labs/index.json').then(function (labs) {
      if (!isMounted(root)) return;
      renderList(root, Array.isArray(labs) ? labs : [], null);
    }).catch(function (error) {
      if (isMounted(root)) renderList(root, [], error.message || 'Could not load experiments.');
    });
  }

  function isMounted(root) {
    return !!(root && root.isConnected && window.LabInBox && active && active.root === root);
  }

  function showList(root) {
    cleanupActive();
    active = { root: root, cancelled: false, timers: [], engine: null };
    loadList(root);
  }

  function navigateHome() {
    if (window.StoryLabRouter && typeof window.StoryLabRouter.navigate === 'function') {
      window.StoryLabRouter.navigate('home');
    }
  }

  function createCanvasEngine(canvas) {
    var ctx = canvas.getContext('2d');
    var apparatus = [];
    var cssSize = 400;
    var dpr = 1;
    var animationFrame = null;
    var pendingAnimationResolve = null;
    var disposed = false;
    var stream = null;
    var streamStarted = 0;
    var streamDuration = 950;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      if (disposed) return;
      var rect = canvas.getBoundingClientRect();
      cssSize = Math.max(260, Math.floor(rect.width || 400));
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      ctx.setTransform(dpr * cssSize / 400, 0, 0, dpr * cssSize / 400, 0, 0);
      draw();
    }

    function roundedRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }

    function drawBeaker(item) {
      var x = Number(item.x) || 0, y = Number(item.y) || 0;
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 76); ctx.lineTo(x + 56, y + 76); ctx.lineTo(x + 60, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 62, y); ctx.stroke();
      ctx.fillStyle = item.display_color || item.color || '#ef4444'; ctx.globalAlpha = .78;
      ctx.beginPath(); ctx.moveTo(x + 5, y + 27); ctx.lineTo(x + 55, y + 27); ctx.lineTo(x + 53, y + 73); ctx.lineTo(x + 7, y + 73); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 9, y + 34); ctx.lineTo(x + 51, y + 34); ctx.stroke();
      ctx.fillStyle = '#f1eee5'; ctx.font = '10px "Google Sans Code", monospace'; ctx.textAlign = 'center';
      ctx.fillText(item.label || 'BEAKER', x + 30, y - 9);
      ctx.restore();
    }

    function flaskPath(item) {
      var x = Number(item.x) || 0, y = Number(item.y) || 0;
      ctx.beginPath(); ctx.moveTo(x + 15, y); ctx.lineTo(x + 45, y); ctx.lineTo(x + 45, y + 22);
      ctx.lineTo(x + 72, y + 75); ctx.quadraticCurveTo(x + 74, y + 82, x + 64, y + 82);
      ctx.lineTo(x - 4, y + 82); ctx.quadraticCurveTo(x - 14, y + 82, x - 12, y + 75);
      ctx.lineTo(x + 15, y + 22); ctx.closePath();
    }

    function drawFlask(item) {
      ctx.save();
      flaskPath(item);
      if (item.display_color || (item.contents && item.contents.length)) {
        ctx.save(); flaskPath(item); ctx.clip();
        ctx.fillStyle = item.display_color || item.color || '#ef4444'; ctx.globalAlpha = .78;
        ctx.fillRect(item.x - 20, item.y + 42, 120, 50); ctx.restore();
      }
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; flaskPath(item); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(item.x + 12, item.y + 2); ctx.lineTo(item.x + 48, item.y + 2); ctx.stroke();
      ctx.fillStyle = '#f1eee5'; ctx.font = '10px "Google Sans Code", monospace'; ctx.textAlign = 'center';
      ctx.fillText('REACTION FLASK', item.x + 30, item.y - 9);
      ctx.restore();
    }

    function drawStream(progress) {
      if (!stream) return;
      var from = find(stream.from), into = find(stream.into);
      if (!from || !into) return;
      var sx = from.x + 30, sy = from.y + 75;
      var tx = into.x + 30, ty = into.y + 25;
      var p = Math.max(0, Math.min(1, progress));
      ctx.save(); ctx.strokeStyle = stream.color; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 35, sy + 28, sx + (tx - sx) * p, sy + (ty - sy) * p); ctx.stroke();
      ctx.fillStyle = '#fff4cf'; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.arc(sx + (tx - sx) * p, sy + (ty - sy) * p, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function find(id) {
      for (var i = 0; i < apparatus.length; i += 1) if (apparatus[i].id === id) return apparatus[i];
      return null;
    }

    function draw() {
      if (disposed || !ctx) return;
      ctx.save(); ctx.setTransform(dpr * cssSize / 400, 0, 0, dpr * cssSize / 400, 0, 0);
      ctx.clearRect(0, 0, 400, 400); ctx.fillStyle = '#0d100e'; ctx.fillRect(0, 0, 400, 400);
      ctx.strokeStyle = 'rgba(245,158,11,.09)'; ctx.lineWidth = 1;
      for (var g = 20; g < 400; g += 20) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, 400); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(400, g); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(245,158,11,.22)'; ctx.strokeRect(8, 8, 384, 384);
      apparatus.forEach(function (item) { if (item.type === 'beaker') drawBeaker(item); else if (item.type === 'flask') drawFlask(item); });
      if (stream) drawStream(Math.min(1, (performance.now() - streamStarted) / streamDuration));
      ctx.restore();
    }

    function load(items) {
      apparatus = JSON.parse(JSON.stringify(items || []));
      apparatus.forEach(function (item) { if (!Array.isArray(item.contents)) item.contents = []; });
      draw();
    }

    function animatePour(fromId, intoId, color) {
      return new Promise(function (resolve) {
        if (disposed) return resolve();
        pendingAnimationResolve = resolve;
        var source = find(fromId), target = find(intoId);
        if (!source || !target) { pendingAnimationResolve = null; return resolve(); }
        if (reducedMotion) {
          target.contents.push(color); target.display_color = color; draw(); pendingAnimationResolve = null; return resolve();
        }
        stream = { from: fromId, into: intoId, color: color };
        streamStarted = performance.now();
        function frame(now) {
          if (disposed) { stream = null; return resolve(); }
          var p = Math.min(1, (now - streamStarted) / streamDuration);
          draw();
          if (p < 1) animationFrame = requestAnimationFrame(frame);
          else {
            stream = null; target.contents.push(color); target.display_color = color; draw();
            animationFrame = null; pendingAnimationResolve = null; resolve();
          }
        }
        animationFrame = requestAnimationFrame(frame);
      });
    }

    function react(targetId, resultColor) {
      var target = find(targetId);
      if (!target) return Promise.resolve();
      return new Promise(function (resolve) {
        pendingAnimationResolve = resolve;
        var started = performance.now(), duration = reducedMotion ? 0 : 900;
        function frame(now) {
          if (disposed) return resolve();
          var p = duration ? Math.min(1, (now - started) / duration) : 1;
          target.display_color = resultColor;
          target.reactionPulse = 1 - p;
          draw();
          if (p < 1) animationFrame = requestAnimationFrame(frame);
          else { target.reactionPulse = 0; animationFrame = null; pendingAnimationResolve = null; draw(); resolve(); }
        }
        animationFrame = requestAnimationFrame(frame);
      });
    }

    function dispose() {
      disposed = true;
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null; stream = null;
      if (pendingAnimationResolve) { var finish = pendingAnimationResolve; pendingAnimationResolve = null; finish(); }
      window.removeEventListener('resize', resize);
    }

    window.addEventListener('resize', resize);
    if (window.ResizeObserver) {
      var observer = new ResizeObserver(resize);
      observer.observe(canvas);
      var originalDispose = dispose;
      dispose = function () { observer.disconnect(); originalDispose(); };
    }
    resize();
    return { load: load, draw: draw, pour: animatePour, react: react, dispose: dispose };
  }

  function startLab(root, id) {
    cleanupActive();
    var token = { root: root, cancelled: false, timers: [], engine: null, onClick: null, busy: false, stepId: null, stepMap: {}, currentLab: null };
    active = token;
    fetchJson('/data/labs/' + encodeURIComponent(id) + '.json').then(function (lab) {
      if (token.cancelled || !isMounted(root)) return;
      if (!lab || !Array.isArray(lab.steps) || !Array.isArray(lab.apparatus)) throw new Error('This experiment has an invalid data file.');
      token.currentLab = lab;
      lab.steps.forEach(function (step) { token.stepMap[step.id] = step; });
      renderRunner(root, lab, token);
      token.engine = createCanvasEngine(root.querySelector('[data-lab-canvas]'));
      token.engine.load(lab.apparatus);
      runStep(token, lab.steps[0] && lab.steps[0].id);
    }).catch(function (error) {
      if (!token.cancelled && isMounted(root)) {
        root.innerHTML = '<div class="lb-wrap"><section class="panel" role="alert" style="padding:var(--sp-5)"><p>' + escapeHtml(error.message || 'Could not open this experiment.') + '</p><button class="btn btn-secondary" type="button" data-back-list>← ALL EXPERIMENTS</button></section></div>';
        root.querySelector('[data-back-list]').addEventListener('click', function () { showList(root); });
      }
    });
  }

  function renderRunner(root, lab, token) {
    root.innerHTML = '<div class="lb-wrap"><div class="lb-toolbar"><button class="btn btn-secondary" type="button" data-back-list>← ALL EXPERIMENTS</button><span class="lb-status">GUIDED SIMULATION / ' + escapeHtml(lab.grade || 'ALL GRADES') + '</span></div>' +
      '<section class="panel lb-screen"><div class="panel__header"><span class="panel__label">LAB IN BOX / ' + escapeHtml(lab.title.toUpperCase()) + '</span><span class="status-dot status-dot--ok" style="margin-left:auto"></span></div>' +
      '<div class="lb-stage"><div class="lb-canvas-shell"><canvas class="lb-canvas" data-lab-canvas role="img" aria-label="Virtual laboratory showing two beakers and a reaction flask"></canvas></div>' +
      '<div class="lb-side"><div class="lb-toolbar"><span class="lb-meta" data-step-count>PREPARING EXPERIMENT</span><span class="lb-meta">LIVE SIMULATION</span></div>' +
      '<div class="lb-progress" aria-label="Experiment progress"><span data-progress style="width:0%"></span></div>' +
      '<div class="lb-readout" aria-live="polite" aria-atomic="true"><div class="lb-step" data-step-label>INSTRUCTION</div><p class="lb-instruction" data-instruction>Preparing your laboratory…</p></div>' +
      '<p class="lb-hint" data-hint>Listen to the instruction, then choose an answer or use the microphone.</p>' +
      '<div class="lb-actions" data-choices></div><div class="lb-actions"><button class="btn btn-primary" type="button" data-listen>◉ SPEAK COMMAND</button><button class="btn btn-secondary" type="button" data-repeat>↻ REPEAT</button></div>' +
      '<p class="lb-hint" data-voice-status>Voice interaction is optional. You can complete every step using the answer buttons.</p></div></div></section>' +
      '<div data-completion></div></div>';
    root.querySelector('[data-back-list]').addEventListener('click', function () { showList(root); });
    root.querySelector('[data-repeat]').addEventListener('click', function () {
      if (token.currentStep && !token.cancelled) speak(token.currentStep.instruction, token);
    });
    root.querySelector('[data-listen]').addEventListener('click', function () { listenForAnswer(token); });
  }

  function speak(text, token) {
    if (token.cancelled) return Promise.resolve();
    if (window.Chatbot && typeof window.Chatbot.speak === 'function') {
      try { return Promise.resolve(window.Chatbot.speak(text)).catch(function () {}); }
      catch (error) { console.warn('[LabInBox] Narration unavailable:', error); }
    }
    return Promise.resolve();
  }

  function setInstruction(token, step, index, total) {
    var root = token.root;
    token.currentStep = step;
    root.querySelector('[data-step-label]').textContent = 'STEP ' + index + ' / ' + total;
    root.querySelector('[data-step-count]').textContent = 'EXPERIMENT IN PROGRESS';
    root.querySelector('[data-instruction]').textContent = step.instruction;
    root.querySelector('[data-progress]').style.width = Math.max(4, ((index - 1) / total) * 100) + '%';
    root.querySelector('[data-choices]').innerHTML = '';
    root.querySelector('[data-hint]').textContent = 'Listen to the instruction, then choose an answer or use the microphone.';
    root.querySelector('[data-listen]').disabled = false;
    root.querySelector('[data-voice-status]').textContent = 'Voice interaction is optional. You can complete every step using the answer buttons.';
  }

  async function runStep(token, stepId) {
    if (token.cancelled || token.busy || !stepId) return;
    var step = token.stepMap[stepId];
    if (!step) { showError(token, 'The next experiment step could not be found.'); return; }
    token.busy = true;
    token.stepId = stepId;
    var steps = token.currentLab.steps;
    var index = steps.findIndex(function (item) { return item.id === stepId; }) + 1;
    setInstruction(token, step, index, steps.length);
    await speak(step.instruction, token);
    if (token.cancelled || token.stepId !== stepId) { token.busy = false; return; }
    var action = step.action;
    if (!action) {
      token.busy = false;
      schedule(token, function () { runStep(token, step.next); }, 350);
      return;
    }
    if (action.type === 'wait_voice') {
      token.busy = false;
      renderChoices(token, step);
      return;
    }
    if (action.type === 'pour') {
      rootDisableControls(token, true);
      try { await token.engine.pour(action.from, action.into, action.color); }
      finally { rootDisableControls(token, false); }
      if (token.cancelled) return;
      token.busy = false;
      schedule(token, function () { runStep(token, step.next); }, 450);
      return;
    }
    if (action.type === 'react') {
      rootDisableControls(token, true);
      try { await token.engine.react(action.target, action.result_color); }
      finally { rootDisableControls(token, false); }
      if (token.cancelled) return;
      token.busy = false;
      schedule(token, function () { runStep(token, step.next); }, 450);
      return;
    }
    if (action.type === 'complete') {
      await completeLab(token);
      token.busy = false;
      return;
    }
    token.busy = false;
    showError(token, 'Unsupported experiment action: ' + action.type);
  }

  function renderChoices(token, step) {
    var container = token.root.querySelector('[data-choices]');
    var choices = step.action && Array.isArray(step.action.accepts) ? step.action.accepts : [];
    container.innerHTML = choices.map(function (choice) {
      return '<button class="btn btn-secondary" type="button" data-answer="' + escapeHtml(choice) + '">' + escapeHtml(choice.toUpperCase()) + '</button>';
    }).join('');
    container.querySelectorAll('[data-answer]').forEach(function (button) {
      button.addEventListener('click', function () { submitAnswer(token, button.getAttribute('data-answer'), 'tap'); });
    });
    token.root.querySelector('[data-hint]').textContent = 'Choose one of the answers below, or tap SPEAK COMMAND and say your answer.';
  }

  function rootDisableControls(token, disabled) {
    if (token.cancelled || !token.root.isConnected) return;
    token.root.querySelectorAll('[data-choices] button,[data-listen],[data-repeat]').forEach(function (button) { button.disabled = disabled; });
  }

  function matchesAnswer(transcript, accepts) {
    var normalized = String(transcript || '').toLowerCase().replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized) return false;
    return accepts.some(function (answer) {
      var term = String(answer).toLowerCase().trim();
      return term && (' ' + normalized + ' ').indexOf(' ' + term + ' ') !== -1;
    });
  }

  async function submitAnswer(token, answer, source) {
    if (token.cancelled || token.busy || !token.currentStep || token.currentStep.action.type !== 'wait_voice') return;
    var step = token.currentStep;
    if (!matchesAnswer(answer, step.action.accepts)) {
      token.root.querySelector('[data-voice-status]').textContent = 'That answer was not recognised. Try one of the available choices.';
      await speak('I did not catch that. Please try again.', token);
      return;
    }
    token.busy = true;
    token.root.querySelector('[data-choices]').innerHTML = '<span class="lb-status">CORRECT — CONTINUING</span>';
    token.root.querySelector('[data-listen]').disabled = true;
    token.root.querySelector('[data-voice-status]').textContent = source === 'voice' ? 'Voice answer recognised: ' + answer : 'Answer selected: ' + answer;
    await speak('Correct! Let us continue.', token);
    if (token.cancelled) return;
    token.busy = false;
    runStep(token, step.next);
  }

  async function listenForAnswer(token) {
    if (token.cancelled || token.busy || !token.currentStep || token.currentStep.action.type !== 'wait_voice') return;
    var supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!window.Chatbot || typeof window.Chatbot.listen !== 'function' || !supported) {
      token.root.querySelector('[data-voice-status]').textContent = 'Microphone speech recognition is unavailable. Please use an answer button.';
      return;
    }
    token.busy = true;
    rootDisableControls(token, true);
    token.root.querySelector('[data-voice-status]').textContent = 'Listening… speak clearly into your microphone.';
    var transcript = '';
    try { transcript = await window.Chatbot.listen(); }
    catch (error) { console.warn('[LabInBox] Voice input failed:', error); }
    if (token.cancelled) return;
    rootDisableControls(token, false);
    token.busy = false;
    if (!transcript) {
      token.root.querySelector('[data-voice-status]').textContent = 'No voice answer received. You can try again or choose an answer below.';
      return;
    }
    if (!matchesAnswer(transcript, token.currentStep.action.accepts)) {
      token.root.querySelector('[data-voice-status]').textContent = 'I heard “' + transcript + '”. That was not one of the expected answers. Please try again.';
      await speak('I heard ' + transcript + '. That is not the answer. Please try again.', token);
      return;
    }
    submitAnswer(token, transcript, 'voice');
  }

  function schedule(token, callback, delay) {
    var timer = window.setTimeout(function () {
      token.timers = token.timers.filter(function (item) { return item !== timer; });
      if (!token.cancelled) callback();
    }, delay);
    token.timers.push(timer);
  }

  async function completeLab(token) {
    var lab = token.currentLab;
    try {
      var all = (await window.DB.load('progress', 'student')) || {};
      all.labs = all.labs || {};
      all.labs[lab.id] = { completed: true, timestamp: Date.now() };
      await window.DB.save('progress', 'student', all);
      if (window.StoryLabState && typeof window.StoryLabState.logEvent === 'function') {
        try { await window.StoryLabState.logEvent('lab.completed', 'Completed ' + lab.title, { labId: lab.id, subject: lab.subject }); }
        catch (eventError) { console.warn('[LabInBox] Could not add timeline event:', eventError); }
      }
      if (token.cancelled) return;
      token.root.querySelector('[data-progress]').style.width = '100%';
      token.root.querySelector('[data-step-count]').textContent = 'EXPERIMENT COMPLETED';
      token.root.querySelector('[data-step-label]').textContent = 'SUCCESS';
      token.root.querySelector('[data-instruction]').textContent = 'You completed the ' + lab.title + ' experiment.';
      token.root.querySelector('[data-choices]').innerHTML = '';
      token.root.querySelector('[data-listen]').disabled = true;
      token.root.querySelector('[data-repeat]').disabled = true;
      token.root.querySelector('[data-voice-status]').textContent = 'Your completion has been saved on this device.';
      token.root.querySelector('[data-completion]').innerHTML = '<section class="lb-complete" role="status"><h3>✓ EXPERIMENT COMPLETE</h3><p style="margin:0 0 var(--sp-4);color:var(--color-text-secondary)">Excellent work! Your progress is saved in your learning record.</p><div class="lb-actions"><button class="btn btn-primary" type="button" data-run-again>↻ RUN AGAIN</button><button class="btn btn-secondary" type="button" data-all-labs>← ALL EXPERIMENTS</button></div></section>';
      token.root.querySelector('[data-run-again]').addEventListener('click', function () { startLab(token.root, lab.id); });
      token.root.querySelector('[data-all-labs]').addEventListener('click', function () { showList(token.root); });
      await speak('Excellent work! You have completed the experiment. Your progress has been saved.', token);
    } catch (error) {
      showError(token, 'The experiment finished, but progress could not be saved. Please check local storage and try again.');
      console.error('[LabInBox] Progress save failed:', error);
    }
  }

  function showError(token, message) {
    if (token.cancelled || !token.root.isConnected) return;
    var target = token.root.querySelector('[data-completion]');
    if (target) target.innerHTML = '<div class="lb-complete" role="alert"><h3>LAB ERROR</h3><p>' + escapeHtml(message) + '</p><button class="btn btn-secondary" type="button" data-retry-lab>RESTART EXPERIMENT</button></div>';
    var retry = token.root.querySelector('[data-retry-lab]');
    if (retry) retry.addEventListener('click', function () { startLab(token.root, token.currentLab.id); });
  }

  function cleanupActive() {
    if (!active) return;
    var token = active;
    token.cancelled = true;
    token.timers.forEach(function (timer) { window.clearTimeout(timer); });
    token.timers = [];
    if (token.engine) token.engine.dispose();
    if (window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') window.speechSynthesis.cancel();
    active = null;
  }

  function mount(root) {
    cleanupActive();
    if (!root) return;
    addStyles(root);
    var token = { root: root, cancelled: false, timers: [], engine: null };
    active = token;
    loadList(root);
  }

  function unmount() {
    cleanupActive();
  }

  window.LabInBox = { mount: mount, unmount: unmount };
  console.log('[LabInBox] module ready');
})();
