// Fill in the Blanks MCQ (Sample: 2 levels, 5 questions each)
export interface FillBlankMCQ {
  question: string;
  options: string[]; // 4 options
  answer: string;    // correct answer
}

export interface FillBlankLevelMCQ {
  level: number;
  questions: FillBlankMCQ[];
}

export const fillBlanksLevelsMCQ: FillBlankLevelMCQ[] = [
  {
    level: 1,
    questions: [
      { question: 'The sun rises in the _____.', options: ['west', 'north', 'east', 'south'], answer: 'east' },
      { question: 'Water freezes at _____ degrees Celsius.', options: ['10', '0', '100', '50'], answer: '0' },
      { question: 'The capital of India is _____.', options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], answer: 'New Delhi' },
      { question: 'Plants make food by the process of _____.', options: ['respiration', 'photosynthesis', 'digestion', 'transpiration'], answer: 'photosynthesis' },
      { question: 'The largest planet in our solar system is _____.', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], answer: 'Jupiter' },
    ],
  },
  {
    level: 2,
    questions: [
      { question: 'The process of changing water into vapor is called _____.', options: ['condensation', 'evaporation', 'precipitation', 'sublimation'], answer: 'evaporation' },
      { question: 'The national animal of India is _____.', options: ['Lion', 'Tiger', 'Elephant', 'Leopard'], answer: 'Tiger' },
      { question: 'The chemical formula of water is _____.', options: ['CO2', 'H2O', 'O2', 'NaCl'], answer: 'H2O' },
      { question: 'The fastest land animal is the _____.', options: ['Cheetah', 'Lion', 'Horse', 'Tiger'], answer: 'Cheetah' },
      { question: 'The human heart has _____ chambers.', options: ['2', '3', '4', '5'], answer: '4' },
    ],
  },
  // ...add up to 200 levels
];
