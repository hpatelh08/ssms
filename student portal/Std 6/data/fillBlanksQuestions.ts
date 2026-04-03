export interface FillBlankQuestion {
  id: number;
  prompt: string;
  answer: string;
  options: string[];
}

export const TOTAL_FILL_BLANK_QUESTIONS = 1000;

const OPPOSITE_PAIRS = [
  ['ancient', 'modern'],
  ['brave', 'cowardly'],
  ['bright', 'dim'],
  ['calm', 'noisy'],
  ['careful', 'careless'],
  ['clean', 'dirty'],
  ['deep', 'shallow'],
  ['early', 'late'],
  ['empty', 'full'],
  ['friendly', 'rude'],
  ['heavy', 'light'],
  ['honest', 'dishonest'],
  ['humble', 'proud'],
  ['increase', 'decrease'],
  ['inside', 'outside'],
  ['junior', 'senior'],
  ['kind', 'cruel'],
  ['major', 'minor'],
  ['narrow', 'wide'],
  ['rapid', 'slow'],
  ['regular', 'irregular'],
  ['sharp', 'blunt'],
  ['strong', 'weak'],
  ['victory', 'defeat'],
];

const SYNONYM_PAIRS = [
  ['assist', 'help'],
  ['begin', 'start'],
  ['brave', 'courageous'],
  ['choose', 'select'],
  ['difficult', 'hard'],
  ['eager', 'keen'],
  ['famous', 'popular'],
  ['gather', 'collect'],
  ['happy', 'joyful'],
  ['idea', 'thought'],
  ['journey', 'trip'],
  ['kind', 'gentle'],
  ['large', 'huge'],
  ['neat', 'tidy'],
  ['quick', 'rapid'],
  ['reply', 'answer'],
  ['silent', 'quiet'],
  ['tiny', 'small'],
  ['useful', 'helpful'],
  ['value', 'worth'],
  ['win', 'triumph'],
  ['wonderful', 'excellent'],
];

const PLURAL_PAIRS = [
  ['book', 'books'],
  ['bus', 'buses'],
  ['box', 'boxes'],
  ['child', 'children'],
  ['city', 'cities'],
  ['class', 'classes'],
  ['dish', 'dishes'],
  ['family', 'families'],
  ['foot', 'feet'],
  ['goose', 'geese'],
  ['hero', 'heroes'],
  ['leaf', 'leaves'],
  ['life', 'lives'],
  ['man', 'men'],
  ['mouse', 'mice'],
  ['potato', 'potatoes'],
  ['story', 'stories'],
  ['tooth', 'teeth'],
  ['watch', 'watches'],
  ['woman', 'women'],
];

const ARTICLE_CONTEXTS = [
  { article: 'a', noun: 'ball', line: 'Riya found ____ ball near the bench.' },
  { article: 'a', noun: 'uniform', line: 'The student wore ____ uniform for assembly.' },
  { article: 'a', noun: 'useful chart', line: 'Our teacher made ____ useful chart for revision.' },
  { article: 'an', noun: 'apple', line: 'I packed ____ apple for lunch.' },
  { article: 'an', noun: 'hour', line: 'We waited for ____ hour before the bus arrived.' },
  { article: 'an', noun: 'umbrella', line: 'Meera carried ____ umbrella in the rain.' },
];

const PREPOSITION_CONTEXTS = [
  { answer: 'under', line: 'The cat is hiding ____ the table.' },
  { answer: 'between', line: 'The library is ____ the school and the park.' },
  { answer: 'behind', line: 'The bicycle is parked ____ the gate.' },
  { answer: 'inside', line: 'The pencils are ____ the box.' },
  { answer: 'near', line: 'Our classroom is ____ the playground.' },
  { answer: 'across', line: 'The shop is ____ the road from the bus stop.' },
];

const PRONOUN_CONTEXTS = [
  { answer: 'he', line: 'Arjun is carrying the science model. ____ made it at home.' },
  { answer: 'she', line: 'My sister won the chess match. ____ practiced every evening.' },
  { answer: 'they', line: 'Ravi and Kabir are planting trees. ____ are working together.' },
  { answer: 'we', line: 'Mina and I are revising the lesson. ____ will finish before dinner.' },
  { answer: 'it', line: 'The robot started moving again. ____ needs a new battery.' },
];

