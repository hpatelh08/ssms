import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
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
import leaveManagementRoutes from './routes/leaveManagement.js';
import performanceAnalyticsRoutes from './routes/performanceAnalytics.js';
import reportsRoutes from './routes/reports.js';

// Load env vars
dotenv.config();

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Body parser middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/class', classManagementRoutes);
app.use('/api/attendance-management', attendanceManagementRoutes);
app.use('/api/assignment', assignmentManagementRoutes);
app.use('/api/exam', examManagementRoutes);
app.use('/api/student', studentManagementRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/study', studyMaterialsRoutes);
app.use('/api/leave', leaveManagementRoutes);
app.use('/api/analytics', performanceAnalyticsRoutes);
app.use('/api/reports', reportsRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teacher_portal';

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed. Running in limited mode:', err.message);
  });
