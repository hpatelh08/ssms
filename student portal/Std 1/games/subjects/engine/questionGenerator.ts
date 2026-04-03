/**
 * Question Generator Engine
 * =========================
 * Parametric generators for all 36 game types (18 English + 18 Maths).
 * Each generator produces one random Question; the orchestrator
 * calls it repeatedly until 25 unique questions are collected.
 */

import { Difficulty, Question } from './types';

// ── Utilities ──────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return shuffle(arr).slice(0, Math.min(n, arr.length)); }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function uid(): string { return Math.random().toString(36).slice(2, 9); }
function optCount(d: Difficulty): number { return d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5; }

// ── Word Banks ─────────────────────────────────────────────

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS_U = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS_U = ALPHA.filter(l => !VOWELS_U.includes(l));

const LETTER_SOUNDS: Record<string, string> = {
  A: 'æ (apple)', B: 'buh (ball)', C: 'kuh (cat)', D: 'duh (dog)', E: 'eh (egg)',
  F: 'fuh (fan)', G: 'guh (goat)', H: 'huh (hat)', I: 'ih (igloo)', J: 'juh (jam)',
  K: 'kuh (kite)', L: 'luh (lamp)', M: 'muh (mat)', N: 'nuh (net)', O: 'oh (orange)',
  P: 'puh (pen)', Q: 'kwuh (queen)', R: 'ruh (run)', S: 'suh (sun)', T: 'tuh (top)',
  U: 'uh (umbrella)', V: 'vuh (van)', W: 'wuh (web)', X: 'ks (box)', Y: 'yuh (yak)', Z: 'zuh (zip)',
};

const NOUNS = ['cat','dog','bird','fish','cow','hen','duck','ball','book','pen','bag','cup','box',
  'bed','hat','mat','fan','pot','jar','key','toy','kite','tree','car','bus','sun','moon','star',
  'ring','bell','door','cake','egg','milk','rice','boy','girl','baby','king','doll'];

const VERBS = ['run','jump','sit','eat','play','sing','read','walk','fly','swim','clap','hop',
  'sleep','cry','laugh','dance','write','draw','cook','drink','wash','kick','throw','catch','climb'];

const ADJECTIVES = ['big','small','hot','cold','tall','short','fast','slow','old','new','good',
  'bad','happy','sad','red','blue','green','white','black','pink','wet','dry','long','fat','thin'];

const OPPOSITES: [string, string][] = [
  ['big','small'],['hot','cold'],['tall','short'],['fast','slow'],['old','new'],
  ['good','bad'],['happy','sad'],['wet','dry'],['up','down'],['in','out'],
  ['day','night'],['open','close'],['come','go'],['on','off'],['hard','soft'],
  ['light','dark'],['full','empty'],['clean','dirty'],['near','far'],['thick','thin'],
  ['sweet','sour'],['right','left'],['loud','quiet'],['black','white'],['long','short'],
];

const CVC_WORDS: { word: string; vowel: string }[] = [
  {word:'cat',vowel:'a'},{word:'bat',vowel:'a'},{word:'hat',vowel:'a'},{word:'mat',vowel:'a'},
  {word:'rat',vowel:'a'},{word:'fan',vowel:'a'},{word:'man',vowel:'a'},{word:'can',vowel:'a'},
  {word:'pan',vowel:'a'},{word:'bag',vowel:'a'},{word:'bed',vowel:'e'},{word:'red',vowel:'e'},
  {word:'pen',vowel:'e'},{word:'hen',vowel:'e'},{word:'ten',vowel:'e'},{word:'net',vowel:'e'},
  {word:'set',vowel:'e'},{word:'wet',vowel:'e'},{word:'big',vowel:'i'},{word:'pig',vowel:'i'},
  {word:'dig',vowel:'i'},{word:'pin',vowel:'i'},{word:'bin',vowel:'i'},{word:'tin',vowel:'i'},
  {word:'sit',vowel:'i'},{word:'hit',vowel:'i'},{word:'bit',vowel:'i'},{word:'fit',vowel:'i'},
  {word:'hot',vowel:'o'},{word:'pot',vowel:'o'},{word:'dot',vowel:'o'},{word:'got',vowel:'o'},
  {word:'lot',vowel:'o'},{word:'box',vowel:'o'},{word:'fox',vowel:'o'},{word:'hop',vowel:'o'},
  {word:'top',vowel:'o'},{word:'mop',vowel:'o'},{word:'cup',vowel:'u'},{word:'pup',vowel:'u'},
  {word:'bus',vowel:'u'},{word:'sun',vowel:'u'},{word:'run',vowel:'u'},{word:'fun',vowel:'u'},
  {word:'gun',vowel:'u'},{word:'bun',vowel:'u'},{word:'nut',vowel:'u'},{word:'hut',vowel:'u'},
  {word:'cut',vowel:'u'},{word:'but',vowel:'u'},
];

