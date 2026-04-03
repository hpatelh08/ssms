export const SAVE_OCEAN_TOTAL_LEVELS = Number.MAX_SAFE_INTEGER;
export const SAVE_OCEAN_DAILY_NEW_LEVEL_LIMIT = 5;
const SAVE_OCEAN_STORAGE_KEY = 'save_ocean_progress_v2';

export type SaveOceanDifficulty = 'easy' | 'medium' | 'hard';

export interface ScoreTuning {
  trashPoints: number;
  fishPenalty: number;
  distractionPenalty: number;
  missPenalty: number;
}

export interface PatternModifiers {
  laneVariance: number;
  clusterChance: number;
  waveIntensity: number;
  milestoneBoost: boolean;
}

export interface SaveOceanLevelConfig {
  levelNumber: number;
  difficulty: SaveOceanDifficulty;
  targetScore: number;
  trashSpawnCount: number;
  fishCount: number;
  obstacleCount: number;
  movementSpeed: number;
  timeLimitSec?: number;
  scoreValues: ScoreTuning;
  patternModifiers: PatternModifiers;
  isMilestone: boolean;
}

export interface LevelCompletionRecord {
  bestScore: number;
  bestStars: number;
  attempts: number;
  lastCompletedAt: string;
}

export interface DailyProgressState {
  date: string;
  newLevelCompletions: number;
}

export interface SaveOceanProgress {
  highestUnlockedLevel: number;
  lastPlayedLevel: number;
  completedLevels: Record<number, LevelCompletionRecord>;
  daily: DailyProgressState;
}

export interface SaveOceanRunResult {
  score: number;
  mistakes: number;
  timeLeftSec?: number;
}

