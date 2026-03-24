/**
 * child/home/RevealSection.tsx
 * ══════════════════════════════════════════════════════
 * Intersection Observer scroll-reveal wrapper.
 *
 * Wraps each home section. When the section enters the
 * viewport it fades in and slides up smoothly.
 *
 * Features:
 *   - Fade + translateY animation (no sudden jumps)
 *   - Configurable stagger delay per section
 *   - `once` mode: only animates in, never out
 *   - GPU-only: transform + opacity, will-change
 *   - Zero layout shift
 *
 * Usage:
 *   <RevealSection delay={0.1}>
 *     <SomeCard />
 *   </RevealSection>
 * ══════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState, type CSSProperties } from 'react';

interface RevealSectionProps {
  children: React.ReactNode;
  /** Stagger delay in seconds. Default: 0 */
  delay?: number;
  /** Slide distance in px. Default: 32 */
  distance?: number;
  /** Transition duration in seconds. Default: 0.65 */
  duration?: number;
  /** IO threshold 0–1. Default: 0.08 */
  threshold?: number;
  /** Animate only the first time. Default: true */
  once?: boolean;
  /** Optional className */
  className?: string;
  /** Optional inline style */
  style?: CSSProperties;
}

export const RevealSection: React.FC<RevealSectionProps> = React.memo(({
  children,
  delay = 0,
  distance = 32,
  duration = 0.65,
  threshold = 0.08,
  once = true,
  className,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) {
            done.current = true;
            io.unobserve(el);
          }
        } else if (!once && !done.current) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const revealStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: [
      `opacity ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      `transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
    ].join(', '),
    willChange: 'transform, opacity',
    ...style,
  };

  return (
    <div ref={ref} className={className} style={revealStyle}>
      {children}
    </div>
  );
});

RevealSection.displayName = 'RevealSection';
