// =============================================
//  PARENTS ROUTES — Full CRUD
// =============================================
const { Router } = require('express');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { authMiddleware, authorize } = require('../middleware/auth');
const { MIN_STANDARD, MAX_STANDARD, parseStandard, isSupportedStandard } = require('../config/standards');

const router = Router();

// ---- POST /api/parents/login — Public: Parent login ----
const jwt = require('jsonwebtoken');
router.post('/login', (req, res) => {
  const { parent_id, password } = req.body;
  if (!parent_id || !password) return res.status(400).json({ error: 'Parent ID and password are required.' });

  const parent = db.prepare('SELECT * FROM parents WHERE LOWER(parent_id) = LOWER(?)').get(parent_id.trim());
  if (!parent) return res.status(401).json({ error: 'Invalid Parent ID or password.' });
  if (parent.status !== 'Active') return res.status(403).json({ error: 'Account is inactive. Contact admin.' });

  const valid = bcrypt.compareSync(password, parent.password);
  if (!valid) return res.status(401).json({ error: 'Invalid Parent ID or password.' });

  const SECRET = process.env.JWT_SECRET || 'ssms_default_secret';
  const token = jwt.sign(
    { id: parent.id, role: 'parent', name: parent.father_name, parent_id: parent.parent_id },
    SECRET,
    { expiresIn: '8h' }
  );
  res.json({
    success: true,
    token,
    user: { id: parent.id, role: 'parent', name: parent.father_name, parent_id: parent.parent_id }
  });
});

router.use(authMiddleware);

/** Attach children array to a parent row */
function withChildren(parent) {
  const children = db.prepare(`
    SELECT s.id, s.name, s.class, s.section, s.dob, s.student_id
    FROM parent_children pc
    JOIN students s ON s.id = pc.student_id
    WHERE pc.parent_db_id = ?
    ORDER BY s.class, s.name
  `).all(parent.id);
  return { ...parent, children };
}

/** Link child to parent (supported classes only) */
function linkChild(parentDbId, studentId) {
  const stu = db.prepare('SELECT id, class FROM students WHERE id = ?').get(studentId);
  if (!stu) return false;
  const cls = parseStandard(stu.class);
  if (!isSupportedStandard(cls)) return false;
  db.prepare('INSERT OR IGNORE INTO parent_children (parent_db_id, student_id) VALUES (?, ?)').run(parentDbId, stu.id);
  return true;
}

// ---- GET /api/parents — list all with children ----
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM parents ORDER BY created_at DESC').all();
  res.json(rows.map(withChildren));
});

// ---- GET /api/parents/counts ----
router.get('/counts', (req, res) => {
  const active   = db.prepare("SELECT COUNT(*) as c FROM parents WHERE status = 'Active'").get().c;
  const inactive = db.prepare("SELECT COUNT(*) as c FROM parents WHERE status = 'Inactive'").get().c;
  res.json({ active, inactive, total: active + inactive });
});

