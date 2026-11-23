/**
 * StoryLab Voice — Demo Seed Script
 * 
 * Interconnects Admin, Teacher, and Student roles with rich data for both
 * MongoDB (NoSQL) and IndexedDB (offline-first client ledger).
 * 
 * Credentials:
 *   ADMIN:
 *     Principal Sharma     ID: ADM-ROOT          PIN: 112233
 *   TEACHERS:
 *     Anjali Patil         ID: TCH-2026-SCIE     PIN: 2233   (Grade 6 Science & Math)
 *     Vikram Deshmukh      ID: TCH-2026-LANG     PIN: 4455   (Grade 5 EVS & Social)
 *   STUDENTS:
 *     Aarav Shinde         ID: SLV-2026-AARV     PIN: 1234   (Grade 6, Marathi)  -> Anjali Patil batch
 *     Priya Sharma         ID: SLV-2026-PRYA     PIN: 1234   (Grade 5, Hindi)    -> Anjali Patil batch
 *     Rohan Kadam          ID: SLV-2026-RHAN     PIN: 1234   (Grade 5, Marathi)  -> Vikram Deshmukh batch
 *     Sneha Patil          ID: SLV-2026-SNHA     PIN: 1234   (Grade 6, English)  -> Vikram Deshmukh batch
 */

import crypto from 'node:crypto';
import {
  Account,
  Progress,
  Session,
  Assignment,
  TeacherNote,
  AuditLog,
  connectMongo
} from './models.mjs';

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

