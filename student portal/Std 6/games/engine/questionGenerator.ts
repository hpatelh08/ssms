/**
 * ðŸ§  Unified Question Generator â€” ONE BRAIN
 * ============================================
 * Central router for ALL 44 game types:
 *   â€¢ 8 Top-8 Arcade games  (converted to text-MCQ)
 *   â€¢ 18 English subject games
 *   â€¢ 18 Maths subject games
 *
 * Every game type returns the same Question shape.
 * GameShell calls generateBatch() â€” never individual modules.
 */

// â”€â”€ Shared Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type Difficulty = 'easy' | 'intermediate' | 'difficult';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

function normalizeQuestionPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hashQuestionKey(raw: string): string {
  let hash = 5381;
  for (let index = 0; index < raw.length; index++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function questionKey(question: Question): string {
  const options = [...question.options]
    .map(option => normalizeQuestionPart(String(option)))
    .sort()
    .join('|');
  const text = normalizeQuestionPart(String(question.text));
  const answer = normalizeQuestionPart(String(question.correctAnswer));
  return hashQuestionKey(`${text}::${answer}::${options}`);
}

function questionPromptKey(question: Question): string {
  return hashQuestionKey(normalizeQuestionPart(String(question.text)));
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TOP-8 ARCADE GENERATORS  (emoji-rich text MCQ)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€â”€ ShapeQuest data â”€â”€â”€

const SHAPES = [
  { name: 'Circle', emoji: 'âš«' }, { name: 'Square', emoji: 'â¬œ' },
  { name: 'Triangle', emoji: 'ðŸ”º' }, { name: 'Diamond', emoji: 'ðŸ”·' },
  { name: 'Star', emoji: 'â­' }, { name: 'Hexagon', emoji: 'â¬¡' },
  { name: 'Pentagon', emoji: 'â¬ ' }, { name: 'Oval', emoji: 'ðŸ¥š' },
  { name: 'Arrow', emoji: 'âž¡ï¸' }, { name: 'Cross', emoji: 'âœš' },
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

// â”€â”€â”€ NumberTap data â”€â”€â”€

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
    text: `ðŸ”¢ Find this number: ${target}`,
    options: shuffle([String(target), ...distractors.map(String)]),
    correctAnswer: String(target),
  };
}

// â”€â”€â”€ MathPuzzle â”€â”€â”€

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
    text: `âž• ${a} + ${b} = ?`,
    options: shuffle([String(sum), ...distractors.map(String)]),
    correctAnswer: String(sum),
    hint: `Count ${a} fingers, then ${b} more`,
  };
}

// â”€â”€â”€ WordBuilder data â”€â”€â”€

