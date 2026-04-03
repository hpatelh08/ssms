import React, { createContext, useContext, useCallback, useRef, useState, useMemo } from 'react';

/* ── Types ──────────────────────────────────────── */

export type CelebrationType = 'confetti' | 'level';

export interface CelebrationContextType {
  active: boolean;
  type: CelebrationType;
  celebrate: (kind?: CelebrationType) => void;
}

/* ── Context ────────────────────────────────────── */

const CelebrationContext = createContext<CelebrationContextType>({
  active: false,
  type: 'confetti',
  celebrate: () => {},
});

/* ── Provider ───────────────────────────────────── */

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [type, setType] = useState<CelebrationType>('confetti');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback((kind: CelebrationType = 'confetti') => {
    // Clear any running celebration
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setType(kind);
    setActive(true);

    timerRef.current = setTimeout(() => {
      setActive(false);
      timerRef.current = null;
    }, 2500);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo<CelebrationContextType>(
    () => ({ active, type, celebrate }),
    [active, type, celebrate],
  );

  return <CelebrationContext.Provider value={value}>{children}</CelebrationContext.Provider>;
};

/* ── Hooks ──────────────────────────────────────── */

/** Full context — overlay reads active + type */
export const useCelebration = (): CelebrationContextType => useContext(CelebrationContext);

/** Trigger-only — screens call celebrate() without re-rendering on active change */
export const useCelebrate = (): CelebrationContextType['celebrate'] => {
  const { celebrate } = useContext(CelebrationContext);
  return celebrate;
};
