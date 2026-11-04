/**
 * StoryLab Voice — StoryLearn Module
 * Owner: Pritam Tatkari (Part 1)
 *
 * Exports: window.StoryLearn
 *   .mount(root)   → void   – Render story list or active player inside root.
 *   .unmount()     → void   – Cancel speech / timers when route changes away.
 */
;(function () {
  'use strict';

  /* ─────────────────────────────────────────────
   * Module state
   * ───────────────────────────────────────────── */
  var _root = null;            // current mount point
  var _story = null;           // loaded story JSON
  var _stepIndex = null;       // map: stepId → step object
  var _advancing = false;      // prevent double-advance
  var _listening = false;      // prevent double-listen call
  var _unmounted = false;      // flag set on unmount()
  var _speakTimer = null;      // handle for any scheduled speech

  /* ─────────────────────────────────────────────
   * Public API
   * ───────────────────────────────────────────── */
  function mount(root) {
    _root = root;
    _unmounted = false;
    _resetPlayer();
    _showList();
  }

  function unmount() {
    _unmounted = true;
    _advancing = false;
    _listening = false;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
  }

  /* ─────────────────────────────────────────────
   * Story list
   * ───────────────────────────────────────────── */
  function _showList() {
    if (!_root) return;
    _root.innerHTML = _loadingHTML('LOADING STORIES…');

    fetch('/data/stories/index.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (stories) {
        if (_unmounted) return;
        _renderList(stories);
      })
      .catch(function (err) {
        if (_unmounted) return;
        console.error('[StoryLearn] index load error:', err);
        _renderError('Could not load the story list. Make sure you are online or the app is cached.');
      });
  }

  function _renderList(stories) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;

    var cards = stories.map(function (s) {
      return [
        '<button class="module-card story-card" data-story-id="' + esc(s.id) + '"',
        '  tabindex="0" aria-label="Start story: ' + esc(s.title) + '">',
        '  <div class="story-card__badge">',
        '    <span class="badge badge--' + esc(s.subject.toLowerCase()) + '">' + esc(s.subject) + '</span>',
        '    <span class="story-card__grade text-mono">GR ' + esc(s.grade) + '</span>',
        '  </div>',
        '  <h3 class="story-card__title">' + esc(s.title) + '</h3>',
        '  <div class="vent" aria-hidden="true"></div>',
        '  <div class="story-card__cta">',
        '    ' + icon('book') + '<span>START STORY</span>' + icon('arrow-right'),
        '  </div>',
        '</button>'
      ].join('\n');
    }).join('\n');

    _root.innerHTML = [
      '<div class="panel story-list-panel" style="margin-top:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <span class="panel__label">STORY LEARN / MODULE 01 / SELECT STORY</span>',
      '    <span class="led led--ok" aria-hidden="true"></span>',
      '  </div>',
      '</div>',
      '<div class="module-grid" style="margin-top:var(--sp-4)">' + cards + '</div>'
    ].join('\n');

    /* Wire card clicks */
    var buttons = _root.querySelectorAll('[data-story-id]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', _onCardClick);
      buttons[i].addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      });
    }
  }

  function _onCardClick(event) {
    var id = event.currentTarget.getAttribute('data-story-id');
    if (id) _loadStory(id);
  }

  /* ─────────────────────────────────────────────
   * Story loader
   * ───────────────────────────────────────────── */
  function _loadStory(id) {
    if (!_root) return;
    _resetPlayer();
    _root.innerHTML = _loadingHTML('LOADING STORY…');

    fetch('/data/stories/' + id + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (story) {
        if (_unmounted) return;
        _story = story;
        _stepIndex = {};
        for (var i = 0; i < story.steps.length; i++) {
          _stepIndex[story.steps[i].id] = story.steps[i];
        }
        _renderPlayerShell(story);
        _playStep(story.steps[0].id);
      })
      .catch(function (err) {
        if (_unmounted) return;
        console.error('[StoryLearn] story load error:', err);
        _renderError('Could not load this story. Please try again.');
      });
  }

  /* ─────────────────────────────────────────────
   * Player shell
   * ───────────────────────────────────────────── */
  function _renderPlayerShell(story) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;

    _root.innerHTML = [
      '<div class="panel story-player" id="sl-player" style="margin-top:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <button class="btn story-back-btn" id="sl-back-btn" aria-label="Back to all stories">',
      '      ' + icon('arrow-left') + ' ALL STORIES',
      '    </button>',
      '    <span class="panel__label" style="margin-left:auto">',
      '      <span class="badge badge--' + esc(story.subject.toLowerCase()) + '">' + esc(story.subject) + '</span>',
      '      &nbsp;' + esc(story.title),
      '    </span>',
      '  </div>',
      '  <div class="story-player__body" id="sl-body">',
      '    <div class="story-step" id="sl-step" aria-live="polite" aria-atomic="true">',
      '      <div class="story-step__text" id="sl-text"></div>',
      '      <div class="story-step__options" id="sl-options" hidden></div>',
      '    </div>',
      '    <div class="story-voice-indicator" id="sl-voice" aria-live="polite" hidden>',
      '      <span class="waveform" aria-hidden="true">',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '      </span>',
      '      <span class="story-voice-indicator__label" id="sl-voice-label">LISTENING…</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.getElementById('sl-back-btn').addEventListener('click', function () {
      unmount();
      _resetPlayer();
      _unmounted = false;
      _showList();
    });
  }

  /* ─────────────────────────────────────────────
   * Step player
   * ───────────────────────────────────────────── */
  function _playStep(stepId) {
    if (_unmounted) return;
    if (_advancing) return;
    _advancing = true;

    var step = _stepIndex[stepId];
    if (!step) {
      console.error('[StoryLearn] unknown step:', stepId);
      _advancing = false;
      return;
    }

    _showStepText(step.text);
    _hideOptions();
    _hideVoice();

    /* Speak text immediately; do not wait before showing it on screen */
    var speakPromise = window.Chatbot.speak(step.text);

    if (step.type === 'narrate') {
      speakPromise.then(function () {
        if (_unmounted) return;
        _advancing = false;
        /* Short pause so the student can absorb the text before advancing */
        _speakTimer = setTimeout(function () {
          if (_unmounted) return;
          _playStep(step.next);
        }, 600);
      }).catch(function () {
        _advancing = false;
      });

    } else if (step.type === 'question') {
      speakPromise.then(function () {
        if (_unmounted) return;
        _advancing = false;
        _renderQuestion(step);
      }).catch(function () {
        _advancing = false;
        _renderQuestion(step);
      });

    } else if (step.type === 'complete') {
      speakPromise.then(function () {
        if (_unmounted) return;
        _advancing = false;
        _handleCompletion(step);
      }).catch(function () {
        _advancing = false;
        _handleCompletion(step);
      });

    } else {
      /* Unknown type — advance if next is defined */
      _advancing = false;
      if (step.next) _playStep(step.next);
    }
  }

  /* ─────────────────────────────────────────────
   * Question rendering + voice input
   * ───────────────────────────────────────────── */
  function _renderQuestion(step) {
    if (_unmounted) return;
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;

    var optionsEl = document.getElementById('sl-options');
    if (!optionsEl) return;

    optionsEl.innerHTML = '';
    optionsEl.removeAttribute('hidden');

    var hintHTML = step.hint
      ? '<p class="story-step__hint">' + icon('info') + ' ' + esc(step.hint) + '</p>'
      : '';
    optionsEl.innerHTML = hintHTML;

    var buttonsWrap = document.createElement('div');
    buttonsWrap.className = 'story-options-grid';

    step.options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.className = 'btn story-option-btn';
      btn.setAttribute('aria-label', esc(opt.label));
      btn.innerHTML = '<span class="story-option-btn__num">' + String.fromCharCode(65 + i) + '</span>' +
                      '<span class="story-option-btn__label">' + esc(opt.label) + '</span>';
      btn.addEventListener('click', function () {
        if (_advancing) return;
        _selectOption(step, opt, btn);
      });
      buttonsWrap.appendChild(btn);
    });

    optionsEl.appendChild(buttonsWrap);

    /* Kick off voice listening in parallel — tap is always primary fallback */
    if (!_listening) {
      _listening = true;
      _showVoice('LISTENING…');
      window.Chatbot.listen().then(function (transcript) {
        _listening = false;
        _hideVoice();
        if (_unmounted || _advancing) return;
        if (!transcript) return; /* tap remains available */
        var match = _matchTranscript(transcript, step.options);
        if (match) {
          var matchedBtn = _findOptionButton(match.label);
          _selectOption(step, match, matchedBtn);
        }
      }).catch(function () {
        _listening = false;
        _hideVoice();
      });
    }
  }

  function _matchTranscript(transcript, options) {
    var lower = transcript.toLowerCase();
    /* Exact label first */
    for (var i = 0; i < options.length; i++) {
      if (lower === options[i].label.toLowerCase()) return options[i];
    }
    /* First word of label */
    for (var j = 0; j < options.length; j++) {
      var firstWord = options[j].label.toLowerCase().split(' ')[0];
      if (lower.includes(firstWord)) return options[j];
    }
    /* Any word match */
    for (var k = 0; k < options.length; k++) {
      if (lower.includes(options[k].label.toLowerCase())) return options[k];
    }
    return null;
  }

  function _findOptionButton(label) {
    var btns = document.querySelectorAll('.story-option-btn');
    for (var i = 0; i < btns.length; i++) {
      var labelEl = btns[i].querySelector('.story-option-btn__label');
      if (labelEl && labelEl.textContent === label) return btns[i];
    }
    return null;
  }

  function _selectOption(step, opt, btn) {
    if (_advancing) return;
    _advancing = true;
    _listening = false; /* stop any pending voice branch */

    /* Visual feedback */
    var allBtns = document.querySelectorAll('.story-option-btn');
    for (var i = 0; i < allBtns.length; i++) {
      allBtns[i].disabled = true;
      allBtns[i].classList.remove('story-option-btn--chosen', 'story-option-btn--correct', 'story-option-btn--wrong');
    }
    if (btn) {
      btn.classList.add('story-option-btn--chosen');
      btn.classList.add(opt.correct ? 'story-option-btn--correct' : 'story-option-btn--wrong');
    }
    _hideVoice();

    _speakTimer = setTimeout(function () {
      _advancing = false;
      if (_unmounted) return;
      _playStep(opt.next);
    }, 500);
  }

  /* ─────────────────────────────────────────────
   * Completion
   * ───────────────────────────────────────────── */
  function _handleCompletion(step) {
    if (_unmounted) return;
    _saveProgress(_story.id).then(function () {
      if (_unmounted) return;
      _renderCompletionCard(step);
    }).catch(function (err) {
      console.error('[StoryLearn] progress save error:', err);
      if (!_unmounted) _renderCompletionCard(step);
    });
  }

  function _saveProgress(storyId) {
    return window.DB.load('progress', 'student').then(function (all) {
      var data = all || {};
      data.stories = data.stories || {};
      data.stories[storyId] = { completed: true, timestamp: Date.now() };
      return window.DB.save('progress', 'student', data);
    }).then(function () {
      /* Log the event to the activity timeline */
      return window.StoryLabState.logEvent(
        'story.completed',
        'Completed ' + _story.title,
        { storyId: _story.id, subject: _story.subject }
      );
    });
  }

  function _renderCompletionCard(step) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;

    var bodyEl = document.getElementById('sl-body');
    if (!bodyEl) return;

    bodyEl.innerHTML = [
      '<div class="story-complete-card" role="status" aria-live="polite">',
      '  <div class="story-complete-card__icon" aria-hidden="true">',
      '    ' + icon('check'),
      '  </div>',
      '  <h2 class="story-complete-card__title">STORY COMPLETE</h2>',
      '  <p class="story-complete-card__text">' + esc(step.text) + '</p>',
      '  <div class="story-complete-card__meta text-mono">',
      '    <span class="badge badge--' + esc(_story.subject.toLowerCase()) + '">' + esc(_story.subject) + '</span>',
      '    <span>' + esc(_story.title) + '</span>',
      '  </div>',
      '  <div class="story-complete-card__actions">',
      '    <button class="btn btn-secondary" id="sl-read-again">',
      '      ' + icon('book') + ' READ AGAIN',
      '    </button>',
      '    <button class="btn btn-primary" id="sl-all-stories">',
      '      ' + icon('arrow-left') + ' ALL STORIES',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.getElementById('sl-read-again').addEventListener('click', function () {
      _resetPlayer();
      _renderPlayerShell(_story);
      _playStep(_story.steps[0].id);
    });

    document.getElementById('sl-all-stories').addEventListener('click', function () {
      unmount();
      _resetPlayer();
      _unmounted = false;
      _showList();
    });

    window.StoryLabUI.toast({
      kind: 'ok',
      title: 'Story complete',
      message: _story.title + ' — saved to your record.'
    });
  }

  /* ─────────────────────────────────────────────
   * UI helpers
   * ───────────────────────────────────────────── */
  function _showStepText(text) {
    var el = document.getElementById('sl-text');
    if (el) el.textContent = text;
  }

  function _hideOptions() {
    var el = document.getElementById('sl-options');
    if (el) { el.setAttribute('hidden', ''); el.innerHTML = ''; }
  }

  function _showVoice(label) {
    var el = document.getElementById('sl-voice');
    var lblEl = document.getElementById('sl-voice-label');
    if (el) el.removeAttribute('hidden');
    if (lblEl && label) lblEl.textContent = label;
  }

  function _hideVoice() {
    var el = document.getElementById('sl-voice');
    if (el) el.setAttribute('hidden', '');
  }

  function _loadingHTML(label) {
    var esc = window.StoryLabUI ? window.StoryLabUI.escape : function (s) { return s; };
    return [
      '<div class="panel" style="margin-top:var(--sp-6);padding:var(--sp-6)">',
      '  <p class="mono-label" style="text-align:center">' + esc(label || 'LOADING…') + '</p>',
      '</div>'
    ].join('\n');
  }

  function _renderError(msg) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;
    if (!_root) return;
    _root.innerHTML = [
      '<div class="panel" style="margin-top:var(--sp-6);padding:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <span class="led led--error" aria-hidden="true"></span>',
      '    <span class="panel__label">STORY LEARN / ERROR</span>',
      '  </div>',
      '  <p class="text-secondary" style="margin-top:var(--sp-4)">' + esc(msg) + '</p>',
      '  <div style="margin-top:var(--sp-4);display:flex;gap:var(--sp-3)">',
      '    <button class="btn btn-secondary" id="sl-err-back">',
      '      ' + icon('arrow-left') + ' BACK',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.getElementById('sl-err-back').addEventListener('click', function () {
      _resetPlayer();
      _showList();
    });
  }

  function _resetPlayer() {
    _story = null;
    _stepIndex = null;
    _advancing = false;
    _listening = false;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
  }

  /* ─────────────────────────────────────────────
   * Export
   * ───────────────────────────────────────────── */
  window.StoryLearn = {
    mount: mount,
    unmount: unmount
  };

  console.log('[StoryLearn] window.StoryLearn ready');
})();
