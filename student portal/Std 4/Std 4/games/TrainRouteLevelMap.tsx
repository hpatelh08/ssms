import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty } from './engine/questionGenerator';
import { DIFF_META, DEV_UNLOCK_ALL } from './DifficultySelector';

type LevelStatus = 'completed' | 'current' | 'available' | 'locked';

type LevelItem = {
  id: string;
  number: number;
  status: LevelStatus;
  stars?: number; // 1-3, only set when completed
};

interface Props {
  difficulty: Difficulty;
  levels: LevelItem[];
  onSelectLevel: (level: number) => void;
}

const TR_STYLE_ID = 'tr-level-map-css-v3';
if (typeof document !== 'undefined' && !document.getElementById(TR_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = TR_STYLE_ID;
  s.textContent = `
    .tr-card { --tr-node: clamp(72px, 9vw, 100px); --tr-glow: rgba(99,102,241,0.28); }
    .tr-card *, .tr-card { min-width: 0; }
    /* Scrollable viewport — NO background here, just the scroll container */
    .tr-viewport { width: 100%; height: min(72vh, 760px); overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; padding: 0; box-sizing: border-box; }
    /* Full-map inner div — background applied via inline style (size = map height) */
    .tr-map {
      position: relative;
      width: 100%;
    }
    .tr-decor { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .tr-edge { position: absolute; pointer-events: none; opacity: 0.55; filter: blur(0.15px); }
    .tr-edge--soft { opacity: 0.42; }

    /* Ocean div hidden — background is now on .tr-map */
    .tr-ocean {
      display: none;
    }
    .tr-caustics { display: none; }
    .tr-seafloor { display: none; }

    /* Underwater decor items */
    .tr-uitem {
      position: absolute;
      pointer-events: none;
      user-select: none;
      opacity: 0.78;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,0.05));
      transform: translateZ(0);
    }
    .tr-sign { display: none !important; }

    @keyframes tr-bubble-rise {
      0% { transform: translateY(18px); opacity: 0; }
      12% { opacity: 0.55; }
      100% { transform: translateY(-140px); opacity: 0; }
    }
    @keyframes tr-fish-swim-r {
      0%,100% { transform: translateX(0) translateY(0); }
      50% { transform: translateX(120px) translateY(-8px); }
    }
    @keyframes tr-fish-swim-l {
      0%,100% { transform: translateX(0) translateY(0); }
      50% { transform: translateX(-120px) translateY(10px); }
    }
    @keyframes tr-seaweed-wave {
      0%,100% { transform: rotate(-1.5deg); }
      50% { transform: rotate(2.2deg); }
    }
    @keyframes tr-particle-drift {
      0%,100% { transform: translateX(0) translateY(0); opacity: 0.18; }
      50% { transform: translateX(14px) translateY(-10px); opacity: 0.32; }
    }

    .tr-anim-bubble { animation: tr-bubble-rise linear infinite; }
    .tr-anim-fish-r { animation: tr-fish-swim-r ease-in-out infinite; }
    .tr-anim-fish-l { animation: tr-fish-swim-l ease-in-out infinite; }
    .tr-anim-weed { transform-origin: 50% 100%; animation: tr-seaweed-wave 5.8s ease-in-out infinite; }
    .tr-anim-particle { animation: tr-particle-drift 8.5s ease-in-out infinite; }

    @keyframes tr-pulse {
      0%,100% { box-shadow: 0 0 0 0 var(--tr-glow), 0 10px 26px rgba(0,0,0,0.10); }
      50% { box-shadow: 0 0 0 12px rgba(0,0,0,0), 0 14px 34px rgba(0,0,0,0.12); }
    }
    @keyframes tr-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

    .tr-node {
      position: absolute;
      width: var(--tr-node);
      height: var(--tr-node);
      transform: translate(-50%, -50%);
      display: grid;
      place-items: center;
    }

    .tr-stack { position: relative; width: var(--tr-node); height: var(--tr-node); }

    /* Image-based level button */
    .tr-btn {
      position: relative;
      width: 100%; height: 100%;
      border: 0 !important;
      padding: 0;
      background: transparent !important;
      box-shadow: none !important;
      cursor: pointer;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform 200ms cubic-bezier(.34, 1.56, .64, 1);
    }
    .tr-btn::before, .tr-btn::after { display: none !important; }
    .tr-btn-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
      display: block;
    }
    .tr-btn-num {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 14px;
      z-index: 3;
      font-weight: 900;
      font-size: clamp(16px, 2.8vw, 22px);
      color: #fff;
      text-shadow: 0 2px 6px rgba(0,0,0,0.8), 0 0 14px rgba(0,0,0,0.4);
      pointer-events: none;
    }
    /* Star row — overlaid at top of the button, outside <button> to avoid overflow issues */
    .tr-level-stars {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: row;
      gap: 2px;
      align-items: center;
      z-index: 10;
      pointer-events: none;
    }
    .tr-btn:hover:not(.tr-btn--locked) { transform: translateY(-4px) scale(1.07); }
    .tr-btn:active:not(.tr-btn--locked) { transform: scale(0.96); }
    .tr-btn--locked { cursor: not-allowed; opacity: 0.75; }
    .tr-btn--locked:hover { transform: none; }
    .tr-btn--current { animation: tr-pulse 2.1s ease-in-out infinite; }

    /* Water connector animation */
    @keyframes tr-water-flow {
      0% { stroke-dashoffset: 0; opacity: 0.55; }
      100% { stroke-dashoffset: -260; opacity: 0.55; }
    }
    @keyframes tr-water-glow {
      0%,100% { opacity: 0.35; }
      50% { opacity: 0.55; }
    }
    .tr-water-bubbles {
      animation: tr-water-flow 7.5s linear infinite;
    }
    .tr-water-glow {
      animation: tr-water-glow 3.6s ease-in-out infinite;
    }
    /* Removed Station/Next Stop labels (sea theme) */
    .tr-badge {
      position: absolute;
      right: -12px;
      top: -12px;
      width: 34px; height: 34px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 18px;
      background: linear-gradient(135deg, #fde68a, #f59e0b);
      border: 2px solid rgba(255,255,255,0.7);
      box-shadow: 0 10px 18px rgba(245,158,11,0.22);
    }
    .tr-lock {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: clamp(22px, 3.6vw, 30px);
      color: rgba(31,41,55,0.55);
      text-shadow: none;
      pointer-events: none;
    }

    /* Decorative clouds */
    @keyframes tr-cloud-float {
      0%,100% { transform: translateX(0) translateY(0); }
      50% { transform: translateX(18px) translateY(-4px); }
    }
    @keyframes tr-cloud-float-2 {
      0%,100% { transform: translateX(0) translateY(0) scale(0.92); }
      50% { transform: translateX(-22px) translateY(3px) scale(0.92); }
    }
    .tr-cloud {
      position: absolute;
      width: 140px; height: 44px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 40%, rgba(255,255,255,0.95), rgba(255,255,255,0.55));
      box-shadow: 0 10px 26px rgba(0,0,0,0.04);
      filter: blur(0.2px);
      opacity: 0.85;
      pointer-events: none;
      animation: tr-cloud-float 8.5s ease-in-out infinite;
    }
    .tr-cloud::before, .tr-cloud::after {
      content: "";
      position: absolute;
      top: -18px;
      width: 52px; height: 52px;
      border-radius: 999px;
      background: radial-gradient(circle at 40% 40%, rgba(255,255,255,0.95), rgba(255,255,255,0.55));
    }
    .tr-cloud::before { left: 18px; }
    .tr-cloud::after { left: 52px; width: 64px; height: 64px; top: -28px; }

    @media (max-width: 600px) {
      .tr-viewport { height: min(72vh, 780px); }
      .tr-seafloor { bottom: -170px; opacity: 0.72; }
    }
  `;
  document.head.appendChild(s);
}

function buildSmoothPath(points: Array<{ x: number; y: number }>, tension = 0.22): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y} `;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 2] ?? points[i - 1];
    const p1 = points[i - 1];
    const p2 = points[i];
    const p3 = points[i + 1] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
  }
  return d;
}

type RouteSegmentType =
  | 's-curve'
  | 'zigzag'
  | 'wide-left'
  | 'wide-right'
  | 'tight-left'
  | 'tight-right';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hashSeed(input: string): number {
  // xfnv1a-ish: stable across runs, fast, good enough for UI layout
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rnd: () => number, items: Array<{ v: T; w: number }>): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rnd() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.v;
  }
  return items[items.length - 1]!.v;
}

function smooth1D(values: number[], passes = 2): number[] {
  let arr = values.slice();
  for (let p = 0; p < passes; p++) {
    const next = arr.slice();
    for (let i = 1; i < arr.length - 1; i++) {
      next[i] = (arr[i - 1]! + arr[i]! * 2 + arr[i + 1]!) / 4;
    }
    arr = next;
  }
  return arr;
}

function buildRouteSegments(count: number, rnd: () => number): Array<{ type: RouteSegmentType; len: number }> {
  const segments: Array<{ type: RouteSegmentType; len: number }> = [];
  let remaining = count;
  let last: RouteSegmentType | null = null;

  while (remaining > 0) {
    const len = clamp(Math.round(3 + rnd() * 4), 3, 7); // 3..7 levels per segment
    const segLen = Math.min(len, remaining);
    let type = pickWeighted<RouteSegmentType>(rnd, [
      { v: 's-curve', w: 1.8 },
      { v: 'zigzag', w: 3.2 },
      { v: 'wide-left', w: 1.1 },
      { v: 'wide-right', w: 1.1 },
      { v: 'tight-left', w: 1.0 },
      { v: 'tight-right', w: 1.0 },
    ]);

    // Avoid immediate repeats (looks copied)
    if (last && type === last) {
      type = pickWeighted<RouteSegmentType>(rnd, [
        { v: 's-curve', w: last === 's-curve' ? 0.2 : 1.8 },
        { v: 'zigzag', w: last === 'zigzag' ? 0.2 : 3.2 },
        { v: 'wide-left', w: last === 'wide-left' ? 0.2 : 1.1 },
        { v: 'wide-right', w: last === 'wide-right' ? 0.2 : 1.1 },
        { v: 'tight-left', w: last === 'tight-left' ? 0.2 : 1.0 },
        { v: 'tight-right', w: last === 'tight-right' ? 0.2 : 1.0 },
      ]);
    }

    segments.push({ type, len: segLen });
    remaining -= segLen;
    last = type;
  }

  return segments;
}

function segmentShape(type: RouteSegmentType, t01: number, dir: 1 | -1): number {
  // Returns -1..1 horizontal influence for this segment.
  const t = clamp(t01, 0, 1);
  switch (type) {
    case 's-curve': {
      // Smooth S within the segment
      return Math.sin(t * Math.PI * 2) * 0.9 * dir;
    }
    case 'zigzag': {
      // More pronounced "corner-to-corner" feel (still continuous)
      const w = Math.sin(t * Math.PI * 4); // more turns inside the segment
      const shaped = Math.sign(w) * Math.pow(Math.abs(w), 0.55);
      return shaped * 1.05 * dir;
    }
    case 'wide-left':
      return -Math.sin(t * Math.PI) * 1.1;
    case 'wide-right':
      return Math.sin(t * Math.PI) * 1.1;
    case 'tight-left': {
      const k = Math.sin(t * Math.PI);
      return -Math.sign(k) * Math.pow(Math.abs(k), 0.55) * 1.0;
    }
    case 'tight-right': {
      const k = Math.sin(t * Math.PI);
      return Math.sign(k) * Math.pow(Math.abs(k), 0.55) * 1.0;
    }
    default:
      return 0;
  }
}

function generateMixedRouteX(count: number, mapWidth: number, seedKey: string): { xs: number[]; spacing: number[] } {
  const rnd = mulberry32(hashSeed(seedKey));

  const center = mapWidth / 2;
  const margin = clamp(mapWidth * 0.12, 72, 140);
  const usable = Math.max(240, mapWidth - margin * 2);
  const baseAmp = clamp(usable * 0.22, 70, 160);

  const segments = buildRouteSegments(count, rnd);
  const xs: number[] = [];
  const spacing: number[] = [];

  // Global drift (leans left/right for a while)
  let drift = (rnd() * 2 - 1) * baseAmp * 0.16;
  let driftTarget = drift;
  let driftT = 0;

  // Direction flips occasionally, but not strictly alternating
  let dir: 1 | -1 = rnd() > 0.5 ? 1 : -1;

  let idx = 0;
  for (const seg of segments) {
    // Segment amplitude changes: wide arcs or tight turns
    const ampFactor = (() => {
      if (seg.type.startsWith('wide')) return 1.15 + rnd() * 0.1;
      if (seg.type.startsWith('tight')) return 0.75 + rnd() * 0.1;
      if (seg.type === 'zigzag') return 1.12 + rnd() * 0.14;
      return 0.9 + rnd() * 0.12;
    })();
    const amp = baseAmp * ampFactor;

    // Sometimes keep same dir across segments, sometimes flip
    if (seg.type === 'wide-left') dir = -1;
    else if (seg.type === 'wide-right') dir = 1;
    else if (rnd() < 0.42) dir = (dir === 1 ? -1 : 1);

    for (let i = 0; i < seg.len; i++) {
      const t = seg.len <= 1 ? 1 : i / (seg.len - 1);

      // Slow drift update (prevents perfect symmetry)
      if (driftT >= 1) {
        driftTarget = (rnd() * 2 - 1) * baseAmp * 0.22;
        driftT = 0;
      }
      driftT += 1 / 18;
      drift = drift + (driftTarget - drift) * 0.08;

      // Small wiggles to avoid “copied” feel (smoothed later)
      const micro = (rnd() * 2 - 1) * 10;

      const influence = segmentShape(seg.type, t, dir);
      const x = center + influence * amp + drift + micro;

      xs.push(clamp(x, margin, mapWidth - margin));

      // Slightly varied vertical spacing, clamped to avoid overlaps
      const baseSpacing = count >= 40 ? 100 : 92;
      const jitter = (rnd() * 2 - 1) * 14;
      spacing.push(clamp(baseSpacing + jitter, 86, 118));
      idx++;
      if (idx >= count) break;
    }
  }

  // Smooth x positions so transitions between segments stay premium
  // Blend keeps zigzag character while avoiding sharp kinks.
  const smoothed = smooth1D(xs, 2);
  const blended = smoothed.map((v, i) => v * 0.55 + (xs[i] ?? v) * 0.45);
  return { xs: blended.map(v => clamp(v, margin, mapWidth - margin)), spacing };
}

type DecorItem = {
  key: string;
  kind: 'bubble' | 'fish' | 'turtle' | 'dolphin' | 'crab' | 'jelly' | 'seaweed' | 'coral' | 'starfish' | 'shell' | 'rock' | 'particle';
  top: number; // px
  side: 'left' | 'right';
  offset: number; // px from side (can be negative)
  size: number; // px
  opacity: number;
  anim: 'none' | 'bubble' | 'fish-r' | 'fish-l' | 'weed' | 'particle';
  durationS: number;
  delayS: number;
  rotateDeg?: number;
};

function buildUnderwaterDecor(layoutHeight: number, mapWidth: number, seedKey: string): DecorItem[] {
  const rnd = mulberry32(hashSeed(`${seedKey}:decor`));
  const items: DecorItem[] = [];

  const sideOffsetBase = clamp(mapWidth * 0.02, 6, 18);
  const minTop = 14;
  const maxTop = Math.max(minTop + 200, layoutHeight - 120);

  const make = (partial: Omit<DecorItem, 'durationS' | 'delayS'> & Partial<Pick<DecorItem, 'durationS' | 'delayS'>>) => {
    const durationS = partial.durationS ?? (10 + rnd() * 14);
    const delayS = partial.delayS ?? (rnd() * 6);
    items.push({ ...partial, durationS, delayS } as DecorItem);
  };

  // Tiny bubble field (lots, but very light)
  const bubbleCount = 26 + Math.floor(rnd() * 18); // 26..43
  for (let i = 0; i < bubbleCount; i++) {
    const side = rnd() < 0.5 ? 'left' : 'right';
    const top = clamp(minTop + rnd() * (layoutHeight - 180), minTop, maxTop);
    make({
      key: `bubble-${i}`,
      kind: 'bubble',
      top,
      side,
      offset: (side === 'left' ? clamp(-10 + rnd() * 70, -26, 64) : clamp(-10 + rnd() * 70, -28, 66)) - sideOffsetBase,
      size: 14 + rnd() * 26,
      opacity: 0.12 + rnd() * 0.22,
      anim: 'bubble',
      durationS: 6 + rnd() * 10,
      delayS: rnd() * 8,
      rotateDeg: 0,
    });
  }

  // Seaweed / coral / rocks near edges (a few)
  const plantsCount = 8 + Math.floor(rnd() * 5); // 8..12
  for (let i = 0; i < plantsCount; i++) {
    const side = i % 2 === 0 ? 'left' : 'right';
    const top = clamp((0.18 + (i / plantsCount) * 0.78 + (rnd() * 2 - 1) * 0.03) * layoutHeight, minTop, maxTop);
    const kind = pickWeighted(rnd, [
      { v: 'seaweed' as const, w: 2.2 },
      { v: 'coral' as const, w: 1.5 },
      { v: 'rock' as const, w: 1.2 },
      { v: 'shell' as const, w: 1.0 },
      { v: 'starfish' as const, w: 0.8 },
    ]);
    make({
      key: `plant-${i}`,
      kind,
      top,
      side,
      offset: (side === 'left' ? clamp(-30 + rnd() * 90, -58, 88) : clamp(-32 + rnd() * 94, -62, 92)) - sideOffsetBase,
      size: 42 + rnd() * 54,
      opacity: 0.22 + rnd() * 0.22,
      anim: kind === 'seaweed' ? 'weed' : 'particle',
      durationS: kind === 'seaweed' ? (4.8 + rnd() * 2.8) : (8 + rnd() * 8),
      delayS: rnd() * 6,
      rotateDeg: (rnd() * 2 - 1) * 8,
    });
  }

  // Small sea animals (few, slow swim, mostly near edges)
  const animals = ['fish', 'fish', 'fish', 'turtle', 'dolphin', 'crab', 'jelly'] as const;
  const animalCount = 7 + Math.floor(rnd() * 4); // 7..10
  for (let i = 0; i < animalCount; i++) {
    const kind = animals[Math.floor(rnd() * animals.length)]!;
    const side = rnd() < 0.5 ? 'left' : 'right';
    const top = clamp((0.08 + rnd() * 0.86) * layoutHeight, minTop, maxTop);
    const swim = kind === 'fish' || kind === 'turtle' || kind === 'dolphin' || kind === 'jelly';
    make({
      key: `animal-${i}`,
      kind,
      top,
      side,
      offset: (side === 'left' ? clamp(-8 + rnd() * 60, -22, 54) : clamp(-8 + rnd() * 60, -24, 56)) - sideOffsetBase,
      size: kind === 'dolphin' ? (56 + rnd() * 46) : (44 + rnd() * 38),
      opacity: 0.22 + rnd() * 0.18,
      anim: !swim ? 'particle' : (side === 'left' ? 'fish-r' : 'fish-l'),
      durationS: 10 + rnd() * 14,
      delayS: rnd() * 7,
      rotateDeg: (rnd() * 2 - 1) * 10,
    });
  }

  // Fine particles (center-safe: very low opacity, tiny)
  const particles = 18 + Math.floor(rnd() * 10);
  for (let i = 0; i < particles; i++) {
    const side = rnd() < 0.5 ? 'left' : 'right';
    const top = clamp(minTop + rnd() * (layoutHeight - 180), minTop, maxTop);
    make({
      key: `p-${i}`,
      kind: 'particle',
      top,
      side,
      offset: (side === 'left' ? clamp(18 + rnd() * 110, 18, 138) : clamp(18 + rnd() * 110, 18, 138)),
      size: 10 + rnd() * 22,
      opacity: 0.08 + rnd() * 0.14,
      anim: 'particle',
      durationS: 7 + rnd() * 10,
      delayS: rnd() * 8,
      rotateDeg: 0,
    });
  }

  // Keep only edge-safe items (avoid center). We interpret "center clear" by ensuring
  // all decor is anchored near edges: offset is negative and side positioning only.
  // Also clamp tops.
  for (const it of items) {
    it.top = clamp(it.top, minTop, maxTop);
    const minOp = it.kind === 'bubble' || it.kind === 'particle' ? 0.05 : 0.14;
    it.opacity = clamp(it.opacity, minOp, 0.86);
  }

  return items;
}

function DecorSVG({ kind, rotateDeg }: { kind: DecorItem['kind']; rotateDeg?: number }) {
  const svgStyle: React.CSSProperties = rotateDeg ? { transform: `rotate(${rotateDeg}deg)` } : {};

  switch (kind) {
    case 'bubble':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={svgStyle}>
          <circle cx="50" cy="50" r="38" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
          <circle cx="38" cy="36" r="10" fill="rgba(255,255,255,0.22)" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={svgStyle}>
          <defs>
            <linearGradient id="fishBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(56,189,248,0.75)" />
              <stop offset="100%" stopColor="rgba(167,243,208,0.55)" />
            </linearGradient>
          </defs>
          <ellipse cx="56" cy="50" rx="28" ry="18" fill="url(#fishBody)" />
          <polygon points="30,50 12,36 14,50 12,64" fill="rgba(56,189,248,0.62)" />
          <circle cx="68" cy="46" r="3.5" fill="rgba(15,23,42,0.45)" />
          <circle cx="67" cy="45" r="1.4" fill="rgba(255,255,255,0.75)" />
          <path d="M55 58 C60 62, 66 62, 72 58" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'turtle':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={svgStyle}>
          <ellipse cx="52" cy="54" rx="26" ry="20" fill="rgba(16,185,129,0.30)" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
          <path d="M30 54 C36 42, 68 42, 74 54 C68 68, 36 68, 30 54 Z" fill="rgba(34,197,94,0.22)" />
          <circle cx="78" cy="54" r="8" fill="rgba(34,197,94,0.18)" />
          <circle cx="80" cy="52" r="2.5" fill="rgba(15,23,42,0.35)" />
          <ellipse cx="36" cy="72" rx="10" ry="6" fill="rgba(34,197,94,0.16)" />
          <ellipse cx="64" cy="72" rx="10" ry="6" fill="rgba(34,197,94,0.16)" />
        </svg>
      );
    case 'dolphin':
      return (
        <svg viewBox="0 0 120 100" width="100%" height="100%" style={svgStyle}>
          <path
            d="M18 58 C30 28, 70 18, 96 40 C104 46, 106 56, 94 58 C84 60, 72 54, 60 52 C46 50, 34 54, 26 64 C22 68, 16 64, 18 58 Z"
            fill="rgba(56,189,248,0.28)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="3"
          />
          <circle cx="84" cy="44" r="2.6" fill="rgba(15,23,42,0.35)" />
        </svg>
      );
    case 'crab':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={svgStyle}>
          <circle cx="50" cy="56" r="18" fill="rgba(251,113,133,0.20)" />
          <circle cx="42" cy="52" r="3" fill="rgba(15,23,42,0.35)" />
          <circle cx="58" cy="52" r="3" fill="rgba(15,23,42,0.35)" />
          <path d="M22 58 C30 52, 34 50, 36 46" fill="none" stroke="rgba(251,113,133,0.24)" strokeWidth="4" strokeLinecap="round" />
          <path d="M78 58 C70 52, 66 50, 64 46" fill="none" stroke="rgba(251,113,133,0.24)" strokeWidth="4" strokeLinecap="round" />
          <path d="M34 72 L26 78" stroke="rgba(251,113,133,0.22)" strokeWidth="4" strokeLinecap="round" />
          <path d="M66 72 L74 78" stroke="rgba(251,113,133,0.22)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'jelly':
      return (
        <svg viewBox="0 0 100 120" width="100%" height="100%" style={svgStyle}>
          <path d="M24 54 C24 32, 76 32, 76 54 C76 74, 24 74, 24 54 Z" fill="rgba(167,139,250,0.18)" />
          <path d="M30 74 C30 94, 26 100, 26 110" stroke="rgba(167,139,250,0.22)" strokeWidth="4" strokeLinecap="round" />
          <path d="M44 74 C44 92, 40 100, 40 112" stroke="rgba(167,139,250,0.20)" strokeWidth="4" strokeLinecap="round" />
          <path d="M56 74 C56 92, 60 100, 60 112" stroke="rgba(167,139,250,0.20)" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 74 C70 94, 74 100, 74 110" stroke="rgba(167,139,250,0.22)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'seaweed':
      return (
        <svg viewBox="0 0 100 140" width="100%" height="100%" style={svgStyle}>
          <path
            d="M54 140 C44 116, 68 102, 50 82 C34 64, 62 52, 44 30 C34 18, 40 8, 44 0"
            fill="none"
            stroke="rgba(34,197,94,0.22)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M34 140 C22 114, 46 100, 32 80 C18 60, 42 50, 28 30 C18 16, 22 8, 26 0"
            fill="none"
            stroke="rgba(16,185,129,0.18)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'coral':
      return (
        <svg viewBox="0 0 100 140" width="100%" height="100%" style={svgStyle}>
          <path d="M50 140 L50 72" stroke="rgba(251,113,133,0.22)" strokeWidth="10" strokeLinecap="round" />
          <path d="M50 98 C40 92, 36 80, 34 70" stroke="rgba(251,113,133,0.22)" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M50 90 C62 86, 68 74, 70 62" stroke="rgba(251,113,133,0.20)" strokeWidth="10" strokeLinecap="round" fill="none" />
          <circle cx="34" cy="70" r="7" fill="rgba(251,113,133,0.16)" />
          <circle cx="70" cy="62" r="7" fill="rgba(251,113,133,0.14)" />
        </svg>
      );
    case 'starfish':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={svgStyle}>
          <path
            d="M50 10 L60 38 L90 38 L66 56 L76 86 L50 68 L24 86 L34 56 L10 38 L40 38 Z"
            fill="rgba(250,204,21,0.18)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="3"
          />
        </svg>
      );
    case 'shell':
      return (
        <svg viewBox="0 0 120 100" width="100%" height="100%" style={svgStyle}>
          <path d="M18 72 C30 34, 90 34, 102 72 C86 86, 34 86, 18 72 Z" fill="rgba(255,255,255,0.16)" />
          <path d="M36 72 C44 48, 76 48, 84 72" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
          <path d="M52 72 C56 56, 64 56, 68 72" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'rock':
      return (
        <svg viewBox="0 0 120 90" width="100%" height="100%" style={svgStyle}>
          <path
            d="M18 70 C14 52, 24 38, 40 34 C48 20, 68 16, 84 26 C98 28, 110 44, 104 62 C96 78, 70 84, 50 82 C34 82, 22 78, 18 70 Z"
            fill="rgba(148,163,184,0.18)"
          />
        </svg>
      );
    case 'particle':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={svgStyle}>
          <circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.16)" />
        </svg>
      );
    default:
      return null;
  }
}

function statusClass(s: LevelStatus): string {
  if (s === 'locked') return 'tr-btn tr-btn--locked';
  if (s === 'completed') return 'tr-btn tr-btn--completed';
  if (s === 'current') return 'tr-btn tr-btn--current';
  return 'tr-btn tr-btn--available';
}

// Reusable star SVG for level buttons — inline styles so color always applies
function StarSVG({ earned }: { earned: boolean }) {
  return earned ? (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      style={{
        display: 'block',
        flexShrink: 0,
        overflow: 'visible',
        filter: 'drop-shadow(0 0 3px #FFFF00) drop-shadow(0 0 7px rgba(255,230,0,0.95))',
      }}
    >
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        style={{ fill: '#FFEE00', stroke: '#D4A000', strokeWidth: 1, strokeLinejoin: 'round' }}
      />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible', opacity: 0.35 }}
    >
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        style={{ fill: 'none', stroke: '#fff', strokeWidth: 1.5, strokeLinejoin: 'round' }}
      />
    </svg>
  );
}

export const TrainRouteLevelMap: React.FC<Props> = React.memo(({ difficulty, levels, onSelectLevel }) => {
  const meta = DIFF_META[difficulty];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLDivElement | null>(null);
  const [mapWidth, setMapWidth] = useState(980);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const measure = () => setMapWidth(map.getBoundingClientRect().width || 980);
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(map);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const total = levels.length;
    const paddingTop = 140;
    const paddingBottom = 80;
    const nodeSpacing = total >= 40 ? 130 : 160;

    // Strict alternating zig-zag, centered on background
    const leftX  = mapWidth * 0.38;
    const rightX = mapWidth * 0.62;
    const waveSize = 1; // each level strictly alternates left ↔ right

    const pts = levels.map((lv, i) => {
      const waveIndex = Math.floor(i / waveSize);
      const posInWave = i % waveSize;
      const t = waveSize <= 1 ? 0 : posInWave / (waveSize - 1);
      const x = waveIndex % 2 === 0
        ? leftX + (rightX - leftX) * t   // even wave: left → right
        : rightX - (rightX - leftX) * t; // odd wave:  right → left
      return { x, y: paddingTop + i * nodeSpacing, level: lv };
    });

    const height = (pts.at(-1)?.y ?? paddingTop) + paddingBottom;
    const pathD = buildSmoothPath(pts.map(p => ({ x: p.x, y: p.y })));

    const widthBucket = Math.round(mapWidth / 40) * 40;
    const seedKey = `trainRoute:${difficulty}:${total}:${widthBucket}`;
    const decor = buildUnderwaterDecor(height, mapWidth, seedKey);
    return { pts, height, pathD, decor };
  }, [levels, mapWidth, difficulty]);

  // Auto-scroll to current level
  useEffect(() => {
    const el = currentRef.current;
    const viewport = viewportRef.current;
    if (!el || !viewport) return;
    const desired = el.offsetTop - viewport.clientHeight * 0.78;
    const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const top = Math.max(0, Math.min(desired, max));
    viewport.scrollTo({ top, behavior: 'smooth' });
  }, [difficulty, levels.length, mapWidth]);

  const currentIndex = useMemo(() => Math.max(0, levels.findIndex(l => l.status === 'current')), [levels]);

  return (
    <div
      className="tr-card"
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.65)',
        background: 'transparent',
        boxShadow: `0 10px 34px rgba(0,0,0,0.06), 0 2px 10px ${meta.glowColor}`,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        ['--tr-glow' as any]: meta.glowColor,
      }}
    >
      <div className="tr-viewport" ref={viewportRef} aria-label="Scrollable train-route level map">
        <div className="tr-map" ref={mapRef} style={{
          height: layout.height,
          backgroundImage: "url('/assets/background/background.png')",
          backgroundSize: '100%',
          backgroundPosition: 'center top',
          backgroundRepeat: 'repeat',
        }}>
          {/* Background / decor layer (no track graphics here) */}
          <div className="tr-decor" aria-hidden="true">
            <div className="tr-ocean" />
            <div className="tr-caustics" />
            <div className="tr-seafloor" />

            {/* Cute signboards near edges */}
            <div className="tr-sign tr-edge tr-anim-sign1" style={{ left: '4%', top: layout.height * 0.34, animationDelay: '0.6s' }}>
              🚦 STOP
            </div>
            <div className="tr-sign tr-edge tr-edge--soft tr-anim-sign2" style={{ right: '4%', top: layout.height * 0.88, animationDelay: '1.4s' }}>
              🌼 GO!
            </div>

            {/* PNG assets (small, spread top→bottom, edge-only) */}
            {layout.decor.map((d) => (
              <div
                key={d.key}
                className={[
                  'tr-uitem',
                  d.anim === 'bubble' ? 'tr-anim-bubble' : '',
                  d.anim === 'fish-r' ? 'tr-anim-fish-r' : '',
                  d.anim === 'fish-l' ? 'tr-anim-fish-l' : '',
                  d.anim === 'weed' ? 'tr-anim-weed' : '',
                  d.anim === 'particle' ? 'tr-anim-particle' : '',
                ].filter(Boolean).join(' ')}
                style={{
                  top: d.top,
                  width: d.size,
                  height: d.size,
                  opacity: d.opacity,
                  ...(d.side === 'left' ? { left: d.offset } : { right: d.offset }),
                  animationDuration: `${d.durationS}s`,
                  animationDelay: `${d.delayS}s`,
                }}
              >
                <DecorSVG kind={d.kind} rotateDeg={d.rotateDeg} />
              </div>
            ))}
          </div>




          {/* Candy-crush connecting path - smooth S-curve between buttons */}
          <svg
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: layout.height,
              zIndex: 2,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {/* Shadow path (full route) */}
            <path
              d={layout.pathD}
              fill="none"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth={18}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Grey base path (locked sections) */}
            <path
              d={layout.pathD}
              fill="none"
              stroke="rgba(148,163,184,0.45)"
              strokeWidth={12}
              strokeDasharray="18 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Gold overlay for completed + current portion — same path, clipped by Y */}
            {(() => {
              const doneCount = layout.pts.filter(
                p => p.level.status === 'completed' || p.level.status === 'current'
              ).length;
              if (doneCount < 2) return null;
              const lastY = layout.pts[doneCount - 1]!.y;
              const clipId = `tr-done-clip-${difficulty}`;
              return (
                <>
                  <defs>
                    <clipPath id={clipId}>
                      <rect x={-200} y={0} width={mapWidth + 400} height={lastY + 50} />
                    </clipPath>
                  </defs>
                  <path
                    d={layout.pathD}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={12}
                    strokeDasharray="18 10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    clipPath={`url(#${clipId})`}
                  />
                </>
              );
            })()}
          </svg>
          {/* Nodes */}
          {layout.pts.map(({ x, y, level }) => {
            const locked = level.status === 'locked' && !DEV_UNLOCK_ALL;
            const isCurrent = level.status === 'current';
            const isDone = level.status === 'completed';
            const earnedStars = isDone ? (level.stars ?? 0) : 0;

            // Use star-count button images for completed levels
            const imgSrc = isDone
              ? earnedStars >= 3
                ? '/assets/buttons/three-star-button.png'
                : earnedStars === 2
                  ? '/assets/buttons/two-star-button.png'
                  : '/assets/buttons/one-star-button.png'
              : isCurrent
                ? '/assets/buttons/current-level.png'
                : '/assets/buttons/upcoming-level.png';

            return (
              <div
                key={level.id}
                ref={isCurrent ? currentRef : undefined}
                className="tr-node"
                style={{ left: x, top: y, zIndex: 3 }}
              >
                <div className="tr-stack">
                  <button
                    type="button"
                    className={statusClass(locked ? 'locked' : level.status)}
                    disabled={locked}
                    aria-label={`Level ${level.number}${locked ? ' locked' : ''}`}
                    onClick={() => {
                      if (locked) return;
                      onSelectLevel(level.number);
                    }}
                  >
                    {/* Button background image — star-count variant for completed */}
                    <img className="tr-btn-img" src={imgSrc} alt={level.status} draggable={false} />
                    {/* Level number */}
                    <span className="tr-btn-num">{level.number}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TrainRouteLevelMap.displayName = 'TrainRouteLevelMap';
