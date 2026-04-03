// AttendanceCalendar.tsx — Monthly calendar modal with hover tooltips and click details
// Slide-in panel with month navigation, plant emoji per day, attendance summary
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GROWTH_STAGES,
  buildDayInfoArray,
  calculateGrowthLevel,
  getConsecutiveDaysUpTo,
  type DayInfo,
} from './GardenEngine';

interface AttendanceCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: string[];
  streak: number;
  calendarMonth: Date;
  onChangeMonth: (month: Date) => void;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = React.memo(({
  isOpen,
  onClose,
  attendance,
  streak,
  calendarMonth,
  onChangeMonth,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayInfo | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const monthLabel = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get first day offset (Monday = 0)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date().toISOString().split('T')[0];

  // Build day cells
  const dayCells = useMemo(() => {
    const cells: (DayInfo | null)[] = [];

    // Empty cells for offset
    for (let i = 0; i < offset; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPresent = attendance.includes(dateStr);
      const consecutiveDays = isPresent ? getConsecutiveDaysUpTo(dateStr, attendance) : 0;
      const growthLevel = calculateGrowthLevel(consecutiveDays);
      const dateObj = new Date(year, month, d);

      cells.push({
        date: dateStr,
        dayOfMonth: d,
        dayOfWeek: dateObj.getDay(),
        dayLabel: DAY_HEADERS[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1],
        isPresent,
        isToday: dateStr === today,
        growthLevel,
        consecutiveDays,
        isMilestone: consecutiveDays === 5 || consecutiveDays === 7 || consecutiveDays === 14,
      });
    }

    return cells;
  }, [year, month, daysInMonth, offset, attendance, today]);

  // Stats for this month
  const monthStats = useMemo(() => {
    const presentDays = dayCells.filter(d => d?.isPresent).length;
    const totalDays = dayCells.filter(d => d !== null).length;
    return { presentDays, totalDays, rate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0 };
  }, [dayCells]);

  const prevMonth = useCallback(() => {
    onChangeMonth(new Date(year, month - 1, 1));
  }, [year, month, onChangeMonth]);

  const nextMonth = useCallback(() => {
    onChangeMonth(new Date(year, month + 1, 1));
  }, [year, month, onChangeMonth]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-blue-900/40 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Calendar Panel */}
          <motion.div
            className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/50 overflow-hidden"
            initial={{ scale: 0.7, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <motion.button
                  onClick={prevMonth}
                  className="p-2 hover:bg-white/20 rounded-xl text-white/90 font-bold text-lg"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                >
                  ◀
                </motion.button>
                <div className="text-center">
                  <h3 className="text-xl font-black text-white">{monthLabel}</h3>
                  <p className="text-xs text-green-100 font-medium mt-0.5">
                    {monthStats.presentDays} of {monthStats.totalDays} days • {monthStats.rate}%
                  </p>
                </div>
                <motion.button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/20 rounded-xl text-white/90 font-bold text-lg"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                >
                  ▶
                </motion.button>
              </div>
            </div>

            {/* Day headers */}
            <div className="px-5 pt-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_HEADERS.map(d => (
                  <div key={d} className="text-center text-[10px] font-extrabold text-blue-400/70 uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1.5 pb-4">
                {dayCells.map((cell, i) => {
                  if (!cell) {
                    return <div key={`empty-${i}`} className="aspect-square" />;
                  }

                  const stage = GROWTH_STAGES[cell.growthLevel];
                  const isHovered = hoveredDay?.date === cell.date;

                  return (
                    <motion.div
                      key={cell.date}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        cell.isToday
                          ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50/60'
                          : cell.isPresent
                          ? 'bg-green-50/50 hover:bg-green-100/60'
                          : 'bg-gray-50/30 hover:bg-gray-100/40'
                      }`}
                      onHoverStart={() => setHoveredDay(cell)}
                      onHoverEnd={() => setHoveredDay(null)}
                      onClick={() => setSelectedDay(selectedDay?.date === cell.date ? null : cell)}
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.01 }}
                    >
                      {cell.isPresent ? (
                        <motion.span
                          className="text-lg"
                          style={{ filter: `drop-shadow(0 1px 3px ${stage.color}55)` }}
                          animate={cell.isToday ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {stage.emoji}
                        </motion.span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">{cell.dayOfMonth}</span>
                      )}

                      {/* Milestone sparkle */}
                      {cell.isMilestone && (
                        <motion.span
                          className="absolute -top-1 -right-1 text-[8px]"
                          animate={{ scale: [0.8, 1.2, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ⭐
                        </motion.span>
                      )}

                      {/* Hover tooltip */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white text-[9px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap z-40 shadow-lg"
                            initial={{ opacity: 0, y: 3, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 3, scale: 0.8 }}
                          >
                            {cell.isPresent
                              ? `${stage.label} • ${cell.consecutiveDays}d streak`
                              : `Day ${cell.dayOfMonth} • Rest`
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Detail Panel */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  className="px-5 pb-4"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className={`rounded-2xl p-4 ${
                    selectedDay.isPresent
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50'
                      : 'bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {selectedDay.isPresent ? GROWTH_STAGES[selectedDay.growthLevel].emoji : '📅'}
                      </span>
                      <div>
                        <p className="font-bold text-blue-900 text-sm">
                          {new Date(selectedDay.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedDay.isPresent
                            ? `${GROWTH_STAGES[selectedDay.growthLevel].label} stage • ${selectedDay.consecutiveDays} consecutive day${selectedDay.consecutiveDays !== 1 ? 's' : ''}`
                            : 'Rest day — no worries! 🌙'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Growth Legend */}
            <div className="px-5 pb-3">
              <div className="flex items-center justify-center gap-3 opacity-50">
                {([1, 2, 3, 4, 5] as const).map(stage => (
                  <div key={stage} className="flex items-center gap-1">
                    <span className="text-xs">{GROWTH_STAGES[stage].emoji}</span>
                    <span className="text-[7px] font-bold text-gray-400 uppercase">{GROWTH_STAGES[stage].label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="px-5 pb-5">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close Calendar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AttendanceCalendar.displayName = 'AttendanceCalendar';
