const mongoose = require('mongoose');

const storySessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    studentPrn: { type: String, required: true },
    storyTitle: { type: String, required: true },
    currentNode: { type: String, required: true },
    decisionsHistory: [
      {
        nodeId: String,
        chosenOption: String,
        voiceConfidence: Number,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StorySession', storySessionSchema);
