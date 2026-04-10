import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { verifyToken } from '../utils/jwt.js';
import { getTeacherAssignedStudents } from '../utils/adminTeacherAuth.js';
import { findTeacherByIdentifier } from '../utils/adminTeacherAuth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const meetingsStorePath = path.join(__dirname, '..', 'data', 'meetings.json');

function normalize(value = '') {
  return String(value || '').trim();
}

function normalizeUpper(value = '') {
  return String(value || '').trim().toUpperCase();
}

function collectIdentifiers(...values) {
  return [...new Set(values.flatMap((value) => {
    if (Array.isArray(value)) return value;
    return String(value || '').split(',');
  }).map((value) => normalize(String(value).toUpperCase())).filter(Boolean))];
}

function expandStudentTargets(targetIdentifiers = []) {
  const expanded = new Set(collectIdentifiers(targetIdentifiers));
  for (const identifier of expanded) {
    const suffixMatch = String(identifier || '').match(/(\d+)$/);
    if (suffixMatch) {
      expanded.add(suffixMatch[1]);
    }
  }
  return [...expanded];
}

function matchStudentIdentifiers(student, targetIdentifiers = []) {
  const studentIdentifiers = collectIdentifiers(
    student?._id,
    student?.id,
    student?.studentDbId,
    student?.studentId,
    student?.grNo,
    student?.grNumber,
    student?.admissionNumber,
    student?.rollNumber,
    student?.parentId,
    student?.parent_id,
  );

  const targetSet = new Set(expandStudentTargets(targetIdentifiers));
  return studentIdentifiers.some((identifier) => targetSet.has(identifier));
}

function normalizeMeetingType(value = '') {
  const type = normalize(value);
  return type || 'Regular PTM';
}

function normalizeMeetingStatus(value = '') {
  const status = normalize(value).toLowerCase();
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
  if (status === 'rescheduled') return 'Rescheduled';
  return 'Scheduled';
}

function ensureMeetingsStore() {
  const dir = path.dirname(meetingsStorePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(meetingsStorePath)) {
    fs.writeFileSync(meetingsStorePath, '[]', 'utf8');
  }
}

function readMeetingsStore() {
  try {
    ensureMeetingsStore();
    const raw = fs.readFileSync(meetingsStorePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read meetings store:', error.message);
    return [];
  }
}

function writeMeetingsStore(records = []) {
  ensureMeetingsStore();
  fs.writeFileSync(meetingsStorePath, JSON.stringify(records, null, 2), 'utf8');
}

function serializeMeeting(meeting) {
  return {
    id: String(meeting.id || meeting._id || randomUUID()),
    teacherId: meeting.teacher_id || meeting.teacherId || '',
    teacherName: meeting.teacher_name || meeting.teacherName || '',
    studentId: meeting.student_id || meeting.studentId || '',
    studentName: meeting.student_name || meeting.studentName || '',
    rollNumber: meeting.roll_number || meeting.rollNumber || '',
    standard: meeting.standard || '',
    division: meeting.division || '',
    parentId: meeting.parent_id || meeting.parentId || '',
    meetingType: meeting.meeting_type || meeting.meetingType || '',
    meetingDate: meeting.meeting_date || meeting.meetingDate || '',
    meetingTime: meeting.meeting_time || meeting.meetingTime || '',
    meetingPurpose: meeting.meeting_purpose || meeting.meetingPurpose || '',
    status: normalizeMeetingStatus(meeting.status || 'Scheduled'),
    createdAt: meeting.created_at || meeting.createdAt || '',
    updatedAt: meeting.updated_at || meeting.updatedAt || '',
  };
}

function sortMeetings(meetings = [], direction = 'desc') {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...meetings].sort((a, b) => {
    const aTime = new Date(`${a.meetingDate || a.meeting_date || ''}T${a.meetingTime || a.meeting_time || '00:00'}`).getTime();
    const bTime = new Date(`${b.meetingDate || b.meeting_date || ''}T${b.meetingTime || b.meeting_time || '00:00'}`).getTime();
    return (aTime - bTime) * multiplier;
  });
}

function persistMeeting(meeting) {
  const records = readMeetingsStore();
  const now = new Date().toISOString();
  const record = {
    id: meeting.id || randomUUID(),
    teacher_id: meeting.teacher_id || '',
    teacher_name: meeting.teacher_name || '',
    student_id: meeting.student_id || '',
    student_name: meeting.student_name || '',
    roll_number: meeting.roll_number || '',
    standard: meeting.standard || '',
    division: meeting.division || '',
    parent_id: meeting.parent_id || '',
    meeting_type: meeting.meeting_type || 'Regular PTM',
    meeting_date: meeting.meeting_date || '',
    meeting_time: meeting.meeting_time || '',
    meeting_purpose: meeting.meeting_purpose || '',
    status: normalizeMeetingStatus(meeting.status || 'Scheduled'),
    created_at: meeting.created_at || now,
    updated_at: now,
  };

  records.unshift(record);
  writeMeetingsStore(records);
  return record;
}

