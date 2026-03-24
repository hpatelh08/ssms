import express from 'express';
import { 
  getDashboard, 
  getClasses, 
  getClassDetails, 
  getAssignments, 
  createAssignment, 
  getExams, 
  createExam, 
  getStudentsInClass, 
  getStudyMaterials, 
  uploadStudyMaterial, 
  getAttendanceRecords, 
  markAttendance,
  getMarks,
  enterMarks,
  getLeaveApplications,
  applyForLeave,
  getPerformanceAnalytics
} from '../controllers/teacherController.js';
import { authenticate, isTeacher } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve('uploads/study-materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images, pdfs, videos, and common office documents
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-powerpoint' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.mimetype === 'text/plain'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Teacher dashboard
router.get('/dashboard', authenticate, isTeacher, getDashboard);

// Class management
router.get('/classes', authenticate, isTeacher, getClasses);
router.get('/classes/:classId', authenticate, isTeacher, getClassDetails);
router.get('/classes/:classId/students', authenticate, isTeacher, getStudentsInClass);

// Assignment management
router.get('/assignments', authenticate, isTeacher, getAssignments);
router.post('/assignments', authenticate, isTeacher, createAssignment);

// Exam management
router.get('/exams', authenticate, isTeacher, getExams);
router.post('/exams', authenticate, isTeacher, createExam);

// Study materials
router.get('/study-materials', authenticate, isTeacher, getStudyMaterials);
router.post('/study-materials', authenticate, isTeacher, upload.single('file'), uploadStudyMaterial);

// Attendance management
router.get('/attendance', authenticate, isTeacher, getAttendanceRecords);
router.post('/attendance', authenticate, isTeacher, markAttendance);

// Marks management
router.get('/marks', authenticate, isTeacher, getMarks);
router.post('/marks', authenticate, isTeacher, enterMarks);

// Leave management
router.get('/leaves', authenticate, isTeacher, getLeaveApplications);
router.post('/leaves', authenticate, isTeacher, applyForLeave);

// Performance analytics
router.get('/analytics', authenticate, isTeacher, getPerformanceAnalytics);

export default router;