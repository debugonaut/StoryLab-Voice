const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:8137/';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--hide-scrollbars', '--force-color-profile=srgb']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    locale: 'en-IN'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#enrol-name', { timeout: 15000 });
  await page.fill('#enrol-name', 'Meera Patil');
  await page.click('[data-avatar="star"]');
  await page.click('[data-grade="5"]');
  await page.click('#enrol-next');
  await page.waitForTimeout(300);
  await page.click('[data-lang="mr"]');
  await page.click('#enrol-next');
  await page.waitForTimeout(300);
  await page.click('#mic-skip');
  await page.click('#enrol-next');
  await page.waitForSelector('.briefing-sheet', { timeout: 12000 });
  await page.waitForTimeout(400);
  for (let i = 0; i < 4; i += 1) {
    await page.click('#brief-next');
    await page.waitForTimeout(150);
  }
  await page.click('[data-option="0"]');
  await page.waitForTimeout(300);
  await page.click('#brief-next');
  await page.waitForSelector('.certificate', { timeout: 10000 });
  await page.waitForTimeout(500);

  const cert = await page.evaluate(() => ({
    title: document.querySelector('.certificate h1')?.textContent.trim(),
    score: document.querySelector('.certificate__stats')?.textContent.replace(/\s+/g, ' ').trim(),
    meta: document.querySelector('.certificate__meta')?.textContent.replace(/\s+/g, ' ').trim()
  }));

  await page.click('.certificate a[href="#/home"]');
  await page.waitForSelector('.deck', { timeout: 10000 });
  await page.waitForTimeout(700);
  const deck = await page.evaluate(() => ({
    name: document.querySelector('.deck-title')?.textContent.trim(),
    clock: document.getElementById('station-clock')?.textContent.trim(),
    directive: document.querySelector('.directive h2')?.textContent.trim()
  }));

  await page.click('.app-nav__link[data-nav="record"]');
  await page.waitForSelector('.record', { timeout: 10000 });
  await page.waitForTimeout(600);

  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.click('#export-record');
  const download = await downloadPromise;
  const target = path.join('/tmp', 'storylab-verify-record.json');
  await download.saveAs(target);
  const exported = JSON.parse(fs.readFileSync(target, 'utf8'));

  // Offline shell: return to the deck, wait for the worker to control the page,
  // then cut the network and reload the navigation from cache.
  await page.goto(BASE + '#/home', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.deck', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        setTimeout(resolve, 3000);
      });
    }
  });
  await page.waitForTimeout(800);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.deck', { timeout: 12000 });
  await page.waitForTimeout(900);
  const offline = await page.evaluate(() => ({
    bannerHidden: document.getElementById('offline-banner')?.hidden,
    network: document.getElementById('station-net')?.textContent.trim(),
    profile: document.querySelector('.deck-title')?.textContent.trim()
  }));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', '42-offline-verified.png') });
  await context.setOffline(false);

  console.log(JSON.stringify({
    cert,
    deck,
    export: {
      profile: exported.profile && exported.profile.name,
      language: exported.profile && exported.profile.language,
      badge: exported.journey && exported.journey.badges.map((b) => b.id),
      sessions: exported.sessions && exported.sessions.length,
      events: exported.events && exported.events.length,
      pending: exported.sync && exported.sync.pending
    },
    offline,
    errors
  }, null, 2));

  await browser.close();
})();
