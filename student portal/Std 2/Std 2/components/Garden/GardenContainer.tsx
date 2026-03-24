// GardenContainer.tsx — Main container orchestrating the magical Attendance Garden
// Combines: GardenSky, GardenRow, GardenMascot, StreakCelebration, AttendanceCalendar
// Uses useReducer for state management per user spec
import React, { useReducer, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GardenSky } from './GardenSky';
import { GardenRow, GrowthLegend } from './GrowthStage';

import { StreakCelebration } from './StreakCelebration';
import { AttendanceCalendar } from './AttendanceCalendar';
import {
  gardenReducer,
  createInitialGardenState,
  getCurrentWeekDays,
  type DayInfo,
  type GardenState,
} from './GardenEngine';

interface GardenContainerProps {
  history: string[];
  streak: number;
  attendancePercentage?: number;
}

export const AttendanceGarden: React.FC<GardenContainerProps> = React.memo(({ history, streak, attendancePercentage = 90 }) => {
  // ─── State ────────────────────────────────────────────────
  const initialState = useMemo(() => createInitialGardenState(history, streak), [history, streak]);
  const [state, dispatch] = useReducer(gardenReducer, initialState);

  // Note: gardenReducer manages UI interactions (calendar, watering, selection).
  // The initialState is derived from props — re-mounts will pick up new data.

  // Get current week view for the garden row
  const weekDays = useMemo(() => getCurrentWeekDays(history, streak), [history, streak]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleSelectDay = useCallback((day: DayInfo) => {
    dispatch({ type: 'SELECT_DAY', day: state.selectedDay?.date === day.date ? null : day });
  }, [state.selectedDay]);

  const handleToggleCalendar = useCallback(() => {
    dispatch({ type: 'TOGGLE_CALENDAR' });
  }, []);

  const handleChangeMonth = useCallback((month: Date) => {
    dispatch({ type: 'SET_CALENDAR_MONTH', month });
  }, []);

  const handleWater = useCallback(() => {
    dispatch({ type: 'START_WATERING' });
    setTimeout(() => dispatch({ type: 'STOP_WATERING' }), 3000);
  }, []);

  return (
    <>
      <motion.div
        className="relative rounded-[24px] overflow-hidden shadow-2xl shadow-green-500/10 border border-white/30"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        {/* Animated Sky Background */}
        <GardenSky streak={streak} isWatering={state.isWatering} attendancePercentage={attendancePercentage} />

        {/* Content overlay */}
        <div className="relative z-10 p-6 lg:p-8">
          {/* ─── Header ────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center border border-white/30 shadow-lg"
                animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-2xl">
                  🌻
                </span>
              </motion.div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">
                  My Magical Garden
                </h2>
                <p className="text-xs font-semibold text-blue-500/70">
                  {state.totalPresent} days of growth • Your garden is alive!
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleToggleCalendar}
              className="flex items-center gap-2 bg-white/40 text-blue-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/40 shadow-sm hover:bg-white/60 transition-colors"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base">📅</span>
              Calendar
            </motion.button>
          </div>

          {/* ─── Garden Row (This Week) ────────────────────── */}
          <motion.div
            className="bg-white/20 rounded-2xl p-5 mb-5 border border-white/25 shadow-inner"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🗓️</span>
              <h3 className="text-xs font-bold text-blue-800/70 uppercase tracking-wider">This Week</h3>
            </div>
            <GardenRow
              days={weekDays}
              selectedDay={state.selectedDay}
              onSelectDay={handleSelectDay}
            />
            <div className="mt-3">
              <GrowthLegend compact />
            </div>
          </motion.div>

          {/* ─── Water Button ─────────────────────────────── */}
          <div className="mb-5 flex justify-center">
            <motion.button
              onClick={handleWater}
              disabled={state.isWatering}
              className="flex items-center gap-2 bg-blue-400/20 text-blue-700 font-bold text-sm px-6 py-3 rounded-2xl border border-blue-200/40 shadow-md hover:bg-blue-400/30 transition-colors disabled:opacity-40"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">{state.isWatering ? '💧' : '🚿'}</span>
              {state.isWatering ? 'Watering…' : 'Water Garden'}
            </motion.button>
          </div>

          {/* ─── Streak Celebration Panel ──────────────────── */}
          <StreakCelebration state={state} />
        </div>

        {/* Bottom glass edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
        />
      </motion.div>

      {/* ─── Calendar Modal ────────────────────────────────── */}
      <AttendanceCalendar
        isOpen={state.calendarOpen}
        onClose={handleToggleCalendar}
        attendance={history}
        streak={streak}
        calendarMonth={state.calendarMonth}
        onChangeMonth={handleChangeMonth}
      />
    </>
  );
});

AttendanceGarden.displayName = 'AttendanceGarden';
