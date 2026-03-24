/**
 * child/levels/ColorMagicWorlds.tsx
 * ══════════════════════════════════════════════════════
 * PREMIUM WORLD PICKER — Floating Island Portal Cards
 *
 * Each world card = interactive game portal:
 *  • Soft 3D tilt on hover (perspective + rotateX/Y)
 *  • Integrated SVG progress ring around world icon
 *  • Animated micro-float icon
 *  • Phase skill badges
 *  • Intelligent hover interactions
 *  • Cinematic "Enter World" button
 *  • Recommended badge for active world
 *  • Decorative floating elements inside card
 *
 * Performance: React.memo, transform+opacity ONLY, 60fps.
 * ══════════════════════════════════════════════════════
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  getWorldMeta,
  getVisibleWorlds,
  getEffectiveLevelHi,
  PHASE_META,
  STREAK_MESSAGES,
  type PlayerProgress,
  type WorldMeta,
} from '../colorMagicEngine';
import { getWorldTheme, isWorldDark, type WorldTheme } from './worldConfig';

const DEV_UNLOCK_ALL = true;

/* ── Stat Badge ── */
const StatBadge: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <span style={{
    fontSize: 14, fontWeight: 800, color: '#5b3fff',
    background: 'rgba(91,63,255,0.08)',
    borderRadius: 16, padding: '5px 14px',
    border: '1.5px solid rgba(91,63,255,0.15)',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }}>{children}</span>
));
StatBadge.displayName = 'StatBadge';

/* ── SVG Progress Ring ── */
const ProgressRing: React.FC<{
  pct: number; size: number; stroke: number;
  color: string; trackColor: string;
}> = React.memo(({ pct, size, stroke, color, trackColor }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{
      position: 'absolute', top: 0, left: 0,
      transform: 'rotate(-90deg)',
    }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={trackColor} strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
});
ProgressRing.displayName = 'ProgressRing';

/* ── Phase Pill ── */
const PhasePill: React.FC<{ phase: number; dark: boolean; theme: WorldTheme }> = React.memo(({ phase, dark, theme }) => {
  const meta = PHASE_META[phase];
  if (!meta) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 800,
      color: dark ? 'rgba(255,255,255,0.85)' : theme.headingColor,
      background: theme.badgeBg,
      borderRadius: 10, padding: '4px 11px',
      border: `1px solid ${theme.accentColor}25`,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {meta.emoji} {meta.name}
    </span>
  );
});
PhasePill.displayName = 'PhasePill';

/* ═══════════════════════════════════════════════════
   FLOATING ISLAND WORLD CARD — 3D tilt, progress ring
   ═══════════════════════════════════════════════════ */
