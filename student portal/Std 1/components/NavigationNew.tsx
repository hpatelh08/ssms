/**
 * 🧭 Navigation v3 – Enhanced Sidebar + Bottom Nav
 * ===================================================
 * Collapsible sidebar, animated icons, active glow indicator,
 * hover expansion, tooltips, badge counts, smooth slide animation.
 * Parent section shield glow. Mobile bottom nav preserved.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  pendingHomework?: number;
}

const navItems = [
  { view: AppView.HOME, icon: '🏠', label: 'Home', gradient: 'from-blue-400 to-cyan-400', glowColor: 'rgba(59,130,246,0.4)', badge: 0 },
  { view: AppView.HOMEWORK, icon: '📖', label: 'AI Helper', gradient: 'from-green-400 to-emerald-400', glowColor: 'rgba(16,185,129,0.4)', badge: 0 },
  { view: AppView.GAMES, icon: '🎮', label: 'Games', gradient: 'from-purple-400 to-pink-400', glowColor: 'rgba(168,85,247,0.4)', badge: 0 },
  { view: AppView.ATTENDANCE, icon: '🌱', label: 'Garden', gradient: 'from-green-400 to-lime-400', glowColor: 'rgba(34,197,94,0.4)', badge: 0 },
  { view: AppView.PARENT_DASHBOARD, icon: '🛡️', label: 'Parent', gradient: 'from-blue-600 to-blue-800', glowColor: 'rgba(37,99,235,0.5)', badge: 0 },
  { view: AppView.REPORT_CARD, icon: '📄', label: 'Report', gradient: 'from-slate-500 to-slate-700', glowColor: 'rgba(71,85,105,0.45)', badge: 0 },
];

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, pendingHomework = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<AppView | null>(null);

  // Inject homework badge count
  const items = navItems.map(item => ({
    ...item,
    badge: item.view === AppView.HOMEWORK ? pendingHomework : item.badge,
  }));

  const sidebarWidth = collapsed ? 80 : 288; // 5rem / 18rem

  return (
    <>
      {/* ── Bottom Nav (Mobile/Tablet) ───── */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 h-20 glass-strong z-40 flex items-center justify-around px-2 lg:hidden"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
      >
        {items.map((item) => (
          <BottomNavButton
            key={item.view}
            active={currentView === item.view}
            onClick={() => setView(item.view)}
            icon={item.icon}
            label={item.label}
            gradient={item.gradient}
            badge={item.badge}
          />
        ))}
      </motion.nav>

      {/* ── Side Nav (Desktop) ───── */}
      <motion.nav
        className="hidden lg:flex fixed top-20 left-0 bottom-0 glass flex-col pt-6 pb-4 z-30 overflow-hidden"
        initial={{ x: -300 }}
        animate={{ x: 0, width: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
      >
        {/* Collapse Toggle */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/60 hover:bg-white/80 flex items-center justify-center text-gray-400 text-xs z-20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            ‹
          </motion.span>
        </motion.button>

        <div className="flex-1 space-y-1.5 px-3 mt-4">
          {items.map((item, i) => {
            const isActive = currentView === item.view;
            const isParent = item.view === AppView.PARENT_DASHBOARD;
            const isHovered = hoveredItem === item.view;

            return (
              <div key={item.view} className="relative">
                {/* Tooltip (collapsed mode) */}
                <AnimatePresence>
                  {collapsed && isHovered && (
                    <motion.div
                      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={() => setView(item.view)}
                  onMouseEnter={() => setHoveredItem(item.view)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-4 rounded-2xl font-medium transition-all relative overflow-hidden ${
                    collapsed ? 'px-0 py-3.5 justify-center' : 'px-5 py-3.5'
                  } ${
                    isActive
                      ? 'bg-white/80 shadow-lg shadow-blue-100/50 text-blue-900'
                      : 'text-blue-600/60 hover:bg-white/40 hover:text-blue-800'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Active background gradient */}
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-[0.06] rounded-2xl`}
                      layoutId="sideNavBg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Active glow indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                      style={{ background: item.glowColor, boxShadow: `0 0 12px ${item.glowColor}` }}
                      layoutId="navGlow"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon with animation */}
                  <div className="relative">
                    <motion.span
                      className="text-2xl relative z-10"
                      style={{
                        filter: isActive ? `drop-shadow(0 0 8px ${item.glowColor})` : 'none',
                      }}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {item.icon}
                    </motion.span>

                    {/* Parent shield glow */}
                    {isParent && isActive && (
                      <motion.div
                        className="absolute -inset-2 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Badge count */}
                    {item.badge > 0 && (
                      <motion.div
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <span className="text-[8px] font-black text-white">{item.badge}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Label (collapsed = hidden) */}
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        className="text-sm relative z-10 whitespace-nowrap"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active dot */}
                  {isActive && !collapsed && (
                    <motion.div
                      className="ml-auto w-2 h-2 rounded-full bg-blue-500 relative z-10"
                      layoutId="navDot"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Footer branding */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="mt-auto px-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 rounded-2xl p-4 text-center border border-blue-100/30">
                <span className="text-2xl mb-1 block">🎓</span>
                <p className="text-[10px] text-blue-500 font-bold">SSMS Learning</p>
                <p className="text-[9px] text-blue-300">Standard 1 Dashboard</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

// ─── Bottom Nav Button ───────────────────────────────────

const BottomNavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  gradient: string;
  badge: number;
}> = ({ active, onClick, icon, label, gradient, badge }) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col items-center gap-1 relative py-1 px-3"
    whileTap={{ scale: 0.85 }}
  >
    {active && (
      <motion.div
        className={`absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} opacity-20 blur-lg`}
        layoutId="bottomNavGlow"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
    <div className="relative">
      <motion.span
        className={`text-2xl relative z-10 ${active ? '' : 'opacity-50'}`}
        style={{ filter: active ? 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' : 'none' }}
        animate={active ? { y: -4 } : { y: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {icon}
      </motion.span>
      {badge > 0 && (
        <div className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-[8px] font-black text-white">{badge}</span>
        </div>
      )}
    </div>
    <span className={`text-[9px] font-bold relative z-10 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
      {label}
    </span>
  </motion.button>
);
