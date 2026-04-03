/**
 * child/milestone/levelData.ts
 * ─────────────────────────────────────────────────────
 * 50-Level Magical Learning Kingdom — 5 Worlds × 10 Levels
 *
 * ⭐ STAR SYSTEM:
 *   XP is the backend currency.
 *   Frontend shows "Stars" — each star = completing a fun task.
 *   Stars are derived: stars = floor(totalXP / STAR_VALUE)
 *   Child-facing text: "Earn 2 more stars to unlock!"
 *
 * 🧠 PROGRESSION:
 *   World 1-2: Linear (must complete in order)
 *   World 3-5: Semi-open (can skip ahead within the world
 *              once you reach the world, but boss still requires all 9)
 *
 * Hybrid types: game | chapter | skill | boss
 */

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export type LevelState = 'locked' | 'active' | 'completed';
export type LevelType = 'game' | 'chapter' | 'skill' | 'boss';
export type RewardType = 'badge' | 'bonusStars' | 'gardenItem' | 'title' | 'cosmetic' | 'surprise';

export interface LevelReward {
  type: RewardType;
  value: string | number;
  icon: string;
  label: string;
  /** Child-friendly description shown in modal */
  magicText: string;
}

export interface WorldDef {
  id: string;
  order: number;
  name: string;
  emoji: string;
  /** Tailwind bg gradient for the world strip */
  bgGradient: string;
  /** Accent color for completed road segments */
  roadColor: string;
  tagline: string;
  /** Ground deco emojis pool */
  decoEmojis: string[];
  /** Does this world allow semi-open progression? */
  semiOpen: boolean;
}

export interface Level {
  id: string;
  order: number;               // global 0-49
  worldId: string;
  worldOrder: number;           // 1-10 within world
  title: string;
  emoji: string;
  type: LevelType;
  /** Cumulative XP required */
  requiredXP: number;
  /** Stars needed (derived from requiredXP) */
  requiredStars: number;
  /** Optional: must have completed game/chapter/skill id */
  requiredGame?: string;
  requiredChapter?: string;
  requiredSkill?: string;
  reward: LevelReward;
  gradient: string;
  glowColor: string;
  /** Wave Y (0-1) for road curve positioning */
  waveY: number;
  /** Child-friendly unlock hint */
  unlockHint: string;
}

export interface LevelProgress {
  levelId: string;
  state: LevelState;
  completedAt?: string;
  rewardClaimed: boolean;
}

/* ═══════════════════════════════════════════════════
   DEMO MODE — unlocks all 50 levels
   ═══════════════════════════════════════════════════ */

/** Set to true to unlock every level regardless of XP / progression. */
export const DEMO_MODE = true;

/* ═══════════════════════════════════════════════════
   STAR ↔ XP CONVERSION
   ═══════════════════════════════════════════════════ */

/** XP value of one star */
export const STAR_VALUE = 10;

/** Convert total XP to display stars. */
export function xpToStars(totalXP: number): number {
  return Math.floor(totalXP / STAR_VALUE);
}

/** Convert star requirement to XP. */
export function starsToXP(stars: number): number {
  return stars * STAR_VALUE;
}

/* ═══════════════════════════════════════════════════
   CUMULATIVE XP CALCULATOR
   ═══════════════════════════════════════════════════ */

function xpForLevel(level: number): number {
  return 20 + level * 10 + Math.floor(level * level * 2);
}

export function cumulativeXP(level: number, currentXP: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total + currentXP;
}

/* ═══════════════════════════════════════════════════
   5 WORLDS
   ═══════════════════════════════════════════════════ */

