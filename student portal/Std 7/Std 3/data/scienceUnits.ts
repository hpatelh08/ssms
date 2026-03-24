/**
 * data/scienceUnits.ts
 * Science chapter listing derived from Std 7 video config.
 */

import { scienceVideos } from './videoConfig';

export interface ScienceUnitEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

export const scienceUnits: ScienceUnitEntry[] = scienceVideos.map((v) => ({
  id: v.id,
  title: v.title,
  url: v.url,
  embedId: v.embedId,
}));
