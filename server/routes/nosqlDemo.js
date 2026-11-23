const express = require('express');
const router = express.Router();
const dynamoAdapter = require('../nosql-adapters/dynamoAdapter');
const cassandraAdapter = require('../nosql-adapters/cassandraAdapter');
const { isMongoConnected } = require('../config/db');

router.get('/overview', (req, res) => {
  res.json({
    success: true,
    syllabusMapping: 'PRACTICAL NO. 07 - NoSQL Database (MongoDB, DynamoDB, Cassandra)',
    engines: [
      {
        name: 'MongoDB',
        type: 'Document Store (BSON / JSON)',
        role: 'Primary transactional store for students, learning records, and modules',
        status: isMongoConnected() ? 'CONNECTED_CLUSTER' : 'ACTIVE_IN_MEMORY_EMULATOR'
      },
      {
        name: 'Amazon DynamoDB',
        type: 'Managed Key-Value & Document Store',
        role: 'Single-table low-latency telemetry storage for student voice sessions',
        status: 'INTEGRATED_ADAPTER'
      },
      {
        name: 'Apache Cassandra',
        type: 'Wide-Column Distributed Store (LSM-tree)',
        role: 'High-throughput time-series speech analytics partitioned by student_prn and date',
        status: 'INTEGRATED_ADAPTER'
      }
    ]
  });
});

router.post('/dynamodb/put', async (req, res) => {
  const { studentPrn = '202401100099', sessionId = 'SES_101', duration = 300 } = req.body;
  const item = {
    PK: `STUDENT#${studentPrn}`,
    SK: `SESSION#${sessionId}`,
    durationSeconds: duration,
    syncedAt: new Date().toISOString()
  };
  const result = await dynamoAdapter.putItem(item);
  res.json({ success: true, message: 'DynamoDB PutItem executed', result });
});

router.get('/dynamodb/query/:prn', async (req, res) => {
  const { prn } = req.params;
  const result = await dynamoAdapter.queryByPK(`STUDENT#${prn}`);
  res.json({ success: true, message: 'DynamoDB Query by Partition Key executed', result });
});

router.get('/cassandra/schema', (req, res) => {
  res.json({
    success: true,
    message: 'Apache Cassandra CQL Keyspace & Table Definition',
    cql: cassandraAdapter.getCqlSchema()
  });
});

router.post('/cassandra/insert-telemetry', async (req, res) => {
  const telemetry = {
    student_prn: req.body.studentPrn || '202401100099',
    session_date: new Date().toISOString().split('T')[0],
    utterance_text: req.body.utterance || 'Start the titration experiment',
    confidence_score: 0.94,
    intent_matched: 'START_EXPERIMENT',
    latency_ms: 120
  };
  const result = await cassandraAdapter.executeInsert(telemetry);
  res.json({ success: true, message: 'Cassandra CQL Insert telemetry executed', result });
});

module.exports = router;
