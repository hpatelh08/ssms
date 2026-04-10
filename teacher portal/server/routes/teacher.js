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
import { verifyToken } from '../utils/jwt.js';
import { findTeacherByIdentifier, getTeacherAssignedStudents } from '../utils/adminTeacherAuth.js';
import { getAdminTeacherTimetable } from '../utils/adminTimetable.js';

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

function getBearerToken(req) {
  const header = req.header('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function resolveTeacherFromRequest(req) {
  const token = getBearerToken(req);
  const fallbackTeacherId = String(req.header('X-Teacher-Id') || req.query?.teacherId || '').trim();
  const fallbackEmail = String(req.header('X-Teacher-Email') || '').trim();
  const fallbackName = String(req.header('X-Teacher-Name') || '').trim();
  const fallbackTeacher = fallbackTeacherId || fallbackEmail || fallbackName;

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded?.role === 'teacher') {
        const teacher = findTeacherByIdentifier(decoded.userId);
        if (teacher) return teacher;
      }
    } catch {
      // ignore and fall back to request headers
    }
  }

  return fallbackTeacher ? findTeacherByIdentifier(fallbackTeacher) : null;
}

function authenticateAdminTeacher(req, res, next) {
  try {
    const teacher = resolveTeacherFromRequest(req);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired teacher session.' });
  }
}

router.get('/my-profile', authenticateAdminTeacher, (req, res) => {
  return res.json({
    success: true,
    data: {
      ...req.teacher,
      assignedClass: req.teacher.assignedClass || req.teacher.classTeacherStd || '',
      division: req.teacher.division || req.teacher.classTeacherDiv || '',
    }
  });
});

router.get('/my-students', authenticateAdminTeacher, (req, res) => {
  const teacher = req.teacher;
  const assignedClass = String(teacher?.classTeacherStd || teacher?.assignedClass || '').trim();
  const assignedDivision = String(teacher?.classTeacherDiv || teacher?.division || '').trim().toUpperCase();

  if (!assignedClass || !assignedDivision) {
    return res.json({
      success: true,
      data: [],
      teacher,
      message: 'No class assigned.'
    });
  }

  const students = getTeacherAssignedStudents(teacher);
  return res.json({
    success: true,
    data: students,
    teacher: {
      ...teacher,
      assignedClass,
      division: assignedDivision,
    },
    class: {
      standard: assignedClass,
      division: assignedDivision,
      classLabel: `${assignedClass}${assignedDivision}`,
    }
  });
});

// GET /api/teacher/timetable (auth required)
router.get('/timetable', authenticateAdminTeacher, (req, res) => {
  try {
    const teacherName = String(req.teacher?.name || '').trim();
    const timetable = getAdminTeacherTimetable(teacherName);
    if (timetable.error) {
      return res.status(400).json({ success: false, error: timetable.error });
    }
    return res.json({ success: true, data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load teacher timetable.', details: error.message });
  }
});

// GET /api/teacher/timetable-public?teacherId=...&teacher=...
router.get('/timetable-public', (req, res) => {
  try {
    const token = getBearerToken(req);
    let teacherName = '';

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded?.role === 'teacher') {
          const teacher = findTeacherByIdentifier(decoded.userId);
          teacherName = String(teacher?.name || '').trim();
        }
      } catch {
        // Ignore token errors and fall back to query params.
      }
    }

    if (!teacherName) {
      const teacherId = String(req.query.teacherId || '').trim();
      const teacherRaw = String(req.query.teacher || '').trim();
      if (teacherId) {
        const teacher = findTeacherByIdentifier(teacherId);
        teacherName = String(teacher?.name || '').trim();
      }
      if (!teacherName && teacherRaw) teacherName = teacherRaw;
    }

    if (!teacherName) {
      return res.status(400).json({ success: false, error: 'Teacher name is required.' });
    }

    const timetable = getAdminTeacherTimetable(teacherName);
    if (timetable.error) {
      return res.status(400).json({ success: false, error: timetable.error });
    }
    return res.json({ success: true, data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load teacher timetable.', details: error.message });
  }
});

// Teacher dashboard
router.get('/dashboard', authenticate, isTeacher, getDashboard);

// Class management
router.get('/classes', authenticate, isTeacher, getClasses);
router.get('/classes/:classId', authenticate, isTeacher, getClassDetails);
router.get('/classes/:classId/students', authenticate, isTeacher, getStudentsInClass);

// Assignment management
router.get('/assignments', authenticate, isTeacher, getAssignments);
router.post('/assignments', authenticate, isTeacher, upload.single('file'), createAssignment);

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
