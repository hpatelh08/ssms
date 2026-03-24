/**
 * data/hindiRhymes.ts
 * Hindi supplementary Q&A videos for Class 6
 */

export interface RhymeEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

export const hindiRhymes: RhymeEntry[] = [];
