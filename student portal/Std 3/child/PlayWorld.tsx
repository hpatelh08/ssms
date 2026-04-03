import React, { Suspense } from 'react';
import { useGameEvents } from './useGameEvents';

/* ── Lazy-load the unified game page (heavy) ─────────── */
const GameCenter = React.lazy(() =>
  import('../games/GamesPage').then(m => ({ default: m.GameCenter })),
);

/** Spinner while the game chunk loads. */
const GameFallback: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '48px 0', color: '#a78bfa', fontSize: '14px' }}>
    Loading games…
  </div>
);

/**
 * PlayWorld — the student-facing game screen.
 * Wires GameCenter into every child system via useGameEvents.
 */

export const PlayWorld: React.FC = React.memo(() => {
  const { handleGameWin, handleCorrect, handleWrong, handleClick } = useGameEvents();

  return (
    <div>
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
