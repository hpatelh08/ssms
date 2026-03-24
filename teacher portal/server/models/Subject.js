import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    unique: true
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  credits: {
    type: Number,
    default: 3
  },
  syllabus: {
    type: String
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  duration: {
    type: String // e.g. 'Full Year', 'Semester 1', etc.
  }
}, {
  timestamps: true
});

export default mongoose.model('Subject', subjectSchema);