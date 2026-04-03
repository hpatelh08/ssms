/**
 * games/curriculum/masterySystem.ts — Mastery Badges & Progression
 * ═══════════════════════════════════════════════════════════════════
 * Tracks chapter-level and section-level mastery.
 * Awards badges based on accuracy & completion thresholds.
 *
 * Badge hierarchy:
 *   ⭐ Chapter Star   — master one chapter (80% accuracy, 50+ attempts)
 *   🥇 Section Medal  — master ALL chapters in a section
 *   👑 Section Crown  — section medal + all 3 difficulties mastered
 *
 * ⚠ Does NOT modify Phase 2 engine core or Color Magic.
 */

import type {
  MasteryBadge,
  BadgeTier,
  CurriculumChapter,
} from './curriculumTypes';
import { MASTERY_THRESHOLDS } from './curriculumTypes';
import type { Difficulty } from '../engine/difficultyTypes';

// ── Per-chapter progress snapshot ──────────────────────────

export interface ChapterProgress {
  chapterId: string;
  section: 'maths' | 'english' | 'arcade';
  /** Total questions answered per difficulty */
  attempts: Record<Difficulty, number>;
  /** Total correct per difficulty */
  correct: Record<Difficulty, number>;
  /** Highest completed level per difficulty */
  highestLevel: Record<Difficulty, number>;
  /** Has the user finished the Difficult tier? */
  difficultComplete: boolean;
  /** ISO timestamp of last activity */
  lastPlayed: string;
}

/** Create a blank progress record */
export function emptyProgress(chapterId: string, section: 'maths' | 'english' | 'arcade'): ChapterProgress {
  return {
    chapterId,
    section,
    attempts:  { easy: 0, intermediate: 0, difficult: 0 },
    correct:   { easy: 0, intermediate: 0, difficult: 0 },
    highestLevel: { easy: 0, intermediate: 0, difficult: 0 },
    difficultComplete: false,
    lastPlayed: new Date().toISOString(),
  };
}

// ── Accuracy helpers ───────────────────────────────────────

export function chapterAccuracy(prog: ChapterProgress, diff?: Difficulty): number {
  if (diff) {
    return prog.attempts[diff] > 0 ? prog.correct[diff] / prog.attempts[diff] : 0;
  }
  const totalA = prog.attempts.easy + prog.attempts.intermediate + prog.attempts.difficult;
  const totalC = prog.correct.easy + prog.correct.intermediate + prog.correct.difficult;
  return totalA > 0 ? totalC / totalA : 0;
}

export function totalAttempts(prog: ChapterProgress): number {
  return prog.attempts.easy + prog.attempts.intermediate + prog.attempts.difficult;
}

// ── Mastery checks ─────────────────────────────────────────

/** Is a single chapter mastered? (80% accuracy, 50+ total attempts) */
export function isChapterMastered(prog: ChapterProgress): boolean {
  const acc = chapterAccuracy(prog);
  const total = totalAttempts(prog);
  return acc >= MASTERY_THRESHOLDS.CHAPTER_MASTERY.accuracy &&
         total >= MASTERY_THRESHOLDS.CHAPTER_MASTERY.minAttempts;
}

/** Ready to unlock intermediate? (75% accuracy on Easy) */
export function canUnlockIntermediate(prog: ChapterProgress): boolean {
  return chapterAccuracy(prog, 'easy') >= MASTERY_THRESHOLDS.UNLOCK_INTERMEDIATE.accuracy &&
         prog.highestLevel.easy >= MASTERY_THRESHOLDS.PROGRESS.levels;
}

/** Ready to unlock difficult? (75% accuracy on Intermediate) */
export function canUnlockDifficult(prog: ChapterProgress): boolean {
  return chapterAccuracy(prog, 'intermediate') >= MASTERY_THRESHOLDS.UNLOCK_INTERMEDIATE.accuracy &&
         prog.highestLevel.intermediate >= MASTERY_THRESHOLDS.PROGRESS.levels;
}

/** Has the user cleared a specific difficulty tier? */
export function isTierComplete(prog: ChapterProgress, diff: Difficulty): boolean {
  return chapterAccuracy(prog, diff) >= MASTERY_THRESHOLDS.PROGRESS.accuracy &&
         prog.highestLevel[diff] >= MASTERY_THRESHOLDS.PROGRESS.levels;
}

/** All 3 difficulty tiers completed? */
export function allDifficultiesComplete(prog: ChapterProgress): boolean {
  return isTierComplete(prog, 'easy') &&
         isTierComplete(prog, 'intermediate') &&
         isTierComplete(prog, 'difficult');
}

// ── Section-level checks ───────────────────────────────────

export function isSectionMastered(progresses: ChapterProgress[]): boolean {
  return progresses.length > 0 && progresses.every(p => isChapterMastered(p));
}

export function isSectionCrowned(progresses: ChapterProgress[]): boolean {
  return isSectionMastered(progresses) && progresses.every(p => allDifficultiesComplete(p));
}

// ── Badge generation ───────────────────────────────────────

const CHAPTER_STAR_ICONS: Record<string, string> = {
  maths: '⭐', english: '📖', arcade: '🧩',
};
const SECTION_MEDALS: Record<string, { icon: string; title: string }> = {
  maths:   { icon: '🥇', title: 'Maths Master' },
  english: { icon: '🏅', title: 'English Champion' },
  arcade:  { icon: '🎖️', title: 'Arcade Genius' },
};
const SECTION_CROWNS: Record<string, { icon: string; title: string }> = {
  maths:   { icon: '👑', title: 'Maths Crown' },
  english: { icon: '👑', title: 'English Crown' },
  arcade:  { icon: '👑', title: 'Arcade Crown' },
};

