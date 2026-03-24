/**
 * child/GlobalTimerContext.tsx
 * ──────────────────────────────────────────────────────────
 * Global Play Timer — one shared countdown for all game modules.
 *
 * Rules:
 *  • Timer starts ONLY when child enters a playable level
 *  • Timer pauses instantly when child clicks Back
 *  • Persists remaining time in localStorage — survives refresh
 *  • Only one setInterval ever runs at a time
 *  • Works across: English · Maths · Science · Brain Boost · Puzzle Zone
 *
 * API:
 *   enterGame(gameId, level) — starts or resumes from saved remaining time
 *   exitGame()               — pauses and saves exact remaining time
 *   resetTimer()             — reset to full duration (parent/admin)
 */

import React, {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from 'react';

/* ── Constants ─────────────────────────────────────────── */

const STORAGE_KEY = 'ssms_play_timer_v1';
export const DEFAULT_TOTAL_MS = 30 * 60 * 1000; // 30 minutes fallback

/** Storage keys shared with SettingsPage */
const PARENT_LIMIT_KEY     = 'parent_playtime_limit';    // stored as minutes string
const PARENT_ENABLED_KEY   = 'parent_playtime_enabled';  // '1' or '0'

/* ── Parent config reader (single source of truth) ────── */

export function readParentConfig(): { totalMs: number; limitEnabled: boolean } {
  try {
    const mins    = localStorage.getItem(PARENT_LIMIT_KEY);
    const enabled = localStorage.getItem(PARENT_ENABLED_KEY);
    const totalMs = mins
      ? Math.max(1, parseInt(mins, 10)) * 60 * 1000
      : DEFAULT_TOTAL_MS;
    return { totalMs, limitEnabled: enabled === '1' };
  } catch {
    return { totalMs: DEFAULT_TOTAL_MS, limitEnabled: false };
  }
}

/* ── State shape ────────────────────────────────────────── */

export interface TimerState {
  totalMs: number;
  remainingMs: number;
  isRunning: boolean;
  /** true once enterGame() has been called at least once */
  hasStarted: boolean;
  isExpired: boolean;
  /** epoch ms when this state was last saved to storage */
  lastTickAt: number;
  currentGame: string;
  currentLevel: number;
  /** Whether the parent has enabled the playtime limit */
  limitEnabled: boolean;
}

const DEFAULT_STATE: TimerState = {
  totalMs: DEFAULT_TOTAL_MS,
  remainingMs: DEFAULT_TOTAL_MS,
  isRunning: false,
  hasStarted: false,
  isExpired: false,
  lastTickAt: 0,
  currentGame: '',
  currentLevel: 0,
  limitEnabled: false,
};

/* ── Persistence ────────────────────────────────────────── */

function saveToStorage(s: TimerState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function loadFromStorage(): TimerState {
  // Always treat parent config as authoritative for totalMs and limitEnabled
  const { totalMs: configuredMs, limitEnabled } = readParentConfig();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE, totalMs: configuredMs, remainingMs: configuredMs, limitEnabled };
    }
    const saved: TimerState = { ...DEFAULT_STATE, ...JSON.parse(raw) };

    // If parent changed the limit since last save and timer is not running,
    // reset remaining to the new total (fresh session with new limit).
    let remainingMs = saved.remainingMs;
    if (saved.totalMs !== configuredMs && !saved.isRunning) {
      remainingMs = configuredMs;
    }

    // If the timer WAS running when the page closed, fast-forward elapsed time
    if (saved.isRunning && saved.lastTickAt > 0) {
      const elapsedMs = Date.now() - saved.lastTickAt;
      const newRemaining = Math.max(0, remainingMs - elapsedMs);
      const expired = newRemaining <= 0;
      return { ...saved, totalMs: configuredMs, remainingMs: newRemaining, isRunning: !expired, isExpired: expired, limitEnabled };
    }

    return { ...saved, totalMs: configuredMs, remainingMs, isRunning: false, limitEnabled };
  } catch {
    return { ...DEFAULT_STATE, totalMs: configuredMs, remainingMs: configuredMs, limitEnabled };
  }
}

