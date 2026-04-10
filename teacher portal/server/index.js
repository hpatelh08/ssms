import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import teacherAuthRoutes from './routes/teacherAuth.js';
import attendanceRoutes from './routes/attendance.js';
import assignmentRoutes from './routes/assignment.js';
import teacherRoutes from './routes/teacher.js';
import classManagementRoutes from './routes/classManagement.js';
import attendanceManagementRoutes from './routes/attendanceManagement.js';
import assignmentManagementRoutes from './routes/assignmentManagement.js';
import examManagementRoutes from './routes/examManagement.js';
import studentManagementRoutes from './routes/studentManagement.js';
import communicationRoutes from './routes/communication.js';
import studyMaterialsRoutes from './routes/studyMaterials.js';
import parentAcademicsRoutes from './routes/parentAcademics.js';
import parentResourcesRoutes from './routes/parentResources.js';
import leaveManagementRoutes from './routes/leaveManagement.js';
import performanceAnalyticsRoutes from './routes/performanceAnalytics.js';
import reportsRoutes from './routes/reports.js';
import meetingsRoutes from './routes/meetings.js';

// Load env vars
dotenv.config();

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    const path = String(req.originalUrl || req.url || '');
    return (
      path.startsWith('/api/messages') ||
      path.startsWith('/api/communication') ||
      path.startsWith('/api/auth/teacher-info') ||
      path.startsWith('/api/auth/teacher-login') ||
      path.startsWith('/api/auth/teacher-profile')
    );
  }
});

app.use(limiter);

// Body parser middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', teacherAuthRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/class', classManagementRoutes);
app.use('/api/attendance-management', attendanceManagementRoutes);
app.use('/api/assignment', assignmentManagementRoutes);
app.use('/api/exam', examManagementRoutes);
app.use('/api/student', studentManagementRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/messages', communicationRoutes);
app.use('/api/study', studyMaterialsRoutes);
app.use('/api/parent', parentResourcesRoutes);
app.use('/api/parent', parentAcademicsRoutes);
app.use('/api', meetingsRoutes);
app.use('/api/leave', leaveManagementRoutes);
app.use('/api/parent/leave', leaveManagementRoutes);
app.use('/api/teacher/leave', leaveManagementRoutes);
app.use('/api/teacher/leaves', leaveManagementRoutes);
app.use('/api/analytics', performanceAnalyticsRoutes);
app.use('/api/reports', reportsRoutes);

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teacher_portal';

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed. Running in limited mode:', err.message);
  });
