/**
 * parent/pages/VideoListingPage.tsx
 * ─────────────────────────────────────────────────────
 * Dedicated video listing page — reached from AI Buddy Hub
 * via "Watch Learning Videos" card.
 *
 * Layout:
 *  ① Back to Hub button
 *  ② Subject Toggle (English | Maths)
 *  ③ Recently Watched row
 *  ④ Learning Units video grid (thumbnail + title + Watch button)
 *  ⑤ Rhymes section
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { englishUnits } from '../../data/englishUnits';
import { mathsChapters } from '../../data/mathsChapters';
import { scienceUnits } from '../../data/scienceUnits';
import { englishRhymes, type RhymeEntry } from '../../data/englishRhymes';
import { mathsRhymes } from '../../data/mathsRhymes';
import { scienceRhymes } from '../../data/scienceRhymes';
import { hindiRhymes } from '../../data/hindiRhymes';
import { gujaratiRhymes } from '../../data/gujaratiRhymes';
import { hindiChapters } from '../../data/hindiChapters';
import { gujaratiChapters } from '../../data/gujaratiChapters';
import { VIDEO_DATA, type VideoEntry, type VideoSubject } from '../../data/videoConfig';
import type { Subject } from '../../data/ncertChapters';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };
const getSubjectLabel = (subject: Subject): string => (subject === 'Science' ? 'EVS' : subject);

/* ── Glass style ──────────────────────────────────── */
const sheenGlass = (accent: string): React.CSSProperties => ({
  background: `linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.08) 100%), radial-gradient(circle at top right, ${accent}2e, transparent 36%), radial-gradient(circle at bottom left, ${accent}1c, transparent 30%), var(--gradient-topbar)`,
  backdropFilter: 'blur(18px)',
  border: '1px solid rgba(148,163,184,0.2)',
  boxShadow: '0 18px 44px rgba(2,6,23,0.34), inset 0 1px 0 rgba(255,255,255,0.05)',
});
const heroGlass = sheenGlass('#8b5cf6');
const pillBarGlass: React.CSSProperties = {
  background: 'linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 42%, rgba(255,255,255,0.06) 100%), var(--gradient-topbar)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(148,163,184,0.18)',
  boxShadow: '0 12px 28px rgba(2,6,23,0.24)',
};
const panelInsetClass = 'mx-3 md:mx-4 lg:mx-5';

/* ── Subject theme ────────────────────────────────── */
const SUBJECT_THEME: Record<Subject, {
  gradient: string; toggleBg: string; sectionGradient: string;
  icon: string; label: string; pageTint: string; rhymeLabel: string;
  accentColor: string; rhymeAccent: string;
}> = {
  English: {
    gradient: 'from-orange-500 to-amber-500',
    toggleBg: 'bg-purple-500',
    sectionGradient: 'from-orange-100 to-amber-100',
    icon: '📘',
    label: 'English Learning Units',
    pageTint: 'rgba(237,233,254,0.12)',
    rhymeLabel: 'English Rhymes',
    accentColor: '#f59e0b',
    rhymeAccent: '#ec4899',
  },
  Maths: {
    gradient: 'from-violet-500 to-purple-500',
    toggleBg: 'bg-blue-500',
    sectionGradient: 'from-violet-100 to-purple-100',
    icon: '📗',
    label: 'Maths Learning Chapters',
    pageTint: 'rgba(219,234,254,0.12)',
    rhymeLabel: 'Maths Rhymes',
    accentColor: '#8b5cf6',
    rhymeAccent: '#a855f7',
  },
  Science: {
    gradient: 'from-green-500 to-emerald-500',
    toggleBg: 'bg-green-500',
    sectionGradient: 'from-green-100 to-emerald-100',
    icon: '🔬',
    label: 'EVS Chapters',
    pageTint: 'rgba(209,250,229,0.12)',
    rhymeLabel: 'EVS Songs',
    accentColor: '#22c55e',
    rhymeAccent: '#14b8a6',
  },
  Hindi: {
    gradient: 'from-emerald-500 to-green-500',
    toggleBg: 'bg-emerald-500',
    sectionGradient: 'from-emerald-100 to-green-100',
    icon: '🌿',
    label: 'Hindi (Veena) Chapters',
    pageTint: 'rgba(209,250,229,0.12)',
    rhymeLabel: 'Hindi Rhymes',
    accentColor: '#16a34a',
    rhymeAccent: '#84cc16',
  },
  Gujarati: {
    gradient: 'from-amber-500 to-orange-500',
    toggleBg: 'bg-amber-500',
    sectionGradient: 'from-amber-100 to-orange-100',
    icon: '📙',
    label: 'Gujarati (Mayur) Chapters',
    pageTint: 'rgba(254,243,199,0.12)',
    rhymeLabel: 'Gujarati Rhymes',
    accentColor: '#f97316',
    rhymeAccent: '#f59e0b',
  },
};

