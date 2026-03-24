/**
 * games/curriculum/mathsGenerators.ts — Parameterised Maths generators
 * ═════════════════════════════════════════════════════════════════════
 * Each generator accepts GeneratorParams and returns CurriculumQuestion.
 * Parameterised ranges ensure 300-500+ unique variations per chapter.
 *
 * ⚠ Complements engine/questionGenerator.ts — does NOT replace it.
 */

import type { CurriculumQuestion, GeneratorParams } from './curriculumTypes';
import { uid, pick, pickN, shuffle, randInt } from './curriculumTypes';

// ── Signature helper (DJB2 hash) ──────────────────────────

function sig(parts: (string | number)[]): string {
  const s = parts.join('|');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `m_${(h >>> 0).toString(36)}`;
}

function distractors(correct: number, p: GeneratorParams): string[] {
  const ds = p.distractorStrength;
  const spread = Math.max(2, Math.round((1 + ds * 6)));
  const out: string[] = [];
  let tries = 0;
  while (out.length < p.optionCount - 1 && tries < 40) {
    tries++;
    const offset = randInt(-spread, spread);
    if (offset === 0) continue;
    const w = String(correct + offset);
    if (w !== String(correct) && !out.includes(w) && correct + offset >= 0) out.push(w);
  }
  return out;
}

// ── Word banks for story problems ─────────────────────────

const OBJECTS = [
  { name: 'apples', emoji: '🍎' }, { name: 'bananas', emoji: '🍌' },
  { name: 'oranges', emoji: '🍊' }, { name: 'stars', emoji: '⭐' },
  { name: 'candies', emoji: '🍬' }, { name: 'balls', emoji: '⚽' },
  { name: 'flowers', emoji: '🌸' }, { name: 'birds', emoji: '🐦' },
  { name: 'books', emoji: '📚' }, { name: 'fish', emoji: '🐟' },
  { name: 'pencils', emoji: '✏️' }, { name: 'hearts', emoji: '❤️' },
  { name: 'cookies', emoji: '🍪' }, { name: 'marbles', emoji: '🔵' },
  { name: 'crayons', emoji: '🖍️' }, { name: 'stickers', emoji: '⭐' },
  { name: 'buttons', emoji: '🔘' }, { name: 'cupcakes', emoji: '🧁' },
  { name: 'leaves', emoji: '🍃' }, { name: 'shells', emoji: '🐚' },
];

const NAMES = [
  'Aarav', 'Diya', 'Rohan', 'Priya', 'Arjun', 'Meera', 'Vivaan', 'Ananya',
  'Kabir', 'Saanvi', 'Ishaan', 'Aisha', 'Reyansh', 'Zara', 'Advait', 'Myra',
  'Vihaan', 'Nisha', 'Atharv', 'Tara', 'Dev', 'Riya', 'Neil', 'Siya',
];

const SHAPES_2D = [
  { name: 'Circle', emoji: '⚫', sides: 0, corners: 0 },
  { name: 'Square', emoji: '⬛', sides: 4, corners: 4 },
  { name: 'Triangle', emoji: '🔺', sides: 3, corners: 3 },
  { name: 'Rectangle', emoji: '🟩', sides: 4, corners: 4 },
  { name: 'Diamond', emoji: '🔷', sides: 4, corners: 4 },
  { name: 'Oval', emoji: '🥚', sides: 0, corners: 0 },
  { name: 'Pentagon', emoji: '⬠', sides: 5, corners: 5 },
  { name: 'Hexagon', emoji: '⬡', sides: 6, corners: 6 },
  { name: 'Star', emoji: '⭐', sides: 10, corners: 5 },
  { name: 'Heart', emoji: '❤️', sides: 0, corners: 1 },
];

const SHAPES_3D = [
  { name: 'Cube', emoji: '🧊', faces: 6 },
  { name: 'Sphere', emoji: '🔮', faces: 0 },
  { name: 'Cylinder', emoji: '🥫', faces: 3 },
  { name: 'Cone', emoji: '🍦', faces: 2 },
  { name: 'Pyramid', emoji: '🔺', faces: 5 },
];

const PAT_EMOJIS = ['🔴', '🔵', '🟢', '🟡', '🟣', '⬛', '⚪', '🟠', '🟤', '🩷'];

const DAILY_EVENTS = [
  { event: 'Wake up', time: 7 }, { event: 'Brush teeth', time: 7 },
  { event: 'Eat breakfast', time: 8 }, { event: 'Go to school', time: 9 },
  { event: 'Lunch', time: 12 }, { event: 'Play outside', time: 16 },
  { event: 'Dinner', time: 19 }, { event: 'Go to bed', time: 21 },
];

const COIN_VALUES = [1, 2, 5, 10];
const NOTE_VALUES = [10, 20, 50, 100];

const WEIGHT_PAIRS: [string, string][] = [
  ['Elephant 🐘', 'Cat 🐱'], ['Horse 🐴', 'Chicken 🐔'], ['Bear 🐻', 'Rabbit 🐰'],
  ['Cow 🐄', 'Dog 🐕'], ['Lion 🦁', 'Mouse 🐭'], ['Whale 🐋', 'Fish 🐟'],
  ['Giraffe 🦒', 'Hen 🐔'], ['Tiger 🐯', 'Frog 🐸'], ['Hippo 🦛', 'Bird 🐦'],
  ['Rhino 🦏', 'Duck 🦆'], ['Gorilla 🦍', 'Ant 🐜'], ['Camel 🐫', 'Snake 🐍'],
  ['Panda 🐼', 'Snail 🐌'], ['Bison 🦬', 'Parrot 🦜'], ['Shark 🦈', 'Shrimp 🦐'],
  ['Buffalo 🐃', 'Squirrel 🐿️'], ['Moose 🫎', 'Hamster 🐹'], ['Seal 🦭', 'Crab 🦀'],
  ['Ox 🐂', 'Chick 🐤'], ['Yak 🐃', 'Bee 🐝'], ['Wolf 🐺', 'Lizard 🦎'],
  ['Zebra 🦓', 'Kitten 🐱'], ['Deer 🦌', 'Rat 🐀'], ['Pig 🐷', 'Butterfly 🦋'],
  ['Donkey 🫏', 'Sparrow 🐦'],
];

