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

interface Props {
  onNavigate: (screen: ChildScreen) => void;
}

/* ── Read parent stats from shared localStorage ──── */

interface ParentStats {
  streak?: number;
  badges?: { id: string; name: string; icon: string; description: string }[];
}

type TimetableSlot = {
  num: number | string;
  time: string;
  isBreak?: boolean;
  subject?: string | null;
};

type TimetableData = {
  schedule?: Record<string, TimetableSlot[]>;
  days?: string[];
  slotsWeekday?: TimetableSlot[];
  slotsSaturday?: TimetableSlot[];
  note?: string;
};

const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMETABLE_ROWS = [
  { type: 'lecture', num: 1 },
  { type: 'lecture', num: 2 },
  { type: 'lecture', num: 3 },
  { type: 'break', label: 'Break' },
  { type: 'lecture', num: 4 },
  { type: 'break', label: 'Lunch Break' },
  { type: 'lecture', num: 5 },
  { type: 'lecture', num: 6 },
  { type: 'lecture', num: 7 },
];

function getTimetableBadgeColor(subject?: string | null) {
  const value = String(subject || '').toLowerCase();
  if (value.includes('math')) return { bg: 'rgba(99,102,241,0.12)', fg: '#4F46E5', border: 'rgba(99,102,241,0.22)' };
  if (value.includes('english')) return { bg: 'rgba(139,92,246,0.12)', fg: '#7C3AED', border: 'rgba(139,92,246,0.22)' };
  if (value.includes('hindi')) return { bg: 'rgba(250,204,21,0.16)', fg: '#B45309', border: 'rgba(250,204,21,0.24)' };
  if (value.includes('gujarati')) return { bg: 'rgba(244,114,182,0.12)', fg: '#DB2777', border: 'rgba(244,114,182,0.22)' };
  if (value.includes('science') || value.includes('evs')) return { bg: 'rgba(34,197,94,0.12)', fg: '#059669', border: 'rgba(34,197,94,0.22)' };
  if (value.includes('drawing')) return { bg: 'rgba(251,146,60,0.14)', fg: '#EA580C', border: 'rgba(251,146,60,0.24)' };
  if (value.includes('pt')) return { bg: 'rgba(14,165,233,0.12)', fg: '#0284C7', border: 'rgba(14,165,233,0.22)' };
  if (value.includes('moral')) return { bg: 'rgba(100,116,139,0.12)', fg: '#475569', border: 'rgba(100,116,139,0.22)' };
  if (value.includes('gk')) return { bg: 'rgba(20,184,166,0.12)', fg: '#0F766E', border: 'rgba(20,184,166,0.22)' };
  if (value.includes('social')) return { bg: 'rgba(249,115,22,0.12)', fg: '#EA580C', border: 'rgba(249,115,22,0.22)' };
  return { bg: 'rgba(129,140,248,0.12)', fg: '#4F46E5', border: 'rgba(129,140,248,0.22)' };
}

function getSectionCode(value?: string) {
  const match = String(value || '').toUpperCase().match(/[ABC]/);
  return match ? match[0] : 'A';
}

function getParentStats(): ParentStats | null {
  try {
    const raw = localStorage.getItem('ssms_stats_v2');
    if (!raw) return null;
    return JSON.parse(raw) as ParentStats;
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
        background: 'linear-gradient(90deg, transparent 0%, rgba(90,75,255,0.14) 30%, rgba(255,139,214,0.12) 60%, transparent 100%)',
      }}
    />
  </div>
));
SectionDivider.displayName = 'SectionDivider';

/* ── Main Component ──────────────────────────────── */

