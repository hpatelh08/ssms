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
            className="px-4 py-2.5 rounded-2xl text-[12px] font-bold text-gray-700 max-w-[180px] text-center leading-snug"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(63,143,58,0.12), 0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            {tips[tipIndex]}
            {/* Speech triangle */}
            <div
              className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.6)',
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
          background: 'linear-gradient(135deg, #4d7a38, #3f8f3a, #38bdf8)',
          boxShadow: '0 6px 24px rgba(63,143,58,0.3), 0 2px 8px rgba(0,0,0,0.1)',
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
