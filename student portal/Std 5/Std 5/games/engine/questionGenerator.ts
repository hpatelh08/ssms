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

const RECENT_Q_KEY_PREFIX = 'arcadeGames_recentQ';
const MAX_RECENT_Q_PER_GAME = 600;

function recentStoreKey(gameTypeId: string): string {
  return `${RECENT_Q_KEY_PREFIX}:${gameTypeId}`;
}

function readRecentKeys(gameTypeId: string): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(recentStoreKey(gameTypeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecentKeys(gameTypeId: string, keys: string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      recentStoreKey(gameTypeId),
      JSON.stringify(keys.slice(-MAX_RECENT_Q_PER_GAME)),
    );
  } catch {
    // no-op
  }
}

// ────────────────────────────────────────────────────────────
// TOP-8 ARCADE GENERATORS  (emoji-rich text MCQ)
// ────────────────────────────────────────────────────────────

// ─── Color Match ───
const COLORS_DATA: { obj: string; emoji: string; color: string }[] = [
  { obj: 'Sun', emoji: '☀️', color: 'Yellow' },
  { obj: 'Sky', emoji: '🌤️', color: 'Blue' },
  { obj: 'Grass', emoji: '🌿', color: 'Green' },
  { obj: 'Rose', emoji: '🌹', color: 'Red' },
  { obj: 'Banana', emoji: '🍌', color: 'Yellow' },
  { obj: 'Elephant', emoji: '🐘', color: 'Grey' },
  { obj: 'Frog', emoji: '🐸', color: 'Green' },
  { obj: 'Tomato', emoji: '🍅', color: 'Red' },
  { obj: 'Milk', emoji: '🥛', color: 'White' },
  { obj: 'Coal', emoji: '🪨', color: 'Black' },
  { obj: 'Carrot', emoji: '🥕', color: 'Orange' },
  { obj: 'Flamingo', emoji: '🦩', color: 'Pink' },
  { obj: 'Snow', emoji: '❄️', color: 'White' },
  { obj: 'Parrot', emoji: '🦜', color: 'Green' },
  { obj: 'Strawberry', emoji: '🍓', color: 'Red' },
  { obj: 'Orange', emoji: '🍊', color: 'Orange' },
  { obj: 'Grapes', emoji: '🍇', color: 'Purple' },
  { obj: 'Ocean', emoji: '🌊', color: 'Blue' },
  { obj: 'Cloud', emoji: '☁️', color: 'White' },
  { obj: 'Night Sky', emoji: '🌌', color: 'Black' },
  { obj: 'Lemon', emoji: '🍋', color: 'Yellow' },
  { obj: 'Blueberry', emoji: '🫐', color: 'Blue' },
  { obj: 'Watermelon', emoji: '🍉', color: 'Green' },
  { obj: 'Pumpkin', emoji: '🎃', color: 'Orange' },
  { obj: 'Brinjal', emoji: '🍆', color: 'Purple' },
  { obj: 'Swan', emoji: '🦢', color: 'White' },
  { obj: 'Crow', emoji: '🐦‍⬛', color: 'Black' },
  { obj: 'Chocolate', emoji: '🍫', color: 'Brown' },
  { obj: 'Pear', emoji: '🍐', color: 'Green' },
  { obj: 'Cherry', emoji: '🍒', color: 'Red' },
  { obj: 'Marigold', emoji: '🌼', color: 'Orange' },
  { obj: 'Mushroom', emoji: '🍄', color: 'Brown' },
  { obj: 'Panda', emoji: '🐼', color: 'Black' },
  { obj: 'Ice', emoji: '🧊', color: 'White' },
  { obj: 'Blue Fish', emoji: '🐟', color: 'Blue' },
  { obj: 'Rose Leaf', emoji: '🍃', color: 'Green' },
  { obj: 'Red Apple', emoji: '🍎', color: 'Red' },
  { obj: 'Tulip', emoji: '🌷', color: 'Pink' },
  { obj: 'Lavender', emoji: '🪻', color: 'Purple' },
  { obj: 'Sand', emoji: '🏖️', color: 'Brown' },
  { obj: 'Paper', emoji: '📄', color: 'White' },
  { obj: 'Traffic Cone', emoji: '🚧', color: 'Orange' },
  { obj: 'Police Light', emoji: '🚨', color: 'Blue' },
  { obj: 'Fresh Leaves', emoji: '🍀', color: 'Green' },
  { obj: 'Rose Petal', emoji: '🥀', color: 'Red' },
];
const ALL_COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'White', 'Black', 'Grey', 'Brown'];
function genColorMatch(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(COLORS_DATA);
  const dist = pickN(ALL_COLORS.filter(c => c !== item.color), n - 1);
  return { id: uid(), text: `${item.emoji} What color is ${item.obj}?`, options: shuffle([item.color, ...dist]), correctAnswer: item.color };
}

// ─── Missing Number ───
function genMissingNumber(d: Difficulty): Question {
  const n = optCount(d);
  const step = d === 'easy' ? pick([2, 5, 10]) : d === 'intermediate' ? pick([3, 4, 6, 7]) : pick([8, 9, 11, 13]);
  const start = randInt(1, 10) * step;
  const missingPos = randInt(1, 3);
  const series = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
  const answer = series[missingPos];
  const display = series.map((v, i) => i === missingPos ? '❓' : String(v)).join(', ');
  const pool: number[] = [];
  while (pool.length < n - 1) {
    const offset = pick([-step * 2, -step, step, step * 2]);
    const v = answer + offset;
    if (v > 0 && v !== answer && !pool.includes(v)) pool.push(v);
  }
  return { id: uid(), text: `🔢 Complete the series:\n${display}`, options: shuffle([String(answer), ...pool.map(String)]), correctAnswer: String(answer), hint: `Count by ${step}s` };
}

// ─── Bigger or Smaller ───
function genBiggerOrSmaller(d: Difficulty): Question {
  const n = optCount(d);
  const max = d === 'easy' ? 20 : d === 'intermediate' ? 100 : 999;
  let a = randInt(1, max);
  let b = randInt(1, max);
  while (a === b) b = randInt(1, max);
  const isBigger = randInt(0, 1) === 0;
  const answer = isBigger ? String(Math.max(a, b)) : String(Math.min(a, b));
  const wrong = isBigger ? String(Math.min(a, b)) : String(Math.max(a, b));
  return { id: uid(), text: `⚖️ Which is ${isBigger ? 'BIGGER' : 'SMALLER'}?\n${a}  or  ${b}`, options: shuffle([answer, wrong]), correctAnswer: answer };
}

// ─── Opposite Words ───
const OPPOSITES_DATA: { word: string; opposite: string; wrong: string[] }[] = [
  { word: 'Hot',    opposite: 'Cold',   wrong: ['Warm', 'Fire', 'Heat'] },
  { word: 'Big',    opposite: 'Small',  wrong: ['Large', 'Tiny', 'Giant'] },
  { word: 'Happy',  opposite: 'Sad',    wrong: ['Glad', 'Angry', 'Tired'] },
  { word: 'Fast',   opposite: 'Slow',   wrong: ['Quick', 'Run', 'Walk'] },
  { word: 'Day',    opposite: 'Night',  wrong: ['Sun', 'Noon', 'Dark'] },
  { word: 'Up',     opposite: 'Down',   wrong: ['Top', 'High', 'Over'] },
  { word: 'Open',   opposite: 'Close',  wrong: ['Shut', 'Door', 'Lock'] },
  { word: 'Hard',   opposite: 'Soft',   wrong: ['Rough', 'Stone', 'Easy'] },
  { word: 'Old',    opposite: 'New',    wrong: ['Young', 'Ancient', 'Fresh'] },
  { word: 'Dark',   opposite: 'Light',  wrong: ['Shine', 'Bright', 'Color'] },
  { word: 'Tall',   opposite: 'Short',  wrong: ['Long', 'High', 'Thin'] },
  { word: 'Good',   opposite: 'Bad',    wrong: ['Nice', 'Kind', 'Evil'] },
  { word: 'Full',   opposite: 'Empty',  wrong: ['Half', 'Filled', 'Lots'] },
  { word: 'Clean',  opposite: 'Dirty',  wrong: ['Wash', 'Pure', 'Fresh'] },
  { word: 'Strong', opposite: 'Weak',   wrong: ['Brave', 'Power', 'Force'] },
  { word: 'Love',   opposite: 'Hate',   wrong: ['Like', 'Care', 'Fear'] },
  { word: 'Rich',   opposite: 'Poor',   wrong: ['Gold', 'Money', 'Less'] },
  { word: 'Win',    opposite: 'Lose',   wrong: ['Play', 'Game', 'Draw'] },
  { word: 'Start',  opposite: 'End',    wrong: ['Begin', 'Stop', 'Pause'] },
  { word: 'Laugh',  opposite: 'Cry',    wrong: ['Smile', 'Weep', 'Shout'] },
  { word: 'Left',   opposite: 'Right',  wrong: ['Up', 'Near', 'Center'] },
  { word: 'In',     opposite: 'Out',    wrong: ['Up', 'Down', 'Over'] },
  { word: 'Near',   opposite: 'Far',    wrong: ['Close', 'Around', 'Beside'] },
  { word: 'Early',  opposite: 'Late',   wrong: ['Soon', 'Quick', 'Morning'] },
  { word: 'Above',  opposite: 'Below',  wrong: ['Top', 'Middle', 'Across'] },
  { word: 'Thin',   opposite: 'Thick',  wrong: ['Slim', 'Lean', 'Short'] },
  { word: 'Heavy',  opposite: 'Light',  wrong: ['Strong', 'Tall', 'Large'] },
  { word: 'Dry',    opposite: 'Wet',    wrong: ['Warm', 'Hot', 'Dusty'] },
  { word: 'Same',   opposite: 'Different', wrong: ['Equal', 'Similar', 'Twin'] },
  { word: 'Push',   opposite: 'Pull',   wrong: ['Lift', 'Carry', 'Drop'] },
  { word: 'Buy',    opposite: 'Sell',   wrong: ['Trade', 'Keep', 'Spend'] },
  { word: 'Give',   opposite: 'Take',   wrong: ['Share', 'Bring', 'Send'] },
  { word: 'First',  opposite: 'Last',   wrong: ['Start', 'Middle', 'Next'] },
  { word: 'True',   opposite: 'False',  wrong: ['Real', 'Fact', 'Correct'] },
  { word: 'Sharp',  opposite: 'Blunt',  wrong: ['Pointed', 'Thin', 'Edge'] },
  { word: 'Loud',   opposite: 'Quiet',  wrong: ['Noisy', 'Bold', 'Strong'] },
  { word: 'Safe',   opposite: 'Dangerous', wrong: ['Secure', 'Calm', 'Easy'] },
  { word: 'Brave',  opposite: 'Cowardly',  wrong: ['Bold', 'Heroic', 'Strong'] },
  { word: 'Borrow', opposite: 'Lend',   wrong: ['Take', 'Steal', 'Keep'] },
  { word: 'Beautiful', opposite: 'Ugly', wrong: ['Pretty', 'Lovely', 'Clean'] },
];
function genOppositeWords(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(OPPOSITES_DATA);
  const dist = pickN(item.wrong, n - 1);
  return { id: uid(), text: `🔄 What is the opposite of "${item.word}"?`, options: shuffle([item.opposite, ...dist]), correctAnswer: item.opposite };
}