export interface ApplyLevelCompletionResult {
  progress: SaveOceanProgress;
  newlyCompleted: boolean;
  unlockedNextLevel: boolean;
  dailyLimitBlocked: boolean;
  starsAwarded: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

function toDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function normalizeLevel(levelNumber: number): number {
  const parsed = Math.floor(levelNumber || 1);
  return Math.max(1, parsed);
}

function difficultyForLevel(levelNumber: number): SaveOceanDifficulty {
  if (levelNumber <= 333) return 'easy';
  if (levelNumber <= 666) return 'medium';
  return 'hard';
}

export function getDifficultyLabel(levelNumber: number): string {
  const d = difficultyForLevel(levelNumber);
  if (d === 'easy') return 'Easy';
  if (d === 'medium') return 'Medium';
  return 'Hard';
}

export function getLevelConfig(levelNumber: number): SaveOceanLevelConfig {
  const level = normalizeLevel(levelNumber);
  const difficulty = difficultyForLevel(level);

  let localProgress = 0;
  if (difficulty === 'easy') {
    localProgress = (level - 1) / 332;
  } else if (difficulty === 'medium') {
    localProgress = (level - 334) / 332;
  } else {
    // Endless hard mode: difficulty ramps inside repeating cycles.
    const hardCycleSize = 250;
    localProgress = ((level - 667) % hardCycleSize) / (hardCycleSize - 1);
  }
  localProgress = clamp(localProgress, 0, 1);

  const globalStep = Math.floor((level - 1) / 15);
  const earlyWelcomeBand = level <= 30;
  const isMilestone = level % 25 === 0 || level % 50 === 0;

  const base = {
    easy: {
      trashMin: 4, trashMax: 12,
      fishMin: 1, fishMax: 5,
      obstacleMin: 0, obstacleMax: 3,
      speedMin: 0.72, speedMax: 1.14,
      timeMin: 42, timeMax: 70,
      score: { trashPoints: 10, fishPenalty: 4, distractionPenalty: 3, missPenalty: 2 },
    },
    medium: {
      trashMin: 8, trashMax: 17,
      fishMin: 3, fishMax: 8,
      obstacleMin: 1, obstacleMax: 6,
      speedMin: 1.0, speedMax: 1.48,
      timeMin: 34, timeMax: 56,
      score: { trashPoints: 12, fishPenalty: 6, distractionPenalty: 5, missPenalty: 3 },
    },
    hard: {
      trashMin: 13, trashMax: 24,
      fishMin: 5, fishMax: 11,
      obstacleMin: 3, obstacleMax: 9,
      speedMin: 1.24, speedMax: 1.95,
      timeMin: 24, timeMax: 44,
      score: { trashPoints: 14, fishPenalty: 8, distractionPenalty: 7, missPenalty: 4 },
    },
  }[difficulty];

  const trashSpawnCount = Math.round(lerp(base.trashMin, base.trashMax, localProgress)) + (globalStep % 2);
  const fishCount = Math.round(lerp(base.fishMin, base.fishMax, localProgress)) + (globalStep % 3 === 0 ? 1 : 0);
  const obstacleCount = Math.round(lerp(base.obstacleMin, base.obstacleMax, localProgress)) + (globalStep % 4 === 0 ? 1 : 0);

  const movementSpeed = Number((lerp(base.speedMin, base.speedMax, localProgress) + (globalStep % 5) * 0.01).toFixed(2));
  const milestoneScale = isMilestone ? 1.1 : 1;

  let tunedTrash = Math.round(trashSpawnCount * milestoneScale);
  let tunedFish = Math.round(fishCount * milestoneScale);
  let tunedObstacle = Math.round(obstacleCount * milestoneScale);

  if (earlyWelcomeBand) {
    tunedTrash = Math.max(3, Math.round(tunedTrash * 0.72));
    tunedFish = Math.max(1, Math.round(tunedFish * 0.7));
    tunedObstacle = Math.max(0, Math.round(tunedObstacle * 0.55));
  }

  const scoreValues: ScoreTuning = {
    trashPoints: base.score.trashPoints + (isMilestone ? 1 : 0),
    fishPenalty: base.score.fishPenalty,
    distractionPenalty: base.score.distractionPenalty,
    missPenalty: base.score.missPenalty,
  };

  const baseTarget = tunedTrash * scoreValues.trashPoints;
  const targetScale = earlyWelcomeBand ? 0.68 : (difficulty === 'easy' ? 0.74 : difficulty === 'medium' ? 0.8 : 0.86);
  const targetScore = Math.max(20, Math.round(baseTarget * targetScale));

  const rawTimeLimit = Math.round(lerp(base.timeMax, base.timeMin, localProgress));
  const timeLimitSec = level > 20 ? Math.max(18, rawTimeLimit - (isMilestone ? 2 : 0)) : undefined;

  return {
    levelNumber: level,
    difficulty,
    targetScore,
    trashSpawnCount: tunedTrash,
    fishCount: tunedFish,
    obstacleCount: tunedObstacle,
    movementSpeed,
    timeLimitSec,
    scoreValues,
    patternModifiers: {
      laneVariance: clamp(0.08 + localProgress * 0.2, 0.08, 0.42),
      clusterChance: clamp(0.1 + localProgress * 0.35, 0.1, 0.55),
      waveIntensity: clamp(0.15 + localProgress * 0.45, 0.15, 0.7),
      milestoneBoost: isMilestone,
    },
    isMilestone,
  };
}

function defaultProgress(): SaveOceanProgress {
  return {
    highestUnlockedLevel: 1,
    lastPlayedLevel: 1,
    completedLevels: {},
    daily: {
      date: toDateKey(),
      newLevelCompletions: 0,
    },
  };
}

export function resetDailyIfNeeded(progress: SaveOceanProgress): SaveOceanProgress {
  const today = toDateKey();
  const safeDaily = progress.daily ?? { date: today, newLevelCompletions: 0 };
  if (safeDaily.date === today) {
    return {
      ...progress,
      highestUnlockedLevel: normalizeLevel(progress.highestUnlockedLevel || 1),
      lastPlayedLevel: normalizeLevel(progress.lastPlayedLevel || 1),
      completedLevels: progress.completedLevels ?? {},
      daily: safeDaily,
    };
  }

  return {
    ...progress,
    daily: {
      date: today,
      newLevelCompletions: 0,
    },
  };
}

export function loadSaveOceanProgress(): SaveOceanProgress {
  try {
    const raw = localStorage.getItem(SAVE_OCEAN_STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as SaveOceanProgress;
    return resetDailyIfNeeded({
      ...defaultProgress(),
      ...parsed,
      completedLevels: parsed?.completedLevels ?? {},
      daily: parsed?.daily ?? defaultProgress().daily,
    });
  } catch {
    return defaultProgress();
  }
}

export function saveSaveOceanProgress(progress: SaveOceanProgress): void {
  try {
    localStorage.setItem(SAVE_OCEAN_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota issues to keep gameplay smooth.
  }
}

export function getDailyRemainingNewLevels(progress: SaveOceanProgress): number {
  const safe = resetDailyIfNeeded(progress);
  return Math.max(0, SAVE_OCEAN_DAILY_NEW_LEVEL_LIMIT - safe.daily.newLevelCompletions);
}

export function hasReachedDailyLimit(progress: SaveOceanProgress): boolean {
  return getDailyRemainingNewLevels(progress) <= 0;
}

export function canStartLevel(progress: SaveOceanProgress, levelNumber: number): boolean {
  // Save the Ocean override: all levels are directly playable.
  // Keep a minimum level check so callers cannot request invalid levels.
  const level = normalizeLevel(levelNumber);
  return level >= 1;
}

export function isLevelCompleted(progress: SaveOceanProgress, levelNumber: number): boolean {
  return Boolean(progress.completedLevels[Math.floor(levelNumber)]);
}

export function getDailyLimitMessage(): string {
  return 'Great job! You finished today\'s 5 levels. Come back tomorrow for more ocean cleaning adventures!';
}

export function calculateStars(
  run: SaveOceanRunResult,
  config: SaveOceanLevelConfig,
): number {
  const scoreRatio = run.score / Math.max(1, config.targetScore);
  const fastBonus = config.timeLimitSec && typeof run.timeLeftSec === 'number'
    ? run.timeLeftSec / Math.max(1, config.timeLimitSec)
    : 0;

  if (scoreRatio >= 1.2 && run.mistakes <= 1 && fastBonus > 0.2) return 3;
  if (scoreRatio >= 1 && run.mistakes <= 3) return 2;
  return 1;
}

export function applyLevelCompletion(
  progress: SaveOceanProgress,
  levelNumber: number,
  run: SaveOceanRunResult,
  config: SaveOceanLevelConfig,
): ApplyLevelCompletionResult {
  const safe = resetDailyIfNeeded(progress);
  const level = normalizeLevel(levelNumber);
  const alreadyCompleted = Boolean(safe.completedLevels[level]);
  const isFrontierOrBeyond = level >= safe.highestUnlockedLevel && !alreadyCompleted;

  if (isFrontierOrBeyond && hasReachedDailyLimit(safe)) {
    return {
      progress: safe,
      newlyCompleted: false,
      unlockedNextLevel: false,
      dailyLimitBlocked: true,
      starsAwarded: 0,
    };
  }

  const starsAwarded = calculateStars(run, config);
  const prevRecord = safe.completedLevels[level];
  const nowIso = new Date().toISOString();

  const nextProgress: SaveOceanProgress = {
    ...safe,
    lastPlayedLevel: level,
    completedLevels: {
      ...safe.completedLevels,
      [level]: {
        bestScore: Math.max(prevRecord?.bestScore ?? 0, run.score),
        bestStars: Math.max(prevRecord?.bestStars ?? 0, starsAwarded),
        attempts: (prevRecord?.attempts ?? 0) + 1,
        lastCompletedAt: nowIso,
      },
    },
  };

  let unlockedNextLevel = false;
  if (isFrontierOrBeyond) {
    nextProgress.daily = {
      ...nextProgress.daily,
      newLevelCompletions: nextProgress.daily.newLevelCompletions + 1,
    };
    const nextFrontier = level + 1;
    nextProgress.highestUnlockedLevel = Math.max(nextProgress.highestUnlockedLevel, nextFrontier);
    unlockedNextLevel = true;
  }

  return {
    progress: nextProgress,
    newlyCompleted: !alreadyCompleted,
    unlockedNextLevel,
    dailyLimitBlocked: false,
    starsAwarded,
  };
}