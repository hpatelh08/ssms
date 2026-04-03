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
  details: Record<string, unknown>;
}

function loadGameHistory(): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (!raw) return map;
    const entries: AuditEntry[] = JSON.parse(raw);
    for (const entry of entries) {
      if (entry.category !== 'game' || entry.action !== 'game_complete') continue;
      const gameId = (entry.details?.game as string) || '';
      const date = entry.timestamp?.slice(0, 10) || '';
      if (!gameId || !date) continue;
      if (!map.has(gameId)) map.set(gameId, new Map());
      const dateMap = map.get(gameId)!;
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }
  } catch { /* ignore */ }
  return map;
}

function getLast7Days(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow === 0 ? 7 : dow) - 1));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day.toISOString().slice(0, 10);
  });
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

/* ── Hook ───────────────────────────────────────── */

export function useGameProgress(): GameProgressSummary {
  const [summary, setSummary] = useState<GameProgressSummary>(() => compute());

  useEffect(() => {
    setSummary(compute());
    const handler = () => setSummary(compute());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
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

  const weeklyMap = new Map<string, number>();
  for (const d of last7) weeklyMap.set(d, 0);

  const games: GameAnalyticsEntry[] = [];

  // ── 1. Arcade games (from ssms_gp2_*) ──
  for (const config of GAME_CONFIGS) {
    const entry = buildArcadeEntry(config, stars, history, weeklyMap);
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

  for (const sub of subjectDefs) {
    const configs = buildSubjectConfigs(sub.chapters, sub.id, sub.icon);
    let subGamesPlayed = 0;
    let subAttempts = 0;
    let subCorrect = 0;
    const chapterDone = new Set<string>();

    for (const cfg of configs) {
      const masteryKey = `${sub.id}_${cfg.chapter}_${cfg.id}`;
      const gp = mastery[masteryKey];
      const entry = buildSubjectEntry(cfg, gp, history, weeklyMap);
      games.push(entry);

      if (entry.totalSessions > 0 || entry.stars > 0) {
        totalGamesPlayed++;
        subGamesPlayed++;
        if (entry.overallAccuracy > bestAccuracy) { bestAccuracy = entry.overallAccuracy; bestGameId = cfg.id; }
        if (entry.overallAccuracy < worstAccuracy) { worstAccuracy = entry.overallAccuracy; weakestGameId = cfg.id; }
      }
      totalSessions += entry.totalSessions;
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
      chaptersStarted: subGamesPlayed > 0 ? Math.max(chapterDone.size, Math.ceil(subGamesPlayed / 3)) : 0,
      totalGames: configs.length,
      gamesPlayed: subGamesPlayed,
      totalSessions: subGamesPlayed,
      overallAccuracy: subAcc,
      avgAccuracy: subAcc,
    });
  }

  const weeklyActivity = last7.map(date => ({
    date,
    sessions: weeklyMap.get(date) || 0,
  }));

  return {
    totalGamesPlayed,
    totalGamesAvailable: GAME_CONFIGS.length + 54, // 16 arcade + 54 subject
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
  history: Map<string, Map<string, number>>,
  weeklyMap: Map<string, number>,
): GameAnalyticsEntry {
  const gp = loadGP2(config.id);
  const gameStars = stars[config.id] || 0;
  const gameHistory = history.get(config.id);

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

  const histEntries = buildHistoryEntries(gameHistory, weeklyMap);

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
  weeklyMap: Map<string, number>,
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
    const completedLevels = dp ? Object.values(dp.miniLevels).filter(m => m.completed).length : 0;
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

  const histEntries = buildHistoryEntries(gameHistory, weeklyMap);

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
  weeklyMap: Map<string, number>,
): { date: string; sessions: number }[] {
  const histEntries: { date: string; sessions: number }[] = [];
  if (gameHistory) {
    for (const [date, count] of gameHistory) {
      histEntries.push({ date, sessions: count });
      if (weeklyMap.has(date)) {
        weeklyMap.set(date, weeklyMap.get(date)! + count);
      }
    }
  }
  histEntries.sort((a, b) => a.date.localeCompare(b.date));
  return histEntries;
}