export const WORLDS: WorldDef[] = [
  {
    id: 'w1', order: 0, name: 'Alphabet Meadow', emoji: '🌻',
    bgGradient: 'from-lime-100/70 via-green-50/50 to-emerald-100/70',
    roadColor: '#86efac', tagline: 'Letters & Sounds',
    decoEmojis: ['🌱', '🌻', '🐝', '🦋', '🌸', '🍀'],
    semiOpen: false,
  },
  {
    id: 'w2', order: 1, name: 'Number Mountain', emoji: '🔢',
    bgGradient: 'from-sky-100/70 via-blue-50/50 to-cyan-100/70',
    roadColor: '#7dd3fc', tagline: 'Numbers & Counting',
    decoEmojis: ['🪨', '⛰️', '🏔️', '🐐', '❄️', '🌲'],
    semiOpen: false,
  },
  {
    id: 'w3', order: 2, name: 'Story Forest', emoji: '📚',
    bgGradient: 'from-amber-100/70 via-yellow-50/50 to-orange-100/70',
    roadColor: '#fcd34d', tagline: 'Reading & Stories',
    decoEmojis: ['🌳', '🍄', '🦊', '🐿️', '🍂', '🪵'],
    semiOpen: true,
  },
  {
    id: 'w4', order: 3, name: 'Science Ocean', emoji: '🔬',
    bgGradient: 'from-violet-100/70 via-purple-50/50 to-fuchsia-100/70',
    roadColor: '#c4b5fd', tagline: 'Explore & Discover',
    decoEmojis: ['🐠', '🐙', '🐚', '🪸', '🌊', '⭐'],
    semiOpen: true,
  },
  {
    id: 'w5', order: 4, name: 'Champion Castle', emoji: '🏰',
    bgGradient: 'from-rose-100/70 via-pink-50/50 to-red-100/70',
    roadColor: '#fda4af', tagline: 'Master Everything!',
    decoEmojis: ['🏰', '👑', '⚔️', '🛡️', '🎪', '🎠'],
    semiOpen: true,
  },
];

/* ═══════════════════════════════════════════════════
   LEVEL GENERATOR TABLES
   ═══════════════════════════════════════════════════ */

const WAVE_Y = [0.30, 0.62, 0.26, 0.66, 0.33, 0.58, 0.28, 0.64, 0.35, 0.52];

function levelType(wo: number): LevelType {
  if (wo === 10) return 'boss';
  if (wo <= 3)  return 'game';
  if (wo <= 6)  return 'chapter';
  return 'skill';
}

/* Star requirements (cumulative) — gentle curve */
const STAR_TABLE: number[] = [
  /* W1 */  0,  2,  5,  7, 10, 13, 16, 18, 20, 22,
  /* W2 */ 25, 28, 31, 35, 38, 42, 46, 49, 52, 55,
  /* W3 */ 60, 64, 69, 74, 80, 86, 92, 98,103,108,
  /* W4 */115,122,130,138,147,156,166,176,185,192,
  /* W5 */200,210,221,232,245,258,272,286,300,315,
];

/* Gradient palettes per world */
const GRADS: Record<string, string[]> = {
  w1: ['from-lime-300 to-green-400', 'from-green-300 to-emerald-400', 'from-emerald-300 to-teal-400', 'from-teal-300 to-cyan-400', 'from-lime-400 to-green-500'],
  w2: ['from-sky-300 to-blue-400', 'from-blue-300 to-indigo-400', 'from-cyan-300 to-sky-400', 'from-indigo-300 to-blue-500', 'from-sky-400 to-blue-500'],
  w3: ['from-amber-300 to-yellow-400', 'from-yellow-300 to-orange-400', 'from-orange-300 to-amber-400', 'from-amber-400 to-yellow-500', 'from-yellow-400 to-amber-500'],
  w4: ['from-violet-300 to-purple-400', 'from-purple-300 to-fuchsia-400', 'from-fuchsia-300 to-pink-400', 'from-indigo-300 to-violet-400', 'from-purple-400 to-indigo-500'],
  w5: ['from-rose-300 to-pink-400', 'from-pink-300 to-red-400', 'from-red-300 to-rose-400', 'from-pink-400 to-rose-500', 'from-rose-400 to-red-500'],
};

