import express from 'express';
import Attendance from '../models/Attendance.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// POST /api/attendance/mark
router.post('/mark', async (req, res) => {
  const { date, classId, students, teacher } = req.body;
  const attendance = new Attendance({ date, classId, students, teacher });
  await attendance.save();
  res.json({ success: true });
});

// GET /api/attendance/report/:classId/:date
router.get('/report/:classId/:date', async (req, res) => {
  const { classId, date } = req.params;
  const attendance = await Attendance.findOne({ classId, date: new Date(date) });
  if (!attendance) return res.status(404).send('Not found');

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(18).text(`Attendance Report for Class ${classId} on ${date}`);
  doc.moveDown();
  attendance.students.forEach((s, i) => {
    doc.fontSize(12).text(`${i + 1}. Student: ${s.studentId} - ${s.status}`);
  });
  doc.end();
});

export default router;
