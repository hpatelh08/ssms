/**
 * parent/components/attendance/AttendanceHero.tsx
 * ─────────────────────────────────────────────────────
 * Hero section with animated backpack icon, floating
 * background elements, and encouraging copy.
 *
 * Consumes useAttendance() — must be inside AttendanceProvider.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAttendance } from '../../../context/AttendanceContext';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

export const AttendanceHero: React.FC = () => {
  const { streak } = useAttendance();

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden p-8 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(219,234,254,0.7) 0%, rgba(237,233,254,0.7) 40%, rgba(252,231,243,0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 8px 40px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.02)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.04 }}
    >
      {/* ── Floating background blobs ── */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full opacity-[0.08] blur-3xl" />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-[0.08] blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-[0.06] blur-2xl" />

      {/* ── Floating sparkle particles ── */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/40"
          style={{
            top: `${20 + i * 25}%`,
            left: `${15 + i * 30}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}

      {/* ── Big animated icon ── */}
      <motion.div
        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative"
        style={{
          background: 'rgba(255,255,255,0.5)',
          boxShadow: '0 4px 24px rgba(99,102,241,0.12)',
        }}
        animate={{ y: [0, -6, 0], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-4xl">🎒</span>
        {/* Sparkle ring when streak > 3 */}
        {streak > 3 && (
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              border: '2px solid rgba(245,158,11,0.3)',
              boxShadow: '0 0 16px rgba(245,158,11,0.15)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      <h1 className="text-xl font-black text-gray-800 tracking-tight relative z-10">
        Learning Journey This Week
      </h1>
      <p className="text-sm text-gray-400 mt-1.5 font-medium relative z-10">
        Every small action builds consistency 🌟
      </p>
    </motion.div>
  );
};
