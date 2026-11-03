const { chromium } = require('playwright-core');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:8137/';
const OUT = path.join(__dirname, '..', 'screenshots');

async function completeFlow(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#enrol-name', { timeout: 15000 });
  await page.fill('#enrol-name', 'Rani Kulkarni');
  await page.click('[data-avatar="fox"]');
  await page.click('[data-grade="4"]');
  await page.click('#enrol-next');
  await page.waitForTimeout(350);
  await page.click('[data-lang="en"]');
  await page.click('#enrol-next');
  await page.waitForTimeout(350);
  await page.click('#mic-skip');
  await page.click('#enrol-next');
  await page.waitForSelector('.briefing-sheet', { timeout: 12000 });
  await page.waitForTimeout(500);
  for (let i = 0; i < 4; i += 1) {
    await page.click('#brief-next');
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(300);
  await page.click('[data-option="0"]');
  await page.waitForTimeout(350);
  await page.click('#brief-next');
  await page.waitForSelector('.certificate', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--hide-scrollbars', '--force-color-profile=srgb']
  });
  const errors = [];

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'en-IN'
  });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#enrol-name', { timeout: 15000 });
  await page.fill('#enrol-name', 'Rani Kulkarni');
  await page.click('[data-avatar="fox"]');
  await page.click('[data-grade="4"]');
  await page.click('#enrol-next');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '31-language-desktop.png') });
  await page.click('[data-lang="en"]');
  await page.click('#enrol-next');
  await page.waitForTimeout(300);
  await page.click('#mic-skip');
  await page.click('#enrol-next');
  await page.waitForSelector('.briefing-sheet', { timeout: 12000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '32-briefing-desktop.png') });

  // Finish with a fresh context profile for record/deck visuals.
  await context.close();
  const desk = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'en-IN'
  });
  const deskPage = await desk.newPage();
  deskPage.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  deskPage.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  await completeFlow(deskPage);
  await deskPage.screenshot({ path: path.join(OUT, '33-certificate.png') });
  await deskPage.click('.certificate a[href="#/home"]');
  await deskPage.waitForSelector('.deck', { timeout: 10000 });
  await deskPage.waitForTimeout(900);
  await deskPage.screenshot({ path: path.join(OUT, '33b-deck-desktop.png') });

  await deskPage.goto(BASE + '#/storylearn', { waitUntil: 'domcontentloaded' });
  await deskPage.waitForTimeout(800);
  await deskPage.screenshot({ path: path.join(OUT, '34-module-crumb.png') });

  await deskPage.setViewportSize({ width: 1024, height: 768 });
  await deskPage.goto(BASE + '#/home', { waitUntil: 'domcontentloaded' });
  await deskPage.waitForSelector('.deck', { timeout: 10000 });
  await deskPage.waitForTimeout(700);
  await deskPage.screenshot({ path: path.join(OUT, '35-deck-tablet.png') });

  await deskPage.setViewportSize({ width: 390, height: 844 });
  await deskPage.goto(BASE + '#/home', { waitUntil: 'domcontentloaded' });
  await deskPage.waitForSelector('.deck', { timeout: 10000 });
  await deskPage.waitForTimeout(700);
  await deskPage.screenshot({ path: path.join(OUT, '36-mobile-deck-top.png') });
  await deskPage.evaluate(() => document.querySelector('.directive')?.scrollIntoView({ block: 'center' }));
  await deskPage.waitForTimeout(300);
  await deskPage.screenshot({ path: path.join(OUT, '37-mobile-directive.png') });

  await deskPage.click('.app-nav__link[data-nav="record"]');
  await deskPage.waitForSelector('.record', { timeout: 10000 });
  await deskPage.waitForTimeout(700);
  await deskPage.screenshot({ path: path.join(OUT, '38-mobile-record-top.png') });
  await deskPage.evaluate(() => document.querySelector('#sync-now')?.scrollIntoView({ block: 'center' }));
  await deskPage.waitForTimeout(1000);
  await deskPage.screenshot({ path: path.join(OUT, '39-mobile-sync.png') });

  await deskPage.click('#sync-now');
  await deskPage.waitForTimeout(1400);
  await deskPage.screenshot({ path: path.join(OUT, '39b-mobile-sync-cleared.png') });

  await deskPage.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
  await deskPage.click('#end-session');
  await deskPage.waitForSelector('[data-modal-confirm]', { timeout: 5000 });
  await deskPage.click('[data-modal-confirm]');
  await deskPage.waitForTimeout(1400);
  await deskPage.screenshot({ path: path.join(OUT, '39c-mobile-session-closed.png') });

  // Mobile language cards.
  const mob = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'en-IN'
  });
  const mobPage = await mob.newPage();
  mobPage.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  mobPage.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  await mobPage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mobPage.waitForSelector('#enrol-name', { timeout: 15000 });
  await mobPage.fill('#enrol-name', 'Aarav');
  await mobPage.click('#enrol-next');
  await mobPage.waitForTimeout(350);
  await mobPage.evaluate(() => document.querySelector('.lang-card')?.scrollIntoView({ block: 'center' }));
  await mobPage.waitForTimeout(300);
  await mobPage.screenshot({ path: path.join(OUT, '40-mobile-language-cards.png') });

  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
})();
