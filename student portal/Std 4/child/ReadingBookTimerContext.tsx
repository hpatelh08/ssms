/**
 * child/ReadingBookTimerContext.tsx
 * ─────────────────────────────────────────────────────
 * Reading Book Timer — Provider + Hook
 *
 * Similar to GlobalTimerContext but tracks reading time across the app.
 * Starts timer when student opens a book, stops when they close it.
 *
 * Storage keys:
 *   reading_book_limit_enabled     — '1' | '0'
 *   reading_book_limit_minutes     — number (default 60)
 *   reading_remaining_seconds      — remaining countdown in seconds
 *   reading_timer_running          — '1' | '0'
 *   reading_timer_last_update      — Unix ms timestamp
 *   reading_timer_last_day         — date string (for daily auto-reset)
 */

import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, useMemo,
} from 'react';
import { logActivity } from '../services/activityLogger';

/* ── Storage helpers ─────────────────────────────── */

const KEYS = {
  LIMIT_ENABLED: 'reading_book_limit_enabled',
  LIMIT_MINUTES: 'reading_book_limit_minutes',
  REMAINING_SECS: 'reading_remaining_seconds',
  RUNNING: 'reading_timer_running',
  LAST_UPDATE: 'reading_timer_last_update',
  LAST_DAY: 'reading_timer_last_day',
} as const;

const DEFAULT_MINUTES = 60;

const ls = {
  get: (key: string, fallback: string): string => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
  },
};

/* ── Context type ────────────────────────────────── */

export interface ReadingBookTimerContextValue {
  /** Parent-configured limit in minutes (default 60). */
  limitMinutes: number;
  /** Whether the reading book limit feature is enabled by parent. */
  limitEnabled: boolean;
  /** Remaining seconds on the countdown. */
  remainingSeconds: number;
  /** Whether the countdown is actively ticking. */
  isRunning: boolean;
  /** True when limitEnabled === true AND remainingSeconds <= 0. */
  isExpired: boolean;
  /** Call when child opens a book. */
  startReadingTimer: () => void;
  /** Call when child closes a book. */
  stopReadingTimer: () => void;
  /** Reset remaining time to the full configured limit. */
  resetReadingTimer: () => void;
  /** Called by parent settings to update limit and enabled state. */
  setReadingBookLimit: (minutes: number, enabled: boolean) => void;
}

/* ── Default context ─────────────────────────────── */

const ReadingBookTimerContext = createContext<ReadingBookTimerContextValue>({
  limitMinutes: DEFAULT_MINUTES,
  limitEnabled: false,
  remainingSeconds: DEFAULT_MINUTES * 60,
  isRunning: false,
  isExpired: false,
  startReadingTimer: () => {},
  stopReadingTimer: () => {},
  resetReadingTimer: () => {},
  setReadingBookLimit: () => {},
});

/* ── Provider Component ──────────────────────────── */

export const ReadingBookTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* Load from localStorage on mount */
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitMinutes, setLimitMinutes] = useState(DEFAULT_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readingStartRef = useRef<number | null>(null);

  /* Load initial state from localStorage */
  useEffect(() => {
    const enabled = ls.get(KEYS.LIMIT_ENABLED, '0') === '1';
    const minutes = parseInt(ls.get(KEYS.LIMIT_MINUTES, String(DEFAULT_MINUTES)), 10);
    const remaining = parseInt(ls.get(KEYS.REMAINING_SECS, String(DEFAULT_MINUTES * 60)), 10);
    const lastDay = ls.get(KEYS.LAST_DAY, '');
    const today = new Date().toISOString().split('T')[0];

    /* Daily auto-reset */
    if (lastDay !== today) {
      setRemainingSeconds(minutes * 60);
      ls.set(KEYS.REMAINING_SECS, String(minutes * 60));
      ls.set(KEYS.LAST_DAY, today);
    } else {
      setRemainingSeconds(remaining);
    }

    setLimitEnabled(enabled);
    setLimitMinutes(minutes);
  }, []);

  /* Countdown effect */
  useEffect(() => {
    if (!isRunning || !limitEnabled) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = Math.max(0, prev - 1);
        ls.set(KEYS.REMAINING_SECS, String(next));
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, limitEnabled]);

  /* API: Start reading timer */
  const startReadingTimer = useCallback(() => {
    if (limitEnabled) setIsRunning(true);
    readingStartRef.current = Date.now();
  }, [limitEnabled]);

  /* API: Stop reading timer */
  const stopReadingTimer = useCallback(() => {
    setIsRunning(false);
    if (readingStartRef.current !== null) {
      const elapsedMins = Math.floor((Date.now() - readingStartRef.current) / 60000);
      if (elapsedMins >= 1) logActivity('reading', elapsedMins);
      readingStartRef.current = null;
    }
  }, []);

  /* API: Reset to full limit */
  const resetReadingTimer = useCallback(() => {
    const fullSeconds = limitMinutes * 60;
    setRemainingSeconds(fullSeconds);
    ls.set(KEYS.REMAINING_SECS, String(fullSeconds));
  }, [limitMinutes]);

  /* API: Update limit from parent settings */
  const setReadingBookLimit = useCallback((minutes: number, enabled: boolean) => {
    setLimitMinutes(minutes);
    setLimitEnabled(enabled);
    ls.set(KEYS.LIMIT_MINUTES, String(minutes));
    ls.set(KEYS.LIMIT_ENABLED, enabled ? '1' : '0');

    if (!enabled) {
      setIsRunning(false);
      resetReadingTimer();
    }
  }, [resetReadingTimer]);

  const value: ReadingBookTimerContextValue = {
    limitMinutes,
    limitEnabled,
    remainingSeconds,
    isRunning,
    isExpired: limitEnabled && remainingSeconds <= 0,
    startReadingTimer,
    stopReadingTimer,
    resetReadingTimer,
    setReadingBookLimit,
  };

  return (
    <ReadingBookTimerContext.Provider value={value}>
      {children}
    </ReadingBookTimerContext.Provider>
  );
};

/* ── Hook ────────────────────────────────────────── */

export const useReadingBookTimer = (): ReadingBookTimerContextValue => {
  const context = useContext(ReadingBookTimerContext);
  if (!context) throw new Error('useReadingBookTimer must be used within ReadingBookTimerProvider');
  return context;
};
