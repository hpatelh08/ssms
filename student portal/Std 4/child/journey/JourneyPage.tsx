/**
 * child/journey/JourneyPage.tsx
 * ─────────────────────────────────────────────────────
 * Treasure Map Achievement System
 *
 * Horizontal scrollable treasure map where students unlock
 * achievement boxes every 50 completed levels.
 *
 * Assets:
 *  - Background: /assets/journy/background/background.png
 *  - Closed box: /assets/journy/level-button/after-complete-level(close-box).png
 *  - Open box:   /assets/journy/level-button/open-box.png
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getJourneyProgress,
  LEVELS_PER_ACHIEVEMENT,
  JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT,
  type JourneyProgress,
  type JourneyAchievementUnlockedDetail,
} from './journeyProgress';
import GameProgressDetail, { type GameKey } from './GameProgressDetail';

/* ── Assets ─────────────────────────────────────── */
const BG_SRC = '/assets/journy/background/background.png';
const CLOSED_BOX_SRC = '/assets/journy/level-button/after-complete-level(close-box).png';
const OPEN_BOX_SRC = '/assets/journy/level-button/open-box.png';

/* ── Config ─────────────────────────────────────── */
const TOTAL_JOURNEY_LEVELS = 4800;
const TOTAL_BOXES = Math.ceil(TOTAL_JOURNEY_LEVELS / LEVELS_PER_ACHIEVEMENT); // 96 achievements (50 levels each)
const BOXES_PER_ROW = 8;

/* ── Achievement popup data ─────────────────────── */
interface AchievementInfo {
  boxNum: number;
  levelsNeeded: number;
  achievementName?: string;
  achievementEmoji?: string;
}

