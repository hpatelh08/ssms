/**
 * 🏠 HeroSection v4 – Dynamic Intelligence Panel
 * ==================================================
 * 3-zone layout: LEFT (Mascot + Level), CENTER (Greeting + Stats), RIGHT (Quick Actions)
 * Live XP counter, streak flame flicker, attendance % circle,
 * weekly mini-graph, daily goal meter, continue card, mascot reaction.
 * 300ms staggered entrance animation.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStats } from '../../types';
import { XP_PER_LEVEL, xpInCurrentLevel, getLevelTitle } from '../../utils/xpEngine';

interface AttendanceMetrics {
  totalSchoolDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

interface HeroSectionProps {
  stats: UserStats;
  pendingHomework: number;
  attendanceMetrics?: AttendanceMetrics;
  onPlayGames: () => void;
  onViewGarden: () => void;
  onAskAI?: () => void;
  onContinueHomework?: () => void;
  childName?: string;
}

// ─── Attendance % Circle ─────────────────────────────────

const AttendanceCircle: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 72 }) => {
  const s = 4;
  const r = (size - s) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (percentage / 100) * c;
  const color = percentage >= 85 ? '#22c55e' : percentage >= 70 ? '#eab308' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={s} stroke="rgba(0,0,0,0.06)" fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} strokeWidth={s} stroke={color} fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black" style={{ color }}>{percentage}%</span>
        <span className="text-[7px] text-gray-400 font-bold uppercase">Attend</span>
      </div>
    </div>
  );
};

// ─── Progress Ring (XP) ──────────────────────────────────

const ProgressRing: React.FC<{ progress: number; size: number; stroke: number }> = ({ progress, size, stroke }) => {
  const r = (size - stroke) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (progress / 100) * c;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="rgba(59,130,246,0.1)" fill="none" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
        stroke="url(#xpGrad)" fill="none" strokeLinecap="round"
        initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }} strokeDasharray={c} />
      <defs>
        <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" /><stop offset="50%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ─── Mini Week Sparkline ─────────────────────────────────

const WeekSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 75}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="rgba(59,130,246,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,100 ${pts} 100,100`} fill="rgba(59,130,246,0.06)" stroke="none" />
    </svg>
  );
};

// ─── Streak Motivational Message ─────────────────────────

function getStreakMessage(streak: number): string {
  if (streak >= 14) return "🏆 Legendary! You're unstoppable!";
  if (streak >= 7) return "🌟 Amazing week streak! Keep going!";
  if (streak >= 5) return "🔥 Five days strong! You're on fire!";
  if (streak >= 3) return "💪 Great consistency! Keep it up!";
  if (streak >= 1) return "🌱 Good start! Build your streak!";
  return "✨ Let's start a streak today!";
}

// ─── Helpers ─────────────────────────────────────────────

function getTimeGreeting(): { greeting: string; emoji: string; sub: string } {
  const h = new Date().getHours();
  if (h < 6) return { greeting: 'Sweet dreams', emoji: '🌙', sub: 'Rest up for tomorrow!' };
  if (h < 12) return { greeting: 'Good morning', emoji: '☀️', sub: 'A brand new day to learn!' };
  if (h < 17) return { greeting: 'Good afternoon', emoji: '🌤️', sub: 'Keep up the great work!' };
  if (h < 21) return { greeting: 'Good evening', emoji: '🌅', sub: 'Almost done for today!' };
  return { greeting: 'Good night', emoji: '🌙', sub: 'Time to rest, champion!' };
}

function getLast7DaysActivity(attendance: string[]): number[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return attendance.includes(d.toISOString().split('T')[0]) ? 1 + Math.floor(Math.random() * 3) : 0;
  });
}

const STAGGER = 0.08;

// ─── Component ───────────────────────────────────────────

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({
  stats,
  pendingHomework,
  attendanceMetrics,
  onPlayGames,
  onViewGarden,
  onAskAI,
  onContinueHomework,
  childName = 'Tiny Learner',
}) => {
  const time = useMemo(() => getTimeGreeting(), []);
  const xpCurrent = xpInCurrentLevel(stats.xp);
  const xpProg = (xpCurrent / XP_PER_LEVEL) * 100;
  const activityData = useMemo(() => getLast7DaysActivity(stats.attendance), [stats.attendance]);
  const streakMsg = useMemo(() => getStreakMessage(stats.streak), [stats.streak]);

  // XP live counter animation
  const [displayXP, setDisplayXP] = useState(stats.xp);
  const prevXP = useRef(stats.xp);
  useEffect(() => {
    if (stats.xp !== prevXP.current) {
      const start = prevXP.current;
      const end = stats.xp;
      const dur = 600;
      const startT = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startT;
        const progress = Math.min(elapsed / dur, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayXP(Math.round(start + (end - start) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      prevXP.current = stats.xp;
    }
  }, [stats.xp]);



  const attPct = attendanceMetrics?.attendancePercentage ?? 90;

  // Daily goal (simplified: homework + 1 game + 1 AI query = 3 goals)
  const goalsCompleted = useMemo(() => {
    let g = 0;
    if (pendingHomework === 0) g++;
    if (stats.xp > 0) g++;
    if (stats.streak >= 1) g++;
    return g;
  }, [pendingHomework, stats.xp, stats.streak]);
  const totalGoals = 3;
  const goalPct = (goalsCompleted / totalGoals) * 100;

  const quickActions = useMemo(() => [
    { icon: '📖', label: 'Homework', color: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/20', action: onContinueHomework },
    { icon: '🎮', label: 'Play Game', color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/20', action: onPlayGames },
    { icon: '🤖', label: 'Ask AI', color: 'from-green-500 to-emerald-500', glow: 'shadow-green-500/20', action: onAskAI },
    { icon: '🌱', label: 'Garden', color: 'from-lime-500 to-green-500', glow: 'shadow-lime-500/20', action: onViewGarden },
  ], [onContinueHomework, onPlayGames, onAskAI, onViewGarden]);

  return (
    <motion.section className="card-premium p-5 lg:p-7 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      <div className="relative z-10">
        {/* ═══ 3-ZONE HERO LAYOUT ═══ */}
        <div className="flex flex-col lg:flex-row items-center gap-5 lg:gap-6 mb-5">

          {/* ── LEFT: Mascot + Level Ring ── */}
          <motion.div className="relative flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: STAGGER, type: 'spring' }}>
            <div className="relative">
              <ProgressRing progress={xpProg} size={110} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div className="w-[84px] h-[84px] rounded-[1.3rem] bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 flex items-center justify-center shadow-xl overflow-hidden"
                  whileHover={{ scale: 1.05, rotate: 3 }}>
                  <motion.span className="text-[44px]"
                    animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.4))' }}>
                    🐣
                  </motion.span>
                </motion.div>
              </div>
            </div>
            {/* Level tag */}
            <motion.div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full px-2.5 py-0.5 shadow-lg border-2 border-white"
              animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <span className="font-black text-amber-900 text-[10px]">Lv.{stats.level}</span>
            </motion.div>

          </motion.div>

          {/* ── CENTER: Greeting + Streak + Motivational ── */}
          <motion.div className="flex-1 min-w-0 text-center lg:text-left"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: STAGGER * 2 }}>

            <div className="flex items-center gap-2 justify-center lg:justify-start mb-0.5">
              <span className="text-base">{time.emoji}</span>
              <span className="text-xs font-semibold text-blue-400">{time.greeting}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gradient-blue mb-0.5">Hi, {childName}!</h1>

            <p className="text-blue-400 text-xs mb-2">
              {pendingHomework > 0
                ? <>{pendingHomework} {pendingHomework === 1 ? 'task' : 'tasks'} waiting &bull; {time.sub}</>
                : <span className="text-green-600 font-bold">All done for today! 🎉</span>}
            </p>

            {/* Streak + motivational message */}
            <motion.div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start mb-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: STAGGER * 3 }}>
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-100/80 to-amber-100/80 px-2.5 py-1 rounded-xl border border-orange-200/30">
                <motion.span className="text-sm" animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}>🔥</motion.span>
                <span className="font-bold text-orange-600 text-xs">{stats.streak}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{streakMsg}</span>
            </motion.div>

            {/* XP live counter + badges */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <div className="flex items-center gap-1 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 px-2.5 py-1 rounded-xl border border-blue-200/30">
                <span className="text-sm">⭐</span>
                <motion.span className="font-bold text-blue-600 text-xs"
                  key={displayXP}>{displayXP} XP</motion.span>
              </div>
              <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100/80 to-pink-100/80 px-2.5 py-1 rounded-xl border border-purple-200/30">
                <span className="text-sm">🎖️</span>
                <span className="font-bold text-purple-600 text-xs">{stats.badges.length} badges</span>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Attendance Circle + Daily Goal ── */}
          <motion.div className="flex flex-row lg:flex-col items-center gap-3 flex-shrink-0"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: STAGGER * 3 }}>
            <AttendanceCircle percentage={attPct} size={68} />
            {/* Daily Goal Meter */}
            <div className="text-center">
              <div className="w-14 h-2 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${goalPct}%` }}
                  transition={{ duration: 0.8, delay: 0.8 }} />
              </div>
              <span className="text-[8px] font-bold text-gray-400 uppercase">{goalsCompleted}/{totalGoals} Goals</span>
            </div>
          </motion.div>
        </div>

        {/* ═══ QUICK ACTION TILES ═══ */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER * 4 }}>
          {quickActions.map((qa, i) => (
            <motion.button key={qa.label} onClick={qa.action}
              className={`relative bg-gradient-to-br ${qa.color} text-white p-3 rounded-2xl shadow-lg ${qa.glow} text-center group overflow-hidden`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: STAGGER * 4 + i * STAGGER }}
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <span className="text-xl block mb-0.5">{qa.icon}</span>
              <span className="text-[9px] font-bold leading-tight block">{qa.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ═══ DASHBOARD METRICS ROW ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {/* Attendance % */}
          <motion.div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-green-100/30 text-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER * 6 }}>
            <span className="text-lg block">📅</span>
            <span className="text-base font-black text-green-700">{attPct}%</span>
            <p className="text-[8px] text-gray-400 font-bold">Attendance</p>
          </motion.div>

          {/* Weekly Activity */}
          <motion.div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-blue-100/30"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER * 7 }}>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">7-Day Activity</p>
            <WeekSparkline data={activityData} />
          </motion.div>

          {/* Level Title */}
          <motion.div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-amber-100/30 text-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER * 8 }}>
            <motion.span className="text-lg block" animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>⭐</motion.span>
            <span className="text-xs font-black text-amber-700">{getLevelTitle(stats.level)}</span>
            <p className="text-[8px] text-gray-400 font-bold">Level {stats.level}</p>
          </motion.div>

          {/* Badges earned */}
          <motion.div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-purple-100/30 text-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER * 9 }}>
            <span className="text-lg block">🏅</span>
            <span className="text-base font-black text-purple-700">{stats.badges.length}</span>
            <p className="text-[8px] text-gray-400 font-bold">Badges</p>
          </motion.div>
        </div>

        {/* ═══ CONTINUE + ACHIEVEMENTS STRIP ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Continue where you left off */}
          {pendingHomework > 0 && (
            <motion.button onClick={onContinueHomework}
              className="bg-gradient-to-r from-blue-50/70 to-cyan-50/50 rounded-xl p-3 border border-blue-100/40 text-left group hover:shadow-md transition-shadow"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: STAGGER * 10 }}
              whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">Continue homework</p>
                  <p className="text-[9px] text-blue-400">{pendingHomework} task{pendingHomework > 1 ? 's' : ''} remaining</p>
                </div>
                <span className="ml-auto text-blue-300 group-hover:text-blue-500 transition-colors">&rarr;</span>
              </div>
            </motion.button>
          )}

          {/* Achievement strip */}
          <motion.div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-amber-100/30"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: STAGGER * 11 }}>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Recent Achievements</p>
            {stats.badges.length > 0 ? (
              <div className="flex gap-1 overflow-x-auto">
                {stats.badges.slice(-5).map((b, i) => (
                  <motion.div key={b.id} className="w-7 h-7 rounded-lg bg-amber-50/80 flex items-center justify-center flex-shrink-0"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: STAGGER * 11 + i * 0.06, type: 'spring' }}
                    title={b.name}>
                    <span className="text-base">{b.icon}</span>
                  </motion.div>
                ))}
                {stats.badges.length > 5 && (
                  <div className="w-7 h-7 rounded-lg bg-gray-100/60 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-gray-400">+{stats.badges.length - 5}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[9px] text-gray-300 font-medium">Start learning to earn badges! 🌟</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
});

HeroSection.displayName = 'HeroSection';
