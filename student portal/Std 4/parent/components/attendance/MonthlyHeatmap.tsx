/**
 * parent/components/attendance/MonthlyHeatmap.tsx
 * ─────────────────────────────────────────────────────
 * GitHub-style monthly learning intensity heatmap.
 *
 *   7 columns (Mon → Sun)  ×  5 rows (weeks)
 *   Color intensity driven by daily activity count.
 *   Hover tooltip shows activity breakdown.
 *
 * Consumes useAttendance() — must be inside AttendanceProvider.
 * Uses useMemo for all date/grid calculations.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAttendance, type DayAttendance } from '../../../context/AttendanceContext';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Color scale: total actions → Tailwind-style color ── */
function cellColor(total: number): string {
  if (total === 0) return 'rgba(243,244,246,0.7)';   // gray-100
  if (total <= 2) return 'rgba(167,243,208,0.8)';    // green-200
  if (total <= 5) return 'rgba(52,211,153,0.8)';     // green-400
  return 'rgba(5,150,105,0.85)';                       // green-600
}

function cellGlow(total: number): string {
  if (total === 0) return 'none';
  if (total <= 2) return '0 0 8px rgba(52,211,153,0.15)';
  if (total <= 5) return '0 0 12px rgba(52,211,153,0.25)';
  return '0 0 16px rgba(5,150,105,0.3)';
}

/* ── Build grid data for the current month ──────── */

interface CellData {
  dateKey: string;          // 'YYYY-MM-DD'
  dayOfMonth: number;
  total: number;            // sum of all activity counts
  games: number;
  colorMagic: number;
  ncertUsage: number;
  gardenActions: number;
  present: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function buildMonthGrid(allDays: DayAttendance[], attendance: string[]): (CellData | null)[][] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = now.toISOString().split('T')[0];
  const attendSet = new Set(attendance);

  // Build lookup from allDays + any audit log data
  const dayMap = new Map<string, DayAttendance>();
  for (const d of allDays) dayMap.set(d.dateKey, d);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  // getDay() → 0=Sun, we want Mon=0
  const startDow = (firstDay.getDay() + 6) % 7;

  // Build 5-row × 7-col grid
  const grid: (CellData | null)[][] = [];
  let dayCounter = 1;

  for (let row = 0; row < 6; row++) {
    const week: (CellData | null)[] = [];
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col;
      if (cellIndex < startDow || dayCounter > daysInMonth) {
        week.push(null);
      } else {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
        const d = dayMap.get(dateKey);
        const dateObj = new Date(year, month, dayCounter);
        const isFuture = dateObj > now;
        const isToday = dateKey === todayStr;
        const present = attendSet.has(dateKey) || (d?.present ?? false);

        const games = d?.games ?? 0;
        const colorMagic = d?.colorMagic ?? 0;
        const ncertUsage = d?.ncertUsage ?? 0;
        const gardenActions = d?.gardenActions ?? 0;
        const total = games + colorMagic + ncertUsage + gardenActions;

        week.push({
          dateKey,
          dayOfMonth: dayCounter,
          total: isFuture ? 0 : total,
          games: isFuture ? 0 : games,
          colorMagic: isFuture ? 0 : colorMagic,
          ncertUsage: isFuture ? 0 : ncertUsage,
          gardenActions: isFuture ? 0 : gardenActions,
          present: isFuture ? false : present,
          isToday,
          isFuture,
        });
        dayCounter++;
      }
    }
    // Only add row if it has at least one cell
    if (week.some(c => c !== null)) grid.push(week);
  }

  return grid;
}

/* ── Tooltip component ─────────────────────────── */

