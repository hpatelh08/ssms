/**
 * hooks/usePlaytimeControl.ts
 * ═══════════════════════════════════════════════════
 * Headless hook that starts / pauses the shared playtime countdown
 * based on `isActive` and fires `onTimeExpired` when time hits 0.
 *
 * No UI — the sidebar timer handles all display.
 */

import { useEffect, useRef } from 'react';
import { playtimeManager } from '../services/playtimeManager';

interface Options {
  isActive: boolean;
  onTimeExpired?: () => void;
}

export function usePlaytimeControl({ isActive, onTimeExpired }: Options) {
  const expiredRef = useRef(onTimeExpired);
  expiredRef.current = onTimeExpired;

  // Start / pause based on gameplay state
  // Also pause on unmount (child navigates away via Back)
  useEffect(() => {
    if (isActive) {
      playtimeManager.startTimer();
    } else {
      playtimeManager.pauseTimer();
    }
    return () => {
      playtimeManager.pauseTimer();
    };
  }, [isActive]);

  // Listen for expiration
  useEffect(() => {
    const checkExpired = () => {
      const remaining = playtimeManager.getRemainingSeconds();
      if (remaining <= 0) {
        expiredRef.current?.();
      }
    };

    const unsubscribe = playtimeManager.subscribe(checkExpired);

    const handleExpiredEvent = () => expiredRef.current?.();
    window.addEventListener('playtimeExpired', handleExpiredEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('playtimeExpired', handleExpiredEvent);
    };
  }, []);
}
