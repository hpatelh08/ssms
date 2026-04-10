import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import { authenticate, isTeacher } from '../middleware/auth.js';
import { findTeacherByIdentifier, getTeacherAssignedStudents } from '../utils/adminTeacherAuth.js';
import { fileURLToPath } from 'url';
const router = express.Router();
const parentNotificationStore = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesStorePath = path.join(__dirname, '..', 'data', 'messages.json');
const messageReadsStorePath = path.join(__dirname, '..', 'data', 'messageReads.json');

function ensureMessagesStore() {
  const storeDir = path.dirname(messagesStorePath);
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }
  if (!fs.existsSync(messagesStorePath)) {
    fs.writeFileSync(messagesStorePath, '[]', 'utf8');
  }
}

function readMessageStore() {
  try {
    ensureMessagesStore();
    const raw = fs.readFileSync(messagesStorePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessageStore(messages = []) {
  ensureMessagesStore();
  fs.writeFileSync(messagesStorePath, JSON.stringify(messages, null, 2), 'utf8');
}

function ensureMessageReadsStore() {
  const storeDir = path.dirname(messageReadsStorePath);
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }
  if (!fs.existsSync(messageReadsStorePath)) {
    fs.writeFileSync(messageReadsStorePath, '[]', 'utf8');
  }
}

function readMessageReadStore() {
  try {
    ensureMessageReadsStore();
    const raw = fs.readFileSync(messageReadsStorePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessageReadStore(records = []) {
  ensureMessageReadsStore();
  fs.writeFileSync(messageReadsStorePath, JSON.stringify(records, null, 2), 'utf8');
}

function normalizeClassId(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeClassKey(className = '', division = '') {
  const classNumber = String(className || '').match(/\d+/);
  const divisionValue = String(division || '').trim().toUpperCase();
  if (!classNumber) return '';
  return `admin-class-${parseInt(classNumber[0], 10)}-${divisionValue || 'A'}`;
}

function normalizeIdentifier(value = '') {
  return String(value || '').trim().toUpperCase();
}

function splitIdentifierValues(value = '') {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitIdentifierValues(item));
  }

  return String(value || '')
    .split(',')
    .map((item) => normalizeIdentifier(item))
    .filter(Boolean);
}

function collectIdentifiers(...values) {
  return [...new Set(values.flatMap((value) => splitIdentifierValues(value)))];
}

function getStudentIdentityCandidates(student = {}) {
  return collectIdentifiers(
    student.studentId,
    student.student_id,
    student.grNo,
    student.gr_number,
    student.grNumber,
    student.admissionNumber,
    student.admission_number,
    student.rollNumber,
    student.roll_number,
    student.parentId,
    student.parent_id,
    student.parentAccessId,
    student.id,
    student._id,
  );
}

function getMessageIdentityCandidates(message = {}) {
  return collectIdentifiers(
    message.recipientStudentId,
    message.recipientStudentIds,
    message.recipientParentId,
    message.recipientParentIds,
    message.recipientUserId,
    message.recipientUserIds,
    message.recipientId,
    message.recipientIds,
  );
}

function hasIdentifierIntersection(targetValues = [], candidateValues = []) {
  const targetSet = new Set(collectIdentifiers(targetValues));
  if (targetSet.size === 0) return false;
  return collectIdentifiers(candidateValues).some((candidate) => targetSet.has(candidate));
}

function normalizeRecipientType(recipientType = '') {
  const value = String(recipientType || '').trim().toLowerCase();
  if (value === 'student' || value === 'class' || value === 'parent') return value;
  return 'class';
}

function normalizeAudienceLabel(recipientType = 'class') {
  return normalizeRecipientType(recipientType);
}

function resolveClassKeyFromQuery(query = {}) {
  const direct = String(query.classId || query.recipientClassId || query.targetClassId || '').trim();
  if (direct) return direct.toLowerCase();

  const grade = String(query.grade || query.std || '').trim();
  const division = String(query.division || query.section || '').trim().toUpperCase();
  if (grade) {
    return normalizeClassKey(grade, division || 'A');
  }

  const className = String(query.className || '').trim();
  if (className) {
    return normalizeClassKey(className, division || 'A');
  }

  return '';
}

function buildMessagePayload(body = {}) {
  const recipientType = normalizeRecipientType(body.recipientType || body.targetType);
  const recipientStudentId = String(body.recipientStudentId || body.recipientId || '').trim().toUpperCase();
  const recipientParentId = String(body.recipientParentId || body.recipientId || recipientStudentId || '').trim().toUpperCase();
  const recipientStudentIds = collectIdentifiers(body.recipientStudentIds, body.recipientStudentId, body.recipientId);
  const recipientParentIds = collectIdentifiers(body.recipientParentIds, body.recipientParentId, body.recipientId, recipientStudentId);
  const recipientClassId = String(body.recipientClassId || body.targetClassId || body.classId || '').trim().toLowerCase();
  const senderEmail = String(body.senderEmail || body.email || '').trim().toLowerCase();
  const senderTeacherId = String(body.senderTeacherId || body.teacherId || '').trim();
  const title = String(body.title || body.subject || '').trim();
  const messageText = String(body.messageText || body.content || body.message || '').trim();
  const attachmentUrl = String(body.attachmentUrl || '').trim();
  const attachmentName = String(body.attachmentName || '').trim();
  const className = String(body.className || '').trim();
  const division = String(body.division || body.section || '').trim().toUpperCase();
  const subjectId = String(body.subjectId || '').trim();
  const priority = ['low', 'medium', 'high', 'urgent'].includes(String(body.priority || '').toLowerCase())
    ? String(body.priority).toLowerCase()
    : 'medium';
  return {
    title,
    messageText,
    priority,
    recipientType,
    recipientStudentId,
    recipientParentId,
    recipientStudentIds,
    recipientParentIds,
    recipientClassId,
    className,
    division,
    subjectId,
    senderEmail,
    senderTeacherId,
    attachmentUrl,
    attachmentName,
  };
}

function getReadCandidates(readRecord = {}) {
  return collectIdentifiers(
    readRecord.parentId,
    readRecord.parentAliases,
    readRecord.studentId,
    readRecord.studentAliases,
    readRecord.recipientId,
    readRecord.recipientAliases,
  );
}

function isMessageReadForParent(message, parentIdentifiers) {
  const messageId = String(message.id || message._id || '').trim();
  if (!messageId) return false;
  const targetIdentifiers = collectIdentifiers(parentIdentifiers);
  if (!targetIdentifiers.length) return false;

  const records = readMessageReadStore();
  return records.some((record) => {
    if (String(record.messageId || '').trim() !== messageId) return false;
    return hasIdentifierIntersection(targetIdentifiers, getReadCandidates(record));
  });
}

function serializeMessage(message, extra = {}) {
  const recipientClassId = String(message.recipientClassId || '').trim().toLowerCase();
  const recipientStudentId = String(message.recipientStudentId || '').trim().toUpperCase();
  const recipientParentId = String(message.recipientParentId || '').trim().toUpperCase();
  const recipientStudentIds = collectIdentifiers(message.recipientStudentIds, recipientStudentId);
  const recipientParentIds = collectIdentifiers(message.recipientParentIds, recipientParentId);
  const recipientUserIds = collectIdentifiers(message.recipientUserIds, recipientStudentIds, recipientParentIds, recipientStudentId, recipientParentId);
  return {
    id: String(message._id || message.id || ''),
    title: message.title,
    content: message.messageText || message.content || '',
    messageText: message.messageText || message.content || '',
    priority: message.priority || 'medium',
    author: message.senderName || 'Teacher',
    senderName: message.senderName || 'Teacher',
    senderRole: message.senderRole || 'teacher',
    senderId: message.senderId || '',
    date: message.createdAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    recipientType: message.recipientType || 'class',
    recipientRole: message.recipientType || 'class',
    recipientStudentId,
    recipientStudentIds,
    recipientParentId,
    recipientParentIds,
    recipientClassId,
    recipientClasses: recipientClassId ? [recipientClassId] : [],
    recipientUsers: recipientUserIds,
    targetClassId: recipientClassId,
    className: message.className || '',
    division: message.division || '',
    subjectId: message.subjectId || '',
    attachmentUrl: message.attachmentUrl || '',
    attachmentName: message.attachmentName || '',
    isActive: message.isActive !== false,
    isRead: extra.isRead ?? message.isRead ?? false,
    pinned: false,
  };
}

function isMessageVisibleToClass(message, classKey) {
  const normalizedClassKey = normalizeClassId(classKey || '');
  if (!normalizedClassKey) return false;
  const messageClassId = normalizeClassId(message.recipientClassId || message.targetClassId || '');
  if (messageClassId && messageClassId === normalizedClassKey) return true;

  const messageClassKey = normalizeClassKey(message.className || '', message.division || '');
  return messageClassKey ? normalizeClassId(messageClassKey) === normalizedClassKey : false;
}

function isMessageVisibleToStudent(message, studentIdentifiers, classKey) {
  const normalizedStudentIds = collectIdentifiers(studentIdentifiers);
  if (!normalizedStudentIds.length) return false;

  const recipientType = normalizeRecipientType(message.recipientType);
  if (recipientType === 'student') {
    return hasIdentifierIntersection(normalizedStudentIds, getMessageIdentityCandidates(message));
  }

  return recipientType === 'class' && isMessageVisibleToClass(message, classKey);
}

function isMessageVisibleToParent(message, parentIdentifiers, classKey) {
  const normalizedParentIds = collectIdentifiers(parentIdentifiers);
  if (!normalizedParentIds.length) return false;

  const recipientType = normalizeRecipientType(message.recipientType);
  if (recipientType === 'parent' || recipientType === 'student') {
    return hasIdentifierIntersection(normalizedParentIds, getMessageIdentityCandidates(message));
  }

  return recipientType === 'class' && isMessageVisibleToClass(message, classKey);
}

async function verifyTeacherClassPermission(teacherId, classKey) {
  const normalizedClassKey = normalizeClassId(classKey || '');
  if (!teacherId || !normalizedClassKey) return false;

  const classDoc = await Class.findOne({
    $or: [
      { classTeacher: teacherId },
      { classTeacher: new mongoose.Types.ObjectId(teacherId) },
    ],
  }).select('className section');

  if (!classDoc) {
    return false;
  }

  return normalizeClassId(normalizeClassKey(classDoc.className, classDoc.section)) === normalizedClassKey;
}

async function validateTeacherStudentPermission(teacher, studentId) {
  const assignedStudents = getTeacherAssignedStudents(teacher);
  const targetIdentifiers = collectIdentifiers(studentId);
  if (!targetIdentifiers.length) return false;

  return assignedStudents.some((student) => {
    const studentIdentifiers = getStudentIdentityCandidates(student);
    return hasIdentifierIntersection(targetIdentifiers, studentIdentifiers);
  });
}

async function validateTeacherParentPermission(teacher, parentId) {
  const assignedStudents = getTeacherAssignedStudents(teacher);
  const targetIdentifiers = collectIdentifiers(parentId);
  if (!targetIdentifiers.length) return false;

  return assignedStudents.some((student) => {
    const studentParentIdentifiers = collectIdentifiers(
      student.parentId,
      student.parent_id,
      student.parentAccessId,
      student.parentAccessKey,
      student.studentId,
      student.student_id,
      student.grNo,
      student.gr_number,
      student.grNumber,
      student.admissionNumber,
      student.admission_number,
      student.rollNumber,
      student.roll_number,
      student.id,
      student._id,
    );
    return hasIdentifierIntersection(targetIdentifiers, studentParentIdentifiers);
  });
}

async function buildVisibilityMessages({ studentIds = [], parentIds = [], classKey = '' }) {
  const messages = readMessageStore()
    .filter((message) => message.isActive !== false)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 200);

  return messages.filter((message) => {
    if (studentIds.length && isMessageVisibleToStudent(message, studentIds, classKey)) return true;
    if (parentIds.length && isMessageVisibleToParent(message, parentIds, classKey)) return true;
    if (classKey && isMessageVisibleToClass(message, classKey)) return true;
    return false;
  });
}

function upsertMessageReadRecord({ messageId, parentIdentifiers = [], studentIdentifiers = [] }) {
  const targetParentIds = collectIdentifiers(parentIdentifiers);
  const targetStudentIds = collectIdentifiers(studentIdentifiers);
  if (!messageId || (!targetParentIds.length && !targetStudentIds.length)) return null;

  const store = readMessageReadStore();
  const matchIndex = store.findIndex((record) => {
    if (String(record.messageId || '').trim() !== String(messageId).trim()) return false;
    const recordIdentifiers = collectIdentifiers(
      record.parentId,
      record.parentAliases,
      record.studentId,
      record.studentAliases,
      record.recipientId,
      record.recipientAliases,
    );
    return hasIdentifierIntersection([...targetParentIds, ...targetStudentIds], recordIdentifiers);
  });

  const now = new Date().toISOString();
  const nextRecord = {
    id: matchIndex >= 0 ? String(store[matchIndex].id || randomUUID()) : randomUUID(),
    messageId: String(messageId).trim(),
    parentId: targetParentIds[0] || targetStudentIds[0] || '',
    parentAliases: targetParentIds,
    studentId: targetStudentIds[0] || '',
    studentAliases: targetStudentIds,
    isRead: true,
    readAt: now,
    createdAt: matchIndex >= 0 ? store[matchIndex].createdAt || now : now,
    updatedAt: now,
  };

  if (matchIndex >= 0) {
    store[matchIndex] = { ...store[matchIndex], ...nextRecord };
  } else {
    store.unshift(nextRecord);
  }

  writeMessageReadStore(store.slice(0, 1000));
  return nextRecord;
}

function serializeParentNotification(notification) {
  return {
    id: String(notification?.id || ''),
    icon: String(notification?.icon || '🔔'),
    text: String(notification?.text || 'Notification'),
    time: String(notification?.time || 'Just now'),
    bg: String(notification?.bg || 'rgba(99,102,241,0.08)'),
    createdAt: notification?.createdAt ? String(notification.createdAt) : new Date().toISOString(),
    type: String(notification?.type || 'attendance'),
    studentId: String(notification?.studentId || ''),
    studentName: String(notification?.studentName || ''),
    date: String(notification?.date || ''),
    classId: String(notification?.classId || ''),
  };
}

// GET /api/communication/announcements
router.get('/announcements', async (req, res) => {
  try {
    const { createdBy, limit = 20 } = req.query;
    const classKey = resolveClassKeyFromQuery(req.query);
    const visibilityIds = collectIdentifiers(
      req.query.userId,
      req.query.studentId,
      req.query.parentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
      req.query.studentAliases,
      req.query.parentAliases,
    );
    const messages = await buildVisibilityMessages({
      studentIds: visibilityIds,
      parentIds: visibilityIds,
      classKey,
    });

    let filtered = messages;
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      filtered = filtered.filter((message) => String(message.senderId || '') === String(createdBy));
    }

    const maxItems = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
    res.json({
      success: true,
      data: filtered.slice(0, maxItems).map(serializeMessage),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load announcements.',
      details: error.message,
    });
  }
});

router.get('/parent/:parentId/unread-count', async (req, res) => {
  try {
    const parentIdentifiers = collectIdentifiers(
      req.params.parentId,
      req.query.parentId,
      req.query.studentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
      req.query.studentAliases,
      req.query.parentAliases,
    );
    const classKey = resolveClassKeyFromQuery(req.query);
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent ID is required.' });
    }

    const visible = await buildVisibilityMessages({ parentIds: parentIdentifiers, classKey });
    const unreadCount = visible.filter((message) => !isMessageReadForParent(message, parentIdentifiers)).length;

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load unread count.',
      details: error.message,
    });
  }
});

