/**
 * child/CountFishGame.tsx
 * ─────────────────────────────────────────────────────
 * Count the Fish Game - Educational counting game for kids
 * 
 * Gameplay:
 * - Count only fish (not other animals)
 * - Fish move slowly from different directions
 * - Choose correct answer from 4 options
 * - +10 points for correct, -5 for wrong
 * - Progress through 3 levels with increasing difficulty
 * 
 * Levels:
 * - Level 1: Only fish, 1-4 fish, very easy
 * - Level 2: Fish + distractions, 1-6 fish, medium
 * - Level 3: More distractions, 1-8 fish, harder
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Fish {
  id: string;
  x: number; // percentage
  y: number; // percentage
  direction: 'left' | 'right';
  speed: number;
  emoji: string;
}

interface Animal {
  id: string;
  x: number;
  y: number;
  emoji: string;
  type: 'turtle' | 'octopus' | 'crab';
}

interface Props {
  onStatsUpdate: (stats: {
    score: number;
    level: number;
    round: number;
    mistakes: number;
  }) => void;
  onNavigateHome?: () => void;
}

const FISH_EMOJIS = ['🐟', '🐠', '🐡'];
const DISTRACTION_ANIMALS = [
  { emoji: '🐢', type: 'turtle' as const },
  { emoji: '🐙', type: 'octopus' as const },
  { emoji: '🦀', type: 'crab' as const },
];

const ROUNDS_PER_LEVEL = 5;
const TOTAL_LEVELS = 3;

export const CountFishGame: React.FC<Props> = ({ onStatsUpdate, onNavigateHome }) => {
  // Game state
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  // Round state
  const [fish, setFish] = useState<Fish[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerOptions, setAnswerOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  
  const animationFrameRef = useRef<number>();

  // Generate random position that doesn't overlap
  const generatePosition = useCallback((existingPositions: { x: number; y: number }[], minDistance: number = 12) => {
    let attempts = 0;
    let position: { x: number; y: number };
    
    do {
      position = {
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 65,
      };
      attempts++;
    } while (
      attempts < 50 &&
      existingPositions.some(pos => {
        const dx = Math.abs(pos.x - position.x);
        const dy = Math.abs(pos.y - position.y);
        return dx < minDistance && dy < minDistance;
      })
    );
    
    return position;
  }, []);

  // Generate answer options
  const generateAnswerOptions = useCallback((correct: number) => {
    const options = new Set<number>();
    options.add(correct);
    
    // Generate 3 wrong answers
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 4) - 2; // -2 to +1
      const wrong = Math.max(0, correct + offset);
      if (wrong !== correct) {
        options.add(wrong);
      }
    }
    
    return Array.from(options).sort(() => Math.random() - 0.5);
  }, []);

  // Generate new round
  const generateRound = useCallback(() => {
    const positions: { x: number; y: number }[] = [];
    
    // Determine fish count based on level
    let fishCount: number;
    let distractionCount: number;
    
    if (level === 1) {
      fishCount = Math.floor(Math.random() * 4) + 1; // 1-4
      distractionCount = 0;
    } else if (level === 2) {
      fishCount = Math.floor(Math.random() * 6) + 1; // 1-6
      distractionCount = Math.floor(Math.random() * 3) + 1; // 1-3
    } else {
      fishCount = Math.floor(Math.random() * 8) + 1; // 1-8
      distractionCount = Math.floor(Math.random() * 4) + 2; // 2-5
    }
    
    // Generate fish
    const newFish: Fish[] = [];
    for (let i = 0; i < fishCount; i++) {
      const pos = generatePosition(positions);
      positions.push(pos);
      
      newFish.push({
        id: `fish-${i}`,
        x: pos.x,
        y: pos.y,
        direction: Math.random() > 0.5 ? 'left' : 'right',
        speed: 0.15 + Math.random() * 0.15, // 0.15-0.3 for slow movement
        emoji: FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)],
      });
    }
    
    // Generate distraction animals
    const newAnimals: Animal[] = [];
    for (let i = 0; i < distractionCount; i++) {
      const pos = generatePosition(positions);
      positions.push(pos);
      
      const animal = DISTRACTION_ANIMALS[Math.floor(Math.random() * DISTRACTION_ANIMALS.length)];
      newAnimals.push({
        id: `animal-${i}`,
        x: pos.x,
        y: pos.y,
        emoji: animal.emoji,
        type: animal.type,
      });
    }
    
    setFish(newFish);
    setAnimals(newAnimals);
    setCorrectCount(fishCount);
    setAnswerOptions(generateAnswerOptions(fishCount));
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setMessage('');
  }, [level, generatePosition, generateAnswerOptions]);

  // Initialize first round
  useEffect(() => {
    generateRound();
  }, []);

  // Animate fish movement
  useEffect(() => {
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 16; // normalize to ~60fps
      lastTime = now;
      
      setFish(prevFish => 
        prevFish.map(f => {
          let newX = f.x;
          
          if (f.direction === 'right') {
            newX += f.speed * delta;
            if (newX > 95) {
              newX = -5;
            }
          } else {
            newX -= f.speed * delta;
            if (newX < -5) {
              newX = 95;
            }
          }
          
          return { ...f, x: newX };
        })
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update parent stats
  useEffect(() => {
    onStatsUpdate({ score, level, round, mistakes });
  }, [score, level, round, mistakes, onStatsUpdate]);

  // Handle answer selection
  const handleAnswerClick = useCallback((answer: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answer);
    const isCorrect = answer === correctCount;
    setIsAnswerCorrect(isCorrect);
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => prev + 1);
      setMessage('🎉 Correct!');
    } else {
      setScore(prev => prev - 5);
      setMistakes(prev => prev + 1);
      setMessage(`❌ Wrong! There were ${correctCount} fish`);
    }
    
    // Move to next round after delay
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) {
        if (level >= TOTAL_LEVELS) {
          // Game complete
          setIsGameComplete(true);
        } else {
          // Next level
          setLevel(prev => prev + 1);
          setRound(1);
          generateRound();
        }
      } else {
        // Next round
        setRound(prev => prev + 1);
        generateRound();
      }
    }, 1500);
  }, [selectedAnswer, correctCount, round, level, generateRound]);

  // Restart game
  const restartGame = useCallback(() => {
    setLevel(1);
    setRound(1);
    setScore(0);
    setMistakes(0);
    setCorrectAnswers(0);
    setIsGameComplete(false);
    generateRound();
  }, [generateRound]);

  // Memoized underwater decorations
  const underwaterDecorations = useMemo(() => (
    <>
      {/* Coral */}
      <motion.div
        animate={{ rotate: [0, 3, 0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '5%', left: '8%', fontSize: '52px', opacity: 0.7 }}
      >
        🪸
      </motion.div>
      <motion.div
        animate={{ scaleY: [1, 1.1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '7%', right: '12%', fontSize: '48px', opacity: 0.7 }}
      >
        🪸
      </motion.div>
      {/* Seaweed */}
      <motion.div
        animate={{ rotate: [0, -4, 0, 4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '3%', left: '25%', fontSize: '46px', opacity: 0.7 }}
      >
        🌿
      </motion.div>
      <motion.div
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '2%', right: '30%', fontSize: '44px', opacity: 0.7 }}
      >
        🌿
      </motion.div>
      {/* Bubbles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          animate={{ y: ['0%', '-100%'], scale: [1, 1.2, 0.9] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
          style={{ position: 'absolute', bottom: 0, left: `${12 + i * 10}%`, fontSize: '20px', opacity: 0.5 }}
        >
          🫧
        </motion.div>
      ))}
    </>
  ), []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Message display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: '-70px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
              zIndex: 100,
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          background: 'linear-gradient(180deg, #87ceeb 0%, #b3ddf2 10%, #5dade2 20%, #3498db 35%, #2980b9 55%, #2c5f7f 75%, #1a3a52 100%)',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          aspectRatio: '16/9',
        }}
      >
        {/* Question text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
            padding: '20px 40px',
            borderRadius: '24px',
            fontSize: '28px',
            fontWeight: 900,
            fontFamily: 'Nunito, sans-serif',
            color: '#1e293b',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 10,
          }}
        >
          🐟 How many fish are there?
        </motion.div>

        {/* Ocean area */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: 0,
          right: 0,
          bottom: '20%',
          overflow: 'hidden',
        }}>
          {/* Decorations */}
          {underwaterDecorations}
          
          {/* Fish - countable */}
          {fish.map(f => (
            <motion.div
              key={f.id}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: `translate(-50%, -50%) scaleX(${f.direction === 'left' ? -1 : 1})`,
                fontSize: '48px',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                zIndex: 5,
              }}
            >
              {f.emoji}
            </motion.div>
          ))}
          
          {/* Distraction animals */}
          {animals.map(a => (
            <motion.div
              key={a.id}
              animate={{ y: [0, -5, 0], rotate: [0, 3, 0, -3, 0] }}
              transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: `${a.x}%`,
                top: `${a.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: '44px',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                opacity: 0.85,
                zIndex: 4,
              }}
            >
              {a.emoji}
            </motion.div>
          ))}
        </div>

        {/* Answer buttons */}
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '16px',
          zIndex: 10,
        }}>
          {answerOptions.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === correctCount;
            let bgColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
            
            if (isSelected) {
              bgColor = isAnswerCorrect 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #ef4444, #dc2626)';
            }
            
            return (
              <motion.button
                key={idx}
                onClick={() => handleAnswerClick(option)}
                disabled={selectedAnswer !== null}
                whileHover={selectedAnswer === null ? { scale: 1.08, y: -4 } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
                style={{
                  padding: '20px 36px',
                  fontSize: '32px',
                  fontWeight: 900,
                  fontFamily: 'Nunito, sans-serif',
                  background: bgColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: selectedAnswer !== null ? 'not-allowed' : 'pointer',
                  boxShadow: isSelected 
                    ? '0 8px 24px rgba(0,0,0,0.3)' 
                    : '0 6px 20px rgba(245,158,11,0.4)',
                  opacity: selectedAnswer !== null && !isSelected ? 0.5 : 1,
                  minWidth: '90px',
                }}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Game Completion Popup */}
      <AnimatePresence>
        {isGameComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '32px',
                padding: '48px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                textAlign: 'center',
              }}
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                style={{ fontSize: '72px', marginBottom: '24px' }}
              >
                🎉
              </motion.div>

              <h2 style={{
                fontSize: '36px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px',
                fontFamily: 'Nunito, sans-serif',
              }}>
                Great Job!
              </h2>

              <p style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '32px',
                fontFamily: 'Nunito, sans-serif',
              }}>
                You completed all levels! 🐟
              </p>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginBottom: '36px',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', fontFamily: 'Nunito, sans-serif' }}>
                    {score}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase' }}>
                    Points
                  </div>
                </div>
                <div style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', fontFamily: 'Nunito, sans-serif' }}>
                    {correctAnswers}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase' }}>
                    Correct
                  </div>
                </div>
                <div style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>
                    {mistakes}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase' }}>
                    Mistakes
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  onClick={restartGame}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: 800,
                    fontFamily: 'Nunito, sans-serif',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                  }}
                >
                  🔄 Play Again
                </motion.button>
                {onNavigateHome && (
                  <motion.button
                    onClick={onNavigateHome}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '16px 32px',
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'Nunito, sans-serif',
                      background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(139,92,246,0.4)',
                    }}
                  >
                    ↩️ Back
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountFishGame;