const TENSE_CONTEXTS = [
  { subject: 'She', base: 'write', answer: 'wrote', line: 'Yesterday, she ____ a letter to her friend.' },
  { subject: 'They', base: 'build', answer: 'built', line: 'Last week, they ____ a model bridge for the fair.' },
  { subject: 'He', base: 'bring', answer: 'brought', line: 'This morning, he ____ his notebook to class.' },
  { subject: 'We', base: 'see', answer: 'saw', line: 'On the trip, we ____ a rainbow over the hills.' },
  { subject: 'I', base: 'teach', answer: 'taught', line: 'At home, I ____ my cousin a new game.' },
  { subject: 'The players', base: 'win', answer: 'won', line: 'In the final match, the players ____ the trophy.' },
];

const OPTIONS_ARTICLES = ['a', 'an', 'the', 'some'];
const OPTIONS_PRONOUNS = ['he', 'she', 'they', 'we', 'it'];
const OPTIONS_PREPOSITIONS = ['under', 'between', 'behind', 'inside', 'near', 'across', 'above', 'beside'];

function rotate<T>(items: T[], offset: number): T[] {
  if (items.length === 0) return [];
  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function toTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildOptions(answer: string, distractors: string[], seed: number): string[] {
  const normalizedAnswer = answer.trim().toLowerCase();
  const uniqueDistractors = distractors.filter((item, index) => (
    item.trim().toLowerCase() !== normalizedAnswer
    && distractors.findIndex(candidate => candidate.trim().toLowerCase() === item.trim().toLowerCase()) === index
  ));
  const rotated = rotate(uniqueDistractors, seed * 3 + answer.length);
  const picked = rotated.slice(0, 3);
  const options = [...picked];
  options.splice(seed % 4, 0, answer);
  return options.slice(0, 4);
}

function fractionGcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

function generateAdditionQuestion(id: number, cycle: number): FillBlankQuestion {
  const a = 12 + ((cycle * 7) % 63);
  const b = 15 + ((cycle * 11) % 54);
  const answer = String(a + b);
  return {
    id,
    prompt: `The sum of ${a} and ${b} is ____.`,
    answer,
    options: buildOptions(answer, [String(a + b + 2), String(a + b - 2), String(a + b + 10), String(Math.max(0, a + b - 10))], cycle),
  };
}

function generateSubtractionQuestion(id: number, cycle: number): FillBlankQuestion {
  const subtrahend = 12 + ((cycle * 5) % 46);
  const answerValue = 18 + ((cycle * 9) % 51);
  const minuend = subtrahend + answerValue;
  const answer = String(answerValue);
  return {
    id,
    prompt: `${minuend} - ${subtrahend} = ____.`,
    answer,
    options: buildOptions(answer, [String(answerValue + 3), String(answerValue - 3), String(minuend - (subtrahend - 4)), String(minuend - (subtrahend + 4))], cycle),
  };
}

function generateMultiplicationQuestion(id: number, cycle: number): FillBlankQuestion {
  const a = 6 + ((cycle * 2) % 18);
  const b = 3 + ((cycle * 5) % 10);
  const answerValue = a * b;
  const answer = String(answerValue);
  return {
    id,
    prompt: `${a} x ${b} = ____.`,
    answer,
    options: buildOptions(answer, [String(answerValue + a), String(answerValue - b), String(answerValue + b), String(answerValue - a)], cycle),
  };
}

function generateDivisionQuestion(id: number, cycle: number): FillBlankQuestion {
  const divisor = 3 + ((cycle * 2) % 9);
  const quotient = 4 + ((cycle * 3) % 12);
  const dividend = divisor * quotient;
  const answer = String(quotient);
  return {
    id,
    prompt: `${dividend} / ${divisor} = ____.`,
    answer,
    options: buildOptions(answer, [String(quotient + 1), String(Math.max(1, quotient - 1)), String(quotient + 3), String(divisor)], cycle),
  };
}

function generateFractionQuestion(id: number, cycle: number): FillBlankQuestion {
  const denominator = 3 + ((cycle * 2) % 9);
  const numerator = 1 + ((cycle * 3) % (denominator - 1));
  const multiplier = 2 + (cycle % 4);
  const answer = `${numerator * multiplier}/${denominator * multiplier}`;
  const altMultiplier = multiplier + 1;
  const wrong1 = `${numerator * altMultiplier}/${denominator * multiplier}`;
  const wrong2 = `${numerator * multiplier}/${denominator * altMultiplier}`;
  const wrong3 = `${numerator + multiplier}/${denominator + multiplier}`;
  return {
    id,
    prompt: `An equivalent fraction of ${numerator}/${denominator} is ____.`,
    answer,
    options: buildOptions(answer, [wrong1, wrong2, wrong3], cycle),
  };
}

function generatePerimeterQuestion(id: number, cycle: number): FillBlankQuestion {
  const length = 8 + ((cycle * 4) % 22);
  const breadth = 5 + ((cycle * 3) % 16);
  const answerValue = 2 * (length + breadth);
  const answer = String(answerValue);
  return {
    id,
    prompt: `The perimeter of a rectangle with length ${length} cm and breadth ${breadth} cm is ____ cm.`,
    answer,
    options: buildOptions(answer, [String(length + breadth), String(length * breadth), String(2 * length + breadth), String(length + 2 * breadth)], cycle),
  };
}

function generateArticleQuestion(id: number, cycle: number): FillBlankQuestion {
  const item = ARTICLE_CONTEXTS[cycle % ARTICLE_CONTEXTS.length];
  return {
    id,
    prompt: item.line,
    answer: item.article,
    options: buildOptions(item.article, OPTIONS_ARTICLES, cycle),
  };
}

function generatePrepositionQuestion(id: number, cycle: number): FillBlankQuestion {
  const item = PREPOSITION_CONTEXTS[cycle % PREPOSITION_CONTEXTS.length];
  return {
    id,
    prompt: item.line,
    answer: item.answer,
    options: buildOptions(item.answer, OPTIONS_PREPOSITIONS, cycle),
  };
}

function generatePronounQuestion(id: number, cycle: number): FillBlankQuestion {
  const item = PRONOUN_CONTEXTS[cycle % PRONOUN_CONTEXTS.length];
  return {
    id,
    prompt: item.line,
    answer: item.answer,
    options: buildOptions(item.answer, OPTIONS_PRONOUNS, cycle),
  };
}

function generatePluralQuestion(id: number, cycle: number): FillBlankQuestion {
  const [singular, plural] = PLURAL_PAIRS[cycle % PLURAL_PAIRS.length];
  const distractors = rotate(
    PLURAL_PAIRS
      .map(([, value]) => value)
      .filter(value => value !== plural),
    cycle,
  );
  return {
    id,
    prompt: `The plural form of "${singular}" is ____.`,
    answer: plural,
    options: buildOptions(plural, distractors, cycle),
  };
}

function generateOppositeQuestion(id: number, cycle: number): FillBlankQuestion {
  const [word, opposite] = OPPOSITE_PAIRS[cycle % OPPOSITE_PAIRS.length];
  const distractors = rotate(
    OPPOSITE_PAIRS
      .map(([, value]) => value)
      .filter(value => value !== opposite),
    cycle * 2,
  );
  return {
    id,
    prompt: `The opposite of "${word}" is ____.`,
    answer: opposite,
    options: buildOptions(opposite, distractors, cycle),
  };
}

function generateTenseQuestion(id: number, cycle: number): FillBlankQuestion {
  const item = TENSE_CONTEXTS[cycle % TENSE_CONTEXTS.length];
  const distractors = rotate(
    TENSE_CONTEXTS
      .map(entry => entry.answer)
      .filter(answer => answer !== item.answer),
    cycle * 2 + 1,
  );
  return {
    id,
    prompt: item.line,
    answer: item.answer,
    options: buildOptions(item.answer, distractors, cycle),
  };
}

function generateSynonymQuestion(id: number, cycle: number): FillBlankQuestion {
  const [word, synonym] = SYNONYM_PAIRS[cycle % SYNONYM_PAIRS.length];
  const distractors = rotate(
    SYNONYM_PAIRS
      .map(([, value]) => value)
      .filter(value => value !== synonym),
    cycle * 4,
  );
  return {
    id,
    prompt: `A synonym of "${word}" is ____.`,
    answer: synonym,
    options: buildOptions(synonym, distractors, cycle),
  };
}

const GENERATORS: Array<(id: number, cycle: number) => FillBlankQuestion> = [
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateMultiplicationQuestion,
  generateDivisionQuestion,
  generateFractionQuestion,
  generatePerimeterQuestion,
  generateArticleQuestion,
  generatePrepositionQuestion,
  generatePronounQuestion,
  generatePluralQuestion,
  generateOppositeQuestion,
  generateTenseQuestion,
  generateSynonymQuestion,
];

export function generateFillBlankQuestion(questionNumber: number): FillBlankQuestion {
  const safeNumber = Math.max(1, questionNumber);
  const zeroBased = safeNumber - 1;
  const generatorIndex = zeroBased % GENERATORS.length;
  const cycle = Math.floor(zeroBased / GENERATORS.length) + 1;
  const generated = GENERATORS[generatorIndex](safeNumber, cycle);
  return {
    ...generated,
    prompt: generated.prompt.replace(/\s+/g, ' ').trim(),
    answer: generated.answer.trim(),
    options: generated.options.map(option => option.trim()),
  };
}
