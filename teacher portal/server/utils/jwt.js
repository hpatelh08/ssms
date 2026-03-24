import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Verify token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
};