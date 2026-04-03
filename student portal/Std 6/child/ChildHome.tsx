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
import { syncSharedActivityStats, type SharedActivityStats } from '../services/sharedActivityStats';
import { loadStudentAnnouncements, type PortalAnnouncement } from '../services/announcementFeed';
import './magical.css';

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

/* ── Read parent stats from shared localStorage ──── */

const EMPTY_SHARED_STATS: SharedActivityStats = {
  streak: 0,
  attendance: [],
  badges: [],
  lastActiveDate: undefined,
  weekActivity: [0, 0, 0, 0, 0, 0, 0],
  weeklyActiveDays: 0,
  weeklyStreak: 0,
};

/* ── Gradient Section Divider ─────────────────────── */

const SectionDivider: React.FC = React.memo(() => (
  <div className="flex items-center justify-center" aria-hidden style={{ padding: '4px 0' }}>
    <div
      style={{
        width: 120, height: 2.5, borderRadius: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(25,135,183,0.16) 30%, rgba(95,210,200,0.18) 60%, transparent 100%)',
      }}
    />
  </div>
));
SectionDivider.displayName = 'SectionDivider';

/* ── Main Component ──────────────────────────────── */

export const ChildHome: React.FC<Props> = React.memo(({ onNavigate }) => {
  const [sharedStats, setSharedStats] = useState<SharedActivityStats>(() => {
    try {
      return syncSharedActivityStats();
    } catch {
      return EMPTY_SHARED_STATS;
    }
  });
  const [announcements, setAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');
  const { user } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);

  useEffect(() => {
    const refresh = () => {
      try {
        setSharedStats(syncSharedActivityStats());
      } catch {
        setSharedStats(EMPTY_SHARED_STATS);
      }
    };

    refresh();
    const intervalId = window.setInterval(refresh, 2000);
    window.addEventListener('storage', refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError('');
        const loaded = await loadStudentAnnouncements(user.grade, user.role);
        if (mounted) {
          setAnnouncements(Array.isArray(loaded) ? loaded : []);
        }
      } catch (error) {
        if (mounted) {
          setAnnouncements([]);
          setAnnouncementsError('Announcements will appear here when your class teacher posts them.');
        }
      } finally {
        if (mounted) {
          setAnnouncementsLoading(false);
        }
      }
    };

    refreshAnnouncements();
    const intervalId = window.setInterval(refreshAnnouncements, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [user.grade, user.role]);

  const visibleAnnouncements = useMemo(() => announcements.slice(0, 3), [announcements]);

  return (
    <div className="relative" style={{ minHeight: '100vh' }}>
      {/* Elite depth background — unified gradient + radial bubbles */}
      <div className="elite-home-bg" aria-hidden />

      {/* Content — structured premium layout */}
      <div className="relative z-10 w-full section-container">
        <div className="flex flex-col gap-6">

          {/* 1: Hero — instant (above fold) */}
          <RevealSection delay={0} distance={20} duration={0.45}>
            <EliteHeroPanel
              studentName={firstName}
              streak={sharedStats.weeklyStreak}
              badges={sharedStats.badges}
              weekActivity={sharedStats.weekActivity}
              weeklyActiveDays={sharedStats.weeklyActiveDays}
            />
          </RevealSection>

          <SectionDivider />

          <RevealSection delay={0.04} distance={24}>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_40px_rgba(59,130,246,0.10)] backdrop-blur-sm md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-blue-500">Class updates</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">Teacher Announcements</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Only notices for your class and role appear here.
                  </p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  Std {user.grade}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {announcementsLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                    Loading class announcements...
                  </div>
                )}

                {!announcementsLoading && visibleAnnouncements.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                    {announcementsError || 'No announcements for your class yet.'}
                  </div>
                )}

                {!announcementsLoading && visibleAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-slate-900">{announcement.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{announcement.content}</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-[11px] font-bold capitalize text-white" style={{
                        background:
                          announcement.priority === 'urgent'
                            ? '#dc2626'
                            : announcement.priority === 'high'
                              ? '#f97316'
                              : announcement.priority === 'medium'
                                ? '#2563eb'
                                : '#22c55e',
                      }}>
                        {announcement.priority || 'medium'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                      <span>By {announcement.author || 'Teacher'}</span>
                      <span>{announcement.date ? new Date(announcement.date).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

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
              streak={sharedStats.streak}
              badges={sharedStats.badges}
              weeklyActiveDays={sharedStats.weeklyActiveDays}
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
