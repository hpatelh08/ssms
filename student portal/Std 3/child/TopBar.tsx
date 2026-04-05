import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { DashboardSwitch } from '../components/DashboardSwitch';

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export const TopBar: React.FC = React.memo(() => {
  const { user, studentProfile } = useAuth();
  const displayName = useMemo(() => studentProfile?.studentName || user.name || 'Explorer', [studentProfile?.studentName, user.name]);
  const firstName = useMemo(() => displayName.split(' ')[0] || 'Explorer', [displayName]);
  const classLabel = useMemo(() => studentProfile?.className || `Std ${user.grade}`, [studentProfile?.className, user.grade]);
  const greeting = useMemo(getTimeGreeting, []);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profile = studentProfile || {
    studentName: displayName,
    className: classLabel,
    grade: user.grade,
    status: 'Active',
    studentId: '',
    password: '',
    admissionNumber: '',
    grNo: '',
    fatherName: '',
    parentName: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    division: 'A',
  };
  const division = profile.division || 'A';
  const fatherName = profile.fatherName || profile.parentName || '-';
  const openProfile = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowProfile(prev => (prev ? prev : true));
  }, []);

  return (
    <>
    <motion.header
      className="dashboard-header sticky top-0 z-40 w-full shrink-0"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div className="dashboard-header-shell">
        <div
          className="dashboard-header-card"
          style={{
            background: 'var(--gradient-topbar)',
            borderRadius: 28,
            boxShadow: 'var(--shadow-soft)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <div className="dashboard-header-left gap-3.5">
            <motion.button
              type="button"
              onClick={openProfile}
              onDoubleClick={(event) => event.preventDefault()}
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 52%, #7c3aed 100%)',
                boxShadow: 'var(--shadow-glow-purple)',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              aria-label="Open student profile"
            >
              {displayName[0]}
            </motion.button>
            <div className="min-w-0">
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  fontFamily: 'Nunito, Quicksand, sans-serif',
                }}
              >
                {displayName}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  lineHeight: 1.3,
                  marginTop: 2,
                }}
              >
                {classLabel} · {greeting} 👋
              </p>
            </div>
          </div>

          <div className="dashboard-header-center">
            <DashboardSwitch />
          </div>

          <div className="dashboard-header-right gap-3">
            <div className="relative">
              <motion.button
                onClick={() => setShowNotif(!showNotif)}
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 30,
                  background: 'rgba(15,23,42,0.82)',
                  boxShadow: 'var(--shadow-soft)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                whileHover={{ scale: 1.08, boxShadow: 'var(--shadow-glow-purple)' }}
                whileTap={{ scale: 0.92 }}
                aria-label="Notifications"
              >
                <span style={{ fontSize: 18 }}>🔔</span>
              </motion.button>

              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--pastel-pink-deep), #ef6b6b)',
                  boxShadow: '0 0 8px rgba(255,140,180,0.5)',
                  border: '2px solid white',
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <AnimatePresence>
                {showNotif && (
                  <motion.div
                    className="absolute right-0 top-14 w-72 rounded-3xl overflow-hidden"
                    style={{
                      background: 'rgba(9,14,27,0.94)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(148,163,184,0.16)',
                      boxShadow: 'var(--shadow-card-hover)',
                    }}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Notifications</p>
                    </div>
                    <div style={{ padding: 10 }}>
                      {[
                        { icon: '⭐', text: 'New star earned!', time: 'Just now', bg: 'rgba(59,130,246,0.18)' },
                        { icon: '🏆', text: 'Game completed!', time: '5 min ago', bg: 'rgba(124,58,237,0.18)' },
                        { icon: '📖', text: 'Reading streak is active!', time: 'Today', bg: 'rgba(56,189,248,0.16)' },
                      ].map((n, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            background: n.bg,
                            marginBottom: i < 2 ? 4 : 0,
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: 14, marginTop: 1 }}>{n.icon}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.text}</p>
                            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>

    <AnimatePresence>
      {showProfile && profile && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'rgba(255,255,255,0.28)', backdropFilter: 'blur(10px)' }}
            aria-label="Close student profile"
            onClick={() => setShowProfile(false)}
          />

          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-[30px]"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(245,247,255,0.98))',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 30px 70px rgba(59,130,246,0.18)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-profile-title"
          >
            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.18em]" style={{ background: 'rgba(99,102,241,0.10)', color: '#4f46e5' }}>
                    STUDENT PROFILE
                  </div>
                  <h2 id="student-profile-title" className="mt-3 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {profile.studentName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Admin-side student record for Std {profile.grade}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="h-10 w-10 rounded-2xl text-sm font-black"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(148,163,184,0.22)',
                    color: 'var(--text-primary)',
                  }}
                  aria-label="Close profile"
                >
                  X
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[160px_1fr]">
                <div className="rounded-[26px] p-5 text-center" style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.10), rgba(14,165,233,0.08))' }}>
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl font-black text-white" style={{ background: 'linear-gradient(135deg, var(--pastel-purple-deep), var(--pastel-pink-deep))' }}>
                    {profile.studentName?.[0] || firstName[0]}
                  </div>
                  <div className="mt-4 text-lg font-black" style={{ color: 'var(--text-primary)' }}>{profile.className}</div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{profile.status}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Student ID', profile.studentId],
                    ['Password', profile.password],
                    ['Admission No', profile.admissionNumber],
                    ['GR No', profile.grNo],
                    ['Father Name', fatherName],
                    ['Phone', profile.phone],
                    ['DOB', profile.dob],
                    ['Gender', profile.gender],
                    ['Blood Group', profile.bloodGroup],
                    ['Division', division],
                    ['Class', profile.className],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
                      <div className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400">{label}</div>
                      <div className="mt-1 text-sm font-bold text-slate-800">{value || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
});

TopBar.displayName = 'TopBar';

export default TopBar;
