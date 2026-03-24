/**
 * 🃏 Flip Card Match Module
 * ==========================
 * Memory matching game for Standard 3.
 * - Match letters (A-a), numbers, or math pairs (2+3 = 5)
 * - Casino-style card flip animations
 * - Adaptive difficulty (more cards = harder)
 * - Educational and fun!
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameModuleProps } from '../types';

// ─── Card Types & Generation ─────────────────────────────

type CardType = 'letter' | 'number' | 'mathpair';

interface Card {
  id: string;
  value: string;
  displayValue: string;
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function generateCards(difficulty: 'easy' | 'intermediate' | 'difficult', cardType: CardType): Card[] {
  const numPairs = difficulty === 'easy' ? 4 : difficulty === 'intermediate' ? 6 : 8;
  const cards: Card[] = [];

  if (cardType === 'letter') {
    // Match uppercase with lowercase (A-a, B-b, etc.)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const selectedLetters = letters.slice(0, numPairs);
    
    selectedLetters.split('').forEach((letter, i) => {
      const pairId = `pair-${i}`;
      cards.push({
        id: `upper-${i}`,
        value: letter,
        displayValue: letter,
        pairId,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `lower-${i}`,
        value: letter.toLowerCase(),
        displayValue: letter.toLowerCase(),
        pairId,
        isFlipped: false,
        isMatched: false,
      });
    });
  } else if (cardType === 'number') {
    // Match identical numbers
    for (let i = 0; i < numPairs; i++) {
      const num = Math.floor(Math.random() * 50) + 1;
      const pairId = `pair-${i}`;
      cards.push({
        id: `num-${i}-a`,
        value: String(num),
        displayValue: String(num),
        pairId,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `num-${i}-b`,
        value: String(num),
        displayValue: String(num),
        pairId,
        isFlipped: false,
        isMatched: false,
      });
    }
  } else if (cardType === 'mathpair') {
    // Match math expression with answer (2+3 = 5)
    for (let i = 0; i < numPairs; i++) {
      const maxNum = difficulty === 'easy' ? 10 : difficulty === 'intermediate' ? 20 : 30;
      const a = Math.floor(Math.random() * maxNum) + 1;
      const b = Math.floor(Math.random() * (maxNum - a)) + 1;
      const answer = a + b;
      const pairId = `pair-${i}`;
      
      cards.push({
        id: `expr-${i}`,
        value: `${a}+${b}`,
        displayValue: `${a}+${b}`,
        pairId,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `ans-${i}`,
        value: String(answer),
        displayValue: String(answer),
        pairId,
        isFlipped: false,
        isMatched: false,
      });
    }
  }

  // Shuffle cards
  return cards.sort(() => Math.random() - 0.5);
}

// ─── Card Component ───────────────────────────────────────

interface FlipCardProps {
  card: Card;
  onClick: () => void;
  disabled: boolean;
}

const FlipCard: React.FC<FlipCardProps> = React.memo(({ card, onClick, disabled }) => {
  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ perspective: 1000 }}
      onClick={onClick}
      whileHover={!disabled && !card.isMatched ? { scale: 1.05 } : {}}
      whileTap={!disabled && !card.isMatched ? { scale: 0.95 } : {}}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back of card (shown when not flipped) */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-xl border-2 border-yellow-400/50 shadow-lg flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-5xl">🎴</span>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl pointer-events-none" />
        </div>

        {/* Front of card (shown when flipped) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-xl border-2 shadow-lg flex items-center justify-center ${
            card.isMatched
              ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-300'
              : 'bg-gradient-to-br from-yellow-400 to-orange-400 border-yellow-300'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-3xl font-black text-white drop-shadow-lg">{card.displayValue}</span>
          {card.isMatched && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="text-6xl">✓</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
FlipCard.displayName = 'FlipCard';

// ─── Main Component ───────────────────────────────────────

export const FlipCardMatchModule: React.FC<GameModuleProps> = React.memo(({
  state,
  onSelectAnswer,
  onSetCorrectAnswer,
  difficulty,
}) => {
  const roundRef = useRef(state.round);
  
  // Determine card type based on round (cycle through types)
  const cardType: CardType = useMemo(() => {
    const types: CardType[] = ['letter', 'number', 'mathpair'];
    return types[state.round % types.length];
  }, [state.round]);

  const initialCards = useMemo(
    () => generateCards(difficulty, cardType),
    [difficulty, cardType, state.round]
  );

  const [cards, setCards] = useState<Card[]>(initialCards);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const totalPairs = cards.length / 2;

  // Set correct answer (number of pairs)
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      onSetCorrectAnswer(String(totalPairs));
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if all pairs matched
  useEffect(() => {
    if (matchedPairs === totalPairs && matchedPairs > 0) {
      onSelectAnswer(String(totalPairs));
    }
  }, [matchedPairs, totalPairs, onSelectAnswer]);

  // Handle card flip
  const handleCardClick = useCallback((clickedCard: Card) => {
    if (
      isChecking ||
      state.status !== 'playing' ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      flippedCards.length >= 2
    ) {
      return;
    }

    // Flip the card
    setCards(prev =>
      prev.map(c => (c.id === clickedCard.id ? { ...c, isFlipped: true } : c))
    );

    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);
    setMoves(prev => prev + 1);

    // If two cards are flipped, check for match
    if (newFlippedCards.length === 2) {
      setIsChecking(true);
      const [card1, card2] = newFlippedCards;

      if (card1.pairId === card2.pairId) {
        // Match!
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.pairId === card1.pairId ? { ...c, isMatched: true } : c
            )
          );
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
          setIsChecking(false);
        }, 800);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === card1.id || c.id === card2.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, 1200);
      }
    }
  }, [flippedCards, isChecking, state.status]);

  // Reset on new round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      setCards(initialCards);
      setFlippedCards([]);
      setMatchedPairs(0);
      setMoves(0);
      setIsChecking(false);
    }
  }, [state.round, initialCards]);

  // Reset on new game
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      setCards(initialCards);
      setFlippedCards([]);
      setMatchedPairs(0);
      setMoves(0);
      setIsChecking(false);
      roundRef.current = 1;
    }
  }, [state.status, state.round, initialCards]);

  const gridCols = totalPairs <= 4 ? 'grid-cols-4' : totalPairs <= 6 ? 'grid-cols-4' : 'grid-cols-4';
  const cardHeight = totalPairs <= 4 ? 'h-28' : totalPairs <= 6 ? 'h-24' : 'h-20';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Header */}
      <motion.div
        className="mb-4"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-900 px-6 py-2 rounded-full border-2 border-yellow-400/50 shadow-xl">
          <span className="text-2xl">🃏</span>
          <span className="text-lg font-black text-yellow-300 tracking-wide">
            FLIP & MATCH
          </span>
          <span className="text-2xl">🎴</span>
        </div>
      </motion.div>

      {/* Game type indicator */}
      <motion.div
        className="mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-4 py-1 bg-white/10 rounded-full text-sm font-bold text-white">
          {cardType === 'letter' ? '🔤 Match Letters (A-a)' : cardType === 'number' ? '🔢 Match Numbers' : '➕ Match Math Pairs'}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="flex gap-4 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/50 rounded-lg text-sm font-bold text-blue-300">
          Pairs: {matchedPairs}/{totalPairs}
        </div>
        <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/50 rounded-lg text-sm font-bold text-purple-300">
          Moves: {moves}
        </div>
      </motion.div>

      {/* Card Grid */}
      <motion.div
        className={`grid ${gridCols} gap-3 max-w-2xl`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={cardHeight}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5 + index * 0.05, type: 'spring' }}
          >
            <FlipCard
              card={card}
              onClick={() => handleCardClick(card)}
              disabled={isChecking || card.isMatched}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Instructions */}
      <motion.p
        className="text-sm text-gray-400 text-center max-w-xs mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Click cards to flip and find matching pairs!
      </motion.p>

      {/* Celebration effect when all matched */}
      <AnimatePresence>
        {matchedPairs === totalPairs && matchedPairs > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-8xl">🎉</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FlipCardMatchModule.displayName = 'FlipCardMatchModule';

export default FlipCardMatchModule;
