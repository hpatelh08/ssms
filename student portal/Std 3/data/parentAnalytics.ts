/**
 * data/parentAnalytics.ts
 * ─────────────────────────────────────────────────────
 * Shared parent-facing analytics dataset.
 *
 * The color skills page reads from this single source.
 * Replace with real API responses when the backend is ready.
 */

export const parentAnalytics = {
  /* ═══════════════════════════════════════════════
     COLOR SKILLS
     ═══════════════════════════════════════════════ */

  colorSkills: {
    visits: 14,
    colorsLearned: 7,
    shapesMastered: 6,
    accuracy: 84,
    avgTime: 18,

    colors: [
      { name: "Red",    accuracy: 92 },
      { name: "Blue",   accuracy: 85 },
      { name: "Yellow", accuracy: 78 },
      { name: "Green",  accuracy: 88 },
      { name: "Pink",   accuracy: 81 },
      { name: "Purple", accuracy: 76 },
      { name: "Orange", accuracy: 69 },
    ],

    shapes: [
      { name: "Apple",     accuracy: 90 },
      { name: "Sun",       accuracy: 82 },
      { name: "Balloon",   accuracy: 88 },
      { name: "Fish",      accuracy: 75 },
      { name: "Butterfly", accuracy: 80 },
      { name: "Star",      accuracy: 84 },
      { name: "House",     accuracy: 91 },
      { name: "Cupcake",   accuracy: 86 },
    ],

    weeklyProgress: [62, 71, 79, 84],
  },

};