/** Generate a chapter star badge */
export function chapterStarBadge(chapter: CurriculumChapter): MasteryBadge {
  return {
    id: `star_${chapter.id}`,
    tier: 'chapter_star',
    title: `${chapter.title} Star`,
    icon: CHAPTER_STAR_ICONS[chapter.section] ?? '⭐',
    scope: `${chapter.section}_${chapter.id}`,
  };
}

/** Generate a section medal badge */
export function sectionMedalBadge(section: 'maths' | 'english' | 'arcade'): MasteryBadge {
  const m = SECTION_MEDALS[section];
  return {
    id: `medal_${section}`,
    tier: 'section_medal',
    title: m.title,
    icon: m.icon,
    scope: section,
  };
}

/** Generate a section crown badge */
export function sectionCrownBadge(section: 'maths' | 'english' | 'arcade'): MasteryBadge {
  const c = SECTION_CROWNS[section];
  return {
    id: `crown_${section}`,
    tier: 'section_crown',
    title: c.title,
    icon: c.icon,
    scope: section,
  };
}

// ── Compute all earned badges ──────────────────────────────

export interface EarnedBadge extends MasteryBadge {
  earnedAt: string; // ISO timestamp
}

/**
 * Given all chapter definitions and their progress,
 * compute every badge the user has earned.
 */
export function computeEarnedBadges(
  chapters: CurriculumChapter[],
  progressMap: Record<string, ChapterProgress>,
): EarnedBadge[] {
  const badges: EarnedBadge[] = [];
  const now = new Date().toISOString();

  // Group chapters by section
  const bySection: Record<string, CurriculumChapter[]> = {};
  for (const ch of chapters) {
    if (!bySection[ch.section]) bySection[ch.section] = [];
    bySection[ch.section].push(ch);
  }

  // Check each chapter
  for (const ch of chapters) {
    const prog = progressMap[ch.id];
    if (prog && isChapterMastered(prog)) {
      badges.push({ ...chapterStarBadge(ch), earnedAt: prog.lastPlayed || now });
    }
  }

  // Check each section
  for (const [section, sectionChapters] of Object.entries(bySection)) {
    const progs = sectionChapters
      .map(ch => progressMap[ch.id])
      .filter((p): p is ChapterProgress => !!p);

    if (isSectionMastered(progs)) {
      badges.push({
        ...sectionMedalBadge(section as 'maths' | 'english' | 'arcade'),
        earnedAt: now,
      });
    }

    if (isSectionCrowned(progs)) {
      badges.push({
        ...sectionCrownBadge(section as 'maths' | 'english' | 'arcade'),
        earnedAt: now,
      });
    }
  }

  return badges;
}

// ── Progress update helper ─────────────────────────────────

export interface SessionResult {
  chapterId: string;
  section: 'maths' | 'english' | 'arcade';
  difficulty: Difficulty;
  questionsAnswered: number;
  correctAnswers: number;
  levelReached: number;
}

/**
 * Apply a game session result to a ChapterProgress record.
 * Returns the updated progress (immutable).
 */
export function applySessionResult(
  prog: ChapterProgress,
  result: SessionResult,
): ChapterProgress {
  const d = result.difficulty;
  const updated: ChapterProgress = {
    ...prog,
    attempts: {
      ...prog.attempts,
      [d]: prog.attempts[d] + result.questionsAnswered,
    },
    correct: {
      ...prog.correct,
      [d]: prog.correct[d] + result.correctAnswers,
    },
    highestLevel: {
      ...prog.highestLevel,
      [d]: Math.max(prog.highestLevel[d], result.levelReached),
    },
    lastPlayed: new Date().toISOString(),
  };

  // Mark difficult as complete if threshold met
  if (d === 'difficult' && isTierComplete(updated, 'difficult')) {
    updated.difficultComplete = true;
  }

  return updated;
}

// ── Streak & engagement helpers ────────────────────────────

/** Number of consecutive days the user has played (based on lastPlayed dates) */
export function calculateStreak(playDates: string[]): number {
  if (!playDates.length) return 0;
  const dates = [...new Set(playDates.map(d => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);

  if (dates[0] !== today) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/** Summary stats for parent dashboard */
export interface SectionSummary {
  section: 'maths' | 'english' | 'arcade';
  totalAttempts: number;
  overallAccuracy: number;
  chaptersCompleted: number;
  totalChapters: number;
  badges: MasteryBadge[];
}

export function sectionSummary(
  section: 'maths' | 'english' | 'arcade',
  chapters: CurriculumChapter[],
  progressMap: Record<string, ChapterProgress>,
): SectionSummary {
  const sChapters = chapters.filter(c => c.section === section);
  let attempts = 0;
  let correct = 0;
  let completed = 0;

  for (const ch of sChapters) {
    const p = progressMap[ch.id];
    if (!p) continue;
    const ta = totalAttempts(p);
    attempts += ta;
    correct += p.correct.easy + p.correct.intermediate + p.correct.difficult;
    if (isChapterMastered(p)) completed++;
  }

  const badges = computeEarnedBadges(sChapters, progressMap);

  return {
    section,
    totalAttempts: attempts,
    overallAccuracy: attempts > 0 ? correct / attempts : 0,
    chaptersCompleted: completed,
    totalChapters: sChapters.length,
    badges,
  };
}
