import express from 'express';
import Assignment from '../models/Assignment.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/assignments/create
router.post('/create', upload.single('file'), async (req, res) => {
  const { title, description, dueDate, teacher } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const assignment = new Assignment({ title, description, dueDate, fileUrl, teacher });
  await assignment.save();
  res.json({ success: true, assignment });
});

// GET /api/assignments/pending
router.get('/pending', async (req, res) => {
  // Placeholder: Return 3 pending assignments
  res.json({ count: 3 });
});

export default router;
