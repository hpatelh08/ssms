/**
 * data/mockParentAnalytics.ts
 * ─────────────────────────────────────────────────────
 * Centralized realistic mock data for the Parent Dashboard.
 *
 * Every dashboard component reads from this single source.
 * Replace with real API data when the backend is ready.
 *
 * Student: Yash  |  Level 4  |  XP 1480
 * Attendance: 86%  |  Streak: 5 days
 * Engagement: 82%  |  Sessions: 14+
 */

/* ═══════════════════════════════════════════════════
   BASELINE DATA
   ═══════════════════════════════════════════════════ */

/** Weekly learning minutes baseline (Mon → Sun). Total ≈ 179 min. */
export const BASELINE_WEEKLY: number[] = [22, 18, 25, 14, 30, 42, 28];

/** Subject curriculum data (Std 1 NCERT). */
export const BASELINE_SUBJECTS = [
  { subject: 'English',  progress: 60, done: 6,  total: 10, colorKey: 'blue'    as const },
  { subject: 'Maths',    progress: 54, done: 7,  total: 13, colorKey: 'indigo'  as const },
  { subject: 'Activities', progress: 48, done: 4,  total: 8,  colorKey: 'emerald' as const },
  { subject: 'Hindi',    progress: 63, done: 6,  total: 10, colorKey: 'amber'   as const },
  { subject: 'Gujarati', progress: 51, done: 4,  total: 8,  colorKey: 'purple'  as const },
] as const;

/** Core learning competency skills (0-100). */
export const BASELINE_SKILLS = [
  { skill: 'Reading',       value: 78 },
  { skill: 'Writing',       value: 64 },
  { skill: 'Logic',         value: 71 },
  { skill: 'Numeracy',      value: 59 },
  { skill: 'Comprehension', value: 66 },
  { skill: 'Creativity',    value: 82 },
] as const;

/* ═══════════════════════════════════════════════════
   FLOOR VALUES  (guaranteed minimums)
   ═══════════════════════════════════════════════════ */

export const FLOOR = {
  xp:             1480,
  level:          4,
  attendanceRate: 86,
  streakDays:     5,
  engagementScore: 82,
  totalSessions:  14,
  avgSessionMin:  16,
  gardenWater:    72,
  gardenSunlight: 80,
  gardenGrowth:   54,
  gardenFlowers:  3,
  gardenFruits:   2,
} as const;

/* ═══════════════════════════════════════════════════
   ACTIVITY DISTRIBUTION (proportions out of total)
   ═══════════════════════════════════════════════════ */

export const ACTIVITY_PROPORTIONS = [
  { label: 'Lessons',  fraction: 0.40, colorKey: 'indigo'  as const },
  { label: 'Games',    fraction: 0.25, colorKey: 'blue'    as const },
  { label: 'Reading',  fraction: 0.15, colorKey: 'emerald' as const },
  { label: 'Practice', fraction: 0.12, colorKey: 'amber'   as const },
  { label: 'Creative', fraction: 0.08, colorKey: 'rose'    as const },
] as const;

/* ═══════════════════════════════════════════════════
   ALERTS / INSIGHTS (always shown)
   ═══════════════════════════════════════════════════ */

export type MockAlertSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface MockAlert {
  id: string;
  severity: MockAlertSeverity;
  title: string;
  description: string;
  category: 'weak-area' | 'missed-practice' | 'revision' | 'engagement' | 'achievement';
}

export const BASELINE_ALERTS: MockAlert[] = [
  {
    id: 'a-hindi',
    severity: 'success',
    title: 'Hindi Reading Improved',
    description:
      'Hindi reading comprehension improved by 14% this week. Yash is completing Hindi passages faster and with better accuracy.',
    category: 'achievement',
  },
  {
    id: 'a-math',
    severity: 'warning',
    title: 'Math Accuracy Needs Attention',
    description:
      'Math accuracy has dropped to 58% on recent exercises. Number patterns and basic addition need targeted reinforcement.',
    category: 'weak-area',
  },
  {
    id: 'a-gujarati',
    severity: 'info',
    title: 'Suggested Activity',
    description:
      'Practice Gujarati letter tracing for 10 minutes daily. Visual pattern exercises can improve recognition speed by up to 20%.',
    category: 'revision',
  },
];

