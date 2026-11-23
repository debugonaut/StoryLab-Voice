const mongoose = require('mongoose');

const learningRecordSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true
    },
    studentPrn: {
      type: String,
      required: [true, 'Student PRN reference is required'],
      ref: 'Student'
    },
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      enum: ['StoryLearn', 'LabInBox', 'VoiceTutor', 'Orientation']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: ['Mathematics', 'Science', 'EVS', 'SocialStudies', 'General']
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
      default: 0
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: [1, 'Duration must be at least 1 second']
    },
    voiceInteractions: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'SYNCED'],
      default: 'COMPLETED'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LearningRecord', learningRecordSchema);
