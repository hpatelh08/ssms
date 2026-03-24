// =============================================
//  AUTH MIDDLEWARE — JWT verification
// =============================================
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'ssms_default_secret';

function authMiddleware(req, res, next) {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token; // support token in query string (for exports/downloads)
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Role-based access guard
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for your role.' });
    }
    next();
  };
}

module.exports = { authMiddleware, authorize };
