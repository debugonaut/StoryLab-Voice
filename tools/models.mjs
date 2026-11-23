/**
 * StoryLab Voice — Mongoose Database Models
 * 
 * Supports Practical 07 (MongoDB NoSQL) & Practical 06 (RESTful API CRUD)
 */

import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true, enum: ['student', 'teacher', 'admin'], index: true },
  name: { type: String, required: true, trim: true },
  pinHash: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() },
  createdBy: { type: String, default: null },
  active: { type: Boolean, default: true, index: true },
  metadata: {
    grade: { type: String, default: '5' },
    avatar: { type: String, default: 'sun' },
    language: { type: String, default: 'en' },
    subjects: { type: [String], default: [] },
    batchLabel: { type: String, default: '' },
    assignedStudentIds: { type: [String], default: [] },
    lastLogin: { type: Number, default: null }
  }
}, { timestamps: true });

const progressSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, index: true },
  stories: { type: mongoose.Schema.Types.Mixed, default: {} },
  labs: { type: mongoose.Schema.Types.Mixed, default: {} },
  orientation: {
    completed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    completedAt: { type: Number, default: null }
  },
  badges: { type: [String], default: [] },
  updatedAt: { type: Number, default: () => Date.now() }
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  startedAt: { type: Number, required: true },
  endedAt: { type: Number, default: null },
  durationMs: { type: Number, default: 0 },
  syncedAt: { type: Number, default: () => Date.now() }
}, { timestamps: true });

const assignmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  teacherId: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['student', 'grade', 'all'], required: true },
  targetId: { type: String, default: null },
  moduleType: { type: String, enum: ['story', 'lab'], required: true },
  moduleId: { type: String, required: true },
  dueAt: { type: Number, default: null },
  createdAt: { type: Number, default: () => Date.now() },
  completedBy: { type: [String], default: [] }
}, { timestamps: true });

const teacherNoteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  teacherId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Number, default: () => Date.now() },
  updatedAt: { type: Number, default: () => Date.now() }
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  id: { type: String, default: () => 'LOG-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 900 + 100) },
  actorId: { type: String, default: 'system' },
  actorRole: { type: String, default: 'system' },
  action: { type: String, required: true, index: true },
  targetId: { type: String, default: null },
  detail: { type: String, default: '' },
  ts: { type: Number, default: () => Date.now(), index: true }
}, { timestamps: true });

export const Account = mongoose.model('Account', accountSchema);
export const Progress = mongoose.model('Progress', progressSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const TeacherNote = mongoose.model('TeacherNote', teacherNoteSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

let isConnected = false;

export async function connectMongo(uri) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storylab';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('[server] MongoDB: connected to ' + mongoUri.replace(/\/\/.*@/, '//***@'));
    return true;
  } catch (err) {
    isConnected = false;
    console.warn('[server] MongoDB: not connected (' + err.message + '). App will run with client-side storage.');
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
