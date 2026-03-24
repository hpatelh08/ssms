/**
 * XPProvider.tsx
 * ─────────────────────────────────────────────────────
 * React context that exposes the XP system to the entire
 * child playground. Wires level-up events to the
 * celebration, mascot, and sound systems.
 *
 * Provider order (outermost → innermost):
 *   SoundProvider → CelebrationProvider → MascotProvider → XPProvider → ChildShell
 *
 * This ordering lets onLevelUp safely call celebrate / triggerMascot / play.
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useXPSystem, type XPState } from './useXPSystem';
import { useCelebrate } from './useCelebrationController';
import { useMascotTrigger } from './useMascotController';
import { useSoundPlay } from './SoundProvider';

/* ── Context shape ──────────────────────────────── */

export interface XPContextValue {
  state: XPState;
  addXP: (amount: number) => boolean;
  justGained: boolean;
}

const XPContext = createContext<XPContextValue>({
  state: { level: 1, xp: 0, xpToNext: 30 },
  addXP: () => false,
  justGained: false,
});

/* ── Provider ───────────────────────────────────── */

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const celebrate  = useCelebrate();
  const triggerMascot = useMascotTrigger();
  const play = useSoundPlay();

  const onLevelUp = useCallback((_newLevel: number) => {
    play('level');
    celebrate('level');
    triggerMascot('celebrate', 2500);
  }, [play, celebrate, triggerMascot]);

  const { state, addXP, justGained } = useXPSystem(onLevelUp);

  const value = useMemo<XPContextValue>(
    () => ({ state, addXP, justGained }),
    [state, addXP, justGained],
  );

  return <XPContext.Provider value={value}>{children}</XPContext.Provider>;
};

/* ── Consumer hooks ─────────────────────────────── */

/** Full XP context — state + addXP + justGained. */
export const useXP = (): XPContextValue => useContext(XPContext);

/** addXP-only shortcut — screens that award XP without reading state. */
export const useAddXP = (): XPContextValue['addXP'] => {
  const { addXP } = useContext(XPContext);
  return addXP;
};