const GLOWS: Record<string, string> = {
  w1: 'rgba(74,222,128,0.5)',
  w2: 'rgba(56,189,248,0.5)',
  w3: 'rgba(251,191,36,0.5)',
  w4: 'rgba(167,139,250,0.5)',
  w5: 'rgba(251,113,133,0.5)',
};

/* ── Per-world level definitions ── */

interface LvMeta {
  title: string; emoji: string; reward: LevelReward;
  requiredGame?: string; requiredChapter?: string; requiredSkill?: string;
  unlockHint: string;
}

const W1: LvMeta[] = [
  { title: 'Hello ABCs', emoji: '🔤', unlockHint: 'Your adventure starts here!', reward: { type: 'badge', value: 'ABC Badge', icon: '🏅', label: 'ABC Badge', magicText: 'You know your ABCs! Amazing!' }, requiredGame: 'alphabet-match' },
  { title: 'Vowel Valley', emoji: '🅰️', unlockHint: 'Play 2 fun tasks to unlock!', reward: { type: 'bonusStars', value: 2, icon: '⭐', label: '+2 Stars', magicText: 'Bonus stars for you!' }, requiredGame: 'vowel-pop' },
  { title: 'Letter Sounds', emoji: '🔊', unlockHint: 'Complete 2 more tasks!', reward: { type: 'badge', value: 'Sound Star', icon: '🌟', label: 'Sound Star', magicText: 'You hear all the sounds!' }, requiredGame: 'phonics-blast' },
  { title: 'First Words', emoji: '📝', unlockHint: 'Read the My Name chapter!', reward: { type: 'bonusStars', value: 2, icon: '⭐', label: '+2 Stars', magicText: 'Words are magical!' }, requiredChapter: 'ch-my-name' },
  { title: 'My Family', emoji: '👨‍👩‍👧', unlockHint: 'Learn about your family!', reward: { type: 'gardenItem', value: 'Family Tree', icon: '🌳', label: 'Family Tree', magicText: 'A tree for your garden!' }, requiredChapter: 'ch-my-family' },
  { title: 'Animal Friends', emoji: '🐶', unlockHint: 'Read about the animals!', reward: { type: 'badge', value: 'Animal Pal', icon: '🐾', label: 'Animal Pal', magicText: 'Best friends with animals!' }, requiredChapter: 'ch-animals' },
  { title: 'Shape Spotter', emoji: '🔺', unlockHint: 'Practice your shapes!', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'Shape detective!' }, requiredSkill: 'shapes' },
  { title: 'Color Splash', emoji: '🎨', unlockHint: 'Show your color skills!', reward: { type: 'cosmetic', value: 'Rainbow Trail', icon: '🌈', label: 'Rainbow Trail', magicText: 'Colors follow you now!' }, requiredSkill: 'colors' },
  { title: 'Rhyme Time', emoji: '🎶', unlockHint: 'Practice rhyming words!', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'You are a rhyming master!' }, requiredSkill: 'rhyming' },
  { title: 'Meadow Boss', emoji: '🌻', unlockHint: 'Beat the Meadow Boss!', reward: { type: 'title', value: 'Meadow Master', icon: '👑', label: 'Meadow Master', magicText: 'You conquered the meadow!' } },
];

