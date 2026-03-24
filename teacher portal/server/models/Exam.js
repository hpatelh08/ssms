import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'mid_term', 'final_exam', 'quiz', 'practical'],
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: HH:MM
    required: true
  },
  endTime: {
    type: String, // Format: HH:MM
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

export default mongoose.model('Exam', examSchema);