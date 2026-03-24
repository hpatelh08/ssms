import mongoose from 'mongoose';

const StudentMarksSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  exam: { type: String, required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
});

export default mongoose.model('StudentMarks', StudentMarksSchema);
