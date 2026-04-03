import express from 'express';
import { getAdminTimetable } from '../utils/adminTimetable.js';
import { getAdminClassrooms, getAdminStudents, getAdminNotifications } from '../utils/adminClassroom.js';

const router = express.Router();

// GET /api/class/assigned
router.get('/assigned', (req, res) => {
  try {
    res.json({
      success: true,
      data: getAdminClassrooms(req.query),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load admin classes.',
      details: error.message,
    });
  }
});

// GET /api/class/subjects
router.get('/subjects', (req, res) => {
  try {
    const classrooms = getAdminClassrooms(req.query);
    const firstClassroom = classrooms[0];

    res.json({
      success: true,
      data: firstClassroom?.subjects || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load admin subjects.',
      details: error.message,
    });
  }
});

// GET /api/class/students
router.get('/students', (req, res) => {
  try {
    res.json({
      success: true,
      data: getAdminStudents(req.query),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load admin students.',
      details: error.message,
    });
  }
});

// GET /api/class/notifications
router.get('/notifications', (req, res) => {
  try {
    res.json({
      success: true,
      data: getAdminNotifications(req.query),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load notifications.',
      details: error.message,
    });
  }
});

// GET /api/class/timetable
router.get('/timetable', (req, res) => {
  try {
    const timetable = getAdminTimetable(req.query.std, req.query.section);

    if (timetable.error) {
      return res.status(400).json({ success: false, error: timetable.error });
    }

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load admin timetable.',
      details: error.message
    });
  }
});

// POST /api/class/lesson-plan
router.post('/lesson-plan', (req, res) => {
  // Save lesson plan
  res.json({ success: true });
});

export default router;
