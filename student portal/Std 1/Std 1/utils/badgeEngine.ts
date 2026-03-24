import { Badge, UserStats, HomeworkItem } from '../types';

export const ALL_BADGES: Badge[] = [
  { id: '1', name: 'First Step', icon: '🐣', description: 'Started your learning journey!', condition: { type: 'xp', threshold: 0 } },
  { id: '2', name: 'Math Wizard', icon: '🧙', description: 'Completed 5 math activities.', condition: { type: 'games', threshold: 5 } },
  { id: '3', name: 'Word Master', icon: '📖', description: 'Completed 5 word activities.', condition: { type: 'games', threshold: 5 } },
  { id: '4', name: 'Early Bird', icon: '☀️', description: '3-day login streak!', condition: { type: 'streak', threshold: 3 } },
  { id: '5', name: 'Homework Hero', icon: '✏️', description: 'Completed 5 homework tasks.', condition: { type: 'homework', threshold: 5 } },
  { id: '6', name: 'Week Warrior', icon: '🛡️', description: '7-day attendance streak!', condition: { type: 'streak', threshold: 7 } },
  { id: '7', name: 'XP Hunter', icon: '💎', description: 'Earned 200 XP!', condition: { type: 'xp', threshold: 200 } },
  { id: '8', name: 'Super Star', icon: '⭐', description: 'Reached Level 5!', condition: { type: 'xp', threshold: 400 } },
];

export function checkBadgeUnlocks(stats: UserStats, homework: HomeworkItem[]): Badge | null {
  const earnedIds = new Set(stats.badges.map(b => b.id));

  for (const badge of ALL_BADGES) {
    if (earnedIds.has(badge.id)) continue;
    if (!badge.condition) continue;

    let earned = false;
    switch (badge.condition.type) {
      case 'xp':
        earned = stats.xp >= badge.condition.threshold;
        break;
      case 'streak':
        earned = stats.streak >= badge.condition.threshold;
        break;
      case 'homework':
        earned = homework.filter(h => h.isDone).length >= badge.condition.threshold;
        break;
      case 'attendance':
        earned = stats.attendance.length >= badge.condition.threshold;
        break;
    }

    if (earned) {
      return { ...badge, unlockedAt: new Date().toISOString() };
    }
  }

  return null;
}
