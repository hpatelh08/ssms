/**
 * garden/WeatherController.tsx
 * ──────────────────────────────────────────────────
 * Manages visual weather effects in the garden:
 *
 *  - Rain: 6-8 CSS-animated drops (transform only, no blur)
 *  - Sun glow: soft overlay
 *  - Sparkle particles: from sun interaction
 *  - Parallax sky layers
 *  - Floating pollen (3-4 particles)
 *
 * All animations use CSS transform & opacity only.
 */

import React from 'react';

/* ── Types ───────────────────────────────────── */

interface WeatherProps {
  /** Rain is active */
  raining: boolean;
  /** Sun is glowing */
  sunActive: boolean;
  /** Rainbow visible */
  showRainbow: boolean;
  /** Sun brightness boost (0-1 extra) */
  skyBrightness: number;
}

/* ── Rain Drops ──────────────────────────────── */

const RAIN_DROPS = [
  { x: 12, delay: 0 },
  { x: 28, delay: 0.12 },
  { x: 44, delay: 0.25 },
  { x: 58, delay: 0.08 },
  { x: 72, delay: 0.3 },
  { x: 86, delay: 0.18 },
  { x: 35, delay: 0.4 },
  { x: 65, delay: 0.05 },
];

const RainEffect: React.FC = React.memo(() => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 15 }}>
    {RAIN_DROPS.map((drop, i) => (
      <div
        key={i}
        className="garden-rain-drop"
        style={{
          position: 'absolute',
          left: `${drop.x}%`,
          top: '-4%',
          width: 2.5,
          height: 18,
          background: 'linear-gradient(180deg, transparent 0%, #bfdbfe 30%, #60a5fa 80%, #3b82f6 100%)',
          borderRadius: 2,
          opacity: 0.6,
          animationDelay: `${drop.delay}s`,
        }}
      />
    ))}
  </div>
));
RainEffect.displayName = 'RainEffect';

/* ── Sun Component ───────────────────────────── */

const Sun: React.FC<{ active: boolean }> = React.memo(({ active }) => (
  <div
    className={`garden-sun-float ${active ? 'garden-sun-active' : ''}`}
    style={{
      position: 'absolute',
      right: '4%',
      top: '2%',
      zIndex: 3,
      pointerEvents: 'none',
      transition: 'transform 0.5s ease',
      transform: active ? 'scale(1.3)' : 'scale(1)',
    }}
  >
    <svg viewBox="0 0 110 110" width="80" height="80">
      {/* Corona glow */}
      <circle cx={55} cy={55} r={52} fill="none" opacity={0.2}>
        <animate attributeName="r" values="48;54;48" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Rotating outer rays */}
      <g className="garden-sun-rays-spin">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={55 + 30 * Math.cos(a)} y1={55 + 30 * Math.sin(a)}
              x2={55 + 46 * Math.cos(a)} y2={55 + 46 * Math.sin(a)}
              stroke="#fbbf24" strokeWidth={3} strokeLinecap="round"
              opacity={active ? 0.85 : 0.3}
              style={{ transition: 'opacity 0.4s ease' }}
            />
          );
        })}
      </g>
      {/* Inner rays - counter spin */}
      <g className="garden-sun-rays-counter">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 + 15) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={55 + 26 * Math.cos(a)} y1={55 + 26 * Math.sin(a)}
              x2={55 + 36 * Math.cos(a)} y2={55 + 36 * Math.sin(a)}
              stroke="#fde047" strokeWidth={1.8} strokeLinecap="round"
              opacity={active ? 0.65 : 0.18}
              style={{ transition: 'opacity 0.4s ease' }}
            />
          );
        })}
      </g>
      {/* Sun body */}
      <defs>
        <radialGradient id="gSunBody" cx="40%" cy="36%">
          <stop offset="0%"  stopColor="#fefce8" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="65%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <circle cx={55} cy={55} r={24} fill="url(#gSunBody)" />
      {/* highlight */}
      <ellipse cx={47} cy={46} rx={10} ry={8} fill="white" opacity={0.22} />
      {/* face */}
      <circle cx={49} cy={53} r={2.2} fill="#92400e" />
      <circle cx={61} cy={53} r={2.2} fill="#92400e" />
      <circle cx={48} cy={52} r={0.7} fill="white" opacity={0.5} />
      <circle cx={60} cy={52} r={0.7} fill="white" opacity={0.5} />
      <path d="M49 61 Q55 67 61 61" fill="none" stroke="#92400e" strokeWidth={2} strokeLinecap="round" />
      {/* cheeks */}
      <circle cx={44} cy={58} r={3} fill="#f97316" opacity={0.12} />
      <circle cx={66} cy={58} r={3} fill="#f97316" opacity={0.12} />
    </svg>
  </div>
));
Sun.displayName = 'Sun';

