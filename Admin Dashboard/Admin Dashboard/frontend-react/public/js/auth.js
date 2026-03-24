// =============================================
//  AUTH.JS â€” Authentication & Session Logic
// =============================================

const AUTH_KEY = 'ssms_auth';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// --- Fallback credentials (used only when backend is unreachable) ---
const VALID_USERS = [
  { email: 'admin001@admin.com', password: 'Admin@123', role: 'admin', name: 'Rahul Sharma' },
  { email: 'teacher102@teacher.com', password: 'Teacher@1', role: 'teacher', name: 'Priya Verma' },
  { email: 'teacher103@teacher.com', password: 'Teacher@1', role: 'teacher', name: 'Amit Gupta' },
  { email: 'student556@student.com', password: 'Student@1', role: 'student', name: 'Aryan Singh' },
  { email: 'parent776@parent.com', password: 'Parent@1', role: 'parent', name: 'Ravi Singh' },
  { email: 'accountant01@accountant.com', password: 'Acc@123', role: 'accountant', name: 'Neha Joshi' },
];

// --- Role â†’ Dashboard URL map ---
const ROLE_DASHBOARD = {
  admin: '/admin',
  teacher: '/login',
  accountant: '/login',
  student: '/login',
  parent: '/login',
};

function getRoleHome(role) {
  return ROLE_DASHBOARD[role] || 'dashboard.html';
}

function redirectToRoleHome(role) {
  window.location.href = getRoleHome(role);
}

// ---- Login (async â€” calls backend API first, falls back to local) ----
async function login(email, password) {
  // Try backend API first
  try {
    const data = await apiLogin(email, password);
    if (data && data.success && data.user) {
      if (data.user.role === 'super_admin') {
        return { success: false, message: 'Super Admin is disabled.' };
      }
      const session = {
        email: data.user.email,
        role: data.user.role,
        name: data.user.name,
        loginTime: Date.now()
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userName', data.user.name);
      return { success: true, role: data.user.role, name: data.user.name };
    }
  } catch (err) {
    // If backend returned explicit auth error, surface it
    if (err.status === 401 || err.status === 400) {
      return { success: false, message: err.error || 'Invalid email or password.' };
    }
    // Network error â€” fall through to local fallback
    console.warn('Backend unreachable, falling back to local auth');
  }

  // Fallback to local credentials (offline mode)
  const user = VALID_USERS.find(
    u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!user) return { success: false, message: 'Invalid email or password.' };

  const session = { email: user.email, role: user.role, name: user.name, loginTime: Date.now() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', user.name);
  return { success: true, role: user.role, name: user.name };
}

// ---- Parent login â€” Class 1-7 Access Key ----
async function loginWithAccessKey(studentId, accessKey) {
  try {
    const data = await api.post('/students/access-key-login', { student_id: studentId, access_key: accessKey });
    if (data && data.success && data.user) {
      if (data.token && typeof setToken === 'function') setToken(data.token);
      const session = { role: 'parent', name: data.user.name, loginTime: Date.now(), student_id: data.user.student_id };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      localStorage.setItem('userRole', 'parent');
      localStorage.setItem('userName', data.user.name);
      return { success: true, role: 'parent', name: data.user.name };
    }
  } catch (err) {
    return { success: false, message: err.error || 'Invalid Student ID or Access Key.' };
  }
  return { success: false, message: 'Login failed. Please try again.' };
}

// ---- Parent login â€” Class 8-10 Parent ID + Password ----
async function loginParent(parentId, password) {
  try {
    const data = await api.post('/parents/login', { parent_id: parentId, password });
    if (data && data.success && data.user) {
      if (data.token && typeof setToken === 'function') setToken(data.token);
      const session = { role: 'parent', name: data.user.name, loginTime: Date.now(), parent_id: data.user.parent_id };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      localStorage.setItem('userRole', 'parent');
      localStorage.setItem('userName', data.user.name);
      return { success: true, role: 'parent', name: data.user.name };
    }
  } catch (err) {
    return { success: false, message: err.error || 'Invalid Parent ID or password.' };
  }
  return { success: false, message: 'Login failed. Please try again.' };
}

// ---- Logout ----
function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  if (typeof removeToken === 'function') removeToken(); // Clear JWT
  window.location.href = '/login';
}

// ---- Get current user ----
function getUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ---- Session expiration ----
function isSessionExpired() {
  const user = getUser();
  if (!user || !user.loginTime) return true;
  return (Date.now() - user.loginTime) > SESSION_TTL_MS;
}

// ---- Guard: run on every protected page ----
function guardPage(allowedRoles) {
  const user = getUser();
  if (!user || isSessionExpired()) {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('userRole');
    window.location.href = '/login';
    return null;
  }
  if (allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)) {
    alert('Access denied for your role.');
    redirectToRoleHome(user.role);
    return null;
  }
  return user;
}