const W2: LvMeta[] = [
  { title: 'Count to 10', emoji: '🔢', unlockHint: 'Count everything around you!', reward: { type: 'badge', value: 'Counter Badge', icon: '🏅', label: 'Counter', magicText: 'Counting champion!' }, requiredGame: 'count-objects' },
  { title: 'Number Buddies', emoji: '🤝', unlockHint: 'Play 2 fun tasks!', reward: { type: 'bonusStars', value: 2, icon: '⭐', label: '+2 Stars', magicText: 'Numbers are friends!' }, requiredGame: 'number-match' },
  { title: 'Add & Fun', emoji: '➕', unlockHint: 'Try the addition game!', reward: { type: 'badge', value: 'Plus Star', icon: '⭐', label: 'Addition Star', magicText: 'Adding is easy peasy!' }, requiredGame: 'simple-add' },
  { title: 'Take Away', emoji: '➖', unlockHint: 'Learn subtraction!', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'Subtraction hero!' }, requiredChapter: 'ch-subtraction' },
  { title: 'Big & Small', emoji: '📏', unlockHint: 'Compare sizes!', reward: { type: 'gardenItem', value: 'Magic Ruler', icon: '📐', label: 'Magic Ruler', magicText: 'A ruler for your garden!' }, requiredChapter: 'ch-comparison' },
  { title: 'Patterns', emoji: '🎲', unlockHint: 'Find the patterns!', reward: { type: 'badge', value: 'Pattern Pro', icon: '🧩', label: 'Pattern Pro', magicText: 'Pattern detective!' }, requiredChapter: 'ch-patterns' },
  { title: 'Clock Friend', emoji: '🕐', unlockHint: 'Learn to tell time!', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'Time wizard!' }, requiredSkill: 'telling-time' },
  { title: 'Money Coins', emoji: '🪙', unlockHint: 'Count the coins!', reward: { type: 'cosmetic', value: 'Gold Sparkle', icon: '✨', label: 'Gold Sparkle', magicText: 'Everything sparkles gold!' }, requiredSkill: 'money-coins' },
  { title: 'Math Magic', emoji: '🎩', unlockHint: 'Show your math tricks!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Math magician!' }, requiredSkill: 'math-facts' },
  { title: 'Mountain Boss', emoji: '⛰️', unlockHint: 'Conquer the mountain!', reward: { type: 'title', value: 'Math King', icon: '👑', label: 'Mountain King', magicText: 'Ruler of Number Mountain!' } },
];

const W3: LvMeta[] = [
  { title: 'Story Starter', emoji: '📖', unlockHint: 'Start your first story!', reward: { type: 'badge', value: 'Story Star', icon: '🌟', label: 'Story Star', magicText: 'Story lover!' }, requiredGame: 'story-builder' },
  { title: 'Picture Tales', emoji: '🖼️', unlockHint: 'What do the pictures say?', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'Pictures tell stories!' }, requiredGame: 'picture-story' },
  { title: 'Word Treasure', emoji: '💎', unlockHint: 'Hunt for new words!', reward: { type: 'badge', value: 'Vocab Gem', icon: '💎', label: 'Vocab Gem', magicText: 'Word collector!' }, requiredGame: 'word-hunt' },
  { title: 'Sentence Land', emoji: '✏️', unlockHint: 'Build a sentence!', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'Sentence builder!' }, requiredChapter: 'ch-sentences' },
  { title: 'Poem Garden', emoji: '🌹', unlockHint: 'Read a beautiful poem!', reward: { type: 'gardenItem', value: 'Rose Bush', icon: '🌹', label: 'Rose Bush', magicText: 'A rose for your garden!' }, requiredChapter: 'ch-poems' },
  { title: 'Fairy Tales', emoji: '🧚', unlockHint: 'Enter the fairy world!', reward: { type: 'badge', value: 'Fairy Fan', icon: '🧚', label: 'Fairy Fan', magicText: 'Friend of fairies!' }, requiredChapter: 'ch-fairy-tales' },
  { title: 'Questions', emoji: '❓', unlockHint: 'Answer some fun questions!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Curious mind!' }, requiredSkill: 'comprehension' },
  { title: 'Spell Caster', emoji: '🪄', unlockHint: 'Cast the spelling spell!', reward: { type: 'cosmetic', value: 'Magic Wand', icon: '🪄', label: 'Magic Wand', magicText: 'Spelling wizard!' }, requiredSkill: 'spelling' },
  { title: 'Story Writer', emoji: '📝', unlockHint: 'Write your own story!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Author in training!' }, requiredSkill: 'creative-writing' },
  { title: 'Forest Boss', emoji: '🌲', unlockHint: 'Beat the Forest Boss!', reward: { type: 'title', value: 'Story King', icon: '👑', label: 'Forest King', magicText: 'Master of all stories!' } },
];

