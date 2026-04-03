import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ trigger, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = Array.from({ length: 35 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2800);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="fixed pointer-events-none z-[60]"
          style={{
            left: `${p.x}%`,
            top: '0%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ y: '-5vh', rotate: 0, opacity: 1 }}
          animate={{
            y: '105vh',
            rotate: Math.random() * 720 - 360,
            x: [0, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.2 + Math.random() * 0.8,
            ease: 'linear',
            delay: p.delay,
          }}
          exit={{ opacity: 0 }}
        />
      ))}
    </AnimatePresence>
  );
};
