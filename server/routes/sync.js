const express = require('express');
const router = express.Router();
const LearningRecord = require('../models/LearningRecord');
const { isMongoConnected, memoryStore } = require('../config/db');

const recordsStore = memoryStore.get('records');

router.post('/offline-records', async (req, res) => {
  try {
    const { batch } = req.body;
    if (!Array.isArray(batch)) {
      return res.status(400).json({ success: false, message: 'Batch must be an array of records' });
    }

    const saved = [];
    for (const item of batch) {
      const record = {
        recordId: item.id || `SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentPrn: item.studentPrn || '202401100099',
        moduleName: item.module || 'StoryLearn',
        subject: item.subject || 'General',
        score: item.score || 80,
        durationSeconds: item.durationSeconds || 120,
        voiceInteractions: item.voiceInteractions || 3,
        status: 'SYNCED',
        createdAt: item.timestamp ? new Date(item.timestamp) : new Date()
      };

      if (isMongoConnected()) {
        const doc = await LearningRecord.create(record);
        saved.push(doc);
      } else {
        recordsStore.set(record.recordId, record);
        saved.push(record);
      }
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${saved.length} offline records to backend`,
      syncedCount: saved.length,
      records: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