const ACHIEVEMENTS_BY_GAME: Record<string, Array<{ emoji: string; name: string }>> = {
  arcade: [
    { emoji: '🎮', name: 'Arcade Starter' }, { emoji: '🕹️', name: 'Arcade Player' },
    { emoji: '🚀', name: 'Arcade Explorer' }, { emoji: '⚡', name: 'Arcade Challenger' },
    { emoji: '🎯', name: 'Arcade Sharpshooter' }, { emoji: '🔥', name: 'Arcade Blazer' },
    { emoji: '🧠', name: 'Arcade Strategist' }, { emoji: '🏅', name: 'Arcade Skilled' },
    { emoji: '🏆', name: 'Arcade Champion' }, { emoji: '💎', name: 'Arcade Elite' },
    { emoji: '👑', name: 'Arcade King' }, { emoji: '🌟', name: 'Arcade Legend' },
    { emoji: '⚔️', name: 'Arcade Warrior' }, { emoji: '🛡️', name: 'Arcade Defender' },
    { emoji: '🏹', name: 'Arcade Master' }, { emoji: '🌠', name: 'Arcade Ultimate' },
  ],
  math: [
    { emoji: '🔢', name: 'Number Starter' }, { emoji: '➕', name: 'Addition Explorer' },
    { emoji: '➖', name: 'Subtraction Solver' }, { emoji: '✖️', name: 'Multiplication Master' },
    { emoji: '➗', name: 'Division Expert' }, { emoji: '🧮', name: 'Math Learner' },
    { emoji: '📊', name: 'Data Explorer' }, { emoji: '📈', name: 'Pattern Finder' },
    { emoji: '📉', name: 'Number Analyzer' }, { emoji: '🔍', name: 'Logic Thinker' },
    { emoji: '🧠', name: 'Smart Calculator' }, { emoji: '💡', name: 'Idea Solver' },
    { emoji: '🧩', name: 'Equation Builder' }, { emoji: '📐', name: 'Geometry Starter' },
    { emoji: '📏', name: 'Measurement Master' }, { emoji: '🔺', name: 'Shape Identifier' },
    { emoji: '🔷', name: 'Polygon Explorer' }, { emoji: '🟦', name: 'Area Finder' },
    { emoji: '🟩', name: 'Perimeter Master' }, { emoji: '🧠', name: 'Math Strategist' },
    { emoji: '⚡', name: 'Quick Calculator' }, { emoji: '🎯', name: 'Accurate Solver' },
    { emoji: '📊', name: 'Math Analyst' }, { emoji: '🔬', name: 'Number Scientist' },
    { emoji: '🧭', name: 'Logic Navigator' }, { emoji: '🏆', name: 'Math Achiever' },
    { emoji: '🥇', name: 'Math Champion' }, { emoji: '💎', name: 'Math Elite' },
    { emoji: '👑', name: 'Math King' }, { emoji: '🌟', name: 'Math Legend' },
    { emoji: '🚀', name: 'Math Explorer' }, { emoji: '⚙️', name: 'Math Engineer' },
    { emoji: '🔢', name: 'Number Genius' }, { emoji: '📊', name: 'Math Mastermind' },
    { emoji: '🧮', name: 'Math Grandmaster' }, { emoji: '🏆', name: 'Ultimate Mathematician' },
  ],
  english: [
    { emoji: '🔤', name: 'Alphabet Starter' }, { emoji: '📖', name: 'Word Reader' },
    { emoji: '✏️', name: 'Sentence Builder' }, { emoji: '📝', name: 'Grammar Learner' },
    { emoji: '📚', name: 'Story Reader' }, { emoji: '🔍', name: 'Vocabulary Finder' },
    { emoji: '🗣️', name: 'Speaker Starter' }, { emoji: '🎤', name: 'Pronunciation Master' },
    { emoji: '📘', name: 'Chapter Explorer' }, { emoji: '📖', name: 'Story Analyzer' },
    { emoji: '🧠', name: 'Language Thinker' }, { emoji: '💬', name: 'Conversation Builder' },
    { emoji: '✍️', name: 'Writing Starter' }, { emoji: '📝', name: 'Paragraph Writer' },
    { emoji: '📑', name: 'Essay Builder' }, { emoji: '📖', name: 'Reading Expert' },
    { emoji: '🧩', name: 'Word Puzzle Solver' }, { emoji: '🔡', name: 'Spelling Master' },
    { emoji: '🧠', name: 'Language Strategist' }, { emoji: '📚', name: 'Knowledge Reader' },
    { emoji: '⚡', name: 'Fast Reader' }, { emoji: '🎯', name: 'Accurate Writer' },
    { emoji: '📘', name: 'Book Explorer' }, { emoji: '🔍', name: 'Meaning Finder' },
    { emoji: '🗝️', name: 'Word Unlocker' }, { emoji: '🏆', name: 'English Achiever' },
    { emoji: '🥇', name: 'English Champion' }, { emoji: '💎', name: 'English Elite' },
    { emoji: '👑', name: 'English King' }, { emoji: '🌟', name: 'English Legend' },
    { emoji: '🚀', name: 'Language Explorer' }, { emoji: '📜', name: 'Literature Lover' },
    { emoji: '✨', name: 'Creative Writer' }, { emoji: '🧠', name: 'Word Genius' },
    { emoji: '📚', name: 'Language Master' }, { emoji: '🏆', name: 'Ultimate English Master' },
  ],
  'odd-one-out': [
    { emoji: '🧩', name: 'Pattern Finder' },
    { emoji: '🔍', name: 'Odd Detector' },
    { emoji: '🧠', name: 'Logic Master' },
    { emoji: '🏆', name: 'Puzzle Champion' },
  ],
  'word-builder': [
    { emoji: '🧱', name: 'Builder Starter' },
    { emoji: '🏗️', name: 'Structure Creator' },
    { emoji: '🌆', name: 'City Designer' },
    { emoji: '👑', name: 'World Architect' },
  ],
};

const BOX_CATEGORY_CYCLE = ['arcade', 'english', 'math', 'odd-one-out', 'word-builder'] as const;

