/**
 * child/journey/journeyProgress.ts
 * ─────────────────────────────────────────────────────
 * Lightweight localStorage-based journey progress tracker.
 * Every game calls recordJourneyLevel() when a level is completed.
 * Achievement unlocks every 50 completed levels.
 */

const JOURNEY_KEY = 'journey_v1';
export const JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT = 'ssms:journey-achievement-unlocked';
export const LEVELS_PER_ACHIEVEMENT = 50;

export interface JourneyData {
  total: number;
  breakdown: Record<string, number>;
  openedBoxes: number[];
}

export interface JourneyProgress extends JourneyData {
  achievements: number;
}

export interface JourneyAchievementUnlockedDetail {
  newTotal: number;
  achievementNum: number;
  gameName: string;
}

function load(): JourneyData {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as JourneyData;
      if (typeof parsed.total === 'number') {
        const openedBoxes = Array.isArray((parsed as { openedBoxes?: unknown }).openedBoxes)
          ? (parsed as { openedBoxes: unknown[] }).openedBoxes
              .map(v => Number(v))
              .filter(v => Number.isInteger(v) && v > 0)
          : [];
        return {
          total: parsed.total,
          breakdown: parsed.breakdown || {},
          openedBoxes,
        };
      }
    }
  } catch { /* ignore */ }
  return { total: 0, breakdown: {}, openedBoxes: [] };
}

function save(data: JourneyData): void {
  try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/**
 * Call this whenever a student completes a level in any game.
 * Returns whether a new achievement was unlocked and which one.
 */
export function recordJourneyLevel(gameName = 'unknown'): {
  newTotal: number;
  newAchievement: boolean;
  achievementNum: number;
} {
  const data = load();
  const prevTotal = data.total || 0;
  const prevAchCount = Math.max(
    Math.floor(prevTotal / LEVELS_PER_ACHIEVEMENT),
    Array.isArray(data.openedBoxes) ? data.openedBoxes.length : 0,
  );

  data.total = prevTotal + 1;
  data.breakdown = data.breakdown || {};
  data.openedBoxes = Array.isArray(data.openedBoxes) ? data.openedBoxes : [];
  data.breakdown[gameName] = (data.breakdown[gameName] || 0) + 1;

  const unlockedByLevels = Math.floor(data.total / LEVELS_PER_ACHIEVEMENT);
  if (unlockedByLevels > data.openedBoxes.length) {
    for (let box = data.openedBoxes.length + 1; box <= unlockedByLevels; box++) {
      data.openedBoxes.push(box);
    }
  }

  data.openedBoxes = Array.from(new Set(data.openedBoxes)).sort((a, b) => a - b);
  save(data);

  const newAchCount = data.openedBoxes.length;
  const result = {
    newTotal: data.total,
    newAchievement: newAchCount > prevAchCount,
    achievementNum: newAchCount,
  };

  if (result.newAchievement && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<JourneyAchievementUnlockedDetail>(
      JOURNEY_ACHIEVEMENT_UNLOCKED_EVENT,
      {
        detail: {
          newTotal: result.newTotal,
          achievementNum: result.achievementNum,
          gameName,
        },
      },
    ));
  }

  return result;
}

/** Get current progress without modifying it. */
export function getJourneyProgress(): JourneyProgress {
  const data = load();
  const openedBoxes = Array.isArray(data.openedBoxes)
    ? Array.from(new Set(data.openedBoxes)).sort((a, b) => a - b)
    : [];
  const unlockedByLevels = Math.floor((data.total || 0) / LEVELS_PER_ACHIEVEMENT);
  const achievements = Math.max(unlockedByLevels, openedBoxes.length);

  const normalizedOpened = openedBoxes.length >= achievements
    ? openedBoxes
    : Array.from({ length: achievements }, (_, i) => i + 1);

  return {
    total: data.total || 0,
    breakdown: data.breakdown || {},
    openedBoxes: normalizedOpened,
    achievements,
  };
}

/**
 * Game name constants — use these when calling recordJourneyLevel().
 */
export const JOURNEY_GAMES = {
  ARCADE: 'arcade',
  MATH: 'math',
  ENGLISH: 'english',
  ODD_ONE_OUT: 'odd-one-out',
  WORD_BUILDER: 'word-builder',
} as const;
