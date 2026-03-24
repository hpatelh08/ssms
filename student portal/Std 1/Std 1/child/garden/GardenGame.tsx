/**
 * garden/GardenGame.tsx
 * ──────────────────────────────────────────────────
 * Entry point for the Interactive Garden.
 *
 * This is a thin wrapper that lazy-loads the GardenScene
 * orchestrator. It exists so ChildLayout.tsx can keep its
 * existing `import('./garden/GardenGame')` unchanged.
 *
 * All logic, sub-components, and CSS live in:
 *   - GardenScene.tsx  (orchestrator)
 *   - Tree.tsx          (layered tree + canopy containers)
 *   - Fruit.tsx         (clickable fruit anchored to canopy)
 *   - Birds.tsx         (ambient + spawned birds)
 *   - WeatherController.tsx (rain, sun, clouds, pollen, rainbow)
 *   - Sparkle.tsx       (star sparkle effect)
 */

import React from 'react';
import { GardenScene } from './GardenScene';

export const GardenGame: React.FC = () => <GardenScene />;

export default GardenGame;
