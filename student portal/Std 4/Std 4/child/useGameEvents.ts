/**
 * 🎮 useGameEvents
 * ────────────────────────────────────────────
 * Standardized game-event handlers that wire into
 * every child system (Sound, Mascot, Celebration, XP).
 *
 * Every callback is stable (useCallback) so passing
 * them as props will not trigger re-renders.
 *
 * Usage:
 *   const { handleCorrect, handleWrong, handleGameWin } = useGameEvents();
 */

import { useCallback } from 'react';
import { useSoundPlay } from './SoundProvider';
import { useMascotTrigger } from './useMascotController';
import { useCelebrate } from './useCelebrationController';
import { useAddXP } from './XPProvider';

export interface GameEventHandlers {
  /** Correct answer — correct sound + happy mascot */
  handleCorrect: () => void;
  /** Wrong answer — wrong sound + encourage mascot */
  handleWrong: () => void;
  /** Full game win — celebrate sound + celebrate mascot + confetti + XP */
  handleGameWin: (xp: number) => void;
  /** Thinking state — click sound + thinking mascot */
  handleThinking: () => void;
  /** Click sound only — call before any state change */
  handleClick: () => void;
}

export function useGameEvents(): GameEventHandlers {
  const play = useSoundPlay();
  const triggerMascot = useMascotTrigger();
  const celebrate = useCelebrate();
  const addXP = useAddXP();

  const handleCorrect = useCallback(() => {
    play('correct');
    triggerMascot('happy');
  }, [play, triggerMascot]);

  const handleWrong = useCallback(() => {
    play('wrong');
    triggerMascot('encourage');
  }, [play, triggerMascot]);

  const handleGameWin = useCallback(
    (xp: number) => {
      // Sound is now played directly in GameShell on mini-level completion
      triggerMascot('celebrate', 2500);
      celebrate('confetti');
      if (xp > 0) addXP(xp);
    },
    [triggerMascot, celebrate, addXP],
  );

  const handleThinking = useCallback(() => {
    play('click');
    triggerMascot('thinking', 2000);
  }, [play, triggerMascot]);

  const handleClick = useCallback(() => {
    play('click');
  }, [play]);

  return { handleCorrect, handleWrong, handleGameWin, handleThinking, handleClick };
}
