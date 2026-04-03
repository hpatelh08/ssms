/**
 * parent/analytics/useGameProgress.ts
 * ─────────────────────────────────────────────────────
 * Hook that reads ALL game progress — arcade + subject games
 * (English, Maths, Science) — from localStorage and provides
 * per-game analytics data for the parent dashboard.
 *
 * Reads from:
 *  • gameMastery          — subject game progress (English/Maths/Science)
 *  • ssms_gp2_<gameId>   — per-game/per-difficulty progress (arcade)
 *  • arcade_game_stars   — star counts per game
 *  • ssms_audit_log      — historical game_complete events
 */

import { useState, useEffect } from 'react';
import { GAME_CONFIGS, type GameConfig } from '../../games/types';
import {
  ENGLISH_CHAPTERS, MATHS_CHAPTERS, SCIENCE_CHAPTERS,
  type ChapterDef, type GameProgress as SubjectGameProgress,
} from '../../games/subjects/engine/types';

/* ── Types ──────────────────────────────────────── */

type Difficulty = 'easy' | 'intermediate' | 'difficult';

interface DifficultyProgress {
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  bestStreak: number;
  sessionsPlayed: number;
  lastPlayedAt: string;
}

export interface GameAnalyticsEntry {
  config: GameConfig;
  stars: number;
  totalSessions: number;
  totalAttempts: number;
  totalCorrect: number;
  overallAccuracy: number;
  bestStreak: number;
  lastPlayedAt: string;
  unlockedDifficulties: Difficulty[];
  difficulties: Record<Difficulty, DifficultyProgress>;
  history: { date: string; sessions: number }[];
  /** Subject this game belongs to (arcade/english/maths/science) */
  section: string;
}

export interface SubjectSummary {
  subject: string;
  totalChapters: number;
  completedChapters: number;
  chaptersStarted: number;
  totalGames: number;
  gamesPlayed: number;
  totalSessions: number;
  overallAccuracy: number;
  avgAccuracy: number;
}

export interface GameProgressSummary {
  totalGamesPlayed: number;
  totalGamesAvailable: number;
  totalSessions: number;
  totalAttempts: number;
  totalCorrect: number;
  overallAccuracy: number;
  bestGameId: string | null;
  weakestGameId: string | null;
  games: GameAnalyticsEntry[];
  weeklyActivity: { date: string; sessions: number }[];
  /** Per-subject summaries (English, Maths, Science) */
  subjects: SubjectSummary[];
}

/* ── Helpers ────────────────────────────────────── */

