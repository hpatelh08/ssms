import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile, changePassword, getTeacherInfo } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
// Get teacher info for login preview
router.post('/teacher-info', getTeacherInfo);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

// Private routes (require authentication)
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
