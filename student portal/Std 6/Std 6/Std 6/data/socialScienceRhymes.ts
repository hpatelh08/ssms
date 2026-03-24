/**
 * data/socialScienceRhymes.ts
 * Social Science supplementary Q&A videos for Class 6
 */

export interface RhymeEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

export const socialScienceRhymes: RhymeEntry[] = [];
