import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { FloatingIcon } from './ui/FloatingIcon';
import type { PlantStage } from '../types';

interface AttendanceGardenProps {
  history: string[];
  streak: number;
}

const PLANT_STAGES: Record<PlantStage, { emoji: string; label: string }> = {
  0: { emoji: '·', label: 'Empty' },
  1: { emoji: '🌱', label: 'Seed' },
  2: { emoji: '🌿', label: 'Sprout' },
  3: { emoji: '🌸', label: 'Flower' },
  4: { emoji: '🌺', label: 'Bloom' },
  5: { emoji: '🌳', label: 'Tree' },
};

export const AttendanceGarden: React.FC<AttendanceGardenProps> = ({ history, streak }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().toISOString().split('T')[0];

  const weekDates = useMemo(() => {
    const curr = new Date();
    const dayOfWeek = curr.getDay();
    const first = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const getPlantStage = (date: string): PlantStage => {
    if (!history.includes(date)) return 0;
    const dateObj = new Date(date);
    let consecutive = 0;
    for (let i = 0; i < 5; i++) {
      const checkDate = new Date(dateObj);
      checkDate.setDate(checkDate.getDate() - i);
      if (history.includes(checkDate.toISOString().split('T')[0])) {
        consecutive++;
      } else break;
    }
    return Math.min(consecutive, 5) as PlantStage;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return { daysInMonth, offset };
  };

  const treeStage = streak >= 7 ? '🌳' : streak >= 5 ? '🌺' : streak >= 3 ? '🌸' : streak >= 1 ? '🌱' : '·';

  return (
    <>
      <GlassCard variant="strong" hover={false} className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <FloatingIcon icon="🌻" size="md" glow="green" animate={false} />
            <div>
              <h3 className="text-xl font-bold text-blue-900">Attendance Garden</h3>
              <p className="text-xs text-blue-400 font-medium">Watch your garden grow!</p>
            </div>
          </div>
          <motion.button
            className="text-xs font-bold text-blue-400 bg-blue-50/60 px-3 py-1.5 rounded-xl hover:bg-blue-100/60 border border-blue-100/30"
            onClick={() => setShowCalendar(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📅 Calendar
          </motion.button>
        </div>

        {/* Garden Row */}
        <div className="bg-gradient-to-b from-sky-100/30 via-green-50/20 to-green-100/40 rounded-2xl p-5 mb-4 border border-green-100/20">
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {weekDates.map((date, i) => {
              const stage = getPlantStage(date);
              const isToday = date === today;
              const plant = PLANT_STAGES[stage];

              return (
                <motion.div
                  key={date}
                  className="flex flex-col items-center gap-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span className="text-[9px] font-bold text-blue-400 uppercase">{dayLabels[i]}</span>
                  <motion.div
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                      isToday
                        ? 'ring-2 ring-blue-400/60 ring-offset-2 ring-offset-transparent bg-blue-50/40'
                        : stage > 0
                          ? 'bg-green-50/60'
                          : 'bg-gray-50/30'
                    }`}
                    onClick={() => setShowCalendar(true)}
                    whileHover={{ scale: 1.12, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {stage > 0 ? (
                      <motion.span
                        className="text-2xl sm:text-3xl"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: i * 0.1 }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.4))' }}
                      >
                        {plant.emoji}
                      </motion.span>
                    ) : (
                      <span className="text-xl text-gray-200">·</span>
                    )}
                  </motion.div>
                  <span className="text-[9px] font-medium text-gray-400">
                    {new Date(date).getDate()}
                  </span>
                </motion.div>
              );
            })}
          </div>
          {/* Soil decoration */}
          <div className="mt-3 h-1.5 bg-gradient-to-r from-amber-200/20 via-amber-300/30 to-amber-200/20 rounded-full" />
        </div>

        {/* Streak Banner */}
        <motion.div
          className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between text-white shadow-lg shadow-green-500/15"
          whileHover={{ scale: 1.01 }}
        >
          <div>
            <h4 className="font-bold text-lg flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🔥
              </motion.span>
              {streak}-Day Streak!
            </h4>
            <p className="text-green-100 text-xs mt-0.5">
              {streak >= 7 ? 'Your tree is fully grown! Amazing!' :
               streak >= 5 ? 'Almost there! Keep growing!' :
               streak >= 3 ? 'Your garden is blooming!' :
               'Plant your first seed today!'}
            </p>
          </div>
          <motion.span
            className="text-4xl sm:text-5xl"
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' }}
          >
            {treeStage}
          </motion.span>
        </motion.div>
      </GlassCard>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-blue-900/40 backdrop-blur-md"
              onClick={() => setShowCalendar(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative glass-strong rounded-[24px] p-6 sm:p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center justify-between mb-6">
                <motion.button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  className="p-2 hover:bg-blue-50/50 rounded-xl text-blue-400"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ◀
                </motion.button>
                <h3 className="text-lg font-bold text-blue-900">
                  {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <motion.button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  className="p-2 hover:bg-blue-50/50 rounded-xl text-blue-400"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ▶
                </motion.button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayLabels.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-blue-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const { daysInMonth, offset } = getMonthDays(selectedMonth);
                  const cells = [];
                  for (let i = 0; i < offset; i++) {
                    cells.push(<div key={`empty-${i}`} />);
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isPresent = history.includes(dateStr);
                    const isToday = dateStr === today;
                    const stage = getPlantStage(dateStr);
                    cells.push(
                      <motion.div
                        key={day}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                          isPresent ? 'bg-green-100/60 text-green-700' : isToday ? 'ring-1 ring-blue-400 text-blue-600' : 'text-gray-400'
                        }`}
                        whileHover={{ scale: 1.15 }}
                      >
                        {isPresent ? PLANT_STAGES[stage].emoji : day}
                      </motion.div>
                    );
                  }
                  return cells;
                })()}
              </div>

              <button
                onClick={() => setShowCalendar(false)}
                className="w-full mt-6 bg-blue-500 text-white font-bold py-3 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
