import React from 'react';
import { motion } from 'framer-motion';

interface SuggestionChipsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  { text: 'Explain Chapter 1', icon: '📖' },
  { text: 'What is addition?', icon: '➕' },
  { text: 'Help with vowels', icon: '🔤' },
  { text: 'What are shapes?', icon: '🔷' },
  { text: 'Counting numbers 1-10', icon: '🔢' },
  { text: 'The alphabet song', icon: '🎵' },
];

export const SuggestionChips: React.FC<SuggestionChipsProps> = React.memo(({ onSelect, disabled }) => (
  <div className="flex flex-wrap gap-2">
    {SUGGESTIONS.map((s, i) => (
      <motion.button
        key={s.text}
        onClick={() => onSelect(s.text)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-white/50 hover:bg-white/80 text-blue-600 border border-blue-100/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + i * 0.05 }}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
      >
        <span>{s.icon}</span>
        <span>{s.text}</span>
      </motion.button>
    ))}
  </div>
));

SuggestionChips.displayName = 'SuggestionChips';
