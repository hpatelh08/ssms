import User from '../models/User.js';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Exam from '../models/Exam.js';
import Attendance from '../models/Attendance.js';
import Mark from '../models/Mark.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Announcement from '../models/Announcement.js';
import LeaveApplication from '../models/LeaveApplication.js';
import Subject from '../models/Subject.js';
import { isTeacher } from '../middleware/auth.js';
import { findAdminStudentByAnyIdentifier, findAdminStudentById } from '../utils/adminClassroom.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const adminDbPath = path.join(__dirname, '..', '..', '..', 'Admin Dashboard', 'backend', 'database.sqlite');
const BetterSqlite3 = require(path.join(__dirname, '..', '..', '..', 'Admin Dashboard', 'backend', 'node_modules', 'better-sqlite3'));
const { upsertExamRecord } = require(path.join(__dirname, '..', '..', '..', 'shared', 'examSync.js'));
let adminDb = null;
const fallbackDataDir = path.join(__dirname, '..', 'data');
const fallbackAssignmentsFile = path.join(fallbackDataDir, 'fallback-assignments.json');
const fallbackStudyMaterialsFile = path.join(fallbackDataDir, 'fallback-study-materials.json');

function getAdminDb() {
  if (!adminDb) {
    adminDb = new BetterSqlite3(adminDbPath, { readonly: false, fileMustExist: true });
  }
  return adminDb;
}

