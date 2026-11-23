const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { expressStudentValidator } = require('../middleware/expressValidator');
const { isMongoConnected, memoryStore } = require('../config/db');

const studentsStore = memoryStore.get('students');

router.post('/', expressStudentValidator, async (req, res) => {
  try {
    const studentData = req.sanitizedBody || req.body;

    if (isMongoConnected()) {
      const existing = await Student.findOne({ prn: studentData.prn });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Student with PRN ${studentData.prn} already exists.`
        });
      }
      const newStudent = await Student.create(studentData);
      return res.status(201).json({
        success: true,
        message: 'Student registered successfully in MongoDB',
        data: newStudent
      });
    } else {
      if (studentsStore.has(studentData.prn)) {
        return res.status(409).json({
          success: false,
          message: `Student with PRN ${studentData.prn} already exists.`
        });
      }
      const newStudent = {
        ...studentData,
        totalLearningMinutes: 0,
        completedSessions: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      studentsStore.set(studentData.prn, newStudent);
      return res.status(201).json({
        success: true,
        message: 'Student created successfully [Demo In-Memory NoSQL Store]',
        data: newStudent
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { grade, search } = req.query;

    if (isMongoConnected()) {
      const filter = {};
      if (grade) filter.grade = grade;
      if (search) filter.name = { $regex: search, $options: 'i' };

      const students = await Student.find(filter).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: students.length,
        dataSource: 'MongoDB Cluster',
        data: students
      });
    } else {
      let list = Array.from(studentsStore.values());
      if (grade) list = list.filter((s) => s.grade === grade);
      if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

      return res.json({
        success: true,
        count: list.length,
        dataSource: 'In-Memory NoSQL Store (Demo Mode)',
        data: list
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:prn', async (req, res) => {
  try {
    const { prn } = req.params;

    if (isMongoConnected()) {
      const student = await Student.findOne({ prn });
      if (!student) {
        return res.status(404).json({ success: false, message: `Student with PRN ${prn} not found.` });
      }
      return res.json({ success: true, data: student });
    } else {
      const student = studentsStore.get(prn);
      if (!student) {
        return res.status(404).json({ success: false, message: `Student with PRN ${prn} not found.` });
      }
      return res.json({ success: true, data: student });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:prn', expressStudentValidator, async (req, res) => {
  try {
    const { prn } = req.params;
    const updateData = req.sanitizedBody || req.body;

    if (isMongoConnected()) {
      const updated = await Student.findOneAndUpdate(
        { prn },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: `Student with PRN ${prn} not found.` });
      }
      return res.json({
        success: true,
        message: 'Student updated successfully in MongoDB',
        data: updated
      });
    } else {
      if (!studentsStore.has(prn)) {
        return res.status(404).json({ success: false, message: `Student with PRN ${prn} not found.` });
      }
      const existing = studentsStore.get(prn);
      const updated = {
        ...existing,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      studentsStore.set(prn, updated);
      return res.json({
        success: true,
        message: 'Student updated successfully [Demo In-Memory NoSQL Store]',
        data: updated
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:prn', async (req, res) => {
  try {
    const { prn } = req.params;

    if (isMongoConnected()) {
      const deleted = await Student.findOneAndDelete({ prn });
      if (!deleted) {
        return res.status(404).json({ success: false, message: `Student with PRN ${prn} not found.` });
      }
      return res.json({
        success: true,
        message: `Student with PRN ${prn} deleted successfully from MongoDB`,
        data: deleted
      });
    } else {
      if (!studentsStore.has(prn)) {
        return res.status(404).json({ success: false, message: `Student with PRN ${prn} not found.` });
      }
      const deleted = studentsStore.get(prn);
      studentsStore.delete(prn);
      return res.json({
        success: true,
        message: `Student with PRN ${prn} deleted successfully [Demo In-Memory NoSQL Store]`,
        data: deleted
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
