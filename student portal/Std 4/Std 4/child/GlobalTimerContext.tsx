/**
 * child/GlobalTimerContext.tsx
 * ─────────────────────────────────────────────────────
 * Global Playtime Timer — Provider + Hook
 *
 * Storage keys (spec-defined):
 *   parent_playtime_limit_enabled  — '1' | '0'
 *   parent_playtime_limit_minutes  — number (default 30)
 *   remaining_time_seconds         — remaining countdown in seconds
 *   timer_running                  — '1' | '0'
 *   timer_last_update              — Unix ms timestamp (for elapsed calc on refresh)
 *   timer_last_day                 — date string (for daily auto-reset)
 *
 * Rules:
 *  • Timer always starts PAUSED on page load.
 *  • Accounts for real elapsed time if browser was closed while running.
 *  • Auto-resets to full limit at the start of each new calendar day.
 *  • startTimer() / pauseTimer() are called by ChildLayout on screen change.
 *  • setPlaytimeLimit() is called by the parent Settings page.
 */

import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, useMemo,
} from 'react';

/* ── Storage helpers ─────────────────────────────── */

const KEYS = {
  LIMIT_ENABLED: 'parent_playtime_limit_enabled',
  LIMIT_MINUTES: 'parent_playtime_limit_minutes',
  REMAINING_SECS: 'remaining_time_seconds',
  RUNNING: 'timer_running',
  LAST_UPDATE: 'timer_last_update',
  LAST_DAY: 'timer_last_day',
} as const;

const DEFAULT_MINUTES = 30;

const ls = {
  get: (key: string, fallback: string): string => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
  },
};

/* ── Context type ────────────────────────────────── */

export interface GlobalTimerContextValue {
  /** Parent-configured limit in minutes (default 30). */
  limitMinutes: number;
  /** Whether the playtime limit feature is enabled by parent. */
  limitEnabled: boolean;
  /** Remaining seconds on the countdown. */
  remainingSeconds: number;
  /** Whether the countdown is actively ticking. */
  isRunning: boolean;
  /** True when limitEnabled === true AND remainingSeconds <= 0. */
  isExpired: boolean;
  /** Call when child enters a playable level screen. */
  startTimer: () => void;
  /** Call when child leaves gameplay (back, home, menu). */
  pauseTimer: () => void;
  /** Reset remaining time to the full configured limit. */
  resetTimer: () => void;
  /** Called by parent settings to update limit and enabled state. */
  setPlaytimeLimit: (minutes: number, enabled: boolean) => void;
}

/* ── Default context ─────────────────────────────── */

const GlobalTimerContext = createContext<GlobalTimerContextValue>({
  limitMinutes: DEFAULT_MINUTES,
  limitEnabled: false,
  remainingSeconds: DEFAULT_MINUTES * 60,
  isRunning: false,
  isExpired: false,
  startTimer: () => {},
  pauseTimer: () => {},
  resetTimer: () => {},
  setPlaytimeLimit: () => {},
});

/* ── Provider ────────────────────────────────────── */

