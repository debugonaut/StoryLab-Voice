const mongoose = require('mongoose');

class InMemoryStore {
  constructor() {
    this.collections = {
      students: new Map(),
      records: new Map(),
      stories: new Map(),
      labs: new Map()
    };
  }

  get(collectionName) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new Map();
    }
    return this.collections[collectionName];
  }
}

const memoryStore = new InMemoryStore();
let isMongoConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storylab_voice_db';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected to NoSQL Cluster: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[MongoDB Warning] Local MongoDB daemon not reachable at ${mongoURI}.`);
    console.log(`[MongoDB Fallback] Activated Built-in In-Memory NoSQL Document Store for zero-setup demo.`);
  }
};

module.exports = {
  connectDB,
  isMongoConnected: () => isMongoConnected,
  memoryStore
};
