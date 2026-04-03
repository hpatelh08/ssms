/**
 * parent/pages/reader/useNarration.ts
 * ─────────────────────────────────────────────────────
 * AI Narration hook — reads page text aloud using
 * Web Speech API via voiceService.
 *
 * Features:
 *  • Child-friendly narrator voice
 *  • Word-by-word highlighting callback
 *  • Play / Pause / Stop controls
 *  • Auto-detect language (English / Hindi / Gujarati)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  speak,
  stop as stopSpeech,
  isSpeaking,
  pauseSpeech,
  resumeSpeech,
  detectLanguage,
} from '../../../services/voiceService';

export type NarrationState = 'idle' | 'playing' | 'paused';

export interface UseNarrationReturn {
  state: NarrationState;
  highlightedWordIndex: number; // char index in current text
  highlightedWord: string;
  play: (text: string, lang?: string) => void;
  pause: () => void;
  resume: () => void;
  stopNarration: () => void;
  isSupported: boolean;
}

export function useNarration(): UseNarrationReturn {
  const [state, setState] = useState<NarrationState>('idle');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [highlightedWord, setHighlightedWord] = useState('');
  const currentTextRef = useRef('');

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const play = useCallback((text: string, lang?: string) => {
    if (!text.trim()) return;
    currentTextRef.current = text;
    setState('playing');
    setHighlightedWordIndex(-1);
    setHighlightedWord('');

    const detectedLang = lang || detectLanguage(text);

    speak(text, {
      rate: 0.75,
      pitch: 1.1,
      volume: 1,
      lang: detectedLang,
      onWord: (word, charIndex) => {
        setHighlightedWordIndex(charIndex);
        setHighlightedWord(word);
      },
      onEnd: () => {
        setState('idle');
        setHighlightedWordIndex(-1);
        setHighlightedWord('');
      },
      onError: () => {
        setState('idle');
        setHighlightedWordIndex(-1);
        setHighlightedWord('');
      },
    });
  }, []);

  const pause = useCallback(() => {
    pauseSpeech();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    resumeSpeech();
    setState('playing');
  }, []);

  const stopNarration = useCallback(() => {
    stopSpeech();
    setState('idle');
    setHighlightedWordIndex(-1);
    setHighlightedWord('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return {
    state,
    highlightedWordIndex,
    highlightedWord,
    play,
    pause,
    resume,
    stopNarration,
    isSupported,
  };
}
