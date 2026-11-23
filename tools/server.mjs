#!/usr/bin/env node
/**
 * StoryLab Voice — Express & MongoDB Backend Server
 * 
 * Satisfies Web Technology Syllabus Practicals:
 * - Practical 04: Server-side Development with Node.js
 * - Practical 05: Web Application Framework with Express.js
 * - Practical 06: RESTful API for CRUD operations (testable via Postman)
 * - Practical 07: NoSQL Database (MongoDB) interaction via Mongoose
 */

import express from 'express';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Account,
  Progress,
  Session,
  Assignment,
  TeacherNote,
  AuditLog,
  connectMongo,
  isMongoConnected
} from './models.mjs';

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
const STT_MODEL = process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo';
const RATE_LIMIT = 40;
const RATE_WINDOW = 60 * 1000;

/* Groq model candidates */
const MODEL_CANDIDATES = Array.from(new Set([
  MODEL,
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b'
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

const UNSAFE = /\b(suicide|self[- ]?harm|kill (myself|yourself)|porn|pornography|sex|sexual|nude|naked|drugs?|cocaine|heroin|weapon|bomb|gun|terrorist|hack (a|an|someone|the)|credit card number|password of)\b/i;

const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW; });
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
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
  cleanHistory(payload.history).forEach(function (m) { messages.push(m); });
  messages.push({ role: 'user', content: String(payload.question || '').trim() });
  return messages;
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

/* ============================================================
   EXPRESS APPLICATION SETUP
   ============================================================ */

const app = express();

/* Request logger middleware */
app.use(function (req, res, next) {
  const started = Date.now();
  res.on('finish', function () {
    console.log(req.method, req.url.split('?')[0], res.statusCode, (Date.now() - started) + 'ms');
  });
  next();
});

/* Body parsers */
app.use(express.json({ limit: '1mb' }));
app.use(express.raw({ type: 'audio/*', limit: '12mb' }));

/* ------------------------------------------------------------
   HEALTH & METRICS ENDPOINTS
   ------------------------------------------------------------ */

app.get('/api/tutor/health', function (req, res) {
  res.json({
    ok: true,
    configured: Boolean(API_KEY),
    provider: 'groq',
    model: activeModel,
    stt: STT_MODEL,
    mongodb: isMongoConnected()
  });
});

app.get('/api/health', function (req, res) {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    mongodb: {
      connected: isMongoConnected()
    },
    tutor: {
      configured: Boolean(API_KEY),
      model: activeModel
    }
  });
});

/* ------------------------------------------------------------
   AI TUTOR & TRANSCRIBE (Practical 4 / Node Server Features)
   ------------------------------------------------------------ */

app.post('/api/tutor', async function (req, res) {
  if (!sameOrigin(req)) {
    return res.status(403).json({ error: 'bad_origin' });
  }
  const ip = req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'busy', message: 'Too many questions just now. Wait a moment and try again.' });
  }

  const payload = req.body || {};
  const question = String(payload.question || '').trim();
  const language = ['en', 'hi', 'mr'].includes(payload.language) ? payload.language : 'en';
  const wantsStream = Boolean(payload.stream);

  if (!question) {
    return res.status(400).json({ error: 'empty_question', message: 'Ask a question first.' });
  }
  if (question.length > 800) {
    return res.status(400).json({ error: 'question_too_long', message: 'Please ask a shorter question.' });
  }
  if (UNSAFE.test(question)) {
    return res.status(200).json({ answer: REFUSALS[language], model: 'guardrail', language: language });
  }
  if (!API_KEY) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'The AI tutor is not connected on this machine yet. Add GROQ_API_KEY to .env and restart the server.'
    });
  }

  const messages = buildMessages(payload, language);
  const result = await openUpstream(messages, wantsStream);

  if (result.error === 'unreachable') {
    return res.status(504).json({ error: 'upstream_unreachable', message: 'The tutor service could not be reached. Check the connection.' });
  }
  if (result.error === 'upstream') {
    return res.status(result.status).json({
      error: result.status === 429 ? 'busy' : 'upstream_error',
      message: result.status === 429
        ? 'The tutor is busy right now. Try again in a moment.'
        : 'The tutor could not answer that. Check the key and model, then try again.'
    });
  }

  if (wantsStream) {
    await pipeStream(result.response, res);
    return;
  }

  let data;
  try {
    data = await result.response.json();
  } catch (error) {
    return res.status(502).json({ error: 'bad_upstream_response', message: 'The tutor sent an answer we could not read.' });
  }

  const answer = String((((data.choices || [])[0] || {}).message || {}).content || '').trim();
  if (!answer) {
    return res.status(502).json({ error: 'empty_answer', message: 'The tutor did not answer. Try asking in another way.' });
  }

  res.status(200).json({ answer: answer, model: activeModel, language: language });
});

