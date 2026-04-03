/**
 * 🎯 QuestionRenderer — BIG Immersive Question UI (Perf-Optimized)
 * ==================================================================
 * Huge readable text, massive answer tiles, warm palette.
 * CSS-only background animations, no backdrop-filter, minimal blur.
 * 60fps smooth transitions.
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Question, Difficulty } from './engine/questionGenerator';
import { DIFF_META, XP_PER_DIFFICULTY } from './DifficultySelector';

/* ── CSS keyframe injection (runs once) ── */
const STYLE_ID = 'qr-perf-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes qr-float-0 { 0%,100%{opacity:0;transform:translate(0,0) rotate(0)} 25%{opacity:.18;transform:translate(6px,-12px) rotate(10deg)} 50%{opacity:.1;transform:translate(0,0) rotate(-10deg)} 75%{opacity:.18;transform:translate(-6px,12px) rotate(0)} }
    @keyframes qr-float-1 { 0%,100%{opacity:0;transform:translate(0,0)} 30%{opacity:.16;transform:translate(-5px,-10px)} 70%{opacity:.12;transform:translate(5px,8px)} }
    @keyframes qr-sparkle { 0%,100%{opacity:0;transform:scale(.5)} 25%{opacity:.8;transform:scale(1.3)} 50%{opacity:.3;transform:scale(.8)} 75%{opacity:.8;transform:scale(1.2)} }
    @keyframes qr-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes qr-xp-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes qr-glow-pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:0;transform:scale(1.4)} }
    @keyframes qr-spin-sparkle { 0%{transform:rotate(0) scale(.7)} 50%{transform:rotate(180deg) scale(1.1)} 100%{transform:rotate(360deg) scale(.7)} }
    @keyframes qr-dot-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
    @keyframes qr-correct-glow { 0%,100%{opacity:.3} 50%{opacity:.7} }
    @keyframes qr-correct-sparkle { 0%{opacity:0; transform:scale(0) translateY(0)} 40%{opacity:1; transform:scale(1.4) translateY(-12px)} 100%{opacity:0; transform:scale(0) translateY(-30px)} }
    @keyframes qr-feedback-shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(4px)} 75%{transform:translateX(0)} }
    @keyframes qr-feedback-bounce { 0%{transform:rotate(0) scale(1)} 25%{transform:rotate(12deg) scale(1.25)} 50%{transform:rotate(-12deg) scale(1)} 75%{transform:rotate(0) scale(1.05)} 100%{transform:rotate(0) scale(1)} }
    @keyframes qr-answer-correct { 0%{transform:scale(1)} 50%{transform:scale(1.03)} 100%{transform:scale(1)} }
  `;
  document.head.appendChild(style);
}

interface Props {
  question: Question;
  questionIndex: number;          // 0-4 within mini-level
  totalInLevel: number;           // 5
  answerResults: Array<boolean | null>;
  difficulty: Difficulty;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  onSelect: (answer: string) => void;
  disabled: boolean;
  xpEarned: number;
}

/* ── CSS-only floating background shapes (no JS animation loop) ── */
const SHAPES = [
  { emoji: '⭐', x: '8%', y: '12%', size: 18, dur: 7, delay: 0, anim: 'qr-float-0' },
  { emoji: '🌸', x: '88%', y: '8%', size: 16, dur: 8, delay: 0.5, anim: 'qr-float-1' },
  { emoji: '✨', x: '5%', y: '75%', size: 14, dur: 6, delay: 0.3, anim: 'qr-float-0' },
  { emoji: '🌟', x: '92%', y: '70%', size: 16, dur: 7, delay: 0.7, anim: 'qr-float-1' },
  { emoji: '🎀', x: '50%', y: '5%', size: 14, dur: 9, delay: 0.2, anim: 'qr-float-0' },
  { emoji: '💫', x: '15%', y: '45%', size: 12, dur: 8, delay: 0.4, anim: 'qr-float-1' },
];
const FloatingShapes: React.FC = React.memo(() => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {SHAPES.map((s, i) => (
      <span key={i} style={{
        position: 'absolute', left: s.x, top: s.y, fontSize: s.size, opacity: 0,
        animation: `${s.anim} ${s.dur}s ${s.delay}s ease-in-out infinite`,
        willChange: 'transform, opacity',
      }}>{s.emoji}</span>
    ))}
  </div>
));
FloatingShapes.displayName = 'FloatingShapes';

/* ── Big progress dots (CSS animations, no backdrop-filter) ── */
const BigProgressBar: React.FC<{
  current: number; total: number; answerResults: Array<boolean | null>;
  meta: typeof DIFF_META['easy'];
}> = React.memo(({ current, total, answerResults, meta }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
    padding: 'clamp(10px, 2vh, 18px) clamp(16px, 3vw, 28px)',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.6)',
    border: '1.5px solid rgba(255,255,255,0.5)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  }}>
    {Array.from({ length: total }, (_, i) => {
      const num = i + 1;
      const result = answerResults[i] ?? null;
      const isPast = num < current + 1;
      const isCurrent = num === current + 1;
      const isAnswered = result !== null;
      const isAnswerCorrect = result === true;
      const isAnswerWrong = result === false;
      const ans = isAnswered && isCurrent;
      const statusSymbol = isAnswerCorrect
        ? String.fromCodePoint(0x2705)
        : isAnswerWrong
          ? String.fromCodePoint(0x274C)
          : null;
      return (
        <div key={i} style={{ position: 'relative' }}>
          <div style={{
            width: isCurrent ? 'clamp(44px, 7vw, 56px)' : 'clamp(36px, 5.5vw, 46px)',
            height: isCurrent ? 'clamp(44px, 7vw, 56px)' : 'clamp(36px, 5.5vw, 46px)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            fontWeight: 900,
            fontSize: statusSymbol
              ? (isCurrent ? 'clamp(18px, 2.8vw, 24px)' : 'clamp(15px, 2.2vw, 20px)')
              : isCurrent
                ? 'clamp(16px, 2.5vw, 22px)'
                : 'clamp(13px, 2vw, 18px)',
            color: statusSymbol ? 'transparent' : isAnswered ? '#fff' : isCurrent ? '#fff' : '#B0ADA8',
            background: isAnswerCorrect
              ? 'linear-gradient(135deg, #68D391, #38A169)'
              : isAnswerWrong
                ? 'linear-gradient(135deg, #FCA5A5, #F87171)'
                : isCurrent ? meta.warmGrad : 'rgba(230,228,224,0.5)',
            boxShadow: isAnswerCorrect
              ? '0 3px 10px rgba(72,187,120,0.25)'
              : isAnswerWrong
                ? '0 3px 10px rgba(248,113,113,0.28)'
                : isCurrent ? `0 3px 14px ${meta.glowColor}` : 'none',
            transition: 'all 0.3s ease',
            animation: isCurrent && !isAnswered ? 'qr-dot-pulse 1.5s ease-in-out infinite' : 'none',
          }}>
            {statusSymbol && (
              <span style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isCurrent ? 'clamp(18px, 2.8vw, 24px)' : 'clamp(15px, 2.2vw, 20px)',
                lineHeight: 1,
              }}>
                {statusSymbol}
              </span>
            )}
            {isPast ? '✓' : ans ? (isCorrect ? '✓' : '✗') : num}
          </div>
          {isCurrent && !isAnswered && (
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: `2.5px solid ${meta.glowColor}`,
              animation: 'qr-glow-pulse 2s ease-in-out infinite',
              willChange: 'transform, opacity',
            }} />
          )}
          {isPast && isAnswerCorrect && (
            <span style={{
              position: 'absolute', top: -4, right: -4, fontSize: 10, pointerEvents: 'none',
              animation: 'qr-spin-sparkle 3s linear infinite',
            }}>✨</span>
          )}
        </div>
      );
    })}
    <span style={{ fontSize: 'clamp(13px, 1.8vw, 17px)', fontWeight: 900, color: '#A09890', marginLeft: 'clamp(4px, 1vw, 10px)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
      {current + 1}/{total}
    </span>
  </div>
));
BigProgressBar.displayName = 'BigProgressBar';

/* ── Sparkle particles for correct answer (CSS-only — no motion.div) ── */
const SPARKLE_PARTICLES = [
  { x: '20%', y: '25%', size: 5, delay: 0, dur: 1 },
  { x: '75%', y: '20%', size: 4, delay: 0.15, dur: 1.2 },
  { x: '30%', y: '65%', size: 5, delay: 0.1, dur: 1.1 },
  { x: '70%', y: '70%', size: 4, delay: 0.2, dur: 1 },
];
const CorrectSparkles: React.FC = React.memo(() => (
  <>
    {SPARKLE_PARTICLES.map((p, i) => (
      <div key={i}
        style={{
          position: 'absolute', left: p.x, top: p.y,
          width: p.size, height: p.size, borderRadius: '50%',
          background: 'rgba(72,187,120,0.7)',
          pointerEvents: 'none', zIndex: 30,
          willChange: 'transform, opacity',
          animation: `qr-correct-sparkle ${p.dur}s ${p.delay}s ease-out forwards`,
        }}
      />
    ))}
  </>
));
CorrectSparkles.displayName = 'CorrectSparkles';

/* ── Static animation presets (module-level = no GC churn) ── */
const HOVER_ACTIVE = { scale: 1.025, y: -3 };
const HOVER_DISABLED = {};
const TAP_ACTIVE = { scale: 0.97 };
const TAP_DISABLED = {};

/* ── Memoized Answer Option (prevents re-render of all 4 when only 1 changes) ── */
interface AnswerOptionProps {
  opt: string;
  index: number;
  questionId: string;
  isSelected: boolean;
  showCorrect: boolean;
  showWrong: boolean;
  answered: boolean;
  disabled: boolean;
  meta: typeof DIFF_META['easy'];
  onSelect: (opt: string) => void;
}

const AnswerOption: React.FC<AnswerOptionProps> = React.memo(({
  opt, index, questionId, isSelected, showCorrect, showWrong,
  answered, disabled, meta, onSelect,
}) => {
  const handleClick = useCallback(() => onSelect(opt), [onSelect, opt]);

  const tileBg = showCorrect
    ? 'linear-gradient(135deg, rgba(198,246,213,0.9), rgba(154,230,180,0.6))'
    : showWrong
      ? 'linear-gradient(135deg, rgba(254,215,215,0.9), rgba(252,165,165,0.6))'
      : isSelected
        ? 'linear-gradient(135deg, rgba(255,248,220,0.7), rgba(253,230,138,0.4))'
        : 'rgba(255,255,255,0.65)';
  const tileBorder = showCorrect
    ? '2.5px solid #48BB78'
    : showWrong
      ? '2.5px solid #FC8181'
      : isSelected
        ? '2.5px solid #F6C343'
        : '2px solid rgba(226,232,240,0.4)';
  const tileShadow = showCorrect
    ? '0 6px 24px rgba(72,187,120,0.25), 0 2px 8px rgba(72,187,120,0.15)'
    : showWrong
      ? '0 6px 24px rgba(252,129,129,0.25), 0 2px 8px rgba(252,129,129,0.15)'
      : '0 3px 14px rgba(0,0,0,0.04)';

  const dimmed = disabled && !isSelected && !showCorrect;

  return (
    <button
      key={`${questionId}_${opt}`}
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 22,
        padding: 'clamp(20px, 3.5vh, 30px) clamp(18px, 3vw, 28px)',
        minHeight: 'clamp(70px, 10vh, 85px)',
        border: tileBorder,
        background: tileBg,
        color: showCorrect ? '#276749' : showWrong ? '#9B2C2C' : '#4A4540',
        boxShadow: tileShadow,
        opacity: dimmed ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        transition: 'opacity 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s',
        transform: showCorrect ? 'scale(1)' : showWrong ? 'none' : 'scale(1)',
        animation: showCorrect ? 'qr-answer-correct 0.35s ease-out' : showWrong ? 'qr-feedback-shake 0.5s ease-out' : 'none',
      }}
    >
      {/* Correct answer glow effect — CSS animation */}
      {showCorrect && (
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: 22,
            background: 'radial-gradient(circle at 50% 50%, rgba(72,187,120,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'qr-correct-glow 1.5s ease-in-out infinite',
          }}
        />
      )}
      <span style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)' }}>
        {/* Letter badge */}
        <span style={{
          width: 'clamp(48px, 7vw, 60px)',
          height: 'clamp(48px, 7vw, 60px)',
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(18px, 2.8vw, 24px)',
          fontWeight: 900,
          background: showCorrect ? '#48BB78' : showWrong ? '#FC8181' : meta.warmGrad,
          color: '#fff',
          boxShadow: showCorrect
            ? '0 3px 12px rgba(72,187,120,0.35)'
            : showWrong
              ? '0 3px 12px rgba(252,129,129,0.35)'
              : `0 3px 12px ${meta.glowColor}`,
          flexShrink: 0,
          position: 'relative',
        }}>
          {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + index)}
          <span style={{
            position: 'absolute', inset: 0, borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
        </span>
        {/* Option text */}
        <span style={{
          flex: 1,
          fontSize: 'clamp(19px, 3.2vw, 28px)',
          fontWeight: 700,
          lineHeight: 1.3,
        }}>
          {opt}
        </span>
        {/* Correct sparkle */}
        {showCorrect && (
          <span style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', display: 'inline-block' }}>
            ✨
          </span>
        )}
      </span>
    </button>
  );
});
AnswerOption.displayName = 'AnswerOption';

export const QuestionRenderer: React.FC<Props> = React.memo(({
  question, questionIndex, totalInLevel, answerResults, difficulty,
  selectedAnswer, isCorrect, onSelect, disabled, xpEarned,
}) => {
  const meta = DIFF_META[difficulty];
  const answered = selectedAnswer !== null;

  const parsedQuestion = useMemo(() => {
    const raw = (question.text || '').trim();
    const m = raw.match(/^\[([^\]]+)\]\s*/);
    const unit = m ? m[1] : '';
    const body = m ? raw.slice(m[0].length) : raw;
    const lines = body.split('\n').map(s => s.trim()).filter(Boolean);
    return { unit, lines };
  }, [question.text]);

  const barChartData = useMemo(() => {
    if (parsedQuestion.lines.length < 3) return null;
    const title = parsedQuestion.lines[0];
    if (!/read/i.test(title) || !/(data|chart|graph)/i.test(title)) return null;

    const rows: Array<{ label: string; value: number }> = [];
    for (let i = 1; i < parsedQuestion.lines.length; i++) {
      const line = parsedQuestion.lines[i];
      const m = line.match(/^([^:]+):.*\(([-]?\d+)\)\s*$/);
      if (!m) continue;
      rows.push({ label: m[1].trim(), value: Number(m[2]) });
    }
    if (rows.length < 2) return null;

    const lastLine = parsedQuestion.lines[parsedQuestion.lines.length - 1] || '';
    const prompt = /value|how many|which/i.test(lastLine) ? lastLine : 'Read the graph and answer.';
    const maxValue = Math.max(...rows.map(r => r.value), 1);
    return { title, rows, prompt, maxValue };
  }, [parsedQuestion.lines]);

  /* sparkle positions for card background — static */
  const CARD_SPARKLES = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      x: `${10 + (i * 22) % 80}%`,
      y: `${8 + (i * 24) % 72}%`,
      size: 2 + (i % 2),
      delay: i * 0.6,
      dur: 2.8 + (i % 2) * 0.6,
    })), []);

  /* Memoize onSelect callback to prevent child re-renders */
  const stableOnSelect = useCallback((opt: string) => {
    if (!disabled) onSelect(opt);
  }, [disabled, onSelect]);

  return (
    <motion.div
      style={{ width: '100%', maxWidth: '75%', margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vh, 28px)', padding: 'clamp(4px, 1vh, 12px) 0', willChange: 'transform, opacity', minWidth: 320 }}
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ── Floating background shapes ── */}
      <FloatingShapes />

      {/* ── Big Animated Progress Dots ── */}
      <BigProgressBar current={questionIndex} total={totalInLevel} answerResults={answerResults} meta={meta} />

      {/* ── XP Badge — CSS animation, no backdrop-filter ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: 'clamp(6px, 1vh, 10px) clamp(12px, 2vw, 18px)',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(255,251,235,0.92), rgba(254,243,199,0.85))',
            border: '1.5px solid rgba(245,158,11,0.2)',
            boxShadow: '0 2px 8px rgba(245,158,11,0.1)',
            animation: 'qr-xp-bob 3.5s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>✨</span>
          <span style={{ fontWeight: 900, color: '#D97706', fontSize: 'clamp(13px, 1.8vw, 17px)', fontVariantNumeric: 'tabular-nums' }}>
            {xpEarned} XP
          </span>
        </div>
      </div>

      {/* ── Question Card — lightweight glow, no heavy blur ── */}
      <div style={{ position: 'relative', animation: 'qr-bob 5s ease-in-out infinite' }}>
        {/* Single soft glow behind card */}
        <div style={{
          position: 'absolute', inset: 6, borderRadius: 32,
          boxShadow: `0 8px 32px ${meta.glowColor}`,
          zIndex: 0, pointerEvents: 'none',
        }} />

        <div
          style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: 28,
            background: 'rgba(255,255,255,0.88)',
            border: '2px solid rgba(255,255,255,0.65)',
            padding: 'clamp(28px, 5vh, 48px) clamp(20px, 4vw, 40px)',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.7), 0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          {/* Inner gloss arc */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-[200%] h-32 pointer-events-none opacity-25"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, transparent 70%)' }}
          />

          {/* Gradient blobs — smaller, no blur-3xl */}
          <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${meta.gradient} rounded-full opacity-[0.06] blur-2xl pointer-events-none`} />
          <div className={`absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr ${meta.gradient} rounded-full opacity-[0.04] blur-2xl pointer-events-none`} />

          {/* Card sparkles — CSS animation only */}
          {CARD_SPARKLES.map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', left: s.x, top: s.y,
                width: s.size, height: s.size, borderRadius: '50%',
                background: 'rgba(255,255,255,0.7)', pointerEvents: 'none', zIndex: 0,
                animation: `qr-sparkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
                willChange: 'transform, opacity',
              }}
            />
          ))}

          {/* Hint badge — CSS bob */}
          {question.hint && selectedAnswer === null && (
            <div
              style={{ marginBottom: 16, position: 'relative', zIndex: 10 }}
            >
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: 'clamp(8px, 1.5vh, 14px) clamp(14px, 2.5vw, 22px)',
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, rgba(255,251,235,0.92), rgba(254,243,199,0.85))',
                  border: '1.5px solid rgba(245,158,11,0.18)',
                  boxShadow: '0 2px 10px rgba(245,158,11,0.08)',
                  animation: 'qr-xp-bob 3s ease-in-out infinite',
                }}
              >
                <span style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}>💡</span>
                <span style={{ fontSize: 'clamp(13px, 1.7vw, 17px)', fontWeight: 700, color: '#B45309' }}>{question.hint}</span>
              </div>
            </div>
          )}

          {/* Question text — styled, high-contrast, chapter-friendly */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(8px, 1.4vh, 14px)',
              textAlign: 'center',
              padding: 'clamp(8px, 2vh, 20px) 0',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {parsedQuestion.unit && (
              <div
                style={{
                  fontSize: 'clamp(15px, 2.3vw, 22px)',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: 'clamp(6px, 1vh, 10px) clamp(12px, 2vw, 18px)',
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${meta.glowColor}, rgba(255,255,255,0.95))`,
                  border: '1.5px solid rgba(255,255,255,0.75)',
                  color: '#7C2D12',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                }}
              >
                {parsedQuestion.unit}
              </div>
            )}

            <div
              style={{
                width: '100%',
                fontSize: 'clamp(25px, 5vw, 42px)',
                fontWeight: 900,
                color: '#2F2A24',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                textShadow: '0 2px 8px rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {barChartData ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vh, 16px)' }}>
                  <div style={{ color: '#1F2937', fontSize: 'clamp(30px, 5.6vw, 46px)', fontWeight: 900 }}>
                    {barChartData.title}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: 20,
                      padding: 'clamp(10px, 2vh, 16px)',
                      background: 'linear-gradient(180deg, rgba(241,245,249,0.9), rgba(226,232,240,0.75))',
                      border: '1.5px solid rgba(148,163,184,0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'clamp(8px, 1.2vh, 12px)',
                    }}
                  >
                    {barChartData.rows.map((row, idx) => {
                      const pct = Math.max(8, Math.round((row.value / barChartData.maxValue) * 100));
                      const gradients = [
                        'linear-gradient(135deg, #3B82F6, #06B6D4)',
                        'linear-gradient(135deg, #22C55E, #14B8A6)',
                        'linear-gradient(135deg, #F59E0B, #F97316)',
                        'linear-gradient(135deg, #A855F7, #EC4899)',
                      ];
                      return (
                        <div key={`${row.label}_${idx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 1fr) 3fr auto', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 'clamp(18px, 2.8vw, 26px)', fontWeight: 800, color: '#334155', textTransform: 'capitalize' }}>
                            {row.label}
                          </div>
                          <div style={{ height: 'clamp(24px, 3.8vh, 34px)', borderRadius: 999, background: 'rgba(148,163,184,0.22)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                borderRadius: 999,
                                background: gradients[idx % gradients.length],
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 'clamp(18px, 2.8vw, 26px)', fontWeight: 900, color: '#1E293B', minWidth: 44 }}>
                            ({row.value})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ color: '#3F3A34', fontSize: 'clamp(24px, 4.6vw, 38px)', fontWeight: 900 }}>
                    {barChartData.prompt}
                  </div>
                </div>
              ) : parsedQuestion.lines.length > 0 ? (
                parsedQuestion.lines.map((line, idx) => (
                  <div
                    key={`${idx}_${line}`}
                    style={{
                      marginTop: idx === 0 ? 0 : 'clamp(2px, 0.6vh, 8px)',
                      color: idx === 0 ? '#1F2937' : '#3F3A34',
                      fontSize: idx === 0 ? 'clamp(30px, 5.6vw, 46px)' : 'clamp(24px, 4.6vw, 38px)',
                    }}
                  >
                    {line}
                  </div>
                ))
              ) : (
                question.text
              )}
            </div>
          </div>

          {/* ── Options — Memoized answer tiles with pointer-events guard ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vh, 18px)',
            position: 'relative', zIndex: 10, marginTop: 'clamp(12px, 2.5vh, 24px)',
            pointerEvents: disabled ? 'none' : 'auto',
          }}>
            {question.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const showCorrect = answered && opt === question.correctAnswer;
              const showWrong = isSelected && isCorrect === false;

              return (
                <AnswerOption
                  key={`${question.id}_${opt}`}
                  opt={opt}
                  index={i}
                  questionId={question.id}
                  isSelected={isSelected}
                  showCorrect={showCorrect}
                  showWrong={showWrong}
                  answered={answered}
                  disabled={disabled}
                  meta={meta}
                  onSelect={stableOnSelect}
                />
              );
            })}
          </div>

          {/* ── Feedback Overlay — CSS transitions, no AnimatePresence ── */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 28,
              pointerEvents: 'none',
              background: answered
                ? isCorrect
                  ? 'radial-gradient(circle at center, rgba(72,187,120,0.14) 0%, transparent 70%)'
                  : 'radial-gradient(circle at center, rgba(245,158,11,0.12) 0%, transparent 70%)'
                : 'transparent',
              border: answered
                ? isCorrect
                  ? '2px solid rgba(72,187,120,0.2)'
                  : '2px solid rgba(245,158,11,0.2)'
                : '2px solid transparent',
              opacity: answered ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          >
            {answered && isCorrect && <CorrectSparkles />}
            {answered && (
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: 'clamp(48px, 8vw, 72px)', display: 'block', marginBottom: 4,
                    animation: isCorrect ? 'qr-feedback-bounce 0.7s ease-out' : 'qr-feedback-shake 0.5s ease-out',
                  }}
                >
                  {isCorrect ? '🎉' : '💡'}
                </span>
                <span style={{
                  fontSize: 'clamp(15px, 2.2vw, 20px)',
                  fontWeight: 900,
                  color: isCorrect ? '#276749' : '#B7791F',
                }}>
                  {isCorrect ? `Correct! +${XP_PER_DIFFICULTY[difficulty]} XP` : `It's ${question.correctAnswer}!`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

QuestionRenderer.displayName = 'QuestionRenderer';
