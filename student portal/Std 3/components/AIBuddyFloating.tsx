import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tips = [
  'Need help with this lesson? 😊',
  'Ask AI Buddy anything! 🧠',
  'Want a fun quiz? 📝',
  'I can explain the lesson! 💡',
  'Tap me for help! 🌟',
];

interface AIBuddyFloatingProps {
  onAskAI: () => void;
}

const AIBuddyFloating: React.FC<AIBuddyFloatingProps> = ({ onAskAI }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);

  /* Rotate tips every 6 seconds */
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
      setShowTip(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  /* Auto-hide tip after 4 seconds */
  useEffect(() => {
    if (!showTip) return;
    const t = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(t);
  }, [showTip, tipIndex]);

  const handleClick = useCallback(() => {
    onAskAI();
  }, [onAskAI]);

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[900] flex flex-col items-end gap-2">
      {/* Tip bubble */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="max-w-[220px] rounded-2xl px-4 py-2.5 text-center text-[13px] font-extrabold leading-snug"
            style={{
              position: 'relative',
              color: '#f8fafc',
              background: 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.94) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 28px rgba(2,6,23,0.3), 0 2px 8px rgba(0,0,0,0.14)',
              border: '1px solid rgba(148,163,184,0.24)',
              textShadow: '0 1px 8px rgba(2,6,23,0.35)',
            }}
          >
            {tips[tipIndex]}
            {/* Speech triangle */}
            <div
              className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
              style={{
                background: 'rgba(30,41,59,0.96)',
                border: '1px solid rgba(148,163,184,0.24)',
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buddy button */}
      <motion.button
        onClick={handleClick}
        className="relative w-[62px] h-[62px] rounded-full flex items-center justify-center cursor-pointer outline-none border-none"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #6366f1, #38bdf8)',
          boxShadow: '0 6px 24px rgba(99,102,241,0.3), 0 2px 8px rgba(0,0,0,0.1)',
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Ask AI Buddy"
      >
        <span className="text-[28px] leading-none">🤖</span>
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(255,255,255,0.3)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
};

export default AIBuddyFloating;