// POST /api/communication/message-student
router.post('/message-student', (req, res) => {
  // Message students
  res.json({ success: true });
});

// POST /api/communication/message-parent
router.post('/message-parent', (req, res) => {
  // Message parents
  res.json({ success: true });
});

// GET /api/communication/parent-notifications
router.get('/parent-notifications', (req, res) => {
  try {
    const classId = normalizeClassId(req.query.classId || '');
    const studentId = normalizeClassId(req.query.studentId || '');

    let rows = [...parentNotificationStore];
    if (classId) {
      rows = rows.filter((item) => normalizeClassId(item.classId) === classId);
    }
    if (studentId) {
      rows = rows.filter((item) => normalizeClassId(item.studentId) === studentId);
    }

    rows = rows
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 100)
      .map(serializeParentNotification);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load parent notifications.',
      details: error.message,
    });
  }
});

// POST /api/communication/parent-notifications
router.post('/parent-notifications', (req, res) => {
  try {
    const payload = req.body;
    const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'No notifications provided.' });
    }

    const normalizedItems = items.map(serializeParentNotification);
    parentNotificationStore.unshift(...normalizedItems);
    while (parentNotificationStore.length > 200) {
      parentNotificationStore.pop();
    }

    res.status(201).json({ success: true, data: normalizedItems });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save parent notifications.',
      details: error.message,
    });
  }
});

