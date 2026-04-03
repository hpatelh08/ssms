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

const STORAGE_KEY = 'ssms_activity_log_history_v2';

const todayStr = (): string => new Date().toISOString().split('T')[0];

export function getFullHistory(): Record<string, DayLog> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return {};
}

function loadLog(): DayLog {
  const today = todayStr();
  const history = getFullHistory();
  if (history[today]) {
    return history[today];
  }

  const freshLog = { date: today, watchVideo: 0, games: 0, reading: 0, oddOneOut: 0, worldBuilder: 0 };
  history[today] = freshLog;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
  return freshLog;
}

export function resetToToday(): void {
  const today = todayStr();
  const history = getFullHistory();
  history[today] = { date: today, watchVideo: 0, games: 0, reading: 0, oddOneOut: 0, worldBuilder: 0 };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* ignore */ }
}

export function logActivity(category: ActivityCategory, minutes: number): void {
  if (!minutes || minutes <= 0) return;
  const today = todayStr();
  const history = getFullHistory();
  const log = history[today] || { date: today, watchVideo: 0, games: 0, reading: 0, oddOneOut: 0, worldBuilder: 0 };
  
  log[category] = Math.round((log[category] || 0) + minutes);
  history[today] = log;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* ignore */ }
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
