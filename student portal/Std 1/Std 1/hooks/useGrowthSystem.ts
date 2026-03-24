/**
 * 🌳 useGrowthSystem
 * ────────────────────────────────────────────────────
 * Deterministic growth computation from persisted data.
 *
 * Data Sources (localStorage — role-agnostic):
 *   child_xp_state    → level (tree height / size)
 *   ssms_stats_v2     → attendance[] (leaf density), streak (flowers)
 *   ssms_audit_log    → game_complete count (fruits)
 *   ssms_homework     → homework completion % (seeds)
 *
 * Returns a GrowthData object consumed by:
 *   • Student: TreeWorld (visual/magical interactive garden)
 *   • Parent:  ParentGrowthSummary (analytical dashboard)
 *
 * All derivations are pure. No side effects. Fully memoized.
 */

import { useMemo } from 'react';

/* ── Public types ───────────────────────────────── */

export type TreeSize = 'seedling' | 'sprout' | 'sapling' | 'young' | 'mature' | 'mighty';
export type HealthTier = 'poor' | 'fair' | 'good' | 'excellent';
export type EngagementTier = 'inactive' | 'casual' | 'active' | 'dedicated';
export type HomeworkTier = 'none' | 'started' | 'halfway' | 'complete';

export interface GrowthData {
  /* raw metrics */
  level: number;
  attendancePercent: number;   // 0-100
  streak: number;
  completedGames: number;
  homeworkPercent: number;     // 0-100

  /* derived visual values */
  treeSize: TreeSize;
  treeHeight: number;          // 0-100 (SVG-friendly)
  leafDensity: number;         // 0-1  (maps to visual leaf count)
  flowerCount: number;         // 0-8  (clamped)
  fruitCount: number;          // 0-12 (clamped)
  homeworkSeeds: number;       // 0-6  (clamped)

  /* derived tiers */
  healthTier: HealthTier;
  engagementTier: EngagementTier;
  homeworkTier: HomeworkTier;

  /* student-facing message (no numbers) */
  message: string;

  /* today flags (for garden activity gating) */
  attendedToday: boolean;
}

/* ── Deterministic mapping functions ────────────── */

function deriveTreeSize(level: number): TreeSize {
  if (level <= 1)  return 'seedling';
  if (level <= 3)  return 'sprout';
  if (level <= 5)  return 'sapling';
  if (level <= 8)  return 'young';
  if (level <= 12) return 'mature';
  return 'mighty';
}

function deriveTreeHeight(level: number): number {
  // level 1 → 10, level 15+ → 100, smooth curve
  return Math.min(100, Math.max(10, Math.round(10 + (level - 1) * 6.4)));
}

function deriveLeafDensity(attendancePercent: number): number {
  return Math.min(1, Math.max(0, attendancePercent / 100));
}

function deriveFlowerCount(streak: number): number {
  return Math.min(8, Math.max(0, streak));
}

function deriveFruitCount(completedGames: number): number {
  return Math.min(12, Math.max(0, Math.floor(completedGames / 2)));
}

function deriveHomeworkSeeds(homeworkPercent: number): number {
  // 1 seed per ~17% homework done, max 6
  return Math.min(6, Math.max(0, Math.floor(homeworkPercent / 17)));
}

function deriveHealthTier(attendancePercent: number): HealthTier {
  if (attendancePercent >= 90) return 'excellent';
  if (attendancePercent >= 75) return 'good';
  if (attendancePercent >= 50) return 'fair';
  return 'poor';
}

function deriveEngagementTier(completedGames: number): EngagementTier {
  if (completedGames >= 20) return 'dedicated';
  if (completedGames >= 10) return 'active';
  if (completedGames >= 3)  return 'casual';
  return 'inactive';
}

function deriveHomeworkTier(homeworkPercent: number): HomeworkTier {
  if (homeworkPercent >= 100) return 'complete';
  if (homeworkPercent >= 50)  return 'halfway';
  if (homeworkPercent > 0)    return 'started';
  return 'none';
}