export const ChildHome: React.FC<Props> = React.memo(({ onNavigate }) => {
  const parentStats = useMemo(getParentStats, []);
  const { user, studentProfile } = useAuth();
  const firstName = useMemo(() => user.name?.split(' ')[0] || 'Explorer', [user.name]);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState('');
  const grade = Number(studentProfile?.grade || user.grade || 1) || 1;
  const section = getSectionCode(studentProfile?.division);

  useEffect(() => {
    let alive = true;

    const refreshTimetable = async () => {
      try {
        setTimetableLoading(true);
        setTimetableError('');
        const response = await fetch(
          `http://${window.location.hostname}:5000/api/timetable?std=${encodeURIComponent(String(grade))}&section=${encodeURIComponent(section)}`
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || `Failed to load timetable (${response.status})`);
        }

        const loaded = await response.json().catch(() => ({}));
        if (alive) setTimetable(loaded?.data || loaded || null);
      } catch (error) {
        if (alive) {
          setTimetable(null);
          setTimetableError(error instanceof Error ? error.message : 'Unable to load timetable.');
        }
      } finally {
        if (alive) setTimetableLoading(false);
      }
    };

    refreshTimetable();
    const intervalId = window.setInterval(refreshTimetable, 15000);
    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [grade, section]);

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

          <SectionDivider />

          {/* 7: Student Timetable */}
          <RevealSection delay={0.12} distance={36}>
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,255,0.92))',
                border: '1px solid rgba(129,140,248,0.16)',
                borderRadius: 24,
                boxShadow: '0 18px 45px rgba(99,102,241,0.10)',
                padding: 24,
              }}
            >
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#8F94D4', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Student Timetable</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#3B3FAF', margin: '6px 0 0' }}>
                  Subject-wise timetable for Std {grade} Section {section}
                </h2>
              </div>

              {timetableLoading ? (
                <div style={{
                  padding: '16px 18px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.78)',
                  border: '1px solid rgba(129,140,248,0.12)',
                  color: '#8F94D4',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  Loading timetable...
                </div>
              ) : timetable?.schedule ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    minWidth: 820,
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    background: 'rgba(255,255,255,0.84)',
                    border: '1px solid rgba(129,140,248,0.12)',
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '14px 12px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', textAlign: 'left', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Time</th>
                        {(timetable.days || TIMETABLE_DAYS).map((day) => (
                          <th key={day} style={{ padding: '14px 12px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', textAlign: 'center', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIMETABLE_ROWS.map((row) => {
                        if (row.type === 'break') {
                          return (
                            <tr key={row.label}>
                              <td colSpan={(timetable.days || TIMETABLE_DAYS).length + 1} style={{
                                padding: '12px 14px',
                                borderTop: '1px solid rgba(226,232,240,0.95)',
                                textAlign: 'center',
                                color: '#4F46E5',
                                fontSize: 12,
                                fontWeight: 800,
                                background: 'rgba(99,102,241,0.08)',
                                letterSpacing: '0.04em',
                              }}>
                                {row.label} ☕ - 20 min
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={`lecture-${row.num}`}>
                            <td style={{
                              padding: '14px 12px',
                              borderTop: '1px solid rgba(226,232,240,0.95)',
                              color: '#3B3FAF',
                              fontSize: 12,
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(255,255,255,0.92))',
                              whiteSpace: 'nowrap',
                              verticalAlign: 'middle',
                            }}>
                              <div>Lecture {row.num}</div>
                              <div style={{ fontSize: 10, color: '#8F94D4', fontWeight: 700, marginTop: 3 }}>
                                {timetable.slotsWeekday?.find((slot) => slot.num === row.num)?.time || ''}
                              </div>
                            </td>
                            {(timetable.days || TIMETABLE_DAYS).map((day) => {
                              const daySlot = (timetable.schedule?.[day] || []).find((entry) => entry.num === row.num);
                              const color = getTimetableBadgeColor(daySlot?.subject || '');

                              return (
                                <td key={`${day}-${String(row.num)}`} style={{
                                  padding: '12px 10px',
                                  borderTop: '1px solid rgba(226,232,240,0.95)',
                                  borderLeft: '1px solid rgba(226,232,240,0.95)',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  background: 'rgba(255,255,255,0.90)',
                                }}>
                                  {daySlot?.subject ? (
                                    <div style={{
                                      display: 'inline-flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minWidth: 120,
                                      padding: '8px 10px',
                                      borderRadius: 14,
                                      background: color.bg,
                                      border: `1px solid ${color.border}`,
                                    }}>
                                      <span style={{ fontSize: 13, fontWeight: 800, color: color.fg }}>{daySlot.subject}</span>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  padding: '16px 18px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.78)',
                  border: '1px solid rgba(129,140,248,0.12)',
                  color: '#8F94D4',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {timetableError || 'No timetable available yet.'}
                </div>
              )}
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