const WB_WORDS = [
  { word: 'APPLE', emoji: 'ðŸŽ' }, { word: 'BOOK', emoji: 'ðŸ“–' },
  { word: 'CAT', emoji: 'ðŸ±' }, { word: 'DOG', emoji: 'ðŸ•' },
  { word: 'FISH', emoji: 'ðŸŸ' }, { word: 'BIRD', emoji: 'ðŸ¦' },
  { word: 'SUN', emoji: 'â˜€ï¸' }, { word: 'MOON', emoji: 'ðŸŒ™' },
  { word: 'TREE', emoji: 'ðŸŒ³' }, { word: 'HOUSE', emoji: 'ðŸ ' },
  { word: 'BALL', emoji: 'âš½' }, { word: 'CAKE', emoji: 'ðŸŽ‚' },
  { word: 'MILK', emoji: 'ðŸ¥›' }, { word: 'STAR', emoji: 'â­' },
  { word: 'RAIN', emoji: 'ðŸŒ§ï¸' }, { word: 'BOAT', emoji: 'â›µ' },
  { word: 'FROG', emoji: 'ðŸ¸' }, { word: 'SHOE', emoji: 'ðŸ‘Ÿ' },
  { word: 'BEAR', emoji: 'ðŸ»' }, { word: 'BUS', emoji: 'ðŸšŒ' },
  { word: 'PEN', emoji: 'ðŸ–Šï¸' }, { word: 'HAT', emoji: 'ðŸŽ©' },
  { word: 'KITE', emoji: 'ðŸª' }, { word: 'HAND', emoji: 'âœ‹' },
  { word: 'RING', emoji: 'ðŸ’' }, { word: 'WATER', emoji: 'ðŸ’§' },
  { word: 'PLAY', emoji: 'ðŸŽ®' }, { word: 'SCHOOL', emoji: 'ðŸ«' },
  { word: 'HELLO', emoji: 'ðŸ‘‹' }, { word: 'FRIEND', emoji: 'ðŸ¤' },
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

// â”€â”€â”€ GuessTheWord data â”€â”€â”€

const PIC_WORDS = [
  { word: 'Apple', emoji: 'ðŸŽ' }, { word: 'Banana', emoji: 'ðŸŒ' },
  { word: 'Cat', emoji: 'ðŸ±' }, { word: 'Dog', emoji: 'ðŸ•' },
  { word: 'Elephant', emoji: 'ðŸ˜' }, { word: 'Fish', emoji: 'ðŸŸ' },
  { word: 'Grapes', emoji: 'ðŸ‡' }, { word: 'House', emoji: 'ðŸ ' },
  { word: 'Ice Cream', emoji: 'ðŸ¦' }, { word: 'Juice', emoji: 'ðŸ§ƒ' },
  { word: 'Kite', emoji: 'ðŸª' }, { word: 'Lion', emoji: 'ðŸ¦' },
  { word: 'Monkey', emoji: 'ðŸ’' }, { word: 'Nest', emoji: 'ðŸª¹' },
  { word: 'Orange', emoji: 'ðŸŠ' }, { word: 'Penguin', emoji: 'ðŸ§' },
  { word: 'Rainbow', emoji: 'ðŸŒˆ' }, { word: 'Star', emoji: 'â­' },
  { word: 'Train', emoji: 'ðŸš‚' }, { word: 'Umbrella', emoji: 'â˜‚ï¸' },
  { word: 'Cake', emoji: 'ðŸŽ‚' }, { word: 'Moon', emoji: 'ðŸŒ™' },
  { word: 'Sun', emoji: 'â˜€ï¸' }, { word: 'Flower', emoji: 'ðŸŒ¸' },
  { word: 'Bear', emoji: 'ðŸ»' }, { word: 'Frog', emoji: 'ðŸ¸' },
  { word: 'Ball', emoji: 'âš½' }, { word: 'Book', emoji: 'ðŸ“–' },
  { word: 'Bus', emoji: 'ðŸšŒ' }, { word: 'Tree', emoji: 'ðŸŒ³' },
  { word: 'Rocket', emoji: 'ðŸš€' }, { word: 'Bell', emoji: 'ðŸ””' },
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

// â”€â”€â”€ PictureIdentify data â”€â”€â”€

const PIC_CATEGORIES: { name: string; items: { name: string; emoji: string }[] }[] = [
  { name: 'Animal', items: [
    { name: 'Cat', emoji: 'ðŸ±' }, { name: 'Dog', emoji: 'ðŸ•' },
    { name: 'Fish', emoji: 'ðŸŸ' }, { name: 'Bird', emoji: 'ðŸ¦' },
    { name: 'Rabbit', emoji: 'ðŸ°' }, { name: 'Elephant', emoji: 'ðŸ˜' },
    { name: 'Frog', emoji: 'ðŸ¸' }, { name: 'Bear', emoji: 'ðŸ»' },
  ]},
  { name: 'Fruit', items: [
    { name: 'Apple', emoji: 'ðŸŽ' }, { name: 'Banana', emoji: 'ðŸŒ' },
    { name: 'Grapes', emoji: 'ðŸ‡' }, { name: 'Orange', emoji: 'ðŸŠ' },
    { name: 'Strawberry', emoji: 'ðŸ“' }, { name: 'Watermelon', emoji: 'ðŸ‰' },
    { name: 'Cherry', emoji: 'ðŸ’' }, { name: 'Peach', emoji: 'ðŸ‘' },
  ]},
  { name: 'Vehicle', items: [
    { name: 'Car', emoji: 'ðŸš—' }, { name: 'Bus', emoji: 'ðŸšŒ' },
    { name: 'Train', emoji: 'ðŸš‚' }, { name: 'Airplane', emoji: 'âœˆï¸' },
    { name: 'Bicycle', emoji: 'ðŸš²' }, { name: 'Boat', emoji: 'â›µ' },
    { name: 'Helicopter', emoji: 'ðŸš' }, { name: 'Rocket', emoji: 'ðŸš€' },
  ]},
  { name: 'Nature', items: [
    { name: 'Tree', emoji: 'ðŸŒ³' }, { name: 'Flower', emoji: 'ðŸŒ¸' },
    { name: 'Sun', emoji: 'â˜€ï¸' }, { name: 'Moon', emoji: 'ðŸŒ™' },
    { name: 'Cloud', emoji: 'â˜ï¸' }, { name: 'Rainbow', emoji: 'ðŸŒˆ' },
    { name: 'Mountain', emoji: 'â›°ï¸' }, { name: 'Ocean', emoji: 'ðŸŒŠ' },
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
    text: `ðŸ” Which is a ${cat.name}?`,
    options: shuffle([correct, ...dist]),
    correctAnswer: correct,
    hint: `Look for the ${cat.name.toLowerCase()}!`,
  };
}

// â”€â”€â”€ CountObjects â”€â”€â”€

const COUNT_EMOJIS = ['ðŸŽ', 'â­', 'ðŸŒ¸', 'ðŸŸ', 'ðŸ¦‹', 'ðŸŽˆ', 'ðŸ€', 'ðŸ', 'ðŸŒº', 'ðŸŠ', 'ðŸ±', 'ðŸš—', 'ðŸŽµ', 'ðŸŒ™', 'ðŸ’'];
const EMOJI_NAMES: Record<string, string> = {
  'ðŸŽ': 'apples', 'â­': 'stars', 'ðŸŒ¸': 'flowers', 'ðŸŸ': 'fish',
  'ðŸ¦‹': 'butterflies', 'ðŸŽˆ': 'balloons', 'ðŸ€': 'clovers', 'ðŸ': 'bees',
  'ðŸŒº': 'flowers', 'ðŸŠ': 'oranges', 'ðŸ±': 'cats', 'ðŸš—': 'cars',
  'ðŸŽµ': 'notes', 'ðŸŒ™': 'moons', 'ðŸ’': 'cherries',
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
    text: `ðŸ”¢ Count the ${objName}:\n${display}`,
    options: shuffle([String(count), ...dist.map(String)]),
    correctAnswer: String(count),
    hint: `Count each ${emoji} carefully`,
  };
}

// â”€â”€â”€ MatchLetters (converted to MCQ) â”€â”€â”€

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
      text: `ðŸ”¡ What is the lowercase of "${letter}"?`,
      options: shuffle([lower, ...dist]),
      correctAnswer: lower,
    };
  }
  const dist = pickN(pool.filter(l => l !== letter), n - 1);
  return {
    id: uid(),
    text: `ðŸ”  What is the uppercase of "${lower}"?`,
    options: shuffle([letter, ...dist]),
    correctAnswer: letter,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ---- New Std 6 Arcade Set ----

const HINDI_WORDS_STD6 = [
  'मातृभूमि', 'विद्यालय', 'पर्यावरण', 'अनुशासन', 'स्वतंत्रता', 'कविता', 'विज्ञान', 'साहित्य',
  'परिश्रम', 'समुदाय', 'नैतिकता', 'व्यवहार', 'संविधान', 'समानता', 'संस्कृति', 'उत्तरदायित्व',
  'परामर्श', 'आत्मविश्वास', 'सहयोग', 'स्वास्थ्य', 'कौशल', 'संचार', 'प्रकृति', 'उत्साह',
];

function makeHindiMisspellings(word: string, need: number): string[] {
  const out = new Set<string>();
  const variants = [
    word.replace('ृ', ''),
    word.replace('ं', 'ँ'),
    word.replace('ि', 'ी'),
    word.replace('ी', 'ि'),
    word.replace('ा', ''),
    word.replace('त', 'थ'),
    word.replace('ष', 'श'),
    word.replace('श', 'ष'),
    word.replace('स', 'श'),
  ];
  for (const v of variants) {
    if (v && v !== word) out.add(v);
    if (out.size >= need) break;
  }
  while (out.size < need) {
    const i = randInt(0, Math.max(0, word.length - 2));
    const j = Math.min(word.length - 1, i + 1);
    const chars = word.split('');
    const t = chars[i];
    chars[i] = chars[j];
    chars[j] = t;
    const swapped = chars.join('');
    if (swapped !== word) out.add(swapped);
    if (out.size > need + 3) break;
  }
  return Array.from(out).slice(0, need);
}

function genWordCatch(d: Difficulty): Question {
  const n = optCount(d);
  const correct = pick(HINDI_WORDS_STD6);
  const miss = makeHindiMisspellings(correct, n - 1);
  return {
    id: uid(),
    text: `Word Catch (Hindi): सही शब्द चुनो`,
    options: shuffle([correct, ...miss]),
    correctAnswer: correct,
    hint: 'वर्तनी ध्यान से पढ़ो।',
  };
}

const DOHAS: Array<{ a: string; b: string }> = [
  { a: 'रहिमन धागा प्रेम का, मत तोड़ो चटकाय', b: 'टूटे से फिर ना जुड़े, जुड़े गाँठ पड़ जाय' },
  { a: 'रहिमन पानी राखिए, बिन पानी सब सून', b: 'पानी गए न ऊबरे, मोती मानुष चून' },
  { a: 'बड़ा हुआ तो क्या हुआ, जैसे पेड़ खजूर', b: 'पंथी को छाया नहीं, फल लागे अति दूर' },
  { a: 'साईं इतना दीजिए, जामे कुटुंब समाय', b: 'मैं भी भूखा न रहूँ, साधु न भूखा जाय' },
  { a: 'काल करे सो आज कर, आज करे सो अब', b: 'पल में प्रलय होएगी, बहुरि करेगा कब' },
  { a: 'ऐसी वाणी बोलिए, मन का आपा खोय', b: 'औरन को शीतल करे, आपहुं शीतल होय' },
  { a: 'दुर्बल को न सताइए, जाकी मोटी हाय', b: 'मरी खाल की साँस से, लोहा भस्म होय जाय' },
  { a: 'जिन खोजा तिन पाइया, गहरे पानी पैठ', b: 'मैं बपुरा बूडन डरा, रहा किनारे बैठ' },
];

function genDohaMatch(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(DOHAS);
  const askFirst = randInt(0, 1) === 0;
  const stem = askFirst ? item.a : item.b;
  const answer = askFirst ? item.b : item.a;
  const pool = DOHAS.map(x => (askFirst ? x.b : x.a)).filter(x => x !== answer);
  return {
    id: uid(),
    text: `Doha Match: इस पंक्ति का सही जोड़ा चुनो\n"${stem}"`,
    options: shuffle([answer, ...pickN(pool, n - 1)]),
    correctAnswer: answer,
  };
}

const STORY_SETS = [
  { title: 'ईमानदार लकड़हारा', steps: ['लकड़हारा नदी किनारे लकड़ी काटता है', 'कुल्हाड़ी नदी में गिर जाती है', 'देवता सोने-चाँदी की कुल्हाड़ी दिखाते हैं', 'लकड़हारा अपनी लोहे की कुल्हाड़ी पहचानता है', 'उसे इनाम मिलता है'] },
  { title: 'प्यासा कौआ', steps: ['कौए को प्यास लगती है', 'उसे घड़ा मिलता है', 'पानी नीचे होता है', 'कौआ कंकड़ डालता है', 'पानी ऊपर आ जाता है'] },
  { title: 'एकता की ताकत', steps: ['गाँव में समस्या आती है', 'लोग अलग-अलग कोशिश करते हैं', 'समाधान नहीं मिलता', 'सब मिलकर योजना बनाते हैं', 'समस्या हल हो जाती है'] },
  { title: 'स्वच्छ विद्यालय', steps: ['विद्यालय में गंदगी दिखती है', 'कक्षा में चर्चा होती है', 'टीम बनाई जाती है', 'सफाई अभियान चलता है', 'परिसर साफ और सुंदर बनता है'] },
];

function genStoryOrder(d: Difficulty): Question {
  const n = optCount(d);
  const story = pick(STORY_SETS);
  const idx = randInt(0, story.steps.length - 1);
  const ord = idx + 1;
  const wrongNums = pickN(['1', '2', '3', '4', '5'].filter(x => x !== String(ord)), n - 1);
  return {
    id: uid(),
    text: `Story Order (${story.title}):\n"${story.steps[idx]}"\nयह घटना क्रम में कौनसे नंबर पर आती है?`,
    options: shuffle([String(ord), ...wrongNums]),
    correctAnswer: String(ord),
  };
}

const WARM_COLORS = ['Red', 'Orange', 'Yellow', 'Crimson', 'Maroon'];
const COOL_COLORS = ['Blue', 'Green', 'Violet', 'Indigo', 'Teal'];

function genColorBlast(d: Difficulty): Question {
  const n = optCount(d);
  const warmMode = randInt(0, 1) === 0;
  const targetPool = warmMode ? WARM_COLORS : COOL_COLORS;
  const otherPool = warmMode ? COOL_COLORS : WARM_COLORS;
  const correct = pick(targetPool);
  return {
    id: uid(),
    text: `Color Blast (Visual Arts): Select ${warmMode ? 'Warm' : 'Cool'} color`,
    options: shuffle([correct, ...pickN([...targetPool.filter(c => c !== correct), ...otherPool], n - 1)]),
    correctAnswer: correct,
  };
}

function numOptions(correct: number, spread: number): string[] {
  const set = new Set<number>([correct]);
  while (set.size < 5) {
    const v = correct + randInt(-spread, spread);
    if (v >= 0 && v !== correct) set.add(v);
  }
  return shuffle(Array.from(set).map(String));
}

function genRhythmTap(d: Difficulty): Question {
  const beat = d === 'easy' ? randInt(2, 4) : d === 'intermediate' ? randInt(3, 6) : randInt(4, 8);
  const bar = d === 'easy' ? randInt(2, 4) : randInt(3, 6);
  const total = beat * bar;
  return {
    id: uid(),
    text: `Rhythm Tap (Music): If ${beat} beats per bar for ${bar} bars, total beats?`,
    options: numOptions(total, 8),
    correctAnswer: String(total),
  };
}

const DANCE_MOVES = [
  { cue: 'Arms up and clap twice', move: 'Clap Sequence' },
  { cue: 'Step right, step left, turn', move: 'Side Step Turn' },
  { cue: 'Hands on waist and spin', move: 'Waist Spin' },
  { cue: 'Tap heels and jump', move: 'Heel Tap Jump' },
  { cue: 'Raise right hand, bend left', move: 'Pose Switch' },
];

function genDanceMoveMatch(d: Difficulty): Question {
  const n = optCount(d);
  const t = pick(DANCE_MOVES);
  return {
    id: uid(),
    text: `Dance Move Match: Which move matches this cue?\n"${t.cue}"`,
    options: shuffle([t.move, ...pickN(DANCE_MOVES.map(x => x.move).filter(x => x !== t.move), n - 1)]),
    correctAnswer: t.move,
  };
}

function genFitnessReaction(d: Difficulty): Question {
  const n = optCount(d);
  const actions = ['Jump', 'Clap', 'Balance', 'Squat', 'Run in place', 'Stretch'];
  const cue = pick(actions);
  return {
    id: uid(),
    text: `Fitness Reaction (PE): Quick! Do this action`,
    options: shuffle([cue, ...pickN(actions.filter(a => a !== cue), n - 1)]),
    correctAnswer: cue,
  };
}

const MAP_ITEMS = [
  { q: 'Find the continent where India is located', a: 'Asia', options: ['Asia', 'Africa', 'Europe', 'Australia', 'South America'] },
  { q: 'Which ocean lies south of India?', a: 'Indian Ocean', options: ['Indian Ocean', 'Pacific Ocean', 'Atlantic Ocean', 'Arctic Ocean'] },
  { q: 'India is a part of which subcontinent?', a: 'Indian Subcontinent', options: ['Indian Subcontinent', 'Scandinavian Region', 'Arabian Peninsula', 'Balkan Region'] },
  { q: 'Capital city of India is', a: 'New Delhi', options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Jaipur'] },
  { q: 'The Tropic of Cancer passes through', a: 'India', options: ['India', 'Sri Lanka', 'Nepal', 'Bhutan'] },
];

function genMapExplorer(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(MAP_ITEMS);
  return {
    id: uid(),
    text: `Map Explorer (Social Science): ${item.q}`,
    options: shuffle([item.a, ...pickN(item.options.filter(x => x !== item.a), n - 1)]),
    correctAnswer: item.a,
  };
}
// ENGLISH SUBJECT GENERATORS  (from original questionGenerator)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS_U = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS_U = ALPHA.filter(l => !VOWELS_U.includes(l));

const LETTER_SOUNDS: Record<string, string> = {
  A: 'Ã¦ (as in apple)', B: 'buh', C: 'kuh', D: 'duh', E: 'eh (as in egg)',
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

type EnglishChapterTheme = {
  title: string;
  nouns: string[];
  verbs: string[];
  sentences: string[];
  opposites?: [string, string][];
};

const ENGLISH_CHAPTER_THEMES: Record<string, EnglishChapterTheme> = {
  eng_u1_bottle_of_dew: { title: 'A Bottle of Dew', nouns: ['dew', 'farmer', 'field', 'bottle'], verbs: ['work', 'learn', 'collect', 'wait'], sentences: ['The farmer worked in the field.', 'He collected dew in a bottle.', 'Hard work taught him a lesson.'] },
  eng_u1_raven_fox: { title: 'The Raven and the Fox', nouns: ['raven', 'fox', 'tree', 'bread'], verbs: ['sit', 'praise', 'sing', 'drop'], sentences: ['The raven sat on a tree.', 'The fox praised the raven.', 'The bread fell to the ground.'] },
  eng_u1_rama_rescue: { title: 'Rama to the Rescue', nouns: ['rama', 'friend', 'road', 'help'], verbs: ['help', 'run', 'save', 'call'], sentences: ['Rama helped his friend.', 'They ran to safety.', 'Everyone thanked Rama.'] },
  eng_u2_unlikely_best_friends: { title: 'The Unlikely Best Friends', nouns: ['friends', 'child', 'animal', 'park'], verbs: ['share', 'play', 'care', 'smile'], sentences: ['Two unlikely friends played together.', 'They shared food in the park.', 'Kindness made them best friends.'] },
  eng_u2_friends_prayer: { title: 'A Friendâ€™s Prayer', nouns: ['prayer', 'friend', 'heart', 'peace'], verbs: ['pray', 'care', 'help', 'listen'], sentences: ['A friend prayed with a kind heart.', 'We help each other every day.', 'Peace begins with friendship.'] },
  eng_u2_the_chair: { title: 'The Chair', nouns: ['chair', 'room', 'wood', 'seat'], verbs: ['sit', 'move', 'repair', 'carry'], sentences: ['The chair stood in the room.', 'They repaired the old chair.', 'Everyone shared the seat politely.'] },
  eng_u3_neem_baba: { title: 'Neem Baba', nouns: ['neem', 'tree', 'leaf', 'shade'], verbs: ['grow', 'heal', 'protect', 'plant'], sentences: ['The neem tree gives cool shade.', 'Its leaves help people heal.', 'We must plant more trees.'] },
  eng_u3_what_bird_thought: { title: 'What a Bird Thought', nouns: ['bird', 'sky', 'nest', 'branch'], verbs: ['fly', 'think', 'build', 'rest'], sentences: ['The bird flew in the sky.', 'It thought about its nest.', 'It rested on a branch.'] },
  eng_u3_spices_heal_us: { title: 'Spices that Heal Us', nouns: ['spice', 'turmeric', 'ginger', 'kitchen'], verbs: ['heal', 'mix', 'cook', 'drink'], sentences: ['Spices from the kitchen can heal us.', 'Turmeric milk is healthy.', 'Ginger helps in cold weather.'] },
  eng_u4_change_of_heart: { title: 'Change of Heart', nouns: ['heart', 'team', 'choice', 'game'], verbs: ['change', 'forgive', 'support', 'improve'], sentences: ['The player had a change of heart.', 'He supported his team.', 'Good choices improve the game.'] },
  eng_u4_the_winner: { title: 'The Winner', nouns: ['winner', 'race', 'medal', 'effort'], verbs: ['practice', 'run', 'compete', 'win'], sentences: ['The winner practiced daily.', 'She ran with full effort.', 'Hard work helped her win.'] },
  eng_u4_yoga_way_of_life: { title: 'Yogaâ€”A Way of Life', nouns: ['yoga', 'body', 'mind', 'breath'], verbs: ['breathe', 'stretch', 'balance', 'relax'], sentences: ['Yoga keeps body and mind healthy.', 'We breathe slowly in yoga.', 'Daily practice helps us relax.'] },
  eng_u5_hamara_bharat: { title: 'Hamara Bharatâ€”Incredible India!', nouns: ['india', 'culture', 'festival', 'state'], verbs: ['celebrate', 'travel', 'respect', 'learn'], sentences: ['India has rich culture.', 'People celebrate many festivals.', 'We respect every tradition.'] },
  eng_u5_the_kites: { title: 'The Kites', nouns: ['kite', 'string', 'wind', 'sky'], verbs: ['fly', 'hold', 'pull', 'rise'], sentences: ['The kite rose high in the sky.', 'Children held the string tightly.', 'The wind helped the kite fly.'] },
  eng_u5_ila_sachani: { title: 'Ila Sachaniâ€”Embroidering Dreams', nouns: ['ila', 'dream', 'thread', 'art'], verbs: ['embroider', 'create', 'learn', 'inspire'], sentences: ['Ila created art with courage.', 'She embroidered beautiful designs.', 'Her story inspires everyone.'] },
  eng_u5_national_war_memorial: { title: 'National War Memorial', nouns: ['memorial', 'soldier', 'nation', 'honour'], verbs: ['remember', 'serve', 'salute', 'respect'], sentences: ['We remember brave soldiers.', 'They served the nation.', 'The memorial teaches respect and honour.'] },
};

function pluralizeSimple(noun: string): string {
  if (noun.endsWith('y') && !/[aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(noun)) return `${noun}es`;
  return `${noun}s`;
}

function uniqueNormalizedWords(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const word of words) {
    const normalized = word
      .trim()
      .toLowerCase()
      .replace(/^[^a-z]+/i, '')
      .replace(/[^a-z]+$/i, '');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function wordsFromSentence(sentence: string): string[] {
  return uniqueNormalizedWords(sentence.split(/\s+/));
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function uniqueSentences(sentences: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const sentence of sentences) {
    const cleaned = sentence.trim().replace(/\s+/g, ' ');
    const key = normalizeQuestionPart(cleaned).replace(/[.?!]+$/, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned.replace(/[.?!]*$/, '.'));
  }
  return out;
}

function buildEnglishLessonSentences(theme: EnglishChapterTheme): string[] {
  const nouns = theme.nouns.map(word => word.toLowerCase());
  const verbs = theme.verbs.map(word => word.toLowerCase());
  const generated: string[] = [];

  nouns.forEach((noun, nounIndex) => {
    const verb = verbs[nounIndex % verbs.length] || 'learn';
    const nextVerb = verbs[(nounIndex + 1) % verbs.length] || verb;
    generated.push(`In "${theme.title}", we learn about ${noun}.`);
    generated.push(`The lesson reminds us to ${verb} every day.`);
    generated.push(`Students ${verb} with care in this chapter.`);
    generated.push(`The word "${noun}" is important in "${theme.title}".`);
    generated.push(`${capitalizeWord(noun)} helps us ${nextVerb} in the story.`);
    generated.push(`Children ${nextVerb} when they read about ${noun}.`);
    generated.push(`This chapter teaches us about ${noun} and how to ${verb}.`);
  });

  return uniqueSentences([...theme.sentences, ...generated]);
}

function pushUniqueString(target: string[], candidate: string, blocked: string[] = []): void {
  const normalizedCandidate = normalizeQuestionPart(candidate);
  if (!normalizedCandidate) return;
  const exists = [...target, ...blocked].some(value => normalizeQuestionPart(value) === normalizedCandidate);
  if (!exists) target.push(candidate);
}

function swapAdjacentWords(sentence: string): string {
  const words = sentence.split(' ');
  if (words.length < 2) return sentence;
  const index = randInt(0, words.length - 2);
  const copy = [...words];
  [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
  return copy.join(' ');
}

function duplicateSentenceWord(sentence: string): string {
  const words = sentence.split(' ');
  if (words.length === 0) return sentence;
  const index = randInt(0, words.length - 1);
  const copy = [...words];
  copy.splice(index, 0, words[index]);
  return copy.join(' ');
}

function removeSentenceWord(sentence: string): string {
  const words = sentence.split(' ');
  if (words.length < 3) return sentence;
  const index = randInt(1, words.length - 2);
  return words.filter((_, wordIndex) => wordIndex !== index).join(' ');
}

function generateChapterAlignedEnglishQuestion(
  gameTypeId: string,
  difficulty: Difficulty,
  chapterId: string,
): Question | null {
  const theme = ENGLISH_CHAPTER_THEMES[chapterId];
  if (!theme) return null;

  const n = optCount(difficulty);
  const themeNouns = theme.nouns.map(w => w.toLowerCase());
  const themeVerbs = theme.verbs.map(w => w.toLowerCase());
  const themeSentences = buildEnglishLessonSentences(theme).map(sentence => sentence.replace(/[.?!]$/, ''));
  const themeSentenceWords = uniqueNormalizedWords(themeSentences.flatMap(wordsFromSentence));
  const nonNounWords = uniqueNormalizedWords([...themeVerbs, ...ADJECTIVES, ...themeSentenceWords]);
  const mixedNouns = Array.from(new Set([...themeNouns, ...NOUNS]));
  const mixedVerbs = Array.from(new Set([...themeVerbs, ...VERBS]));

  if (gameTypeId === 'find_noun') {
    const mode = randInt(0, 2);

    if (mode === 0) {
      const correct = pick(themeNouns);
      const dist = pickN(nonNounWords.filter(word => word !== correct), n - 1);
      const options = shuffle([correct, ...dist]);
      return {
        id: uid(),
        text: `Word bank from "${theme.title}": ${options.join(', ')}\nWhich word is a noun?`,
        options,
        correctAnswer: correct,
      };
    }

    if (mode === 1) {
      const sentence = pick(themeSentences);
      const sentenceWords = wordsFromSentence(sentence);
      const sentenceNouns = themeNouns.filter(noun => sentenceWords.includes(noun));
      const correct = pick(sentenceNouns.length ? sentenceNouns : themeNouns);
      const dist = pickN(uniqueNormalizedWords([...sentenceWords, ...nonNounWords]).filter(word => word !== correct), n - 1);
      return {
        id: uid(),
        text: `In this sentence from "${theme.title}", which word is a noun?\n${sentence}`,
        options: shuffle([correct, ...dist]),
        correctAnswer: correct,
      };
    }

    const correct = pick(themeNouns);
    const dist = pickN(nonNounWords.filter(word => word !== correct), n - 1);
    const options = shuffle([correct, ...dist]);
    return {
      id: uid(),
      text: `Which naming word belongs to the lesson "${theme.title}"?\nChoose from: ${options.join(' / ')}`,
      options,
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'noun_hunt') {
    const askForNoun = randInt(0, 1) === 0;
    const word = askForNoun ? pick(themeNouns) : pick(nonNounWords.filter(candidate => !themeNouns.includes(candidate)));
    return {
      id: uid(),
      text: `Noun hunt from "${theme.title}": Is "${word}" a noun?`,
      options: ['Yes', 'No'],
      correctAnswer: askForNoun ? 'Yes' : 'No',
    };
  }

  if (gameTypeId === 'plural_maker') {
    const singular = pick(themeNouns);
    const correct = pluralizeSimple(singular);
    const dist = pickN(mixedNouns.filter(w => w !== singular).map(pluralizeSimple).filter(w => w !== correct), n - 1);
    const prompts = [
      `Choose the correct plural form in context ("${theme.title}"): ${singular}`,
      `One ${singular}, many ___`,
      `Select the word that means more than one ${singular}.`,
    ];
    return {
      id: uid(),
      text: pick(prompts),
      options: shuffle([correct, ...dist]),
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'find_verb') {
    const mode = randInt(0, 1);

    if (mode === 0) {
      const correct = pick(themeVerbs);
      const dist = pickN(uniqueNormalizedWords([...themeNouns, ...ADJECTIVES, ...themeSentenceWords]).filter(word => word !== correct), n - 1);
      const options = shuffle([correct, ...dist]);
      return {
        id: uid(),
        text: `Action word bank from "${theme.title}": ${options.join(', ')}\nWhich one is a verb?`,
        options,
        correctAnswer: correct,
      };
    }

    const sentence = pick(themeSentences);
    const sentenceWords = wordsFromSentence(sentence);
    const sentenceVerbs = themeVerbs.filter(verb => sentenceWords.includes(verb));
    const correct = pick(sentenceVerbs.length ? sentenceVerbs : themeVerbs);
    const dist = pickN(uniqueNormalizedWords([...sentenceWords, ...themeNouns, ...ADJECTIVES]).filter(word => word !== correct), n - 1);
    return {
      id: uid(),
      text: `In this sentence from "${theme.title}", which word is the action verb?\n${sentence}`,
      options: shuffle([correct, ...dist]),
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'action_match') {
    const mode = randInt(0, 2);
    const correct = pick(themeVerbs);
    const dist = pickN(uniqueNormalizedWords([...themeNouns, ...ADJECTIVES, ...mixedVerbs]).filter(word => word !== correct), n - 1);
    const options = shuffle([correct, ...dist]);

    if (mode === 0) {
      const desc = VERB_ACTIONS[correct] || `do the action "${correct}"`;
      return {
        id: uid(),
        text: `Which action word from "${theme.title}" means "${desc}"?`,
        options,
        correctAnswer: correct,
      };
    }

    if (mode === 1) {
      const sentence = pick(themeSentences);
      const sentenceWords = wordsFromSentence(sentence);
      const sentenceVerbs = themeVerbs.filter(verb => sentenceWords.includes(verb));
      const sentenceCorrect = pick(sentenceVerbs.length ? sentenceVerbs : themeVerbs);
      const sentenceDist = pickN(uniqueNormalizedWords([...sentenceWords, ...themeNouns, ...ADJECTIVES]).filter(word => word !== sentenceCorrect), n - 1);
      return {
        id: uid(),
        text: `Choose the action word used in this line from "${theme.title}":\n${sentence}`,
        options: shuffle([sentenceCorrect, ...sentenceDist]),
        correctAnswer: sentenceCorrect,
      };
    }

    return {
      id: uid(),
      text: `Pick the action word that best fits the lesson "${theme.title}".\nWord bank: ${options.join(', ')}`,
      options,
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'verb_or_not') {
    const verb = pick(themeVerbs);
    const noun = pick(themeNouns);
    const askVerb = randInt(0, 1) === 1;
    const word = askVerb ? verb : noun;
    return {
      id: uid(),
      text: `Part-of-speech check (${theme.title}): "${word}" is...`,
      options: ['Verb', 'Not Verb'],
      correctAnswer: askVerb ? 'Verb' : 'Not Verb',
    };
  }

  if (gameTypeId === 'word_order') {
    const correctSentence = pick(themeSentences);
    const words = correctSentence.split(' ');
    const wrongs: string[] = [];
    pushUniqueString(wrongs, swapAdjacentWords(correctSentence), [correctSentence]);
    pushUniqueString(wrongs, [...words].reverse().join(' '), [correctSentence]);
    for (let index = 0; index < 10 && wrongs.length < n - 1; index++) {
      pushUniqueString(wrongs, shuffle(words).join(' '), [correctSentence]);
    }
    while (wrongs.length < n - 1) {
      pushUniqueString(wrongs, shuffle(words).join(' '), [correctSentence]);
      if (wrongs.length >= n - 1) break;
      pushUniqueString(wrongs, duplicateSentenceWord(correctSentence), [correctSentence]);
    }
    const prompts = [
      `Reorder these words to form a meaningful sentence from "${theme.title}":\n${shuffle(words).join(' / ')}`,
      `Choose the correctly arranged sentence from "${theme.title}":\n${shuffle(words).join(', ')}`,
      `These lesson words are jumbled. Pick the right sentence:\n${shuffle(words).join(' | ')}`,
    ];
    return {
      id: uid(),
      text: pick(prompts),
      options: shuffle([correctSentence, ...wrongs.slice(0, n - 1)]),
      correctAnswer: correctSentence,
    };
  }

  if (gameTypeId === 'missing_word') {
    const base = pick(themeSentences);
    const words = base.split(' ');
    const candidates = words.filter(w => w.length > 3);
    const ans = (pick(candidates.length ? candidates : words) || '').toLowerCase();
    const blank = base.replace(new RegExp(`\\b${ans}\\b`, 'i'), '___');
    const dist = pickN(uniqueNormalizedWords([...mixedNouns, ...mixedVerbs, ...themeSentenceWords]).filter(w => w !== ans), n - 1);
    const prompts = [
      `Context cloze (${theme.title}). Fill the missing word:\n${blank}`,
      `Choose the missing word from "${theme.title}":\n${blank}`,
      `Complete this chapter line correctly:\n${blank}`,
    ];
    return {
      id: uid(),
      text: pick(prompts),
      options: shuffle([ans, ...dist]),
      correctAnswer: ans,
    };
  }

  if (gameTypeId === 'sentence_fix') {
    const correct = pick(themeSentences);
    const sentenceWords = wordsFromSentence(correct);
    const focusWord = pick(sentenceWords.length ? sentenceWords : [...themeNouns, ...themeVerbs]);
    const wrongs: string[] = [];
    pushUniqueString(wrongs, swapAdjacentWords(correct), [correct]);
    pushUniqueString(wrongs, duplicateSentenceWord(correct), [correct]);
    pushUniqueString(wrongs, removeSentenceWord(correct), [correct]);
    pushUniqueString(wrongs, `${correct} ${pick(themeNouns)}`, [correct]);
    pushUniqueString(wrongs, correct.toLowerCase(), [correct]);
    while (wrongs.length < n - 1) {
      pushUniqueString(wrongs, shuffle(correct.split(' ')).join(' '), [correct]);
    }
    const prompts = [
      `Grammar check (${theme.title}): select the best-formed sentence about "${focusWord}".`,
      `Choose the sentence that is written correctly from "${theme.title}". Focus word: ${focusWord}`,
      `Pick the correct sentence form for this lesson.\nHint word: ${focusWord}`,
    ];
    return {
      id: uid(),
      text: pick(prompts),
      options: shuffle([correct, ...wrongs.slice(0, n - 1)]),
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'match_opposite' || gameTypeId === 'find_opposite' || gameTypeId === 'complete_opposite') {
    const pairs = theme.opposites && theme.opposites.length > 0 ? theme.opposites : OPPOSITES;
    const [a, b] = pick(pairs);
    const dist = pickN(pairs.map(p => p[1]).filter(x => x !== b), n - 1);
    const prompts = gameTypeId === 'complete_opposite'
      ? [
          `Vocabulary task (${theme.title}): Complete the opposite pair.\n${a} - ?`,
          `Finish the opposite pair from "${theme.title}":\n${a} - ?`,
          `Pick the correct opposite to complete this pair:\n${a} - ?`,
        ]
      : [
          `Vocabulary task (${theme.title}): Opposite of "${a}" is?`,
          `Find the opposite word for "${a}" from "${theme.title}".`,
          `Choose the word opposite in meaning to "${a}".`,
        ];
    return {
      id: uid(),
      text: pick(prompts),
      options: shuffle([b, ...dist]),
      correctAnswer: b,
    };
  }

  return null;
}
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
    return { id: uid(), text: `Fill the vowel: "${blanked}" â†’ ?`, options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel };
  }
  const item = pick(d === 'intermediate' ? LONGER_WORDS.slice(0, 15) : LONGER_WORDS);
  const chars = item.word.split('');
  chars[item.vIdx] = '_';
  const blanked = chars.join('');
  const dist = pickN(['a','e','i','o','u'].filter(v => v !== item.vowel), n - 1);
  return { id: uid(), text: `Fill the vowel: "${blanked}" â†’ ?`, options: shuffle([item.vowel, ...dist]), correctAnswer: item.vowel };
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MATHS SUBJECT GENERATORS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SHAPES_BANK = [
  { name: 'Circle', emoji: 'âš«' }, { name: 'Square', emoji: 'â¬›' },
  { name: 'Triangle', emoji: 'ðŸ”º' }, { name: 'Star', emoji: 'â­' },
  { name: 'Diamond', emoji: 'ðŸ”·' }, { name: 'Heart', emoji: 'â¤ï¸' },
  { name: 'Rectangle', emoji: 'ðŸŸ©' }, { name: 'Oval', emoji: 'ðŸ¥š' },
];

const PAT_ITEMS = ['ðŸ”´','ðŸ”µ','ðŸŸ¢','ðŸŸ¡','ðŸŸ£','â¬›','âšª','ðŸŸ '];

const COUNT_OBJ = [
  { name: 'apples', emoji: 'ðŸŽ' }, { name: 'stars', emoji: 'â­' },
  { name: 'hearts', emoji: 'â¤ï¸' }, { name: 'balls', emoji: 'âš½' },
  { name: 'flowers', emoji: 'ðŸŒ¸' }, { name: 'fish', emoji: 'ðŸŸ' },
  { name: 'birds', emoji: 'ðŸ¦' }, { name: 'books', emoji: 'ðŸ“š' },
];

const WEIGHT_PAIRS: [string, string][] = [
  ['Elephant ðŸ˜','Cat ðŸ±'],['Horse ðŸ´','Chicken ðŸ”'],['Bear ðŸ»','Rabbit ðŸ°'],
  ['Cow ðŸ„','Dog ðŸ•'],['Lion ðŸ¦','Mouse ðŸ­'],['Whale ðŸ‹','Fish ðŸŸ'],
  ['Giraffe ðŸ¦’','Hen ðŸ”'],['Tiger ðŸ¯','Frog ðŸ¸'],['Hippo ðŸ¦›','Bird ðŸ¦'],
  ['Rhino ðŸ¦','Duck ðŸ¦†'],['Gorilla ðŸ¦','Ant ðŸœ'],['Camel ðŸ«','Snake ðŸ'],
  ['Donkey ðŸ«','Butterfly ðŸ¦‹'],['Pig ðŸ·','Sparrow ðŸ¦'],['Deer ðŸ¦Œ','Rat ðŸ€'],
  ['Wolf ðŸº','Lizard ðŸ¦Ž'],['Zebra ðŸ¦“','Kitten ðŸ±'],['Ox ðŸ‚','Chick ðŸ¤'],
  ['Seal ðŸ¦­','Crab ðŸ¦€'],['Panda ðŸ¼','Snail ðŸŒ'],['Bison ðŸ¦¬','Parrot ðŸ¦œ'],
  ['Moose ðŸ«Ž','Hamster ðŸ¹'],['Yak ðŸƒ','Bee ðŸ'],['Shark ðŸ¦ˆ','Shrimp ðŸ¦'],
  ['Buffalo ðŸƒ','Squirrel ðŸ¿ï¸'],
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
  return { id: uid(), text: `ðŸŽ ${a} + ${b} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: uid(), text: `${a} âˆ’ ${b} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  const display = selected.map(c => `â‚¹${c}`).join(' + ');
  const correct = `â‚¹${total}`;
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = `â‚¹${randInt(Math.max(1, total - 5), total + 8)}`;
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `Count the coins:\n${display} = ?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

function genMoneyMatch(d: Difficulty): Question {
  const n = optCount(d);
  const amounts = d === 'easy' ? [1, 2, 5] : d === 'intermediate' ? [5, 10, 15, 20] : [10, 15, 20, 25, 50];
  const amount = pick(amounts);
  const combos: string[] = [];
  if (amount === 1) combos.push('â‚¹1 coin');
  else if (amount === 2) combos.push('â‚¹2 coin', 'â‚¹1 + â‚¹1');
  else if (amount === 5) combos.push('â‚¹5 coin', 'â‚¹2 + â‚¹2 + â‚¹1');
  else if (amount === 10) combos.push('â‚¹10 coin', 'â‚¹5 + â‚¹5');
  else if (amount === 15) combos.push('â‚¹10 + â‚¹5');
  else if (amount === 20) combos.push('â‚¹10 + â‚¹10', 'â‚¹20 note');
  else if (amount === 25) combos.push('â‚¹10 + â‚¹10 + â‚¹5');
  else if (amount === 50) combos.push('â‚¹50 note', 'â‚¹20 + â‚¹20 + â‚¹10');
  const correct = combos[0] || `â‚¹${amount}`;
  const wrongAmounts = amounts.filter(a2 => a2 !== amount);
  const dist = pickN(wrongAmounts.map(a2 => `â‚¹${a2}`), n - 1);
  return { id: uid(), text: `Which makes â‚¹${amount}?`, options: shuffle([correct, ...dist.map(d2 => d2 + ' coin')]), correctAnswer: correct };
}

function genCountSort(d: Difficulty): Question {
  const n = optCount(d);
  const categories = [
    { name: 'fruits', items: ['ðŸŽ','ðŸŒ','ðŸŠ','ðŸ‡','ðŸ“'] },
    { name: 'animals', items: ['ðŸ±','ðŸ¶','ðŸ¦','ðŸŸ','ðŸ¸'] },
    { name: 'vehicles', items: ['ðŸš—','ðŸšŒ','ðŸš²','âœˆï¸','ðŸš‚'] },
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
  const items = ['ðŸŽ','ðŸŒ','ðŸŠ','ðŸ‡','ðŸ“'];
  const names = ['Apples','Bananas','Oranges','Grapes','Strawberries'];
  const count = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
  const selected = items.slice(0, count);
  const selectedNames = names.slice(0, count);
  const maxN = d === 'easy' ? 5 : d === 'intermediate' ? 8 : 10;
  const counts = selected.map(() => randInt(1, maxN));
  const chart = selected.map((item, i) => `${item} ${selectedNames[i]}: ${'â–ˆ'.repeat(counts[i])} (${counts[i]})`).join('\n');
  const askIdx = randInt(0, count - 1);
  const correct = String(counts[askIdx]);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(1, maxN));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `Look at the chart:\n${chart}\n\nHow many ${selectedNames[askIdx]}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GENERATOR REGISTRY â€” ONE MAP FOR ALL 44 GAME TYPES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type GenFn = (d: Difficulty) => Question;

const GENERATORS: Record<string, GenFn> = {
  // â”€â”€ Top-8 Arcade â”€â”€
  wordCatch: genWordCatch,
  word_catch: genWordCatch,
  'word-catch': genWordCatch,
  dohaMatch: genDohaMatch,
  danceMoveMatch: genDanceMoveMatch,
  fitnessReaction: genFitnessReaction,
  mapExplorer: genMapExplorer,

  // â”€â”€ English â€“ Nouns â”€â”€
  find_noun: genFindNoun, noun_hunt: genNounHunt, plural_maker: genPluralMaker,
  // â”€â”€ English â€“ Verbs â”€â”€
  find_verb: genFindVerb, action_match: genActionMatch, verb_or_not: genVerbOrNot,
  // â”€â”€ English â€“ Opposites â”€â”€
  match_opposite: genMatchOpposite, find_opposite: genFindOpposite, complete_opposite: genCompleteOpposite,
  // â”€â”€ English â€“ Sentences â”€â”€
  word_order: genWordOrder, missing_word: genMissingWord, sentence_fix: genSentenceFix,

  // â”€â”€ Maths â€“ Numbers â”€â”€
  count_match: genCountMatch, number_order: genNumberOrder, compare_numbers: genCompareNumbers,
  // â”€â”€ Maths â€“ Add/Sub â”€â”€
  adding_apples: genAddingApples, take_away: genTakeAway, match_sum: genMatchSum,
  // â”€â”€ Maths â€“ Shapes â”€â”€
  name_shape: genNameShape, continue_pattern: genContinuePattern, count_shapes: genCountShapes,
  // â”€â”€ Maths â€“ Measurement â”€â”€
  compare_lengths: genCompareLengths, compare_weights: genCompareWeights, measure_match: genMeasureMatch,
  // â”€â”€ Maths â€“ Time & Money â”€â”€
  read_clock: genReadClock, count_coins: genCountCoins, money_match: genMoneyMatch,
  // â”€â”€ Maths â€“ Data â”€â”€
  count_sort: genCountSort, more_or_less: genMoreOrLess, read_chart: genReadChart,
  math_u1_box1_number_patterns: genContinuePattern,
  math_u1_box2_shape_patterns: genNameShape,
  math_u1_box3_pattern_relations: genNumberOrder,
  math_u2_box1_points_lines: genMeasureMatch,
  math_u2_box2_angle_basics: genNameShape,
  math_u2_box3_angle_measure: genCompareLengths,
  math_u3_box1_number_tricks: genCompareNumbers,
  math_u3_box2_number_line: genNumberOrder,
  math_u3_box3_mental_math: genMatchSum,
  math_u4_box1_data_collection: genCountSort,
  math_u4_box2_pictographs: genReadChart,
  math_u4_box3_bar_graphs: genReadChart,
  math_u5_box1_primes: genCompareNumbers,
  math_u5_box2_factors: genCountMatch,
  math_u5_box3_multiples: genMatchSum,
  math_u6_box1_perimeter: genMeasureMatch,
  math_u6_box2_area: genCountShapes,
  math_u6_box3_shape_area: genCountShapes,
  math_u7_box1_fraction_basics: genCountMatch,
  math_u7_box2_fraction_line: genNumberOrder,
  math_u7_box3_fraction_ops: genMatchSum,
  math_u8_box1_square_rectangle: genNameShape,
  math_u8_box2_diagonals: genCompareLengths,
  math_u8_box3_compass: genMeasureMatch,
  math_u9_box1_line_symmetry: genNameShape,
  math_u9_box2_rotational_symmetry: genContinuePattern,
  math_u9_box3_symmetry_art: genContinuePattern,
  math_u10_box1_integer_basics: genCompareNumbers,
  math_u10_box2_integer_line: genNumberOrder,
  math_u10_box3_integer_ops: genTakeAway,
};

type MathsUnitTheme = {
  title: string;
  labels: string[];
  min: number;
  max: number;
  allowNegative?: boolean;
};

const MATHS_UNIT_THEMES: Record<string, MathsUnitTheme> = {
  math_u1_patterns: { title: 'PATTERNS IN MATHEMATICS', labels: ['tiles', 'dots', 'steps', 'rows', 'blocks'], min: 1, max: 300 },
  math_u2_lines_angles: { title: 'Lines and Angles', labels: ['ray', 'line', 'arm', 'corner', 'segment'], min: 1, max: 180 },
  math_u3_number_play: { title: 'NUMBER PLAY', labels: ['digits', 'palindrome', 'clock', 'calendar', 'sequence'], min: 10, max: 1000 },
  math_u4_data_handling: { title: 'Data Handling and Presentation', labels: ['books', 'students', 'pens', 'notebooks', 'bottles'], min: 1, max: 60 },
  math_u5_prime_time: { title: 'Prime Time', labels: ['factors', 'multiples', 'pairs', 'groups', 'sets'], min: 2, max: 300 },
  math_u6_perimeter_area: { title: 'PERIMETER AND AREA', labels: ['rectangle', 'square', 'boundary', 'grid', 'triangle'], min: 1, max: 200 },
  math_u7_fractions: { title: 'Fractions', labels: ['parts', 'slices', 'pieces', 'shares', 'segments'], min: 1, max: 48 },
  math_u8_constructions: { title: 'Playing with Constructions', labels: ['square', 'rectangle', 'diagonal', 'points', 'line'], min: 1, max: 120 },
  math_u9_symmetry: { title: 'SYMMETRY', labels: ['mirror', 'shape', 'axis', 'pattern', 'fold'], min: 1, max: 120 },
  math_u10_integers: { title: 'THE OTHER SIDE OF ZERO', labels: ['tokens', 'integers', 'moves', 'steps', 'balance'], min: -100, max: 100, allowNegative: true },
};

function generateChapterAlignedMathsQuestion(
  gameTypeId: string,
  difficulty: Difficulty,
  chapterId: string,
): Question | null {
  const theme = MATHS_UNIT_THEMES[chapterId];
  if (!theme) return null;

  const n = optCount(difficulty);
  const min = theme.allowNegative ? theme.min : Math.max(1, theme.min);
  const max = theme.max;
  const numOptions = (correct: number, spread = 12): string[] => {
    const opts = new Set<string>([String(correct)]);
    while (opts.size < n) {
      const delta = randInt(-spread, spread) || 1;
      const cand = correct + delta;
      if (!theme.allowNegative && cand < 0) continue;
      opts.add(String(cand));
    }
    return shuffle(Array.from(opts));
  };

  // Unit 1: chapter-specific (Std 6 patterns)
  if (gameTypeId === 'math_u1_box1_number_patterns') {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(8, 60);
      const d = randInt(4, difficulty === 'easy' ? 8 : 15);
      const seq = [a, a + d, a + 2 * d, a + 3 * d];
      const correct = a + 4 * d;
      return { id: uid(), text: `[${theme.title}] AP pattern next term:\n${seq.join(', ')}, ?`, options: numOptions(correct, 20), correctAnswer: String(correct) };
    }
    if (mode === 1) {
      const r = randInt(2, 4);
      const a = randInt(2, 8);
      const seq = [a, a * r, a * r * r, a * r * r * r];
      const correct = a * r * r * r * r;
      return { id: uid(), text: `[${theme.title}] GP pattern next term:\n${seq.join(', ')}, ?`, options: numOptions(correct, Math.max(10, Math.floor(correct / 3))), correctAnswer: String(correct) };
    }
    const nVal = randInt(4, 14);
    const correct = nVal * nVal;
    return { id: uid(), text: `[${theme.title}] Square pattern: nÂ² where n = ${nVal}. Value?`, options: numOptions(correct, 18), correctAnswer: String(correct) };
  }

  if (gameTypeId === 'math_u1_box2_shape_patterns') {
    const sides = [3, 4, 5, 6, 7, 8];
    const start = randInt(0, 2);
    const seq = [sides[start], sides[start + 1], sides[start + 2]];
    const names: Record<number, string> = { 3: 'Triangle', 4: 'Quadrilateral', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon' };
    const correct = names[sides[start + 3]];
    return {
      id: uid(),
      text: `[${theme.title}] Shape pattern by sides:\n${seq[0]}-sided, ${seq[1]}-sided, ${seq[2]}-sided, ?`,
      options: shuffle([correct, ...pickN(Object.values(names).filter(v => v !== correct), n - 1)]),
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'math_u1_box3_pattern_relations') {
    const base = randInt(2, 12);
    const mult = randInt(2, 9);
    const b = base * mult;
    const c = b * mult;
    const correct = c * mult;
    return {
      id: uid(),
      text: `[${theme.title}] Number relation (multiplication pattern):\n${base} -> ${b} -> ${c} -> ?`,
      options: numOptions(correct, Math.max(15, Math.floor(correct / 4))),
      correctAnswer: String(correct),
    };
  }

  // Unit 2
  if (gameTypeId === 'math_u2_box1_points_lines') {
    const mode = randInt(0, 4);
    if (mode === 0) {
      const items = [
        { q: 'How many end points does a line segment have?', a: '2' },
        { q: 'How many end points does a ray have?', a: '1' },
        { q: 'How many end points does a line have?', a: '0' },
      ];
      const item = pick(items);
      return { id: uid(), text: `[${theme.title}] ${item.q}`, options: shuffle(['0', '1', '2', '3', '4'].slice(0, n)), correctAnswer: item.a };
    }
    if (mode === 1) {
      return {
        id: uid(),
        text: `[${theme.title}] Which figure has exactly one end point?`,
        options: shuffle(['Ray', 'Line', 'Line segment', 'Point'].slice(0, n)),
        correctAnswer: 'Ray',
      };
    }
    if (mode === 2) {
      return {
        id: uid(),
        text: `[${theme.title}] Which figure extends forever in both directions?`,
        options: shuffle(['Line', 'Ray', 'Line segment', 'Angle'].slice(0, n)),
        correctAnswer: 'Line',
      };
    }
    if (mode === 3) {
      return {
        id: uid(),
        text: `[${theme.title}] Which figure has two end points?`,
        options: shuffle(['Line segment', 'Ray', 'Line', 'Point'].slice(0, n)),
        correctAnswer: 'Line segment',
      };
    }
    return {
      id: uid(),
      text: `[${theme.title}] A ray starts at one point and extends forever in how many directions?`,
      options: shuffle(['One direction', 'Two directions', 'No direction', 'Four directions'].slice(0, n)),
      correctAnswer: 'One direction',
    };
  }
  if (gameTypeId === 'math_u2_box2_angle_basics') {
    const ang = randInt(10, 170);
    const ans = ang < 90 ? 'Acute angle' : ang === 90 ? 'Right angle' : 'Obtuse angle';
    return { id: uid(), text: `[${theme.title}] Identify angle ${ang}Â°`, options: shuffle(['Acute angle', 'Right angle', 'Obtuse angle', 'Straight angle'].slice(0, n)), correctAnswer: ans };
  }
  if (gameTypeId === 'math_u2_box3_angle_measure') {
    const a = randInt(20, 160);
    return { id: uid(), text: `[${theme.title}] Closest measure of the angle is:`, options: numOptions(a, 20).map(x => `${x}Â°`), correctAnswer: `${a}Â°` };
  }

  // Unit 3
  if (gameTypeId === 'math_u3_box1_number_tricks') {
    const val = randInt(100, 999);
    const pal = String(val) === String(val).split('').reverse().join('');
    return { id: uid(), text: `[${theme.title}] Is ${val} a palindrome number?`, options: ['Yes', 'No'], correctAnswer: pal ? 'Yes' : 'No' };
  }
  if (gameTypeId === 'math_u3_box2_number_line') {
    const a = randInt(-20, 30);
    const b = a + randInt(3, 18);
    const correct = Math.abs(b - a);
    return { id: uid(), text: `[${theme.title}] Distance between ${a} and ${b} on number line`, options: numOptions(correct, 10), correctAnswer: String(correct) };
  }
  if (gameTypeId === 'math_u3_box3_mental_math') {
    const x = randInt(20, 180);
    const y = randInt(10, 90);
    const op = randInt(0, 1) === 0 ? '+' : '-';
    const correct = op === '+' ? x + y : x - y;
    return { id: uid(), text: `[${theme.title}] Mental math: ${x} ${op} ${y} = ?`, options: numOptions(correct, 20), correctAnswer: String(correct) };
  }

  // Unit 4
  if (gameTypeId === 'math_u4_box1_data_collection') {
    const labels = pickN(theme.labels, 4);
    const values = labels.map(() => randInt(8, 36));
    const mode = randInt(0, 1);

    if (mode === 0) {
      const ask = randInt(0, labels.length - 1);
      const correct = values[ask];
      const table = labels.map((l, i) => `${l}: ${values[i]}`).join('\n');
      return {
        id: uid(),
        text: `[${theme.title}] Data table:\n${table}\nHow many ${labels[ask]} were counted?`,
        options: numOptions(correct, 12),
        correctAnswer: String(correct),
      };
    }

    const maxVal = Math.max(...values);
    const correct = labels[values.indexOf(maxVal)];
    return {
      id: uid(),
      text: `[${theme.title}] Which category has the highest count?`,
      options: shuffle(labels),
      correctAnswer: correct,
    };
  }

  if (gameTypeId === 'math_u4_box2_pictographs') {
    const each = pick([2, 3, 4, 5]);
    const symbols = randInt(3, 9);
    const total = each * symbols;
    const emoji = pick(['*', '#', '@', '+']);
    const pictureRow = Array(symbols).fill(emoji).join(' ');
    const mode = randInt(0, 1);

    if (mode === 0) {
      return {
        id: uid(),
        text: `[${theme.title}] Pictograph:\n1 ${emoji} = ${each} students\n${pictureRow}\nTotal students = ?`,
        options: numOptions(total, 12),
        correctAnswer: String(total),
      };
    }

    return {
      id: uid(),
      text: `[${theme.title}] In a pictograph, 1 ${emoji} = ${each} students.\nHow many symbols are needed to show ${total} students?`,
      options: numOptions(symbols, 6),
      correctAnswer: String(symbols),
    };
  }

  if (gameTypeId === 'math_u4_box3_bar_graphs') {
    const labels = pickN(theme.labels, 4);
    const values = labels.map(() => randInt(6, 30));
    const mode = randInt(0, 2);
    const chart = labels
      .map((l, i) => `${l}: ${'#'.repeat(Math.max(1, Math.floor(values[i] / 2)))} (${values[i]})`)
      .join('\n');

    if (mode === 0) {
      const ask = randInt(0, labels.length - 1);
      const correct = values[ask];
      return {
        id: uid(),
        text: `[${theme.title}] Read data:\n${chart}\nValue of "${labels[ask]}"?`,
        options: numOptions(correct, 10),
        correctAnswer: String(correct),
      };
    }

    if (mode === 1) {
      const maxVal = Math.max(...values);
      const correct = labels[values.indexOf(maxVal)];
      return {
        id: uid(),
        text: `[${theme.title}] Read data:\n${chart}\nWhich category has the highest bar?`,
        options: shuffle(labels),
        correctAnswer: correct,
      };
    }

    const minVal = Math.min(...values);
    const correct = labels[values.indexOf(minVal)];
    return {
      id: uid(),
      text: `[${theme.title}] Read data:\n${chart}\nWhich category has the lowest bar?`,
      options: shuffle(labels),
      correctAnswer: correct,
    };
  }
  // Unit 5
  if (gameTypeId === 'math_u5_box1_primes') {
    const x = randInt(20, 150);
    let prime = true;
    for (let i = 2; i * i <= x; i++) if (x % i === 0) prime = false;
    return { id: uid(), text: `[${theme.title}] Is ${x} a prime number?`, options: ['Yes', 'No'], correctAnswer: prime ? 'Yes' : 'No' };
  }
  if (gameTypeId === 'math_u5_box2_factors') {
    const a = randInt(24, 180);
    const b = randInt(2, 12);
    return { id: uid(), text: `[${theme.title}] Is ${b} a factor of ${a}?`, options: ['Yes', 'No'], correctAnswer: a % b === 0 ? 'Yes' : 'No' };
  }
  if (gameTypeId === 'math_u5_box3_multiples') {
    const nVal = randInt(3, 18);
    const k = randInt(4, 14);
    const correct = nVal * k;
    return { id: uid(), text: `[${theme.title}] Which is a multiple of ${nVal}?`, options: numOptions(correct, 16), correctAnswer: String(correct) };
  }

  // Unit 6
  if (gameTypeId === 'math_u6_box1_perimeter') {
    const l = randInt(8, 35), b = randInt(6, 28);
    const correct = 2 * (l + b);
    return { id: uid(), text: `[${theme.title}] Rectangle: l=${l}, b=${b}. Perimeter?`, options: numOptions(correct, 20), correctAnswer: String(correct) };
  }
  if (gameTypeId === 'math_u6_box2_area') {
    const l = randInt(8, 30), b = randInt(6, 24);
    const correct = l * b;
    return { id: uid(), text: `[${theme.title}] Rectangle: l=${l}, b=${b}. Area?`, options: numOptions(correct, 40), correctAnswer: String(correct) };
  }
  if (gameTypeId === 'math_u6_box3_shape_area') {
    const b = randInt(10, 36), h = randInt(8, 30);
    const correct = (b * h) / 2;
    return { id: uid(), text: `[${theme.title}] Triangle: base=${b}, height=${h}. Area?`, options: numOptions(correct, 20), correctAnswer: String(correct) };
  }

  // Unit 7
  if (gameTypeId === 'math_u7_box1_fraction_basics') {
    const den = randInt(3, 12), num = randInt(1, den - 1);
    return { id: uid(), text: `[${theme.title}] In ${num}/${den}, numerator is:`, options: shuffle([String(num), String(den), String(num + 1), String(Math.max(1, den - 1))].slice(0, n)), correctAnswer: String(num) };
  }
  if (gameTypeId === 'math_u7_box2_fraction_line') {
    const den = randInt(4, 12), num = randInt(1, den - 1);
    const correct = `${num}/${den}`;
    return { id: uid(), text: `[${theme.title}] Fraction between 0 and 1 on number line`, options: shuffle([correct, `${den}/${num}`, `${den + 1}/${den}`, `${num + den}/${den}`].slice(0, n)), correctAnswer: correct };
  }
  if (gameTypeId === 'math_u7_box3_fraction_ops') {
    const den = randInt(4, 12), a = randInt(1, den - 2), b = randInt(1, den - 2);
    const correct = `${a + b}/${den}`;
    return { id: uid(), text: `[${theme.title}] ${a}/${den} + ${b}/${den} = ?`, options: shuffle([correct, `${Math.abs(a - b)}/${den}`, `${a + b}/${den + 1}`, `${a * b}/${den}`].slice(0, n)), correctAnswer: correct };
  }

  // Unit 8
  if (gameTypeId === 'math_u8_box1_square_rectangle') {
    const s = randInt(6, 22);
    const correct = 4 * s;
    return { id: uid(), text: `[${theme.title}] Square side = ${s}. Perimeter?`, options: numOptions(correct, 16), correctAnswer: String(correct) };
  }
  if (gameTypeId === 'math_u8_box2_diagonals') {
    const sides = randInt(4, 16);
    const correct = (sides * (sides - 3)) / 2;
    return { id: uid(), text: `[${theme.title}] Diagonals in a ${sides}-sided polygon`, options: numOptions(correct, 14), correctAnswer: String(correct) };
  }
  if (gameTypeId === 'math_u8_box3_compass') {
    const r = randInt(5, 30);
    return { id: uid(), text: `[${theme.title}] Circle radius ${r}. Diameter?`, options: numOptions(2 * r, 10), correctAnswer: String(2 * r) };
  }

  // Unit 9
  if (gameTypeId === 'math_u9_box1_line_symmetry') {
    const s = randInt(3, 12);
    return { id: uid(), text: `[${theme.title}] Lines of symmetry in regular ${s}-gon`, options: numOptions(s, 6), correctAnswer: String(s) };
  }
  if (gameTypeId === 'math_u9_box2_rotational_symmetry') {
    if (randInt(0, 1) === 0) {
      const sides = randInt(3, 12);
      return {
        id: uid(),
        text: `[${theme.title}] Rotational symmetry order of regular ${sides}-gon`,
        options: numOptions(sides, 6),
        correctAnswer: String(sides),
      };
    }
    const order = randInt(2, 12);
    const angle = 360 / order;
    return {
      id: uid(),
      text: `[${theme.title}] Smallest rotation angle of a figure is ${angle} deg. Its order is`,
      options: numOptions(order, 6),
      correctAnswer: String(order),
    };
  }
  if (gameTypeId === 'math_u9_box3_symmetry_art') {
    if (randInt(0, 1) === 0) {
      const foldLines = randInt(1, 8);
      return {
        id: uid(),
        text: `[${theme.title}] A rangoli pattern has ${foldLines} mirror lines. Lines of symmetry = ?`,
        options: numOptions(foldLines, 5),
        correctAnswer: String(foldLines),
      };
    }
    const shapePool: Array<{ name: string; lines: number }> = [
      { name: 'square tile', lines: 4 },
      { name: 'rectangle tile', lines: 2 },
      { name: 'equilateral triangle tile', lines: 3 },
      { name: 'regular hexagon tile', lines: 6 },
      { name: 'circle motif', lines: 100 },
    ];
    const shape = pick(shapePool);
    return {
      id: uid(),
      text: `[${theme.title}] In symmetry art, ${shape.name} has how many lines of symmetry?`,
      options: numOptions(shape.lines, shape.lines === 100 ? 120 : 6),
      correctAnswer: String(shape.lines),
    };
  }

  // Unit 10
  if (gameTypeId === 'math_u10_box1_integer_basics') {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const x = randInt(-100, 100);
      const ans = x > 0 ? 'Positive' : x < 0 ? 'Negative' : 'Zero';
      return { id: uid(), text: `[${theme.title}] Classify integer ${x}`, options: ['Positive', 'Negative', 'Zero'], correctAnswer: ans };
    }
    if (mode === 1) {
      const x = randInt(-50, 50);
      const opposite = -x;
      return {
        id: uid(),
        text: `[${theme.title}] Additive inverse (opposite) of ${x} is`,
        options: numOptions(opposite, 8),
        correctAnswer: String(opposite),
      };
    }
    const x = randInt(-60, 60);
    const abs = Math.abs(x);
    return {
      id: uid(),
      text: `[${theme.title}] Absolute value |${x}| = ?`,
      options: numOptions(abs, 8),
      correctAnswer: String(abs),
    };
  }
  if (gameTypeId === 'math_u10_box2_integer_line') {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(-80, 30), b = a + randInt(5, 40);
      const correct = Math.abs(b - a);
      return { id: uid(), text: `[${theme.title}] Distance between ${a} and ${b} on number line`, options: numOptions(correct, 12), correctAnswer: String(correct) };
    }
    if (mode === 1) {
      const x = randInt(-80, 80);
      const right = x + 1;
      return {
        id: uid(),
        text: `[${theme.title}] Integer immediately to the right of ${x} is`,
        options: numOptions(right, 6),
        correctAnswer: String(right),
      };
    }
    const x = randInt(-80, 80);
    const left = x - 1;
    return {
      id: uid(),
      text: `[${theme.title}] Integer immediately to the left of ${x} is`,
      options: numOptions(left, 6),
      correctAnswer: String(left),
    };
  }
  if (gameTypeId === 'math_u10_box3_integer_ops') {
    const a = randInt(-40, 60), b = randInt(-40, 60);
    const op = randInt(0, 1) === 0 ? '+' : '-';
    const correct = op === '+' ? a + b : a - b;
    return { id: uid(), text: `[${theme.title}] Solve: (${a}) ${op} (${b})`, options: numOptions(correct, 14), correctAnswer: String(correct) };
  }

  return null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PUBLIC API
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Generate a batch of unique questions for a mini-level.
 * Called 5 at a time by GameShell (never 25 at once).
 */
export function generateBatch(
  gameTypeId: string,
  difficulty: Difficulty,
  count: number,
  usedIds: Set<string>,
  historyScope = gameTypeId,
  context?: { subject?: string; chapterId?: string },
): Question[] {
  const baseGen = GENERATORS[gameTypeId];
  if (!baseGen) {
    console.warn(`[QuestionGen] No generator for: ${gameTypeId}`);
    return [];
  }

  const historyKey = `ssms_recent_questions_v2_${historyScope}`;
  const promptHistoryKey = `ssms_recent_question_prompts_v1_${historyScope}`;
  const MAX_HISTORY = 8000;
  const usePromptHistory = context?.subject === 'english';
  let recent = new Set<string>();
  let recentPrompts = new Set<string>();
  try {
    const raw = localStorage.getItem(historyKey);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      recent = new Set(arr);
    }
  } catch { /* ignore malformed history */ }
  if (usePromptHistory) {
    try {
      const raw = localStorage.getItem(promptHistoryKey);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        recentPrompts = new Set(arr);
      }
    } catch { /* ignore malformed prompt history */ }
  }

  const questions: Question[] = [];
  const seen = new Set<string>();
  const seenPrompts = new Set<string>();
  let attempts = 0;
  const buildChapterQuestion = (): Question | null => (
    context?.subject === 'english' && context.chapterId
      ? generateChapterAlignedEnglishQuestion(gameTypeId, difficulty, context.chapterId)
      : context?.subject === 'maths' && context.chapterId
        ? generateChapterAlignedMathsQuestion(gameTypeId, difficulty, context.chapterId)
        : null
  );
  const nextQuestion = (attemptNumber: number): Question => {
    const chapterQuestion = buildChapterQuestion();
    if (!chapterQuestion) return baseGen(difficulty);

    // When a chapter-specific pool gets tight, occasionally fall back to the
    // larger generic generator so the player keeps getting fresh questions.
    if (context?.subject === 'english' && attemptNumber > count * 60 && attemptNumber % 3 === 0) {
      return baseGen(difficulty);
    }

    return chapterQuestion;
  };

  while (questions.length < count && attempts < count * 1200) {
    attempts++;
    try {
      const q = nextQuestion(attempts);
      const key = questionKey(q);
      const promptKey = questionPromptKey(q);
      const promptAlreadyUsed = usePromptHistory && (seenPrompts.has(promptKey) || recentPrompts.has(promptKey));
      if (!seen.has(key) && !usedIds.has(key) && !recent.has(key) && !promptAlreadyUsed) {
        seen.add(key);
        usedIds.add(key);
        recent.add(key);
        if (usePromptHistory) {
          seenPrompts.add(promptKey);
          recentPrompts.add(promptKey);
        }
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  try {
    const trimmed = Array.from(recent).slice(-MAX_HISTORY);
    localStorage.setItem(historyKey, JSON.stringify(trimmed));
  } catch { /* ignore storage failure */ }
  if (usePromptHistory) {
    try {
      const trimmedPrompts = Array.from(recentPrompts).slice(-MAX_HISTORY);
      localStorage.setItem(promptHistoryKey, JSON.stringify(trimmedPrompts));
    } catch { /* ignore storage failure */ }
  }

  return questions;
}

/** Check if a gameTypeId is registered. */
export function hasGenerator(gameTypeId: string): boolean {
  return gameTypeId in GENERATORS;
}

/** All registered game type IDs. */
export function allGameTypeIds(): string[] {
  return Object.keys(GENERATORS);
}




