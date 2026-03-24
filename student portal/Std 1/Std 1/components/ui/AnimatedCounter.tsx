import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className = '',
  prefix = '',
  suffix = ''
}) => {
  const spring = useSpring(0, { stiffness: 80, damping: 25 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [value, spring, display]);

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
};