/* ═══════════════════════════════════════════════════
   MILESTONES
   ═══════════════════════════════════════════════════ */

export interface MockMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  category: 'academic' | 'streak' | 'skill' | 'social' | 'milestone';
}

export const BASELINE_MILESTONES: MockMilestone[] = [
  { id: 'm1', title: 'First Login',       description: 'Started learning journey',             icon: 'flag',    date: '2026-01-15', category: 'milestone' },
  { id: 'm2', title: 'Level 2 Reached',   description: 'Earned enough XP to level up',         icon: 'star',    date: '2026-01-22', category: 'academic'  },
  { id: 'm3', title: '7-Day Streak',      description: 'Practiced every day for a week',       icon: 'flame',   date: '2026-02-03', category: 'streak'    },
  { id: 'm4', title: 'English Ch.1 Done', description: 'Completed first English chapter',      icon: 'book',    date: '2026-02-10', category: 'academic'  },
  { id: 'm5', title: 'Math Wizard Badge', description: 'Completed 10 math puzzles',            icon: 'trophy',  date: '2026-02-18', category: 'skill'     },
  { id: 'm6', title: 'Garden Blooming',   description: 'First flower grew in the garden',      icon: 'flower',  date: '2026-02-25', category: 'milestone' },
];

/* ═══════════════════════════════════════════════════
   PROGRESS PAGE STATIC DATA
   ═══════════════════════════════════════════════════ */

/** Weekly learning trend (4 weeks). */
export const WEEKLY_TREND = [
  { label: 'Week 1', value: 142 },
  { label: 'Week 2', value: 168 },
  { label: 'Week 3', value: 179 },
  { label: 'Week 4', value: 196 },
] as const;

export const STRONG_AREAS = [
  {
    title: 'Reading Comprehension',
    desc: 'High performance — reading speed and accuracy consistently above average.',
    icon: '📖',
    accent: '#10B981',
  },
  {
    title: 'Creative Drawing',
    desc: 'Above average engagement — Color Magic and creative exercises show strong focus.',
    icon: '🎨',
    accent: '#6366F1',
  },
  {
    title: 'Creative Activities',
    desc: 'Good progress in activities — consistent engagement and completion.',
    icon: '🎨',
    accent: '#06B6D4',
  },
] as const;

export const WEAK_AREAS = [
  {
    title: 'Math Pattern Recognition',
    desc: 'Needs additional practice — number patterns and basic addition need reinforcement.',
    icon: '🔢',
    accent: '#FB923C',
  },
  {
    title: 'Gujarati Reading',
    desc: 'Below average accuracy — reading speed and comprehension need improvement.',
    icon: '📝',
    accent: '#F59E0B',
  },
] as const;

export const AI_RECOMMENDATIONS = [
  {
    text: 'Practice number patterns for 10 minutes daily. Start with single-digit sequences and gradually move to double-digit patterns.',
    icon: '🧮',
  },
  {
    text: 'Encourage Gujarati reading with simple stories. Picture books with Gujarati text can improve both vocabulary and reading fluency.',
    icon: '📖',
  },
  {
    text: 'Continue creative drawing exercises to maintain high engagement. This strengthens fine motor skills and visual learning pathways.',
    icon: '✏️',
  },
] as const;

/* ═══════════════════════════════════════════════════
   ATTENDANCE PAGE STATIC DATA
   ═══════════════════════════════════════════════════ */

/** Monthly attendance heatmap (4 weeks × 5 school days). */
export const ATTENDANCE_HEATMAP = [
  { week: 'Week 1', days: [true, true, true, true, true]  },
  { week: 'Week 2', days: [true, true, true, false, true] },
  { week: 'Week 3', days: [true, true, true, true, true]  },
  { week: 'Week 4', days: [true, true, true, true, true]  },
] as const;

