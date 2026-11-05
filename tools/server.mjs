#!/usr/bin/env node
/**
 * StoryLab Voice — demo server
 *
 * Serves the static app and proxies tutor questions to an OpenAI-compatible
 * chat API (Groq by default). The key stays on this machine: it is read from
 * the environment or a local .env file and never sent to the browser.
 *
 * Usage
 *   node tools/server.mjs
 *   PORT=8123 node tools/server.mjs
 *   HOST=0.0.0.0 PORT=8123 node tools/server.mjs   # share on the LAN
 *
 * Endpoints
 *   GET  /api/tutor/health   → { configured, model, provider }
 *   POST /api/tutor          → { answer, model, language } or an SSE stream
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/* .env is optional; values already set in the environment always win. */
function loadDotEnv() {
  const file = join(ROOT, '.env');
  if (!existsSync(file)) return;
  let raw = '';
  try {
    raw = readFileSync(file, 'utf8');
  } catch (error) {
    console.warn('[server] Could not read .env:', error.message);
    return;
  }
  raw.split(/\r?\n/).forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

loadDotEnv();

const PORT = Number(process.env.PORT || 8123);
const HOST = process.env.HOST || '127.0.0.1';
const API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '';
const API_BASE = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
const MODEL = process.env.GROQ_MODEL || '';
const MAX_BODY = 16 * 1024;
const RATE_LIMIT = 40;
const RATE_WINDOW = 60 * 1000;

/* Groq retires model ids without much notice, so try the configured one first
 * and fall back through current ids. Whichever answers is reused afterwards. */
const MODEL_CANDIDATES = Array.from(new Set([
  MODEL,
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
  'llama-3.3-70b-versatile'
].filter(Boolean)));
let activeModel = MODEL_CANDIDATES[0];

const SYSTEM_PROMPTS = {
  en: 'You are StoryLab, a friendly tutor for students in classes 6 to 8 in rural India. Answer in simple English using short sentences and one concrete example. Keep it to three sentences at most. Never use markdown, headings, bullet points or emoji. If the question is not about school learning, gently bring it back to a subject they are studying.',
  hi: 'आप StoryLab हैं, भारत के गाँवों में कक्षा 6 से 8 के विद्यार्थियों के लिए एक मिलनसार शिक्षक। सरल हिंदी में छोटे वाक्यों में उत्तर दें और एक उदाहरण दें। अधिकतम तीन वाक्य। मार्कडाउन, शीर्षक, बिंदु या इमोजी का उपयोग न करें। यदि प्रश्न पढ़ाई से जुड़ा नहीं है, तो विनम्रता से किसी विषय की ओर लौटाएँ।',
  mr: 'तुम्ही StoryLab आहात, भारतातील गावांमधील इयत्ता 6 ते 8 च्या विद्यार्थ्यांसाठी मैत्रीपूर्ण शिक्षक. सोप्या मराठीत लहान वाक्यांत उत्तर द्या आणि एक उदाहरण द्या. जास्तीत जास्त तीन वाक्ये. मार्कडाउन, शीर्षके, ठिपके किंवा इमोजी वापरू नका. प्रश्न अभ्यासाशी संबंधित नसल्यास नम्रपणे विषयाकडे परत आणा.'
};

const REFUSALS = {
  en: 'Let us keep to school subjects. Ask me about a lesson you are studying and I will explain it in simple words.',
  hi: 'चलो पढ़ाई की बात करें। जो पाठ तुम पढ़ रहे हो उसके बारे में पूछो, मैं आसान शब्दों में समझाऊँगा।',
  mr: 'आपण अभ्यासाच्या गोष्टी करूया. तुम्ही जो धडा शिकत आहात त्याबद्दल विचारा, मी सोप्या शब्दांत समजावून सांगेन.'
};

/* A light safety net for a child-facing model: clearly unsuitable requests are
 * refused before they reach the provider, in the student's language. */
const UNSAFE = /\b(suicide|self[- ]?harm|kill (myself|yourself)|porn|pornography|sex|sexual|nude|naked|drugs?|cocaine|heroin|weapon|bomb|gun|terrorist|hack (a|an|someone|the)|credit card number|password of)\b/i;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW; });
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Request body too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch (error) {
    return false;
  }
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-6).map(function (item) {
    const role = item && item.role === 'assistant' ? 'assistant' : 'user';
    const content = String((item && item.content) || '').slice(0, 500);
    return content ? { role: role, content: content } : null;
  }).filter(Boolean);
}

function buildMessages(payload, language) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPTS[language] }];
  const context = String(payload.context || '').trim();
  if (context) {
    messages.push({
      role: 'system',
      content: 'The student is looking at this lesson right now: "' + context.slice(0, 600) + '". Prefer answering about it when the question is short or refers to "this".'
    });
  }
  buildHistory(payload).forEach(function (m) { messages.push(m); });
  messages.push({ role: 'user', content: String(payload.question || '').trim() });
  return messages;
}

function buildHistory(payload) {
  return cleanHistory(payload.history);
}

function bodyFor(model, messages, stream) {
  return JSON.stringify({
    model: model,
    messages: messages,
    temperature: 0.4,
    max_tokens: 320,
    stream: Boolean(stream)
  });
}

