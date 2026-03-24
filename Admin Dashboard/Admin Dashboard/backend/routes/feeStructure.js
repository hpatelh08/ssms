// =============================================
//  FEE STRUCTURE ROUTES
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// GET /api/fee-structure
router.get('/', (req, res) => {
  const data = db.prepare('SELECT * FROM fee_structure ORDER BY class').all();
  res.json({ data });
});

// GET /api/fee-structure/:class
router.get('/:cls', (req, res) => {
  const record = db.prepare('SELECT * FROM fee_structure WHERE class = ?').get(req.params.cls);
  if (!record) return res.status(404).json({ error: 'Fee structure not found for this class.' });
  res.json(record);
});

// PUT /api/fee-structure/:class
router.put('/:cls', authorize('super_admin', 'admin'), (req, res) => {
  const { total, tuition, lab, sports, misc, accent } = req.body;
  db.prepare(`
    INSERT INTO fee_structure (class, total, tuition, lab, sports, misc, accent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(class) DO UPDATE SET total=excluded.total, tuition=excluded.tuition,
      lab=excluded.lab, sports=excluded.sports, misc=excluded.misc, accent=excluded.accent
  `).run(parseInt(req.params.cls), total, tuition, lab || 0, sports || 0, misc || 0, accent || '');
  res.json({ success: true });
});

module.exports = router;