function extractStandard(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

function normalizeDivision(value) {
  return String(value || '').trim().toUpperCase();
}

function formatDateForSync(dateValue) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatClassLabel(classDoc, fallbackClassId = '') {
  if (!classDoc) {
    const fallbackStd = extractStandard(fallbackClassId);
    return fallbackStd || String(fallbackClassId || '').trim();
  }
  const className = String(classDoc.className || '').trim();
  const section = String(classDoc.section || '').trim().toUpperCase();
  const digits = String(className || '').match(/\d+/)?.[0] || '';
  return digits || className || String(fallbackClassId || '').trim();
}

function serializeExamForAdminSync(exam, classLabelFallback = '', subjectNameFallback = '') {
  return {
    id: String(exam?._id || exam?.id || '').trim(),
    name: String(exam?.examName || exam?.name || 'Exam').trim(),
    class: formatClassLabel(exam?.class, classLabelFallback),
    subject: String(exam?.subject?.subjectName || exam?.subject || subjectNameFallback || '').trim(),
    date: formatDateForSync(exam?.date),
    duration: `${String(exam?.startTime || '').trim()} - ${String(exam?.endTime || '').trim()}`.trim(),
    maxMarks: Number(exam?.totalMarks || exam?.maxMarks || 100) || 100,
    status: 'Scheduled',
    examType: String(exam?.examType || '').trim(),
    startTime: String(exam?.startTime || '').trim(),
    endTime: String(exam?.endTime || '').trim(),
    passingMarks: Number(exam?.passingMarks || 0) || 0,
    description: String(exam?.description || '').trim(),
    teacherId: String(exam?.teacher || exam?.teacherId || '').trim(),
    source: 'teacher-portal',
  };
}

function syncExamToAdminDb(examRecord) {
  const db = getAdminDb();
  const record = serializeExamForAdminSync(examRecord);
  if (!record.id) return;

  const stmt = db.prepare(`
    INSERT INTO exams (id, name, class, subject, date, duration, max_marks, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      class = excluded.class,
      subject = excluded.subject,
      date = excluded.date,
      duration = excluded.duration,
      max_marks = excluded.max_marks,
      status = excluded.status
  `);

  stmt.run(
    record.id,
    record.name,
    String(record.class || '').trim(),
    String(record.subject || '').trim(),
    record.date,
    record.duration,
    Number(record.maxMarks || 100) || 100,
    String(record.status || 'Scheduled').trim(),
  );
}

function getTeacherIdentifier(req) {
  return String(req.user?.teacherId || req.user?.teacher_id || req.user?._id || '').trim();
}

function buildFileMeta(file) {
  if (!file) return null;
  return {
    filename: file.filename || '',
    path: file.path || '',
    originalName: file.originalname || file.originalName || '',
    size: file.size || 0,
    mimetype: file.mimetype || ''
  };
}

function ensureFallbackDataDir() {
  if (!fs.existsSync(fallbackDataDir)) {
    fs.mkdirSync(fallbackDataDir, { recursive: true });
  }
}

function readFallbackJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackJson(filePath, data) {
  ensureFallbackDataDir();
  fs.writeFileSync(filePath, `${JSON.stringify(Array.isArray(data) ? data : [], null, 2)}\n`, 'utf8');
}

function loadFallbackAssignments() {
  return readFallbackJson(fallbackAssignmentsFile);
}

function saveFallbackAssignments(items) {
  writeFallbackJson(fallbackAssignmentsFile, items);
}

function loadFallbackStudyMaterials() {
  return readFallbackJson(fallbackStudyMaterialsFile);
}

function saveFallbackStudyMaterials(items) {
  writeFallbackJson(fallbackStudyMaterialsFile, items);
}

function normalizeRecordClassLabel(record) {
  const classDoc = record?.class && typeof record.class === 'object' ? record.class : null;
  const className = String(record?.standard || classDoc?.className || record?.className || '').trim();
  const division = String(record?.division || classDoc?.section || record?.section || '').trim().toUpperCase();
  return {
    standard: String(record?.standard || className || '').replace(/[^\d]/g, '') || className,
    division,
  };
}

function matchesChildClass(record, childContext) {
  if (!record || !childContext) return false;
  const { standard, division } = normalizeRecordClassLabel(record);
  if (!standard || !division) return false;
  return String(standard) === String(childContext.standard) && String(division).toUpperCase() === String(childContext.division).toUpperCase();
}

function mergeById(primary = [], secondary = []) {
  const map = new Map();
  [...primary, ...secondary].forEach((item) => {
    const id = String(item?._id || item?.id || '');
    if (!id) return;
    map.set(id, item);
  });
  return Array.from(map.values());
}

function sortByCreatedAtDesc(items = []) {
  return [...items].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
}

function normalizeSubjectPayload(subject, subjectNameFallback = '') {
  const subjectId = String(subject?._id || subject?.id || subject || '').trim();
  if (!subject) {
    return {
      _id: '',
      subjectName: subjectNameFallback || 'N/A'
    };
  }

  if (typeof subject === 'object') {
    return {
      _id: subjectId,
      subjectName: String(subject.subjectName || subject.name || subjectNameFallback || 'N/A')
    };
  }

  return {
    _id: subjectId,
    subjectName: String(subjectNameFallback || subjectId || 'N/A')
  };
}

function normalizeClassPayload(classContext, fallbackClass = null) {
  const classDoc = classContext?.classData || fallbackClass || null;
  if (!classDoc) {
    return null;
  }

  const standard = String(classContext?.standard || classDoc?.className || classDoc?.standard || '').trim();
  const division = String(classContext?.division || classDoc?.section || classDoc?.division || '').trim().toUpperCase();

  return {
    _id: String(classDoc._id || classDoc.id || classDoc || ''),
    className: standard,
    section: division
  };
}

async function resolveSubjectPayload(subjectId) {
  const fallback = normalizeSubjectPayload(subjectId, subjectId);
  if (!subjectId || mongoose.connection.readyState !== 1) {
    return fallback;
  }

  try {
    const subjectDoc = await Subject.findById(subjectId).select('_id subjectName');
    if (!subjectDoc) return fallback;
    return normalizeSubjectPayload(subjectDoc);
  } catch {
    return fallback;
  }
}

function normalizeAssignmentRecord(record) {
  const plain = record?.toObject ? record.toObject() : { ...record };
  const attachment = plain.attachment || plain.attachments?.[0] || null;
  const classValue = normalizeClassPayload({
    classData: plain.class,
    standard: plain.standard,
    division: plain.division
  }, plain.class);
  const subjectValue = normalizeSubjectPayload(plain.subject, plain.subject?.subjectName);
  return {
    ...plain,
    class: classValue || plain.class,
    subject: subjectValue || plain.subject,
    attachment,
    attachments: Array.isArray(plain.attachments) && plain.attachments.length > 0
      ? plain.attachments
      : attachment
        ? [attachment]
        : [],
  };
}

function normalizeStudyMaterialRecord(record) {
  const plain = record?.toObject ? record.toObject() : { ...record };
  const classValue = normalizeClassPayload({
    classData: plain.class,
    standard: plain.standard,
    division: plain.division
  }, plain.class);
  const subjectValue = normalizeSubjectPayload(plain.subject, plain.subject?.subjectName);
  return {
    ...plain,
    class: classValue || plain.class,
    subject: subjectValue || plain.subject,
    fileUrl: plain.url || plain.file?.path || '',
  };
}

function persistFallbackAssignment(record) {
  const current = loadFallbackAssignments();
  const next = mergeById([normalizeAssignmentRecord(record)], current);
  saveFallbackAssignments(sortByCreatedAtDesc(next));
}

function persistFallbackStudyMaterial(record) {
  const current = loadFallbackStudyMaterials();
  const next = mergeById([normalizeStudyMaterialRecord(record)], current);
  saveFallbackStudyMaterials(sortByCreatedAtDesc(next));
}

function queryFallbackAssignments({ teacherId = '', classId = '', subjectId = '' } = {}) {
  let items = loadFallbackAssignments();
  if (teacherId) {
    items = items.filter((item) => String(item.teacher || '') === String(teacherId));
  }
  if (classId) {
    items = items.filter((item) => String(item.class?._id || item.class || '') === String(classId));
  }
  if (subjectId) {
    items = items.filter((item) => String(item.subject?._id || item.subject || '') === String(subjectId));
  }
  return sortByCreatedAtDesc(items);
}

function queryFallbackStudyMaterials({ teacherId = '', classId = '', subjectId = '' } = {}) {
  let items = loadFallbackStudyMaterials();
  if (teacherId) {
    items = items.filter((item) => String(item.teacher || '') === String(teacherId));
  }
  if (classId) {
    items = items.filter((item) => String(item.class?._id || item.class || '') === String(classId));
  }
  if (subjectId) {
    items = items.filter((item) => String(item.subject?._id || item.subject || '') === String(subjectId));
  }
  return sortByCreatedAtDesc(items);
}

async function resolveClassContextById(classId) {
  if (!classId) return null;
  let classData = null;
  if (mongoose.connection.readyState === 1) {
    try {
      classData = await Class.findById(classId).select('_id className section');
    } catch {
      classData = null;
    }
  }

  if (!classData) {
    const fallbackClassName = String(classId || '').trim();
    const parsed = fallbackClassName.match(/(?:admin-class-|teacher-class-)?(\d+)(?:[-_ ]*([A-Za-z]))?/i);
    const standard = parsed ? String(parseInt(parsed[1], 10)) : extractStandard(fallbackClassName);
    const division = normalizeDivision(parsed?.[2] || '');
    if (!standard) return null;
    return {
      classData: {
        _id: String(classId),
        className: fallbackClassName,
        section: division,
      },
      standard,
      division,
    };
  }

  const standard = extractStandard(classData.className);
  const division = normalizeDivision(classData.section);
  if (!standard || !division) return null;

  return {
    classData,
    standard,
    division,
  };
}

function buildCandidateIdentifiers(studentId, aliases = '') {
  return [
    studentId,
    ...String(aliases || '').split(','),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

async function resolveParentChildContext(studentId, accessKey, aliases = '') {
  const candidates = buildCandidateIdentifiers(studentId, aliases);
  const student =
    candidates.map((value) => findAdminStudentByAnyIdentifier(value)).find(Boolean) ||
    findAdminStudentById(studentId);
  if (!student) {
    return { error: 'Student not found.' };
  }

  const storedAccessKey = String(student.parentAccessKey || '').trim();
  const providedAccessKey = String(accessKey || '').trim();
  if (storedAccessKey && providedAccessKey !== storedAccessKey) {
    return { error: 'Invalid parent access key.' };
  }

  const standard = extractStandard(student.className || student.class || student.grade || '');
  const division = normalizeDivision(student.section || student.division || '');

  if (!standard || !division) {
    return { error: 'Child class information is unavailable.' };
  }

  return {
    student,
    standard,
    division,
  };
}

function serializeAssignmentRecord(record) {
  return normalizeAssignmentRecord(record);
}

function serializeStudyMaterialRecord(record) {
  return normalizeStudyMaterialRecord(record);
}

function mapAttendanceStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'present' || normalized === 'p') return 'P';
  if (normalized === 'absent' || normalized === 'a') return 'A';
  if (normalized === 'leave' || normalized === 'l') return 'L';
  return 'P';
}

function syncAttendanceToAdminDb({ classData, date, attendanceData, teacherId }) {
  const db = getAdminDb();
  const upsert = db.prepare(`
    INSERT INTO attendance (person_id, person_type, date, status, class, section, subject)
    VALUES (?, 'student', ?, ?, ?, ?, ?)
    ON CONFLICT(person_id, person_type, date) DO UPDATE SET
      status = excluded.status,
      class = excluded.class,
      section = excluded.section,
      subject = excluded.subject
  `);

  const classLabel = String(classData?.className || classData?.class || '').trim();
  const standard = extractStandard(classLabel || classData?.grade || classData?.standard || '');
  const section = String(classData?.section || classData?.division || '').trim().toUpperCase();

  db.transaction((records) => {
    for (const record of records) {
      const studentPersonId = String(record.studentCode || record.student_id || record.studentId || '').trim();
      if (!studentPersonId) continue;
      upsert.run(
        studentPersonId,
        date,
        mapAttendanceStatus(record.status),
        standard || classLabel,
        section,
        null
      );
    }
  })(Array.isArray(attendanceData) ? attendanceData : []);
}

// Get teacher dashboard data
export const getDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get teacher's assigned classes
    const assignedClasses = await Class.find({ classTeacher: teacherId }).populate('subjects');

    // Calculate total students
    let totalStudents = 0;
    assignedClasses.forEach(cls => {
      totalStudents += cls.students.length;
    });

    // Get today's classes (for the teacher's assigned classes)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock today's classes - in a real app, this would come from a timetable system
    const todaysClasses = assignedClasses.map(cls => ({
      className: cls.className,
      section: cls.section,
      subject: cls.subjects[0]?.subjectName || 'General',
      time: '09:00 - 10:00', // This would come from timetable
      room: cls.roomNumber || 'N/A'
    }));

    // Get pending assignments to grade
    const pendingAssignments = await Assignment.countDocuments({
      teacher: teacherId,
      status: 'active',
      dueDate: { $lt: new Date() }
    });

    // Get upcoming exams
    const upcomingExams = await Exam.find({
      teacher: teacherId,
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5);

    // Format upcoming exams for dashboard
    const formattedUpcomingExams = upcomingExams.map(exam => ({
      name: exam.examName,
      date: new Date(exam.date).toLocaleDateString(),
      time: exam.startTime,
      className: exam.class?.className,
      section: exam.class?.section
    }));

    // Get recent announcements
    const recentAnnouncements = await Announcement.find({
      $or: [
        { createdBy: teacherId },
        { 'recipients.specificUsers': { $in: [teacherId] } },
        { 'recipients.role': 'teacher' },
        { 'recipients.role': 'all' },
      ],
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ createdAt: -1 }).limit(5);

    // Format announcements
    const formattedAnnouncements = recentAnnouncements.map(announcement => ({
      title: announcement.title,
      content: announcement.content,
      date: new Date(announcement.createdAt).toLocaleDateString(),
      author: announcement.senderName || announcement.createdByName || announcement.sender?.name || 'Admin'
    }));

    // Get student performance summary
    const marks = await Mark.find({ teacher: teacherId }).populate('student', 'name');

    // Calculate average performance
    let totalPercentage = 0;
    marks.forEach(mark => {
      totalPercentage += mark.percentage || 0;
    });
    const avgPerformance = marks.length > 0 ? Math.round(totalPercentage / marks.length) : 0;

    // Calculate performance by subject
    const subjectPerformance = {};
    marks.forEach(mark => {
      const subjectName = mark.subject?.subjectName;
      if (subjectName) {
        if (!subjectPerformance[subjectName]) {
          subjectPerformance[subjectName] = { total: 0, count: 0 };
        }
        subjectPerformance[subjectName].total += mark.percentage || 0;
        subjectPerformance[subjectName].count++;
      }
    });

    const formattedSubjectPerformance = Object.keys(subjectPerformance).map(subject => {
      const avg = Math.round(subjectPerformance[subject].total / subjectPerformance[subject].count);
      return { name: subject, average: avg };
    });

    const performanceSummary = {
      overallAverage: avgPerformance,
      subjects: formattedSubjectPerformance
    };

    // Get pending tasks
    const pendingTasksList = [
      { title: 'Grade Assignment 1', description: 'Mathematics assignment submissions', deadline: 'Today' },
      { title: 'Take Attendance', description: 'Class 8A attendance for today', deadline: 'Today' },
      { title: 'Prepare Lesson Plan', description: 'Chapter 5 science lesson plan', deadline: 'Tomorrow' },
    ];

    // Get birthday alerts (mock data)
    const birthdays = [
      { studentName: 'Rahul Sharma', class: '8', section: 'A', date: 'Feb 25' },
      { studentName: 'Priya Patel', class: '9', section: 'B', date: 'Feb 25' },
    ];

    // Get substitution classes (mock data - in a real app this would come from a substitution management system)
    const substitutionClasses = [
      {
        className: '9',
        section: 'A',
        subject: 'Mathematics',
        originalTeacher: 'Mr. Johnson',
        date: 'Feb 25, 2024',
        time: '10:00 - 11:00'
      },
      {
        className: '10',
        section: 'B',
        subject: 'Science',
        originalTeacher: 'Ms. Williams',
        date: 'Feb 25, 2024',
        time: '11:30 - 12:30'
      },
    ];

    res.json({
      success: true,
      data: {
        teacherName: req.user.name,
        totalStudents,
        classesToday: assignedClasses.length,
        pendingTasks: pendingTasksList.length,
        avgPerformance,
        todaysClasses,
        pendingTasksList,
        announcements: formattedAnnouncements,
        performanceSummary,
        upcomingExams: formattedUpcomingExams,
        birthdays,
        substitutionClasses
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get teacher's classes
export const getClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const classes = await Class.find({ classTeacher: teacherId })
      .populate('students', 'name email')
      .populate('subjects.teacher', 'name email');

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get class details
export const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId)
      .populate('students', 'name email')
      .populate('subjects.teacher', 'name email');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignments for teacher
export const getAssignments = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId, status } = req.query;

    const filter = { teacher: teacherId };
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (status) filter.status = status;

    let assignments = [];
    if (mongoose.connection.readyState === 1) {
      assignments = await Assignment.find(filter)
        .populate('class', 'className section')
        .populate('subject', 'subjectName')
        .sort({ dueDate: -1 });
    }

    const fallbackAssignments = queryFallbackAssignments({
      teacherId,
      classId,
      subjectId
    });

    const mergedAssignments = mergeById(
      assignments.map(serializeAssignmentRecord),
      fallbackAssignments
    );

    res.json({
      success: true,
      data: sortByCreatedAtDesc(mergedAssignments)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, class: classId, dueDate, totalMarks, assignmentType } = req.body;
    const classContext = await resolveClassContextById(classId);
    const subjectContext = await resolveSubjectPayload(subject);

    if (!classContext) {
      return res.status(400).json({ error: 'Valid class is required.' });
    }

    const createdAt = new Date();
    const uploadedByTeacherId = getTeacherIdentifier(req);
    const fileMeta = buildFileMeta(req.file);
    const fallbackRecord = {
      _id: `FB_ASG_${Date.now()}`,
      title,
      description,
      subject: subjectContext,
      class: normalizeClassPayload(classContext),
      standard: classContext.standard,
      division: classContext.division,
      teacher: req.user._id,
      uploadedByTeacherId,
      dueDate,
      totalMarks,
      assignmentType,
      attachment: fileMeta || undefined,
      attachments: fileMeta ? [fileMeta] : [],
      status: 'active',
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      fallbackMode: true
    };

    const assignment = new Assignment({
      title,
      description,
      subject,
      class: classContext.classData._id,
      standard: classContext.standard,
      division: classContext.division,
      teacher: req.user._id,
      uploadedByTeacherId,
      dueDate,
      totalMarks,
      assignmentType,
      attachment: fileMeta || undefined,
      attachments: fileMeta ? [fileMeta] : []
    });

    if (mongoose.connection.readyState === 1) {
      try {
        await assignment.save();
        await assignment.populate([
          { path: 'class', select: 'className section' },
          { path: 'subject', select: 'subjectName' }
        ]);
        const savedRecord = serializeAssignmentRecord(assignment);
        persistFallbackAssignment(savedRecord);

        return res.status(201).json({
          success: true,
          data: savedRecord
        });
      } catch (saveError) {
        const message = String(saveError?.message || '').toLowerCase();
        const isConnectivityIssue =
          mongoose.connection.readyState !== 1 ||
          message.includes('buffering timed out') ||
          message.includes('econnrefused') ||
          message.includes('server selection') ||
          message.includes('topology') ||
          message.includes('mongo');

        if (!isConnectivityIssue) {
          throw saveError;
        }
      }
    }

    persistFallbackAssignment(fallbackRecord);

    res.status(201).json({
      success: true,
      data: fallbackRecord,
      message: 'Stored in fallback mode because MongoDB is not connected.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get exams for teacher
export const getExams = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId } = req.query;

    let filter = { teacher: teacherId };
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;

    const exams = await Exam.find(filter)
      .populate('class', 'className section')
      .populate('subject', 'subjectName')
      .sort({ date: -1 });

    exams.forEach((exam) => {
      upsertExamRecord(serializeExamForAdminSync(exam));
      syncExamToAdminDb(exam);
    });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create exam
export const createExam = async (req, res) => {
  try {
    const { examName, examType, subject, class: classId, date, startTime, endTime, totalMarks, passingMarks, description } = req.body;
    const [classDoc, subjectDoc] = await Promise.all([
      Class.findById(classId).select('className section'),
      Subject.findById(subject).select('subjectName'),
    ]);

    const exam = new Exam({
      examName,
      examType,
      subject,
      class: classId,
      teacher: req.user._id,
      date,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      description
    });

    await exam.save();
    const examPayload = {
      ...exam.toObject(),
      class: classDoc,
      subject: subjectDoc,
    };
    upsertExamRecord(serializeExamForAdminSync(examPayload, classId, subjectDoc?.subjectName || subject));
    syncExamToAdminDb(examPayload);

    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get students in class
export const getStudentsInClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId).populate('students', 'name email phone address');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      success: true,
      data: classData.students
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get study materials
export const getStudyMaterials = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId } = req.query;

    const filter = { teacher: teacherId };
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;

    let materials = [];
    if (mongoose.connection.readyState === 1) {
      materials = await StudyMaterial.find(filter)
        .populate('class', 'className section')
        .populate('subject', 'subjectName')
        .sort({ createdAt: -1 });
    }

    const fallbackMaterials = queryFallbackStudyMaterials({
      teacherId,
      classId,
      subjectId
    });

    const mergedMaterials = mergeById(
      materials.map(serializeStudyMaterialRecord),
      fallbackMaterials
    );

    res.json({
      success: true,
      data: sortByCreatedAtDesc(mergedMaterials)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload study material
export const uploadStudyMaterial = async (req, res) => {
  try {
    const { title, description, subject, class: classId, materialType, url } = req.body;
    const classContext = await resolveClassContextById(classId);
    const subjectContext = await resolveSubjectPayload(subject);

    if (materialType === 'link' && !url) {
      return res.status(400).json({ error: 'URL is required for link type material' });
    }

    if (materialType !== 'link' && !req.file) {
      return res.status(400).json({ error: 'File is required for this material type' });
    }

    if (!classContext) {
      return res.status(400).json({ error: 'Valid class is required.' });
    }

    const createdAt = new Date();
    const uploadedByTeacherId = getTeacherIdentifier(req);
    const fallbackMaterial = {
      _id: `FB_MAT_${Date.now()}`,
      title,
      description,
      teacher: req.user._id,
      uploadedByTeacherId,
      materialType,
      class: normalizeClassPayload(classContext),
      standard: classContext.standard,
      division: classContext.division,
      subject: subjectContext,
      url: materialType === 'link' ? url : '',
      file: req.file
        ? {
          filename: req.file.filename,
          path: req.file.path,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
        : undefined,
      downloadCount: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      fallbackMode: true
    };

    if (mongoose.connection.readyState !== 1) {
      persistFallbackStudyMaterial(fallbackMaterial);

      return res.status(201).json({
        success: true,
        data: fallbackMaterial,
        message: 'Stored in fallback mode because MongoDB is not connected.'
      });
    }

    const material = new StudyMaterial({
      title,
      description,
      subject,
      class: classContext.classData._id,
      standard: classContext.standard,
      division: classContext.division,
      teacher: req.user._id,
      uploadedByTeacherId,
      materialType,
      url: materialType === 'link' ? url : undefined,
      file: {
        filename: req.file?.filename,
        path: req.file?.path,
        originalName: req.file?.originalname,
        size: req.file?.size,
        mimetype: req.file?.mimetype
      }
    });

    try {
      await material.save();
      await material.populate([
        { path: 'class', select: 'className section' },
        { path: 'subject', select: 'subjectName' }
      ]);
      const savedRecord = serializeStudyMaterialRecord(material);
      persistFallbackStudyMaterial(savedRecord);

      return res.status(201).json({
        success: true,
        data: savedRecord
      });
    } catch (saveError) {
      const message = String(saveError?.message || '').toLowerCase();
      const isConnectivityIssue =
        mongoose.connection.readyState !== 1 ||
        message.includes('buffering timed out') ||
        message.includes('econnrefused') ||
        message.includes('server selection') ||
        message.includes('topology') ||
        message.includes('mongo');

      if (!isConnectivityIssue) {
        throw saveError;
      }

      persistFallbackStudyMaterial(fallbackMaterial);

      return res.status(201).json({
        success: true,
        data: fallbackMaterial,
        message: 'Stored in fallback mode because MongoDB is not connected.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getParentChildAssignments = async (req, res) => {
  try {
    const studentId = String(req.query.studentId || req.body?.studentId || '').trim();
    const accessKey = String(req.query.accessKey || req.body?.accessKey || '').trim();
    const aliases = String(req.query.aliases || req.body?.aliases || '').trim();
    if (!studentId || !accessKey) {
      return res.status(400).json({ success: false, error: 'Student ID and access key are required.' });
    }

    const childContext = await resolveParentChildContext(studentId, accessKey, aliases);
    if (childContext.error) {
      return res.status(401).json({ success: false, error: childContext.error });
    }

    const classDoc = mongoose.connection.readyState === 1
      ? await Class.findOne({
        className: childContext.standard,
        section: childContext.division
      }).select('_id className section')
      : null;

    const query = {
      $or: [
        { standard: childContext.standard, division: childContext.division },
      ],
    };

    if (classDoc?._id) {
      query.$or.push({ class: classDoc._id });
    }

    let assignments = [];
    if (mongoose.connection.readyState === 1) {
      assignments = await Assignment.find(query)
        .populate('class', 'className section')
        .populate('subject', 'subjectName')
        .sort({ createdAt: -1, dueDate: -1 });
    }

    const fallbackAssignments = queryFallbackAssignments();
    const classAssignments = mergeById(
      assignments.map(serializeAssignmentRecord),
      fallbackAssignments
    ).filter((record) => matchesChildClass(record, childContext));

    return res.json({
      success: true,
      data: sortByCreatedAtDesc(classAssignments),
      child: {
        standard: childContext.standard,
        division: childContext.division,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getParentChildStudyMaterials = async (req, res) => {
  try {
    const studentId = String(req.query.studentId || req.body?.studentId || '').trim();
    const accessKey = String(req.query.accessKey || req.body?.accessKey || '').trim();
    const aliases = String(req.query.aliases || req.body?.aliases || '').trim();
    if (!studentId || !accessKey) {
      return res.status(400).json({ success: false, error: 'Student ID and access key are required.' });
    }

    const childContext = await resolveParentChildContext(studentId, accessKey, aliases);
    if (childContext.error) {
      return res.status(401).json({ success: false, error: childContext.error });
    }

    const classDoc = mongoose.connection.readyState === 1
      ? await Class.findOne({
        className: childContext.standard,
        section: childContext.division
      }).select('_id className section')
      : null;

    const query = {
      $or: [
        { standard: childContext.standard, division: childContext.division },
      ],
    };

    if (classDoc?._id) {
      query.$or.push({ class: classDoc._id });
    }

    let studyMaterials = [];
    if (mongoose.connection.readyState === 1) {
      studyMaterials = await StudyMaterial.find(query)
        .populate('class', 'className section')
        .populate('subject', 'subjectName')
        .sort({ createdAt: -1 });
    }

    const fallbackMaterials = queryFallbackStudyMaterials();
    const classMaterials = mergeById(
      studyMaterials.map(serializeStudyMaterialRecord),
      fallbackMaterials
    ).filter((record) => matchesChildClass(record, childContext));

    return res.json({
      success: true,
      data: sortByCreatedAtDesc(classMaterials),
      child: {
        standard: childContext.standard,
        division: childContext.division,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get attendance records for class
export const getAttendanceRecords = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const teacherId = req.user._id;

    let filter = { class: classId, teacher: teacherId };
    if (date) {
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = { $gte: dateObj, $lt: nextDay };
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('subject', 'subjectName');

    res.json({
      success: true,
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;
    const teacherId = req.user._id;

    // Validate class belongs to teacher
    const classData = await Class.findOne({ _id: classId, classTeacher: teacherId });
    if (!classData) {
      return res.status(403).json({ error: 'Unauthorized to mark attendance for this class' });
    }

    // Process attendance data
    const results = [];
    for (const record of attendanceData) {
      const { studentId, status, subject, remarks } = record;

      // Check if attendance already exists for this student on this date
      let attendance = await Attendance.findOne({
        student: studentId,
        date: new Date(date),
        class: classId
      });

      if (attendance) {
        // Update existing attendance
        attendance.status = status;
        attendance.subject = subject;
        attendance.remarks = remarks;
        attendance.teacher = teacherId;
        await attendance.save();
      } else {
        // Create new attendance record
        attendance = new Attendance({
          student: studentId,
          class: classId,
          subject,
          date: new Date(date),
          status,
          teacher: teacherId,
          remarks
        });
        await attendance.save();
      }

      results.push({
        studentId: attendance.student,
        status: attendance.status,
        date: attendance.date
      });
    }

    try {
      syncAttendanceToAdminDb({
        classData,
        date,
        attendanceData,
        teacherId
      });
    } catch (syncError) {
      console.warn('Failed to sync attendance to admin DB:', syncError.message);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get marks for class
export const getMarks = async (req, res) => {
  try {
    const { classId, examId, subjectId } = req.query;
    const teacherId = req.user._id;

    let filter = { class: classId, teacher: teacherId };
    if (examId) filter.exam = examId;
    if (subjectId) filter.subject = subjectId;

    const marks = await Mark.find(filter)
      .populate('student', 'name email')
      .populate('exam', 'examName date')
      .populate('subject', 'subjectName');

    res.json({
      success: true,
      data: marks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enter marks
export const enterMarks = async (req, res) => {
  try {
    const { examId, subjectId, classId, marksData } = req.body;
    const teacherId = req.user._id;

    // Validate exam belongs to teacher
    const exam = await Exam.findOne({ _id: examId, teacher: teacherId });
    if (!exam) {
      return res.status(403).json({ error: 'Unauthorized to enter marks for this exam' });
    }

    const results = [];
    for (const mark of marksData) {
      const { studentId, marksObtained, totalMarks, remarks } = mark;

      // Check if marks already exist
      let existingMark = await Mark.findOne({
        exam: examId,
        student: studentId,
        subject: subjectId
      });

      if (existingMark) {
        // Update existing marks
        existingMark.marksObtained = marksObtained;
        existingMark.totalMarks = totalMarks;
        existingMark.remarks = remarks;
        existingMark.teacher = teacherId;
        await existingMark.save();
        results.push(existingMark);
      } else {
        // Create new mark record
        const newMark = new Mark({
          student: studentId,
          exam: examId,
          subject: subjectId,
          class: classId,
          marksObtained,
          totalMarks,
          teacher: teacherId,
          remarks
        });
        await newMark.save();
        results.push(newMark);
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get leave applications for teacher
export const getLeaveApplications = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // For now, returning all leave applications where teacher is involved
    // In a real system, this would be more specific to teacher's class students
    const leaves = await LeaveApplication.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Apply for leave (for teacher themselves)
export const applyForLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const leaveApplication = new LeaveApplication({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await leaveApplication.save();

    res.status(201).json({
      success: true,
      data: leaveApplication
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get performance analytics
export const getPerformanceAnalytics = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId);

    // Prepare filter for class-specific analytics
    const classFilter = {};
    if (teacher.assignedClass && teacher.division) {
      // Find the actual Class model ID for filtering
      const assignedClassObj = mongoose.connection.readyState === 1
        ? await Class.findOne({
          className: teacher.assignedClass,
          section: teacher.division
        })
        : null;
      if (assignedClassObj) {
        classFilter.class = assignedClassObj._id;
      }
    }

    // Get class-wise performance
    const classPerformance = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: '$class',
          className: { $first: '$classInfo.className' },
          section: { $first: '$classInfo.section' },
          averagePercentage: { $avg: '$percentage' },
          totalStudents: { $sum: 1 },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      }
    ]);

    // Get subject-wise performance
    const subjectPerformance = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $unwind: '$subjectInfo'
      },
      {
        $group: {
          _id: '$subject',
          subjectName: { $first: '$subjectInfo.subjectName' },
          averagePercentage: { $avg: '$percentage' },
          totalStudents: { $sum: 1 },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      }
    ]);

    // Get weak students (below 40%)
    const weakStudents = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          percentage: { $lt: 40 },
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: '$student',
          studentName: { $first: '$studentInfo.name' },
          className: { $first: '$classInfo.className' },
          section: { $first: '$classInfo.section' },
          averagePercentage: { $avg: '$percentage' },
          subjectsStruggled: { $push: '$subject' }
        }
      }
    ]);

    // Get attendance-wise performance (mock/aggregate)
    const attendanceOverview = await Attendance.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $group: {
          _id: '$class',
          averageAttendance: {
            $avg: {
              $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $project: {
          className: '$classInfo.className',
          section: '$classInfo.section',
          averageAttendance: 1
        }
      }
    ]);

    // Get Grade Distribution
    const gradeDistribution = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          grade: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get Top Performers (above 80%)
    const topPerformers = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          percentage: { $gte: 80 },
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: '$student',
          studentName: { $first: '$studentInfo.name' },
          className: { $first: '$classInfo.className' },
          section: { $first: '$classInfo.section' },
          averagePercentage: { $avg: '$percentage' }
        }
      },
      {
        $sort: { averagePercentage: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get Weekly Attendance Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyAttendanceTrend = await Attendance.aggregate([
      {
        $match: {
          teacher: teacherId,
          date: { $gte: sevenDaysAgo },
          ...classFilter
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          averageAttendance: {
            $avg: {
              $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
            }
          },
          uniformCompliance: {
            $avg: {
              $cond: [{ $eq: ['$uniform', true] }, 100, 0]
            }
          },
          icardCompliance: {
            $avg: {
              $cond: [{ $eq: ['$icard', true] }, 100, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          percentage: '$averageAttendance',
          uniform: '$uniformCompliance',
          icard: '$icardCompliance',
          _id: 0
        }
      }
    ]);

    // Get Syllabus Status
    const syllabusStatus = await Subject.find(classFilter.class ? { class: classFilter.class } : {})
      .select('subjectName completionPercentage');

    res.json({
      success: true,
      data: {
        classPerformance,
        subjectPerformance,
        weakStudents,
        attendanceOverview,
        gradeDistribution,
        topPerformers,
        weeklyAttendanceTrend,
        syllabusStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
