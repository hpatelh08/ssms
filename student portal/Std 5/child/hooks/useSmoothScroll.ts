/**
 * child/hooks/useSmoothScroll.ts
 * ══════════════════════════════════════════════════════
 * Custom RAF-based smooth scroll engine.
 *
 * Intercepts native wheel/touch events on a scroll container
 * and applies eased interpolation via requestAnimationFrame.
 * Result: buttery 60fps scrolling with cinematic deceleration.
 *
 * Usage:
 *   const scrollRef = useRef<HTMLDivElement>(null);
 *   const { scrollTo } = useSmoothScroll(scrollRef, { lerp: 0.08 });
 *
 * Performance:
 *   • Single RAF loop — no layout thrashing
 *   • Passive touch listeners where possible
 *   • Auto-cleanup on unmount
 *   • Syncs with programmatic scrollTo calls
 * ══════════════════════════════════════════════════════
 */

import { useEffect, useRef, useCallback, type RefObject } from 'react';

interface SmoothScrollOptions {
  /** Linear interpolation factor (0–1). Lower = smoother. Default 0.085 */
  lerp?: number;
  /** Wheel delta multiplier. Default 1.0 */
  wheelMultiplier?: number;
  /** Touch drag multiplier. Default 1.8 */
  touchMultiplier?: number;
  /** Override native scroll (preventDefault). Default true */
  overrideNative?: boolean;
  /** Snap threshold (px). Default 0.5 */
  threshold?: number;
}

export function useSmoothScroll(
  containerRef: RefObject<HTMLElement | null>,
  options: SmoothScrollOptions = {},
) {
  const {
    lerp = 0.085,
    wheelMultiplier = 1.0,
    touchMultiplier = 1.8,
    overrideNative = true,
    threshold = 0.5,
  } = options;

  const targetY   = useRef(0);
  const currentY  = useRef(0);
  const rafId     = useRef(0);
  const running   = useRef(false);
  const touchLast = useRef(0);

  const getMax = useCallback(() => {
    const el = containerRef.current;
    return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
  }, [containerRef]);

  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(getMax(), v)),
    [getMax],
  );

  /* ── RAF loop ── */
  const tick = useCallback(() => {
    const el = containerRef.current;
    if (!el) { running.current = false; return; }

    const diff = targetY.current - currentY.current;

    if (Math.abs(diff) < threshold) {
      currentY.current = targetY.current;
      el.scrollTop = currentY.current;
      running.current = false;
      return;
    }

    currentY.current += diff * lerp;
    el.scrollTop = currentY.current;
    rafId.current = requestAnimationFrame(tick);
  }, [containerRef, lerp, threshold]);

  const start = useCallback(() => {
    if (!running.current) {
      running.current = true;
      rafId.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  /* ── Mount / cleanup ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    currentY.current = el.scrollTop;
    targetY.current = el.scrollTop;

    const onWheel = (e: WheelEvent) => {
      if (overrideNative) e.preventDefault();
      targetY.current = clamp(targetY.current + e.deltaY * wheelMultiplier);
      start();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchLast.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const delta = (touchLast.current - y) * touchMultiplier;
      touchLast.current = y;
      targetY.current = clamp(targetY.current + delta);
      start();
      if (overrideNative) e.preventDefault();
    };

    /* Detect programmatic scrollTo (large jumps not from RAF) */
    const onScroll = () => {
      const actual = el.scrollTop;
      if (!running.current && Math.abs(actual - currentY.current) > 5) {
        targetY.current = actual;
        currentY.current = actual;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId.current);
      running.current = false;
    };
  }, [containerRef, clamp, wheelMultiplier, touchMultiplier, overrideNative, start]);

  /* ── Public API ── */
  const scrollTo = useCallback((y: number, immediate = false) => {
    const clamped = clamp(y);
    targetY.current = clamped;
    if (immediate) {
      currentY.current = clamped;
      const el = containerRef.current;
      if (el) el.scrollTop = clamped;
    } else {
      start();
    }
  }, [clamp, containerRef, start]);

  const getScrollY = useCallback(() => currentY.current, []);

  return { scrollTo, getScrollY };
}
