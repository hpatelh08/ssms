/**
 * child/FunFactsPage.tsx
 * Fun Facts Section — interesting knowledge for Class 6 students
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Fact {
  emoji: string;
  text: string;
}

interface FactCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  facts: Fact[];
}

const CATEGORIES: FactCategory[] = [
  {
    id: 'space',
    label: 'Space Facts',
    icon: '🚀',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    facts: [
      { emoji: '☀️', text: 'The Sun is so big that 1.3 million Earths could fit inside it!' },
      { emoji: '🌍', text: 'Earth is the only planet in our solar system known to have life.' },
      { emoji: '🌙', text: 'The Moon is slowly moving away from Earth at about 3.8 cm per year.' },
      { emoji: '⭐', text: 'There are more stars in the universe than grains of sand on all of Earth\'s beaches!' },
      { emoji: '🪐', text: 'Saturn\'s rings are made mostly of ice and rock, and are only about 10–1,000 metres thick.' },
      { emoji: '🌌', text: 'A black hole\'s gravity is so strong that not even light can escape from it.' },
      { emoji: '🔭', text: 'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.' },
      { emoji: '🌠', text: 'A shooting star is actually a tiny rock burning up as it enters Earth\'s atmosphere.' },
    ],
  },
  {
    id: 'animals',
    label: 'Animal Facts',
    icon: '🦁',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    facts: [
      { emoji: '🐘', text: 'Elephants are the only animals that cannot jump. They are also the largest land animals on Earth.' },
      { emoji: '🦋', text: 'A butterfly tastes with its feet! They have taste sensors on their legs.' },
      { emoji: '🐬', text: 'Dolphins sleep with one eye open and half their brain awake to stay alert.' },
      { emoji: '🦒', text: 'A giraffe\'s tongue is dark purple-blue and about 50 cm long!' },
      { emoji: '🐙', text: 'An octopus has three hearts, blue blood, and can change colour in milliseconds.' },
      { emoji: '🐧', text: 'Penguins propose to their mates by giving them a pebble — a very special gift!' },
      { emoji: '🦈', text: 'Sharks are older than trees — they have been swimming in oceans for over 400 million years.' },
      { emoji: '🐝', text: 'A honey bee visits around 2 million flowers to make just one jar of honey.' },
    ],
  },
  {
    id: 'india',
    label: 'India Facts',
    icon: '🇮🇳',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
    facts: [
      { emoji: '🏏', text: 'Cricket, the most popular sport in India, was brought to India by British sailors in the 18th century.' },
      { emoji: '🔢', text: 'India invented the number zero! Ancient Indian mathematician Brahmagupta formalized the concept.' },
      { emoji: '♟️', text: 'Chess was invented in India around 1,500 years ago. It was called "Chaturanga".' },
      { emoji: '🌶️', text: 'India is the world\'s largest producer and consumer of spices.' },
      { emoji: '🛕', text: 'India has over 2 million Hindu temples — more than any other country in the world.' },
      { emoji: '🦚', text: 'The Peacock is the national bird of India. It was chosen for its beauty and cultural importance.' },
      { emoji: '🌊', text: 'India has the world\'s largest river island — Majuli in Assam, on the Brahmaputra river.' },
      { emoji: '🎭', text: 'Yoga originated in India over 5,000 years ago and is practised by millions worldwide today.' },
    ],
  },
  {
    id: 'science',
    label: 'Science Facts',
    icon: '🔬',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    facts: [
      { emoji: '⚡', text: 'Lightning strikes the Earth about 100 times every single second.' },
      { emoji: '💧', text: 'Water is the only substance on Earth that naturally exists as solid, liquid, and gas.' },
      { emoji: '🧲', text: 'The human body contains enough iron to make a nail about 3 cm long.' },
      { emoji: '🌡️', text: 'The coldest temperature ever recorded on Earth was −89.2°C in Antarctica.' },
      { emoji: '🫁', text: 'Your lungs have about 600 million tiny air sacs called alveoli — all laid flat, they\'d cover a tennis court!' },
      { emoji: '🦴', text: 'A human baby is born with 270 bones, but adults only have 206 — some bones fuse as we grow.' },
      { emoji: '🌿', text: 'Plants can communicate with each other through underground fungi networks called the "Wood Wide Web".' },
      { emoji: '🧠', text: 'The human brain generates about 12–25 watts of electricity — enough to power a small LED bulb!' },
    ],
  },
  {
    id: 'history',
    label: 'History Facts',
    icon: '🏛️',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    facts: [
      { emoji: '🏺', text: 'Ancient Egyptians used toothpaste made from crushed eggshells and pumice stone!' },
      { emoji: '🗿', text: 'The Great Wall of China was built over 2,000 years. It\'s long enough to go around Earth\'s equator twice!' },
      { emoji: '🧱', text: 'The Roman Colosseum could hold up to 80,000 spectators and had 80 entrance gates.' },
      { emoji: '📜', text: 'The Indus Valley Civilisation (3,300–1,300 BCE) had advanced urban planning with proper drainage systems!' },
      { emoji: '⚔️', text: 'The shortest war in history lasted only 38–45 minutes — the Anglo-Zanzibar War of 1896.' },
      { emoji: '📚', text: 'The world\'s first university, Takshashila (Taxila), was founded in India around 700 BCE.' },
      { emoji: '🌐', text: 'The internet was invented in 1969 as ARPANET — it connected just 4 computers at first.' },
      { emoji: '🏔️', text: 'Mount Everest grows about 4 mm taller every year due to tectonic plate movement.' },
    ],
  },
];

const spring = { type: 'spring' as const, stiffness: 320, damping: 26 };

const FunFactsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [flippedFacts, setFlippedFacts] = useState<Set<number>>(new Set());

  const category = CATEGORIES.find(c => c.id === activeCategory)!;

  const toggleFlip = (idx: number) => {
    setFlippedFacts(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setFlippedFacts(new Set());
  };

  return (
    <div className="min-h-screen px-4 py-6 pb-28 lg:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="text-center mb-6"
      >
        <motion.div
          className="text-5xl mb-2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🌟
        </motion.div>
        <h1 className="text-2xl font-black text-gray-800">Fun Facts</h1>
        <p className="text-sm text-gray-500 mt-1">Tap a card to reveal the fact!</p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleCategoryChange(cat.id)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
            style={{
              background: activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.7)',
              color: activeCategory === cat.id ? '#fff' : '#64748b',
              border: `1.5px solid ${activeCategory === cat.id ? cat.color : 'rgba(226,232,240,0.6)'}`,
              boxShadow: activeCategory === cat.id ? `0 4px 14px ${cat.border}` : 'none',
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Facts Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={spring}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {category.facts.map((fact, idx) => {
            const isFlipped = flippedFacts.has(idx);
            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleFlip(idx)}
                className="text-left rounded-3xl p-5 w-full cursor-pointer transition-all"
                style={{
                  background: isFlipped ? category.bg : 'rgba(255,255,255,0.75)',
                  border: `1.5px solid ${isFlipped ? category.border : 'rgba(226,232,240,0.5)'}`,
                  boxShadow: isFlipped ? `0 6px 20px ${category.border}` : '0 2px 8px rgba(0,0,0,0.04)',
                  backdropFilter: 'blur(8px)',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: idx * 0.04 }}
              >
                <AnimatePresence mode="wait">
                  {isFlipped ? (
                    <motion.div
                      key="fact"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-2xl shrink-0">{fact.emoji}</span>
                      <p className="text-sm font-semibold text-gray-700 leading-relaxed">{fact.text}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center justify-center gap-2 py-2"
                    >
                      <span className="text-3xl">{category.icon}</span>
                      <span className="text-sm font-bold" style={{ color: category.color }}>
                        Tap to reveal Fact #{idx + 1}!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Progress footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-6 text-xs text-gray-400 font-medium"
      >
        {flippedFacts.size} of {category.facts.length} facts revealed ✨
      </motion.div>
    </div>
  );
};

export default FunFactsPage;
