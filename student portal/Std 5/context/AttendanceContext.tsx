/**
 * context/AttendanceContext.tsx
 * ─────────────────────────────────────────────────────
 * Real-time Attendance + Activity context.
 *
 * Polls localStorage every 2 seconds so the Parent
 * Dashboard reflects student actions without page reload.
 *
 * Data sources:
 *   ssms_stats_v2    → attendance[] (ISO dates), streak
 *   ssms_audit_log   → AuditLogEntry[] for DayAttendance derivation
 *
 * No App.tsx modification needed — wrap AttendanceProvider
 * locally around any consuming component tree.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { AuditLogEntry } from '../types';

/* ═══════════════════════════════════════════════════
   PUBLIC TYPES
   ═══════════════════════════════════════════════════ */

export interface DayAttendance {
  dateKey: string;
  games: number;
  spaceWar: number;
  ncertUsage: number;
  gardenActions: number;
  timeSpent: number;   // estimated minutes
  present: boolean;
}

export interface AttendanceState {
  /** Raw attendance ISO-date list */
  attendance: string[];
  /** Current login streak */
  streak: number;
  /** Per-day activity data for the current week (Mon → Sun) */
  days: DayAttendance[];
  /** Weekly bubble data */
  weekBubbles: { day: string; date: string; present: boolean }[];
  /** Attendance rate % (school days this month) */
  rate: number;
  /** Total days attended this month */
  monthlyDays: number;
  /** Active days in the last 7 calendar days */
  weeklyActive: number;
  /** True if the last 7 calendar days are all present */
  isPerfectWeek: boolean;
}

/* ═══════════════════════════════════════════════════
   INTERNAL HELPERS (pure, no side effects)
   ═══════════════════════════════════════════════════ */

const SPACE_GAME_IDS = new Set([
  'SpaceWar', 'space_war', 'spaceWar',
]);

/* ── localStorage readers ───────────────────────── */

function readStatsRaw(): { streak: number; attendance: string[] } {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    if (raw) {
      const d = JSON.parse(raw);
      return {
        streak: d.streak || 0,
        attendance: Array.isArray(d.attendance) ? d.attendance : [],
      };
    }
  } catch { /* ignore */ }
  return { streak: 0, attendance: [] };
}

function readAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

/* ── Date helpers ───────────────────────────────── */

function buildWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow === 0 ? 7 : dow) - 1));
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/* ── Action classifiers ─────────────────────────── */

function isSpaceWarAction(e: AuditLogEntry): boolean {
  if (e.category === 'game') {
    const game = String(e.details?.game ?? '');
    if (SPACE_GAME_IDS.has(game) || game.toLowerCase().includes('space')) return true;
  }
  if (e.action === 'navigation' && String(e.details?.screen ?? '') === 'space-war') return true;
  return false;
}

function isGameAction(e: AuditLogEntry): boolean {
  return e.category === 'game' && !isSpaceWarAction(e);
}

function isNCERTAction(e: AuditLogEntry): boolean {
  return e.category === 'ai';
}

function isGardenAction(e: AuditLogEntry): boolean {
  return e.action === 'tree_watered' || e.action === 'garden_activity';
}

/* ── State computation ──────────────────────────── */

function computeState(
  stats: { streak: number; attendance: string[] },
  log: AuditLogEntry[],
): AttendanceState {
  const { streak, attendance } = stats;
  const attendSet = new Set(attendance);
  const weekDates = buildWeekDates();
  const todayIso = new Date().toISOString().split('T')[0];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Group log entries by date
  const logByDate = new Map<string, AuditLogEntry[]>();
  for (const e of log) {
    const d = e.timestamp.split('T')[0];
    if (!logByDate.has(d)) logByDate.set(d, []);
    logByDate.get(d)!.push(e);
  }

  // Build DayAttendance for each day of the week
  const days: DayAttendance[] = weekDates.map(dateKey => {
    const entries = logByDate.get(dateKey) ?? [];
    const present = attendSet.has(dateKey);

    let games = 0;
    let spaceWar = 0;
    let ncertUsage = 0;
    let gardenActions = 0;
    for (const e of entries) {
      if (isGameAction(e)) games++;
      if (isSpaceWarAction(e)) spaceWar++;
      if (isNCERTAction(e)) ncertUsage++;
      if (isGardenAction(e)) gardenActions++;
    }

    // Rough estimate: each non-navigation action ≈ 2 min
    const meaningful = entries.filter(e => e.action !== 'navigation').length;
    const timeSpent = meaningful * 2;

    return { dateKey, games, spaceWar, ncertUsage, gardenActions, timeSpent, present };
  });

  // Weekly bubbles
  const weekBubbles = weekDates.map((date, i) => ({
    day: labels[i],
    date,
    present: attendSet.has(date),
  }));

  // Monthly attendance rate (school-day basis)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  let schoolDays = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    if (dt > now) break;
    const dow = dt.getDay();
    if (dow !== 0 && dow !== 6) schoolDays++;
  }
  const presentThisMonth = attendance.filter(
    a => a.startsWith(prefix) && a <= todayIso,
  ).length;
  const rate = schoolDays > 0
    ? Math.round((presentThisMonth / schoolDays) * 100)
    : 100;

  // Monthly attended days (all, including weekends)
  const monthlyDays = attendance.filter(d => d.startsWith(prefix)).length;

  // Weekly active (last 7 calendar days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffIso = cutoff.toISOString().split('T')[0];
  const weeklyActive = attendance.filter(d => d >= cutoffIso).length;

  // Perfect week check (last 7 calendar days all present)
  const isPerfectWeek = weeklyActive >= 7;

  return {
    attendance,
    streak,
    days,
    weekBubbles,
    rate,
    monthlyDays,
    weeklyActive,
    isPerfectWeek,
  };
}

/* ═══════════════════════════════════════════════════
   CONTEXT + PROVIDER + HOOK
   ═══════════════════════════════════════════════════ */

const defaultState: AttendanceState = {
  attendance: [],
  streak: 0,
  days: [],
  weekBubbles: [],
  rate: 100,
  monthlyDays: 0,
  weeklyActive: 0,
  isPerfectWeek: false,
};

const AttendanceContext = createContext<AttendanceState>(defaultState);

/**
 * Wrap around any component tree that needs live attendance data.
 * Polls localStorage every 2 s — no manual refresh required.
 */
export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AttendanceState>(() =>
    computeState(readStatsRaw(), readAuditLog()),
  );

  useEffect(() => {
    const tick = () =>
      setState(computeState(readStatsRaw(), readAuditLog()));
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <AttendanceContext.Provider value={state}>
      {children}
    </AttendanceContext.Provider>
  );
};

/** Consume live attendance data. Must be inside <AttendanceProvider>. */
export const useAttendance = (): AttendanceState =>
  useContext(AttendanceContext);
