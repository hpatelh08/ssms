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

// ── Std 4 Extensions (Vocabulary, Grammar, Fractions, etc.) ───────────

const SYN_PAIRS: [string, string][] = [
  ['happy', 'joyful'], ['sad', 'unhappy'], ['big', 'large'], ['small', 'tiny'], ['quick', 'fast'],
  ['smart', 'clever'], ['quiet', 'silent'], ['angry', 'furious'], ['begin', 'start'], ['finish', 'end'],
  ['brave', 'courageous'], ['easy', 'simple'], ['hard', 'difficult'], ['clean', 'tidy'], ['beautiful', 'pretty'],
  ['strong', 'powerful'], ['help', 'assist'], ['choose', 'select'], ['answer', 'reply'], ['show', 'display'],
];

const ANT_PAIRS: [string, string][] = [
  ['hot', 'cold'], ['up', 'down'], ['early', 'late'], ['inside', 'outside'], ['heavy', 'light'],
  ['buy', 'sell'], ['rich', 'poor'], ['full', 'empty'], ['open', 'close'], ['near', 'far'],
  ['true', 'false'], ['polite', 'rude'], ['safe', 'dangerous'], ['bright', 'dark'], ['win', 'lose'],
];

const HOMOPHONE_SETS: { prompt: string; correct: string; options: string[] }[] = [
  { prompt: 'I have ___ apples.', correct: 'two', options: ['two', 'to', 'too', 'tow'] },
  { prompt: 'Please come ___ my house.', correct: 'to', options: ['to', 'too', 'two', 'toe'] },
  { prompt: 'This bag is ___ heavy.', correct: 'too', options: ['too', 'two', 'to', 'toe'] },
  { prompt: 'Look over ___.', correct: 'there', options: ['there', 'their', "they're", 'theirs'] },
  { prompt: 'This is ___ book.', correct: 'their', options: ['their', 'there', "they're", 'theirs'] },
  { prompt: '___ going to play.', correct: "they're", options: ["they're", 'there', 'their', 'theirs'] },
];

function buildNumericOptions(correct: number, makeDist: () => number, count: number): string[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < count && guard++ < 200) set.add(makeDist());
  return shuffle(Array.from(set).map(String));
}

