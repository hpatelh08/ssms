import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';

interface DashboardSwitchProps {
  compact?: boolean;
}

export const DashboardSwitch: React.FC<DashboardSwitchProps> = React.memo(({ compact = false }) => {
  const { user, requestParentAccess, switchToStudentView } = useAuth();
  const isStudent = user.role === 'student';

  const handleSwitch = useCallback(
    (target: 'student' | 'parent') => {
      if (target === 'parent') {
        if (user.role === 'student') {
          requestParentAccess();
        }
        return;
      }

      if (user.role === 'parent') {
        switchToStudentView();
      }
    },
    [requestParentAccess, switchToStudentView, user.role],
  );

  const buttonPadding = compact ? 'px-3.5 py-2' : 'px-5 py-2';
  const buttonFontSize = compact ? 11 : 12;
  const inactiveTextColor = '#334155';
  const activeStudentGradient = 'linear-gradient(135deg, #4f46e5, #6366f1)';
  const activeParentGradient = 'linear-gradient(135deg, #2563eb, #06b6d4)';

  return (
    <div
      className="relative flex items-center rounded-full p-1 shadow-md backdrop-blur-md"
      style={{
        background: 'linear-gradient(135deg, rgba(241,245,249,0.96), rgba(226,232,240,0.92))',
        border: '1px solid rgba(148,163,184,0.35)',
        boxShadow: '0 6px 20px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
      role="tablist"
      aria-label="Dashboard view switch"
    >
      <motion.div
        className="absolute top-[4px] bottom-[4px]"
        style={{
          width: 'calc(50% - 4px)',
          borderRadius: 9999,
          background: isStudent
            ? activeStudentGradient
            : activeParentGradient,
          boxShadow: isStudent
            ? '0 6px 16px rgba(79,70,229,0.42)'
            : '0 6px 16px rgba(14,165,233,0.38)',
        }}
        animate={{ left: isStudent ? 4 : 'calc(50%)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />

      <button
        type="button"
        onClick={() => handleSwitch('student')}
        className={`relative z-10 flex items-center gap-1.5 rounded-full ${buttonPadding}`}
        style={{
          fontSize: buttonFontSize,
          fontWeight: 800,
          color: isStudent ? '#fff' : inactiveTextColor,
          transition: 'color 0.2s',
          background: 'transparent',
          border: 'none',
          whiteSpace: 'nowrap',
        }}
        role="tab"
        aria-selected={isStudent}
      >
        Student
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('parent')}
        className={`relative z-10 flex items-center gap-1.5 rounded-full ${buttonPadding}`}
        style={{
          fontSize: buttonFontSize,
          fontWeight: 800,
          color: !isStudent ? '#fff' : inactiveTextColor,
          transition: 'color 0.2s',
          background: 'transparent',
          border: 'none',
          whiteSpace: 'nowrap',
        }}
        role="tab"
        aria-selected={!isStudent}
      >
        Parent
      </button>
    </div>
  );
});

DashboardSwitch.displayName = 'DashboardSwitch';

export default DashboardSwitch;
