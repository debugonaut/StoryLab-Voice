# StoryLab Voice — Design System

**Style:** Industrial  
**Reference:** https://designprompts.dev/?style=industrial&width=wide&section=about  
**Tool:** `npx impeccable` — run once per session for live design context.

---

## Philosophy

The UI is a **piece of field equipment**, not a consumer app.  
Everything looks like it belongs in a factory instrument panel or a rugged diagnostic device.  
Students don't scroll a feed — they operate a machine that teaches them.

---

## Color Tokens

```css
/* styles/tokens.css */
:root {
  /* Panels — warm graphite, not flat black */
  --color-bg-base:       #0a0c0b;
  --color-bg-panel:      #141815;
  --color-bg-raised:     #1b201c;
  --color-bg-inset:      #080a09;

  /* Borders */
  --color-border:        #343b35;
  --color-border-heavy:  #4a534b;
  --color-border-light:  #222722;

  /* Accent — amber readout */
  --color-accent:        #f59e0b;
  --color-accent-bright: #ffc24b;
  --color-accent-dim:    #9a6509;
  --color-accent-glow:   rgba(245, 158, 11, 0.16);

  /* Ink */
  --color-text-primary:   #ece9dd;
  --color-text-secondary: #b4b6a9;
  --color-text-muted:     #94988c;
  --color-text-faint:     #7c8075;
  --color-text-accent:    #f5b544;

  /* Status */
  --color-ok:            #75d99a;
  --color-warn:          #f5a524;
  --color-error:         #ff7264;
  --color-info:          #8db4ff;

  /* Offline banner */
  --color-offline-bg:    #33250e;
  --color-offline-text:  #ffdf9e;
}
```

Contrast note: muted `#94988c` and faint `#7c8075` are the floor for labels on
the base and panel surfaces. Do not add a third grey below `#7c8075` for content.

---

## Typography

**Rule: Google Sans only.** Every heading, body line, button, label, and
readout uses the Google Sans family. Google Sans Code is the only variant used
for instrument labels, serials, and numeric readouts. No third type family, no
Google Fonts network request — the faces are bundled for offline use.

```css
:root {
  --font-heading: 'Google Sans Flex', 'Google Sans', system-ui, sans-serif;
  --font-body:    'Google Sans Flex', 'Google Sans', system-ui, sans-serif;
  --font-mono:    'Google Sans Code', 'Google Sans', 'Courier New', monospace;

  --font-heading-weight: 600;
  --font-heading-tracking: -0.02em;

  /* Scale */
  --text-2xs:  0.625rem;  /* micro stamps */
  --text-xs:   0.6875rem; /* etched labels */
  --text-sm:   0.8125rem; /* secondary */
  --text-base: 0.9375rem; /* body */
  --text-md:   1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.375rem;
  --text-2xl:  1.75rem;
  --text-3xl:  2.25rem;
  --text-4xl:  3rem;
  --text-hero: clamp(2.75rem, 7vw, 4.75rem);
}
```

Self-hosted files live in `assets/fonts/`:

- `google-sans-flex-300-800-latin.woff2` + `-latin-ext.woff2`
- `google-sans-code-400-600-latin.woff2` + `-latin-ext.woff2`

All four are declared in `tokens.css` and precached by the service worker, so
typography does not fall back when the terminal is offline. Devanagari language
samples use the device's Devanagari face because Google Sans Flex does not ship
that script; every Latin-script surface is Google Sans.

---

## Spacing & Layout

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  --radius: 0px;           /* NO rounded corners — hard industrial edges */
  --border-width: 1px;
  --border-width-heavy: 2px;
}
```

---

## Signature Motifs (CSS only — no images)

### Screw / Rivet Corner Detail
```css
.panel {
  position: relative;
  border: var(--border-width-heavy) solid var(--color-border-heavy);
  background: var(--color-bg-panel);
}
.panel::before,
.panel::after {
  content: '◈';
  position: absolute;
  color: var(--color-border-heavy);
  font-size: 10px;
  line-height: 1;
}
.panel::before { top: 4px;  left: 4px;  }
.panel::after  { top: 4px;  right: 4px; }
```

### Ventilation Slot Separator
```css
.vent-divider {
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-border) 0px,
    var(--color-border) 6px,
    transparent 6px,
    transparent 10px
  );
  margin: var(--space-4) 0;
}
```

### Amber Glow on Active Element
```css
.active-readout {
  box-shadow: 0 0 0 1px var(--color-accent), 
              0 0 12px var(--color-accent-glow);
}
```

### Waveform / Instrument Bar (chatbot state)
```css
.waveform-bar {
  display: flex;
  gap: 3px;
  align-items: center;
  height: 32px;
}
.waveform-bar span {
  display: block;
  width: 4px;
  background: var(--color-accent);
  animation: pulse 0.8s ease-in-out infinite alternate;
}
.waveform-bar span:nth-child(2) { animation-delay: 0.15s; }
.waveform-bar span:nth-child(3) { animation-delay: 0.30s; }
.waveform-bar span:nth-child(4) { animation-delay: 0.45s; }
.waveform-bar span:nth-child(5) { animation-delay: 0.60s; }

@keyframes pulse {
  from { height: 6px;  }
  to   { height: 28px; }
}
```

---

## Component Patterns

### Button — Primary
```html
<button class="btn-primary">START LESSON</button>
```
```css
.btn-primary {
  font-family: var(--font-heading);
  font-weight: var(--font-heading-weight);
  letter-spacing: var(--font-heading-tracking);
  text-transform: uppercase;
  font-size: var(--text-base);
  color: var(--color-bg-base);
  background: var(--color-accent);
  border: none;
  padding: var(--space-3) var(--space-6);
  cursor: pointer;
  transition: background 0.1s;
}
.btn-primary:hover  { background: #d97706; }
.btn-primary:active { background: var(--color-accent-dim); }
```

### Module Card (navigation tile)
```html
<div class="module-card">
  <div class="module-card__label">MODULE 01</div>
  <div class="module-card__title">STORY LEARN</div>
  <div class="vent-divider"></div>
  <div class="module-card__desc">Voice-guided multi-subject stories</div>
</div>
```

### Status Badge
```html
<span class="badge badge--ok">ONLINE</span>
<span class="badge badge--warn">SYNCING</span>
<span class="badge badge--error">OFFLINE</span>
```

---

## Impeccable

This project uses **Impeccable** for design system enforcement.

```bash
npx impeccable install   # one-time install
npx impeccable context   # run at session start — loads PRODUCT.md + DESIGN.md
```

Surface mode for all screens: **Experience** (dashboard/home) + **Operate** (lesson/lab screens).

