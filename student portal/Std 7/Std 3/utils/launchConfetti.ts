/**
 * utils/launchConfetti.ts
 * ─────────────────────────────────────────────────────
 * Lightweight confetti burst for milestone celebrations.
 *
 * Uses canvas-confetti (< 5 KB gzipped).
 * Safe to call from any context — no-ops silently on error.
 */

import confetti from 'canvas-confetti';

/** Standard celebration burst — 80 particles, warm palette. */
export const launchConfetti = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#34d399', '#818cf8', '#f9a8d4'],
      ticks: 120,
      gravity: 0.9,
      scalar: 0.9,
    });
  } catch {
    /* SSR / test env — ignore silently */
  }
};

/** Smaller burst for minor milestones. */
export const launchMiniConfetti = () => {
  try {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#34d399', '#818cf8'],
      ticks: 80,
      gravity: 1,
      scalar: 0.7,
    });
  } catch {
    /* ignore */
  }
};

/** Big burst for major milestones (perfect week, etc.). */
export const launchBigConfetti = () => {
  try {
    // Two-shot spread for dramatic effect
    const defaults = {
      origin: { y: 0.55 },
      colors: ['#fbbf24', '#f59e0b', '#34d399', '#818cf8', '#f9a8d4', '#c084fc'],
      ticks: 160,
      gravity: 0.85,
    };
    confetti({ ...defaults, particleCount: 60, spread: 55, angle: 60 });
    confetti({ ...defaults, particleCount: 60, spread: 55, angle: 120 });
  } catch {
    /* ignore */
  }
};
