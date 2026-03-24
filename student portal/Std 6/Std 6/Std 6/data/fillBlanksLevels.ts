// Fill in the Blanks Questions (Sample: 2 levels, 5 questions each)
export interface FillBlankQuestion {
  question: string;
  answer: string;
}

export interface FillBlankLevel {
  level: number;
  questions: FillBlankQuestion[];
}

export const fillBlanksLevels: FillBlankLevel[] = [
  {
    level: 1,
    questions: [
      { question: 'The sun rises in the _____.', answer: 'east' },
      { question: 'Water freezes at _____ degrees Celsius.', answer: '0' },
      { question: 'The capital of India is _____.', answer: 'New Delhi' },
      { question: 'Plants make food by the process of _____.', answer: 'photosynthesis' },
      { question: 'The largest planet in our solar system is _____.', answer: 'Jupiter' },
    ],
  },
  {
    level: 2,
    questions: [
      { question: 'The process of changing water into vapor is called _____.', answer: 'evaporation' },
      { question: 'The national animal of India is _____.', answer: 'Tiger' },
      { question: 'The chemical formula of water is _____.', answer: 'H2O' },
      { question: 'The fastest land animal is the _____.', answer: 'Cheetah' },
      { question: 'The human heart has _____ chambers.', answer: '4' },
    ],
  },
  // ...add up to 200 levels
];
