/**
 * child/colorMagicEngine.ts — 🧠 Color Magic Infinite Level Engine
 * ═════════════════════════════════════════════════════════════════
 * 5-WORLD PROGRESSION (8-Month Learning System):
 *
 *   🐚 CORAL COVE       (1–150)   : Basic colour recognition
 *       Phase 1  (1–30)   — Single shape, single colour
 *       Phase 2  (31–80)  — Find & paint among 2–4 shapes
 *       Phase 3  (81–150) — "Color ALL CIRCLES Blue!"
 *
 *   🌈 RAINBOW REEF      (151–400) : Multi-object logic
 *       Phase 4  (151–400)— "Color 2 TRIANGLES Red!" count-based
 *
 *   🧩 PUZZLE PALACE     (401–750) : Multi-colour painting
 *       Phase 5  (401–750)— Each shape labeled with target color
 *
 *   👑 MASTER KINGDOM    (751–900) : Structured logic & rules
 *       Phase 6  (751–900)— Avoid colours, size rules, tone match, letter codes
 *
 *   🏆 MEGA MASTER REALM (901+)    : Segmented objects
 *       Phase 7  (901+)   — One large object, 6–12 clickable parts, letter hints
 *
 * Beyond 1000: difficulty continues to scale infinitely.
 * MILESTONES: Every 25 levels → XP bonus + celebration
 */

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export type PhaseType =
  | 'single_recognition'
  | 'find_and_paint'
  | 'paint_all_type'
  | 'count_target'
  | 'multi_color'
  | 'advanced_logic'
  | 'mega_master';

export type SizeTag = 'big' | 'small';

export interface LevelConfig {
  level: number;
  phase: number;
  phaseType: PhaseType;
  title: string;
  instruction: string;
  shapeCount: number;
  maxShapeDifficulty: number;
  colorCount: number;
  targetColors: string[];
  targetShapeId?: string;
  targetShapeType?: string;
  targetCount?: number;
  letterHint?: string;
  sizeRule?: SizeTag;
  avoidColor?: string;
  toneOptions?: string[];
  colorAssignments?: Record<string, string>;
  segmentedObjectId?: string;
  shapeSize: number;
  autoSelectColor: boolean;
  xpReward: number;
  isBoss: boolean;
  goldenChance: number;
  world: number;
}

export interface WorldMeta {
  id: number;
  name: string;
  emoji: string;
  themeGradient: string;
  phases: number[];
  levelRange: [number, number];
}

export interface PlayerProgress {
  currentLevel: number;
  highestLevel: number;
  totalXP: number;
  totalStars: number;
  streak: number;
  lastPlayedDate: string;
  levelStars: Record<number, number>;
  worldsUnlocked: number[];
  achievements: string[];
}

/* ═══════════════════════════════════════════════════
   CONSTANTS — from unified color system
   ═══════════════════════════════════════════════════ */

import {
  ALL_COLOR_NAMES, COLOR_COUNT,
  LETTER_TO_NAME, NAME_TO_LETTER,
  TONE_GROUPS as CS_TONE_GROUPS,
  getColorPool,
} from './colorSystem';

const STORAGE_KEY = 'color_magic_progress';

/** @deprecated Use ALL_COLOR_NAMES from colorSystem.ts — re-exported for backward compat */
export const PALETTE_NAMES: string[] = [...ALL_COLOR_NAMES];

export const TONE_GROUPS: Record<string, readonly string[]> = CS_TONE_GROUPS;

/** @deprecated Use LETTER_TO_NAME from colorSystem.ts */
export const LETTER_MAP: Record<string, string> = { ...LETTER_TO_NAME };

/** @deprecated Use NAME_TO_LETTER from colorSystem.ts */
export const REVERSE_LETTER_MAP: Record<string, string> = { ...NAME_TO_LETTER };

/** Segmented object IDs for Mega Master mode */
export const SEGMENTED_OBJECT_IDS = [
  'seg_house', 'seg_car', 'seg_robot', 'seg_butterfly',
  'seg_rocket', 'seg_castle', 'seg_train', 'seg_flower',
];