// ─── Animal Sound ───
const ANIMAL_SOUNDS: { animal: string; emoji: string; sound: string; wrong: string[] }[] = [
  { animal: 'Dog',       emoji: '🐕',  sound: 'Bark',    wrong: ['Meow', 'Moo', 'Roar'] },
  { animal: 'Cat',       emoji: '🐱',  sound: 'Meow',    wrong: ['Bark', 'Moo', 'Quack'] },
  { animal: 'Cow',       emoji: '🐄',  sound: 'Moo',     wrong: ['Bark', 'Meow', 'Roar'] },
  { animal: 'Lion',      emoji: '🦁',  sound: 'Roar',    wrong: ['Bark', 'Moo', 'Hiss'] },
  { animal: 'Duck',      emoji: '🦆',  sound: 'Quack',   wrong: ['Moo', 'Bark', 'Chirp'] },
  { animal: 'Snake',     emoji: '🐍',  sound: 'Hiss',    wrong: ['Roar', 'Buzz', 'Bark'] },
  { animal: 'Bee',       emoji: '🐝',  sound: 'Buzz',    wrong: ['Hiss', 'Meow', 'Oink'] },
  { animal: 'Pig',       emoji: '🐷',  sound: 'Oink',    wrong: ['Moo', 'Bark', 'Buzz'] },
  { animal: 'Bird',      emoji: '🐦',  sound: 'Chirp',   wrong: ['Quack', 'Oink', 'Bark'] },
  { animal: 'Frog',      emoji: '🐸',  sound: 'Croak',   wrong: ['Buzz', 'Hiss', 'Moo'] },
  { animal: 'Elephant',  emoji: '🐘',  sound: 'Trumpet', wrong: ['Roar', 'Bark', 'Moo'] },
  { animal: 'Sheep',     emoji: '🐑',  sound: 'Bleat',   wrong: ['Moo', 'Oink', 'Bark'] },
  { animal: 'Horse',     emoji: '🐴',  sound: 'Neigh',   wrong: ['Moo', 'Bark', 'Roar'] },
  { animal: 'Owl',       emoji: '🦉',  sound: 'Hoot',    wrong: ['Chirp', 'Quack', 'Buzz'] },
  { animal: 'Crow',      emoji: '🐦',  sound: 'Caw',     wrong: ['Chirp', 'Hoot', 'Quack'] },
  { animal: 'Donkey',    emoji: '🫏',  sound: 'Bray',    wrong: ['Moo', 'Bark', 'Hoot'] },
  { animal: 'Rooster',   emoji: '🐓',  sound: 'Crow',    wrong: ['Cluck', 'Chirp', 'Quack'] },
  { animal: 'Hen',       emoji: '🐔',  sound: 'Cluck',   wrong: ['Crow', 'Moo', 'Buzz'] },
  { animal: 'Pigeon',    emoji: '🕊️',  sound: 'Coo',     wrong: ['Chirp', 'Hoot', 'Bleat'] },
  { animal: 'Wolf',      emoji: '🐺',  sound: 'Howl',    wrong: ['Roar', 'Hiss', 'Moo'] },
  { animal: 'Mouse',     emoji: '🐭',  sound: 'Squeak',  wrong: ['Hoot', 'Buzz', 'Neigh'] },
  { animal: 'Goat',      emoji: '🐐',  sound: 'Bleat',   wrong: ['Moo', 'Bark', 'Caw'] },
  { animal: 'Turkey',    emoji: '🦃',  sound: 'Gobble',  wrong: ['Coo', 'Meow', 'Moo'] },
  { animal: 'Monkey',    emoji: '🐵',  sound: 'Chatter', wrong: ['Roar', 'Buzz', 'Neigh'] },
  { animal: 'Camel',     emoji: '🐫',  sound: 'Grunt',   wrong: ['Bleat', 'Quack', 'Caw'] },
];
function genAnimalSound(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(ANIMAL_SOUNDS);
  const allSounds = [...new Set(ANIMAL_SOUNDS.map(a => a.sound))];
  const dist = pickN(allSounds.filter(s => s !== item.sound), n - 1);
  return { id: uid(), text: `${item.emoji} What sound does a ${item.animal} make?`, options: shuffle([item.sound, ...dist]), correctAnswer: item.sound };
}

// ─── Picture Memory ───
const MEM_EMOJIS = ['🍎','🚗','🌸','⭐','🎈','🐱','🍕','🎵','🌈','🐘','🦋','🎂','🌙','🚀','🍦','🐸','🌺','🦁','🎀','🎯'];
function genPictureMemory(d: Difficulty): Question {
  const n = optCount(d);
  const count = d === 'easy' ? 2 : d === 'intermediate' ? 3 : 4;
  const shown = pickN(MEM_EMOJIS, count);
  const targetIdx = randInt(0, shown.length - 1);
  const target = shown[targetIdx];
  const pos = ['first', 'second', 'third', 'fourth'][targetIdx];
  const dist = pickN(MEM_EMOJIS.filter(e => !shown.includes(e)), n - 1);
  return { id: uid(), text: `🖼️ Remember these!\n${shown.join('  ')}\n\nWhat was the ${pos} picture?`, options: shuffle([target, ...dist]), correctAnswer: target, hint: `The ${pos} one was ${target}` };
}

// ─── Word Ladder ───
const WORD_LADDER_DATA: { word: string; ladder: string[]; wrong: string[] }[] = [
  { word: 'CAT', ladder: ['BAT','MAT','RAT','HAT','SAT','PAT','FAT'], wrong: ['BIG','SUN','TOP','RUN'] },
  { word: 'BIG', ladder: ['DIG','FIG','JIG','PIG','RIG','WIG'],       wrong: ['CAT','BOX','RUN','TOP'] },
  { word: 'HOP', ladder: ['MOP','TOP','POP','COP','BOP'],             wrong: ['CAT','BIG','FLY','JOY'] },
  { word: 'FAN', ladder: ['BAN','CAN','MAN','PAN','RAN','TAN','VAN'], wrong: ['BIG','SUN','TOP','CAT'] },
  { word: 'HOT', ladder: ['DOT','GOT','LOT','NOT','POT','ROT','TOT'], wrong: ['BIG','SUN','CAT','FLY'] },
  { word: 'PEN', ladder: ['BEN','DEN','HEN','MEN','TEN','YEN'],       wrong: ['CAT','BIG','SUN','TOP'] },
  { word: 'SIT', ladder: ['BIT','FIT','HIT','KIT','PIT','WIT'],       wrong: ['BIG','SUN','CAT','TOP'] },
  { word: 'BUS', ladder: ['GUS','MUS','PUS'],                         wrong: ['CAT','BAT','BIG','TOP'] },
  { word: 'MAP', ladder: ['CAP','GAP','LAP','NAP','SAP','TAP'],       wrong: ['SUN','CAR','BOX','RUG'] },
  { word: 'PIN', ladder: ['BIN','FIN','SIN','TIN','WIN'],             wrong: ['CAT','TOP','RUN','JOY'] },
  { word: 'CAR', ladder: ['BAR','FAR','JAR','PAR','TAR'],             wrong: ['BIG','HOP','SUN','PEN'] },
  { word: 'SUN', ladder: ['BUN','FUN','GUN','RUN'],                   wrong: ['CAT','TOP','BOX','DIG'] },
  { word: 'BED', ladder: ['RED','LED','FED'],                         wrong: ['CAT','BUS','TOP','RUN'] },
  { word: 'LOG', ladder: ['DOG','FOG','JOG'],                         wrong: ['CAT','BIG','SUN','TOP'] },
  { word: 'BUG', ladder: ['HUG','MUG','RUG'],                         wrong: ['CAT','RUN','JOY','DIG'] },
  { word: 'PAN', ladder: ['CAN','FAN','MAN','RAN','TAN','VAN'],       wrong: ['BOX','JOY','TOP','DIG'] },
  { word: 'RING', ladder: ['SING','KING','WING'],                     wrong: ['BOOK','TREE','MOON','STAR'] },
  { word: 'COLD', ladder: ['BOLD','GOLD','HOLD'],                     wrong: ['HOT','SUN','PEN','CAT'] },
  { word: 'FISH', ladder: ['DISH','WISH'],                            wrong: ['BARK','TREE','ROAD','STAR'] },
  { word: 'PLAY', ladder: ['CLAY','GRAY','PRAY'],                     wrong: ['SING','BOOK','HAT','RUN'] },
];
function genWordLadder(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(WORD_LADDER_DATA);
  const correct = pick(item.ladder);
  const dist = pickN(item.wrong, n - 1);
  return { id: uid(), text: `🔤 Change ONE letter in "${item.word}" to make a new word:`, options: shuffle([correct, ...dist]), correctAnswer: correct, hint: `Look for a word that shares 2 letters with ${item.word}` };
}

