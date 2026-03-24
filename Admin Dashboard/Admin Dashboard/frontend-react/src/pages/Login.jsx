import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-ssms="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.ssms = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const DEMO_ACCOUNTS = [
  { role: 'Admin',       color: '#4f46e5', email: 'admin001@admin.com',         password: 'Admin@123'   },
  { role: 'Teacher',     color: '#0891b2', email: 'teacher102@teacher.com',      password: 'Teacher@123' },
  { role: 'Student',     color: '#16a34a', email: 'student556@student.com',      password: 'Student@123' },
  { role: 'Parent',      color: '#ea580c', email: 'parent776@parent.com',        password: 'Parent@123'  },
];

const FEATURES = [
  { icon: '👨‍🎓', label: 'Student & Teacher Management' },
  { icon: '💰', label: 'Fee & Accounts Tracking'        },
  { icon: '📄', label: 'Exams, Results & Reports'       },
  { icon: '📅', label: 'Attendance Monitoring'          },
  { icon: '📣', label: 'Notices & Communication'        },
  { icon: '👤', label: 'HR & Payroll Management'        },
];

export default function Login() {
  const navigate = useNavigate();

  const [showPwd, setShowPwd]         = useState(false);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [remember, setRemember]       = useState(false);
  const [loginError, setLoginError]   = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    (async () => {
      await loadScript('/js/api.js');
      await loadScript('/js/auth.js');
    })();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    if (!window.login) { setLoading(false); return; }
    const result = await window.login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/admin');
    } else {
      setLoginError(result.message || 'Invalid email or password.');
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoginError('');
    setLoading(true);
    setTimeout(async () => {
      if (!window.login) { setLoading(false); return; }
      const result = await window.login(demoEmail, demoPass);
      setLoading(false);
      if (result.success) {
        navigate('/admin');
      } else {
        setLoginError(result.message || 'Invalid email or password.');
      }
    }, 500);
  };

  return (
    <div className="login-page">

      {/* ===== LEFT PANEL ===== */}
      <div className="login-left">
        <div className="school-logo">🏫</div>
        <h1>Smart School<br />Management System</h1>
        <p>A comprehensive platform to manage students, staff,<br />fees, exams, attendance and more.</p>
        <div className="login-features">
          {FEATURES.map(f => (
            <div className="login-feature" key={f.label}>
              <span className="feat-icon">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="login-right">

        <div className="login-wave">👋</div>
        <div className="login-greeting">Welcome Back!</div>
        <div className="login-sub">Sign in to your school account to continue.</div>

        <form className="login-form" onSubmit={handleLogin}>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="lf-input-wrap">
              <span className="lf-icon">✉️</span>
              <input
                type="email"
                className="form-control lf-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. admin001@admin.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="lf-input-wrap">
              <span className="lf-icon">🔒</span>
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-control lf-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button type="button" className="lf-eye" onClick={() => setShowPwd(v => !v)}>
                <i className={showPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="lf-row">
            <label className="lf-remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="lf-forgot">Forgot Password?</button>
          </div>

          {loginError && (
            <div className="lf-error">{loginError}</div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="login-demo">
          <p>🚀 Quick Login — Demo Accounts:</p>
          <div className="demo-accounts">
            {DEMO_ACCOUNTS.map(d => (
              <button
                key={d.role}
                className="demo-acc"
                type="button"
                onClick={() => fillDemo(d.email, d.password)}
              >
                <span className="demo-role" style={{ background: d.color }}>{d.role}</span>
                {d.email}
              </button>
            ))}
          </div>
        </div>

        <div className="login-footer">© 2025 Smart School Management System. All rights reserved.</div>
      </div>
    </div>
  );
}