function deriveMessage(
  treeSize: TreeSize,
  healthTier: HealthTier,
  flowerCount: number,
  fruitCount: number,
  homeworkSeeds: number,
): string {
  if (treeSize === 'seedling') return 'A tiny seed is just beginning its journey!';
  if (treeSize === 'sprout')   return 'Your sprout is reaching for the sun!';

  const parts: string[] = [];

  if (healthTier === 'excellent') parts.push('Your garden is flourishing');
  else if (healthTier === 'good') parts.push('Your garden is healthy and strong');
  else if (healthTier === 'fair') parts.push('Your garden needs a little more care');
  else parts.push('Water your garden by attending more classes');

  if (flowerCount >= 5)       parts.push('and covered in flowers');
  else if (flowerCount >= 2)  parts.push('with pretty flowers blooming');

  if (fruitCount >= 6)        parts.push('and bursting with fruit');
  else if (fruitCount >= 2)   parts.push('and growing delicious fruit');

  if (homeworkSeeds >= 4)     parts.push('with seeds sprouting everywhere');
  else if (homeworkSeeds >= 1) parts.push('and new seeds planted');

  return parts.join(' ') + '!';
}

/* ── Data readers (localStorage — no context needed) ── */

function readLevel(): number {
  try {
    const raw = localStorage.getItem('child_xp_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.level === 'number') return parsed.level;
    }
  } catch { /* ignore */ }
  return 1;
}

function readAttendance(): { percent: number; streak: number; attendedToday: boolean } {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    if (raw) {
      const stats = JSON.parse(raw);
      const attendance: string[] = Array.isArray(stats.attendance) ? stats.attendance : [];
      const streak: number = typeof stats.streak === 'number' ? stats.streak : 0;

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const today = now.toISOString().split('T')[0];
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

      let schoolDays = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        if (dt > now) break;
        const dow = dt.getDay();
        if (dow !== 0 && dow !== 6) schoolDays++;
      }

      const present = attendance.filter(a => a.startsWith(prefix) && a <= today).length;
      const percent = schoolDays > 0 ? Math.round((present / schoolDays) * 100) : 100;
      const attendedToday = attendance.includes(today);

      return { percent, streak, attendedToday };
    }
  } catch { /* ignore */ }
  return { percent: 100, streak: 0, attendedToday: false };
}

function readCompletedGames(): number {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (raw) {
      const log = JSON.parse(raw);
      if (Array.isArray(log)) {
        return log.filter(
          (e: { action?: string }) => e.action === 'game_complete',
        ).length;
      }
    }
  } catch { /* ignore */ }
  return 0;
}

function readHomeworkPercent(): number {
  try {
    const raw = localStorage.getItem('ssms_homework');
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items) && items.length > 0) {
        const done = items.filter((h: { isDone?: boolean }) => h.isDone).length;
        return Math.round((done / items.length) * 100);
      }
    }
  } catch { /* ignore */ }
  return 0;
}

/* ── Hook ───────────────────────────────────────── */

/**
 * Returns fully-derived growth data.
 * Reads from localStorage on every call, but derivations are memoized
 * via useMemo keyed on the raw values.
 *
 * @param overrides — optional raw values (e.g. parent injects from own state).
 *   When provided, they bypass localStorage reads for that field.
 */
export function useGrowthSystem(overrides?: {
  level?: number;
  attendancePercent?: number;
  streak?: number;
  completedGames?: number;
  homeworkPercent?: number;
}): GrowthData {
  const attendanceData    = readAttendance();
  const level             = overrides?.level            ?? readLevel();
  const attendancePercent = overrides?.attendancePercent ?? attendanceData.percent;
  const streak            = overrides?.streak           ?? attendanceData.streak;
  const completedGames    = overrides?.completedGames   ?? readCompletedGames();
  const homeworkPercent   = overrides?.homeworkPercent   ?? readHomeworkPercent();
  const attendedToday     = attendanceData.attendedToday;

  return useMemo<GrowthData>(() => {
    const treeSize       = deriveTreeSize(level);
    const treeHeight     = deriveTreeHeight(level);
    const leafDensity    = deriveLeafDensity(attendancePercent);
    const flowerCount    = deriveFlowerCount(streak);
    const fruitCount     = deriveFruitCount(completedGames);
    const homeworkSeeds  = deriveHomeworkSeeds(homeworkPercent);
    const healthTier     = deriveHealthTier(attendancePercent);
    const engagementTier = deriveEngagementTier(completedGames);
    const homeworkTier   = deriveHomeworkTier(homeworkPercent);
    const message        = deriveMessage(treeSize, healthTier, flowerCount, fruitCount, homeworkSeeds);

    return {
      level,
      attendancePercent,
      streak,
      completedGames,
      homeworkPercent,
      treeSize,
      treeHeight,
      leafDensity,
      flowerCount,
      fruitCount,
      homeworkSeeds,
      healthTier,
      engagementTier,
      homeworkTier,
      message,
      attendedToday,
    };
  }, [level, attendancePercent, streak, completedGames, homeworkPercent, attendedToday]);
}
