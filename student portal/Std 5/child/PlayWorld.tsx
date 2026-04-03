import React, { Suspense, useEffect } from 'react';
import { useGameEvents } from './useGameEvents';
import { useGlobalPlayTimer } from './GlobalTimerContext';

/* ── Lazy-load the unified game page (heavy) ─────────── */
const GameCenter = React.lazy(() =>
  import('../games/GamesPage').then(m => ({ default: m.GameCenter })),
);

/** Spinner while the game chunk loads. */
const GameFallback: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '48px 0', color: '#a7c97f', fontSize: '14px' }}>
    Loading games…
  </div>
);

/**
 * PlayWorld — the student-facing game screen.
 * Wires GameCenter into every child system via useGameEvents.
 */

export const PlayWorld: React.FC = React.memo(() => {
  const { handleGameWin, handleCorrect, handleWrong, handleClick } = useGameEvents();
  const { exitGame } = useGlobalPlayTimer();

  useEffect(() => {
    return () => {
      exitGame();
    };
  }, [exitGame]);

  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', minHeight: '60vh' }}>
      <Suspense fallback={<GameFallback />}>
        <GameCenter
          onGameWin={handleGameWin}
          onCorrectAnswer={handleCorrect}
          onWrongAnswer={handleWrong}
          onClickSound={handleClick}
        />
      </Suspense>
    </div>
  );
});

PlayWorld.displayName = 'PlayWorld';
