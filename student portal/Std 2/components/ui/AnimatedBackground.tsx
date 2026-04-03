import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Blob {
  id: number;
  size: number;
  x: string;
  y: string;
  color: string;
  duration: number;
  delay: number;
}

const BLOB_COLORS = [
  'rgba(59, 130, 246, 0.08)',   // blue
  'rgba(6, 182, 212, 0.07)',    // cyan
  'rgba(168, 85, 247, 0.06)',   // purple
  'rgba(245, 158, 11, 0.05)',   // amber
  'rgba(16, 185, 129, 0.06)',   // green
  'rgba(236, 72, 153, 0.05)',   // pink
];

export const AnimatedBackground: React.FC = React.memo(() => {
  const blobs = useMemo<Blob[]>(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: 200 + Math.random() * 400,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      color: BLOB_COLORS[i % BLOB_COLORS.length],
      duration: 18 + Math.random() * 12,
      delay: i * -3,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Floating gradient blobs */}
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 60, -40, 30, 0],
            y: [0, -50, 40, -30, 0],
            scale: [1, 1.15, 0.9, 1.08, 1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: blob.delay,
          }}
        />
      ))}

      {/* Floating sparkle particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${8 + Math.random() * 84}%`,
            top: `${5 + Math.random() * 90}%`,
            width: 3 + Math.random() * 4,
            height: 3 + Math.random() * 4,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${
              ['rgba(245,158,11,0.6)', 'rgba(59,130,246,0.5)', 'rgba(168,85,247,0.5)', 'rgba(16,185,129,0.5)'][i % 4]
            } 0%, transparent 80%)`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
            y: [0, -20 - Math.random() * 30, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';
