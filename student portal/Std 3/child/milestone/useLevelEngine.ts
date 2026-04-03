/**
 * child/milestone/useLevelEngine.ts
 * ─────────────────────────────────────────────────────
 * Space Academy — state engine
 *
 * ⭐ STAR SYSTEM:
 *   Frontend reads stars via xpToStars(totalXP).
 *   All persistence is in XPProvider (child_xp_state).
 *   Level-progress (which levels are unlocked/completed/claimed)
 *   is stored separately in localStorage key "child_kingdom_progress".
 *
 * 🧠 PROGRESSION:
 *   World 1-2  → fully linear (prev must be completed).
 *   World 3-5  → semi-open (need enough stars + world unlocked,
 *                 but can skip ahead within the world *if* stars allow).
 *   Boss nodes → always require all 9 prev levels in the world.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Level,
  LevelProgress,
  LevelState,
  LEVELS,
  WORLDS,
  DEMO_MODE,
  cumulativeXP,
  xpToStars,
  levelsByWorld,
} from './levelData';
import { useXP } from '../XPProvider';

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export interface LevelView extends Level {
  state: LevelState;
  rewardClaimed: boolean;
  starsEarned: number;      // current total stars for the child
  starsNeeded: number;       // stars required for this level
  starsRemaining: number;    // how many more stars needed (0 if ≥)
  progress01: number;        // 0→1 fill for progress bar
  nodeProgress01: number;    // actual progress for the mapped node activity
  nodeProgressLabel: string; // label shown on node
}

export interface WorldView {
  worldId: string;
  worldName: string;
  emoji: string;
  completedCount: number;
  totalCount: number;
  levels: LevelView[];
  isUnlocked: boolean;
}

export interface SpaceEngine {
  worlds: WorldView[];
  totalStars: number;
  totalCompleted: number;
  currentLevel: LevelView | null;
  /** Complete a level: marks it done + optionally claim reward */
  completeLevel: (levelId: string) => void;
  /** Mark a level's reward as claimed (after modal dismiss) */
  claimReward: (levelId: string) => void;
  /** The newly-completed level that needs reward shown */
  pendingReward: LevelView | null;
  /** Dismiss (clear) the pending reward after modal closes */
  dismissReward: () => void;
}

/* ═══════════════════════════════════════════════════
   PERSISTENCE
   ═══════════════════════════════════════════════════ */

const STORAGE_KEY = 'child_kingdom_progress';

type ProgressMap = Record<string, LevelProgress>;

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressMap;
  } catch { /* ignore */ }
  return {};
}

function saveProgress(p: ProgressMap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
  catch { /* quota / private mode */ }
}

function loadArcadeStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem('arcade_game_stars');
    return raw ? JSON.parse(raw) as Record<string, number> : {};
  } catch {
    return {};
  }
}

interface ArcadeDifficultyProgress {
  totalAttempts?: number;
  sessionsPlayed?: number;
}

interface ArcadeGameProgress {
  easy?: ArcadeDifficultyProgress;
  intermediate?: ArcadeDifficultyProgress;
  difficult?: ArcadeDifficultyProgress;
}

function loadArcadeProgress(gameId: string): ArcadeGameProgress | null {
  try {
    const raw = localStorage.getItem(`ssms_gp2_${gameId}`);
    return raw ? JSON.parse(raw) as ArcadeGameProgress : null;
  } catch {
    return null;
  }
}

interface SubjectMiniLevelProgress {
  completed?: boolean;
  total?: number;
}

interface SubjectDifficultyProgress {
  miniLevels?: Record<number, SubjectMiniLevelProgress>;
}

interface SubjectGameProgress {
  easy?: SubjectDifficultyProgress;
  intermediate?: SubjectDifficultyProgress;
  difficult?: SubjectDifficultyProgress;
}

function loadSubjectMastery(): Record<string, SubjectGameProgress> {
  try {
    const raw = localStorage.getItem('gameMastery');
    return raw ? JSON.parse(raw) as Record<string, SubjectGameProgress> : {};
  } catch {
    return {};
  }
}

const GAME_LEVELS_PER_DIFFICULTY: Record<'easy' | 'intermediate' | 'difficult', number> = {
  easy: 40,
  intermediate: 30,
  difficult: 30,
};

const QUESTIONS_PER_LEVEL = 5;
const TOTAL_GAME_LEVELS = 100;

function clampPlayedLevels(value: number, maxLevels: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(maxLevels, Math.floor(value));
}

