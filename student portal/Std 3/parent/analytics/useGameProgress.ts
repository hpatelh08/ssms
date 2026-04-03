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

interface AuditGameAggregate {
  sessions: number;
  attempts: number;
  correct: number;
  lastPlayedAt: string;
  history: Map<string, number>;
}

interface DayActionCounter {
  selected: number;
  started: number;
  complete: number;
}

function normalizeGameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildGameAliasMap(entries: Array<{ id: string; title?: string }>): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of entries) {
    const aliases = [entry.id, entry.title || ''].filter(Boolean);
    for (const alias of aliases) {
      const norm = normalizeGameKey(alias);
      if (norm && !map.has(norm)) map.set(norm, entry.id);
    }
  }
  return map;
}

function resolveAuditGameId(rawGame: unknown, aliasMap: Map<string, string>): string | null {
  if (typeof rawGame !== 'string' || !rawGame.trim()) return null;
  const direct = aliasMap.get(normalizeGameKey(rawGame));
  return direct || null;
}

function parsePositive(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function loadAuditFallback(aliasMap: Map<string, string>): Map<string, AuditGameAggregate> {
  const result = new Map<string, AuditGameAggregate>();
  const dayCounters = new Map<string, Map<string, DayActionCounter>>();
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (!raw) return result;
    const entries: AuditEntry[] = JSON.parse(raw);
    for (const entry of entries) {
      if (entry.category !== 'game') continue;
      if (!['game_selected', 'game_started', 'game_complete'].includes(entry.action)) continue;

      const resolvedId = resolveAuditGameId(entry.details?.game, aliasMap);
      if (!resolvedId) continue;

      const date = entry.timestamp?.slice(0, 10) || '';
      if (!date) continue;

      if (!result.has(resolvedId)) {
        result.set(resolvedId, {
          sessions: 0,
          attempts: 0,
          correct: 0,
          lastPlayedAt: '',
          history: new Map<string, number>(),
        });
      }
      if (!dayCounters.has(resolvedId)) dayCounters.set(resolvedId, new Map());

      const agg = result.get(resolvedId)!;
      if (entry.timestamp > agg.lastPlayedAt) agg.lastPlayedAt = entry.timestamp;

      const perGameDayCounter = dayCounters.get(resolvedId)!;
      const currentDay = perGameDayCounter.get(date) || { selected: 0, started: 0, complete: 0 };
      if (entry.action === 'game_selected') currentDay.selected += 1;
      if (entry.action === 'game_started') currentDay.started += 1;
      if (entry.action === 'game_complete') currentDay.complete += 1;
      perGameDayCounter.set(date, currentDay);

      if (entry.action === 'game_complete') {
        const score = parsePositive(entry.details?.score);
        const total = parsePositive(entry.details?.total) || parsePositive(entry.details?.rounds);
        agg.correct += score;
        agg.attempts += total > 0 ? total : score;
      }
    }
  } catch {
    return result;
  }

  for (const [gameId, perDay] of dayCounters.entries()) {
    const agg = result.get(gameId);
    if (!agg) continue;
    let sessions = 0;
    for (const [date, counter] of perDay.entries()) {
      const daySessions = Math.max(counter.selected, counter.started, counter.complete);
      if (daySessions > 0) {
        sessions += daySessions;
        agg.history.set(date, daySessions);
      }
    }
    agg.sessions = sessions;
    if (agg.sessions === 0 && (agg.attempts > 0 || agg.correct > 0)) {
      agg.sessions = 1;
    }
  }

  return result;
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
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
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

/* ── Hook ───────────────────────────────────────── */

export function useGameProgress(): GameProgressSummary {
  const [summary, setSummary] = useState<GameProgressSummary>(() => compute());

  useEffect(() => {
    setSummary(compute());
    const handler = () => setSummary(compute());
    const intervalId = window.setInterval(handler, 2000);
    window.addEventListener('storage', handler);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return summary;
}

function compute(): GameProgressSummary {
  const stars = loadStars();
  const mastery = loadMastery();
  const history = loadGameHistory();
  const last7 = getLast7Days();

  const weeklyMap = new Map<string, number>();
  for (const d of last7) weeklyMap.set(d, 0);

  const games: GameAnalyticsEntry[] = [];
  const subjectDefs: { id: string; icon: string; chapters: ChapterDef[] }[] = [
    { id: 'english', icon: '📚', chapters: ENGLISH_CHAPTERS },
    { id: 'maths', icon: '🔢', chapters: MATHS_CHAPTERS },
    { id: 'science', icon: '🔬', chapters: SCIENCE_CHAPTERS },
  ];
  const subjectConfigs = new Map<string, (GameConfig & { section: string; chapter: string })[]>();
  const chapterDoneBySubject = new Map<string, Set<string>>();

  // Build alias map once so audit log entries resolve even when game naming differs.
  const aliasEntries: Array<{ id: string; title?: string }> = GAME_CONFIGS.map(cfg => ({ id: cfg.id, title: cfg.title }));
  for (const sub of subjectDefs) {
    const cfgs = buildSubjectConfigs(sub.chapters, sub.id, sub.icon);
    subjectConfigs.set(sub.id, cfgs);
    chapterDoneBySubject.set(sub.id, new Set<string>());
    for (const cfg of cfgs) aliasEntries.push({ id: cfg.id, title: cfg.title });
  }
  const auditFallback = loadAuditFallback(buildGameAliasMap(aliasEntries));

  // ── 1. Arcade games (from ssms_gp2_*) ──
  for (const config of GAME_CONFIGS) {
    games.push(buildArcadeEntry(config, stars, history, weeklyMap));
  }

  // ── 2. Subject games (English, Maths, Science from gameMastery) ──
  for (const sub of subjectDefs) {
    const configs = subjectConfigs.get(sub.id) || [];
    const chapterDone = chapterDoneBySubject.get(sub.id)!;

    for (const cfg of configs) {
      const masteryKey = `${sub.id}_${cfg.chapter}_${cfg.id}`;
      const gp = mastery[masteryKey];
      games.push(buildSubjectEntry(cfg, gp, history, weeklyMap));
      if (gp?.easy?.completed) chapterDone.add(cfg.chapter);
    }
  }

  // Merge fallback from audit log so game_selected/game_started sessions are reflected.
  for (const entry of games) {
    const fallback = auditFallback.get(entry.config.id);
    if (!fallback) continue;

    entry.totalSessions = Math.max(entry.totalSessions, fallback.sessions);
    entry.totalAttempts = Math.max(entry.totalAttempts, fallback.attempts);
    entry.totalCorrect = Math.max(entry.totalCorrect, fallback.correct);
    if (entry.totalAttempts > 0 && entry.totalCorrect > entry.totalAttempts) {
      entry.totalCorrect = entry.totalAttempts;
    }
    if (!entry.lastPlayedAt && fallback.lastPlayedAt) {
      entry.lastPlayedAt = fallback.lastPlayedAt;
    }
    if (entry.totalAttempts > 0) {
      entry.overallAccuracy = entry.totalCorrect / entry.totalAttempts;
    }

    const mergedHistory = new Map<string, number>();
    for (const h of entry.history) mergedHistory.set(h.date, h.sessions);
    for (const [date, sessions] of fallback.history.entries()) {
      const prev = mergedHistory.get(date) || 0;
      const merged = Math.max(prev, sessions);
      if (merged > prev && weeklyMap.has(date)) {
        weeklyMap.set(date, (weeklyMap.get(date) || 0) + (merged - prev));
      }
      mergedHistory.set(date, merged);
    }
    if (mergedHistory.size > 0) {
      entry.history = Array.from(mergedHistory.entries())
        .map(([date, sessions]) => ({ date, sessions }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  let totalGamesPlayed = 0;
  let totalSessions = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;
  let bestGameId: string | null = null;
  let bestAccuracy = -1;
  let weakestGameId: string | null = null;
  let worstAccuracy = 2;

  for (const entry of games) {
    const played = entry.totalSessions > 0 || entry.stars > 0;
    if (played) totalGamesPlayed += 1;
    totalSessions += entry.totalSessions;
    totalAttempts += entry.totalAttempts;
    totalCorrect += entry.totalCorrect;

    if (entry.totalAttempts > 0) {
      if (entry.overallAccuracy > bestAccuracy) {
        bestAccuracy = entry.overallAccuracy;
        bestGameId = entry.config.id;
      }
      if (entry.overallAccuracy < worstAccuracy) {
        worstAccuracy = entry.overallAccuracy;
        weakestGameId = entry.config.id;
      }
    }
  }

  const subjects: SubjectSummary[] = subjectDefs.map(sub => {
    const sectionGames = games.filter(g => g.section === sub.id);
    const gamesPlayed = sectionGames.filter(g => g.totalSessions > 0 || g.stars > 0).length;
    const sectionSessions = sectionGames.reduce((sum, g) => sum + g.totalSessions, 0);
    const sectionAttempts = sectionGames.reduce((sum, g) => sum + g.totalAttempts, 0);
    const sectionCorrect = sectionGames.reduce((sum, g) => sum + g.totalCorrect, 0);
    const subAcc = sectionAttempts > 0 ? sectionCorrect / sectionAttempts : 0;
    const completedChapters = chapterDoneBySubject.get(sub.id)?.size || 0;
    const totalGames = (subjectConfigs.get(sub.id) || []).length;

    return {
      subject: sub.id,
      totalChapters: sub.chapters.length,
      completedChapters,
      chaptersStarted: gamesPlayed > 0 ? Math.max(completedChapters, Math.ceil(gamesPlayed / 3)) : 0,
      totalGames,
      gamesPlayed,
      totalSessions: sectionSessions,
      overallAccuracy: subAcc,
      avgAccuracy: subAcc,
    };
  });

  const weeklyActivity = last7.map(date => ({
    date,
    sessions: weeklyMap.get(date) || 0,
  }));

  return {
    totalGamesPlayed,
    totalGamesAvailable: games.length,
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
