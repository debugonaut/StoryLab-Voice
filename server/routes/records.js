const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const LearningRecord = require('../models/LearningRecord');
const { expressRecordValidator } = require('../middleware/expressValidator');
const { isMongoConnected, memoryStore } = require('../config/db');

const recordsStore = memoryStore.get('records');

router.post('/', expressRecordValidator, async (req, res) => {
  try {
    const recordPayload = {
      recordId: req.body.recordId || `REC_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      studentPrn: req.body.studentPrn,
      moduleName: req.body.moduleName,
      subject: req.body.subject,
      score: Number(req.body.score),
      durationSeconds: Number(req.body.durationSeconds),
      voiceInteractions: Number(req.body.voiceInteractions || 0),
      status: req.body.status || 'COMPLETED'
    };

    if (isMongoConnected()) {
      const created = await LearningRecord.create(recordPayload);
      return res.status(201).json({ success: true, message: 'Learning record saved to MongoDB', data: created });
    } else {
      const record = {
        ...recordPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      recordsStore.set(record.recordId, record);
      return res.status(201).json({ success: true, message: 'Learning record saved [Demo Mode]', data: record });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { studentPrn, moduleName } = req.query;

    if (isMongoConnected()) {
      const filter = {};
      if (studentPrn) filter.studentPrn = studentPrn;
      if (moduleName) filter.moduleName = moduleName;
      const records = await LearningRecord.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: records.length, data: records });
    } else {
      let list = Array.from(recordsStore.values());
      if (studentPrn) list = list.filter((r) => r.studentPrn === studentPrn);
      if (moduleName) list = list.filter((r) => r.moduleName === moduleName);
      return res.json({ success: true, count: list.length, data: list });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const record = await LearningRecord.findOne({ recordId: id });
      if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.json({ success: true, data: record });
    } else {
      const record = recordsStore.get(id);
      if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.json({ success: true, data: record });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isMongoConnected()) {
      const updated = await LearningRecord.findOneAndUpdate(
        { recordId: id },
        { $set: updates },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.json({ success: true, message: 'Record updated', data: updated });
    } else {
      if (!recordsStore.has(id)) return res.status(404).json({ success: false, message: 'Record not found' });
      const current = recordsStore.get(id);
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      recordsStore.set(id, updated);
      return res.json({ success: true, message: 'Record updated', data: updated });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const deleted = await LearningRecord.findOneAndDelete({ recordId: id });
      if (!deleted) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.json({ success: true, message: 'Record deleted', data: deleted });
    } else {
      if (!recordsStore.has(id)) return res.status(404).json({ success: false, message: 'Record not found' });
      const deleted = recordsStore.get(id);
      recordsStore.delete(id);
      return res.json({ success: true, message: 'Record deleted', data: deleted });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
