/**
 * components/ui/DashboardCard.tsx
 * ─────────────────────────────────────────────────────
 * Shared card component used by both Parent and Student dashboards.
 *
 * Visual spec (matching card-premium from index.css):
 *  • White bg with glassmorphism blur
 *  • Subtle border + soft shadow
 *  • 32px radius (default) / 24px (compact)
 *  • 24px padding desktop / 16px mobile
 *  • Optional framer-motion entrance animation
 */

import React from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  children: React.ReactNode;
  /** Extra Tailwind classes */
  className?: string;
  /** Use smaller padding + radius */
  compact?: boolean;
  /** Make card clickable */
  onClick?: () => void;
  /** Animate entrance (default: true) */
  animate?: boolean;
  /** Custom delay for staggered layouts */
  delay?: number;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className = '',
  compact = false,
  onClick,
  animate = true,
  delay = 0,
}) => {
  const base = compact
    ? 'card-premium rounded-[24px] p-4 lg:p-6'
    : 'card-premium rounded-[24px] p-6 lg:p-8';

  const interactive = onClick
    ? 'cursor-pointer'
    : '';

  const classes = `${base} ${interactive} ${className}`.trim();

  if (!animate) {
    return (
      <div
        className={classes}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
};