async function openUpstream(messages, stream) {
  const order = [activeModel].concat(MODEL_CANDIDATES.filter(function (m) { return m !== activeModel; }));
  let lastStatus = 0;
  let lastDetail = '';

  for (let i = 0; i < order.length; i += 1) {
    const model = order[i];
    let attempt;
    try {
      attempt = await fetch(API_BASE + '/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + API_KEY
        },
        body: bodyFor(model, messages, stream),
        signal: AbortSignal.timeout(30000)
      });
    } catch (error) {
      return { error: 'unreachable', detail: error.message, status: 504 };
    }

    if (attempt.ok) { activeModel = model; return { response: attempt, model: model }; }

    lastStatus = attempt.status;
    lastDetail = await attempt.text().catch(function () { return ''; });
    const modelGone = attempt.status === 404 && /model_not_found|does not exist|do not have access/i.test(lastDetail);
    if (!modelGone) break;
    console.warn('[server] Model unavailable, trying the next one:', model);
  }

  console.warn('[server] Tutor upstream', lastStatus, lastDetail.slice(0, 200).replace(/[\r\n]+/g, ' '));
  return { error: 'upstream', status: lastStatus === 429 ? 429 : 502, detail: lastDetail };
}

async function pipeStream(upstream, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      let index;
      while ((index = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = (((parsed.choices || [])[0] || {}).delta || {}).content;
          if (delta) res.write('data: ' + JSON.stringify({ delta: delta }) + '\n\n');
        } catch (error) { /* ignore keep-alives and partial frames */ }
      }
    }
  } catch (error) {
    console.warn('[server] Stream interrupted:', error.message);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

async function handleTutor(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'bad_origin' });
    return;
  }
  const ip = req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    sendJson(res, 429, { error: 'busy', message: 'Too many questions just now. Wait a moment and try again.' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req) || '{}');
  } catch (error) {
    sendJson(res, error.status || 400, { error: 'bad_request', message: 'Could not read that question.' });
    return;
  }

  const question = String(payload.question || '').trim();
  const language = ['en', 'hi', 'mr'].includes(payload.language) ? payload.language : 'en';
  const wantsStream = Boolean(payload.stream);

  if (!question) {
    sendJson(res, 400, { error: 'empty_question', message: 'Ask a question first.' });
    return;
  }
  if (question.length > 800) {
    sendJson(res, 400, { error: 'question_too_long', message: 'Please ask a shorter question.' });
    return;
  }
  if (UNSAFE.test(question)) {
    sendJson(res, 200, { answer: REFUSALS[language], model: 'guardrail', language: language });
    return;
  }
  if (!API_KEY) {
    sendJson(res, 503, {
      error: 'not_configured',
      message: 'The AI tutor is not connected on this machine yet. Add GROQ_API_KEY to .env and restart the server.'
    });
    return;
  }

  const messages = buildMessages(payload, language);
  const result = await openUpstream(messages, wantsStream);

  if (result.error === 'unreachable') {
    console.warn('[server] Tutor request failed:', result.detail);
    sendJson(res, 504, { error: 'upstream_unreachable', message: 'The tutor service could not be reached. Check the connection.' });
    return;
  }
  if (result.error === 'upstream') {
    sendJson(res, result.status, {
      error: result.status === 429 ? 'busy' : 'upstream_error',
      message: result.status === 429
        ? 'The tutor is busy right now. Try again in a moment.'
        : 'The tutor could not answer that. Check the key and model, then try again.'
    });
    return;
  }

  if (wantsStream) {
    await pipeStream(result.response, res);
    return;
  }

  let data;
  try {
    data = await result.response.json();
  } catch (error) {
    sendJson(res, 502, { error: 'bad_upstream_response', message: 'The tutor sent an answer we could not read.' });
    return;
  }

  const answer = String((((data.choices || [])[0] || {}).message || {}).content || '').trim();
  if (!answer) {
    sendJson(res, 502, { error: 'empty_answer', message: 'The tutor did not answer. Try asking in another way.' });
    return;
  }

  sendJson(res, 200, { answer: answer, model: activeModel, language: language });
}

async function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (error) {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const target = normalize(join(ROOT, pathname));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let body;
  try {
    body = await readFile(target);
  } catch (error) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const type = MIME[extname(target).toLowerCase()] || 'application/octet-stream';
  const immutable = /\.(woff2|jpg|jpeg|png|webp|svg|ico)$/i.test(target);
  res.writeHead(200, {
    'content-type': type,
    'content-length': body.length,
    'cache-control': immutable ? 'public, max-age=3600' : 'no-cache'
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = createServer(function (req, res) {
  const started = Date.now();
  res.on('finish', function () {
    console.log(req.method, req.url.split('?')[0], res.statusCode, (Date.now() - started) + 'ms');
  });

  const pathname = (req.url || '/').split('?')[0];
  if (pathname === '/api/tutor/health') {
    sendJson(res, 200, { ok: true, configured: Boolean(API_KEY), provider: 'groq', model: activeModel });
    return;
  }
  if (pathname === '/api/tutor') {
    handleTutor(req, res).catch(function (error) {
      console.error('[server] Unhandled tutor error:', error);
      if (!res.headersSent) sendJson(res, 500, { error: 'server_error' });
    });
    return;
  }
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }
  serveStatic(req, res).catch(function (error) {
    console.error('[server] Static error:', error);
    if (!res.headersSent) res.writeHead(500).end('Server error');
  });
});

server.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('[server] Port ' + PORT + ' is already in use. Stop the other server or set PORT.');
  } else {
    console.error('[server]', error.message);
  }
  process.exit(1);
});

server.listen(PORT, HOST, function () {
  console.log('[server] StoryLab running at http://' + HOST + ':' + PORT);
  console.log('[server] AI tutor: ' + (API_KEY ? 'connected (model ' + activeModel + ')' : 'no key — add GROQ_API_KEY to .env'));
  if (HOST === '0.0.0.0') {
    console.log('[server] LAN mode: open http://<this-machine-ip>:' + PORT + ' — the microphone needs HTTPS on other devices.');
  }
});