/* ── Rainbow ─────────────────────────────────── */

const Rainbow: React.FC = React.memo(() => (
  <div className="garden-rainbow-enter" style={{
    position: 'absolute', top: '4%', right: '3%',
    width: '42%', maxWidth: 300, height: '35%',
    pointerEvents: 'none', zIndex: 2,
  }}>
    <svg viewBox="0 0 200 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      {['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#6366f1','#8b5cf6'].map((c, i) => {
        const r = 85 - i * 6;
        return (
          <path key={i}
            d={`M${100 - r} 98 A${r} ${r * 0.7} 0 0 1 ${100 + r} 98`}
            fill="none" stroke={c} strokeWidth={5.5} strokeLinecap="round"
            opacity={0.6}
          />
        );
      })}
    </svg>
    {/* Shimmer sweep */}
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="garden-shimmer-sweep" />
    </div>
  </div>
));
Rainbow.displayName = 'Rainbow';

/* ── Floating Pollen (3-4 particles) ─────────── */

const POLLEN = [
  { x: '18%', y: '22%', dur: '18s', del: '0s' },
  { x: '65%', y: '15%', dur: '22s', del: '4s' },
  { x: '42%', y: '30%', dur: '20s', del: '8s' },
  { x: '80%', y: '25%', dur: '24s', del: '12s' },
];

const FloatingPollen: React.FC = React.memo(() => (
  <>
    {POLLEN.map((p, i) => (
      <div
        key={i}
        className="garden-pollen-float"
        style={{
          position: 'absolute', left: p.x, top: p.y,
          width: 3, height: 3, borderRadius: '50%',
          background: 'rgba(255,255,240,0.7)',
          animationDuration: p.dur, animationDelay: p.del,
          pointerEvents: 'none', zIndex: 2,
        }}
      />
    ))}
  </>
));
FloatingPollen.displayName = 'FloatingPollen';

/* ── Parallax Clouds ─────────────────────────── */

const CLOUDS = [
  { top: '6%',  w: 100, h: 36, op: 0.55, dur: '42s', del: '0s' },
  { top: '14%', w: 70,  h: 26, op: 0.4,  dur: '56s', del: '15s' },
  { top: '3%',  w: 55,  h: 20, op: 0.32, dur: '48s', del: '8s' },
];

const ParallaxClouds: React.FC = React.memo(() => (
  <>
    {CLOUDS.map((c, i) => (
      <div
        key={i}
        className="garden-cloud-drift"
        style={{
          position: 'absolute', top: c.top,
          width: c.w, height: c.h, borderRadius: 50,
          background: `radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.85), rgba(255,255,255,${c.op}) 70%)`,
          opacity: c.op, pointerEvents: 'none', zIndex: 2,
          animationDuration: c.dur, animationDelay: c.del,
        }}
      />
    ))}
  </>
));
ParallaxClouds.displayName = 'ParallaxClouds';

/* ── Main Weather Controller ─────────────────── */