// ═══════════════════════════════════════════════════════════
// CHAPTER 1 — NUMBERS 1–100
// ═══════════════════════════════════════════════════════════

function genCountMatch(p: GeneratorParams): CurriculumQuestion {
  const obj = pick(OBJECTS);
  const count = randInt(1, Math.min(p.numRange[1], 12));
  const display = Array(count).fill(obj.emoji).join(' ');
  const correct = String(count);
  const dist = distractors(count, p);
  return {
    id: uid(), chapter: 'numbers', gameType: 'count_match',
    signature: sig(['count_match', obj.name, count]),
    text: `Count the ${obj.name}:\n${display}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Point and count each ${obj.emoji} one by one.`,
  };
}

function genNumberOrder(p: GeneratorParams): CurriculumQuestion {
  const num = randInt(p.numRange[0], p.numRange[1] - 1);
  const dir = p.difficulty === 'easy' ? 'after' : pick(['before', 'after'] as const);
  const correct = dir === 'after' ? String(num + 1) : String(num - 1 < 1 ? 1 : num - 1);
  const base = dir === 'after' ? num + 1 : Math.max(1, num - 1);
  const dist = distractors(base, p);
  const qText = dir === 'after'
    ? `What number comes after ${num}?`
    : `What number comes before ${num}?`;
  return {
    id: uid(), chapter: 'numbers', gameType: 'number_order',
    signature: sig(['number_order', dir, num]),
    text: qText, options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genCompareNumbers(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(p.numRange[0], p.numRange[1]);
  let b = randInt(p.numRange[0], p.numRange[1]);
  while (b === a) b = randInt(p.numRange[0], p.numRange[1]);
  const dir = pick(['bigger', 'smaller'] as const);
  const correct = dir === 'bigger' ? String(Math.max(a, b)) : String(Math.min(a, b));
  return {
    id: uid(), chapter: 'numbers', gameType: 'compare_numbers',
    signature: sig(['compare', dir, a, b]),
    text: `Which number is ${dir}?\n${a}   or   ${b}`,
    options: shuffle([String(a), String(b)]), correctAnswer: correct,
  };
}

function genMissingNumber(p: GeneratorParams): CurriculumQuestion {
  const start = randInt(p.numRange[0], Math.max(p.numRange[0], p.numRange[1] - 5));
  const step = p.difficulty === 'easy' ? 1 : pick([1, 2, 5]);
  const len = p.difficulty === 'easy' ? 5 : p.difficulty === 'intermediate' ? 6 : 7;
  const seq: (number | string)[] = [];
  let missing = 0;
  const missingIdx = randInt(1, len - 2);
  for (let i = 0; i < len; i++) {
    const val = start + i * step;
    if (i === missingIdx) { seq.push('___'); missing = val; } else seq.push(val);
  }
  const correct = String(missing);
  const dist = distractors(missing, p);
  return {
    id: uid(), chapter: 'numbers', gameType: 'missing_number',
    signature: sig(['missing_num', start, step, missingIdx]),
    text: `Find the missing number:\n${seq.join(', ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Count by ${step}s from ${start}.`,
  };
}

function genNumberName(p: GeneratorParams): CurriculumQuestion {
  const NAMES_MAP: Record<number, string> = {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
    6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
    11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
    16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
  };
  const TENS: Record<number, string> = {
    20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty',
    60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred',
  };

  function toWord(n: number): string {
    if (NAMES_MAP[n]) return NAMES_MAP[n];
    if (TENS[n]) return TENS[n];
    const tens = Math.floor(n / 10) * 10;
    const ones = n % 10;
    return `${TENS[tens]}-${NAMES_MAP[ones]}`;
  }

  const num = randInt(p.numRange[0], Math.min(p.numRange[1], 100));
  const isNumToWord = randInt(0, 1) === 0;
  if (isNumToWord) {
    const correct = toWord(num);
    const wrongNums = new Set<number>();
    while (wrongNums.size < p.optionCount - 1) {
      const w = randInt(p.numRange[0], Math.min(p.numRange[1], 100));
      if (w !== num) wrongNums.add(w);
    }
    return {
      id: uid(), chapter: 'numbers', gameType: 'number_name',
      signature: sig(['num_name', num, 'ntw']),
      text: `What is the name of ${num}?`,
      options: shuffle([correct, ...[...wrongNums].map(toWord)]),
      correctAnswer: correct,
    };
  }
  const correct = String(num);
  const dist = distractors(num, p);
  return {
    id: uid(), chapter: 'numbers', gameType: 'number_name',
    signature: sig(['num_name', num, 'wtn']),
    text: `Which number is "${toWord(num)}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genNumberLine(p: GeneratorParams): CurriculumQuestion {
  const start = randInt(p.numRange[0], Math.max(p.numRange[0], p.numRange[1] - 10));
  const step = p.difficulty === 'easy' ? 1 : pick([1, 2, 5]);
  const len = 6;
  const blankIdx = randInt(1, len - 2);
  const nums: string[] = [];
  let answer = 0;
  for (let i = 0; i < len; i++) {
    const v = start + i * step;
    if (i === blankIdx) { nums.push('?'); answer = v; } else nums.push(String(v));
  }
  const correct = String(answer);
  const dist = distractors(answer, p);
  return {
    id: uid(), chapter: 'numbers', gameType: 'number_line',
    signature: sig(['num_line', start, step, blankIdx]),
    text: `Number line: ${nums.join(' — ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 2 — ADDITION
// ═══════════════════════════════════════════════════════════

function genAddingApples(p: GeneratorParams): CurriculumQuestion {
  const half = Math.floor(p.numRange[1] / 2);
  const a = randInt(1, half);
  const b = randInt(1, half);
  const sum = a + b;
  const obj = pick(OBJECTS);
  const correct = String(sum);
  const dist = distractors(sum, p);
  return {
    id: uid(), chapter: 'addition', gameType: 'adding_apples',
    signature: sig(['add', a, b, obj.name]),
    text: `${obj.emoji} ${a} + ${b} = ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Start at ${a} and count ${b} more.`,
  };
}

function genMatchSum(p: GeneratorParams): CurriculumQuestion {
  const half = Math.floor(p.numRange[1] / 2);
  const a = randInt(1, half);
  const b = randInt(1, half);
  const sum = a + b;
  const correct = `${a} + ${b}`;
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 30) {
    tries++;
    const wa = randInt(1, half);
    const wb = randInt(1, half);
    if (wa + wb !== sum) {
      const expr = `${wa} + ${wb}`;
      if (!wrongs.includes(expr)) wrongs.push(expr);
    }
  }
  return {
    id: uid(), chapter: 'addition', gameType: 'match_sum',
    signature: sig(['match_sum', sum, a, b]),
    text: `Which equals ${sum}?`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genAddMissing(p: GeneratorParams): CurriculumQuestion {
  const half = Math.floor(p.numRange[1] / 2);
  const a = randInt(1, half);
  const b = randInt(1, half);
  const sum = a + b;
  const hideSide = randInt(0, 1); // 0 = hide left, 1 = hide right
  const correct = hideSide === 0 ? String(a) : String(b);
  const missing = hideSide === 0 ? a : b;
  const text = hideSide === 0 ? `___ + ${b} = ${sum}` : `${a} + ___ = ${sum}`;
  const dist = distractors(missing, p);
  return {
    id: uid(), chapter: 'addition', gameType: 'add_missing',
    signature: sig(['add_miss', a, b, hideSide]),
    text: `Find the missing number:\n${text}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Think: what plus ${hideSide === 0 ? b : a} makes ${sum}?`,
  };
}

function genAddStory(p: GeneratorParams): CurriculumQuestion {
  const half = Math.floor(p.numRange[1] / 2);
  const a = randInt(1, half);
  const b = randInt(1, half);
  const sum = a + b;
  const name = pick(NAMES);
  const obj = pick(OBJECTS);
  const templates = [
    `${name} has ${a} ${obj.name}. ${pick(NAMES)} gives ${b} more. How many ${obj.name} now?`,
    `There are ${a} ${obj.emoji} on a table. ${name} puts ${b} more. Total ${obj.name}?`,
    `${name} picked ${a} ${obj.name} in the morning and ${b} in the evening. Total?`,
  ];
  const correct = String(sum);
  const dist = distractors(sum, p);
  return {
    id: uid(), chapter: 'addition', gameType: 'add_story',
    signature: sig(['add_story', a, b, name, obj.name]),
    text: pick(templates), options: shuffle([correct, ...dist]),
    correctAnswer: correct, hint: `Add ${a} and ${b} together.`,
  };
}

function genAddVisual(p: GeneratorParams): CurriculumQuestion {
  const half = Math.min(6, Math.floor(p.numRange[1] / 2));
  const a = randInt(1, half);
  const b = randInt(1, half);
  const sum = a + b;
  const obj = pick(OBJECTS);
  const groupA = Array(a).fill(obj.emoji).join(' ');
  const groupB = Array(b).fill(obj.emoji).join(' ');
  const correct = String(sum);
  const dist = distractors(sum, p);
  return {
    id: uid(), chapter: 'addition', gameType: 'add_visual',
    signature: sig(['add_vis', a, b, obj.name]),
    text: `Count all ${obj.name}:\n${groupA}  +  ${groupB}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genAddDoubles(p: GeneratorParams): CurriculumQuestion {
  const maxD = Math.min(Math.floor(p.numRange[1] / 2), 20);
  const n = randInt(1, maxD);
  const sum = n + n;
  const correct = String(sum);
  const dist = distractors(sum, p);
  return {
    id: uid(), chapter: 'addition', gameType: 'add_doubles',
    signature: sig(['add_dbl', n]),
    text: `Doubles! ${n} + ${n} = ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Double means the same number added twice.`,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 3 — SUBTRACTION
// ═══════════════════════════════════════════════════════════

function genTakeAway(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(2, p.numRange[1]);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const obj = pick(OBJECTS);
  const correct = String(diff);
  const dist = distractors(diff, p);
  return {
    id: uid(), chapter: 'subtraction', gameType: 'take_away',
    signature: sig(['sub', a, b, obj.name]),
    text: `${obj.emoji} ${a} − ${b} = ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Start at ${a} and count back ${b}.`,
  };
}

function genSubMissing(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(2, p.numRange[1]);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const hideSide = randInt(0, 1);
  const correct = hideSide === 0 ? String(a) : String(b);
  const missing = hideSide === 0 ? a : b;
  const text = hideSide === 0 ? `___ − ${b} = ${diff}` : `${a} − ___ = ${diff}`;
  const dist = distractors(missing, p);
  return {
    id: uid(), chapter: 'subtraction', gameType: 'sub_missing',
    signature: sig(['sub_miss', a, b, hideSide]),
    text: `Find the missing number:\n${text}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genSubStory(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(3, p.numRange[1]);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const name = pick(NAMES);
  const obj = pick(OBJECTS);
  const templates = [
    `${name} had ${a} ${obj.name}. ${b} fell down. How many left?`,
    `There were ${a} ${obj.emoji} in a jar. ${name} took ${b}. How many remain?`,
    `${name} had ${a} ${obj.name} and gave away ${b}. How many now?`,
  ];
  const correct = String(diff);
  const dist = distractors(diff, p);
  return {
    id: uid(), chapter: 'subtraction', gameType: 'sub_story',
    signature: sig(['sub_story', a, b, name, obj.name]),
    text: pick(templates), options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genSubVisual(p: GeneratorParams): CurriculumQuestion {
  const maxV = Math.min(10, p.numRange[1]);
  const a = randInt(2, maxV);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const obj = pick(OBJECTS);
  const full = Array(a).fill(obj.emoji).join(' ');
  const crossed = Array(b).fill('❌').join(' ');
  const correct = String(diff);
  const dist = distractors(diff, p);
  return {
    id: uid(), chapter: 'subtraction', gameType: 'sub_visual',
    signature: sig(['sub_vis', a, b, obj.name]),
    text: `${full}\nCross out ${b}: ${crossed}\nHow many ${obj.name} left?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genSubCompare(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(1, p.numRange[1]);
  let b = randInt(1, p.numRange[1]);
  while (b === a) b = randInt(1, p.numRange[1]);
  const diff = Math.abs(a - b);
  const objA = pick(OBJECTS);
  let objB = pick(OBJECTS);
  while (objB.name === objA.name) objB = pick(OBJECTS);
  const correct = String(diff);
  const dist = distractors(diff, p);
  return {
    id: uid(), chapter: 'subtraction', gameType: 'sub_compare',
    signature: sig(['sub_cmp', a, b, objA.name]),
    text: `${objA.emoji} ${a} ${objA.name} vs ${objB.emoji} ${b} ${objB.name}\nWhat is the difference?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 4 — SHAPES
// ═══════════════════════════════════════════════════════════

function genNameShape(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? SHAPES_2D.slice(0, 4)
    : p.difficulty === 'intermediate' ? SHAPES_2D.slice(0, 7)
    : [...SHAPES_2D, ...SHAPES_3D.map(s => ({ ...s, sides: 0, corners: 0 }))];
  const shape = pick(pool);
  const dist = pickN(pool.filter(s => s.name !== shape.name).map(s => s.name), p.optionCount - 1);
  return {
    id: uid(), chapter: 'shapes', gameType: 'name_shape',
    signature: sig(['name_shape', shape.name]),
    text: `What shape is this? ${shape.emoji}`,
    options: shuffle([shape.name, ...dist]), correctAnswer: shape.name,
  };
}

function genCountShapes(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? SHAPES_2D.slice(0, 4) : SHAPES_2D.slice(0, 6);
  const target = pick(pool);
  const total = p.difficulty === 'easy' ? randInt(3, 6) : p.difficulty === 'intermediate' ? randInt(5, 9) : randInt(7, 12);
  const targetCount = randInt(1, Math.min(total - 1, 6));
  const others = pool.filter(s => s.name !== target.name);
  const items: string[] = [];
  for (let i = 0; i < targetCount; i++) items.push(target.emoji);
  for (let i = 0; i < total - targetCount; i++) items.push(pick(others).emoji);
  const correct = String(targetCount);
  const dist = distractors(targetCount, p);
  return {
    id: uid(), chapter: 'shapes', gameType: 'count_shapes',
    signature: sig(['count_shapes', target.name, targetCount, total]),
    text: `How many ${target.emoji} (${target.name})?\n${shuffle(items).join(' ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genShapeProperties(p: GeneratorParams): CurriculumQuestion {
  const pool = SHAPES_2D.filter(s => s.sides > 0);
  const shape = pick(pool);
  const prop = pick(['sides', 'corners'] as const);
  const correct = String(shape[prop]);
  const dist = distractors(shape[prop], p);
  return {
    id: uid(), chapter: 'shapes', gameType: 'shape_properties',
    signature: sig(['shape_prop', shape.name, prop]),
    text: `How many ${prop} does a ${shape.name} ${shape.emoji} have?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Count each ${prop === 'sides' ? 'straight line' : 'pointy corner'}.`,
  };
}

function genShapeMatch(p: GeneratorParams): CurriculumQuestion {
  const REAL_WORLD: Record<string, string[]> = {
    Circle: ['wheel', 'clock face', 'plate', 'coin', 'ball'],
    Square: ['window', 'tile', 'napkin', 'dice face', 'stamp'],
    Triangle: ['pizza slice', 'roof', 'sandwich half', 'mountain', 'arrow tip'],
    Rectangle: ['door', 'book', 'phone', 'table top', 'billboard'],
    Oval: ['egg', 'mirror', 'leaf', 'face', 'watermelon'],
    Star: ['star sticker', 'sheriff badge', 'starfish', 'star fruit'],
  };
  const shapes = Object.keys(REAL_WORLD);
  const shapeName = pick(shapes);
  const item = pick(REAL_WORLD[shapeName]);
  const correct = shapeName;
  const dist = pickN(shapes.filter(s => s !== shapeName), p.optionCount - 1);
  return {
    id: uid(), chapter: 'shapes', gameType: 'shape_match',
    signature: sig(['shape_match', shapeName, item]),
    text: `A "${item}" looks like which shape?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genShapeSort(p: GeneratorParams): CurriculumQuestion {
  const has = pick(['sides', 'curves'] as const);
  if (has === 'curves') {
    const correct = pick(['Circle', 'Oval']);
    const others = ['Square', 'Triangle', 'Rectangle', 'Pentagon'].slice(0, p.optionCount - 1);
    return {
      id: uid(), chapter: 'shapes', gameType: 'shape_sort',
      signature: sig(['shape_sort', 'curves', correct]),
      text: `Which shape has curves (no straight sides)?`,
      options: shuffle([correct, ...others]), correctAnswer: correct,
    };
  }
  const n = pick([3, 4, 5, 6]);
  const shape = SHAPES_2D.find(s => s.sides === n)!;
  const correct = shape.name;
  const others = pickN(SHAPES_2D.filter(s => s.sides !== n).map(s => s.name), p.optionCount - 1);
  return {
    id: uid(), chapter: 'shapes', gameType: 'shape_sort',
    signature: sig(['shape_sort', 'sides', n]),
    text: `Which shape has exactly ${n} sides?`,
    options: shuffle([correct, ...others]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 5 — PATTERNS
// ═══════════════════════════════════════════════════════════

function genContinuePattern(p: GeneratorParams): CurriculumQuestion {
  const patLen = p.difficulty === 'easy' ? 2 : p.difficulty === 'intermediate' ? 3 : 4;
  const items = pickN(PAT_EMOJIS, patLen);
  const reps = 3;
  const full = Array(reps).fill(items).flat();
  const showLen = patLen * 2 + (patLen - 1);
  const display = full.slice(0, showLen).join(' ');
  const nextIdx = showLen % patLen;
  const correct = items[nextIdx];
  const dist = pickN(PAT_EMOJIS.filter(i => i !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'patterns', gameType: 'continue_pattern',
    signature: sig(['pat_cont', ...items, showLen]),
    text: `What comes next?\n${display}  ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genPatternRule(p: GeneratorParams): CurriculumQuestion {
  const patLen = p.difficulty === 'easy' ? 2 : 3;
  const items = pickN(PAT_EMOJIS, patLen);
  const pattern = items.join(' ');
  const full = Array(3).fill(items).flat().join(' ');
  const correct = pattern;
  // Generate wrong pattern units
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wrong = pickN(PAT_EMOJIS, patLen).join(' ');
    if (wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong);
  }
  return {
    id: uid(), chapter: 'patterns', gameType: 'pattern_rule',
    signature: sig(['pat_rule', ...items]),
    text: `What is the repeating unit?\n${full}`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genPatternCreate(p: GeneratorParams): CurriculumQuestion {
  // "Which of these is a valid pattern?"
  const patLen = p.difficulty === 'easy' ? 2 : 3;
  const items = pickN(PAT_EMOJIS, patLen);
  const correct = Array(3).fill(items).flat().join(' ');
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const randomSeq = Array.from({ length: patLen * 3 }, () => pick(PAT_EMOJIS)).join(' ');
    // Make sure it's NOT a valid repeating pattern
    if (randomSeq !== correct && !wrongs.includes(randomSeq)) wrongs.push(randomSeq);
  }
  return {
    id: uid(), chapter: 'patterns', gameType: 'pattern_create',
    signature: sig(['pat_create', ...items]),
    text: 'Which is a repeating pattern?',
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genNumberPattern(p: GeneratorParams): CurriculumQuestion {
  const step = p.difficulty === 'easy' ? pick([1, 2]) : p.difficulty === 'intermediate' ? pick([2, 3, 5]) : pick([3, 4, 5, 10]);
  const start = randInt(p.numRange[0], Math.max(1, p.numRange[1] - step * 6));
  const len = 6;
  const blankIdx = randInt(2, len - 2);
  const seq: string[] = [];
  let answer = 0;
  for (let i = 0; i < len; i++) {
    const v = start + i * step;
    if (i === blankIdx) { seq.push('___'); answer = v; } else seq.push(String(v));
  }
  const correct = String(answer);
  const dist = distractors(answer, p);
  return {
    id: uid(), chapter: 'patterns', gameType: 'number_pattern',
    signature: sig(['num_pat', start, step, blankIdx]),
    text: `Find the missing number:\n${seq.join(', ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Numbers increase by ${step} each time.`,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 6 — MEASUREMENT
// ═══════════════════════════════════════════════════════════

function genCompareLengths(p: GeneratorParams): CurriculumQuestion {
  const a = randInt(1, p.numRange[1]);
  let b = randInt(1, p.numRange[1]);
  while (b === a) b = randInt(1, p.numRange[1]);
  const unit = p.difficulty === 'easy' ? 'cm' : pick(['cm', 'm']);
  const longerVal = Math.max(a, b);
  const correct = `${longerVal} ${unit}`;
  return {
    id: uid(), chapter: 'measurement', gameType: 'compare_lengths',
    signature: sig(['cmp_len', a, b, unit]),
    text: `Which is longer?\nA: ${a} ${unit}    B: ${b} ${unit}`,
    options: shuffle([`${a} ${unit}`, `${b} ${unit}`]), correctAnswer: correct,
  };
}

function genCompareWeights(p: GeneratorParams): CurriculumQuestion {
  const pair = pick(WEIGHT_PAIRS);
  const dir = pick(['heavier', 'lighter'] as const);
  const correct = dir === 'heavier' ? pair[0] : pair[1];
  return {
    id: uid(), chapter: 'measurement', gameType: 'compare_weights',
    signature: sig(['cmp_wt', pair[0], pair[1], dir]),
    text: `Which is ${dir}?`,
    options: shuffle([pair[0], pair[1]]), correctAnswer: correct,
  };
}

function genMeasureMatch(p: GeneratorParams): CurriculumQuestion {
  const ITEMS: { item: string; size: string }[] = [
    { item: 'Ant 🐜', size: 'Very tiny' }, { item: 'Cat 🐱', size: 'Small' },
    { item: 'Dog 🐕', size: 'Medium' }, { item: 'Horse 🐴', size: 'Big' },
    { item: 'Elephant 🐘', size: 'Very big' }, { item: 'Whale 🐋', size: 'Huge' },
    { item: 'Mouse 🐭', size: 'Very tiny' }, { item: 'Rabbit 🐰', size: 'Small' },
    { item: 'Cow 🐄', size: 'Big' }, { item: 'Giraffe 🦒', size: 'Very big' },
    { item: 'Spider 🕷️', size: 'Very tiny' }, { item: 'Frog 🐸', size: 'Small' },
    { item: 'Pig 🐷', size: 'Medium' }, { item: 'Bear 🐻', size: 'Big' },
    { item: 'Pencil ✏️', size: 'Small' }, { item: 'Book 📚', size: 'Small' },
    { item: 'Table', size: 'Big' }, { item: 'House 🏠', size: 'Very big' },
    { item: 'Bus 🚌', size: 'Very big' }, { item: 'Bicycle 🚲', size: 'Medium' },
  ];
  const it = pick(ITEMS);
  const correct = it.size;
  const sizes = ['Very tiny', 'Small', 'Medium', 'Big', 'Very big', 'Huge'];
  const dist = pickN(sizes.filter(s => s !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'measurement', gameType: 'measure_match',
    signature: sig(['meas_match', it.item]),
    text: `How big is a ${it.item}?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genLengthEstimate(p: GeneratorParams): CurriculumQuestion {
  const ESTIMATES: { item: string; approx: string; unit: string }[] = [
    { item: 'eraser', approx: '5 cm', unit: 'cm' },
    { item: 'pencil', approx: '15 cm', unit: 'cm' },
    { item: 'school desk', approx: '1 m', unit: 'm' },
    { item: 'your hand span', approx: '15 cm', unit: 'cm' },
    { item: 'classroom door', approx: '2 m', unit: 'm' },
    { item: 'notebook', approx: '25 cm', unit: 'cm' },
    { item: 'lunch box', approx: '20 cm', unit: 'cm' },
    { item: 'shoe', approx: '20 cm', unit: 'cm' },
    { item: 'bed', approx: '2 m', unit: 'm' },
    { item: 'cricket bat', approx: '80 cm', unit: 'cm' },
  ];
  const est = pick(ESTIMATES);
  const correct = est.approx;
  const wrongVals = [
    `1 ${est.unit}`, `3 ${est.unit}`, `10 ${est.unit}`,
    `50 ${est.unit}`, `100 ${est.unit}`, `200 ${est.unit}`,
  ].filter(w => w !== correct);
  const dist = pickN(wrongVals, p.optionCount - 1);
  return {
    id: uid(), chapter: 'measurement', gameType: 'length_estimate',
    signature: sig(['len_est', est.item]),
    text: `About how long is a ${est.item}?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genCapacityCompare(p: GeneratorParams): CurriculumQuestion {
  const CONTAINERS: { name: string; size: number }[] = [
    { name: 'Spoon 🥄', size: 1 }, { name: 'Cup ☕', size: 2 },
    { name: 'Glass 🥛', size: 3 }, { name: 'Bottle 🍶', size: 4 },
    { name: 'Jug 🫗', size: 5 }, { name: 'Bucket 🪣', size: 6 },
    { name: 'Bathtub 🛁', size: 7 }, { name: 'Swimming pool 🏊', size: 8 },
  ];
  const a = pick(CONTAINERS);
  let b = pick(CONTAINERS);
  while (b.name === a.name) b = pick(CONTAINERS);
  const dir = pick(['more', 'less'] as const);
  const correct = dir === 'more'
    ? (a.size > b.size ? a.name : b.name)
    : (a.size < b.size ? a.name : b.name);
  return {
    id: uid(), chapter: 'measurement', gameType: 'capacity_compare',
    signature: sig(['cap_cmp', a.name, b.name, dir]),
    text: `Which holds ${dir} water?\n${a.name}  or  ${b.name}`,
    options: shuffle([a.name, b.name]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 7 — TIME
// ═══════════════════════════════════════════════════════════

function genReadClock(p: GeneratorParams): CurriculumQuestion {
  let hour: number, minute: number;
  if (p.difficulty === 'easy') { hour = randInt(1, 12); minute = 0; }
  else if (p.difficulty === 'intermediate') { hour = randInt(1, 12); minute = pick([0, 30]); }
  else { hour = randInt(1, 12); minute = pick([0, 15, 30, 45]); }
  const timeStr = minute === 0 ? `${hour} o'clock`
    : minute === 30 ? `half past ${hour}`
    : minute === 15 ? `quarter past ${hour}`
    : `quarter to ${hour + 1 > 12 ? 1 : hour + 1}`;
  const display = `${hour}:${minute < 10 ? '0' + minute : minute}`;
  const correct = timeStr;
  const dist: string[] = [];
  let tries = 0;
  while (dist.length < p.optionCount - 1 && tries < 30) {
    tries++;
    const wh = randInt(1, 12);
    const wm = p.difficulty === 'easy' ? 0 : pick([0, 15, 30, 45]);
    const wStr = wm === 0 ? `${wh} o'clock`
      : wm === 30 ? `half past ${wh}`
      : wm === 15 ? `quarter past ${wh}`
      : `quarter to ${wh + 1 > 12 ? 1 : wh + 1}`;
    if (wStr !== correct && !dist.includes(wStr)) dist.push(wStr);
  }
  return {
    id: uid(), chapter: 'time', gameType: 'read_clock',
    signature: sig(['clock', hour, minute]),
    text: `🕐 The clock shows ${display}. What time is it?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genTimeOrder(p: GeneratorParams): CurriculumQuestion {
  const count = p.difficulty === 'easy' ? 3 : 4;
  const selected = pickN(DAILY_EVENTS, count);
  selected.sort((a, b) => a.time - b.time);
  const correctOrder = selected.map(e => e.event).join(' → ');
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const jumbled = shuffle(selected).map(e => e.event).join(' → ');
    if (jumbled !== correctOrder && !wrongs.includes(jumbled)) wrongs.push(jumbled);
  }
  return {
    id: uid(), chapter: 'time', gameType: 'time_order',
    signature: sig(['time_order', ...selected.map(e => e.event)]),
    text: 'Put these events in the right order:',
    options: shuffle([correctOrder, ...wrongs]), correctAnswer: correctOrder,
  };
}

function genTimeMatch(p: GeneratorParams): CurriculumQuestion {
  const PERIODS = [
    { label: 'Morning ☀️', hours: [6, 7, 8, 9, 10, 11] },
    { label: 'Afternoon 🌤️', hours: [12, 1, 2, 3, 4] },
    { label: 'Evening 🌅', hours: [5, 6, 7] },
    { label: 'Night 🌙', hours: [8, 9, 10, 11] },
  ];
  const period = pick(PERIODS);
  const hour = pick(period.hours);
  const correct = period.label;
  const dist = PERIODS.filter(pp => pp.label !== correct).map(pp => pp.label).slice(0, p.optionCount - 1);
  return {
    id: uid(), chapter: 'time', gameType: 'time_match',
    signature: sig(['time_match', hour, period.label]),
    text: `${hour} o'clock is in the…`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genDailyEvents(p: GeneratorParams): CurriculumQuestion {
  const e = pick(DAILY_EVENTS);
  const correct = `About ${e.time > 12 ? e.time - 12 : e.time} ${e.time >= 12 ? 'PM' : 'AM'}`;
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wh = randInt(1, 12);
    const wPeriod = pick(['AM', 'PM']);
    const w = `About ${wh} ${wPeriod}`;
    if (w !== correct && !wrongs.includes(w)) wrongs.push(w);
  }
  return {
    id: uid(), chapter: 'time', gameType: 'daily_events',
    signature: sig(['daily', e.event, e.time]),
    text: `When do you usually "${e.event}"?`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 8 — MONEY
// ═══════════════════════════════════════════════════════════

function genCountCoins(p: GeneratorParams): CurriculumQuestion {
  const coins = p.difficulty === 'easy' ? [1, 1, 2, 2, 5]
    : p.difficulty === 'intermediate' ? [1, 2, 5, 5, 10]
    : [1, 2, 5, 10, 10, 20];
  const count = p.difficulty === 'easy' ? randInt(2, 3) : p.difficulty === 'intermediate' ? randInt(2, 4) : randInt(3, 5);
  const selected = pickN(coins, count);
  const total = selected.reduce((a, b) => a + b, 0);
  const display = selected.map(c => `₹${c}`).join(' + ');
  const correct = `₹${total}`;
  const dist: string[] = [];
  let tries = 0;
  while (dist.length < p.optionCount - 1 && tries < 30) {
    tries++;
    const w = `₹${randInt(Math.max(1, total - 5), total + 8)}`;
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'money', gameType: 'count_coins',
    signature: sig(['coins', ...selected]),
    text: `Count the coins:\n${display} = ?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genMoneyMatch(p: GeneratorParams): CurriculumQuestion {
  const amount = p.difficulty === 'easy' ? pick([1, 2, 5])
    : p.difficulty === 'intermediate' ? pick([5, 10, 15, 20])
    : pick([10, 20, 25, 50]);
  const COMBOS: Record<number, string> = {
    1: '₹1 coin', 2: '₹2 coin', 5: '₹5 coin', 10: '₹5 + ₹5',
    15: '₹10 + ₹5', 20: '₹10 + ₹10', 25: '₹10 + ₹10 + ₹5', 50: '₹50 note',
  };
  const correct = COMBOS[amount] || `₹${amount}`;
  const wrongAmounts = [1, 2, 5, 10, 15, 20, 25, 50].filter(a => a !== amount);
  const dist = pickN(wrongAmounts, p.optionCount - 1).map(a => COMBOS[a] || `₹${a}`);
  return {
    id: uid(), chapter: 'money', gameType: 'money_match',
    signature: sig(['money_match', amount]),
    text: `Which makes ₹${amount}?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genMoneyCompare(p: GeneratorParams): CurriculumQuestion {
  const max = p.difficulty === 'easy' ? 10 : p.difficulty === 'intermediate' ? 30 : 100;
  const a = randInt(1, max);
  let b = randInt(1, max);
  while (b === a) b = randInt(1, max);
  const correct = `₹${Math.max(a, b)}`;
  return {
    id: uid(), chapter: 'money', gameType: 'money_compare',
    signature: sig(['money_cmp', a, b]),
    text: `Which is more money?\n₹${a}  or  ₹${b}`,
    options: shuffle([`₹${a}`, `₹${b}`]), correctAnswer: correct,
  };
}

function genMoneyStory(p: GeneratorParams): CurriculumQuestion {
  const max = p.difficulty === 'easy' ? 10 : p.difficulty === 'intermediate' ? 20 : 50;
  const price = randInt(1, max);
  const paid = price + randInt(1, Math.min(10, max));
  const change = paid - price;
  const name = pick(NAMES);
  const item = pick(['pencil ✏️', 'eraser', 'notebook 📓', 'candy 🍬', 'balloon 🎈', 'toy car 🚗', 'apple 🍎', 'ice cream 🍦']);
  const correct = `₹${change}`;
  const dist: string[] = [];
  let tries = 0;
  while (dist.length < p.optionCount - 1 && tries < 30) {
    tries++;
    const w = `₹${randInt(0, paid)}`;
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'money', gameType: 'money_story',
    signature: sig(['money_story', price, paid, item]),
    text: `${name} buys a ${item} for ₹${price}. Pays ₹${paid}. How much change?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Change = ₹${paid} − ₹${price}`,
  };
}

function genMakeAmount(p: GeneratorParams): CurriculumQuestion {
  const target = p.difficulty === 'easy' ? pick([3, 5, 7])
    : p.difficulty === 'intermediate' ? pick([8, 12, 15, 18])
    : pick([23, 35, 42, 55]);
  // Generate valid combo
  const available = p.difficulty === 'easy' ? [1, 2, 5] : [1, 2, 5, 10, 20];
  function buildCombo(amount: number): string {
    const parts: string[] = [];
    let remaining = amount;
    const sorted = [...available].sort((a, b) => b - a);
    for (const coin of sorted) {
      while (remaining >= coin) {
        parts.push(`₹${coin}`);
        remaining -= coin;
      }
    }
    return parts.join(' + ');
  }
  const correct = buildCombo(target);
  const wrongs: string[] = [];
  let tries = 0;
  while (wrongs.length < p.optionCount - 1 && tries < 20) {
    tries++;
    const wrong = buildCombo(target + pick([-3, -2, -1, 1, 2, 3]));
    if (wrong !== correct && !wrongs.includes(wrong)) wrongs.push(wrong);
  }
  return {
    id: uid(), chapter: 'money', gameType: 'make_amount',
    signature: sig(['make_amt', target]),
    text: `Make ₹${target} using coins:`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 9 — DATA HANDLING
// ═══════════════════════════════════════════════════════════

function genCountSort(p: GeneratorParams): CurriculumQuestion {
  const categories = [
    { name: 'fruits', items: ['🍎', '🍌', '🍊', '🍇', '🍓'] },
    { name: 'animals', items: ['🐱', '🐶', '🐦', '🐟', '🐸'] },
    { name: 'vehicles', items: ['🚗', '🚌', '🚲', '✈️', '🚂'] },
    { name: 'shapes', items: ['⬛', '🔺', '⚫', '🔷', '⭐'] },
  ];
  const cat = pick(categories);
  const target = pick(cat.items);
  const count = p.difficulty === 'easy' ? randInt(2, 4) : p.difficulty === 'intermediate' ? randInt(3, 6) : randInt(4, 8);
  const others = cat.items.filter(i => i !== target);
  const otherCount = randInt(2, 6);
  const items: string[] = [];
  for (let i = 0; i < count; i++) items.push(target);
  for (let i = 0; i < otherCount; i++) items.push(pick(others));
  const correct = String(count);
  const dist = distractors(count, p);
  return {
    id: uid(), chapter: 'data', gameType: 'count_sort',
    signature: sig(['count_sort', target, count, otherCount]),
    text: `How many ${target}?\n${shuffle(items).join(' ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genMoreOrLess(p: GeneratorParams): CurriculumQuestion {
  const objA = pick(OBJECTS);
  let objB = pick(OBJECTS);
  while (objB.name === objA.name) objB = pick(OBJECTS);
  const maxN = p.difficulty === 'easy' ? 5 : p.difficulty === 'intermediate' ? 8 : 12;
  const countA = randInt(1, maxN);
  let countB = randInt(1, maxN);
  while (countB === countA) countB = randInt(1, maxN);
  const displayA = Array(countA).fill(objA.emoji).join(' ');
  const displayB = Array(countB).fill(objB.emoji).join(' ');
  const dir = pick(['more', 'fewer'] as const);
  const correct = dir === 'more'
    ? (countA > countB ? objA.name : objB.name)
    : (countA < countB ? objA.name : objB.name);
  return {
    id: uid(), chapter: 'data', gameType: 'more_or_less',
    signature: sig(['more_less', countA, countB, objA.name, dir]),
    text: `Which group has ${dir}?\nA: ${displayA} (${objA.name})\nB: ${displayB} (${objB.name})`,
    options: shuffle([objA.name, objB.name]),
    correctAnswer: correct.charAt(0).toUpperCase() + correct.slice(1),
  };
}

function genReadChart(p: GeneratorParams): CurriculumQuestion {
  const items = ['🍎', '🍌', '🍊', '🍇', '🍓'];
  const names = ['Apples', 'Bananas', 'Oranges', 'Grapes', 'Strawberries'];
  const count = p.difficulty === 'easy' ? 3 : p.difficulty === 'intermediate' ? 4 : 5;
  const sel = items.slice(0, count);
  const selNames = names.slice(0, count);
  const maxN = p.difficulty === 'easy' ? 5 : p.difficulty === 'intermediate' ? 8 : 10;
  const counts = sel.map(() => randInt(1, maxN));
  const chart = sel.map((item, i) => `${item} ${selNames[i]}: ${'█'.repeat(counts[i])} (${counts[i]})`).join('\n');
  const askType = pick(['count', 'most', 'least'] as const);
  if (askType === 'count') {
    const askIdx = randInt(0, count - 1);
    const correct = String(counts[askIdx]);
    const dist = distractors(counts[askIdx], p);
    return {
      id: uid(), chapter: 'data', gameType: 'read_chart',
      signature: sig(['chart', 'count', askIdx, ...counts]),
      text: `Look at the chart:\n${chart}\n\nHow many ${selNames[askIdx]}?`,
      options: shuffle([correct, ...dist]), correctAnswer: correct,
    };
  }
  const maxVal = Math.max(...counts);
  const minVal = Math.min(...counts);
  const targetVal = askType === 'most' ? maxVal : minVal;
  const correct = selNames[counts.indexOf(targetVal)];
  const dist = pickN(selNames.filter(n => n !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'data', gameType: 'read_chart',
    signature: sig(['chart', askType, ...counts]),
    text: `Look at the chart:\n${chart}\n\nWhich has the ${askType}?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genTallyCount(p: GeneratorParams): CurriculumQuestion {
  const num = p.difficulty === 'easy' ? randInt(1, 7) : p.difficulty === 'intermediate' ? randInt(3, 12) : randInt(5, 20);
  const groups = Math.floor(num / 5);
  const rem = num % 5;
  const tally = Array(groups).fill('𝍸').join(' ') + (rem > 0 ? ' ' + '|'.repeat(rem) : '');
  const correct = String(num);
  const dist = distractors(num, p);
  return {
    id: uid(), chapter: 'data', gameType: 'tally_count',
    signature: sig(['tally', num]),
    text: `Count the tally marks:\n${tally}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: 'Each bundle of 5 looks like 𝍸. Count them and add the extras.',
  };
}

function genBarRead(p: GeneratorParams): CurriculumQuestion {
  const categories = ['Red', 'Blue', 'Green', 'Yellow', 'Orange'];
  const count = p.difficulty === 'easy' ? 3 : p.difficulty === 'intermediate' ? 4 : 5;
  const sel = categories.slice(0, count);
  const maxN = p.difficulty === 'easy' ? 5 : 8;
  const vals = sel.map(() => randInt(1, maxN));
  const chart = sel.map((cat, i) => `${cat}: ${'■'.repeat(vals[i])} ${vals[i]}`).join('\n');
  const askIdx = randInt(0, count - 1);
  const correct = String(vals[askIdx]);
  const dist = distractors(vals[askIdx], p);
  return {
    id: uid(), chapter: 'data', gameType: 'bar_read',
    signature: sig(['bar', askIdx, ...vals]),
    text: `Read the bar graph:\n${chart}\n\nHow many chose ${sel[askIdx]}?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// REGISTRY + PUBLIC API
// ═══════════════════════════════════════════════════════════

type CurrGenFn = (p: GeneratorParams) => CurriculumQuestion;

export const MATHS_GENERATORS: Record<string, CurrGenFn> = {
  // Numbers
  count_match: genCountMatch, number_order: genNumberOrder,
  compare_numbers: genCompareNumbers, missing_number: genMissingNumber,
  number_name: genNumberName, number_line: genNumberLine,
  // Addition
  adding_apples: genAddingApples, match_sum: genMatchSum,
  add_missing: genAddMissing, add_story: genAddStory,
  add_visual: genAddVisual, add_doubles: genAddDoubles,
  // Subtraction
  take_away: genTakeAway, sub_missing: genSubMissing,
  sub_story: genSubStory, sub_visual: genSubVisual, sub_compare: genSubCompare,
  // Shapes
  name_shape: genNameShape, count_shapes: genCountShapes,
  shape_properties: genShapeProperties, shape_match: genShapeMatch, shape_sort: genShapeSort,
  // Patterns
  continue_pattern: genContinuePattern, pattern_rule: genPatternRule,
  pattern_create: genPatternCreate, number_pattern: genNumberPattern,
  // Measurement
  compare_lengths: genCompareLengths, compare_weights: genCompareWeights,
  measure_match: genMeasureMatch, length_estimate: genLengthEstimate, capacity_compare: genCapacityCompare,
  // Time
  read_clock: genReadClock, time_order: genTimeOrder,
  time_match: genTimeMatch, daily_events: genDailyEvents,
  // Money
  count_coins: genCountCoins, money_match: genMoneyMatch,
  money_compare: genMoneyCompare, money_story: genMoneyStory, make_amount: genMakeAmount,
  // Data
  count_sort: genCountSort, more_or_less: genMoreOrLess,
  read_chart: genReadChart, tally_count: genTallyCount, bar_read: genBarRead,
};

/**
 * Generate a batch of curriculum maths questions.
 */
export function generateMathsBatch(
  gameTypeId: string,
  params: GeneratorParams,
  count: number,
  usedSignatures: Set<string>,
): CurriculumQuestion[] {
  const gen = MATHS_GENERATORS[gameTypeId];
  if (!gen) {
    console.warn(`[MathsGen] No curriculum generator for: ${gameTypeId}`);
    return [];
  }

  const questions: CurriculumQuestion[] = [];
  let attempts = 0;

  while (questions.length < count && attempts < count * 25) {
    attempts++;
    try {
      const q = gen(params);
      if (!usedSignatures.has(q.signature)) {
        usedSignatures.add(q.signature);
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  return questions;
}

/** All registered maths game type IDs */
export function allMathsGameTypes(): string[] {
  return Object.keys(MATHS_GENERATORS);
}
