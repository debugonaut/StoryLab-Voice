const express = require('express');
const path = require('path');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(`[Express HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsed}ms)`);
  });
  next();
});

app.use('/wt-portal', express.static(path.join(__dirname, '../wt-portal')));
app.use('/react-app', express.static(path.join(__dirname, '../client-react')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));

const studentsRouter = require('./routes/students');
const recordsRouter = require('./routes/records');
const nodeRouter = require('./routes/nodeCapabilities');
const nosqlRouter = require('./routes/nosqlDemo');
const syncRouter = require('./routes/sync');

app.use('/api/students', studentsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/node', nodeRouter);
app.use('/api/nosql', nosqlRouter);
app.use('/api/sync', syncRouter);

app.get('/api', (req, res) => {
  res.json({
    project: 'StoryLab Voice - Web Technology Coursework Suite',
    course: 'Web Technology (2310362L) - MIT Academy of Engineering',
    academicYear: 'AY 2025-2026',
    architecture: 'MERN Stack (MongoDB, ExpressJS, ReactJS, NodeJS) + Bootstrap 5',
    endpoints: {
      students_crud: '/api/students',
      records_crud: '/api/records',
      node_capabilities: '/api/node/runtime-info',
      nosql_overview: '/api/nosql/overview',
      offline_sync: '/api/sync/offline-records'
    },
    portals: {
      bootstrap_portal: '/wt-portal/index.html',
      react_client_validation: '/react-app/index.html'
    },
    status: 'OPERATIONAL'
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `Resource at ${req.originalUrl} not found on this Express server.`
  });
});

app.use((err, req, res, next) => {
  console.error('[Express Unhandled Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    errorType: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