/* ── Syllabus item type ───────────────────────────── */
interface SyllabusItem {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

/* ── Local storage helpers ────────────────────────── */
const WATCH_KEY = 'ssms_video_watched';
const RECENT_KEY = 'ssms_video_recent';

function getWatchedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function getRecentlyWatched(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/* ── Subject ID sets (for filtering recently watched) ── */
const ENGLISH_IDS = new Set([
  ...englishUnits.map(u => u.id),
  ...englishRhymes.map(r => r.id),
]);

const MATHS_IDS = new Set([
  ...mathsChapters.map(c => c.id),
  ...mathsRhymes.map(r => r.id),
]);

const SCIENCE_IDS = new Set([
  ...scienceUnits.map(u => u.id),
  ...scienceRhymes.map(r => r.id),
]);

const HINDI_IDS = new Set([
  ...hindiChapters.map(c => c.id),
  ...hindiRhymes.map(r => r.id),
]);

const GUJARATI_IDS = new Set([
  ...gujaratiChapters.map(c => c.id),
  ...gujaratiRhymes.map(r => r.id),
]);

/* ═══════════════════════════════════════════════════
   SUBJECT TOGGLE
   ═══════════════════════════════════════════════════ */

const SubjectToggle: React.FC<{
  selected: Subject;
  onChange: (s: Subject) => void;
}> = ({ selected, onChange }) => (
  <motion.div
    className="flex justify-center"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.06 }}
  >
    <div
      className="inline-flex rounded-full p-1 gap-1 backdrop-blur-md shadow-md"
      style={pillBarGlass}
    >
      {(['English', 'Maths', 'Science', 'Hindi', 'Gujarati'] as Subject[]).map(s => {
        const isActive = selected === s;
        const bg = SUBJECT_THEME[s].toggleBg;
        const icon = s === 'English' ? '📖' : s === 'Maths' ? '🔢' : s === 'Science' ? '🔬' : s === 'Hindi' ? '🌿' : '📙';
        const label = getSubjectLabel(s);
        return (
          <motion.button
            key={s}
            onClick={() => onChange(s)}
            className={`relative px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer
              ${isActive ? `${bg} text-white shadow-lg` : 'text-slate-300 hover:text-white'}`}
            whileHover={!isActive ? { scale: 1.04 } : {}}
            whileTap={{ scale: 0.97 }}
            layout
          >
            {isActive && (
              <motion.div
                layoutId="videos-subject-toggle-bg"
                className={`absolute inset-0 rounded-full ${bg} shadow-lg`}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {icon} {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   RECENTLY WATCHED ROW
   ═══════════════════════════════════════════════════ */

const RecentlyWatchedRow: React.FC<{
  subjectItems: SyllabusItem[];
  subjectIdSet: Set<string>;
  onWatch: (item: SyllabusItem) => void;
  accentColor: string;
}> = ({ subjectItems, subjectIdSet, onWatch, accentColor }) => {
  const recentIds = useMemo(() => getRecentlyWatched(), []);
  const recentItems = useMemo(
    () => recentIds
      .filter(id => subjectIdSet.has(id))
      .map(id => subjectItems.find(v => v.id === id))
      .filter(Boolean) as SyllabusItem[],
    [recentIds, subjectItems, subjectIdSet],
  );

  if (recentItems.length === 0) return null;

  return (
    <motion.div
      className={panelInsetClass}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.08 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🕐</span>
        <h2 className="text-sm font-black text-slate-100">Recently Watched</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {recentItems.map(v => (
          <motion.button
            key={v.id}
            onClick={() => onWatch(v)}
            className="shrink-0 rounded-2xl overflow-hidden cursor-pointer group text-left"
            style={{ width: 190, ...sheenGlass(accentColor) }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={`https://img.youtube.com/vi/${v.embedId}/mqdefault.jpg`}
                alt={v.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
            <p className="text-[11px] font-bold text-slate-100 p-2.5 truncate">{v.title}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   VIDEO CARD (thumbnail + title + Watch button)
   ═══════════════════════════════════════════════════ */

const VideoCard: React.FC<{
  item: SyllabusItem;
  isWatched: boolean;
  gradient: string;
  accentColor: string;
  delay: number;
  onWatch: () => void;
}> = ({ item, isWatched, gradient, accentColor, delay, onWatch }) => (
  <motion.div
    className="rounded-2xl overflow-hidden group"
    style={sheenGlass(accentColor)}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay }}
    whileHover={{ scale: 1.03, y: -3 }}
  >
    <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={onWatch}>
      <img
        src={`https://img.youtube.com/vi/${item.embedId}/mqdefault.jpg`}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#6366f1"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      {isWatched && (
        <div className="absolute top-2 right-2 text-[9px] font-bold text-white bg-green-500/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
          ✓ Watched
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="text-[13px] font-black text-slate-100 mb-3 leading-snug">{item.title}</h3>
      <motion.button
        onClick={onWatch}
        className={`w-full py-2.5 rounded-xl text-[12px] font-bold text-white text-center bg-gradient-to-r ${gradient} shadow-md cursor-pointer`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        ▶️ Watch Video
      </motion.button>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   RHYME CARD
   ═══════════════════════════════════════════════════ */

const RhymeCard: React.FC<{
  rhyme: RhymeEntry;
  isWatched: boolean;
  accentColor: string;
  onWatch: () => void;
}> = ({ rhyme, isWatched, accentColor, onWatch }) => (
  <motion.div
    className="rounded-2xl overflow-hidden group"
    style={sheenGlass(accentColor)}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={spring}
    whileHover={{ scale: 1.03, y: -3 }}
  >
    <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={onWatch}>
      <img
        src={`https://img.youtube.com/vi/${rhyme.embedId}/mqdefault.jpg`}
        alt={rhyme.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ec4899"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      {isWatched && (
        <div className="absolute top-2 right-2 text-[9px] font-bold text-white bg-green-500/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
          ✓ Watched
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="text-[13px] font-black text-slate-100 mb-1">{rhyme.title}</h3>
      <motion.button
        onClick={onWatch}
        className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white bg-gradient-to-r from-pink-500 to-rose-400 shadow-md cursor-pointer mt-3"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        🎵 Play Rhyme
      </motion.button>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   MAIN: VideoListingPage
   ═══════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
  onPlayVideo: (video: VideoEntry, subject: VideoSubject) => void;
}

export const VideoListingPage: React.FC<Props> = ({ onBack, onPlayVideo }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('English');
  const [watchedSet, setWatchedSet] = useState<Set<string>>(getWatchedSet);

  useEffect(() => {
    const id = setInterval(() => setWatchedSet(getWatchedSet()), 5000);
    return () => clearInterval(id);
  }, []);

  const theme = SUBJECT_THEME[selectedSubject];

  const subjectUnits: SyllabusItem[] = useMemo(
    () => selectedSubject === 'English' ? englishUnits
       : selectedSubject === 'Maths' ? mathsChapters
       : selectedSubject === 'Science' ? scienceUnits
       : selectedSubject === 'Hindi' ? hindiChapters
       : gujaratiChapters,
    [selectedSubject],
  );

  const subjectRhymes: RhymeEntry[] = useMemo(
    () => selectedSubject === 'English' ? englishRhymes
       : selectedSubject === 'Maths' ? mathsRhymes
       : selectedSubject === 'Science' ? scienceRhymes
       : selectedSubject === 'Hindi' ? hindiRhymes
       : gujaratiRhymes,
    [selectedSubject],
  );

  const subjectAllItems: SyllabusItem[] = useMemo(() => {
    if (selectedSubject === 'English') {
      return [
        ...englishUnits,
        ...englishRhymes.map(r => ({ id: r.id, title: r.title, url: r.url, embedId: r.embedId })),
      ];
    }
    if (selectedSubject === 'Maths') {
      return [
        ...mathsChapters,
        ...mathsRhymes.map(r => ({ id: r.id, title: r.title, url: r.url, embedId: r.embedId })),
      ];
    }
    if (selectedSubject === 'Science') {
      return [
        ...scienceUnits,
        ...scienceRhymes.map(r => ({ id: r.id, title: r.title, url: r.url, embedId: r.embedId })),
      ];
    }
    if (selectedSubject === 'Hindi') {
      return [
        ...hindiChapters.map(c => ({ id: c.id, title: c.title, url: c.url, embedId: c.embedId })),
        ...hindiRhymes.map(r => ({ id: r.id, title: r.title, url: r.url, embedId: r.embedId })),
      ];
    }
    return [
      ...gujaratiChapters.map(c => ({ id: c.id, title: c.title, url: c.url, embedId: c.embedId })),
      ...gujaratiRhymes.map(r => ({ id: r.id, title: r.title, url: r.url, embedId: r.embedId })),
    ];
  }, [selectedSubject]);

  const subjectIdSet = useMemo(
    () => selectedSubject === 'English' ? ENGLISH_IDS
       : selectedSubject === 'Maths' ? MATHS_IDS
       : selectedSubject === 'Science' ? SCIENCE_IDS
       : selectedSubject === 'Hindi' ? HINDI_IDS
       : GUJARATI_IDS,
    [selectedSubject],
  );

  /* ── Navigate to player ───────────────────────── */
  const handleWatch = useCallback((item: SyllabusItem) => {
    const allVideos = [...VIDEO_DATA.English, ...VIDEO_DATA.Maths, ...VIDEO_DATA.Science];
    const match = allVideos.find(v => v.embedId === item.embedId || v.id === item.id);
    if (match) {
      onPlayVideo(match, selectedSubject as VideoSubject);
    } else {
      onPlayVideo(
        { id: item.id, title: item.title, url: item.url, embedId: item.embedId, context: item.title },
        selectedSubject as VideoSubject,
      );
    }
  }, [onPlayVideo, selectedSubject]);

  const handleWatchRhyme = useCallback((r: RhymeEntry) => {
    const allVideos = [...VIDEO_DATA.English, ...VIDEO_DATA.Maths, ...VIDEO_DATA.Science];
    const match = allVideos.find(v => v.embedId === r.embedId || v.id === r.id);
    if (match) {
      onPlayVideo(match, selectedSubject as VideoSubject);
    } else {
      onPlayVideo(
        { id: r.id, title: r.title, url: r.url, embedId: r.embedId, context: r.title },
        selectedSubject as VideoSubject,
      );
    }
  }, [onPlayVideo, selectedSubject]);

  return (
    <div className="w-full px-2 lg:px-4 py-8 space-y-8 relative">
      {/* Subject background tint */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        animate={{ background: theme.pageTint }}
        transition={{ duration: 0.4 }}
      />

      {/* Back to Hub */}
      <motion.button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer"
        style={{
          background: 'rgba(15,23,42,0.72)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 14,
          padding: '8px 18px',
          color: '#e2e8f0',
        }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        AI Buddy Hub
      </motion.button>

      {/* Header */}
      <motion.div
        className={`${panelInsetClass} rounded-3xl p-8 relative overflow-hidden text-center`}
        style={heroGlass}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.04 }}
      >
        <motion.span
          className="inline-block text-4xl mb-2"
          animate={{ y: [0, -5, 0], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎬
        </motion.span>
        <h1 className="text-xl font-black text-slate-50">Learning Videos</h1>
        <p className="text-xs text-slate-300 mt-1 font-medium">
          Watch fun animated lessons for every chapter! 🌟
        </p>
      </motion.div>

      {/* Subject Toggle */}
      <SubjectToggle selected={selectedSubject} onChange={setSelectedSubject} />

      {/* Recently Watched */}
      <RecentlyWatchedRow
        subjectItems={subjectAllItems}
        subjectIdSet={subjectIdSet}
        onWatch={handleWatch}
        accentColor={theme.accentColor}
      />

      {/* Units/Chapters Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          className={panelInsetClass}
          key={`video-units-${selectedSubject}`}
          initial={{ opacity: 0, x: selectedSubject === 'English' ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: selectedSubject === 'English' ? 24 : -24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Section Header */}
          <motion.div
            className="flex items-center gap-3 mb-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={spring}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-gradient-to-br ${theme.sectionGradient} shadow-sm`}>
              {theme.icon}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100">{theme.label}</h2>
              <p className="text-[10px] text-slate-300 font-bold">{subjectUnits.length} lessons</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {subjectUnits.map((item, i) => (
              <VideoCard
                key={item.id}
                item={item}
                isWatched={watchedSet.has(item.id)}
                gradient={theme.gradient}
                accentColor={theme.accentColor}
                delay={0.12 + i * 0.03}
                onWatch={() => handleWatch(item)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Rhymes Section */}
      {subjectRhymes.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            className={panelInsetClass}
            key={`video-rhymes-${selectedSubject}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <motion.div
              className="rounded-3xl p-6 relative overflow-hidden mb-5"
              style={{
                ...sheenGlass(theme.rhymeAccent),
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              <div className="text-center">
                <motion.span
                  className="inline-block text-3xl mb-1"
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🎶
                </motion.span>
                <h2 className="text-lg font-black text-slate-50">{theme.rhymeLabel}</h2>
                <p className="text-[10px] text-slate-300 mt-1 font-medium">Sing along, have fun! 🎵</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {subjectRhymes.map(r => (
                <RhymeCard
                  key={r.id}
                  rhyme={r}
                  isWatched={watchedSet.has(r.id)}
                  accentColor={theme.rhymeAccent}
                  onWatch={() => handleWatchRhyme(r)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default VideoListingPage;
