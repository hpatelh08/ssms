/**
 * 🧠 Unified Question Generator — ONE BRAIN
 * ============================================
 * Central router for ALL game types:
 *   • 8 Top-8 Arcade games  (converted to text-MCQ)
 *   • 18 English subject games
 *   • 18 Maths subject games
 *   • 18 Science subject games (via subjects engine fallback)
 *
 * Every game type returns the same Question shape.
 * GameShell calls generateBatch() — never individual modules.
 */

import { getSubjectGenerator } from '../subjects/engine/questionGenerator';

// ── Shared Types ────────────────────────────────────────────

export type Difficulty = 'easy' | 'intermediate' | 'difficult';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

// ── Helpers ────────────────────────────────────────────────

let _uid = 0;
function uid(): string { return `q_${Date.now()}_${++_uid}_${Math.random().toString(36).slice(2, 6)}`; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function optCount(d: Difficulty): number { return d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5; }

// ────────────────────────────────────────────────────────────
// TOP-8 ARCADE GENERATORS  (emoji-rich text MCQ)
// ────────────────────────────────────────────────────────────

// ─── ShapeQuest data ───

const SHAPES = [
  { name: 'Circle', emoji: '⚫' }, { name: 'Square', emoji: '⬜' },
  { name: 'Triangle', emoji: '🔺' }, { name: 'Diamond', emoji: '🔷' },
  { name: 'Star', emoji: '⭐' }, { name: 'Hexagon', emoji: '⬡' },
  { name: 'Pentagon', emoji: '⬠' }, { name: 'Oval', emoji: '🥚' },
  { name: 'Arrow', emoji: '➡️' }, { name: 'Cross', emoji: '✚' },
];

function genShapeQuest(d: Difficulty): Question {
  const pool = d === 'easy' ? SHAPES.slice(0, 6) : SHAPES;
  const n = optCount(d);
  const target = pick(pool);
  const dist = pickN(pool.filter(s => s.name !== target.name), n - 1)
    .map(s => `${s.emoji} ${s.name}`);
  const correct = `${target.emoji} ${target.name}`;
  return {
    id: uid(),
    text: `${target.emoji} Find the ${target.name}!`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
    hint: `It looks like this: ${target.emoji}`,
  };
}

// ─── NumberTap data ───

function genNumberTap(d: Difficulty): Question {
  const max = d === 'easy' ? 5 : d === 'intermediate' ? 9 : 15;
  const n = optCount(d);
  const target = randInt(1, max);
  const distractors: number[] = [];
  while (distractors.length < n - 1) {
    const v = randInt(1, max);
    if (v !== target && !distractors.includes(v)) distractors.push(v);
  }
  return {
    id: uid(),
    text: `🔢 Find this number: ${target}`,
    options: shuffle([String(target), ...distractors.map(String)]),
    correctAnswer: String(target),
  };
}

// ─── MathPuzzle ───

function genMathPuzzle(d: Difficulty): Question {
  const maxSum = d === 'easy' ? 5 : d === 'intermediate' ? 10 : 15;
  const n = optCount(d);
  const a = randInt(0, maxSum);
  const b = randInt(0, maxSum - a);
  const sum = a + b;
  const distractors: number[] = [];
  while (distractors.length < n - 1) {
    const v = randInt(Math.max(0, sum - 4), sum + 4);
    if (v !== sum && !distractors.includes(v)) distractors.push(v);
  }
  return {
    id: uid(),
    text: `➕ ${a} + ${b} = ?`,
    options: shuffle([String(sum), ...distractors.map(String)]),
    correctAnswer: String(sum),
    hint: `Count ${a} fingers, then ${b} more`,
  };
}

// ─── WordBuilder data ───

const WB_WORDS = [
  { word: 'APPLE', emoji: '🍎' }, { word: 'BOOK', emoji: '📖' },
  { word: 'CAT', emoji: '🐱' }, { word: 'DOG', emoji: '🐕' },
  { word: 'FISH', emoji: '🐟' }, { word: 'BIRD', emoji: '🐦' },
  { word: 'SUN', emoji: '☀️' }, { word: 'MOON', emoji: '🌙' },
  { word: 'TREE', emoji: '🌳' }, { word: 'HOUSE', emoji: '🏠' },
  { word: 'BALL', emoji: '⚽' }, { word: 'CAKE', emoji: '🎂' },
  { word: 'MILK', emoji: '🥛' }, { word: 'STAR', emoji: '⭐' },
  { word: 'RAIN', emoji: '🌧️' }, { word: 'BOAT', emoji: '⛵' },
  { word: 'FROG', emoji: '🐸' }, { word: 'SHOE', emoji: '👟' },
  { word: 'BEAR', emoji: '🐻' }, { word: 'BUS', emoji: '🚌' },
  { word: 'PEN', emoji: '🖊️' }, { word: 'HAT', emoji: '🎩' },
  { word: 'KITE', emoji: '🪁' }, { word: 'HAND', emoji: '✋' },
  { word: 'RING', emoji: '💍' }, { word: 'WATER', emoji: '💧' },
  { word: 'PLAY', emoji: '🎮' }, { word: 'SCHOOL', emoji: '🏫' },
  { word: 'HELLO', emoji: '👋' }, { word: 'FRIEND', emoji: '🤝' },
];

function genWordBuilder(d: Difficulty): Question {
  const n = optCount(d);
  const entry = pick(WB_WORDS);
  const word = entry.word;
  const hideable = Array.from({ length: word.length }, (_, i) => i).filter(i => i > 0);
  const hideCount = d === 'easy' ? 1 : d === 'intermediate' ? Math.min(2, hideable.length) : Math.min(3, hideable.length);
  // We'll ask about the FIRST hidden letter for MCQ simplicity
  const hiddenIdx = shuffle(hideable)[0];
  const correctLetter = word[hiddenIdx];
  const display = word.split('').map((c, i) => i === hiddenIdx ? '_' : c).join('');
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const dist = pickN(allLetters.filter(l => l !== correctLetter), n - 1);
  return {
    id: uid(),
    text: `${entry.emoji} Fill the blank: ${display}`,
    options: shuffle([correctLetter, ...dist]),
    correctAnswer: correctLetter,
    hint: `The word is "${word}"`,
  };
}

// ─── GuessTheWord data ───

const PIC_WORDS = [
  { word: 'Apple', emoji: '🍎' }, { word: 'Banana', emoji: '🍌' },
  { word: 'Cat', emoji: '🐱' }, { word: 'Dog', emoji: '🐕' },
  { word: 'Elephant', emoji: '🐘' }, { word: 'Fish', emoji: '🐟' },
  { word: 'Grapes', emoji: '🍇' }, { word: 'House', emoji: '🏠' },
  { word: 'Ice Cream', emoji: '🍦' }, { word: 'Juice', emoji: '🧃' },
  { word: 'Kite', emoji: '🪁' }, { word: 'Lion', emoji: '🦁' },
  { word: 'Monkey', emoji: '🐒' }, { word: 'Nest', emoji: '🪹' },
  { word: 'Orange', emoji: '🍊' }, { word: 'Penguin', emoji: '🐧' },
  { word: 'Rainbow', emoji: '🌈' }, { word: 'Star', emoji: '⭐' },
  { word: 'Train', emoji: '🚂' }, { word: 'Umbrella', emoji: '☂️' },
  { word: 'Cake', emoji: '🎂' }, { word: 'Moon', emoji: '🌙' },
  { word: 'Sun', emoji: '☀️' }, { word: 'Flower', emoji: '🌸' },
  { word: 'Bear', emoji: '🐻' }, { word: 'Frog', emoji: '🐸' },
  { word: 'Ball', emoji: '⚽' }, { word: 'Book', emoji: '📖' },
  { word: 'Bus', emoji: '🚌' }, { word: 'Tree', emoji: '🌳' },
  { word: 'Rocket', emoji: '🚀' }, { word: 'Bell', emoji: '🔔' },
];

function genGuessTheWord(d: Difficulty): Question {
  const n = optCount(d);
  const target = pick(PIC_WORDS);
  const dist = pickN(PIC_WORDS.filter(p => p.word !== target.word).map(p => p.word), n - 1);
  return {
    id: uid(),
    text: `${target.emoji} What is this?`,
    options: shuffle([target.word, ...dist]),
    correctAnswer: target.word,
  };
}

// ─── PictureIdentify data ───

const PIC_CATEGORIES: { name: string; items: { name: string; emoji: string }[] }[] = [
  { name: 'Animal', items: [
    { name: 'Cat', emoji: '🐱' }, { name: 'Dog', emoji: '🐕' },
    { name: 'Fish', emoji: '🐟' }, { name: 'Bird', emoji: '🐦' },
    { name: 'Rabbit', emoji: '🐰' }, { name: 'Elephant', emoji: '🐘' },
    { name: 'Frog', emoji: '🐸' }, { name: 'Bear', emoji: '🐻' },
  ]},
  { name: 'Fruit', items: [
    { name: 'Apple', emoji: '🍎' }, { name: 'Banana', emoji: '🍌' },
    { name: 'Grapes', emoji: '🍇' }, { name: 'Orange', emoji: '🍊' },
    { name: 'Strawberry', emoji: '🍓' }, { name: 'Watermelon', emoji: '🍉' },
    { name: 'Cherry', emoji: '🍒' }, { name: 'Peach', emoji: '🍑' },
  ]},
  { name: 'Vehicle', items: [
    { name: 'Car', emoji: '🚗' }, { name: 'Bus', emoji: '🚌' },
    { name: 'Train', emoji: '🚂' }, { name: 'Airplane', emoji: '✈️' },
    { name: 'Bicycle', emoji: '🚲' }, { name: 'Boat', emoji: '⛵' },
    { name: 'Helicopter', emoji: '🚁' }, { name: 'Rocket', emoji: '🚀' },
  ]},
  { name: 'Nature', items: [
    { name: 'Tree', emoji: '🌳' }, { name: 'Flower', emoji: '🌸' },
    { name: 'Sun', emoji: '☀️' }, { name: 'Moon', emoji: '🌙' },
    { name: 'Cloud', emoji: '☁️' }, { name: 'Rainbow', emoji: '🌈' },
    { name: 'Mountain', emoji: '⛰️' }, { name: 'Ocean', emoji: '🌊' },
  ]},
];

function genPictureIdentify(d: Difficulty): Question {
  const n = optCount(d);
  const cat = pick(PIC_CATEGORIES);
  const target = pick(cat.items);
  const otherCats = PIC_CATEGORIES.filter(c => c.name !== cat.name);
  const distractorItems = otherCats.flatMap(c => c.items);
  const dist = pickN(distractorItems, n - 1).map(i => `${i.emoji} ${i.name}`);
  const correct = `${target.emoji} ${target.name}`;
  return {
    id: uid(),
    text: `🔍 Which is a ${cat.name}?`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
    hint: `Look for the ${cat.name.toLowerCase()}!`,
  };
}

// ─── CountObjects ───

const COUNT_EMOJIS = ['🍎', '⭐', '🌸', '🐟', '🦋', '🎈', '🍀', '🐝', '🌺', '🍊', '🐱', '🚗', '🎵', '🌙', '🍒'];
const EMOJI_NAMES: Record<string, string> = {
  '🍎': 'apples', '⭐': 'stars', '🌸': 'flowers', '🐟': 'fish',
  '🦋': 'butterflies', '🎈': 'balloons', '🍀': 'clovers', '🐝': 'bees',
  '🌺': 'flowers', '🍊': 'oranges', '🐱': 'cats', '🚗': 'cars',
  '🎵': 'notes', '🌙': 'moons', '🍒': 'cherries',
};

function genCountObjects(d: Difficulty): Question {
  const n = optCount(d);
  const minC = d === 'difficult' ? 5 : 1;
  const maxC = d === 'easy' ? 5 : d === 'intermediate' ? 9 : 15;
  const count = randInt(minC, maxC);
  const emoji = pick(COUNT_EMOJIS);
  const objName = EMOJI_NAMES[emoji] || 'items';
  const display = Array(count).fill(emoji).join(' ');
  const distractors: number[] = [];
  const pool = Array.from({ length: maxC - minC + 1 }, (_, i) => i + minC).filter(n2 => n2 !== count);
  pool.sort((a, b) => Math.abs(a - count) - Math.abs(b - count));
  const dist = pool.slice(0, n - 1);
  return {
    id: uid(),
    text: `🔢 Count the ${objName}:\n${display}`,
    options: shuffle([String(count), ...dist.map(String)]),
    correctAnswer: String(count),
    hint: `Count each ${emoji} carefully`,
  };
}

// ─── MatchLetters (converted to MCQ) ───

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function genMatchLetters(d: Difficulty): Question {
  const n = optCount(d);
  const pool = d === 'easy' ? ALL_LETTERS.slice(0, 13) : ALL_LETTERS;
  const letter = pick(pool);
  const lower = letter.toLowerCase();
  const direction = d === 'difficult' ? randInt(0, 1) : 0;
  if (direction === 0) {
    const dist = pickN(pool.filter(l => l !== letter).map(l => l.toLowerCase()), n - 1);
    return {
      id: uid(),
      text: `🔡 What is the lowercase of "${letter}"?`,
      options: shuffle([lower, ...dist]),
      correctAnswer: lower,
    };
  }
  const dist = pickN(pool.filter(l => l !== letter), n - 1);
  return {
    id: uid(),
    text: `🔠 What is the uppercase of "${lower}"?`,
    options: shuffle([letter, ...dist]),
    correctAnswer: letter,
  };
}

// ────────────────────────────────────────────────────────────
// ENGLISH SUBJECT GENERATORS  (from original questionGenerator)
// ────────────────────────────────────────────────────────────

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS_U = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS_U = ALPHA.filter(l => !VOWELS_U.includes(l));

const LETTER_SOUNDS: Record<string, string> = {
  A: 'æ (as in apple)', B: 'buh', C: 'kuh', D: 'duh', E: 'eh (as in egg)',
  F: 'fuh', G: 'guh', H: 'huh', I: 'ih (as in igloo)', J: 'juh',
  K: 'kuh', L: 'luh', M: 'muh', N: 'nuh', O: 'oh (as in octopus)',
  P: 'puh', Q: 'kwuh', R: 'ruh', S: 'sss', T: 'tuh',
  U: 'uh (as in umbrella)', V: 'vvv', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zzz',
};

const NOUNS = [
  'cat','dog','ball','tree','car','book','fish','bird','apple','house',
  'moon','star','rain','river','chair','table','pen','bag','milk','cake',
  'bus','hat','shoe','ring','boat','frog','bear','kite','hand','bell',
  'door','lamp','road','clock','stone','glass','plate','shirt','cloud','flower',
];

const VERBS = [
  'run','jump','sit','eat','play','sing','read','walk','fly','swim',
  'clap','hop','sleep','cry','laugh','dance','write','draw','cook','drink',
  'wash','kick','throw','catch','climb',
];

const ADJECTIVES = [
  'big','small','tall','short','fast','slow','hot','cold','happy','sad',
  'old','new','round','soft','hard','red','blue','green','white','black',
  'long','thin','heavy','light','sweet',
];

const OPPOSITES: [string, string][] = [
  ['big','small'],['hot','cold'],['tall','short'],['fast','slow'],['happy','sad'],
  ['up','down'],['in','out'],['open','close'],['day','night'],['light','dark'],
  ['old','new'],['hard','soft'],['long','short'],['full','empty'],['wet','dry'],
  ['clean','dirty'],['loud','quiet'],['thick','thin'],['heavy','light'],['strong','weak'],
  ['rich','poor'],['near','far'],['deep','shallow'],['wide','narrow'],['young','old'],
];

const CVC_WORDS = [
  { word: 'cat', vowel: 'a' }, { word: 'dog', vowel: 'o' }, { word: 'pen', vowel: 'e' },
  { word: 'pin', vowel: 'i' }, { word: 'cup', vowel: 'u' }, { word: 'bat', vowel: 'a' },
  { word: 'hen', vowel: 'e' }, { word: 'pig', vowel: 'i' }, { word: 'sun', vowel: 'u' },
  { word: 'map', vowel: 'a' }, { word: 'net', vowel: 'e' }, { word: 'hit', vowel: 'i' },
  { word: 'bun', vowel: 'u' }, { word: 'top', vowel: 'o' }, { word: 'bag', vowel: 'a' },
  { word: 'bed', vowel: 'e' }, { word: 'bit', vowel: 'i' }, { word: 'hot', vowel: 'o' },
  { word: 'rug', vowel: 'u' }, { word: 'van', vowel: 'a' }, { word: 'jet', vowel: 'e' },
  { word: 'lip', vowel: 'i' }, { word: 'pot', vowel: 'o' }, { word: 'gum', vowel: 'u' },
  { word: 'jam', vowel: 'a' }, { word: 'wet', vowel: 'e' }, { word: 'tin', vowel: 'i' },
  { word: 'fox', vowel: 'o' }, { word: 'mud', vowel: 'u' }, { word: 'rap', vowel: 'a' },
  { word: 'red', vowel: 'e' }, { word: 'sit', vowel: 'i' }, { word: 'log', vowel: 'o' },
  { word: 'tub', vowel: 'u' }, { word: 'ham', vowel: 'a' }, { word: 'peg', vowel: 'e' },
  { word: 'fig', vowel: 'i' }, { word: 'mop', vowel: 'o' }, { word: 'hut', vowel: 'u' },
  { word: 'cap', vowel: 'a' }, { word: 'gem', vowel: 'e' }, { word: 'kid', vowel: 'i' },
  { word: 'cod', vowel: 'o' }, { word: 'pup', vowel: 'u' }, { word: 'fan', vowel: 'a' },
  { word: 'den', vowel: 'e' }, { word: 'wig', vowel: 'i' }, { word: 'rod', vowel: 'o' },
  { word: 'nun', vowel: 'u' }, { word: 'gap', vowel: 'a' }, { word: 'leg', vowel: 'e' },
];

const LONGER_WORDS = [
  { word: 'apple', vowel: 'a', vIdx: 0 }, { word: 'table', vowel: 'a', vIdx: 1 },
  { word: 'tiger', vowel: 'i', vIdx: 1 }, { word: 'water', vowel: 'a', vIdx: 1 },
  { word: 'lemon', vowel: 'e', vIdx: 1 }, { word: 'music', vowel: 'u', vIdx: 1 },
  { word: 'river', vowel: 'i', vIdx: 1 }, { word: 'camel', vowel: 'a', vIdx: 1 },
  { word: 'melon', vowel: 'e', vIdx: 1 }, { word: 'pilot', vowel: 'i', vIdx: 1 },
  { word: 'robot', vowel: 'o', vIdx: 1 }, { word: 'tulip', vowel: 'u', vIdx: 1 },
  { word: 'cabin', vowel: 'a', vIdx: 1 }, { word: 'seven', vowel: 'e', vIdx: 1 },
  { word: 'bison', vowel: 'i', vIdx: 1 }, { word: 'novel', vowel: 'o', vIdx: 1 },
  { word: 'human', vowel: 'u', vIdx: 1 }, { word: 'medal', vowel: 'e', vIdx: 1 },
  { word: 'woman', vowel: 'o', vIdx: 1 }, { word: 'linen', vowel: 'i', vIdx: 1 },
  { word: 'sonar', vowel: 'o', vIdx: 1 }, { word: 'super', vowel: 'u', vIdx: 1 },
  { word: 'naval', vowel: 'a', vIdx: 1 }, { word: 'cedar', vowel: 'e', vIdx: 1 },
  { word: 'vivid', vowel: 'i', vIdx: 1 },
];

const REG_PLURALS: [string, string][] = [
  ['cat','cats'],['dog','dogs'],['ball','balls'],['car','cars'],['pen','pens'],
  ['bag','bags'],['hat','hats'],['cup','cups'],['map','maps'],['van','vans'],
  ['book','books'],['tree','trees'],['bird','birds'],['star','stars'],['bell','bells'],
  ['frog','frogs'],['boat','boats'],['chair','chairs'],['shoe','shoes'],['ring','rings'],
  ['kite','kites'],['cake','cakes'],['lamp','lamps'],['door','doors'],['cloud','clouds'],
];

const ES_PLURALS: [string, string][] = [
  ['box','boxes'],['bus','buses'],['dish','dishes'],['watch','watches'],['brush','brushes'],
  ['fox','foxes'],['class','classes'],['dress','dresses'],['bench','benches'],['match','matches'],
  ['kiss','kisses'],['buzz','buzzes'],['pass','passes'],['miss','misses'],['loss','losses'],
  ['boss','bosses'],['moss','mosses'],['fuss','fusses'],['hutch','hutches'],['ditch','ditches'],
];

const IRR_PLURALS: [string, string][] = [
  ['child','children'],['man','men'],['woman','women'],['mouse','mice'],['foot','feet'],
  ['tooth','teeth'],['goose','geese'],['fish','fish'],['sheep','sheep'],['deer','deer'],
  ['ox','oxen'],['person','people'],['leaf','leaves'],['knife','knives'],['wife','wives'],
  ['life','lives'],['half','halves'],['wolf','wolves'],['calf','calves'],['shelf','shelves'],
  ['loaf','loaves'],['thief','thieves'],['elf','elves'],['scarf','scarves'],['dwarf','dwarves'],
];

const VERB_ACTIONS: Record<string, string> = {
  run:'move fast with legs', jump:'go up in the air', sit:'rest on a chair',
  eat:'put food in mouth', play:'have fun with toys', sing:'make music with voice',
  read:'look at words in a book', walk:'move slowly with legs', fly:'move through the air',
  swim:'move in water', clap:'hit hands together', hop:'jump on one foot',
  sleep:'close eyes and rest', cry:'tears from eyes', laugh:'happy sound',
  dance:'move body to music', write:'make words with a pen', draw:'make pictures',
  cook:'make food on stove', drink:'swallow liquid', wash:'clean with water',
  kick:'hit with foot', throw:'send ball in air', catch:'grab with hands', climb:'go up high',
};

const SENTENCES = [
  'I am a boy','She is a girl','The cat is big','He can run fast','We go to school',
  'I like my bag','The dog is brown','She has a doll','This is a pen','That is my book',
  'I have a red ball','The sun is bright','We play in the park','Birds can fly',
  'I love my mom','He is my friend','She reads a book','We eat lunch',
  'The flower is pink','My school is big','I drink milk','Frogs can jump',
  'I see a bird','We are friends','She sings a song',
];

const MISSING_TEMPLATES: { sent: string; ans: string; opts: string[] }[] = [
  { sent: 'I ___ a boy.', ans: 'am', opts: ['is','are','was'] },
  { sent: 'The cat ___ big.', ans: 'is', opts: ['am','are','was'] },
  { sent: 'She ___ run.', ans: 'can', opts: ['is','am','the'] },
  { sent: 'We go to ___.', ans: 'school', opts: ['run','big','red'] },
  { sent: 'I like my ___.', ans: 'bag', opts: ['run','big','is'] },
  { sent: 'The ___ is brown.', ans: 'dog', opts: ['run','big','is'] },
  { sent: 'She has a ___.', ans: 'doll', opts: ['run','big','is'] },
  { sent: 'This is a ___.', ans: 'pen', opts: ['run','big','is'] },
  { sent: 'I have a ___ ball.', ans: 'red', opts: ['run','pen','is'] },
  { sent: 'The sun is ___.', ans: 'bright', opts: ['run','pen','dog'] },
  { sent: 'We ___ in the park.', ans: 'play', opts: ['pen','dog','big'] },
  { sent: 'Birds can ___.', ans: 'fly', opts: ['pen','dog','big'] },
  { sent: 'I ___ my mom.', ans: 'love', opts: ['pen','dog','big'] },
  { sent: 'He is my ___.', ans: 'friend', opts: ['run','big','hot'] },
  { sent: 'She ___ a book.', ans: 'reads', opts: ['pen','dog','big'] },
  { sent: 'We eat ___.', ans: 'lunch', opts: ['run','big','pen'] },
  { sent: 'The flower is ___.', ans: 'pink', opts: ['run','eat','dog'] },
  { sent: 'My ___ is big.', ans: 'school', opts: ['run','eat','pink'] },
  { sent: 'I ___ milk.', ans: 'drink', opts: ['pen','dog','big'] },
  { sent: 'Frogs can ___.', ans: 'jump', opts: ['pen','dog','big'] },
  { sent: 'I ___ a bird.', ans: 'see', opts: ['pen','dog','big'] },
  { sent: 'We are ___.', ans: 'friends', opts: ['pen','dog','big'] },
  { sent: 'She ___ a song.', ans: 'sings', opts: ['pen','dog','big'] },
  { sent: 'I ___ to play.', ans: 'like', opts: ['pen','dog','run'] },
  { sent: 'The ___ is hot.', ans: 'sun', opts: ['run','big','is'] },
];

// English generators

function genLetterMatch(d: Difficulty): Question {
  const range = d === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const n = optCount(d);
  const letter = pick(range);
  const lower = letter.toLowerCase();
  const direction = d === 'difficult' ? randInt(0, 1) : 0;
  if (direction === 0) {
    const dist = pickN(range.filter(l => l !== letter).map(l => l.toLowerCase()), n - 1);
    return { id: uid(), text: `What is the lowercase of "${letter}"?`, options: shuffle([lower, ...dist]), correctAnswer: lower };
  }
  const dist = pickN(range.filter(l => l !== letter), n - 1);
  return { id: uid(), text: `What is the uppercase of "${lower}"?`, options: shuffle([letter, ...dist]), correctAnswer: letter };
}

function genLetterOrder(d: Difficulty): Question {
  const max = d === 'easy' ? 9 : 25;
  const n = optCount(d);
  const idx = randInt(0, max - 1);
  const letter = ALPHA[idx];
  const next = ALPHA[idx + 1];
  const direction = d === 'difficult' && randInt(0, 1) ? 'before' : 'after';
  if (direction === 'after') {
    const dist = pickN(ALPHA.filter(l => l !== next), n - 1);
    return { id: uid(), text: `What letter comes after "${letter}"?`, options: shuffle([next, ...dist]), correctAnswer: next };
  }
  const prev = ALPHA[idx];
  const prevLetter = ALPHA[idx + 1];
  const dist = pickN(ALPHA.filter(l => l !== prev), n - 1);
  return { id: uid(), text: `What letter comes before "${prevLetter}"?`, options: shuffle([prev, ...dist]), correctAnswer: prev };
}

function genLetterSound(d: Difficulty): Question {
  const pool = d === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const n = optCount(d);
  const letter = pick(pool);
  const sound = LETTER_SOUNDS[letter];
  const dist = pickN(pool.filter(l => l !== letter), n - 1);
  return { id: uid(), text: `Which letter makes the sound "${sound}"?`, options: shuffle([letter, ...dist]), correctAnswer: letter };
}

function genClassifyLetter(d: Difficulty): Question {
  const pool = d === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const letter = pick(pool);
  const isVowel = VOWELS_U.includes(letter);
  const correct = isVowel ? 'Vowel' : 'Consonant';
  return { id: uid(), text: `Is "${letter}" a Vowel or Consonant?`, options: shuffle(['Vowel', 'Consonant']), correctAnswer: correct };
}

function genFindVowel(d: Difficulty): Question {
  const n = optCount(d);
  const vowel = pick(VOWELS_U);
  const dist = pickN(CONSONANTS_U.filter(c => c !== vowel), n - 1);
  return { id: uid(), text: 'Which one is a vowel?', options: shuffle([vowel, ...dist]), correctAnswer: vowel };
}

function genFillVowel(d: Difficulty): Question {
  const n = optCount(d);
  if (d === 'easy') {
    const item = pick(CVC_WORDS);
    const blanked = item.word[0] + '_' + item.word[2];
    const dist = pickN(['a','e','i','o','u'].filter(v => v !== item.vowel), n - 1);
    return { id: uid(), text: `Fill the vowel: "${blanked}" → ?`, options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel };
  }
  const item = pick(d === 'intermediate' ? LONGER_WORDS.slice(0, 15) : LONGER_WORDS);
  const chars = item.word.split('');
  chars[item.vIdx] = '_';
  const blanked = chars.join('');
  const dist = pickN(['a','e','i','o','u'].filter(v => v !== item.vowel), n - 1);
  return { id: uid(), text: `Fill the vowel: "${blanked}" → ?`, options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel };
}

function genFindNoun(d: Difficulty): Question {
  const n = optCount(d);
  const noun = pick(NOUNS);
  const dist = pickN([...VERBS, ...ADJECTIVES].filter(w => w !== noun), n - 1);
  return { id: uid(), text: 'Which word is a noun (naming word)?', options: shuffle([noun, ...dist]), correctAnswer: noun };
}

function genNounHunt(d: Difficulty): Question {
  const isNoun = randInt(0, 1) === 1;
  const word = isNoun ? pick(NOUNS) : pick([...VERBS, ...ADJECTIVES]);
  const correct = isNoun ? 'Yes' : 'No';
  return { id: uid(), text: `Is "${word}" a noun?`, options: shuffle(['Yes', 'No']), correctAnswer: correct };
}

function genPluralMaker(d: Difficulty): Question {
  const n = optCount(d);
  let pair: [string, string];
  if (d === 'easy') pair = pick(REG_PLURALS);
  else if (d === 'intermediate') pair = pick([...REG_PLURALS, ...ES_PLURALS]);
  else pair = pick([...REG_PLURALS, ...ES_PLURALS, ...IRR_PLURALS]);
  const [sing, plur] = pair;
  const wrongs = [`${sing}s`, `${sing}es`, `${sing}ies`, `${sing}en`, `${sing}`].filter(w => w !== plur);
  const dist = pickN(wrongs, n - 1);
  return { id: uid(), text: `What is the plural of "${sing}"?`, options: shuffle([plur, ...dist]), correctAnswer: plur };
}

function genFindVerb(d: Difficulty): Question {
  const n = optCount(d);
  const verb = pick(VERBS);
  const dist = pickN([...NOUNS, ...ADJECTIVES].filter(w => w !== verb), n - 1);
  return { id: uid(), text: 'Which word is a verb (action word)?', options: shuffle([verb, ...dist]), correctAnswer: verb };
}

function genActionMatch(d: Difficulty): Question {
  const n = optCount(d);
  const verb = pick(VERBS);
  const desc = VERB_ACTIONS[verb] || 'do something';
  const dist = pickN(VERBS.filter(v => v !== verb), n - 1);
  return { id: uid(), text: `Which word means "${desc}"?`, options: shuffle([verb, ...dist]), correctAnswer: verb };
}

function genVerbOrNot(d: Difficulty): Question {
  const isVerb = randInt(0, 1) === 1;
  const word = isVerb ? pick(VERBS) : pick([...NOUNS, ...ADJECTIVES]);
  const correct = isVerb ? 'Yes' : 'No';
  return { id: uid(), text: `Is "${word}" a verb (action word)?`, options: shuffle(['Yes', 'No']), correctAnswer: correct };
}

function genMatchOpposite(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(OPPOSITES);
  const dir = randInt(0, 1);
  const word = pair[dir];
  const correct = pair[1 - dir];
  const allWords = OPPOSITES.map(p => p[1 - dir]).filter(w => w !== correct);
  const dist = pickN(allWords, n - 1);
  return { id: uid(), text: `What is the opposite of "${word}"?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genFindOpposite(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(OPPOSITES);
  const correct = pair[1];
  const allWords = OPPOSITES.map(p => p[1]).filter(w => w !== correct);
  const dist = pickN(allWords, n - 1);
  return { id: uid(), text: `Pick the opposite of "${pair[0]}":`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCompleteOpposite(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(OPPOSITES);
  const correct = pair[1];
  const allWords = OPPOSITES.map(p => p[1]).filter(w => w !== correct);
  const dist = pickN(allWords, n - 1);
  return { id: uid(), text: `"${pair[0]}" is the opposite of ___.`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genWordOrder(d: Difficulty): Question {
  const n = optCount(d);
  const sentence = pick(SENTENCES);
  const words = sentence.split(' ');
  const wrongs: string[] = [];
  for (let i = 0; i < 10 && wrongs.length < n - 1; i++) {
    const jumbled = shuffle(words).join(' ');
    if (jumbled !== sentence && !wrongs.includes(jumbled)) wrongs.push(jumbled);
  }
  while (wrongs.length < n - 1) wrongs.push(shuffle(words).reverse().join(' '));
  return { id: uid(), text: `Which sentence is in the right order?\n(Words: ${shuffle(words).join(', ')})`, options: shuffle([sentence, ...wrongs.slice(0, n - 1)]), correctAnswer: sentence };
}

function genMissingWord(d: Difficulty): Question {
  const n = optCount(d);
  const tmpl = pick(MISSING_TEMPLATES);
  const dist = pickN(tmpl.opts, n - 1);
  return { id: uid(), text: tmpl.sent, options: shuffle([tmpl.ans, ...dist]), correctAnswer: tmpl.ans };
}

function genSentenceFix(d: Difficulty): Question {
  const n = optCount(d);
  const sentence = pick(SENTENCES);
  const words = sentence.split(' ');
  const wrongs: string[] = [];
  for (let i = 0; i < 10 && wrongs.length < n - 1; i++) {
    const copy = [...words];
    const swapI = randInt(0, copy.length - 2);
    [copy[swapI], copy[swapI + 1]] = [copy[swapI + 1], copy[swapI]];
    const bad = copy.join(' ');
    if (bad !== sentence && !wrongs.includes(bad)) wrongs.push(bad);
  }
  while (wrongs.length < n - 1) wrongs.push(words.reverse().join(' '));
  return { id: uid(), text: 'Which sentence is correct?', options: shuffle([sentence, ...wrongs.slice(0, n - 1)]), correctAnswer: sentence };
}

// ────────────────────────────────────────────────────────────
// MATHS SUBJECT GENERATORS
// ────────────────────────────────────────────────────────────

const SHAPES_BANK = [
  { name: 'Circle', emoji: '⚫' }, { name: 'Square', emoji: '⬛' },
  { name: 'Triangle', emoji: '🔺' }, { name: 'Star', emoji: '⭐' },
  { name: 'Diamond', emoji: '🔷' }, { name: 'Heart', emoji: '❤️' },
  { name: 'Rectangle', emoji: '🟩' }, { name: 'Oval', emoji: '🥚' },
];

const PAT_ITEMS = ['🔴','🔵','🟢','🟡','🟣','⬛','⚪','🟠'];

const COUNT_OBJ = [
  { name: 'apples', emoji: '🍎' }, { name: 'stars', emoji: '⭐' },
  { name: 'hearts', emoji: '❤️' }, { name: 'balls', emoji: '⚽' },
  { name: 'flowers', emoji: '🌸' }, { name: 'fish', emoji: '🐟' },
  { name: 'birds', emoji: '🐦' }, { name: 'books', emoji: '📚' },
];

const WEIGHT_PAIRS: [string, string][] = [
  ['Elephant 🐘','Cat 🐱'],['Horse 🐴','Chicken 🐔'],['Bear 🐻','Rabbit 🐰'],
  ['Cow 🐄','Dog 🐕'],['Lion 🦁','Mouse 🐭'],['Whale 🐋','Fish 🐟'],
  ['Giraffe 🦒','Hen 🐔'],['Tiger 🐯','Frog 🐸'],['Hippo 🦛','Bird 🐦'],
  ['Rhino 🦏','Duck 🦆'],['Gorilla 🦍','Ant 🐜'],['Camel 🐫','Snake 🐍'],
  ['Donkey 🫏','Butterfly 🦋'],['Pig 🐷','Sparrow 🐦'],['Deer 🦌','Rat 🐀'],
  ['Wolf 🐺','Lizard 🦎'],['Zebra 🦓','Kitten 🐱'],['Ox 🐂','Chick 🐤'],
  ['Seal 🦭','Crab 🦀'],['Panda 🐼','Snail 🐌'],['Bison 🦬','Parrot 🦜'],
  ['Moose 🫎','Hamster 🐹'],['Yak 🐃','Bee 🐝'],['Shark 🦈','Shrimp 🦐'],
  ['Buffalo 🐃','Squirrel 🐿️'],
];

const MEASURE_ITEMS = ['pencil','table','book','door','rope','ribbon','stick','ruler','road','river'];

function numRange(d: Difficulty): [number, number] {
  if (d === 'easy') return [1, 20];
  if (d === 'intermediate') return [1, 50];
  return [1, 100];
}

function genCountMatch(d: Difficulty): Question {
  const n = optCount(d);
  const obj = pick(COUNT_OBJ);
  const [, max] = numRange(d);
  const count = randInt(1, Math.min(max, 10));
  const display = Array(count).fill(obj.emoji).join(' ');
  const correct = String(count);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const wrong = String(randInt(1, Math.min(max, 12)));
    if (wrong !== correct && !dist.includes(wrong)) dist.push(wrong);
  }
  return { id: uid(), text: `Count the ${obj.name}:\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genNumberOrder(d: Difficulty): Question {
  const n = optCount(d);
  const [min, max] = numRange(d);
  const num = randInt(min, max - 1);
  const direction = d === 'difficult' && randInt(0, 1) ? 'before' : 'after';
  if (direction === 'after') {
    const correct = String(num + 1);
    const dist: string[] = [];
    while (dist.length < n - 1) {
      const w = String(randInt(Math.max(1, num - 3), num + 5));
      if (w !== correct && !dist.includes(w)) dist.push(w);
    }
    return { id: uid(), text: `What number comes after ${num}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
  }
  const correct = String(num);
  const after = num + 1;
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(Math.max(1, num - 4), num + 4));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `What number comes before ${after}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCompareNumbers(d: Difficulty): Question {
  const [min, max] = numRange(d);
  const a = randInt(min, max);
  let b = randInt(min, max);
  while (b === a) b = randInt(min, max);
  const bigger = Math.max(a, b);
  return { id: uid(), text: `Which number is bigger?`, options: shuffle([String(a), String(b)]), correctAnswer: String(bigger) };
}

function genAddingApples(d: Difficulty): Question {
  const n = optCount(d);
  const [, max] = numRange(d);
  const halfMax = Math.floor(max / 2);
  const a = randInt(1, halfMax);
  const b = randInt(1, halfMax);
  const sum = a + b;
  const correct = String(sum);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(Math.max(1, sum - 5), sum + 5));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `🍎 ${a} + ${b} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genTakeAway(d: Difficulty): Question {
  const n = optCount(d);
  const [, max] = numRange(d);
  const a = randInt(2, max);
  const b = randInt(1, a - 1);
  const diff = a - b;
  const correct = String(diff);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(Math.max(0, diff - 4), diff + 4));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `${a} − ${b} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genMatchSum(d: Difficulty): Question {
  const n = optCount(d);
  const [, max] = numRange(d);
  const halfMax = Math.floor(max / 2);
  const a = randInt(1, halfMax);
  const b = randInt(1, halfMax);
  const sum = a + b;
  const correct = `${a} + ${b}`;
  const wrongs: string[] = [];
  while (wrongs.length < n - 1) {
    const wa = randInt(1, halfMax);
    const wb = randInt(1, halfMax);
    const expr = `${wa} + ${wb}`;
    if (wa + wb !== sum && !wrongs.includes(expr)) wrongs.push(expr);
  }
  return { id: uid(), text: `Which equals ${sum}?`, options: shuffle([correct, ...wrongs]), correctAnswer: correct };
}

function genNameShape(d: Difficulty): Question {
  const n = optCount(d);
  const pool = d === 'easy' ? SHAPES_BANK.slice(0, 4) : d === 'intermediate' ? SHAPES_BANK.slice(0, 6) : SHAPES_BANK;
  const shape = pick(pool);
  const dist = pickN(pool.filter(s => s.name !== shape.name).map(s => s.name), n - 1);
  return { id: uid(), text: `What shape is this? ${shape.emoji}`, options: shuffle([shape.name, ...dist]), correctAnswer: shape.name };
}

function genContinuePattern(d: Difficulty): Question {
  const n = optCount(d);
  const patLen = d === 'easy' ? 2 : d === 'intermediate' ? 3 : 4;
  const items = pickN(PAT_ITEMS, patLen);
  const pattern = [...items, ...items, ...items];
  const display = pattern.slice(0, patLen * 2 + patLen - 1).join(' ');
  const nextIdx = (patLen * 2 + patLen - 1) % patLen;
  const correct = items[nextIdx];
  const dist = pickN(PAT_ITEMS.filter(i => i !== correct), n - 1);
  return { id: uid(), text: `What comes next?\n${display} ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCountShapes(d: Difficulty): Question {
  const n = optCount(d);
  const pool = d === 'easy' ? SHAPES_BANK.slice(0, 4) : SHAPES_BANK.slice(0, 6);
  const target = pick(pool);
  const totalItems = d === 'easy' ? randInt(3, 6) : d === 'intermediate' ? randInt(5, 9) : randInt(7, 12);
  const targetCount = randInt(1, Math.min(totalItems - 1, 6));
  const otherCount = totalItems - targetCount;
  const others = pool.filter(s => s.name !== target.name);
  const items: string[] = [];
  for (let i = 0; i < targetCount; i++) items.push(target.emoji);
  for (let i = 0; i < otherCount; i++) items.push(pick(others).emoji);
  const display = shuffle(items).join(' ');
  const correct = String(targetCount);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(1, totalItems));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `How many ${target.emoji} (${target.name}) are there?\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCompareLengths(d: Difficulty): Question {
  const [, max] = numRange(d);
  const item = pick(MEASURE_ITEMS);
  const a = randInt(1, max);
  let b = randInt(1, max);
  while (b === a) b = randInt(1, max);
  const unit = d === 'easy' ? 'cm' : d === 'intermediate' ? 'cm' : 'm';
  const longer = Math.max(a, b);
  const correct = `${longer} ${unit}`;
  return { id: uid(), text: `Which ${item} is longer?\nA: ${a} ${unit}    B: ${b} ${unit}`, options: shuffle([`${a} ${unit}`, `${b} ${unit}`]), correctAnswer: correct };
}

function genCompareWeights(d: Difficulty): Question {
  const pair = pick(WEIGHT_PAIRS);
  const correct = pair[0];
  return { id: uid(), text: 'Which is heavier?', options: shuffle([pair[0], pair[1]]), correctAnswer: correct };
}

function genMeasureMatch(d: Difficulty): Question {
  const n = optCount(d);
  const items: { item: string; size: string }[] = [
    { item: 'Ant', size: 'Very tiny' }, { item: 'Cat', size: 'Small' },
    { item: 'Dog', size: 'Medium' }, { item: 'Horse', size: 'Big' },
    { item: 'Elephant', size: 'Very big' }, { item: 'Whale', size: 'Huge' },
    { item: 'Mouse', size: 'Very tiny' }, { item: 'Rabbit', size: 'Small' },
    { item: 'Cow', size: 'Big' }, { item: 'Giraffe', size: 'Very big' },
    { item: 'Spider', size: 'Very tiny' }, { item: 'Frog', size: 'Small' },
    { item: 'Pig', size: 'Medium' }, { item: 'Bear', size: 'Big' },
    { item: 'Ship', size: 'Huge' }, { item: 'Bus', size: 'Very big' },
    { item: 'Car', size: 'Big' }, { item: 'Bicycle', size: 'Medium' },
    { item: 'Scooter', size: 'Medium' }, { item: 'Airplane', size: 'Huge' },
    { item: 'Pencil', size: 'Small' }, { item: 'Book', size: 'Small' },
    { item: 'Table', size: 'Big' }, { item: 'House', size: 'Very big' },
    { item: 'Ball', size: 'Small' },
  ];
  const it = pick(items);
  const correct = it.size;
  const all = ['Very tiny', 'Small', 'Medium', 'Big', 'Very big', 'Huge'];
  const dist = pickN(all.filter(s => s !== correct), n - 1);
  return { id: uid(), text: `How big is a ${it.item}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genReadClock(d: Difficulty): Question {
  const n = optCount(d);
  let hour: number, minute: number;
  if (d === 'easy') { hour = randInt(1, 12); minute = 0; }
  else if (d === 'intermediate') { hour = randInt(1, 12); minute = pick([0, 30]); }
  else { hour = randInt(1, 12); minute = pick([0, 15, 30, 45]); }
  const timeStr = minute === 0 ? `${hour} o'clock` : `${hour}:${minute < 10 ? '0' + minute : minute}`;
  const display = minute === 0 ? `${hour}:00` : `${hour}:${minute < 10 ? '0' + minute : minute}`;
  const correct = timeStr;
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const wh = randInt(1, 12);
    const wm = d === 'easy' ? 0 : pick([0, 15, 30, 45]);
    const wStr = wm === 0 ? `${wh} o'clock` : `${wh}:${wm < 10 ? '0' + wm : wm}`;
    if (wStr !== correct && !dist.includes(wStr)) dist.push(wStr);
  }
  return { id: uid(), text: `The clock shows ${display}. What time is it?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCountCoins(d: Difficulty): Question {
  const n = optCount(d);
  const coins = d === 'easy' ? [1, 1, 2, 2, 5] : d === 'intermediate' ? [1, 2, 5, 5, 10] : [1, 2, 5, 10, 10, 20];
  const count = d === 'easy' ? randInt(2, 3) : d === 'intermediate' ? randInt(2, 4) : randInt(3, 5);
  const selected = pickN(coins, count);
  const total = selected.reduce((a, b) => a + b, 0);
  const display = selected.map(c => `₹${c}`).join(' + ');
  const correct = `₹${total}`;
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = `₹${randInt(Math.max(1, total - 5), total + 8)}`;
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `Count the coins:\n${display} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genMoneyMatch(d: Difficulty): Question {
  const n = optCount(d);
  const amounts = d === 'easy' ? [1, 2, 5] : d === 'intermediate' ? [5, 10, 15, 20] : [10, 15, 20, 25, 50];
  const amount = pick(amounts);
  const combos: string[] = [];
  if (amount === 1) combos.push('₹1 coin');
  else if (amount === 2) combos.push('₹2 coin', '₹1 + ₹1');
  else if (amount === 5) combos.push('₹5 coin', '₹2 + ₹2 + ₹1');
  else if (amount === 10) combos.push('₹10 coin', '₹5 + ₹5');
  else if (amount === 15) combos.push('₹10 + ₹5');
  else if (amount === 20) combos.push('₹10 + ₹10', '₹20 note');
  else if (amount === 25) combos.push('₹10 + ₹10 + ₹5');
  else if (amount === 50) combos.push('₹50 note', '₹20 + ₹20 + ₹10');
  const correct = combos[0] || `₹${amount}`;
  const wrongAmounts = amounts.filter(a2 => a2 !== amount);
  const dist = pickN(wrongAmounts.map(a2 => `₹${a2}`), n - 1);
  return { id: uid(), text: `Which makes ₹${amount}?`, options: shuffle([correct, ...dist.map(d2 => d2 + ' coin')]), correctAnswer: correct };
}

function genCountSort(d: Difficulty): Question {
  const n = optCount(d);
  const categories = [
    { name: 'fruits', items: ['🍎','🍌','🍊','🍇','🍓'] },
    { name: 'animals', items: ['🐱','🐶','🐦','🐟','🐸'] },
    { name: 'vehicles', items: ['🚗','🚌','🚲','✈️','🚂'] },
  ];
  const cat = pick(categories);
  const targetItem = pick(cat.items);
  const count = d === 'easy' ? randInt(2, 4) : d === 'intermediate' ? randInt(3, 6) : randInt(4, 8);
  const otherItems = cat.items.filter(i => i !== targetItem);
  const otherCount = d === 'easy' ? randInt(2, 4) : randInt(3, 6);
  const items: string[] = [];
  for (let i = 0; i < count; i++) items.push(targetItem);
  for (let i = 0; i < otherCount; i++) items.push(pick(otherItems));
  const display = shuffle(items).join(' ');
  const correct = String(count);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(1, count + otherCount));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `How many ${targetItem} are there?\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genMoreOrLess(d: Difficulty): Question {
  const objA = pick(COUNT_OBJ);
  let objB = pick(COUNT_OBJ);
  while (objB.name === objA.name) objB = pick(COUNT_OBJ);
  const maxN = d === 'easy' ? 5 : d === 'intermediate' ? 8 : 12;
  const countA = randInt(1, maxN);
  let countB = randInt(1, maxN);
  while (countB === countA) countB = randInt(1, maxN);
  const displayA = Array(countA).fill(objA.emoji).join(' ');
  const displayB = Array(countB).fill(objB.emoji).join(' ');
  const more = countA > countB ? objA.name : objB.name;
  const correct = more.charAt(0).toUpperCase() + more.slice(1);
  const other = countA > countB ? objB.name : objA.name;
  const otherCap = other.charAt(0).toUpperCase() + other.slice(1);
  return { id: uid(), text: `Which group has MORE?\nA: ${displayA} (${objA.name})\nB: ${displayB} (${objB.name})`, options: shuffle([correct, otherCap]), correctAnswer: correct };
}

function genReadChart(d: Difficulty): Question {
  const n = optCount(d);
  const items = ['🍎','🍌','🍊','🍇','🍓'];
  const names = ['Apples','Bananas','Oranges','Grapes','Strawberries'];
  const count = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
  const selected = items.slice(0, count);
  const selectedNames = names.slice(0, count);
  const maxN = d === 'easy' ? 5 : d === 'intermediate' ? 8 : 10;
  const counts = selected.map(() => randInt(1, maxN));
  const chart = selected.map((item, i) => `${item} ${selectedNames[i]}: ${'█'.repeat(counts[i])} (${counts[i]})`).join('\n');
  const askIdx = randInt(0, count - 1);
  const correct = String(counts[askIdx]);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(1, maxN));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `Look at the chart:\n${chart}\n\nHow many ${selectedNames[askIdx]}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ────────────────────────────────────────────────────────────
// GENERATOR REGISTRY — ONE MAP FOR ALL 44 GAME TYPES
// ────────────────────────────────────────────────────────────

// ─── Number After ───

function genNumberAfter(d: Difficulty): Question {
  const max = d === 'easy' ? 20 : d === 'intermediate' ? 50 : 99;
  const n = optCount(d);
  const num = randInt(1, max);
  const answer = num + 1;
  const distractors: number[] = [];
  while (distractors.length < n - 1) {
    const v = randInt(Math.max(1, answer - 3), answer + 3);
    if (v !== answer && !distractors.includes(v)) distractors.push(v);
  }
  return {
    id: uid(),
    text: `➡️ What number comes AFTER ${num}?`,
    options: shuffle([String(answer), ...distractors.map(String)]),
    correctAnswer: String(answer),
    hint: `Count one more after ${num}`,
  };
}

// ─── Number Before ───

function genNumberBefore(d: Difficulty): Question {
  const max = d === 'easy' ? 20 : d === 'intermediate' ? 50 : 100;
  const n = optCount(d);
  const num = randInt(2, max);
  const answer = num - 1;
  const distractors: number[] = [];
  while (distractors.length < n - 1) {
    const v = randInt(Math.max(0, answer - 3), answer + 3);
    if (v !== answer && !distractors.includes(v)) distractors.push(v);
  }
  return {
    id: uid(),
    text: `⬅️ What number comes BEFORE ${num}?`,
    options: shuffle([String(answer), ...distractors.map(String)]),
    correctAnswer: String(answer),
    hint: `Count one less than ${num}`,
  };
}

// ─── Letter After ───

function genLetterAfter(d: Difficulty): Question {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const alpha = d === 'easy' ? upper : d === 'intermediate' ? lower : (Math.random() > 0.5 ? upper : lower);
  const n = optCount(d);
  const idx = randInt(0, 24); // 0-24 so there's always a next letter
  const given = alpha[idx];
  const answer = alpha[idx + 1];
  const distractors: string[] = [];
  while (distractors.length < n - 1) {
    const r = randInt(0, 25);
    if (alpha[r] !== answer && !distractors.includes(alpha[r])) distractors.push(alpha[r]);
  }
  return {
    id: uid(),
    text: `🔤 What letter comes AFTER "${given}"?`,
    options: shuffle([answer, ...distractors]),
    correctAnswer: answer,
    hint: `Think of the alphabet: ...${given}, ?, ...`,
  };
}

// ─── Letter Before ───

function genLetterBefore(d: Difficulty): Question {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const alpha = d === 'easy' ? upper : d === 'intermediate' ? lower : (Math.random() > 0.5 ? upper : lower);
  const n = optCount(d);
  const idx = randInt(1, 25); // 1-25 so there's always a previous letter
  const given = alpha[idx];
  const answer = alpha[idx - 1];
  const distractors: string[] = [];
  while (distractors.length < n - 1) {
    const r = randInt(0, 25);
    if (alpha[r] !== answer && !distractors.includes(alpha[r])) distractors.push(alpha[r]);
  }
  return {
    id: uid(),
    text: `🔠 What letter comes BEFORE "${given}"?`,
    options: shuffle([answer, ...distractors]),
    correctAnswer: answer,
    hint: `Think of the alphabet: ...?, ${given}, ...`,
  };
}

// ─── Multiplication Casino ───

function genMultiplicationCasino(d: Difficulty): Question {
  const maxMultiplier = d === 'easy' ? 5 : d === 'intermediate' ? 10 : 12;
  const minMultiplier = d === 'easy' ? 2 : 2;
  const n = optCount(d);
  const a = randInt(minMultiplier, maxMultiplier);
  const b = randInt(minMultiplier, maxMultiplier);
  const answer = a * b;
  const distractors: number[] = [];
  while (distractors.length < n - 1) {
    const v = randInt(Math.max(1, answer - 10), answer + 10);
    if (v !== answer && !distractors.includes(v)) distractors.push(v);
  }
  const casinoTexts = [
    `🎰 JACKPOT SPIN! Multiply ${a} × ${b} = ?`,
    `🎰 CASINO REELS: ${a} × ${b} = ? Win big!`,
    `🎰 SLOT MACHINE: What's ${a} × ${b}?`,
    `🎰 MULTIPLY & WIN: ${a} times ${b} equals?`,
  ];
  return {
    id: uid(),
    text: pick(casinoTexts),
    options: shuffle([String(answer), ...distractors.map(String)]),
    correctAnswer: String(answer),
    hint: `Think: ${a} groups of ${b}, or ${a} × ${b}`,
  };
}

// ─── Word Search Puzzle ───

const WORD_SEARCH_WORDS = [
  'CAT', 'DOG', 'SUN', 'BAT', 'HAT', 'RAT', 'PEN', 'CUP', 'BUS', 'BOX',
  'BOOK', 'STAR', 'MOON', 'TREE', 'BIRD', 'FISH', 'BALL', 'PLAY', 'JUMP', 'SING',
  'APPLE', 'HAPPY', 'WATER', 'SCHOOL', 'FRIEND', 'GARDEN', 'ANIMAL', 'FLOWER',
];

function genWordSearchPuzzle(d: Difficulty): Question {
  const n = optCount(d);
  const wordCount = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
  const targetWord = pick(WORD_SEARCH_WORDS);
  const otherWords = pickN(WORD_SEARCH_WORDS.filter(w => w !== targetWord), wordCount - 1);
  const allWords = shuffle([targetWord, ...otherWords]);
  const distractors = pickN(WORD_SEARCH_WORDS.filter(w => w !== targetWord), n - 1);
  
  const puzzleTexts = [
    `🔍 WORD HUNT! Find "${targetWord}" hidden in:\n${allWords.join(' • ')}`,
    `🔎 SEARCH & WIN! Which word is "${targetWord}"?\nList: ${allWords.join(', ')}`,
    `🕵️ DETECTIVE MODE! Spot "${targetWord}" in this list:\n${allWords.join(' | ')}`,
  ];
  
  return {
    id: uid(),
    text: pick(puzzleTexts),
    options: shuffle([targetWord, ...distractors]),
    correctAnswer: targetWord,
    hint: `The answer is ${targetWord}`,
  };
}

// ─── Flip Card Match ───

function genFlipCardMatch(d: Difficulty): Question {
  const n = optCount(d);
  const matchType = pick(['letter', 'number', 'math']);
  
  if (matchType === 'letter') {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idx = randInt(0, 25);
    const upper = alpha[idx];
    const lower = upper.toLowerCase();
    const distractors: string[] = [];
    while (distractors.length < n - 1) {
      const r = randInt(0, 25);
      if (alpha[r].toLowerCase() !== lower && !distractors.includes(alpha[r].toLowerCase())) {
        distractors.push(alpha[r].toLowerCase());
      }
    }
    return {
      id: uid(),
      text: `🃏 FLIP THE CARDS! Match capital "${upper}" with lowercase:`,
      options: shuffle([lower, ...distractors]),
      correctAnswer: lower,
      hint: `Big ${upper} matches with small ${lower}`,
    };
  } else if (matchType === 'number') {
    const num = randInt(1, d === 'easy' ? 20 : d === 'intermediate' ? 50 : 100);
    const distractors: number[] = [];
    while (distractors.length < n - 1) {
      const v = randInt(1, d === 'easy' ? 20 : d === 'intermediate' ? 50 : 100);
      if (v !== num && !distractors.includes(v)) distractors.push(v);
    }
    return {
      id: uid(),
      text: `🎴 MEMORY MATCH! Find the twin of: ${num}`,
      options: shuffle([String(num), ...distractors.map(String)]),
      correctAnswer: String(num),
      hint: `The twin is also ${num}`,
    };
  } else {
    // math pair
    const maxNum = d === 'easy' ? 10 : d === 'intermediate' ? 20 : 30;
    const a = randInt(1, maxNum);
    const b = randInt(1, maxNum - a);
    const sum = a + b;
    const distractors: number[] = [];
    while (distractors.length < n - 1) {
      const v = randInt(Math.max(1, sum - 5), sum + 5);
      if (v !== sum && !distractors.includes(v)) distractors.push(v);
    }
    return {
      id: uid(),
      text: `🎰 MATCH THE PAIR! ${a} + ${b} = what number?`,
      options: shuffle([String(sum), ...distractors.map(String)]),
      correctAnswer: String(sum),
      hint: `Count ${a} and ${b} together`,
    };
  }
}

// ─── Chart Game (Visual Bar Charts) ───

function genChartGame(d: Difficulty): Question {
  const n = optCount(d);
  const themes = {
    fruits: [
      { emoji: '🍎', name: 'Apples', color: 'red' },
      { emoji: '🍌', name: 'Bananas', color: 'yellow' },
      { emoji: '🍊', name: 'Oranges', color: 'orange' },
      { emoji: '🍇', name: 'Grapes', color: 'purple' },
      { emoji: '🍓', name: 'Strawberries', color: 'pink' },
    ],
    animals: [
      { emoji: '🐶', name: 'Dogs', color: 'brown' },
      { emoji: '🐱', name: 'Cats', color: 'orange' },
      { emoji: '🐦', name: 'Birds', color: 'blue' },
      { emoji: '🐟', name: 'Fish', color: 'cyan' },
      { emoji: '🐰', name: 'Rabbits', color: 'pink' },
    ],
    toys: [
      { emoji: '⚽', name: 'Balls', color: 'red' },
      { emoji: '🎨', name: 'Art Kits', color: 'purple' },
      { emoji: '🚗', name: 'Cars', color: 'blue' },
      { emoji: '🧸', name: 'Bears', color: 'brown' },
      { emoji: '🪁', name: 'Kites', color: 'green' },
    ],
  };
  
  const themeKeys = Object.keys(themes) as Array<keyof typeof themes>;
  const selectedTheme = pick(themeKeys);
  const themeItems = themes[selectedTheme];
  
  const itemCount = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
  const maxValue = d === 'easy' ? 8 : d === 'intermediate' ? 12 : 15;
  
  const selected = themeItems.slice(0, itemCount).map(item => ({
    ...item,
    count: randInt(1, maxValue),
  }));
  
  // Build visual chart with bars
  const chartLines = selected.map(item => 
    `${item.emoji} ${item.name}: ${'█'.repeat(item.count)} (${item.count})`
  );
  const chart = chartLines.join('\n');
  
  // Generate question
  const qTypes = ['count', 'most', 'least'];
  const qType = pick(qTypes);
  let question = '';
  let correctAnswer = '';
  
  if (qType === 'count') {
    const askIdx = randInt(0, selected.length - 1);
    question = `📊 BAR CHART:\n${chart}\n\nHow many ${selected[askIdx].name}?`;
    correctAnswer = String(selected[askIdx].count);
  } else if (qType === 'most') {
    const maxItem = selected.reduce((max, item) => item.count > max.count ? item : max);
    question = `📊 BAR CHART:\n${chart}\n\nWhich has the MOST?`;
    correctAnswer = maxItem.name;
  } else {
    const minItem = selected.reduce((min, item) => item.count < min.count ? item : min);
    question = `📊 BAR CHART:\n${chart}\n\nWhich has the LEAST?`;
    correctAnswer = minItem.name;
  }
  
  // Generate distractors
  const distractors: string[] = [];
  if (qType === 'count') {
    const correctNum = Number(correctAnswer);
    while (distractors.length < n - 1) {
      const v = String(randInt(Math.max(1, correctNum - 3), correctNum + 3));
      if (v !== correctAnswer && !distractors.includes(v)) {
        distractors.push(v);
      }
    }
  } else {
    selected.forEach(item => {
      if (item.name !== correctAnswer && distractors.length < n - 1) {
        distractors.push(item.name);
      }
    });
  }
  
  return {
    id: uid(),
    text: question,
    options: shuffle([correctAnswer, ...distractors]),
    correctAnswer: correctAnswer,
    hint: qType === 'count' ? `Count the bars for ${correctAnswer}` : `Look for the ${qType === 'most' ? 'longest' : 'shortest'} bar`,
  };
}

type GenFn = (d: Difficulty) => Question;

// ── Science Word Banks ─────────────────────────────────────

const SCI_LIVING = ['dog','cat','bird','fish','tree','flower','butterfly','ant','frog','cow','hen','parrot','lion','elephant','snake'];
const SCI_NON_LIVING = ['stone','book','chair','table','ball','car','pen','bottle','shoe','cup','clock','bag','plate','bell','box'];
const SCI_PLANT_PARTS: { part: string; job: string }[] = [
  { part: 'Root', job: 'absorbs water from soil' }, { part: 'Stem', job: 'carries water to leaves' },
  { part: 'Leaf', job: 'makes food using sunlight' }, { part: 'Flower', job: 'helps plant make seeds' },
  { part: 'Fruit', job: 'protects the seeds' }, { part: 'Seed', job: 'grows into a new plant' },
];
const SCI_ANI_HOMES: { animal: string; home: string }[] = [
  { animal: 'Bird', home: 'Nest' }, { animal: 'Dog', home: 'Kennel' }, { animal: 'Bee', home: 'Hive' },
  { animal: 'Rabbit', home: 'Burrow' }, { animal: 'Fish', home: 'Water' }, { animal: 'Lion', home: 'Den' },
  { animal: 'Horse', home: 'Stable' }, { animal: 'Spider', home: 'Web' }, { animal: 'Ant', home: 'Anthill' }, { animal: 'Cow', home: 'Shed' },
];
const SCI_ANI_FOODS: { animal: string; food: string }[] = [
  { animal: 'Cow', food: 'Grass' }, { animal: 'Cat', food: 'Fish' }, { animal: 'Rabbit', food: 'Carrot' },
  { animal: 'Monkey', food: 'Banana' }, { animal: 'Dog', food: 'Meat' }, { animal: 'Parrot', food: 'Seeds' },
  { animal: 'Lion', food: 'Meat' }, { animal: 'Hen', food: 'Grains' }, { animal: 'Bear', food: 'Honey' }, { animal: 'Goat', food: 'Grass' },
];
const SCI_ANI_TYPES: { animal: string; type: string }[] = [
  { animal: 'Dog', type: 'Pet' }, { animal: 'Lion', type: 'Wild' }, { animal: 'Cow', type: 'Farm' },
  { animal: 'Tiger', type: 'Wild' }, { animal: 'Cat', type: 'Pet' }, { animal: 'Hen', type: 'Farm' },
  { animal: 'Elephant', type: 'Wild' }, { animal: 'Horse', type: 'Farm' }, { animal: 'Goldfish', type: 'Pet' }, { animal: 'Parrot', type: 'Pet' },
];
const SCI_BODY: { part: string; use: string }[] = [
  { part: 'Eyes', use: 'seeing' }, { part: 'Ears', use: 'hearing' }, { part: 'Nose', use: 'smelling' },
  { part: 'Tongue', use: 'tasting' }, { part: 'Skin', use: 'touching' }, { part: 'Legs', use: 'walking' },
  { part: 'Hands', use: 'holding things' }, { part: 'Heart', use: 'pumping blood' }, { part: 'Lungs', use: 'breathing' }, { part: 'Brain', use: 'thinking' },
];
const SCI_SENSE: { organ: string; sense: string }[] = [
  { organ: 'Eyes', sense: 'Sight' }, { organ: 'Ears', sense: 'Hearing' }, { organ: 'Nose', sense: 'Smell' },
  { organ: 'Tongue', sense: 'Taste' }, { organ: 'Skin', sense: 'Touch' },
];
const SCI_GOOD_HABITS = ['Brush teeth twice a day','Wash hands before eating','Eat fruits and vegetables','Drink plenty of water','Exercise daily','Sleep 8-10 hours','Take a bath daily','Cut nails regularly'];
const SCI_BAD_HABITS = ['Eating too much junk food','Not washing hands','Skipping breakfast','Sleeping very late','Not brushing teeth','Drinking too much soda','Not exercising','Biting nails'];
const SCI_FOOD_GROUPS: { food: string; group: string }[] = [
  { food: 'Rice', group: 'Carbohydrates' }, { food: 'Bread', group: 'Carbohydrates' }, { food: 'Milk', group: 'Protein' },
  { food: 'Egg', group: 'Protein' }, { food: 'Apple', group: 'Vitamins' }, { food: 'Carrot', group: 'Vitamins' },
  { food: 'Butter', group: 'Fats' }, { food: 'Cheese', group: 'Fats' }, { food: 'Spinach', group: 'Vitamins' }, { food: 'Fish', group: 'Protein' },
];
const SCI_HEALTHY_F = ['Apple','Banana','Milk','Rice','Egg','Carrot','Spinach','Curd','Chapati','Dal'];
const SCI_JUNK_F = ['Chips','Candy','Soda','Pizza','Burger','Chocolate','Ice cream','Cake','Fries','Noodles'];
const SCI_FOOD_SRC: { food: string; source: string }[] = [
  { food: 'Milk', source: 'Cow' }, { food: 'Egg', source: 'Hen' }, { food: 'Honey', source: 'Bee' },
  { food: 'Rice', source: 'Plant' }, { food: 'Wool', source: 'Sheep' }, { food: 'Silk', source: 'Silkworm' },
  { food: 'Apple', source: 'Tree' }, { food: 'Fish', source: 'River/Sea' }, { food: 'Wheat', source: 'Plant' }, { food: 'Meat', source: 'Animals' },
];
const SCI_WATER_USES = ['Drinking','Cooking','Bathing','Washing clothes','Watering plants','Cleaning','Farming','Swimming'];
const SCI_SAVE_WATER = ['Turn off tap while brushing','Fix leaking taps','Take short showers','Use a bucket instead of pipe','Collect rainwater','Reuse water for plants'];

function optC(d: Difficulty): number { return d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5; }

function genSciClassifyLiving(d: Difficulty): Question {
  const n = optC(d); const isL = Math.random() > 0.5;
  const thing = isL ? pick(SCI_LIVING) : pick(SCI_NON_LIVING);
  const correct = isL ? 'Living' : 'Non-Living';
  const opts = ['Living','Non-Living']; if(n>2) opts.push('Both'); if(n>3) opts.push('Neither'); if(n>4) opts.push('Not Sure');
  return { id: uid(), text: `Is "${thing}" a living or non-living thing?`, options: shuffle(opts.slice(0,n)), correctAnswer: correct };
}
function genSciNeedsOfLiving(d: Difficulty): Question {
  const n = optC(d);
  const needs = ['Food','Water','Air','Sunlight','Shelter'];
  const notN = ['Television','Mobile phone','Computer','Car','Video games'];
  const askN = Math.random() > 0.3;
  if(askN){ const c = pick(needs); return { id: uid(), text: 'Which do all living things need?', options: shuffle([c,...pickN([...needs.filter(x=>x!==c),...pickN(notN,3)],n-1)]), correctAnswer: c }; }
  const c = pick(notN); return { id: uid(), text: 'Which is NOT needed by living things?', options: shuffle([c,...pickN([...notN.filter(x=>x!==c),...pickN(needs,2)],n-1)]), correctAnswer: c };
}
function genSciLivingQuiz(d: Difficulty): Question {
  const n = optC(d);
  const facts = [
    { q:'Living things can ___', a:'grow and move', w:['stay the same forever','be made of metal','work like machines'] },
    { q:'Which can breathe?', a:'Dog', w:['Stone','Table','Ball','Pen'] },
    { q:'Plants are ___', a:'living things', w:['non-living things','not real','made of plastic'] },
    { q:'Non-living things ___', a:'do not grow', w:['need food','breathe air','have babies'] },
    { q:'Which is non-living?', a:'Chair', w:['Cat','Tree','Fish','Bird'] },
    { q:'A baby grows into ___', a:'an adult', w:['a stone','a toy','a chair'] },
  ];
  const f = pick(facts);
  return { id: uid(), text: f.q, options: shuffle([f.a,...pickN(f.w,n-1)]), correctAnswer: f.a };
}
function genSciPartsOfPlant(d: Difficulty): Question {
  const n = optC(d); const p = pick(SCI_PLANT_PARTS);
  const wrong = SCI_PLANT_PARTS.filter(x=>x.part!==p.part).map(x=>x.part);
  return { id: uid(), text: `Which part of the plant ${p.job}?`, options: shuffle([p.part,...pickN(wrong,n-1)]), correctAnswer: p.part };
}
function genSciPlantNeeds(d: Difficulty): Question {
  const n = optC(d); const needs = ['Water','Sunlight','Air','Soil'];
  const notN = ['Ice cream','Mobile phone','Television','Shoes','Toys'];
  const c = pick(needs);
  return { id: uid(), text: 'What do plants need to grow?', options: shuffle([c,...pickN([...needs.filter(x=>x!==c),...pickN(notN,3)],n-1)]), correctAnswer: c };
}
function genSciPlantMatch(d: Difficulty): Question {
  const n = optC(d);
  const items = [
    { q:'Which part of plant is underground?', a:'Root', w:['Leaf','Flower','Fruit','Stem'] },
    { q:'Leaves are usually what color?', a:'Green', w:['Blue','Red','Black','White'] },
    { q:'Which part makes food for the plant?', a:'Leaf', w:['Root','Stem','Flower','Fruit'] },
    { q:'Seeds grow into new ___', a:'Plants', w:['Animals','Rocks','Water','Soil'] },
    { q:'Trees give us ___', a:'Oxygen', w:['Carbon dioxide','Smoke','Dust','Nothing'] },
    { q:'Flowers attract ___', a:'Butterflies & bees', w:['Cars','Rocks','Rain','Books'] },
  ];
  const f = pick(items);
  return { id: uid(), text: f.q, options: shuffle([f.a,...pickN(f.w,n-1)]), correctAnswer: f.a };
}
function genSciAnimalHome(d: Difficulty): Question {
  const n = optC(d); const ah = pick(SCI_ANI_HOMES);
  const wrong = SCI_ANI_HOMES.filter(x=>x.home!==ah.home).map(x=>x.home);
  return { id: uid(), text: `Where does a ${ah.animal} live?`, options: shuffle([ah.home,...pickN(wrong,n-1)]), correctAnswer: ah.home };
}
function genSciAnimalFood(d: Difficulty): Question {
  const n = optC(d); const af = pick(SCI_ANI_FOODS);
  const wrong = SCI_ANI_FOODS.filter(x=>x.food!==af.food).map(x=>x.food);
  return { id: uid(), text: `What does a ${af.animal} eat?`, options: shuffle([af.food,...pickN(wrong,n-1)]), correctAnswer: af.food };
}
function genSciAnimalClassify(d: Difficulty): Question {
  const n = optC(d); const at = pick(SCI_ANI_TYPES);
  const types = ['Pet','Wild','Farm']; const wrong = types.filter(t=>t!==at.type);
  if(n>3) wrong.push('Sea animal'); if(n>4) wrong.push('Bird');
  return { id: uid(), text: `What type of animal is a ${at.animal}?`, options: shuffle([at.type,...wrong.slice(0,n-1)]), correctAnswer: at.type };
}
function genSciBodyParts(d: Difficulty): Question {
  const n = optC(d); const bp = pick(SCI_BODY);
  const wrong = SCI_BODY.filter(x=>x.part!==bp.part).map(x=>x.part);
  return { id: uid(), text: `Which body part helps us in ${bp.use}?`, options: shuffle([bp.part,...pickN(wrong,n-1)]), correctAnswer: bp.part };
}
function genSciSenseOrgans(d: Difficulty): Question {
  const n = optC(d); const so = pick(SCI_SENSE);
  if(Math.random()>0.5){ const wrong = SCI_SENSE.filter(x=>x.organ!==so.organ).map(x=>x.organ);
    return { id: uid(), text: `Which organ is for the sense of ${so.sense}?`, options: shuffle([so.organ,...pickN(wrong,n-1)]), correctAnswer: so.organ }; }
  const wrong = SCI_SENSE.filter(x=>x.sense!==so.sense).map(x=>x.sense);
  return { id: uid(), text: `${so.organ} give us the sense of ___?`, options: shuffle([so.sense,...pickN(wrong,n-1)]), correctAnswer: so.sense };
}
function genSciHealthyHabits(d: Difficulty): Question {
  const n = optC(d);
  if(Math.random()>0.4){ const c = pick(SCI_GOOD_HABITS);
    return { id: uid(), text: 'Which is a healthy habit?', options: shuffle([c,...pickN([...SCI_GOOD_HABITS.filter(x=>x!==c).slice(0,1),...pickN(SCI_BAD_HABITS,3)],n-1)]), correctAnswer: c }; }
  const c = pick(SCI_BAD_HABITS);
  return { id: uid(), text: 'Which is NOT a healthy habit?', options: shuffle([c,...pickN([...SCI_BAD_HABITS.filter(x=>x!==c).slice(0,1),...pickN(SCI_GOOD_HABITS,3)],n-1)]), correctAnswer: c };
}
function genSciFoodGroups(d: Difficulty): Question {
  const n = optC(d); const fg = pick(SCI_FOOD_GROUPS);
  const groups = ['Carbohydrates','Protein','Vitamins','Fats','Minerals'];
  return { id: uid(), text: `"${fg.food}" belongs to which food group?`, options: shuffle([fg.group,...pickN(groups.filter(g=>g!==fg.group),n-1)]), correctAnswer: fg.group };
}
function genSciHealthyFood(d: Difficulty): Question {
  const n = optC(d);
  if(Math.random()>0.4){ const c = pick(SCI_HEALTHY_F);
    return { id: uid(), text: 'Which is a healthy food?', options: shuffle([c,...pickN([...SCI_HEALTHY_F.filter(x=>x!==c).slice(0,1),...pickN(SCI_JUNK_F,3)],n-1)]), correctAnswer: c }; }
  const c = pick(SCI_JUNK_F);
  return { id: uid(), text: 'Which is junk food?', options: shuffle([c,...pickN([...SCI_JUNK_F.filter(x=>x!==c).slice(0,1),...pickN(SCI_HEALTHY_F,3)],n-1)]), correctAnswer: c };
}
function genSciFoodSource(d: Difficulty): Question {
  const n = optC(d); const fs = pick(SCI_FOOD_SRC);
  const wrong = SCI_FOOD_SRC.filter(x=>x.source!==fs.source).map(x=>x.source);
  return { id: uid(), text: `Where do we get "${fs.food}" from?`, options: shuffle([fs.source,...pickN(wrong,n-1)]), correctAnswer: fs.source };
}
function genSciWaterUses(d: Difficulty): Question {
  const n = optC(d); const c = pick(SCI_WATER_USES);
  const notU = ['Flying','Making fire','Painting walls','Building houses','Making plastic'];
  return { id: uid(), text: 'Which is a use of water?', options: shuffle([c,...pickN([...SCI_WATER_USES.filter(x=>x!==c).slice(0,2),...pickN(notU,3)],n-1)]), correctAnswer: c };
}
function genSciSaveWater(d: Difficulty): Question {
  const n = optC(d); const c = pick(SCI_SAVE_WATER);
  const wasteful = ['Keep tap running','Use hose to wash car','Take very long showers','Throw water for fun','Leave tap open'];
  return { id: uid(), text: 'Which is a good way to save water?', options: shuffle([c,...pickN([...SCI_SAVE_WATER.filter(x=>x!==c).slice(0,1),...pickN(wasteful,3)],n-1)]), correctAnswer: c };
}
function genSciAirAround(d: Difficulty): Question {
  const n = optC(d);
  const facts = [
    { q:'Air is ___', a:'everywhere around us', w:['only inside houses','only outside','only in bottles'] },
    { q:'We cannot see air but we can ___', a:'feel it', w:['eat it','hold it','paint it'] },
    { q:'Moving air is called ___', a:'Wind', w:['Rain','Thunder','Snow','Water'] },
    { q:'Trees give us clean ___', a:'Air (Oxygen)', w:['Water','Food','Soil','Light'] },
    { q:'Which living thing needs air?', a:'All living things', w:['Only humans','Only animals','Only plants'] },
    { q:'Polluted air is ___', a:'harmful to breathe', w:['good for health','tasty','invisible'] },
  ];
  const f = pick(facts);
  return { id: uid(), text: f.q, options: shuffle([f.a,...pickN(f.w,n-1)]), correctAnswer: f.a };
}

const GENERATORS: Record<string, GenFn> = {
  // ── Top-8 Arcade ──
  shapeQuest: genShapeQuest,
  numberTap: genNumberTap,
  mathPuzzle: genMathPuzzle,
  wordBuilder: genWordBuilder,
  guessTheWord: genGuessTheWord,
  pictureIdentify: genPictureIdentify,
  countObjects: genCountObjects,
  matchLetters: genMatchLetters,
  // ── New Arcade games ──
  numberAfter: genNumberAfter,
  numberBefore: genNumberBefore,
  letterAfter: genLetterAfter,
  letterBefore: genLetterBefore,
  // ── Casino games ──
  multiplicationCasino: genMultiplicationCasino,
  wordSearchPuzzle: genWordSearchPuzzle,
  flipCardMatch: genFlipCardMatch,
  chartGame: genChartGame,

  // ── English – Alphabet ──
  letter_match: genLetterMatch, letter_order: genLetterOrder, letter_sound: genLetterSound,
  // ── English – Vowels ──
  classify_letter: genClassifyLetter, find_vowel: genFindVowel, fill_vowel: genFillVowel,
  // ── English – Nouns ──
  find_noun: genFindNoun, noun_hunt: genNounHunt, plural_maker: genPluralMaker,
  // ── English – Verbs ──
  find_verb: genFindVerb, action_match: genActionMatch, verb_or_not: genVerbOrNot,
  // ── English – Opposites ──
  match_opposite: genMatchOpposite, find_opposite: genFindOpposite, complete_opposite: genCompleteOpposite,
  // ── English – Sentences ──
  word_order: genWordOrder, missing_word: genMissingWord, sentence_fix: genSentenceFix,

  // ── Maths – Numbers ──
  count_match: genCountMatch, number_order: genNumberOrder, compare_numbers: genCompareNumbers,
  // ── Maths – Add/Sub ──
  adding_apples: genAddingApples, take_away: genTakeAway, match_sum: genMatchSum,
  // ── Maths – Shapes ──
  name_shape: genNameShape, continue_pattern: genContinuePattern, count_shapes: genCountShapes,
  // ── Maths – Measurement ──
  compare_lengths: genCompareLengths, compare_weights: genCompareWeights, measure_match: genMeasureMatch,
  // ── Maths – Time & Money ──
  read_clock: genReadClock, count_coins: genCountCoins, money_match: genMoneyMatch,
  // ── Maths – Data ──
  count_sort: genCountSort, more_or_less: genMoreOrLess, read_chart: genReadChart,

  // ── Science – Living Things ──
  classify_living: genSciClassifyLiving, needs_of_living: genSciNeedsOfLiving, living_quiz: genSciLivingQuiz,
  // ── Science – Plants ──
  parts_of_plant: genSciPartsOfPlant, plant_needs: genSciPlantNeeds, plant_match: genSciPlantMatch,
  // ── Science – Animals ──
  animal_home: genSciAnimalHome, animal_food: genSciAnimalFood, animal_classify: genSciAnimalClassify,
  // ── Science – Body ──
  body_parts: genSciBodyParts, sense_organs: genSciSenseOrgans, healthy_habits: genSciHealthyHabits,
  // ── Science – Food ──
  food_groups: genSciFoodGroups, healthy_food: genSciHealthyFood, food_source: genSciFoodSource,
  // ── Science – Water & Air ──
  water_uses: genSciWaterUses, save_water: genSciSaveWater, air_around: genSciAirAround,
};

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────

/**
 * Generate a batch of unique questions for a mini-level.
 * Called 5 at a time by GameShell (never 25 at once).
 */
export function generateBatch(
  gameTypeId: string,
  difficulty: Difficulty,
  count: number,
  usedIds: Set<string>,
): Question[] {
  const gen = GENERATORS[gameTypeId] || getSubjectGenerator(gameTypeId);
  if (!gen) {
    console.warn(`[QuestionGen] No generator for: ${gameTypeId}`);
    return [];
  }

  const questions: Question[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (questions.length < count && attempts < count * 20) {
    attempts++;
    try {
      const q = gen(difficulty);
      const key = `${q.text}::${q.correctAnswer}`;
      if (!seen.has(key) && !usedIds.has(q.id)) {
        seen.add(key);
        usedIds.add(q.id);
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  return questions;
}

/** Check if a gameTypeId is registered. */
export function hasGenerator(gameTypeId: string): boolean {
  return gameTypeId in GENERATORS || !!getSubjectGenerator(gameTypeId);
}

/** All registered game type IDs. */
export function allGameTypeIds(): string[] {
  return Object.keys(GENERATORS);
}
