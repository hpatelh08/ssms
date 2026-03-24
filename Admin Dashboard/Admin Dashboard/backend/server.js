// =============================================
//  SERVER ENTRY POINT — SSMS Backend
// =============================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Ensure DB + tables exist on first run
require('./config/db');

const errorHandler = require('./middleware/errorHandler');

// Import route modules
const authRoutes         = require('./routes/auth');
const studentRoutes      = require('./routes/students');
const teacherRoutes      = require('./routes/teachers');
const attendanceRoutes   = require('./routes/attendance');
const examRoutes         = require('./routes/exams');
const resultRoutes       = require('./routes/results');
const feeRoutes          = require('./routes/fees');
const feeStructureRoutes = require('./routes/feeStructure');
const staffRoutes        = require('./routes/staff');
const leaveRoutes        = require('./routes/leaves');
const noticeRoutes       = require('./routes/notices');
const dashboardRoutes    = require('./routes/dashboard');
const classRoutes        = require('./routes/classes');
const timetableRoutes    = require('./routes/timetable');
const holidayRoutes      = require('./routes/holidays');
const parentRoutes       = require('./routes/parents');
const reportRoutes       = require('./routes/reports');
const marksRoutes        = require('./routes/marks');
const vacationRoutes     = require('./routes/vacations');

const app = express();

// ---- Middleware ----
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---- API Routes ----
app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/teachers',      teacherRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/exams',         examRoutes);
app.use('/api/results',       resultRoutes);
app.use('/api/marks',         marksRoutes);
app.use('/api/fees',          feeRoutes);
app.use('/api/fee-structure', feeStructureRoutes);
app.use('/api/staff',         staffRoutes);
app.use('/api/leaves',        leaveRoutes);
app.use('/api/notices',       noticeRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/classes',       classRoutes);
app.use('/api/holidays',      holidayRoutes);
app.use('/api/vacations',     vacationRoutes);
app.use('/api/timetable',     timetableRoutes);
app.use('/api/parents',       parentRoutes);
app.use('/api/reports',       reportRoutes);

// ---- Serve static frontend ----
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- 404 for unknown API routes ----
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ---- Error handler ----
app.use(errorHandler);

// ---- Start server ----
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 SSMS Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
