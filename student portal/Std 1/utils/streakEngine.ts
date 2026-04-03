export function calculateStreak(attendance: string[]): number {
  if (attendance.length === 0) return 0;

  const sorted = [...new Set(attendance)]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = (sorted[i].getTime() - sorted[i + 1].getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function isStreakActive(attendance: string[]): boolean {
  if (attendance.length === 0) return false;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return attendance.includes(today) || attendance.includes(yesterday);
}

export function getStreakBonus(streak: number): number {
  if (streak >= 7) return 25;
  if (streak >= 5) return 15;
  if (streak >= 3) return 10;
  return 0;
}
