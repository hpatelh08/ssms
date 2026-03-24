// =============================================
//  FEES ROUTES — CRUD + receipts
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

function parseClassNumber(cls) {
  const match = String(cls || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function normalizeFeeValues(amount, paid) {
  const amt = Math.max(parseInt(amount, 10) || 0, 0);
  const requestedPaid = Math.max(parseInt(paid, 10) || 0, 0);
  const pd = Math.min(requestedPaid, amt);
  const due = Math.max(0, amt - pd);
  const status = due === 0 ? 'Paid' : pd === 0 ? 'Pending' : 'Partial';
  return { amt, pd, due, status, wasCapped: requestedPaid > amt };
}

function normalizeFeeRow(row) {
  if (!row) return row;
  const normalized = normalizeFeeValues(row.amount, row.paid);
  return {
    ...row,
    amount: normalized.amt,
    paid: normalized.pd,
    due: normalized.due,
    status: normalized.status
  };
}

function isFeeApplicable(cls) {
  const classNo = parseClassNumber(cls);
  return classNo !== null && classNo >= 9;
}

// Sync the fees column on the matching student record (class 9 & 10 only)
function syncStudentFeeStatus(student, cls, status) {
  const clsNum = String(parseClassNumber(cls) || '');
  if (!clsNum) return;
  const sectionMatch = String(cls || '').match(/[-\s]([A-Za-z])/);
  const section = sectionMatch ? sectionMatch[1].toUpperCase() : null;
  if (section) {
    db.prepare('UPDATE students SET fees = ? WHERE name = ? AND class = ? AND UPPER(section) = ?')
      .run(status, student, clsNum, section);
  } else {
    db.prepare('UPDATE students SET fees = ? WHERE name = ? AND class = ?')
      .run(status, student, clsNum);
  }
}

const FEE_CLASS_SQL = "(CASE WHEN instr(cls,'-') > 0 THEN CAST(substr(cls,1,instr(cls,'-') - 1) AS INTEGER) ELSE CAST(cls AS INTEGER) END)";

// GET /api/fees
router.get('/', (req, res) => {
  const { search, status, page = 1, limit = 50 } = req.query;
  let where = [`${FEE_CLASS_SQL} >= 9`];
  let params = [];

  if (search) {
    where.push('LOWER(student) LIKE ?');
    params.push(`%${search.toLowerCase()}%`);
  }
  if (status) { where.push('status = ?'); params.push(status); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as count FROM fees ${whereClause}`).get(...params).count;
  const fees = db.prepare(`SELECT * FROM fees ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, parseInt(limit), offset)
    .map(normalizeFeeRow);

  res.json({ data: fees, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/fees/stats — fee overview stats
router.get('/stats', (req, res) => {
  const NORMALIZED_AMOUNT_SQL = "CASE WHEN COALESCE(amount,0) < 0 THEN 0 ELSE COALESCE(amount,0) END";
  const NORMALIZED_PAID_SQL = `CASE
    WHEN COALESCE(paid,0) < 0 THEN 0
    WHEN COALESCE(paid,0) > ${NORMALIZED_AMOUNT_SQL} THEN ${NORMALIZED_AMOUNT_SQL}
    ELSE COALESCE(paid,0)
  END`;
  const NORMALIZED_DUE_SQL = `CASE
    WHEN (${NORMALIZED_AMOUNT_SQL} - (${NORMALIZED_PAID_SQL})) > 0 THEN (${NORMALIZED_AMOUNT_SQL} - (${NORMALIZED_PAID_SQL}))
    ELSE 0
  END`;
  const NORMALIZED_STATUS_SQL = `CASE
    WHEN ${NORMALIZED_DUE_SQL} = 0 THEN 'Paid'
    WHEN ${NORMALIZED_PAID_SQL} = 0 THEN 'Pending'
    ELSE 'Partial'
  END`;

  const totalPaid = db.prepare(`SELECT COALESCE(SUM(${NORMALIZED_PAID_SQL}),0) as val FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_STATUS_SQL} = 'Paid'`).get().val;
  const totalDue = db.prepare(`SELECT COALESCE(SUM(${NORMALIZED_DUE_SQL}),0) as val FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_STATUS_SQL} != 'Paid'`).get().val;
  const partialAmt = db.prepare(`SELECT COALESCE(SUM(${NORMALIZED_PAID_SQL}),0) as val FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_STATUS_SQL} = 'Partial'`).get().val;
  const totalAmount = db.prepare(`SELECT COALESCE(SUM(${NORMALIZED_AMOUNT_SQL}),0) as val FROM fees WHERE ${FEE_CLASS_SQL} >= 9`).get().val;
  const rate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const paidCount = db.prepare(`SELECT COUNT(*) as c FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_STATUS_SQL} = 'Paid'`).get().c;
  const pendingCount = db.prepare(`SELECT COUNT(*) as c FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_STATUS_SQL} = 'Pending'`).get().c;
  const partialCount = db.prepare(`SELECT COUNT(*) as c FROM fees WHERE ${FEE_CLASS_SQL} >= 9 AND ${NORMALIZED_STATUS_SQL} = 'Partial'`).get().c;

  res.json({ totalPaid, totalDue, partialAmt, rate, paidCount, pendingCount, partialCount });
});

// GET /api/fees/:id/receipt — enriched receipt data (fee + parent info) + stamp receipt_at
router.get('/:id/receipt', (req, res) => {
  const fee = normalizeFeeRow(db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id));
  if (!fee) return res.status(404).json({ error: 'Fee record not found.' });

  // Get parent info from students table
  const clsNum = String(parseClassNumber(fee.cls) || '');
  const sectionMatch = String(fee.cls || '').match(/[-\s]([A-Za-z])/);
  const section = sectionMatch ? sectionMatch[1].toUpperCase() : null;
  let student = null;
  if (section) {
    student = db.prepare('SELECT parent, phone FROM students WHERE LOWER(name)=LOWER(?) AND class=? AND UPPER(section)=?')
      .get(fee.student, clsNum, section);
  } else {
    student = db.prepare('SELECT parent, phone FROM students WHERE LOWER(name)=LOWER(?) AND class=?')
      .get(fee.student, clsNum);
  }

  // Stamp receipt_at if not already set
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (!fee.receipt_at) {
    db.prepare('UPDATE fees SET receipt_at=? WHERE id=?').run(now, fee.id);
    fee.receipt_at = now;
  }

  res.json({
    ...fee,
    parent_name:  student?.parent || null,
    parent_phone: student?.phone  || null,
  });
});

// GET /api/fees/:id — single record (receipt)
router.get('/:id', (req, res) => {
  const fee = normalizeFeeRow(db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id));
  if (!fee) return res.status(404).json({ error: 'Fee record not found.' });
  res.json(fee);
});

// POST /api/fees
router.post('/', authorize('super_admin', 'admin', 'accountant'), (req, res) => {
  const { id, student, cls, amount, paid, month, date } = req.body;
  if (!student) return res.status(400).json({ error: 'Student name is required.' });
  if (!isFeeApplicable(cls)) return res.status(400).json({ error: 'Fees are only applicable for classes 9 and 10.' });

  const normalized = normalizeFeeValues(amount, paid);
  if (normalized.wasCapped) {
    return res.status(400).json({ error: 'Paid amount cannot exceed total fee.' });
  }
  const { amt, pd, due, status } = normalized;
  const feeId = id || 'FEE' + Date.now();

  db.prepare(`
    INSERT INTO fees (id, student, cls, amount, paid, due, month, status, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(feeId, student, cls || '', amt, pd, due, month || '', status, date || '');

  syncStudentFeeStatus(student, cls, status);

  res.status(201).json({ success: true, id: feeId });
});

// PUT /api/fees/:id
router.put('/:id', authorize('super_admin', 'admin', 'accountant'), (req, res) => {
  const existing = db.prepare('SELECT id FROM fees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fee record not found.' });

  const { student, cls, amount, paid, month, date } = req.body;
  if (!isFeeApplicable(cls)) return res.status(400).json({ error: 'Fees are only applicable for classes 9 and 10.' });
  const normalized = normalizeFeeValues(amount, paid);
  if (normalized.wasCapped) {
    return res.status(400).json({ error: 'Paid amount cannot exceed total fee.' });
  }
  const { amt, pd, due, status } = normalized;

  db.prepare(`
    UPDATE fees SET student=?, cls=?, amount=?, paid=?, due=?, month=?, status=?, date=?
    WHERE id = ?
  `).run(student, cls, amt, pd, due, month, status, date, req.params.id);

  syncStudentFeeStatus(student, cls, status);

  res.json({ success: true });
});

// DELETE /api/fees/:id
router.delete('/:id', authorize('super_admin', 'admin', 'accountant'), (req, res) => {
  const result = db.prepare('DELETE FROM fees WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Fee record not found.' });
  res.json({ success: true });
});

// POST /api/fees/sync-students — re-sync all students.fees from the fees table
router.post('/sync-students', authorize('super_admin', 'admin'), (req, res) => {
  const students9plus = db.prepare(
    "SELECT id, name, class, section FROM students WHERE CAST(class AS INTEGER) >= 9"
  ).all();

  const getStatus = db.prepare(`
    SELECT status FROM fees
    WHERE LOWER(TRIM(student)) = LOWER(TRIM(?))
    ORDER BY CASE status WHEN 'Paid' THEN 1 WHEN 'Partial' THEN 2 ELSE 3 END
    LIMIT 1
  `);
  const updateFees = db.prepare("UPDATE students SET fees = ? WHERE id = ?");

  let synced = 0;
  for (const s of students9plus) {
    const row = getStatus.get(s.name);
    const newStatus = row ? row.status : 'Pending';
    updateFees.run(newStatus, s.id);
    synced++;
  }

  res.json({ success: true, synced });
});

module.exports = router;
