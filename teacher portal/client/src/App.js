import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Teacher/Dashboard';
import AttendanceManagement from './components/Teacher/AttendanceManagement';
import AssignmentManagement from './components/Teacher/AssignmentManagement';
import ExamManagement from './components/Teacher/ExamManagement';
import StudyMaterials from './components/Teacher/StudyMaterials';
import Communication from './components/Teacher/Communication';
import LeaveManagement from './components/Teacher/LeaveManagement';
import PerformanceAnalytics from './components/Teacher/PerformanceAnalytics';
import Reports from './components/Teacher/Reports';
import MarksManagement from './components/Teacher/MarksManagement';
import ClassManagement from './components/Teacher/ClassManagement';
import StudentManagement from './components/Teacher/StudentManagement';
import TeacherProfile from './components/Teacher/Profile';
import VisitorPage from './components/Visitor/VisitorPage';
import axios from 'axios';
import { apiUrl } from './config/api';

function normalizeTeacherSession(user) {
  if (!user) return null;

  const currentName = String(user.name || user.teacherName || '').trim();
  const teacherId = String(user.teacherId || user.loginId || '').trim();
  const assignedClass = String(user.assignedClass || user.classTeacherStd || '').trim();
  const division = String(user.division || user.classTeacherDiv || '').trim().toUpperCase();

  return {
    ...user,
    name: currentName || teacherId || 'Teacher',
    assignedClass,
    division,
    teacherId,
    email: String(user.email || '').trim()
  };
}

function getAdminBackendBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5000';
  }
  const host = window.location.hostname || '127.0.0.1';
  return `${window.location.protocol}//${host}:5000`;
}

function normalizeLookup(value) {
  return String(value || '').trim().toLowerCase();
}

function parseAdminTeacherClass(rawClass, rawDivision) {
  const classText = String(rawClass || '').trim();
  const divisionText = String(rawDivision || '').trim().toUpperCase();
  const match = classText.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);

  if (!match) {
    return {
      assignedClass: classText,
      division: divisionText
    };
  }

  return {
    assignedClass: match[1],
    division: divisionText || String(match[2] || '').trim().toUpperCase()
  };
}

function shouldResolveTeacherName(user) {
  const teacherId = String(user?.teacherId || '').trim();
  const email = String(user?.email || '').trim();
  if (!teacherId && !email) return false;

  const name = String(user?.name || '').trim();
  if (!name) return true;
  if (name.toLowerCase() === 'teacher') return true;
  if (teacherId) return name === teacherId;
  return name === email;
}

function findTeacherFromMaster(teachers = [], user = {}) {
  const teacherIdKey = normalizeLookup(user?.teacherId);
  const emailKey = normalizeLookup(user?.email);

  return teachers.find((teacher) => {
    const idKey = normalizeLookup(teacher?.teacher_id || teacher?.teacherId || teacher?.emp || teacher?.id);
    const email = normalizeLookup(teacher?.email);
    return (teacherIdKey && idKey && teacherIdKey === idKey) || (emailKey && emailKey === email);
  });
}