function arcadeLevelsForDifficulty(
  progress: ArcadeDifficultyProgress | undefined,
  maxLevels: number,
): number {
  const attemptsBased = clampPlayedLevels((progress?.totalAttempts || 0) / QUESTIONS_PER_LEVEL, maxLevels);
  const sessionsBased = clampPlayedLevels(progress?.sessionsPlayed || 0, maxLevels);
  // Keep the better signal so progress is resilient across old/new tracking formats.
  return Math.min(maxLevels, Math.max(attemptsBased, sessionsBased));
}

function subjectLevelsForDifficulty(
  progress: SubjectDifficultyProgress | undefined,
  maxLevels: number,
): number {
  const completedCount = Object.values(progress?.miniLevels || {}).filter(level => level.completed).length;
  return clampPlayedLevels(completedCount, maxLevels);
}

function getNodeProgress(
  lv: Level,
  totalStars: number,
  arcadeStars: Record<string, number>,
  subjectMastery: Record<string, SubjectGameProgress>,
): { progress01: number; label: string } {
  if (lv.requiredGame) {
    const stored = loadArcadeProgress(lv.requiredGame);
    const totalPlayedLevels =
      arcadeLevelsForDifficulty(stored?.easy, GAME_LEVELS_PER_DIFFICULTY.easy) +
      arcadeLevelsForDifficulty(stored?.intermediate, GAME_LEVELS_PER_DIFFICULTY.intermediate) +
      arcadeLevelsForDifficulty(stored?.difficult, GAME_LEVELS_PER_DIFFICULTY.difficult);
    const clampedLevels = clampPlayedLevels(totalPlayedLevels, TOTAL_GAME_LEVELS);
    const progress01 = clampedLevels / TOTAL_GAME_LEVELS;

    if (clampedLevels <= 0 && (arcadeStars[lv.requiredGame] || 0) <= 0) {
      return { progress01: 0, label: '0%' };
    }

    return { progress01, label: `${clampedLevels}%` };
  }

  if (lv.subjectGameKey) {
    const gp = subjectMastery[lv.subjectGameKey];
    const totalPlayedLevels =
      subjectLevelsForDifficulty(gp?.easy, GAME_LEVELS_PER_DIFFICULTY.easy) +
      subjectLevelsForDifficulty(gp?.intermediate, GAME_LEVELS_PER_DIFFICULTY.intermediate) +
      subjectLevelsForDifficulty(gp?.difficult, GAME_LEVELS_PER_DIFFICULTY.difficult);
    const clampedLevels = clampPlayedLevels(totalPlayedLevels, TOTAL_GAME_LEVELS);
    const progress01 = clampedLevels / TOTAL_GAME_LEVELS;
    return { progress01, label: `${clampedLevels}%` };
  }

  if (lv.requiredStars > 0) {
    const progress01 = Math.min(1, totalStars / lv.requiredStars);
    return { progress01, label: `${Math.round(progress01 * 100)}%` };
  }

  return { progress01: 1, label: '100%' };
}

/* ═══════════════════════════════════════════════════
   UNLOCK LOGIC
   ═══════════════════════════════════════════════════ */

function computeState(
  lv: Level,
  totalXP: number,
  progressMap: ProgressMap,
  worldMap: Map<string, Level[]>,
): LevelState {
  // Already completed?
  if (progressMap[lv.id]?.state === 'completed') return 'completed';

  // ── DEMO MODE: every uncompleted level is active ──
  if (DEMO_MODE) return 'active';

  const world = WORLDS.find(w => w.id === lv.worldId)!;

  // ── World gate: for W2+ the boss of the previous world must be completed ──
  if (world.order > 0) {
    const prevWorld = WORLDS[world.order - 1];
    const prevBoss = LEVELS.find(l => l.worldId === prevWorld.id && l.type === 'boss');
    if (prevBoss && progressMap[prevBoss.id]?.state !== 'completed') return 'locked';
  }

  // ── XP / Stars gate ──
  if (totalXP < lv.requiredXP) return 'locked';

  // ── Boss requires all 9 siblings completed ──
  if (lv.type === 'boss') {
    const siblings = worldMap.get(lv.worldId) ?? [];
    const allDone = siblings
      .filter(s => s.type !== 'boss')
      .every(s => progressMap[s.id]?.state === 'completed');
    if (!allDone) return 'locked';
    return 'active';
  }

  // ── Linear worlds (W1-W2): must complete previous level ──
  if (!world.semiOpen && lv.worldOrder > 1) {
    const prevLv = LEVELS.find(
      l => l.worldId === lv.worldId && l.worldOrder === lv.worldOrder - 1,
    );
    if (prevLv && progressMap[prevLv.id]?.state !== 'completed') return 'locked';
  }

  // ── Semi-open worlds (W3-W5): just need enough stars ──
  return 'active';
}

