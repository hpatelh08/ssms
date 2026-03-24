/**
 * parent/components/attendance/AttendanceMilestones.tsx
 * ─────────────────────────────────────────────────────
 * Invisible bridge component that fires celebrations:
 *
 *  • Confetti burst when streak reaches 7
 *  • Confetti when perfect week achieved
 *  • Confetti when monthly attendance > 90%
 *  • XP bonus (100) for perfect week
 *
 * Uses refs to prevent duplicate triggering per cycle.
 * Must be inside both AttendanceProvider and XPProvider.
 */

import React, { useEffect, useRef } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { launchConfetti, launchBigConfetti } from '../../../utils/launchConfetti';

/* ── localStorage key for XP bonus deduplication ── */
const XP_BONUS_KEY = 'ssms_perfect_week_xp_awarded';

function wasBonusAwarded(): boolean {
  try {
    const raw = localStorage.getItem(XP_BONUS_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    // Check if awarded within the last 7 days
    const awardedAt = new Date(d.timestamp);
    const diff = Date.now() - awardedAt.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

function markBonusAwarded() {
  try {
    localStorage.setItem(XP_BONUS_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
    }));
  } catch { /* ignore */ }
}

/**
 * Renders nothing — purely side-effect driven.
 * Place inside AttendancePage's provider tree.
 */
export const AttendanceMilestones: React.FC = () => {
  const { streak, isPerfectWeek, rate } = useAttendance();

  const streak7Fired = useRef(false);
  const perfectWeekFired = useRef(false);
  const monthly90Fired = useRef(false);

  // ── Streak milestone (7+) ──
  useEffect(() => {
    if (streak >= 7 && !streak7Fired.current) {
      streak7Fired.current = true;
      launchBigConfetti();
    }
    if (streak < 7) streak7Fired.current = false;
  }, [streak]);

  // ── Perfect week celebration + XP bonus ──
  useEffect(() => {
    if (isPerfectWeek && !perfectWeekFired.current) {
      perfectWeekFired.current = true;
      launchConfetti();

      // Award XP bonus (only once per cycle)
      if (!wasBonusAwarded()) {
        try {
          // Read current XP state and add bonus
          const raw = localStorage.getItem('ssms_xp_state');
          if (raw) {
            const state = JSON.parse(raw);
            state.xp = (state.xp || 0) + 100;
            localStorage.setItem('ssms_xp_state', JSON.stringify(state));
          }
          markBonusAwarded();
        } catch { /* ignore */ }
      }
    }
    if (!isPerfectWeek) perfectWeekFired.current = false;
  }, [isPerfectWeek]);

  // ── Monthly > 90% celebration ──
  useEffect(() => {
    if (rate > 90 && !monthly90Fired.current) {
      monthly90Fired.current = true;
      launchConfetti();
    }
    if (rate <= 90) monthly90Fired.current = false;
  }, [rate]);

  return null;
};
