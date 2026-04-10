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
  standard: {
    type: String,
    required: true
  },
  division: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
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
  uploadedByTeacherId: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  attachment: {
    filename: String,
    path: String,
    originalName: String,
    size: Number,
    mimetype: String
  },
  attachments: [{
    filename: String,
    path: String,
    originalName: String,
    size: Number,
    mimetype: String
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