async function resolveTeacherFromRequest(req, payload) {
  if (req.user && req.user.role === 'teacher') {
    const adminTeacher = findTeacherByIdentifier(req.user.email || req.user.teacherId || req.user.name || '');
    return adminTeacher ? { ...req.user, ...adminTeacher } : req.user;
  }

  const candidates = [payload.senderTeacherId, payload.senderEmail, payload.createdBy, payload.authorName]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const adminTeacher = findTeacherByIdentifier(candidate);
    if (adminTeacher) return adminTeacher;
  }

  return null;
}

async function sendMessage(req, res) {
  try {
    const payload = buildMessagePayload(req.body);
    if (!payload.title || !payload.messageText) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required.',
      });
    }

    const teacherUser = await resolveTeacherFromRequest(req, payload);
    if (!teacherUser || teacherUser.role !== 'teacher') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Teacher privileges required.',
      });
    }

    const teacherContext = {
      ...teacherUser,
      assignedClass: teacherUser.assignedClass || payload.className || teacherUser.classTeacherStd || '',
      division: teacherUser.division || payload.division || teacherUser.classTeacherDiv || '',
      classTeacherStd: teacherUser.classTeacherStd || teacherUser.assignedClass || payload.className || '',
      classTeacherDiv: teacherUser.classTeacherDiv || teacherUser.division || payload.division || '',
    };

    const senderClassKey = normalizeClassKey(teacherContext.assignedClass || teacherContext.classTeacherStd || '', teacherContext.division || teacherContext.classTeacherDiv || '');

    if (payload.recipientType === 'class') {
      if (!payload.recipientClassId && !senderClassKey) {
        return res.status(400).json({ success: false, error: 'Selected class not found.' });
      }

      if (payload.recipientClassId && senderClassKey && normalizeClassId(payload.recipientClassId) !== normalizeClassId(senderClassKey)) {
        const allowed = await verifyTeacherClassPermission(teacherContext._id, payload.recipientClassId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            error: 'You are not allowed to send messages to the selected class.',
          });
        }
      }
    }

    if (payload.recipientType === 'student') {
      const studentTargets = collectIdentifiers(payload.recipientStudentIds, payload.recipientStudentId, payload.recipientId);
      if (!studentTargets.length) {
        return res.status(400).json({ success: false, error: 'Selected student not found.' });
      }
      for (const studentId of studentTargets) {
        const permitted = await validateTeacherStudentPermission(teacherContext, studentId);
        if (!permitted) {
          return res.status(403).json({
            success: false,
            error: 'You are not allowed to send messages to the selected student(s).',
          });
        }
      }
    }

    if (payload.recipientType === 'parent') {
      const parentTargets = collectIdentifiers(payload.recipientParentIds, payload.recipientParentId, payload.recipientId);
      if (!parentTargets.length) {
        return res.status(400).json({ success: false, error: 'Selected parent not found.' });
      }
      for (const parentId of parentTargets) {
        const permitted = await validateTeacherParentPermission(teacherContext, parentId);
        if (!permitted) {
          return res.status(403).json({
            success: false,
            error: 'You are not allowed to send messages to the selected parent(s).',
          });
        }
      }
    }

    const message = {
      id: randomUUID(),
      senderId: String(teacherContext._id || teacherContext.id || teacherContext.teacherId || teacherContext.email || 'teacher'),
      senderRole: teacherContext.role || 'teacher',
      senderName: teacherContext.name || req.body.authorName || 'Teacher',
      recipientType: payload.recipientType,
      recipientStudentId: payload.recipientStudentId,
      recipientStudentIds: payload.recipientStudentIds,
      recipientParentId: payload.recipientParentId,
      recipientParentIds: payload.recipientParentIds,
      recipientClassId: payload.recipientClassId || senderClassKey,
      className: payload.className,
      division: payload.division,
      subjectId: payload.subjectId,
      title: payload.title,
      messageText: payload.messageText,
      attachmentUrl: payload.attachmentUrl,
      attachmentName: payload.attachmentName,
      priority: payload.priority,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store = readMessageStore();
    store.unshift(message);
    writeMessageStore(store.slice(0, 500));

    res.status(201).json({
      success: true,
      data: serializeMessage(message),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save message.',
      details: error.message,
    });
  }
}

