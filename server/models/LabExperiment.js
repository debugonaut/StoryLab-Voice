const mongoose = require('mongoose');

const labExperimentSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, unique: true },
    experimentTitle: { type: String, required: true },
    apparatusUsed: [{ type: String }],
    reactionsObserved: [
      {
        chemicalA: String,
        chemicalB: String,
        result: String,
        colorChange: String,
        temperatureDelta: Number
      }
    ],
    safetyQuizPassed: { type: Boolean, default: false },
    studentPrn: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabExperiment', labExperimentSchema);
