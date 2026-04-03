/**
 * child/ChildHome.tsx
 * ─────────────────────────────────────────────────────
 * Elite AI-Powered Learning Dashboard
 *
 * Layout Order:
 *  1. Elite Hero Command Panel
 *  2. Smart Action Hub (2×2 tiles)
 *  3. Today's Missions (Daily Quest System)
 *  4. Achievement Carousel
 *  5. Treasure Reward System
 *  6. Learning Connection (Parent Sync)
 *
 * Design: "Apple Education + Duolingo + Khan Academy Kids — Premium Edition"
 * Bright but balanced. Emotionally engaging. Gamified. Zero flat washout.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { ChildScreen } from './ChildLayout';
import { useAuth } from '../auth/AuthContext';
import { EliteHeroPanel } from './home/EliteHeroPanel';
import { SmartActionHub } from './home/SmartActionHub';
import { DailyQuestSystem } from './home/DailyQuestSystem';
import { TreasureReward } from './home/TreasureReward';
import { LearningConnection } from './home/LearningConnection';
import { RevealSection } from './home/RevealSection';
import type { AuditLogEntry } from '../types';
import {
  buildActivitySnapshot,
  calculateCurrentStreak,
  normalizeDateList,
  toLocalDateKey,
} from '../utils/activityMetrics';
import './magical.css';

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

/* ── Read parent stats from shared localStorage ──── */

interface ParentStats {
  streak: number;
  weekActivity: number[];
  badges?: { id: string; name: string; icon: string; description: string }[];
}

function buildWeekFromAttendance(attendance: string[]): number[] {
  const set = new Set(attendance);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const week: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    week.push(set.has(toLocalDateKey(date)) ? 1 : 0);
  }
  return week;
}

function getParentStats(): ParentStats {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    const parsed = raw ? JSON.parse(raw) : {};
    const badges = Array.isArray(parsed.badges) ? parsed.badges : [];
    const fallbackAttendance = normalizeDateList(Array.isArray(parsed.attendance) ? parsed.attendance : []);
    const fallbackStreak = calculateCurrentStreak(fallbackAttendance);

    const auditRaw = localStorage.getItem('ssms_audit_log');
    const parsedAudit = auditRaw ? JSON.parse(auditRaw) : [];
    const auditLog = Array.isArray(parsedAudit) ? parsedAudit as AuditLogEntry[] : [];
    const snapshot = buildActivitySnapshot(auditLog);

    if (snapshot.activeDates.length > 0) {
      return {
        streak: snapshot.currentStreak,
        weekActivity: snapshot.currentWeekActivity,
        badges,
      };
    }

    return {
      streak: fallbackStreak,
      weekActivity: buildWeekFromAttendance(fallbackAttendance),
      badges,
    };
  } catch {
    return { streak: 0, weekActivity: [0, 0, 0, 0, 0, 0, 0], badges: [] };
  }
}

/* ── Gradient Section Divider ─────────────────────── */

const SectionDivider: React.FC = React.memo(() => (
  <div className="space-section-divider flex items-center justify-center" aria-hidden style={{ padding: '6px 0' }}>
    <div
      style={{
        width: 160, height: 2.5, borderRadius: 999,
        background: 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.2) 18%, rgba(167,139,250,0.5) 50%, rgba(34,211,238,0.2) 82%, transparent 100%)',
      }}
    />
  </div>
));
SectionDivider.displayName = 'SectionDivider';

/* ── Main Component ──────────────────────────────── */

export const ChildHome: React.FC<Props> = React.memo(({ onNavigate }) => {
  const [parentStats, setParentStats] = useState<ParentStats>(() => getParentStats());
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);

  useEffect(() => {
    const sync = () => setParentStats(getParentStats());
    const id = window.setInterval(sync, 2000);
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <div className="child-home-space relative" style={{ minHeight: '100vh' }}>
      {/* Elite depth background — unified gradient + radial bubbles */}
      <div className="elite-home-bg" aria-hidden />

      {/* Content — structured premium layout */}
      <div className="relative z-10 w-full section-container">
        <div className="flex flex-col gap-6">

          {/* 1: Hero — instant (above fold) */}
          <RevealSection delay={0} distance={20} duration={0.45}>
            <div className="space-panel-frame space-panel-frame--hero">
              <EliteHeroPanel
                studentName={firstName}
                streak={parentStats.streak}
                weekActivity={parentStats.weekActivity}
                badges={parentStats.badges}
              />
            </div>
          </RevealSection>

          <SectionDivider />

          {/* 2: Smart Action Hub */}
          <RevealSection delay={0.05} distance={28}>
            <div className="space-panel-frame">
              <SmartActionHub onNavigate={onNavigate} />
            </div>
          </RevealSection>

          <SectionDivider />

          {/* 3: Today's Missions */}
          <RevealSection delay={0.08} distance={32}>
            <div className="space-panel-frame">
              <DailyQuestSystem />
            </div>
          </RevealSection>

          <SectionDivider />

          {/* 4: Treasure Reward */}
          <RevealSection delay={0.08} distance={32}>
            <div className="space-panel-frame">
              <TreasureReward />
            </div>
          </RevealSection>

          <SectionDivider />

          {/* 5: Learning Connection */}
          <RevealSection delay={0.1} distance={36}>
            <div className="space-panel-frame">
              <LearningConnection />
            </div>
          </RevealSection>

          {/* Bottom padding for mobile nav */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
});

ChildHome.displayName = 'ChildHome';