// POST /api/communication/announcement
router.post('/announcement', sendMessage);
// POST /api/messages/send
router.post('/send', sendMessage);

// POST /api/communication/group-message
router.post('/group-message', (req, res) => {
  // Group messaging
  res.json({ success: true });
});

router.get('/teacher/:teacherId', authenticate, isTeacher, async (req, res) => {
  try {
    const teacherId = String(req.params.teacherId || '').trim();
    if (!teacherId) {
      return res.status(400).json({ success: false, error: 'Teacher ID is required.' });
    }
    if (String(req.user?._id || '') !== teacherId) {
      return res.status(403).json({ success: false, error: 'Access denied. You can only view your own messages.' });
    }

    const messages = readMessageStore()
      .filter((message) => String(message.senderId || '') === teacherId && message.isActive !== false)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 200);

    res.json({ success: true, data: messages.map(serializeMessage) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load teacher messages.', details: error.message });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const studentIdentifiers = collectIdentifiers(
      req.params.studentId,
      req.query.studentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
      req.query.studentAliases,
    );
    const classKey = resolveClassKeyFromQuery(req.query);
    if (!studentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Student ID is required.' });
    }

    const messages = readMessageStore()
      .filter((message) => message.isActive !== false)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 200);
    const visible = messages.filter((message) => isMessageVisibleToStudent(message, studentIdentifiers, classKey));
    res.json({ success: true, data: visible.map(serializeMessage) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load student messages.', details: error.message });
  }
});

router.get('/parent/:parentId/unread-count', async (req, res) => {
  try {
    const parentIdentifiers = collectIdentifiers(
      req.params.parentId,
      req.query.parentId,
      req.query.studentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
      req.query.studentAliases,
      req.query.parentAliases,
    );
    const classKey = resolveClassKeyFromQuery(req.query);
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent ID is required.' });
    }

    const visible = await buildVisibilityMessages({ parentIds: parentIdentifiers, classKey });
    const unreadCount = visible.filter((message) => !isMessageReadForParent(message, parentIdentifiers)).length;

    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load unread count.', details: error.message });
  }
});

