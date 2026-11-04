/**
 * StoryLab Voice — first-run flow
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Exports: window.StoryLabOnboarding
 *   mount(root)                   -> cleanup()   (student enrolment)
 *   mountOrientation(root, opts)  -> cleanup()   (First Shift briefing)
 *
 * End-to-end flow:
 *   identity -> language -> microphone -> commission unit
 *   -> four-panel orientation -> knowledge check -> completion record
 *   -> progress + session + queued sync event -> Control Deck
 */
;(function () {
  'use strict';

  var UI = window.StoryLabUI;
  var State = window.StoryLabState;
  var DRAFT_KEY = 'storylab_profile_draft';

  var enrolment = {
    step: 0,
    name: '',
    avatar: 'sun',
    grade: '5',
    language: 'en',
    mic: 'idle',
    micHeard: false,
    draftLoaded: false
  };

  var orientation = {
    data: null,
    index: 0,
    answers: {},
    correctFirstTry: 0,
    startedAt: 0,
    completed: false,
    disposing: false
  };

  var mic = {
    stream: null,
    context: null,
    analyser: null,
    source: null,
    raf: 0,
    timer: 0,
    bars: [],
    peak: 0
  };

  var _root = null;
  var _enrolBody = null;
  var _orientationRoot = null;
  var _speaking = false;

  var STEPS = [
    { id: 'identity', label: 'Your name', sub: 'Name, class, avatar' },
    { id: 'language', label: 'Language', sub: 'Voice and screens' },
    { id: 'microphone', label: 'Microphone', sub: 'Quick check' }
  ];

  var LANGUAGES = [
    {
      id: 'en',
      native: 'English',
      label: 'English / India',
      sample: 'Let us learn something new today.',
      code: 'EN-IN',
      glyph: 'A'
    },
    {
      id: 'hi',
      native: 'हिंदी',
      label: 'Hindi',
      sample: 'चलो, आज कुछ नया सीखें।',
      code: 'HI-IN',
      glyph: 'अ'
    },
    {
      id: 'mr',
      native: 'मराठी',
      label: 'Marathi',
      sample: 'चला, आज काहीतरी नवीन शिकूया.',
      code: 'MR-IN',
      glyph: 'म'
    }
  ];

  var FALLBACK_ORIENTATION = {
    id: 'first-shift',
    title: 'Getting started',
    steps: [
      {
        id: 'welcome',
        kind: 'briefing',
        nav: 'Welcome',
        kicker: '01 / WELCOME',
        title: 'This is your learning tablet.',
        lede: 'StoryLab Voice turns one shared classroom tablet into a tutor, a library, and a science lab.',
        text: 'It runs from this device. No signal. No laboratory. No account. The terminal remembers what you complete and keeps it ready for your teacher.',
        points: [
          'Three ways to learn: stories, a voice tutor, and virtual experiments.',
          'Every panel can be read aloud.',
          'Everything is stored on this device.'
        ],
        note: 'If the room goes quiet, the terminal still works.',
        art: 'terminal',
        cue: 'This is your learning machine. Everything you need is on this device.'
      },
      {
        id: 'voice',
        kind: 'briefing',
        nav: 'Voice',
        kicker: '02 / VOICE',
        title: 'Talk. It listens.',
        lede: 'The amber SPEAK control opens the microphone. The waveform tells you what the terminal is doing.',
        text: 'Amber means the tutor is speaking. Green means it is listening. If the room is too loud, move closer to the tablet and try again.',
        points: [
          'Wait for the green signal before you speak.',
          'Speak in a normal voice, not a shout.',
          'You can always tap an answer instead.'
        ],
        note: 'Voice is the fastest way in. Touch is always there as a backup.',
        art: 'voice',
        cue: 'Press the amber control, wait for green, then speak. Touch is always available.'
      },
      {
        id: 'bays',
        kind: 'briefing',
        nav: 'Bays',
        kicker: '03 / THREE WAYS TO LEARN',
        title: 'Stories. A tutor. A lab.',
        lede: 'Each bay teaches differently. They all feed the same learning record.',
        text: 'StoryLearn narrates a branching story and asks you questions inside it. The AI Voice Tutor answers what you ask. LabInBox puts apparatus on screen and runs experiments with your voice.',
        points: [
          'Stories — listen, choose, finish.',
          'Voice tutor — ask anything.',
          'Virtual lab — try experiments safely.'
        ],
        note: 'Start with a story if you are not sure where to begin.',
        art: 'bays',
        cue: 'Three bays. Stories, a voice tutor, and a virtual lab.'
      },
      {
        id: 'ledger',
        kind: 'briefing',
        nav: 'Ledger',
        kicker: '04 / YOUR PROGRESS',
        title: 'Your work stays yours.',
        lede: 'Your progress is saved on this tablet. No sign-in needed.',
        text: 'When the terminal finds a connection, queued records move to the sync archive. If there is no connection, nothing is lost — the queue simply waits.',
        points: [
          'Open RECORD to see sessions, checkpoints, and queued records.',
          'Close a session before handing the tablet to the next student.',
          'A facilitator can print or export the learning record.'
        ],
        note: 'Sync is opportunistic. Learning is not.',
        art: 'ledger',
        cue: 'Your progress is stored on this device. When a connection returns, the queue syncs.'
      },
      {
        id: 'check',
        kind: 'check',
        nav: 'Check',
        kicker: '05 / CHECK',
        title: 'One question before we hand over the keys.',
        lede: 'There is no time limit. Pick the answer that matches what the terminal does.',
        question: 'Which control opens the microphone so you can talk to the tutor?',
        options: [
          { label: 'The amber SPEAK control', correct: true, feedback: 'Correct. Amber is the action colour. Press SPEAK, wait for the green listening light, then talk.' },
          { label: 'The RECORD tab in the header', correct: false, feedback: 'RECORD opens your learning file. The microphone lives on the amber SPEAK control.' },
          { label: 'The vent slots under the panel', correct: false, feedback: 'Those are part of the chassis. Look for the amber SPEAK control instead.' }
        ],
        art: 'check',
        cue: 'One question. Which control opens the microphone?'
      }
    ]
  };

  /* ------------------------------------------------------------
     Diagrams — blueprint-style schematics, no external images
     ------------------------------------------------------------ */
  function diagram(name) {
    var frame =
      'fill="none" stroke="#4a534b" stroke-width="1" stroke-opacity=".55"';

    if (name === 'voice') {
      return (
        '<svg viewBox="0 0 640 214" role="img" aria-label="Voice input schematic">' +
        '<g stroke="#4a534b" stroke-opacity=".4" stroke-width="1">' +
        '<path d="M0 178h640M0 44h640M92 0v214M548 0v214"/>' +
        '</g>' +
        '<g fill="none" stroke="#f59e0b" stroke-opacity=".28">' +
        '<circle cx="320" cy="104" r="78" stroke-dasharray="2 7"/>' +
        '<circle cx="320" cy="104" r="112" stroke-dasharray="2 11"/>' +
        '</g>' +
        '<rect x="302" y="46" width="36" height="66" rx="18" fill="#1b201c" stroke="#f59e0b" stroke-width="1.4"/>' +
        '<path d="M286 94v8a34 34 0 0 0 68 0v-8M320 142v22M300 168h40" fill="none" stroke="#ece9dd" stroke-width="1.4" stroke-linecap="square"/>' +
        '<g stroke="#75d99a" stroke-width="2" stroke-linecap="square">' +
        '<path d="M190 120v-12M206 131V97M222 140V88M238 126v-24M254 136V92"/>' +
        '<path d="M386 136V92M402 126v-24M418 140V88M434 131V97M450 120v-12"/>' +
        '</g>' +
        '<g font-family="Google Sans Code, monospace" font-size="8" letter-spacing="1.6" fill="#8b8f83">' +
        '<text x="20" y="24">VOICE BUS / INPUT</text>' +
        '<text x="540" y="196" text-anchor="end">48 kHz / ON DEVICE</text>' +
        '<text x="320" y="202" text-anchor="middle" fill="#75d99a">LISTENING</text>' +
        '</g>' +
        '</svg>'
      );
    }

    if (name === 'bays') {
      return (
        '<svg viewBox="0 0 640 214" role="img" aria-label="Three ways to learn">' +
        '<g stroke="#4a534b" stroke-opacity=".4" stroke-width="1"><path d="M0 184h640"/></g>' +
        '<g fill="#101411" stroke="#4a534b">' +
        '<rect x="64" y="32" width="150" height="124"/>' +
        '<rect x="245" y="32" width="150" height="124"/>' +
        '<rect x="426" y="32" width="150" height="124"/>' +
        '</g>' +
        '<g stroke="#f59e0b" stroke-opacity=".32"><path d="M64 60h150M245 60h150M426 60h150"/></g>' +
        '<g fill="none" stroke="#8ce0ad" stroke-width="1.5" stroke-linecap="square">' +
        '<path d="M104 132c14-4 25-4 36 2v-40c-11-6-22-6-36-2v40Z"/>' +
        '<path d="M176 132c-14-4-25-4-36 2v-40c11-6 22-6 36-2v40Z"/>' +
        '</g>' +
        '<g fill="none" stroke="#9dbcff" stroke-width="1.5" stroke-linecap="square">' +
        '<rect x="294" y="96" width="52" height="30"/>' +
        '<path d="M294 96v-9l26-13 26 13v9M308 106h6M320 106h8M332 106h0"/>' +
        '</g>' +
        '<g fill="none" stroke="#ffc24b" stroke-width="1.5" stroke-linecap="square">' +
        '<path d="M478 82h44M480 82v8l-12 30a8 8 0 0 0 7 11h48a8 8 0 0 0 7-11l-12-30v-8"/>' +
        '<path d="M484 116h32"/>' +
        '</g>' +
        '<g font-family="Google Sans Code, monospace" font-size="8" letter-spacing="1.4" fill="#8b8f83">' +
        '<text x="64" y="22">STORIES</text>' +
        '<text x="245" y="22">VOICE TUTOR</text>' +
        '<text x="426" y="22">VIRTUAL LAB</text>' +
        '<text x="139" y="180" text-anchor="middle" fill="#75d99a">LISTEN</text>' +
        '<text x="320" y="180" text-anchor="middle" fill="#8db4ff">ASK</text>' +
        '<text x="501" y="180" text-anchor="middle" fill="#f5a524">TRY</text>' +
        '<text x="320" y="202" text-anchor="middle">ONE PROGRESS PAGE</text>' +
        '</g>' +
        '<g stroke="#f59e0b" stroke-width="1" stroke-dasharray="2 5" fill="none">' +
        '<path d="M214 94h31M395 94h31"/>' +
        '</g>' +
        '</svg>'
      );
    }

    if (name === 'ledger') {
      return (
        '<svg viewBox="0 0 640 214" role="img" aria-label="Saved work and upload">' +
        '<g stroke="#4a534b" stroke-opacity=".4" stroke-width="1"><path d="M0 184h640M0 38h640"/></g>' +
        '<g fill="none" stroke="#ece9dd" stroke-width="1.4">' +
        '<ellipse cx="196" cy="70" rx="58" ry="16"/>' +
        '<path d="M138 70v50c0 9 26 16 58 16s58-7 58-16V70"/>' +
        '<path d="M138 95c0 9 26 16 58 16s58-7 58-16"/>' +
        '</g>' +
        '<g fill="none" stroke="#75d99a" stroke-width="1" stroke-opacity=".8">' +
        '<rect x="150" y="82" width="92" height="12"/>' +
        '<rect x="150" y="102" width="70" height="9"/>' +
        '</g>' +
        '<g fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3 4">' +
        '<path d="M274 94h78M352 94l-10-9M352 94l-10 9"/>' +
        '</g>' +
        '<path d="M432 70v52c0 9 26 16 58 16s58-7 58-16V70" fill="none" stroke="#ece9dd" stroke-width="1.4"/>' +
        '<ellipse cx="490" cy="70" rx="58" ry="16" fill="none" stroke="#ece9dd" stroke-width="1.4"/>' +
        '<g stroke="#f59e0b" stroke-width="1.6" fill="none">' +
        '<path d="M470 96l10 10 24-25"/>' +
        '</g>' +
        '<g font-family="Google Sans Code, monospace" font-size="8" letter-spacing="1.4" fill="#8b8f83">' +
        '<text x="138" y="158">SAVED ON THIS DEVICE</text>' +
        '<text x="432" y="158">UPLOAD / OPTIONAL</text>' +
        '<text x="320" y="196" text-anchor="middle">QUEUE WAITS. NOTHING IS LOST.</text>' +
        '</g>' +
        '</svg>'
      );
    }

    if (name === 'check') {
      return (
        '<svg viewBox="0 0 640 214" role="img" aria-label="Final check schematic">' +
        '<g stroke="#4a534b" stroke-opacity=".4" stroke-width="1"><path d="M0 184h640M0 38h640"/></g>' +
        '<g fill="none" stroke="#f59e0b" stroke-width="1">' +
        '<path d="M320 32l74 74-74 74-74-74z"/>' +
        '<circle cx="320" cy="106" r="46" stroke-dasharray="2 7"/>' +
        '</g>' +
        '<text x="320" y="124" text-anchor="middle" font-family="Google Sans Flex, sans-serif" font-size="52" font-weight="600" fill="#f5a524">?</text>' +
        '<g font-family="Google Sans Code, monospace" font-size="8" letter-spacing="1.4" fill="#8b8f83">' +
        '<text x="64" y="190">NO TIME LIMIT</text>' +
        '<text x="576" y="190" text-anchor="end">TAP OR SPEAK</text>' +
        '</g>' +
        '</svg>'
      );
    }

    return (
      '<svg viewBox="0 0 640 214" role="img" aria-label="Learning terminal schematic">' +
      '<g stroke="#4a534b" stroke-opacity=".35" stroke-width="1">' +
      '<path d="M0 184h640M0 36h640M52 0v214M588 0v214"/>' +
      '</g>' +
      '<rect x="92" y="42" width="456" height="120" fill="#0b0e0c" stroke="#4a534b"/>' +
      '<rect x="92" y="42" width="456" height="24" fill="#141815" stroke="#4a534b"/>' +
      '<circle cx="108" cy="54" r="3" fill="#f59e0b"/>' +
      '<circle cx="120" cy="54" r="3" fill="#4a534b"/>' +
      '<circle cx="132" cy="54" r="3" fill="#4a534b"/>' +
      '<text x="528" y="57" text-anchor="end" font-family="Google Sans Code, monospace" font-size="7" letter-spacing="1.2" fill="#8b8f83">STORYLAB / LEARNING APP</text>' +
      '<g stroke="#f59e0b" stroke-width="2" stroke-linecap="square">' +
      '<path d="M142 106v-12M158 116V92M174 124V84M190 110V98M206 120V88M222 104v-8"/>' +
      '</g>' +
      '<g font-family="Google Sans Flex, sans-serif" fill="#ece9dd">' +
      '<text x="270" y="98" font-size="17" font-weight="500">StoryLab Voice</text>' +
      '<text x="270" y="117" font-size="8.5" fill="#8b8f83" letter-spacing="1.5">LEARNING APP / OFFLINE</text>' +
      '</g>' +
      '<g fill="#1b201c" stroke="#4a534b">' +
      '<rect x="270" y="128" width="70" height="16"/>' +
      '<rect x="348" y="128" width="70" height="16"/>' +
      '<rect x="426" y="128" width="70" height="16"/>' +
      '</g>' +
      '<g fill="#75d99a"><rect x="277" y="134" width="26" height="3"/></g>' +
      '<g fill="#9dbcff"><rect x="355" y="134" width="18" height="3"/></g>' +
      '<g fill="#f5a524"><rect x="433" y="134" width="31" height="3"/></g>' +
      '<g font-family="Google Sans Code, monospace" font-size="7" letter-spacing="1" fill="#8b8f83">' +
      '<text x="270" y="190">ONE DEVICE</text>' +
      '<text x="320" y="190" text-anchor="middle">ZERO SIGNAL</text>' +
      '<text x="588" y="190" text-anchor="end">LOCAL FIRST</text>' +
      '</g>' +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------
     Onboarding draft
     ------------------------------------------------------------ */
  function readDraft() {
    if (enrolment.draftLoaded) return;
    enrolment.draftLoaded = true;
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      if (!draft || typeof draft !== 'object') return;
      if (draft.name) enrolment.name = String(draft.name).slice(0, 28);
      if (draft.avatar) enrolment.avatar = draft.avatar;
      if (draft.grade) enrolment.grade = draft.grade;
      if (draft.language) enrolment.language = draft.language;
    } catch (err) {
      /* Drafts are a convenience; ignore corrupt values. */
    }
  }

  function writeDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        name: enrolment.name,
        avatar: enrolment.avatar,
        grade: enrolment.grade,
        language: enrolment.language
      }));
    } catch (err) {
      /* Private browsing can refuse storage. */
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------
     Enrolment screen
     ------------------------------------------------------------ */
  function mount(root) {
    readDraft();
    _root = root;
    root.innerHTML =
      '<section class="screen onboard">' +
      '  <aside class="onboard__rail">' +
      '    <p class="eyebrow">SETUP / 3 STEPS</p>' +
      '    <h2 class="onboard__rail-title">Set up this<br>tablet.</h2>' +
      '    <ol class="onboard-steps" aria-label="Enrolment steps">' +
      STEPS.map(function (step, index) {
        return (
          '<li class="onboard-step" data-step-indicator="' + index + '" aria-current="false">' +
          '<span class="onboard-step__num">' + String(index + 1).padStart(2, '0') + '</span>' +
          '<span class="onboard-step__text">' +
          '<span class="onboard-step__label">' + step.label + '</span>' +
          '<span class="onboard-step__sub">' + step.sub + '</span>' +
          '</span></li>'
        );
      }).join('') +
      '    </ol>' +
      '    <div class="rail-note">' +
      '      <span class="mono-label">NOTE</span>' +
      '      <p>One student record on this tablet. No account and no password.</p>' +
      '    </div>' +
      '  </aside>' +
      '  <div class="onboard__plate panel">' +
      '    <header class="plate-head">' +
      '      <span class="plate-head__serial">STUDENT SETUP</span>' +
      '      <span class="plate-head__status"><i class="led led--warn led--pulse"></i> OPEN</span>' +
      '    </header>' +
      '    <div class="plate-body" id="enrol-body"></div>' +
      '    <footer class="plate-foot">' +
      '      <button type="button" class="btn btn-ghost" id="enrol-back">← BACK</button>' +
      '      <span class="plate-foot__hint" id="enrol-hint">STEP 1 OF 3</span>' +
      '      <button type="button" class="btn btn-primary" id="enrol-next">CONTINUE →</button>' +
      '    </footer>' +
      '  </div>' +
      '</section>';

    _enrolBody = document.getElementById('enrol-body');

    _enrolBody.addEventListener('click', function (event) {
      var avatarBtn = event.target.closest('[data-avatar]');
      if (avatarBtn) {
        enrolment.avatar = avatarBtn.getAttribute('data-avatar');
        document.querySelectorAll('[data-avatar]').forEach(function (button) {
          var selected = button === avatarBtn;
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        updatePreview();
        writeDraft();
        return;
      }

      var gradeBtn = event.target.closest('[data-grade]');
      if (gradeBtn) {
        enrolment.grade = gradeBtn.getAttribute('data-grade');
        document.querySelectorAll('[data-grade]').forEach(function (button) {
          var selected = button === gradeBtn;
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        updatePreview();
        writeDraft();
        return;
      }

      var langBtn = event.target.closest('[data-lang]');
      if (langBtn) {
        enrolment.language = langBtn.getAttribute('data-lang');
        document.querySelectorAll('[data-lang]').forEach(function (button) {
          var selected = button === langBtn;
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        updatePreview();
        writeDraft();
        return;
      }

      if (event.target.closest('#mic-arm')) {
        if (mic.stream) {
          stopMic(true);
        } else {
          armMic();
        }
        return;
      }

      if (event.target.closest('#mic-skip')) {
        stopMic(false);
        enrolment.mic = 'touch';
        enrolment.micHeard = false;
        updateMicUI();
        return;
      }
    });

    _enrolBody.addEventListener('input', function (event) {
      if (event.target && event.target.id === 'enrol-name') {
        enrolment.name = event.target.value.slice(0, 28);
        updatePreview();
        writeDraft();
        var error = document.getElementById('name-error');
        if (error) error.hidden = true;
      }
    });

    document.getElementById('enrol-back').addEventListener('click', previousStep);
    document.getElementById('enrol-next').addEventListener('click', nextStep);

    renderStep();
    return unmount;
  }

  function renderStep() {
    if (!_enrolBody) return;

    STEPS.forEach(function (step, index) {
      var item = document.querySelector('[data-step-indicator="' + index + '"]');
      if (!item) return;
      item.classList.toggle('is-active', index === enrolment.step);
      item.classList.toggle('is-done', index < enrolment.step);
      item.setAttribute('aria-current', index === enrolment.step ? 'step' : 'false');
    });

    var back = document.getElementById('enrol-back');
    var next = document.getElementById('enrol-next');
    var hint = document.getElementById('enrol-hint');
    if (back) back.style.visibility = enrolment.step === 0 ? 'hidden' : 'visible';
    if (next) {
      next.disabled = false;
      next.textContent = enrolment.step === STEPS.length - 1 ? 'FINISH SETUP →' : 'CONTINUE →';
    }
    if (hint) {
      hint.textContent = 'STEP ' + (enrolment.step + 1) + ' OF 3';
    }

    if (enrolment.step === 0) renderIdentity();
    else if (enrolment.step === 1) renderLanguage();
    else renderMicrophone();
  }

  function renderIdentity() {
    var selectedAvatar = enrolment.avatar;
    _enrolBody.innerHTML =
      '<div class="step-head">' +
      '  <p class="eyebrow eyebrow--muted">STEP 1 / YOUR NAME</p>' +
      '  <h1 class="step-title">What\'s your<br>name?</h1>' +
      '  <p class="step-lede">Use the name your teacher will recognise.</p>' +
      '</div>' +
      '<div class="step-layout">' +
      '  <div class="step-col">' +
      '    <div class="field">' +
      '      <label class="field__label" for="enrol-name">Student name <small>2–28 characters</small></label>' +
      '      <input class="input-field input-field--lg" id="enrol-name" type="text" autocomplete="name" maxlength="28" ' +
      '        placeholder="Type your name" value="' + UI.escape(enrolment.name) + '" aria-describedby="name-error">' +
      '      <p class="field__hint">Saved on this tablet only.</p>' +
      '      <p class="field__error" id="name-error" hidden>Enter a name with at least two characters.</p>' +
      '    </div>' +
      '    <div class="field">' +
      '      <span class="field__label">Pick an avatar <small>Tap one</small></span>' +
      '      <div class="avatar-picker" role="group" aria-label="Choose an avatar">' +
      UI.avatars.map(function (item) {
        var selected = item.id === selectedAvatar;
        return (
          '<button type="button" class="avatar-option' + (selected ? ' is-selected' : '') + '" ' +
          'data-avatar="' + item.id + '" aria-pressed="' + (selected ? 'true' : 'false') + '" ' +
          'aria-label="' + item.label + ' callsign">' + UI.avatar(item.id) + '</button>'
        );
      }).join('') +
      '      </div>' +
      '    </div>' +
      '    <div class="field">' +
      '      <span class="field__label">Class / grade <small>Grade 1–8</small></span>' +
      '      <div class="grade-picker" role="group" aria-label="Choose a grade">' +
      [1, 2, 3, 4, 5, 6, 7, 8].map(function (grade) {
        var selected = String(grade) === String(enrolment.grade);
        return (
          '<button type="button" class="grade-option' + (selected ? ' is-selected' : '') + '" ' +
          'data-grade="' + grade + '" aria-pressed="' + (selected ? 'true' : 'false') + '" ' +
          'aria-label="Grade ' + grade + '">' + grade + '</button>'
        );
      }).join('') +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <aside class="step-aside">' +
      renderPreview() +
      '    <div class="micro-note"><strong>One student per session.</strong> Close the session from PROGRESS before the next student starts.</div>' +
      '  </aside>' +
      '</div>';

    var input = document.getElementById('enrol-name');
    if (input && enrolment.name) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    updatePreview();
  }

  function renderPreview() {
    var language = findLanguage(enrolment.language);
    return (
      '<div class="preview-card" aria-live="polite">' +
      '  <div class="preview-card__avatar" id="preview-avatar">' + UI.avatar(enrolment.avatar) + '</div>' +
      '  <div class="preview-card__name" id="preview-name">' + (UI.escape(enrolment.name) || 'Unnamed student') + '</div>' +
      '  <div class="preview-card__meta" id="preview-meta">GRADE ' + UI.escape(enrolment.grade) + ' / ' + language.code + '</div>' +
      '  <div class="preview-card__rule"></div>' +
      '  <div class="preview-card__rows">' +
      '    <div class="preview-card__row"><span>SAVED</span><strong>THIS DEVICE</strong></div>' +
      '    <div class="preview-card__row"><span>AVATAR</span><strong id="preview-callsign">' + findAvatar(enrolment.avatar) + '</strong></div>' +
      '    <div class="preview-card__row"><span>STATUS</span><strong>SETTING UP</strong></div>' +
      '  </div>' +
      '  <div class="barcode" aria-hidden="true"></div>' +
      '</div>'
    );
  }

  function updatePreview() {
    var name = document.getElementById('preview-name');
    var avatar = document.getElementById('preview-avatar');
    var meta = document.getElementById('preview-meta');
    var callsign = document.getElementById('preview-callsign');
    var language = findLanguage(enrolment.language);
    if (name) name.textContent = enrolment.name || 'Unnamed student';
    if (avatar) avatar.innerHTML = UI.avatar(enrolment.avatar);
    if (meta) meta.textContent = 'GRADE ' + enrolment.grade + ' / ' + language.code;
    if (callsign) callsign.textContent = findAvatar(enrolment.avatar);
  }

  function renderLanguage() {
    _enrolBody.innerHTML =
      '<div class="step-head">' +
      '  <p class="eyebrow eyebrow--muted">STEP 2 / LANGUAGE</p>' +
      '  <h1 class="step-title">Which language<br>should it speak?</h1>' +
      '  <p class="step-lede">Used for reading aloud and listening. You can change it later from PROGRESS.</p>' +
      '</div>' +
      '<div class="lang-list" role="radiogroup" aria-label="Preferred language">' +
      LANGUAGES.map(function (language) {
        var selected = language.id === enrolment.language;
        return (
          '<button type="button" class="lang-card' + (selected ? ' is-selected' : '') + '" ' +
          'data-lang="' + language.id + '" role="radio" aria-checked="' + (selected ? 'true' : 'false') + '">' +
          '<span class="lang-card__flag">' + language.glyph + '</span>' +
          '<span class="lang-card__text">' +
          '<span class="lang-card__native">' + language.native + '</span>' +
          '<span class="lang-card__label">' + language.label + '</span>' +
          '<span class="lang-card__sample">' + language.sample + '</span>' +
          '</span>' +
          '<span class="lang-card__code">' + language.code + '</span>' +
          '</button>'
        );
      }).join('') +
      '</div>' +
      '<div class="onboard-callout"><strong>What this changes:</strong> the tutor will speak and listen in this language.</div>';

    var selected = document.querySelector('.lang-card.is-selected');
    if (selected) {
      selected.focus();
    }
  }

  function renderMicrophone() {
    var micLabel = {
      idle: 'READY',
      requesting: 'ASKING…',
      live: 'LISTENING',
      verified: 'MIC WORKS',
      denied: 'MIC BLOCKED',
      unavailable: 'NO MIC',
      touch: 'TOUCH ONLY'
    }[enrolment.mic] || 'READY';

    var micClass = enrolMicClass();

    _enrolBody.innerHTML =
      '<div class="step-head">' +
      '  <p class="eyebrow eyebrow--muted">STEP 3 / MICROPHONE</p>' +
      '  <h1 class="step-title">Can we use<br>your microphone?</h1>' +
      '  <p class="step-lede">Say your name at a normal volume. Nothing is recorded.</p>' +
      '</div>' +
      '<div class="mic-box">' +
      '  <div class="mic-box__head">' +
      '    <span class="mono-label">MICROPHONE</span>' +
      '    <span class="mic-status ' + micClass + '" id="mic-status"><i class="led"></i><span id="mic-status-label">' + micLabel + '</span></span>' +
      '  </div>' +
      '  <div class="mic-meter" id="mic-meter" aria-hidden="true">' +
      Array.from({ length: 36 }).map(function (_, index) {
        return '<span class="mic-meter__bar" data-mic-bar="' + index + '"></span>';
      }).join('') +
      '  </div>' +
      '  <div class="mic-readout">' +
      '    <span id="mic-readout-label">' + micReadout() + '</span>' +
      '    <strong id="mic-readout-level">—</strong>' +
      '  </div>' +
      '  <div class="mic-actions" id="mic-actions">' + micActions() + '</div>' +
      '  <p class="mic-hint">If you block the microphone, everything still works by tapping.</p>' +
      '</div>' +
      '<div id="mic-result" class="mic-result' + micResultClass() + '">' + micResult() + '</div>' +
      '<div class="onboard-callout"><strong>Privacy:</strong> audio is only checked for volume. Nothing is stored.</div>';

    mic.bars = Array.prototype.slice.call(_enrolBody.querySelectorAll('[data-mic-bar]'));
    updateMicUI();
  }

  function enrolMicClass() {
    return enrolment.mic === 'live'
      ? 'is-live'
      : enrolment.mic === 'verified'
        ? 'is-live'
        : enrolment.mic === 'denied' || enrolment.mic === 'unavailable'
          ? 'is-error'
          : '';
  }

  function micActions() {
    if (mic.stream) {
      return '<button type="button" class="btn btn-primary" id="mic-arm">STOP</button>' +
        '<button type="button" class="btn btn-secondary" id="mic-skip">USE TOUCH</button>';
    }
    if (enrolment.mic === 'verified') {
      return '<button type="button" class="btn btn-secondary" id="mic-arm">TEST AGAIN</button>' +
        '<button type="button" class="btn btn-primary" id="mic-skip">USE TOUCH</button>';
    }
    return '<button type="button" class="btn btn-primary" id="mic-arm">TEST MICROPHONE</button>' +
      '<button type="button" class="btn btn-secondary" id="mic-skip">SKIP</button>';
  }

  function micReadout() {
    if (mic.stream) return 'Listening — say “my name is…”';
    if (enrolment.mic === 'verified') return 'Input confirmed. The terminal can hear you.';
    if (enrolment.mic === 'denied') return 'Permission was declined. Touch mode is available.';
    if (enrolment.mic === 'unavailable') return 'No microphone on this browser. Touch mode is available.';
    if (enrolment.mic === 'touch') return 'Touch mode selected. Taps work everywhere.';
    if (enrolment.mic === 'requesting') return 'Waiting for browser permission…';
    return 'No signal yet. Press ARM MICROPHONE.';
  }

  function micResult() {
    if (enrolment.mic === 'verified') return '✓ SIGNAL LOCKED — microphone verified. The voice bus is ready.';
    if (enrolment.mic === 'denied') return 'Microphone permission was declined. You can continue in touch mode.';
    if (enrolment.mic === 'unavailable') return 'This browser does not expose a microphone. Continue in touch mode.';
    if (enrolment.mic === 'touch') return 'Touch mode selected. Voice features will still show text fallbacks where available.';
    if (mic.stream) return 'Speak at a normal volume. A steady green signal will lock the check.';
    return 'The check is optional. You can commission the terminal without a microphone.';
  }

  function micResultClass() {
    if (enrolment.mic === 'verified') return ' is-ok';
    if (enrolment.mic === 'denied' || enrolment.mic === 'unavailable') return ' is-error';
    return '';
  }

  function updateMicUI() {
    if (!_enrolBody) return;
    var status = document.getElementById('mic-status');
    var statusLabel = document.getElementById('mic-status-label');
    var readout = document.getElementById('mic-readout-label');
    var result = document.getElementById('mic-result');
    var actions = document.getElementById('mic-actions');
    var meter = document.getElementById('mic-meter');

    if (status) {
      status.className = 'mic-status ' + (mic.stream ? 'is-live' : enrolMicClass());
      status.innerHTML = '<i class="led"></i><span id="mic-status-label">' + (
        mic.stream ? 'LIVE INPUT' :
        enrolment.mic === 'verified' ? 'SIGNAL LOCKED' :
        enrolment.mic === 'denied' ? 'PERMISSION DENIED' :
        enrolment.mic === 'unavailable' ? 'NO INPUT API' :
        enrolment.mic === 'touch' ? 'TOUCH MODE' :
        enrolment.mic === 'requesting' ? 'REQUESTING' : 'STANDBY'
      ) + '</span>';
    }
    if (readout) readout.textContent = micReadout();
    if (result) {
      result.className = 'mic-result' + micResultClass();
      result.textContent = micResult();
    }
    if (actions) actions.innerHTML = micActions();
    if (meter) {
      meter.classList.toggle('is-live', !!mic.stream);
      meter.classList.toggle('is-locked', enrolment.mic === 'verified');
    }
  }

  function armMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      enrolment.mic = 'unavailable';
      updateMicUI();
      return;
    }

    enrolment.mic = 'requesting';
    updateMicUI();

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (!_enrolBody) {
        stream.getTracks().forEach(function (track) { track.stop(); });
        return;
      }
      mic.stream = stream;
      enrolment.mic = 'live';
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        stopMic(false);
        enrolment.mic = 'unavailable';
        updateMicUI();
        return;
      }
      mic.context = new AudioContext();
      mic.analyser = mic.context.createAnalyser();
      mic.analyser.fftSize = 256;
      mic.analyser.smoothingTimeConstant = 0.72;
      mic.source = mic.context.createMediaStreamSource(stream);
      mic.source.connect(mic.analyser);
      mic.peak = 0;
      mic.bars = Array.prototype.slice.call(document.querySelectorAll('[data-mic-bar]'));
      meterLoop();
      updateMicUI();

      mic.timer = window.setTimeout(function () {
        if (!mic.stream) return;
        stopMic(enrolment.micHeard);
      }, 30000);
    }).catch(function (err) {
      console.warn('[Onboarding] Microphone unavailable:', err);
      enrolment.mic = (err && err.name === 'NotAllowedError') ? 'denied' : 'unavailable';
      updateMicUI();
    });
  }

  function meterLoop() {
    if (!mic.analyser || !mic.stream) return;
    var data = new Uint8Array(mic.analyser.fftSize);
    mic.analyser.getByteTimeDomainData(data);
    var sum = 0;
    for (var i = 0; i < data.length; i += 1) {
      var v = (data[i] - 128) / 128;
      sum += v * v;
    }
    var rms = Math.sqrt(sum / data.length);
    var level = Math.min(1, rms * 5.5);

    if (level > 0.09) {
      mic.peak = Math.max(mic.peak, level);
      if (!enrolment.micHeard && level > 0.13) {
        enrolment.micHeard = true;
        var result = document.getElementById('mic-result');
        if (result) {
          result.className = 'mic-result is-ok';
          result.textContent = '✓ SIGNAL DETECTED — keep speaking for a moment.';
        }
      }
    }

    var bars = mic.bars || [];
    var mid = (bars.length - 1) / 2;
    bars.forEach(function (bar, index) {
      var shape = 0.4 + 0.6 * Math.sin((index / (bars.length - 1)) * Math.PI);
      var jitter = 0.8 + Math.random() * 0.35;
      var height = 4 + Math.round(level * 108 * shape * jitter);
      bar.style.height = Math.max(4, Math.min(112, height)) + 'px';
    });

    var levelEl = document.getElementById('mic-readout-level');
    if (levelEl) {
      levelEl.textContent = level > 0.02
        ? Math.min(99, Math.round(mic.peak * 100)) + '% PEAK'
        : '—';
    }

    mic.raf = window.requestAnimationFrame(meterLoop);
  }

  function stopMic(markVerified) {
    if (mic.raf) window.cancelAnimationFrame(mic.raf);
    mic.raf = 0;
    if (mic.timer) window.clearTimeout(mic.timer);
    mic.timer = 0;
    if (mic.stream) {
      mic.stream.getTracks().forEach(function (track) { track.stop(); });
      mic.stream = null;
    }
    if (mic.source) {
      try { mic.source.disconnect(); } catch (err) { /* ignore */ }
      mic.source = null;
    }
    if (mic.analyser) {
      try { mic.analyser.disconnect(); } catch (err) { /* ignore */ }
      mic.analyser = null;
    }
    if (mic.context) {
      try { mic.context.close(); } catch (err) { /* ignore */ }
      mic.context = null;
    }
    mic.bars.forEach(function (bar) { bar.style.height = '4px'; });
    mic.bars = [];

    if (markVerified || enrolment.micHeard) {
      enrolment.mic = 'verified';
    } else if (enrolment.mic === 'live' || enrolment.mic === 'requesting') {
      enrolment.mic = 'idle';
    }
    updateMicUI();
  }

  function previousStep() {
    if (enrolment.step === 0) return;
    if (enrolment.step === 2) stopMic(false);
    enrolment.step -= 1;
    renderStep();
  }

  function nextStep() {
    if (enrolment.step === 0) {
      var trimmed = enrolment.name.trim();
      if (!validName(trimmed)) {
        var error = document.getElementById('name-error');
        if (error) error.hidden = false;
        var input = document.getElementById('enrol-name');
        if (input) input.focus();
        return;
      }
      enrolment.name = trimmed;
      writeDraft();
      enrolment.step = 1;
      renderStep();
      return;
    }

    if (enrolment.step === 1) {
      enrolment.step = 2;
      renderStep();
      return;
    }

    commissionUnit();
  }

  async function commissionUnit() {
    if (enrolment.step !== 2) return;
    var next = document.getElementById('enrol-next');
    if (next) {
      next.disabled = true;
      next.textContent = 'COMMISSIONING…';
    }
    stopMic(false);

    var language = findLanguage(enrolment.language);
    var micState = enrolment.mic === 'verified'
      ? 'verified'
      : enrolment.mic === 'touch'
        ? 'touch'
        : (enrolment.mic === 'denied' || enrolment.mic === 'unavailable')
          ? 'unavailable'
          : 'not-tested';

    try {
      await State.saveProfile({
        name: enrolment.name.trim(),
        avatar: enrolment.avatar,
        grade: enrolment.grade,
        language: enrolment.language,
        languageTag: language.code,
        mic: micState,
        onboardedAt: Date.now()
      });
      await State.logEvent('student.enrolled', 'Commissioned the learning terminal', {
        grade: enrolment.grade,
        language: enrolment.language,
        mic: micState
      });
      await State.startSession();
      clearDraft();
      window.StoryLabRouter.navigate('orientation');
    } catch (err) {
      console.error('[Onboarding] Commission failed:', err);
      if (next) {
        next.disabled = false;
        next.textContent = 'TRY AGAIN →';
      }
      var body = document.getElementById('enrol-body');
      if (body) {
        var existing = body.querySelector('.onboard-error');
        if (existing) existing.remove();
        var box = document.createElement('div');
        box.className = 'onboard-error';
        box.textContent = 'Progress could not be saved: ' + (err.message || err) + '. Check that this browser allows storage, then try again.';
        body.appendChild(box);
      }
    }
  }

  function validName(value) {
    if (!value || value.length < 2 || value.length > 28) return false;
    try {
      return /^[\p{L}\p{M}][\p{L}\p{M} .'’\-]*$/u.test(value);
    } catch (err) {
      return true;
    }
  }

  function findLanguage(id) {
    return LANGUAGES.find(function (item) { return item.id === id; }) || LANGUAGES[0];
  }

  function findAvatar(id) {
    var found = UI.avatars.find(function (item) { return item.id === id; });
    return found ? found.label : 'Sun';
  }

  function unmount() {
    stopMic(false);
    if (_speaking && window.speechSynthesis) window.speechSynthesis.cancel();
    _speaking = false;
    _root = null;
    _enrolBody = null;
    _orientationRoot = null;
    orientation.disposing = true;
  }

  /* ------------------------------------------------------------
     Orientation / First Shift
     ------------------------------------------------------------ */
  function mountOrientation(root, opts) {
    var profile = State.getProfile();
    if (!profile) {
      window.StoryLabRouter.navigate('onboarding');
      return function () {};
    }

    _orientationRoot = root;
    orientation.disposing = false;
    orientation.answers = {};
    orientation.correctFirstTry = 0;
    orientation.completed = false;
    orientation.startedAt = Date.now();

    root.innerHTML =
      '<section class="screen briefing">' +
      '  <div class="panel panel--accent" style="padding:28px">' +
      '    <p class="mono-label">LOADING…</p>' +
      '    <div class="meter" style="margin-top:12px"><div class="meter__fill" style="width:36%"></div></div>' +
      '  </div>' +
      '</section>';

    loadOrientationData().then(function (data) {
      if (orientation.disposing || !_orientationRoot) return;

      orientation.data = data;
      var journey = State.getJourney();
      var options = opts || {};
      var replay = journey.orientation.completed || options.replay;
      var startIndex = 0;
      if (!replay && journey.orientation.lastStep && journey.orientation.lastStep < data.steps.length) {
        startIndex = journey.orientation.lastStep;
      }
      orientation.index = startIndex;

      renderBriefingShell(profile);
      renderBriefingStep();
      if (startIndex > 0) {
        UI.toast({
          title: 'Briefing resumed',
          message: 'Continuing at step ' + (startIndex + 1) + ' of 5.',
          kind: 'info'
        });
      }
    }).catch(function (err) {
      console.error('[Orientation] Could not render briefing:', err);
      if (!_orientationRoot) return;
      _orientationRoot.innerHTML =
        '<div class="panel panel--accent" style="padding:32px">' +
        '<p class="eyebrow">GETTING STARTED / PROBLEM</p>' +
        '<h1 class="step-title" style="margin-top:10px">This intro could not be loaded.</h1>' +
        '<p class="lede" style="margin-top:12px">Reload the terminal to try again. This does not affect your enrolment.</p>' +
        '<a class="btn btn-secondary" style="margin-top:18px" href="#/home">← BACK TO HOME</a>' +
        '</div>';
    });

    return function () {
      orientation.disposing = true;
      if (_speaking && window.speechSynthesis) window.speechSynthesis.cancel();
      _speaking = false;
      _orientationRoot = null;
    };
  }

  async function loadOrientationData() {
    try {
      var response = await fetch('data/orientation/first-shift.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();
      if (!data || !Array.isArray(data.steps) || !data.steps.length) throw new Error('Invalid briefing');
      return data;
    } catch (err) {
      console.warn('[Orientation] Using local fallback briefing:', err);
      return FALLBACK_ORIENTATION;
    }
  }

  function renderBriefingShell(profile) {
    if (!_orientationRoot) return;
    var data = orientation.data;
    _orientationRoot.innerHTML =
      '<section class="screen briefing">' +
      '  <header class="briefing__head">' +
      '    <div>' +
      '      <p class="eyebrow">GETTING STARTED</p>' +
      '      <h1 class="briefing-title">Welcome, <span>' + UI.escape(profile.name) + '.</span></h1>' +
      '    </div>' +
      '    <div class="briefing-meter">' +
      '      <span class="mono-label">STEPS</span>' +
      '      <div class="segments" id="briefing-segments"></div>' +
      '      <span class="briefing-meter__count" id="briefing-count">PANEL 01 / ' + String(data.steps.length).padStart(2, '0') + '</span>' +
      '    </div>' +
      '  </header>' +
      '  <div class="briefing-grid">' +
      '    <nav class="briefing-index" id="briefing-index" aria-label="Briefing panels"></nav>' +
      '    <article class="briefing-sheet panel panel--accent" id="briefing-sheet" aria-live="polite"></article>' +
      '    <aside class="briefing-aside" id="briefing-aside"></aside>' +
      '  </div>' +
      '  <footer class="briefing-nav">' +
      '    <button type="button" class="btn btn-secondary btn--sm" id="brief-back">← BACK</button>' +
      '    <div class="briefing-dots" id="briefing-dots" hidden></div>' +
      '    <div style="display:flex;align-items:center;gap:10px;margin-left:auto;flex-wrap:wrap">' +'<button type="button" class="btn btn-ghost btn--sm" id="brief-skip">SKIP</button>' +'<button type="button" class="btn btn-primary" id="brief-next">NEXT →</button>' +
      '    </div>' +
      '  </footer>' +
      '</section>';

    document.getElementById('brief-back').addEventListener('click', function () {
      if (orientation.index === 0) return;
      orientation.index -= 1;
      saveStep();
      renderBriefingStep();
    });
    document.getElementById('brief-next').addEventListener('click', function () {
      if (document.getElementById('brief-next').disabled) return;
      if (orientation.index >= orientation.data.steps.length - 1) {
        finishOrientation();
      } else {
        orientation.index += 1;
        saveStep();
        renderBriefingStep();
      }
    });
    document.getElementById('brief-skip').addEventListener('click', function () {
      window.StoryLabRouter.navigate('home');
    });
  }

  function renderBriefingStep() {
    if (orientation.disposing || !_orientationRoot) return;
    var data = orientation.data;
    var step = data.steps[orientation.index];
    if (!step) return;

    var index = document.getElementById('briefing-index');
    if (index) {
      index.innerHTML = data.steps.map(function (item, i) {
        var stateClass = i === orientation.index ? ' is-active' : (i < orientation.index ? ' is-done' : '');
        return (
          '<div class="briefing-index__item' + stateClass + '">' +
          '<span class="briefing-index__num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="briefing-index__label">' + UI.escape(item.nav || item.kicker || 'Panel ' + (i + 1)) + '</span>' +
          '</div>'
        );
      }).join('');
    }

    var segments = document.getElementById('briefing-segments');
    if (segments) {
      segments.innerHTML = data.steps.map(function (_, i) {
        return '<span class="' + (i < orientation.index ? 'is-on' : i === orientation.index ? 'is-next' : '') + '"></span>';
      }).join('');
    }
    var count = document.getElementById('briefing-count');
    if (count) count.textContent = 'PANEL ' + String(orientation.index + 1).padStart(2, '0') + ' / ' + String(data.steps.length).padStart(2, '0');

    var sheet = document.getElementById('briefing-sheet');
    if (!sheet) return;

    if (step.kind === 'check') {
      sheet.innerHTML = renderCheck(step);
      bindCheck(step);
    } else {
      sheet.innerHTML = renderBriefingPanel(step);
    }

    var aside = document.getElementById('briefing-aside');
    if (aside) {
      aside.innerHTML =
        '<div class="note-card">' +
        '  <span class="mono-label">HOW THIS WORKS</span>' +
        '  <p>Your place is saved after every panel. Replay this briefing from the learning record whenever you need it.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-secondary btn--sm" id="brief-listen">' + UI.icon('volume') + ' LISTEN</button>' +
        '<div class="voice-feed" id="voice-feed">' +
        '  <span class="led led--ok" id="voice-led"></span>' +
        '  <span id="voice-feed-label">VOICE FEED / READY</span>' +
        '  <div class="waveform" data-state="idle" id="brief-waveform" aria-hidden="true">' +
        '    <span class="waveform__bar"></span><span class="waveform__bar"></span>' +
        '    <span class="waveform__bar"></span><span class="waveform__bar"></span>' +
        '    <span class="waveform__bar"></span>' +
        '  </div>' +
        '</div>' +
        '<div class="word-count mono-label">' + (step.kind === 'check' ? 'CHECK / ' + (step.options ? step.options.length : 3) + ' OPTIONS' : 'STEP ' + (orientation.index + 1) + ' OF 5') + '</div>';

      var listen = document.getElementById('brief-listen');
      if (listen) listen.addEventListener('click', function () { speakStep(step); });
    }

    var back = document.getElementById('brief-back');
    if (back) {
      back.disabled = orientation.index === 0;
      back.style.visibility = orientation.index === 0 ? 'hidden' : 'visible';
    }

    var next = document.getElementById('brief-next');
    if (next) {
      if (orientation.index >= data.steps.length - 1) {
        next.textContent = 'COMPLETE SHIFT →';
        var current = orientation.answers[step.id];
        next.disabled = step.kind === 'check' && !(current && current.correct);
      } else {
        next.textContent = 'NEXT PANEL →';
        next.disabled = false;
      }
    }
  }

  function renderBriefingPanel(step) {
    return (
      '<div class="briefing-art" data-index="' + String(orientation.index + 1).padStart(2, '0') + '">' +
      diagram(step.art) +
      '</div>' +
      '<div class="briefing-body">' +
      '  <p class="eyebrow">' + UI.escape(step.kicker || 'BRIEFING') + '</p>' +
      '  <h2>' + UI.escape(step.title) + '</h2>' +
      '  <p class="briefing-lede">' + UI.escape(step.lede) + '</p>' +
      '  <p class="briefing-text">' + UI.escape(step.text) + '</p>' +
      '  <ul class="briefing-points">' +
      (step.points || []).map(function (point) {
        return '<li class="briefing-point"><span class="briefing-point__mark">+</span>' + UI.escape(point) + '</li>';
      }).join('') +
      '  </ul>' +
      '  <div class="briefing-note">' +
      '    <span class="mono-label">NOTE</span>' +
      '    <p>' + UI.escape(step.note || '') + '</p>' +
      '  </div>' +
      '</div>'
    );
  }

  function renderCheck(step) {
    return (
      '<div class="briefing-art" data-index="CHECK">' + diagram('check') + '</div>' +
      '<div class="check-block">' +
      '  <p class="eyebrow">' + UI.escape(step.kicker || 'CHECK') + '</p>' +
      '  <h2>' + UI.escape(step.title) + '</h2>' +
      '  <p class="briefing-lede">' + UI.escape(step.question) + '</p>' +
      '  <div class="check-options" role="group" aria-label="Answer options">' +
      (step.options || []).map(function (option, index) {
        return (
          '<button type="button" class="check-option" data-option="' + index + '">' +
          '<span class="check-option__key">' + String.fromCharCode(65 + index) + '</span>' +
          '<span class="check-option__text">' + UI.escape(option.label) + '</span>' +
          '</button>'
        );
      }).join('') +
      '  </div>' +
      '  <div class="check-feedback" id="check-feedback">Pick the answer that matches the terminal. You can try again if needed.</div>' +
      '</div>'
    );
  }

  function bindCheck(step) {
    var options = _orientationRoot.querySelectorAll('[data-option]');
    options.forEach(function (button) {
      button.addEventListener('click', function () {
        var index = Number(button.getAttribute('data-option'));
        var option = step.options[index];
        if (!option) return;

        var record = orientation.answers[step.id] || { attempts: 0, correct: false, first: true };
        var wasFirst = record.attempts === 0;
        record.attempts += 1;
        record.selected = index;

        if (option.correct) {
          record.correct = true;
          if (wasFirst) orientation.correctFirstTry += 1;
          options.forEach(function (item) {
            item.disabled = true;
            var i = Number(item.getAttribute('data-option'));
            item.classList.toggle('is-correct', i === index);
          });
          var feedback = document.getElementById('check-feedback');
          if (feedback) {
            feedback.className = 'check-feedback is-correct';
            feedback.textContent = '✓ ' + (option.feedback || 'Correct.');
          }
          var next = document.getElementById('brief-next');
          if (next) next.disabled = false;
        } else {
          button.classList.add('is-wrong');
          button.disabled = true;
          var wrongFeedback = document.getElementById('check-feedback');
          if (wrongFeedback) {
            wrongFeedback.className = 'check-feedback is-wrong';
            wrongFeedback.textContent = 'Not quite. ' + (option.feedback || 'Try another option.');
          }
        }

        if (!option.correct) record.first = false;
        orientation.answers[step.id] = record;
      });
    });
  }

  function speakStep(step) {
    var text = step.cue || step.lede || step.title;
    var feed = document.getElementById('voice-feed');
    var feedLabel = document.getElementById('voice-feed-label');
    var waveform = document.getElementById('brief-waveform');

    if (!window.Chatbot || typeof window.Chatbot.speak !== 'function') {
      UI.toast({
        title: 'Voice module not loaded',
        message: 'Read the panel for now. The voice bus starts with Module 02.',
        kind: 'info'
      });
      return;
    }

    if (_speaking) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      _speaking = false;
      if (waveform) waveform.setAttribute('data-state', 'idle');
      if (feed) feed.classList.remove('is-speaking');
      if (feedLabel) feedLabel.textContent = 'VOICE FEED / READY';
      return;
    }

    _speaking = true;
    if (feed) feed.classList.add('is-speaking');
    if (feedLabel) feedLabel.textContent = 'VOICE FEED / SPEAKING';
    if (waveform) waveform.setAttribute('data-state', 'speaking');

    var done = function () {
      _speaking = false;
      if (waveform) waveform.setAttribute('data-state', 'idle');
      if (feed) feed.classList.remove('is-speaking');
      if (feedLabel) feedLabel.textContent = 'VOICE FEED / READY';
    };

    try {
      var result = window.Chatbot.speak(text);
      if (result && typeof result.then === 'function') {
        result.then(done).catch(done);
      } else {
        window.setTimeout(done, 2400);
      }
    } catch (err) {
      console.warn('[Orientation] TTS failed:', err);
      done();
    }
  }

  function saveStep() {
    if (!State.getJourney().orientation.completed) {
      State.saveOrientationStep(orientation.index).catch(function () {});
    }
  }

  async function finishOrientation() {
    if (orientation.completed) return;
    orientation.completed = true;

    var total = 1;
    var score = total;
    var firstTry = Math.min(total, orientation.correctFirstTry);
    var durationMs = Math.max(0, Date.now() - orientation.startedAt);
    var profile = State.getProfile();

    try {
      await State.completeOrientation({
        score: score,
        total: total,
        durationMs: durationMs,
        correct: 1,
        firstTry: firstTry
      });
    } catch (err) {
      console.error('[Orientation] Completion could not be saved:', err);
      UI.toast({
        title: 'Completion not saved',
        message: 'The certificate is showing, but progress could not be saved.',
        kind: 'error'
      });
    }

    if (!State.getActiveSession()) {
      try { await State.startSession(); } catch (err) { /* session is optional */ }
    }

    renderCompletion(profile, score, total, durationMs);
    UI.toast({
      title: 'Getting started complete',
      message: 'Your learning record is updated. One sync record is queued.',
      kind: 'ok'
    });
  }

  function renderCompletion(profile, score, total, durationMs) {
    if (!_orientationRoot) return;
    var journey = State.getJourney();
    var date = UI.formatDate(new Date(), true);
    _orientationRoot.innerHTML =
      '<section class="screen certified">' +
      '  <div class="certificate panel panel--accent">' +
      '    <div class="certificate__stamp">COMMISSIONED</div>' +
      '    <div class="certificate__inner">' +
      '      <div class="certificate__seal">' + UI.brandMark() + '</div>' +
      '      <p class="eyebrow">GETTING STARTED / COMPLETE</p>' +
      '      <h1 class="certificate__title">You are ready,<br><span>' + UI.escape(profile.name) + '.</span></h1>' +
      '      <p class="lede">You are all set. Open a story, or check your progress.</p>' +
      '      <div class="certificate__stats">' +
      '        <div class="certificate-stat"><div class="certificate-stat__value">' + score + ' / ' + total + '</div><div class="certificate-stat__label">Knowledge check</div></div>' +
      '        <div class="certificate-stat"><div class="certificate-stat__value">' + UI.formatMinutes(durationMs) + '</div><div class="certificate-stat__label">Briefing time</div></div>' +
      '        <div class="certificate-stat"><div class="certificate-stat__value">01</div><div class="certificate-stat__label">Badge earned</div></div>' +
      '      </div>' +
      '      <div class="certificate__actions">' +
      '        <a class="btn btn-primary btn--lg" href="#/home">GO TO HOME ' + UI.icon('arrow-right') + '</a>' +'<button type="button" class="btn btn-secondary" id="replay-briefing">REPLAY INTRO</button>' +
      '      </div>' +
      '      <p class="certificate__foot">RECORD ' + UI.escape(profile.id) + ' / ' + UI.escape(profile.name.toUpperCase()) + ' / GR ' + UI.escape(profile.grade) + ' / ' + date + '<br>SAVED ON THIS DEVICE / ' + (journey.orientation.attempts || 1) + ' COMPLETION' + ((journey.orientation.attempts || 1) === 1 ? '' : 'S') + ' / NOT YET UPLOADED</p>' +
      '    </div>' +
      '  </div>' +
      '  <aside class="completion-side">' +
      '    <div class="panel">' +
      '      <div class="panel__header"><span class="panel__label">NEXT</span></div>' +
      '      <div class="panel__body">' +
      '        <div class="completion-list">' +
      '          <div class="completion-item"><b>01</b><span>Open a story to start.</span></div>' +
      '          <div class="completion-item"><b>02</b><span>Work until you finish a story, an experiment, or a conversation.</span></div>' +
      '          <div class="completion-item"><b>03</b><span>Close the session from RECORD before the next student takes the tablet.</span></div>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '    <div class="note-card">' +
      '      <span class="mono-label">SESSION</span>' +
      '      <p>An open session is running. It will be saved when you close it — even with no connection.</p>' +
      '    </div>' +
      '  </aside>' +
      '</section>';

    var replay = document.getElementById('replay-briefing');
    if (replay) {
      replay.addEventListener('click', function () {
        window.StoryLabRouter.navigate('orientation');
      });
    }
  }

  /* ------------------------------------------------------------
     Exports
     ------------------------------------------------------------ */
  function resetEnrolment() {
    enrolment.step = 0;
    enrolment.name = '';
    enrolment.avatar = 'sun';
    enrolment.grade = '5';
    enrolment.language = 'en';
    enrolment.mic = 'idle';
    enrolment.micHeard = false;
    enrolment.draftLoaded = false;
    clearDraft();
  }

  window.StoryLabOnboarding = {
    mount: mount,
    mountOrientation: mountOrientation,
    reset: resetEnrolment
  };

  console.log('[Onboarding] window.StoryLabOnboarding ready');
})();