export const GlobalTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [limitEnabled, setLimitEnabled] = useState<boolean>(() =>
    ls.get(KEYS.LIMIT_ENABLED, '0') === '1'
  );

  const [limitMinutes, setLimitMinutes] = useState<number>(() =>
    parseInt(ls.get(KEYS.LIMIT_MINUTES, String(DEFAULT_MINUTES)), 10)
  );

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    // ── Daily auto-reset ──────────────────────────────
    const today = new Date().toDateString();
    const lastDay = ls.get(KEYS.LAST_DAY, '');
    if (lastDay !== today) {
      ls.set(KEYS.LAST_DAY, today);
      ls.set(KEYS.RUNNING, '0');
      const mins = parseInt(ls.get(KEYS.LIMIT_MINUTES, String(DEFAULT_MINUTES)), 10);
      const freshSecs = mins * 60;
      ls.set(KEYS.REMAINING_SECS, String(freshSecs));
      return freshSecs;
    }

    const saved = parseInt(ls.get(KEYS.REMAINING_SECS, '-1'), 10);
    if (saved < 0) {
      // First run: initialise from limit
      const mins = parseInt(ls.get(KEYS.LIMIT_MINUTES, String(DEFAULT_MINUTES)), 10);
      return mins * 60;
    }

    // ── Account for time elapsed on page refresh ──────
    if (ls.get(KEYS.RUNNING, '0') === '1') {
      const lastUpdate = parseInt(ls.get(KEYS.LAST_UPDATE, '0'), 10);
      if (lastUpdate > 0) {
        const elapsed = Math.floor((Date.now() - lastUpdate) / 1000);
        const adjusted = Math.max(0, saved - elapsed);
        ls.set(KEYS.REMAINING_SECS, String(adjusted));
        ls.set(KEYS.RUNNING, '0');
        return adjusted;
      }
    }

    ls.set(KEYS.RUNNING, '0'); // Always start paused on page load
    return saved;
  });

  // Timer always starts paused on page load
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable refs — used inside callbacks to avoid stale closures
  const limitEnabledRef = useRef(limitEnabled);
  const limitMinutesRef = useRef(limitMinutes);
  const isRunningRef = useRef(false);

  useEffect(() => { limitEnabledRef.current = limitEnabled; }, [limitEnabled]);
  useEffect(() => { limitMinutesRef.current = limitMinutes; }, [limitMinutes]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  const isExpired = limitEnabled && remainingSeconds <= 0;

  // ── Persist isRunning + last-update timestamp ────
  useEffect(() => {
    ls.set(KEYS.RUNNING, isRunning ? '1' : '0');
    if (isRunning) ls.set(KEYS.LAST_UPDATE, String(Date.now()));
  }, [isRunning]);

  // ── Countdown interval ───────────────────────────
  // Only re-creates when isRunning or limitEnabled changes (not every second).
  // Uses functional setState to avoid stale remainingSeconds inside the closure.
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!isRunning || !limitEnabled) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = Math.max(0, prev - 1);
        ls.set(KEYS.REMAINING_SECS, String(next));
        ls.set(KEYS.LAST_UPDATE, String(Date.now()));
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, limitEnabled]);

  // ── Auto-stop when reaches zero ──────────────────
  useEffect(() => {
    if (remainingSeconds <= 0 && isRunning) {
      setIsRunning(false);
    }
  }, [remainingSeconds, isRunning]);

  // ── Public API ───────────────────────────────────

  /** Start / resume countdown. No-op if limit disabled. */
  const startTimer = useCallback(() => {
    if (limitEnabledRef.current) {
      setIsRunning(true);
    }
  }, []);

  /** Pause countdown instantly. Remaining time is preserved. */
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  /** Reset remaining time to the full limit value (parent action). */
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    const secs = limitMinutesRef.current * 60;
    setRemainingSeconds(secs);
    ls.set(KEYS.REMAINING_SECS, String(secs));
  }, []);

  /**
   * Update parent settings.
   * - Disabling: stops timer and resets remaining to new limit.
   * - Enabling / changing limit when NOT running: applies immediately.
   * - Changing limit while running: applies on next session reset.
   */
  const setPlaytimeLimit = useCallback((minutes: number, enabled: boolean) => {
    setLimitEnabled(enabled);
    setLimitMinutes(minutes);
    ls.set(KEYS.LIMIT_ENABLED, enabled ? '1' : '0');
    ls.set(KEYS.LIMIT_MINUTES, String(minutes));

    if (!enabled) {
      // Disabling: stop timer and apply new value
      setIsRunning(false);
      const secs = minutes * 60;
      setRemainingSeconds(secs);
      ls.set(KEYS.REMAINING_SECS, String(secs));
    } else if (!isRunningRef.current) {
      // Enabling or adjusting limit when idle: reset immediately
      const secs = minutes * 60;
      setRemainingSeconds(secs);
      ls.set(KEYS.REMAINING_SECS, String(secs));
    }
    // If already running: new limit takes effect on next session
  }, []);

  const value = useMemo<GlobalTimerContextValue>(() => ({
    limitMinutes,
    limitEnabled,
    remainingSeconds,
    isRunning,
    isExpired,
    startTimer,
    pauseTimer,
    resetTimer,
    setPlaytimeLimit,
  }), [
    limitMinutes, limitEnabled, remainingSeconds,
    isRunning, isExpired,
    startTimer, pauseTimer, resetTimer, setPlaytimeLimit,
  ]);

  return (
    <GlobalTimerContext.Provider value={value}>
      {children}
    </GlobalTimerContext.Provider>
  );
};

/* ── Consumer hook ───────────────────────────────── */

export const useGlobalPlayTimer = (): GlobalTimerContextValue =>
  useContext(GlobalTimerContext);
