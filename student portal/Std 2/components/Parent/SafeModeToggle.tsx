// SafeModeToggle.tsx — Animated safe-mode toggle with description and status
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SafeModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const SafeModeToggle: React.FC<SafeModeToggleProps> = React.memo(({ enabled, onToggle }) => (
  <motion.div
    className="bg-white/60 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 border border-white/50 shadow-lg shadow-blue-500/[0.03]"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <div className="flex items-center justify-between">
      {/* Left side: info */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100/80 to-emerald-50/60 flex items-center justify-center border border-green-200/30"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <span className="text-lg">{enabled ? '🛡️' : '⚡'}</span>
        </motion.div>
        <div>
          <h3 className="text-sm font-bold text-blue-900">Safe Mode</h3>
          <p className="text-[9px] text-gray-400 font-medium max-w-[220px]">
            {enabled
              ? 'Strict content filtering is active. All AI responses are limited to approved textbook content.'
              : 'Standard mode. AI responses are sourced from approved content with normal filtering.'}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 focus:outline-none"
        style={{
          background: enabled
            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
            : 'linear-gradient(90deg, #d1d5db, #9ca3af)',
        }}
        aria-label={`Safe mode ${enabled ? 'enabled' : 'disabled'}`}
      >
        <motion.div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
          animate={{ x: enabled ? 30 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        {/* Glow */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: '0 0 12px rgba(34,197,94,0.35)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </button>
    </div>

    {/* Status badge */}
    <motion.div
      className="mt-4 flex items-center gap-2"
      layout
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-400'}`}
        animate={enabled ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className={`text-[10px] font-bold uppercase ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
        {enabled ? 'Protected' : 'Standard'}
      </span>
    </motion.div>

    {/* Governance note */}
    <p className="mt-3 text-[8px] text-gray-400 italic">
      Regardless of mode, the system never ranks students, makes predictions, or exposes raw scores.
    </p>
  </motion.div>
));

SafeModeToggle.displayName = 'SafeModeToggle';