function updateMeeting(meetingId, teacherId, updater) {
  const records = readMeetingsStore();
  const index = records.findIndex((record) => String(record.id || '').trim() === String(meetingId || '').trim() && String(record.teacher_id || '').trim() === String(teacherId || '').trim());
  if (index === -1) return null;

  const nextRecord = updater({ ...records[index] });
  nextRecord.updated_at = new Date().toISOString();
  records[index] = nextRecord;
  writeMeetingsStore(records);
  return nextRecord;
}

function resolveParentIdentifiers(req) {
  return collectIdentifiers(
    req.user?.parent_id,
    req.user?.parentId,
    req.user?.studentId,
    req.user?.admissionNumber,
    req.user?.rollNumber,
    req.user?.grNo,
    req.query.parentId,
    req.query.studentId,
    req.query.admissionNumber,
    req.query.rollNumber,
    req.query.grNo,
    req.query.aliases,
    req.query.parentAliases,
    req.query.studentAliases,
  );
}

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
  const fallbackClass = String(req.header('X-Teacher-Class') || '').trim();
  const fallbackDivision = normalizeUpper(req.header('X-Teacher-Division') || '');
  const fallbackTeacher = fallbackTeacherId || fallbackEmail || fallbackName;

  const finalizeTeacher = (teacher) => {
    if (!teacher) return null;
    const assignedClass = String(teacher.classTeacherStd || teacher.assignedClass || fallbackClass || '').trim();
    const division = normalizeUpper(teacher.classTeacherDiv || teacher.division || fallbackDivision || '');
    return {
      ...teacher,
      assignedClass,
      division,
      classTeacherOf: teacher.classTeacherOf || (assignedClass && division ? `${assignedClass}-${division}` : ''),
    };
  };

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded?.role === 'teacher') {
        const teacher = findTeacherByIdentifier(decoded.userId);
        const resolved = finalizeTeacher(teacher);
        if (resolved) return resolved;
      }
    } catch {
      // Fall back to header-based teacher resolution.
    }
  }

  return finalizeTeacher(fallbackTeacher ? findTeacherByIdentifier(fallbackTeacher) : null);
}

