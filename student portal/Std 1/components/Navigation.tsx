
import React from 'react';
import { AppView, UserStats } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  stats: UserStats;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, stats }) => {
  return (
    <>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-blue-100 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">S</div>
          <span className="font-bold text-blue-900 hidden sm:inline">SSMS Companion</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            <span className="text-orange-500 font-bold">🔥 {stats.streak}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <span className="text-blue-500 font-bold">✨ {stats.xp} XP</span>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
            <img src="https://picsum.photos/seed/student/100/100" alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Bottom Nav (Mobile) / Side Nav (Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-blue-100 flex items-center justify-around z-40 lg:top-16 lg:left-0 lg:bottom-0 lg:w-64 lg:h-auto lg:flex-col lg:justify-start lg:pt-8 lg:border-t-0 lg:border-r">
        <NavItem 
          active={currentView === AppView.HOME} 
          onClick={() => setView(AppView.HOME)} 
          icon="🏠" 
          label="Home" 
        />
        <NavItem 
          active={currentView === AppView.HOMEWORK} 
          onClick={() => setView(AppView.HOMEWORK)} 
          icon="📖" 
          label="Homework" 
        />
        <NavItem 
          active={currentView === AppView.GAMES} 
          onClick={() => setView(AppView.GAMES)} 
          icon="🎮" 
          label="Games" 
        />
        <NavItem 
          active={currentView === AppView.ATTENDANCE} 
          onClick={() => setView(AppView.ATTENDANCE)} 
          icon="📅" 
          label="Attendance" 
        />
        <NavItem 
          active={currentView === AppView.PARENT_DASHBOARD} 
          onClick={() => setView(AppView.PARENT_DASHBOARD)} 
          icon="🛡️" 
          label="Parent Area" 
        />
      </nav>
    </>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 lg:w-full lg:px-6 lg:py-4 transition-all ${active ? 'text-blue-500 lg:bg-blue-50 lg:border-r-4 lg:border-blue-500' : 'text-gray-400 hover:text-blue-400'}`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] lg:text-base font-medium">{label}</span>
  </button>
);
