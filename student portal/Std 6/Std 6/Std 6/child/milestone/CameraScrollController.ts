/**
 * child/milestone/CameraScrollController.ts
 * ─────────────────────────────────────────────────────
 * Smooth "camera" scroll logic for the full-screen journey map.
 *
 * Instead of native page scroll, the map container is a tall
 * absolutely-positioned div whose `translateY` is animated
 * via framer-motion spring. This gives a cinematic, no-jank
 * camera movement through the world.
 *
 * Exported as a React hook: useCameraScroll().
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CameraState {
  /** Current camera y-offset (px) — negative means scrolled down. */
  offsetY: number;
  /** Animate to this target. */
  targetY: number;
  /** True while camera is auto-centering (e.g., after unlock). */
  isAutoScrolling: boolean;
}

interface UseCameraOptions {
  /** Total map height in px. */
  mapHeight: number;
  /** Viewport height (window.innerHeight minus header). */
  viewportHeight: number;
  /** Initial auto-center on this Y position. */
  initialFocusY?: number;
}

/**
 * Returns camera state + handlers.
 *
 * The parent component should apply `translateY(offsetY)` on
 * the map container and listen to wheel / touch for manual scroll.
 */
export function useCameraScroll({
  mapHeight,
  viewportHeight,
  initialFocusY,
}: UseCameraOptions) {
  const maxScroll = Math.max(0, mapHeight - viewportHeight);

  // Current scroll position (positive = scrolled down)
  const [scrollY, setScrollY] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clamp helper
  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(maxScroll, v)),
    [maxScroll],
  );

  // Initial focus
  useEffect(() => {
    if (initialFocusY != null && initialFocusY > 0) {
      const target = clamp(initialFocusY - viewportHeight / 2);
      setScrollY(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Smooth-scroll camera to center on a given y-pixel. */
  const centerOn = useCallback(
    (y: number) => {
      setIsAutoScrolling(true);
      const target = clamp(y - viewportHeight / 2);
      setScrollY(target);

      if (autoTimer.current) clearTimeout(autoTimer.current);
      autoTimer.current = setTimeout(() => setIsAutoScrolling(false), 900);
    },
    [clamp, viewportHeight],
  );

  /** Manual scroll delta (wheel / touch drag). */
  const scrollBy = useCallback(
    (deltaY: number) => {
      setIsAutoScrolling(false);
      setScrollY(prev => clamp(prev + deltaY));
    },
    [clamp],
  );

  /** Jump immediately with no animation. */
  const jumpTo = useCallback(
    (y: number) => {
      setScrollY(clamp(y - viewportHeight / 2));
    },
    [clamp, viewportHeight],
  );

  return {
    /** Negate to use as translateY. */
    offsetY: -scrollY,
    targetY: -scrollY,
    isAutoScrolling,
    centerOn,
    scrollBy,
    jumpTo,
    scrollY,
    maxScroll,
  };
}
