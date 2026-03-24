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

  return (
    <div
      className="relative flex items-center rounded-full bg-white/70 p-1 shadow-md backdrop-blur-md"
      style={{
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 16px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)',
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
            ? 'linear-gradient(135deg, #818cf8, #6366f1)'
            : 'linear-gradient(135deg, #f472b6, #ec4899)',
          boxShadow: isStudent
            ? '0 3px 14px rgba(99,102,241,0.4)'
            : '0 3px 14px rgba(236,72,153,0.35)',
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
          fontWeight: 700,
          color: isStudent ? '#fff' : '#6b7280',
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
          fontWeight: 700,
          color: !isStudent ? '#fff' : '#6b7280',
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
