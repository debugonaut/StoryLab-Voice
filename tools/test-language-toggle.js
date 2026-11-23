const { chromium } = require('playwright-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:8123/';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--hide-scrollbars', '--force-color-profile=srgb']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-IN'
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

  console.log('1. Loading application at', BASE);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check if onboarding is visible; if so, complete it to reach deck
  const isEnrol = await page.$('#enrol-name');
  if (isEnrol) {
    console.log('2. Completing first-run student setup...');
    await page.fill('#enrol-name', 'Ananya');
    await page.click('[data-avatar="sun"]');
    await page.click('[data-grade="5"]');
    await page.click('#enrol-next');
    await page.waitForTimeout(300);
    await page.click('#enrol-next');
    await page.waitForTimeout(300);
    await page.click('#mic-skip');
    await page.click('#enrol-next');
    await page.waitForTimeout(600);
    await page.goto(BASE + '#/home');
    await page.waitForTimeout(800);
  }

  // 1. Initial State: English
  console.log('3. Checking Initial English State:');
  const enNavHome = await page.textContent('[data-nav="home"]');
  const enNavProgress = await page.textContent('[data-nav="record"]');
  const enLang = await page.evaluate(() => document.documentElement.lang);
  console.log(`   Nav: "${enNavHome}" | "${enNavProgress}" | Lang: "${enLang}"`);
  if (enNavHome.trim() !== 'HOME') throw new Error('Expected English HOME, got ' + enNavHome);

  // 2. Toggle to Hindi
  console.log('4. Clicking Hindi [हिं] button in header...');
  await page.click('[data-lang-choice="hi"]');
  await page.waitForTimeout(600);

  const hiLang = await page.evaluate(() => document.documentElement.lang);
  const hiNavHome = await page.textContent('[data-nav="home"]');
  const hiNavProgress = await page.textContent('[data-nav="record"]');
  const hiDeckTitle = await page.textContent('.deck-title');
  const hiLearnTitle = await page.textContent('.section-title');
  console.log(`   Hindi Lang: "${hiLang}" | Nav: "${hiNavHome}" / "${hiNavProgress}"`);
  console.log(`   Deck Greeting/Title: "${hiDeckTitle.replace(/\s+/g, ' ').trim()}"`);
  console.log(`   Section Title: "${hiLearnTitle}"`);

  if (hiNavHome.trim() !== 'होम') throw new Error('Expected Hindi "होम", got ' + hiNavHome);
  if (hiNavProgress.trim() !== 'प्रगति') throw new Error('Expected Hindi "प्रगति", got ' + hiNavProgress);

  // 3. Check StoryLearn in Hindi
  console.log('5. Navigating to Stories in Hindi...');
  await page.click('[data-nav="home"]');
  await page.waitForTimeout(300);
  await page.click('a[href="#/storylearn"]');
  await page.waitForTimeout(600);

  const hiStoryHero = await page.textContent('.story-hero__title');
  const hiFirstStoryTitle = await page.textContent('.story-card__title');
  console.log(`   Story Hero: "${hiStoryHero}" | First Story: "${hiFirstStoryTitle}"`);
  if (hiStoryHero.trim() !== 'कहानियाँ चुनें') throw new Error('Expected Hindi "कहानियाँ चुनें", got ' + hiStoryHero);

  // 4. Toggle to Marathi
  console.log('6. Clicking Marathi [मरा] button in header...');
  await page.click('[data-lang-choice="mr"]');
  await page.waitForTimeout(600);

  const mrLang = await page.evaluate(() => document.documentElement.lang);
  const mrNavHome = await page.textContent('[data-nav="home"]');
  const mrNavProgress = await page.textContent('[data-nav="record"]');
  const mrStoryHero = await page.textContent('.story-hero__title');
  const mrFirstStoryTitle = await page.textContent('.story-card__title');
  console.log(`   Marathi Lang: "${mrLang}" | Nav: "${mrNavHome}" / "${mrNavProgress}"`);
  console.log(`   Story Hero: "${mrStoryHero}" | First Story: "${mrFirstStoryTitle}"`);

  if (mrNavHome.trim() !== 'मुख्य') throw new Error('Expected Marathi "मुख्य", got ' + mrNavHome);
  if (mrNavProgress.trim() !== 'प्रगती') throw new Error('Expected Marathi "प्रगती", got ' + mrNavProgress);
  if (mrStoryHero.trim() !== 'गोष्टी निवडा') throw new Error('Expected Marathi "गोष्टी निवडा", got ' + mrStoryHero);

  // 5. Check Virtual Lab in Marathi
  console.log('7. Navigating to Virtual Lab in Marathi...');
  await page.goto(BASE + '#/labinbox');
  await page.waitForTimeout(600);

  const mrLabHeader = await page.textContent('.panel__label');
  const mrLabCardTitle = await page.textContent('.lb-card h3');
  console.log(`   Lab Header: "${mrLabHeader}" | First Lab: "${mrLabCardTitle}"`);
  if (!mrLabHeader.includes('व्हर्च्युअल लॅब')) throw new Error('Expected Marathi "व्हर्च्युअल लॅब", got ' + mrLabHeader);

  // 6. Check Record page in Marathi
  console.log('8. Navigating to Progress Record in Marathi...');
  await page.goto(BASE + '#/record');
  await page.waitForTimeout(600);

  const mrRecordTitle = await page.textContent('.screen-head__title');
  const mrSelectedLang = await page.$eval('#language-select', el => el.value);
  console.log(`   Record Title: "${mrRecordTitle}" | Selected Option in Dropdown: "${mrSelectedLang}"`);
  if (mrRecordTitle.trim() !== 'माझी प्रगती') throw new Error('Expected Marathi "माझी प्रगती", got ' + mrRecordTitle);
  if (mrSelectedLang !== 'mr') throw new Error('Expected dropdown to select "mr", got ' + mrSelectedLang);

  // 7. Toggle back to English from the Dropdown on Record page
  console.log('9. Toggling back to English from the Record dropdown...');
  await page.selectOption('#language-select', 'en');
  await page.waitForTimeout(600);

  const enRecordTitle = await page.textContent('.screen-head__title');
  const enNavAfter = await page.textContent('[data-nav="home"]');
  console.log(`   Record Title: "${enRecordTitle}" | Nav: "${enNavAfter}"`);
  if (enRecordTitle.trim() !== 'My progress') throw new Error('Expected English "My progress", got ' + enRecordTitle);
  if (enNavAfter.trim() !== 'HOME') throw new Error('Expected English "HOME", got ' + enNavAfter);

  console.log('\n✅ ALL LANGUAGE TOGGLE TESTS PASSED PERFECTLY!');
  await browser.close();
  if (errors.length) {
    console.warn('Browser logs had warnings/errors:', errors);
  }
})();
