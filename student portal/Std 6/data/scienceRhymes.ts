/**
 * data/scienceRhymes.ts
 * Science supplementary Q&A videos for Class 6
 */

export interface RhymeEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

export const scienceRhymes: RhymeEntry[] = [];
