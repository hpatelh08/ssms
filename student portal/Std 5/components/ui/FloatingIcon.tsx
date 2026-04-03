import React from 'react';
import { motion } from 'framer-motion';

interface FloatingIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: 'blue' | 'amber' | 'green' | 'purple' | 'pink';
  animate?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
};

const glowMap = {
  blue: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))',
  amber: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.5))',
  green: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.5))',
  purple: 'drop-shadow(0 0 12px rgba(122, 163, 68, 0.5))',
  pink: 'drop-shadow(0 0 12px rgba(236, 72, 153, 0.5))',
};

export const FloatingIcon: React.FC<FloatingIconProps> = ({
  icon,
  size = 'md',
  glow = 'blue',
  animate: shouldAnimate = true,
  onClick,
  className = ''
}) => {
  return (
    <motion.span
      className={`inline-block cursor-pointer select-none ${sizeMap[size]} ${className}`}
      style={{ filter: glowMap[glow] }}
      animate={shouldAnimate ? { y: [0, -6, 0] } : undefined}
      transition={shouldAnimate ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
      whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      {icon}
    </motion.span>
  );
};
