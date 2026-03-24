/**
 * 📊 Chart Game Module - Visual Bar Chart Reading
 * =================================================
 * Proper visual bar charts for Standard 3 data handling.
 * Students read actual colored bar charts and answer questions.
 * Casino-style presentation with animated bars and celebrations.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameModuleProps } from '../types';

// ─── Chart Data Generator ────────────────────────────────

interface ChartData {
  items: { emoji: string; name: string; count: number; color: string }[];
  question: string;
  answer: number;
  answerName: string;
}

const CHART_THEMES = {
  fruits: {
    items: [
      { emoji: '🍎', name: 'Apples', color: '#EF4444' },
      { emoji: '🍌', name: 'Bananas', color: '#FBBF24' },
      { emoji: '🍊', name: 'Oranges', color: '#F97316' },
      { emoji: '🍇', name: 'Grapes', color: '#8B5CF6' },
      { emoji: '🍓', name: 'Strawberries', color: '#EC4899' },
    ],
  },
  animals: {
    items: [
      { emoji: '🐶', name: 'Dogs', color: '#92400E' },
      { emoji: '🐱', name: 'Cats', color: '#F59E0B' },
      { emoji: '🐦', name: 'Birds', color: '#3B82F6' },
      { emoji: '🐟', name: 'Fish', color: '#06B6D4' },
      { emoji: '🐰', name: 'Rabbits', color: '#EC4899' },
    ],
  },
  toys: {
    items: [
      { emoji: '⚽', name: 'Balls', color: '#EF4444' },
      { emoji: '🎨', name: 'Art Kits', color: '#8B5CF6' },
      { emoji: '🚗', name: 'Cars', color: '#3B82F6' },
      { emoji: '🧸', name: 'Teddy Bears', color: '#F59E0B' },
      { emoji: '🪁', name: 'Kites', color: '#10B981' },
    ],
  },
};

function generateChartData(difficulty: 'easy' | 'intermediate' | 'difficult'): ChartData {
  const themes = Object.keys(CHART_THEMES);
  const selectedTheme = themes[Math.floor(Math.random() * themes.length)] as keyof typeof CHART_THEMES;
  const theme = CHART_THEMES[selectedTheme];
  
  const itemCount = difficulty === 'easy' ? 3 : difficulty === 'intermediate' ? 4 : 5;
  const maxValue = difficulty === 'easy' ? 8 : difficulty === 'intermediate' ? 12 : 15;
  
  const selected = theme.items.slice(0, itemCount).map(item => ({
    ...item,
    count: Math.floor(Math.random() * maxValue) + 1,
  }));
  
  const questionTypes = [
    'count', // How many X?
    'most', // Which has the most?
    'least', // Which has the least?
    'compare', // How many more X than Y?
  ];
  
  const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  let question = '';
  let answer = 0;
  let answerName = '';
  
  switch (qType) {
    case 'count': {
      const idx = Math.floor(Math.random() * selected.length);
      question = `How many ${selected[idx].name}?`;
      answer = selected[idx].count;
      answerName = String(answer);
      break;
    }
    case 'most': {
      const maxItem = selected.reduce((max, item) => item.count > max.count ? item : max);
      question = `Which item has the MOST?`;
      answer = selected.indexOf(maxItem);
      answerName = maxItem.name;
      break;
    }
    case 'least': {
      const minItem = selected.reduce((min, item) => item.count < min.count ? item : min);
      question = `Which item has the LEAST?`;
      answer = selected.indexOf(minItem);
      answerName = minItem.name;
      break;
    }
    case 'compare': {
      if (selected.length >= 2) {
        const idx1 = Math.floor(Math.random() * selected.length);
        let idx2 = Math.floor(Math.random() * selected.length);
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * selected.length);
        const diff = Math.abs(selected[idx1].count - selected[idx2].count);
        question = `How many more ${selected[idx1].name} than ${selected[idx2].name}?`;
        answer = diff;
        answerName = String(diff);
      } else {
        // Fallback to count
        question = `How many ${selected[0].name}?`;
        answer = selected[0].count;
        answerName = String(answer);
      }
      break;
    }
  }
  
  return { items: selected, question, answer, answerName };
}

// ─── Bar Component ────────────────────────────────────────

interface BarProps {
  emoji: string;
  name: string;
  count: number;
  color: string;
  maxCount: number;
  delay: number;
}

const Bar: React.FC<BarProps> = React.memo(({ emoji, name, count, color, maxCount, delay }) => {
  const heightPercent = (count / maxCount) * 100;
  
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Bar container */}
      <div className="relative w-16 sm:w-20 h-48 bg-white/40 rounded-t-2xl border-2 border-white/50 shadow-lg flex flex-col items-center justify-end overflow-hidden">
        {/* Animated bar */}
        <motion.div
          className="w-full rounded-t-xl relative"
          style={{ backgroundColor: color }}
          initial={{ height: 0 }}
          animate={{ height: `${heightPercent}%` }}
          transition={{ delay, duration: 0.8, type: 'spring', stiffness: 100 }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-t-xl" />
          
          {/* Count label */}
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-lg shadow-md font-black text-gray-800 text-sm border-2"
            style={{ borderColor: color }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.5, type: 'spring' }}
          >
            {count}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Label */}
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.3 }}
      >
        <span className="text-3xl">{emoji}</span>
        <span className="text-xs font-bold text-gray-700 text-center">{name}</span>
      </motion.div>
    </div>
  );
});
Bar.displayName = 'Bar';

