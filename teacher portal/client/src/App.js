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

function SsoRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
          <span className="text-3xl">🏫</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Teacher Portal</h1>
        <p className="text-gray-600 mt-2 text-sm font-medium">
          Please login from the main Smart School login page.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="http://127.0.0.1:5000/login"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-base shadow-lg transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Go to Login
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-indigo-700 text-base border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // SSO from main Smart School login page
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ssms_sso') === '1') {
        const userData = {
          name: params.get('name') || 'Teacher',
          email: params.get('email') || '',
          role: 'teacher',
          assignedClass: params.get('assignedClass') || '',
          division: params.get('division') || ''
        };
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
      setCurrentUser(JSON.parse(userData));
    }
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
  };

  if (!isLoggedIn) {
    return <SsoRequired />;
  }

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