/** 24 out of 28 days present. */
export const MONTHLY_ACTIVE_DAYS  = 24;
export const MONTHLY_TOTAL_DAYS   = 28;

/** Monthly summary metrics. */
export const MONTHLY_SUMMARY = {
  completedChapters:    21,
  activitiesCompleted:  67,
} as const;

export const ATTENDANCE_ALERTS = [
  {
    severity: 'warning'  as const,
    title: 'Streak Warning',
    desc: 'Child missed one day this week. Maintaining regular practice builds strong learning habits.',
  },
  {
    severity: 'danger'   as const,
    title: 'Math Practice Reminder',
    desc: 'Performance in number patterns is below the expected level. Consider extra 10-minute daily sessions.',
  },
  {
    severity: 'success'  as const,
    title: 'Reading Improvement',
    desc: 'Reading speed and comprehension improved by 12% this week. Great progress!',
  },
] as const;

/* ═══════════════════════════════════════════════════
   OVERVIEW PAGE STATIC DATA
   ═══════════════════════════════════════════════════ */

/** Subject status labels displayed on the Overview page. */
export const SUBJECT_TAGS: Record<string, { tag: string; color: string }> = {
  'English':  { tag: 'Improving',        color: '#10B981' },
  'Maths':    { tag: 'Needs Practice',   color: '#F59E0B' },
  'Activities': { tag: 'On Track',         color: '#6366F1' },
  'Hindi':    { tag: 'Strong',           color: '#10B981' },
  'Gujarati': { tag: 'Needs Attention',  color: '#FB923C' },
};

/** Live monitoring widget static text. */
export const LIVE_MONITORING = {
  lastSession: 'Today 6:18 PM',
  sessionLength: '19 minutes',
  currentActivity: '🎨 Color Magic',
} as const;

/* ═══════════════════════════════════════════════════
   GARDEN GROWTH PAGE DATA
   ═══════════════════════════════════════════════════ */

export const GARDEN_TREE_STATUS = {
  stage: 'Sprout' as const,
  stageEmoji: '🌱',
  overallGrowth: 38,
  xpContribution: 120,
  nextStage: 'Sapling',
  nextStageThreshold: 70,
} as const;

export const GARDEN_METRICS = [
  { icon: '🌸', label: 'Flowers',              value: 6,    sub: 'Bloomed this month',       colorKey: 'rose'    as const },
  { icon: '🍎', label: 'Fruits',               value: 3,    sub: 'From perfect sessions',    colorKey: 'amber'   as const },
  { icon: '🌰', label: 'Seeds Collected',      value: 12,   sub: 'From homework tasks',      colorKey: 'emerald' as const },
  { icon: '🪴', label: 'Growth Sessions',      value: 9,    sub: 'Garden interactions',       colorKey: 'cyan'    as const },
  { icon: '🍃', label: 'Leaf Density',         value: 72,   sub: 'Tree canopy health',        colorKey: 'green'   as const, isPercent: true },
  { icon: '📅', label: 'Attendance Influence', value: 86,   sub: 'Days active this month',    colorKey: 'indigo'  as const, isPercent: true },
] as const;

export const GARDEN_RESPONSIBILITY = {
  overall: 76,
  breakdown: [
    { label: 'Homework Completion', value: 82, color: '#6366F1' },
    { label: 'Game Participation',  value: 68, color: '#8B5CF6' },
    { label: 'Daily Practice',      value: 71, color: '#A78BFA' },
  ],
} as const;

export const GARDEN_TIMELINE = [
  { day: 'Monday',    icon: '💧', text: 'Watered the learning tree',                     accent: '#3B82F6' },
  { day: 'Wednesday', icon: '🌸', text: 'Earned first flower',                           accent: '#EC4899' },
  { day: 'Friday',    icon: '🍎', text: 'Completed math practice → tree gained fruit',   accent: '#F59E0B' },
  { day: 'Sunday',    icon: '☀️', text: 'Perfect attendance → sunlight bonus',            accent: '#10B981' },
] as const;