const LONGER_WORDS: { word: string; vIdx: number; vowel: string }[] = [
  {word:'apple',vIdx:0,vowel:'a'},{word:'bell',vIdx:1,vowel:'e'},{word:'cake',vIdx:1,vowel:'a'},
  {word:'fish',vIdx:1,vowel:'i'},{word:'kite',vIdx:1,vowel:'i'},{word:'nose',vIdx:1,vowel:'o'},
  {word:'tree',vIdx:2,vowel:'e'},{word:'blue',vIdx:2,vowel:'u'},{word:'frog',vIdx:2,vowel:'o'},
  {word:'drum',vIdx:2,vowel:'u'},{word:'ship',vIdx:2,vowel:'i'},{word:'ring',vIdx:1,vowel:'i'},
  {word:'star',vIdx:2,vowel:'a'},{word:'moon',vIdx:1,vowel:'o'},{word:'door',vIdx:1,vowel:'o'},
  {word:'duck',vIdx:1,vowel:'u'},{word:'lamp',vIdx:1,vowel:'a'},{word:'milk',vIdx:1,vowel:'i'},
  {word:'nest',vIdx:1,vowel:'e'},{word:'pink',vIdx:1,vowel:'i'},{word:'rain',vIdx:1,vowel:'a'},
  {word:'sock',vIdx:1,vowel:'o'},{word:'tent',vIdx:1,vowel:'e'},{word:'wing',vIdx:1,vowel:'i'},
  {word:'fern',vIdx:1,vowel:'e'},
];

const REG_PLURALS: [string,string][] = [
  ['cat','cats'],['dog','dogs'],['ball','balls'],['book','books'],['pen','pens'],
  ['bag','bags'],['cup','cups'],['hat','hats'],['toy','toys'],['car','cars'],
  ['bird','birds'],['tree','trees'],['star','stars'],['egg','eggs'],['key','keys'],
  ['ring','rings'],['kite','kites'],['bell','bells'],['girl','girls'],['bed','beds'],
  ['fan','fans'],['pot','pots'],['mat','mats'],['jar','jars'],['door','doors'],
];

const ES_PLURALS: [string,string][] = [
  ['box','boxes'],['bus','buses'],['dish','dishes'],['wish','wishes'],['brush','brushes'],
  ['class','classes'],['glass','glasses'],['dress','dresses'],['fox','foxes'],['watch','watches'],
  ['match','matches'],['bench','benches'],['peach','peaches'],['lunch','lunches'],['patch','patches'],
  ['kiss','kisses'],['buzz','buzzes'],['pass','passes'],['miss','misses'],['loss','losses'],
  ['boss','bosses'],['moss','mosses'],['fuss','fusses'],['hutch','hutches'],['ditch','ditches'],
];

