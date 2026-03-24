/**
 * 🌳 TreeContext — Global Tree Store
 * ────────────────────────────────────────────────────
 * Shared context for the upgraded My Tree module.
 * Both Parent and Child consume the same tree data.
 *
 * Data flow:
 *   homework completion → waterLevel
 *   games played        → sunlightLevel
 *   attendance present  → happiness
 *   all three > 70      → next stage auto-upgrade
 *
 * Persisted in localStorage under `ssms_tree_state`.
 * No side effects beyond localStorage writes.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

import {
  type TreeState,
  type TreeStage,
  calculateTreeStage,
  calculateOverallGrowth,
  deriveWaterLevel,
  deriveSunlightLevel,
  deriveHappiness,
  isStageUpgrade,
  createDefaultTreeState,
  TREE_STORAGE_KEY,
  STAGE_META,
} from '../utils/treeEngine';

/* ── Context shape ──────────────────────────────── */

export interface TreeContextValue {
  /** Current tree state (read-only snapshot) */
  tree: TreeState;

  /** Overall growth 0-100 */
  overallGrowth: number;

  /** Stage metadata (label, icon, color) */
  stageMeta: (typeof STAGE_META)[TreeStage];

  /** Manual actions */
  waterTree: () => void;
  addSunshine: () => void;
  celebrate: () => void;

  /** Whether a stage-up just happened (auto clears after 3s) */
  justLeveledUp: boolean;

  /** Force a resync from localStorage data sources */
  syncFromData: () => void;
}

const TreeContext = createContext<TreeContextValue>({
  tree: createDefaultTreeState(),
  overallGrowth: 0,
  stageMeta: STAGE_META.seed,
  waterTree: () => {},
  addSunshine: () => {},
  celebrate: () => {},
  justLeveledUp: false,
  syncFromData: () => {},
});

/* ── Data readers (same localStorage as useGrowthSystem) ── */

function readHomeworkPercent(): number {
  try {
    const raw = localStorage.getItem('ssms_homework');
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items) && items.length > 0) {
        const done = items.filter((h: { isDone?: boolean }) => h.isDone).length;
        return Math.round((done / items.length) * 100);
      }
    }
  } catch { /* ignore */ }
  return 0;
}

function readCompletedGames(): number {
  try {
    const raw = localStorage.getItem('ssms_audit_log');
    if (raw) {
      const log = JSON.parse(raw);
      if (Array.isArray(log)) {
        return log.filter(
          (e: { action?: string }) => e.action === 'game_complete',
        ).length;
      }
    }
  } catch { /* ignore */ }
  return 0;
}

function readAttendancePercent(): number {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    if (raw) {
      const stats = JSON.parse(raw);
      const attendance: string[] = Array.isArray(stats.attendance) ? stats.attendance : [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const today = now.toISOString().split('T')[0];
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

      let schoolDays = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        if (dt > now) break;
        const dow = dt.getDay();
        if (dow !== 0 && dow !== 6) schoolDays++;
      }

      const present = attendance.filter(a => a.startsWith(prefix) && a <= today).length;
      return schoolDays > 0 ? Math.round((present / schoolDays) * 100) : 100;
    }
  } catch { /* ignore */ }
  return 0;
}

