import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Authorization middleware - check user role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. Please authenticate.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of the following roles: ${roles.join(', ')}.` });
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Check if user is teacher
export const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teacher privileges required.' });
  }
  next();
};

// Check if user is student
export const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Student privileges required.' });
  }
  next();
};

// Check if user is parent
export const isParent = (req, res, next) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Access denied. Parent privileges required.' });
  }
  next();
};

// Check if user is accountant
export const isAccountant = (req, res, next) => {
  if (req.user.role !== 'accountant') {
    return res.status(403).json({ error: 'Access denied. Accountant privileges required.' });
  }
  next();
};