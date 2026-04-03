import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'strong' | 'dark';
  hover?: boolean;
  glow?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-white/55 backdrop-blur-xl border border-white/30',
  strong: 'bg-white/75 backdrop-blur-2xl border border-white/40',
  dark: 'bg-blue-900/15 backdrop-blur-xl border border-white/15',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  hover = true,
  glow,
  children,
  className = '',
  ...motionProps
}) => {
  return (
    <motion.div
      className={`rounded-3xl ${variantStyles[variant]} ${className}`}
      style={glow ? { boxShadow: `0 0 30px ${glow}` } : undefined}
      whileHover={hover ? { y: -4, boxShadow: '0 12px 30px -8px rgba(59,130,246,0.18)' } : undefined}
      whileTap={hover ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};