const Tooltip: React.FC<{ cell: CellData; x: number; y: number }> = ({ cell, x, y }) => (
  <motion.div
    className="fixed z-50 pointer-events-none"
    style={{ left: x, top: y - 8, transform: 'translate(-50%, -100%)' }}
    initial={{ opacity: 0, y: 4, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 4, scale: 0.95 }}
    transition={{ duration: 0.15 }}
  >
    <div
      className="rounded-2xl px-3 py-2 text-[10px] leading-relaxed font-medium text-gray-700 whitespace-nowrap"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div className="font-black text-[11px] text-gray-800 mb-0.5">
        {new Date(cell.dateKey + 'T00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </div>
      {cell.isFuture ? (
        <span className="text-gray-400">Upcoming</span>
      ) : cell.total === 0 ? (
        <span className="text-gray-400">Rest day</span>
      ) : (
        <div className="space-y-0.5">
          {cell.games > 0 && <div>🎮 {cell.games} game{cell.games > 1 ? 's' : ''}</div>}
          {cell.ncertUsage > 0 && <div>🤖 {cell.ncertUsage} AI session{cell.ncertUsage > 1 ? 's' : ''}</div>}
          {cell.colorMagic > 0 && <div>🎨 {cell.colorMagic} color activit{cell.colorMagic > 1 ? 'ies' : 'y'}</div>}
          {cell.gardenActions > 0 && <div>🌱 {cell.gardenActions} garden action{cell.gardenActions > 1 ? 's' : ''}</div>}
        </div>
      )}
    </div>
  </motion.div>
);

/* ── Main Component ────────────────────────────── */

export const MonthlyHeatmap: React.FC = () => {
  const { days, attendance } = useAttendance();

  // Merge week days with full month attendance for better data
  const grid = useMemo(() => buildMonthGrid(days, attendance), [days, attendance]);
  const [hover, setHover] = useState<{ cell: CellData; x: number; y: number } | null>(null);

  const monthName = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="text-base">📅</span>
        <h2 className="text-sm font-black text-gray-700">Monthly Learning Map</h2>
        <span className="text-[10px] font-semibold text-gray-400 ml-auto">{monthName}</span>
      </div>

      <motion.div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 6px 28px rgba(16,185,129,0.06), 0 2px 8px rgba(0,0,0,0.02)',
        }}
        whileHover={{ scale: 1.005 }}
      >
        {/* Decorative blob */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full opacity-[0.06] blur-3xl" />

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAY_LABELS.map(label => (
            <div
              key={label}
              className="text-[9px] font-bold text-gray-400 text-center select-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="space-y-1.5">
          {grid.map((week, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7 gap-1.5">
              {week.map((cell, colIdx) => {
                if (!cell) {
                  return <div key={colIdx} className="w-full aspect-square" />;
                }

                const bg = cell.isFuture
                  ? 'rgba(243,244,246,0.35)'
                  : cellColor(cell.total);

                return (
                  <motion.div
                    key={cell.dateKey}
                    className="w-full aspect-square rounded-xl relative cursor-default select-none flex items-center justify-center"
                    style={{
                      background: bg,
                      boxShadow: cell.isFuture ? 'none' : cellGlow(cell.total),
                      border: cell.isToday
                        ? '2px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.3)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.02 * (rowIdx * 7 + colIdx),
                      duration: 0.25,
                    }}
                    whileHover={
                      !cell.isFuture
                        ? { scale: 1.2, y: -2, boxShadow: '0 4px 16px rgba(16,185,129,0.2)' }
                        : {}
                    }
                    onMouseEnter={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setHover({
                        cell,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    {/* Day number */}
                    <span
                      className={`text-[9px] font-bold ${
                        cell.isToday
                          ? '-amber-'
                          : cell.total > 0
                            ? 'text-white/80'
                            : 'text-gray-400/70'
                      }`}
                    >
                      {cell.dayOfMonth}
                    </span>

                    {/* Today dot */}
                    {cell.isToday && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full -amber-"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 text-[9px] font-semibold text-gray-400">
          <span>Less</span>
          {[0, 1, 3, 6].map((val, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-md"
              style={{
                background: cellColor(val),
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
          ))}
          <span>More</span>
        </div>
      </motion.div>

      {/* Floating tooltip */}
      <AnimatePresence>
        {hover && <Tooltip cell={hover.cell} x={hover.x} y={hover.y} />}
      </AnimatePresence>
    </motion.div>
  );
};
