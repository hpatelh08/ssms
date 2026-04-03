/**
 * parent/components/books/ParentLocksPanel.tsx
 * ─────────────────────────────────────────────
 * Parent-only settings panel for controlling child access.
 *
 * Features:
 *  - PIN setup / change (4-digit)
 *  - Toggle locks on: AI Chat, Quiz, Play
 *  - Safe mode toggle
 *  - Weekly report summary
 *
 * All data via progressTracker.ts localStorage API.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getParentLocks,
  setParentLocks,
  verifyParentPin,
  getWeeklyReport,
  getSubjectStrengths,
  type ParentLock,
  type WeeklyReport,
  type SubjectStrength,
} from '../../../services/progressTracker';

interface ParentLocksPanelProps {
  onClose: () => void;
}

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

export const ParentLocksPanel: React.FC<ParentLocksPanelProps> = ({ onClose }) => {
  const [locks, setLocks] = useState<ParentLock>(getParentLocks);
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [settingNewPin, setSettingNewPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'new' | 'confirm'>('new');
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [strengths, setStrengths] = useState<SubjectStrength[]>([]);
  const [saved, setSaved] = useState(false);

  // If no PIN set, allow direct access
  useEffect(() => {
    const current = getParentLocks();
    if (!current.pin) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      setWeeklyReport(getWeeklyReport());
      setStrengths(getSubjectStrengths());
    }
  }, [authenticated]);

  // ─── PIN verification ───────────────────────────

  const handleVerifyPin = () => {
    if (verifyParentPin(pinInput)) {
      setAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Try again.');
      setPinInput('');
    }
  };

  // ─── Set new PIN ────────────────────────────────

  const handleSetNewPin = () => {
    if (pinStep === 'new') {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        setPinError('PIN must be exactly 4 digits');
        return;
      }
      setPinStep('confirm');
      setPinError('');
      return;
    }

    if (confirmPin !== newPin) {
      setPinError('PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }

    const updated: ParentLock = { ...locks, pin: newPin };
    setLocks(updated);
    setParentLocks(updated);
    setSettingNewPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinStep('new');
    setPinError('');
    flashSaved();
  };

  // ─── Toggle locks ──────────────────────────────

  const toggleLock = (key: 'ai' | 'quiz' | 'play' | 'safeMode') => {
    const updated: ParentLock = { ...locks, [key]: !locks[key] };
    setLocks(updated);
    setParentLocks(updated);
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // ─── PIN Entry Screen ──────────────────────────

  if (!authenticated) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <motion.div
          className="relative w-full max-w-sm rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={spring}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-lg font-black text-gray-800 mb-1">Parent Access</h2>
          <p className="text-xs text-gray-400 mb-6">Enter your 4-digit PIN</p>

          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-12 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                style={{
                  background: pinInput[i] ? 'rgba(99,102,241,0.1)' : 'rgba(243,244,246,0.8)',
                  border: pinInput[i] ? '2px solid rgba(99,102,241,0.3)' : '1px solid rgba(226,232,240,0.5)',
                  color: '#d97706',
                }}
              >
                {pinInput[i] ? '●' : ''}
              </div>
            ))}
          </div>

          <input
            type="number"
            value={pinInput}
            onChange={e => setPinInput(e.target.value.slice(0, 4))}
            className="sr-only"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && pinInput.length === 4) handleVerifyPin(); }}
          />

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, idx) => {
              if (num === null) return <div key={idx} />;
              return (
                <motion.button
                  key={idx}
                  onClick={() => {
                    if (num === 'del') setPinInput(p => p.slice(0, -1));
                    else if (pinInput.length < 4) setPinInput(p => p + num);
                  }}
                  className="h-12 rounded-2xl text-base font-bold cursor-pointer"
                  style={{
                    background: num === 'del' ? 'rgba(239,68,68,0.08)' : 'rgba(243,244,246,0.8)',
                    color: num === 'del' ? '#ef4444' : '#374151',
                    border: '1px solid rgba(226,232,240,0.4)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {num === 'del' ? '⌫' : num}
                </motion.button>
              );
            })}
          </div>

          {pinError && <p className="text-xs text-red-500 font-bold mb-3">{pinError}</p>}

          <div className="flex gap-2">
            <motion.button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer"
              style={{ background: 'rgba(243,244,246,0.8)', border: '1px solid rgba(226,232,240,0.4)' }}
              whileTap={{ scale: 0.97 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleVerifyPin}
              disabled={pinInput.length !== 4}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r -amber- -orange- cursor-pointer disabled:opacity-40"
              whileTap={{ scale: 0.97 }}
            >
              Unlock
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Main Settings Panel ───────────────────────

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={spring}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 pb-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              ⚙️ Parent Settings
            </h2>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Control access & view reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {saved && (
                <motion.span
                  className="text-[11px] font-bold text-emerald-500"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ✅ Saved
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-400 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              ✕
            </motion.button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Activity Locks ────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              🔒 Activity Locks
            </h3>
            <p className="text-[10px] text-gray-400 mb-3">
              Lock activities so children need parent approval to access them.
            </p>

            <div className="space-y-2">
              <LockToggle
                icon="🤖"
                label="Ask AI Chat"
                description="Lock AI conversation tab"
                enabled={locks.ai}
                onToggle={() => toggleLock('ai')}
              />
              <LockToggle
                icon="🧠"
                label="Quiz Mode"
                description="Lock quiz tab"
                enabled={locks.quiz}
                onToggle={() => toggleLock('quiz')}
              />
              <LockToggle
                icon="🎮"
                label="Play Games"
                description="Lock mini-games tab"
                enabled={locks.play}
                onToggle={() => toggleLock('play')}
              />
            </div>
          </section>

          {/* ── Safe Mode ─────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              🛡️ Safe Mode
            </h3>
            <LockToggle
              icon="🛡️"
              label="Safe Mode"
              description="Filter AI responses for child-appropriate content"
              enabled={locks.safeMode}
              onToggle={() => toggleLock('safeMode')}
            />
          </section>

          {/* ── PIN Management ────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              🔑 Parent PIN
            </h3>

            {!settingNewPin ? (
              <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'rgba(243,244,246,0.6)', border: '1px solid rgba(226,232,240,0.4)' }}>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    {locks.pin ? '●●●● (PIN is set)' : 'No PIN set'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {locks.pin ? 'PIN required to access this panel' : 'Anyone can change settings'}
                  </p>
                </div>
                <motion.button
                  onClick={() => { setSettingNewPin(true); setPinStep('new'); setNewPin(''); setConfirmPin(''); setPinError(''); }}
                  className="px-4 py-2 rounded-xl text-[11px] font-bold -amber- cursor-pointer"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {locks.pin ? 'Change' : 'Set PIN'}
                </motion.button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <p className="text-xs font-bold text-gray-700">
                  {pinStep === 'new' ? 'Enter new 4-digit PIN:' : 'Confirm your PIN:'}
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinStep === 'new' ? newPin : confirmPin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    pinStep === 'new' ? setNewPin(v) : setConfirmPin(v);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-center text-lg font-black text-gray-800 tracking-[0.5em]"
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.5)' }}
                  placeholder="● ● ● ●"
                  autoFocus
                />
                {pinError && <p className="text-[11px] text-red-500 font-bold">{pinError}</p>}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => { setSettingNewPin(false); setPinError(''); }}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-gray-500 cursor-pointer"
                    style={{ background: 'rgba(243,244,246,0.8)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSetNewPin}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white bg-gradient-to-r -amber- -orange- cursor-pointer"
                    whileTap={{ scale: 0.97 }}
                  >
                    {pinStep === 'new' ? 'Next' : 'Save PIN'}
                  </motion.button>
                </div>
              </div>
            )}

            {locks.pin && !settingNewPin && (
              <motion.button
                onClick={() => {
                  const updated: ParentLock = { ...locks, pin: undefined };
                  setLocks(updated);
                  setParentLocks(updated);
                  flashSaved();
                }}
                className="mt-2 w-full py-2 rounded-xl text-[11px] font-bold text-red-500 cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}
                whileTap={{ scale: 0.97 }}
              >
                Remove PIN
              </motion.button>
            )}
          </section>

          {/* ── Weekly Report ─────────────────────── */}
          {weeklyReport && weeklyReport.chaptersStudied > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                📊 This Week's Report
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ReportCard icon="📚" label="Chapters" value={`${weeklyReport.chaptersStudied}`} />
                <ReportCard icon="⏱️" label="Time Spent" value={`${Math.round(weeklyReport.totalTimeMs / 60000)}m`} />
                <ReportCard icon="🧠" label="Quizzes" value={`${weeklyReport.quizzesTaken}`} />
                <ReportCard icon="⭐" label="Avg Score" value={`${weeklyReport.averageScore}%`} />
                <ReportCard icon="🏆" label="Stars Earned" value={`${weeklyReport.starsEarned}`} />
                <ReportCard icon="🤖" label="AI Questions" value={`${weeklyReport.aiQuestionsAsked}`} />
              </div>

              {weeklyReport.strongSubjects.length > 0 && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <p className="text-[10px] font-bold text-emerald-600">
                    💪 Strong: {weeklyReport.strongSubjects.join(', ')}
                  </p>
                </div>
              )}
              {weeklyReport.weakSubjects.length > 0 && (
                <div className="mt-2 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <p className="text-[10px] font-bold text-amber-600">
                    📝 Needs Practice: {weeklyReport.weakSubjects.join(', ')}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── Subject Strengths ─────────────────── */}
          {strengths.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                💪 Subject Strengths
              </h3>
              <div className="space-y-2">
                {strengths.map(s => (
                  <div key={s.subject} className="p-3 rounded-xl" style={{ background: 'rgba(243,244,246,0.6)', border: '1px solid rgba(226,232,240,0.4)' }}>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-gray-700">{s.subject}</span>
                      <span className="text-gray-400">{s.strength}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r -amber- -orange- transition-all duration-700"
                        style={{ width: `${s.strength}%` }}
                      />
                    </div>
                    {s.weakAreas.length > 0 && (
                      <p className="text-[9px] text-gray-400 mt-1">
                        Focus on: {s.weakAreas.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Sub-components ────────────────────────────── */

const LockToggle: React.FC<{
  icon: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ icon, label, description, enabled, onToggle }) => (
  <div
    className="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all"
    style={{
      background: enabled ? 'rgba(239,68,68,0.05)' : 'rgba(243,244,246,0.6)',
      border: enabled ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(226,232,240,0.4)',
    }}
    onClick={onToggle}
  >
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-[12px] font-bold text-gray-700">{label}</p>
        <p className="text-[9px] text-gray-400">{description}</p>
      </div>
    </div>

    <motion.div
      className={`w-12 h-7 rounded-full p-1 cursor-pointer ${
        enabled ? 'bg-red-400' : 'bg-gray-200'
      }`}
      onClick={e => { e.stopPropagation(); onToggle(); }}
      animate={{ backgroundColor: enabled ? '#f87171' : '#e5e7eb' }}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </motion.div>
  </div>
);

const ReportCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div
    className="rounded-xl p-3 text-center"
    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(226,232,240,0.3)' }}
  >
    <span className="text-lg">{icon}</span>
    <p className="text-[14px] font-black text-gray-700 mt-0.5">{value}</p>
    <p className="text-[9px] text-gray-400 font-medium">{label}</p>
  </div>
);