export const DEMO_DATA = {
  accounts: [
    {
      id: 'ADM-ROOT',
      role: 'admin',
      name: 'Principal Sharma',
      pinHash: hashPin('112233'),
      active: true,
      metadata: {
        title: 'School Administrator / Principal',
        school: 'Z.P. Primary School, Pune',
        assignedStudentIds: []
      }
    },
    {
      id: 'TCH-2026-SCIE',
      role: 'teacher',
      name: 'Anjali Patil',
      pinHash: hashPin('2233'),
      active: true,
      metadata: {
        batchLabel: 'Grade 6 - Science & Math',
        subject: 'Science & Mathematics',
        assignedStudentIds: ['SLV-2026-AARV', 'SLV-2026-PRYA']
      }
    },
    {
      id: 'TCH-2026-LANG',
      role: 'teacher',
      name: 'Vikram Deshmukh',
      pinHash: hashPin('4455'),
      active: true,
      metadata: {
        batchLabel: 'Grade 5 - EVS & Social',
        subject: 'Environmental Studies & Social',
        assignedStudentIds: ['SLV-2026-RHAN', 'SLV-2026-SNHA']
      }
    },
    {
      id: 'SLV-2026-AARV',
      role: 'student',
      name: 'Aarav Shinde',
      pinHash: hashPin('1234'),
      active: true,
      metadata: {
        grade: '6',
        avatar: 'sun',
        language: 'mr',
        teacherId: 'TCH-2026-SCIE',
        teacherName: 'Anjali Patil'
      }
    },
    {
      id: 'SLV-2026-PRYA',
      role: 'student',
      name: 'Priya Sharma',
      pinHash: hashPin('1234'),
      active: true,
      metadata: {
        grade: '5',
        avatar: 'star',
        language: 'hi',
        teacherId: 'TCH-2026-SCIE',
        teacherName: 'Anjali Patil'
      }
    },
    {
      id: 'SLV-2026-RHAN',
      role: 'student',
      name: 'Rohan Kadam',
      pinHash: hashPin('1234'),
      active: true,
      metadata: {
        grade: '5',
        avatar: 'bolt',
        language: 'mr',
        teacherId: 'TCH-2026-LANG',
        teacherName: 'Vikram Deshmukh'
      }
    },
    {
      id: 'SLV-2026-SNHA',
      role: 'student',
      name: 'Sneha Patil',
      pinHash: hashPin('1234'),
      active: true,
      metadata: {
        grade: '6',
        avatar: 'atom',
        language: 'en',
        teacherId: 'TCH-2026-LANG',
        teacherName: 'Vikram Deshmukh'
      }
    }
  ],

  progress: [
    {
      studentId: 'SLV-2026-AARV',
      stories: {
        'science-plants': {
          id: 'science-plants',
          title: 'How Plants Eat Light',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000 * 2,
          answers: { s2: 0 }
        },
        'math-market': {
          id: 'math-market',
          title: 'Market Day',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000,
          answers: { s2: 0 }
        }
      },
      labs: {
        'acid-base': {
          id: 'acid-base',
          title: 'Acids, Bases and Turmeric Indicator',
          completed: true,
          completedAt: Date.now() - 86400000,
          durationMs: 360000
        }
      },
      orientation: {
        completed: true,
        score: 1,
        total: 1,
        completedAt: Date.now() - 86400000 * 5
      },
      badges: ['first-story', 'curious-mind', 'lab-explorer', 'marathi-scholar']
    },
    {
      studentId: 'SLV-2026-PRYA',
      stories: {
        'math-fractions': {
          id: 'math-fractions',
          title: 'Pizza Fractions',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000 * 2,
          answers: { s2: 0 }
        },
        'math-market': {
          id: 'math-market',
          title: 'Market Day',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000,
          answers: { s2: 0 }
        }
      },
      labs: {
        'salt-dissolving': {
          id: 'salt-dissolving',
          title: 'Salt Dissolving and Saturation',
          completed: true,
          completedAt: Date.now() - 86400000,
          durationMs: 420000
        }
      },
      orientation: {
        completed: true,
        score: 1,
        total: 1,
        completedAt: Date.now() - 86400000 * 4
      },
      badges: ['first-story', 'math-master']
    },
    {
      studentId: 'SLV-2026-RHAN',
      stories: {
        'social-village': {
          id: 'social-village',
          title: 'Our Village Community',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000 * 3
        },
        'evs-animals': {
          id: 'evs-animals',
          title: 'Animals and Habitats',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000
        }
      },
      labs: {},
      orientation: {
        completed: true,
        score: 1,
        total: 1,
        completedAt: Date.now() - 86400000 * 4
      },
      badges: ['first-story', 'nature-watcher']
    },
    {
      studentId: 'SLV-2026-SNHA',
      stories: {
        'science-solar': {
          id: 'science-solar',
          title: 'Touring the Solar System',
          completed: true,
          score: 1,
          attempts: 1,
          completedAt: Date.now() - 86400000 * 2
        }
      },
      labs: {
        'acid-base': {
          id: 'acid-base',
          title: 'Acids, Bases and Turmeric Indicator',
          completed: true,
          completedAt: Date.now() - 86400000,
          durationMs: 310000
        }
      },
      orientation: {
        completed: true,
        score: 1,
        total: 1,
        completedAt: Date.now() - 86400000 * 3
      },
      badges: ['first-story', 'space-explorer']
    }
  ],

  assignments: [
    {
      id: 'ASN-001',
      teacherId: 'TCH-2026-SCIE',
      teacherName: 'Anjali Patil',
      targetType: 'student',
      targetId: 'SLV-2026-AARV',
      moduleType: 'story',
      moduleId: 'science-water',
      notes: 'Please listen to the water cycle story before our Tuesday practical lab.',
      dueAt: Date.now() + 86400000 * 2,
      createdAt: Date.now() - 86400000,
      completedBy: []
    },
    {
      id: 'ASN-002',
      teacherId: 'TCH-2026-SCIE',
      teacherName: 'Anjali Patil',
      targetType: 'student',
      targetId: 'SLV-2026-PRYA',
      moduleType: 'lab',
      moduleId: 'acid-base',
      notes: 'Complete the turmeric paper indicator test experiment.',
      dueAt: Date.now() + 86400000 * 3,
      createdAt: Date.now() - 86400000,
      completedBy: []
    },
    {
      id: 'ASN-003',
      teacherId: 'TCH-2026-LANG',
      teacherName: 'Vikram Deshmukh',
      targetType: 'all',
      targetId: null,
      moduleType: 'story',
      moduleId: 'social-map',
      notes: 'Class 5 & 6 reading assignment: Map symbols and directions.',
      dueAt: Date.now() + 86400000 * 4,
      createdAt: Date.now() - 86400000 * 2,
      completedBy: []
    }
  ],

  teacherNotes: [
    {
      id: 'NOT-001',
      teacherId: 'TCH-2026-SCIE',
      studentId: 'SLV-2026-AARV',
      text: 'Aarav demonstrated excellent understanding of photosynthesis and asked insightful questions about chlorophyll in the voice tutor.',
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'NOT-002',
      teacherId: 'TCH-2026-SCIE',
      studentId: 'SLV-2026-PRYA',
      text: 'Priya quickly grasped fraction division using the pizza story visualizer. Recommended for advanced math modules.',
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'NOT-003',
      teacherId: 'TCH-2026-LANG',
      studentId: 'SLV-2026-RHAN',
      text: 'Rohan completed the village community mapping story with high accuracy and fluent Marathi voice answers.',
      createdAt: Date.now() - 86400000
    }
  ],

  sessions: [
    {
      id: 'SES-AARV-01',
      studentId: 'SLV-2026-AARV',
      startedAt: Date.now() - 86400000 * 2,
      endedAt: Date.now() - 86400000 * 2 + (22 * 60 * 1000),
      durationMs: 22 * 60 * 1000
    },
    {
      id: 'SES-AARV-02',
      studentId: 'SLV-2026-AARV',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 86400000 + (20 * 60 * 1000),
      durationMs: 20 * 60 * 1000
    },
    {
      id: 'SES-PRYA-01',
      studentId: 'SLV-2026-PRYA',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 86400000 + (35 * 60 * 1000),
      durationMs: 35 * 60 * 1000
    },
    {
      id: 'SES-RHAN-01',
      studentId: 'SLV-2026-RHAN',
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 86400000 + (18 * 60 * 1000),
      durationMs: 18 * 60 * 1000
    }
  ],

  auditLogs: [
    {
      id: 'LOG-001',
      actorId: 'ADM-ROOT',
      actorRole: 'admin',
      action: 'system_init',
      targetId: null,
      detail: 'Principal Sharma initialized school tablet ledger',
      ts: Date.now() - 86400000 * 7
    },
    {
      id: 'LOG-002',
      actorId: 'ADM-ROOT',
      actorRole: 'admin',
      action: 'teacher_enrolled',
      targetId: 'TCH-2026-SCIE',
      detail: 'Registered teacher Anjali Patil (Grade 6 Science & Math)',
      ts: Date.now() - 86400000 * 6
    },
    {
      id: 'LOG-003',
      actorId: 'ADM-ROOT',
      actorRole: 'admin',
      action: 'teacher_enrolled',
      targetId: 'TCH-2026-LANG',
      detail: 'Registered teacher Vikram Deshmukh (Grade 5 EVS & Social)',
      ts: Date.now() - 86400000 * 6
    },
    {
      id: 'LOG-004',
      actorId: 'TCH-2026-SCIE',
      actorRole: 'teacher',
      action: 'student_enrolled',
      targetId: 'SLV-2026-AARV',
      detail: 'Enrolled Aarav Shinde into Grade 6 Science & Math batch',
      ts: Date.now() - 86400000 * 5
    },
    {
      id: 'LOG-005',
      actorId: 'TCH-2026-SCIE',
      actorRole: 'teacher',
      action: 'assign_module',
      targetId: 'SLV-2026-AARV',
      detail: 'story: science-water assigned to Aarav Shinde',
      ts: Date.now() - 86400000
    },
    {
      id: 'LOG-006',
      actorId: 'TCH-2026-SCIE',
      actorRole: 'teacher',
      action: 'assign_module',
      targetId: 'SLV-2026-PRYA',
      detail: 'lab: acid-base assigned to Priya Sharma',
      ts: Date.now() - 86400000
    },
    {
      id: 'LOG-007',
      actorId: 'SLV-2026-AARV',
      actorRole: 'student',
      action: 'story_complete',
      targetId: 'science-plants',
      detail: 'Completed story: How Plants Eat Light (100% score)',
      ts: Date.now() - 86400000 * 2
    },
    {
      id: 'LOG-008',
      actorId: 'SLV-2026-PRYA',
      actorRole: 'student',
      action: 'lab_complete',
      targetId: 'salt-dissolving',
      detail: 'Completed virtual lab: Salt Dissolving and Saturation',
      ts: Date.now() - 86400000
    }
  ]
};

