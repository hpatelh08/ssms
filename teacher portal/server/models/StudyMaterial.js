import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
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
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materialType: {
    type: String,
    enum: ['pdf', 'video', 'image', 'document', 'link'],
    required: true
  },
  file: {
    filename: String,
    path: String,
    originalName: String,
    size: Number // Size in bytes
  },
  url: {
    type: String // For external links
  },
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('StudyMaterial', studyMaterialSchema);