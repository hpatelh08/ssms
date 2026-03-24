import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number
  },
  bloodGroup: {
    type: String
  },
  address: {
    type: String
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  className: {
    type: String
  },
  section: {
    type: String
  },
  fatherName: {
    type: String
  },
  motherName: {
    type: String
  },
  parentPhone: {
    type: String
  },
  parentEmail: {
    type: String
  },
  averagePercentage: {
    type: Number,
    default: 0
  },
  currentGPA: {
    type: Number,
    default: 0
  },
  improvementRate: {
    type: Number,
    default: 0
  },
  attendanceRate: {
    type: Number,
    default: 100
  },
  academicHistory: [{
    year: String,
    class: String,
    percentage: Number,
    gpa: Number,
    rank: Number
  }],
  behaviorRemarks: [{
    remark: String,
    type: String, // positive, negative, neutral
    date: {
      type: Date,
      default: Date.now
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  }],
  healthInfo: {
    type: String
  },
  allergies: {
    type: String
  },
  medicalHistory: {
    type: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  photo: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Student', studentSchema);