// ---- Populate top bar user info ----
function populateTopbar(user) {
  const nameEl = document.getElementById('topbar-name');
  const roleEl = document.getElementById('topbar-role');
  const avatarEl = document.getElementById('topbar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = formatRole(user.role);
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
}

// ---- Populate sidebar user info ----
function populateSidebar(user) {
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = formatRole(user.role);
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Show/hide nav items based on role
  document.querySelectorAll('[data-roles]').forEach(el => {
    const roles = el.getAttribute('data-roles').split(',').map(r => r.trim());
    if (!roles.includes(user.role) && !roles.includes('all')) {
      el.style.display = 'none';
    }
  });
}

// ---- Active nav highlight ----
function setActiveNav(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });
}

// ---- Format role ----
function formatRole(role) {
  return {
    admin: 'Admin', teacher: 'Teacher',
    accountant: 'Accountant', student: 'Student', parent: 'Parent'
  }[role] || role;
}

// ---- Init mobile sidebar toggle ----
function initMobileSidebar() {
  const btn = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const body = document.body;
  if (!btn || !sidebar) return;

  const isMobile = () => window.matchMedia('(max-width: 56.25rem)').matches;

  const handleToggle = () => {
    if (isMobile()) {
      sidebar.classList.toggle('open');
      return;
    }
    body.classList.toggle('sidebar-collapsed');
  };

  const handleResize = () => {
    if (isMobile()) {
      body.classList.remove('sidebar-collapsed');
    } else {
      sidebar.classList.remove('open');
    }
  };

  btn.addEventListener('click', handleToggle);
  window.addEventListener('resize', handleResize);
}

// ---- Page wiring (login, role) ----
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError') || document.getElementById('error-msg');
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  const showPwdBtn = document.getElementById('showPwd');
  const isAdminLogin = window.location.pathname.toLowerCase().includes('login.html');

  const showError = (msg) => {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = 'block';
  };
  const clearError = () => { if (errEl) errEl.style.display = 'none'; };

  if (loginForm && emailEl && passEl) {
    if (showPwdBtn) {
      showPwdBtn.addEventListener('click', () => {
        const type = passEl.getAttribute('type') === 'password' ? 'text' : 'password';
        passEl.setAttribute('type', type);
        showPwdBtn.textContent = type === 'password' ? 'Show' : 'Hide';
      });
    }

    const autoSubmit = () => {
      if (typeof loginForm.requestSubmit === 'function') loginForm.requestSubmit();
      else loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    };

    document.querySelectorAll('.demo-acc').forEach(btn => {
      btn.addEventListener('click', () => {
        emailEl.value = btn.dataset.email || '';
        passEl.value = btn.dataset.pass || btn.dataset.pw || '';
        clearError();
        autoSubmit();
      });
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const res = await login(emailEl.value, passEl.value);
      if (!res.success) return showError(res.message || 'Login failed.');

      localStorage.setItem('userRole', res.role);
      localStorage.setItem('userName', res.name);

      if (isAdminLogin && res.role !== 'admin') {
        localStorage.removeItem(AUTH_KEY);
        return showError('Only admin accounts can access this panel.');
      }

      redirectToRoleHome(res.role);
    });

    // Slight delay for page ready animations (used on landing)
    setTimeout(() => document.body.classList.add('ready'), 150);
  }

  const roleNameEl = document.getElementById('roleName');
  if (roleNameEl) {
    const role = (localStorage.getItem('userRole') || 'User').replace('_', ' ');
    roleNameEl.textContent = role;
  }
});

