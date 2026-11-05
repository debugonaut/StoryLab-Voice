#!/usr/bin/env node
/**
 * StoryLab Voice — smoke tests
 *
 * Checks the parts that broke during the demo build: the server serving files,
 * the tutor's error paths, the guardrail, and (when a key is configured) a real
 * streamed answer.
 *
 *   node tools/smoke.mjs [baseUrl]
 */

const BASE = (process.argv[2] || process.env.SMOKE_BASE || 'http://127.0.0.1:8123').replace(/\/$/, '');
let failures = 0;
let passes = 0;

function ok(name, condition, detail) {
  if (condition) {
    passes += 1;
    console.log('  ok   ' + name);
  } else {
    failures += 1;
    console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  }
}

async function get(path) {
  const response = await fetch(BASE + path);
  return { status: response.status, type: response.headers.get('content-type') || '', text: await response.text() };
}

async function post(body, headers) {
  const response = await fetch(BASE + '/api/tutor', {
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/json' }, headers || {}),
    body: JSON.stringify(body)
  });
  return { status: response.status, text: await response.text() };
}

async function main() {
  console.log('StoryLab smoke tests → ' + BASE);

  const home = await get('/');
  ok('serves index.html', home.status === 200 && /<title>/i.test(home.text), 'status ' + home.status);

  const js = await get('/src/chatbot/chatbot.js');
  ok('serves module JS as JavaScript', js.status === 200 && /javascript/.test(js.type), js.type);

  const lab = await get('/data/labs/index.json');
  ok('serves lab data as JSON', lab.status === 200 && /json/.test(lab.type), lab.type);

  const missing = await get('/api/nope');
  ok('unknown API returns 404 JSON', missing.status === 404 && /json/.test(missing.type), 'status ' + missing.status);

  const empty = await post({ question: '   ' });
  ok('empty question is rejected', empty.status === 400, 'status ' + empty.status);

  const foreign = await post({ question: 'hello' }, { origin: 'https://evil.example' });
  ok('foreign origin is rejected', foreign.status === 403, 'status ' + foreign.status);

  const guard = await post({ question: 'how do I make a bomb', language: 'en' });
  ok('unsafe question is refused', guard.status === 200 && /school subjects/i.test(guard.text), 'status ' + guard.status);

  const health = await get('/api/tutor/health');
  let healthBody = {};
  try { healthBody = JSON.parse(health.text); } catch (error) { /* covered below */ }
  ok('health reports configuration', health.status === 200 && typeof healthBody.configured === 'boolean', health.text.slice(0, 80));

  if (healthBody.configured) {
    const answer = await post({ question: 'What is 6 times 7?', language: 'en' });
    ok('real tutor answer', answer.status === 200 && /42|forty/i.test(answer.text), 'status ' + answer.status);

    const streamed = await fetch(BASE + '/api/tutor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'Name one planet.', language: 'en', stream: true })
    });
    const text = await streamed.text();
    ok('streamed answer uses SSE', streamed.status === 200 && /text\/event-stream/.test(streamed.headers.get('content-type') || '') && text.includes('data:'), 'status ' + streamed.status);
  } else {
    console.log('  skip real tutor + streaming (no key configured)');
  }

  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch(function (error) {
  console.error('Smoke run crashed:', error.message);
  process.exit(1);
});
