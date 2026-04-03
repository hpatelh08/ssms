/**
 * SoundManager.ts
 * ─────────────────────────────────────────────────────
 * Plain‑class global singleton for sound playback.
 * Lives OUTSIDE React — no hooks, no context, no re‑renders.
 *
 * Usage:
 *   import { soundManager } from './SoundManager';
 *   soundManager.play('correct');
 *
 * Browser autoplay policy:
 *   Call `soundManager.unlockAudio()` once on the very first
 *   user gesture (click / touch / keydown).  SoundProvider does
 *   this automatically via a one‑time document listener.
 */

/* ── Public types ───────────────────────────────── */
export type SoundType = 'click' | 'correct' | 'wrong' | 'celebrate' | 'level';

/* ── Per‑sound config ───────────────────────────── */
interface SoundCfg {
  path: string;
  volume: number;
  /** Minimum ms before the same sound can fire again */
  cooldown: number;
}

const CFG: Record<SoundType, SoundCfg> = {
  click:     { path: '/sounds/click.mp3',     volume: 0.5,  cooldown: 100  },
  correct:   { path: '/sounds/correct.mp3',   volume: 0.7,  cooldown: 350  },
  wrong:     { path: '/sounds/wrong.mp3',     volume: 0.7,  cooldown: 400  },
  celebrate: { path: '/sounds/celebrate.mp3', volume: 1.0,  cooldown: 1500 },
  level:     { path: '/sounds/level.mp3',     volume: 0.9,  cooldown: 2000 },
};

/* ── Debug helper (tree‑shaken in prod) ─────────── */
const __DEV__ =
  typeof (import.meta as any).env !== 'undefined'
    ? (import.meta as any).env.DEV
    : true;
function dbg(...a: unknown[]) { if (__DEV__) console.log('%c[SoundMgr]', 'color:#059669', ...a); }

/* ════════════════════════════════════════════════════
   CLASS
   ════════════════════════════════════════════════════ */
class SoundManager {
  /* ── internal maps ── */
  private audioMap: Record<string, HTMLAudioElement> = {};
  private lastPlay: Record<string, number> = {};
  private _muted = false;
  private _unlocked = false;
  private _initialized = false;

  /* ── constructor (auto-init in browser) ── */
  constructor() {
    if (typeof window !== 'undefined') this.init();
  }

  /* ── eager preload all clips ── */
  private init() {
    if (this._initialized) return;
    this._initialized = true;

    for (const [key, cfg] of Object.entries(CFG)) {
      const el = new Audio();
      el.preload = 'auto';
      el.volume  = cfg.volume;
      el.src     = cfg.path;
      el.load();                 // kick off network fetch immediately

      if (__DEV__) {
        el.addEventListener('canplaythrough', () =>
          dbg(`preloaded "${key}" — dur=${el.duration.toFixed(2)}s`), { once: true });
        el.addEventListener('error', (e) =>
          console.warn(`[SoundMgr] failed to load "${key}"`, e), { once: true });
      }

      this.audioMap[key] = el;
    }
    dbg('all audio elements created + preloading');

    // Auto‑register unlock listener
    this.registerUnlockListener();
  }

  /* ── Browser autoplay unlock ── */
  private registerUnlockListener() {
    const unlock = () => {
      if (this._unlocked) return;
      this.unlockAudio();
    };
    for (const ev of ['click', 'touchstart', 'keydown', 'pointerdown'] as const) {
      document.addEventListener(ev, unlock, { once: true, passive: true });
    }
  }

  /**
   * Silent play+pause on every clip to satisfy Chrome / Safari
   * autoplay policy.  Call this on ANY user gesture.
   */
  unlockAudio() {
    if (this._unlocked) return;
    this._unlocked = true;

    for (const [key, el] of Object.entries(this.audioMap)) {
      const origVol = el.volume;
      el.volume = 0;
      el.currentTime = 0;
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = origVol;
          if (__DEV__) dbg(`unlocked "${key}"`);
        }).catch(() => {
          el.volume = origVol;
          this._unlocked = false;          // retry on next gesture
        });
      }
    }
    dbg('audio unlock triggered');
  }

  /* ── Play a sound ── */
  play(type: SoundType) {
    if (this._muted) return;

    const cfg = CFG[type];
    if (!cfg) return;

    // Anti‑spam cooldown
    const now = Date.now();
    if (now - (this.lastPlay[type] ?? 0) < cfg.cooldown) return;
    this.lastPlay[type] = now;

    const el = this.audioMap[type];
    if (!el) return;

    // Stop any in‑flight playback to prevent overlap
    el.pause();
    el.currentTime = 0;
    el.volume = cfg.volume;

    el.play().catch((err: DOMException) => {
      if (err.name === 'NotAllowedError') {
        this._unlocked = false;            // will retry on next gesture
        this.registerUnlockListener();     // re-arm listener
      }
    });
  }

  /* ── Convenience wrappers ── */
  playCorrect()   { this.play('correct'); }
  playWrong()     { this.play('wrong'); }
  playCelebrate() { this.play('celebrate'); }
  playClick()     { this.play('click'); }
  playLevel()     { this.play('level'); }

  /* ── Mute ── */
  get muted() { return this._muted; }

  setMuted(m: boolean) {
    this._muted = m;
    if (m) {
      // Silence everything in‑flight
      for (const el of Object.values(this.audioMap)) {
        el.pause();
        el.currentTime = 0;
      }
    }
    try { localStorage.setItem('child_sound_muted', m ? '1' : '0'); }
    catch { /* quota / private mode */ }
  }

  toggleMute() {
    this.setMuted(!this._muted);
  }
}

/* ── Singleton export ── */
export const soundManager = new SoundManager();