router.get('/parent/:parentId', async (req, res) => {
  try {
    const parentIdentifiers = collectIdentifiers(
      req.params.parentId,
      req.query.parentId,
      req.query.studentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
      req.query.studentAliases,
      req.query.parentAliases,
    );
    const classKey = resolveClassKeyFromQuery(req.query);
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent ID is required.' });
    }

    const messages = readMessageStore()
      .filter((message) => message.isActive !== false)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 200);
    const visible = messages
      .filter((message) => isMessageVisibleToParent(message, parentIdentifiers, classKey))
      .map((message) => serializeMessage(message, { isRead: isMessageReadForParent(message, parentIdentifiers) }));
    res.json({ success: true, data: visible });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load parent messages.', details: error.message });
  }
});

router.patch('/:messageId/read', async (req, res) => {
  try {
    const messageId = String(req.params.messageId || '').trim();
    const parentIdentifiers = collectIdentifiers(
      req.body.parentId,
      req.body.studentId,
      req.body.grNo,
      req.body.grNumber,
      req.body.admissionNumber,
      req.body.rollNumber,
      req.body.aliases,
      req.body.studentAliases,
      req.body.parentAliases,
      req.query.parentId,
      req.query.studentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
    );
    const classKey = resolveClassKeyFromQuery(req.query);

    if (!messageId) {
      return res.status(400).json({ success: false, error: 'Message ID is required.' });
    }
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent ID is required.' });
    }

    const messages = readMessageStore();
    const message = messages.find((item) => String(item.id || '') === messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found.' });
    }
    if (!isMessageVisibleToParent(message, parentIdentifiers, classKey)) {
      return res.status(403).json({ success: false, error: 'Message is not visible to this parent.' });
    }

    const readRecord = upsertMessageReadRecord({
      messageId,
      parentIdentifiers,
    });

    res.json({
      success: true,
      data: {
        messageId,
        isRead: true,
        readAt: readRecord?.readAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark message as read.', details: error.message });
  }
});

router.patch('/parent/:parentId/mark-all-read', async (req, res) => {
  try {
    const parentIdentifiers = collectIdentifiers(
      req.params.parentId,
      req.body.parentId,
      req.body.studentId,
      req.body.grNo,
      req.body.grNumber,
      req.body.admissionNumber,
      req.body.rollNumber,
      req.body.aliases,
      req.body.studentAliases,
      req.body.parentAliases,
      req.query.parentId,
      req.query.studentId,
      req.query.grNo,
      req.query.grNumber,
      req.query.admissionNumber,
      req.query.rollNumber,
      req.query.aliases,
    );
    const classKey = resolveClassKeyFromQuery(req.query);
    if (!parentIdentifiers.length) {
      return res.status(400).json({ success: false, error: 'Parent ID is required.' });
    }

    const visible = await buildVisibilityMessages({ parentIds: parentIdentifiers, classKey });
    const updated = visible.map((message) => upsertMessageReadRecord({
      messageId: String(message.id || ''),
      parentIdentifiers,
    })).filter(Boolean);

    res.json({
      success: true,
      data: { updatedCount: updated.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark messages as read.', details: error.message });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const classKey = normalizeClassId(String(req.params.classId || '').trim());
    if (!classKey) {
      return res.status(400).json({ success: false, error: 'Class ID is required.' });
    }

    const messages = readMessageStore()
      .filter((message) => message.isActive !== false)
      .filter((message) => {
        const messageClassId = normalizeClassId(message.recipientClassId || message.targetClassId || '');
        if (messageClassId && messageClassId === classKey) return true;
        const messageClassKey = normalizeClassKey(message.className || '', message.division || '');
        return messageClassKey ? normalizeClassId(messageClassKey) === classKey : false;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 200);

    res.json({ success: true, data: messages.map(serializeMessage) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load class messages.', details: error.message });
  }
});

export default router;
