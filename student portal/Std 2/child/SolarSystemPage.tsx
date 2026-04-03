/**
 * child/SolarSystemPage.tsx
 * ─────────────────────────────────────────────────────
 * Space & Earth Academy — Educational level-based game
 *
 * Features:
 *  • 10 themed worlds with infinite procedural levels
 *  • Each level = 5 sub-level questions (content + math)
 *  • Daily limit: 10 levels per day, 24h cooldown
 *  • Progress tracking per world
 *  • Mascot integration for engagement
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascotTrigger } from './useMascotController';
import {
  WORLDS, generateLevel, QUESTIONS_PER_LEVEL,
  loadDailyProgress, saveDailyProgress, getDailyStatus, recordLevelComplete,
  type EduWorld, type EduQuestion, type DailyProgress, type DailyStatus,
} from './spaceEducationData';

/* ── Sound helpers ──────────────────────────────── */

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playSelect() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.value = 520;
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function playCorrect() {
  if (!audioCtx) return;
  [660, 880].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.25);
    osc.start(audioCtx.currentTime + i * 0.12);
    osc.stop(audioCtx.currentTime + i * 0.12 + 0.25);
  });
}

function playWrong() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square'; osc.frequency.value = 180;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

/* ── Starfield Background ──────────────────────── */

const Starfield: React.FC = React.memo(() => {
  const stars = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      dur: Math.random() * 4 + 2,
    }))
  , []);

  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' }}>
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, background: '#fff' }}
          animate={{ opacity: [s.opacity, 0.1, s.opacity] }}
          transition={{ duration: s.dur, repeat: Infinity }}
        />
      ))}
    </div>
  );
});
Starfield.displayName = 'Starfield';

/* ── World Map ─────────────────────────────────── */

