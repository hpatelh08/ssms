/**
 * SoundProvider.tsx
 * ─────────────────────────────────────────────────────
 * React context wrapper — delegates ALL audio to the global
 * SoundManager singleton (no React hooks own the Audio objects).
 *
 * Usage:
 *   <SoundProvider>
 *     <CelebrationProvider>
 *       <MascotProvider>
 *         <ChildShell />
 *       </MascotProvider>
 *     </CelebrationProvider>
 *   </SoundProvider>
 *
 * Consuming:
 *   const { play, toggleMute, muted } = useSound();
 *   const play = useSoundPlay();       // play-only shortcut
 *
 * Or bypass React entirely:
 *   import { soundManager } from './SoundManager';
 *   soundManager.play('correct');
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { soundManager, type SoundType } from './SoundManager';

/* ── Context shape ──────────────────────────────── */

export interface SoundContextValue {
  play: (type: SoundType) => void;
  toggleMute: () => void;
  muted: boolean;
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
  toggleMute: () => {},
  muted: false,
});

/* ── Provider ───────────────────────────────────── */

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('child_sound_muted') === '1'; }
    catch { return false; }
  });

  // Sync initial muted state to the singleton
  if (soundManager.muted !== muted) soundManager.setMuted(muted);

  /** Delegate play directly to the singleton. */
  const play = useCallback((type: SoundType) => {
    soundManager.play(type);
  }, []);

  /** Flip muted state — singleton handles the actual audio. */
  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  }, []);

  const value = useMemo<SoundContextValue>(
    () => ({ play, toggleMute, muted }),
    [play, toggleMute, muted],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

/* ── Consumer hooks ─────────────────────────────── */

/** Full context — muted state + play + toggle */
export const useSound = (): SoundContextValue => useContext(SoundContext);

/** Play-only shortcut (no re-render on mute change) */
export const useSoundPlay = (): SoundContextValue['play'] => {
  const { play } = useContext(SoundContext);
  return play;
};

/* Re-export the type so consumers don't need a second import */
export type { SoundType } from './SoundManager';