app.post('/api/transcribe', async function (req, res) {
  if (!sameOrigin(req)) {
    return res.status(403).json({ error: 'bad_origin' });
  }
  const ip = req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'busy', message: 'Too much listening just now. Wait a moment and try again.' });
  }
  if (!API_KEY) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'Speech recognition is not connected on this machine yet. Add GROQ_API_KEY to .env and restart the server.'
    });
  }

  const audio = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!audio.length) {
    return res.status(400).json({ error: 'empty_audio', message: 'No audio was recorded.' });
  }

  let language = 'en';
  try {
    const requested = req.query.lang || 'en';
    if (['en', 'hi', 'mr'].includes(requested)) language = requested;
  } catch (error) { /* keep default */ }

  const type = String(req.headers['content-type'] || 'audio/webm').split(';')[0].trim();
  const ext = /ogg/.test(type) ? 'ogg' : /mp4|m4a|aac/.test(type) ? 'm4a' : /wav/.test(type) ? 'wav' : 'webm';

  const form = new FormData();
  form.append('file', new Blob([audio], { type: type || 'audio/webm' }), 'answer.' + ext);
  form.append('model', STT_MODEL);
  form.append('language', language);
  form.append('response_format', 'json');
  form.append('temperature', '0');

  let upstream;
  try {
    upstream = await fetch(API_BASE + '/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + API_KEY },
      body: form,
      signal: AbortSignal.timeout(30000)
    });
  } catch (error) {
    return res.status(504).json({ error: 'stt_unreachable', message: 'Speech recognition could not be reached. Check the connection.' });
  }

  if (!upstream.ok) {
    return res.status(upstream.status === 429 ? 429 : 502).json({
      error: upstream.status === 429 ? 'busy' : 'stt_error',
      message: upstream.status === 429 ? 'Speech recognition is busy right now.' : 'Recording could not be understood.'
    });
  }

  const data = await upstream.json().catch(function () { return null; });
  const text = String((data && data.text) || '').trim();
  res.status(200).json({ text: text, model: STT_MODEL, language: language });
});

/* ------------------------------------------------------------
   RESTful CRUD APIs & MONGODB SYNC (Practicals 06 & 07)
   ------------------------------------------------------------ */

/* 1. Sync Gateway: Ingests offline-queued telemetry events into MongoDB */
app.post('/api/sync', async function (req, res) {
  try {
    const { student, events } = req.body || {};
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'invalid_payload', message: 'events array expected' });
    }

    if (!isMongoConnected()) {
      return res.status(200).json({ ok: true, synced: events.length, mode: 'local-fallback' });
    }

    let studentId = (student && student.id) || 'unknown';

    // Ingest events into audit log or progress collections
    for (const event of events) {
      if (event.action || event.kind) {
        await AuditLog.create({
          actorId: studentId,
          actorRole: 'student',
          action: event.action || event.kind || 'activity',
          detail: typeof event.detail === 'string' ? event.detail : JSON.stringify(event.detail || {}),
          ts: event.ts || Date.now()
        }).catch(() => {});
      }

      // If it's a progress or session event, update corresponding documents
      if (event.session && event.session.id) {
        await Session.findOneAndUpdate(
          { id: event.session.id },
          {
            id: event.session.id,
            studentId: studentId,
            startedAt: event.session.startedAt || Date.now(),
            endedAt: event.session.endedAt || null,
            durationMs: event.session.durationMs || 0,
            syncedAt: Date.now()
          },
          { upsert: true }
        ).catch(() => {});
      }
    }

    res.status(200).json({
      ok: true,
      count: events.length,
      mode: 'mongodb',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('[server] Sync error:', err.message);
    res.status(500).json({ error: 'sync_failed', message: err.message });
  }
});

