import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    default: 'Teacher'
  },
  createdByName: {
    type: String,
    default: 'Teacher'
  },
  recipients: {
    role: {
      type: String,
      enum: ['all', 'admin', 'teacher', 'student', 'parent', 'accountant']
    },
    specificClasses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  targetType: {
    type: String,
    enum: ['class', 'student', 'parent', 'all'],
    default: 'all'
  },
  targetClassId: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    path: String,
    originalName: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Announcement', announcementSchema);
