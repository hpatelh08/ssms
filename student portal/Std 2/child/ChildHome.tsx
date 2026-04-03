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
import { AchievementCarousel } from './home/AchievementCarousel';
import { TreasureReward } from './home/TreasureReward';
import { LearningConnection } from './home/LearningConnection';
import { RevealSection } from './home/RevealSection';
import './magical.css';
import { calculateCurrentActivityStreak, syncAttendanceOnStudentOpen } from '../utils/activityStreak';

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

/* ── Read parent stats from shared localStorage ──── */

interface ParentStats {
  streak?: number;
  badges?: { id: string; name: string; icon: string; description: string }[];
}

function getParentStats(): ParentStats | null {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    const stats = raw ? JSON.parse(raw) as ParentStats & { attendance?: string[] } : null;
    return {
      ...stats,
      streak: calculateCurrentActivityStreak(stats?.attendance ?? [], []),
    };
  } catch {
    return null;
  }
}

/* ── Gradient Section Divider ─────────────────────── */

const SectionDivider: React.FC = React.memo(() => (
  <div className="flex items-center justify-center" aria-hidden style={{ padding: '4px 0' }}>
    <div
      style={{
        width: 120, height: 2.5, borderRadius: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(108,194,210,0.16) 30%, rgba(147,224,212,0.14) 60%, transparent 100%)',
      }}
    />
  </div>
));
SectionDivider.displayName = 'SectionDivider';

/* ── Main Component ──────────────────────────────── */

export const ChildHome: React.FC<Props> = React.memo(({ onNavigate }) => {
  const [parentStats, setParentStats] = useState<ParentStats | null>(() => getParentStats());
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);

  useEffect(() => {
    syncAttendanceOnStudentOpen();
    setParentStats(getParentStats());
  }, []);

  return (
    <div
      className="relative"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        background: 'linear-gradient(135deg, #dff6ff 0%, #c7f9ff 25%, #b2f7ef 50%, #e0fbfc 75%, #f0fdfa 100%)',
      }}
    >
      {/* Elite depth background — unified gradient + radial bubbles */}
      <div className="elite-home-bg" aria-hidden />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.2,
          background: `
            radial-gradient(circle at 12% 18%, rgba(255,255,255,0.82) 0 1.3%, transparent 1.6%),
            radial-gradient(circle at 84% 14%, rgba(255,255,255,0.72) 0 1%, transparent 1.3%),
            radial-gradient(circle at 78% 72%, rgba(255,255,255,0.6) 0 0.8%, transparent 1.1%),
            radial-gradient(ellipse 160% 28% at 50% 8%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 28%, transparent 60%),
            radial-gradient(ellipse 140% 24% at 50% 34%, rgba(154,226,238,0.34) 0%, rgba(154,226,238,0.12) 30%, transparent 62%),
            radial-gradient(ellipse 150% 24% at 50% 66%, rgba(119,214,222,0.26) 0%, rgba(119,214,222,0.1) 30%, transparent 60%)
          `,
        }}
      />

      {/* Content — structured premium layout */}
      <div className="relative z-10 w-full section-container">
        <div className="flex flex-col gap-6">

          {/* 1: Hero — instant (above fold) */}
          <RevealSection delay={0} distance={20} duration={0.45}>
            <EliteHeroPanel
              studentName={firstName}
              streak={parentStats?.streak}
              badges={parentStats?.badges}
            />
          </RevealSection>

          <SectionDivider />

          {/* 2: Smart Action Hub */}
          <RevealSection delay={0.05} distance={28}>
            <SmartActionHub onNavigate={onNavigate} />
          </RevealSection>

          <SectionDivider />

          {/* 3: Today's Missions */}
          <RevealSection delay={0.08} distance={32}>
            <DailyQuestSystem />
          </RevealSection>

          <SectionDivider />

          {/* 4: Achievement Cards */}
          <RevealSection delay={0.06} distance={28}>
            <AchievementCarousel
              streak={parentStats?.streak}
              badges={parentStats?.badges}
            />
          </RevealSection>

          <SectionDivider />

          {/* 5: Treasure Reward */}
          <RevealSection delay={0.08} distance={32}>
            <TreasureReward />
          </RevealSection>

          <SectionDivider />

          {/* 6: Learning Connection */}
          <RevealSection delay={0.1} distance={36}>
            <LearningConnection />
          </RevealSection>

          {/* Bottom padding for mobile nav */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
});

ChildHome.displayName = 'ChildHome';
