import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    unique: true
  },
  section: {
    type: String,
    required: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subjects: [{
    subjectName: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  academicYear: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String
  },
  capacity: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

export default mongoose.model('Class', classSchema);