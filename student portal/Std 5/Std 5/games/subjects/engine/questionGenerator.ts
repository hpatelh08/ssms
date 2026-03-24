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

// ── Maths Generators ───────────────────────────────────────

function numRange(d: Difficulty): [number, number] {
  if (d === 'easy') return [1, 20];
  if (d === 'intermediate') return [1, 50];
  return [1, 100];
}

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
  return { id: `fp_${uid()}`, text: `A ${food} is cut into ${denom} equal parts.\nYou eat ${eaten} part${eaten > 1 ? 's' : ''}.\nHow much is left?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 2. Angle Turn Game ──────────────────────────────────────
const DIRECTIONS = ['North', 'East', 'South', 'West'];
const TURN_MAP: Record<string, Record<string, string>> = {
  North: { '90° right': 'East', '90° left': 'West', '180°': 'South' },
  East:  { '90° right': 'South', '90° left': 'North', '180°': 'West' },
  South: { '90° right': 'West', '90° left': 'East', '180°': 'North' },
  West:  { '90° right': 'North', '90° left': 'South', '180°': 'East' },
};
function genAngleTurn(d: Difficulty): Question {
  const n = optCount(d);
  const turns = d === 'easy' ? ['90° right', '90° left'] : ['90° right', '90° left', '180°'];
  const start = pick(DIRECTIONS);
  const turn = pick(turns);
  const correct = TURN_MAP[start][turn];
  const dist = pickN(DIRECTIONS.filter(dir => dir !== correct), n - 1);
  return { id: `at_${uid()}`, text: `A robot is facing ${start}.\nIt turns ${turn}.\nWhere is it facing now?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 3. Pattern Game ─────────────────────────────────────────
const PAT_EMOJIS = ['🔺', '🔵', '🟩', '⭐', '🔶', '❤️', '🌙', '🌟'];
function genPatternGame(d: Difficulty): Question {
  const n = optCount(d);
  const patLen = d === 'easy' ? 2 : d === 'intermediate' ? 3 : 4;
  const items = pickN(PAT_EMOJIS, patLen);
  const repeated = [...items, ...items, items[0]];
  const display = repeated.slice(0, patLen * 2).join(' ') + ' ❓';
  const correct = items[0];
  const dist = pickN(PAT_EMOJIS.filter(e => e !== correct), n - 1);
  return { id: `pg_${uid()}`, text: `Find the missing shape:\n${display}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 4. Weight Game ──────────────────────────────────────────
const WEIGHT_GROUPS = [
  ['Elephant 🐘', 'Car 🚗', 'Horse 🐴', 'Cow 🐄'],
  ['Feather 🪶', 'Leaf 🍃', 'Paper 📄', 'Ant 🐜'],
  ['Watermelon 🍉', 'Pumpkin 🎃', 'Book 📚', 'Brick 🧱'],
  ['Apple 🍎', 'Orange 🍊', 'Mango 🥭', 'Potato 🥔'],
];
const WEIGHT_CORRECT = ['Elephant 🐘', 'Watermelon 🍉', 'Watermelon 🍉', 'Apple 🍎'];
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
  return { id: `wg_${uid()}`, text: item.q + '\n' + item.opts.slice(0, n).join('  |  '), options: shuffle([correct, ...dist.slice(0, n - 1)]), correctAnswer: correct };
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
  const item = pick(['coconuts 🥥', 'mangoes 🥭', 'oranges 🍊', 'apples 🍎', 'bananas 🍌']);
  return { id: `cf_${uid()}`, text: `One tree has ${perTree} ${item}.\nThere are ${trees} trees.\nHow many ${item} in total?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  const item = pick(pool);
  const correct = String(item.ans);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const offset = pick([-60, -30, 30, 60, 120, -120, 5, -5, 10, -10]);
    const w = String(Math.max(1, item.ans + offset));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: `tg_${uid()}`, text: item.q, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  return { id: `fj_${uid()}`, text: `A ${animal} jumps ${jump} metres in one jump.\nHow far will it go in ${leaps} jumps?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── 8. Symmetry Game ────────────────────────────────────────
const SYMMETRICAL = ['Circle', 'Square', 'Rectangle', 'Equilateral Triangle', 'Regular Hexagon', 'Heart', 'Star', 'Diamond'];
const ASYMMETRICAL = ['Scalene Triangle', 'Random Shape', 'Uneven Cloud', 'Irregular Polygon', 'Crooked Arrow'];
function genSymmetryGame(d: Difficulty): Question {
  const n = optCount(d);
  const askSym = Math.random() > 0.4;
  if (askSym) {
    const correct = pick(SYMMETRICAL);
    const dist = pickN([...ASYMMETRICAL, ...SYMMETRICAL.filter(s => s !== correct)], n - 1);
    return { id: `sg_${uid()}`, text: 'Which shape is symmetrical?', options: shuffle([correct, ...dist.slice(0, n - 1)]), correctAnswer: correct };
  } else {
    const correct = pick(ASYMMETRICAL);
    const dist = pickN([...SYMMETRICAL, ...ASYMMETRICAL.filter(s => s !== correct)], n - 1);
    return { id: `sg_${uid()}`, text: 'Which shape is NOT symmetrical?', options: shuffle([correct, ...dist.slice(0, n - 1)]), correctAnswer: correct };
  }
}

// ── 9. Fraction Puzzle (Addition) ───────────────────────────
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
function genFractionPuzzle(d: Difficulty): Question {
  const n = optCount(d);
  const pool = d === 'easy' ? FRAC_SUMS.slice(0, 4) : FRAC_SUMS;
  const item = pick(pool);
  const correct = item.ans;
  const dist = pickN(item.wrong, n - 1);
  return { id: `fpu_${uid()}`, text: `Solve:\n${item.q}`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  const item = pick(pool);
  const seq = item.seq;
  const next = seq[seq.length - 1] + (seq[seq.length - 1] - seq[seq.length - 2]);
  // Use Fibonacci properly
  const actualNext = item.rule === 'Fibonacci' ? seq[seq.length - 1] + seq[seq.length - 2]
    : item.rule === 'squares' ? Math.pow(seq.length + 1, 2)
    : item.rule === 'cubes' ? Math.pow(seq.length + 1, 3)
    : item.rule === 'n×(n+1)' ? (seq.length + 1) * (seq.length + 2)
    : next;
  const correct = String(actualNext);
  const dist: string[] = [];
  while (dist.length < n - 1) {
    const w = String(actualNext + pick([-4, -2, 2, 4, 6, -6, 8, -8, 10, -10, 3, -3]));
    if (w !== correct && !dist.includes(w)) dist.push(w);
  }
  return { id: `pp_${uid()}`, text: `Find the next number:\n${seq.join(', ')}, ❓`, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  const item = pick(pool);
  const correct = item.ans;
  const dist = pickN(item.wrong, n - 1);
  return { id: `tp_${uid()}`, text: item.q, options: shuffle([correct, ...dist]), correctAnswer: correct };
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
  const counts = ds.items.map(() => randInt(2, d === 'hard' ? 20 : 10));
  const maxIdx = counts.indexOf(Math.max(...counts));
  const minIdx = counts.indexOf(Math.min(...counts));
  const chart = ds.items.map((item, i) => `${item} = ${counts[i]} students`).join('\n');
  const askMax = Math.random() > 0.4;
  const targetIdx = askMax ? maxIdx : minIdx;
  const correct = ds.items[targetIdx].split(' ').slice(1).join(' ');
  const dist = pickN(ds.items.filter((_, i) => i !== targetIdx).map(item => item.split(' ').slice(1).join(' ')), n - 1);
  return { id: `dg_${uid()}`, text: `${ds.title}:\n${chart}\n\nWhich is ${askMax ? 'most' : 'least'} popular?`, options: shuffle([correct, ...dist]), correctAnswer: correct };
}

// ── Science Word Banks ─────────────────────────────────────

const LIVING_THINGS = ['dog','cat','bird','fish','tree','flower','butterfly','ant','frog','cow','hen','parrot','lion','elephant','snake'];
const NON_LIVING = ['stone','book','chair','table','ball','car','pen','bottle','shoe','cup','clock','bag','plate','bell','box'];

const PLANT_PARTS: { part: string; job: string }[] = [
  { part: 'Root', job: 'absorbs water from soil' },
  { part: 'Stem', job: 'carries water to leaves' },
  { part: 'Leaf', job: 'makes food using sunlight' },
  { part: 'Flower', job: 'helps plant make seeds' },
  { part: 'Fruit', job: 'protects the seeds' },
  { part: 'Seed', job: 'grows into a new plant' },
];

const ANIMAL_HOMES: { animal: string; home: string }[] = [
  { animal: 'Bird', home: 'Nest' }, { animal: 'Dog', home: 'Kennel' },
  { animal: 'Bee', home: 'Hive' }, { animal: 'Rabbit', home: 'Burrow' },
  { animal: 'Fish', home: 'Water' }, { animal: 'Lion', home: 'Den' },
  { animal: 'Horse', home: 'Stable' }, { animal: 'Spider', home: 'Web' },
  { animal: 'Ant', home: 'Anthill' }, { animal: 'Cow', home: 'Shed' },
];

const ANIMAL_FOODS: { animal: string; food: string }[] = [
  { animal: 'Cow', food: 'Grass' }, { animal: 'Cat', food: 'Fish' },
  { animal: 'Rabbit', food: 'Carrot' }, { animal: 'Monkey', food: 'Banana' },
  { animal: 'Dog', food: 'Meat' }, { animal: 'Parrot', food: 'Seeds' },
  { animal: 'Lion', food: 'Meat' }, { animal: 'Hen', food: 'Grains' },
  { animal: 'Bear', food: 'Honey' }, { animal: 'Goat', food: 'Grass' },
];

const ANIMAL_TYPES: { animal: string; type: string }[] = [
  { animal: 'Dog', type: 'Pet' }, { animal: 'Lion', type: 'Wild' },
  { animal: 'Cow', type: 'Farm' }, { animal: 'Tiger', type: 'Wild' },
  { animal: 'Cat', type: 'Pet' }, { animal: 'Hen', type: 'Farm' },
  { animal: 'Elephant', type: 'Wild' }, { animal: 'Horse', type: 'Farm' },
  { animal: 'Goldfish', type: 'Pet' }, { animal: 'Parrot', type: 'Pet' },
];

const BODY_PARTS_DATA: { part: string; use: string }[] = [
  { part: 'Eyes', use: 'seeing' }, { part: 'Ears', use: 'hearing' },
  { part: 'Nose', use: 'smelling' }, { part: 'Tongue', use: 'tasting' },
  { part: 'Skin', use: 'touching' }, { part: 'Legs', use: 'walking' },
  { part: 'Hands', use: 'holding things' }, { part: 'Heart', use: 'pumping blood' },
  { part: 'Lungs', use: 'breathing' }, { part: 'Brain', use: 'thinking' },
];

const SENSE_ORGANS: { organ: string; sense: string }[] = [
  { organ: 'Eyes', sense: 'Sight' }, { organ: 'Ears', sense: 'Hearing' },
  { organ: 'Nose', sense: 'Smell' }, { organ: 'Tongue', sense: 'Taste' },
  { organ: 'Skin', sense: 'Touch' },
];

const HEALTHY_HABITS = ['Brush teeth twice a day','Wash hands before eating','Eat fruits and vegetables','Drink plenty of water','Exercise daily','Sleep 8-10 hours','Take a bath daily','Cut nails regularly'];
const UNHEALTHY_HABITS = ['Eating too much junk food','Not washing hands','Skipping breakfast','Sleeping very late','Not brushing teeth','Drinking too much soda','Not exercising','Biting nails'];

const FOOD_GROUPS: { food: string; group: string }[] = [
  { food: 'Rice', group: 'Carbohydrates' }, { food: 'Bread', group: 'Carbohydrates' },
  { food: 'Milk', group: 'Protein' }, { food: 'Egg', group: 'Protein' },
  { food: 'Apple', group: 'Vitamins' }, { food: 'Carrot', group: 'Vitamins' },
  { food: 'Butter', group: 'Fats' }, { food: 'Cheese', group: 'Fats' },
  { food: 'Spinach', group: 'Vitamins' }, { food: 'Fish', group: 'Protein' },
];

const HEALTHY_FOODS = ['Apple','Banana','Milk','Rice','Egg','Carrot','Spinach','Curd','Chapati','Dal'];
const JUNK_FOODS = ['Chips','Candy','Soda','Pizza','Burger','Chocolate','Ice cream','Cake','Fries','Noodles'];

const FOOD_SOURCES: { food: string; source: string }[] = [
  { food: 'Milk', source: 'Cow' }, { food: 'Egg', source: 'Hen' },
  { food: 'Honey', source: 'Bee' }, { food: 'Rice', source: 'Plant' },
  { food: 'Wool', source: 'Sheep' }, { food: 'Silk', source: 'Silkworm' },
  { food: 'Apple', source: 'Tree' }, { food: 'Fish', source: 'River/Sea' },
  { food: 'Wheat', source: 'Plant' }, { food: 'Meat', source: 'Animals' },
];

const WATER_USES = ['Drinking','Cooking','Bathing','Washing clothes','Watering plants','Cleaning','Farming','Swimming'];
const SAVE_WATER_TIPS = ['Turn off tap while brushing','Fix leaking taps','Take short showers','Use a bucket instead of pipe','Collect rainwater','Reuse water for plants','Don\'t waste water while playing'];

// ── Science Generators ─────────────────────────────────────

// Living & Non-Living
function genClassifyLiving(d: Difficulty): Question {
  const n = optCount(d);
  const isLiving = Math.random() > 0.5;
  const thing = isLiving ? pick(LIVING_THINGS) : pick(NON_LIVING);
  const correct = isLiving ? 'Living' : 'Non-Living';
  const opts = ['Living', 'Non-Living'];
  if (n > 2) opts.push('Both');
  if (n > 3) opts.push('Neither');
  if (n > 4) opts.push('Not Sure');
  return { id: `cl_${uid()}`, text: `Is "${thing}" a living or non-living thing?`, options: shuffle(opts.slice(0, n)), correctAnswer: correct };
}

function genNeedsOfLiving(d: Difficulty): Question {
  const n = optCount(d);
  const needs = ['Food', 'Water', 'Air', 'Sunlight', 'Shelter'];
  const notNeeds = ['Television', 'Mobile phone', 'Computer', 'Car', 'Video games'];
  const askNeed = Math.random() > 0.3;
  if (askNeed) {
    const correct = pick(needs);
    const dist = [...needs.filter(x => x !== correct), ...pickN(notNeeds, 3)];
    return { id: `nl_${uid()}`, text: 'Which of these do all living things need?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
  } else {
    const correct = pick(notNeeds);
    const dist = [...notNeeds.filter(x => x !== correct), ...pickN(needs, 2)];
    return { id: `nl_${uid()}`, text: 'Which of these is NOT needed by living things?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
  }
}

function genLivingQuiz(d: Difficulty): Question {
  const n = optCount(d);
  const facts: { q: string; a: string; wrong: string[] }[] = [
    { q: 'Living things can ___', a: 'grow and move', wrong: ['stay the same forever','be made of metal','work like machines'] },
    { q: 'Which can breathe?', a: 'Dog', wrong: ['Stone','Table','Ball','Pen'] },
    { q: 'Plants are ___', a: 'living things', wrong: ['non-living things','not real','made of plastic'] },
    { q: 'Non-living things ___', a: 'do not grow', wrong: ['need food','breathe air','have babies'] },
    { q: 'Which is non-living?', a: 'Chair', wrong: ['Cat','Tree','Fish','Bird'] },
    { q: 'A baby grows into ___', a: 'an adult', wrong: ['a stone','a toy','a chair'] },
  ];
  const f = pick(facts);
  return { id: `lq_${uid()}`, text: f.q, options: shuffle([f.a, ...pickN(f.wrong, n - 1)]), correctAnswer: f.a };
}

// Plants & Trees
function genPartsOfPlant(d: Difficulty): Question {
  const n = optCount(d);
  const p = pick(PLANT_PARTS);
  const wrong = PLANT_PARTS.filter(x => x.part !== p.part).map(x => x.part);
  return { id: `pp_${uid()}`, text: `Which part of the plant ${p.job}?`, options: shuffle([p.part, ...pickN(wrong, n - 1)]), correctAnswer: p.part };
}

function genPlantNeeds(d: Difficulty): Question {
  const n = optCount(d);
  const needs = ['Water', 'Sunlight', 'Air', 'Soil'];
  const notNeeds = ['Ice cream', 'Mobile phone', 'Television', 'Shoes', 'Toys'];
  const correct = pick(needs);
  const dist = [...needs.filter(x => x !== correct), ...pickN(notNeeds, 3)];
  return { id: `pn_${uid()}`, text: 'What do plants need to grow?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
}

function genPlantMatch(d: Difficulty): Question {
  const n = optCount(d);
  const items: { q: string; a: string; wrong: string[] }[] = [
    { q: 'Which part of plant is underground?', a: 'Root', wrong: ['Leaf','Flower','Fruit','Stem'] },
    { q: 'Leaves are usually what color?', a: 'Green', wrong: ['Blue','Red','Black','White'] },
    { q: 'Which part makes food for the plant?', a: 'Leaf', wrong: ['Root','Stem','Flower','Fruit'] },
    { q: 'Seeds grow into new ___', a: 'Plants', wrong: ['Animals','Rocks','Water','Soil'] },
    { q: 'Trees give us ___', a: 'Oxygen', wrong: ['Carbon dioxide','Smoke','Dust','Nothing'] },
    { q: 'Flowers attract ___', a: 'Butterflies & bees', wrong: ['Cars','Rocks','Rain','Books'] },
  ];
  const f = pick(items);
  return { id: `pm_${uid()}`, text: f.q, options: shuffle([f.a, ...pickN(f.wrong, n - 1)]), correctAnswer: f.a };
}

// Animals & Habitats
function genAnimalHome(d: Difficulty): Question {
  const n = optCount(d);
  const ah = pick(ANIMAL_HOMES);
  const wrong = ANIMAL_HOMES.filter(x => x.home !== ah.home).map(x => x.home);
  return { id: `ah_${uid()}`, text: `Where does a ${ah.animal} live?`, options: shuffle([ah.home, ...pickN(wrong, n - 1)]), correctAnswer: ah.home };
}

function genAnimalFood(d: Difficulty): Question {
  const n = optCount(d);
  const af = pick(ANIMAL_FOODS);
  const wrong = ANIMAL_FOODS.filter(x => x.food !== af.food).map(x => x.food);
  return { id: `af_${uid()}`, text: `What does a ${af.animal} eat?`, options: shuffle([af.food, ...pickN(wrong, n - 1)]), correctAnswer: af.food };
}

function genAnimalClassify(d: Difficulty): Question {
  const n = optCount(d);
  const at = pick(ANIMAL_TYPES);
  const types = ['Pet', 'Wild', 'Farm'];
  const wrong = types.filter(t => t !== at.type);
  if (n > 3) wrong.push('Sea animal');
  if (n > 4) wrong.push('Bird');
  return { id: `ac_${uid()}`, text: `What type of animal is a ${at.animal}?`, options: shuffle([at.type, ...wrong.slice(0, n - 1)]), correctAnswer: at.type };
}

// Our Body
function genBodyParts(d: Difficulty): Question {
  const n = optCount(d);
  const bp = pick(BODY_PARTS_DATA);
  const wrong = BODY_PARTS_DATA.filter(x => x.part !== bp.part).map(x => x.part);
  return { id: `bp_${uid()}`, text: `Which body part helps us in ${bp.use}?`, options: shuffle([bp.part, ...pickN(wrong, n - 1)]), correctAnswer: bp.part };
}

function genSenseOrgans(d: Difficulty): Question {
  const n = optCount(d);
  const so = pick(SENSE_ORGANS);
  const askOrgan = Math.random() > 0.5;
  if (askOrgan) {
    const wrong = SENSE_ORGANS.filter(x => x.organ !== so.organ).map(x => x.organ);
    return { id: `so_${uid()}`, text: `Which organ is used for the sense of ${so.sense}?`, options: shuffle([so.organ, ...pickN(wrong, n - 1)]), correctAnswer: so.organ };
  } else {
    const wrong = SENSE_ORGANS.filter(x => x.sense !== so.sense).map(x => x.sense);
    return { id: `so_${uid()}`, text: `${so.organ} give us the sense of ___?`, options: shuffle([so.sense, ...pickN(wrong, n - 1)]), correctAnswer: so.sense };
  }
}

function genHealthyHabits(d: Difficulty): Question {
  const n = optCount(d);
  const isGood = Math.random() > 0.4;
  if (isGood) {
    const correct = pick(HEALTHY_HABITS);
    const dist = [...HEALTHY_HABITS.filter(x => x !== correct).slice(0, 1), ...pickN(UNHEALTHY_HABITS, 3)];
    return { id: `hh_${uid()}`, text: 'Which is a healthy habit?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
  } else {
    const correct = pick(UNHEALTHY_HABITS);
    const dist = [...UNHEALTHY_HABITS.filter(x => x !== correct).slice(0, 1), ...pickN(HEALTHY_HABITS, 3)];
    return { id: `hh_${uid()}`, text: 'Which is NOT a healthy habit?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
  }
}

// Food & Nutrition
function genFoodGroups(d: Difficulty): Question {
  const n = optCount(d);
  const fg = pick(FOOD_GROUPS);
  const groups = ['Carbohydrates', 'Protein', 'Vitamins', 'Fats', 'Minerals'];
  const wrong = groups.filter(g => g !== fg.group);
  return { id: `fg_${uid()}`, text: `"${fg.food}" belongs to which food group?`, options: shuffle([fg.group, ...pickN(wrong, n - 1)]), correctAnswer: fg.group };
}

function genHealthyFood(d: Difficulty): Question {
  const n = optCount(d);
  const isHealthy = Math.random() > 0.4;
  if (isHealthy) {
    const correct = pick(HEALTHY_FOODS);
    const dist = [...HEALTHY_FOODS.filter(x => x !== correct).slice(0, 1), ...pickN(JUNK_FOODS, 3)];
    return { id: `hf_${uid()}`, text: 'Which is a healthy food?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
  } else {
    const correct = pick(JUNK_FOODS);
    const dist = [...JUNK_FOODS.filter(x => x !== correct).slice(0, 1), ...pickN(HEALTHY_FOODS, 3)];
    return { id: `hf_${uid()}`, text: 'Which is junk food?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
  }
}

function genFoodSource(d: Difficulty): Question {
  const n = optCount(d);
  const fs = pick(FOOD_SOURCES);
  const wrong = FOOD_SOURCES.filter(x => x.source !== fs.source).map(x => x.source);
  return { id: `fso_${uid()}`, text: `Where do we get "${fs.food}" from?`, options: shuffle([fs.source, ...pickN(wrong, n - 1)]), correctAnswer: fs.source };
}

// Water & Air
function genWaterUses(d: Difficulty): Question {
  const n = optCount(d);
  const correct = pick(WATER_USES);
  const notUses = ['Flying', 'Making fire', 'Painting walls', 'Building houses', 'Making plastic'];
  const dist = [...WATER_USES.filter(x => x !== correct).slice(0, 2), ...pickN(notUses, 3)];
  return { id: `wu_${uid()}`, text: 'Which is a use of water?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
}

function genSaveWater(d: Difficulty): Question {
  const n = optCount(d);
  const correct = pick(SAVE_WATER_TIPS);
  const wasteful = ['Keep tap running','Use hose to wash car','Take very long showers','Throw water for fun','Leave tap open'];
  const dist = [...SAVE_WATER_TIPS.filter(x => x !== correct).slice(0, 1), ...pickN(wasteful, 3)];
  return { id: `sw_${uid()}`, text: 'Which is a good way to save water?', options: shuffle([correct, ...pickN(dist, n - 1)]), correctAnswer: correct };
}

function genAirAround(d: Difficulty): Question {
  const n = optCount(d);
  const facts: { q: string; a: string; wrong: string[] }[] = [
    { q: 'Air is ___', a: 'everywhere around us', wrong: ['only inside houses','only outside','only in bottles'] },
    { q: 'We cannot see air but we can ___', a: 'feel it', wrong: ['eat it','hold it','paint it'] },
    { q: 'Moving air is called ___', a: 'Wind', wrong: ['Rain','Thunder','Snow','Water'] },
    { q: 'Trees give us clean ___', a: 'Air (Oxygen)', wrong: ['Water','Food','Soil','Light'] },
    { q: 'Which living thing needs air?', a: 'All living things', wrong: ['Only humans','Only animals','Only plants'] },
    { q: 'Polluted air is ___', a: 'harmful to breathe', wrong: ['good for health','tasty','invisible'] },
  ];
  const f = pick(facts);
  return { id: `aa_${uid()}`, text: f.q, options: shuffle([f.a, ...pickN(f.wrong, n - 1)]), correctAnswer: f.a };
}

// ── Generator Registry ─────────────────────────────────────

type GenFn = (d: Difficulty) => Question;

const GENERATORS: Record<string, GenFn> = {
  // English – Unit 1 (Let's Have Fun)
  papas_spectacles: genPapasSpectacles, gone_with_scooter: genGoneWithScooter,
  // English – Unit 2 (My Colourful World)
  the_rainbow: genTheRainbow, wise_parrot: genWiseParrot,
  // English – Unit 3 (Water)
  the_frog: genTheFrog, what_a_tank: genWhatATank,
  // English – Unit 4 (Ups and Downs)
  gilli_danda: genGilliDanda, panchayat: genThePanchayat,
  // English – Unit 5 (Work is Worship)
  vocation: genVocation, glass_bangles: genGlassBangles,
  // Maths – Fractions & Patterns
  fraction_pizza: genFractionPizza, pattern_game: genPatternGame, fraction_puzzle: genFractionPuzzle,
  // Maths – Geometry & Angles
  angle_turn: genAngleTurn, symmetry_game: genSymmetryGame, weight_game: genWeightGame,
  // Maths – Multiplication & Jumps
  coconut_farm: genCoconutFarm, frog_jump: genFrogJump, pattern_puzzle: genPatternPuzzle,
  // Maths – Time & Data
  time_game: genTimeGame, time_puzzle: genTimePuzzle, data_graph: genDataGraph,
  // Science – Living Things
  classify_living: genClassifyLiving, needs_of_living: genNeedsOfLiving, living_quiz: genLivingQuiz,
  // Science – Plants
  parts_of_plant: genPartsOfPlant, plant_needs: genPlantNeeds, plant_match: genPlantMatch,
  // Science – Animals
  animal_home: genAnimalHome, animal_food: genAnimalFood, animal_classify: genAnimalClassify,
  // Science – Body
  body_parts: genBodyParts, sense_organs: genSenseOrgans, healthy_habits: genHealthyHabits,
  // Science – Food
  food_groups: genFoodGroups, healthy_food: genHealthyFood, food_source: genFoodSource,
  // Science – Water & Air
  water_uses: genWaterUses, save_water: genSaveWater, air_around: genAirAround,
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

/** Expose generator lookup for external callers (e.g. arcade engine fallback). */
export function getSubjectGenerator(gameType: string): ((d: Difficulty) => Question) | undefined {
  return GENERATORS[gameType];
}

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
