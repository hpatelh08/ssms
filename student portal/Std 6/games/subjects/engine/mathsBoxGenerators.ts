import { Difficulty, Question } from './types';

type GenFn = (difficulty: Difficulty) => Question;

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function numberRange(difficulty: Difficulty): [number, number] {
  if (difficulty === 'easy') return [1, 30];
  if (difficulty === 'intermediate') return [10, 120];
  return [-60, 250];
}

function makeNumericOptions(correct: number, count = 4): string[] {
  const options = new Set<number>([correct]);
  while (options.size < count) {
    const delta = randInt(-12, 12) || 1;
    options.add(correct + delta);
  }
  return shuffle(Array.from(options).map(String));
}

function makeOptions(correct: string, pool: string[], count = 4): string[] {
  const others = shuffle(pool.filter((p) => p !== correct)).slice(0, Math.max(0, count - 1));
  return shuffle([correct, ...others]);
}

function sequenceQuestion(base: number, step: number): Question {
  const n1 = base;
  const n2 = base + step;
  const n3 = n2 + step;
  const n4 = n3 + step;
  return {
    id: `seq_${uid()}`,
    text: `Find the next number:\n${n1}, ${n2}, ${n3}, ${n4}, ?`,
    options: makeNumericOptions(n4 + step),
    correctAnswer: String(n4 + step),
  };
}

function missingSequenceQuestion(base: number, step: number): Question {
  const n1 = base;
  const n2 = base + step;
  const n3 = n2 + step;
  const n4 = n3 + step;
  return {
    id: `mseq_${uid()}`,
    text: `Fill the missing number:\n${n1}, __, ${n3}, ${n4}`,
    options: makeNumericOptions(n2),
    correctAnswer: String(n2),
  };
}

