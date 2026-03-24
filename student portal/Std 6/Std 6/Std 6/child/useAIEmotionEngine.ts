/**
 * useAIEmotionEngine.ts
 * ─────────────────────────────────────────────────────
 * Lightweight keyword-based emotion detector that bridges
 * AI text responses to the mascot / celebration / sound /
 * XP systems.
 *
 * Zero external dependencies. No NLP. Simple string.includes()
 * with a priority-ordered rule table.
 *
 * Usage:
 *   const emotion = useAIEmotionEngine();
 *   // When AI starts generating:
 *   emotion.onLoadingStart();
 *   // When AI finishes:
 *   emotion.analyzeAndTrigger(responseText);
 */

import { useCallback, useRef } from 'react';
import type { MascotState } from './useMascotController';
import { useMascotTrigger } from './useMascotController';
import { useCelebrate } from './useCelebrationController';
import { useSoundPlay } from './SoundProvider';
import { useAddXP } from './XPProvider';
import type { SoundType } from './SoundManager';

/* ── Emotion rule table ─────────────────────────── */

interface EmotionRule {
  /** Keywords to match (any match triggers the rule) */
  keywords: string[];
  mascot: MascotState;
  mascotDuration?: number;
  sound?: SoundType;
  celebrate?: 'confetti' | 'level';
  /** XP to award (0 = none) */
  xp: number;
}

/**
 * Rules are checked top-to-bottom; first match wins.
 * Order from most-specific (strongest praise) to least.
 */
const RULES: EmotionRule[] = [
  // ── Highest praise → full celebration
  {
    keywords: ['excellent', 'outstanding', 'perfect', 'amazing', 'brilliant', 'fantastic', 'superstar'],
    mascot: 'celebrate',
    mascotDuration: 2500,
    sound: 'celebrate',
    celebrate: 'confetti',
    xp: 10,
  },
  // ── Strong praise
  {
    keywords: ['great job', 'well done', 'awesome', 'wonderful', 'good job', 'nicely done', 'impressive'],
    mascot: 'happy',
    mascotDuration: 2000,
    sound: 'correct',
    xp: 5,
  },
  // ── Correct / positive feedback
  {
    keywords: ['correct', 'right answer', 'that\'s right', 'you got it', 'exactly', 'yes!', 'spot on'],
    mascot: 'happy',
    sound: 'correct',
    xp: 3,
  },
  // ── Encouragement after wrong answer
  {
    keywords: ['try again', 'not quite', 'almost', 'close', 'let\'s try', 'oops', 'don\'t worry', 'keep trying'],
    mascot: 'encourage',
    mascotDuration: 2000,
    sound: 'wrong',
    xp: 1,
  },
  // ── Thinking / explanation
  {
    keywords: ['let\'s think', 'let me explain', 'think about', 'here\'s a hint', 'consider', 'imagine', 'let\'s look'],
    mascot: 'thinking',
    mascotDuration: 2500,
    sound: 'click',
    xp: 0,
  },
];

/** Minimum ms between two analyzeAndTrigger calls (debounce). */
const DEBOUNCE_MS = 400;

/* ── Hook ───────────────────────────────────────── */

export interface AIEmotionEngine {
  /** Call when AI starts generating (mascot → thinking). */
  onLoadingStart: () => void;
  /** Call when AI response is complete. Detects emotion & triggers systems. */
  analyzeAndTrigger: (text: string) => void;
}

export function useAIEmotionEngine(): AIEmotionEngine {
  const triggerMascot = useMascotTrigger();
  const celebrate     = useCelebrate();
  const play          = useSoundPlay();
  const addXP         = useAddXP();
  const lastCallRef   = useRef(0);

  const onLoadingStart = useCallback(() => {
    triggerMascot('thinking', 10_000); // long duration; will be overridden
  }, [triggerMascot]);

  const analyzeAndTrigger = useCallback((text: string) => {
    // ── Debounce guard
    const now = Date.now();
    if (now - lastCallRef.current < DEBOUNCE_MS) return;
    lastCallRef.current = now;

    const lower = text.toLowerCase();

    // First matching rule wins
    for (const rule of RULES) {
      const matched = rule.keywords.some(kw => lower.includes(kw));
      if (!matched) continue;

      // Trigger all connected systems
      triggerMascot(rule.mascot, rule.mascotDuration);
      if (rule.sound)     play(rule.sound);
      if (rule.celebrate) celebrate(rule.celebrate);
      if (rule.xp > 0)   addXP(rule.xp);

      return; // stop after first match
    }

    // No rule matched → default: gentle happy (AI responded)
    triggerMascot('happy');
    play('click');
  }, [triggerMascot, play, celebrate, addXP]);

  return { onLoadingStart, analyzeAndTrigger };
}
