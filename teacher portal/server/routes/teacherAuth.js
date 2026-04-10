import express from 'express';
import { buildTeacherAuthResponse, findTeacherByCredentials, findTeacherByIdentifier } from '../utils/adminTeacherAuth.js';
import { verifyToken } from '../utils/jwt.js';

const router = express.Router();

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

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded?.role === 'teacher') {
        const teacher = findTeacherByIdentifier(decoded.userId);
        if (teacher) return teacher;
      }
    } catch {
      // ignore and fall back to identity headers
    }
  }

  return findTeacherByIdentifier(fallbackTeacherId || fallbackEmail || fallbackName);
}

function authenticateTeacherRequest(req, res, next) {
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

router.post('/teacher-info', (req, res) => {
  try {
    const { teacherId, password } = req.body || {};
    if (!teacherId || !password) {
      return res.status(400).json({ success: false, error: 'Teacher ID and password are required.' });
    }

    const teacher = findTeacherByCredentials(teacherId, password);
    if (!teacher) {
      return res.status(401).json({ success: false, error: 'Invalid teacher ID or password.' });
    }

    return res.json({ success: true, user: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load teacher details.', details: error.message });
  }
});

router.post('/teacher-login', (req, res) => {
  try {
    const { teacherId, password } = req.body || {};
    if (!teacherId || !password) {
      return res.status(400).json({ success: false, error: 'Teacher ID and password are required.' });
    }

    const teacher = findTeacherByCredentials(teacherId, password);
    if (!teacher) {
      return res.status(401).json({ success: false, error: 'Invalid teacher ID or password.' });
    }

    return res.json(buildTeacherAuthResponse(teacher));
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Teacher login failed.', details: error.message });
  }
});

router.get('/teacher-lookup', (req, res) => {
  try {
    const teacherId = String(req.query?.teacherId || '').trim();
    if (!teacherId) {
      return res.status(400).json({ success: false, error: 'Teacher ID is required.' });
    }

    const teacher = findTeacherByIdentifier(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }

    return res.json({ success: true, user: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to lookup teacher.', details: error.message });
  }
});

router.get('/teacher-profile', authenticateTeacherRequest, (req, res) => {
  try {
    return res.json({ success: true, user: req.teacher });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load teacher profile.', details: error.message });
  }
});

export default router;
