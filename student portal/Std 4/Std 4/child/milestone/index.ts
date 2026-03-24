/**
 * child/milestone/index.ts — barrel exports
 */

export { JourneyCard } from './JourneyCard';
export { default as MilestoneJourney } from './MilestoneJourney';
export { useLevelEngine } from './useLevelEngine';
export type { LevelView, WorldView, KingdomEngine } from './useLevelEngine';
export {
  LEVELS,
  WORLDS,
  TOTAL_LEVELS,
  MAX_LEVEL_STARS,
  DEMO_MODE,
  xpToStars,
  cumulativeXP,
  levelsByWorld,
} from './levelData';
export type { Level, WorldDef, LevelState, LevelType, LevelReward } from './levelData';
export { WORLD_THEMES, MAP_HEIGHT, computeAllPositions, getTheme } from './WorldThemeManager';
export type { WorldTheme, NodePos, DecoItem } from './WorldThemeManager';
export { buildPathD } from './AnimatedRoadSVG';
export type { MascotProps } from './MascotWalker';