// ─── Quick Compare ───
function genQuickCompare(d: Difficulty): Question {
  const n = optCount(d);
  const op = d === 'easy' ? pick(['+', '-']) : d === 'intermediate' ? pick(['+', '-', '×']) : pick(['×', '÷']);
  if (op === '+') {
    const max = d === 'easy' ? 10 : 50;
    const a = randInt(1, max); const b = randInt(1, max);
    const ans = a + b;
    const dist: number[] = [];
    while (dist.length < n - 1) { const v = randInt(Math.max(1, ans - 5), ans + 5); if (v !== ans && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `⚡ Quick! ${a} + ${b} = ?`, options: shuffle([String(ans), ...dist.map(String)]), correctAnswer: String(ans) };
  } else if (op === '-') {
    const max = d === 'easy' ? 20 : 50;
    const b2 = randInt(1, Math.floor(max / 2)); const a2 = randInt(b2, max);
    const ans2 = a2 - b2;
    const dist2: number[] = [];
    while (dist2.length < n - 1) { const v = randInt(Math.max(0, ans2 - 5), ans2 + 5); if (v !== ans2 && !dist2.includes(v)) dist2.push(v); }
    return { id: uid(), text: `⚡ Quick! ${a2} - ${b2} = ?`, options: shuffle([String(ans2), ...dist2.map(String)]), correctAnswer: String(ans2) };
  } else if (op === '×') {
    const a3 = randInt(2, 12); const b3 = randInt(2, 12);
    const ans3 = a3 * b3;
    const dist3: number[] = [];
    while (dist3.length < n - 1) { const v = randInt(Math.max(1, ans3 - 10), ans3 + 10); if (v !== ans3 && !dist3.includes(v)) dist3.push(v); }
    return { id: uid(), text: `⚡ Quick! ${a3} × ${b3} = ?`, options: shuffle([String(ans3), ...dist3.map(String)]), correctAnswer: String(ans3) };
  } else {
    const b4 = randInt(2, 10); const ans4 = randInt(2, 12); const a4 = b4 * ans4;
    const dist4: number[] = [];
    while (dist4.length < n - 1) { const v = randInt(Math.max(1, ans4 - 5), ans4 + 5); if (v !== ans4 && !dist4.includes(v)) dist4.push(v); }
    return { id: uid(), text: `⚡ Quick! ${a4} ÷ ${b4} = ?`, options: shuffle([String(ans4), ...dist4.map(String)]), correctAnswer: String(ans4) };
  }
}

// ─── Shape Memory ───
const SHAPE_SEQ_ITEMS = ['🔴','🔵','🟢','🟡','🟠','🟣','⬛','⬜','🔷','🔶','🔺','⭐','💎','🎵','🌸'];
function genShapeMemory(d: Difficulty): Question {
  const n = optCount(d);
  const count = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
  const seq = pickN(SHAPE_SEQ_ITEMS, count);
  const askIdx = randInt(0, seq.length - 1);
  const pos = ['1st','2nd','3rd','4th','5th'][askIdx];
  const correct = seq[askIdx];
  const dist = pickN(SHAPE_SEQ_ITEMS.filter(s => !seq.includes(s)), n - 1);
  return { id: uid(), text: `🔷 Look carefully:\n${seq.join('  ')}\n\nWhat was the ${pos} shape?`, options: shuffle([correct, ...dist]), correctAnswer: correct, hint: `Count from left: ${seq.join(' ')}` };
}

// ─── Find the Pair ───
const PAIR_DATA: { item: string; emoji: string; pair: string; wrong: string[] }[] = [
  { item: 'Pen',         emoji: '🖊️',  pair: 'Paper',      wrong: ['Shoe', 'Plate', 'Chair', 'Lamp'] },
  { item: 'Bread',       emoji: '🍞',  pair: 'Butter',     wrong: ['Soap', 'Pencil', 'Chair', 'Ball'] },
  { item: 'Needle',      emoji: '🪡',  pair: 'Thread',     wrong: ['Milk', 'Brush', 'Book', 'Shoe'] },
  { item: 'Lock',        emoji: '🔒',  pair: 'Key',        wrong: ['Door', 'Window', 'Table', 'Chair'] },
  { item: 'Cup',         emoji: '☕',  pair: 'Saucer',     wrong: ['Spoon', 'Fork', 'Table', 'Lamp'] },
  { item: 'Shoe',        emoji: '👟',  pair: 'Sock',       wrong: ['Hat', 'Ball', 'Pen', 'Book'] },
  { item: 'Sun',         emoji: '☀️',  pair: 'Moon',       wrong: ['Star', 'Cloud', 'Rain', 'Wind'] },
  { item: 'Bat',         emoji: '🏏',  pair: 'Ball',       wrong: ['Shoe', 'Plate', 'Pencil', 'Soap'] },
  { item: 'Book',        emoji: '📖',  pair: 'Library',    wrong: ['Flower', 'Shoe', 'Plate', 'Ball'] },
  { item: 'Toothbrush',  emoji: '🪥',  pair: 'Toothpaste', wrong: ['Soap', 'Pencil', 'Chair', 'Lamp'] },
  { item: 'Doctor',      emoji: '👨‍⚕️', pair: 'Hospital',   wrong: ['School', 'Market', 'Farm', 'River'] },
  { item: 'Farmer',      emoji: '👨‍🌾', pair: 'Farm',       wrong: ['Hospital', 'Library', 'School', 'River'] },
  { item: 'Fish',        emoji: '🐟',  pair: 'Water',      wrong: ['Air', 'Soil', 'Sand', 'Rock'] },
  { item: 'Flower',      emoji: '🌸',  pair: 'Bee',        wrong: ['Dog', 'Cat', 'Fish', 'Cow'] },
  { item: 'Cloud',       emoji: '☁️',  pair: 'Rain',       wrong: ['Sun', 'Moon', 'Star', 'Wind'] },
  { item: 'Salt',        emoji: '🧂',  pair: 'Pepper',     wrong: ['Sugar', 'Milk', 'Bread', 'Soup'] },
  { item: 'Rain',        emoji: '🌧️',  pair: 'Umbrella',   wrong: ['Sunglasses', 'Shoes', 'Hat', 'Fan'] },
  { item: 'Bird',        emoji: '🐦',  pair: 'Nest',       wrong: ['Cave', 'Pond', 'Farm', 'Street'] },
  { item: 'Phone',       emoji: '📱',  pair: 'Charger',    wrong: ['Spoon', 'Pillow', 'Bucket', 'Helmet'] },
  { item: 'Paint',       emoji: '🎨',  pair: 'Brush',      wrong: ['Needle', 'Thread', 'Rope', 'Hammer'] },
  { item: 'Pillow',      emoji: '🛏️',  pair: 'Bed',        wrong: ['Table', 'Door', 'Stove', 'Basket'] },
  { item: 'Bicycle',     emoji: '🚲',  pair: 'Helmet',     wrong: ['Pillow', 'Plate', 'Ladder', 'Notebook'] },
  { item: 'Bee',         emoji: '🐝',  pair: 'Honey',      wrong: ['Milk', 'Juice', 'Water', 'Rice'] },
  { item: 'Fire',        emoji: '🔥',  pair: 'Smoke',      wrong: ['Ice', 'Sand', 'Leaf', 'Cloud'] },
  { item: 'Sock',        emoji: '🧦',  pair: 'Shoe',       wrong: ['Cap', 'Mug', 'Chair', 'Book'] },
  { item: 'Window',      emoji: '🪟',  pair: 'Curtain',    wrong: ['Broom', 'Plate', 'Bottle', 'Pencil'] },
  { item: 'Moon',        emoji: '🌙',  pair: 'Night',      wrong: ['Morning', 'Summer', 'Beach', 'School'] },
  { item: 'Sun',         emoji: '☀️',  pair: 'Day',        wrong: ['Night', 'Rain', 'Snow', 'Wind'] },
  { item: 'Table',       emoji: '🪑',  pair: 'Chair',      wrong: ['Road', 'River', 'Lamp', 'Clock'] },
  { item: 'Farmer',      emoji: '🧑‍🌾', pair: 'Field',      wrong: ['Hospital', 'Classroom', 'Airport', 'Library'] },
  { item: 'Teacher',     emoji: '👩‍🏫', pair: 'Classroom',  wrong: ['River', 'Forest', 'Kitchen', 'Garage'] },
  { item: 'Key',         emoji: '🗝️',  pair: 'Lock',       wrong: ['Chair', 'Paper', 'Bottle', 'Spoon'] },
  { item: 'Shoelace',    emoji: '🥾',  pair: 'Shoe',       wrong: ['Hat', 'Mug', 'Brush', 'Book'] },
  { item: 'Captain',     emoji: '🧭',  pair: 'Ship',       wrong: ['Train', 'Table', 'Garden', 'School'] },
  { item: 'Doctor',      emoji: '🩺',  pair: 'Stethoscope',wrong: ['Compass', 'Hammer', 'Paint', 'Rope'] },
];
function genFindThePair(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(PAIR_DATA);
  const dist = pickN(item.wrong, n - 1);
  return { id: uid(), text: `🧩 ${item.emoji} "${item.item}" goes with → ?`, options: shuffle([item.pair, ...dist]), correctAnswer: item.pair };
}

// ─── Speed Math ───
function genSpeedMath(d: Difficulty): Question {
  const n = optCount(d);
  const op = d === 'easy' ? pick(['add', 'sub']) : d === 'intermediate' ? pick(['add', 'sub', 'mul']) : pick(['mul', 'div', 'mixed']);
  if (op === 'add') {
    const a = randInt(10, 99); const b = randInt(10, 99); const ans = a + b;
    const dist: number[] = []; while (dist.length < n - 1) { const v = randInt(ans - 15, ans + 15); if (v !== ans && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `🏎️ SPEED MATH!\n${a} + ${b} = ?`, options: shuffle([String(ans), ...dist.map(String)]), correctAnswer: String(ans) };
  } else if (op === 'sub') {
    const a = randInt(20, 99); const b = randInt(1, a); const ans = a - b;
    const dist: number[] = []; while (dist.length < n - 1) { const v = randInt(Math.max(0, ans - 10), ans + 10); if (v !== ans && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `🏎️ SPEED MATH!\n${a} - ${b} = ?`, options: shuffle([String(ans), ...dist.map(String)]), correctAnswer: String(ans) };
  } else if (op === 'mul') {
    const a = randInt(2, 12); const b = randInt(2, 12); const ans = a * b;
    const dist: number[] = []; while (dist.length < n - 1) { const v = randInt(Math.max(1, ans - 15), ans + 15); if (v !== ans && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `🏎️ SPEED MATH!\n${a} × ${b} = ?`, options: shuffle([String(ans), ...dist.map(String)]), correctAnswer: String(ans) };
  } else if (op === 'div') {
    const b = randInt(2, 10); const ans = randInt(2, 12); const a = b * ans;
    const dist: number[] = []; while (dist.length < n - 1) { const v = randInt(Math.max(1, ans - 5), ans + 5); if (v !== ans && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `🏎️ SPEED MATH!\n${a} ÷ ${b} = ?`, options: shuffle([String(ans), ...dist.map(String)]), correctAnswer: String(ans) };
  } else {
    const a = randInt(2, 9); const b = randInt(2, 9); const c = randInt(1, 5); const ans = a * b + c;
    const dist: number[] = []; while (dist.length < n - 1) { const v = randInt(ans - 10, ans + 10); if (v !== ans && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `🏎️ SPEED MATH!\n${a} × ${b} + ${c} = ?`, options: shuffle([String(ans), ...dist.map(String)]), correctAnswer: String(ans) };
  }
}

// ─── Brain Maze ───
const MAZE_PUZZLES: { q: string; a: string; w: string[] }[] = [
  { q: 'You face North. Turn RIGHT. Which direction?',              a: 'East',  w: ['West', 'South', 'North'] },
  { q: 'You face East. Turn LEFT. Which direction?',               a: 'North', w: ['South', 'West', 'East'] },
  { q: 'You face South. Turn RIGHT. Which direction?',             a: 'West',  w: ['East', 'North', 'South'] },
  { q: 'You face West. Turn LEFT. Which direction?',               a: 'South', w: ['North', 'East', 'West'] },
  { q: 'You go 3 steps forward, 1 back. Net steps forward?',       a: '2',     w: ['1', '3', '4'] },
  { q: 'You face North. Turn RIGHT twice. Which direction?',       a: 'South', w: ['North', 'East', 'West'] },
  { q: 'You face East. Turn around (180°). Which direction?',      a: 'West',  w: ['North', 'South', 'East'] },
  { q: 'Turn LEFT from South gives you?',                          a: 'East',  w: ['West', 'North', 'South'] },
  { q: 'From North, three LEFT turns. Where do you face?',         a: 'East',  w: ['South', 'West', 'North'] },
  { q: 'From North, turn RIGHT twice, then LEFT. Direction?',      a: 'East',  w: ['West', 'North', 'South'] },
];
function genBrainMaze(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(MAZE_PUZZLES);
  const dist = pickN(item.w, n - 1);
  return { id: uid(), text: `🧩 Brain Maze!\n${item.q}`, options: shuffle([item.a, ...dist]), correctAnswer: item.a };
}

// ─── Hidden Object ───
const ODD_SETS: { q: string; a: string; w: string[] }[] = [
  { q: 'Odd one out:\n🍎 Apple  🍌 Banana  🚗 Car  🍇 Grapes',          a: '🚗 Car',       w: ['🍎 Apple', '🍌 Banana', '🍇 Grapes'] },
  { q: 'Odd one out:\n🐕 Dog  🐱 Cat  🐟 Fish  ✈️ Airplane',             a: '✈️ Airplane',  w: ['🐕 Dog', '🐱 Cat', '🐟 Fish'] },
  { q: 'Odd one out:\n🔴 Red  🔵 Blue  🟢 Green  5️⃣ Five',              a: '5️⃣ Five',      w: ['🔴 Red', '🔵 Blue', '🟢 Green'] },
  { q: 'Which is NOT a shape?\nCircle  Square  Triangle  Elephant',       a: 'Elephant',     w: ['Circle', 'Square', 'Triangle'] },
  { q: 'Odd one out:\nMango  Rose  Banana  Orange',                       a: 'Rose',         w: ['Mango', 'Banana', 'Orange'] },
  { q: 'Which is NOT a vehicle?\n🚗 Car  🚌 Bus  🚂 Train  🏠 House',    a: '🏠 House',     w: ['🚗 Car', '🚌 Bus', '🚂 Train'] },
  { q: 'Odd one out (seasons):\nSummer  Rain  Winter  Monday',            a: 'Monday',       w: ['Summer', 'Rain', 'Winter'] },
  { q: 'Which is NOT a day?\nMonday  Tuesday  January  Friday',           a: 'January',      w: ['Monday', 'Tuesday', 'Friday'] },
  { q: 'Odd one out:\n🐘 Elephant  🦁 Lion  🐯 Tiger  🌻 Sunflower',     a: '🌻 Sunflower', w: ['🐘 Elephant', '🦁 Lion', '🐯 Tiger'] },
  { q: 'Odd one out (school items):\nPen  Book  Eraser  Chair',           a: 'Chair',        w: ['Pen', 'Book', 'Eraser'] },
];
function genHiddenObject(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(ODD_SETS);
  const dist = pickN(item.w, n - 1);
  return { id: uid(), text: `🔎 ${item.q}`, options: shuffle([item.a, ...dist]), correctAnswer: item.a };
}

// ─── Logic Puzzle ───
const LOGIC_PUZZLES: { q: string; a: string; w: string[] }[] = [
  { q: 'If 1+1=2, 2+2=4, 3+3=6, then 4+4=?',            a: '8',   w: ['6', '9', '10'] },
  { q: 'A+A=10, B+B=6. Then A+B=?',                      a: '8',   w: ['16', '4', '9'] },
  { q: 'If Red=1, Blue=2, Green=3, then Red+Green=?',    a: '4',   w: ['3', '5', '6'] },
  { q: '2, 4, 8, 16, ?\n(Pattern: multiply by 2)',       a: '32',  w: ['18', '24', '20'] },
  { q: '1, 4, 9, 16, ?\n(Pattern: square numbers)',      a: '25',  w: ['20', '18', '24'] },
  { q: 'Monday=1, Tuesday=2... what is Friday?',          a: '5',   w: ['4', '6', '7'] },
  { q: 'If CAT=3, DOG=3, then FISH=?',                   a: '4',   w: ['3', '5', '6'] },
  { q: 'A farmer has 3 cows and 2 buffaloes. Total legs?',a: '20',  w: ['10', '15', '25'] },
  { q: '10, 20, 30... what comes 5th?',                  a: '50',  w: ['40', '45', '60'] },
  { q: '3 pens cost ₹9. What is the cost of 1 pen?',     a: '₹3',  w: ['₹6', '₹9', '₹12'] },
];
function genLogicPuzzle(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(LOGIC_PUZZLES);
  const dist = pickN(item.w, n - 1);
  return { id: uid(), text: `🧠 Logic Puzzle!\n${item.q}`, options: shuffle([item.a, ...dist]), correctAnswer: item.a };
}

// ─── Memory Cards ───
function genMemoryCards(d: Difficulty): Question {
  const n = optCount(d);
  const type = pick(['number', 'letter', 'word']);
  if (type === 'number') {
    const count = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
    const nums: number[] = [];
    while (nums.length < count) { const v = randInt(1, 20); if (!nums.includes(v)) nums.push(v); }
    const target = pick(nums);
    const dist: number[] = [];
    while (dist.length < n - 1) { const v = randInt(1, 20); if (v !== target && !nums.includes(v) && !dist.includes(v)) dist.push(v); }
    return { id: uid(), text: `🃏 Memory Cards!\nRemember: ${nums.join('  ')}\n\nWhich number was in the set?`, options: shuffle([String(target), ...dist.map(String)]), correctAnswer: String(target) };
  } else if (type === 'letter') {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const count = d === 'easy' ? 3 : d === 'intermediate' ? 4 : 5;
    const letters = pickN(alpha, count);
    const target = pick(letters);
    const dist = pickN(alpha.filter(l => !letters.includes(l)), n - 1);
    return { id: uid(), text: `🃏 Memory Cards!\nRemember: ${letters.join('  ')}\n\nWhich letter was shown?`, options: shuffle([target, ...dist]), correctAnswer: target };
  } else {
    const words = ['CAT', 'DOG', 'SUN', 'BIG', 'RUN', 'PEN', 'HAT', 'TOP', 'BOX', 'FUN', 'RED', 'BUS'];
    const count = d === 'easy' ? 2 : d === 'intermediate' ? 3 : 4;
    const shown = pickN(words, count);
    const target = pick(shown);
    const dist = pickN(words.filter(w => !shown.includes(w)), n - 1);
    return { id: uid(), text: `🃏 Memory Cards!\nRemember: ${shown.join(' • ')}\n\nWhich word was on the cards?`, options: shuffle([target, ...dist]), correctAnswer: target };
  }
}

// ────────────────────────────────────────────────────────────
// ENGLISH SUBJECT GENERATORS  (from original questionGenerator)
// ────────────────────────────────────────────────────────────
// ── English Chapter Word Banks ──────────────────────────────

// Unit 1 – Papa's Spectacles
const SPECTACLES_BLANKS: { sent: string; ans: string; opts: string[] }[] = [
  { sent: 'Papa cannot read without his ______.', ans: 'spectacles', opts: ['hat', 'shoes', 'bag'] },
  { sent: 'Spectacles are worn on the ______.', ans: 'eyes', opts: ['nose', 'ears', 'mouth'] },
  { sent: 'Papa needed spectacles to ______.', ans: 'read', opts: ['run', 'eat', 'sleep'] },
  { sent: 'Another word for spectacles is ______.', ans: 'glasses', opts: ['shoes', 'cap', 'shirt'] },
  { sent: 'Papa ______ for his spectacles everywhere.', ans: 'searched', opts: ['played', 'cooked', 'danced'] },
  { sent: 'Without spectacles, Papa could not see ______.', ans: 'clearly', opts: ['loudly', 'quickly', 'slowly'] },
  { sent: 'Spectacles have two ______.', ans: 'lenses', opts: ['wheels', 'buttons', 'strings'] },
  { sent: 'Papa wore spectacles because his eyes were ______.', ans: 'weak', opts: ['strong', 'sharp', 'perfect'] },
  { sent: 'The frame of spectacles holds the ______.', ans: 'lenses', opts: ['hinge', 'nose pad', 'frame itself'] },
  { sent: 'Spectacles help people who cannot see things ______.', ans: 'clearly', opts: ['loudly', 'quickly', 'slowly'] },
];
const SPECTACLES_MEANING: { word: string; meaning: string; wrong: string[] }[] = [
  { word: 'spectacles', meaning: 'glasses worn on eyes to see clearly', wrong: ['shoes for running', 'a type of hat', 'a musical instrument'] },
  { word: 'search', meaning: 'to look for something carefully', wrong: ['to cook food', 'to play outside', 'to sleep well'] },
  { word: 'lens', meaning: 'curved glass that helps you see better', wrong: ['a type of toy', 'a piece of cloth', 'a fruit'] },
  { word: 'weak', meaning: 'not strong or powerful', wrong: ['very fast', 'very tall', 'very loud'] },
  { word: 'clear', meaning: 'easy to see or understand', wrong: ['very noisy', 'very heavy', 'very old'] },
];

// Unit 1 – Gone with the Scooter
const SCOOTER_VERBS: { sentence: string; verb: string; opts: string[] }[] = [
  { sentence: 'Papa rides the scooter.', verb: 'rides', opts: ['Papa', 'scooter', 'the'] },
  { sentence: 'The family goes for a ride.', verb: 'goes', opts: ['family', 'ride', 'the'] },
  { sentence: 'Papa starts the engine.', verb: 'starts', opts: ['Papa', 'engine', 'the'] },
  { sentence: 'They enjoy the journey.', verb: 'enjoy', opts: ['They', 'journey', 'the'] },
  { sentence: 'Papa parks the scooter safely.', verb: 'parks', opts: ['Papa', 'scooter', 'safely'] },
  { sentence: 'The scooter moves fast.', verb: 'moves', opts: ['scooter', 'fast', 'the'] },
  { sentence: 'They return home happily.', verb: 'return', opts: ['They', 'home', 'happily'] },
  { sentence: 'Papa cleans the scooter.', verb: 'cleans', opts: ['Papa', 'scooter', 'the'] },
  { sentence: 'The child watches Papa.', verb: 'watches', opts: ['child', 'Papa', 'the'] },
];
const SCOOTER_ORDER: { question: string; correct: string; opts: string[] }[] = [
  { question: 'What is the correct order?\n1. Papa started the scooter\n2. They went for a ride\n3. Papa brought the scooter home', correct: '3 → 1 → 2', opts: ['1 → 2 → 3', '2 → 3 → 1', '3 → 2 → 1'] },
  { question: 'What did Papa do FIRST before the ride?', correct: 'Started the scooter', opts: ['Went for a ride', 'Brought it home', 'Cleaned the scooter'] },
  { question: 'What happened AFTER Papa started the scooter?', correct: 'They went for a ride', opts: ['He bought it', 'He fixed it', 'He washed it'] },
  { question: 'What is the action word meaning to move on a vehicle?', correct: 'ride', opts: ['walk', 'climb', 'swim'] },
];

// Unit 2 – The Rainbow
const RAINBOW_COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];
const RAINBOW_QS: { question: string; ans: string; opts: string[] }[] = [
  { question: 'How many colors are there in a rainbow?', ans: '7', opts: ['5', '6', '8'] },
  { question: 'Which color comes FIRST in the rainbow?', ans: 'Red', opts: ['Orange', 'Yellow', 'Violet'] },
  { question: 'Which color comes LAST in the rainbow?', ans: 'Violet', opts: ['Blue', 'Indigo', 'Red'] },
  { question: 'What color comes after Yellow in a rainbow?', ans: 'Green', opts: ['Blue', 'Orange', 'Indigo'] },
  { question: 'What color comes before Blue in a rainbow?', ans: 'Green', opts: ['Yellow', 'Indigo', 'Orange'] },
  { question: 'Which color comes between Orange and Green?', ans: 'Yellow', opts: ['Blue', 'Indigo', 'Red'] },
  { question: 'When do we usually see a rainbow?', ans: 'After rain with sunshine', opts: ['Only at night', 'Only in winter', 'When it is very dark'] },
  { question: 'Which two colors are at the ends of a rainbow?', ans: 'Red and Violet', opts: ['Orange and Blue', 'Yellow and Green', 'Red and Blue'] },
  { question: 'Which color in the rainbow comes right after Red?', ans: 'Orange', opts: ['Yellow', 'Green', 'Blue'] },
  { question: 'How many colors come AFTER Green in a rainbow?', ans: '3', opts: ['2', '4', '1'] },
];

// Unit 2 – The Wise Parrot
const PARROT_QS: { question: string; ans: string; opts: string[] }[] = [
  { question: 'What kind of bird is the parrot in the story?', ans: 'Wise', opts: ['Angry', 'Lazy', 'Silent'] },
  { question: 'The wise parrot spoke ______.', ans: 'kindly', opts: ['rudely', 'loudly', 'quickly'] },
  { question: 'Pick the adjective: "The wise parrot spoke kindly."', ans: 'wise', opts: ['parrot', 'spoke', 'kindly'] },
  { question: 'Pick the adjective: "The colourful bird sat quietly."', ans: 'colourful', opts: ['bird', 'sat', 'quietly'] },
  { question: 'What is the opposite of wise?', ans: 'foolish', opts: ['kind', 'brave', 'fast'] },
  { question: 'Which word best describes a parrot that gives good advice?', ans: 'wise', opts: ['naughty', 'silly', 'angry'] },
  { question: 'An adjective is a word that describes a ______.', ans: 'noun', opts: ['verb', 'pronoun', 'adverb'] },
  { question: '"The green parrot ate a red fruit." How many adjectives?', ans: '2', opts: ['1', '3', '4'] },
  { question: '"The kind parrot helped the lost traveller." Pick the adjective.', ans: 'kind', opts: ['parrot', 'helped', 'traveller'] },
  { question: 'The parrot in the story is called wise because it ______.', ans: 'gives good advice', opts: ['can fly very fast', 'is very colorful', 'can speak many languages'] },
];

// Unit 3 – The Frog
const FROG_QS: { question: string; ans: string; opts: string[] }[] = [
  { question: 'Where does a frog live?', ans: 'Water and land', opts: ['Only water', 'Only trees', 'Only desert'] },
  { question: 'Frogs belong to which group of animals?', ans: 'Amphibians', opts: ['Reptiles', 'Mammals', 'Birds'] },
  { question: 'The frog likes to ______.', ans: 'jump', opts: ['fly', 'run very fast', 'climb tall trees'] },
  { question: 'Baby frogs are called ______.', ans: 'tadpoles', opts: ['calves', 'kittens', 'cubs'] },
  { question: 'Frogs help farmers by eating ______.', ans: 'insects', opts: ['crops', 'soil', 'grass'] },
  { question: 'A frog has ______ legs.', ans: '4', opts: ['2', '6', '8'] },
  { question: 'Frogs lay their eggs in ______.', ans: 'water', opts: ['trees', 'soil', 'sand'] },
  { question: 'Which place is NOT a natural home for a frog?', ans: 'Desert', opts: ['Pond', 'Lake', 'Wet soil'] },
  { question: 'What sound does a frog make?', ans: 'Croak', opts: ['Moo', 'Bark', 'Roar'] },
  { question: 'Frogs breathe through their ______.', ans: 'skin and lungs', opts: ['gills only', 'only nose', 'fins'] },
];

// Unit 3 – What a Tank!
const TANK_QS: { question: string; ans: string; opts: string[] }[] = [
  { question: 'Why do we store water in tanks?', ans: 'To save water for later use', opts: ['To waste water', 'To play in water', 'To throw water away'] },
  { question: 'What is the main use of water?', ans: 'Drinking and cleaning', opts: ['Playing only', 'Making electricity only', 'Building houses only'] },
  { question: 'Which of these SAVES water?', ans: 'Closing taps properly', opts: ['Leaving the tap running', 'Washing cars daily', 'Filling the pool every day'] },
  { question: 'Rain water can be stored in a ______.', ans: 'tank or well', opts: ['basket', 'box', 'bag'] },
  { question: 'Water is a ______ resource.', ans: 'precious', opts: ['useless', 'unlimited', 'wasted'] },
  { question: 'If there is no water tank, what problem can happen?', ans: 'No water during shortage', opts: ['Too much food', 'Bright sunshine', 'More electricity'] },
  { question: 'Where are water tanks usually placed?', ans: 'On the roof or underground', opts: ['In the bedroom', 'In the classroom', 'In the garden'] },
  { question: 'Which activity WASTES the most water?', ans: 'Leaving the tap open while brushing', opts: ['Using a bucket to bathe', 'Drinking water slowly', 'Watering plants carefully'] },
  { question: 'Water tanks help people when there is a water ______.', ans: 'shortage', opts: ['festival', 'market', 'fair'] },
  { question: 'A village water tank is used for ______.', ans: 'the whole community', opts: ['only one family', 'only animals', 'only the rich'] },
];

// Unit 4 – Gilli Danda
const GILLI_QS: { question: string; ans: string; opts: string[] }[] = [
  { question: 'Gilli Danda is played using:', ans: 'Stick and small wooden piece', opts: ['Ball and bat', 'Football and goal', 'Racket and shuttlecock'] },
  { question: 'Gilli Danda is a ______ sport.', ans: 'traditional Indian', opts: ['modern Olympic', 'western', 'water sport'] },
  { question: 'The small pointed piece of wood in Gilli Danda is called:', ans: 'Gilli', opts: ['Danda', 'Bat', 'Wicket'] },
  { question: 'The long stick in Gilli Danda is called:', ans: 'Danda', opts: ['Gilli', 'Bat', 'Stick'] },
  { question: 'In Gilli Danda, the player tries to:', ans: 'Hit the gilli as far as possible', opts: ['Throw the ball into a net', 'Kick the ball into a goal', 'Jump over a rope'] },
  { question: 'Gilli Danda is usually played ______.', ans: 'outdoors on open ground', opts: ['underwater', 'indoors only', 'on ice'] },
  { question: 'Gilli Danda helps children develop ______.', ans: 'hand and eye coordination', opts: ['cooking skills', 'drawing skills', 'reading skills'] },
  { question: 'Gilli Danda is similar to which modern sport?', ans: 'Cricket', opts: ['Swimming', 'Chess', 'Running'] },
  { question: 'Gilli Danda is known across ______.', ans: 'many parts of India', opts: ['only one city', 'only one village', 'only one school'] },
  { question: 'Gilli Danda is a game that can be played by ______.', ans: 'at least 2 players', opts: ['exactly 100 players', 'exactly 11 players', 'exactly 5 players'] },
];

// Unit 4 – The Panchayat
const PANCHAYAT_QS: { question: string; ans: string; opts: string[] }[] = [
  { question: 'Who makes decisions in a village?', ans: 'Panchayat', opts: ['Doctors', 'Students', 'Children'] },
  { question: 'Panchayat means ______.', ans: 'Village council', opts: ['City market', 'River bank', 'School ground'] },
  { question: 'The leader of a Panchayat is called the ______.', ans: 'Sarpanch', opts: ['Mayor', 'Principal', 'Captain'] },
  { question: 'Panchayat helps settle ______ in a village.', ans: 'disputes and problems', opts: ['crops only', 'weather only', 'festivals only'] },
  { question: 'Who can be a member of the Panchayat?', ans: 'Elected villagers', opts: ['Only doctors', 'Only young children', 'Only teachers'] },
  { question: 'The Panchayat Bhavan is ______.', ans: 'the place where Panchayat meets', opts: ['a school building', 'a market shop', 'a railway station'] },
  { question: 'The decision of the Panchayat is important because:', ans: 'It helps the whole village', opts: ['It is made by one rich person', 'It is only for farmers', 'It does not help anyone'] },
  { question: 'Panchayat is a type of ______ system.', ans: 'self-governance', opts: ['business', 'military', 'entertainment'] },
  { question: 'In a Panchayat, decisions are made by ______.', ans: 'group discussion and voting', opts: ['one person alone', 'children only', 'traders only'] },
  { question: 'The Panchayat system helps villages to be ______.', ans: 'self-reliant', opts: ['dependent on cities', 'always in conflict', 'without any rules'] },
];

// Unit 5 – Vocation
const JOBS: { person: string; work: string }[] = [
  { person: 'Teacher', work: 'teaches students in school' },
  { person: 'Doctor', work: 'treats sick patients' },
  { person: 'Farmer', work: 'grows crops and food' },
  { person: 'Carpenter', work: 'makes furniture from wood' },
  { person: 'Cook', work: 'cooks food in kitchen' },
  { person: 'Driver', work: 'drives buses and cars' },
  { person: 'Engineer', work: 'designs and builds machines' },
  { person: 'Nurse', work: 'cares for sick people in hospital' },
  { person: 'Postman', work: 'delivers letters and parcels' },
  { person: 'Tailor', work: 'stitches and sews clothes' },
  { person: 'Potter', work: 'makes pots from clay' },
  { person: 'Cobbler', work: 'repairs and makes shoes' },
  { person: 'Soldier', work: 'protects and defends the country' },
  { person: 'Pilot', work: 'flies aeroplanes' },
  { person: 'Baker', work: 'bakes bread and cakes' },
];

// Unit 5 – Glass Bangles
const MATERIALS: { object: string; material: string }[] = [
  { object: 'bangles', material: 'glass' },
  { object: 'chair', material: 'wood' },
  { object: 'pot', material: 'clay' },
  { object: 'bucket', material: 'plastic' },
  { object: 'plate', material: 'steel' },
  { object: 'window pane', material: 'glass' },
  { object: 'shoe', material: 'leather' },
  { object: 'rubber band', material: 'rubber' },
  { object: 'spoon', material: 'steel' },
  { object: 'table', material: 'wood' },
  { object: 'coin', material: 'metal' },
  { object: 'brick', material: 'clay' },
  { object: 'bottle', material: 'glass' },
  { object: 'tyre', material: 'rubber' },
  { object: 'bed', material: 'wood' },
  { object: 'box', material: 'cardboard' },
  { object: 'saucer', material: 'steel' },
  { object: 'ring', material: 'gold' },
];

// ── English Generators ─────────────────────────────────────

// ── 1. Papa's Spectacles ─────────────────────────────────────
function genPapasSpectacles(d: Difficulty): Question {
  const n = optCount(d);
  if (d === 'easy' || Math.random() > 0.5) {
    const item = pick(SPECTACLES_BLANKS);
    const dist = pickN(item.opts, n - 1);
    return { id: `ps_${uid()}`, text: item.sent, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
  }
  const item = pick(SPECTACLES_MEANING);
  const dist = pickN(item.wrong, n - 1);
  return { id: `ps_${uid()}`, text: `What does "${item.word}" mean?`, options: shuffle([item.meaning, ...dist]), correctAnswer: item.meaning };
}

// ── 2. Gone with the Scooter ─────────────────────────────────
function genGoneWithScooter(d: Difficulty): Question {
  const n = optCount(d);
  if (d === 'easy' || Math.random() > 0.5) {
    const item = pick(SCOOTER_VERBS);
    const dist = pickN(item.opts, n - 1);
    return { id: `gws_${uid()}`, text: `Find the action word (verb):\n"${item.sentence}"`, options: shuffle([item.verb, ...dist]), correctAnswer: item.verb };
  }
  const item = pick(SCOOTER_ORDER);
  const dist = pickN(item.opts, n - 1);
  return { id: `gws_${uid()}`, text: item.question, options: shuffle([item.correct, ...dist]), correctAnswer: item.correct };
}

// ── 3. The Rainbow ───────────────────────────────────────────
function genTheRainbow(d: Difficulty): Question {
  const n = optCount(d);
  if (Math.random() > 0.35) {
    const item = pick(RAINBOW_QS);
    const dist = pickN(item.opts, n - 1);
    return { id: `tr_${uid()}`, text: item.question, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
  }
  const idx = randInt(1, RAINBOW_COLORS.length - 2);
  const correct = RAINBOW_COLORS[idx + 1];
  const dist = pickN(RAINBOW_COLORS.filter(c => c !== correct), n - 1);
  return { id: `tr_${uid()}`, text: `In the rainbow, what color comes after ${RAINBOW_COLORS[idx]}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 4. The Wise Parrot ───────────────────────────────────────
function genWiseParrot(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(PARROT_QS);
  const dist = pickN(item.opts, n - 1);
  return { id: `wp_${uid()}`, text: item.question, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
}

// ── 5. The Frog ──────────────────────────────────────────────
function genTheFrog(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(FROG_QS);
  const dist = pickN(item.opts, n - 1);
  return { id: `tf_${uid()}`, text: item.question, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
}

// ── 6. What a Tank! ──────────────────────────────────────────
function genWhatATank(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(TANK_QS);
  const dist = pickN(item.opts, n - 1);
  return { id: `wat_${uid()}`, text: item.question, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
}

// ── 7. Gilli Danda ───────────────────────────────────────────
function genGilliDanda(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(GILLI_QS);
  const dist = pickN(item.opts, n - 1);
  return { id: `gd_${uid()}`, text: item.question, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
}

// ── 8. The Panchayat ─────────────────────────────────────────
function genThePanchayat(d: Difficulty): Question {
  const n = optCount(d);
  const item = pick(PANCHAYAT_QS);
  const dist = pickN(item.opts, n - 1);
  return { id: `tp_${uid()}`, text: item.question, options: shuffle([item.ans, ...dist]), correctAnswer: item.ans };
}

// ── 9. Vocation ──────────────────────────────────────────────
function genVocation(d: Difficulty): Question {
  const n = optCount(d);
  if (randInt(0, 1) === 0) {
    const job = pick(JOBS);
    const correct = job.person;
    const dist = pickN(JOBS.filter(j => j.person !== correct).map(j => j.person), n - 1);
    return { id: `vo_${uid()}`, text: `Who ${job.work}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
  }
  const job = pick(JOBS);
  const correct = job.work;
  const dist = pickN(JOBS.filter(j => j.person !== job.person).map(j => j.work), n - 1);
  return { id: `vo_${uid()}`, text: `What does a ${job.person} do?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 10. Glass Bangles ────────────────────────────────────────
function genGlassBangles(d: Difficulty): Question {
  const n = optCount(d);
  if (randInt(0, 1) === 0) {
    const item = pick(MATERIALS);
    const correct = item.material;
    const dist = pickN(MATERIALS.filter(m => m.material !== correct).map(m => m.material), n - 1);
    return { id: `gb_${uid()}`, text: `${item.object.charAt(0).toUpperCase() + item.object.slice(1)} is/are made of ______.`, options: shuffle([correct, ...dist]), correctAnswer: correct };
  }
  const targetMat = pick(['glass', 'wood', 'clay', 'steel', 'rubber', 'leather']);
  const opts = MATERIALS.filter(m => m.material === targetMat);
  const item = opts.length > 0 ? pick(opts) : pick(MATERIALS);
  const correct = item.object;
  const dist = pickN(MATERIALS.filter(m => m.object !== correct).map(m => m.object), n - 1);
  return { id: `gb_${uid()}`, text: `Which of these is made of ${item.material}?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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

// ── Math Word Banks / Constants ────────────────────────────
const PAT_EMOJIS = ['🔺', '🔵', '🟩', '⭐', '🔶', '❤️', '🌙', '🌟'];
const DIRECTIONS = ['North', 'East', 'South', 'West'];
const TURN_MAP: Record<string, Record<string, string>> = {
  North: { '90° right': 'East', '90° left': 'West', '180°': 'South' },
  East:  { '90° right': 'South', '90° left': 'North', '180°': 'West' },
  South: { '90° right': 'West', '90° left': 'East', '180°': 'North' },
  West:  { '90° right': 'North', '90° left': 'South', '180°': 'East' },
};
const SYMMETRICAL = ['Circle', 'Square', 'Rectangle', 'Equilateral Triangle', 'Regular Hexagon', 'Heart', 'Star', 'Diamond'];
const ASYMMETRICAL = ['Scalene Triangle', 'Random Shape', 'Uneven Cloud', 'Irregular Polygon', 'Crooked Arrow'];
const FRAC_SUMS: { q: string; ans: string; wrong: string[] }[] = [
  { q: '1/2 + 1/4 = ?', ans: '3/4', wrong: ['2/6', '1/6', '4/4', '2/4'] },
  { q: '1/4 + 1/4 = ?', ans: '2/4', wrong: ['1/8', '3/4', '1/2', '4/8'] },
  { q: '1/3 + 1/3 = ?', ans: '2/3', wrong: ['2/6', '1/3', '3/3', '2/9'] },
  { q: '1/2 + 1/2 = ?', ans: '1', wrong: ['2/4', '1/4', '2/2', '3/4'] },
  { q: '3/4 - 1/4 = ?', ans: '2/4', wrong: ['1/4', '3/4', '4/4', '1/2'] },
  { q: '2/6 + 1/6 = ?', ans: '3/6', wrong: ['3/12', '1/6', '2/6', '4/6'] },
  { q: '5/8 - 2/8 = ?', ans: '3/8', wrong: ['2/8', '5/8', '7/8', '1/4'] },
  { q: '1/5 + 2/5 = ?', ans: '3/5', wrong: ['2/5', '3/10', '4/5', '1/5'] },
];

// ── 1. Fraction Pizza ───────────────────────────────────────
function genFractionPizza(d: Difficulty): Question {
  const n = optCount(d);
  const denominators = d === 'easy' ? [2, 4] : d === 'intermediate' ? [2, 4, 6, 8] : [2, 3, 4, 6, 8, 10];
  const denom = pick(denominators);
  const eaten = randInt(1, denom - 1);
  const left = denom - eaten;
  const correct = `${left}/${denom}`;
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const wn = randInt(1, denom);
    const wd = randInt(2, denom + 2);
    const w = `${wn}/${wd}`;
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  const food = pick(['pizza 🍕', 'cake 🎂', 'chocolate bar 🍫', 'watermelon 🍉', 'pie 🥧']);
  return { id: uid(), text: `A ${food} is cut into ${denom} equal parts.\nYou eat ${eaten} part${eaten > 1 ? 's' : ''}.\nHow much is left?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 2. Angle Turn Game ──────────────────────────────────────
function genAngleTurn(d: Difficulty): Question {
  const n = optCount(d);
  const turns = d === 'easy' ? ['90° right', '90° left'] : ['90° right', '90° left', '180°'];
  const start = pick(DIRECTIONS);
  const turn = pick(turns);
  const correct = TURN_MAP[start][turn];
  const dist = pickN(DIRECTIONS.filter(dir => dir !== correct), n - 1);
  return { id: uid(), text: `A robot is facing ${start}.\nIt turns ${turn}.\nWhere is it facing now?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 3. Pattern Game ─────────────────────────────────────────
function genPatternGame(d: Difficulty): Question {
  const n = optCount(d);
  const patLen = d === 'easy' ? 2 : d === 'intermediate' ? 3 : 4;
  const items = pickN(PAT_EMOJIS, patLen);
  const repeated = [...items, ...items, items[0]];
  const display = repeated.slice(0, patLen * 2).join(' ') + ' ❓';
  const correct = items[0];
  const dist = pickN(PAT_EMOJIS.filter(e => e !== correct), n - 1);
  return { id: uid(), text: `Find the missing shape:\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 4. Weight Game ──────────────────────────────────────────
function genWeightGame(d: Difficulty): Question {
  const n = optCount(d);
  const heavySets = [
    { q: 'Which is the heaviest?', opts: ['Elephant 🐘', 'Feather 🪶', 'Pen 🖊️', 'Leaf 🍃'], ans: 'Elephant 🐘' },
    { q: 'Which is the heaviest?', opts: ['Apple 🍎', 'Elephant 🐘', 'Cat 🐱', 'Bag 🎒'], ans: 'Elephant 🐘' },
    { q: 'Which is the lightest?', opts: ['Feather 🪶', 'Apple 🍎', 'Book 📚', 'Brick 🧱'], ans: 'Feather 🪶' },
    { q: 'Which is the heaviest?', opts: ['Pumpkin 🎃', 'Grape 🍇', 'Raisin', 'Seed'], ans: 'Pumpkin 🎃' },
    { q: 'Which is the lightest?', opts: ['Paper 📄', 'Rock 🪨', 'Iron pot', 'Watermelon 🍉'], ans: 'Paper 📄' },
  ];
  const item = pick(heavySets);
  const correct = item.ans;
  const dist = pickN(item.opts.filter(o => o !== correct), n - 1);
  return { id: uid(), text: item.q + '\n' + item.opts.slice(0, n).join('  |  '), options: shuffle([correct, ...dist.slice(0, n - 1)]), correctAnswer: correct };
}

// ── 5. Coconut Farm (Multiplication) ────────────────────────
function genCoconutFarm(d: Difficulty): Question {
  const n = optCount(d);
  const maxT = d === 'easy' ? 5 : d === 'intermediate' ? 9 : 12;
  const maxC = d === 'easy' ? 5 : d === 'intermediate' ? 9 : 12;
  const trees = randInt(2, maxT);
  const perTree = randInt(2, maxC);
  const total = trees * perTree;
  const correct = String(total);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(Math.max(1, total - 10), total + 15));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  const farmItem = pick(['coconuts 🥥', 'mangoes 🥭', 'oranges 🍊', 'apples 🍎', 'bananas 🍌']);
  return { id: uid(), text: `One tree has ${perTree} ${farmItem}.\nThere are ${trees} trees.\nHow many ${farmItem} in total?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 6. Time Game (Unit Conversion) ──────────────────────────
function genTimeGame(d: Difficulty): Question {
  const n = optCount(d);
  type Conv = { q: string; ans: number };
  const easy: Conv[] = [
    { q: 'How many seconds in 1 minute?', ans: 60 },
    { q: 'How many minutes in 1 hour?', ans: 60 },
    { q: 'How many hours in 1 day?', ans: 24 },
    { q: 'How many days in 1 week?', ans: 7 },
  ];
  const inter: Conv[] = [
    { q: 'Convert 2 minutes into seconds.', ans: 120 },
    { q: 'Convert 3 minutes into seconds.', ans: 180 },
    { q: 'Convert 2 hours into minutes.', ans: 120 },
    { q: 'How many seconds in 5 minutes?', ans: 300 },
  ];
  const hard: Conv[] = [
    { q: 'Convert 4 minutes 30 seconds into seconds.', ans: 270 },
    { q: 'How many seconds in 1 hour?', ans: 3600 },
    { q: '2 hours 15 minutes = how many minutes?', ans: 135 },
    { q: 'How many minutes in 3 hours?', ans: 180 },
  ];
  const pool = d === 'easy' ? easy : d === 'intermediate' ? inter : hard;
  const conv = pick(pool);
  const correct = String(conv.ans);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const offset = pick([-60, -30, 30, 60, 120, -120, 5, -5, 10, -10]);
    const w = String(Math.max(1, conv.ans + offset));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: conv.q, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 7. Frog Jump (Multiplication) ───────────────────────────
function genFrogJump(d: Difficulty): Question {
  const n = optCount(d);
  const maxJump = d === 'easy' ? 5 : d === 'intermediate' ? 8 : 12;
  const maxLeaps = d === 'easy' ? 5 : d === 'intermediate' ? 8 : 10;
  const jump = randInt(2, maxJump);
  const leaps = randInt(2, maxLeaps);
  const total = jump * leaps;
  const correct = String(total);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(randInt(Math.max(1, total - 8), total + 10));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  const animal = pick(['frog 🐸', 'rabbit 🐰', 'kangaroo 🦘', 'grasshopper 🦗']);
  return { id: uid(), text: `A ${animal} jumps ${jump} metres in one jump.\nHow far will it go in ${leaps} jumps?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 8. Symmetry Game ────────────────────────────────────────
function genSymmetryGame(d: Difficulty): Question {
  const n = optCount(d);
  const askSym = Math.random() > 0.4;
  if (askSym) {
    const correct = pick(SYMMETRICAL);
    const dist = pickN([...ASYMMETRICAL, ...SYMMETRICAL.filter(s => s !== correct)], n - 1);
    return { id: uid(), text: 'Which shape is symmetrical?', options: shuffle([correct, ...dist.slice(0, n - 1)]), correctAnswer: correct };
  } else {
    const correct = pick(ASYMMETRICAL);
    const dist = pickN([...SYMMETRICAL, ...ASYMMETRICAL.filter(s => s !== correct)], n - 1);
    return { id: uid(), text: 'Which shape is NOT symmetrical?', options: shuffle([correct, ...dist.slice(0, n - 1)]), correctAnswer: correct };
  }
}

// ── 9. Fraction Puzzle (Addition) ───────────────────────────
function genFractionPuzzle(d: Difficulty): Question {
  const n = optCount(d);
  const pool = d === 'easy' ? FRAC_SUMS.slice(0, 4) : FRAC_SUMS;
  const fracItem = pick(pool);
  const correct = fracItem.ans;
  const dist = pickN(fracItem.wrong, n - 1);
  return { id: uid(), text: `Solve:\n${fracItem.q}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 10. Pattern Puzzle (Number Sequences) ───────────────────
function genPatternPuzzle(d: Difficulty): Question {
  const n = optCount(d);
  type Seq = { seq: number[]; rule: string };
  const easySeqs: Seq[] = [
    { seq: [2, 4, 6, 8], rule: '+2' }, { seq: [5, 10, 15, 20], rule: '+5' },
    { seq: [1, 3, 5, 7], rule: '+2' }, { seq: [10, 20, 30, 40], rule: '+10' },
    { seq: [3, 6, 9, 12], rule: '+3' },
  ];
  const interSeqs: Seq[] = [
    { seq: [1, 4, 9, 16], rule: 'squares' }, { seq: [2, 6, 12, 20], rule: 'n×(n+1)' },
    { seq: [1, 2, 4, 8], rule: '×2' }, { seq: [100, 90, 80, 70], rule: '-10' },
    { seq: [3, 6, 12, 24], rule: '×2' },
  ];
  const hardSeqs: Seq[] = [
    { seq: [1, 1, 2, 3, 5], rule: 'Fibonacci' }, { seq: [2, 5, 10, 17], rule: '+3,+5,+7' },
    { seq: [1, 8, 27, 64], rule: 'cubes' }, { seq: [7, 14, 28, 56], rule: '×2' },
    { seq: [2, 6, 12, 20], rule: 'n²+n' },
  ];
  const pool = d === 'easy' ? easySeqs : d === 'intermediate' ? interSeqs : hardSeqs;
  const seqItem = pick(pool);
  const seq = seqItem.seq;
  const basicNext = seq[seq.length - 1] + (seq[seq.length - 1] - seq[seq.length - 2]);
  const actualNext = seqItem.rule === 'Fibonacci' ? seq[seq.length - 1] + seq[seq.length - 2]
    : seqItem.rule === 'squares' ? Math.pow(seq.length + 1, 2)
    : seqItem.rule === 'cubes' ? Math.pow(seq.length + 1, 3)
    : seqItem.rule === 'n×(n+1)' ? (seq.length + 1) * (seq.length + 2)
    : basicNext;
  const correct = String(actualNext);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(actualNext + pick([-4, -2, 2, 4, 6, -6, 8, -8, 10, -10, 3, -3]));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: uid(), text: `Find the next number:\n${seq.join(', ')}, ❓`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 11. Time Puzzle (Word Problems) ─────────────────────────
function genTimePuzzle(d: Difficulty): Question {
  const n = optCount(d);
  type TimeProblem = { q: string; ans: string; wrong: string[] };
  const easy: TimeProblem[] = [
    { q: 'A class starts at 9:00 AM.\nIt lasts 1 hour.\nWhen does it end?', ans: '10:00 AM', wrong: ['9:30 AM', '11:00 AM', '10:30 AM'] },
    { q: 'Lunch is at 12:30 PM.\nYou wait 1 hour.\nWhat time is it now?', ans: '1:30 PM', wrong: ['12:00 PM', '2:30 PM', '1:00 PM'] },
  ];
  const inter: TimeProblem[] = [
    { q: 'A train leaves at 3:45 PM.\nTravel time = 2 hours 30 minutes.\nWhen does it arrive?', ans: '6:15 PM', wrong: ['5:45 PM', '6:30 PM', '7:00 PM'] },
    { q: 'School ends at 4:00 PM.\nTuition starts 45 minutes later.\nWhen does tuition start?', ans: '4:45 PM', wrong: ['4:30 PM', '5:00 PM', '5:15 PM'] },
    { q: 'Movie starts at 6:20 PM.\nIt runs for 2 hours 15 minutes.\nWhen does it end?', ans: '8:35 PM', wrong: ['8:20 PM', '9:00 PM', '8:15 PM'] },
  ];
  const hard: TimeProblem[] = [
    { q: 'A bus journey starts at 7:50 AM.\nIt arrives at 11:15 AM.\nHow long is the journey?', ans: '3 hours 25 minutes', wrong: ['3 hours', '3 hours 15 minutes', '4 hours 25 minutes'] },
    { q: 'Work starts at 8:30 AM.\nBreak is 1 hour 15 minutes.\nWork ends at 5:30 PM.\nHow long is actual work time?', ans: '7 hours 45 minutes', wrong: ['8 hours', '7 hours', '9 hours 15 minutes'] },
  ];
  const pool = d === 'easy' ? easy : d === 'intermediate' ? inter : hard;
  const tItem = pick(pool);
  const correct = tItem.ans;
  const dist = pickN(tItem.wrong, n - 1);
  return { id: uid(), text: tItem.q, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 12. Data Graph Game ──────────────────────────────────────
function genDataGraph(d: Difficulty): Question {
  const n = optCount(d);
  const datasets = [
    { title: 'Class fruit survey', items: ['🍎 Apple', '🍌 Banana', '🍊 Orange'] },
    { title: 'Favorite sport survey', items: ['⚽ Football', '🏏 Cricket', '🎾 Tennis'] },
    { title: 'Pet survey', items: ['🐕 Dog', '🐈 Cat', '🐟 Fish'] },
    { title: 'Favourite colour', items: ['🔵 Blue', '🔴 Red', '🟢 Green', '🟡 Yellow'] },
  ];
  const ds = pick(datasets);
  const counts = ds.items.map(() => randInt(2, d === 'difficult' ? 20 : 10));
  const maxIdx = counts.indexOf(Math.max(...counts));
  const minIdx = counts.indexOf(Math.min(...counts));
  const chart = ds.items.map((itm, i) => `${itm} = ${counts[i]} students`).join('\n');
  const askMax = Math.random() > 0.4;
  const targetIdx = askMax ? maxIdx : minIdx;
  const correct = ds.items[targetIdx].split(' ').slice(1).join(' ');
  const dist = pickN(ds.items.filter((_, i) => i !== targetIdx).map(itm => itm.split(' ').slice(1).join(' ')), n - 1);
  return { id: uid(), text: `${ds.title}:\n${chart}\n\nWhich is ${askMax ? 'most' : 'least'} popular?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ────────────────────────────────────────────────────────────
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
  // ── Arcade Games ──
  colorMatch: genColorMatch,
  missingNumber: genMissingNumber,
  biggerOrSmaller: genBiggerOrSmaller,
  oppositeWords: genOppositeWords,
  animalSound: genAnimalSound,
  pictureMemory: genPictureMemory,
  wordLadder: genWordLadder,
  quickCompare: genQuickCompare,
  shapeMemory: genShapeMemory,
  findThePair: genFindThePair,
  speedMath: genSpeedMath,
  brainMaze: genBrainMaze,
  hiddenObject: genHiddenObject,
  logicPuzzle: genLogicPuzzle,
  memoryCards: genMemoryCards,

  // ── English – Unit 1 (Let's Have Fun) ──
  papas_spectacles: genPapasSpectacles, gone_with_scooter: genGoneWithScooter,
  // ── English – Unit 2 (My Colourful World) ──
  the_rainbow: genTheRainbow, wise_parrot: genWiseParrot,
  // ── English – Unit 3 (Water) ──
  the_frog: genTheFrog, what_a_tank: genWhatATank,
  // ── English – Unit 4 (Ups and Downs) ──
  gilli_danda: genGilliDanda, panchayat: genThePanchayat,
  // ── English – Unit 5 (Work is Worship) ──
  vocation: genVocation, glass_bangles: genGlassBangles,

  // ── Maths – Fractions & Patterns ──
  fraction_pizza: genFractionPizza, pattern_game: genPatternGame, fraction_puzzle: genFractionPuzzle,
  // ── Maths – Geometry & Angles ──
  angle_turn: genAngleTurn, symmetry_game: genSymmetryGame, weight_game: genWeightGame,
  // ── Maths – Multiplication & Jumps ──
  coconut_farm: genCoconutFarm, frog_jump: genFrogJump, pattern_puzzle: genPatternPuzzle,
  // ── Maths – Time & Data ──
  time_game: genTimeGame, time_puzzle: genTimePuzzle, data_graph: genDataGraph,

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
  const recent = readRecentKeys(gameTypeId);
  const recentSet = new Set(recent);
  let attempts = 0;

  const toKey = (q: Question) => `${gameTypeId}::${difficulty}::${q.text}::${q.correctAnswer}`;

  while (questions.length < count && attempts < count * 30) {
    attempts++;
    try {
      const q = gen(difficulty);
      const key = toKey(q);
      if (!seen.has(key) && !usedIds.has(key) && !recentSet.has(key)) {
        seen.add(key);
        usedIds.add(key);
        recentSet.add(key);
        recent.push(key);
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  // Fallback 1: allow keys from recent history, but still avoid this session repeats.
  while (questions.length < count && attempts < count * 60) {
    attempts++;
    try {
      const q = gen(difficulty);
      const key = toKey(q);
      if (!seen.has(key) && !usedIds.has(key)) {
        seen.add(key);
        usedIds.add(key);
        recentSet.add(key);
        recent.push(key);
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  // Fallback 2: if pool is exhausted, allow session repeats as last resort.
  while (questions.length < count && attempts < count * 90) {
    attempts++;
    try {
      const q = gen(difficulty);
      const key = toKey(q);
      if (!seen.has(key)) {
        seen.add(key);
        recentSet.add(key);
        recent.push(key);
        questions.push(q);
      }
    } catch { /* skip bad generation */ }
  }

  writeRecentKeys(gameTypeId, recent);
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