function genSynonymMatch(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(SYN_PAIRS);
  const askLeft = randInt(0, 1) === 0;
  const word = askLeft ? pair[0] : pair[1];
  const correct = askLeft ? pair[1] : pair[0];

  const pool = SYN_PAIRS.flatMap(p => p).filter(w => w !== word && w !== correct);
  const dist = pickN(pool, n - 1);
  return { id: `syn_${uid()}`, text: `Choose a synonym of "${word}".`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genAntonymMatch(d: Difficulty): Question {
  const n = optCount(d);
  const pair = pick(ANT_PAIRS);
  const askLeft = randInt(0, 1) === 0;
  const word = askLeft ? pair[0] : pair[1];
  const correct = askLeft ? pair[1] : pair[0];

  const pool = ANT_PAIRS.flatMap(p => p).filter(w => w !== word && w !== correct);
  const dist = pickN(pool, n - 1);
  return { id: `ant_${uid()}`, text: `Choose an antonym of "${word}".`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genHomophones(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(HOMOPHONE_SETS);
  const pool = item.options.filter(o => o !== item.correct);
  const dist = pickN(pool, n - 1);
  return { id: `hom_${uid()}`, text: `Fill in the blank:\n${item.prompt}`, options: shuffle([item.correct, ...dist]), correctAnswer: item.correct };
}

function genPronounReplace(d: Difficulty): Question {
  const n = optCount(d);
  const cases = [
    { who: 'Riya', pronoun: 'She' },
    { who: 'Arjun', pronoun: 'He' },
    { who: 'The children', pronoun: 'They' },
    { who: 'The puppy', pronoun: 'It' },
  ];
  const c = pick(cases);
  const base = ['He', 'She', 'They', 'It'];
  const options = shuffle(pickN(base, Math.max(n, 4))).slice(0, n);
  if (!options.includes(c.pronoun)) options[0] = c.pronoun;
  return {
    id: `pro_${uid()}`,
    text: `Replace "${c.who}" with a pronoun:\n"${c.who} is my friend. ___ is kind."`,
    options: shuffle(options),
    correctAnswer: c.pronoun,
  };
}

function genIdentifyAdjective(d: Difficulty): Question {
  const n = optCount(d);
  const nouns = ['teacher', 'river', 'mountain', 'garden', 'elephant', 'library', 'football', 'pencil'];
  const adjectives = ['tall', 'brave', 'bright', 'quiet', 'fresh', 'beautiful', 'strong', 'careful'];
  const verbs = ['runs', 'shines', 'moves', 'helps', 'jumps', 'waits', 'reads', 'writes'];

  const adj = pick(adjectives);
  const noun = pick(nouns);
  const verb = pick(verbs);

  const correct = adj;
  const pool = shuffle([...nouns, ...verbs, ...adjectives.filter(a => a !== adj)]);
  const dist = pickN(pool.filter(x => x !== correct), n - 1);
  return {
    id: `adj_${uid()}`,
    text: `Which word is an adjective?\n"The ${adj} ${noun} ${verb}."`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genTenseSelect(d: Difficulty): Question {
  const n = optCount(d);
  const verbs = [
    { base: 'play', past: 'played' },
    { base: 'walk', past: 'walked' },
    { base: 'watch', past: 'watched' },
    { base: 'help', past: 'helped' },
    { base: 'jump', past: 'jumped' },
    { base: 'visit', past: 'visited' },
  ];
  const v = pick(verbs);
  const tense = pick(['past', 'present', 'future'] as const);
  const marker = tense === 'past' ? 'Yesterday' : tense === 'future' ? 'Tomorrow' : 'Every day';
  const correct = tense === 'past' ? v.past : tense === 'future' ? `will ${v.base}` : v.base;

  const pool = shuffle([v.base, v.past, `will ${v.base}`, `${v.base}ing`]);
  const dist = pickN(pool.filter(x => x !== correct), n - 1);
  return {
    id: `ten_${uid()}`,
    text: `${marker}, they ___ in the park.`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genSubjectVerbAgreement(d: Difficulty): Question {
  const n = optCount(d);
  const items = [
    { subject: 'The dog', singular: true, verb: 'bark' },
    { subject: 'The dogs', singular: false, verb: 'bark' },
    { subject: 'My brother', singular: true, verb: 'eat' },
    { subject: 'My brothers', singular: false, verb: 'eat' },
    { subject: 'Riya', singular: true, verb: 'play' },
    { subject: 'The children', singular: false, verb: 'play' },
  ];
  const it = pick(items);
  const correct = it.singular ? `${it.verb}s` : it.verb;
  const pool = shuffle([it.verb, `${it.verb}s`, `${it.verb}ed`, `will ${it.verb}`]);
  const dist = pickN(pool.filter(x => x !== correct), n - 1);
  return {
    id: `sva_${uid()}`,
    text: `Choose the correct verb:\n"${it.subject} ___."`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genArticleFill(d: Difficulty): Question {
  const n = optCount(d);
  const words = [
    { noun: 'apple', needs: 'An' },
    { noun: 'umbrella', needs: 'An' },
    { noun: 'hour', needs: 'An' },
    { noun: 'book', needs: 'A' },
    { noun: 'kite', needs: 'A' },
    { noun: 'sun', needs: 'The' },
    { noun: 'moon', needs: 'The' },
  ];
  const w = pick(words);
  const correct = w.needs;
  const optionsPool = ['A', 'An', 'The'];
  const dist = pickN(optionsPool.filter(x => x !== correct), Math.min(n - 1, optionsPool.length - 1));
  const options = shuffle([correct, ...dist]);
  while (options.length < n) options.push(pick(optionsPool.filter(x => !options.includes(x))));
  return {
    id: `art_${uid()}`,
    text: `Fill in the blank:\n"___ ${w.noun} is on the table."`,
    options: shuffle(options),
    correctAnswer: correct,
  };
}

function genPrepositionPick(d: Difficulty): Question {
  const n = optCount(d);
  const scenarios = [
    { text: 'The cat is ___ the table.', correct: 'under', pool: ['under', 'on', 'in', 'behind', 'between'] },
    { text: 'The book is ___ the bag.', correct: 'in', pool: ['in', 'on', 'under', 'behind', 'between'] },
    { text: 'The ball is ___ the box and the chair.', correct: 'between', pool: ['between', 'under', 'in', 'on', 'behind'] },
    { text: 'The picture is ___ the wall.', correct: 'on', pool: ['on', 'in', 'under', 'between', 'behind'] },
  ];
  const s = pick(scenarios);
  const dist = pickN(s.pool.filter(x => x !== s.correct), n - 1);
  return { id: `prep_${uid()}`, text: `Choose the correct preposition:\n"${s.text}"`, options: shuffle([s.correct, ...dist]), correctAnswer: s.correct };
}

function genConjunctionChoice(d: Difficulty): Question {
  const n = optCount(d);
  const items = [
    { a: 'I was hungry', b: 'I ate a sandwich', correct: 'so' },
    { a: 'I wanted to play', b: 'it was raining', correct: 'but' },
    { a: 'She studied', b: 'she passed the test', correct: 'so' },
    { a: 'He is late', b: 'the bus was slow', correct: 'because' },
    { a: 'We can sing', b: 'we can dance', correct: 'and' },
  ];
  const it = pick(items);
  const correct = it.correct;
  const pool = ['and', 'but', 'because', 'so'];
  const dist = pickN(pool.filter(x => x !== correct), n - 1);
  return {
    id: `conj_${uid()}`,
    text: `Choose the correct conjunction:\n"${it.a} ___ ${it.b}."`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genPunctuationFix(d: Difficulty): Question {
  const n = optCount(d);
  const kind = pick(['question', 'exclaim', 'statement'] as const);
  const base = kind === 'question' ? 'Where are you going' : kind === 'exclaim' ? 'What a beautiful day' : 'We went to the park';
  const correct = kind === 'question' ? `${base}?` : kind === 'exclaim' ? `${base}!` : `${base}.`;
  const wrongs = shuffle([`${base}.`, `${base}?`, `${base}!`].filter(x => x !== correct));
  const dist = pickN(wrongs, n - 1);
  return {
    id: `punc_${uid()}`,
    text: 'Choose the sentence with correct punctuation:',
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

const COMPREHENSION_BANK = [
  {
    passage: 'Maya planted seeds in a pot. She watered them every day. After a week, small green leaves appeared.',
    q: 'What did Maya do every day?',
    options: ['Watered the seeds', 'Ate the seeds', 'Moved the pot', 'Painted the pot'],
    answer: 'Watered the seeds',
  },
  {
    passage: 'Rohan missed the bus, so he walked to school. He reached on time because he walked quickly.',
    q: 'Why did Rohan reach on time?',
    options: ['He walked quickly', 'The bus came back', 'School started late', 'He took a taxi'],
    answer: 'He walked quickly',
  },
  {
    passage: 'A camel can live many days without water. It stores fat in its hump which helps it survive in the desert.',
    q: 'What does a camel store in its hump?',
    options: ['Fat', 'Water', 'Sand', 'Air'],
    answer: 'Fat',
  },
];

function genComprehension(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(COMPREHENSION_BANK);
  const pool = item.options.filter(o => o !== item.answer);
  const dist = pickN(pool, n - 1);
  return {
    id: `comp_${uid()}`,
    text: `Read:\n${item.passage}\n\n${item.q}`,
    options: shuffle([item.answer, ...dist]),
    correctAnswer: item.answer,
  };
}

const MAIN_IDEA_BANK = [
  {
    passage: 'Birds build nests to lay eggs and keep their babies safe. Different birds build different kinds of nests.',
    options: ['Birds make nests for safety', 'Birds only live in trees', 'Eggs are made of stone', 'All nests look the same'],
    answer: 'Birds make nests for safety',
  },
  {
    passage: 'Recycling helps reduce waste. It saves resources like paper and plastic and keeps our surroundings clean.',
    options: ['Recycling reduces waste and saves resources', 'Waste is always useful', 'Plastic grows on trees', 'Clean places create more trash'],
    answer: 'Recycling reduces waste and saves resources',
  },
  {
    passage: 'Exercise keeps our body strong. It improves our health and gives us energy to do daily work.',
    options: ['Exercise makes us healthy and strong', 'Energy comes only from sleep', 'Strong people never move', 'Health is not important'],
    answer: 'Exercise makes us healthy and strong',
  },
];

function genMainIdea(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(MAIN_IDEA_BANK);
  const pool = item.options.filter(o => o !== item.answer);
  const dist = pickN(pool, n - 1);
  return {
    id: `mi_${uid()}`,
    text: `Read:\n${item.passage}\n\nWhat is the main idea?`,
    options: shuffle([item.answer, ...dist]),
    correctAnswer: item.answer,
  };
}

const SEQUENCE_BANK = [
  ['Wake up', 'Brush teeth', 'Eat breakfast', 'Go to school'],
  ['Put seed in soil', 'Water the soil', 'Wait for sprout', 'Plant grows'],
  ['Take ingredients', 'Mix them', 'Cook the food', 'Serve and eat'],
];

function genSequenceStory(d: Difficulty): Question {
  const n = optCount(d);
  const seq = pick(SEQUENCE_BANK);
  const ask = pick(['first', 'last'] as const);
  const correct = ask === 'first' ? seq[0] : seq[seq.length - 1];
  const dist = pickN(seq.filter(s => s !== correct), Math.min(n - 1, seq.length - 1));
  const options = shuffle([correct, ...dist]);
  while (options.length < n) options.push(pick(seq.filter(s => !options.includes(s))));
  return {
    id: `seq_${uid()}`,
    text: `Which should come ${ask.toUpperCase()}?\n${shuffle(seq).map((s, i) => `${i + 1}) ${s}`).join('\n')}`,
    options: shuffle(options),
    correctAnswer: correct,
  };
}

function genPlaceValueDigit(d: Difficulty): Question {
  const places = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
  const min = places === 3 ? 100 : places === 4 ? 1000 : 10000;
  const max = places === 3 ? 999 : places === 4 ? 9999 : 99999;
  const num = randInt(min, max);
  const digits = String(num).split('').map(Number);
  const idx = randInt(0, digits.length - 1);
  const digit = digits[idx];
  const pow = digits.length - idx - 1;
  const correct = digit * Math.pow(10, pow);
  const options = buildNumericOptions(
    correct,
    () => {
      const d2 = randInt(0, 9);
      const p2 = randInt(0, digits.length - 1);
      const pow2 = digits.length - p2 - 1;
      return d2 * Math.pow(10, pow2);
    },
    optCount(d),
  );
  return {
    id: `pv_${uid()}`,
    text: `In ${num}, what is the place value of digit "${digit}"?`,
    options,
    correctAnswer: String(correct),
  };
}

function genExpandedForm(d: Difficulty): Question {
  const places = d === 'easy' ? 3 : 4;
  const min = places === 3 ? 100 : 1000;
  const max = places === 3 ? 999 : 9999;
  const num = randInt(min, max);
  const digits = String(num).split('').map(Number);
  const parts = digits.map((dig, i) => dig * Math.pow(10, digits.length - i - 1)).filter(x => x > 0);
  const correct = parts.join(' + ');

  const wrong1 = parts.slice().reverse().join(' + ');
  const wrong2 = parts.map(p => String(p).replace(/0+$/, '')).join(' + ');
  const wrong3 = parts.length >= 2 ? `${parts[0]} + ${parts[1]} + ${parts.slice(2).reduce((s, x) => s + x, 0)}` : wrong1;

  const pool = shuffle([wrong1, wrong2, wrong3]).filter(x => x !== correct);
  const dist = pickN(pool, optCount(d) - 1);
  return {
    id: `exp_${uid()}`,
    text: `Write ${num} in expanded form:`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genRounding(d: Difficulty): Question {
  const to = d === 'easy' ? 10 : d === 'intermediate' ? 100 : 1000;
  const max = to === 10 ? 999 : to === 100 ? 9999 : 99999;
  const num = randInt(10, max);
  const correct = Math.round(num / to) * to;
  const options = buildNumericOptions(
    correct,
    () => {
      const delta = pick([to, -to, to * 2, -to * 2]);
      return Math.max(0, correct + delta);
    },
    optCount(d),
  );
  return {
    id: `rnd_${uid()}`,
    text: `Round ${num} to the nearest ${to}:`,
    options,
    correctAnswer: String(correct),
  };
}

function genAddSub4Digit(d: Difficulty): Question {
  const isAdd = randInt(0, 1) === 0;
  const max = d === 'easy' ? 999 : d === 'intermediate' ? 9999 : 99999;
  const min = d === 'easy' ? 100 : d === 'intermediate' ? 1000 : 10000;
  let a = randInt(min, max);
  let b = randInt(min, max);
  if (!isAdd && b > a) [a, b] = [b, a];
  const correct = isAdd ? a + b : a - b;
  const options = buildNumericOptions(
    correct,
    () => correct + randInt(-50, 50) * (d === 'difficult' ? 10 : 1),
    optCount(d),
  );
  return {
    id: `as_${uid()}`,
    text: isAdd ? `${a} + ${b} = ?` : `${a} − ${b} = ?`,
    options,
    correctAnswer: String(correct),
  };
}

function genWordProblemAddSub(d: Difficulty): Question {
  const n = optCount(d);
  const kind = pick(['add', 'sub'] as const);
  const a = randInt(d === 'easy' ? 20 : 120, d === 'easy' ? 200 : 1500);
  const b = randInt(d === 'easy' ? 10 : 60, d === 'easy' ? 180 : 1200);
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const correct = kind === 'add' ? a + b : bigger - smaller;
  const text = kind === 'add'
    ? `Word problem:\nA shop sold ${a} pencils in the morning and ${b} pencils in the evening.\nHow many pencils were sold in total?`
    : `Word problem:\nRiya had ${bigger} stickers. She gave ${smaller} stickers to her friend.\nHow many stickers are left?`;
  const options = buildNumericOptions(correct, () => correct + randInt(-40, 40), n);
  return { id: `wp_${uid()}`, text, options, correctAnswer: String(correct) };
}

function genMultiply2x1(d: Difficulty): Question {
  const a = randInt(d === 'easy' ? 10 : 12, d === 'easy' ? 49 : 99);
  const b = randInt(2, d === 'easy' ? 9 : 12);
  const correct = a * b;
  const options = buildNumericOptions(correct, () => correct + randInt(-12, 12), optCount(d));
  return { id: `m21_${uid()}`, text: `${a} × ${b} = ?`, options, correctAnswer: String(correct) };
}

function genMultiply2x2(d: Difficulty): Question {
  const a = randInt(d === 'easy' ? 10 : 12, d === 'easy' ? 25 : 99);
  const b = randInt(d === 'easy' ? 10 : 12, d === 'easy' ? 25 : 99);
  const correct = a * b;
  const options = buildNumericOptions(correct, () => correct + randInt(-50, 50), optCount(d));
  return { id: `m22_${uid()}`, text: `${a} × ${b} = ?`, options, correctAnswer: String(correct) };
}

function genDivideBasic(d: Difficulty): Question {
  const divisor = randInt(2, d === 'easy' ? 9 : 12);
  const quotient = randInt(d === 'easy' ? 2 : 5, d === 'easy' ? 20 : 60);
  const dividend = divisor * quotient;
  const correct = quotient;
  const options = buildNumericOptions(correct, () => randInt(1, correct + 15), optCount(d));
  return { id: `div_${uid()}`, text: `${dividend} ÷ ${divisor} = ?`, options, correctAnswer: String(correct) };
}

function simplifyFraction(n: number, d: number): { n: number; d: number } {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
}

function genFractionEquivalent(d: Difficulty): Question {
  const nOpt = optCount(d);
  const baseN = randInt(1, 9);
  const baseD = randInt(baseN + 1, 12);
  const simp = simplifyFraction(baseN, baseD);
  const k = randInt(2, d === 'easy' ? 3 : 5);
  const correct = `${simp.n * k}/${simp.d * k}`;

  const wrongs = new Set<string>();
  while (wrongs.size < 6) {
    const kk = randInt(2, 6);
    const nn = simp.n * kk;
    const dd = simp.d * randInt(2, 6);
    const w = `${nn}/${dd}`;
    if (w !== correct) wrongs.add(w);
  }
  const dist = pickN(Array.from(wrongs), nOpt - 1);
  return {
    id: `feq_${uid()}`,
    text: `Which fraction is equivalent to ${simp.n}/${simp.d}?`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genFractionCompare(d: Difficulty): Question {
  const nOpt = optCount(d);
  const makeFrac = () => {
    const den = randInt(2, 12);
    const num = randInt(1, den - 1);
    const s = simplifyFraction(num, den);
    return { ...s, val: s.n / s.d, str: `${s.n}/${s.d}` };
  };
  const fracs = shuffle(Array.from({ length: 6 }, makeFrac)).slice(0, Math.max(nOpt, 4));
  const correctObj = fracs.reduce((best, f) => (f.val > best.val ? f : best), fracs[0]);
  const options = shuffle(fracs.map(f => f.str)).slice(0, nOpt);
  if (!options.includes(correctObj.str)) options[0] = correctObj.str;
  return {
    id: `fc_${uid()}`,
    text: 'Which fraction is the greatest?',
    options: shuffle(options),
    correctAnswer: correctObj.str,
  };
}

function genDecimalPlace(d: Difficulty): Question {
  const nOpt = optCount(d);
  const intPart = randInt(10, d === 'easy' ? 99 : 999);
  const decimals = d === 'easy' ? 2 : 3;
  const fracPart = randInt(0, Math.pow(10, decimals) - 1).toString().padStart(decimals, '0');
  const numStr = `${intPart}.${fracPart}`;
  const digits = fracPart.split('').map(Number);
  const idx = randInt(0, digits.length - 1);
  const digit = digits[idx];
  const placeVal = digit * Math.pow(10, -(idx + 1));
  const correct = placeVal.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');

  const makeDist = () => {
    const di = randInt(0, digits.length - 1);
    const dg = randInt(0, 9);
    const pv = dg * Math.pow(10, -(di + 1));
    return pv.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
  };
  const set = new Set<string>([correct]);
  let guard = 0;
  while (set.size < nOpt && guard++ < 200) set.add(makeDist());
  return {
    id: `dp_${uid()}`,
    text: `In ${numStr}, what is the value of digit "${digit}" in the decimal part?`,
    options: shuffle(Array.from(set)),
    correctAnswer: correct,
  };
}

function genAnglesType(d: Difficulty): Question {
  const nOpt = optCount(d);
  const angle = pick([30, 45, 60, 75, 90, 110, 120, 135, 150, 180]);
  const correct = angle === 90 ? 'Right' : angle === 180 ? 'Straight' : angle < 90 ? 'Acute' : 'Obtuse';
  const pool = ['Acute', 'Right', 'Obtuse', 'Straight'];
  const dist = pickN(pool.filter(x => x !== correct), nOpt - 1);
  return {
    id: `ang_${uid()}`,
    text: `An angle is ${angle}°. What type of angle is it?`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
  };
}

function genPerimeterRect(d: Difficulty): Question {
  const nOpt = optCount(d);
  const l = randInt(5, d === 'easy' ? 20 : 60);
  const w = randInt(4, d === 'easy' ? 15 : 50);
  const correct = 2 * (l + w);
  const options = buildNumericOptions(correct, () => correct + randInt(-10, 10), nOpt);
  return {
    id: `per_${uid()}`,
    text: `A rectangle has length ${l} cm and width ${w} cm.\nWhat is its perimeter?`,
    options,
    correctAnswer: String(correct),
  };
}

function genAreaRect(d: Difficulty): Question {
  const nOpt = optCount(d);
  const l = randInt(3, d === 'easy' ? 15 : 40);
  const w = randInt(3, d === 'easy' ? 12 : 35);
  const correct = l * w;
  const options = buildNumericOptions(correct, () => correct + randInt(-15, 15), nOpt);
  return {
    id: `area_${uid()}`,
    text: `A rectangle has length ${l} cm and width ${w} cm.\nWhat is its area?`,
    options,
    correctAnswer: String(correct),
  };
}

function genTimeElapsed(d: Difficulty): Question {
  const nOpt = optCount(d);
  const startH = randInt(7, 11);
  const startM = pick([0, 10, 15, 20, 30, 40, 45, 50]);
  const addMin = d === 'easy' ? pick([10, 15, 20, 30, 40, 45, 50]) : pick([35, 45, 55, 65, 75, 90, 110]);
  const startTotal = startH * 60 + startM;
  const endTotal = startTotal + addMin;
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;

  const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;
  const correct = addMin;
  const options = buildNumericOptions(correct, () => Math.max(5, correct + randInt(-25, 25)), nOpt);
  return {
    id: `tel_${uid()}`,
    text: `Start time: ${fmt(startH, startM)}\nEnd time: ${fmt(endH, endM)}\nHow many minutes passed?`,
    options,
    correctAnswer: String(correct),
  };
}

function genMoneyChange(d: Difficulty): Question {
  const nOpt = optCount(d);
  const cost = randInt(d === 'easy' ? 20 : 45, d === 'easy' ? 200 : 500);
  const paid = cost + randInt(10, d === 'easy' ? 80 : 300);
  const correct = paid - cost;
  const options = buildNumericOptions(correct, () => correct + randInt(-20, 20), nOpt);
  return {
    id: `chg_${uid()}`,
    text: `A toy costs ₹${cost}. You pay ₹${paid}.\nHow much change do you get?`,
    options,
    correctAnswer: String(correct),
  };
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
  // English – Std 4
  synonym_match: genSynonymMatch, antonym_match: genAntonymMatch, homophones: genHomophones,
  pronoun_replace: genPronounReplace, identify_adjective: genIdentifyAdjective,
  tense_select: genTenseSelect, subject_verb_agreement: genSubjectVerbAgreement,
  article_fill: genArticleFill, preposition_pick: genPrepositionPick, conjunction_choice: genConjunctionChoice,
  punctuation_fix: genPunctuationFix, comprehension: genComprehension, main_idea: genMainIdea, sequence_story: genSequenceStory,
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
  // Maths – Std 4
  place_value_digit: genPlaceValueDigit, expanded_form: genExpandedForm, rounding: genRounding,
  add_sub_4digit: genAddSub4Digit, word_problem_addsub: genWordProblemAddSub,
  multiply_2x1: genMultiply2x1, multiply_2x2: genMultiply2x2, divide_basic: genDivideBasic,
  fraction_equivalent: genFractionEquivalent, fraction_compare: genFractionCompare, decimal_place: genDecimalPlace,
  angles_type: genAnglesType, perimeter_rect: genPerimeterRect, area_rect: genAreaRect,
  time_elapsed: genTimeElapsed, money_change: genMoneyChange,
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
