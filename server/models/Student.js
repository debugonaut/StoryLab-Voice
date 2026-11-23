const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    prn: {
      type: String,
      required: [true, 'Student PRN / Roll number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{12}$/, 'PRN must be a valid 12-digit student registration number']
    },
    name: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [5, 'Age must be between 5 and 18 for school programs'],
      max: [18, 'Age must be between 5 and 18 for school programs']
    },
    grade: {
      type: String,
      required: [true, 'Grade/Standard is required'],
      enum: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
    },
    preferredLanguage: {
      type: String,
      default: 'en-IN',
      enum: ['en-IN', 'mr-IN', 'hi-IN']
    },
    totalLearningMinutes: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Student', studentSchema);
