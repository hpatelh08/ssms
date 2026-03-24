/**
 * games/hub/LibrarySection.tsx — NCERT Library section
 * ─────────────────────────────────────────────────────
 * Student role → shows friendly message "Ask your parent to explore books"
 * Parent role  → triggers role switch to parent dashboard with books
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';

interface LibrarySectionProps {
  onBack: () => void;
  /** Called to switch to parent role + navigate to books */
  onNavigateToBooks: () => void;
}

const LibrarySection: React.FC<LibrarySectionProps> = ({ onBack, onNavigateToBooks }) => {
  const { user } = useAuth();
  const isParent = user.role === 'parent';

  // If parent is viewing, auto-redirect to books
  useEffect(() => {
    if (isParent) {
      const t = setTimeout(() => onNavigateToBooks(), 600);
      return () => clearTimeout(t);
    }
  }, [isParent, onNavigateToBooks]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={S.wrapper}
    >
      {/* Warm background */}
      <div style={S.bg} />

      {/* Header */}
      <div style={S.headerRow}>
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.12, x: -3 }}
          whileTap={{ scale: 0.92 }}
          style={S.backBtn}
          aria-label="Back to Games Hub"
        >
          ←
        </motion.button>

        <div style={S.iconBadge}>
          <span style={{ fontSize: 24 }}>📖</span>
        </div>

        <div>
          <h2 style={S.title}>NCERT Library</h2>
          <p style={S.subtitle}>Books & Textbooks for Class 4</p>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        style={S.card}
      >
        {isParent ? (
          <>
            <motion.span
              style={{ fontSize: 56, lineHeight: 1 }}
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📚
            </motion.span>
            <p style={S.cardText}>Redirecting to your Books dashboard…</p>
          </>
        ) : (
          <>
            <motion.span
              style={{ fontSize: 64, lineHeight: 1 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              📚
            </motion.span>
            <h3 style={S.cardTitle}>Ask your parent!</h3>
            <p style={S.cardText}>
              Your parent can explore NCERT & GSEB books from the Parent Dashboard.
            </p>
            <p style={S.cardHint}>
              Tell them to tap <strong>NCERT Library</strong> in the Parent section 😊
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ── Styles ────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto',
    padding: '16px 16px 0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(170deg, #FFF5E1 0%, #FFE8D6 40%, #FFDDC1 70%, #FFD6B8 100%)',
    zIndex: -1,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: '2px solid rgba(139,111,94,0.2)',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer',
    fontSize: 20,
    fontWeight: 900,
    color: '#8B6F5E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #FFB4A2, #E5989B)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 'clamp(18px, 2.5vw, 26px)',
    fontWeight: 900,
    color: '#5B3A29',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 'clamp(11px, 1.3vw, 14px)',
    fontWeight: 600,
    color: '#8B6F5E',
    margin: 0,
  },
  card: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '40px 24px',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: 28,
    border: '2px solid rgba(255,255,255,0.5)',
    maxWidth: 480,
    margin: '0 auto',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 'clamp(20px, 3vw, 28px)',
    fontWeight: 900,
    color: '#5B3A29',
    margin: 0,
  },
  cardText: {
    fontSize: 'clamp(13px, 1.6vw, 16px)',
    fontWeight: 600,
    color: '#8B6F5E',
    margin: 0,
    lineHeight: 1.5,
  },
  cardHint: {
    fontSize: 'clamp(11px, 1.3vw, 13px)',
    fontWeight: 500,
    color: '#B8927F',
    margin: 0,
  },
};

export default React.memo(LibrarySection);
