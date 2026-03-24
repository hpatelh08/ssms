/**
 * services/activityLogger.ts
 * ─────────────────────────────────────────────────────
 * Tracks daily student activity minutes per category.
 * Written by child-side events, read by parent dashboard.
 *
 * Storage key: ssms_activity_log_v1
 * Resets automatically each new calendar day.
 */

export type ActivityCategory =
  | 'watchVideo'
  | 'games'
  | 'reading'
  | 'oddOneOut'
  | 'worldBuilder';

interface DayLog {
  date: string;
  watchVideo: number;
  games: number;
  reading: number;
  oddOneOut: number;
  worldBuilder: number;
}

const STORAGE_KEY = 'ssms_activity_log_v1';

const todayStr = (): string => new Date().toISOString().split('T')[0];

function loadLog(): DayLog {
  const today = todayStr();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as DayLog;
      // Only return existing data if it's from today, otherwise reset
      if (d.date === today) return d;
    }
  } catch { /* ignore */ }
  
  // Always return fresh data for today - this ensures only today's progress is shown
  const freshLog = { date: today, watchVideo: 0, games: 0, reading: 0, oddOneOut: 0, worldBuilder: 0 };
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshLog)); 
  } catch { /* ignore */ }
  return freshLog;
}

/** Force reset to today's date with zero values - ensures only today's progress */
export function resetToToday(): void {
  const todayLog = { date: todayStr(), watchVideo: 0, games: 0, reading: 0, oddOneOut: 0, worldBuilder: 0 };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todayLog)); } catch { /* ignore */ }
}

/** Add minutes to a category. Fractional minutes are accumulated and rounded. */
export function logActivity(category: ActivityCategory, minutes: number): void {
  if (!minutes || minutes <= 0) return;
  const log = loadLog();
  log[category] = Math.round((log[category] || 0) + minutes);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch { /* ignore */ }
}

/** Returns today's activity minutes per category. */
export function getActivitySummary(): Record<ActivityCategory, number> {
  const log = loadLog();
  return {
    watchVideo: log.watchVideo,
    games: log.games,
    reading: log.reading,
    oddOneOut: log.oddOneOut,
    worldBuilder: log.worldBuilder,
  };
}
