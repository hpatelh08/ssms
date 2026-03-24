/**
 * services/voiceService.ts
 * ─────────────────────────────────────────────────────
 * Voice service for the Chapter Learning Hub.
 *
 * Features:
 *  - Text-to-Speech (TTS) with child-friendly settings
 *  - Speech-to-Text (STT) for voice input
 *  - Word-by-word highlighting callback
 *  - Language detection & voice selection
 *  - Child-friendly slow, clear pronunciation
 */

// ─── Types ────────────────────────────────────────────────

export interface TTSOptions {
  rate?: number;        // 0.1 – 10, default 0.8 (slow for kids)
  pitch?: number;       // 0 – 2, default 1.1
  volume?: number;      // 0 – 1, default 1
  lang?: string;        // BCP 47 language tag
  onWord?: (word: string, charIndex: number) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface STTOptions {
  lang?: string;
  continuous?: boolean;
  onResult: (result: STTResult) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

// ─── Language Detection ───────────────────────────────────

const LANG_MAP: Record<string, string> = {
  English: 'en-IN',
  Math: 'en-IN',
  Hindi: 'hi-IN',
  Gujarati: 'gu-IN',
  Activities: 'en-IN',
};

export function getLanguageForSubject(subject: string): string {
  return LANG_MAP[subject] || 'en-IN';
}

/**
 * Detect dominant language from text content.
 * Checks for Devanagari (Hindi) and Gujarati script ranges.
 */
export function detectLanguage(text: string): string {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const gujarati = (text.match(/[\u0A80-\u0AFF]/g) || []).length;
  const total = text.length;

  if (gujarati > total * 0.2) return 'gu-IN';
  if (devanagari > total * 0.2) return 'hi-IN';
  return 'en-IN';
}

// ─── Voice Selection ──────────────────────────────────────

let _voiceCache: Map<string, SpeechSynthesisVoice> = new Map();

function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  if (_voiceCache.has(lang)) return _voiceCache.get(lang)!;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer female voices for child-friendliness
  const langVoices = voices.filter(v => v.lang.startsWith(lang.slice(0, 2)));
  const femaleVoice = langVoices.find(v =>
    /female|zira|heera|google.*female/i.test(v.name)
  );
  const selected = femaleVoice || langVoices[0] || voices[0];

  _voiceCache.set(lang, selected);
  return selected;
}

// Preload voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    _voiceCache = new Map();
  };
}

// ─── Text-to-Speech ───────────────────────────────────────

let _currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak text aloud using browser TTS.
 * Optimized for child-friendly delivery: slow, clear, Indian voices.
 */
export function speak(text: string, options: TTSOptions = {}): void {
  if (!('speechSynthesis' in window)) {
    options.onError?.('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  stop();

  const {
    rate = 0.8,
    pitch = 1.1,
    volume = 1,
    lang = 'en-IN',
    onWord,
    onEnd,
    onError,
  } = options;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  utterance.lang = lang;

  const voice = getBestVoice(lang);
  if (voice) utterance.voice = voice;

  // Word boundary events for highlighting
  if (onWord) {
    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        const word = text.substring(e.charIndex, e.charIndex + (e.charLength || 10));
        onWord(word.trim(), e.charIndex);
      }
    };
  }

  utterance.onend = () => {
    _currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = (e) => {
    _currentUtterance = null;
    onError?.(e.error || 'Speech error');
  };

  _currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing speech.
 */
export function stop(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  _currentUtterance = null;
}

/**
 * Check if currently speaking.
 */
export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

/**
 * Pause/resume speech.
 */
export function pauseSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.pause();
}

export function resumeSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.resume();
}

// ─── Speech-to-Text ───────────────────────────────────────

let _recognition: any = null;

/**
 * Check if Speech Recognition is available.
 */
export function isSTTAvailable(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Start listening for voice input.
 */
export function startListening(options: STTOptions): void {
  if (!isSTTAvailable()) {
    options.onError?.('Speech recognition not supported');
    return;
  }

  stopListening();

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  _recognition = new SpeechRecognition();

  _recognition.lang = options.lang || 'en-IN';
  _recognition.continuous = options.continuous || false;
  _recognition.interimResults = true;
  _recognition.maxAlternatives = 1;

  _recognition.onresult = (event: any) => {
    const last = event.results[event.results.length - 1];
    options.onResult({
      transcript: last[0].transcript,
      confidence: last[0].confidence || 0,
      isFinal: last.isFinal,
    });
  };

  _recognition.onend = () => {
    _recognition = null;
    options.onEnd?.();
  };

  _recognition.onerror = (event: any) => {
    options.onError?.(event.error || 'Recognition error');
    _recognition = null;
  };

  _recognition.start();
}

/**
 * Stop listening.
 */
export function stopListening(): void {
  if (_recognition) {
    try { _recognition.stop(); } catch { /* ignore */ }
    _recognition = null;
  }
}

/**
 * Check if currently listening.
 */
export function isListening(): boolean {
  return _recognition !== null;
}

// ─── Convenience ──────────────────────────────────────────

/**
 * Speak a word slowly for pronunciation practice.
 */
export function pronounceWord(word: string, lang = 'en-IN'): void {
  speak(word, { rate: 0.6, pitch: 1.0, lang });
}

/**
 * Read a sentence at child-friendly pace.
 */
export function readSentence(
  sentence: string,
  lang = 'en-IN',
  onWord?: (word: string, charIdx: number) => void,
  onEnd?: () => void
): void {
  speak(sentence, { rate: 0.75, pitch: 1.1, lang, onWord, onEnd });
}