export async function seedDatabase() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectMongo();

  console.log('[Seed] Upserting demo accounts...');
  for (const acc of DEMO_DATA.accounts) {
    await Account.findOneAndUpdate({ id: acc.id }, acc, { upsert: true, returnDocument: 'after' });
  }

  console.log('[Seed] Upserting student progress records...');
  for (const prog of DEMO_DATA.progress) {
    await Progress.findOneAndUpdate({ studentId: prog.studentId }, prog, { upsert: true, returnDocument: 'after' });
  }

  console.log('[Seed] Upserting assignments...');
  for (const asn of DEMO_DATA.assignments) {
    await Assignment.findOneAndUpdate({ id: asn.id }, asn, { upsert: true, returnDocument: 'after' });
  }

  console.log('[Seed] Upserting teacher notes...');
  for (const note of DEMO_DATA.teacherNotes) {
    await TeacherNote.findOneAndUpdate({ id: note.id }, note, { upsert: true, returnDocument: 'after' });
  }

  console.log('[Seed] Upserting student sessions...');
  for (const ses of DEMO_DATA.sessions) {
    await Session.findOneAndUpdate({ id: ses.id }, ses, { upsert: true, returnDocument: 'after' });
  }

  console.log('[Seed] Upserting audit log entries...');
  for (const log of DEMO_DATA.auditLogs) {
    await AuditLog.findOneAndUpdate({ id: log.id }, log, { upsert: true, returnDocument: 'after' });
  }

  console.log('[Seed] ✓ All demo roles and records successfully interconnected in MongoDB!');
  return {
    accounts: DEMO_DATA.accounts.length,
    progress: DEMO_DATA.progress.length,
    assignments: DEMO_DATA.assignments.length,
    teacherNotes: DEMO_DATA.teacherNotes.length,
    sessions: DEMO_DATA.sessions.length,
    auditLogs: DEMO_DATA.auditLogs.length
  };
}

// If executed directly from command line (e.g. `npm run seed`)
if (process.argv[1] && process.argv[1].endsWith('seed.mjs')) {
  seedDatabase()
    .then(stats => {
      console.log('Seeding summary:', stats);
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
