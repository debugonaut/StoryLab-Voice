/**
 * StoryLab Voice — AI Voice Tutor (Chatbot Core)
 * Owner: Ritesh Gavhane (Part 2)
 *
 * Exports: window.Chatbot
 *   .speak(text)  → Promise<void>    — TTS narration (always resolves)
 *   .listen()     → Promise<string>  — STT transcription (always resolves; '' on error/timeout/cancel)
 *   .mount(root)  → void             — render the AI Voice Tutor screen
 *   .unmount()    → void             — cancel speech, stop recognition, reset state
 *   .state        → 'idle'|'listening'|'thinking'|'speaking'
 */
;(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
   * State
   * ───────────────────────────────────────────────────────── */
  var _state = 'idle';
  var _activeRec = null;      // live SpeechRecognition instance
  var _utterance = null;      // live SpeechSynthesisUtterance
  var _unmounted = false;
  var _fallbackOpen = false;  // inline text-fallback panel is showing

  /* ─────────────────────────────────────────────────────────
   * Helpers
   * ───────────────────────────────────────────────────────── */
  function _getLanguageTag() {
    try {
      var profile = window.StoryLabState && window.StoryLabState.getProfile();
      var lang = profile && profile.language;
      var map = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
      return map[lang] || 'en-IN';
    } catch (e) {
      return 'en-IN';
    }
  }

  function _setState(s) {
    _state = s;
    /* Update every waveform on the page that carries data-state
       (there may be one on the chatbot screen and one in the StoryLearn voice indicator) */
    var waveforms = document.querySelectorAll('[data-state]');
    for (var i = 0; i < waveforms.length; i++) {
      waveforms[i].setAttribute('data-state', s);
    }
  }

  function _esc(value) {
    return window.StoryLabUI
      ? window.StoryLabUI.escape(value)
      : String(value == null ? '' : value)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─────────────────────────────────────────────────────────
   * speak(text) — TTS
   * ───────────────────────────────────────────────────────── */
  function speak(text) {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) {
        console.log('[Chatbot SPEAK]', text);
        _setState('idle');
        setTimeout(resolve, 250);
        return;
      }

      /* Settle exactly once */
      var settled = false;
      function settle() {
        if (settled) return;
        settled = true;
        _utterance = null;
        _setState('idle');
        resolve();
      }

      window.speechSynthesis.cancel();

      var utter = new SpeechSynthesisUtterance(text);
      utter.lang  = _getLanguageTag();
      utter.rate  = 0.92;
      utter.pitch = 1.0;

      utter.onstart = function () { _setState('speaking'); };
      utter.onend   = function () { settle(); };
      utter.onerror = function (e) {
        /* 'interrupted' fires when cancel() was called — treat as normal end */
        if (e.error !== 'interrupted') console.warn('[Chatbot] TTS error:', e.error);
        settle();
      };

      _setState('speaking');
      _utterance = utter;
      window.speechSynthesis.speak(utter);

      /* Chrome bug: synthesis can stall without firing onend.
         Belt-and-suspenders: resolve after text length × 80ms + 3s grace. */
      var safetyMs = Math.max(4000, text.length * 80 + 3000);
      setTimeout(function () { settle(); }, safetyMs);
    });
  }

  /* ─────────────────────────────────────────────────────────
   * listen() — STT with inline text fallback
   * ───────────────────────────────────────────────────────── */
  function listen() {
    return new Promise(function (resolve) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SR) {
        /* No speech recognition: show the inline text fallback panel */
        _inlineTextFallback(resolve);
        return;
      }

      _setState('listening');

      var rec = new SR();
      rec.lang = _getLanguageTag();
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      _activeRec = rec;

      var settled = false;
      function settle(transcript) {
        if (settled) return;
        settled = true;
        _activeRec = null;
        _setState('idle');
        resolve(transcript || '');
      }

      var timeout = setTimeout(function () { try { rec.stop(); } catch (e) {} }, 8000);

      rec.onresult = function (e) {
        clearTimeout(timeout);
        settle(e.results[0][0].transcript);
      };
      rec.onerror = function (e) {
        clearTimeout(timeout);
        /* Denied, no-speech, aborted, not-allowed — all resolve '' */
        if (e.error !== 'aborted') console.warn('[Chatbot] STT error:', e.error);
        settle('');
      };
      rec.onend = function () {
        clearTimeout(timeout);
        settle('');
      };

      try {
        rec.start();
      } catch (e) {
        console.warn('[Chatbot] Could not start recognition:', e);
        clearTimeout(timeout);
        settle('');
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
   * Inline text fallback — renders a compact input panel
   * in the chatbot screen; never blocks the page.
   * ───────────────────────────────────────────────────────── */
  function _inlineTextFallback(resolve) {
    if (_fallbackOpen) { resolve(''); return; }
    _fallbackOpen = true;
    _setState('listening');

    /* Find the best mount point: inside #module-mount if present, else body */
    var mount = document.getElementById('module-mount') || document.body;
    var panel = document.createElement('div');
    panel.id = 'chatbot-text-fallback';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Type your answer');
    panel.innerHTML = [
      '<div class="chatbot-fallback-backdrop"></div>',
      '<div class="chatbot-fallback-box">',
      '  <p class="chatbot-fallback-label">',
      '    ' + (window.StoryLabUI ? window.StoryLabUI.icon('mic') : '') +
      '    Voice not available — type your answer',
      '  </p>',
      '  <div class="chatbot-fallback-row">',
      '    <input id="chatbot-fallback-input" type="text" class="chatbot-fallback-input"',
      '      placeholder="Type here…" autocomplete="off" autofocus />',
      '    <button id="chatbot-fallback-submit" class="btn btn-primary chatbot-fallback-btn">',
      '      SEND',
      '    </button>',
      '    <button id="chatbot-fallback-cancel" class="btn btn-secondary chatbot-fallback-btn">',
      '      CANCEL',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');

    mount.appendChild(panel);

    var input  = document.getElementById('chatbot-fallback-input');
    var submit = document.getElementById('chatbot-fallback-submit');
    var cancel = document.getElementById('chatbot-fallback-cancel');
    if (input) setTimeout(function () { input.focus(); }, 60);

    function close(value) {
      _fallbackOpen = false;
      _setState('idle');
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      resolve(value || '');
    }

    if (submit) submit.addEventListener('click', function () {
      close(input ? input.value.trim() : '');
    });
    if (cancel) cancel.addEventListener('click', function () { close(''); });
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); close(input.value.trim()); }
      if (e.key === 'Escape') { close(''); }
    });
  }

  /* ─────────────────────────────────────────────────────────
   * Intent map
   * ───────────────────────────────────────────────────────── */
  var INTENTS = [
    {
      keywords: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'helo', 'greet'],
      response: 'Namaste! I am your StoryLab Voice tutor. You can ask me about plants, division, fractions, water cycle, or our solar system. What would you like to learn today?'
    },
    {
      keywords: ['photosynthesis', 'plants', 'plant food', 'sunlight', 'chlorophyll', 'leaf', 'leaves', 'green'],
      response: 'Plants make their own food through a process called photosynthesis. They use sunlight, water from the soil, and carbon dioxide from the air. The green colour in leaves comes from chlorophyll, which captures sunlight. As a bonus, photosynthesis releases oxygen — the air we breathe!'
    },
    {
      keywords: ['division', 'divide', 'dividing', 'share', 'split', 'quotient', 'remainder'],
      response: 'Division means splitting a number into equal groups. For example, 50 divided by 8 is 6, with 2 left over as a remainder. We write this as 50 ÷ 8 = 6 R 2. You can check your answer by multiplying: 8 times 6 equals 48, plus the remainder 2 equals 50!'
    },
    {
      keywords: ['fraction', 'fractions', 'half', 'quarter', 'numerator', 'denominator'],
      response: 'A fraction represents a part of a whole. The top number is called the numerator — it tells you how many parts you have. The bottom number is the denominator — it tells you how many equal parts the whole is divided into. For example, three-quarters means 3 out of 4 equal parts.'
    },
    {
      keywords: ['water cycle', 'rain', 'evaporation', 'condensation', 'precipitation', 'cloud', 'clouds'],
      response: 'The water cycle describes how water moves around our planet. The sun heats water in oceans and lakes, causing it to evaporate into the air as water vapour. High up, it cools and condenses into clouds. When enough water collects, it falls back down as rain or snow — that is precipitation. Then the cycle begins again!'
    },
    {
      keywords: ['solar system', 'planet', 'planets', 'sun', 'earth', 'mars', 'jupiter', 'orbit', 'space'],
      response: 'Our solar system has eight planets that orbit the Sun. In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Earth is the third planet and the only one known to support life. Jupiter is the largest planet — you could fit more than 1300 Earths inside it!'
    },
    {
      keywords: ['multiplication', 'multiply', 'times', 'product'],
      response: 'Multiplication is a quick way to add the same number many times. For example, 6 times 8 means adding 6 eight times, which equals 48. We call the answer a product. A useful trick: if you know 6 × 8 = 48, you also know 8 × 6 = 48 — multiplication is commutative!'
    },
    {
      keywords: ['addition', 'add', 'sum', 'plus', 'total'],
      response: 'Addition means combining numbers to find a total. For example, 35 plus 27 equals 62. When adding large numbers, line them up by place value — ones with ones, tens with tens — and add from right to left, carrying over when needed.'
    },
    {
      keywords: ['subtraction', 'subtract', 'minus', 'difference', 'take away'],
      response: 'Subtraction means finding the difference between two numbers. For example, 50 minus 18 equals 32. You can check subtraction by using addition: 32 plus 18 should give you back 50. When the top digit is smaller, you borrow from the next place value.'
    }
  ];

  function _matchIntent(transcript) {
    var lower = transcript.toLowerCase();
    for (var i = 0; i < INTENTS.length; i++) {
      var intent = INTENTS[i];
      for (var j = 0; j < intent.keywords.length; j++) {
        if (lower.includes(intent.keywords[j])) return intent.response;
      }
    }
    return "I'm not sure about that yet. You can ask me about photosynthesis, division, fractions, the water cycle, our solar system, or just say hello!";
  }

  /* ─────────────────────────────────────────────────────────
   * mount(root) — tutor screen
   * ───────────────────────────────────────────────────────── */
  function mount(root) {
    _unmounted = false;
    var icon = window.StoryLabUI ? window.StoryLabUI.icon : function () { return ''; };
    var esc  = _esc;

    var CHIPS = [
      'What is photosynthesis?',
      'Explain division',
      'What is the water cycle?',
      'Tell me about the solar system',
      'What is a fraction?',
      'Namaste'
    ];

    root.innerHTML = [
      '<div class="panel chatbot-panel" id="cb-panel">',
      '  <div class="panel__header">',
      '    <span class="panel__label">AI VOICE TUTOR / MODULE 02 / ACTIVE SESSION</span>',
      '    <span class="led led--ok" id="cb-state-led" aria-hidden="true"></span>',
      '  </div>',
      '  <div class="chatbot-body">',

      /* Waveform */
      '    <div class="chatbot-wave-wrap" aria-hidden="true">',
      '      <div id="chatbot-waveform" class="waveform" data-state="idle">',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '      </div>',
      '      <span class="chatbot-wave-label text-mono" id="cb-wave-label">STANDBY</span>',
      '    </div>',

      /* Conversation readout */
      '    <div class="chatbot-readout" id="chatbot-readout" role="log" aria-live="polite" aria-atomic="false">',
      '      <div class="chatbot-readout__line chatbot-readout__line--system">',
      '        <span class="chatbot-readout__who">TUTOR</span>',
      '        <span class="chatbot-readout__text">Ask me anything about plants, division, fractions, the water cycle, or our solar system. Tap SPEAK NOW or choose a topic below.</span>',
      '      </div>',
      '    </div>',

      /* Suggestion chips */
      '    <div class="chatbot-chips" role="list" aria-label="Suggested topics">',
      CHIPS.map(function (c) {
        return '      <button class="chatbot-chip" role="listitem" data-chip="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('\n'),
      '    </div>',

      /* Controls */
      '    <div class="chatbot-controls">',
      '      <button class="btn btn-primary chatbot-speak-btn" id="cb-speak-btn">',
      '        ' + icon('mic') + ' SPEAK NOW',
      '      </button>',
      '      <button class="btn btn-secondary" id="cb-stop-btn" disabled>',
      '        ' + icon('x') + ' STOP',
      '      </button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    /* Wire SPEAK NOW */
    var speakBtn = document.getElementById('cb-speak-btn');
    var stopBtn  = document.getElementById('cb-stop-btn');
    if (speakBtn) speakBtn.addEventListener('click', _handleAsk);

    /* Wire STOP */
    if (stopBtn) stopBtn.addEventListener('click', function () {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (_activeRec) { try { _activeRec.stop(); } catch (e) {} }
      _setState('idle');
      _setWaveLabel('STANDBY');
      _setControls(false);
    });

    /* Wire chips */
    var chips = root.querySelectorAll('.chatbot-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', _handleChip);
    }
  }

  /* ─────────────────────────────────────────────────────────
   * unmount()
   * ───────────────────────────────────────────────────────── */
  function unmount() {
    _unmounted = true;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (_activeRec) { try { _activeRec.stop(); } catch (e) {} _activeRec = null; }
    _setState('idle');
    _fallbackOpen = false;
    var fb = document.getElementById('chatbot-text-fallback');
    if (fb && fb.parentNode) fb.parentNode.removeChild(fb);
  }

  /* ─────────────────────────────────────────────────────────
   * Screen interaction helpers
   * ───────────────────────────────────────────────────────── */
  function _handleChip(event) {
    var text = event.currentTarget.getAttribute('data-chip') || '';
    if (text) _runQuery(text);
  }

  function _handleAsk() {
    if (_state !== 'idle') return;
    _setControls(true);
    _setWaveLabel('LISTENING…');
    _appendLine('system', 'Listening — speak now, or tap STOP to cancel.');

    listen().then(function (transcript) {
      if (_unmounted) return;
      if (!transcript) {
        _appendLine('system', 'No speech detected. Tap SPEAK NOW to try again.');
        _setControls(false);
        _setWaveLabel('STANDBY');
        return;
      }
      _runQuery(transcript);
    });
  }

  function _handleChipClick(text) {
    _runQuery(text);
  }

  function _runQuery(transcript) {
    if (_unmounted) return;
    _appendLine('you', transcript);
    _setState('thinking');
    _setWaveLabel('THINKING…');
    _setControls(true);

    setTimeout(function () {
      if (_unmounted) return;
      var response = _matchIntent(transcript);
      _appendLine('tutor', response);
      _setWaveLabel('SPEAKING…');
      speak(response).then(function () {
        if (_unmounted) return;
        _setControls(false);
        _setWaveLabel('STANDBY');
      });
    }, 380);
  }

  function _appendLine(who, text) {
    var readout = document.getElementById('chatbot-readout');
    if (!readout) return;

    var whoMap = { you: 'YOU', tutor: 'TUTOR', system: 'SYS' };
    var line = document.createElement('div');
    line.className = 'chatbot-readout__line chatbot-readout__line--' + who;
    line.innerHTML =
      '<span class="chatbot-readout__who">' + _esc(whoMap[who] || who.toUpperCase()) + '</span>' +
      '<span class="chatbot-readout__text">' + _esc(text) + '</span>';
    readout.appendChild(line);
    readout.scrollTop = readout.scrollHeight;
  }

  function _setWaveLabel(label) {
    var el = document.getElementById('cb-wave-label');
    if (el) el.textContent = label;
  }

  function _setControls(busy) {
    var speakBtn = document.getElementById('cb-speak-btn');
    var stopBtn  = document.getElementById('cb-stop-btn');
    if (speakBtn) speakBtn.disabled = busy;
    if (stopBtn)  stopBtn.disabled  = !busy;
  }

  /* ─────────────────────────────────────────────────────────
   * Export (non-writable, non-configurable — matches original)
   * ───────────────────────────────────────────────────────── */
  Object.defineProperty(window, 'Chatbot', {
    value: {
      speak:   speak,
      listen:  listen,
      mount:   mount,
      unmount: unmount,
      get state() { return _state; }
    },
    writable: false,
    configurable: false
  });

  console.log('[Chatbot] window.Chatbot ready');
})();