const WorldCard: React.FC<{
  world: WorldMeta;
  theme: WorldTheme;
  unlocked: boolean;
  isActive: boolean;
  completed: number;
  total: number;
  pct: number;
  index: number;
  onSelect: (id: number) => void;
}> = React.memo(({ world, theme, unlocked, isActive, completed, total, pct, index, onSelect }) => {
  const handleClick = useCallback(() => {
    if (unlocked) onSelect(world.id);
  }, [unlocked, onSelect, world.id]);

  const dark = isWorldDark(world.id);
  const textPrimary = dark ? '#ffffff' : theme.headingColor;
  const textSecondary = dark ? 'rgba(255,255,255,0.6)' : theme.bodyColor;

  /* 3D Tilt via pointer tracking */
  const cardRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!cardRef.current || !unlocked) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 4, ry: x * 4 });
  }, [unlocked]);

  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => { setHovered(false); setTilt({ rx: 0, ry: 0 }); }, []);

  const ringSize = 96;
  const ringTrack = dark ? 'rgba(255,255,255,0.08)' : 'rgba(91,63,255,0.10)';

  /* Next boss hint */
  const nextBoss = useMemo(() => {
    const lo = world.levelRange[0];
    for (let lv = lo + completed; lv <= lo + total; lv++) {
      if (lv % 10 === 0) return lv - (lo + completed);
    }
    return null;
  }, [world.levelRange, completed, total]);

  return (
    <motion.button
      ref={cardRef}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 180, damping: 22 }}
      whileTap={unlocked ? { scale: 0.97 } : {}}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'row' as const, alignItems: 'center',
        gap: 28, padding: '28px 36px', borderRadius: 28,
        minHeight: 180,
        background: theme.baseGradient,
        border: dark
          ? `1.5px solid ${unlocked ? theme.accentColor + '25' : 'rgba(255,255,255,0.05)'}`
          : '1px solid rgba(255, 255, 255, 0.55)',
        boxShadow: unlocked
          ? dark
            ? `0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px ${theme.accentColor}10`
            : `0 20px 50px ${theme.glowColor.replace('0.5', '0.18')}`
          : '0 4px 16px rgba(0,0,0,0.08)',
        cursor: unlocked ? 'pointer' : 'not-allowed',
        opacity: unlocked ? 1 : 0.4,
        outline: 'none',
        width: '100%', maxWidth: 860,
        overflow: 'visible',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
        transform: unlocked && hovered
          ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-8px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: hovered ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Layer 2: Radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: theme.radialGlow,
        pointerEvents: 'none', borderRadius: 28,
      }} />

      {/* Layer 3: Decorative floating elements */}
      {unlocked && (
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          borderRadius: 28, pointerEvents: 'none',
        }}>
          {theme.particleColors.slice(0, 2).map((c, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: 40 + i * 20, height: 40 + i * 20,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${c}40, transparent 70%)`,
                top: i === 0 ? '10%' : '60%',
                right: i === 0 ? '8%' : '65%',
                willChange: 'transform',
              }}
              animate={{
                y: [0, -(8 + i * 4), 0],
                x: [0, (4 + i * 3), 0],
              }}
              transition={{
                duration: 5 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 1.5,
              }}
            />
          ))}
        </div>
      )}

      {/* LEFT: Progress Ring + Micro-float Icon */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: ringSize, height: ringSize,
        flexShrink: 0,
      }}>
        {unlocked && (
          <ProgressRing
            pct={pct} size={ringSize} stroke={4}
            color={theme.accentColor} trackColor={ringTrack}
          />
        )}
        <motion.div
          style={{
            position: 'absolute', inset: 6,
            borderRadius: '50%',
            background: theme.badgeBg,
            border: `2px solid ${theme.accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            willChange: 'transform',
          }}
          animate={unlocked ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span style={{ fontSize: 40 }}>{unlocked ? world.emoji : '🔒'}</span>
        </motion.div>
      </div>

      {/* CENTER: Info Block */}
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const,
        gap: 6, position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          <span style={{
            fontSize: 22, fontWeight: 700, color: textPrimary,
            letterSpacing: '-0.01em',
          }}>
            {world.name}
          </span>
          {isActive && unlocked && (
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
              color: dark ? '#fbbf24' : '#b45309',
              background: dark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.18)',
              padding: '3px 10px', borderRadius: 8,
              border: `1px solid ${dark ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.35)'}`,
              textTransform: 'uppercase' as const,
            }}>
              ⭐ Recommended
            </span>
          )}
        </div>

        <span style={{ fontSize: 13, fontWeight: 600, color: textSecondary, lineHeight: 1.3 }}>
          {theme.tagline}
        </span>

        <span style={{ fontSize: 13, fontWeight: 700, color: textSecondary }}>
          Levels {world.levelRange[0]}{world.id === 4 ? '+' : `–${world.levelRange[1]}`} · {world.phases.length} skill{world.phases.length > 1 ? 's' : ''}
        </span>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
          {world.phases.map(ph => (
            <PhasePill key={ph} phase={ph} dark={dark} theme={theme} />
          ))}
        </div>

        {unlocked && (
          <div style={{ width: '100%', maxWidth: 360, marginTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: textSecondary }}>
                {completed}/{total} levels
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: theme.accentColor }}>
                {pct}%
              </span>
            </div>
            <div style={{
              width: '100%', height: 10, borderRadius: 5,
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)',
              overflow: 'hidden',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)'}`,
            }}>
              <motion.div
                style={{
                  height: '100%', borderRadius: 5,
                  background: theme.progressGradient,
                  willChange: 'transform',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.08 }}
              />
            </div>
            {nextBoss != null && nextBoss > 0 && nextBoss <= 20 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: dark ? '#fbbf24' : '#b45309',
                marginTop: 3, display: 'inline-block',
              }}>
                👑 Next boss in {nextBoss} level{nextBoss > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Enter World Button */}
      {unlocked && (
        <div style={{
          display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
          gap: 4, flexShrink: 0, position: 'relative', zIndex: 2,
        }}>
          <motion.div
            style={{
              background: dark ? theme.progressGradient : '#5b3fff',
              color: '#fff', fontWeight: 800, fontSize: 14,
              padding: '10px 22px', borderRadius: 16,
              border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.02em',
              willChange: 'transform',
            }}
            whileHover={{ scale: 1.06, y: -3 }}
            transition={{ duration: 0.2 }}
          >
            Enter <span style={{ fontSize: 16 }}>→</span>
          </motion.div>
        </div>
      )}
    </motion.button>
  );
});
WorldCard.displayName = 'WorldCard';

