/**
 * data/englishUnits.ts
 * English lesson listing derived from Std 7 video config.
 */

import { englishVideos } from './videoConfig';

export interface UnitEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

export const englishUnits: UnitEntry[] = englishVideos.map((v) => ({
  id: v.id,
  title: v.title,
  url: v.url,
  embedId: v.embedId,
}));
