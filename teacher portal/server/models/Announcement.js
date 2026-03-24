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