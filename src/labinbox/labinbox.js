/**
 * StoryLab Voice — LabInBox Module
 * Owner: Anurag Kumbhar (Part 3)
 *
 * Exports: window.LabInBox
 *   .mount(root) → void
 *
 * TODO (Anurag): Replace stub with full lab runner from PART_3_LABINBOX.md
 */
;(function () {
  'use strict';

  function mount(root) {
    fetch('/data/labs/index.json')
      .then(function (r) { return r.json(); })
      .then(function (labs) { renderList(root, labs); })
      .catch(function () {
        root.innerHTML = [
          '<div class="panel" style="margin-top:var(--sp-6);padding:var(--sp-6)">',
          '  <p class="text-secondary">Could not load labs. Make sure data/labs/index.json exists.</p>',
          '  <button class="btn btn-secondary" style="margin-top:var(--sp-4)" onclick="StoryLabRouter.navigate(\'home\')">← BACK</button>',
          '</div>'
        ].join('\n');
      });
  }

  function renderList(root, labs) {
    var items = labs.map(function (l) {
      return [
        '<div class="module-card" style="cursor:pointer" tabindex="0"',
        '  onclick="window._LB_run(\'' + l.id + '\')"',
        '  role="button" aria-label="Start lab: ' + l.title + '">',
        '  <span class="module-card__num">' + l.subject.toUpperCase() + ' / GR ' + l.grade + '</span>',
        '  <h3 class="module-card__title" style="font-size:var(--text-xl)">' + l.title + '</h3>',
        '  <div class="vent"></div>',
        '  <div class="module-card__cta"><button class="btn btn-primary" tabindex="-1">START →</button></div>',
        '</div>'
      ].join('');
    }).join('\n');

    root.innerHTML = [
      '<div class="panel" style="margin-top:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <span class="panel__label">LAB IN BOX / MODULE 03 / SELECT EXPERIMENT</span>',
      '  </div>',
      '</div>',
      '<div class="module-grid" style="margin-top:var(--sp-6)">' + items + '</div>',
      '<div style="margin-top:var(--sp-4)">',
      '  <button class="btn btn-secondary" onclick="StoryLabRouter.navigate(\'home\')">← BACK HOME</button>',
      '</div>',
      '<p class="text-mono text-muted" style="font-size:var(--text-xs);margin-top:var(--sp-4);letter-spacing:0.1em">',
      '  STUB: Full canvas lab in PART_3_LABINBOX.md — Anurag to implement.',
      '</p>'
    ].join('\n');

    window._LB_run = function (id) {
      fetch('/data/labs/' + id + '.json')
        .then(function (r) { return r.json(); })
        .then(function (lab) {
          window.Chatbot.speak(lab.steps[0].instruction);
          alert('Lab started: ' + lab.title + '\n\nAnurag will implement the full canvas lab.');
        });
    };
  }

  window.LabInBox = { mount: mount };
  console.log('[LabInBox] window.LabInBox stub ready');
})();

