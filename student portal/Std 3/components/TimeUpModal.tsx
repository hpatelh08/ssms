/**
 * components/TimeUpModal.tsx
 * ═══════════════════════════════════════════════════
 * Friendly modal shown when daily playtime expires
 * Blocks gameplay and encourages return tomorrow
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeUpModalProps {
  isOpen: boolean;
  onGoHome: () => void;
}

export const TimeUpModal: React.FC<TimeUpModalProps> = ({ isOpen, onGoHome }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onGoHome}
      >
        <motion.div
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderRadius: 32,
            padding: '40px 48px',
            maxWidth: 480,
            width: '90%',
            border: '3px solid rgba(245,158,11,0.3)',
            boxShadow: '0 20px 60px rgba(245,158,11,0.4)',
            textAlign: 'center',
          }}
        >
          {/* Animated icon */}
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ fontSize: 72, marginBottom: 24 }}
          >
            🌙
          </motion.div>

          {/* Title */}
          <h2 style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#92400E',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}>
            Playtime Finished!
          </h2>

          {/* Message */}
          <p style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#B45309',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}>
            Great job playing today! 🌟
            <br />
            Your daily playtime is complete.
            <br />
            Ask your parent if you'd like to continue tomorrow.
          </p>

          {/* Fun stats */}
          <div style={{
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 20,
            padding: '16px 20px',
            marginBottom: 28,
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#92400E',
              marginBottom: 8,
            }}>
              ✨ Today's Achievements ✨
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B' }}>
                  🏆
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#B45309', marginTop: 4 }}>
                  Games Played
                </div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B' }}>
                  🧠
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#B45309', marginTop: 4 }}>
                  Questions Solved
                </div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B' }}>
                  ⭐
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#B45309', marginTop: 4 }}>
                  Stars Earned
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <motion.button
            onClick={onGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 900,
              color: '#fff',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            🏠 Back to Home
          </motion.button>

          {/* Footer message */}
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#B45309',
            marginTop: 20,
            marginBottom: 0,
          }}>
            Your progress has been saved! 💾
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TimeUpModal;