// ---- GET /api/parents/:id ----
router.get('/:id', (req, res) => {
  const parent = db.prepare('SELECT * FROM parents WHERE id = ?').get(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Parent not found.' });
  res.json(withChildren(parent));
});

// ---- POST /api/parents — create parent + link children ----
router.post('/', authorize('super_admin', 'admin'), (req, res) => {
  const { father_name, father_phone, mother_name, mother_phone, occupation, children = [] } = req.body;
  if (!father_name) return res.status(400).json({ error: 'Father name is required.' });

  const result = db.transaction(() => {
    // Sequential PAR ID
    const nextSeq = (db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM parents').get().n);
    const parentId = 'PAR' + String(nextSeq).padStart(3, '0');

    // Auto-password: first 4 letters of father's name + @ + last 4 digits of father's mobile
    // e.g. "Rajesh" + "9876543210" → "Raje@3210"
    let password = 'Par@' + String(Date.now()).slice(-4); // fallback if no phone
    if (father_name && father_phone) {
      const namePart  = father_name.replace(/\s+/g, '').slice(0, 4);
      const phonePart = String(father_phone).replace(/\D/g, '').slice(-4);
      if (namePart && phonePart) password = namePart + '@' + phonePart;
    }

    const ins = db.prepare(`
      INSERT INTO parents (parent_id, father_name, father_phone, mother_name, mother_phone, occupation, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `);
    const hash = bcrypt.hashSync(password, 10);
    const { lastInsertRowid: dbId } = ins.run(
      parentId, father_name, father_phone || '',
      mother_name || '', mother_phone || '', occupation || '', hash
    );

    children.forEach(sid => linkChild(dbId, sid));

    // ---- Sync parent_id + parent name into students table ----
    db.prepare('UPDATE students SET parent_id = NULL WHERE parent_id = ? AND CAST(class AS INTEGER) BETWEEN ? AND ?')
      .run(parentId, MIN_STANDARD, MAX_STANDARD);
    children.forEach(sid => {
      db.prepare('UPDATE students SET parent_id = ?, parent = ? WHERE id = ?')
        .run(parentId, father_name, sid);
    });

    return { dbId, parentId, password };
  })();

  res.status(201).json({
    success: true,
    id: result.dbId,
    parent_id: result.parentId,
    password: result.password
  });
});

// ---- PUT /api/parents/:id ----
router.put('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const existing = db.prepare('SELECT id, parent_id FROM parents WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Parent not found.' });

  const { father_name, father_phone, mother_name, mother_phone, occupation, status, children } = req.body;

  db.prepare(`
    UPDATE parents
    SET father_name=?, father_phone=?, mother_name=?, mother_phone=?, occupation=?, status=?
    WHERE id=?
  `).run(
    father_name, father_phone || '', mother_name || '',
    mother_phone || '', occupation || '', status || 'Active',
    req.params.id
  );

  if (Array.isArray(children)) {
    // Clear old links and parent_id + parent name for old linked students
    const oldLinks = db.prepare('SELECT student_id FROM parent_children WHERE parent_db_id = ?').all(req.params.id);
    oldLinks.forEach(r => {
      db.prepare("UPDATE students SET parent_id = NULL, parent = '' WHERE id = ? AND parent_id = ?")
        .run(r.student_id, existing.parent_id);
    });
    db.prepare('DELETE FROM parent_children WHERE parent_db_id = ?').run(req.params.id);

    // Add new links — write parent_id + father_name into students
    children.forEach(sid => {
      if (linkChild(req.params.id, sid)) {
        db.prepare('UPDATE students SET parent_id = ?, parent = ? WHERE id = ?')
          .run(existing.parent_id, father_name, sid);
      }
    });
  } else {
    // children list not changed — if father_name was updated, sync it to all currently linked students
    if (father_name) {
      db.prepare(`
        UPDATE students SET parent = ?
        WHERE parent_id = ? AND CAST(class AS INTEGER) BETWEEN ? AND ?
      `).run(father_name, existing.parent_id, MIN_STANDARD, MAX_STANDARD);
    }
  }

  res.json({ success: true });
});

// ---- PUT /api/parents/:id/password ----
router.put('/:id/password', authorize('super_admin', 'admin'), (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required.' });
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare('UPDATE parents SET password=? WHERE id=?').run(hash, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Parent not found.' });
  res.json({ success: true });
});

// ---- DELETE /api/parents/:id ----
router.delete('/:id', authorize('super_admin', 'admin'), (req, res) => {
  const par = db.prepare('SELECT id, parent_id FROM parents WHERE id = ?').get(req.params.id);
  if (!par) return res.status(404).json({ error: 'Parent not found.' });
  // Clear parent_id + parent name from all linked students before deleting
  db.prepare("UPDATE students SET parent_id = NULL, parent = '' WHERE parent_id = ?").run(par.parent_id);
  const r = db.prepare('DELETE FROM parents WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Parent not found.' });
  res.json({ success: true });
});

module.exports = router;
