import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-ssms="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.ssms = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const DEMO_ACCOUNTS = [
  { role: 'Admin', name: 'Rahul Sharma', color: '#4f46e5', email: 'admin001@admin.com', password: 'Admin@123' },
  { role: 'Teacher', name: 'Class 1-A Teacher', color: '#0891b2', email: 'TCH2024001', password: 'Tch@001' },
];

const VISITOR_ITEMS = [
  { icon: '\u{1F3EB}', title: 'Welcome Visitors', desc: 'Explore the school environment and services.' },
  { icon: '\u{1F4DA}', title: 'Programs & Curriculum', desc: 'Overview of academics, clubs and labs.' },
  { icon: '\u{1F393}', title: 'Admissions Info', desc: 'Eligibility, seats, and application timeline.' },
  { icon: '\u{1F4CD}', title: 'Campus Facilities', desc: 'Library, sports, transport and safety.' },
  { icon: '\u{1F91D}', title: 'Parent Connect', desc: 'Meetings, updates and support channels.' },
  { icon: '\u{1F3C6}', title: 'Achievements', desc: 'Student awards, projects and events.' },
  { icon: '\u{1F4E3}', title: 'Announcements', desc: 'Latest circulars and community notices.' },
  { icon: '\u{1F9D1}\u{200D}\u{1F3EB}', title: 'Faculty Team', desc: 'Experienced teachers and mentors.' },
];

const LOGIN_OPTIONS = DEMO_ACCOUNTS.map(d => ({
  label: d.email,
  value: d.email,
  email: d.email,
}));

function normalizeLoginIdentifier(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const emailMatch = raw.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (emailMatch) return emailMatch[0];

  const lower = raw.toLowerCase();
  const option = LOGIN_OPTIONS.find(item =>
    item.label.toLowerCase() === lower ||
    item.email.toLowerCase() === lower
  );
  return option ? option.email : raw;
}

export default function Login() {
  const navigate = useNavigate();

  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await loadScript('/js/api.js');
      await loadScript('/js/auth.js');
    })();
  }, []);

  const redirectByRole = (result, fallbackIdentifier) => {
    if (result.role === 'admin') {
      navigate('/admin');
      return;
    }

    if (result.role === 'teacher') {
      const params = new URLSearchParams({
        ssms_sso: '1',
        email: result.email || fallbackIdentifier || '',
        name: result.name || 'Teacher',
        assignedClass: result.assignedClass || '1',
        division: result.division || 'A',
      });
      window.location.href = `http://localhost:3000/?${params.toString()}`;
      return;
    }

    setLoginError('This login page currently opens only admin and teacher portals.');
  };

  const openVisitorPage = () => {
    navigate('/visitor');
  };

  const openStudentPortal = () => {
    navigate('/student-login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    if (!window.login) {
      setLoading(false);
      return;
    }
    const result = await window.login(normalizeLoginIdentifier(email), password);
    setLoading(false);
    if (result.success) {
      redirectByRole(result, email);
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
      if (!window.login) {
        setLoading(false);
        return;
      }
      const result = await window.login(normalizeLoginIdentifier(demoEmail), demoPass);
      setLoading(false);
      if (result.success) {
        redirectByRole(result, demoEmail);
      } else {
        setLoginError(result.message || 'Invalid email or password.');
      }
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="school-logo">{'\u{1F3EB}'}</div>
        <h1>Smart School<br />Management System</h1>
        <p>A comprehensive platform to manage students, staff,<br />fees, exams, attendance and more.</p>
        <div className="visitor-wrap">
          <div className="visitor-title">School Visitor Page</div>
          <div className="visitor-sub">A live glimpse for guests - loops forever.</div>
          <button type="button" className="visitor-cta" onClick={openVisitorPage}>
            Open Visitor Page
            <i className="fa-solid fa-arrow-right" />
          </button>
          <div className="visitor-loop" aria-hidden="true">
            <div className="visitor-track">
              {VISITOR_ITEMS.map(item => (
                <div className="visitor-card" key={`v1-${item.title}`}>
                  <div className="visitor-icon">{item.icon}</div>
                  <div className="visitor-text">
                    <div className="visitor-name">{item.title}</div>
                    <div className="visitor-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
              {VISITOR_ITEMS.map(item => (
                <div className="visitor-card" key={`v2-${item.title}`}>
                  <div className="visitor-icon">{item.icon}</div>
                  <div className="visitor-text">
                    <div className="visitor-name">{item.title}</div>
                    <div className="visitor-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-wave">{'\u{1F44B}'}</div>
        <div className="login-greeting">Welcome Back!</div>
        <div className="login-sub">Sign in to your school account to continue.</div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Search by Email / Teacher ID</label>
            <div className="lf-input-wrap">
              <span className="lf-icon">{'\u{2709}\u{FE0F}'}</span>
              <input
                type="text"
                className="form-control lf-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                list="login-identities"
                placeholder="Search by email or teacher ID"
                required
              />
            </div>
            <datalist id="login-identities">
              {LOGIN_OPTIONS.map(option => (
                <option key={option.email} value={option.label} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="lf-input-wrap">
              <span className="lf-icon">{'\u{1F512}'}</span>
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
            {loading ? 'Signing in...' : 'Sign In ->'}
          </button>
        </form>

        <div className="login-demo">
          <p>{'\u{1F680}'} Quick Login — Demo Accounts:</p>
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

        <div className="login-footer">
          <span>© 2025 Smart School Management System. All rights reserved.</span>
          <button type="button" className="student-portal-link" onClick={openStudentPortal}>
            Student Portal
          </button>
        </div>
      </div>
    </div>
  );
}