/* 2. Accounts CRUD */
app.get('/api/accounts', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.json([]);
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.active !== undefined) query.active = req.query.active === 'true';
    const accounts = await Account.find(query).select('-pinHash').lean();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.post('/api/accounts', async function (req, res) {
  try {
    const { id, role, name, pinHash, metadata } = req.body || {};
    if (!id || !role || !name || !pinHash) {
      return res.status(400).json({ error: 'validation_error', message: 'id, role, name, and pinHash are required' });
    }
    if (!isMongoConnected()) {
      return res.status(503).json({ error: 'db_unavailable' });
    }
    const created = await Account.findOneAndUpdate(
      { id: id },
      { id, role, name, pinHash, metadata: metadata || {}, active: true },
      { upsert: true, new: true }
    );
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.get('/api/accounts/:id', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.status(404).json({ error: 'not_found' });
    const account = await Account.findOne({ id: req.params.id }).select('-pinHash').lean();
    if (!account) return res.status(404).json({ error: 'not_found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.delete('/api/accounts/:id', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.status(503).json({ error: 'db_unavailable' });
    await Account.deleteOne({ id: req.params.id });
    res.json({ ok: true, deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

/* 3. Progress CRUD */
app.get('/api/progress/:studentId', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.json({ stories: {}, labs: {} });
    const doc = await Progress.findOne({ studentId: req.params.studentId }).lean();
    res.json(doc || { studentId: req.params.studentId, stories: {}, labs: {} });
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.post('/api/progress', async function (req, res) {
  try {
    const { studentId, stories, labs, orientation, badges } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    if (!isMongoConnected()) return res.json({ ok: true, saved: 'local' });

    const updated = await Progress.findOneAndUpdate(
      { studentId },
      { $set: { stories, labs, orientation, badges, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, progress: updated });
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

/* 4. Assignments CRUD */
app.get('/api/assignments', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.json([]);
    const query = {};
    if (req.query.teacherId) query.teacherId = req.query.teacherId;
    if (req.query.targetId) query.targetId = req.query.targetId;
    const assignments = await Assignment.find(query).sort({ createdAt: -1 }).lean();
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.post('/api/assignments', async function (req, res) {
  try {
    const { id, teacherId, targetType, targetId, moduleType, moduleId, dueAt } = req.body || {};
    if (!teacherId || !targetType || !moduleType || !moduleId) {
      return res.status(400).json({ error: 'validation_error', message: 'Required fields missing' });
    }
    if (!isMongoConnected()) return res.status(503).json({ error: 'db_unavailable' });

    const newAssignment = await Assignment.create({
      id: id || 'ASN-' + Date.now().toString(36).toUpperCase(),
      teacherId,
      targetType,
      targetId: targetId || null,
      moduleType,
      moduleId,
      dueAt: dueAt || null,
      createdAt: Date.now()
    });
    res.status(201).json(newAssignment);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

/* 5. Teacher Notes CRUD */
app.get('/api/notes/:studentId', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.json([]);
    const notes = await TeacherNote.find({ studentId: req.params.studentId }).sort({ createdAt: -1 }).lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.post('/api/notes', async function (req, res) {
  try {
    const { teacherId, studentId, text } = req.body || {};
    if (!teacherId || !studentId || !text) {
      return res.status(400).json({ error: 'validation_error', message: 'teacherId, studentId, and text are required' });
    }
    if (!isMongoConnected()) return res.status(503).json({ error: 'db_unavailable' });

    const note = await TeacherNote.create({
      id: 'NOTE-' + Date.now().toString(36).toUpperCase(),
      teacherId,
      studentId,
      text: String(text).trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

/* 6. Audit Log */
app.get('/api/audit-log', async function (req, res) {
  try {
    if (!isMongoConnected()) return res.json([]);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await AuditLog.find().sort({ ts: -1 }).limit(limit).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

/* Fallback for unknown /api endpoints - required by smoke test to return JSON 404 */
app.use('/api', function (req, res) {
  res.status(404).json({ error: 'not_found' });
});

/* ------------------------------------------------------------
   STATIC ASSETS SERVING (SPA)
   ------------------------------------------------------------ */

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

app.use(express.static(ROOT, {
  setHeaders: function (res, path) {
    const ext = extname(path).toLowerCase();
    if (MIME[ext]) {
      res.setHeader('content-type', MIME[ext]);
    }
    const immutable = /\.(woff2|jpg|jpeg|png|webp|svg|ico)$/i.test(path);
    res.setHeader('cache-control', immutable ? 'public, max-age=3600' : 'no-cache');
  }
}));

/* 404 handler for non-API files */
app.use(function (req, res) {
  res.status(404).type('text/plain; charset=utf-8').send('Not found');
});

/* ------------------------------------------------------------
   SERVER INITIALIZATION & STARTUP
   ------------------------------------------------------------ */

const server = createServer(app);

server.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('[server] Port ' + PORT + ' is already in use. Stop the other server or set PORT.');
  } else {
    console.error('[server]', error.message);
  }
  process.exit(1);
});

async function start() {
  await connectMongo();

  server.listen(PORT, HOST, function () {
    console.log('[server] StoryLab running with Express at http://' + HOST + ':' + PORT);
    console.log('[server] Framework: Express.js (v' + (express.version || '4.x') + ')');
    console.log('[server] Database: MongoDB (' + (isMongoConnected() ? 'connected' : 'offline fallback') + ')');
    console.log('[server] AI tutor: ' + (API_KEY ? 'connected (model ' + activeModel + ')' : 'no key — add GROQ_API_KEY to .env'));
    if (HOST === '0.0.0.0') {
      console.log('[server] LAN mode: open http://<this-machine-ip>:' + PORT);
    }
  });
}

start();