function loadGP2(gameId: string): Record<Difficulty, DifficultyProgress & { unlockedDifficulties: Difficulty[] }> | null {
  try {
    const raw = localStorage.getItem(`ssms_gp2_${gameId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem('arcade_game_stars');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Load subject game mastery from gameMastery localStorage */
function loadMastery(): Record<string, SubjectGameProgress> {
  try {
    const raw = localStorage.getItem('gameMastery');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  details?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDetails(entry: AuditEntry): Record<string, unknown> {
  if (entry.details && typeof entry.details === 'object') return entry.details;
  if (entry.data && typeof entry.data === 'object') return entry.data;
  return {};
}

function getGameIdFromDetails(details: Record<string, unknown>): string {
  const candidates = ['game', 'gameId', 'gameTypeId', 'id'] as const;
  for (const key of candidates) {
    const value = details[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseEntryDateKey(entry: AuditEntry): string | null {
  const rawTs = typeof entry.timestamp === 'string' ? entry.timestamp : '';
  if (!rawTs) return null;

  // Fast path for ISO-like values to avoid locale edge cases.
  if (/^\d{4}-\d{2}-\d{2}/.test(rawTs)) {
    return rawTs.slice(0, 10);
  }

  const ts = new Date(rawTs);
  if (Number.isNaN(ts.getTime())) return null;
  return toLocalDateKey(ts);
}

function isGameCategory(entry: AuditEntry): boolean {
  if (entry.category === 'game') return true;
  return entry.action.startsWith('game_') || entry.action.startsWith('difficulty_');
}

function getTrackableSession(entry: AuditEntry): { gameId: string; date: string } | null {
  if (!isGameCategory(entry)) return null;
  if (entry.action !== 'game_complete' && entry.action !== 'difficulty_complete') return null;
  const details = getDetails(entry);
  const gameId = getGameIdFromDetails(details) || 'unknown';
  const date = parseEntryDateKey(entry);
  if (!date) return null;
  return { gameId, date };
}

function getFallbackTrackableSession(entry: AuditEntry): { gameId: string; date: string } | null {
  if (!isGameCategory(entry)) return null;
  if (
    entry.action !== 'game_started' &&
    entry.action !== 'difficulty_selected' &&
    entry.action !== 'game_selected' &&
    entry.action !== 'next_game'
  ) return null;
  const details = getDetails(entry);
  const gameId = getGameIdFromDetails(details) || 'unknown';
  const date = parseEntryDateKey(entry);
  if (!date) return null;
  return { gameId, date };
}

function loadGameHistory(): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (!raw) return map;
    const entries: AuditEntry[] = JSON.parse(raw);
    for (const entry of entries) {
      const session = getTrackableSession(entry);
      if (!session) continue;
      const { gameId, date } = session;
      if (!map.has(gameId)) map.set(gameId, new Map());
      const dateMap = map.get(gameId)!;
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }
  } catch { /* ignore */ }
  return map;
}

function loadWeeklySessions(last7: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of last7) map.set(d, 0);
  const primaryByDate = new Map<string, number>();
  const fallbackByDate = new Map<string, number>();
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (!raw) return map;
    const entries: AuditEntry[] = JSON.parse(raw);
    for (const entry of entries) {
      const session = getTrackableSession(entry);
      if (session && map.has(session.date)) {
        primaryByDate.set(session.date, (primaryByDate.get(session.date) || 0) + 1);
        continue;
      }

      const fallback = getFallbackTrackableSession(entry);
      if (fallback && map.has(fallback.date)) {
        fallbackByDate.set(fallback.date, (fallbackByDate.get(fallback.date) || 0) + 1);
      }
    }
  } catch { /* ignore */ }

  for (const date of last7) {
    const primary = primaryByDate.get(date) || 0;
    const fallback = fallbackByDate.get(date) || 0;
    map.set(date, primary > 0 ? primary : fallback);
  }

  return map;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toLocalDateKey(d));
  }
  return days;
}

/** Build GameConfig-style configs for subject chapter games */
function buildSubjectConfigs(chapters: ChapterDef[], subjectId: string, subjectIcon: string): (GameConfig & { section: string; chapter: string })[] {
  const configs: (GameConfig & { section: string; chapter: string })[] = [];
  let seq = 1;
  for (const ch of chapters) {
    for (const g of ch.games) {
      configs.push({
        id: g.id,
        seq: seq++,
        icon: g.icon,
        title: g.title,
        desc: `${ch.title}`,
        gradient: ch.gradient.replace('from-', '').replace('to-', ''),
        glowColor: 'rgba(0,0,0,0.1)',
        tag: subjectIcon,
        section: subjectId,
        chapter: ch.id,
      });
    }
  }
  return configs;
}

function getMasteryEntriesForGame(
  mastery: Record<string, SubjectGameProgress>,
  gameId: string,
): SubjectGameProgress[] {
  const entries: SubjectGameProgress[] = [];
  for (const [key, value] of Object.entries(mastery)) {
    if (!value) continue;
    if (key === gameId || key.endsWith(`_${gameId}`)) {
      entries.push(value);
    }
  }
  return entries;
}

function aggregateMasteryForGame(entries: SubjectGameProgress[]): {
  sessions: number;
  attempts: number;
  correct: number;
  bestStreak: number;
  stars: number;
  unlockedDifficulties: Difficulty[];
} {
  if (entries.length === 0) {
    return {
      sessions: 0,
      attempts: 0,
      correct: 0,
      bestStreak: 0,
      stars: 0,
      unlockedDifficulties: ['easy'],
    };
  }

  const diffs: Difficulty[] = ['easy', 'intermediate', 'difficult'];
  let sessions = 0;
  let attempts = 0;
  let correct = 0;
  let bestStreak = 0;
  let stars = 0;
  const unlocked = new Set<Difficulty>(['easy']);

  for (const gp of entries) {
    let completedDifficulties = 0;
    for (const d of diffs) {
      const dp = gp[d];
      const miniLevels = Object.values(dp?.miniLevels || {});
      const completedLevels = miniLevels.length;
      const totalScore = miniLevels.reduce((sum, m) => sum + (m.score || 0), 0);
      const totalQs = miniLevels.reduce((sum, m) => sum + (m.total || 0), 0);
      sessions += completedLevels;
      attempts += totalQs;
      correct += totalScore;
      bestStreak = Math.max(bestStreak, dp?.bestScore || 0);
      if (dp?.completed) completedDifficulties++;
    }
    if (gp.easy?.completed) unlocked.add('intermediate');
    if (gp.intermediate?.completed) unlocked.add('difficult');
    stars = Math.max(stars, completedDifficulties);
  }

  return {
    sessions,
    attempts,
    correct,
    bestStreak,
    stars,
    unlockedDifficulties: Array.from(unlocked),
  };
}

function mergeMetric(a: number, b: number): number {
  if (a > 0 && b > 0) return Math.max(a, b);
  return a + b;
}

/* ── Hook ───────────────────────────────────────── */

export function useGameProgress(): GameProgressSummary {
  const [summary, setSummary] = useState<GameProgressSummary>(() => compute());

  useEffect(() => {
    const refresh = () => setSummary(compute());
    refresh();
    const onStorage = () => refresh();
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const intervalId = window.setInterval(refresh, 5000);

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return summary;
}

function compute(): GameProgressSummary {
  const stars = loadStars();
  const mastery = loadMastery();
  const history = loadGameHistory();
  const last7 = getLast7Days();

  let totalGamesPlayed = 0;
  let totalSessions = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;
  let bestGameId: string | null = null;
  let bestAccuracy = -1;
  let weakestGameId: string | null = null;
  let worstAccuracy = 2;

  const weeklyMap = loadWeeklySessions(last7);

  const games: GameAnalyticsEntry[] = [];

  // ── 1. Arcade games (from ssms_gp2_*) ──
  for (const config of GAME_CONFIGS) {
    const entry = buildArcadeEntry(config, stars, mastery, history);
    games.push(entry);
    if (entry.totalSessions > 0) {
      totalGamesPlayed++;
      if (entry.overallAccuracy > bestAccuracy) { bestAccuracy = entry.overallAccuracy; bestGameId = config.id; }
      if (entry.overallAccuracy < worstAccuracy) { worstAccuracy = entry.overallAccuracy; weakestGameId = config.id; }
    }
    totalSessions += entry.totalSessions;
    totalAttempts += entry.totalAttempts;
    totalCorrect += entry.totalCorrect;
  }

  // ── 2. Subject games (English, Maths, Science from gameMastery) ──
  const subjectDefs: { id: string; icon: string; chapters: ChapterDef[] }[] = [
    { id: 'english', icon: '📚', chapters: ENGLISH_CHAPTERS },
    { id: 'maths', icon: '🔢', chapters: MATHS_CHAPTERS },
    { id: 'science', icon: '🔬', chapters: SCIENCE_CHAPTERS },
  ];

  const subjects: SubjectSummary[] = [];
  const totalSubjectGamesAvailable = subjectDefs.reduce((sum, sub) => {
    const chapterGameCount = sub.chapters.reduce((n, ch) => n + ch.games.length, 0);
    return sum + chapterGameCount;
  }, 0);

  for (const sub of subjectDefs) {
    const configs = buildSubjectConfigs(sub.chapters, sub.id, sub.icon);
    let subGamesPlayed = 0;
    let subSessions = 0;
    let subAttempts = 0;
    let subCorrect = 0;
    const chapterDone = new Set<string>();
    const chaptersStarted = new Set<string>();

    for (const cfg of configs) {
      const masteryKey = `${sub.id}_${cfg.chapter}_${cfg.id}`;
      const gp = mastery[masteryKey];
      const entry = buildSubjectEntry(cfg, gp, history);
      games.push(entry);

      if (entry.totalSessions > 0 || entry.stars > 0) {
        totalGamesPlayed++;
        subGamesPlayed++;
        chaptersStarted.add(cfg.chapter);
        if (entry.overallAccuracy > bestAccuracy) { bestAccuracy = entry.overallAccuracy; bestGameId = cfg.id; }
        if (entry.overallAccuracy < worstAccuracy) { worstAccuracy = entry.overallAccuracy; weakestGameId = cfg.id; }
      }
      totalSessions += entry.totalSessions;
      subSessions += entry.totalSessions;
      totalAttempts += entry.totalAttempts;
      totalCorrect += entry.totalCorrect;
      subAttempts += entry.totalAttempts;
      subCorrect += entry.totalCorrect;

      // Chapter considered complete if at least easy difficulty is done
      if (gp?.easy?.completed) chapterDone.add(cfg.chapter);
    }

    const subAcc = subAttempts > 0 ? subCorrect / subAttempts : 0;
    subjects.push({
      subject: sub.id,
      totalChapters: sub.chapters.length,
      completedChapters: chapterDone.size,
      chaptersStarted: chaptersStarted.size,
      totalGames: configs.length,
      gamesPlayed: subGamesPlayed,
      totalSessions: subSessions,
      overallAccuracy: subAcc,
      avgAccuracy: subAcc,
    });
  }

  const arcadeGames = games.filter(g => g.section === 'arcade');
  const arcadeGamesPlayed = arcadeGames.filter(g => g.totalSessions > 0).length;
  const arcadeSessions = arcadeGames.reduce((sum, g) => sum + g.totalSessions, 0);
  const arcadeAttempts = arcadeGames.reduce((sum, g) => sum + g.totalAttempts, 0);
  const arcadeCorrect = arcadeGames.reduce((sum, g) => sum + g.totalCorrect, 0);
  const arcadeAcc = arcadeAttempts > 0 ? arcadeCorrect / arcadeAttempts : 0;
  subjects.push({
    subject: 'arcade',
    totalChapters: 0,
    completedChapters: 0,
    chaptersStarted: 0,
    totalGames: arcadeGames.length,
    gamesPlayed: arcadeGamesPlayed,
    totalSessions: arcadeSessions,
    overallAccuracy: arcadeAcc,
    avgAccuracy: arcadeAcc,
  });

  const weeklyActivity = last7.map(date => ({
    date,
    sessions: weeklyMap.get(date) || 0,
  }));

  return {
    totalGamesPlayed,
    totalGamesAvailable: GAME_CONFIGS.length + totalSubjectGamesAvailable,
    totalSessions,
    totalAttempts,
    totalCorrect,
    overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
    bestGameId,
    weakestGameId,
    games,
    weeklyActivity,
    subjects,
  };
}

/** Build analytics entry for an arcade game */
function buildArcadeEntry(
  config: GameConfig,
  stars: Record<string, number>,
  mastery: Record<string, SubjectGameProgress>,
  history: Map<string, Map<string, number>>,
): GameAnalyticsEntry {
  const gp = loadGP2(config.id);
  let gameStars = stars[config.id] || 0;
  const gameHistory = history.get(config.id);
  const masteryEntries = getMasteryEntriesForGame(mastery, config.id);
  const masteryAgg = aggregateMasteryForGame(masteryEntries);

  const diffs: Difficulty[] = ['easy', 'intermediate', 'difficult'];
  const difficulties = {} as Record<Difficulty, DifficultyProgress>;
  let gameSessions = 0, gameAttempts = 0, gameCorrect = 0, gameBestStreak = 0;
  let gameLastPlayed = '';
  let unlockedDifficulties: Difficulty[] = ['easy'];

  for (const d of diffs) {
    const dp = gp?.[d];
    const prog: DifficultyProgress = {
      totalAttempts: dp?.totalAttempts || 0,
      correctAnswers: dp?.correctAnswers || 0,
      accuracy: dp?.accuracy || 0,
      bestStreak: dp?.bestStreak || 0,
      sessionsPlayed: dp?.sessionsPlayed || 0,
      lastPlayedAt: dp?.lastPlayedAt || '',
    };
    difficulties[d] = prog;
    gameSessions += prog.sessionsPlayed;
    gameAttempts += prog.totalAttempts;
    gameCorrect += prog.correctAnswers;
    gameBestStreak = Math.max(gameBestStreak, prog.bestStreak);
    if (prog.lastPlayedAt > gameLastPlayed) gameLastPlayed = prog.lastPlayedAt;
  }

  if (gp?.easy?.unlockedDifficulties) {
    unlockedDifficulties = gp.easy.unlockedDifficulties;
  }

  gameSessions = mergeMetric(gameSessions, masteryAgg.sessions);
  gameAttempts = mergeMetric(gameAttempts, masteryAgg.attempts);
  gameCorrect = mergeMetric(gameCorrect, masteryAgg.correct);
  gameBestStreak = Math.max(gameBestStreak, masteryAgg.bestStreak);
  gameStars = Math.max(gameStars, masteryAgg.stars);
  unlockedDifficulties = Array.from(new Set<Difficulty>([
    ...unlockedDifficulties,
    ...masteryAgg.unlockedDifficulties,
  ]));

  const histEntries = buildHistoryEntries(gameHistory);
  if (gameSessions === 0 && histEntries.length > 0) {
    gameSessions = histEntries.reduce((sum, h) => sum + h.sessions, 0);
  }
  if (!gameLastPlayed && histEntries.length > 0) {
    gameLastPlayed = histEntries[histEntries.length - 1].date;
  }

  return {
    config, stars: gameStars, totalSessions: gameSessions,
    totalAttempts: gameAttempts, totalCorrect: gameCorrect,
    overallAccuracy: gameAttempts > 0 ? gameCorrect / gameAttempts : 0,
    bestStreak: gameBestStreak, lastPlayedAt: gameLastPlayed,
    unlockedDifficulties, difficulties, history: histEntries,
    section: 'arcade',
  };
}

/** Build analytics entry for a subject game from gameMastery */
function buildSubjectEntry(
  cfg: GameConfig & { section: string; chapter: string },
  gp: SubjectGameProgress | undefined,
  history: Map<string, Map<string, number>>,
): GameAnalyticsEntry {
  const gameHistory = history.get(cfg.id);

  const diffs: Difficulty[] = ['easy', 'intermediate', 'difficult'];
  const difficulties = {} as Record<Difficulty, DifficultyProgress>;
  let gameSessions = 0, gameAttempts = 0, gameCorrect = 0, gameBestStreak = 0;
  let gameLastPlayed = '';
  let unlockedDifficulties: Difficulty[] = ['easy'];
  let starCount = 0;

  for (const d of diffs) {
    const dp = gp?.[d];
    const completedLevels = dp ? Object.values(dp.miniLevels).length : 0;
    const totalScore = dp ? Object.values(dp.miniLevels).reduce((s, m) => s + m.score, 0) : 0;
    const totalQs = dp ? Object.values(dp.miniLevels).reduce((s, m) => s + m.total, 0) : 0;

    const prog: DifficultyProgress = {
      totalAttempts: totalQs,
      correctAnswers: totalScore,
      accuracy: totalQs > 0 ? totalScore / totalQs : 0,
      bestStreak: dp?.bestScore || 0,
      sessionsPlayed: completedLevels,
      lastPlayedAt: '',
    };
    difficulties[d] = prog;
    gameSessions += completedLevels;
    gameAttempts += totalQs;
    gameCorrect += totalScore;
    gameBestStreak = Math.max(gameBestStreak, dp?.bestScore || 0);

    if (dp?.completed) starCount++;
  }

  if (gp?.easy?.completed) unlockedDifficulties.push('intermediate');
  if (gp?.intermediate?.completed) unlockedDifficulties.push('difficult');

  const histEntries = buildHistoryEntries(gameHistory);
  if (gameSessions === 0 && histEntries.length > 0) {
    gameSessions = histEntries.reduce((sum, h) => sum + h.sessions, 0);
  }
  if (!gameLastPlayed && histEntries.length > 0) {
    gameLastPlayed = histEntries[histEntries.length - 1].date;
  }

  return {
    config: cfg, stars: starCount, totalSessions: gameSessions,
    totalAttempts: gameAttempts, totalCorrect: gameCorrect,
    overallAccuracy: gameAttempts > 0 ? gameCorrect / gameAttempts : 0,
    bestStreak: gameBestStreak, lastPlayedAt: gameLastPlayed,
    unlockedDifficulties, difficulties, history: histEntries,
    section: cfg.section,
  };
}

function buildHistoryEntries(
  gameHistory: Map<string, number> | undefined,
): { date: string; sessions: number }[] {
  const histEntries: { date: string; sessions: number }[] = [];
  if (gameHistory) {
    for (const [date, count] of gameHistory) {
      histEntries.push({ date, sessions: count });
    }
  }
  histEntries.sort((a, b) => a.date.localeCompare(b.date));
  return histEntries;
}