function getAchievementForBox(boxNum: number): { category: string; achievementName: string; achievementEmoji: string } {
  const safeBoxNum = Math.max(1, Math.floor(boxNum));
  const category = BOX_CATEGORY_CYCLE[(safeBoxNum - 1) % BOX_CATEGORY_CYCLE.length] ?? 'arcade';
  const list = ACHIEVEMENTS_BY_GAME[category] ?? [];
  const indexWithinCategory = Math.floor((safeBoxNum - 1) / BOX_CATEGORY_CYCLE.length);
  const picked = list[indexWithinCategory % Math.max(1, list.length)];

  return {
    category,
    achievementName: picked?.name ?? getAchievementTitle(safeBoxNum),
    achievementEmoji: picked?.emoji ?? '🏅',
  };
}

/* ── Badge emoji per milestone ────────────────────── */
function getBadgeEmoji(boxNum: number): string {
  const badges = [
    '🥉', '🥈', '🥇', '🏅', '🎖️', '🏆', '💎', '👑',
    '⭐', '🌟', '✨', '🎯', '🚀', '🦁', '🐉', '🔥',
    '🌈', '🎪', '🎭', '🎨', '🎵', '🎸', '🎺', '🎻',
    '🌺', '🌸', '🌼', '🌻', '🌹', '🍀',
    '💫', '⚡', '🌙', '☀️', '🌊', '🏔️', '🦋', '🦅',
    '🐬', '🦊', '🐯', '🦓', '🐘', '🦒', '🐋', '🦜',
    '🎃', '🎄', '🎆', '🎇',
  ];
  return badges[(boxNum - 1) % badges.length] ?? '🏆';
}

/* ── Achievement title ────────────────────────────── */
function getAchievementTitle(boxNum: number): string {
  const titles = [
    'First Steps!', 'Getting Started!', 'On Your Way!', 'Picking Up Speed!', 'Halfway There!',
    'Sharp Learner!', 'Knowledge Seeker!', 'Star Student!', 'Rising Champion!', 'Explorer!',
    'Adventurer!', 'Treasure Hunter!', 'Gem Collector!', 'Gold Digger!', 'Crown Prince!',
    'Legendary!', 'Rainbow Master!', 'Show Stopper!', 'Performer!', 'Artist!',
    'Music Maestro!', 'Rock Star!', 'Jazz Legend!', 'Symphony Star!', 'Garden Hero!',
    'Blossom Star!', 'Sunflower Champ!', 'Daisy Achiever!', 'Rose Champion!', 'Lucky Star!',
    'Cosmic Explorer!', 'Lightning Bolt!', 'Moon Walker!', 'Sun Chaser!', 'Ocean Diver!',
    'Mountain Climber!', 'Butterfly Effect!', 'Eagle Eye!', 'Dolphin Diver!', 'Fox Thinker!',
    'Tiger Spirit!', 'Zebra Stripes!', 'Elephant Memory!', 'Giraffe Reach!', 'Whale Wisdom!',
    'Parrot Prankster!', 'Pumpkin Pro!', 'Winter Wizard!', 'Firework Finale!', 'Sparkle Star!',
  ];
  return titles[(boxNum - 1) % titles.length] ?? `Achievement #${boxNum}`;
}