export const WeatherController: React.FC<WeatherProps> = React.memo(({
  raining, sunActive, showRainbow, skyBrightness,
}) => (
  <>
    {/* Sky gradient — slightly brighter, more depth */}
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 30, zIndex: 0,
      background: 'linear-gradient(to top, #dff0ff 0%, #e9f6ff 30%, #f2f9ff 60%, #ffffff 100%)',
      transition: 'opacity 0.5s ease',
    }} />

    {/* Sun brightness overlay */}
    {skyBrightness > 0 && (
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 30, zIndex: 1,
        background: 'radial-gradient(circle at 85% 12%, rgba(255,245,200,0.5), transparent 55%)',
        opacity: Math.min(skyBrightness, 0.6),
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
      }} />
    )}

    {/* Parallax clouds */}
    <ParallaxClouds />

    {/* Floating pollen */}
    <FloatingPollen />

    {/* Sun */}
    <Sun active={sunActive} />

    {/* Sun glow pulse ring (opacity only, perf-safe) */}
    {sunActive && (
      <div style={{
        position: 'absolute', right: '2%', top: '0%',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,240,180,0.35), transparent 70%)',
        pointerEvents: 'none', zIndex: 2,
        animation: 'gardenSunGlowPulseAmbient 2.5s ease-in-out infinite',
      }} />
    )}

    {/* Rainbow */}
    {showRainbow && <Rainbow />}

    {/* Rain */}
    {raining && <RainEffect />}
  </>
));

WeatherController.displayName = 'WeatherController';

/* ── CSS ─────────────────────────────────────── */

export const WEATHER_CSS = `
/* Rain drops */
@keyframes gardenRainFall {
  0%   { transform: translateY(-20px); opacity: 0; }
  12%  { opacity: 0.7; }
  100% { transform: translateY(100vh); opacity: 0; }
}
.garden-rain-drop {
  animation: gardenRainFall 0.85s linear infinite;
  will-change: transform, opacity;
}

/* Sun float */
@keyframes gardenSunFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.garden-sun-float {
  animation: gardenSunFloat 5s ease-in-out infinite;
}
.garden-sun-active {
  animation: gardenSunFloat 3s ease-in-out infinite;
}

/* Sun rays rotation */
.garden-sun-rays-spin {
  animation: gardenSpin 30s linear infinite;
  transform-origin: 55px 55px;
}
.garden-sun-rays-counter {
  animation: gardenSpin 18s linear infinite reverse;
  transform-origin: 55px 55px;
}
@keyframes gardenSpin {
  to { transform: rotate(360deg); }
}

/* Rainbow entrance */
@keyframes gardenRainbowFade {
  0%   { opacity: 0; transform: scale(0.7) translateY(20px); }
  60%  { opacity: 0.9; transform: scale(1.03) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.garden-rainbow-enter {
  animation: gardenRainbowFade 1.2s cubic-bezier(0.34,1.56,0.64,1) both;
}

/* Shimmer sweep on rainbow */
@keyframes gardenShimmerSweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
.garden-shimmer-sweep {
  position: absolute; top: 0; left: 0;
  width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,240,0.4), transparent);
  animation: gardenShimmerSweep 3.5s ease-in-out infinite;
  will-change: transform;
}

/* Cloud drift */
@keyframes gardenCloudDrift {
  0%   { transform: translateX(-30%); }
  100% { transform: translateX(calc(100vw + 50%)); }
}
.garden-cloud-drift {
  animation: gardenCloudDrift linear infinite;
  will-change: transform;
}

/* Pollen float */
@keyframes gardenPollenFloat {
  0%   { transform: translate(0, 0) scale(1); opacity: 0; }
  15%  { opacity: 0.6; }
  50%  { transform: translate(30px, -18px) scale(1.2); opacity: 0.45; }
  85%  { opacity: 0.5; }
  100% { transform: translate(55px, 8px) scale(0.8); opacity: 0; }
}
.garden-pollen-float {
  animation: gardenPollenFloat ease-in-out infinite;
  will-change: transform, opacity;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .garden-rain-drop, .garden-sun-float, .garden-sun-active,
  .garden-sun-rays-spin, .garden-sun-rays-counter,
  .garden-rainbow-enter, .garden-shimmer-sweep,
  .garden-cloud-drift, .garden-pollen-float {
    animation: none !important;
  }
}

/* Sun glow pulse ambient (opacity only) */
@keyframes gardenSunGlowPulseAmbient {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.8; }
}
`;
