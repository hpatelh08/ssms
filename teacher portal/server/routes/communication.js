import express from 'express';
import mongoose from 'mongoose';
import Announcement from '../models/Announcement.js';
const router = express.Router();
const parentNotificationStore = [];

function normalizeRecipientRole(recipientType = 'all') {
  if (recipientType === 'student') return 'student';
  if (recipientType === 'parent') return 'parent';
  if (recipientType === 'teacher') return 'teacher';
  if (recipientType === 'class') return 'all';
  return 'all';
}

function normalizeClassId(value = '') {
  return String(value || '').trim();
}

function normalizeAudienceLabel(recipientType = 'all') {
  if (recipientType === 'class') return 'class';
  if (recipientType === 'student') return 'student';
  if (recipientType === 'parent') return 'parent';
  return 'all';
}

function buildAnnouncementPayload(body = {}) {
  const recipientType = String(body.recipientType || 'all').toLowerCase();
  const recipientId = String(body.recipientId || '').trim();
  const targetClassId = normalizeClassId(body.targetClassId || body.recipientClassId || '');
  const title = String(body.title || body.subject || '').trim();
  const content = String(body.content || body.message || '').trim();
  const priority = ['low', 'medium', 'high', 'urgent'].includes(String(body.priority || '').toLowerCase())
    ? String(body.priority).toLowerCase()
    : 'medium';

  const recipients = {
    role: normalizeRecipientRole(recipientType),
    specificClasses: [],
    specificUsers: [],
  };

  if (recipientType === 'class' && recipientId) {
    recipients.specificClasses = [recipientId];
  } else if ((recipientType === 'student' || recipientType === 'parent') && recipientId) {
    recipients.specificUsers = [recipientId];
  }

  const effectiveClassId = recipientType === 'class'
    ? recipientId
    : targetClassId;

  if (effectiveClassId && !recipients.specificClasses.includes(effectiveClassId)) {
    recipients.specificClasses = [effectiveClassId];
  }

  return {
    title,
    content,
    priority,
    recipients,
    targetType: normalizeAudienceLabel(recipientType),
    targetClassId: effectiveClassId,
  };
}

function serializeAnnouncement(announcement) {
  const hasClassTargets = Array.isArray(announcement.recipients?.specificClasses) && announcement.recipients.specificClasses.length > 0;
  const targetType = announcement.targetType || (hasClassTargets ? 'class' : (announcement.recipients?.role || 'all'));
  return {
    id: announcement._id,
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    author: announcement.senderName || announcement.authorName || announcement.createdByName || 'Teacher',
    date: announcement.createdAt,
    createdAt: announcement.createdAt,
    recipientType: targetType,
    recipientRole: targetType,
    recipientClasses: announcement.recipients?.specificClasses || [],
    recipientUsers: announcement.recipients?.specificUsers || [],
    targetClassId: announcement.targetClassId || '',
    pinned: !!announcement.isPinned,
  };
}

function normalizeClassId(value = '') {
  return String(value || '').trim().toLowerCase();
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
    const { role, classId, userId, createdBy, limit = 20 } = req.query;
    const query = {};

    const roleFilter = [];
    if (role) {
      roleFilter.push({ 'recipients.role': role });
      if (role !== 'all') {
        roleFilter.push({ 'recipients.role': 'all' });
      }
    }

    if (roleFilter.length > 0) {
      query.$or = roleFilter;
    }

    if (classId) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'recipients.specificClasses': { $exists: false } },
          { 'recipients.specificClasses': { $size: 0 } },
          { 'recipients.specificClasses': classId },
          { 'recipients.specificClasses': { $in: [classId] } },
        ],
      });
    }

    if (userId) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'recipients.specificUsers': { $exists: false } },
          { 'recipients.specificUsers': { $size: 0 } },
          { 'recipients.specificUsers': userId },
          { 'recipients.specificUsers': { $in: [userId] } },
        ],
      });
    }

    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      query.createdBy = new mongoose.Types.ObjectId(createdBy);
    }

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(Math.max(1, Math.min(parseInt(limit, 10) || 20, 100)));

    res.json({
      success: true,
      data: announcements.map(serializeAnnouncement),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load announcements.',
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

// POST /api/communication/announcement
router.post('/announcement', async (req, res) => {
  try {
    const { title, content, priority, recipients, targetType, targetClassId } = buildAnnouncementPayload(req.body);
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required.',
      });
    }

    const createdByRaw = String(req.body.createdBy || '').trim();
    const createdBy = mongoose.Types.ObjectId.isValid(createdByRaw)
      ? new mongoose.Types.ObjectId(createdByRaw)
      : new mongoose.Types.ObjectId();

    const announcement = new Announcement({
      title,
      content,
      priority,
      createdBy,
      recipients,
      isPinned: !!req.body.isPinned,
      expiryDate: req.body.expiryDate || undefined,
      senderName: req.body.senderName || req.body.authorName || 'Teacher',
      createdByName: req.body.authorName || req.body.senderName || 'Teacher',
      targetType,
      targetClassId,
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      data: serializeAnnouncement(announcement),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save announcement.',
      details: error.message,
    });
  }
});

// POST /api/communication/group-message
router.post('/group-message', (req, res) => {
  // Group messaging
  res.json({ success: true });
});

export default router;
