/**
 * child/milestone/levelData.ts
 * ─────────────────────────────────────────────────────
 * Journey data built from the real game catalogs.
 *
 * Sections:
 *  1. Arcade Arena   — 16 arcade mini-games
 *  2. Maths World    — 18 maths games
 *  3. English Kingdom — 18 english games
 *  4. EVS Lab        — 18 science / EVS games
 */

import { GAME_CONFIGS } from '../../games/types';
import {
  ENGLISH_CHAPTERS,
  MATHS_CHAPTERS,
  SCIENCE_CHAPTERS,
  type ChapterDef,
} from '../../games/subjects/engine/types';

export type LevelState = 'locked' | 'active' | 'completed';
export type LevelType = 'game' | 'chapter' | 'skill' | 'boss';
export type RewardType = 'badge' | 'bonusStars' | 'title' | 'cosmetic' | 'surprise';

export interface LevelReward {
  type: RewardType;
  value: string | number;
  icon: string;
  label: string;
  magicText: string;
}

export interface WorldDef {
  id: string;
  order: number;
  name: string;
  emoji: string;
  bgGradient: string;
  roadColor: string;
  tagline: string;
  decoEmojis: string[];
  semiOpen: boolean;
}

export interface Level {
  id: string;
  order: number;
  worldId: string;
  worldOrder: number;
  title: string;
  emoji: string;
  type: LevelType;
  requiredXP: number;
  requiredStars: number;
  requiredGame?: string;
  subjectGameKey?: string;
  requiredChapter?: string;
  requiredSkill?: string;
  reward: LevelReward;
  gradient: string;
  glowColor: string;
  waveY: number;
  unlockHint: string;
}

export interface LevelProgress {
  levelId: string;
  state: LevelState;
  completedAt?: string;
  rewardClaimed: boolean;
}

interface LvMeta {
  title: string;
  emoji: string;
  reward: LevelReward;
  requiredGame?: string;
  subjectGameKey?: string;
  unlockHint: string;
}

export const DEMO_MODE = true;
export const STAR_VALUE = 10;

export function xpToStars(totalXP: number): number {
  return Math.floor(totalXP / STAR_VALUE);
}

export function starsToXP(stars: number): number {
  return stars * STAR_VALUE;
}

function xpForLevel(level: number): number {
  return 20 + level * 10 + Math.floor(level * level * 2);
}

export function cumulativeXP(level: number, currentXP: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total + currentXP;
}

export const WORLDS: WorldDef[] = [
  {
    id: 'w1',
    order: 0,
    name: 'Arcade Arena',
    emoji: '🎮',
    bgGradient: 'from-indigo-900/70 via-purple-900/50 to-blue-900/70',
    roadColor: '#67e8f9',
    tagline: 'Quick brain games - 16 games!',
    decoEmojis: ['🌟', '✨', '💫', '🛸', '⭐', '🪐'],
    semiOpen: false,
  },
  {
    id: 'w2',
    order: 1,
    name: 'Maths World',
    emoji: '🔢',
    bgGradient: 'from-blue-900/70 via-cyan-900/50 to-teal-900/70',
    roadColor: '#fbbf24',
    tagline: 'Numbers, Shapes & Data - 18 games!',
    decoEmojis: ['🛰️', '🔭', '☄️', '🌠', '🪐', '⚡'],
    semiOpen: false,
  },
  {
    id: 'w3',
    order: 2,
    name: 'English Kingdom',
    emoji: '📚',
    bgGradient: 'from-violet-900/70 via-fuchsia-900/50 to-purple-900/70',
    roadColor: '#86efac',
    tagline: 'Letters, Words & Sentences - 18 games!',
    decoEmojis: ['🌕', '🌙', '💫', '✨', '🌟', '🛸'],
    semiOpen: true,
  },
  {
    id: 'w4',
    order: 3,
    name: 'EVS Lab',
    emoji: '🔬',
    bgGradient: 'from-emerald-900/70 via-teal-900/50 to-cyan-900/70',
    roadColor: '#4ade80',
    tagline: 'Explore Nature & Our World - 18 games!',
    decoEmojis: ['🪐', '☄️', '🌍', '🔭', '🛰️', '⭐'],
    semiOpen: true,
  },
];

const WAVE_Y = [0.3, 0.62, 0.26, 0.66, 0.33, 0.58, 0.28, 0.64, 0.35, 0.52];

const GRADS: Record<string, string[]> = {
  w1: ['from-lime-300 to-green-400', 'from-green-300 to-emerald-400', 'from-emerald-300 to-teal-400', 'from-teal-300 to-cyan-400', 'from-lime-400 to-green-500'],
  w2: ['from-sky-300 to-blue-400', 'from-blue-300 to-indigo-400', 'from-cyan-300 to-sky-400', 'from-indigo-300 to-blue-500', 'from-sky-400 to-blue-500'],
  w3: ['from-amber-300 to-yellow-400', 'from-yellow-300 to-orange-400', 'from-orange-300 to-amber-400', 'from-amber-400 to-yellow-500', 'from-yellow-400 to-amber-500'],
  w4: ['from-violet-300 to-purple-400', 'from-purple-300 to-fuchsia-400', 'from-fuchsia-300 to-pink-400', 'from-indigo-300 to-violet-400', 'from-purple-400 to-indigo-500'],
};

