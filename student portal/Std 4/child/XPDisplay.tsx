/**
 * XPDisplay.tsx
 * ─────────────────────────────────────────────────────
 * Compact circular progress ring with a star icon.
 *
 * Visual behaviour:
 *  • Ring fills smoothly via CSS transition on stroke-dashoffset
 *  • Brief glow pulse on every XP gain (justGained flag)
 *  • Level number shown below star
 *  • No raw XP numbers — child sees ring + star only
 */

import React, { useMemo } from 'react';
import { useXP } from './XPProvider';

/* ── SVG geometry (static, computed once at module level) ── */

const SIZE   = 42;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;
const VIEWBOX = `0 0 ${SIZE} ${SIZE}`;
const ROTATE = `rotate(-90 ${CENTER} ${CENTER})`;

const XPDisplay: React.FC = () => {
  const { state, justGained } = useXP();

  const pct = useMemo(
    () => Math.min(state.xp / state.xpToNext, 1),
    [state.xp, state.xpToNext],
  );

  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const wrapClass =
    'xp-display' +
    (justGained ? ' xp-display--glow' : '');

  return (
    <div className={wrapClass} aria-label={`Level ${state.level}`}>
      <svg className="xp-ring" width={SIZE} height={SIZE} viewBox={VIEWBOX}>
        <circle
          className="xp-ring__track"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className="xp-ring__fill"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={ROTATE}
        />
      </svg>
      <div className="xp-display__center">
        <span className="xp-display__star">⭐</span>
        <span className="xp-display__level">{state.level}</span>
      </div>
    </div>
  );
};

export default React.memo(XPDisplay);
