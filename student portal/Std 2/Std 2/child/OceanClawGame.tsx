/**
 * child/OceanClawGame.tsx
 * ─────────────────────────────────────────────────────
 * Ocean Claw Game — Landscape-style ocean cleanup claw game
 *
 * FIXED & UPGRADED VERSION
 * 
 * State Machine: idle → dropping → returning → idle
 * Fast animations, reliable state resets, professional UI
 *
 * Game mechanics:
 *  • Ship floats at top with hanging claw
 *  • Claw moves left-right automatically while idle
 *  • Press SPACE or click Drop button to drop claw
 *  • Claw grabs first object it touches and returns quickly
 *  • Trash: +10 points, disappears
 *  • Animals: -5 points, +1 mistake, stays
 *
 * Visual implementation:
 *  • All visuals use CSS, gradients, and emojis
 *  • No external image files required
 *  • Structured for easy PNG asset replacement later
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ClawState = 'idle' | 'dropping' | 'returning';

interface GameObject {
  id: string;
  type: 'trash' | 'animal';
  subType: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100 (relative to ocean area)
  emoji: string;
  collected: boolean;
}

interface Props {
  onStatsUpdate: (stats: {
    score: number;
    trashCollected: number;
    mistakes: number;
  }) => void;
  onNavigateHome?: () => void;
}

// Object templates - Easy to replace with PNG paths later
const TRASH_ITEMS = [
  { subType: 'bottle', emoji: '🍾' },
  { subType: 'bag', emoji: '🛍️' },
  { subType: 'can', emoji: '🥫' },
  { subType: 'cup', emoji: '🥤' },
];

const ANIMALS = [
  { subType: 'fish', emoji: '🐟' },
  { subType: 'turtle', emoji: '🐢' },
  { subType: 'octopus', emoji: '🐙' },
  { subType: 'crab', emoji: '🦀' },
];

// Animation speeds - ADJUSTED for child-friendly gameplay
const CLAW_HORIZONTAL_SPEED = 0.25; // horizontal movement speed (reduced from 0.5 for smoother, easier tracking)
const CLAW_DROP_SPEED = 4; // dropping speed
const CLAW_RETURN_SPEED = 5; // return speed
const MIN_OBJECT_DISTANCE = 15; // minimum distance between objects to prevent overlap

export const OceanClawGame: React.FC<Props> = ({ onStatsUpdate, onNavigateHome }) => {
  // Claw state machine
  const [clawState, setClawState] = useState<ClawState>('idle');
  const [clawX, setClawX] = useState(50); // percentage
  const [clawY, setClawY] = useState(0); // 0 = at top, 100 = at bottom
  const [clawDirection, setClawDirection] = useState<'right' | 'left'>('right');
  
  // Game state
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [score, setScore] = useState(0);
  const [trashCollected, setTrashCollected] = useState(0);
  const [totalTrash, setTotalTrash] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');
  const [grabbedObject, setGrabbedObject] = useState<GameObject | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  
  // Refs for animation control and performance
  const animationFrameRef = useRef<number>();
  const horizontalMoveRef = useRef<number>();
  const clawXRef = useRef(50);
  const clawYRef = useRef(0);

  // Initialize objects with smart spacing to prevent overlap and vertical blocking
  useEffect(() => {
    const initialObjects: GameObject[] = [];
    
    // Helper function to check if position is too close to existing objects
    const isTooClose = (x: number, y: number, objects: GameObject[]) => {
      return objects.some(obj => {
        const dx = Math.abs(obj.x - x);
        const dy = Math.abs(obj.y - y);
        return dx < MIN_OBJECT_DISTANCE && dy < MIN_OBJECT_DISTANCE;
      });
    };
    
    // Helper to check if position would block trash vertically
    const wouldBlockTrash = (x: number, y: number, objects: GameObject[]) => {
      // Check if there's trash below this position in the same vertical lane
      return objects.some(obj => {
        if (obj.type !== 'trash') return false;
        const dx = Math.abs(obj.x - x);
        const isInSameVerticalLane = dx < 12; // within pickup lane
        const isAboveTrash = y < obj.y - 10; // would be above the trash
        return isInSameVerticalLane && isAboveTrash;
      });
    };
    
    // Helper to generate safe position
    const generateSafePosition = (type: 'trash' | 'animal', attempts = 50): { x: number; y: number } | null => {
      for (let attempt = 0; attempt < attempts; attempt++) {
        const x = 10 + Math.random() * 80;
        const y = 20 + Math.random() * 70;
        
        if (!isTooClose(x, y, initialObjects)) {
          // For animals, check if they would block trash
          if (type === 'animal' && wouldBlockTrash(x, y, initialObjects)) {
            continue; // try another position
          }
          return { x, y };
        }
      }
      return null; // fallback if no safe position found
    };
    
    // Add trash items FIRST (so animals can check against them)
    for (let i = 0; i < 8; i++) {
      const template = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
      const position = generateSafePosition('trash');
      
      if (position) {
        initialObjects.push({
          id: `trash-${i}`,
          type: 'trash',
          subType: template.subType,
          x: position.x,
          y: position.y,
          emoji: template.emoji,
          collected: false,
        });
      }
    }
    
    // Add animals AFTER trash (with blocking prevention)
    for (let i = 0; i < 6; i++) {
      const template = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const position = generateSafePosition('animal');
      
      if (position) {
        initialObjects.push({
          id: `animal-${i}`,
          type: 'animal',
          subType: template.subType,
          x: position.x,
          y: position.y,
          emoji: template.emoji,
          collected: false,
        });
      }
    }
    
    setObjects(initialObjects);
    setTotalTrash(initialObjects.filter(obj => obj.type === 'trash').length);
  }, []);

  // Update parent stats
  useEffect(() => {
    onStatsUpdate({ score, trashCollected, mistakes });
  }, [score, trashCollected, mistakes, onStatsUpdate]);

  // Check game completion
  useEffect(() => {
    if (totalTrash > 0 && trashCollected >= totalTrash && !isGameComplete) {
      setIsGameComplete(true);
      // Clean up animations when game completes
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (horizontalMoveRef.current) {
        clearInterval(horizontalMoveRef.current);
      }
    }
  }, [trashCollected, totalTrash, isGameComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (horizontalMoveRef.current) {
        clearInterval(horizontalMoveRef.current);
      }
    };
  }, []);

  // Sync refs with state for performance
  useEffect(() => {
    clawXRef.current = clawX;
  }, [clawX]);

  useEffect(() => {
    clawYRef.current = clawY;
  }, [clawY]);

  // Auto-move claw left-right when idle
  useEffect(() => {
    if (clawState !== 'idle' || isGameComplete) {
      if (horizontalMoveRef.current) {
        clearInterval(horizontalMoveRef.current);
        horizontalMoveRef.current = undefined;
      }
      return;
    }

    horizontalMoveRef.current = window.setInterval(() => {
      setClawX(prev => {
        let newX = prev;
        if (clawDirection === 'right') {
          newX = prev + CLAW_HORIZONTAL_SPEED;
          if (newX >= 95) {
            setClawDirection('left');
            return 95;
          }
        } else {
          newX = prev - CLAW_HORIZONTAL_SPEED;
          if (newX <= 5) {
            setClawDirection('right');
            return 5;
          }
        }
        return newX;
      });
    }, 16); // ~60fps

    return () => {
      if (horizontalMoveRef.current) {
        clearInterval(horizontalMoveRef.current);
      }
    };
  }, [clawState, clawDirection]);

  // Handle object grabbed
  const handleObjectGrabbed = useCallback((obj: GameObject) => {
    if (obj.type === 'trash') {
      setScore(prev => prev + 10);
      setTrashCollected(prev => prev + 1);
      setMessage('🎉 +10 Trash collected!');
      // Remove trash from ocean
      setObjects(prev => 
        prev.map(o => o.id === obj.id ? { ...o, collected: true } : o)
      );
    } else {
      setScore(prev => Math.max(0, prev - 5));
      setMistakes(prev => prev + 1);
      setMessage('😢 -5 Protect the animals!');
      // Animals stay in ocean
    }
    
    setTimeout(() => setMessage(''), 1500);
  }, []);

  // Restart game function
  const restartGame = useCallback(() => {
    // Reset all state
    setScore(0);
    setTrashCollected(0);
    setMistakes(0);
    setIsGameComplete(false);
    setClawState('idle');
    setClawX(50);
    setClawY(0);
    setClawDirection('right');
    setGrabbedObject(null);
    setMessage('');
    
    // Regenerate objects
    const initialObjects: GameObject[] = [];
    
    const isTooClose = (x: number, y: number, objects: GameObject[]) => {
      return objects.some(obj => {
        const dx = Math.abs(obj.x - x);
        const dy = Math.abs(obj.y - y);
        return dx < MIN_OBJECT_DISTANCE && dy < MIN_OBJECT_DISTANCE;
      });
    };
    
    const wouldBlockTrash = (x: number, y: number, objects: GameObject[]) => {
      return objects.some(obj => {
        if (obj.type !== 'trash') return false;
        const dx = Math.abs(obj.x - x);
        const isInSameVerticalLane = dx < 12;
        const isAboveTrash = y < obj.y - 10;
        return isInSameVerticalLane && isAboveTrash;
      });
    };
    
    const generateSafePosition = (type: 'trash' | 'animal', attempts = 50): { x: number; y: number } | null => {
      for (let attempt = 0; attempt < attempts; attempt++) {
        const x = 10 + Math.random() * 80;
        const y = 20 + Math.random() * 70;
        
        if (!isTooClose(x, y, initialObjects)) {
          if (type === 'animal' && wouldBlockTrash(x, y, initialObjects)) {
            continue;
          }
          return { x, y };
        }
      }
      return null;
    };
    
    for (let i = 0; i < 8; i++) {
      const template = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
      const position = generateSafePosition('trash');
      
      if (position) {
        initialObjects.push({
          id: `trash-${i}`,
          type: 'trash',
          subType: template.subType,
          x: position.x,
          y: position.y,
          emoji: template.emoji,
          collected: false,
        });
      }
    }
    
    for (let i = 0; i < 6; i++) {
      const template = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const position = generateSafePosition('animal');
      
      if (position) {
        initialObjects.push({
          id: `animal-${i}`,
          type: 'animal',
          subType: template.subType,
          x: position.x,
          y: position.y,
          emoji: template.emoji,
          collected: false,
        });
      }
    }
    
    setObjects(initialObjects);
    setTotalTrash(initialObjects.filter(obj => obj.type === 'trash').length);
  }, []);

  // Drop claw logic with proper state machine
  const dropClaw = useCallback(() => {
    if (clawState !== 'idle' || isGameComplete) return;
    
    setClawState('dropping');
    setGrabbedObject(null);
    
    let currentY = clawY;
    let hasGrabbed = false;
    
    const animate = () => {
      currentY += CLAW_DROP_SPEED;
      setClawY(currentY);
      
      // Check collision with objects (only once)
      if (!hasGrabbed) {
        const hitObject = objects.find(obj => {
          if (obj.collected) return false;
          const dx = Math.abs(obj.x - clawX);
          const dy = Math.abs(obj.y - currentY);
          return dx < 8 && dy < 8;
        });
        
        if (hitObject) {
          hasGrabbed = true;
          setGrabbedObject(hitObject);
          handleObjectGrabbed(hitObject);
          // Immediately start returning
          returnClaw(currentY);
          return;
        }
      }
      
      // Reached bottom without grabbing
      if (currentY >= 100) {
        returnClaw(currentY);
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [clawState, clawX, clawY, objects, handleObjectGrabbed, isGameComplete]);

  // Return claw to top
  const returnClaw = useCallback((startY: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setClawState('returning');
    let currentY = startY;
    
    const animate = () => {
      currentY -= CLAW_RETURN_SPEED;
      setClawY(currentY);
      
      if (currentY <= 0) {
        // Reset to idle state
        setClawY(0);
        setClawState('idle');
        setGrabbedObject(null);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && clawState === 'idle' && !isGameComplete) {
        e.preventDefault();
        dropClaw();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropClaw, clawState, isGameComplete]);

  // Memoized sky decorations - prevents lag on start
  const skyDecorations = useMemo(() => (
    <>
      {/* Sun */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ rotate: { duration: 120, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        style={{
          position: 'absolute',
          top: '8%',
          right: '10%',
          fontSize: '48px',
          filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.6))',
        }}
      >
        ☀️
      </motion.div>
      {/* Clouds */}
      <motion.div
        animate={{ x: ['-10%', '110%'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: '15%', fontSize: '36px', opacity: 0.75 }}
      >
        ☁️
      </motion.div>
      <motion.div
        animate={{ x: ['110%', '-10%'] }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: '45%', fontSize: '32px', opacity: 0.65 }}
      >
        ☁️
      </motion.div>
      <motion.div
        animate={{ x: ['-10%', '110%'] }}
        transition={{ duration: 65, repeat: Infinity, ease: 'linear', delay: 10 }}
        style={{ position: 'absolute', top: '28%', fontSize: '28px', opacity: 0.6 }}
      >
        ☁️
      </motion.div>
      {/* Birds */}
      <motion.div
        animate={{ x: ['-5%', '105%'], y: [0, -10, 0, 10, 0] }}
        transition={{ x: { duration: 35, repeat: Infinity, ease: 'linear' }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        style={{ position: 'absolute', top: '20%', fontSize: '24px', opacity: 0.7 }}
      >
        🐦
      </motion.div>
      <motion.div
        animate={{ x: ['105%', '-5%'], y: [0, 8, 0, -8, 0] }}
        transition={{ x: { duration: 40, repeat: Infinity, ease: 'linear' }, y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
        style={{ position: 'absolute', top: '35%', fontSize: '20px', opacity: 0.65 }}
      >
        🐦
      </motion.div>
    </>
  ), []);

  // Memoized underwater decorations - prevents lag on start
  const underwaterDecorations = useMemo(() => (
    <>
      <motion.div
        animate={{ rotate: [0, 3, 0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '5%', left: '8%', fontSize: '56px', opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        🪸
      </motion.div>
      <motion.div
        animate={{ rotate: [0, -4, 0, 4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '3%', right: '12%', fontSize: '50px', opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        🌿
      </motion.div>
      <motion.div
        animate={{ scaleY: [1, 1.1, 1], scaleX: [1, 0.95, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '8%', left: '25%', fontSize: '48px', opacity: 0.7 }}
      >
        🪸
      </motion.div>
      <motion.div
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '2%', right: '35%', fontSize: '44px', opacity: 0.75 }}
      >
        🌿
      </motion.div>
      {/* Bubbles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          animate={{ y: ['0%', '-120%'], x: [0, Math.sin(i * 0.5) * 30, 0], scale: [1, 1.2, 0.8] }}
          transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          style={{ position: 'absolute', bottom: 0, left: `${8 + i * 9}%`, fontSize: '24px', opacity: 0.6 }}
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
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 8px 24px rgba(6,182,212,0.4)',
              zIndex: 100,
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game container - Professional polish */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          background: 'linear-gradient(180deg, #87ceeb 0%, #b3ddf2 15%, #5dade2 25%, #3498db 38%, #2980b9 55%, #2c5f7f 75%, #1a3a52 100%)',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          aspectRatio: '16/9',
        }}
      >
        {/* Sky area - Enhanced with sun, clouds, and birds */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '22%',
          background: 'linear-gradient(180deg, #87ceeb 0%, #a4d8ed 60%, #b8e3f5 100%)',
          zIndex: 1,
        }}>
          {skyDecorations}
        </div>

        {/* Water surface area - Natural blending, no visible track */}
        <div style={{
          position: 'absolute',
          top: '22%',
          left: 0,
          right: 0,
          height: '13%',
          background: 'linear-gradient(180deg, rgba(93,173,226,0.6) 0%, rgba(52,152,219,0.7) 50%, rgba(41,128,185,0.8) 100%)',
          zIndex: 2,
        }}>
          {/* Waves animation */}
          <motion.div
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 0%'],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: 'repeating-linear-gradient(90deg, transparent 0px, rgba(255,255,255,0.08) 20px, transparent 40px)',
              backgroundSize: '100px 100%',
            }}
          />

          {/* Ship - Natural floating effect */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-1, 1, -1] }}
            transition={{ y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
            style={{
              position: 'absolute',
              left: `${clawX}%`,
              top: '15%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '70px',
              zIndex: 3,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
          >
            {/* CSS Ship shape - PLACEHOLDER: Can replace with <img src="/game/ship.png" /> */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
            }}>
              {/* Hull - Improved design */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '8%',
                right: '8%',
                height: '65%',
                background: 'linear-gradient(135deg, #e74c3c 0%, #d63031 50%, #c0392b 100%)',
                borderRadius: '14px 14px 48% 48%',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -3px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              }} />
              {/* Deck stripe */}
              <div style={{
                position: 'absolute',
                bottom: '40%',
                left: '8%',
                right: '8%',
                height: '4px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
              }} />
              {/* Cabin */}
              <div style={{
                position: 'absolute',
                bottom: '45%',
                left: '23%',
                right: '23%',
                height: '48%',
                background: 'linear-gradient(135deg, #fff9e6 0%, #ffeaa7 50%, #fdcb6e 100%)',
                borderRadius: '8px 8px 0 0',
                boxShadow: '0 3px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.1)',
              }} />
              {/* Cabin roof */}
              <div style={{
                position: 'absolute',
                bottom: '85%',
                left: '20%',
                right: '20%',
                height: '10%',
                background: 'linear-gradient(135deg, #e17055, #d63031)',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }} />
              {/* Windows - Improved */}
              <div style={{
                position: 'absolute',
                bottom: '58%',
                left: '32%',
                width: '14px',
                height: '14px',
                background: 'linear-gradient(135deg, #a8daff, #74b9ff)',
                borderRadius: '50%',
                border: '2px solid #0984e3',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '58%',
                right: '32%',
                width: '14px',
                height: '14px',
                background: 'linear-gradient(135deg, #a8daff, #74b9ff)',
                borderRadius: '50%',
                border: '2px solid #0984e3',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
              }} />
              {/* Anchor icon */}
              <span style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '28px',
              }}>⚓</span>
            </div>
          </motion.div>
        </div>

        {/* Cable from ship to claw */}
        <div style={{
          position: 'absolute',
          left: `${clawX}%`,
          top: '35%',
          width: '4px',
          height: `${clawY * 0.65}%`,
          background: 'linear-gradient(180deg, #95a5a6, #7f8c8d)',
          transformOrigin: 'top',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          zIndex: 4,
          opacity: 0.9,
        }} />

        {/* Claw - PLACEHOLDER: Can replace with <img src="/game/claw.png" /> */}
        <motion.div
          animate={clawState === 'idle' ? {
            rotate: [-3, 3, -3],
          } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            position: 'absolute',
            left: `${clawX}%`,
            top: `${35 + clawY * 0.65}%`,
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            zIndex: 5,
          }}
        >
          {/* CSS Claw shape - Enhanced */}
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
              borderRadius: '50%',
              boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '8px',
              width: '18px',
              height: '36px',
              background: 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
              borderRadius: '0 0 10px 10px',
              transform: 'rotate(-18deg)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: '8px',
              width: '18px',
              height: '36px',
              background: 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
              borderRadius: '0 0 10px 10px',
              transform: 'rotate(18deg)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }} />
          </div>
          
          {/* Show grabbed object attached to claw */}
          {grabbedObject && (
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '38px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              {grabbedObject.emoji}
            </motion.div>
          )}
        </motion.div>

        {/* Ocean area with objects */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}>
          {/* Underwater decorations - memoized for performance */}
          {underwaterDecorations}

          {/* Game objects */}
          {objects.map(obj => (
            !obj.collected && (
              <motion.div
                key={obj.id}
                animate={{
                  y: [0, -12, 0],
                  x: [0, Math.sin(parseFloat(obj.id.split('-')[1]) || 0) * 8, 0],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '40px',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                }}
              >
                {/* PLACEHOLDER: Can replace with <img src={`/game/${obj.subType}.png`} width="50" /> */}
                {obj.emoji}
              </motion.div>
            )
          ))}
        </div>
      </div>

      {/* Controls - Professional game panel */}
      <div style={{
        marginTop: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(226,232,240,0.5)',
      }}>
        <motion.button
          onClick={dropClaw}
          disabled={clawState !== 'idle'}
          whileHover={clawState === 'idle' ? { scale: 1.06, y: -3 } : {}}
          whileTap={clawState === 'idle' ? { scale: 0.94 } : {}}
          style={{
            padding: '20px 64px',
            fontSize: '24px',
            fontWeight: 900,
            fontFamily: 'Nunito, sans-serif',
            background: clawState !== 'idle'
              ? 'linear-gradient(135deg, #bdc3c7, #95a5a6)'
              : 'linear-gradient(135deg, #f39c12 0%, #e67e22 50%, #d35400 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: clawState !== 'idle' ? 'not-allowed' : 'pointer',
            boxShadow: clawState === 'idle' 
              ? '0 8px 24px rgba(243,156,18,0.45), 0 0 0 2px rgba(243,156,18,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.15)',
            opacity: clawState !== 'idle' ? 0.5 : 1,
            transition: 'all 0.25s ease',
            textShadow: clawState === 'idle' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            letterSpacing: '0.5px',
          }}
        >
          {clawState === 'dropping' && '⬇️ Dropping...'}
          {clawState === 'returning' && '⬆️ Returning...'}
          {clawState === 'idle' && '⬇️ Drop Claw'}
        </motion.button>
        
        <div style={{
          padding: '16px 32px',
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderRadius: '16px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#475569',
          fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(203,213,225,0.5)',
        }}>
          <span style={{ opacity: 0.8 }}>Press</span>
          <kbd style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            borderRadius: '10px',
            fontWeight: 900,
            color: '#1e293b',
            boxShadow: '0 3px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '2px solid #cbd5e1',
            fontSize: '15px',
            letterSpacing: '1px',
          }}>SPACE</kbd>
          <span style={{ opacity: 0.8 }}>to drop</span>
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
                boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5)',
                textAlign: 'center',
              }}
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                style={{
                  fontSize: '72px',
                  marginBottom: '24px',
                }}
              >
                🎉
              </motion.div>

              {/* Title */}
              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '12px',
                  fontFamily: 'Nunito, sans-serif',
                  letterSpacing: '-0.5px',
                }}
              >
                Congratulations!
              </h2>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: '32px',
                  fontFamily: 'Nunito, sans-serif',
                  lineHeight: 1.5,
                }}
              >
                You collected all the trash from the ocean! 🌊
              </p>

              {/* Stats Summary */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  marginBottom: '36px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', fontFamily: 'Nunito, sans-serif' }}>
                    {score}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Points
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', fontFamily: 'Nunito, sans-serif' }}>
                    {trashCollected}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Trash
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>
                    {mistakes}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mistakes
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                    background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(6,182,212,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    letterSpacing: '0.3px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🔄</span>
                  Play Again
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>↩️</span>
                    Back
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

export default OceanClawGame;
