/**
 * 📊 Engagement Insights Panel
 * =============================
 * Replaces KnowledgeBasePanel. Shows visual engagement analytics:
 * - Weekly activity heatmap
 * - AI usage summary
 * - Game performance summary
 * - Attendance summary card
 */

import React from 'react';
import { motion } from 'framer-motion';
import { UserStats } from '../../types';

// Map skill level strings to numeric values
const SKILL_NUM: Record<string, number> = {
  'Developing': 1,
  'Improving': 2,
  'Active': 3,
  'Star': 4,
};

interface EngagementInsightsPanelProps {
  stats: UserStats;
  weeklyEngagement: {
    daysActive: number;
    gamesPlayed: number;
    homeworkDone: number;
    aiQuestions: number;
    booksUsed: number;
    totalActivities: number;
  };
}

/* ── Day Heatmap Cell ─── */
const DayCell: React.FC<{ day: string; level: number; label: string }> = ({ day, level, label }) => {
  const colors = [
    'bg-gray-100',
    'bg-green-200',
    'bg-green-400',
    'bg-green-600',
  ];
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`w-8 h-8 rounded-lg ${colors[Math.min(level, 3)]} border border-white/60`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: Math.random() * 0.3 }}
        title={`${label}: ${level === 0 ? 'No activity' : level === 1 ? 'Light' : level === 2 ? 'Moderate' : 'High'}`}
      />
      <span className="text-[8px] text-gray-400 font-bold uppercase">{day}</span>
    </div>
  );
};

export const EngagementInsightsPanel: React.FC<EngagementInsightsPanelProps> = React.memo(
  ({ stats, weeklyEngagement }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Generate activity levels from attendance data
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const activityLevels = days.map((_, i) => {
      const targetDay = i + 1; // Mon=1
      const adjustedTarget = targetDay === 7 ? 0 : targetDay;
      const isAttended = stats.attendance.some(dateStr => {
        const d = new Date(dateStr);
        return d.getDay() === adjustedTarget;
      });
      if (adjustedTarget > dayOfWeek) return 0; // future day
      return isAttended ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 2);
    });

    const engagementScore = Math.round(
      ((weeklyEngagement.daysActive / 7) * 30) +
      ((Math.min(weeklyEngagement.gamesPlayed, 10) / 10) * 25) +
      ((Math.min(weeklyEngagement.homeworkDone, 5) / 5) * 25) +
      ((Math.min(weeklyEngagement.aiQuestions, 10) / 10) * 20)
    );

    const metricCards = [
      { icon: '🤖', label: 'AI Questions', value: weeklyEngagement.aiQuestions, color: 'from-blue-50 to-cyan-50', textColor: 'text-blue-700', border: 'border-blue-100/40' },
      { icon: '🎮', label: 'Games Played', value: weeklyEngagement.gamesPlayed, color: 'from-purple-50 to-pink-50', textColor: 'text-purple-700', border: 'border-purple-100/40' },
      { icon: '📝', label: 'Homework Done', value: weeklyEngagement.homeworkDone, color: 'from-green-50 to-emerald-50', textColor: 'text-green-700', border: 'border-green-100/40' },
      { icon: '📚', label: 'Books Used', value: weeklyEngagement.booksUsed, color: 'from-amber-50 to-yellow-50', textColor: 'text-amber-700', border: 'border-amber-100/40' },
    ];

    return (
      <motion.section
        className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl shadow-blue-100/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-300/30">
              📊
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm">Engagement Insights</h3>
              <p className="text-[10px] text-gray-400">Weekly activity overview</p>
            </div>
          </div>
          {/* Engagement Score */}
          <div className="text-center">
            <motion.div
              className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}
            >
              {engagementScore}%
            </motion.div>
            <p className="text-[9px] text-gray-400 font-medium">Score</p>
          </div>
        </div>

        {/* Weekly Heatmap */}
        <div className="bg-gradient-to-r from-gray-50/60 to-blue-50/30 rounded-2xl p-4 mb-5 border border-gray-100/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">🗓️</span>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">This Week's Activity</h4>
          </div>
          <div className="flex justify-between items-end">
            {days.map((day, i) => (
              <DayCell key={day} day={day} level={activityLevels[i]} label={`${day}`} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[8px] text-gray-400">Less</span>
            {[0, 1, 2, 3].map(l => (
              <div key={l} className={`w-3 h-3 rounded-sm ${['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600'][l]}`} />
            ))}
            <span className="text-[8px] text-gray-400">More</span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {metricCards.map((m, i) => (
            <motion.div
              key={m.label}
              className={`bg-gradient-to-br ${m.color} rounded-2xl p-4 border ${m.border}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{m.icon}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{m.label}</span>
              </div>
              <span className={`text-2xl font-black ${m.textColor}`}>{m.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Skills Summary */}
        <div className="bg-gradient-to-r from-blue-50/40 to-purple-50/30 rounded-2xl p-4 border border-blue-100/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">🎯</span>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Skills Progress</h4>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Reading', value: SKILL_NUM[stats.skills.reading] || 1, max: 4, emoji: '📖', color: 'bg-blue-400' },
              { label: 'Writing', value: SKILL_NUM[stats.skills.writing] || 1, max: 4, emoji: '✏️', color: 'bg-green-400' },
              { label: 'Participation', value: SKILL_NUM[stats.skills.participation] || 1, max: 4, emoji: '🙋', color: 'bg-purple-400' },
            ].map(skill => (
              <div key={skill.label} className="flex items-center gap-3">
                <span className="text-sm w-6">{skill.emoji}</span>
                <span className="text-[10px] font-bold text-gray-500 w-20">{skill.label}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${skill.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.value / skill.max) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                </div>
                <span className="text-[10px] font-black text-gray-600 w-8 text-right">{skill.value}/{skill.max}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Quick View */}
        <div className="mt-4 flex items-center justify-between bg-green-50/40 rounded-2xl p-3 border border-green-100/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <div>
              <span className="text-xs font-bold text-green-800">Attendance</span>
              <span className="text-[10px] text-green-500 ml-2">{stats.attendance.length} days total</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-green-600">🔥 {stats.streak} day streak</span>
          </div>
        </div>
      </motion.section>
    );
  }
);

EngagementInsightsPanel.displayName = 'EngagementInsightsPanel';
