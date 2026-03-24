/**
 * useSoundEngine.ts
 * ─────────────────────────────────────────────────────
 * Pure logic hook for the child playground sound system.
 * No JSX — keeps the bundle lean and testable.
 *
 * Features:
 *  • EAGER Audio preloading on mount (not lazy)
 *  • Browser autoplay unlock on first user interaction
 *  • Per-type volume normalization
 *  • Anti-stacking cooldowns (stop previous before new)
 *  • Celebration delay (animation sync)
 *  • Debug logging (dev only, no spam)
 */

import { useCallback, useRef, useEffect } from 'react';

/* ── Public types ───────────────────────────────── */

export type SoundType = 'click' | 'correct' | 'wrong' | 'celebrate' | 'level';

/* ── Internal config ────────────────────────────── */

interface SoundCfg {
  path: string;
  volume: number;
  /** Min ms before same sound can fire again */
  cooldown: number;
  /** Pre-play delay in ms (lets animation start first) */
  delay: number;
}

const CFG: Record<SoundType, SoundCfg> = {
  click:     { path: '/sounds/click.mp3',     volume: 0.5,  cooldown: 100,  delay: 0   },
  correct:   { path: '/sounds/correct.mp3',   volume: 0.7,  cooldown: 350,  delay: 0   },
  wrong:     { path: '/sounds/wrong.mp3',     volume: 0.7,  cooldown: 400,  delay: 0   },
  celebrate: { path: '/sounds/celebrate.mp3', volume: 1.0,  cooldown: 1500, delay: 0   },
  level:     { path: '/sounds/level.mp3',     volume: 0.9,  cooldown: 2000, delay: 120 },
};

/* ── Debug helpers (stripped in prod by tree-shaking) */

const __DEV__ = typeof (import.meta as any).env !== 'undefined'
  ? (import.meta as any).env.DEV
  : true;

function dbg(...a: unknown[]) { if (__DEV__) console.log('%c[Sound]', 'color:#6d28d9', ...a); }
function wrn(...a: unknown[]) { console.warn('[Sound]', ...a); }

/* ── Hook ───────────────────────────────────────── */

export interface UseSoundEngine {
  play: (type: SoundType) => void;
  toggleMute: () => void;
}

/**
 * Core sound engine — call from inside `SoundProvider` only.
 * Accepts the current `muted` value from the provider's state
 * so the hook itself never owns render-causing state.
 */
export function useSoundEngine(muted: boolean): UseSoundEngine {
  // ── Refs (stable across renders, zero re-renders) ──
  const mutedRef       = useRef(muted);
  const audioMapRef    = useRef<Record<string, HTMLAudioElement>>({});
  const lastPlayRef    = useRef<Record<string, number>>({});
  const delayTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const audioUnlockedRef = useRef(false);
  const initDoneRef    = useRef(false);

  // Keep ref in sync
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // ── EAGER preload all audio on mount (not lazy) ──
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const map: Record<string, HTMLAudioElement> = {};

    for (const [key, cfg] of Object.entries(CFG)) {
      const el = new Audio();
      el.preload = 'auto';
      el.volume  = cfg.volume;
      el.src     = cfg.path;

      // Force the browser to start loading
      el.load();

      if (__DEV__) {
        el.addEventListener('canplaythrough', () =>
          dbg(`preloaded "${key}" — dur=${el.duration.toFixed(2)}s`), { once: true });
        el.addEventListener('error', (e) =>
          wrn(`failed to load "${key}" (${cfg.path})`, e), { once: true });
      }

      map[key] = el;
    }

    audioMapRef.current = map;
    dbg('audio map created + preloading');

    return () => {
      // Cleanup on unmount
      for (const el of Object.values(map)) {
        el.pause();
        el.src = '';
        el.load();
      }
    };
  }, []);

  // ── Browser autoplay unlock on first user interaction ──
  useEffect(() => {
    if (audioUnlockedRef.current) return;

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;

      const map = audioMapRef.current;
      if (!map) return;

      // Silent play+pause on each audio element to unlock browser audio context
      for (const [key, el] of Object.entries(map)) {
        const origVolume = el.volume;
        el.volume = 0;
        el.currentTime = 0;
        const p = el.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            el.pause();
            el.currentTime = 0;
            el.volume = origVolume;
            if (__DEV__) dbg(`unlocked "${key}"`);
          }).catch(() => {
            el.volume = origVolume;
            // Some browsers still block — will retry on next gesture
            audioUnlockedRef.current = false;
          });
        }
      }
      dbg('audio context unlock triggered');
    };

    // Listen on multiple events for maximum compatibility
    const events = ['click', 'touchstart', 'keydown', 'pointerdown'] as const;
    for (const ev of events) {
      document.addEventListener(ev, unlockAudio, { once: true, passive: true });
    }

    return () => {
      for (const ev of events) {
        document.removeEventListener(ev, unlockAudio);
      }
    };
  }, []);

  // Cleanup pending timers on unmount
  useEffect(() => () => {
    for (const t of delayTimersRef.current) clearTimeout(t);
  }, []);

  /** Actually trigger playback (called immediately or after delay). */
  const firePlayback = useCallback((type: SoundType, el: HTMLAudioElement, cfg: SoundCfg) => {
    if (mutedRef.current) return;

    // Stop previous playback of this sound to prevent overlap
    el.pause();
    el.currentTime = 0;
    el.volume = cfg.volume;

    el.play().catch((err: DOMException) => {
      if (err.name === 'NotAllowedError') {
        wrn('Autoplay blocked — needs user gesture first');
        // Reset unlock flag so next gesture retries
        audioUnlockedRef.current = false;
      } else {
        wrn(`play("${type}") error:`, err.message);
      }
    });
  }, []);

  /** Public play function — anti-spam + optional delay. */
  const play = useCallback((type: SoundType) => {
    if (mutedRef.current) return;

    const cfg = CFG[type];
    if (!cfg) { wrn(`Unknown type "${type}"`); return; }

    // ── Anti-spam cooldown
    const now  = Date.now();
    const last = lastPlayRef.current[type] ?? 0;
    if (now - last < cfg.cooldown) return;           // silently skip
    lastPlayRef.current[type] = now;

    const map = audioMapRef.current;
    const el  = map[type];
    if (!el) {
      wrn(`Audio element for "${type}" not found — map not ready`);
      return;
    }

    // ── Delayed playback (celebrate / level sync with animation)
    if (cfg.delay > 0) {
      const t = setTimeout(() => {
        delayTimersRef.current.delete(t);
        firePlayback(type, el, cfg);
      }, cfg.delay);
      delayTimersRef.current.add(t);
    } else {
      firePlayback(type, el, cfg);
    }
  }, [firePlayback]);

  /** Toggle mute — also silences anything in-flight. */
  const toggleMute = useCallback(() => {
    /* The actual state flip happens in SoundProvider.
       Here we just stop all audio so nothing leaks. */
    const map = audioMapRef.current;
    if (map) {
      for (const el of Object.values(map) as HTMLAudioElement[]) {
        el.pause();
        el.currentTime = 0;
      }
    }
    for (const t of delayTimersRef.current) clearTimeout(t);
    delayTimersRef.current.clear();
  }, []);

  return { play, toggleMute };
}
