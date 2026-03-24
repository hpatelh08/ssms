// =============================================
//  AUTH ROUTES — Login, Me, Register
// =============================================
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
const SECRET = process.env.JWT_SECRET || 'ssms_default_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: EXPIRES }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  });
});

// GET /api/auth/me — get current user from token
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
});

// POST /api/auth/register (admin-only)
router.post('/register', authMiddleware, (req, res) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only admins can register users.' });
  }
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields required: email, password, name, role.' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (exists) return res.status(409).json({ error: 'Email already registered.' });

  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
  const result = stmt.run(email.trim(), hash, name.trim(), role);

  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// PUT /api/auth/password — change password
router.put('/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true, message: 'Password updated.' });
});

module.exports = router;