/** Shape type names by difficulty — used by generator to pick a target type */
const EASY_SHAPES = ['Circle', 'Square', 'Triangle', 'Star', 'Heart', 'Diamond'];
const MID_SHAPES  = [...EASY_SHAPES, 'Pentagon', 'Hexagon'];
const ALL_SHAPES  = [...MID_SHAPES, 'Fish', 'Bird', 'Cat', 'Dog', 'Butterfly', 'Sun', 'Flower', 'Tree', 'House', 'Car', 'Cupcake', 'Apple'];

function shapesForDifficulty(maxDiff: number): string[] {
  if (maxDiff <= 1) return EASY_SHAPES;
  if (maxDiff <= 2) return MID_SHAPES;
  return ALL_SHAPES;
}

/* ═══════════════════════════════════════════════════
   5-WORLD SYSTEM + INFINITE GENERATION
   ═══════════════════════════════════════════════════ */

const BASE_WORLDS: WorldMeta[] = [
  {
    id: 0, name: 'Coral Cove', emoji: '🐚',
    themeGradient: 'linear-gradient(180deg, #0a1628 0%, #0c2d5e 20%, #0e4a8a 45%, #1565a8 65%, #1a8bc4 80%, #22a8d8 100%)',
    phases: [1, 2, 3], levelRange: [1, 150],
  },
  {
    id: 1, name: 'Rainbow Reef', emoji: '🌈',
    themeGradient: 'linear-gradient(180deg, #1a1040 0%, #2d1b69 25%, #4c1d95 50%, #7c3aed 75%, #a78bfa 100%)',
    phases: [4], levelRange: [151, 400],
  },
  {
    id: 2, name: 'Puzzle Palace', emoji: '🧩',
    themeGradient: 'linear-gradient(180deg, #042f2e 0%, #065f46 25%, #059669 50%, #10b981 75%, #6ee7b7 100%)',
    phases: [5], levelRange: [401, 750],
  },
  {
    id: 3, name: 'Master Kingdom', emoji: '👑',
    themeGradient: 'linear-gradient(180deg, #431407 0%, #7c2d12 25%, #c2410c 50%, #f97316 75%, #fdba74 100%)',
    phases: [6], levelRange: [751, 900],
  },
  {
    id: 4, name: 'Mega Master Realm', emoji: '🏆',
    themeGradient: 'linear-gradient(170deg, #050d1e 0%, #0a1a3a 15%, #0e2d5e 30%, #103d7a 50%, #1556a0 68%, #1a6db8 82%, #1e80c8 100%)',
    phases: [7], levelRange: [901, 1000],
  },
];

/** Get world metadata. Mega Master (id 4) is the final world — levels continue infinitely. */
export function getWorldMeta(worldId: number): WorldMeta {
  return BASE_WORLDS[Math.min(Math.max(0, worldId), BASE_WORLDS.length - 1)];
}

/** All 5 worlds. Mega Master extends infinitely — no additional worlds generated. */
export function getVisibleWorlds(_highestLevel: number): WorldMeta[] {
  return [...BASE_WORLDS];
}

/** Effective upper level bound for a world.
 *  Mega Master (world 4) extends based on player progress for infinite scaling. */
export function getEffectiveLevelHi(worldId: number, highestLevel: number): number {
  const w = getWorldMeta(worldId);
  if (worldId >= 4) return Math.max(w.levelRange[1], highestLevel + 50);
  return w.levelRange[1];
}

/** Static accessor for backward compat */
export const WORLDS = BASE_WORLDS;

/* ═══════════════════════════════════════════════════
   PHASE DETECTION — 7 PHASES, 5 WORLDS
   ═══════════════════════════════════════════════════ */

export function getPhase(level: number): number {
  if (level <= 30)   return 1;
  if (level <= 80)   return 2;
  if (level <= 150)  return 3;
  if (level <= 400)  return 4;
  if (level <= 750)  return 5;
  if (level <= 900)  return 6;
  return 7;
}

export function getPhaseType(phase: number): PhaseType {
  const map: Record<number, PhaseType> = {
    1: 'single_recognition',
    2: 'find_and_paint',
    3: 'paint_all_type',
    4: 'count_target',
    5: 'multi_color',
    6: 'advanced_logic',
    7: 'mega_master',
  };
  return map[phase] || 'single_recognition';
}

