import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String
  },
  session: {
    type: String, // e.g. 'morning', 'afternoon', 'full-day'
    default: 'full-day'
  },
  uniform: {
    type: Boolean,
    default: true
  },
  icard: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);