/**
 * StoryLab Voice — Chatbot Core
 * Owner: Ritesh Gavhane (Part 2)
 *
 * Exports: window.Chatbot
 *   .speak(text)  → Promise<void>    — TTS narration
 *   .listen()     → Promise<string>  — STT transcription
 *   .mount(root)  → void             — render chatbot screen
 *   .state        → 'idle'|'listening'|'thinking'|'speaking'
 *
 * TODO (Ritesh): Replace stub implementations below with full
 * Web Speech API integration from PART_2_CHATBOT.md
 */
;(function () {
  'use strict';

  var state = 'idle';

  // ── speak ─────────────────────────────────────────────────
  function speak(text) {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) {
        console.log('[Chatbot SPEAK]', text);
        setTimeout(resolve, 300);
        return;
      }
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.lang  = 'en-IN';
      utter.rate  = 0.9;
      utter.pitch = 1.0;
      utter.onstart = function () { _setState('speaking'); };
      utter.onend   = function () { _setState('idle'); resolve(); };
      utter.onerror = function (e) {
        console.warn('[Chatbot] TTS error:', e.error);
        _setState('idle');
        resolve();
      };
      _setState('speaking');
      window.speechSynthesis.speak(utter);
    });
  }

  // ── listen ────────────────────────────────────────────────
  function listen() {
    return new Promise(function (resolve) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SR) {
        // Text fallback
        _setState('listening');
        var answer = window.prompt('🎤 Type your answer (voice not supported):') || '';
        _setState('idle');
        resolve(answer);
        return;
      }

      var rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      _setState('listening');

      var resolved = false;
      var timeout = setTimeout(function () {
        if (!resolved) {
          rec.stop();
          _setState('idle');
          resolve('');
        }
      }, 8000);

      rec.onresult = function (e) {
        resolved = true;
        clearTimeout(timeout);
        var transcript = e.results[0][0].transcript;
        _setState('idle');
        resolve(transcript);
      };
      rec.onerror = function (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.warn('[Chatbot] STT error:', e.error);
          _setState('idle');
          resolve('');
        }
      };
      rec.onend = function () {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          _setState('idle');
          resolve('');
        }
      };

      rec.start();
    });
  }

  // ── mount ─────────────────────────────────────────────────
  function mount(root) {
    root.innerHTML = [
      '<div class="panel" style="margin-top:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <span class="panel__label">AI VOICE TUTOR / MODULE 02</span>',
      '    <span class="status-dot status-dot--ok" style="margin-left:auto"></span>',
      '  </div>',
      '  <div class="panel__body" style="padding:var(--sp-6)">',
      '    <div id="chatbot-readout" style="',
      '      background:var(--color-bg-inset);',
      '      border:1px solid var(--color-border);',
      '      padding:var(--sp-4) var(--sp-5);',
      '      font-family:var(--font-mono);',
      '      font-size:var(--text-sm);',
      '      color:var(--color-text-primary);',
      '      min-height:80px;',
      '      line-height:1.6;',
      '      margin-bottom:var(--sp-4)">',
      '      <span class="text-muted">System: </span>Ask me anything. I am listening.',
      '    </div>',
      '    <div id="chatbot-waveform" class="waveform" data-state="idle" style="margin-bottom:var(--sp-5)" aria-hidden="true">',
      '      <span class="waveform__bar"></span>',
      '      <span class="waveform__bar"></span>',
      '      <span class="waveform__bar"></span>',
      '      <span class="waveform__bar"></span>',
      '      <span class="waveform__bar"></span>',
      '    </div>',
      '    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">',
      '      <button class="btn btn-primary" id="btn-chatbot-listen">◉ SPEAK NOW</button>',
      '      <button class="btn btn-secondary" onclick="StoryLabRouter.navigate(\'home\')">← BACK</button>',
      '    </div>',
      '    <p class="text-mono text-muted" style="font-size:var(--text-xs);margin-top:var(--sp-4);letter-spacing:0.1em">',
      '      STUB: Full intent matching in PART_2_CHATBOT.md — Ritesh to implement.',
      '    </p>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.getElementById('btn-chatbot-listen').addEventListener('click', function () {
      var readout = document.getElementById('chatbot-readout');
      listen().then(function (transcript) {
        if (!transcript) return;
        readout.innerHTML = '<span class="text-secondary">You: </span>' + transcript;
        return speak('You said: ' + transcript + '. This is the stub chatbot. Ritesh will add full responses.');
      }).then(function () {
        readout.innerHTML += '<br><span class="text-accent">Tutor: </span>Module 02 stub active. Full implementation coming.';
      });
    });
  }

  // ── internal ──────────────────────────────────────────────
  function _setState(s) {
    state = s;
    var wf = document.getElementById('chatbot-waveform');
    if (wf) wf.setAttribute('data-state', s);
  }

  Object.defineProperty(window, 'Chatbot', {
    value: { speak: speak, listen: listen, mount: mount, get state() { return state; } },
    writable: false,
    configurable: false
  });

  console.log('[Chatbot] window.Chatbot stub ready');
})();