export function getWorld(level: number): number {
  if (level >= 901) return 4; // Mega Master — infinite
  const baseIdx = BASE_WORLDS.findIndex(w => level >= w.levelRange[0] && level <= w.levelRange[1]);
  return Math.max(0, baseIdx);
}

/* ═══════════════════════════════════════════════════
   DIFFICULTY SCALING HELPERS
   ═══════════════════════════════════════════════════ */

function phaseProgress(level: number): number {
  if (level <= 30)   return (level - 1) / 29;
  if (level <= 80)   return (level - 31) / 49;
  if (level <= 150)  return (level - 81) / 69;
  if (level <= 400)  return (level - 151) / 249;
  if (level <= 750)  return (level - 401) / 349;
  if (level <= 900)  return (level - 751) / 149;
  return ((level - 901) % 100) / 99;
}

/** Global difficulty multiplier — ramps up forever */
function difficultyScale(level: number): number {
  if (level <= 400)  return 1;
  if (level <= 750)  return 1.2;
  if (level <= 900)  return 1.5;
  return 1.5 + Math.log2(Math.max(1, (level - 900) / 200)) * 0.3;
}

function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/* ═══════════════════════════════════════════════════
   🧠  LEVEL CONFIG GENERATOR — INFINITE
   ═══════════════════════════════════════════════════ */

export function generateLevel(level: number): LevelConfig {
  const phase = getPhase(level);
  const pt = getPhaseType(phase);
  const t = phaseProgress(level);
  const world = getWorld(level);
  const isBoss = level % 10 === 0;
  const isMilestone = level % 25 === 0;
  const d = difficultyScale(level);

  const base: Partial<LevelConfig> = {
    level, phase, phaseType: pt,
    world: Math.max(0, world),
    isBoss: isBoss || isMilestone,
    goldenChance: isMilestone ? 0.5 : isBoss ? 0.3 : t > 0.7 ? 0.12 : 0.05,
  };

  switch (pt) {
    case 'single_recognition': return validateLevel(genSinglePaint(level, t, d, base));
    case 'find_and_paint':     return validateLevel(genFindPaint(level, t, d, base));
    case 'paint_all_type':     return validateLevel(genPaintAll(level, t, d, base));
    case 'count_target':       return validateLevel(genCountPaint(level, t, d, base));
    case 'multi_color':        return validateLevel(genMultiColor(level, t, d, base));
    case 'advanced_logic':     return validateLevel(genMasterLogic(level, t, d, base));
    case 'mega_master':        return validateLevel(genMegaMaster(level, t, d, base));
    default:                   return validateLevel(genSinglePaint(level, t, d, base));
  }
}

/* ═══════════════════════════════════════════════════
   🛡️  LEVEL VALIDATION — Auto-fix illogical configs
   ═══════════════════════════════════════════════════ */

function validateLevel(config: LevelConfig): LevelConfig {
  // Ensure target count never exceeds available shapes
  if (config.targetCount && config.targetCount > config.shapeCount) {
    config.targetCount = Math.max(1, config.shapeCount - 1);
    const typeName = (config.targetShapeType || 'shape').toUpperCase();
    config.instruction = `🔢 Paint ${config.targetCount} ${typeName}${config.targetCount > 1 ? 'S' : ''} ${config.targetColors[0]}!`;
  }

  // Ensure target colors are valid palette colors
  config.targetColors = config.targetColors.filter(c => ALL_COLOR_NAMES.includes(c));
  if (config.targetColors.length === 0) {
    config.targetColors = [ALL_COLOR_NAMES[0]];
  }

  // Ensure avoid color isn't the same as target color
  if (config.avoidColor && config.targetColors.includes(config.avoidColor)) {
    const remaining = ALL_COLOR_NAMES.filter(c => !config.targetColors.includes(c));
    config.avoidColor = remaining.length > 0 ? remaining[0] : undefined;
    if (config.avoidColor) {
      config.instruction = `🚫 Skip the ${config.avoidColor} shapes!\nPaint all others ${config.targetColors[0]}.`;
    }
  }

  // Ensure color count covers target colors
  config.colorCount = Math.max(config.colorCount, config.targetColors.length);

  // Ensure shape count is at least 1
  config.shapeCount = Math.max(1, config.shapeCount);

  return config;
}

