/**
 * 🌿 useGardenActivity
 * ────────────────────────────────────────────────────
 * Interactive garden actions gated by real behavioral data.
 *
 * Actions:
 *   waterTree()      → only if attendance today present
 *   sunshineBoost()  → once per calendar day
 *   plantSeed()      → only if homework completion > 0%
 *
 * Abuse prevention:
 *   Each action stores a timestamp in localStorage per day.
 *   Duplicate calls on the same day are rejected.
 *
 * Sound / Mascot / XP integration via child hooks.
 * No direct Audio usage. No heavy libs.
 */

import { useState, useCallback, useMemo } from 'react';
import type { GrowthData } from './useGrowthSystem';

/* ── Storage key ────────────────────────────────── */

const GARDEN_LOG_KEY = 'ssms_garden_log';

interface GardenLog {
  waterDate?: string;     // ISO date string (YYYY-MM-DD)
  sunshineDate?: string;
  plantDate?: string;
}

function readLog(): GardenLog {
  try {
    const raw = localStorage.getItem(GARDEN_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function writeLog(log: GardenLog): void {
  try {
    localStorage.setItem(GARDEN_LOG_KEY, JSON.stringify(log));
  } catch { /* ignore */ }
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/* ── Activity result ────────────────────────────── */

export type ActivityType = 'water' | 'sunshine' | 'plant';
export type ActivityResult = { success: true; type: ActivityType } | { success: false; reason: string };

/* ── Hook ───────────────────────────────────────── */

export interface GardenActivityState {
  wateredToday: boolean;
  sunshineToday: boolean;
  plantedToday: boolean;
  activeEffect: ActivityType | null;   // current animation effect

  waterTree:      () => ActivityResult;
  sunshineBoost:  () => ActivityResult;
  plantSeed:      () => ActivityResult;
  clearEffect:    () => void;
}

export function useGardenActivity(
  growth: GrowthData,
  hooks?: {
    play?:    (type: 'click' | 'correct' | 'celebrate') => void;
    trigger?: (state: string, duration?: number) => void;
    addXP?:   (amount: number) => boolean;
  },
): GardenActivityState {
  const today = todayISO();

  const initialLog = useMemo(() => readLog(), []);

  const [wateredToday, setWateredToday]   = useState(() => initialLog.waterDate === today);
  const [sunshineToday, setSunshineToday] = useState(() => initialLog.sunshineDate === today);
  const [plantedToday, setPlantedToday]   = useState(() => initialLog.plantDate === today);
  const [activeEffect, setActiveEffect]   = useState<ActivityType | null>(null);

  /* ── Water Tree ─────────────────────────────── */
  const waterTree = useCallback((): ActivityResult => {
    if (wateredToday) return { success: false, reason: 'Already watered today' };
    if (!growth.attendedToday) return { success: false, reason: 'Attend class first to water your garden' };

    // Commit
    const log = readLog();
    log.waterDate = today;
    writeLog(log);
    setWateredToday(true);
    setActiveEffect('water');

    // Sound + Mascot + XP
    hooks?.play?.('correct');
    hooks?.trigger?.('happy', 1500);
    hooks?.addXP?.(5);

    return { success: true, type: 'water' };
  }, [wateredToday, growth.attendedToday, today, hooks]);

  /* ── Sunshine Boost ────────────────────────── */
  const sunshineBoost = useCallback((): ActivityResult => {
    if (sunshineToday) return { success: false, reason: 'Sunshine already used today' };

    const log = readLog();
    log.sunshineDate = today;
    writeLog(log);
    setSunshineToday(true);
    setActiveEffect('sunshine');

    hooks?.play?.('correct');
    hooks?.trigger?.('celebrate', 1500);
    hooks?.addXP?.(5);

    return { success: true, type: 'sunshine' };
  }, [sunshineToday, today, hooks]);

  /* ── Plant Seed ────────────────────────────── */
  const plantSeed = useCallback((): ActivityResult => {
    if (plantedToday) return { success: false, reason: 'Already planted today' };
    if (growth.homeworkPercent <= 0) return { success: false, reason: 'Complete homework first to plant a seed' };

    const log = readLog();
    log.plantDate = today;
    writeLog(log);
    setPlantedToday(true);
    setActiveEffect('plant');

    hooks?.play?.('celebrate');
    hooks?.trigger?.('happy', 1500);
    hooks?.addXP?.(5);

    return { success: true, type: 'plant' };
  }, [plantedToday, growth.homeworkPercent, today, hooks]);

  /* ── Clear effect ──────────────────────────── */
  const clearEffect = useCallback(() => setActiveEffect(null), []);

  return {
    wateredToday,
    sunshineToday,
    plantedToday,
    activeEffect,
    waterTree,
    sunshineBoost,
    plantSeed,
    clearEffect,
  };
}
