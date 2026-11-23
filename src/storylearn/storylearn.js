/**
 * StoryLab Voice — StoryLearn Module
 * Owner: Pritam Tatkari (Part 1)
 *
 * Exports: window.StoryLearn
 *   .mount(root)   → void   – Render the story library or the active player.
 *   .unmount()     → void   – Cancel speech / timers when the route changes.
 *
 * Demo pass: category filters, illustrated cards, per-story metadata,
 * step progress, tap-first questions, and a stale-callback guard.
 */
;(function () {
  'use strict';

  var _root = null;
  var _stories = [];
  var _filter = 'All';
  var _story = null;
  var _stepIndex = null;
  var _stepToken = 0;
  var _listening = false;
  var _unmounted = false;
  var _speakTimer = null;

  /* ─────────────────────────────────────────────
   * Illustrations — inline SVG scenes per story
   * ───────────────────────────────────────────── */
  var ART = {
    market:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<path d="M62 52h132l-10-18H72L62 52Z"/>' +
      '<path d="M72 34v18M96 34v18M120 34v18M144 34v18M168 34v18" stroke-opacity=".45"/>' +
      '<path d="M68 52v46h120V52" stroke-opacity=".7"/>' +
      '<circle cx="92" cy="78" r="9"/><circle cx="120" cy="78" r="9"/><circle cx="148" cy="78" r="9"/>' +
      '<path d="M92 60v6M120 60v6M148 60v6" stroke-opacity=".5"/>' +
      '<g stroke-opacity=".4"><path d="M232 98V62M232 62l20-10M232 70l-16-8"/></g>' +
      '<path d="M244 30c10 0 18 8 18 18" stroke-opacity=".35"/>' +
      '</svg>',
    fractions:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<circle cx="92" cy="62" r="34"/>' +
      '<path d="M92 28v68M58 62h68M68 38l48 48M68 86l48-48" stroke-opacity=".55"/>' +
      '<path d="M92 62V28a34 34 0 0 1 24 10L92 62Z" fill="currentColor" fill-opacity=".28" stroke="none"/>' +
      '<path d="M196 40l54 54H196V40Z" stroke-opacity=".8"/>' +
      '<path d="M196 40v54h54" stroke-opacity=".45"/>' +
      '<g fill="currentColor" stroke="none" fill-opacity=".5"><circle cx="222" cy="70" r="3"/><circle cx="236" cy="82" r="2.4"/></g>' +
      '<path d="M64 106h64" stroke-opacity=".3"/>' +
      '</svg>',
    shapes:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<path d="M150 18l44 44-44 44-44-44 44-44Z"/>' +
      '<path d="M150 18v88M106 62h88" stroke-opacity=".45"/>' +
      '<path d="M150 106c8 8 4 14 12 14s6-6 14-6" stroke-opacity=".7"/>' +
      '<g stroke-opacity=".4"><path d="M60 98h34M60 72h20M60 46h28"/></g>' +
      '<circle cx="242" cy="62" r="30" stroke-opacity=".45" stroke-dasharray="3 5"/>' +
      '</svg>',
    plants:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<circle cx="238" cy="34" r="16"/>' +
      '<g stroke-opacity=".55"><path d="M238 10v-6M238 58v6M214 34h-6M262 34h6M221 17l-4-4M255 51l4 4M255 17l4-4M221 51l-4 4"/></g>' +
      '<path d="M132 98V44"/>' +
      '<path d="M132 58c-18 0-28-10-28-22 14 0 28 8 28 22Z" fill="currentColor" fill-opacity=".22"/>' +
      '<path d="M132 72c18 0 28-10 28-22-14 0-28 8-28 22Z" fill="currentColor" fill-opacity=".14"/>' +
      '<path d="M104 98h56" stroke-opacity=".5"/>' +
      '</svg>',
    water:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<path d="M104 44a18 18 0 0 1 36-4 16 16 0 0 1 24 12 14 14 0 0 1-6 26h-54a16 16 0 0 1 0-34Z"/>' +
      '<g stroke-opacity=".65"><path d="M124 74v10M148 74v14M172 74v10"/></g>' +
      '<path d="M80 104c14 0 14-8 28-8s14 8 28 8 14-8 28-8 14 8 28 8" stroke-opacity=".4"/>' +
      '<circle cx="244" cy="40" r="14" stroke-opacity=".4"/>' +
      '</svg>',
    solar:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120"/></g>' +
      '<circle cx="66" cy="62" r="18"/>' +
      '<g stroke-opacity=".45" stroke-dasharray="3 5"><ellipse cx="66" cy="62" rx="70" ry="34"/><ellipse cx="66" cy="62" rx="116" ry="52"/></g>' +
      '<circle cx="104" cy="46" r="6"/><circle cx="150" cy="88" r="8"/><circle cx="182" cy="34" r="5"/>' +
      '<circle cx="238" cy="70" r="11"/>' +
      '<path d="M232 60c6 2 6 18 0 20" stroke-opacity=".5"/>' +
      '</svg>',
    map:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<path d="M70 92c26 0 22-24 44-24s20-28 46-28 22 18 44 18" stroke-dasharray="4 5" stroke-opacity=".8"/>' +
      '<g><path d="M70 84c0-6 4-10 9-10s9 4 9 10c0 7-9 14-9 14s-9-7-9-14Z"/><circle cx="79" cy="84" r="2.4"/></g>' +
      '<g transform="translate(158 16)"><path d="M0 10c0-6 4-10 9-10s9 4 9 10c0 7-9 14-9 14S0 17 0 10Z"/><circle cx="9" cy="10" r="2.4"/></g>' +
      '<g stroke-opacity=".55"><circle cx="246" cy="56" r="22"/><path d="M246 38v36M228 56h36M246 42l5 8h-10l5-8Z" fill="currentColor" fill-opacity=".4" stroke="none"/></g>' +
      '<text x="246" y="94" text-anchor="middle" font-family="Google Sans Code, monospace" font-size="7" letter-spacing="1.2" fill="currentColor" fill-opacity=".55" stroke="none">NORTH</text>' +
      '</svg>',
    village:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<path d="M62 98V62l30-18 30 18v36" />' +
      '<path d="M78 80h12v18H78zM104 80h12v18h-12z" stroke-opacity=".5"/>' +
      '<path d="M172 98V70l26-16 26 16v28"/>' +
      '<path d="M186 82h10v16h-10z" stroke-opacity=".5"/>' +
      '<path d="M246 98V58" stroke-opacity=".7"/>' +
      '<path d="M246 46c-14 0-22 8-22 18 12 0 22-6 22-18Z" fill="currentColor" fill-opacity=".18"/>' +
      '<path d="M246 54c14 0 22 8 22 18-12 0-22-6-22-18Z" fill="currentColor" fill-opacity=".26"/>' +
      '<path d="M56 104h206" stroke-opacity=".3"/>' +
      '</svg>',
    animals:
      '<svg viewBox="0 0 320 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g stroke-opacity=".22"><path d="M0 98h320M40 0v120M282 0v120"/></g>' +
      '<path d="M96 98V58" stroke-opacity=".7"/>' +
      '<path d="M96 44c-16 0-24 10-24 22 14 0 24-8 24-22Z" fill="currentColor" fill-opacity=".2"/>' +
      '<path d="M96 52c16 0 24 10 24 22-14 0-24-8-24-22Z" fill="currentColor" fill-opacity=".12"/>' +
      '<path d="M120 34l8-6M126 42l10-2" stroke-opacity=".7"/>' +
      '<path d="M196 98c0-10 10-16 22-16s22 6 22 16" stroke-opacity=".8"/>' +
      '<path d="M206 98v-6M230 98v-6" stroke-opacity=".45"/>' +
      '<circle cx="252" cy="46" r="12" stroke-opacity=".45"/>' +
      '<path d="M252 34v-6M252 58v6M240 46h-6M264 46h6" stroke-opacity=".45"/>' +
      '<path d="M64 104h192" stroke-opacity=".28"/>' +
      '</svg>'
  };

  var DATA_VERSION = '7';

  var SUBJECT_CLASS = {
    math: 'math',
    science: 'science',
    'social studies': 'social',
    social: 'social',
    evs: 'evs'
  };

  function subjectClass(subject) {
    return SUBJECT_CLASS[String(subject || '').toLowerCase()] || 'science';
  }

  function artFor(story) {
    var key = (story && story.art) || 'plants';
    if (story && story.image) {
      return '<img src="' + window.StoryLabUI.escape(story.image) + '" alt="" loading="lazy" decoding="async">';
    }
    return ART[key] || ART.plants;
  }

  function show(el) { if (el) el.removeAttribute('hidden'); }
  function hide(el) { if (el) el.setAttribute('hidden', ''); }

  /* ─────────────────────────────────────────────
   * Public API
   * ───────────────────────────────────────────── */
  function mount(root) {
    _root = root;
    _unmounted = false;
    _resetPlayer();
    _showLibrary();
  }

  function unmount() {
    _unmounted = true;
    _stepToken += 1;
    _listening = false;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  /* ─────────────────────────────────────────────
   * Library
   * ───────────────────────────────────────────── */
  function _showLibrary() {
    if (!_root) return;
    _root.innerHTML = _loadingHTML('Loading stories…');

    fetch('data/stories/index.json?v=' + DATA_VERSION, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (stories) {
        if (_unmounted) return;
        _stories = Array.isArray(stories) ? stories : [];
        _renderLibrary();
      })
      .catch(function (err) {
        if (_unmounted) return;
        console.error('[StoryLearn] index load error:', err);
        _renderError('Stories could not be loaded. Check that you are online or the app is cached.');
      });
  }

  function subjectLabel(subj) {
    var s = String(subj || '').toLowerCase();
    var t = (window.StoryLabUI && window.StoryLabUI.t) ? window.StoryLabUI.t : function (k, d) { return d; };
    if (s === 'math') return t('story.math', 'Math');
    if (s === 'science') return t('story.science', 'Science');
    if (s === 'social studies' || s === 'social') return t('story.social', 'Social Studies');
    if (s === 'evs') return t('story.evs', 'EVS');
    return subj;
  }

  function _renderLibrary() {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;
    var t = (window.StoryLabUI && window.StoryLabUI.t) ? window.StoryLabUI.t : function (k, d) { return d; };
    if (!_root) return;

    var subjects = [];
    _stories.forEach(function (s) {
      if (s.subject && subjects.indexOf(s.subject) === -1) subjects.push(s.subject);
    });

    var filters = [{ id: 'All', label: t('story.all', 'All'), count: _stories.length }].concat(
      subjects.map(function (subject) {
        return {
          id: subject,
          label: subjectLabel(subject),
          count: _stories.filter(function (s) { return s.subject === subject; }).length
        };
      })
    );

    var filterHTML = filters.map(function (item) {
      var active = item.id === _filter;
      return '<button type="button" class="story-filter' + (active ? ' is-active' : '') + '"' +
        ' role="tab" aria-selected="' + (active ? 'true' : 'false') + '" data-filter="' + esc(item.id) + '">' +
        esc(item.label) + '<span class="story-filter__count">' + item.count + '</span></button>';
    }).join('');

    var visible = _filter === 'All'
      ? _stories
      : _stories.filter(function (s) { return s.subject === _filter; });

    var cards = visible.map(function (storyRaw) {
      var story = (window.StoryLabI18n && window.StoryLabI18n.translateStory)
        ? window.StoryLabI18n.translateStory(storyRaw)
        : storyRaw;
      var tone = subjectClass(story.subject);
      return [
        '<button type="button" class="story-card" data-story-id="' + esc(story.id) + '"',
        '  aria-label="Open story: ' + esc(story.title) + '">',
        '  <span class="story-card__art art--' + tone + '">' + artFor(story) + '</span>',
        '  <span class="story-card__body">',
        '    <span class="story-card__meta">',
        '      <span class="badge badge--' + tone + '">' + esc(subjectLabel(story.subject)) + '</span>',
        '      <span>GR ' + esc(story.grade || '3-8') + '</span>',
        '      <span>' + esc(story.minutes || 4) + ' MIN</span>',
        '    </span>',
        '    <span class="story-card__title">' + esc(story.title) + '</span>',
        '    <span class="story-card__summary">' + esc(story.summary || '') + '</span>',
        '    <span class="story-card__foot"><span>' + t('story.open_story', 'OPEN STORY') + '</span>' + icon('arrow-right') + '</span>',
        '  </span>',
        '</button>'
      ].join('\n');
    }).join('\n');

    _root.innerHTML = [
      '<section class="story-hero">',
      '  <p class="eyebrow">STORYLEARN</p>',
      '  <h1 class="story-hero__title">' + t('story.hero_title', 'Pick a story') + '</h1>',
      '  <p class="story-hero__sub">' + _stories.length + ' ' + t('story.hero_sub', 'stories · subjects · works offline') + '</p>',
      '</section>',
      '<div class="story-filters" role="tablist" aria-label="Filter stories by subject">' + filterHTML + '</div>',
      '<div class="story-grid">' + cards + '</div>'
    ].join('\n');

    var filterButtons = _root.querySelectorAll('[data-filter]');
    for (var i = 0; i < filterButtons.length; i++) {
      filterButtons[i].addEventListener('click', function (event) {
        _filter = event.currentTarget.getAttribute('data-filter') || 'All';
        _renderLibrary();
      });
    }

    var cardsEls = _root.querySelectorAll('[data-story-id]');
    for (var j = 0; j < cardsEls.length; j++) {
      cardsEls[j].addEventListener('click', _onCardClick);
    }
  }

  function _onCardClick(event) {
    var id = event.currentTarget.getAttribute('data-story-id');
    if (id) _loadStory(id);
  }

  /* ─────────────────────────────────────────────
   * Story loader + player
   * ───────────────────────────────────────────── */
  function _loadStory(id) {
    if (!_root) return;
    _resetPlayer();
    _root.innerHTML = _loadingHTML('Opening story…');

    fetch('data/stories/' + id + '.json?v=' + DATA_VERSION, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (rawStory) {
        if (_unmounted) return;
        var currentLang = (window.StoryLabI18n && window.StoryLabI18n.getLanguage) ? window.StoryLabI18n.getLanguage() : 'en';
        var story = (window.StoryLabI18n && window.StoryLabI18n.translateStory)
          ? window.StoryLabI18n.translateStory(rawStory, currentLang)
          : rawStory;
        var meta = null;
        for (var m = 0; m < _stories.length; m++) {
          if (_stories[m].id === id) { meta = _stories[m]; break; }
        }
        if (meta) {
          if (!story.image) story.image = meta.image;
          if (!story.art) story.art = meta.art;
        }
        _story = story;
        _indexSteps(story);
        _renderPlayerShell(story);
        _playStep(story.steps[0].id);
      })
      .catch(function (err) {
        if (_unmounted) return;
        console.error('[StoryLearn] story load error:', err);
        _renderError('This story could not be opened. Please try again.');
      });
  }

  function _indexSteps(story) {
    _stepIndex = {};
    for (var i = 0; i < story.steps.length; i++) {
      _stepIndex[story.steps[i].id] = story.steps[i];
    }
  }

  function _renderPlayerShell(story) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;
    var tone = subjectClass(story.subject);

    _root.innerHTML = [
      '<div class="panel story-player" id="sl-player">',
      '  <div class="panel__header">',
      '    <button class="btn story-back-btn" id="sl-back-btn" aria-label="Back to all stories">',
      '      ' + icon('arrow-left') + ' STORIES',
      '    </button>',
      '    <span class="panel__label" style="margin-left:auto">',
      '      <span class="badge badge--' + tone + '">' + esc(story.subject) + '</span>',
      '      &nbsp;' + esc(story.title),
      '    </span>',
      '  </div>',
      '  <div class="story-player__body" id="sl-body">',
      '    <div class="story-player__art art--' + tone + '">' + artFor(story) + '</div>',
      '    <div class="story-progress">',
      '      <span id="sl-progress-label">STEP 1 OF ' + story.steps.length + '</span>',
      '      <span class="story-progress__track"><span class="story-progress__fill" id="sl-progress-fill"></span></span>',
      '    </div>',
      '    <div class="story-step" id="sl-step" aria-live="polite" aria-atomic="true">',
      '      <div class="story-step__text" id="sl-text"></div>',
      '      <div class="story-step__options" id="sl-options" hidden></div>',
      '      <div class="story-advance" id="sl-advance" hidden></div>',
      '    </div>',
      '    <div class="story-voice-indicator" id="sl-voice" aria-live="polite" hidden>',
      '      <span class="waveform" data-state="listening" aria-hidden="true">',
      '        <span class="waveform__bar"></span><span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span><span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '      </span>',
      '      <span class="story-voice-indicator__label" id="sl-voice-label">Listening…</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.getElementById('sl-back-btn').addEventListener('click', function () {
      unmount();
      _resetPlayer();
      _unmounted = false;
      _renderLibrary();
    });
  }

  function _setProgress(stepId) {
    if (!_story) return;
    var index = 0;
    for (var i = 0; i < _story.steps.length; i++) {
      if (_story.steps[i].id === stepId) { index = i; break; }
    }
    var label = document.getElementById('sl-progress-label');
    var fill = document.getElementById('sl-progress-fill');
    if (label) label.textContent = 'STEP ' + (index + 1) + ' OF ' + _story.steps.length;
    if (fill) fill.style.width = Math.round(((index + 1) / _story.steps.length) * 100) + '%';
  }

  /* ─────────────────────────────────────────────
   * Step player
   * ───────────────────────────────────────────── */
  function _playStep(stepId) {
    if (_unmounted) return;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }

    var step = _stepIndex ? _stepIndex[stepId] : null;
    if (!step) {
      console.error('[StoryLearn] unknown step:', stepId);
      return;
    }

    var token = ++_stepToken;
    _listening = false;

    _setProgress(stepId);
    _showStepText(step.text);
    _hideOptions();
    _hideAdvance();
    _hideVoice();

    var currentLang = (window.StoryLabI18n && window.StoryLabI18n.getLanguage) ? window.StoryLabI18n.getLanguage() : 'en';
    var speakPromise = (window.Chatbot && typeof window.Chatbot.speak === 'function')
      ? window.Chatbot.speak(step.text, currentLang)
      : Promise.resolve();

    if (step.type === 'narrate') {
      _showAdvance(function () { _goTo(step.next, token); });
      speakPromise.then(function () {
        if (_unmounted || token !== _stepToken) return;
        _speakTimer = setTimeout(function () { _goTo(step.next, token); }, 700);
      }).catch(function () {});
      return;
    }

    if (step.type === 'question') {
      _renderQuestion(step, token, speakPromise);
      return;
    }

    if (step.type === 'complete') {
      _handleCompletion(step, token);
      return;
    }

    if (step.next) _goTo(step.next, token);
  }

  function _goTo(nextId, token) {
    if (_unmounted) return;
    if (token !== undefined && token !== _stepToken) return;
    if (!nextId) return;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    _playStep(nextId);
  }

  /* ─────────────────────────────────────────────
   * Question + voice
   * ───────────────────────────────────────────── */
  function _renderQuestion(step, token, speakPromise) {
    if (_unmounted || token !== _stepToken) return;
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;
    var currentLang = (window.StoryLabI18n && window.StoryLabI18n.getLanguage) ? window.StoryLabI18n.getLanguage() : 'en';

    var optionsEl = document.getElementById('sl-options');
    if (!optionsEl) return;

    optionsEl.innerHTML = step.hint
      ? '<p class="story-step__hint">' + icon('info') + ' ' + esc(step.hint) + '</p>'
      : '';
    show(optionsEl);

    // Interactive Tap-to-Speak microphone bar
    var micWrap = document.createElement('div');
    micWrap.className = 'story-voice-prompt';
    micWrap.style.cssText = 'display:flex;align-items:center;gap:12px;margin:12px 0 16px;flex-wrap:wrap;';
    var micLabel = currentLang === 'hi' ? 'उत्तर बोलें (Mic)' : currentLang === 'mr' ? 'उत्तर बोला (Mic)' : 'SPEAK ANSWER (Mic)';
    micWrap.innerHTML =
      '<button type="button" class="btn btn-secondary story-mic-trigger" id="sl-mic-btn" style="display:inline-flex;align-items:center;gap:8px;font-weight:600;">' +
      icon('mic') + ' <span>' + micLabel + '</span>' +
      '</button>' +
      '<span class="story-voice-status" id="sl-voice-status" style="font-family:var(--font-mono);font-size:0.8rem;color:var(--color-text-muted);"></span>';
    optionsEl.appendChild(micWrap);

    var micBtn = micWrap.querySelector('#sl-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', function () {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        _startVoiceAnswer(step, token);
      });
    }

    var buttonsWrap = document.createElement('div');
    buttonsWrap.className = 'story-options-grid';

    step.options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.className = 'btn story-option-btn';
      btn.innerHTML = '<span class="story-option-btn__num">' + String.fromCharCode(65 + i) + '</span>' +
                      '<span class="story-option-btn__label">' + esc(opt.label) + '</span>';
      btn.addEventListener('click', function () {
        _selectOption(step, opt, btn, token);
      });
      buttonsWrap.appendChild(btn);
    });

    optionsEl.appendChild(buttonsWrap);

    if (speakPromise && typeof speakPromise.then === 'function') {
      speakPromise.then(function () { _startVoiceAnswer(step, token); })
        .catch(function () { _startVoiceAnswer(step, token); });
    } else {
      _startVoiceAnswer(step, token);
    }
  }

  function _startVoiceAnswer(step, token) {
    if (_unmounted || token !== _stepToken || _listening) return;
    if (!window.Chatbot || typeof window.Chatbot.listen !== 'function') return;

    var currentLang = (window.StoryLabI18n && window.StoryLabI18n.getLanguage) ? window.StoryLabI18n.getLanguage() : 'en';
    var langTag = (window.StoryLabI18n && window.StoryLabI18n.getLanguageTag)
      ? window.StoryLabI18n.getLanguageTag()
      : (currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-IN');

    _listening = true;
    _showVoice(currentLang === 'hi' ? 'सुन रहा हूँ… उत्तर बोलें' : currentLang === 'mr' ? 'ऐकत आहे… उत्तर बोला' : 'Listening… speak answer');

    var statusEl = document.getElementById('sl-voice-status');
    if (statusEl) {
      statusEl.textContent = '● ' + (currentLang === 'hi' ? 'माइक चालू है… बोलिए' : currentLang === 'mr' ? 'माइक सुरू आहे… बोला' : 'Mic listening… speak now');
      statusEl.style.color = 'var(--color-accent)';
    }

    window.Chatbot.listen(langTag).then(function (transcript) {
      if (token !== _stepToken) return;
      _listening = false;
      _hideVoice();
      if (_unmounted) return;
      if (!transcript) {
        if (statusEl) {
          statusEl.textContent = currentLang === 'hi' ? 'आवाज़ नहीं सुनाई दी, माइक दबाकर फिर बोलें' : currentLang === 'mr' ? 'आवाज ऐकू आला नाही, पुन्हा बोला' : 'No speech heard. Tap mic to speak again.';
          statusEl.style.color = 'var(--color-warn)';
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = '✓ ' + transcript;
        statusEl.style.color = 'var(--color-ok)';
      }

      var match = _matchTranscript(transcript, step.options);
      if (match) {
        _selectOption(step, match, _findOptionButton(match.label), token);
      } else {
        if (statusEl) {
          statusEl.textContent = 'Heard "' + transcript + '". Tap an option directly or try again.';
          statusEl.style.color = 'var(--color-warn)';
        }
      }
    }).catch(function () {
      if (token !== _stepToken) return;
      _listening = false;
      _hideVoice();
      if (statusEl) {
        statusEl.textContent = 'Mic stopped. Tap button to retry.';
        statusEl.style.color = 'var(--color-text-muted)';
      }
    });
  }

  function _matchTranscript(transcript, options) {
    if (!transcript || !options || !options.length) return null;
    var raw = String(transcript).trim().toLowerCase();
    var clean = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Direct letter & ordinal mappings
    var letterMap = {
      'a': 0, 'option a': 0, 'choice a': 0, 'letter a': 0, 'ए': 0, 'ऑप्शन ए': 0, 'पहिला': 0, 'पहला': 0, 'first': 0, 'one': 0, '1': 0, '१': 0,
      'b': 1, 'option b': 1, 'choice b': 1, 'letter b': 1, 'बी': 1, 'ऑप्शन बी': 1, 'दुसरा': 1, 'दूसरा': 1, 'second': 1, 'two': 1, '2': 1, '२': 1,
      'c': 2, 'option c': 2, 'choice c': 2, 'letter c': 2, 'सी': 2, 'ऑप्शन सी': 2, 'तिसरा': 2, 'तीसरा': 2, 'third': 2, 'three': 2, '3': 2, '३': 2,
      'd': 3, 'option d': 3, 'choice d': 3, 'letter d': 3, 'डी': 3, 'ऑप्शन डी': 3, 'चौथा': 3, 'fourth': 3, 'four': 3, '4': 3, '४': 3
    };

    if (letterMap[clean] !== undefined && options[letterMap[clean]]) {
      return options[letterMap[clean]];
    }

    for (var key in letterMap) {
      var wordRegex = new RegExp('(?:^|\\s)' + key + '(?:\\s|$)', 'i');
      if (wordRegex.test(clean) && options[letterMap[key]]) {
        return options[letterMap[key]];
      }
    }

    // 2. Number normalization: "six" -> 6, "seven" -> 7, "सहा" -> 6, etc.
    var numMap = {
      'zero': '0', 'शून्य': '0',
      'one': '1', 'एक': '1',
      'two': '2', 'दो': '2', 'दोन': '2',
      'three': '3', 'तीन': '3',
      'four': '4', 'चार': '4',
      'five': '5', 'पाँच': '5', 'पांच': '5', 'पाच': '5',
      'six': '6', 'छह': '6', 'सहा': '6',
      'seven': '7', 'सात': '7',
      'eight': '8', 'आठ': '8',
      'nine': '9', 'नौ': '9', 'नऊ': '9',
      'ten': '10', 'दस': '10', 'दहा': '10'
    };

    var expanded = clean;
    for (var numWord in numMap) {
      var nRegex = new RegExp('(?:^|\\s)' + numWord + '(?:\\s|$)', 'gi');
      if (nRegex.test(expanded)) {
        expanded = expanded.replace(nRegex, ' ' + numMap[numWord] + ' ');
      }
    }
    expanded = expanded.replace(/\s+/g, ' ').trim();

    // 3. Direct or substring matches on option labels
    for (var i = 0; i < options.length; i++) {
      var optLabel = String(options[i].label || '').toLowerCase();
      var optClean = optLabel.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ').replace(/\s+/g, ' ').trim();

      if (clean === optClean || expanded === optClean) return options[i];
      if (clean.indexOf(optClean) !== -1 || expanded.indexOf(optClean) !== -1) return options[i];
      if (optClean.indexOf(clean) !== -1 || optClean.indexOf(expanded) !== -1) return options[i];

      var optNumbers = optClean.match(/\d+/g) || [];
      var spokenNumbers = expanded.match(/\d+/g) || [];
      if (optNumbers.length > 0 && spokenNumbers.length > 0) {
        if (optNumbers.some(function (n) { return spokenNumbers.indexOf(n) !== -1; })) {
          return options[i];
        }
      }

      var firstWord = optClean.split(' ')[0];
      if (firstWord && firstWord.length > 2 && (clean.indexOf(firstWord) !== -1 || expanded.indexOf(firstWord) !== -1)) {
        return options[i];
      }
    }

    return null;
  }

  function _findOptionButton(label) {
    if (!_root) return null;
    var target = String(label || '').trim().toLowerCase();
    var btns = _root.querySelectorAll('.story-option-btn');
    for (var i = 0; i < btns.length; i++) {
      var labelEl = btns[i].querySelector('.story-option-btn__label');
      if (labelEl && labelEl.textContent.trim().toLowerCase() === target) return btns[i];
    }
    // Fallback: match first button if index match or substring
    for (var j = 0; j < btns.length; j++) {
      var txt = btns[j].textContent.trim().toLowerCase();
      if (txt.indexOf(target) !== -1 || target.indexOf(txt) !== -1) return btns[j];
    }
    return btns[0] || null;
  }

  function _selectOption(step, opt, btn, token) {
    if (_unmounted || token !== _stepToken) return;

    _stepToken += 1;
    _listening = false;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    var allBtns = _root ? _root.querySelectorAll('.story-option-btn') : [];
    for (var i = 0; i < allBtns.length; i++) {
      allBtns[i].disabled = true;
      allBtns[i].classList.remove('story-option-btn--chosen', 'story-option-btn--correct', 'story-option-btn--wrong');
    }
    if (btn) {
      btn.classList.add('story-option-btn--chosen');
      btn.classList.add(opt.correct ? 'story-option-btn--correct' : 'story-option-btn--wrong');
    }
    _hideVoice();
    _hideAdvance();

    _speakTimer = setTimeout(function () {
      if (_unmounted) return;
      _playStep(opt.next);
    }, 500);
  }

  /* ─────────────────────────────────────────────
   * Completion
   * ───────────────────────────────────────────── */
  function _handleCompletion(step, token) {
    if (_unmounted || token !== _stepToken || !_story) return;
    _hideAdvance();
    _hideVoice();

    _saveProgress(_story.id, _story.title, _story.subject).then(function () {
      if (_unmounted || token !== _stepToken) return;
      _renderCompletionCard(step);
    }).catch(function (err) {
      console.error('[StoryLearn] progress save error:', err);
      if (!_unmounted && token === _stepToken) _renderCompletionCard(step);
    });
  }

  function _saveProgress(storyId, title, subject) {
    return window.DB.load('progress', 'student').then(function (all) {
      var data = all || {};
      data.stories = data.stories || {};
      data.stories[storyId] = { completed: true, timestamp: Date.now() };
      return window.DB.save('progress', 'student', data);
    }).then(function () {
      return window.StoryLabState.logEvent('story.completed', 'Completed ' + title, {
        storyId: storyId,
        subject: subject
      });
    });
  }

  function _renderCompletionCard(step) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;
    var bodyEl = document.getElementById('sl-body');
    if (!bodyEl || !_story) return;

    var tone = subjectClass(_story.subject);

    bodyEl.innerHTML = [
      '<div class="story-complete-card" role="status" aria-live="polite">',
      '  <div class="story-complete-card__icon" aria-hidden="true">' + icon('check') + '</div>',
      '  <h2 class="story-complete-card__title">Story complete</h2>',
      '  <p class="story-complete-card__text">' + esc(step.text) + '</p>',
      '  <div class="story-complete-card__meta text-mono">',
      '    <span class="badge badge--' + tone + '">' + esc(_story.subject) + '</span>',
      '    <span>' + esc(_story.title) + '</span>',
      '  </div>',
      '  <div class="story-complete-card__actions">',
      '    <button class="btn btn-secondary" id="sl-read-again">' + icon('book') + ' READ AGAIN</button>',
      '    <button class="btn btn-primary" id="sl-all-stories">' + icon('arrow-left') + ' MORE STORIES</button>',
      '  </div>',
      '</div>'
    ].join('\n');

    var story = _story;

    document.getElementById('sl-read-again').addEventListener('click', function () {
      if (_unmounted) return;
      _resetPlayer();
      _story = story;
      _indexSteps(story);
      _renderPlayerShell(story);
      _playStep(story.steps[0].id);
    });

    document.getElementById('sl-all-stories').addEventListener('click', function () {
      unmount();
      _resetPlayer();
      _unmounted = false;
      _renderLibrary();
    });

    window.StoryLabUI.toast({
      kind: 'ok',
      title: 'Story complete',
      message: _story.title + ' — saved to your progress.'
    });
  }

  /* ─────────────────────────────────────────────
   * Helpers
   * ───────────────────────────────────────────── */
  function _showStepText(text) {
    var el = document.getElementById('sl-text');
    if (el) el.textContent = text;
    _showStepText.last = text;
  }

  function _hideOptions() {
    var el = document.getElementById('sl-options');
    if (el) { el.setAttribute('hidden', ''); el.innerHTML = ''; }
  }

  function _showAdvance(onClick) {
    var el = document.getElementById('sl-advance');
    if (!el) return;
    el.innerHTML =
      '<button type="button" class="btn btn-secondary story-advance__btn" id="sl-advance-btn">' +
      '<span>CONTINUE</span>' + window.StoryLabUI.icon('arrow-right') + '</button>' +
      '<button type="button" class="btn btn-secondary" id="sl-ask-btn">ASK ABOUT THIS</button>';
    show(el);
    var btn = document.getElementById('sl-advance-btn');
    if (btn) btn.addEventListener('click', onClick);
    var ask = document.getElementById('sl-ask-btn');
    if (ask) ask.addEventListener('click', function () {
      if (!window.Chatbot || !window.Chatbot.setLessonContext) return;
      window.Chatbot.setLessonContext({
        title: _story ? _story.title : 'Story',
        text: _showStepText.last || ''
      });
      window.StoryLabRouter.navigate('chatbot');
    });
  }

  function _hideAdvance() {
    var el = document.getElementById('sl-advance');
    if (el) { el.setAttribute('hidden', ''); el.innerHTML = ''; }
  }

  function _showVoice(label) {
    var el = document.getElementById('sl-voice');
    var lblEl = document.getElementById('sl-voice-label');
    var wave = el ? el.querySelector('.waveform') : null;
    show(el);
    if (lblEl && label) lblEl.textContent = label;
    if (wave) wave.setAttribute('data-state', 'listening');
  }

  function _hideVoice() {
    var el = document.getElementById('sl-voice');
    hide(el);
    var wave = el ? el.querySelector('.waveform') : null;
    if (wave) wave.setAttribute('data-state', 'idle');
  }

  function _loadingHTML(label) {
    var esc = window.StoryLabUI ? window.StoryLabUI.escape : function (s) { return s; };
    return '<div class="panel" style="margin-top:var(--sp-6);padding:var(--sp-6)">' +
      '<p class="mono-label" style="text-align:center">' + esc(label || 'Loading…') + '</p></div>';
  }

  function _renderError(msg) {
    var esc = window.StoryLabUI.escape;
    var icon = window.StoryLabUI.icon;
    if (!_root) return;
    _root.innerHTML = [
      '<div class="panel" style="margin-top:var(--sp-6);padding:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <span class="led led--error" aria-hidden="true"></span>',
      '    <span class="panel__label">STORIES / ERROR</span>',
      '  </div>',
      '  <p class="text-secondary" style="margin-top:var(--sp-4)">' + esc(msg) + '</p>',
      '  <div style="margin-top:var(--sp-4)">',
      '    <button class="btn btn-secondary" id="sl-err-back">' + icon('arrow-left') + ' BACK</button>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.getElementById('sl-err-back').addEventListener('click', function () {
      _resetPlayer();
      _showLibrary();
    });
  }

  function _resetPlayer() {
    _story = null;
    _stepIndex = null;
    _stepToken += 1;
    _listening = false;
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  window.StoryLearn = { mount: mount, unmount: unmount };
  console.log('[StoryLearn] window.StoryLearn ready');
})();
