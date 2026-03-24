import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeworkItem } from '../types';
import { ConfettiEffect } from './ui/ConfettiEffect';
import { XP_REWARDS } from '../utils/xpEngine';
import { logAction } from '../utils/auditLog';

interface HomeworkCardProps {
  homework: HomeworkItem[];
  onToggle: (id: string) => void;
}

const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
  progress,
  size = 64,
  strokeWidth = 5,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(59,130,246,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black text-green-600">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export const HomeworkCard: React.FC<HomeworkCardProps> = React.memo(({ homework, onToggle }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [xpPopup, setXpPopup] = useState<{ id: string; show: boolean } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleComplete = (id: string) => {
    const item = homework.find(h => h.id === id);
    if (item && !item.isDone) {
      setConfettiTrigger(true);
      setXpPopup({ id, show: true });
      setTimeout(() => setConfettiTrigger(false), 100);
      setTimeout(() => setXpPopup(null), 2000);
      logAction('homework_completed', 'homework', { id, title: item.title });
    }
    onToggle(id);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOver(null);
    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
      const names: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        names.push(fileList[i].name);
      }
      logAction('file_uploaded', 'homework', { id, fileNames: names.join(', ') });
    }
  };

  const pendingCount = useMemo(() => homework.filter(h => !h.isDone).length, [homework]);
  const completedCount = useMemo(() => homework.filter(h => h.isDone).length, [homework]);
  const progressPercent = useMemo(
    () => homework.length > 0 ? (completedCount / homework.length) * 100 : 0,
    [completedCount, homework.length]
  );

  return (
    <>
      <ConfettiEffect trigger={confettiTrigger} />
      <motion.div
        className="card-premium p-6 lg:p-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Header with Progress Ring */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 flex items-center justify-center"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.3))' }}>📝</span>
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">Today's Homework</h3>
              <p className="text-xs text-blue-400 font-medium mt-0.5">
                {pendingCount > 0 ? (
                  <>{pendingCount} remaining · <span className="text-amber-500">+{pendingCount * XP_REWARDS.HOMEWORK_COMPLETE} XP possible</span></>
                ) : (
                  <span className="text-green-500">All done! Amazing work! 🎉</span>
                )}
              </p>
            </div>
          </div>
          <ProgressRing progress={progressPercent} />
        </div>

        {/* Linear progress underneath */}
        <div className="w-full h-1.5 bg-blue-50/60 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-full relative"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 xp-shimmer rounded-full" />
          </motion.div>
        </div>

        {/* Homework Items */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {homework.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                className="relative"
              >
                <motion.div
                  className={`rounded-2xl overflow-hidden transition-colors cursor-pointer ${
                    item.isDone
                      ? 'bg-green-50/60 border border-green-200/30'
                      : dragOver === item.id
                        ? 'bg-blue-50/80 ring-2 ring-blue-300'
                        : 'bg-white/60 hover:bg-white/80 border border-white/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(item.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  {/* Main Row */}
                  <div
                    className="flex items-center gap-4 p-4"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {/* Checkbox */}
                    <motion.button
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                        item.isDone
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                          : 'border-blue-200 bg-white hover:border-blue-400'
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleComplete(item.id); }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.8 }}
                    >
                      {item.isDone && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                          className="text-sm font-bold"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className={`block font-bold text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-blue-900'}`}>
                        {item.title}
                      </span>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase mt-1 ${
                        item.subject === 'Math'
                          ? 'bg-purple-100/60 text-purple-500'
                          : 'bg-orange-100/60 text-orange-500'
                      }`}>
                        {item.subject}
                      </span>
                    </div>

                    {/* XP Reward tag */}
                    {!item.isDone && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-50/60 px-2 py-1 rounded-lg">
                        <span>+{XP_REWARDS.HOMEWORK_COMPLETE}</span>
                        <span>✨</span>
                      </div>
                    )}

                    {/* Expand Arrow */}
                    <motion.span
                      className="text-blue-300 text-xs"
                      animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.span>
                  </div>

                  {/* Expandable Section */}
                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-blue-50/50">
                          <div className="flex gap-2 mt-2">
                            <div className="flex-1 bg-blue-50/40 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-blue-400 font-medium">Subject</p>
                              <p className="text-sm font-bold text-blue-900">{item.subject}</p>
                            </div>
                            <div className="flex-1 bg-amber-50/40 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-amber-400 font-medium">XP Reward</p>
                              <p className="text-sm font-bold text-amber-600">+{XP_REWARDS.HOMEWORK_COMPLETE}</p>
                            </div>
                            <div className="flex-1 bg-green-50/40 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-green-400 font-medium">Status</p>
                              <p className="text-sm font-bold text-green-600">{item.isDone ? 'Done ✓' : 'Pending'}</p>
                            </div>
                          </div>

                          {/* Drag & Drop Upload Zone */}
                          {!item.isDone && (
                            <div className="mt-3 border-2 border-dashed border-blue-200/40 rounded-xl p-4 text-center hover:border-blue-300/60 transition-colors cursor-pointer">
                              <span className="text-2xl mb-1 block">📎</span>
                              <p className="text-xs text-blue-400 font-medium">Drop photo of your work here</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* XP Popup */}
                <AnimatePresence>
                  {xpPopup?.id === item.id && xpPopup.show && (
                    <motion.div
                      className="absolute -top-2 right-4 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 font-black px-3 py-1 rounded-full text-sm shadow-lg z-10"
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: -20, scale: 1 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      +{XP_REWARDS.HOMEWORK_COMPLETE} XP ⭐
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
});

HomeworkCard.displayName = 'HomeworkCard';