const IRR_PLURALS: [string,string][] = [
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

// ── English Generators ─────────────────────────────────────

function genLetterMatch(d: Difficulty): Question {
  const range = d === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const n = optCount(d);
  const letter = pick(range);
  const lower = letter.toLowerCase();
  const direction = d === 'difficult' ? randInt(0, 1) : 0;
  if (direction === 0) {
    const dist = pickN(range.filter(l => l !== letter).map(l => l.toLowerCase()), n - 1);
    return { id: `lm_${uid()}`, text: `What is the lowercase of "${letter}"?`, options: shuffle([lower, ...dist]), correctAnswer: lower };
  }
  const dist = pickN(range.filter(l => l !== letter), n - 1);
  return { id: `lm_${uid()}`, text: `What is the uppercase of "${lower}"?`, options: shuffle([letter, ...dist]), correctAnswer: letter };
}

function genLetterOrder(d: Difficulty): Question {
  const max = d === 'easy' ? 9 : 25;
  const idx = randInt(0, max - 1);
  const letter = ALPHA[idx];
  const next = ALPHA[idx + 1];
  const n = optCount(d);
  const direction = d === 'difficult' && randInt(0, 1) ? 'before' : 'after';
  if (direction === 'after') {
    const dist = pickN(ALPHA.filter(l => l !== next), n - 1);
    return { id: `lo_${uid()}`, text: `What letter comes after "${letter}"?`, options: shuffle([next, ...dist]), correctAnswer: next };
  }
  const prev = ALPHA[idx];
  const prevLetter = ALPHA[idx + 1];
  const dist = pickN(ALPHA.filter(l => l !== prev), n - 1);
  return { id: `lo_${uid()}`, text: `What letter comes before "${prevLetter}"?`, options: shuffle([prev, ...dist]), correctAnswer: prev };
}

function genLetterSound(d: Difficulty): Question {
  const pool = d === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const n = optCount(d);
  const letter = pick(pool);
  const sound = LETTER_SOUNDS[letter];
  const dist = pickN(pool.filter(l => l !== letter), n - 1);
  return { id: `ls_${uid()}`, text: `Which letter makes the sound "${sound}"?`, options: shuffle([letter, ...dist]), correctAnswer: letter };
}

function genClassifyLetter(d: Difficulty): Question {
  const pool = d === 'easy' ? ALPHA.slice(0, 13) : ALPHA;
  const letter = pick(pool);
  const isVowel = VOWELS_U.includes(letter);
  const correct = isVowel ? 'Vowel' : 'Consonant';
  return { id: `cl_${uid()}`, text: `Is "${letter}" a Vowel or Consonant?`, options: shuffle(['Vowel', 'Consonant']), correctAnswer: correct };
}

function genFindVowel(d: Difficulty): Question {
  const n = optCount(d);
  const vowel = pick(VOWELS_U);
  const dist = pickN(CONSONANTS_U.filter(c => c !== vowel), n - 1);
  return { id: `fv_${uid()}`, text: 'Which one is a vowel?', options: shuffle([vowel, ...dist]), correctAnswer: vowel };
}

function genFillVowel(d: Difficulty): Question {
  const n = optCount(d);
  if (d === 'easy') {
    const item = pick(CVC_WORDS);
    const blanked = item.word[0] + '_' + item.word[2];
    const dist = pickN(['a','e','i','o','u'].filter(v => v !== item.vowel), n - 1);
    return { id: `flv_${uid()}`, text: `Fill the vowel: "${blanked}" → ?`, options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel };
  }
  const item = pick(d === 'intermediate' ? LONGER_WORDS.slice(0, 15) : LONGER_WORDS);
  const chars = item.word.split('');
  chars[item.vIdx] = '_';
  const blanked = chars.join('');
  const dist = pickN(['a','e','i','o','u'].filter(v => v !== item.vowel), n - 1);
  return { id: `flv_${uid()}`, text: `Fill the vowel: "${blanked}" → ?`, options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel };
}

function genFindNoun(d: Difficulty): Question {
  const n = optCount(d);
  const noun = pick(NOUNS);
  const dist = pickN([...VERBS, ...ADJECTIVES].filter(w => w !== noun), n - 1);
  return { id: `fn_${uid()}`, text: 'Which word is a noun (naming word)?', options: shuffle([noun, ...dist]), correctAnswer: noun };
}

function genNounHunt(d: Difficulty): Question {
  const isNoun = randInt(0, 1) === 1;
  const word = isNoun ? pick(NOUNS) : pick([...VERBS, ...ADJECTIVES]);
  const correct = isNoun ? 'Yes' : 'No';
  return { id: `nh_${uid()}`, text: `Is "${word}" a noun?`, options: shuffle(['Yes', 'No']), correctAnswer: correct };
}

function genPluralMaker(d: Difficulty): Question {
  const n = optCount(d);
  let pair: [string, string];
  if (d === 'easy') pair = pick(REG_PLURALS);
  else if (d === 'intermediate') pair = pick([...REG_PLURALS, ...ES_PLURALS]);
  else pair = pick([...REG_PLURALS, ...ES_PLURALS, ...IRR_PLURALS]);
  const [sing, plur] = pair;
  // Generate plausible wrong plurals
  const wrongs = [`${sing}s`, `${sing}es`, `${sing}ies`, `${sing}en`, `${sing}`].filter(w => w !== plur);
  const dist = pickN(wrongs, n - 1);
  return { id: `pm_${uid()}`, text: `What is the plural of "${sing}"?`, options: shuffle([plur, ...dist]), correctAnswer: plur };
}

function genFindVerb(d: Difficulty): Question {
  const n = optCount(d);
  const verb = pick(VERBS);
  const dist = pickN([...NOUNS, ...ADJECTIVES].filter(w => w !== verb), n - 1);
  return { id: `fvb_${uid()}`, text: 'Which word is a verb (action word)?', options: shuffle([verb, ...dist]), correctAnswer: verb };
}

function genActionMatch(d: Difficulty): Question {
  const n = optCount(d);
  const verb = pick(VERBS);
  const desc = VERB_ACTIONS[verb] || 'do something';
  const dist = pickN(VERBS.filter(v => v !== verb), n - 1);
  return { id: `am_${uid()}`, text: `Which word means "${desc}"?`, options: shuffle([verb, ...dist]), correctAnswer: verb };
}

function genVerbOrNot(d: Difficulty): Question {
  const isVerb = randInt(0, 1) === 1;
  const word = isVerb ? pick(VERBS) : pick([...NOUNS, ...ADJECTIVES]);
  const correct = isVerb ? 'Yes' : 'No';
  return { id: `vn_${uid()}`, text: `Is "${word}" a verb (action word)?`, options: shuffle(['Yes', 'No']), correctAnswer: correct };
}

function genMatchOpposite(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(OPPOSITES);
  const dir = randInt(0, 1);
  const word = pair[dir];
  const correct = pair[1 - dir];
  const allWords = OPPOSITES.map(p => p[1 - dir]).filter(w => w !== correct);
  const dist = pickN(allWords, n - 1);
  return { id: `mo_${uid()}`, text: `What is the opposite of "${word}"?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genFindOpposite(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(OPPOSITES);
  const word = pair[0];
  const correct = pair[1];
  const allWords = OPPOSITES.map(p => p[1]).filter(w => w !== correct);
  const dist = pickN(allWords, n - 1);
  return { id: `fo_${uid()}`, text: `Pick the opposite of "${word}":`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCompleteOpposite(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(OPPOSITES);
  const correct = pair[1];
  const allWords = OPPOSITES.map(p => p[1]).filter(w => w !== correct);
  const dist = pickN(allWords, n - 1);
  return { id: `co_${uid()}`, text: `"${pair[0]}" is the opposite of ___.`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genWordOrder(d: Difficulty): Question {
  const n = optCount(d);
  const sentence = pick(SENTENCES);
  const words = sentence.split(' ');
  // Generate wrong orders
  const wrongs: string[] = [];
  for (let i = 0; i < 10 && wrongs.length < n - 1; i++) {
    const jumbled = shuffle(words).join(' ');
    if (jumbled !== sentence && !wrongs.includes(jumbled)) wrongs.push(jumbled);
  }
  while (wrongs.length < n - 1) wrongs.push(shuffle(words).reverse().join(' '));
  return { id: `wo_${uid()}`, text: `Which sentence is in the right order?\n(Words: ${shuffle(words).join(', ')})`, options: shuffle([sentence, ...wrongs.slice(0, n - 1)]), correctAnswer: sentence };
}

function genMissingWord(d: Difficulty): Question {
  const n = optCount(d);
  const tmpl = pick(MISSING_TEMPLATES);
  const dist = pickN(tmpl.opts, n - 1);
  return { id: `mw_${uid()}`, text: tmpl.sent, options: shuffle([tmpl.ans, ...dist]), correctAnswer: tmpl.ans };
}

function genSentenceFix(d: Difficulty): Question {
  const n = optCount(d);
  const sentence = pick(SENTENCES);
  const words = sentence.split(' ');
  const wrongs: string[] = [];
  // Create grammatically wrong versions
  for (let i = 0; i < 10 && wrongs.length < n - 1; i++) {
    const copy = [...words];
    const swapI = randInt(0, copy.length - 2);
    [copy[swapI], copy[swapI + 1]] = [copy[swapI + 1], copy[swapI]];
    const bad = copy.join(' ');
    if (bad !== sentence && !wrongs.includes(bad)) wrongs.push(bad);
  }
  while (wrongs.length < n - 1) wrongs.push(words.reverse().join(' '));
  return { id: `sf_${uid()}`, text: 'Which sentence is correct?', options: shuffle([sentence, ...wrongs.slice(0, n - 1)]), correctAnswer: sentence };
}

// ── Maths Generators ───────────────────────────────────────

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
  return { id: `cm_${uid()}`, text: `Count the ${obj.name}:\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
    return { id: `no_${uid()}`, text: `What number comes after ${num}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
  }
  const correct = String(num);
  const after = num + 1;
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(Math.max(1, num - 4), num + 4));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: `no_${uid()}`, text: `What number comes before ${after}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genCompareNumbers(d: Difficulty): Question {
  const [min, max] = numRange(d);
  const a = randInt(min, max);
  let b = randInt(min, max);
  while (b === a) b = randInt(min, max);
  const bigger = Math.max(a, b);
  const correct = String(bigger);
  return { id: `cn_${uid()}`, text: `Which number is bigger?`, options: shuffle([String(a), String(b)]), correctAnswer: correct };
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
  return { id: `aa_${uid()}`, text: `🍎 ${a} + ${b} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `ta_${uid()}`, text: `${a} − ${b} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `ms_${uid()}`, text: `Which equals ${sum}?`, options: shuffle([correct, ...wrongs]), correctAnswer: correct };
}

function genNameShape(d: Difficulty): Question {
  const n = optCount(d);
  const pool = d === 'easy' ? SHAPES_BANK.slice(0, 4) : d === 'intermediate' ? SHAPES_BANK.slice(0, 6) : SHAPES_BANK;
  const shape = pick(pool);
  const dist = pickN(pool.filter(s => s.name !== shape.name).map(s => s.name), n - 1);
  return { id: `ns_${uid()}`, text: `What shape is this? ${shape.emoji}`, options: shuffle([shape.name, ...dist]), correctAnswer: shape.name };
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
  return { id: `cp_${uid()}`, text: `What comes next?\n${display} ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `cs_${uid()}`, text: `How many ${target.emoji} (${target.name}) are there?\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `cl_${uid()}`, text: `Which ${item} is longer?\nA: ${a} ${unit}    B: ${b} ${unit}`, options: shuffle([`${a} ${unit}`, `${b} ${unit}`]), correctAnswer: correct };
}

function genCompareWeights(d: Difficulty): Question {
  const pair = pick(WEIGHT_PAIRS);
  const correct = pair[0]; // first is always heavier
  return { id: `cw_${uid()}`, text: 'Which is heavier?', options: shuffle([pair[0], pair[1]]), correctAnswer: correct };
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
  const item = pick(items);
  const correct = item.size;
  const all = ['Very tiny', 'Small', 'Medium', 'Big', 'Very big', 'Huge'];
  const dist = pickN(all.filter(s => s !== correct), n - 1);
  return { id: `mm_${uid()}`, text: `How big is a ${item.item}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
    let wh = randInt(1, 12);
    let wm = d === 'easy' ? 0 : pick([0, 15, 30, 45]);
    const wStr = wm === 0 ? `${wh} o'clock` : `${wh}:${wm < 10 ? '0' + wm : wm}`;
    if (wStr !== correct && !dist.includes(wStr)) dist.push(wStr);
  }
  return { id: `rc_${uid()}`, text: `The clock shows ${display}. What time is it?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `cc_${uid()}`, text: `Count the coins:\n${display} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  const wrongAmounts = amounts.filter(a => a !== amount);
  const dist = pickN(wrongAmounts.map(a => `₹${a}`), n - 1);
  return { id: `mnm_${uid()}`, text: `Which makes ₹${amount}?`, options: shuffle([correct, ...dist.map(d => d + ' coin')]), correctAnswer: correct };
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
  return { id: `cso_${uid()}`, text: `How many ${targetItem} are there?\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `mol_${uid()}`, text: `Which group has MORE?\nA: ${displayA} (${objA.name})\nB: ${displayB} (${objB.name})`, options: shuffle([correct, otherCap]), correctAnswer: correct };
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
  return { id: `rch_${uid()}`, text: `Look at the chart:\n${chart}\n\nHow many ${selectedNames[askIdx]}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── Generator Registry ─────────────────────────────────────

type GenFn = (d: Difficulty) => Question;

const GENERATORS: Record<string, GenFn> = {
  // English – Alphabet
  letter_match: genLetterMatch, letter_order: genLetterOrder, letter_sound: genLetterSound,
  // English – Vowels
  classify_letter: genClassifyLetter, find_vowel: genFindVowel, fill_vowel: genFillVowel,
  // English – Nouns
  find_noun: genFindNoun, noun_hunt: genNounHunt, plural_maker: genPluralMaker,
  // English – Verbs
  find_verb: genFindVerb, action_match: genActionMatch, verb_or_not: genVerbOrNot,
  // English – Opposites
  match_opposite: genMatchOpposite, find_opposite: genFindOpposite, complete_opposite: genCompleteOpposite,
  // English – Sentences
  word_order: genWordOrder, missing_word: genMissingWord, sentence_fix: genSentenceFix,
  // Maths – Numbers
  count_match: genCountMatch, number_order: genNumberOrder, compare_numbers: genCompareNumbers,
  // Maths – Add/Sub
  adding_apples: genAddingApples, take_away: genTakeAway, match_sum: genMatchSum,
  // Maths – Shapes
  name_shape: genNameShape, continue_pattern: genContinuePattern, count_shapes: genCountShapes,
  // Maths – Measurement
  compare_lengths: genCompareLengths, compare_weights: genCompareWeights, measure_match: genMeasureMatch,
  // Maths – Time & Money
  read_clock: genReadClock, count_coins: genCountCoins, money_match: genMoneyMatch,
  // Maths – Data
  count_sort: genCountSort, more_or_less: genMoreOrLess, read_chart: genReadChart,
};

// ── Recent Questions (anti-repeat) ─────────────────────────

const RECENT_KEY = 'subjectGames_recentQ';
const MAX_RECENT = 200;

function getRecentSet(): Set<string> {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveRecent(keys: Set<string>) {
  const arr = Array.from(keys);
  // Keep only last MAX_RECENT
  const trimmed = arr.slice(-MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
}

// ── Main Generator ─────────────────────────────────────────

export function generateQuestions(gameType: string, difficulty: Difficulty): Question[] {
  const gen = GENERATORS[gameType];
  if (!gen) {
    console.warn(`[QuestionGen] No generator for gameType: ${gameType}`);
    return [];
  }

  const questions: Question[] = [];
  const seen = new Set<string>();
  const recent = getRecentSet();
  let attempts = 0;

  while (questions.length < 25 && attempts < 300) {
    attempts++;
    try {
      const q = gen(difficulty);
      const key = `${q.text}::${q.correctAnswer}`;
      if (!seen.has(key) && !recent.has(key)) {
        seen.add(key);
        recent.add(key);
        questions.push(q);
      }
    } catch {
      // skip bad generation
    }
  }

  // If we couldn't get 25 unique, allow recent duplicates
  if (questions.length < 25) {
    let fallbackAttempts = 0;
    while (questions.length < 25 && fallbackAttempts < 200) {
      fallbackAttempts++;
      try {
        const q = gen(difficulty);
        const key = `${q.text}::${q.correctAnswer}`;
        if (!seen.has(key)) {
          seen.add(key);
          questions.push(q);
        }
      } catch { /* skip */ }
    }
  }

  saveRecent(recent);
  return questions;
}

// ── Validation ─────────────────────────────────────────────

export function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  return String(userAnswer).trim() === String(correctAnswer).trim();
}
