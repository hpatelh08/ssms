/**
 * data/hindiChapters.ts
 * Hindi chapter listing derived from Std 7 video config.
 */

import { hindiVideos } from './videoConfig';

export interface HindiChapterEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  unit: string;
  type: 'कविता' | 'कहानी' | 'संवाद';
  topics: string;
}

function inferType(title: string): HindiChapterEntry['type'] {
  const t = title.toLowerCase();
  if (t.includes('कुंडलिया') || t.includes('वर्षा') || t.includes('मीरा')) return 'कविता';
  if (t.includes('संवाद')) return 'संवाद';
  return 'कहानी';
}

export const hindiChapters: HindiChapterEntry[] = hindiVideos.map((v) => ({
  id: v.id,
  title: v.title,
  url: v.url,
  embedId: v.embedId,
  unit: 'Std 7 Hindi',
  type: inferType(v.title),
  topics: 'Comprehension, vocabulary, and question practice',
}));