/* ─── Phase 1: Single shape + single colour (Coral 1–30) ─── */

function genSinglePaint(_level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = 1;
  const colorCount = lerp(2, Math.min(4 + Math.floor(d - 1), 5), t);
  const targetColor = pickRandom(getColorPool(colorCount));
  return {
    ...base,
    title: 'Colour the Shape',
    instruction: `🎨 Tap the shape. Paint it ${targetColor}!`,
    shapeCount,
    maxShapeDifficulty: 1,
    colorCount, targetColors: [targetColor],
    shapeSize: 380,
    autoSelectColor: t < 0.4 && d <= 1,
    xpReward: lerp(8, Math.round(15 * d), t) + (base.isBoss ? 15 : 0),
  } as LevelConfig;
}

/* ─── Phase 2: Find & paint (Coral 31–80) ─── */

function genFindPaint(_level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(2, Math.min(4, 2 + Math.floor(d)), t);
  const colorCount = lerp(3, Math.min(5 + Math.floor(d - 1), COLOR_COUNT), t);
  const targetColor = pickRandom(getColorPool(colorCount));
  return {
    ...base,
    title: 'Find & Paint',
    instruction: `🔍 Find the right shape. Paint it ${targetColor}!`,
    shapeCount,
    maxShapeDifficulty: lerp(1, Math.min(2, 1 + Math.floor(d - 1)), t),
    colorCount, targetColors: [targetColor],
    shapeSize: lerp(300, Math.max(220, Math.round(260 / d)), t),
    autoSelectColor: t < 0.3 && d <= 1,
    xpReward: lerp(12, Math.round(20 * d), t) + (base.isBoss ? 20 : 0),
  } as LevelConfig;
}

/* ─── Phase 3: Paint ALL of a type (Coral 81–150) ─── */

