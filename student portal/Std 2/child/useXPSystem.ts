/**
 * useXPSystem.ts
 * ─────────────────────────────────────────────────────
 * Pure XP progression logic — no JSX, no React context.
 *
 * Owns:
 *  • XP accumulation + level-up threshold
 *  • Level-up detection (calls external callbacks)
 *  • localStorage persistence
 *  • "just gained" flag for animation triggers
 *
 * Does NOT own celebration/mascot side-effects —
 * those are injected via the onLevelUp callback.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Public types ───────────────────────────────── */

export interface XPState {
  level: number;
  xp: number;
  xpToNext: number;
}

export interface UseXPSystem {
  state: XPState;
  /** Add XP — may trigger level-up. Returns true if levelled up. */
  addXP: (amount: number) => boolean;
  /** True for a brief window after any addXP call (for glow anim). */
  justGained: boolean;
}

/* ── Helpers ────────────────────────────────────── */

const STORAGE_KEY = 'child_xp_state';

/** XP required to reach the *next* level from `level`. */
function xpForLevel(level: number): number {
  // Gentle curve: 30, 50, 80, 120, 170, 230 …
  return 20 + level * 10 + Math.floor(level * level * 2);
}

function loadState(): XPState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as XPState;
      if (
        typeof parsed.level === 'number' &&
        typeof parsed.xp === 'number' &&
        typeof parsed.xpToNext === 'number'
      ) {
        return parsed;
      }
    }
  } catch { /* ignore corrupt data */ }
  return { level: 1, xp: 0, xpToNext: xpForLevel(1) };
}

function saveState(s: XPState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  catch { /* quota / private mode */ }
}

/* ── Hook ───────────────────────────────────────── */

/**
 * @param onLevelUp — called synchronously when a level-up occurs.
 *   Provider wires this to celebration + mascot + sound triggers.
 */
export function useXPSystem(onLevelUp?: (newLevel: number) => void): UseXPSystem {
  const [state, setState] = useState<XPState>(loadState);
  const [justGained, setJustGained] = useState(false);
  const gainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup gain-glow timer on unmount
  useEffect(() => () => {
    if (gainTimerRef.current) clearTimeout(gainTimerRef.current);
  }, []);

  const addXP = useCallback((amount: number): boolean => {
    let didLevel = false;

    setState(prev => {
      let { level, xp, xpToNext } = prev;
      xp += amount;

      // Level-up loop (handles multi-level jumps)
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level++;
        xpToNext = xpForLevel(level);
        didLevel = true;
      }

      const next: XPState = { level, xp, xpToNext };
      saveState(next);
      return next;
    });

    // Fire the level-up callback *after* state update is queued
    if (didLevel && onLevelUp) {
      // Use a microtask so setState has committed
      queueMicrotask(() => {
        // Read latest level from storage since setState is async
        const latest = loadState();
        onLevelUp(latest.level);
      });
    }

    // "just gained" flag — stays true for 600ms (drives glow animation)
    setJustGained(true);
    if (gainTimerRef.current) clearTimeout(gainTimerRef.current);
    gainTimerRef.current = setTimeout(() => setJustGained(false), 600);

    return didLevel;
  }, [onLevelUp]);

  return { state, addXP, justGained };
}
