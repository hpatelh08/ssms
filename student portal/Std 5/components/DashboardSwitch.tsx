/**
 * components/DashboardSwitch.tsx
 * -----------------------------------------------------
 * Magical pill-style segmented toggle for switching
 * between Student and Parent dashboards.
 *
 * Rounded pill with soft glow, spring animation,
 * gradient active state - matches the magical design system.
 *
 * Uses AuthContext.switchRole() for instant switch
 * without page reload.
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';

export const DashboardSwitch: React.FC = React.memo(() => {
  const { user, switchRole } = useAuth();
  const isStudent = user.role === 'student';
  const activeGradient = isStudent
    ? 'linear-gradient(135deg, #86c978, #3f8f3a)'
    : 'linear-gradient(135deg, #5d9c4f, #2f6a35)';
  const activeShadow = isStudent
    ? '0 3px 14px rgba(63,143,58,0.38)'
    : '0 3px 14px rgba(47,106,53,0.34)';

  const handleSwitch = useCallback(
    (target: 'student' | 'parent') => {
      if (user.role !== target) switchRole();
    },
    [user.role, switchRole],
  );

  return (
    <div
      className="relative flex items-center bg-white/70 backdrop-blur-md rounded-full p-1 shadow-md"
      style={{
        border: '1px solid rgba(88,129,74,0.22)',
        boxShadow: '0 2px 16px rgba(63,143,58,0.14), 0 1px 4px rgba(24,62,34,0.08)',
        background: 'linear-gradient(180deg, rgba(249,255,246,0.92), rgba(239,249,233,0.84))',
      }}
    >
      <motion.div
        className="absolute top-[4px] bottom-[4px]"
        style={{
          width: 'calc(50% - 4px)',
          borderRadius: 9999,
          background: activeGradient,
          boxShadow: activeShadow,
        }}
        animate={{ left: isStudent ? 4 : 'calc(50%)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />

      <button
        onClick={() => handleSwitch('student')}
        className="relative z-10 flex items-center gap-1.5 cursor-pointer px-5 py-2 rounded-full"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: isStudent ? '#f8fff2' : '#5f7664',
          transition: 'color 0.2s',
          background: 'transparent',
          border: 'none',
          whiteSpace: 'nowrap',
        }}
        type="button"
      >
        <span style={{ fontSize: 14 }}>🎓</span>
        Student
      </button>

      <button
        onClick={() => handleSwitch('parent')}
        className="relative z-10 flex items-center gap-1.5 cursor-pointer px-5 py-2 rounded-full"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: !isStudent ? '#f8fff2' : '#5f7664',
          transition: 'color 0.2s',
          background: 'transparent',
          border: 'none',
          whiteSpace: 'nowrap',
        }}
        type="button"
      >
        <span style={{ fontSize: 14 }}>👨‍👩‍👧</span>
        Parent
      </button>
    </div>
  );
});

DashboardSwitch.displayName = 'DashboardSwitch';
