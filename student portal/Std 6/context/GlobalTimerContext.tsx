/**
 * context/GlobalTimerContext.tsx
 * ─────────────────────────────────────────────────────
 * Global Playtime Timer System
 *
 * Rules:
 *  - Timer does NOT start when app opens or menus are browsed.
 *  - Timer starts ONLY when a child enters a playable level.
 *  - Timer pauses the instant the child exits gameplay.
 *  - Remaining time persists across refreshes via localStorage.
 *  - Parent can set the daily limit from Settings → Playtime Limit.
 *  - Parent can set daily read limit from Settings → Read Time Limit.
 *
 * localStorage keys (shared with SettingsPage):
 *   parent_playtime_enabled  → '1' | '0'
 *   parent_playtime_limit    → number (minutes, default 30)
 *   timer_remaining_seconds  → number (current session remaining)
 *   parent_readtime_enabled  → '1' | '0'
 *   parent_readtime_limit    → number (minutes, default 30)
 *   read_timer_remaining_seconds → number (current reading-session remaining)
 *
 * To update the limit from SettingsPage without a page reload,
 * dispatch: window.dispatchEvent(new Event('playtimeLimitUpdated'))
 */

import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from 'react';

/* ── Storage helpers ────────────────────────────── */

const KEYS = {
  enabled:   'parent_playtime_enabled',
  limitMins: 'parent_playtime_limit',
  remaining: 'timer_remaining_seconds',
  readEnabled:   'parent_readtime_enabled',
  readLimitMins: 'parent_readtime_limit',
  readRemaining: 'read_timer_remaining_seconds',
} as const;

