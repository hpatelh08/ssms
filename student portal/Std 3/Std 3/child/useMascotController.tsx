import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

/* ── Types ──────────────────────────────────────── */

export type MascotState = 'idle' | 'happy' | 'excited' | 'celebrate' | 'laugh' | 'thinking' | 'encourage';

export interface MascotContextType {
  state: MascotState;
  trigger: (next: MascotState, duration?: number) => void;
}

/* ── Context ────────────────────────────────────── */

const MascotContext = createContext<MascotContextType>({
  state: 'idle',
  trigger: () => {},
});

/* ── Provider ───────────────────────────────────── */

export const MascotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MascotState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback((next: MascotState, duration = 1500) => {
    // Clear any pending revert
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setState(next);

    // If already idle, nothing to revert
    if (next === 'idle') return;

    timerRef.current = setTimeout(() => {
      setState('idle');
      timerRef.current = null;
    }, duration);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Stable value ref — only re-creates when state changes
  const value = React.useMemo<MascotContextType>(
    () => ({ state, trigger }),
    [state, trigger],
  );

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>;
};

/* ── Hook ───────────────────────────────────────── */

/** Full context — state + trigger */
export const useMascot = (): MascotContextType => useContext(MascotContext);

/**
 * Trigger-only hook — components that fire reactions but don't
 * read the mascot state can use this to avoid re-renders when
 * the mascot state changes. The trigger function is stable (useCallback).
 */
export const useMascotTrigger = (): MascotContextType['trigger'] => {
  const { trigger } = useContext(MascotContext);
  return trigger;
};