function authenticateTeacher(req, res, next) {
  try {
    const teacher = resolveTeacherFromRequest(req);
    if (!teacher) {
      return res.status(401).json({ success: false, error: 'Invalid or missing teacher session.' });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired teacher session.' });
  }
}

router.post('/teacher/meetings', authenticateTeacher, async (req, res) => {
  try {
    const body = req.body || {};
    const studentTarget = collectIdentifiers(
      body.student_id,
      body.studentId,
      body.student,
      body.roll_number,
      body.rollNumber,
      body.admissionNumber,
      body.grNo,
    );
    const meetingDate = normalize(body.meeting_date || body.date);
    const meetingTime = normalize(body.meeting_time || body.time);
    const meetingPurpose = normalize(body.meeting_purpose || body.purpose);
    const meetingType = normalizeMeetingType(body.meeting_type || body.meetingType);

    if (!studentTarget.length) {
      return res.status(400).json({ success: false, error: 'Student is required.' });
    }
    if (!meetingDate || !meetingTime || !meetingPurpose) {
      return res.status(400).json({ success: false, error: 'Meeting date, time and purpose are required.' });
    }

    const teacher = {
      id: String(req.teacher?._id || req.teacher?.id || req.teacher?.teacherId || '').trim(),
      teacherId: String(req.teacher?.teacherId || req.teacher?.id || req.teacher?._id || '').trim(),
      name: normalize(req.teacher?.name || 'Teacher'),
      email: normalize(req.teacher?.email || ''),
      assignedClass: normalize(req.teacher?.assignedClass || req.teacher?.classTeacherStd || ''),
      division: normalizeUpper(req.teacher?.division || req.teacher?.classTeacherDiv || ''),
      classTeacherStd: normalize(req.teacher?.classTeacherStd || req.teacher?.assignedClass || ''),
      classTeacherDiv: normalizeUpper(req.teacher?.classTeacherDiv || req.teacher?.division || ''),
    };

    const assignedStudents = getTeacherAssignedStudents(teacher);
    const selectedStudent = assignedStudents.find((student) => matchStudentIdentifiers(student, studentTarget));

    if (!selectedStudent) {
      return res.status(404).json({ success: false, error: 'Selected student not found for this teacher.' });
    }

    const parentId = normalize(selectedStudent.parentId || selectedStudent.parent_id || selectedStudent.studentId || selectedStudent.grNumber || selectedStudent.admissionNumber || selectedStudent.rollNumber);
    if (!parentId) {
      return res.status(400).json({ success: false, error: 'Linked parent not found for the selected student.' });
    }

    const meeting = persistMeeting({
      id: randomUUID(),
      teacher_id: teacher.teacherId || teacher.id,
      teacher_name: teacher.name,
      student_id: normalize(selectedStudent.studentId || selectedStudent.studentDbId || selectedStudent._id || selectedStudent.id || ''),
      student_name: normalize(selectedStudent.name || 'Student'),
      roll_number: normalize(selectedStudent.rollNumber || selectedStudent.grNumber || selectedStudent.grNo || ''),
      standard: normalize(selectedStudent.standard || selectedStudent.className || teacher.assignedClass || ''),
      division: normalizeUpper(selectedStudent.division || selectedStudent.section || teacher.division || ''),
      parent_id: parentId,
      meeting_type: meetingType,
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      meeting_purpose: meetingPurpose,
      status: 'Scheduled',
    });

    return res.status(201).json({ success: true, data: serializeMeeting(meeting) });
  } catch (error) {
    console.error('Failed to schedule meeting:', error);
    return res.status(500).json({ success: false, error: 'Failed to schedule meeting.', details: error.message });
  }
});

router.get('/teacher/meetings', authenticateTeacher, async (req, res) => {
  try {
    const teacherId = String(req.teacher?.teacherId || req.teacher?.id || req.teacher?._id || '').trim();
    const meetings = sortMeetings(
      readMeetingsStore().filter((record) => String(record.teacher_id || '').trim() === teacherId),
      'asc'
    ).slice(0, 200);

    return res.json({ success: true, data: meetings.map(serializeMeeting) });
  } catch (error) {
    console.error('Failed to load teacher meetings:', error);
    return res.status(500).json({ success: false, error: 'Failed to load teacher meetings.', details: error.message });
  }
});

router.put('/teacher/meetings/:meetingId', authenticateTeacher, async (req, res) => {
  try {
    const meetingId = String(req.params.meetingId || '').trim();
    if (!meetingId) {
      return res.status(400).json({ success: false, error: 'Meeting ID is required.' });
    }

    const updates = {};
    if (req.body.meeting_date || req.body.date) updates.meeting_date = normalize(req.body.meeting_date || req.body.date);
    if (req.body.meeting_time || req.body.time) updates.meeting_time = normalize(req.body.meeting_time || req.body.time);
    if (req.body.meeting_purpose || req.body.purpose) updates.meeting_purpose = normalize(req.body.meeting_purpose || req.body.purpose);
    if (req.body.meeting_type || req.body.meetingType) updates.meeting_type = normalizeMeetingType(req.body.meeting_type || req.body.meetingType);
    if (req.body.status) updates.status = normalizeMeetingStatus(req.body.status);

    const meeting = updateMeeting(
      meetingId,
      String(req.teacher?.teacherId || req.teacher?.id || req.teacher?._id || '').trim(),
      (record) => ({ ...record, ...updates })
    );
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found.' });
    }

    return res.json({ success: true, data: serializeMeeting(meeting) });
  } catch (error) {
    console.error('Failed to update meeting:', error);
    return res.status(500).json({ success: false, error: 'Failed to update meeting.', details: error.message });
  }
});

router.delete('/teacher/meetings/:meetingId', authenticateTeacher, async (req, res) => {
  try {
    const meetingId = String(req.params.meetingId || '').trim();
    if (!meetingId) {
      return res.status(400).json({ success: false, error: 'Meeting ID is required.' });
    }

    const meeting = updateMeeting(
      meetingId,
      String(req.teacher?.teacherId || req.teacher?.id || req.teacher?._id || '').trim(),
      (record) => ({ ...record, status: 'Cancelled' })
    );

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found.' });
    }

    return res.json({ success: true, data: serializeMeeting(meeting) });
  } catch (error) {
    console.error('Failed to cancel meeting:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel meeting.', details: error.message });
  }
});

router.get('/parent/my-meetings', async (req, res) => {
  try {
    const parentIdentifiers = resolveParentIdentifiers(req);
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent ID is required.' });
    }

    const parentSet = new Set(parentIdentifiers);
    const meetings = sortMeetings(
      readMeetingsStore().filter((record) => parentSet.has(String(record.parent_id || '').trim())),
      'desc'
    ).slice(0, 200);

    return res.json({ success: true, data: meetings.map(serializeMeeting) });
  } catch (error) {
    console.error('Failed to load parent meetings:', error);
    return res.status(500).json({ success: false, error: 'Failed to load parent meetings.', details: error.message });
  }
});

export default router;
