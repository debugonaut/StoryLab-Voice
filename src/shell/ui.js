/**
 * StoryLab Voice — shell UI primitives
 * Owner: Aadesh Khande (Part 0 / Foundation)
 *
 * Exports: window.StoryLabUI
 *   icon(name), brandMark(), avatar(id), avatars
 *   toast({title, message, kind, action})
 *   confirm({title, message, confirmLabel, danger}) -> Promise<boolean>
 *   escape(), formatClock(), formatDuration(), formatDate(), relativeTime()
 *   greeting(), formatBytes()
 *
 * Foundation-only. No learning-module logic lives here.
 */
;(function () {
  'use strict';

  var ICONS = {
    'arrow-right': '<path d="M4 12h15M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M20 12H5M11 18l-6-6 6-6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    'check-plain': '<path d="m5 12 4 4L19 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    home: '<path d="M4 11 12 4l8 7v8h-5v-5H9v5H4v-8Z"/>',
    deck: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    record: '<path d="M6 3h9l3 3v15H6V3Z"/><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4"/>',
    guide: '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
    waveform: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h1"/>',
    book: '<path d="M4 5c3-1 5-1 8 1v14c-3-2-5-2-8-1V5Z"/><path d="M20 5c-3-1-5-1-8 1v14c3-2 5-2 8-1V5Z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-8V3"/><path d="M7 15h10"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    printer: '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3"/><path d="M7 14h10v7H7z"/>',
    sync: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.2 8A7 7 0 0 1 20 12M4 12a7 7 0 0 0 13.8 4"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    volume: '<path d="M4 10v4h3l4 4V6L7 10H4Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    'wifi-off': '<path d="M2 2l20 20M9 18h.01M5 13a10 10 0 0 1 3-2M19 13a10 10 0 0 0-4-2.5M8 8a14 14 0 0 1 10 1M2 9a16 16 0 0 1 4-2"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    power: '<path d="M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    flag: '<path d="M5 3v18M5 4h13l-2.5 4L18 12H5"/>',
    compass: '<circle cx="12" cy="12" r="8"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
    'external': '<path d="M14 4h6v6M20 4 10 14"/><path d="M18 14v6H4V6h6"/>',
    'signal': '<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>'
  };

  function icon(name, className) {
    var inner = ICONS[name] || ICONS.info;
    return (
      '<svg class="icon ' + (className || '') + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="square" ' +
      'stroke-linejoin="miter" aria-hidden="true" focusable="false">' + inner + '</svg>'
    );
  }

  function brandMark() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="square" aria-hidden="true" focusable="false">' +
      '<path d="M3 14v-4M7 17V7M11 20V4M15 16V8M19 13v-2M22 12h-1"/>' +
      '</svg>'
    );
  }

  var AVATARS = [
    { id: 'sun', label: 'Sun' },
    { id: 'leaf', label: 'Leaf' },
    { id: 'rocket', label: 'Rocket' },
    { id: 'fox', label: 'Fox' },
    { id: 'star', label: 'Star' },
    { id: 'fish', label: 'Fish' },
    { id: 'bolt', label: 'Bolt' },
    { id: 'moon', label: 'Moon' }
  ];

  var AVATAR_PATHS = {
    sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
    leaf: '<path d="M20 4C10 4 4.5 9 4.5 15.5c0 2.2 1.3 4 3.5 4C14.5 19.5 20 14 20 4Z"/><path d="M4.5 21C6.5 14.5 10.5 10.5 16.5 8"/>',
    rocket: '<path d="M12 2.5c3.7 2.6 5 7 5 10.7L12 17l-5-3.8c0-3.7 1.3-8.1 5-10.7Z"/><circle cx="12" cy="9" r="1.6"/><path d="M7 14 4.5 19l4.2-1M17 14l2.5 5-4.2-1M10 21.5h4"/>',
    fox: '<path d="M3.5 9 7 4.5l3.2 3h3.6L17 4.5 20.5 9v4.5c0 4-3.4 6.5-8.5 6.5s-8.5-2.5-8.5-6.5V9Z"/><path d="M8.5 12.5h.01M15.5 12.5h.01"/><path d="M9.5 16.5c1.4 1.1 3.6 1.1 5 0"/>',
    star: '<path d="m12 2.5 2.8 6 6.2.8-4.6 4.4 1.2 6.3L12 16.9 6.4 20l1.2-6.3L3 9.3l6.2-.8 2.8-6Z"/>',
    fish: '<path d="M2.5 12S6 5.5 12 5.5c4.3 0 7 3 9.5 6.5-2.5 3.5-5.2 6.5-9.5 6.5-6 0-9.5-6.5-9.5-6.5Z"/><circle cx="16.5" cy="10.8" r=".9"/><path d="M2.5 12 1 7.5M2.5 12 1 16.5"/>',
    bolt: '<path d="M13.5 2 5 14h5.5L10 22l8.5-12H13l.5-8Z"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.8 6.8 0 0 0 11 11Z"/><path d="M16 4.5h.01M19 7.5h.01"/>'
  };

  function avatar(id) {
    var key = AVATAR_PATHS[id] ? id : 'sun';
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">' +
      AVATAR_PATHS[key] + '</svg>'
    );
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toast(options) {
    var opts = options || {};
    var root = document.getElementById('toast-root');
    if (!root) return;

    var kind = opts.kind || 'info';
    var node = document.createElement('div');
    node.className = 'toast toast--' + kind;
    node.setAttribute('role', 'status');
    node.innerHTML =
      '<span class="toast__icon">' + icon(kind === 'ok' ? 'check' : kind === 'error' ? 'x' : 'info') + '</span>' +
      '<div class="toast__body">' +
      (opts.title ? '<div class="toast__title">' + escapeHtml(opts.title) + '</div>' : '') +
      (opts.message ? '<div class="toast__msg">' + escapeHtml(opts.message) + '</div>' : '') +
      '</div>' +
      (opts.actionLabel ? '<button type="button" class="toast__action">' + escapeHtml(opts.actionLabel) + '</button>' : '');

    var dismiss = function () {
      if (node.classList.contains('is-leaving')) return;
      node.classList.add('is-leaving');
      window.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 240);
    };

    var action = node.querySelector('.toast__action');
    if (action && typeof opts.onAction === 'function') {
      action.addEventListener('click', function () {
        dismiss();
        opts.onAction();
      });
    }

    root.appendChild(node);
    var timeout = typeof opts.timeout === 'number' ? opts.timeout : 3800;
    if (timeout > 0) window.setTimeout(dismiss, timeout);
  }

  function confirmDialog(options) {
    var opts = options || {};
    return new Promise(function (resolve) {
      var root = document.getElementById('modal-root');
      if (!root) return resolve(window.confirm(opts.message || 'Are you sure?'));

      var previouslyFocused = document.activeElement;
      var title = escapeHtml(opts.title || 'Confirm action');
      var message = escapeHtml(opts.message || '');
      var confirmLabel = escapeHtml(opts.confirmLabel || 'Confirm');
      var cancelLabel = escapeHtml(opts.cancelLabel || 'Cancel');
      var danger = !!opts.danger;

      root.innerHTML =
        '<div class="modal-backdrop" role="presentation">' +
        '  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '    <div class="modal__head">' +
        '      <span class="led ' + (danger ? 'led--error' : 'led--warn') + '"></span>' +
        '      <h2 class="modal__title" id="modal-title">' + title + '</h2>' +
        '    </div>' +
        '    <div class="modal__body">' + message + '</div>' +
        '    <div class="modal__foot">' +
        '      <button type="button" class="btn btn-secondary" data-modal-cancel>' + cancelLabel + '</button>' +
        '      <button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-modal-confirm>' + confirmLabel + '</button>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      document.body.classList.add('no-scroll');
      var backdrop = root.querySelector('.modal-backdrop');
      var confirmBtn = root.querySelector('[data-modal-confirm]');
      var cancelBtn = root.querySelector('[data-modal-cancel]');

      function close(result) {
        document.removeEventListener('keydown', onKeydown);
        document.body.classList.remove('no-scroll');
        root.innerHTML = '';
        if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        resolve(result);
      }

      function onKeydown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          close(false);
        }
        if (event.key === 'Tab') {
          var focusables = [cancelBtn, confirmBtn];
          var index = focusables.indexOf(document.activeElement);
          event.preventDefault();
          if (event.shiftKey) {
            focusables[(index <= 0 ? focusables.length : index) - 1].focus();
          } else {
            focusables[(index + 1) % focusables.length].focus();
          }
        }
      }

      confirmBtn.addEventListener('click', function () { close(true); });
      cancelBtn.addEventListener('click', function () { close(false); });
      backdrop.addEventListener('click', function (event) {
        if (event.target === backdrop) close(false);
      });
      document.addEventListener('keydown', onKeydown);
      cancelBtn.focus();
    });
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatClock(date) {
    var d = date || new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDuration(ms) {
    var total = Math.max(0, Math.floor((ms || 0) / 1000));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    if (hours > 0) return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    return pad(minutes) + ':' + pad(seconds);
  }

  function formatMinutes(ms) {
    var minutes = Math.round((ms || 0) / 60000);
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return minutes + ' min';
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    return hours + 'h' + (rest ? ' ' + rest + 'm' : '');
  }

  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function formatDate(value, withDay) {
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    var base = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    return withDay ? DAYS[d.getDay()] + ' / ' + base : base;
  }

  function formatDateTime(value) {
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return formatDate(d, false) + ' · ' + formatClock(d);
  }

  function relativeTime(value) {
    var ts = value instanceof Date ? value.getTime() : Number(value);
    if (!ts) return '—';
    var diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hr ago';
    if (diff < 172800000) return 'yesterday';
    return formatDate(ts, false);
  }

  function greeting(date) {
    var hour = (date || new Date()).getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function formatBytes(bytes) {
    var value = Number(bytes) || 0;
    if (value < 1024) return value + ' B';
    if (value < 1048576) return (value / 1024).toFixed(1) + ' KB';
    return (value / 1048576).toFixed(1) + ' MB';
  }

  window.StoryLabUI = {
    icon: icon,
    brandMark: brandMark,
    avatar: avatar,
    avatars: AVATARS,
    escape: escapeHtml,
    toast: toast,
    confirm: confirmDialog,
    formatClock: formatClock,
    formatDuration: formatDuration,
    formatMinutes: formatMinutes,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    relativeTime: relativeTime,
    greeting: greeting,
    formatBytes: formatBytes,
    pad: pad
  };

  console.log('[UI] window.StoryLabUI ready');
})();
