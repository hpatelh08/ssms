/**
 * 🌳 treeEngine.ts — Growth Logic Engine
 * ────────────────────────────────────────────────────
 * Pure deterministic functions for the Tree module.
 * No React, no side effects, no imports.
 *
 * Stage Progression:
 *   seed → sprout → plant → young → flowering → fruit
 *
 * Stat Sources:
 *   waterLevel     ← homework completion %
 *   sunlightLevel  ← game engagement %
 *   happiness      ← attendance presence %
 *
 * Stage advances when average of all three > threshold.
 */

/* ── Types ──────────────────────────────────────── */

export type TreeStage = 'seed' | 'sprout' | 'plant' | 'young' | 'flowering' | 'fruit';

export interface TreeState {
  stage: TreeStage;
  waterLevel: number;       // 0–100
  sunlightLevel: number;    // 0–100
  happiness: number;        // 0–100
  attendanceRate: number;   // 0–100
  homeworkCompleted: number; // 0–100
  gamesEngagement: number;  // 0–100
  treeName: string;
  lastUpdated: string;      // ISO date
}

/* ── Stage calculation ──────────────────────────── */

const STAGE_ORDER: TreeStage[] = ['seed', 'sprout', 'plant', 'young', 'flowering', 'fruit'];

export function calculateTreeStage(state: TreeState): TreeStage {
  const avg = (state.waterLevel + state.sunlightLevel + state.happiness) / 3;

  if (avg > 90) return 'fruit';
  if (avg > 75) return 'flowering';
  if (avg > 60) return 'young';
  if (avg > 40) return 'plant';
  if (avg > 20) return 'sprout';
  return 'seed';
}

export function getStageIndex(stage: TreeStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isStageUpgrade(oldStage: TreeStage, newStage: TreeStage): boolean {
  return getStageIndex(newStage) > getStageIndex(oldStage);
}

/* ── Overall growth % ───────────────────────────── */

export function calculateOverallGrowth(state: TreeState): number {
  const avg = (state.waterLevel + state.sunlightLevel + state.happiness) / 3;
  return Math.min(100, Math.max(0, Math.round(avg)));
}

/* ── Stat derivation from real data ─────────────── */

/**
 * Derive waterLevel from homework completion %.
 * Each homework done contributes to watering the tree.
 */
export function deriveWaterLevel(homeworkPercent: number): number {
  return Math.min(100, Math.max(0, Math.round(homeworkPercent)));
}

/**
 * Derive sunlightLevel from game engagement.
 * completedGames maps to 0-100 scale (20 games = 100%).
 */
export function deriveSunlightLevel(completedGames: number): number {
  return Math.min(100, Math.max(0, Math.round((completedGames / 20) * 100)));
}

/**
 * Derive happiness from attendance rate.
 * Direct 1:1 mapping — 100% attendance = 100% happiness.
 */
export function deriveHappiness(attendancePercent: number): number {
  return Math.min(100, Math.max(0, Math.round(attendancePercent)));
}

/* ── Stage labels & emoji ───────────────────────── */

export const STAGE_META: Record<TreeStage, { label: string; icon: string; color: string }> = {
  seed:      { label: 'Seed',      icon: '🌰', color: '#92400e' },
  sprout:    { label: 'Sprout',    icon: '🌱', color: '#65a30d' },
  plant:     { label: 'Plant',     icon: '🌿', color: '#16a34a' },
  young:     { label: 'Young Tree',icon: '🌲', color: '#059669' },
  flowering: { label: 'Flowering', icon: '🌸', color: '#db2777' },
  fruit:     { label: 'Fruit Tree',icon: '🍎', color: '#dc2626' },
};

/* ── Stat bar color helpers ─────────────────────── */

export function getStatColor(value: number): string {
  if (value >= 80) return '#22c55e';
  if (value >= 60) return '#60a5fa';
  if (value >= 40) return '#fbbf24';
  if (value >= 20) return '#f97316';
  return '#ef4444';
}

/* ── Default state factory ──────────────────────── */

export function createDefaultTreeState(): TreeState {
  return {
    stage: 'seed',
    waterLevel: 0,
    sunlightLevel: 0,
    happiness: 0,
    attendanceRate: 0,
    homeworkCompleted: 0,
    gamesEngagement: 0,
    treeName: 'My Growing Tree',
    lastUpdated: new Date().toISOString(),
  };
}

/* ── localStorage key ───────────────────────────── */

export const TREE_STORAGE_KEY = 'ssms_tree_state';