// ─── Main Component ───────────────────────────────────────

export const ChartGameModule: React.FC<GameModuleProps> = React.memo(({
  state,
  onSelectAnswer,
  onSetCorrectAnswer,
  difficulty,
}) => {
  const roundRef = useRef(state.round);
  
  const chartData = useMemo(
    () => generateChartData(difficulty),
    [state.round, difficulty]
  );
  
  const [hasAnswered, setHasAnswered] = useState(false);
  const maxCount = Math.max(...chartData.items.map(item => item.count));
  
  // Set correct answer
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(chartData.answerName);
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Reset on new round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      setHasAnswered(false);
    }
  }, [state.round]);
  
  // Reset on new game
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      setHasAnswered(false);
      roundRef.current = 1;
    }
  }, [state.status, state.round]);
  
  const handleAnswer = useCallback((answer: string) => {
    if (hasAnswered || state.status !== 'playing') return;
    setHasAnswered(true);
    onSelectAnswer(answer);
  }, [hasAnswered, state.status, onSelectAnswer]);
  
  // Generate answer options
  const answerOptions = useMemo(() => {
    const options: string[] = [];
    
    if (chartData.question.includes('Which item')) {
      // Multiple choice of item names
      return chartData.items.map(item => item.name);
    } else {
      // Number options
      const correctNum = Number(chartData.answerName);
      options.push(chartData.answerName);
      
      while (options.length < 4) {
        const offset = Math.floor(Math.random() * 5) - 2;
        const opt = String(Math.max(0, correctNum + offset));
        if (!options.includes(opt) && opt !== chartData.answerName) {
          options.push(opt);
        }
      }
      
      return options.sort(() => Math.random() - 0.5);
    }
  }, [chartData]);
  
  const isLocked = state.status !== 'playing' || hasAnswered;
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 px-6 py-3 rounded-full border-2 border-blue-400/50 shadow-xl">
          <span className="text-3xl">📊</span>
          <span className="text-xl font-black text-blue-200 tracking-wide">
            BAR CHART CASINO
          </span>
        </div>
      </motion.div>
      
      {/* Chart */}
      <motion.div
        className="bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 p-6 rounded-3xl border-4 border-blue-300/50 shadow-2xl mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Grid lines */}
        <div className="relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-gray-300/30" />
            ))}
          </div>
          
          {/* Bars */}
          <div className="flex items-end justify-center gap-4 sm:gap-6 relative z-10">
            {chartData.items.map((item, i) => (
              <Bar
                key={item.name}
                emoji={item.emoji}
                name={item.name}
                count={item.count}
                color={item.color}
                maxCount={maxCount}
                delay={i * 0.15}
              />
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Question */}
      <motion.div
        className="text-2xl font-black text-gray-800 mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {chartData.question}
      </motion.div>
      
      {/* Answer options */}
      <motion.div
        className="grid grid-cols-2 gap-3 max-w-md w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {answerOptions.map((option, i) => (
          <motion.button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={isLocked}
            className="py-4 px-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-black rounded-xl shadow-lg border-2 border-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1 + i * 0.1, type: 'spring' }}
            whileHover={!isLocked ? { scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
});

ChartGameModule.displayName = 'ChartGameModule';

export default ChartGameModule;
