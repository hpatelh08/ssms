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

import React, { useMemo } from 'react';
import type { ChildScreen } from './ChildLayout';
import { useAuth } from '../auth/AuthContext';
import { EliteHeroPanel } from './home/EliteHeroPanel';
import { SmartActionHub } from './home/SmartActionHub';
import { DailyQuestSystem } from './home/DailyQuestSystem';
import { AchievementCarousel } from './home/AchievementCarousel';
import { TreasureReward } from './home/TreasureReward';
import { LearningConnection } from './home/LearningConnection';
import { RevealSection } from './home/RevealSection';
import { ensureMinimumAttendanceDays } from '../utils/attendanceSeed';
import './magical.css';

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

/* ── Read parent stats from shared localStorage ──── */

interface ParentStats {
  streak?: number;
  attendance?: string[];
  badges?: { id: string; name: string; icon: string; description?: string }[];
}

function getParentStats(): ParentStats | null {
  const seeded = ensureMinimumAttendanceDays(20);
  return {
    streak: seeded.streak,
    attendance: seeded.attendance,
    badges: seeded.badges,
  };
}

/* ── Gradient Section Divider ─────────────────────── */

const SectionDivider: React.FC = React.memo(() => (
  <div className="flex items-center justify-center" aria-hidden style={{ padding: '4px 0' }}>
    <div
      style={{
        width: 120, height: 2.5, borderRadius: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(90,75,255,0.14) 30%, rgba(255,139,214,0.12) 60%, transparent 100%)',
      }}
    />
  </div>
));
SectionDivider.displayName = 'SectionDivider';

/* ── Main Component ──────────────────────────────── */

export const ChildHome: React.FC<Props> = React.memo(({ onNavigate }) => {
  const parentStats = getParentStats();
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);

  return (
    <div className="relative" style={{ minHeight: '100vh', borderRadius: 24, overflow: 'hidden' }}>
      {/* Elite depth background — unified gradient + radial bubbles */}
      <div className="elite-home-bg" aria-hidden />

      {/* Content — structured premium layout */}
      <div className="relative z-10 w-full section-container">
        <div className="flex flex-col gap-6">

          {/* 1: Hero — instant (above fold) */}
          <RevealSection delay={0} distance={20} duration={0.45}>
            <EliteHeroPanel
              studentName={firstName}
              streak={parentStats?.streak}
              attendance={parentStats?.attendance}
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
