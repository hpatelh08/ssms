/**
 * child/motion/useSoftMotion.ts
 * ─────────────────────────────────────────────────────
 * Advanced motion system — soft, child-friendly animations.
 * Reusable Framer Motion variants + CSS utility generators.
 *
 * Usage:
 *   import { softMotion } from './motion/useSoftMotion';
 *   <motion.div variants={softMotion.fadeUp} initial="hidden" animate="visible" />
 */

import type { Variants, Transition } from 'framer-motion';

/* ── Reusable Transitions ── */

const springGentle: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
};

const springBouncy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

const easeSmooth: Transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

/* ── Framer Motion Variants ── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

const liftOnHover = {
  whileHover: { y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.25 },
};

const bounceOnTap = {
  whileHover: { scale: 1.04, y: -4 },
  whileTap: { scale: 0.93 },
};

const gentleFloat = {
  animate: { y: [0, -6, 0] },
  transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const },
};

/* ── Stagger container (for list animations) ── */

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/* ── Depth layer props (for parallax-like feel) ── */

const depthBack = {
  style: { transform: 'translateZ(-2px) scale(1.04)' },
};

const depthMid = {
  style: { transform: 'translateZ(0)', position: 'relative' as const },
};

const depthFront = {
  style: { transform: 'translateZ(1px)', position: 'relative' as const },
};

/* ── Exported motion system ── */

export const softMotion = {
  // Variants
  fadeUp,
  fadeIn,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerContainer,
  staggerItem,

  // Interactive props
  liftOnHover,
  bounceOnTap,
  gentleFloat,

  // Transitions
  springGentle,
  springBouncy,
  easeSmooth,

  // Depth layers
  depthBack,
  depthMid,
  depthFront,
};

export default softMotion;
