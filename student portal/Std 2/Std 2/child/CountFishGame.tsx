/**
 * child/CountFishGame.tsx - PERFORMANCE OPTIMIZED VERSION
 * ─────────────────────────────────────────────────────
 * Count the Fish Game - Educational counting game for kids
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Fish positions stored in refs, NOT state (prevents 60 re-renders/sec)
 * - Direct DOM manipulation for smooth animation
 * - Round state machine prevents race conditions
 * - Memoized static decorations
 * - Proper timer cleanup
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Fish {
  id: string;
  initialX: number;
  y: number;
  direction: 'left' | 'right';
  speed: number;
  emoji: string;
}

interface Animal {
  id: string;
  x: number;
  y: number;
  emoji: string;
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
const ANIMAL_EMOJIS = ['🐙', '🦀', '🦞', '🦈', '🐢', '🦑', '🦐'];
const TOTAL_LEVELS = 3;
const ROUNDS_PER_LEVEL = 5;

type RoundState = 'playing' | 'feedback' | 'transitioning';

const CountFishGame: React.FC<Props> = ({ onStatsUpdate, onNavigateHome }) => {
  // Game state
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Round data (only updated when round changes, NOT during animation)
  const [fish, setFish] = useState<Fish[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerOptions, setAnswerOptions] = useState<number[]>([]);
  
  // UI state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [message, setMessage] = useState('');
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [roundState, setRoundState] = useState<RoundState>('playing');

  // Animation refs - CRITICAL for performance
  const animationFrameRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const fishRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const fishPositionsRef = useRef<Map<string, number>>(new Map()); // x position for each fish

  // Get level configuration
  const getLevelConfig = useCallback((lvl: number) => {
    switch (lvl) {
      case 1: return { fishCount: [1, 4], animals: 0, speed: 0.3 };
      case 2: return { fishCount: [2, 6], animals: 2, speed: 0.4 };
      case 3: return { fishCount: [3, 8], animals: 4, speed: 0.5 };
      default: return { fishCount: [1, 4], animals: 0, speed: 0.3 };
    }
  }, []);

  // Generate random position with collision avoidance
  const getRandomPosition = useCallback((occupied: { x: number; y: number }[], minDist = 15) => {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const x = 10 + Math.random() * 80;
      const y = 15 + Math.random() * 70;

      const isTooClose = occupied.some(pos => 
        Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < minDist
      );

      if (!isTooClose) {
        return { x, y };
      }
      attempts++;
    }

    // Fallback
    return { x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 };
  }, []);

  // Generate new round
  const generateRound = useCallback(() => {
    setRoundState('transitioning');
    setSelectedAnswer(null);
    setIsAnswerCorrect(false);
    setMessage('');

    const config = getLevelConfig(level);
    const [minFish, maxFish] = config.fishCount;
    const fishCount = minFish + Math.floor(Math.random() * (maxFish - minFish + 1));
    
    const occupied: { x: number; y: number }[] = [];
    
    // Generate fish
    const newFish: Fish[] = [];
    for (let i = 0; i < fishCount; i++) {
      const pos = getRandomPosition(occupied);
      occupied.push(pos);
      
      const direction = Math.random() > 0.5 ? 'right' : 'left';
      const startX = direction === 'right' ? -5 : 105;
      
      newFish.push({
        id: `fish-${i}-${Date.now()}`,
        initialX: startX,
        y: pos.y,
        direction,
        speed: config.speed + Math.random() * 0.2,
        emoji: FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)],
      });
    }
    
    // Generate distraction animals
    const newAnimals: Animal[] = [];
    for (let i = 0; i < config.animals; i++) {
      const pos = getRandomPosition(occupied);
      occupied.push(pos);
      
      newAnimals.push({
        id: `animal-${i}-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        emoji: ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)],
      });
    }
    
    // Generate answer options
    const correct = fishCount;
    const wrongOptions: number[] = [];
    const allPossible = Array.from({ length: maxFish + 3 }, (_, i) => i);
    
    while (wrongOptions.length < 3) {
      const option = allPossible[Math.floor(Math.random() * allPossible.length)];
      if (option !== correct && !wrongOptions.includes(option)) {
        wrongOptions.push(option);
      }
    }
    
    const options = [correct, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    setFish(newFish);
    setAnimals(newAnimals);
    setCorrectCount(correct);
    setAnswerOptions(options);
    
    // Initialize fish positions in ref
    fishPositionsRef.current.clear();
    newFish.forEach(f => {
      fishPositionsRef.current.set(f.id, f.initialX);
    });
    
    // Small delay before allowing play
    setTimeout(() => {
      setRoundState('playing');
    }, 100);
  }, [level, getLevelConfig, getRandomPosition]);

  // Initialize first round
  useEffect(() => {
    generateRound();
  }, []);

  // PERFORMANCE CRITICAL: Animation loop using refs, NOT state
  useEffect(() => {
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 16;
      lastTime = now;

      // Update each fish position via ref and direct DOM manipulation
      fish.forEach(f => {
        const currentX = fishPositionsRef.current.get(f.id) ?? f.initialX;
        let newX = currentX;

        if (f.direction === 'right') {
          newX += f.speed * delta;
          if (newX > 105) newX = -5;
        } else {
          newX -= f.speed * delta;
          if (newX < -5) newX = 105;
        }

        fishPositionsRef.current.set(f.id, newX);

        // Update DOM directly - NO setState, NO re-render!
        const fishEl = fishRefsMap.current.get(f.id);
        if (fishEl) {
          fishEl.style.left = `${newX}%`;
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fish]);

  // Update parent stats
  useEffect(() => {
    onStatsUpdate({ score, level, round, mistakes });
  }, [score, level, round, mistakes, onStatsUpdate]);

  // Handle answer selection - with proper state locking
  const handleAnswerClick = useCallback((answer: number) => {
    if (roundState !== 'playing') return; // Locked during feedback/transition
    
    setRoundState('feedback');
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
    
    // Clear any existing timer
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    
    // Move to next round after delay
    feedbackTimerRef.current = window.setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) {
        if (level >= TOTAL_LEVELS) {
          // Game complete
          setIsGameComplete(true);
          setRoundState('feedback'); // Stay in feedback showing completion
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
  }, [roundState, correctCount, round, level, generateRound]);

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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Memoized underwater decorations - prevents recreation on every render
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
              background: isAnswerCorrect
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
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
          key={`question-${round}`}
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
          
          {/* Fish - countable - using ref callback for DOM access */}
          {fish.map(f => (
            <motion.div
              key={f.id}
              ref={(el) => {
                if (el) {
                  fishRefsMap.current.set(f.id, el);
                } else {
                  fishRefsMap.current.delete(f.id);
                }
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: `${f.initialX}%`, // Initial position, updated via ref
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
            let bgColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
            
            if (isSelected) {
              bgColor = isAnswerCorrect 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #ef4444, #dc2626)';
            }
            
            const isDisabled = roundState !== 'playing';
            
            return (
              <motion.button
                key={idx}
                onClick={() => handleAnswerClick(option)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.08, y: -4 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                style={{
                  padding: '20px 36px',
                  fontSize: '32px',
                  fontWeight: 900,
                  fontFamily: 'Nunito, sans-serif',
                  background: bgColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isSelected 
                    ? '0 8px 24px rgba(0,0,0,0.3)' 
                    : '0 6px 20px rgba(245,158,11,0.4)',
                  opacity: isDisabled && !isSelected ? 0.5 : 1,
                  minWidth: '90px',
                  transition: 'all 0.2s ease',
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
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              style={{
                background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                borderRadius: '32px',
                padding: '48px',
                maxWidth: '600px',
                width: '90%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎊</div>
              <h2 style={{
                fontSize: '36px',
                fontWeight: 900,
                fontFamily: 'Nunito, sans-serif',
                color: '#1e293b',
                marginBottom: '16px',
              }}>
                Game Complete!
              </h2>
              <p style={{
                fontSize: '24px',
                fontFamily: 'Nunito, sans-serif',
                color: '#64748b',
                marginBottom: '32px',
              }}>
                🏆 Final Score: <strong style={{ color: '#10b981' }}>{score}</strong><br />
                ✅ Correct: {correctAnswers}<br />
                ❌ Mistakes: {mistakes}
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <motion.button
                  onClick={restartGame}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '16px 32px',
                    fontSize: '20px',
                    fontWeight: 700,
                    fontFamily: 'Nunito, sans-serif',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
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
                      fontSize: '20px',
                      fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                    }}
                  >
                    🏠 Home
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
