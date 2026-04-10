import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent'],
    default: 'teacher',
  },
  senderName: {
    type: String,
    default: 'Teacher',
  },
  recipientType: {
    type: String,
    enum: ['student', 'class', 'parent'],
    required: true,
  },
  recipientStudentId: {
    type: String,
    default: '',
  },
  recipientParentId: {
    type: String,
    default: '',
  },
  recipientClassId: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
  division: {
    type: String,
    default: '',
  },
  subjectId: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  messageText: {
    type: String,
    required: true,
  },
  attachmentUrl: {
    type: String,
    default: '',
  },
  attachmentName: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

messageSchema.index({ recipientType: 1, recipientStudentId: 1, recipientParentId: 1, recipientClassId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
