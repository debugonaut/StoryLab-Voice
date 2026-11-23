const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const EventEmitter = require('events');

class VoiceAuditBus extends EventEmitter {}
const voiceAudit = new VoiceAuditBus();
const voiceEventLog = [];

voiceAudit.on('speech_event', (eventData) => {
  const logEntry = {
    ...eventData,
    eventId: crypto.randomUUID(),
    loggedAt: new Date().toISOString()
  };
  voiceEventLog.unshift(logEntry);
  if (voiceEventLog.length > 25) voiceEventLog.pop();
});

router.get('/runtime-info', (req, res) => {
  const info = {
    framework: 'Node.js Core Runtime',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    },
    osInfo: {
      hostname: os.hostname(),
      type: os.type(),
      totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemMB: Math.round(os.freemem() / 1024 / 1024),
      cpuCores: os.cpus().length
    }
  };
  res.json({ success: true, data: info });
});

router.post('/crypto-demo', (req, res) => {
  const { inputString = 'StoryLab Voice Node Demonstration' } = req.body;
  const hash = crypto.createHash('sha256').update(inputString).digest('hex');
  const token = crypto.randomBytes(16).toString('hex');
  const uuid = crypto.randomUUID();

  res.json({
    success: true,
    input: inputString,
    sha256Hash: hash,
    cryptographicToken: token,
    generatedUUID: uuid
  });
});

router.post('/event-emit', (req, res) => {
  const { studentPrn = '202401100099', utterance = 'Explain photosynthesis', intent = 'ASK_SCIENCE' } = req.body;
  voiceAudit.emit('speech_event', { studentPrn, utterance, intent });
  res.json({
    success: true,
    message: 'Event emitted through Node.js EventEmitter instance',
    recentEvents: voiceEventLog
  });
});

router.get('/fs-demo', (req, res) => {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFilePath = path.join(logDir, 'access_audit.log');
  const logMessage = `[${new Date().toISOString()}] Node.js fs audit entry from ${req.ip}\n`;
  fs.appendFileSync(logFilePath, logMessage, 'utf8');

  const stats = fs.statSync(logFilePath);

  res.json({
    success: true,
    message: 'Node.js fs module invoked successfully',
    fileCreated: logFilePath,
    sizeBytes: stats.size,
    lastModified: stats.mtime
  });
});

router.get('/stream-demo', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  res.write('--- Node.js Chunked Stream Demonstration ---\n');
  res.write(`[Stream 1/3] Connected at ${new Date().toISOString()}\n`);
  
  setTimeout(() => {
    res.write('[Stream 2/3] Processing audio chunks and intent vectors...\n');
  }, 100);

  setTimeout(() => {
    res.write('[Stream 3/3] Stream pipeline closed successfully.\n');
    res.end();
  }, 250);
});

module.exports = router;
