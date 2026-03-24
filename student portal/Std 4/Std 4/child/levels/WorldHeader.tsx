/**
 * child/levels/WorldHeader.tsx
 * ══════════════════════════════════════════════════════
 * Floating World Banner — premium realm header.
 *
 * Includes:
 *  • World icon + name + tagline
 *  • Animated progress bar with glowing tip
 *  • Completion percentage
 *  • Mini animated badge
 *  • World transition animation (slide + fade)
 *
 * Feels like entering a new realm.
 * Performance: transform + opacity ONLY.
 * ══════════════════════════════════════════════════════
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { WorldTheme } from './worldConfig';

/* ── Progress Bar ── */
const ProgressTrack: React.FC<{
  pct: number;
  completed: number;
  total: number;
  theme: WorldTheme;
}> = React.memo(({ pct, completed, total, theme }) => (
  <div style={{ width: '100%' }}>
    {/* Labels */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 8,
    }}>
      <span style={{
        fontSize: 13, fontWeight: 800,
        color: theme.bodyColor,
        opacity: 0.8,
      }}>
        {completed} / {total} levels
      </span>
      <span style={{
        fontSize: 15, fontWeight: 900,
        color: theme.accentColor,
      }}>
        {pct}%
      </span>
    </div>

    {/* Track */}
    <div style={{
      position: 'relative',
      width: '100%', height: 14, borderRadius: 7,
      background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Fill */}
      <motion.div
        style={{
          height: '100%', borderRadius: 7,
          background: theme.progressGradient,
          willChange: 'transform',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Glowing Tip */}
      {pct > 2 && pct < 100 && (
        <motion.div
          style={{
            position: 'absolute',
            top: -2, bottom: -2,
            width: 14,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: `0 0 12px ${theme.glowColor}, 0 0 4px rgba(255,255,255,0.8)`,
            willChange: 'transform, opacity',
          }}
          initial={{ left: '0%' }}
          animate={{
            left: `calc(${pct}% - 7px)`,
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            left: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      )}
    </div>
  </div>
));
ProgressTrack.displayName = 'ProgressTrack';

/* ══════════════════════════════════════════════════
   WORLD HEADER PANEL
   ══════════════════════════════════════════════════ */

interface WorldHeaderProps {
  theme: WorldTheme;
  completed: number;
  total: number;
  pct: number;
  levelRange: string;
  phaseCount: number;
}

export const WorldHeader: React.FC<WorldHeaderProps> = React.memo(({
  theme, completed, total, pct, levelRange, phaseCount,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 16,
      padding: '28px 36px 24px',
      borderRadius: 28,
      background: 'rgba(255,255,255,0.06)',
      border: '1.5px solid rgba(255,255,255,0.10)',
      maxWidth: 680,
      width: '100%',
      margin: '0 auto',
      willChange: 'transform, opacity',
    }}
  >
    {/* Top row: icon + name + badge */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      width: '100%',
    }}>
      {/* World emoji with glow */}
      <motion.div
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: theme.badgeBg,
          border: `2.5px solid ${theme.accentColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          willChange: 'transform',
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{ fontSize: 38 }}>{theme.emoji}</span>
      </motion.div>

      {/* World info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{
          fontSize: 26, fontWeight: 900,
          color: theme.id === 0 ? theme.headingColor : '#ffffff',
          margin: 0, lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {theme.name}
        </h2>
        <p style={{
          fontSize: 14, fontWeight: 600,
          color: theme.bodyColor,
          opacity: 0.75,
          margin: '4px 0 0',
        }}>
          {theme.tagline}
        </p>
      </div>

      {/* Stats badges */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        alignItems: 'flex-end', flexShrink: 0,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: theme.bodyColor, opacity: 0.6,
          background: 'rgba(255,255,255,0.06)',
          padding: '4px 12px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {levelRange}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: theme.accentColor,
          background: theme.badgeBg,
          padding: '4px 10px', borderRadius: 10,
          border: `1px solid ${theme.accentColor}25`,
        }}>
          {phaseCount} skill{phaseCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>

    {/* Progress bar */}
    <ProgressTrack
      pct={pct}
      completed={completed}
      total={total}
      theme={theme}
    />
  </motion.div>
));

WorldHeader.displayName = 'WorldHeader';
