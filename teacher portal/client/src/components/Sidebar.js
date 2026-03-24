import React from 'react';
import { Home, CalendarCheck, Users, BookOpen, FileText, FolderOpen, MessageCircle, BarChart2, GraduationCap, ClipboardList, ChevronRight } from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', icon: <Home size={20} />, badge: null, page: 'dashboard' },
  { name: 'Attendance', icon: <CalendarCheck size={20} />, badge: null, page: 'attendance' },
  { name: 'Class Management', icon: <Users size={20} />, badge: null, page: 'class' },
  { name: 'Assignments', icon: <BookOpen size={20} />, badge: null, page: 'assignments' },
  { name: 'Exams & Marks', icon: <FileText size={20} />, badge: null, page: 'exams' },
  { name: 'Study Materials', icon: <FolderOpen size={20} />, badge: null, page: 'study-materials' },
  { name: 'Announcement', icon: <MessageCircle size={20} />, badge: null, page: 'communication' },
  { name: 'Leave Management', icon: <ClipboardList size={20} />, badge: null, page: 'leave' },
  { name: 'Analytics', icon: <BarChart2 size={20} />, badge: null, page: 'analytics' },
  { name: 'Reports', icon: <GraduationCap size={20} />, badge: null, page: 'reports' },
];

export default function Sidebar({ setCurrentPage, onLogout, currentPage }) {
  const handleClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <aside className="w-[270px] bg-gradient-to-b from-[#4338ca] via-[#3730a3] to-[#312e81] text-white flex flex-col py-6 px-3 shadow-sidebar min-h-screen relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      
      {/* Logo */}
      <div className="mb-8 px-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Teacher Portal</h1>
            <p className="text-[10px] text-indigo-200 font-medium tracking-wider uppercase">Management System</p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-1 overflow-y-auto">
        {navLinks.map((link, idx) => {
          const isActive = currentPage === link.page;
          return (
            <div
              key={link.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer relative group transition-all duration-200 ${
                isActive 
                  ? 'bg-white/20 shadow-lg sidebar-active-glow font-semibold' 
                  : 'hover:bg-white/10'
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => handleClick(link.page)}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-glow" />
              )}
              <div className={`flex-shrink-0 p-1.5 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-white/15' : 'group-hover:bg-white/10'
              }`}>
                {link.icon}
              </div>
              <span className="flex-1 text-sm font-medium">{link.name}</span>
              {link.badge && (
                <span className="bg-red-500 text-[10px] min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full font-bold shadow-md animate-pulse2">{link.badge}</span>
              )}
              {isActive && (
                <ChevronRight size={14} className="text-white/60" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom decoration */}
      <div className="mt-4 px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        <div className="text-center text-[10px] text-indigo-300/60 font-medium">
          © 2026 Teacher Portal
        </div>
      </div>
    </aside>
  );
}
