import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
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
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate percentage and grade before saving
markSchema.pre('save', function(next) {
  if (this.marksObtained !== undefined && this.totalMarks !== undefined && this.totalMarks > 0) {
    this.percentage = parseFloat(((this.marksObtained / this.totalMarks) * 100).toFixed(2));
    
    // Calculate grade based on percentage
    if (this.percentage >= 90) {
      this.grade = 'A+';
    } else if (this.percentage >= 80) {
      this.grade = 'A';
    } else if (this.percentage >= 70) {
      this.grade = 'B+';
    } else if (this.percentage >= 60) {
      this.grade = 'B';
    } else if (this.percentage >= 50) {
      this.grade = 'C';
    } else if (this.percentage >= 40) {
      this.grade = 'D';
    } else {
      this.grade = 'F';
    }
  }
  next();
});

export default mongoose.model('Mark', markSchema);