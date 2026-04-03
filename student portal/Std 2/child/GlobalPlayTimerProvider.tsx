import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const KEY_PARENT_ENABLED = 'parent_playtime_limit_enabled';
const KEY_PARENT_MINUTES = 'parent_playtime_limit_minutes';
const KEY_REMAINING = 'remaining_time_seconds';
const KEY_RUNNING = 'timer_running';
const KEY_LAST_UPDATE = 'timer_last_update';

const KEY_SESSION_LIMIT = 'timer_session_limit_minutes';
const KEY_PENDING_LIMIT = 'timer_pending_limit_minutes';
const KEY_SESSION_DATE = 'timer_session_date';
const KEY_TIME_UP = 'timer_time_up';

const LEGACY_PARENT_ENABLED = 'parent_playtime_enabled';
const LEGACY_PARENT_MINUTES = 'parent_playtime_limit';

const DEFAULT_LIMIT_MINUTES = 30;
export const TIME_UP_MESSAGE = 'Time limit reached. Please come back tomorrow.';

interface TimerState {
  limitEnabled: boolean;
  limitMinutes: number;
  sessionLimitMinutes: number;
  pendingLimitMinutes: number | null;
  remainingSeconds: number;
  running: boolean;
  lastUpdateMs: number;
  timeUp: boolean;
  sessionDate: string;
}

interface GlobalPlayTimerContextValue {
  limitEnabled: boolean;
  limitMinutes: number;
  sessionLimitMinutes: number;
  pendingLimitMinutes: number | null;
  remainingSeconds: number;
  running: boolean;
  isTimeUp: boolean;
  timeUpMessage: string;
  startTimer: () => boolean;
  pauseTimer: () => void;
  resumeTimer: () => boolean;
  stopTimer: () => void;
  resetTimer: () => void;
  setPlaytimeLimit: (minutes: number, enabled: boolean) => void;
  canEnterGameplay: () => boolean;
}

