import { Navigate } from 'react-router-dom';

const AUTH_KEY = 'ssms_auth';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isSessionExpired() {
  const user = getUser();
  if (!user || !user.loginTime) return true;
  return Date.now() - user.loginTime > SESSION_TTL_MS;
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = getUser();

  if (!user || isSessionExpired()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