/* ── Context ────────────────────────────────────────────── */

interface TimerContextValue {
  timerState: TimerState;
  /** Call when child enters a playable level */
  enterGame: (gameId: string, level: number) => void;
  /** Call when child clicks Back / exits gameplay */
  exitGame: () => void;
  /** Reset to full duration — use from parent/admin side only */
  resetTimer: () => void;
  /**
   * Called by ParentSettings when the playtime config changes.
   * If timer is not running: immediately applies the new totalMs + resets remaining.
   * If timer is running:    stores new totalMs; applies from next reset.
   */
  updateConfig: (minutes: number, enabled: boolean) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────── */

export const GlobalTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timerState, setTimerState] = useState<TimerState>(loadFromStorage);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─ Single interval — created when running, cleared otherwise ─ */
  useEffect(() => {
    if (!timerState.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Guard: clear any stale interval before starting fresh
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        if (!prev.isRunning || prev.remainingMs <= 0) return prev;

        const newRemaining = Math.max(0, prev.remainingMs - 1000);
        const expired = newRemaining <= 0;
        const updated: TimerState = {
          ...prev,
          remainingMs: newRemaining,
          isRunning: !expired,
          isExpired: expired,
          lastTickAt: Date.now(),
        };
        saveToStorage(updated);
        return updated;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning]);

  /* ─ enterGame: start or resume timer ─ */
  const enterGame = useCallback((gameId: string, level: number) => {
    setTimerState(prev => {
      // If limit is disabled, gameplay is unrestricted — do not start the timer
      if (!prev.limitEnabled) return prev;
      // Block entry if time is already up
      if (prev.isExpired || prev.remainingMs <= 0) return prev;
      const updated: TimerState = {
        ...prev,
        isRunning: true,
        hasStarted: true,
        currentGame: gameId,
        currentLevel: level,
        lastTickAt: Date.now(),
      };
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /* ─ exitGame: pause and save ─ */
  const exitGame = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning) return prev;
      const updated: TimerState = {
        ...prev,
        isRunning: false,
        lastTickAt: Date.now(),
      };
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /* ─ resetTimer: used by parent/admin to give fresh session ─ */
  const resetTimer = useCallback(() => {
    setTimerState(prev => {
      const fresh: TimerState = {
        ...DEFAULT_STATE,
        totalMs: prev.totalMs,
        remainingMs: prev.totalMs,
        limitEnabled: prev.limitEnabled,
      };
      saveToStorage(fresh);
      return fresh;
    });
  }, []);

  /* ─ updateConfig: called from ParentSettings when limit changes ─ */
  const updateConfig = useCallback((minutes: number, enabled: boolean) => {
    const newTotalMs = Math.max(1, minutes) * 60 * 1000;
    // Persist to parent config keys immediately
    try {
      localStorage.setItem(PARENT_LIMIT_KEY, String(minutes));
      localStorage.setItem(PARENT_ENABLED_KEY, enabled ? '1' : '0');
    } catch { /* ignore */ }

    setTimerState(prev => {
      if (prev.isRunning) {
        // Timer is actively counting — store new limit, apply from next reset
        const updated: TimerState = { ...prev, totalMs: newTotalMs, limitEnabled: enabled };
        saveToStorage(updated);
        return updated;
      } else {
        // Not running — apply immediately with fresh remaining time
        const updated: TimerState = {
          ...DEFAULT_STATE,
          totalMs: newTotalMs,
          remainingMs: newTotalMs,
          limitEnabled: enabled,
        };
        saveToStorage(updated);
        return updated;
      }
    });
  }, []);

  return (
    <TimerContext.Provider value={{ timerState, enterGame, exitGame, resetTimer, updateConfig }}>
      {children}
    </TimerContext.Provider>
  );
};

/* ── Hook ───────────────────────────────────────────────── */

export function useGlobalPlayTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useGlobalPlayTimer must be used inside GlobalTimerProvider');
  return ctx;
}
