// WeeklySnapshot.tsx — Weekly engagement snapshot, activity ring, AI usage summary,
// attendance summary, parent notes, download report (mock PDF)
import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStats } from '../../types';
import type { WeeklyEngagement, ParentNote } from './ParentEngine';

interface WeeklySnapshotProps {
  engagement: WeeklyEngagement;
  stats: UserStats;
  parentNotes: ParentNote[];
  noteInput: string;
  onAddNote: (note: ParentNote) => void;
  onDeleteNote: (id: string) => void;
  onSetNoteInput: (input: string) => void;
  onDownloadReport: () => void;
}

// ─── Activity Ring SVG ────────────────────────────────────────
const ActivityRing: React.FC<{ daysActive: number; total?: number }> = React.memo(({ daysActive, total = 7 }) => {
  const pct = Math.min(daysActive / total, 1);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(200,200,220,0.2)" strokeWidth="8" />
        {/* Progress ring */}
        <motion.circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="url(#ringGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-blue-900">{daysActive}</span>
        <span className="text-[8px] text-gray-400 font-bold uppercase">of {total} days</span>
      </div>
    </div>
  );
});
ActivityRing.displayName = 'ActivityRing';

// ─── Stat Card ────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; icon: string; color: string; index: number }> = React.memo(
  ({ label, value, icon, color, index }) => (
    <motion.div
      className={`bg-gradient-to-br ${color} rounded-xl p-3 border border-white/40 text-center`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.08, type: 'spring' }}
      whileHover={{ y: -2, scale: 1.03 }}
    >
      <span className="text-lg block mb-1">{icon}</span>
      <span className="text-xl font-black text-blue-900 block">{value}</span>
      <span className="text-[8px] text-gray-500 font-bold uppercase">{label}</span>
    </motion.div>
  )
);
StatCard.displayName = 'StatCard';

// ─── Main Component ───────────────────────────────────────────
export const WeeklySnapshot: React.FC<WeeklySnapshotProps> = React.memo(({
  engagement, stats, parentNotes, noteInput,
  onAddNote, onDeleteNote, onSetNoteInput, onDownloadReport,
}) => {
  const handleAddNote = useCallback(() => {
    if (!noteInput.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      text: noteInput.trim(),
      createdAt: new Date().toISOString(),
    });
  }, [noteInput, onAddNote]);

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 border border-white/50 shadow-lg shadow-blue-500/[0.03]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100/80 to-purple-50/60 flex items-center justify-center border border-violet-200/30"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <span className="text-lg">📈</span>
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-blue-900">Weekly Engagement Snapshot</h3>
          <p className="text-[10px] text-gray-400 font-medium">Non-competitive activity overview</p>
        </div>
      </div>

      {/* Top row: Ring + Stats */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        <ActivityRing daysActive={engagement.daysActive} />

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <StatCard label="Games" value={engagement.gamesPlayed} icon="🎮" color="from-purple-100/60 to-violet-50/40" index={0} />
          <StatCard label="Homework" value={engagement.homeworkDone} icon="📝" color="from-amber-100/60 to-yellow-50/40" index={1} />
          <StatCard label="AI Questions" value={engagement.aiQuestions} icon="🤖" color="from-cyan-100/60 to-blue-50/40" index={2} />
          <StatCard label="Books Used" value={engagement.booksUsed} icon="📚" color="from-emerald-100/60 to-green-50/40" index={3} />
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl p-4 border border-green-100/30 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <span className="text-xs font-bold text-blue-900">Attendance Summary</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-lg font-black text-green-600 block">{stats.attendance.length}</span>
              <span className="text-[8px] text-gray-400 font-bold uppercase">Days</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-black text-orange-500 block">{stats.streak}</span>
              <span className="text-[8px] text-gray-400 font-bold uppercase">Streak</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-black text-blue-600 block">
                {stats.attendance.length > 0 ? `${Math.min(Math.round((stats.attendance.length / 18) * 100), 100)}%` : '0%'}
              </span>
              <span className="text-[8px] text-gray-400 font-bold uppercase">Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Usage Summary */}
      <div className="bg-gradient-to-r from-cyan-50/50 to-blue-50/50 rounded-xl p-4 border border-cyan-100/30 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-bold text-blue-900">AI Usage Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/40 rounded-lg p-2 text-center">
            <span className="text-lg font-black text-cyan-600 block">{engagement.aiQuestions}</span>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Questions</span>
          </div>
          <div className="bg-white/40 rounded-lg p-2 text-center">
            <span className="text-lg font-black text-blue-600 block">{engagement.booksUsed}</span>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Sources</span>
          </div>
          <div className="bg-white/40 rounded-lg p-2 text-center">
            <span className="text-lg font-black text-green-600 block">RAG</span>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Pipeline</span>
          </div>
        </div>
        <p className="text-[9px] text-gray-400 mt-2 italic">All AI responses are sourced from approved textbook content only.</p>
      </div>

      {/* Parent Notes */}
      <div className="bg-gradient-to-r from-amber-50/50 to-yellow-50/50 rounded-xl p-4 border border-amber-100/30 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📝</span>
          <span className="text-xs font-bold text-blue-900">Parent Notes</span>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            value={noteInput}
            onChange={(e) => onSetNoteInput(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 bg-white/60 border border-amber-100/30 rounded-xl text-xs focus:border-amber-400 outline-none backdrop-blur-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <motion.button
            onClick={handleAddNote}
            className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!noteInput.trim()}
          >
            Add
          </motion.button>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          <AnimatePresence>
            {parentNotes.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-2">No notes yet.</p>
            ) : (
              parentNotes.map((note) => (
                <motion.div
                  key={note.id}
                  className="flex items-start gap-2 bg-white/40 rounded-lg p-2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <p className="flex-1 text-[11px] text-gray-600">{note.text}</p>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-[10px] text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    ✕
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Download Report Button */}
      <motion.button
        onClick={onDownloadReport}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/15 text-sm"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>📥</span> Download Progress Report (PDF)
      </motion.button>
    </motion.div>
  );
});

WeeklySnapshot.displayName = 'WeeklySnapshot';
