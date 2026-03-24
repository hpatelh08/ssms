import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
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
  dueDate: {
    type: Date,
    required: true
  },
  attachments: [{
    filename: String,
    path: String,
    originalName: String
  }],
  totalMarks: {
    type: Number,
    required: true
  },
  assignmentType: {
    type: String,
    enum: ['homework', 'project', 'quiz', 'exam'],
    default: 'homework'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Assignment', assignmentSchema);