/**
 * garden/WeatherController.tsx
 * ──────────────────────────────────────────────────
 * Manages visual weather effects in the garden:
 *
 *  - Rain: 12 CSS-animated drops
 *  - Sun glow: soft overlay with face
 *  - Sparkle particles: from sun interaction
 *  - Parallax sky layers with depth
 *  - Floating pollen (4 particles)
 *  - Fireflies (8 glowing particles)
 *  - Shooting stars (occasional)
 *  - Falling leaves (seasonal ambiance)
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
  /** Magic mode active — extra particles */
  magicMode?: boolean;
}

/* ── Rain Drops ──────────────────────────────── */

const RAIN_DROPS = [
  { x: 8,  delay: 0 },
  { x: 16, delay: 0.15 },
  { x: 24, delay: 0.08 },
  { x: 32, delay: 0.28 },
  { x: 40, delay: 0.12 },
  { x: 48, delay: 0.35 },
  { x: 56, delay: 0.05 },
  { x: 64, delay: 0.22 },
  { x: 72, delay: 0.18 },
  { x: 80, delay: 0.32 },
  { x: 88, delay: 0.1 },
  { x: 95, delay: 0.25 },
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
  { top: '4%',  w: 110, h: 40, op: 0.55, dur: '42s', del: '0s' },
  { top: '12%', w: 75,  h: 28, op: 0.4,  dur: '56s', del: '15s' },
  { top: '2%',  w: 60,  h: 22, op: 0.32, dur: '48s', del: '8s' },
  { top: '8%',  w: 90,  h: 32, op: 0.35, dur: '62s', del: '24s' },
  { top: '16%', w: 50,  h: 18, op: 0.25, dur: '52s', del: '32s' },
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

/* ── Fireflies (ambient glow particles) ──────── */

const FIREFLIES = [
  { x: '15%', y: '45%', dur: '6s',  del: '0s',   size: 5 },
  { x: '72%', y: '38%', dur: '8s',  del: '2s',   size: 4 },
  { x: '35%', y: '52%', dur: '7s',  del: '3.5s', size: 6 },
  { x: '82%', y: '48%', dur: '9s',  del: '1s',   size: 4 },
  { x: '48%', y: '55%', dur: '6.5s', del: '4s',  size: 5 },
  { x: '25%', y: '42%', dur: '7.5s', del: '5s',  size: 3 },
  { x: '62%', y: '50%', dur: '8.5s', del: '2.5s', size: 5 },
  { x: '90%', y: '44%', dur: '7s',  del: '6s',   size: 4 },
];

const Fireflies: React.FC = React.memo(() => (
  <>
    {FIREFLIES.map((f, i) => (
      <div
        key={`ff-${i}`}
        className="garden-firefly"
        style={{
          position: 'absolute', left: f.x, top: f.y,
          width: f.size, height: f.size, borderRadius: '50%',
          background: 'radial-gradient(circle, #fde047 30%, rgba(253,224,71,0.4) 70%, transparent)',
          animationDuration: f.dur, animationDelay: f.del,
          pointerEvents: 'none', zIndex: 7,
        }}
      />
    ))}
  </>
));
Fireflies.displayName = 'Fireflies';

/* ── Shooting Stars (occasional) ─────────────── */

const SHOOTING_STARS = [
  { x: '20%', y: '8%',  dur: '3s',  del: '0s' },
  { x: '65%', y: '5%',  dur: '2.5s', del: '8s' },
  { x: '40%', y: '12%', dur: '3.5s', del: '16s' },
];

const ShootingStars: React.FC = React.memo(() => (
  <>
    {SHOOTING_STARS.map((s, i) => (
      <div
        key={`ss-${i}`}
        className="garden-shooting-star"
        style={{
          position: 'absolute', left: s.x, top: s.y,
          width: 3, height: 3, borderRadius: '50%',
          background: 'white',
          animationDuration: s.dur, animationDelay: s.del,
          pointerEvents: 'none', zIndex: 3,
        }}
      />
    ))}
  </>
));
ShootingStars.displayName = 'ShootingStars';

/* ── Falling Leaves (seasonal ambiance) ──────── */

const FALLING_LEAVES = [
  { x: '10%', emoji: '\uD83C\uDF42', dur: '12s', del: '0s',   size: 16 },
  { x: '30%', emoji: '\uD83C\uDF41', dur: '15s', del: '4s',   size: 14 },
  { x: '55%', emoji: '\uD83C\uDF43', dur: '13s', del: '7s',   size: 12 },
  { x: '75%', emoji: '\uD83C\uDF42', dur: '14s', del: '2s',   size: 15 },
  { x: '90%', emoji: '\uD83C\uDF41', dur: '16s', del: '10s',  size: 13 },
];

const FallingLeaves: React.FC = React.memo(() => (
  <>
    {FALLING_LEAVES.map((l, i) => (
      <span
        key={`fl-${i}`}
        className="garden-falling-leaf"
        style={{
          position: 'absolute', left: l.x, top: '-5%',
          fontSize: l.size, pointerEvents: 'none', zIndex: 3,
          animationDuration: l.dur, animationDelay: l.del,
        }}
      >
        {l.emoji}
      </span>
    ))}
  </>
));
FallingLeaves.displayName = 'FallingLeaves';

/* ── Main Weather Controller ─────────────────── */

export const WeatherController: React.FC<WeatherProps> = React.memo(({
  raining, sunActive, showRainbow, skyBrightness, magicMode = false,
}) => (
  <>
    {/* Sky gradient — richer depth with subtle blue */}
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 30, zIndex: 0,
      background: 'linear-gradient(to top, #d4f0ff 0%, #e2f4ff 25%, #edf8ff 50%, #f5fbff 75%, #ffffff 100%)',
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

    {/* Fireflies */}
    <Fireflies />

    {/* Shooting stars */}
    <ShootingStars />

    {/* Falling leaves */}
    <FallingLeaves />

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

    {/* Magic particles when magic mode */}
    {magicMode && (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12, overflow: 'hidden' }}>
        {Array.from({ length: 15 }, (_, i) => (
          <span
            key={`magic-${i}`}
            className="garden-magic-particle"
            style={{
              position: 'absolute',
              left: `${8 + Math.random() * 84}%`,
              top: `${5 + Math.random() * 60}%`,
              fontSize: 10 + Math.random() * 14,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {['\u2728', '\u2B50', '\uD83D\uDCAB', '\u2764\uFE0F', '\uD83C\uDF1F'][i % 5]}
          </span>
        ))}
      </div>
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

/* Firefly glow */
@keyframes gardenFirefly {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.5); }
  20%  { opacity: 0.9; transform: translate(8px, -5px) scale(1.2); }
  40%  { opacity: 0.3; transform: translate(-4px, -12px) scale(0.8); }
  60%  { opacity: 0.95; transform: translate(12px, 3px) scale(1.1); }
  80%  { opacity: 0.4; transform: translate(-6px, -8px) scale(0.9); }
  100% { opacity: 0; transform: translate(0, 0) scale(0.5); }
}
.garden-firefly {
  animation: gardenFirefly ease-in-out infinite;
  will-change: transform, opacity;
}

/* Shooting star */
@keyframes gardenShootingStar {
  0%   { opacity: 0; transform: translate(0, 0) rotate(-35deg); }
  10%  { opacity: 1; }
  30%  { opacity: 1; transform: translate(120px, 50px) rotate(-35deg); }
  35%  { opacity: 0; transform: translate(160px, 65px) rotate(-35deg); }
  100% { opacity: 0; transform: translate(160px, 65px) rotate(-35deg); }
}
.garden-shooting-star {
  animation: gardenShootingStar ease-out infinite;
  will-change: transform, opacity;
  box-shadow: 0 0 4px white, -12px 0 6px rgba(255,255,255,0.3), -24px 0 3px rgba(255,255,255,0.1);
}

/* Falling leaves */
@keyframes gardenFallingLeaf {
  0%   { transform: translateY(0) rotate(0deg) translateX(0); opacity: 0; }
  10%  { opacity: 0.7; }
  25%  { transform: translateY(25vh) rotate(45deg) translateX(20px); }
  50%  { transform: translateY(50vh) rotate(-30deg) translateX(-15px); opacity: 0.6; }
  75%  { transform: translateY(75vh) rotate(60deg) translateX(25px); }
  90%  { opacity: 0.3; }
  100% { transform: translateY(100vh) rotate(90deg) translateX(10px); opacity: 0; }
}
.garden-falling-leaf {
  animation: gardenFallingLeaf ease-in-out infinite;
  will-change: transform, opacity;
  display: inline-block;
}

/* Magic particles float */
@keyframes gardenMagicParticle {
  0%   { opacity: 0; transform: translateY(0) scale(0); }
  30%  { opacity: 1; transform: translateY(-15px) scale(1.2); }
  60%  { opacity: 0.7; transform: translateY(-30px) scale(0.9); }
  100% { opacity: 0; transform: translateY(-50px) scale(0.3); }
}
.garden-magic-particle {
  animation: gardenMagicParticle ease-out infinite;
  will-change: transform, opacity;
  display: inline-block;
  pointer-events: none;
}
`;
