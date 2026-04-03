const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();

function normalizeInquiryType(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'General';

  const map = {
    admission: 'Admission',
    'admission inquiry': 'Admission',
    information: 'General',
    general: 'General',
    meeting: 'Campus Visit',
    'campus visit': 'Campus Visit',
    'student-support': 'Other',
    other: 'Other',
  };

  return map[raw.toLowerCase()] || raw;
}

function mapInquiryRow(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    inquiry_type: row.inquiry_type,
    message: row.message,
    status: row.status || 'new',
    response: row.response || '',
    responded_at: row.responded_at || '',
    visitor_username: row.visitor_username || '',
    created_at: row.created_at,
  };
}

// POST /api/visitor/inquiry
router.post('/visitor/inquiry', (req, res) => {
  const fullName = String(req.body.full_name || req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || req.body.mobileNumber || '').trim();
  const inquiryType = normalizeInquiryType(req.body.inquiry_type || req.body.purposeOfVisit || req.body.type);
  const message = String(req.body.message || '').trim();
  const visitorUsername = req.body.visitor_username || req.body.visitorUsername || null;

  if (!fullName || !email || !phone || !message) {
    return res.status(400).json({ error: 'Full name, email, phone, and message are required.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO visitor_inquiries
        (full_name, email, phone, inquiry_type, message, status, visitor_username)
      VALUES (?, ?, ?, ?, ?, 'new', ?)
    `);
    const result = stmt.run(fullName, email, phone, inquiryType, message, visitorUsername);

    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted',
      inquiry_id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('Error submitting visitor inquiry:', error);
    return res.status(500).json({ error: 'Unable to submit inquiry.' });
  }
});

// Admin-only visitor inquiry endpoints
router.use('/admin', authMiddleware, authorize('super_admin', 'admin'));

// GET /api/admin/visitor-inquiries
router.get('/admin/visitor-inquiries', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, full_name, email, phone, inquiry_type, message, status, created_at, response, responded_at, visitor_username
      FROM visitor_inquiries
      ORDER BY created_at DESC, id DESC
    `).all();

    const inquiries = rows.map(mapInquiryRow);
    const totalCount = inquiries.length;
    const newCount = inquiries.filter((item) => String(item.status || 'new').toLowerCase() === 'new').length;
    const respondedCount = inquiries.filter((item) => String(item.status || '').toLowerCase() === 'responded').length;

    return res.json({
      inquiries,
      total_count: totalCount,
      new_count: newCount,
      responded_count: respondedCount,
    });
  } catch (error) {
    console.error('Error fetching visitor inquiries:', error);
    return res.status(500).json({ error: 'Unable to load visitor inquiries.' });
  }
});

// POST /api/admin/inquiry/respond
router.post('/admin/inquiry/respond', (_req, res) => {
  const inquiryId = _req.body.inquiry_id || _req.body.inquiryId;
  const responseText = String(_req.body.response || _req.body.responseText || '').trim();

  if (!inquiryId || !responseText) {
    return res.status(400).json({ error: 'Inquiry ID and response are required.' });
  }

  try {
    const result = db.prepare(`
      UPDATE visitor_inquiries
      SET response = ?, status = 'responded', responded_at = datetime('now')
      WHERE id = ?
    `).run(responseText, inquiryId);

    if (!result.changes) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error responding to visitor inquiry:', error);
    return res.status(500).json({ error: 'Unable to send response.' });
  }
});

module.exports = router;
