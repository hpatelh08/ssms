import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  teacher_id: {
    type: String,
    required: true,
    index: true,
  },
  teacher_name: {
    type: String,
    required: true,
  },
  student_id: {
    type: String,
    required: true,
    index: true,
  },
  student_name: {
    type: String,
    required: true,
  },
  roll_number: {
    type: String,
    default: '',
  },
  standard: {
    type: String,
    default: '',
  },
  division: {
    type: String,
    default: '',
  },
  parent_id: {
    type: String,
    required: true,
    index: true,
  },
  meeting_type: {
    type: String,
    required: true,
  },
  meeting_date: {
    type: String,
    required: true,
  },
  meeting_time: {
    type: String,
    required: true,
  },
  meeting_purpose: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled',
    index: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

meetingSchema.index({ parent_id: 1, meeting_date: 1, meeting_time: 1 });
meetingSchema.index({ teacher_id: 1, meeting_date: 1, meeting_time: 1 });

export default mongoose.model('Meeting', meetingSchema);