const GlobalPlayTimerContext = createContext<GlobalPlayTimerContextValue | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readBool(raw: string | null, fallback: boolean): boolean {
  if (raw === null) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

function readInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function normalizeForToday(prev: TimerState): TimerState {
  const today = todayKey();
  if (prev.sessionDate === today) return prev;

  const appliedLimit = Math.max(1, prev.pendingLimitMinutes ?? prev.limitMinutes);
  return {
    ...prev,
    sessionDate: today,
    sessionLimitMinutes: appliedLimit,
    pendingLimitMinutes: null,
    remainingSeconds: appliedLimit * 60,
    running: false,
    timeUp: false,
    lastUpdateMs: Date.now(),
  };
}

function clampMinutes(minutes: number): number {
  if (Number.isNaN(minutes)) return DEFAULT_LIMIT_MINUTES;
  return Math.min(120, Math.max(10, Math.round(minutes)));
}

function createInitialState(): TimerState {
  const now = Date.now();

  try {
    const parentEnabled = readBool(
      localStorage.getItem(KEY_PARENT_ENABLED) ?? localStorage.getItem(LEGACY_PARENT_ENABLED),
      true,
    );

    const parentLimit = clampMinutes(
      readInt(
        localStorage.getItem(KEY_PARENT_MINUTES) ?? localStorage.getItem(LEGACY_PARENT_MINUTES),
        DEFAULT_LIMIT_MINUTES,
      ),
    );

    const sessionLimit = clampMinutes(readInt(localStorage.getItem(KEY_SESSION_LIMIT), parentLimit));
    const pendingRaw = localStorage.getItem(KEY_PENDING_LIMIT);
    const pendingLimit = pendingRaw ? clampMinutes(readInt(pendingRaw, parentLimit)) : null;

    const sessionDate = localStorage.getItem(KEY_SESSION_DATE) || todayKey();
    const remaining = Math.max(0, readInt(localStorage.getItem(KEY_REMAINING), sessionLimit * 60));
    const running = readBool(localStorage.getItem(KEY_RUNNING), false);
    const lastUpdateMs = Math.max(0, readInt(localStorage.getItem(KEY_LAST_UPDATE), now));
    const storedTimeUp = readBool(localStorage.getItem(KEY_TIME_UP), false);

    let state: TimerState = {
      limitEnabled: parentEnabled,
      limitMinutes: parentLimit,
      sessionLimitMinutes: sessionLimit,
      pendingLimitMinutes: pendingLimit,
      remainingSeconds: remaining,
      running,
      lastUpdateMs,
      timeUp: storedTimeUp || remaining <= 0,
      sessionDate,
    };

    state = normalizeForToday(state);

    if (state.running && state.limitEnabled) {
      const elapsed = Math.max(0, Math.floor((now - state.lastUpdateMs) / 1000));
      if (elapsed > 0) {
        const nextRemaining = Math.max(0, state.remainingSeconds - elapsed);
        state = {
          ...state,
          remainingSeconds: nextRemaining,
          lastUpdateMs: now,
          running: nextRemaining > 0,
          timeUp: nextRemaining <= 0,
        };
      }
    }

    return state;
  } catch {
    return {
      limitEnabled: true,
      limitMinutes: DEFAULT_LIMIT_MINUTES,
      sessionLimitMinutes: DEFAULT_LIMIT_MINUTES,
      pendingLimitMinutes: null,
      remainingSeconds: DEFAULT_LIMIT_MINUTES * 60,
      running: false,
      lastUpdateMs: now,
      timeUp: false,
      sessionDate: todayKey(),
    };
  }
}

export const GlobalPlayTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TimerState>(() => createInitialState());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_PARENT_ENABLED, state.limitEnabled ? '1' : '0');
      localStorage.setItem(KEY_PARENT_MINUTES, String(state.limitMinutes));
      localStorage.setItem(KEY_REMAINING, String(state.remainingSeconds));
      localStorage.setItem(KEY_RUNNING, state.running ? '1' : '0');
      localStorage.setItem(KEY_LAST_UPDATE, String(state.lastUpdateMs));
      localStorage.setItem(KEY_SESSION_LIMIT, String(state.sessionLimitMinutes));
      localStorage.setItem(KEY_SESSION_DATE, state.sessionDate);
      localStorage.setItem(KEY_TIME_UP, state.timeUp ? '1' : '0');

      if (state.pendingLimitMinutes !== null) {
        localStorage.setItem(KEY_PENDING_LIMIT, String(state.pendingLimitMinutes));
      } else {
        localStorage.removeItem(KEY_PENDING_LIMIT);
      }
    } catch {
      // Ignore storage write errors.
    }
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState(prev => normalizeForToday(prev));
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.running || !state.limitEnabled) return;

    const id = window.setInterval(() => {
      setState(prev => {
        const todayState = normalizeForToday(prev);
        if (!todayState.running || !todayState.limitEnabled) return todayState;

        const now = Date.now();
        const elapsed = Math.max(1, Math.floor((now - todayState.lastUpdateMs) / 1000));
        const nextRemaining = Math.max(0, todayState.remainingSeconds - elapsed);

        return {
          ...todayState,
          remainingSeconds: nextRemaining,
          lastUpdateMs: now,
          running: nextRemaining > 0,
          timeUp: nextRemaining <= 0,
        };
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [state.running, state.limitEnabled]);

  const canEnterGameplay = useCallback(() => {
    const current = normalizeForToday(stateRef.current);
    if (!current.limitEnabled) return true;
    if (current.timeUp) return false;
    return current.remainingSeconds > 0;
  }, []);

  const startTimer = useCallback(() => {
    const canStart = canEnterGameplay();

    setState(prev => {
      const todayState = normalizeForToday(prev);
      if (!todayState.limitEnabled) {
        return { ...todayState, running: false, timeUp: false, lastUpdateMs: Date.now() };
      }
      if (!canStart) {
        return { ...todayState, running: false, timeUp: true, lastUpdateMs: Date.now() };
      }
      return { ...todayState, running: true, lastUpdateMs: Date.now() };
    });

    return canStart;
  }, [canEnterGameplay]);

  const resumeTimer = useCallback(() => startTimer(), [startTimer]);

  const pauseTimer = useCallback(() => {
    setState(prev => {
      const todayState = normalizeForToday(prev);
      if (!todayState.running) return todayState;
      return { ...todayState, running: false, lastUpdateMs: Date.now() };
    });
  }, []);

  const stopTimer = useCallback(() => {
    setState(prev => {
      const todayState = normalizeForToday(prev);
      return { ...todayState, running: false, lastUpdateMs: Date.now() };
    });
  }, []);

  const resetTimer = useCallback(() => {
    setState(prev => {
      const todayState = normalizeForToday(prev);
      const appliedLimit = Math.max(1, todayState.pendingLimitMinutes ?? todayState.limitMinutes);
      return {
        ...todayState,
        sessionDate: todayKey(),
        sessionLimitMinutes: appliedLimit,
        pendingLimitMinutes: null,
        remainingSeconds: appliedLimit * 60,
        running: false,
        timeUp: false,
        lastUpdateMs: Date.now(),
      };
    });
  }, []);

  const setPlaytimeLimit = useCallback((minutes: number, enabled: boolean) => {
    const nextMinutes = clampMinutes(minutes);

    setState(prev => {
      const todayState = normalizeForToday(prev);

      if (!enabled) {
        return {
          ...todayState,
          limitEnabled: false,
          limitMinutes: nextMinutes,
          sessionLimitMinutes: nextMinutes,
          pendingLimitMinutes: null,
          remainingSeconds: nextMinutes * 60,
          running: false,
          timeUp: false,
          lastUpdateMs: Date.now(),
        };
      }

      if (todayState.running) {
        return {
          ...todayState,
          limitEnabled: true,
          limitMinutes: nextMinutes,
          pendingLimitMinutes: nextMinutes,
          lastUpdateMs: Date.now(),
        };
      }

      return {
        ...todayState,
        limitEnabled: true,
        limitMinutes: nextMinutes,
        sessionLimitMinutes: nextMinutes,
        pendingLimitMinutes: null,
        remainingSeconds: nextMinutes * 60,
        running: false,
        timeUp: false,
        lastUpdateMs: Date.now(),
      };
    });
  }, []);

  const value = useMemo<GlobalPlayTimerContextValue>(() => ({
    limitEnabled: state.limitEnabled,
    limitMinutes: state.limitMinutes,
    sessionLimitMinutes: state.sessionLimitMinutes,
    pendingLimitMinutes: state.pendingLimitMinutes,
    remainingSeconds: state.remainingSeconds,
    running: state.running,
    isTimeUp: state.limitEnabled && state.timeUp,
    timeUpMessage: TIME_UP_MESSAGE,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setPlaytimeLimit,
    canEnterGameplay,
  }), [
    state.limitEnabled,
    state.limitMinutes,
    state.pendingLimitMinutes,
    state.remainingSeconds,
    state.running,
    state.sessionLimitMinutes,
    state.timeUp,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setPlaytimeLimit,
    canEnterGameplay,
  ]);

  return (
    <GlobalPlayTimerContext.Provider value={value}>
      {children}
    </GlobalPlayTimerContext.Provider>
  );
};

export function useGlobalPlayTimer() {
  const ctx = useContext(GlobalPlayTimerContext);
  if (!ctx) {
    throw new Error('useGlobalPlayTimer must be used inside GlobalPlayTimerProvider');
  }
  return ctx;
}

export function formatTimer(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
