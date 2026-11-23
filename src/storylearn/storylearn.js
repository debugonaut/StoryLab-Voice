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
    if (window.Chatbot && typeof window.Chatbot.stopListening === 'function') {
      window.Chatbot.stopListening();
    }
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
        if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
        if (window.Chatbot && typeof window.Chatbot.stopListening === 'function') {
          window.Chatbot.stopListening();
        }
        _listening = false;
        setTimeout(function () {
          _startVoiceAnswer(step, token);
        }, 80);
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
      speakPromise.then(function () {
        if (_unmounted || token !== _stepToken) return;
        setTimeout(function () {
          if (_unmounted || token !== _stepToken) return;
          _startVoiceAnswer(step, token);
        }, 400);
      }).catch(function () {
        if (_unmounted || token !== _stepToken) return;
        _startVoiceAnswer(step, token);
      });
    } else {
      setTimeout(function () {
        _startVoiceAnswer(step, token);
      }, 200);
    }
  }

  function _startVoiceAnswer(step, token) {
    if (_unmounted || token !== _stepToken) return;
    if (!window.Chatbot || (typeof window.Chatbot.listenLive !== 'function' && typeof window.Chatbot.listen !== 'function')) return;

    var currentLang = (window.StoryLabI18n && window.StoryLabI18n.getLanguage) ? window.StoryLabI18n.getLanguage() : 'en';
    var langTag = (window.StoryLabI18n && window.StoryLabI18n.getLanguageTag)
      ? window.StoryLabI18n.getLanguageTag()
      : (currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-IN');

    // If already listening, stop previous session first
    if (_listening && window.Chatbot && typeof window.Chatbot.stopListening === 'function') {
      window.Chatbot.stopListening();
    }
    _listening = true;

    var micBtn = document.getElementById('sl-mic-btn');
    if (micBtn) {
      micBtn.classList.add('is-listening');
      micBtn.style.borderColor = 'var(--color-accent)';
      micBtn.style.color = 'var(--color-accent)';
      var micSpan = micBtn.querySelector('span');
      if (micSpan) {
        micSpan.textContent = currentLang === 'hi' ? 'सुन रहा हूँ…' : currentLang === 'mr' ? 'ऐकत आहे…' : 'LISTENING…';
      }
    }

    var statusEl = document.getElementById('sl-voice-status');
    if (statusEl) {
      statusEl.textContent = '● ' + (currentLang === 'hi' ? 'माइक चालू है… बोलिए ("ए", "बी" या उत्तर)' : currentLang === 'mr' ? 'माइक सुरू आहे… बोला ("ए", "बी" किंवा उत्तर)' : 'Mic listening… say "A", "B", or your answer');
      statusEl.style.color = 'var(--color-accent)';
    }

    _showVoice(currentLang === 'hi' ? 'सुन रहा हूँ… उत्तर बोलें' : currentLang === 'mr' ? 'ऐकत आहे… उत्तर बोला' : 'Listening… speak answer');

    function resetMicBtn() {
      var b = document.getElementById('sl-mic-btn');
      if (!b) return;
      b.classList.remove('is-listening');
      b.style.borderColor = '';
      b.style.color = '';
      var s = b.querySelector('span');
      if (s) {
        s.textContent = currentLang === 'hi' ? 'उत्तर बोलें (Mic)' : currentLang === 'mr' ? 'उत्तर बोला (Mic)' : 'SPEAK ANSWER (Mic)';
      }
    }

    var onInterim = function (live) {
      if (_unmounted || token !== _stepToken) return;
      if (statusEl) {
        statusEl.textContent = 'Hearing: “' + live + '”…';
        statusEl.style.color = 'var(--color-accent)';
      }
      _showVoice('Hearing: “' + live + '”…');
      var liveMatch = _matchTranscript(live, step.options);
      if (liveMatch) {
        _highlightOptionPreview(liveMatch.label);
      }
    };

    var listenPromise = (typeof window.Chatbot.listenLive === 'function')
      ? window.Chatbot.listenLive(onInterim, langTag)
      : window.Chatbot.listen(langTag).then(function (t) { return { text: t, reason: 'ok' }; });

    listenPromise.then(function (result) {
      if (token !== _stepToken) return;
      _listening = false;
      _hideVoice();
      resetMicBtn();
      if (_unmounted) return;

      var transcript = (result && typeof result === 'object') ? (result.text || '') : String(result || '');
      var reason = (result && result.reason) || (transcript ? 'ok' : 'no-speech');

      if (!transcript) {
        _highlightOptionPreview(null);
        if (statusEl) {
          if (reason === 'denied') {
            statusEl.textContent = currentLang === 'hi' ? 'माइक ब्लॉक है — नीचे किसी विकल्प पर क्लिक करें' : currentLang === 'mr' ? 'माइक ब्लॉक आहे — खालील पर्यायावर क्लिक करा' : 'Microphone is blocked. Tap an option directly or allow mic in browser settings.';
            statusEl.style.color = 'var(--color-warn)';
          } else {
            statusEl.textContent = currentLang === 'hi' ? 'आवाज़ नहीं सुनाई दी — माइक दबाकर फिर बोलें' : currentLang === 'mr' ? 'आवाज ऐकू आला नाही — माइक दाबून पुन्हा बोला' : 'Did not hear speech. Tap SPEAK to try again or click an option.';
            statusEl.style.color = 'var(--color-text-muted)';
          }
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
        _highlightOptionPreview(null);
        if (statusEl) {
          statusEl.textContent = 'Heard “' + transcript + '”. Say "A" or "B", or tap an option directly.';
          statusEl.style.color = 'var(--color-warn)';
        }
      }
    }).catch(function () {
      if (token !== _stepToken) return;
      _listening = false;
      _hideVoice();
      resetMicBtn();
      _highlightOptionPreview(null);
      if (statusEl) {
        statusEl.textContent = 'Mic stopped. Tap button to retry.';
        statusEl.style.color = 'var(--color-text-muted)';
      }
    });
  }

  function _matchTranscript(transcript, options) {
    if (!transcript || !options || !options.length) return null;

    var raw = String(transcript).trim().toLowerCase();
    var clean;
    try {
      clean = raw.replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
    } catch (e) {
      clean = raw.replace(/[^a-z0-9\s-]/gi, ' ').replace(/\s+/g, ' ').trim();
    }
    if (!clean) return null;

    function hasTerm(text, term) {
      var safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        return new RegExp('(^|[^\\p{L}\\p{M}\\p{N}])' + safe + '([^\\p{L}\\p{M}\\p{N}]|$)', 'iu').test(text);
      } catch (err) {
        return new RegExp('(^|\\s)' + safe + '(\\s|$)', 'i').test(text);
      }
    }

    // 1. Direct letter, ordinal & explicit choice indicators
    var specificPhrases = [
      { terms: ['option d', 'choice d', 'letter d', 'fourth one', 'fourth option', '4th', 'option 4', 'चौथा', 'चौथा पर्याय', 'ऑप्शन डी', 'पर्याय डी'], idx: 3 },
      { terms: ['option c', 'choice c', 'letter c', 'third one', 'third option', '3rd', 'option 3', 'तीसरा', 'तिसरा', 'तिसरा पर्याय', 'ऑप्शन सी', 'पर्याय सी'], idx: 2 },
      { terms: ['option b', 'choice b', 'letter b', 'second one', 'second option', '2nd', 'option 2', 'दूसरा', 'दुसरा', 'दुसरा पर्याय', 'ऑप्शन बी', 'पर्याय बी', 'पर्याय दुसरा', 'choice 2'], idx: 1 },
      { terms: ['option a', 'choice a', 'letter a', 'first one', 'first option', '1st', 'option 1', 'पहला', 'पहिला', 'पहिला पर्याय', 'ऑप्शन ए', 'पर्याय ए', 'पर्याय पहिला', 'choice 1'], idx: 0 }
    ];

    for (var p = 0; p < specificPhrases.length; p++) {
      var item = specificPhrases[p];
      for (var t = 0; t < item.terms.length; t++) {
        if (hasTerm(clean, item.terms[t])) {
          if (options[item.idx]) return options[item.idx];
        }
      }
    }

    // Exact standalone letters & ordinals
    var standaloneMap = {
      'a': 0, 'ए': 0, 'first': 0, '1': 0, '१': 0,
      'b': 1, 'बी': 1, 'second': 1, '2': 1, '२': 1,
      'c': 2, 'सी': 2, 'third': 2, '3': 2, '३': 2,
      'd': 3, 'डी': 3, 'fourth': 3, '4': 3, '४': 3
    };
    if (standaloneMap[clean] !== undefined && options[standaloneMap[clean]]) {
      return options[standaloneMap[clean]];
    }

    // Check conversational commands: "choose B", "pick A", "select C"
    var chooseMatch = clean.match(/(?:choose|select|pick|answer)\s+([abcd])/i);
    if (chooseMatch) {
      var cIdx = { a: 0, b: 1, c: 2, d: 3 }[chooseMatch[1].toLowerCase()];
      if (options[cIdx]) return options[cIdx];
    }

    // 2. Number normalization: "six" -> 6, "सात" -> 7, etc.
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
      try {
        var nRegex = new RegExp('(^|[^\\p{L}\\p{M}\\p{N}])' + numWord + '([^\\p{L}\\p{M}\\p{N}]|$)', 'giu');
        expanded = expanded.replace(nRegex, '$1' + numMap[numWord] + '$2');
      } catch (err) {
        var nRegexFallback = new RegExp('(^|\\s)' + numWord + '(\\s|$)', 'gi');
        expanded = expanded.replace(nRegexFallback, '$1' + numMap[numWord] + '$2');
      }
    }
    expanded = expanded.replace(/\s+/g, ' ').trim();

    // Strip conversational fillers
    var stripped;
    try {
      stripped = expanded.replace(/^(i think|i choose|i guess|the answer is|answer is|my answer is|it is|it's|is it|please|select|choose|उत्तर|पर्याय|माझे उत्तर|मला वाटते)\s+/giu, '').trim();
    } catch (err) {
      stripped = expanded.replace(/^(i think|i choose|i guess|the answer is|answer is|my answer is|it is|it's|is it|please|select|choose)\s+/gi, '').trim();
    }

    // Stop words for word overlap
    var stopWords = { 'and': 1, 'or': 1, 'the': 1, 'a': 1, 'an': 1, 'is': 1, 'of': 1, 'to': 1, 'in': 1, 'for': 1, 'और': 1, 'व': 1, 'आणि': 1, 'आहे': 1, 'है': 1 };

    var bestScore = 0;
    var bestOption = null;

    for (var i = 0; i < options.length; i++) {
      var optRaw = String(options[i].label || '').toLowerCase();
      var optClean;
      try {
        optClean = optRaw.replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) {
        optClean = optRaw.replace(/[^a-z0-9\s-]/gi, ' ').replace(/\s+/g, ' ').trim();
      }
      if (!optClean) continue;

      var optExpanded = optClean;
      for (var nw in numMap) {
        try {
          optExpanded = optExpanded.replace(new RegExp('(^|[^\\p{L}\\p{M}\\p{N}])' + nw + '([^\\p{L}\\p{M}\\p{N}]|$)', 'giu'), '$1' + numMap[nw] + '$2');
        } catch (err) {
          optExpanded = optExpanded.replace(new RegExp('(^|\\s)' + nw + '(\\s|$)', 'gi'), '$1' + numMap[nw] + '$2');
        }
      }
      optExpanded = optExpanded.replace(/\s+/g, ' ').trim();

      var score = 0;

      // Exact matches
      if (clean === optClean || expanded === optExpanded || stripped === optClean || stripped === optExpanded) {
        score = 1000;
      } else if (clean.indexOf(optClean) !== -1 || expanded.indexOf(optExpanded) !== -1 || stripped.indexOf(optClean) !== -1) {
        score = 500 + optClean.length;
      } else if (optClean.indexOf(clean) !== -1 || optExpanded.indexOf(expanded) !== -1 || optClean.indexOf(stripped) !== -1) {
        score = 300 + clean.length;
      }

      // Number matching: if option has digits and user spoke digits
      var optDigits = optExpanded.match(/\d+/g) || [];
      var spokenDigits = expanded.match(/\d+/g) || [];
      if (optDigits.length > 0 && spokenDigits.length > 0) {
        var sharedDigits = 0;
        for (var d = 0; d < optDigits.length; d++) {
          if (spokenDigits.indexOf(optDigits[d]) !== -1) sharedDigits++;
        }
        if (sharedDigits > 0) {
          score += sharedDigits * 200;
        }
      }

      // Significant words overlap
      var optWords = optClean.split(/\s+/).filter(function(w) { return w.length > 1 && !stopWords[w]; });
      var spokenWords = (clean + ' ' + expanded + ' ' + stripped).split(/\s+/).filter(function(w) { return w.length > 1 && !stopWords[w]; });

      var overlap = 0;
      for (var w = 0; w < optWords.length; w++) {
        if (spokenWords.indexOf(optWords[w]) !== -1) {
          overlap++;
        }
      }

      if (optWords.length > 0 && overlap > 0) {
        var overlapRatio = overlap / optWords.length;
        score += Math.round(overlapRatio * 150) + (overlap * 20);
      }

      if (score > bestScore) {
        bestScore = score;
        bestOption = options[i];
      }
    }

    return bestScore >= 50 ? bestOption : null;
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

  function _highlightOptionPreview(label) {
    if (!_root) return;
    var targetBtn = label ? _findOptionButton(label) : null;
    var btns = _root.querySelectorAll('.story-option-btn');
    for (var i = 0; i < btns.length; i++) {
      if (targetBtn && btns[i] === targetBtn) {
        btns[i].style.borderColor = 'var(--color-accent)';
        btns[i].style.boxShadow = '0 0 0 2px var(--color-accent-soft, rgba(37,99,235,0.25))';
      } else {
        btns[i].style.borderColor = '';
        btns[i].style.boxShadow = '';
      }
    }
  }

  function _selectOption(step, opt, btn, token) {
    if (_unmounted || token !== _stepToken) return;

    _stepToken += 1;
    _listening = false;
    if (window.Chatbot && typeof window.Chatbot.stopListening === 'function') {
      window.Chatbot.stopListening();
    }
    _highlightOptionPreview(null);
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
    if (window.Chatbot && typeof window.Chatbot.stopListening === 'function') {
      window.Chatbot.stopListening();
    }
    _highlightOptionPreview(null);
    if (_speakTimer) { clearTimeout(_speakTimer); _speakTimer = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  window.StoryLearn = { mount: mount, unmount: unmount };
  console.log('[StoryLearn] window.StoryLearn ready');
})();
