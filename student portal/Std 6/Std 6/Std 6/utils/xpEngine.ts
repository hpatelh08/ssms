export const XP_PER_LEVEL = 100;

export const XP_REWARDS = {
  HOMEWORK_COMPLETE: 15,
  GAME_WIN: 20,
  AI_QUERY: 10,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 10,
} as const;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpInCurrentLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - xpInCurrentLevel(xp);
}

export function xpProgress(xp: number): number {
  return (xpInCurrentLevel(xp) / XP_PER_LEVEL) * 100;
}

export function getLevelTitle(level: number): string {
  if (level <= 2) return 'Explorer';
  if (level <= 5) return 'Adventurer';
  if (level <= 10) return 'Scholar';
  if (level <= 20) return 'Champion';
  return 'Legend';
}