const W4: LvMeta[] = [
  { title: 'Nature Walk', emoji: '🌿', unlockHint: 'Explore nature!', reward: { type: 'badge', value: 'Explorer', icon: '🧭', label: 'Explorer', magicText: 'Nature explorer!' }, requiredGame: 'nature-quiz' },
  { title: 'Body Parts', emoji: '🫀', unlockHint: 'Learn about your body!', reward: { type: 'bonusStars', value: 3, icon: '⭐', label: '+3 Stars', magicText: 'Body knowledge!' }, requiredGame: 'body-parts' },
  { title: 'Weather Watch', emoji: '🌤️', unlockHint: 'What is the weather today?', reward: { type: 'badge', value: 'Weather Watcher', icon: '☀️', label: 'Weather Watcher', magicText: 'Weather expert!' }, requiredGame: 'weather-match' },
  { title: 'Plant Life', emoji: '🌱', unlockHint: 'Grow a plant!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Green thumb!' }, requiredChapter: 'ch-plants' },
  { title: 'Water World', emoji: '💧', unlockHint: 'Dive into water!', reward: { type: 'gardenItem', value: 'Crystal Fountain', icon: '⛲', label: 'Crystal Fountain', magicText: 'A fountain for your garden!' }, requiredChapter: 'ch-water' },
  { title: 'Day & Night', emoji: '🌓', unlockHint: 'When does the sun sleep?', reward: { type: 'badge', value: 'Sky Gazer', icon: '🔭', label: 'Sky Gazer', magicText: 'Sky gazer!' }, requiredChapter: 'ch-day-night' },
  { title: 'Five Senses', emoji: '👁️', unlockHint: 'Use all your senses!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Sense master!' }, requiredSkill: 'five-senses' },
  { title: 'Materials', emoji: '🧲', unlockHint: 'What are things made of?', reward: { type: 'cosmetic', value: 'Magnet Trail', icon: '🧲', label: 'Magnet Trail', magicText: 'Magnetic personality!' }, requiredSkill: 'materials' },
  { title: 'Earth Care', emoji: '🌍', unlockHint: 'Take care of our Earth!', reward: { type: 'bonusStars', value: 5, icon: '⭐', label: '+5 Stars', magicText: 'Earth guardian!' }, requiredSkill: 'environment' },
  { title: 'Ocean Boss', emoji: '🔬', unlockHint: 'Defeat the Ocean Boss!', reward: { type: 'title', value: 'Science Champion', icon: '👑', label: 'Science Champion', magicText: 'Master of discoveries!' } },
];