const G: Record<string, GenFn> = {
  // Unit 1: Patterns
  math_u1_box1_number_patterns: (d) => {
    const [min, max] = numberRange(d);
    const step = d === 'easy' ? randInt(1, 4) : d === 'intermediate' ? randInt(2, 9) : randInt(3, 14);
    const base = randInt(min, max - step * 6);
    return randInt(0, 1) === 0 ? sequenceQuestion(base, step) : missingSequenceQuestion(base, step);
  },
  math_u1_box2_shape_patterns: () => {
    const shapes = ['Circle', 'Square', 'Triangle', 'Rectangle', 'Pentagon'];
    const a = shapes[randInt(0, shapes.length - 1)];
    let b = shapes[randInt(0, shapes.length - 1)];
    while (b === a) b = shapes[randInt(0, shapes.length - 1)];
    return {
      id: `shape_pat_${uid()}`,
      text: `Find the next shape in pattern:\n${a}, ${b}, ${a}, ${b}, ?`,
      options: makeOptions(a, shapes),
      correctAnswer: a,
    };
  },
  math_u1_box3_pattern_relations: (d) => {
    const start = d === 'easy' ? randInt(1, 8) : randInt(5, 20);
    const mul = d === 'difficult' ? randInt(3, 5) : randInt(2, 3);
    const a = start;
    const b = a * mul;
    const c = b * mul;
    return {
      id: `rel_pat_${uid()}`,
      text: `Relation pattern:\n${a} -> ${b} -> ${c} -> ?`,
      options: makeNumericOptions(c * mul),
      correctAnswer: String(c * mul),
    };
  },

  // Unit 2: Lines and Angles
  math_u2_box1_points_lines: () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let a = letters[randInt(0, letters.length - 1)];
    let b = letters[randInt(0, letters.length - 1)];
    while (b === a) b = letters[randInt(0, letters.length - 1)];
    const name = `${a}${b}`;
    const prompt = [
      { q: `Line segment ${name} has how many end points?`, a: '2', opts: ['0', '1', '2', '3'] },
      { q: `Ray ${name} has how many end points?`, a: '1', opts: ['0', '1', '2', '3'] },
      { q: `Line ${name} has how many end points?`, a: '0', opts: ['0', '1', '2', '3'] },
    ][randInt(0, 2)];
    return { id: `line_${uid()}`, text: prompt.q, options: shuffle(prompt.opts), correctAnswer: prompt.a };
  },
  math_u2_box2_angle_basics: () => {
    const angle = randInt(1, 179);
    const ans = angle < 90 ? 'Acute angle' : angle === 90 ? 'Right angle' : 'Obtuse angle';
    return {
      id: `ang_basic_${uid()}`,
      text: `Identify the angle type: ${angle}°`,
      options: makeOptions(ans, ['Acute angle', 'Right angle', 'Obtuse angle', 'Straight angle']),
      correctAnswer: ans,
    };
  },
  math_u2_box3_angle_measure: (d) => {
    const angle = d === 'easy' ? randInt(0, 180) : randInt(10, 170);
    return {
      id: `ang_measure_${uid()}`,
      text: `Which option is closest to ${angle}°?`,
      options: makeNumericOptions(angle, 4).map((x) => `${x}°`),
      correctAnswer: `${angle}°`,
    };
  },

  // Unit 3: Number Play
  math_u3_box1_number_tricks: (d) => {
    const n = d === 'easy' ? randInt(11, 99) : randInt(100, 999);
    const isPalindrome = String(n) === String(n).split('').reverse().join('');
    return {
      id: `num_trick_${uid()}`,
      text: `Is ${n} a palindrome number?`,
      options: ['Yes', 'No'],
      correctAnswer: isPalindrome ? 'Yes' : 'No',
    };
  },
  math_u3_box2_number_line: (d) => {
    const [min, max] = d === 'difficult' ? [-30, 30] : [0, 60];
    const a = randInt(min, max - 5);
    const b = a + randInt(2, 8);
    return {
      id: `num_line_${uid()}`,
      text: `Distance on number line from ${a} to ${b} is:`,
      options: makeNumericOptions(Math.abs(b - a)),
      correctAnswer: String(Math.abs(b - a)),
    };
  },
  math_u3_box3_mental_math: (d) => {
    const a = randInt(10, d === 'easy' ? 40 : 90);
    const b = randInt(5, d === 'easy' ? 25 : 60);
    const op = randInt(0, 1) === 0 ? '+' : '-';
    const correct = op === '+' ? a + b : a - b;
    return {
      id: `mental_${uid()}`,
      text: `Solve quickly: ${a} ${op} ${b}`,
      options: makeNumericOptions(correct),
      correctAnswer: String(correct),
    };
  },

  // Unit 4: Data Handling
  math_u4_box1_data_collection: () => {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    return {
      id: `data_col_${uid()}`,
      text: `Class collected ${a} red balls and ${b} blue balls. Total balls?`,
      options: makeNumericOptions(a + b),
      correctAnswer: String(a + b),
    };
  },
  math_u4_box2_pictographs: () => {
    const symbols = randInt(2, 9);
    const each = randInt(2, 5);
    return {
      id: `pict_${uid()}`,
      text: `In a pictograph, 1 symbol = ${each} students. ${symbols} symbols represent how many students?`,
      options: makeNumericOptions(symbols * each),
      correctAnswer: String(symbols * each),
    };
  },
  math_u4_box3_bar_graphs: () => {
    const a = randInt(5, 20);
    const b = randInt(5, 20);
    return {
      id: `bar_${uid()}`,
      text: `Bar A = ${a}, Bar B = ${b}. Difference between bars?`,
      options: makeNumericOptions(Math.abs(a - b)),
      correctAnswer: String(Math.abs(a - b)),
    };
  },

  // Unit 5: Prime Time
  math_u5_box1_primes: (d) => {
    const max = d === 'easy' ? 60 : d === 'intermediate' ? 120 : 220;
    const candidate = randInt(2, max);
    const isPrime = (() => {
      if (candidate < 2) return false;
      for (let i = 2; i * i <= candidate; i++) {
        if (candidate % i === 0) return false;
      }
      return true;
    })();
    return {
      id: `prime_${uid()}`,
      text: `Is ${candidate} a prime number?`,
      options: ['Yes', 'No'],
      correctAnswer: isPrime ? 'Yes' : 'No',
    };
  },
  math_u5_box2_factors: () => {
    const n = randInt(12, 60);
    const factor = randInt(2, 10);
    const correct = n % factor === 0 ? 'Yes' : 'No';
    return {
      id: `factor_${uid()}`,
      text: `Is ${factor} a factor of ${n}?`,
      options: ['Yes', 'No'],
      correctAnswer: correct,
    };
  },
  math_u5_box3_multiples: () => {
    const n = randInt(2, 12);
    const k = randInt(2, 12);
    const correct = n * k;
    return {
      id: `multiple_${uid()}`,
      text: `Which is a multiple of ${n}?`,
      options: makeNumericOptions(correct),
      correctAnswer: String(correct),
    };
  },

  // Unit 6: Perimeter and Area
  math_u6_box1_perimeter: () => {
    const l = randInt(3, 15);
    const b = randInt(3, 15);
    const p = 2 * (l + b);
    return {
      id: `peri_${uid()}`,
      text: `Rectangle length=${l}, breadth=${b}. Perimeter = ?`,
      options: makeNumericOptions(p),
      correctAnswer: String(p),
    };
  },
  math_u6_box2_area: () => {
    const l = randInt(3, 15);
    const b = randInt(3, 15);
    const a = l * b;
    return {
      id: `area_${uid()}`,
      text: `Rectangle length=${l}, breadth=${b}. Area = ?`,
      options: makeNumericOptions(a),
      correctAnswer: String(a),
    };
  },
  math_u6_box3_shape_area: () => {
    const b = randInt(4, 20);
    const h = randInt(4, 16);
    const a = (b * h) / 2;
    return {
      id: `tri_area_${uid()}`,
      text: `Triangle base=${b}, height=${h}. Area = ?`,
      options: makeNumericOptions(a),
      correctAnswer: String(a),
    };
  },

  // Unit 7: Fractions
  math_u7_box1_fraction_basics: () => {
    const den = randInt(2, 10);
    const num = randInt(1, den - 1);
    return {
      id: `frac_basic_${uid()}`,
      text: `In fraction ${num}/${den}, numerator is:`,
      options: makeOptions(String(num), [String(num), String(den), String(num + 1), String(den - 1)]),
      correctAnswer: String(num),
    };
  },
  math_u7_box2_fraction_line: () => {
    const den = randInt(2, 10);
    const num = randInt(1, den - 1);
    return {
      id: `frac_line_${uid()}`,
      text: `Which fraction lies between 0 and 1 on number line?`,
      options: makeOptions(`${num}/${den}`, [`${num}/${den}`, `${den}/${num}`, `${den + 1}/${den}`, `${num + den}/${den}`]),
      correctAnswer: `${num}/${den}`,
    };
  },
  math_u7_box3_fraction_ops: () => {
    const den = randInt(2, 9);
    const a = randInt(1, den - 1);
    const b = randInt(1, den - 1);
    const sumNum = a + b;
    return {
      id: `frac_ops_${uid()}`,
      text: `Find: ${a}/${den} + ${b}/${den}`,
      options: makeOptions(`${sumNum}/${den}`, [`${sumNum}/${den}`, `${Math.abs(a - b)}/${den}`, `${a + b}/${den + 1}`, `${a * b}/${den}`]),
      correctAnswer: `${sumNum}/${den}`,
    };
  },

  // Unit 8: Constructions
  math_u8_box1_square_rectangle: () => {
    const squareSide = randInt(3, 12);
    return {
      id: `cons_sq_${uid()}`,
      text: `A square has side ${squareSide}. Its perimeter is:`,
      options: makeNumericOptions(4 * squareSide),
      correctAnswer: String(4 * squareSide),
    };
  },
  math_u8_box2_diagonals: () => {
    const n = randInt(4, 60);
    const d = (n * (n - 3)) / 2;
    return {
      id: `diag_${uid()}`,
      text: `How many diagonals can be drawn in a polygon with ${n} sides?`,
      options: makeNumericOptions(d),
      correctAnswer: String(d),
    };
  },
  math_u8_box3_compass: () => {
    const r = randInt(2, 80);
    const mode = randInt(0, 2);
    const askRadius = mode === 0;
    const askDiameter = mode === 1;
    return {
      id: `comp_${uid()}`,
      text: askRadius
        ? `A circle has diameter ${2 * r}. What is its radius?`
        : askDiameter
        ? `A circle has radius ${r}. What is its diameter?`
        : `Diameter of a circle is ${2 * r}. Is radius ${r}?`,
      options: askRadius || askDiameter ? makeNumericOptions(askRadius ? r : 2 * r) : ['Yes', 'No'],
      correctAnswer: askRadius || askDiameter ? String(askRadius ? r : 2 * r) : 'Yes',
      hint: `Radius and diameter relation: d = 2 x r.`,
    };
  },

  // Unit 9: Symmetry
  math_u9_box1_line_symmetry: () => {
    const n = randInt(3, 80);
    return {
      id: `sym_line_${uid()}`,
      text: `A regular polygon has ${n} sides. Its lines of symmetry are:`,
      options: makeNumericOptions(n),
      correctAnswer: String(n),
    };
  },
  math_u9_box2_rotational_symmetry: () => {
    const n = randInt(3, 80);
    return {
      id: `sym_rot_${uid()}`,
      text: `Rotational symmetry order of a regular ${n}-gon is:`,
      options: makeNumericOptions(n),
      correctAnswer: String(n),
    };
  },
  math_u9_box3_symmetry_art: () => {
    const folds = randInt(1, 12);
    return {
      id: `sym_art_${uid()}`,
      text: `Paper is folded ${folds} times equally. Symmetric parts are:`,
      options: makeNumericOptions(folds * 2),
      correctAnswer: String(folds * 2),
    };
  },

  // Unit 10: Integers
  math_u10_box1_integer_basics: (d) => {
    const [min, max] = d === 'easy' ? [-10, 20] : [-50, 70];
    const n = randInt(min, max);
    const ans = n > 0 ? 'Positive' : n < 0 ? 'Negative' : 'Zero';
    return {
      id: `int_basic_${uid()}`,
      text: `Classify the integer ${n}:`,
      options: ['Positive', 'Negative', 'Zero'],
      correctAnswer: ans,
    };
  },
  math_u10_box2_integer_line: () => {
    const a = randInt(-25, 10);
    const b = a + randInt(2, 18);
    return {
      id: `int_line_${uid()}`,
      text: `Distance between integers ${a} and ${b} is:`,
      options: makeNumericOptions(Math.abs(b - a)),
      correctAnswer: String(Math.abs(b - a)),
    };
  },
  math_u10_box3_integer_ops: () => {
    const a = randInt(-20, 20);
    const b = randInt(-20, 20);
    const op = randInt(0, 1) === 0 ? '+' : '-';
    const ans = op === '+' ? a + b : a - b;
    return {
      id: `int_ops_${uid()}`,
      text: `Solve: (${a}) ${op} (${b})`,
      options: makeNumericOptions(ans),
      correctAnswer: String(ans),
    };
  },
};

export const MATHS_BOX_GENERATORS: Record<string, GenFn> = G;