/* ── Progress Bar ─────────────────────────────────── */
const ProgressBar: React.FC<{ progress: JourneyProgress; onBack?: () => void }> = ({ progress, onBack }) => {
  const pctToNext = progress.achievements < TOTAL_BOXES
    ? ((progress.total % LEVELS_PER_ACHIEVEMENT) / LEVELS_PER_ACHIEVEMENT) * 100
    : 100;
  const levelsToNext = progress.achievements < TOTAL_BOXES
    ? LEVELS_PER_ACHIEVEMENT - (progress.total % LEVELS_PER_ACHIEVEMENT)
    : 0;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '2px solid rgba(255,215,0,0.3)',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
      zIndex: 20,
    }}>
      {/* Back button */}
      {onBack && (
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: 10,
            padding: '6px 14px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ⬅ Home
        </motion.button>
      )}

      {/* Ship icon */}
      <motion.span
        style={{ fontSize: 28, flexShrink: 0 }}
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        🗺️
      </motion.span>

      {/* Title */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 18, fontFamily: 'Nunito, sans-serif', letterSpacing: 1 }}>
          TREASURE JOURNEY
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>
          Collect all the treasure boxes!
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 20 }}>{progress.total}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>LEVELS DONE</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#4ade80', fontWeight: 900, fontSize: 20 }}>{progress.achievements}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>BOXES OPEN</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

      {/* Progress to next */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700 }}>
            {levelsToNext > 0 ? `${levelsToNext} levels to next box` : '🎉 Max reached!'}
          </span>
          <span style={{ color: '#FFD700', fontSize: 11, fontWeight: 800 }}>
            {Math.round(pctToNext)}%
          </span>
        </div>
        <div style={{
          height: 10,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #FFD700, #FFA500)',
              borderRadius: 999,
              boxShadow: '0 0 8px rgba(255,215,0,0.6)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${pctToNext}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Achievement Popup ────────────────────────────── */
const AchievementPopup: React.FC<{
  info: AchievementInfo;
  onClose: () => void;
}> = ({ info, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20,
    }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.5, y: 60, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={e => e.stopPropagation()}
      style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 50%, #1a0a00 100%)',
        border: '3px solid #FFD700',
        borderRadius: 28,
        padding: '40px 48px',
        textAlign: 'center',
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 0 60px rgba(255,215,0,0.4), 0 24px 80px rgba(0,0,0,0.6)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background shimmer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Star sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + i * 16}%`,
            top: `${5 + (i % 3) * 20}%`,
            fontSize: 16,
            pointerEvents: 'none',
          }}
          animate={{ y: [-4, 4, -4], opacity: [0.6, 1, 0.6], rotate: [0, 20, 0] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        >
          ✨
        </motion.div>
      ))}

      {/* Open box image */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 16 }}
      >
        <img
          src={OPEN_BOX_SRC}
          alt="Open treasure box"
          style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.8))' }}
        />
      </motion.div>

      <motion.div
        style={{ fontSize: 82, marginBottom: 10, lineHeight: 1, filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.55))' }}
        animate={{ scale: [1, 1.14, 1], rotate: [0, -4, 4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {info.achievementEmoji ?? getBadgeEmoji(info.boxNum)}
      </motion.div>

      <div style={{
        color: '#FFD700', fontWeight: 900, fontSize: 24,
        fontFamily: 'Nunito, sans-serif', marginBottom: 6,
        textShadow: '0 0 20px rgba(255,215,0,0.5)',
      }}>
        {info.achievementName ?? getAchievementTitle(info.boxNum)}
      </div>

      <div style={{
        color: '#ffffff', fontWeight: 800, fontSize: 18,
        fontFamily: 'Nunito, sans-serif', marginBottom: 8,
      }}>
        🎉 Achievement Unlocked!
      </div>

      <div style={{
        color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600,
        marginBottom: 6,
      }}>
        🏆 Completed <span style={{ color: '#FFD700', fontWeight: 900 }}>{info.levelsNeeded}</span> Levels
      </div>

      <div style={{
        background: 'rgba(255,215,0,0.12)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: 12,
        padding: '10px 20px',
        color: '#FFD700',
        fontWeight: 700,
        fontSize: 13,
        marginBottom: 24,
      }}>
        🎁 Reward: Treasure Badge #{info.boxNum}
      </div>

      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          border: 'none',
          borderRadius: 14,
          padding: '12px 40px',
          color: '#1a0a00',
          fontWeight: 900,
          fontSize: 16,
          cursor: 'pointer',
          fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
        }}
      >
        Awesome! 👑
      </motion.button>
    </motion.div>
  </motion.div>
);

/* ── Box state rendering ──────────────────────────── */
type BoxState = 'locked' | 'unlocked';

interface TreasureBoxProps {
  boxNum: number;
  state: BoxState;
  isNew?: boolean;
  onClick: () => void;
}

const TreasureBox: React.FC<TreasureBoxProps> = React.memo(({ boxNum, state, isNew, onClick }) => {
  const isUnlocked = state === 'unlocked';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <motion.button
        onClick={onClick}
        whileHover={isUnlocked ? { scale: 1.12, y: -4 } : { scale: 1.04 }}
        whileTap={isUnlocked ? { scale: 0.92 } : {}}
        initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={isNew ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={isNew ? { duration: 0.6, type: 'spring', stiffness: 200 } : undefined}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: 76,
          height: 76,
          flexShrink: 0,
          filter: isUnlocked
            ? 'drop-shadow(0 0 12px rgba(255,215,0,0.7))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4)) grayscale(0.3)',
        }}
        title={isUnlocked ? `Achievement #${boxNum} — Click to view!` : `Complete ${boxNum * LEVELS_PER_ACHIEVEMENT} levels to unlock (click to play games)`}
      >
        <img
          src={isUnlocked ? OPEN_BOX_SRC : CLOSED_BOX_SRC}
          alt={isUnlocked ? `Open treasure box ${boxNum}` : `Locked treasure box ${boxNum}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {/* Badge emoji overlay for unlocked */}
        {isUnlocked && (
          <div style={{
            position: 'absolute',
            top: -10,
            right: -6,
            fontSize: 18,
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
          }}>
            {getBadgeEmoji(boxNum)}
          </div>
        )}

        {/* Lock icon for locked */}
        {!isUnlocked && (
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -4,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            🔒
          </div>
        )}

        {/* Golden glow pulse for newer unlocks */}
        {isNew && isUnlocked && (
          <motion.div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: '3px solid #FFD700',
              pointerEvents: 'none',
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: 3 }}
          />
        )}
      </motion.button>

      {/* Box number */}
      <div style={{
        fontSize: 11,
        fontWeight: 800,
        color: isUnlocked ? '#FFD700' : 'rgba(255,255,255,0.45)',
        fontFamily: 'Nunito, sans-serif',
        textShadow: isUnlocked ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
      }}>
        {boxNum * LEVELS_PER_ACHIEVEMENT}
      </div>
    </div>
  );
});
TreasureBox.displayName = 'TreasureBox';

/* ── Connector (path segment between boxes) ────────── */
const Connector: React.FC<{ filled: boolean }> = ({ filled }) => (
  <div style={{
    width: 32,
    height: 8,
    borderRadius: 4,
    background: filled
      ? 'linear-gradient(90deg, #FFD700, #FFA500)'
      : 'rgba(255,255,255,0.15)',
    boxShadow: filled ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
    flexShrink: 0,
    alignSelf: 'center',
    marginBottom: 22, // align with images center
  }} />
);

/* ── Game breakdown panel ───────────────────────────── */
const BreakdownPanel: React.FC<{ breakdown: Record<string, number>; onGameClick: (key: GameKey) => void }> = ({ breakdown, onGameClick }) => {
  const GAME_INFO: Record<string, { icon: string; label: string; color: string }> = {
    'arcade':       { icon: '🎮', label: 'Arcade Games', color: '#ff7f50' },
    'math':         { icon: '🔢', label: 'Maths World',  color: '#ffd166' },
    'english':      { icon: '📚', label: 'English Kingdom', color: '#a8e6cf' },
    'odd-one-out':  { icon: '🚗', label: 'Odd One Out',  color: '#c084fc' },
    'word-builder': { icon: '🔤', label: 'Word Builder', color: '#38bdf8' },
  };

  const allGameKeys: GameKey[] = ['arcade', 'math', 'english', 'odd-one-out', 'word-builder'];
  const entries = allGameKeys.map((game) => [game, breakdown[game] ?? 0] as [string, number]);

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      justifyContent: 'center',
      padding: '12px 16px',
      background: 'rgba(0,0,0,0.4)',
      borderTop: '1px solid rgba(255,215,0,0.15)',
      flexShrink: 0,
    }}>
      {entries.map(([game, count]) => {
        const info = GAME_INFO[game] ?? { icon: '🎯', label: game, color: '#fff' };
        const isActive = count > 0;
        return (
          <button
            key={game}
            onClick={() => onGameClick(game as GameKey)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActive ? `${info.color}55` : 'rgba(255,255,255,0.16)'}`,
              borderRadius: 20,
              padding: '4px 12px',
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
              opacity: isActive ? 1 : 0.82,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = isActive ? `${info.color}22` : 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)')}
          >
            <span style={{ fontSize: 14 }}>{info.icon}</span>
            <span style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>{info.label}:</span>
            <span style={{ color: isActive ? info.color : 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 900 }}>{count}</span>
            <span style={{ color: isActive ? info.color : 'rgba(255,255,255,0.45)', fontSize: 10, opacity: 0.8 }}>›</span>
          </button>
        );
      })}
    </div>
  );
};