/* ══════════════════════════════════════════════════
   MAIN WORLD PICKER
   ══════════════════════════════════════════════════ */

interface ColorMagicWorldsProps {
  progress: PlayerProgress;
  onSelectWorld: (worldId: number) => void;
  onExit?: () => void;
}

export const ColorMagicWorlds: React.FC<ColorMagicWorldsProps> = React.memo(({
  progress, onSelectWorld, onExit,
}) => {
  const visibleWorlds = useMemo(
    () => getVisibleWorlds(progress.highestLevel),
    [progress.highestLevel],
  );
  const streakMsg = STREAK_MESSAGES[progress.streak]
    || (progress.streak > 0 ? `${progress.streak}-day streak! 🔥` : '');

  const activeWorldId = useMemo(() => {
    for (const w of visibleWorlds) {
      const [lo, hi] = w.levelRange;
      if (progress.highestLevel >= lo && progress.highestLevel <= hi) return w.id;
    }
    return visibleWorlds[visibleWorlds.length - 1]?.id ?? 0;
  }, [visibleWorlds, progress.highestLevel]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column' as const,
      width: '100%', minHeight: '100vh',
      overflowX: 'hidden', overflowY: 'auto',
      userSelect: 'none', position: 'relative',
      borderRadius: 28,
      background: 'linear-gradient(135deg, #f3e8ff, #e0f2ff)',
    }}>
      {/* Ambient radial accents */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(255,182,255,0.15), transparent 40%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 75%, rgba(147,197,253,0.12), transparent 40%)' }} />
      </div>

      {/* Top Bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
      }}>
        {onExit ? (
          <motion.button onClick={onExit} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 14,
              background: 'rgba(91,63,255,0.08)',
              color: '#5b3fff', fontWeight: 800, fontSize: 14,
              border: '1.5px solid rgba(91,63,255,0.15)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <span style={{ fontSize: 18 }}>←</span> Home
          </motion.button>
        ) : <div style={{ width: 72 }} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🎨</span>
          <span style={{ fontSize: 21, fontWeight: 900, color: '#5b3fff', letterSpacing: '-0.02em' }}>
            Color Magic
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <StatBadge>⭐ {progress.totalStars}</StatBadge>
          <StatBadge>💎 {progress.totalXP}</StatBadge>
        </div>
      </div>

      {/* Streak Banner */}
      {streakMsg && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px', position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 15, fontWeight: 800, color: '#b45309',
              background: 'rgba(251,191,36,0.15)', borderRadius: 14, padding: '5px 18px',
              border: '2px solid rgba(251,191,36,0.30)',
            }}
          >
            {streakMsg}
          </motion.div>
        </div>
      )}

      {/* Section Title Panel */}
      <div style={{
        textAlign: 'center' as const, padding: '20px 24px 16px',
        position: 'relative', zIndex: 2,
        maxWidth: 620, margin: '0 auto', width: '100%',
        background: 'rgba(255,255,255,0.45)',
        borderRadius: 24,
        boxShadow: '0 12px 36px rgba(100, 90, 255, 0.10)',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#5b3fff', margin: 0, letterSpacing: '-0.01em' }}>
          Choose Your World
        </h1>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#8a8fff', margin: '5px 0 0' }}>
          Each realm is a new adventure in color mastery
        </p>
      </div>

      {/* World Cards */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
        padding: '28px 24px 80px', gap: 32,
        position: 'relative', zIndex: 2,
      }}>
        {visibleWorlds.map((w, idx) => {
          const unlocked = DEV_UNLOCK_ALL || progress.worldsUnlocked.includes(w.id);
          const meta = getWorldMeta(w.id);
          const theme = getWorldTheme(w.id);
          const [lo] = meta.levelRange;
          const hi = getEffectiveLevelHi(w.id, progress.highestLevel);
          const totalInWorld = hi - lo + 1;
          const completedInWorld = Array.from(
            { length: totalInWorld }, (_, i) => lo + i,
          ).filter(lv => (progress.levelStars[lv] || 0) > 0).length;
          const pct = totalInWorld > 0 ? Math.round((completedInWorld / totalInWorld) * 100) : 0;

          return (
            <WorldCard
              key={w.id} world={w} theme={theme}
              unlocked={unlocked} isActive={w.id === activeWorldId}
              completed={completedInWorld} total={totalInWorld} pct={pct}
              index={idx} onSelect={onSelectWorld}
            />
          );
        })}
      </div>
    </div>
  );
});

ColorMagicWorlds.displayName = 'ColorMagicWorlds';