function App() {
  const isVisitorRoute = window.location.pathname === '/visitor'
    || window.location.pathname === '/visitor/';
  const getInitialPage = () => {
    if (window.location.pathname === '/profile' || window.location.pathname === '/profile/') return 'profile';
    return 'dashboard';
  };
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const goToMainLogin = () => {
    const host = window.location.hostname || '127.0.0.1';
    // The main Smart School login UI is served by the admin React app on port 5173.
    window.location.replace(`${window.location.protocol}//${host}:5173/login`);
  };

  useEffect(() => {
    if (window.location.pathname === '/student-login' || window.location.pathname === '/student-login/') {
      goToMainLogin();
      return;
    }

    // SSO from main Smart School login page
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ssms_sso') === '1') {
        const userData = normalizeTeacherSession({
          name: params.get('name') || '',
          email: params.get('email') || '',
          teacherId: params.get('teacherId') || '',
          role: 'teacher',
          assignedClass: params.get('assignedClass') || '',
          division: params.get('division') || ''
        });
        localStorage.setItem('token', `teacher-${Date.now()}`);
        localStorage.setItem('user', JSON.stringify(userData));
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      // ignore
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Get user data if available
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = normalizeTeacherSession(JSON.parse(userData));
      setCurrentUser(parsedUser);

      if (token) {
        axios.get(apiUrl('/api/auth/teacher-profile'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 4000
        }).then((response) => {
          const syncedUser = normalizeTeacherSession({
            ...parsedUser,
            ...(response?.data?.user || {})
          });
          setCurrentUser(syncedUser);
          localStorage.setItem('user', JSON.stringify(syncedUser));
        }).catch(() => {
          // Keep the session user if admin sync is temporarily unavailable.
        });
      }
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!currentUser || !shouldResolveTeacherName(currentUser)) return;

    let cancelled = false;
    let retryTimer = null;
    const resolveTeacher = async () => {
      try {
        const response = await axios.get(apiUrl('/api/auth/teacher-lookup'), {
          params: { teacherId: currentUser.teacherId || currentUser.email || '' },
          timeout: 4000
        });
        const match = response?.data?.user;
        if (!match || cancelled) return;

        const parsedClass = parseAdminTeacherClass(match.class, match.division);
        const updatedUser = normalizeTeacherSession({
          ...currentUser,
          name: match.name || currentUser.name,
          email: match.email || currentUser.email,
          teacherId: currentUser.teacherId || match.teacher_id || match.emp || match.email,
          assignedClass: currentUser.assignedClass || parsedClass.assignedClass,
          division: currentUser.division || parsedClass.division,
          subject: currentUser.subject || match.subject
        });

        const needsUpdate = ['name', 'email', 'teacherId', 'assignedClass', 'division', 'subject']
          .some((key) => String(updatedUser?.[key] || '').trim() !== String(currentUser?.[key] || '').trim());

        if (!cancelled && needsUpdate) {
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch {
        try {
          const response = await axios.get(`${getAdminBackendBaseUrl()}/api/master/teacher-data`, { timeout: 4000 });
          const payload = response?.data?.data || response?.data || {};
          const teachers = Array.isArray(payload) ? payload : Array.isArray(payload?.teachers) ? payload.teachers : [];
          const match = findTeacherFromMaster(teachers, currentUser);
          if (!match || cancelled) return;

          const parsedClass = parseAdminTeacherClass(match.class, match.division);
          const updatedUser = normalizeTeacherSession({
            ...currentUser,
            name: match.name || currentUser.name,
            email: match.email || currentUser.email,
            teacherId: currentUser.teacherId || match.teacher_id || match.emp || match.email,
            assignedClass: currentUser.assignedClass || parsedClass.assignedClass,
            division: currentUser.division || parsedClass.division,
            subject: currentUser.subject || match.subject
          });

          const needsUpdate = ['name', 'email', 'teacherId', 'assignedClass', 'division', 'subject']
            .some((key) => String(updatedUser?.[key] || '').trim() !== String(currentUser?.[key] || '').trim());

          if (!cancelled && needsUpdate) {
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch {
          if (!cancelled) {
            retryTimer = setTimeout(resolveTeacher, 5000);
          }
        }
      }
    };

    resolveTeacher();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [currentUser]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPage = (page) => {
    setCurrentPage(page);
    if (page === 'profile') {
      window.history.pushState({}, '', '/profile');
    } else if (page === 'dashboard') {
      window.history.pushState({}, '', '/');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      case 'attendance':
        return <AttendanceManagement currentUser={currentUser} />;
      case 'class':
        return <ClassManagement currentUser={currentUser} />;
      case 'assignments':
        return <AssignmentManagement currentUser={currentUser} />;
      case 'exams':
        return <ExamManagement currentUser={currentUser} />;
      case 'study-materials':
        return <StudyMaterials currentUser={currentUser} />;
      case 'communication':
        return <Communication currentUser={currentUser} />;
      case 'students':
        return <StudentManagement currentUser={currentUser} />;
      case 'reports':
        return <Reports currentUser={currentUser} />;
      case 'leave':
        return <LeaveManagement />;
      case 'analytics':
        return <PerformanceAnalytics currentUser={currentUser} />;
      case 'profile':
        return <TeacherProfile currentUser={currentUser} onBack={() => navigateToPage('dashboard')} onLogout={handleLogout} />;
      default:
        return <Dashboard currentUser={currentUser} onLogout={handleLogout} onNavigate={navigateToPage} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    goToMainLogin();
  };

  useEffect(() => {
    if (authReady && !isLoggedIn && !isVisitorRoute) {
      goToMainLogin();
    }
  }, [authReady, isLoggedIn, isVisitorRoute]);

  if (isVisitorRoute) {
    return <VisitorPage />;
  }

  if (!authReady || !isLoggedIn) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f0f2f8] via-[#e8ecf4] to-[#f0f2f8]">
      <Sidebar setCurrentPage={setCurrentPage} onLogout={handleLogout} currentPage={currentPage} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