/* ── Main Journey Page ───────────────────────────────── */
interface JourneyPageProps {
  onBack?: () => void;
  onNavigateToPlay?: () => void;
}

const JourneyPage: React.FC<JourneyPageProps> = ({ onBack, onNavigateToPlay }) => {
  const [progress, setProgress] = useState<JourneyProgress>(() => getJourneyProgress());
  const [popup, setPopup] = useState<AchievementInfo | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevAchRef = useRef(progress.achievements);

  // Refresh progress when tab becomes visible
  useEffect(() => {
    const refresh = () => {
      const updated = getJourneyProgress();
      if (updated.achievements > prevAchRef.current) {
        setNewlyUnlocked(updated.achievements);
        prevAchRef.current = updated.achievements;
      }
      setProgress(updated);
    };
    window.addEventListener('focus', refresh);
    // Also poll every 5 seconds while visible
    const interval = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('focus', refresh);
      clearInterval(interval);
    };
  }, []);

  // Show exact unlocked achievement name in popup
  useEffect(() => {
    const onUnlocked = (ev: Event) => {
      const ce = ev as CustomEvent<JourneyAchievementUnlockedDetail>;
      const detail = ce.detail;
      if (!detail) return;

      const ach = getAchievementForBox(detail.achievementNum);

      setPopup({
        boxNum: detail.achievementNum,
        levelsNeeded: detail.achievementNum * LEVELS_PER_ACHIEVEMENT,
        achievementName: ach.achievementName,
        achievementEmoji: ach.achievementEmoji,
      });
    };

    window.addEventListener(JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT, onUnlocked as EventListener);
    return () => {
      window.removeEventListener(JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT, onUnlocked as EventListener);
    };
  }, []);

  // Auto-scroll to first locked box when progress changes
  useEffect(() => {
    if (!scrollRef.current) return;
    const ITEM_WIDTH = 76 + 32 + 8; // box + connector + gap
    const scrollTo = Math.max(0, (progress.achievements - 2)) * ITEM_WIDTH;
    scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }, [progress.achievements]);

  const handleBoxClick = useCallback((boxNum: number, isUnlocked: boolean) => {
    if (isUnlocked) {
      const ach = getAchievementForBox(boxNum);
      setPopup({
        boxNum,
        levelsNeeded: boxNum * LEVELS_PER_ACHIEVEMENT,
        achievementName: ach.achievementName,
        achievementEmoji: ach.achievementEmoji,
      });
      return;
    }
    onNavigateToPlay?.();
  }, [onNavigateToPlay]);

  const handleClosePopup = useCallback(() => {
    setPopup(null);
    setNewlyUnlocked(null);
  }, []);

  // Build rows (S-curve: row 1 L→R, row 2 R→L, etc)
  const rows: number[][] = [];
  for (let i = 0; i < TOTAL_BOXES; i += BOXES_PER_ROW) {
    const row = [];
    for (let j = i; j < Math.min(i + BOXES_PER_ROW, TOTAL_BOXES); j++) {
      row.push(j + 1);
    }
    if (rows.length % 2 === 1) row.reverse();
    rows.push(row);
  }

  if (selectedGame) {
    return (
      <GameProgressDetail
        gameKey={selectedGame}
        onBack={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 80px)',  // subtract topbar height
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Nunito, sans-serif',
    }}>

      {/* ── Background ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${BG_SRC})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 5, 0, 0.45)',
        zIndex: 1,
      }} />

      {/* ── Content (above bg) ── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Progress bar header */}
        <ProgressBar progress={progress} onBack={onBack} />

        {/* ── Map scroll area ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px 20px 32px',
          }}
        >
          {/* S-curve treasure map layout */}
          {rows.map((row, rowIdx) => {
            const isReversed = rowIdx % 2 === 1;
            return (
              <div key={rowIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginBottom: 0 }}>
                {/* Box row */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: isReversed ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 6,
                  padding: '0 8px',
                }}>
                  {row.map((boxNum, bIdx) => {
                    const isUnlocked = progress.openedBoxes?.includes(boxNum) || boxNum <= progress.achievements;
                    const isNewBox = boxNum === newlyUnlocked;
                    const isLastBox = bIdx === row.length - 1;

                    return (
                      <React.Fragment key={boxNum}>
                        <TreasureBox
                          boxNum={boxNum}
                          state={isUnlocked ? 'unlocked' : 'locked'}
                          isNew={isNewBox}
                          onClick={() => handleBoxClick(boxNum, isUnlocked)}
                        />
                        {!isLastBox && (
                          <Connector filled={isUnlocked && row[bIdx + 1] !== undefined && row[bIdx + 1] <= progress.achievements} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Vertical connector between rows */}
                {rowIdx < rows.length - 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: isReversed ? 'flex-start' : 'flex-end',
                    padding: '0 12px',
                    marginTop: 4,
                    marginBottom: 4,
                  }}>
                    <div style={{
                      width: 8,
                      height: 36,
                      borderRadius: 4,
                      background: row[row.length - 1] <= progress.achievements
                        ? 'linear-gradient(180deg, #FFD700, #FFA500)'
                        : 'rgba(255,255,255,0.15)',
                      boxShadow: row[row.length - 1] <= progress.achievements
                        ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                    }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state when no progress */}
          {progress.total === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
                border: '1px solid rgba(255,215,0,0.2)',
                marginTop: 16,
                maxWidth: 420,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
              <div style={{ color: '#FFD700', fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
                Your Adventure Awaits!
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>
                Complete <strong style={{ color: '#FFD700' }}>{LEVELS_PER_ACHIEVEMENT} levels</strong> in any game
                to unlock your first treasure box!
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                {([
                  { key: 'arcade' as GameKey,       label: '🎮 Arcade' },
                  { key: 'math' as GameKey,          label: '🔢 Maths' },
                  { key: 'english' as GameKey,       label: '📚 English' },
                  { key: 'odd-one-out' as GameKey,   label: '🚗 Odd One Out' },
                  { key: 'word-builder' as GameKey,  label: '🔤 Word Builder' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedGame(key)}
                    style={{
                      background: 'rgba(255,215,0,0.12)',
                      border: '1px solid rgba(255,215,0,0.35)',
                      borderRadius: 20,
                      padding: '4px 14px',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.12)')}
                  >
                    {label} ›
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Game breakdown footer */}
        <BreakdownPanel breakdown={progress.breakdown} onGameClick={setSelectedGame} />
      </div>

      {/* ── Achievement popup ── */}
      <AnimatePresence>
        {popup && (
          <AchievementPopup
            info={popup}
            onClose={handleClosePopup}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default JourneyPage;
