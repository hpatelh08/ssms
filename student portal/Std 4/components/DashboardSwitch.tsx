/**
 * components/DashboardSwitch.tsx
 * ─────────────────────────────────────────────────────
 * Magical pill-style segmented toggle for switching
 * between Student and Parent dashboards.
 *
 * Rounded pill with soft glow, spring animation,
 * gradient active state — matches the magical design system.
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
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 16px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Sliding highlight pill */}
      <motion.div
        className="absolute top-[4px] bottom-[4px]"
        style={{
          width: 'calc(50% - 4px)',
          borderRadius: 9999,
          background: isStudent
            ? 'linear-gradient(135deg, #818cf8, #6366f1)'
            : 'linear-gradient(135deg, #f472b6, #ec4899)',
          boxShadow: isStudent
            ? '0 3px 14px rgba(99,102,241,0.4)'
            : '0 3px 14px rgba(236,72,153,0.35)',
        }}
        animate={{ left: isStudent ? 4 : 'calc(50%)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />

      {/* Student button */}
      <button
        onClick={() => handleSwitch('student')}
        className="relative z-10 flex items-center gap-1.5 cursor-pointer px-5 py-2 rounded-full"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: isStudent ? '#fff' : '#6b7280',
          transition: 'color 0.2s',
          background: 'transparent',
          border: 'none',
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
      >
        <span style={{ fontSize: 14 }}>🧑‍🎓</span>
        Student
      </button>

      {/* Parent button */}
      <button
        onClick={() => handleSwitch('parent')}
        className="relative z-10 flex items-center gap-1.5 cursor-pointer px-5 py-2 rounded-full"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: !isStudent ? '#fff' : '#6b7280',
          transition: 'color 0.2s',
          background: 'transparent',
          border: 'none',
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
      >
        <span style={{ fontSize: 14 }}>👨‍👩‍👧</span>
        Parent
      </button>
    </div>
  );
});

DashboardSwitch.displayName = 'DashboardSwitch';