function genPaintAll(_level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(3, Math.min(6, 3 + Math.floor(d)), t);
  const colorCount = lerp(3, Math.min(COLOR_COUNT, 3 + Math.floor(d)), t);
  const targetColor = pickRandom(getColorPool(colorCount));
  const maxDiff = lerp(1, Math.min(2, 1 + Math.floor(d - 1)), t);
  const targetShapeType = pickRandom(shapesForDifficulty(maxDiff));
  return {
    ...base,
    title: 'Paint All!',
    instruction: `🎨 Paint ALL the ${targetShapeType.toUpperCase()}S ${targetColor}!`,
    shapeCount,
    maxShapeDifficulty: maxDiff,
    colorCount, targetColors: [targetColor],
    targetShapeType,
    shapeSize: lerp(260, Math.max(180, Math.round(220 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(15, Math.round(26 * d), t) + (base.isBoss ? 25 : 0),
  } as LevelConfig;
}

/* ─── Phase 4: Count-based "Color 2 TRIANGLES Red!" (Rainbow 151–400) ─── */

function genCountPaint(_level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(4, Math.min(6, 4 + Math.floor(d)), t);
  const colorCount = lerp(4, COLOR_COUNT, t);
  const targetColor = pickRandom(getColorPool(colorCount));
  const maxDiff = lerp(1, Math.min(3, 1 + Math.floor(d)), t);
  const targetShapeType = pickRandom(shapesForDifficulty(maxDiff));
  const targetCount = lerp(1, Math.min(3 + Math.floor(d - 1), 4), t);
  return {
    ...base,
    title: 'Count & Paint',
    instruction: `🔢 Paint ${targetCount} ${targetShapeType.toUpperCase()}${targetCount > 1 ? 'S' : ''} ${targetColor}!`,
    shapeCount,
    maxShapeDifficulty: maxDiff,
    colorCount, targetColors: [targetColor],
    targetShapeType,
    targetCount,
    shapeSize: lerp(220, Math.max(160, Math.round(200 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(18, Math.round(32 * d), t) + (base.isBoss ? 30 : 0),
  } as LevelConfig;
}

/* ─── Phase 5: Multi-colour (Puzzle 401–750) ─── */

function genMultiColor(_level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(3, Math.min(6, 3 + Math.floor(d)), t);
  const colorCount = lerp(4, COLOR_COUNT, t);
  const usedColors = pickN(getColorPool(colorCount), Math.min(shapeCount, 3 + Math.floor(d - 1)));
  return {
    ...base,
    title: 'Rainbow Paint',
    instruction: `🎨 Each shape says what color it wants! Paint them all!`,
    shapeCount,
    maxShapeDifficulty: lerp(2, 4, t),
    colorCount, targetColors: usedColors,
    colorAssignments: {},
    shapeSize: lerp(240, Math.max(160, Math.round(200 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(22, Math.round(40 * d), t) + (base.isBoss ? 40 : 0),
  } as LevelConfig;
}

/* ─── Phase 6: Master Logic — rotating sub-variants (Master 751–900) ─── */

function genMasterLogic(level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const variant = (level - 751) % 5;
  switch (variant) {
    case 0:  return genMaster_avoidColor(t, d, base);
    case 1:  return genMaster_toneMatch(t, d, base);
    case 2:  return genMaster_sizeRule(t, d, base);
    case 3:  return genMaster_advancedMulti(t, d, base);
    case 4:  return genMaster_letterCode(t, d, base);
    default: return genMaster_avoidColor(t, d, base);
  }
}

function genMaster_avoidColor(t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(3, Math.min(6, 3 + Math.floor(d)), t);
  const avoidColor = pickRandom(ALL_COLOR_NAMES as string[]);
  const remaining = ALL_COLOR_NAMES.filter(c => c !== avoidColor);
  const targetColor = pickRandom(remaining);
  return {
    ...base,
    title: 'Exclusion Paint',
    instruction: `🚫 Skip the ${avoidColor} shapes!\nPaint all others ${targetColor}.`,
    shapeCount,
    maxShapeDifficulty: lerp(2, 4, t),
    colorCount: 7, targetColors: [targetColor], avoidColor,
    shapeSize: lerp(200, Math.max(160, Math.round(180 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(28, Math.round(50 * d), t) + (base.isBoss ? 50 : 0),
  } as LevelConfig;
}

function genMaster_toneMatch(t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(3, Math.min(5, 3 + Math.floor(d)), t);
  const groupKey = pickRandom(Object.keys(TONE_GROUPS));
  const tones = TONE_GROUPS[groupKey];
  const targetColor = pickRandom(tones);
  return {
    ...base,
    title: 'Exact Color',
    instruction: `� Pick only ${targetColor}. Not ${tones.filter(t => t !== targetColor).join(', not ')}!`,
    shapeCount,
    maxShapeDifficulty: lerp(2, 4, t),
    colorCount: 7, targetColors: [targetColor], toneOptions: tones,
    shapeSize: lerp(200, Math.max(160, Math.round(180 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(26, Math.round(45 * d), t) + (base.isBoss ? 45 : 0),
  } as LevelConfig;
}

function genMaster_sizeRule(t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(4, Math.min(6, 4 + Math.floor(d)), t);
  const sizeRule: SizeTag = Math.random() > 0.5 ? 'big' : 'small';
  const colorCount = lerp(4, COLOR_COUNT, t);
  const targetColor = pickRandom(getColorPool(colorCount));
  return {
    ...base,
    title: 'Size Sort',
    instruction: `📐 Paint ONLY the ${sizeRule.toUpperCase()} shapes ${targetColor}!\nLeave the ${sizeRule === 'big' ? 'SMALL' : 'BIG'} ones empty.`,
    shapeCount,
    maxShapeDifficulty: lerp(2, 4, t),
    colorCount, targetColors: [targetColor], sizeRule,
    shapeSize: lerp(220, Math.max(160, Math.round(200 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(26, Math.round(45 * d), t) + (base.isBoss ? 45 : 0),
  } as LevelConfig;
}

function genMaster_advancedMulti(t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(3, Math.min(6, 3 + Math.floor(d)), t);
  const usedColors = pickN([...ALL_COLOR_NAMES], Math.min(shapeCount, 3 + Math.floor(d - 1)));
  return {
    ...base,
    title: 'Master Palette',
    instruction: `🎨 Read each bubble. Paint each shape its color!`,
    shapeCount,
    maxShapeDifficulty: lerp(3, 4, t),
    colorCount: 7, targetColors: usedColors,
    colorAssignments: {},
    shapeSize: lerp(200, Math.max(160, Math.round(180 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(28, Math.round(50 * d), t) + (base.isBoss ? 50 : 0),
  } as LevelConfig;
}

function genMaster_letterCode(t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  const shapeCount = lerp(3, Math.min(5, 3 + Math.floor(d)), t);
  const letters = Object.keys(LETTER_TO_NAME);
  const letter = pickRandom(letters);
  const targetColor = LETTER_TO_NAME[letter];
  return {
    ...base,
    title: 'Letter Code',
    instruction: `🔤 "${letter}" = ${targetColor}. Paint ALL shapes ${targetColor}!`,
    shapeCount,
    maxShapeDifficulty: lerp(2, 4, t),
    colorCount: 7, targetColors: [targetColor], letterHint: letter,
    shapeSize: lerp(220, Math.max(160, Math.round(200 / d)), t),
    autoSelectColor: false,
    xpReward: lerp(26, Math.round(45 * d), t) + (base.isBoss ? 45 : 0),
  } as LevelConfig;
}

/* ─── Phase 7: MEGA MASTER — segmented objects (901+) ─── */

function genMegaMaster(level: number, t: number, d: number, base: Partial<LevelConfig>): LevelConfig {
  // Gradually introduce objects: start with 3, gain one every ~50 levels
  const availCount = Math.min(SEGMENTED_OBJECT_IDS.length, 3 + Math.floor((level - 901) / 50));
  const objIdx = (level - 901) % availCount;
  const objId = SEGMENTED_OBJECT_IDS[objIdx];

  // Colors scale dynamically: 4 at level 901, +1 every 80 levels, up to full palette
  const numColors = Math.min(COLOR_COUNT, 4 + Math.floor((level - 901) / 80));
  const colorNames = getColorPool(numColors);

  // Tier-based titles for infinite progression
  const title = level >= 2001 ? 'Legendary Master'
    : level >= 1501 ? 'Grand Master'
    : level >= 1201 ? 'Ultra Master'
    : 'Mega Master';

  return {
    ...base,
    title,
    instruction: '🏆 Paint by letter! Match each letter to its color.',
    shapeCount: 1,
    maxShapeDifficulty: 4,
    colorCount: numColors,
    targetColors: colorNames,
    segmentedObjectId: objId,
    shapeSize: 400,
    autoSelectColor: false,
    xpReward: lerp(35, Math.round(60 * d), t) + (base.isBoss ? 60 : 0),
  } as LevelConfig;
}

/* ═══════════════════════════════════════════════════
   🏆  MILESTONE SYSTEM
   ═══════════════════════════════════════════════════ */

export interface MilestoneReward {
  level: number;
  xpBonus: number;
  title: string;
  emoji: string;
}

export function getMilestoneReward(level: number): MilestoneReward | null {
  if (level % 25 !== 0) return null;
  const tier = Math.floor(level / 25);
  const titles = [
    'Rising Star', 'Colour Explorer', 'Paint Warrior', 'Art Champion',
    'Rainbow Master', 'Colour Legend', 'Paint Wizard', 'Art Genius',
    'Creative Hero', 'Masterpiece Maker',
  ];
  return {
    level,
    xpBonus: 50 + tier * 25,
    title: titles[(tier - 1) % titles.length],
    emoji: ['⭐', '🏆', '💎', '🎖️', '👑', '🌟', '🔥', '🎯', '💫', '🏅'][(tier - 1) % 10],
  };
}

/* ═══════════════════════════════════════════════════
   💾  PERSISTENCE
   ═══════════════════════════════════════════════════ */

function defaultProgress(): PlayerProgress {
  return {
    currentLevel: 1,
    highestLevel: 1,
    totalXP: 0,
    totalStars: 0,
    streak: 0,
    lastPlayedDate: '',
    levelStars: {},
    worldsUnlocked: [0],
    achievements: [],
  };
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw) as PlayerProgress;
    if (!p.levelStars) p.levelStars = {};
    if (!p.worldsUnlocked) p.worldsUnlocked = [0];
    if (!p.achievements) p.achievements = [];
    return p;
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch { /* quota exceeded */ }
}

export function updateStreak(p: PlayerProgress): PlayerProgress {
  const today = new Date().toISOString().slice(0, 10);
  if (p.lastPlayedDate === today) return p;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = p.lastPlayedDate === yesterday ? p.streak + 1 : 1;
  return { ...p, streak: newStreak, lastPlayedDate: today };
}

export function completeLevel(
  p: PlayerProgress,
  level: number,
  starsEarned: number,
  xpEarned: number,
): PlayerProgress {
  const updated = { ...p };

  const milestone = getMilestoneReward(level);
  updated.totalXP += xpEarned + (milestone ? milestone.xpBonus : 0);

  const prev = updated.levelStars[level] || 0;
  if (starsEarned > prev) {
    updated.totalStars += starsEarned - prev;
    updated.levelStars[level] = starsEarned;
  }

  if (level >= updated.highestLevel) {
    updated.highestLevel = level + 1;
    updated.currentLevel = level + 1;
  }

  const newWorld = getWorld(updated.highestLevel);
  if (newWorld >= 0 && !updated.worldsUnlocked.includes(newWorld)) {
    updated.worldsUnlocked.push(newWorld);
  }

  checkAchievements(updated);
  return updated;
}

function checkAchievements(p: PlayerProgress): void {
  const add = (id: string) => { if (!p.achievements.includes(id)) p.achievements.push(id); };
  if (p.totalStars >= 10)  add('star_10');
  if (p.totalStars >= 50)  add('star_50');
  if (p.totalStars >= 100) add('star_100');
  if (p.totalStars >= 250) add('star_250');
  if (p.totalStars >= 500) add('star_500');
  if (p.totalStars >= 1000) add('star_1000');
  if (p.streak >= 3)  add('streak_3');
  if (p.streak >= 7)  add('streak_7');
  if (p.streak >= 14) add('streak_14');
  if (p.streak >= 30) add('streak_30');
  if (p.streak >= 60) add('streak_60');
  if (p.highestLevel >= 31)  add('coral_find');
  if (p.highestLevel >= 81)  add('coral_all');
  if (p.highestLevel >= 151) add('world_rainbow');
  if (p.highestLevel >= 401) add('world_puzzle');
  if (p.highestLevel >= 751) add('world_master');
  if (p.highestLevel >= 901) add('world_mega');
  if (p.highestLevel >= 1001) add('infinite_explorer');
  const m500 = Math.floor(p.highestLevel / 500);
  for (let i = 1; i <= m500; i++) add(`milestone_${i * 500}`);
}

/* ═══════════════════════════════════════════════════
   📊  PHASE DESCRIPTORS
   ═══════════════════════════════════════════════════ */

export const PHASE_META: Record<number, { name: string; emoji: string; desc: string }> = {
  1: { name: 'Single Paint',    emoji: '🎨', desc: 'Paint one shape the right colour' },
  2: { name: 'Find & Paint',    emoji: '🔍', desc: 'Find the right shape and paint it' },
  3: { name: 'Paint All!',      emoji: '🎯', desc: 'Paint all shapes of one type' },
  4: { name: 'Count & Paint',   emoji: '🔢', desc: 'Count and paint the right number' },
  5: { name: 'Rainbow Paint',   emoji: '🌈', desc: 'Each shape tells you its color — paint it!' },
  6: { name: 'Master Logic',    emoji: '🧠', desc: 'Follow rules: avoid colors, match sizes' },
  7: { name: 'Mega Master',     emoji: '🏆', desc: 'Colour the parts of big objects' },
};

export const STREAK_MESSAGES: Record<number, string> = {
  1: 'Welcome back! 🦊',
  2: '2 days in a row! Keep going! 🔥',
  3: '3-day streak! You\'re on fire! 🔥🔥',
  5: '5 days! Incredible! 🌟',
  7: 'One full week! You\'re a star! ⭐⭐⭐',
  14: '2 weeks! Amazing dedication! 🏆',
  30: '30-day streak! Legend! 👑',
  60: '60 days! You are UNSTOPPABLE! 🔥👑🔥',
};

export const BOSS_TITLES = [
  'Mini Boss! 🎯', 'Challenge Time! ⚡', 'Boss Level! 🔥',
  'Epic Challenge! 💎', 'Grand Test! 🏆',
];
