/**
 * child/milestone/useLevelEngine.ts
 * ─────────────────────────────────────────────────────
 * Magical Learning Kingdom — state engine
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

export interface KingdomEngine {
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

export function useLevelEngine(): KingdomEngine {
  const { state: xpState } = useXP();
  const [progressMap, setProgressMap] = useState<ProgressMap>(loadProgress);
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);

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

  const worldMap = useMemo(() => levelsByWorld(), []);

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
        return {
          ...lv,
          state: st,
          rewardClaimed: progressMap[lv.id]?.rewardClaimed ?? false,
          starsEarned,
          starsNeeded,
          starsRemaining,
          progress01,
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
  }, [totalXP, totalStars, progressMap, worldMap]);

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
