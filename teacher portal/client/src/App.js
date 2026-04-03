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
import VisitorPage from './components/Visitor/VisitorPage';
import { findTeacherByIdentity } from './data/teachers';

function normalizeTeacherSession(user) {
  if (!user) return null;

  const currentName = String(user.name || '').trim();
  const shouldReplaceName = !currentName || currentName.toLowerCase() === 'teacher';
  const matchedTeacher = findTeacherByIdentity(user);

  return {
    ...user,
    name: shouldReplaceName ? (matchedTeacher?.name || currentName || 'Teacher') : currentName,
    assignedClass: user.assignedClass || matchedTeacher?.assignedClass || '',
    division: user.division || matchedTeacher?.division || '',
    teacherId: user.teacherId || matchedTeacher?.teacherId || user.email || '',
    email: user.email || matchedTeacher?.email || user.teacherId || ''
  };
}

function App() {
  const isVisitorRoute = window.location.pathname === '/visitor'
    || window.location.pathname === '/visitor/';
  const [currentPage, setCurrentPage] = useState('dashboard');
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
      setCurrentUser(normalizeTeacherSession(JSON.parse(userData)));
    }

    setAuthReady(true);
  }, []);

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
      default:
        return <Dashboard currentUser={currentUser} onLogout={handleLogout} onNavigate={setCurrentPage} />;
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

