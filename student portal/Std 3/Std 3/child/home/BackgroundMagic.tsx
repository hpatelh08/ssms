/**
 * child/home/BackgroundMagic.tsx
 * ─────────────────────────────────────────────────────
 * Animated background layer for the student home dashboard.
 *
 * Renders behind all content, creates a living magical world:
 *  • Soft rainbow gradient overlay
 *  • Floating pastel clouds drifting slowly
 *  • Tiny twinkling stars blinking randomly
 *  • Occasional floating butterfly SVG
 *
 * Performance: Pure CSS keyframes, no canvas, no heavy libs.
 * All elements use will-change + transform-only animations.
 * Reduced set on mobile via CSS media query.
 */

import React from 'react';

/* ── Butterfly SVG (inline, pure CSS animated) ───── */

const ButterflySVG: React.FC<{ color1: string; color2: string; className?: string }> = React.memo(
  ({ color1, color2, className }) => (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(15,15)">
        <ellipse cx="-6" cy="-3" rx="6" ry="8" fill={color1} opacity="0.7">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 -6 -3;-25 -6 -3;0 -6 -3"
            dur="0.4s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="6" cy="-3" rx="6" ry="8" fill={color2} opacity="0.7">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 6 -3;25 6 -3;0 6 -3"
            dur="0.4s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="0" cy="2" rx="1.2" ry="5" fill="#7c6b8a" opacity="0.5" />
      </g>
    </svg>
  ),
);
ButterflySVG.displayName = 'ButterflySVG';

/* ── Cloud shapes ────────────────────────────────── */

const CLOUDS = [
  { w: 130, top: '6%',  delay: '0s',    dur: '28s', opacity: 0.25 },
  { w: 100, top: '18%', delay: '-10s',  dur: '35s', opacity: 0.2 },
  { w: 90,  top: '35%', delay: '-18s',  dur: '32s', opacity: 0.15 },
  { w: 110, top: '55%', delay: '-5s',   dur: '30s', opacity: 0.18 },
  { w: 80,  top: '72%', delay: '-22s',  dur: '38s', opacity: 0.14 },
];

/* ── Twinkling stars ─────────────────────────────── */

const STARS = [
  { top: '5%',  left: '12%', size: 3, delay: '0s' },
  { top: '15%', left: '78%', size: 2.5, delay: '1.2s' },
  { top: '28%', left: '45%', size: 2, delay: '0.5s' },
  { top: '42%', left: '8%',  size: 3, delay: '2.1s' },
  { top: '38%', left: '88%', size: 2.5, delay: '0.8s' },
  { top: '58%', left: '62%', size: 2, delay: '1.8s' },
  { top: '68%', left: '25%', size: 3, delay: '0.3s' },
  { top: '75%', left: '72%', size: 2.5, delay: '1.5s' },
  { top: '82%', left: '40%', size: 2, delay: '2.4s' },
  { top: '90%', left: '15%', size: 3, delay: '0.7s' },
  { top: '12%', left: '35%', size: 2, delay: '1.0s' },
  { top: '50%', left: '52%', size: 2.5, delay: '2.8s' },
];

/* ── Butterflies ─────────────────────────────────── */

const BUTTERFLIES = [
  { top: '20%', delay: '-2s',  dur: '18s', color1: '#f9a8d4', color2: '#c4b5fd' },
  { top: '55%', delay: '-8s',  dur: '22s', color1: '#93c5fd', color2: '#fde68a' },
  { top: '78%', delay: '-14s', dur: '20s', color1: '#a7f3d0', color2: '#fca5a5' },
];

/* ── Main Component ──────────────────────────────── */

export const BackgroundMagic: React.FC = React.memo(() => (
  <div
    className="bg-magic-layer"
    aria-hidden="true"
  >
    {/* Layered radial depth background */}
    <div style={{
      position: 'absolute', inset: 0,
      background: [
        'radial-gradient(circle at 10% 20%, #f2f5ff, transparent 40%)',
        'radial-gradient(circle at 90% 80%, #e9fff5, transparent 40%)',
        'linear-gradient(#ffffff, #f9faff)',
      ].join(', '),
      pointerEvents: 'none',
    }} />

    {/* Soft rainbow gradient overlay */}
    <div className="bg-magic-rainbow" />

    {/* 3 Floating micro icons (subtle) */}
    <div className="bg-micro-icon" style={{ top: '12%', left: '8%', animationDelay: '0s' }}>
      <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 7.5,4 12,4.5 8.5,7.5 9.5,12 6,9.5 2.5,12 3.5,7.5 0,4.5 4.5,4" fill="#c8b8ff" opacity="0.5"/></svg>
    </div>
    <div className="bg-micro-icon" style={{ top: '45%', right: '6%', animationDelay: '1.5s' }}>
      <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#b8e8ff" opacity="0.4"/></svg>
    </div>
    <div className="bg-micro-icon" style={{ bottom: '18%', left: '20%', animationDelay: '3s' }}>
      <svg width="11" height="11" viewBox="0 0 12 12"><polygon points="6,0 7.5,4 12,4.5 8.5,7.5 9.5,12 6,9.5 2.5,12 3.5,7.5 0,4.5 4.5,4" fill="#ffd6e8" opacity="0.45"/></svg>
    </div>

    {/* Floating pastel clouds */}
    {CLOUDS.map((c, i) => (
      <div
        key={`cloud-${i}`}
        className="bg-magic-cloud"
        style={{
          top: c.top,
          animationDuration: c.dur,
          animationDelay: c.delay,
          opacity: c.opacity,
        }}
      >
        <svg width={c.w} height={c.w * 0.45} viewBox="0 0 120 54" fill="none">
          <ellipse cx="60" cy="36" rx="50" ry="16" fill="rgba(255,255,255,0.6)" />
          <ellipse cx="40" cy="26" rx="28" ry="20" fill="rgba(255,255,255,0.5)" />
          <ellipse cx="72" cy="24" rx="26" ry="18" fill="rgba(255,255,255,0.55)" />
          <ellipse cx="55" cy="18" rx="20" ry="16" fill="rgba(255,255,255,0.45)" />
        </svg>
      </div>
    ))}

    {/* Twinkling stars */}
    {STARS.map((s, i) => (
      <div
        key={`star-${i}`}
        className="bg-magic-twinkle"
        style={{
          top: s.top,
          left: s.left,
          width: s.size,
          height: s.size,
          animationDelay: s.delay,
        }}
      />
    ))}

    {/* Floating butterflies */}
    {BUTTERFLIES.map((b, i) => (
      <div
        key={`bfly-${i}`}
        className="bg-magic-butterfly"
        style={{
          top: b.top,
          animationDuration: b.dur,
          animationDelay: b.delay,
        }}
      >
        <ButterflySVG color1={b.color1} color2={b.color2} />
      </div>
    ))}
  </div>
));

BackgroundMagic.displayName = 'BackgroundMagic';
