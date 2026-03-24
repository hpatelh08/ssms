/**
 * games/curriculum/englishGenerators.ts — Parameterised English generators
 * ═══════════════════════════════════════════════════════════════════════
 * Each generator accepts GeneratorParams and returns CurriculumQuestion.
 * Parameterised word banks + dynamic templates ensure 300-500+ unique
 * variations per chapter.
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
  return `e_${(h >>> 0).toString(36)}`;
}

// ── Shared data ───────────────────────────────────────────

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ALPHA.filter(l => !VOWELS.includes(l));

const LETTER_SOUNDS: Record<string, string> = {
  A: 'æ (apple)', B: 'buh', C: 'kuh', D: 'duh', E: 'eh (egg)',
  F: 'fuh', G: 'guh', H: 'huh', I: 'ih (igloo)', J: 'juh',
  K: 'kuh', L: 'luh', M: 'muh', N: 'nuh', O: 'oh (octopus)',
  P: 'puh', Q: 'kwuh', R: 'ruh', S: 'sss', T: 'tuh',
  U: 'uh (umbrella)', V: 'vvv', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zzz',
};

const BEGIN_SOUNDS: Record<string, string[]> = {
  A: ['apple', 'ant', 'airplane'], B: ['ball', 'bat', 'bear', 'bus'],
  C: ['cat', 'car', 'cup', 'cake'], D: ['dog', 'door', 'drum', 'duck'],
  E: ['egg', 'elephant', 'elbow'], F: ['fan', 'fish', 'frog', 'flower'],
  G: ['goat', 'gate', 'girl', 'glass'], H: ['hat', 'hen', 'house', 'hand'],
  I: ['igloo', 'ice', 'insect'], J: ['jam', 'jug', 'jet', 'jump'],
  K: ['kite', 'king', 'key', 'kick'], L: ['lamp', 'lion', 'leaf', 'leg'],
  M: ['moon', 'map', 'milk', 'mango'], N: ['net', 'nose', 'nest', 'nail'],
  O: ['orange', 'owl', 'octopus'], P: ['pen', 'pig', 'pot', 'plate'],
  Q: ['queen', 'quilt', 'quiz'], R: ['rat', 'rain', 'ring', 'road'],
  S: ['sun', 'star', 'shoe', 'snake'], T: ['tap', 'tree', 'table', 'tiger'],
  U: ['umbrella', 'uniform', 'uncle'], V: ['van', 'vase', 'violin'],
  W: ['water', 'wall', 'whale', 'wind'], X: ['xylophone', 'x-ray'],
  Y: ['yak', 'yarn', 'yellow'], Z: ['zebra', 'zip', 'zoo', 'zero'],
};

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

const CCVC_WORDS = [
  { word: 'frog', vowel: 'o' }, { word: 'drum', vowel: 'u' },
  { word: 'slip', vowel: 'i' }, { word: 'snap', vowel: 'a' },
  { word: 'clap', vowel: 'a' }, { word: 'grab', vowel: 'a' },
  { word: 'trip', vowel: 'i' }, { word: 'swim', vowel: 'i' },
  { word: 'drop', vowel: 'o' }, { word: 'step', vowel: 'e' },
  { word: 'grin', vowel: 'i' }, { word: 'stop', vowel: 'o' },
  { word: 'plan', vowel: 'a' }, { word: 'skip', vowel: 'i' },
  { word: 'flag', vowel: 'a' }, { word: 'glow', vowel: 'o' },
  { word: 'sled', vowel: 'e' }, { word: 'twig', vowel: 'i' },
  { word: 'plum', vowel: 'u' }, { word: 'crab', vowel: 'a' },
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
  { word: 'super', vowel: 'u', vIdx: 1 }, { word: 'naval', vowel: 'a', vIdx: 1 },
  { word: 'cedar', vowel: 'e', vIdx: 1 }, { word: 'vivid', vowel: 'i', vIdx: 1 },
  { word: 'mango', vowel: 'a', vIdx: 1 },
];

const NOUNS = [
  'cat', 'dog', 'ball', 'tree', 'car', 'book', 'fish', 'bird', 'apple', 'house',
  'moon', 'star', 'rain', 'river', 'chair', 'table', 'pen', 'bag', 'milk', 'cake',
  'bus', 'hat', 'shoe', 'ring', 'boat', 'frog', 'bear', 'kite', 'hand', 'bell',
  'door', 'lamp', 'road', 'clock', 'stone', 'glass', 'plate', 'shirt', 'cloud', 'flower',
  'lion', 'tiger', 'queen', 'king', 'egg', 'nest', 'park', 'train', 'drum', 'garden',
];

const VERBS = [
  'run', 'jump', 'sit', 'eat', 'play', 'sing', 'read', 'walk', 'fly', 'swim',
  'clap', 'hop', 'sleep', 'cry', 'laugh', 'dance', 'write', 'draw', 'cook', 'drink',
  'wash', 'kick', 'throw', 'catch', 'climb', 'push', 'pull', 'talk', 'think', 'open',
];

const ADJECTIVES = [
  'big', 'small', 'tall', 'short', 'fast', 'slow', 'hot', 'cold', 'happy', 'sad',
  'old', 'new', 'round', 'soft', 'hard', 'red', 'blue', 'green', 'white', 'black',
  'long', 'thin', 'heavy', 'light', 'sweet', 'pretty', 'brave', 'kind', 'loud', 'quiet',
];

const OPPOSITES: [string, string][] = [
  ['big', 'small'], ['hot', 'cold'], ['tall', 'short'], ['fast', 'slow'], ['happy', 'sad'],
  ['up', 'down'], ['in', 'out'], ['open', 'close'], ['day', 'night'], ['light', 'dark'],
  ['old', 'new'], ['hard', 'soft'], ['long', 'short'], ['full', 'empty'], ['wet', 'dry'],
  ['clean', 'dirty'], ['loud', 'quiet'], ['thick', 'thin'], ['heavy', 'light'], ['strong', 'weak'],
  ['rich', 'poor'], ['near', 'far'], ['deep', 'shallow'], ['wide', 'narrow'], ['young', 'old'],
  ['push', 'pull'], ['come', 'go'], ['give', 'take'], ['laugh', 'cry'], ['start', 'stop'],
  ['win', 'lose'], ['teach', 'learn'], ['buy', 'sell'], ['ask', 'answer'], ['true', 'false'],
];

const REG_PLURALS: [string, string][] = [
  ['cat', 'cats'], ['dog', 'dogs'], ['ball', 'balls'], ['car', 'cars'], ['pen', 'pens'],
  ['bag', 'bags'], ['hat', 'hats'], ['cup', 'cups'], ['map', 'maps'], ['van', 'vans'],
  ['book', 'books'], ['tree', 'trees'], ['bird', 'birds'], ['star', 'stars'], ['bell', 'bells'],
  ['frog', 'frogs'], ['boat', 'boats'], ['chair', 'chairs'], ['shoe', 'shoes'], ['ring', 'rings'],
  ['kite', 'kites'], ['cake', 'cakes'], ['lamp', 'lamps'], ['door', 'doors'], ['cloud', 'clouds'],
];

const ES_PLURALS: [string, string][] = [
  ['box', 'boxes'], ['bus', 'buses'], ['dish', 'dishes'], ['watch', 'watches'], ['brush', 'brushes'],
  ['fox', 'foxes'], ['class', 'classes'], ['dress', 'dresses'], ['bench', 'benches'], ['match', 'matches'],
  ['kiss', 'kisses'], ['buzz', 'buzzes'], ['peach', 'peaches'], ['lunch', 'lunches'], ['witch', 'witches'],
  ['patch', 'patches'], ['glass', 'glasses'], ['cross', 'crosses'], ['batch', 'batches'], ['branch', 'branches'],
];

const IRR_PLURALS: [string, string][] = [
  ['child', 'children'], ['man', 'men'], ['woman', 'women'], ['mouse', 'mice'], ['foot', 'feet'],
  ['tooth', 'teeth'], ['goose', 'geese'], ['fish', 'fish'], ['sheep', 'sheep'], ['deer', 'deer'],
  ['ox', 'oxen'], ['person', 'people'], ['leaf', 'leaves'], ['knife', 'knives'], ['wife', 'wives'],
  ['life', 'lives'], ['half', 'halves'], ['wolf', 'wolves'], ['calf', 'calves'], ['shelf', 'shelves'],
  ['loaf', 'loaves'], ['thief', 'thieves'], ['elf', 'elves'], ['scarf', 'scarves'], ['dwarf', 'dwarves'],
];

const VERB_ACTIONS: Record<string, string> = {
  run: 'move fast with legs', jump: 'go up in the air', sit: 'rest on a chair',
  eat: 'put food in mouth', play: 'have fun', sing: 'make music with voice',
  read: 'look at words in a book', walk: 'move slowly', fly: 'move through the air',
  swim: 'move in water', clap: 'hit hands together', hop: 'jump on one foot',
  sleep: 'close eyes and rest', cry: 'tears from eyes', laugh: 'happy sound',
  dance: 'move body to music', write: 'make words with a pen', draw: 'make pictures',
  cook: 'make food', drink: 'swallow liquid', wash: 'clean with water',
  kick: 'hit with foot', throw: 'send in the air', catch: 'grab with hands',
  climb: 'go up high', push: 'press forward', pull: 'bring toward you',
  talk: 'say words', think: 'use your brain', open: 'make not closed',
};

const SENTENCES = [
  'I am a boy', 'She is a girl', 'The cat is big', 'He can run fast',
  'We go to school', 'I like my bag', 'The dog is brown', 'She has a doll',
  'This is a pen', 'That is my book', 'I have a red ball', 'The sun is bright',
  'We play in the park', 'Birds can fly', 'I love my mom', 'He is my friend',
  'She reads a book', 'We eat lunch', 'The flower is pink', 'My school is big',
  'I drink milk', 'Frogs can jump', 'I see a bird', 'We are friends', 'She sings a song',
  'The moon is round', 'I wash my hands', 'He draws a tree', 'They run in the park',
  'She likes to dance', 'I help my dad', 'We water the plants', 'The kite flies high',
  'He opens the door', 'I write my name',
];

const MISSING_TEMPLATES: { sent: string; ans: string; opts: string[] }[] = [
  { sent: 'I ___ a boy.', ans: 'am', opts: ['is', 'are', 'was'] },
  { sent: 'The cat ___ big.', ans: 'is', opts: ['am', 'are', 'was'] },
  { sent: 'She ___ run.', ans: 'can', opts: ['is', 'am', 'the'] },
  { sent: 'We go to ___.', ans: 'school', opts: ['run', 'big', 'red'] },
  { sent: 'I like my ___.', ans: 'bag', opts: ['run', 'big', 'is'] },
  { sent: 'The ___ is brown.', ans: 'dog', opts: ['run', 'big', 'is'] },
  { sent: 'She has a ___.', ans: 'doll', opts: ['run', 'big', 'is'] },
  { sent: 'This is a ___.', ans: 'pen', opts: ['run', 'big', 'is'] },
  { sent: 'I have a ___ ball.', ans: 'red', opts: ['run', 'pen', 'is'] },
  { sent: 'The sun is ___.', ans: 'bright', opts: ['run', 'pen', 'dog'] },
  { sent: 'We ___ in the park.', ans: 'play', opts: ['pen', 'dog', 'big'] },
  { sent: 'Birds can ___.', ans: 'fly', opts: ['pen', 'dog', 'big'] },
  { sent: 'I ___ my mom.', ans: 'love', opts: ['pen', 'dog', 'big'] },
  { sent: 'He is my ___.', ans: 'friend', opts: ['run', 'big', 'hot'] },
  { sent: 'She ___ a book.', ans: 'reads', opts: ['pen', 'dog', 'big'] },
  { sent: 'We eat ___.', ans: 'lunch', opts: ['run', 'big', 'pen'] },
  { sent: 'The flower is ___.', ans: 'pink', opts: ['run', 'eat', 'dog'] },
  { sent: 'My ___ is big.', ans: 'school', opts: ['run', 'eat', 'pink'] },
  { sent: 'I ___ milk.', ans: 'drink', opts: ['pen', 'dog', 'big'] },
  { sent: 'Frogs can ___.', ans: 'jump', opts: ['pen', 'dog', 'big'] },
  { sent: 'He ___ the door.', ans: 'opens', opts: ['pen', 'dog', 'big'] },
  { sent: 'We ___ friends.', ans: 'are', opts: ['am', 'is', 'was'] },
  { sent: 'She ___ a song.', ans: 'sings', opts: ['pen', 'dog', 'big'] },
  { sent: 'I ___ my name.', ans: 'write', opts: ['pen', 'dog', 'big'] },
  { sent: 'The ___ is hot.', ans: 'sun', opts: ['run', 'big', 'is'] },
];

const SIGHT_WORDS_LIST = [
  'the', 'is', 'a', 'and', 'to', 'in', 'it', 'he', 'she', 'we',
  'my', 'on', 'can', 'go', 'no', 'yes', 'am', 'at', 'do', 'not',
  'has', 'his', 'her', 'was', 'for', 'you', 'all', 'are', 'but', 'had',
  'one', 'our', 'see', 'two', 'big', 'like', 'said', 'they', 'this', 'with',
];

const WORD_FAMILIES: Record<string, string[]> = {
  '-at': ['cat', 'bat', 'hat', 'mat', 'rat', 'sat', 'fat', 'pat', 'flat'],
  '-an': ['can', 'fan', 'man', 'pan', 'ran', 'tan', 'van', 'plan'],
  '-ig': ['big', 'dig', 'fig', 'pig', 'wig', 'jig', 'twig'],
  '-og': ['dog', 'fog', 'hog', 'log', 'jog', 'frog'],
  '-ot': ['dot', 'got', 'hot', 'lot', 'not', 'pot', 'rot', 'trot'],
  '-un': ['bun', 'fun', 'gun', 'nun', 'run', 'sun', 'spun'],
  '-en': ['den', 'hen', 'men', 'pen', 'ten', 'when', 'then'],
  '-ip': ['dip', 'hip', 'lip', 'rip', 'sip', 'tip', 'zip', 'ship', 'drip'],
};

const RHYME_PAIRS: [string, string][] = [
  ['cat', 'hat'], ['dog', 'log'], ['pen', 'hen'], ['sun', 'fun'], ['ball', 'tall'],
  ['cake', 'lake'], ['rain', 'train'], ['ring', 'sing'], ['moon', 'spoon'], ['boat', 'coat'],
  ['star', 'car'], ['tree', 'bee'], ['kite', 'bite'], ['book', 'cook'], ['bell', 'shell'],
  ['fish', 'dish'], ['nail', 'tail'], ['bear', 'pear'], ['bat', 'mat'], ['pot', 'dot'],
];

const PASSAGES = [
  { text: 'The cat sat on the mat. It was a big cat.', questions: [
    { q: 'Where did the cat sit?', a: 'On the mat', opts: ['On the bed', 'On the tree'] },
    { q: 'Was the cat big or small?', a: 'Big', opts: ['Small', 'Tiny'] },
  ]},
  { text: 'The dog ran in the park. He played with a ball.', questions: [
    { q: 'Where did the dog run?', a: 'In the park', opts: ['In the house', 'In the school'] },
    { q: 'What did the dog play with?', a: 'A ball', opts: ['A stick', 'A bone'] },
  ]},
  { text: 'The bird sat on a tree. It sang a sweet song.', questions: [
    { q: 'Where did the bird sit?', a: 'On a tree', opts: ['On a wall', 'On a roof'] },
    { q: 'What did the bird do?', a: 'Sang a song', opts: ['Ate food', 'Flew away'] },
  ]},
  { text: 'Riya has a red bag. She takes it to school.', questions: [
    { q: 'What colour is the bag?', a: 'Red', opts: ['Blue', 'Green'] },
    { q: 'Where does Riya take it?', a: 'To school', opts: ['To the park', 'To the shop'] },
  ]},
  { text: 'The sun is hot. We drink cold water.', questions: [
    { q: 'How is the sun?', a: 'Hot', opts: ['Cold', 'Wet'] },
    { q: 'What do we drink?', a: 'Cold water', opts: ['Hot milk', 'Juice'] },
  ]},
  { text: 'Aarav likes to draw. He draws a big tree.', questions: [
    { q: 'What does Aarav like?', a: 'To draw', opts: ['To swim', 'To cook'] },
    { q: 'What does he draw?', a: 'A big tree', opts: ['A car', 'A fish'] },
  ]},
];

// ═══════════════════════════════════════════════════════════
// CHAPTER 1 — ALPHABET
// ═══════════════════════════════════════════════════════════

function genLetterMatch(p: GeneratorParams): CurriculumQuestion {
  const range = p.difficulty === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const letter = pick(range);
  const lower = letter.toLowerCase();
  const dir = p.difficulty === 'difficult' ? pick(['toLower', 'toUpper'] as const) : 'toLower';
  if (dir === 'toLower') {
    const dist = pickN(range.filter(l => l !== letter).map(l => l.toLowerCase()), p.optionCount - 1);
    return {
      id: uid(), chapter: 'alphabet', gameType: 'letter_match',
      signature: sig(['letter_match', letter, dir]),
      text: `What is the lowercase of "${letter}"?`,
      options: shuffle([lower, ...dist]), correctAnswer: lower,
    };
  }
  const dist = pickN(range.filter(l => l !== letter), p.optionCount - 1);
  return {
    id: uid(), chapter: 'alphabet', gameType: 'letter_match',
    signature: sig(['letter_match', letter, dir]),
    text: `What is the uppercase of "${lower}"?`,
    options: shuffle([letter, ...dist]), correctAnswer: letter,
  };
}

function genLetterOrder(p: GeneratorParams): CurriculumQuestion {
  const maxIdx = p.difficulty === 'easy' ? 9 : 24;
  const idx = randInt(0, maxIdx);
  const dir = p.difficulty === 'difficult' && randInt(0, 1) ? 'before' : 'after';
  if (dir === 'after') {
    const correct = ALPHA[idx + 1];
    const dist = pickN(ALPHA.filter(l => l !== correct), p.optionCount - 1);
    return {
      id: uid(), chapter: 'alphabet', gameType: 'letter_order',
      signature: sig(['letter_order', ALPHA[idx], dir]),
      text: `What letter comes after "${ALPHA[idx]}"?`,
      options: shuffle([correct, ...dist]), correctAnswer: correct,
    };
  }
  const correct = ALPHA[idx];
  const dist = pickN(ALPHA.filter(l => l !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'alphabet', gameType: 'letter_order',
    signature: sig(['letter_order', ALPHA[idx + 1], dir]),
    text: `What letter comes before "${ALPHA[idx + 1]}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genLetterCase(p: GeneratorParams): CurriculumQuestion {
  const letter = pick(ALPHA);
  const isUpper = randInt(0, 1) === 0;
  const display = isUpper ? letter : letter.toLowerCase();
  const correct = isUpper ? 'Uppercase' : 'Lowercase';
  return {
    id: uid(), chapter: 'alphabet', gameType: 'letter_case',
    signature: sig(['letter_case', display]),
    text: `Is "${display}" uppercase or lowercase?`,
    options: shuffle(['Uppercase', 'Lowercase']), correctAnswer: correct,
  };
}

function genLetterMissing(p: GeneratorParams): CurriculumQuestion {
  const startIdx = randInt(0, p.difficulty === 'easy' ? 6 : 20);
  const len = p.difficulty === 'easy' ? 5 : 7;
  const blankIdx = randInt(1, len - 2);
  const seq: string[] = [];
  let correct = '';
  for (let i = 0; i < len; i++) {
    const letter = ALPHA[startIdx + i] || '?';
    if (i === blankIdx) { seq.push('___'); correct = letter; } else seq.push(letter);
  }
  const dist = pickN(ALPHA.filter(l => l !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'alphabet', gameType: 'letter_missing',
    signature: sig(['letter_miss', startIdx, blankIdx]),
    text: `Find the missing letter:\n${seq.join('  ')}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genLetterSpot(p: GeneratorParams): CurriculumQuestion {
  const target = pick(ALPHA);
  const pool = pickN(ALPHA.filter(l => l !== target), 5);
  const insertAt = randInt(0, pool.length);
  pool.splice(insertAt, 0, target);
  const isMixed = p.difficulty !== 'easy';
  const display = pool.map(l => isMixed && randInt(0, 1) ? l.toLowerCase() : l).join('  ');
  return {
    id: uid(), chapter: 'alphabet', gameType: 'letter_spot',
    signature: sig(['letter_spot', target, insertAt]),
    text: `Find the letter "${target}" in:\n${display}`,
    options: shuffle(['Yes, it is there', 'No, it is not there']),
    correctAnswer: 'Yes, it is there',
  };
}

function genLetterTrace(p: GeneratorParams): CurriculumQuestion {
  const letter = pick(ALPHA);
  const lower = letter.toLowerCase();
  const strokes: Record<string, number> = {
    A: 3, B: 3, C: 1, D: 2, E: 4, F: 3, G: 2, H: 3, I: 3, J: 2,
    K: 3, L: 2, M: 4, N: 3, O: 1, P: 2, Q: 2, R: 3, S: 1, T: 2,
    U: 1, V: 2, W: 4, X: 2, Y: 3, Z: 3,
  };
  const count = strokes[letter] || 2;
  const correct = String(count);
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const w = String(randInt(1, 5));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'alphabet', gameType: 'letter_trace',
    signature: sig(['letter_trace', letter]),
    text: `How many strokes to write "${letter}" (${lower})?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: `Try writing "${letter}" in the air and count.`,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 2 — LETTER SOUNDS
// ═══════════════════════════════════════════════════════════

function genLetterSound(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const letter = pick(pool);
  const sound = LETTER_SOUNDS[letter];
  const dist = pickN(pool.filter(l => l !== letter), p.optionCount - 1);
  return {
    id: uid(), chapter: 'letter_sounds', gameType: 'letter_sound',
    signature: sig(['letter_sound', letter]),
    text: `Which letter makes the sound "${sound}"?`,
    options: shuffle([letter, ...dist]), correctAnswer: letter,
  };
}

function genBeginSound(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const letter = pick(pool.filter(l => BEGIN_SOUNDS[l]?.length));
  const word = pick(BEGIN_SOUNDS[letter]);
  const dist = pickN(pool.filter(l => l !== letter), p.optionCount - 1);
  return {
    id: uid(), chapter: 'letter_sounds', gameType: 'begin_sound',
    signature: sig(['begin_sound', word]),
    text: `"${word}" starts with which letter?`,
    options: shuffle([letter, ...dist]), correctAnswer: letter,
  };
}

function genSoundMatch(p: GeneratorParams): CurriculumQuestion {
  const letter = pick(ALPHA.filter(l => BEGIN_SOUNDS[l]?.length >= 2));
  const words = BEGIN_SOUNDS[letter];
  const correct = pick(words);
  const otherLetters = pickN(ALPHA.filter(l => l !== letter && BEGIN_SOUNDS[l]?.length), p.optionCount - 1);
  const dist = otherLetters.map(l => pick(BEGIN_SOUNDS[l]));
  return {
    id: uid(), chapter: 'letter_sounds', gameType: 'sound_match',
    signature: sig(['sound_match', correct, letter]),
    text: `Which word starts with the same sound as "${pick(words.filter(w => w !== correct))}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genRhymeMatch(p: GeneratorParams): CurriculumQuestion {
  const pair = pick(RHYME_PAIRS);
  const correct = pair[1];
  const dist = pickN(RHYME_PAIRS.filter(rp => rp[1] !== correct).map(rp => rp[1]), p.optionCount - 1);
  return {
    id: uid(), chapter: 'letter_sounds', gameType: 'rhyme_match',
    signature: sig(['rhyme', pair[0], pair[1]]),
    text: `What rhymes with "${pair[0]}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genSoundSort(p: GeneratorParams): CurriculumQuestion {
  const letter = pick(ALPHA.filter(l => BEGIN_SOUNDS[l]?.length >= 2));
  const words = BEGIN_SOUNDS[letter];
  const correct = pick(words);
  const otherLetters = pickN(ALPHA.filter(l => l !== letter && BEGIN_SOUNDS[l]?.length), p.optionCount - 1);
  const dist = otherLetters.map(l => pick(BEGIN_SOUNDS[l]));
  return {
    id: uid(), chapter: 'letter_sounds', gameType: 'sound_sort',
    signature: sig(['sound_sort', letter, correct]),
    text: `Which word starts with "${letter}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 3 — VOWELS
// ═══════════════════════════════════════════════════════════

function genFindVowel(p: GeneratorParams): CurriculumQuestion {
  const vowel = pick(VOWELS);
  const dist = pickN(CONSONANTS.filter(c => c !== vowel), p.optionCount - 1);
  return {
    id: uid(), chapter: 'vowels', gameType: 'find_vowel',
    signature: sig(['find_vowel', vowel, ...dist]),
    text: 'Which one is a vowel?',
    options: shuffle([vowel, ...dist]), correctAnswer: vowel,
  };
}

function genFillVowel(p: GeneratorParams): CurriculumQuestion {
  if (p.difficulty === 'easy') {
    const item = pick(CVC_WORDS);
    const blanked = item.word[0] + '_' + item.word[2];
    const dist = pickN(['a', 'e', 'i', 'o', 'u'].filter(v => v !== item.vowel), p.optionCount - 1);
    return {
      id: uid(), chapter: 'vowels', gameType: 'fill_vowel',
      signature: sig(['fill_vowel', item.word]),
      text: `Fill the vowel: "${blanked}" → ?`,
      options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel,
    };
  }
  const bank = p.difficulty === 'intermediate' ? LONGER_WORDS.slice(0, 15) : LONGER_WORDS;
  const item = pick(bank);
  const chars = item.word.split('');
  chars[item.vIdx] = '_';
  const blanked = chars.join('');
  const dist = pickN(['a', 'e', 'i', 'o', 'u'].filter(v => v !== item.vowel), p.optionCount - 1);
  return {
    id: uid(), chapter: 'vowels', gameType: 'fill_vowel',
    signature: sig(['fill_vowel', item.word, item.vIdx]),
    text: `Fill the vowel: "${blanked}" → ?`,
    options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel,
  };
}

function genClassifyLetter(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const letter = pick(pool);
  const isVowel = VOWELS.includes(letter);
  const correct = isVowel ? 'Vowel' : 'Consonant';
  return {
    id: uid(), chapter: 'vowels', gameType: 'classify_letter',
    signature: sig(['classify', letter]),
    text: `Is "${letter}" a Vowel or Consonant?`,
    options: shuffle(['Vowel', 'Consonant']), correctAnswer: correct,
  };
}

function genVowelWord(p: GeneratorParams): CurriculumQuestion {
  const vowelLower = pick(['a', 'e', 'i', 'o', 'u']);
  const pool = [...CVC_WORDS, ...CCVC_WORDS].filter(w => w.vowel === vowelLower);
  if (pool.length === 0) {
    return genFillVowel(p); // fallback
  }
  const correct = pick(pool).word;
  const others = [...CVC_WORDS, ...CCVC_WORDS].filter(w => w.vowel !== vowelLower).map(w => w.word);
  const dist = pickN(others, p.optionCount - 1);
  return {
    id: uid(), chapter: 'vowels', gameType: 'vowel_word',
    signature: sig(['vowel_word', vowelLower, correct]),
    text: `Which word has the vowel "${vowelLower}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genVowelCount(p: GeneratorParams): CurriculumQuestion {
  const word = pick([...LONGER_WORDS.map(w => w.word), ...SENTENCES.slice(0, 10)]);
  const count = word.toLowerCase().split('').filter(c => 'aeiou'.includes(c)).length;
  const correct = String(count);
  const dist: string[] = [];
  while (dist.length < p.optionCount - 1) {
    const w = String(randInt(Math.max(0, count - 2), count + 3));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return {
    id: uid(), chapter: 'vowels', gameType: 'vowel_count',
    signature: sig(['vowel_count', word]),
    text: `How many vowels in "${word}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
    hint: 'Vowels are: a, e, i, o, u.',
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 4 — NOUNS
// ═══════════════════════════════════════════════════════════

function genFindNoun(p: GeneratorParams): CurriculumQuestion {
  const noun = pick(NOUNS);
  const dist = pickN([...VERBS, ...ADJECTIVES].filter(w => w !== noun), p.optionCount - 1);
  return {
    id: uid(), chapter: 'nouns', gameType: 'find_noun',
    signature: sig(['find_noun', noun, ...dist]),
    text: 'Which word is a noun (naming word)?',
    options: shuffle([noun, ...dist]), correctAnswer: noun,
  };
}

function genNounHunt(p: GeneratorParams): CurriculumQuestion {
  const isNoun = randInt(0, 1) === 1;
  const word = isNoun ? pick(NOUNS) : pick([...VERBS, ...ADJECTIVES]);
  const correct = isNoun ? 'Yes' : 'No';
  return {
    id: uid(), chapter: 'nouns', gameType: 'noun_hunt',
    signature: sig(['noun_hunt', word]),
    text: `Is "${word}" a noun?`,
    options: shuffle(['Yes', 'No']), correctAnswer: correct,
  };
}

function genNounSort(p: GeneratorParams): CurriculumQuestion {
  const CATEGORIES: Record<string, string[]> = {
    Person: ['boy', 'girl', 'teacher', 'doctor', 'farmer', 'king', 'queen', 'mother', 'father', 'baby'],
    Animal: ['cat', 'dog', 'lion', 'tiger', 'bird', 'fish', 'frog', 'bear', 'deer', 'hen'],
    Thing: ['ball', 'book', 'pen', 'bag', 'car', 'bus', 'chair', 'table', 'lamp', 'kite'],
    Place: ['school', 'park', 'house', 'garden', 'shop', 'market', 'river', 'road', 'farm', 'city'],
  };
  const cat = pick(Object.keys(CATEGORIES));
  const word = pick(CATEGORIES[cat]);
  const correct = cat;
  const dist = Object.keys(CATEGORIES).filter(c => c !== cat);
  return {
    id: uid(), chapter: 'nouns', gameType: 'noun_sort',
    signature: sig(['noun_sort', word, cat]),
    text: `"${word}" is a noun. What type?\n(Person, Animal, Thing, or Place)`,
    options: shuffle([correct, ...dist.slice(0, p.optionCount - 1)]), correctAnswer: correct,
  };
}

function genNounSentence(p: GeneratorParams): CurriculumQuestion {
  const noun = pick(NOUNS);
  const templates = [
    `The ___ is big.`, `I see a ___.`, `The ___ can run.`,
    `My ___ is red.`, `She has a ___.`, `The ___ is on the table.`,
  ];
  const sent = pick(templates);
  const dist = pickN(VERBS.slice(0, 10), p.optionCount - 1);
  return {
    id: uid(), chapter: 'nouns', gameType: 'noun_sentence',
    signature: sig(['noun_sent', noun, sent]),
    text: `Fill the noun:\n${sent}`,
    options: shuffle([noun, ...dist]), correctAnswer: noun,
  };
}

function genNounCategory(p: GeneratorParams): CurriculumQuestion {
  const odd = pick(VERBS);
  const nouns = pickN(NOUNS, p.optionCount - 1);
  return {
    id: uid(), chapter: 'nouns', gameType: 'noun_category',
    signature: sig(['noun_cat', odd, ...nouns]),
    text: 'Which word is NOT a noun?',
    options: shuffle([odd, ...nouns]), correctAnswer: odd,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 5 — VERBS
// ═══════════════════════════════════════════════════════════

function genFindVerb(p: GeneratorParams): CurriculumQuestion {
  const verb = pick(VERBS);
  const dist = pickN([...NOUNS, ...ADJECTIVES].filter(w => w !== verb), p.optionCount - 1);
  return {
    id: uid(), chapter: 'verbs', gameType: 'find_verb',
    signature: sig(['find_verb', verb, ...dist]),
    text: 'Which word is a verb (action word)?',
    options: shuffle([verb, ...dist]), correctAnswer: verb,
  };
}

function genActionMatch(p: GeneratorParams): CurriculumQuestion {
  const verbsWithActions = VERBS.filter(v => VERB_ACTIONS[v]);
  const verb = pick(verbsWithActions);
  const desc = VERB_ACTIONS[verb];
  const dist = pickN(verbsWithActions.filter(v => v !== verb), p.optionCount - 1);
  return {
    id: uid(), chapter: 'verbs', gameType: 'action_match',
    signature: sig(['action_match', verb]),
    text: `Which word means "${desc}"?`,
    options: shuffle([verb, ...dist]), correctAnswer: verb,
  };
}

function genVerbOrNot(p: GeneratorParams): CurriculumQuestion {
  const isVerb = randInt(0, 1) === 1;
  const word = isVerb ? pick(VERBS) : pick([...NOUNS, ...ADJECTIVES]);
  const correct = isVerb ? 'Yes' : 'No';
  return {
    id: uid(), chapter: 'verbs', gameType: 'verb_or_not',
    signature: sig(['verb_or_not', word]),
    text: `Is "${word}" a verb (action word)?`,
    options: shuffle(['Yes', 'No']), correctAnswer: correct,
  };
}

function genVerbFill(p: GeneratorParams): CurriculumQuestion {
  const verb = pick(VERBS);
  const templates = [
    `I ___ every day.`, `She can ___ fast.`, `We like to ___.`,
    `He will ___ now.`, `They ___ in the park.`,
  ];
  const sent = pick(templates);
  const dist = pickN(NOUNS.slice(0, 10), p.optionCount - 1);
  return {
    id: uid(), chapter: 'verbs', gameType: 'verb_fill',
    signature: sig(['verb_fill', verb, sent]),
    text: `Fill the verb:\n${sent}`,
    options: shuffle([verb, ...dist]), correctAnswer: verb,
  };
}

function genVerbPicture(p: GeneratorParams): CurriculumQuestion {
  const ACTION_EMOJIS: Record<string, string> = {
    run: '🏃', jump: '🤸', swim: '🏊', dance: '💃', cook: '🧑‍🍳',
    write: '✍️', read: '📖', eat: '🍽️', sleep: '😴', sing: '🎤',
    fly: '✈️', climb: '🧗', kick: '⚽', draw: '🎨', drink: '🥤',
  };
  const keys = Object.keys(ACTION_EMOJIS);
  const verb = pick(keys);
  const emoji = ACTION_EMOJIS[verb];
  const dist = pickN(keys.filter(k => k !== verb), p.optionCount - 1);
  return {
    id: uid(), chapter: 'verbs', gameType: 'verb_picture',
    signature: sig(['verb_pic', verb]),
    text: `${emoji} What action is this?`,
    options: shuffle([verb, ...dist]), correctAnswer: verb,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 6 — OPPOSITES
// ═══════════════════════════════════════════════════════════

function genMatchOpposite(p: GeneratorParams): CurriculumQuestion {
  const pair = pick(OPPOSITES);
  const dir = randInt(0, 1);
  const word = pair[dir];
  const correct = pair[1 - dir];
  const allWords = OPPOSITES.map(pp => pp[1 - dir]).filter(w => w !== correct);
  const dist = pickN(allWords, p.optionCount - 1);
  return {
    id: uid(), chapter: 'opposites', gameType: 'match_opposite',
    signature: sig(['match_opp', word, correct]),
    text: `What is the opposite of "${word}"?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genFindOpposite(p: GeneratorParams): CurriculumQuestion {
  const pair = pick(OPPOSITES);
  const correct = pair[1];
  const allWords = OPPOSITES.map(pp => pp[1]).filter(w => w !== correct);
  const dist = pickN(allWords, p.optionCount - 1);
  return {
    id: uid(), chapter: 'opposites', gameType: 'find_opposite',
    signature: sig(['find_opp', pair[0]]),
    text: `Pick the opposite of "${pair[0]}":`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genCompleteOpposite(p: GeneratorParams): CurriculumQuestion {
  const pair = pick(OPPOSITES);
  const correct = pair[1];
  const allWords = OPPOSITES.map(pp => pp[1]).filter(w => w !== correct);
  const dist = pickN(allWords, p.optionCount - 1);
  return {
    id: uid(), chapter: 'opposites', gameType: 'complete_opposite',
    signature: sig(['comp_opp', pair[0]]),
    text: `"${pair[0]}" is the opposite of ___.`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genOddOpposite(p: GeneratorParams): CurriculumQuestion {
  const pairs = pickN(OPPOSITES, 3);
  const oddPair = pairs[2];
  const word1 = pairs[0][0];
  const word2 = pairs[0][1];
  const word3 = pairs[1][0];
  const word4 = pairs[1][1];
  const odd = oddPair[0];
  const correct = odd;
  const options = [word1, word2, word3, word4, odd].slice(0, p.optionCount);
  return {
    id: uid(), chapter: 'opposites', gameType: 'odd_opposite',
    signature: sig(['odd_opp', word1, word2, odd]),
    text: `Which word does NOT have its opposite here?\n${word1}–${word2}, ${word3}–${word4}, ${odd}–?`,
    options: shuffle(options), correctAnswer: correct,
  };
}

function genOppositeSentence(p: GeneratorParams): CurriculumQuestion {
  const pair = pick(OPPOSITES);
  const templates = [
    `The elephant is ___. The mouse is ${pair[0]}.`,
    `It was not ${pair[0]}. It was ___.`,
    `The book is ${pair[0]} but the feather is ___.`,
  ];
  const correct = pair[1];
  const dist = pickN(OPPOSITES.map(pp => pp[1]).filter(w => w !== correct), p.optionCount - 1);
  return {
    id: uid(), chapter: 'opposites', gameType: 'opposite_sentence',
    signature: sig(['opp_sent', pair[0], pair[1]]),
    text: pick(templates),
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 7 — PLURALS
// ═══════════════════════════════════════════════════════════

function genPluralMaker(p: GeneratorParams): CurriculumQuestion {
  let pair: [string, string];
  if (p.difficulty === 'easy') pair = pick(REG_PLURALS);
  else if (p.difficulty === 'intermediate') pair = pick([...REG_PLURALS, ...ES_PLURALS]);
  else pair = pick([...REG_PLURALS, ...ES_PLURALS, ...IRR_PLURALS]);
  const [sing, plur] = pair;
  const wrongs = [`${sing}s`, `${sing}es`, `${sing}ies`, `${sing}en`, `${sing}`].filter(w => w !== plur);
  const dist = pickN(wrongs, p.optionCount - 1);
  return {
    id: uid(), chapter: 'plurals', gameType: 'plural_maker',
    signature: sig(['plural_maker', sing]),
    text: `What is the plural of "${sing}"?`,
    options: shuffle([plur, ...dist]), correctAnswer: plur,
  };
}

function genPluralPick(p: GeneratorParams): CurriculumQuestion {
  const all = [...REG_PLURALS, ...ES_PLURALS, ...(p.difficulty === 'difficult' ? IRR_PLURALS : [])];
  const pair = pick(all);
  const correct = pair[1];
  const wrongPairs = pickN(all.filter(pp => pp[1] !== correct), p.optionCount - 1);
  const dist = wrongPairs.map(pp => pp[1]);
  return {
    id: uid(), chapter: 'plurals', gameType: 'plural_pick',
    signature: sig(['plural_pick', pair[0]]),
    text: `One ${pair[0]}, many…?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genPluralSort(p: GeneratorParams): CurriculumQuestion {
  const all = [...REG_PLURALS, ...ES_PLURALS];
  const pair = pick(all);
  const word = pick([pair[0], pair[1]]);
  const isPlural = word === pair[1];
  const correct = isPlural ? 'Plural (many)' : 'Singular (one)';
  return {
    id: uid(), chapter: 'plurals', gameType: 'plural_sort',
    signature: sig(['plural_sort', word]),
    text: `Is "${word}" singular or plural?`,
    options: shuffle(['Singular (one)', 'Plural (many)']), correctAnswer: correct,
  };
}

function genPluralMatch(p: GeneratorParams): CurriculumQuestion {
  const all = [...REG_PLURALS, ...ES_PLURALS, ...(p.difficulty !== 'easy' ? IRR_PLURALS : [])];
  const pair = pick(all);
  const correct = pair[0];
  const dist = pickN(all.filter(pp => pp[0] !== correct).map(pp => pp[0]), p.optionCount - 1);
  return {
    id: uid(), chapter: 'plurals', gameType: 'plural_match',
    signature: sig(['plural_match', pair[1]]),
    text: `"${pair[1]}" is the plural of?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genPluralFill(p: GeneratorParams): CurriculumQuestion {
  const all = [...REG_PLURALS, ...ES_PLURALS, ...(p.difficulty === 'difficult' ? IRR_PLURALS : [])];
  const pair = pick(all);
  const templates = [
    `I have many ___.`, `There are five ___.`, `Look at those ___!`,
  ];
  const correct = pair[1];
  const dist = pickN(all.filter(pp => pp[1] !== correct).map(pp => pp[1]), p.optionCount - 1);
  return {
    id: uid(), chapter: 'plurals', gameType: 'plural_fill',
    signature: sig(['plural_fill', pair[0], pair[1]]),
    text: `Fill the plural of "${pair[0]}":\n${pick(templates)}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 8 — SENTENCE BUILDING
// ═══════════════════════════════════════════════════════════

function genWordOrder(p: GeneratorParams): CurriculumQuestion {
  const sentence = pick(SENTENCES);
  const words = sentence.split(' ');
  const wrongs: string[] = [];
  for (let i = 0; i < 10 && wrongs.length < p.optionCount - 1; i++) {
    const jumbled = shuffle(words).join(' ');
    if (jumbled !== sentence && !wrongs.includes(jumbled)) wrongs.push(jumbled);
  }
  while (wrongs.length < p.optionCount - 1) wrongs.push(shuffle(words).reverse().join(' '));
  return {
    id: uid(), chapter: 'sentences', gameType: 'word_order',
    signature: sig(['word_order', sentence]),
    text: `Which sentence is in the right order?\n(Words: ${shuffle(words).join(', ')})`,
    options: shuffle([sentence, ...wrongs.slice(0, p.optionCount - 1)]), correctAnswer: sentence,
  };
}

function genMissingWord(p: GeneratorParams): CurriculumQuestion {
  const tmpl = pick(MISSING_TEMPLATES);
  const dist = pickN(tmpl.opts, p.optionCount - 1);
  return {
    id: uid(), chapter: 'sentences', gameType: 'missing_word',
    signature: sig(['missing_word', tmpl.sent, tmpl.ans]),
    text: tmpl.sent, options: shuffle([tmpl.ans, ...dist]), correctAnswer: tmpl.ans,
  };
}

function genSentenceFix(p: GeneratorParams): CurriculumQuestion {
  const sentence = pick(SENTENCES);
  const words = sentence.split(' ');
  const wrongs: string[] = [];
  for (let i = 0; i < 10 && wrongs.length < p.optionCount - 1; i++) {
    const copy = [...words];
    const swapI = randInt(0, copy.length - 2);
    [copy[swapI], copy[swapI + 1]] = [copy[swapI + 1], copy[swapI]];
    const bad = copy.join(' ');
    if (bad !== sentence && !wrongs.includes(bad)) wrongs.push(bad);
  }
  while (wrongs.length < p.optionCount - 1) wrongs.push(words.reverse().join(' '));
  return {
    id: uid(), chapter: 'sentences', gameType: 'sentence_fix',
    signature: sig(['sentence_fix', sentence]),
    text: 'Which sentence is correct?',
    options: shuffle([sentence, ...wrongs.slice(0, p.optionCount - 1)]), correctAnswer: sentence,
  };
}

function genSentenceBuild(p: GeneratorParams): CurriculumQuestion {
  const noun = pick(NOUNS);
  const verb = pick(VERBS);
  const adj = pick(ADJECTIVES);
  const patterns = [
    { sentence: `The ${noun} is ${adj}.`, label: `The / ${noun} / is / ${adj}` },
    { sentence: `The ${adj} ${noun} can ${verb}.`, label: `The / ${adj} / ${noun} / can / ${verb}` },
    { sentence: `I ${verb} a ${noun}.`, label: `I / ${verb} / a / ${noun}` },
  ];
  const pat = pick(patterns);
  const correct = pat.sentence;
  const wrongs = [
    `${adj} the ${noun} is.`, `${verb} the ${noun} ${adj}.`, `is ${noun} the ${adj}.`,
  ].filter(w => w !== correct).slice(0, p.optionCount - 1);
  return {
    id: uid(), chapter: 'sentences', gameType: 'sentence_build',
    signature: sig(['sent_build', noun, verb, adj]),
    text: `Build the right sentence from:\n${pat.label}`,
    options: shuffle([correct, ...wrongs]), correctAnswer: correct,
  };
}

function genSentenceMatch(p: GeneratorParams): CurriculumQuestion {
  const QA: { q: string; a: string }[] = [
    { q: 'What is your name?', a: 'My name is ___.' },
    { q: 'How are you?', a: 'I am fine.' },
    { q: 'Where do you live?', a: 'I live in ___.' },
    { q: 'What colour is the sky?', a: 'The sky is blue.' },
    { q: 'Can birds fly?', a: 'Yes, birds can fly.' },
    { q: 'Do fish swim?', a: 'Yes, fish can swim.' },
    { q: 'Is the sun hot?', a: 'Yes, the sun is hot.' },
    { q: 'Who teaches you?', a: 'My teacher.' },
  ];
  const pair = pick(QA);
  const correct = pair.a;
  const dist = pickN(QA.filter(pp => pp.a !== correct).map(pp => pp.a), p.optionCount - 1);
  return {
    id: uid(), chapter: 'sentences', gameType: 'sentence_match',
    signature: sig(['sent_match', pair.q]),
    text: `Match the answer:\n"${pair.q}"`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// CHAPTER 9 — BASIC READING
// ═══════════════════════════════════════════════════════════

function genCvcRead(p: GeneratorParams): CurriculumQuestion {
  const pool = p.difficulty === 'easy' ? CVC_WORDS : [...CVC_WORDS, ...CCVC_WORDS];
  const item = pick(pool);
  const correct = item.word;
  const dist = pickN(pool.filter(w => w.word !== correct).map(w => w.word), p.optionCount - 1);
  return {
    id: uid(), chapter: 'reading', gameType: 'cvc_read',
    signature: sig(['cvc_read', correct]),
    text: `Read this word and pick it:\n"${correct.toUpperCase()}"`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genSightWord(p: GeneratorParams): CurriculumQuestion {
  const word = pick(SIGHT_WORDS_LIST);
  const reversed = word.split('').reverse().join('');
  const near = word.length > 2 ? word.slice(0, -1) + pick('aeiou'.split('')) : word + 's';
  const dist = pickN([reversed, near, ...SIGHT_WORDS_LIST.filter(w => w !== word)].filter(w => w !== word), p.optionCount - 1);
  return {
    id: uid(), chapter: 'reading', gameType: 'sight_word',
    signature: sig(['sight_word', word]),
    text: `Which is the correct spelling of the word you hear?\n(Word: "${word}")`,
    options: shuffle([word, ...dist]), correctAnswer: word,
  };
}

function genWordMeaning(p: GeneratorParams): CurriculumQuestion {
  const MEANINGS: Record<string, string> = {
    big: 'large in size', small: 'not big', fast: 'moving quickly', happy: 'feeling joy',
    sad: 'feeling unhappy', run: 'move quickly on legs', eat: 'take food', read: 'look at words',
    hot: 'very warm', cold: 'very cool', tall: 'high', bird: 'animal that flies',
    fish: 'lives in water', rain: 'water from sky', moon: 'shines at night',
  };
  const keys = Object.keys(MEANINGS);
  const word = pick(keys);
  const correct = MEANINGS[word];
  const dist = pickN(keys.filter(k => k !== word).map(k => MEANINGS[k]), p.optionCount - 1);
  return {
    id: uid(), chapter: 'reading', gameType: 'word_meaning',
    signature: sig(['word_meaning', word]),
    text: `What does "${word}" mean?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genPassageQuestion(p: GeneratorParams): CurriculumQuestion {
  const passage = pick(PASSAGES);
  const qData = pick(passage.questions);
  const correct = qData.a;
  const dist = qData.opts.slice(0, p.optionCount - 1);
  return {
    id: uid(), chapter: 'reading', gameType: 'passage_question',
    signature: sig(['passage_q', passage.text.slice(0, 20), qData.q]),
    text: `📖 Read:\n"${passage.text}"\n\n${qData.q}`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

function genWordFamily(p: GeneratorParams): CurriculumQuestion {
  const families = Object.keys(WORD_FAMILIES);
  const family = pick(families);
  const words = WORD_FAMILIES[family];
  const correct = pick(words);
  const otherFamilies = pickN(families.filter(f => f !== family), p.optionCount - 1);
  const dist = otherFamilies.map(f => pick(WORD_FAMILIES[f]));
  return {
    id: uid(), chapter: 'reading', gameType: 'word_family',
    signature: sig(['word_family', family, correct]),
    text: `Which word belongs to the "${family}" family?`,
    options: shuffle([correct, ...dist]), correctAnswer: correct,
  };
}

// ═══════════════════════════════════════════════════════════
// REGISTRY + PUBLIC API
// ═══════════════════════════════════════════════════════════

type CurrGenFn = (p: GeneratorParams) => CurriculumQuestion;

export const ENGLISH_GENERATORS: Record<string, CurrGenFn> = {
  // Alphabet
  letter_match: genLetterMatch, letter_order: genLetterOrder,
  letter_case: genLetterCase, letter_missing: genLetterMissing,
  letter_spot: genLetterSpot, letter_trace: genLetterTrace,
  // Letter Sounds
  letter_sound: genLetterSound, begin_sound: genBeginSound,
  sound_match: genSoundMatch, rhyme_match: genRhymeMatch, sound_sort: genSoundSort,
  // Vowels
  find_vowel: genFindVowel, fill_vowel: genFillVowel,
  classify_letter: genClassifyLetter, vowel_word: genVowelWord, vowel_count: genVowelCount,
  // Nouns
  find_noun: genFindNoun, noun_hunt: genNounHunt,
  noun_sort: genNounSort, noun_sentence: genNounSentence, noun_category: genNounCategory,
  // Verbs
  find_verb: genFindVerb, action_match: genActionMatch,
  verb_or_not: genVerbOrNot, verb_fill: genVerbFill, verb_picture: genVerbPicture,
  // Opposites
  match_opposite: genMatchOpposite, find_opposite: genFindOpposite,
  complete_opposite: genCompleteOpposite, odd_opposite: genOddOpposite,
  opposite_sentence: genOppositeSentence,
  // Plurals
  plural_maker: genPluralMaker, plural_pick: genPluralPick,
  plural_sort: genPluralSort, plural_match: genPluralMatch, plural_fill: genPluralFill,
  // Sentences
  word_order: genWordOrder, missing_word: genMissingWord,
  sentence_fix: genSentenceFix, sentence_build: genSentenceBuild, sentence_match: genSentenceMatch,
  // Reading
  cvc_read: genCvcRead, sight_word: genSightWord,
  word_meaning: genWordMeaning, passage_question: genPassageQuestion, word_family: genWordFamily,
};

/**
 * Generate a batch of curriculum English questions.
 */
export function generateEnglishBatch(
  gameTypeId: string,
  params: GeneratorParams,
  count: number,
  usedSignatures: Set<string>,
): CurriculumQuestion[] {
  const gen = ENGLISH_GENERATORS[gameTypeId];
  if (!gen) {
    console.warn(`[EnglishGen] No curriculum generator for: ${gameTypeId}`);
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

/** All registered English game type IDs */
export function allEnglishGameTypes(): string[] {
  return Object.keys(ENGLISH_GENERATORS);
}
