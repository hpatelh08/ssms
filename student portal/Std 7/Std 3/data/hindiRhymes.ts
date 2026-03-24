/**
 * data/hindiRhymes.ts
 * No separate Std 7 Hindi rhyme-only list was provided in the new links.
 * Hindi chapter videos are now maintained in data/hindiChapters.ts.
 */

export interface RhymeEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

export const hindiRhymes: RhymeEntry[] = [];
