import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true // e.g. '2023-2024'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  termSessions: [{
    name: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('AcademicYear', academicYearSchema);