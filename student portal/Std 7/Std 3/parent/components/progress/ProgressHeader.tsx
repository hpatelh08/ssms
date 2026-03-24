/**
 * parent/components/progress/ProgressHeader.tsx
 * ─────────────────────────────────────────────────────
 * "Growth Journey" page header with floating icon animation
 * and soft emotional subtitle.
 */

import React from 'react';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

export const ProgressHeader: React.FC = () => (
  <motion.div
    className="text-center py-2"
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.04 }}
  >
    {/* Floating sparkle icon */}
    <motion.div
      className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-3"
      style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(244,114,182,0.12) 100%)',
        boxShadow: '0 4px 20px rgba(168,85,247,0.1)',
      }}
      animate={{ y: [0, -6, 0], rotate: [0, 2, -2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="text-3xl">🌸</span>
    </motion.div>

    <h1 className="text-2xl font-black text-gray-800 tracking-tight">
      Growth Journey
    </h1>
    <p className="text-sm text-gray-400 mt-1 font-medium">
      See how skills are blooming 🌸
    </p>
  </motion.div>
);