function readEnabled(): boolean {
  try { return localStorage.getItem(KEYS.enabled) === '1'; } catch { return false; }
}
function readLimit(): number {
  try {
    const v = localStorage.getItem(KEYS.limitMins);
    const n = v ? parseInt(v, 10) : 30;
    return Number.isFinite(n) && n >= 1 ? n : 30;
  } catch { return 30; }
}
function readRemaining(): number | null {
  try {
    const v = localStorage.getItem(KEYS.remaining);
    if (v === null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch { return null; }
}
function saveRemaining(s: number): void {
  try { localStorage.setItem(KEYS.remaining, String(s)); } catch { /* ignore */ }
}

function readReadEnabled(): boolean {
  try { return localStorage.getItem(KEYS.readEnabled) === '1'; } catch { return false; }
}
function readReadLimit(): number {
  try {
    const v = localStorage.getItem(KEYS.readLimitMins);
    const n = v ? parseInt(v, 10) : 30;
    return Number.isFinite(n) && n >= 1 ? n : 30;
  } catch { return 30; }
}
function readReadRemaining(): number | null {
  try {
    const v = localStorage.getItem(KEYS.readRemaining);
    if (v === null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch { return null; }
}
function saveReadRemaining(s: number): void {
  try { localStorage.setItem(KEYS.readRemaining, String(s)); } catch { /* ignore */ }
}

/* ── Context shape ──────────────────────────────── */

export interface GlobalTimerCtx {
  /** Time remaining in the current session, seconds. */
  remainingSeconds: number;
  /** Whether the countdown tick is active right now. */
  isRunning: boolean;
  /** True when limit is enabled AND remaining === 0. */
  isExpired: boolean;
  /** Whether the parent has enabled the limit feature. */
  limitEnabled: boolean;
  /** Parent-set limit in minutes (default 30). */
  limitMinutes: number;
  /** Call this when a level is entered. */
  startTimer: () => void;
  /** Call this when the child exits gameplay. */
  pauseTimer: () => void;
  /** Resets remaining time back to the full limit (call at new day / parent action). */
  resetSession: () => void;

  /** Reading time remaining in the current session, seconds. */
  readRemainingSeconds: number;
  /** Whether read countdown is currently active. */
  readIsRunning: boolean;
  /** True when read limit is enabled AND remaining === 0. */
  readIsExpired: boolean;
  /** Whether parent has enabled read limit. */
  readLimitEnabled: boolean;
  /** Parent-set read limit in minutes (default 30). */
  readLimitMinutes: number;
  /** Call this when a book reader is opened. */
  startReadTimer: () => void;
  /** Call this when a book reader is closed. */
  pauseReadTimer: () => void;
  /** Resets reading remaining time back to full limit. */
  resetReadSession: () => void;
}

/* ── Context ────────────────────────────────────── */

const Ctx = createContext<GlobalTimerCtx | null>(null);

/* ── Provider ───────────────────────────────────── */

export const GlobalTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [limitEnabled, setLimitEnabled] = useState<boolean>(readEnabled);
  const [limitMinutes, setLimitMinutes] = useState<number>(readLimit);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const saved = readRemaining();
    return saved !== null ? saved : readLimit() * 60;
  });
  const [isRunning, setIsRunning] = useState(false);

  const [readLimitEnabled, setReadLimitEnabled] = useState<boolean>(readReadEnabled);
  const [readLimitMinutes, setReadLimitMinutes] = useState<number>(readReadLimit);
  const [readRemainingSeconds, setReadRemainingSeconds] = useState<number>(() => {
    const saved = readReadRemaining();
    return saved !== null ? saved : readReadLimit() * 60;
  });
  const [readIsRunning, setReadIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref so interval callback always sees latest value without stale closure.
  const remainingRef = useRef(remainingSeconds);
  useEffect(() => { remainingRef.current = remainingSeconds; }, [remainingSeconds]);
  const readRemainingRef = useRef(readRemainingSeconds);
  useEffect(() => { readRemainingRef.current = readRemainingSeconds; }, [readRemainingSeconds]);

  /* ── Tick helpers ─────────────────────────────── */

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = Math.max(0, prev - 1);
        saveRemaining(next);
        if (next === 0) {
          // Stop automatically when expired
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
        }
        return next;
      });
    }, 1000);
  }, [clearTick]);

  const clearReadTick = useCallback(() => {
    if (readIntervalRef.current !== null) {
      clearInterval(readIntervalRef.current);
      readIntervalRef.current = null;
    }
  }, []);

  const startReadTick = useCallback(() => {
    clearReadTick();
    readIntervalRef.current = setInterval(() => {
      setReadRemainingSeconds(prev => {
        const next = Math.max(0, prev - 1);
        saveReadRemaining(next);
        if (next === 0) {
          clearInterval(readIntervalRef.current!);
          readIntervalRef.current = null;
          setReadIsRunning(false);
        }
        return next;
      });
    }, 1000);
  }, [clearReadTick]);

  /* ── Public API ───────────────────────────────── */

  const startTimer = useCallback(() => {
    if (!limitEnabled) return;
    if (remainingRef.current <= 0) return; // already expired
    setIsRunning(true);
    startTick();
  }, [limitEnabled, startTick]);

  const pauseTimer = useCallback(() => {
    clearTick();
    setIsRunning(false);
    saveRemaining(remainingRef.current);
  }, [clearTick]);

  const resetSession = useCallback(() => {
    clearTick();
    setIsRunning(false);
    const fresh = limitMinutes * 60;
    setRemainingSeconds(fresh);
    remainingRef.current = fresh;
    saveRemaining(fresh);
  }, [clearTick, limitMinutes]);

  const startReadTimer = useCallback(() => {
    if (!readLimitEnabled) return;
    if (readRemainingRef.current <= 0) return;
    setReadIsRunning(true);
    startReadTick();
  }, [readLimitEnabled, startReadTick]);

  const pauseReadTimer = useCallback(() => {
    clearReadTick();
    setReadIsRunning(false);
    saveReadRemaining(readRemainingRef.current);
  }, [clearReadTick]);

  const resetReadSession = useCallback(() => {
    clearReadTick();
    setReadIsRunning(false);
    const fresh = readLimitMinutes * 60;
    setReadRemainingSeconds(fresh);
    readRemainingRef.current = fresh;
    saveReadRemaining(fresh);
  }, [clearReadTick, readLimitMinutes]);

  /* ── Sync with SettingsPage ───────────────────── */
  useEffect(() => {
    const onUpdate = () => {
      const newEnabled = readEnabled();
      const newLimit   = readLimit();
      const newReadEnabled = readReadEnabled();
      const newReadLimit = readReadLimit();
      setLimitEnabled(newEnabled);
      setLimitMinutes(newLimit);
      setReadLimitEnabled(newReadEnabled);
      setReadLimitMinutes(newReadLimit);
      // If timer not actively running, re-apply the new limit only when
      // no saved remaining exists (fresh scenario) or full limit was set.
      if (!intervalRef.current) {
        const saved = readRemaining();
        const fullOldLimit = !saved || saved === limitMinutes * 60;
        if (fullOldLimit) {
          const fresh = newLimit * 60;
          setRemainingSeconds(fresh);
          remainingRef.current = fresh;
          saveRemaining(fresh);
        }
      }

      if (!readIntervalRef.current) {
        const savedRead = readReadRemaining();
        const readFullOldLimit = !savedRead || savedRead === readLimitMinutes * 60;
        if (readFullOldLimit) {
          const fresh = newReadLimit * 60;
          setReadRemainingSeconds(fresh);
          readRemainingRef.current = fresh;
          saveReadRemaining(fresh);
        }
      }
    };
    window.addEventListener('playtimeLimitUpdated', onUpdate);
    return () => window.removeEventListener('playtimeLimitUpdated', onUpdate);
  }, [limitMinutes, readLimitMinutes]);

  /* ── Cleanup on unmount ───────────────────────── */
  useEffect(() => () => {
    clearTick();
    clearReadTick();
  }, [clearTick, clearReadTick]);

  const isExpired = limitEnabled && remainingSeconds <= 0;
  const readIsExpired = readLimitEnabled && readRemainingSeconds <= 0;

  const value: GlobalTimerCtx = {
    remainingSeconds,
    isRunning,
    isExpired,
    limitEnabled,
    limitMinutes,
    startTimer,
    pauseTimer,
    resetSession,
    readRemainingSeconds,
    readIsRunning,
    readIsExpired,
    readLimitEnabled,
    readLimitMinutes,
    startReadTimer,
    pauseReadTimer,
    resetReadSession,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/* ── Hook ───────────────────────────────────────── */

export function useGlobalPlayTimer(): GlobalTimerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalPlayTimer must be used inside <GlobalTimerProvider>');
  return ctx;
}
