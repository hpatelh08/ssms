/**
 * data/mathsChapters.ts
 * Maths chapter listing derived from Std 7 video config.
 */

import { mathsVideos } from './videoConfig';

export interface MathsChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

export const mathsChapters: MathsChapterEntry[] = mathsVideos.map((v) => ({
  id: v.id,
  title: v.title,
  url: v.url,
  embedId: v.embedId,
}));