const W5: LvMeta[] = [
  { title: 'Art Attack', emoji: '🎨', unlockHint: 'Create some art!', reward: { type: 'badge', value: 'Artist', icon: '🖌️', label: 'Artist', magicText: 'Creative genius!' }, requiredGame: 'draw-challenge' },
  { title: 'Music Time', emoji: '🎵', unlockHint: 'Play some music!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Musical prodigy!' }, requiredGame: 'rhythm-game' },
  { title: 'Sport Stars', emoji: '⚽', unlockHint: 'Play the sport quiz!', reward: { type: 'badge', value: 'Sports Star', icon: '🏆', label: 'Sports Star', magicText: 'Athletic champion!' }, requiredGame: 'sport-trivia' },
  { title: 'Good Manners', emoji: '🤗', unlockHint: 'Show your good manners!', reward: { type: 'bonusStars', value: 4, icon: '⭐', label: '+4 Stars', magicText: 'Polite and kind!' }, requiredChapter: 'ch-manners' },
  { title: 'My India', emoji: '🇮🇳', unlockHint: 'Learn about India!', reward: { type: 'gardenItem', value: 'Peacock Statue', icon: '🦚', label: 'Peacock Statue', magicText: 'A peacock for your garden!' }, requiredChapter: 'ch-india' },
  { title: 'Festivals', emoji: '🎉', unlockHint: 'Celebrate our festivals!', reward: { type: 'badge', value: 'Festival Fan', icon: '🎊', label: 'Festival Fan', magicText: 'Loves celebrations!' }, requiredChapter: 'ch-festivals' },
  { title: 'Brain Gym', emoji: '🧠', unlockHint: 'Exercise your brain!', reward: { type: 'bonusStars', value: 5, icon: '⭐', label: '+5 Stars', magicText: 'Super brain!' }, requiredSkill: 'logic' },
  { title: 'Memory King', emoji: '🃏', unlockHint: 'Remember them all!', reward: { type: 'cosmetic', value: 'Crown Sparkle', icon: '👑', label: 'Crown Sparkle', magicText: 'Royal memory!' }, requiredSkill: 'memory' },
  { title: 'Quiz Whiz', emoji: '🧩', unlockHint: 'Answer the big quiz!', reward: { type: 'bonusStars', value: 6, icon: '⭐', label: '+6 Stars', magicText: 'Quiz champion!' }, requiredSkill: 'general-knowledge' },
  { title: 'Castle Boss', emoji: '🏰', unlockHint: 'The final battle!', reward: { type: 'surprise', value: 'Mystery', icon: '🎁', label: 'Ultimate Mystery Reward', magicText: 'Only legends unlock this!' } },
];

const WORLD_METAS: Record<string, LvMeta[]> = { w1: W1, w2: W2, w3: W3, w4: W4, w5: W5 };

/* ═══════════════════════════════════════════════════
   GENERATOR
   ═══════════════════════════════════════════════════ */

function generateLevels(): Level[] {
  const levels: Level[] = [];

  for (const world of WORLDS) {
    const metas = WORLD_METAS[world.id];
    const grads = GRADS[world.id];
    const glow  = GLOWS[world.id];

    for (let i = 0; i < 10; i++) {
      const globalIdx  = world.order * 10 + i;
      const worldOrder = i + 1;
      const meta = metas[i];
      const stars = STAR_TABLE[globalIdx];

      levels.push({
        id: `lv-${globalIdx + 1}`,
        order: globalIdx,
        worldId: world.id,
        worldOrder,
        title: meta.title,
        emoji: meta.emoji,
        type: levelType(worldOrder),
        requiredXP: starsToXP(stars),
        requiredStars: stars,
        requiredGame: meta.requiredGame,
        requiredChapter: meta.requiredChapter,
        requiredSkill: meta.requiredSkill,
        reward: meta.reward,
        gradient: grads[i % grads.length],
        glowColor: glow,
        waveY: WAVE_Y[i],
        unlockHint: meta.unlockHint,
      });
    }
  }
  return levels;
}

/* ═══════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════ */

export const LEVELS: Level[] = generateLevels();
export const MAX_LEVEL_XP    = LEVELS[LEVELS.length - 1].requiredXP;   // 3150
export const MAX_LEVEL_STARS = LEVELS[LEVELS.length - 1].requiredStars; // 315
export const TOTAL_LEVELS    = LEVELS.length;                           // 50

export function levelsByWorld(): Map<string, Level[]> {
  const m = new Map<string, Level[]>();
  for (const lv of LEVELS) {
    const arr = m.get(lv.worldId) ?? [];
    arr.push(lv); m.set(lv.worldId, arr);
  }
  return m;
}

export function getWorld(id: string): WorldDef | undefined {
  return WORLDS.find(w => w.id === id);
}