const WorldMap: React.FC<{
  daily: DailyProgress;
  status: DailyStatus;
  onSelect: (w: EduWorld) => void;
  onBack: () => void;
}> = React.memo(({ daily, status, onSelect, onBack }) => (
  <motion.div
    className="absolute inset-0 flex flex-col p-4"
    style={{ zIndex: 30, overflowY: 'auto' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {/* Back + Stats */}
    <div className="flex items-center justify-between mb-2 mt-1 shrink-0">
      <motion.button
        onClick={onBack}
        className="cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '8px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#e2e8f0', fontSize: 14, fontWeight: 700,
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        ← Back
      </motion.button>
      <div className="flex items-center gap-2">
        <div style={{
          padding: '4px 12px', borderRadius: 10,
          background: status.canPlay ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${status.canPlay ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: status.canPlay ? '#22c55e' : '#ef4444',
          fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
        }}>
          🎮 {status.remaining} left today
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 10,
          background: 'rgba(168,85,247,0.15)',
          border: '1px solid rgba(168,85,247,0.3)',
          color: '#a855f7', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
        }}>
          ⭐ {daily.totalCompleted}
        </div>
      </div>
    </div>

    {/* Title */}
    <motion.h2
      initial={{ y: -15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900,
        textAlign: 'center', margin: '8px 0 4px',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      <span>{'\u{1F30D}'}</span>{' '}
      <span style={{
        background: 'linear-gradient(135deg, #3b82f6, #a78bfa, #fbbf24)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>Eco System</span>
    </motion.h2>
    <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 16, fontFamily: 'Nunito, sans-serif' }}>
      Choose a world to explore
    </p>

    {/* World Grid */}
    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full pb-20">
      {WORLDS.map((w, i) => {
        const lvl = daily.worldLevels[w.id] || 0;
        return (
          <motion.button
            key={w.id}
            onClick={() => { playSelect(); onSelect(w); }}
            className="cursor-pointer text-left"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${w.glowColor}` }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '14px', borderRadius: 16,
              background: `linear-gradient(135deg, ${w.color}12, ${w.color}06)`,
              border: `2px solid ${w.color}30`,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span style={{ fontSize: 28 }}>{w.icon}</span>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 800 }}>{w.name}</div>
                <div style={{ color: w.color, fontSize: 11, fontWeight: 700 }}>
                  Level {lvl + 1}
                </div>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4, margin: 0 }}>
              {w.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
));
WorldMap.displayName = 'WorldMap';

/* ── Level Complete Overlay ────────────────────── */

const LevelCompleteOverlay: React.FC<{
  world: EduWorld;
  levelNum: number;
  score: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  canPlayMore: boolean;
}> = ({ world, levelNum, score, total, onNext, onBack, canPlayMore }) => {
  const stars = score === total ? 3 : score >= total * 0.6 ? 2 : 1;
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 55, background: 'rgba(2,6,23,0.95)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ maxWidth: 400 }}
      >
        <motion.div
          style={{ fontSize: 64, marginBottom: 12 }}
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '✨'}
        </motion.div>
        <h2 style={{
          fontSize: 28, fontWeight: 900, color: '#f1f5f9',
          fontFamily: 'Nunito, sans-serif', marginBottom: 4,
        }}>
          Level {levelNum} Complete!
        </h2>
        <p style={{
          color: world.color, fontSize: 16, fontWeight: 700,
          marginBottom: 16, fontFamily: 'Nunito, sans-serif',
        }}>
          {world.icon} {world.name}
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-4">
          {[1, 2, 3].map(s => (
            <motion.span
              key={s}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5 + s * 0.2, type: 'spring', stiffness: 200 }}
              style={{ fontSize: 40, opacity: s <= stars ? 1 : 0.15 }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <p style={{
          color: '#94a3b8', fontSize: 14, marginBottom: 20,
          fontFamily: 'Nunito, sans-serif',
        }}>
          {score}/{total} correct
        </p>

        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={onBack}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px', borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#e2e8f0', fontSize: 16, fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🗺️ Worlds
          </motion.button>
          {canPlayMore && (
            <motion.button
              onClick={onNext}
              className="cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 24px', borderRadius: 14,
                background: `linear-gradient(135deg, ${world.color}, ${world.color}cc)`,
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              🚀 Next Level
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Daily Limit Overlay ───────────────────────── */

const DailyLimitOverlay: React.FC<{
  unlockTime: number;
  totalCompleted: number;
  onBack: () => void;
}> = ({ unlockTime, totalCompleted, onBack }) => {
  const [remaining, setRemaining] = React.useState('');

  useEffect(() => {
    const tick = () => {
      const maxCooldown = 24 * 60 * 60 * 1000;
      const diff = Math.min(Math.max(0, unlockTime - Date.now()), maxCooldown);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlockTime]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 60, background: 'rgba(2,6,23,0.97)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <motion.div
          style={{ fontSize: 72, marginBottom: 16 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          😴
        </motion.div>
        <h2 style={{
          fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900,
          color: '#f1f5f9', fontFamily: 'Nunito, sans-serif', marginBottom: 8,
        }}>
          Great job today!
        </h2>
        <p style={{
          color: '#94a3b8', fontSize: 16,
          fontFamily: 'Nunito, sans-serif', marginBottom: 8,
        }}>
          You completed 10 levels! Come back tomorrow 🌅
        </p>
        <div style={{
          fontSize: 'clamp(28px, 7vw, 44px)', fontWeight: 900,
          color: '#3b82f6', fontFamily: 'monospace', margin: '16px 0',
        }}>
          {remaining}
        </div>
        <p style={{
          color: '#a855f7', fontSize: 14, fontWeight: 700,
          marginBottom: 24, fontFamily: 'Nunito, sans-serif',
        }}>
          ⭐ Total levels completed: {totalCompleted}
        </p>
        <motion.button
          onClick={onBack}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '14px 32px', borderRadius: 14,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#e2e8f0', fontSize: 16, fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          ← Back to Home
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

/* ── MAIN COMPONENT ─────────────────────────────── */

type Phase = 'splash' | 'worlds' | 'playing' | 'complete' | 'locked';

interface Props {
  onBack: () => void;
}

const SolarSystemPage: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('splash');
  const [daily, setDaily] = useState<DailyProgress>(() => loadDailyProgress());
  const [world, setWorld] = useState<EduWorld | null>(null);
  const [levelNum, setLevelNum] = useState(1);
  const [questions, setQuestions] = useState<EduQuestion[]>([]);
  const [sub, setSub] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const triggerMascot = useMascotTrigger();

  /* Compute daily status */
  const status = useMemo<DailyStatus>(() => getDailyStatus(daily), [daily]);

  /* Auto-dismiss splash */
  useEffect(() => {
    const t = setTimeout(() => setPhase('worlds'), 2200);
    return () => clearTimeout(t);
  }, []);

  /* Select a world → start its next level */
  const selectWorld = useCallback((w: EduWorld) => {
    const fresh = loadDailyProgress();
    const st = getDailyStatus(fresh);
    setDaily(fresh);

    if (!st.canPlay) {
      setPhase('locked');
      return;
    }

    // Reset counter if cooldown has passed
    if (fresh.levelsToday >= 10 && st.canPlay) {
      fresh.levelsToday = 0;
      fresh.lastBatchTimestamp = 0;
      saveDailyProgress(fresh);
      setDaily(fresh);
    }

    const nextLvl = (fresh.worldLevels[w.id] || 0) + 1;
    const qs = generateLevel(w.id, nextLvl);

    setWorld(w);
    setLevelNum(nextLvl);
    setQuestions(qs);
    setSub(0);
    setScore(0);
    setPicked(null);
    setCorrect(null);
    setPhase('playing');
  }, []);

  /* Handle answer pick */
  const handleAnswer = useCallback((idx: number) => {
    if (picked !== null) return;
    if (audioCtx?.state === 'suspended') audioCtx.resume();

    setPicked(idx);
    const isRight = idx === questions[sub].correct;
    setCorrect(isRight);

    if (isRight) { playCorrect(); setScore(s => s + 1); triggerMascot('happy'); }
    else { playWrong(); triggerMascot('encourage'); }

    setTimeout(() => {
      if (sub < QUESTIONS_PER_LEVEL - 1) {
        // Next sub-level
        setSub(s => s + 1);
        setPicked(null);
        setCorrect(null);
      } else {
        // Level complete
        if (world) {
          const finalScore = score + (isRight ? 1 : 0);
          if (finalScore >= QUESTIONS_PER_LEVEL * 0.6) triggerMascot('celebrate', 2500);

          const updated = recordLevelComplete(daily, world.id, levelNum);
          saveDailyProgress(updated);
          setDaily(updated);

          const nextStatus = getDailyStatus(updated);
          setPhase(nextStatus.canPlay ? 'complete' : 'locked');
        }
      }
    }, 1500);
  }, [picked, questions, sub, score, world, levelNum, daily, triggerMascot]);

  /* Play next level (same world) */
  const playNext = useCallback(() => {
    if (!world) return;
    selectWorld(world);
  }, [world, selectWorld]);

  /* Back to worlds */
  const backToWorlds = useCallback(() => {
    setPhase('worlds');
    setWorld(null);
  }, []);

  /* Current question */
  const q = questions[sub];

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <Starfield />

      {/* ── Splash ─────────────────────────────── */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 60, background: 'rgba(2,6,23,0.97)' }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              style={{ fontSize: 80 }}
            >
              {'\u{1F30D}'}
            </motion.div>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: 'clamp(28px, 7vw, 44px)', fontWeight: 900,
                background: 'linear-gradient(135deg, #3b82f6, #a78bfa, #fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textAlign: 'center',
              }}
            >
              ECO SYSTEM
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ color: '#94a3b8', fontSize: 16 }}
            >
              10 worlds of knowledge await!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── World Map ──────────────────────────── */}
      <AnimatePresence>
        {phase === 'worlds' && (
          <WorldMap daily={daily} status={status} onSelect={selectWorld} onBack={onBack} />
        )}
      </AnimatePresence>

      {/* ── Level Play ─────────────────────────── */}
      <AnimatePresence>
        {phase === 'playing' && world && q && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center p-5"
            style={{ zIndex: 40 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* HUD */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between" style={{ zIndex: 42 }}>
              <motion.button
                onClick={backToWorlds}
                className="cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                ← Worlds
              </motion.button>
              <div style={{
                padding: '4px 12px', borderRadius: 10,
                background: `${world.color}18`,
                border: `1px solid ${world.color}40`,
                color: world.color, fontSize: 12, fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
              }}>
                {world.icon} Level {levelNum}
              </div>
            </div>

            {/* Sub-level dots */}
            <div className="flex items-center gap-2 mb-5">
              {Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: i === sub ? 1.3 : 1 }}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: i < sub ? '#22c55e' : i === sub ? world.color : 'rgba(255,255,255,0.15)',
                    border: i === sub ? `2px solid ${world.color}` : 'none',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>

            {/* World icon */}
            <motion.div
              style={{ fontSize: 48, marginBottom: 10 }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {world.icon}
            </motion.div>

            {/* Question */}
            <motion.h2
              key={`q-${sub}`}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{
                color: '#f1f5f9', fontSize: 'clamp(17px, 4.5vw, 24px)', fontWeight: 800,
                fontFamily: 'Nunito, sans-serif', textAlign: 'center',
                marginBottom: 20, maxWidth: 500, lineHeight: 1.4,
              }}
            >
              {q.question}
            </motion.h2>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {q.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.08)';
                let border = 'rgba(255,255,255,0.15)';
                if (picked !== null) {
                  if (i === q.correct) { bg = 'rgba(34,197,94,0.3)'; border = '#22c55e'; }
                  else if (i === picked && !correct) { bg = 'rgba(239,68,68,0.3)'; border = '#ef4444'; }
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={picked !== null}
                    className="cursor-pointer"
                    whileHover={picked === null ? { scale: 1.03 } : {}}
                    whileTap={picked === null ? { scale: 0.97 } : {}}
                    style={{
                      padding: '14px 10px', borderRadius: 14,
                      background: bg, border: `2px solid ${border}`,
                      color: '#e2e8f0', fontSize: 'clamp(13px, 3.5vw, 16px)',
                      fontWeight: 700, fontFamily: 'Nunito, sans-serif',
                      transition: 'all 0.3s',
                    }}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {picked !== null && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center mt-4"
                >
                  <p style={{
                    color: correct ? '#22c55e' : '#ef4444', fontSize: 18,
                    fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 4,
                  }}>
                    {correct ? '✓ Correct!' : `✗ ${q.options[q.correct]}`}
                  </p>
                  <p style={{
                    color: '#94a3b8', fontSize: 13,
                    fontFamily: 'Nunito, sans-serif', maxWidth: 400,
                  }}>
                    💡 {q.tip}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Level Complete ─────────────────────── */}
      <AnimatePresence>
        {phase === 'complete' && world && (
          <LevelCompleteOverlay
            world={world}
            levelNum={levelNum}
            score={score}
            total={QUESTIONS_PER_LEVEL}
            onNext={playNext}
            onBack={backToWorlds}
            canPlayMore={getDailyStatus(daily).canPlay}
          />
        )}
      </AnimatePresence>

      {/* ── Daily Limit ────────────────────────── */}
      <AnimatePresence>
        {phase === 'locked' && (
          <DailyLimitOverlay
            unlockTime={status.unlockTime || Date.now() + 86400000}
            totalCompleted={daily.totalCompleted}
            onBack={onBack}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SolarSystemPage;
