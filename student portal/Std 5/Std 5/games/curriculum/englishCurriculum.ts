/**
 * games/curriculum/englishCurriculum.ts — English World chapter map
 * ══════════════════════════════════════════════════════════════════
 * 9 chapters, each with 3 difficulty tiers and ≥300 variations per tier.
 * Aligned to NCERT + GSEB Std 5 English syllabus.
 *
 * Chapters: Alphabet · Letter Sounds · Vowels · Nouns · Verbs ·
 *           Opposites · Plurals · Sentence Building · Basic Reading
 *
 * ⚠ DO NOT modify hub UI, Phase 2 engine core, or Color Magic.
 */

import type { CurriculumChapter } from './curriculumTypes';

export const ENGLISH_CHAPTERS: CurriculumChapter[] = [
  {
    id: 'alphabet',
    title: 'Alphabet',
    icon: '🔤',
    section: 'english',
    order: 1,
    description: 'Recognize, order, and write uppercase and lowercase letters.',
    gameTypes: ['letter_match', 'letter_order', 'letter_case', 'letter_missing', 'letter_spot', 'letter_trace'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Match uppercase letters', 'Order A-J', 'Identify letters in a group', 'Uppercase recognition'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Match upper to lowercase', 'Order A-Z', 'Missing letter in sequence', 'Random letter identification'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Mixed-case ordering', 'Reverse order segments', 'Letter chains with gaps', 'Speed letter recognition'],
      },
    },
  },
  {
    id: 'letter_sounds',
    title: 'Letter Sounds',
    icon: '🔊',
    section: 'english',
    order: 2,
    description: 'Connect letters to their sounds and beginning sounds of words.',
    gameTypes: ['letter_sound', 'begin_sound', 'sound_match', 'rhyme_match', 'sound_sort'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Match letter to sound', 'Beginning sound of common words', 'Pick the letter that says…'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Ending sounds', 'Rhyming pairs', 'Sort words by first sound'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Middle sounds', 'Blend two sounds', 'Multi-word sound sorting'],
      },
    },
  },
  {
    id: 'vowels',
    title: 'Vowels',
    icon: '🌟',
    section: 'english',
    order: 3,
    description: 'Identify vowels, classify letters, and fill vowels in words.',
    gameTypes: ['find_vowel', 'fill_vowel', 'classify_letter', 'vowel_word', 'vowel_count'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Find the vowel in a group', 'Is this a vowel?', 'Pick the missing vowel (CVC)'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Fill vowel in longer words', 'Multiple vowels per word', 'Sort vowels from consonants'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Count vowels in a sentence', 'Vowel vs consonant ratios', 'Silent vowel awareness'],
      },
    },
  },
  {
    id: 'nouns',
    title: 'Nouns',
    icon: '🐕',
    section: 'english',
    order: 4,
    description: 'Identify naming words — people, animals, places, and things.',
    gameTypes: ['find_noun', 'noun_hunt', 'noun_sort', 'noun_sentence', 'noun_category'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Pick the noun from a list', 'Name the picture (noun)', 'Sort nouns vs non-nouns'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Find the noun in a sentence', 'Categorize nouns (person/animal/thing)', 'Multiple nouns in sentences'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Proper nouns awareness', 'Noun in complex sentences', 'Replace noun with another'],
      },
    },
  },
  {
    id: 'verbs',
    title: 'Verbs',
    icon: '🏃',
    section: 'english',
    order: 5,
    description: 'Identify action words and use them in simple sentences.',
    gameTypes: ['find_verb', 'action_match', 'verb_or_not', 'verb_fill', 'verb_picture'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Pick the action word', 'Match verb to picture', 'Is this an action word?'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Find verb in sentence', 'Fill the verb blank', 'Sort verbs from nouns'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Two verbs in a sentence', 'Choose correct verb form', 'Verb meaning from context'],
      },
    },
  },
  {
    id: 'opposites',
    title: 'Opposites',
    icon: '↔️',
    section: 'english',
    order: 6,
    description: 'Match, find, and complete opposite word pairs.',
    gameTypes: ['match_opposite', 'find_opposite', 'complete_opposite', 'odd_opposite', 'opposite_sentence'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Match simple opposites (big-small, hot-cold)', 'Pick the opposite from options'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Complete sentence with opposite', 'Find the odd one out', 'Opposite chains'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Context-based opposites', 'Opposite pairs in sentences', 'Create opposite sentences'],
      },
    },
  },
  {
    id: 'plurals',
    title: 'Plurals',
    icon: '👥',
    section: 'english',
    order: 7,
    description: 'Learn one-many, regular -s/-es plurals, and common irregular plurals.',
    gameTypes: ['plural_maker', 'plural_pick', 'plural_sort', 'plural_match', 'plural_fill'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Add -s to make plural', 'One vs many', 'Match word to correct plural'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Add -es plurals', 'Sort singular vs plural', 'Common irregular plurals (child→children)'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Mixed plural rules', 'Fill plural in sentence', 'Irregular plural families'],
      },
    },
  },
  {
    id: 'sentences',
    title: 'Sentence Building',
    icon: '🏗️',
    section: 'english',
    order: 8,
    description: 'Order words, fill blanks, and build simple sentences.',
    gameTypes: ['word_order', 'missing_word', 'sentence_fix', 'sentence_build', 'sentence_match'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Order 3-word sentences', 'Fill one missing word', 'Fix scrambled sentence'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Order 4-5 word sentences', 'Fill missing word with options', 'Combine two sentence halves'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Order 5-6 word sentences', 'Fix punctuation', 'Match question to answer'],
      },
    },
  },
  {
    id: 'reading',
    title: 'Basic Reading',
    icon: '📖',
    section: 'english',
    order: 9,
    description: 'Read CVC/CCVC words, sight words, and simple passages.',
    gameTypes: ['cvc_read', 'sight_word', 'word_meaning', 'passage_question', 'word_family'],
    tiers: {
      easy: {
        months: '1-2', minVariations: 300, complexityBase: 1.0,
        skills: ['Read CVC words (cat, dog, pen)', 'Sight word recognition (the, is, and)', 'Match word to picture'],
      },
      intermediate: {
        months: '3-4', minVariations: 400, complexityBase: 1.5,
        skills: ['Read CCVC/CVCC words (frog, milk)', 'Word families (-at, -an, -ig)', 'Sight word sentences'],
      },
      difficult: {
        months: '5-6', minVariations: 500, complexityBase: 2.0,
        skills: ['Read 2-sentence passages', 'Answer who/what questions', 'Word meaning from context'],
      },
    },
  },
];

/** Quick access by chapter ID */
export const ENGLISH_CHAPTER_MAP = Object.fromEntries(
  ENGLISH_CHAPTERS.map(ch => [ch.id, ch]),
) as Record<string, CurriculumChapter>;

/** All english game type IDs (deduped) */
export const ALL_ENGLISH_GAME_TYPES = [
  ...new Set(ENGLISH_CHAPTERS.flatMap(ch => ch.gameTypes)),
];