function readPersistedTree(): TreeState | null {
  try {
    const raw = localStorage.getItem(TREE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function persistTree(state: TreeState): void {
  try {
    localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/* ── Derive full tree state from live data ──────── */

function buildTreeFromData(existing?: TreeState | null): TreeState {
  const homeworkPct = readHomeworkPercent();
  const games = readCompletedGames();
  const attendancePct = readAttendancePercent();

  const water = deriveWaterLevel(homeworkPct);
  const sun = deriveSunlightLevel(games);
  const happy = deriveHappiness(attendancePct);

  const draft: TreeState = {
    stage: existing?.stage ?? 'seed',
    waterLevel: water,
    sunlightLevel: sun,
    happiness: happy,
    attendanceRate: attendancePct,
    homeworkCompleted: homeworkPct,
    gamesEngagement: Math.min(100, Math.round((games / 20) * 100)),
    treeName: existing?.treeName ?? 'My Growing Tree',
    lastUpdated: new Date().toISOString(),
  };

  // Auto-calculate stage
  draft.stage = calculateTreeStage(draft);

  return draft;
}

/* ── Provider ───────────────────────────────────── */

export const TreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tree, setTree] = useState<TreeState>(() => {
    const persisted = readPersistedTree();
    return buildTreeFromData(persisted);
  });

  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const levelUpTimer = useRef<ReturnType<typeof setTimeout>>();

  // Persist on every change
  useEffect(() => {
    persistTree(tree);
  }, [tree]);

  // Sync from data sources every 5 seconds (picks up homework/game/attendance changes)
  useEffect(() => {
    const interval = setInterval(() => {
      setTree(prev => {
        const next = buildTreeFromData(prev);
        // Check for stage upgrade
        if (isStageUpgrade(prev.stage, next.stage)) {
          setJustLeveledUp(true);
          if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
          levelUpTimer.current = setTimeout(() => setJustLeveledUp(false), 3000);
        }
        return next;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
    };
  }, []);

  // Manual sync
  const syncFromData = useCallback(() => {
    setTree(prev => {
      const next = buildTreeFromData(prev);
      if (isStageUpgrade(prev.stage, next.stage)) {
        setJustLeveledUp(true);
        if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
        levelUpTimer.current = setTimeout(() => setJustLeveledUp(false), 3000);
      }
      return next;
    });
  }, []);

  // Manual action: water (+10 water, capped at 100)
  const waterTree = useCallback(() => {
    setTree(prev => {
      const next = {
        ...prev,
        waterLevel: Math.min(100, prev.waterLevel + 10),
        lastUpdated: new Date().toISOString(),
      };
      next.stage = calculateTreeStage(next);
      if (isStageUpgrade(prev.stage, next.stage)) {
        setJustLeveledUp(true);
        if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
        levelUpTimer.current = setTimeout(() => setJustLeveledUp(false), 3000);
      }
      return next;
    });
  }, []);

  // Manual action: sunshine (+10 sunlight, capped at 100)
  const addSunshine = useCallback(() => {
    setTree(prev => {
      const next = {
        ...prev,
        sunlightLevel: Math.min(100, prev.sunlightLevel + 10),
        lastUpdated: new Date().toISOString(),
      };
      next.stage = calculateTreeStage(next);
      if (isStageUpgrade(prev.stage, next.stage)) {
        setJustLeveledUp(true);
        if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
        levelUpTimer.current = setTimeout(() => setJustLeveledUp(false), 3000);
      }
      return next;
    });
  }, []);

  // Manual action: celebrate (+10 happiness, capped at 100)
  const celebrateAction = useCallback(() => {
    setTree(prev => {
      const next = {
        ...prev,
        happiness: Math.min(100, prev.happiness + 10),
        lastUpdated: new Date().toISOString(),
      };
      next.stage = calculateTreeStage(next);
      if (isStageUpgrade(prev.stage, next.stage)) {
        setJustLeveledUp(true);
        if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
        levelUpTimer.current = setTimeout(() => setJustLeveledUp(false), 3000);
      }
      return next;
    });
  }, []);

  const overallGrowth = useMemo(() => calculateOverallGrowth(tree), [tree]);
  const stageMeta = useMemo(() => STAGE_META[tree.stage], [tree.stage]);

  const value = useMemo<TreeContextValue>(
    () => ({
      tree,
      overallGrowth,
      stageMeta,
      waterTree,
      addSunshine,
      celebrate: celebrateAction,
      justLeveledUp,
      syncFromData,
    }),
    [tree, overallGrowth, stageMeta, waterTree, addSunshine, celebrateAction, justLeveledUp, syncFromData],
  );

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
};

/* ── Consumer hooks ─────────────────────────────── */

/** Full tree context */
export const useTree = (): TreeContextValue => useContext(TreeContext);

/** Tree state only (for read-only consumers like parent cards) */
export const useTreeState = (): TreeState => {
  const { tree } = useContext(TreeContext);
  return tree;
};

/** Overall growth % shortcut */
export const useOverallGrowth = (): number => {
  const { overallGrowth } = useContext(TreeContext);
  return overallGrowth;
};