export const GARDEN_CARE_FACTORS = [
  { icon: '💧', label: 'Water Level',  sub: 'Homework',   value: 72, color: '#3B82F6', tooltip: 'Water Level increases when homework activities are completed.' },
  { icon: '☀️', label: 'Sunlight',     sub: 'Games',      value: 65, color: '#F59E0B', tooltip: 'Sunlight grows with game participation and practice sessions.' },
  { icon: '😊', label: 'Happiness',    sub: 'Attendance', value: 86, color: '#10B981', tooltip: 'Happiness rises with regular attendance and daily logins.' },
] as const;

export const GARDEN_TREE_STAGES = [
  { stage: 'Seed',    emoji: '🌰', threshold: 0  },
  { stage: 'Sprout',  emoji: '🌱', threshold: 20 },
  { stage: 'Sapling', emoji: '🌿', threshold: 70 },
  { stage: 'Tree',    emoji: '🌳', threshold: 85 },
  { stage: 'Blossom', emoji: '🌸', threshold: 95 },
] as const;

/* ═══════════════════════════════════════════════════
   COLOR SKILLS PAGE DATA
   ═══════════════════════════════════════════════════ */

export const COLOR_SUMMARY = {
  colorVisits:    14,
  colorsLearned:  7,
  shapesMastered: 6,
  accuracyRate:   84,
  avgCompletionSec: 18,
} as const;

export const COLOR_PALETTE_ANALYTICS = [
  { name: 'Red',    hex: '#EF4444', accuracy: 92 },
  { name: 'Blue',   hex: '#3B82F6', accuracy: 85 },
  { name: 'Yellow', hex: '#EAB308', accuracy: 78 },
  { name: 'Green',  hex: '#22C55E', accuracy: 88 },
  { name: 'Pink',   hex: '#EC4899', accuracy: 81 },
  { name: 'Purple', hex: '#8B5CF6', accuracy: 76 },
  { name: 'Orange', hex: '#F97316', accuracy: 69 },
] as const;

export const COLOR_SHAPE_PERFORMANCE = [
  { name: 'Apple',     emoji: '🍎', color: 'Red',    hex: '#EF4444', correctRate: 90 },
  { name: 'Sun',       emoji: '☀️', color: 'Yellow', hex: '#EAB308', correctRate: 82 },
  { name: 'Balloon',   emoji: '🎈', color: 'Blue',   hex: '#3B82F6', correctRate: 88 },
  { name: 'Fish',      emoji: '🐟', color: 'Orange', hex: '#F97316', correctRate: 75 },
  { name: 'Butterfly', emoji: '🦋', color: 'Pink',   hex: '#EC4899', correctRate: 80 },
  { name: 'Star',      emoji: '⭐', color: 'Yellow', hex: '#EAB308', correctRate: 84 },
  { name: 'House',     emoji: '🏠', color: 'Red',    hex: '#EF4444', correctRate: 91 },
  { name: 'Cupcake',   emoji: '🧁', color: 'Pink',   hex: '#EC4899', correctRate: 86 },
] as const;

export const COLOR_WEEKLY_PROGRESS = [
  { label: 'Week 1', value: 62 },
  { label: 'Week 2', value: 71 },
  { label: 'Week 3', value: 79 },
  { label: 'Week 4', value: 84 },
] as const;

export const COLOR_AI_INSIGHTS = [
  { severity: 'success' as const, text: 'Child shows strong recognition of red and blue — both above 85% accuracy.' },
  { severity: 'warning' as const, text: 'Orange recognition slightly lower at 69% → recommended practice with orange shapes.' },
  { severity: 'success' as const, text: 'Shape matching accuracy improving consistently week over week (+22% in 4 weeks).' },
] as const;

export const COLOR_GAMIFICATION = {
  colorBadges:       4,
  completedActivities: 28,
  perfectStreak:     3,
} as const;