/* ═══════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════ */

export function useLevelEngine(): SpaceEngine {
  const { state: xpState } = useXP();
  const [progressMap, setProgressMap] = useState<ProgressMap>(loadProgress);
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Persist progress whenever it changes
  const prevMapRef = useRef(progressMap);
  useEffect(() => {
    if (prevMapRef.current !== progressMap) {
      saveProgress(progressMap);
      prevMapRef.current = progressMap;
    }
  }, [progressMap]);

  // Computed totalXP
  const totalXP = useMemo(
    () => cumulativeXP(xpState.level, xpState.xp),
    [xpState.level, xpState.xp],
  );

  const totalStars = useMemo(() => xpToStars(totalXP), [totalXP]);
  const arcadeStars = useMemo(() => loadArcadeStars(), [refreshTick]);
  const subjectMastery = useMemo(() => loadSubjectMastery(), [refreshTick]);

  const worldMap = useMemo(() => levelsByWorld(), []);

  useEffect(() => {
    const refresh = () => setRefreshTick(v => v + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // ── Build views ──
  const worlds: WorldView[] = useMemo(() => {
    return WORLDS.map(w => {
      const wLevels = worldMap.get(w.id) ?? [];
      const views: LevelView[] = wLevels.map(lv => {
        const st = computeState(lv, totalXP, progressMap, worldMap);
        const starsEarned = totalStars;
        const starsNeeded = lv.requiredStars;
        const starsRemaining = Math.max(0, starsNeeded - starsEarned);
        const progress01 = starsNeeded <= 0
          ? 1
          : Math.min(1, starsEarned / starsNeeded);
        const nodeProgress = getNodeProgress(lv, totalStars, arcadeStars, subjectMastery);
        return {
          ...lv,
          state: st,
          rewardClaimed: progressMap[lv.id]?.rewardClaimed ?? false,
          starsEarned,
          starsNeeded,
          starsRemaining,
          progress01,
          nodeProgress01: nodeProgress.progress01,
          nodeProgressLabel: nodeProgress.label,
        };
      });

      // World is unlocked if at least the first level is not locked
      const isUnlocked = views.length > 0 && views[0].state !== 'locked';

      return {
        worldId: w.id,
        worldName: w.name,
        emoji: w.emoji,
        completedCount: views.filter(v => v.state === 'completed').length,
        totalCount: views.length,
        levels: views,
        isUnlocked,
      };
    });
  }, [totalXP, totalStars, progressMap, worldMap, arcadeStars, subjectMastery]);

  // Total completed
  const totalCompleted = useMemo(
    () => worlds.reduce((s, w) => s + w.completedCount, 0),
    [worlds],
  );

  // Current level = first active level globally
  const currentLevel = useMemo(() => {
    for (const w of worlds) {
      const first = w.levels.find(l => l.state === 'active');
      if (first) return first;
    }
    return null;
  }, [worlds]);

  // Pending reward view
  const pendingReward = useMemo(() => {
    if (!pendingRewardId) return null;
    for (const w of worlds) {
      const lv = w.levels.find(l => l.id === pendingRewardId);
      if (lv) return lv;
    }
    return null;
  }, [pendingRewardId, worlds]);

  // Complete a level
  const completeLevel = useCallback((levelId: string) => {
    setProgressMap(prev => {
      if (prev[levelId]?.state === 'completed') return prev;
      return {
        ...prev,
        [levelId]: {
          levelId,
          state: 'completed',
          completedAt: new Date().toISOString(),
          rewardClaimed: false,
        },
      };
    });
    setPendingRewardId(levelId);
  }, []);

  // Claim reward
  const claimReward = useCallback((levelId: string) => {
    setProgressMap(prev => ({
      ...prev,
      [levelId]: { ...prev[levelId], rewardClaimed: true },
    }));
  }, []);

  const dismissReward = useCallback(() => {
    if (pendingRewardId) claimReward(pendingRewardId);
    setPendingRewardId(null);
  }, [pendingRewardId, claimReward]);

  return {
    worlds,
    totalStars,
    totalCompleted,
    currentLevel,
    completeLevel,
    claimReward,
    pendingReward,
    dismissReward,
  };
}
