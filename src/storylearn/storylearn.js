/**
 * StoryLab Voice — StoryLearn Module
 * Owner: Pritam Tatkari (Part 1)
 *
 * Exports: window.StoryLearn
 *   .mount(root) → void
 *
 * TODO (Pritam): Replace stub with full story player from PART_1_STORYLEARN.md
 */
;(function () {
  'use strict';

  function mount(root) {
    fetch('/data/stories/index.json')
      .then(function (r) { return r.json(); })
      .then(function (stories) { renderList(root, stories); })
      .catch(function (err) {
        renderError(root, 'Could not load stories. Make sure data/stories/index.json exists.');
      });
  }

  function renderList(root, stories) {
    var items = stories.map(function (s) {
      return [
        '<div class="module-card" style="cursor:pointer" tabindex="0"',
        '  onclick="window._SL_play(\'' + s.id + '\')"',
        '  role="button" aria-label="Start story: ' + s.title + '">',
        '  <span class="module-card__num">' + s.subject.toUpperCase() + ' / GR ' + s.grade + '</span>',
        '  <h3 class="module-card__title" style="font-size:var(--text-xl)">' + s.title + '</h3>',
        '  <div class="vent"></div>',
        '  <div class="module-card__cta">',
        '    <button class="btn btn-primary" tabindex="-1">START →</button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('\n');

    root.innerHTML = [
      '<div class="panel" style="margin-top:var(--sp-6)">',
      '  <div class="panel__header">',
      '    <span class="panel__label">STORY LEARN / MODULE 01 / SELECT STORY</span>',
      '  </div>',
      '</div>',
      '<div class="module-grid" style="margin-top:var(--sp-6)">' + items + '</div>',
      '<div style="margin-top:var(--sp-4)">',
      '  <button class="btn btn-secondary" onclick="StoryLabRouter.navigate(\'home\')">← BACK HOME</button>',
      '</div>',
      '<p class="text-mono text-muted" style="font-size:var(--text-xs);margin-top:var(--sp-4);letter-spacing:0.1em">',
      '  STUB: Full player in PART_1_STORYLEARN.md — Pritam to implement.',
      '</p>'
    ].join('\n');

    // Temp stub player
    window._SL_play = function (id) {
      fetch('/data/stories/' + id + '.json')
        .then(function (r) { return r.json(); })
        .then(function (story) {
          window.Chatbot.speak(story.steps[0].text);
          alert('Story started: ' + story.title + '\n\nPritam will implement the full player.');
        });
    };
  }

  function renderError(root, msg) {
    root.innerHTML = [
      '<div class="panel" style="margin-top:var(--sp-6);padding:var(--sp-6)">',
      '  <p class="text-secondary">' + msg + '</p>',
      '  <div style="margin-top:var(--sp-4)">',
      '    <button class="btn btn-secondary" onclick="StoryLabRouter.navigate(\'home\')">← BACK</button>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  window.StoryLearn = { mount: mount };
  console.log('[StoryLearn] window.StoryLearn stub ready');
})();

