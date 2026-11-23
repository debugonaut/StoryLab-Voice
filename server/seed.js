const { memoryStore } = require('./config/db');

const sampleStudents = [
  {
    prn: '202401100099',
    name: 'Pritam Tatkari',
    email: 'pritam.tatkari@mitaoe.ac.in',
    age: 14,
    grade: 'Grade 9',
    preferredLanguage: 'en-IN',
    totalLearningMinutes: 240,
    completedSessions: 8,
    isActive: true
  },
  {
    prn: '202401100090',
    name: 'Aadesh Khande',
    email: 'aadesh.khande@mitaoe.ac.in',
    age: 15,
    grade: 'Grade 10',
    preferredLanguage: 'mr-IN',
    totalLearningMinutes: 310,
    completedSessions: 11,
    isActive: true
  },
  {
    prn: '202401100082',
    name: 'Ritesh Gavhane',
    email: 'ritesh.gavhane@mitaoe.ac.in',
    age: 14,
    grade: 'Grade 9',
    preferredLanguage: 'hi-IN',
    totalLearningMinutes: 195,
    completedSessions: 6,
    isActive: true
  },
  {
    prn: '202401100109',
    name: 'Anurag Kumbhar',
    email: 'anurag.kumbhar@mitaoe.ac.in',
    age: 15,
    grade: 'Grade 10',
    preferredLanguage: 'en-IN',
    totalLearningMinutes: 280,
    completedSessions: 9,
    isActive: true
  }
];

const sampleRecords = [
  {
    recordId: 'REC_DEMO_001',
    studentPrn: '202401100099',
    moduleName: 'StoryLearn',
    subject: 'Science',
    score: 95,
    durationSeconds: 340,
    voiceInteractions: 14,
    status: 'COMPLETED'
  },
  {
    recordId: 'REC_DEMO_002',
    studentPrn: '202401100099',
    moduleName: 'LabInBox',
    subject: 'Science',
    score: 88,
    durationSeconds: 420,
    voiceInteractions: 19,
    status: 'COMPLETED'
  },
  {
    recordId: 'REC_DEMO_003',
    studentPrn: '202401100090',
    moduleName: 'VoiceTutor',
    subject: 'Mathematics',
    score: 90,
    durationSeconds: 290,
    voiceInteractions: 12,
    status: 'COMPLETED'
  }
];

function seedInitialData() {
  const students = memoryStore.get('students');
  const records = memoryStore.get('records');

  sampleStudents.forEach((s) => {
    students.set(s.prn, {
      ...s,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  sampleRecords.forEach((r) => {
    records.set(r.recordId, {
      ...r,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  console.log(`[Seed Data] Seeded ${sampleStudents.length} students & ${sampleRecords.length} learning records.`);
}

module.exports = {
  seedInitialData,
  sampleStudents,
  sampleRecords
};