const GLOWS: Record<string, string> = {
  w1: 'rgba(74,222,128,0.5)',
  w2: 'rgba(56,189,248,0.5)',
  w3: 'rgba(251,191,36,0.5)',
  w4: 'rgba(167,139,250,0.5)',
};

function makeReward(index: number, title: string): LevelReward {
  const rewardType = index % 5;
  if (rewardType === 0) {
    return { type: 'badge', value: `${title} Badge`, icon: '🏅', label: `${title} Badge`, magicText: `${title} unlocked!` };
  }
  if (rewardType === 1) {
    return { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: `Bonus stars for ${title}!` };
  }
  if (rewardType === 2) {
    return { type: 'surprise', value: `${title} Spark`, icon: '🌟', label: `${title} Spark`, magicText: `${title} unlocks a surprise spark!` };
  }
  if (rewardType === 3) {
    return { type: 'cosmetic', value: `${title} Trail`, icon: '✨', label: `${title} Trail`, magicText: `${title} leaves a shining trail!` };
  }
  return { type: 'title', value: `${title} Master`, icon: '👑', label: `${title} Master`, magicText: `You mastered ${title}!` };
}

function arcadeMetas(): LvMeta[] {
  return GAME_CONFIGS.map((game, index) => ({
    title: game.title,
    emoji: game.icon,
    requiredGame: game.id,
    unlockHint: game.desc,
    reward: makeReward(index, game.title),
  }));
}

function chapterMetas(chapters: ChapterDef[], subject: 'maths' | 'english' | 'science'): LvMeta[] {
  return chapters.flatMap((chapter) =>
    chapter.games.map((game, index) => ({
      title: game.title,
      emoji: game.icon,
      subjectGameKey: `${subject}_${chapter.id}_${game.id}`,
      unlockHint: `${chapter.title} - ${game.title}`,
      reward: makeReward(index + chapter.title.length, game.title),
    })),
  );
}

const WORLD_METAS: Record<string, LvMeta[]> = {
  w1: arcadeMetas(),
  w2: chapterMetas(MATHS_CHAPTERS, 'maths'),
  w3: chapterMetas(ENGLISH_CHAPTERS, 'english'),
  w4: chapterMetas(SCIENCE_CHAPTERS, 'science'),
};

export const WORLD_LEVEL_COUNTS = WORLDS.map((world) => WORLD_METAS[world.id].length);

function buildStarTable(totalLevels: number): number[] {
  const table: number[] = [];
  let stars = 0;
  for (let i = 0; i < totalLevels; i++) {
    if (i === 0) {
      table.push(0);
      continue;
    }
    stars += i < 16 ? 2 : i < 40 ? 3 : 4;
    table.push(stars);
  }
  return table;
}

function generateLevels(): Level[] {
  const levels: Level[] = [];
  const totalLevels = WORLD_LEVEL_COUNTS.reduce((sum, count) => sum + count, 0);
  const starTable = buildStarTable(totalLevels);
  let globalIndex = 0;

  for (const world of WORLDS) {
    const metas = WORLD_METAS[world.id];
    const grads = GRADS[world.id];
    const glow = GLOWS[world.id];

    for (let i = 0; i < metas.length; i++) {
      const meta = metas[i];
      const stars = starTable[globalIndex] ?? 0;

      levels.push({
        id: `lv-${globalIndex + 1}`,
        order: globalIndex,
        worldId: world.id,
        worldOrder: i + 1,
        title: meta.title,
        emoji: meta.emoji,
        type: 'game',
        requiredXP: starsToXP(stars),
        requiredStars: stars,
        requiredGame: meta.requiredGame,
        subjectGameKey: meta.subjectGameKey,
        reward: meta.reward,
        gradient: grads[i % grads.length],
        glowColor: glow,
        waveY: WAVE_Y[i % WAVE_Y.length],
        unlockHint: meta.unlockHint,
      });

      globalIndex++;
    }
  }

  return levels;
}

export const LEVELS: Level[] = generateLevels();
export const MAX_LEVEL_XP = LEVELS[LEVELS.length - 1]?.requiredXP ?? 0;
export const MAX_LEVEL_STARS = LEVELS[LEVELS.length - 1]?.requiredStars ?? 0;
export const TOTAL_LEVELS = LEVELS.length;

export function levelsByWorld(): Map<string, Level[]> {
  const m = new Map<string, Level[]>();
  for (const lv of LEVELS) {
    const arr = m.get(lv.worldId) ?? [];
    arr.push(lv);
    m.set(lv.worldId, arr);
  }
  return m;
}

export function getWorld(id: string): WorldDef | undefined {
  return WORLDS.find(w => w.id === id);
}
