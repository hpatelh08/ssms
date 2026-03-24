/**
 * Progress Store – localStorage-backed progress, badges, retry
 * =============================================================
 */

import {
  Difficulty, GameProgress, DifficultyProgress, MiniLevelProgress,
  GameMasteryStore, BADGE_DEFS,
} from './types';

const MASTERY_KEY = 'gameMastery';
const RETRY_KEY = 'gameRetryPool';

// ── Default progress ──

function defaultDiffProgress(): DifficultyProgress {
  return { miniLevels: {}, completed: false, bestScore: 0, timeTaken: 0 };
}

function defaultGameProgress(): GameProgress {
  return {
    easy: defaultDiffProgress(),
    intermediate: defaultDiffProgress(),
    difficult: defaultDiffProgress(),
    badges: [],
  };
}

// ── Load / Save ──

export function loadMastery(): GameMasteryStore {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveMastery(store: GameMasteryStore) {
  localStorage.setItem(MASTERY_KEY, JSON.stringify(store));
}

export function getGameKey(subject: string, chapter: string, gameType: string): string {
  return `${subject}_${chapter}_${gameType}`;
}

export function getGameProgress(subject: string, chapter: string, gameType: string): GameProgress {
  const store = loadMastery();
  const key = getGameKey(subject, chapter, gameType);
  return store[key] || defaultGameProgress();
}

// ── Save mini-level result ──

export function saveMiniLevelResult(
  subject: string, chapter: string, gameType: string,
  difficulty: Difficulty, miniLevel: number,
  score: number, total: number,
): { badges: string[]; newBadge: string | null } {
  const store = loadMastery();
  const key = getGameKey(subject, chapter, gameType);
  if (!store[key]) store[key] = defaultGameProgress();

  const gp = store[key];
  const dp = gp[difficulty];

  // ── Star rating: 5/5→3, 3-4/5→2, 1-2/5→1, 0/5→0 ──
  const stars = total > 0 && score === total ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
  const pandaCount = stars;

  // Keep best stars achieved across retries
  const existingStars = dp.miniLevels[miniLevel]?.stars ?? 0;
  const finalStars = Math.max(existingStars, stars);
  const wasCompleted = dp.miniLevels[miniLevel]?.completed ?? false;

  // Save mini-level (only mark completed if at least 1 star earned)
  dp.miniLevels[miniLevel] = {
    completed: wasCompleted || stars >= 1,
    score,
    total,
    stars: finalStars,
    pandaCount: finalStars,
  };

  // Update best score
  const totalScore = Object.values(dp.miniLevels).reduce((s, ml) => s + ml.score, 0);
  dp.bestScore = Math.max(dp.bestScore, totalScore);

  // Check if all levels for this difficulty are completed
  // Dynamically import-safe: count completed vs expected
  const LEVEL_COUNTS: Record<string, number> = { easy: 40, intermediate: 30, difficult: 30 };
  const expected = LEVEL_COUNTS[difficulty] || 5;
  const completedCount = Object.values(dp.miniLevels).filter(ml => ml.completed).length;
  if (completedCount >= expected) dp.completed = true;

  // Badge logic
  let newBadge: string | null = null;

  if (difficulty === 'easy' && dp.completed && !gp.badges.includes(BADGE_DEFS.easy_star.id)) {
    gp.badges.push(BADGE_DEFS.easy_star.id);
    newBadge = BADGE_DEFS.easy_star.id;
  }
  if (difficulty === 'intermediate' && dp.completed && !gp.badges.includes(BADGE_DEFS.silver.id)) {
    gp.badges.push(BADGE_DEFS.silver.id);
    newBadge = BADGE_DEFS.silver.id;
  }
  if (difficulty === 'difficult' && dp.completed && !gp.badges.includes(BADGE_DEFS.golden.id)) {
    gp.badges.push(BADGE_DEFS.golden.id);
    newBadge = BADGE_DEFS.golden.id;
  }

  saveMastery(store);
  return { badges: gp.badges, newBadge };
}

// ── Save difficulty completion time ──

export function saveDifficultyTime(
  subject: string, chapter: string, gameType: string,
  difficulty: Difficulty, timeTaken: number,
) {
  const store = loadMastery();
  const key = getGameKey(subject, chapter, gameType);
  if (!store[key]) store[key] = defaultGameProgress();
  const dp = store[key][difficulty];
  if (dp.timeTaken === 0 || timeTaken < dp.timeTaken) dp.timeTaken = timeTaken;
  saveMastery(store);
}

// ── Check all difficulties complete (for XP_ALL_BONUS) ──

export function allDifficultiesComplete(subject: string, chapter: string, gameType: string): boolean {
  const gp = getGameProgress(subject, chapter, gameType);
  return gp.easy.completed && gp.intermediate.completed && gp.difficult.completed;
}

// ── Retry Pool ──

interface RetryPoolEntry {
  key: string;
  questionIds: string[];
}

export function saveRetryPool(sessionKey: string, questionIds: string[]) {
  try {
    const raw = localStorage.getItem(RETRY_KEY);
    const pools: RetryPoolEntry[] = raw ? JSON.parse(raw) : [];
    const existing = pools.find(p => p.key === sessionKey);
    if (existing) existing.questionIds = questionIds;
    else pools.push({ key: sessionKey, questionIds });
    // Keep last 20 sessions
    const trimmed = pools.slice(-20);
    localStorage.setItem(RETRY_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function loadRetryPool(sessionKey: string): string[] {
  try {
    const raw = localStorage.getItem(RETRY_KEY);
    const pools: RetryPoolEntry[] = raw ? JSON.parse(raw) : [];
    return pools.find(p => p.key === sessionKey)?.questionIds || [];
  } catch { return []; }
}

export function clearRetryPool(sessionKey: string) {
  try {
    const raw = localStorage.getItem(RETRY_KEY);
    const pools: RetryPoolEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = pools.filter(p => p.key !== sessionKey);
    localStorage.setItem(RETRY_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}
