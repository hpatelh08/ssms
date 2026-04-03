/**
 * parent/pages/NCERTAssistantPage.tsx
 * ─────────────────────────────────────────────────────
 * AI Buddy Learning Zone — Strict Subject Isolation
 *
 * Structure per subject:
 *  1. AiHero — pastel gradient banner
 *  2. SubjectToggle — [ English ] [ Maths ] pill switch
 *  3. Recently Watched row (filtered by subject)
 *  4. Subject Section — English Units + English Rhymes  OR  Maths Chapters + Maths Rhymes
 *  5. Ask AI Buddy Chat — LOCKED to selectedSubject + selectedChapter
 *
 * ✅ English tab → English units + English rhymes + English AI only
 * ✅ Maths tab  → Maths chapters + Maths rhymes + Maths AI only
 * ✅ No cross-subject mixing. Ever.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHAPTER_DATA, type Subject, type ChapterInfo } from '../../data/ncertChapters';
import { englishUnits, type UnitEntry } from '../../data/englishUnits';
import { mathsChapters, type MathsChapterEntry } from '../../data/mathsChapters';
import { scienceUnits } from '../../data/scienceUnits';
import { englishRhymes, type RhymeEntry } from '../../data/englishRhymes';
import { mathsRhymes } from '../../data/mathsRhymes';
import { scienceRhymes } from '../../data/scienceRhymes';
import { hindiRhymes } from '../../data/hindiRhymes';
import { gujaratiRhymes } from '../../data/gujaratiRhymes';
import { hindiChapters } from '../../data/hindiChapters';
import { gujaratiChapters } from '../../data/gujaratiChapters';
import { aiService } from '../../services/geminiService';
import { VIDEO_DATA, type VideoEntry, type VideoSubject } from '../../data/videoConfig';
import SafeYouTubeEmbed from '../../components/SafeYouTubeEmbed';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };
const getSubjectLabel = (subject: Subject): string => (subject === 'Science' ? 'EVS' : subject);

/* Subject theme config */
const SUBJECT_THEME: Record<Subject, {
  toggleBg: string; gradient: string; sectionGradient: string;
  pageTint: string; icon: string; label: string; rhymeLabel: string; rhymeIcon: string;
  accentColor: string; rhymeAccent: string;
}> = {
  English: {
    toggleBg: 'bg-purple-500',
    gradient: 'from-orange-500 to-amber-500',
    sectionGradient: 'from-orange-100 to-amber-100',
    pageTint: 'rgba(237,233,254,0.12)',
    icon: '📘',
    label: 'English Learning Units',
    rhymeLabel: 'English Rhymes',
    rhymeIcon: '📖',
    accentColor: '#f59e0b',
    rhymeAccent: '#ec4899',
  },
  Maths: {
    toggleBg: 'bg-blue-500',
    gradient: 'from-violet-500 to-purple-500',
    sectionGradient: 'from-violet-100 to-purple-100',
    pageTint: 'rgba(219,234,254,0.12)',
    icon: '📗',
    label: 'Maths Learning Chapters',
    rhymeLabel: 'Maths Rhymes',
    rhymeIcon: '🔢',
    accentColor: '#8b5cf6',
    rhymeAccent: '#a855f7',
  },
  Science: {
    toggleBg: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-500',
    sectionGradient: 'from-green-100 to-emerald-100',
    pageTint: 'rgba(209,250,229,0.12)',
    icon: '🔬',
    label: 'EVS Chapters',
    rhymeLabel: 'EVS Songs',
    rhymeIcon: '🌍',
    accentColor: '#22c55e',
    rhymeAccent: '#14b8a6',
  },
  Hindi: {
    toggleBg: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-green-500',
    sectionGradient: 'from-emerald-100 to-green-100',
    pageTint: 'rgba(209,250,229,0.12)',
    icon: '🌿',
    label: 'Hindi (Veena) Chapters',
    rhymeLabel: 'Hindi Rhymes',
    rhymeIcon: '🇮🇳',
    accentColor: '#16a34a',
    rhymeAccent: '#84cc16',
  },
  Gujarati: {
    toggleBg: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    sectionGradient: 'from-amber-100 to-orange-100',
    pageTint: 'rgba(254,243,199,0.12)',
    icon: '📙',
    label: 'Gujarati (Mayur) Chapters',
    rhymeLabel: 'Gujarati Rhymes',
    rhymeIcon: '🇮🇳',
    accentColor: '#f97316',
    rhymeAccent: '#f59e0b',
  },
};

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

/** Unified type for syllabus cards (unit or chapter) */
interface SyllabusItem {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

/* ═══════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
   ═══════════════════════════════════════════════════ */

const WATCH_KEY = 'ssms_video_watched';

function getWatchedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markWatched(videoId: string) {
  try {
    const set = getWatchedSet();
    set.add(videoId);
    localStorage.setItem(WATCH_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

const RECENT_KEY = 'ssms_video_recent';

function getRecentlyWatched(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addToRecent(videoId: string) {
  try {
    let recent = getRecentlyWatched().filter(id => id !== videoId);
    recent.unshift(videoId);
    if (recent.length > 8) recent = recent.slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch { /* ignore */ }
}

function awardVideoXP(videoId: string) {
  const key = 'ssms_video_xp_awarded';
  try {
    const raw = localStorage.getItem(key);
    const awarded: string[] = raw ? JSON.parse(raw) : [];
    if (awarded.includes(videoId)) return;
    awarded.push(videoId);
    localStorage.setItem(key, JSON.stringify(awarded));
    const xpRaw = localStorage.getItem('ssms_xp_state');
    if (xpRaw) {
      const state = JSON.parse(xpRaw);
      state.xp = (state.xp || 0) + 20;
      localStorage.setItem('ssms_xp_state', JSON.stringify(state));
    }
  } catch { /* ignore */ }
}

/* ═══════════════════════════════════════════════════
   QUICK ACTIONS
   ═══════════════════════════════════════════════════ */

const QUICK_ACTIONS = [
  { label: 'Explain simply', icon: '💡', prompt: 'Explain this chapter simply so a 6-year-old can understand.' },
  { label: 'Give example', icon: '🎯', prompt: 'Give a fun, relatable real-life example from this chapter for my child.' },
  { label: 'Give worksheet', icon: '📝', prompt: 'Generate a 5-question worksheet from this chapter suitable for a Class 3 student.' },
  { label: 'Parent tip', icon: '👨‍👩‍👧', prompt: 'Give me a practical parent teaching tip for this chapter that I can use at home.' },
];

/* ═══════════════════════════════════════════════════
   GLASS CARD STYLE
   ═══════════════════════════════════════════════════ */

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
const chipGlass: React.CSSProperties = {
  background: 'linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 42%, rgba(255,255,255,0.06) 100%), var(--gradient-topbar)',
  backdropFilter: 'blur(14px)',
  border: '1px solid rgba(148,163,184,0.18)',
};
const panelInsetClass = 'mx-3 md:mx-4 lg:mx-5';

/* ═══════════════════════════════════════════════════
   SUBJECT-KEYED ID SETS (for filtering recently watched)
   ═══════════════════════════════════════════════════ */

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
   1️⃣  HERO
   ═══════════════════════════════════════════════════ */

const AiHero: React.FC = () => (
  <motion.div
    className={`${panelInsetClass} rounded-3xl p-10 relative overflow-hidden`}
    style={heroGlass}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.04 }}
  >
    <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-300 rounded-full opacity-[0.06] blur-3xl" />
    <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-pink-300 rounded-full opacity-[0.06] blur-3xl" />

    <div className="relative z-10 text-center">
      <motion.span
        className="inline-block text-5xl mb-3"
        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🤖
      </motion.span>
      <h1
        className="text-2xl font-black tracking-tight"
        style={{ color: '#f8fafc', textShadow: '0 10px 30px rgba(15,23,42,0.4)' }}
      >
        AI Buddy Learning Zone
      </h1>
      <p className="text-sm mt-2 font-medium" style={{ color: '#cbd5e1' }}>
        Watch · Learn · Ask · Grow ✨
      </p>
    </div>
  </motion.div>
);

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
        const theme = SUBJECT_THEME[s];
        const icon = s === 'English' ? '📖' : s === 'Maths' ? '🔢' : s === 'Science' ? '🔬' : s === 'Hindi' ? '🌿' : '📙';
        const label = getSubjectLabel(s);
        return (
          <motion.button
            key={s}
            onClick={() => onChange(s)}
            className={`relative px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer
              ${isActive ? `${theme.toggleBg} text-white shadow-lg` : 'text-slate-300 hover:text-white'}`}
            whileHover={!isActive ? { scale: 1.04 } : {}}
            whileTap={{ scale: 0.97 }}
            layout
          >
            {isActive && (
              <motion.div
                layoutId="subject-toggle-bg"
                className={`absolute inset-0 rounded-full ${theme.toggleBg} shadow-lg`}
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
   RECENTLY WATCHED ROW (filtered by subject)
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
      transition={{ ...spring, delay: 0.06 }}
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
            style={{
              width: 190,
              ...sheenGlass(accentColor),
            }}
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
   VIDEO PLAYER MODAL
   ═══════════════════════════════════════════════════ */

const VideoPlayerSection: React.FC<{
  item: SyllabusItem;
  onClose: () => void;
  onAskAI: () => void;
  showAskAI?: boolean;
  accentColor: string;
}> = ({ item, onClose, onAskAI, showAskAI = true, accentColor }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      markWatched(item.id);
      addToRecent(item.id);
      awardVideoXP(item.id);
    }, 30_000);
    addToRecent(item.id);
    // Scroll video player into view when it opens
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [item.id]);

  return (
    <motion.div
      ref={playerRef}
      className={`${panelInsetClass} rounded-3xl overflow-hidden relative video-container`}
      style={{
        ...sheenGlass(accentColor),
        boxShadow: '0 20px 52px rgba(2,6,23,0.38)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={spring}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <div>
            <h3 className="text-[14px] font-black text-slate-100">{item.title}</h3>
            <p className="text-[11px] text-slate-300 font-medium">Now Playing</p>
          </div>
        </div>
        <div className="flex gap-2">
          {showAskAI && (
            <motion.button
              onClick={onAskAI}
              className="text-[11px] font-bold px-4 py-2 rounded-full cursor-pointer"
              style={{
                background: 'rgba(99,102,241,0.18)',
                border: '1px solid rgba(129,140,248,0.26)',
                color: '#e0e7ff',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🤖 Ask AI About This
            </motion.button>
          )}
          <motion.button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm cursor-pointer"
            style={{
              background: 'rgba(15,23,42,0.76)',
              border: '1px solid rgba(148,163,184,0.18)',
              color: '#cbd5e1',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ✕
          </motion.button>
        </div>
      </div>
      <SafeYouTubeEmbed embedId={item.embedId} title={item.title} />
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   SYLLABUS CARD (English Unit / Maths Chapter)
   ═══════════════════════════════════════════════════ */

const SyllabusCard: React.FC<{
  item: SyllabusItem;
  isWatched: boolean;
  isPlaying: boolean;
  gradient: string;
  accentColor: string;
  onWatch: () => void;
  onAskAI: () => void;
  recommended?: boolean;
}> = ({ item, isWatched, isPlaying, gradient, accentColor, onWatch, onAskAI, recommended }) => {
  const [preloaded, setPreloaded] = useState(false);

  return (
  <motion.div
    className={`rounded-3xl relative overflow-hidden group ${isPlaying ? 'ring-2 ring-indigo-400/40' : ''}`}
    style={sheenGlass(accentColor)}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={spring}
    whileHover={{ scale: 1.03, y: -4 }}
    onMouseEnter={() => {
      if (!preloaded) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = 'https://www.youtube-nocookie.com';
        document.head.appendChild(link);
        setPreloaded(true);
      }
    }}
  >
    {/* Recommended badge */}
    {recommended && (
      <div className="absolute top-3 left-3 z-10 text-[9px] font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-0.5 rounded-full shadow-sm">
        ⭐ Recommended
      </div>
    )}

    {/* Thumbnail */}
    <div className="relative aspect-video overflow-hidden rounded-t-3xl cursor-pointer" onClick={onWatch}>
      <img
        src={`https://img.youtube.com/vi/${item.embedId}/mqdefault.jpg`}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#6366f1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {isWatched && (
        <div className="absolute top-2 right-2 text-[9px] font-bold text-white bg-green-500/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
          ✓ Watched
        </div>
      )}
    </div>

    {/* Info */}
    <div className="p-5">
      <h3 className="text-[14px] font-black text-slate-100 mb-3 leading-snug">{item.title}</h3>

      {/* Progress bar */}
      {isWatched && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 w-full" />
          </div>
          <p className="text-[9px] text-emerald-300 font-bold mt-1">+20 XP earned ⭐</p>
        </div>
      )}

      <div className="flex gap-2">
        <motion.button
          onClick={onWatch}
          className={`flex-1 py-2.5 rounded-2xl text-[12px] font-bold text-white shadow-md cursor-pointer bg-gradient-to-r ${gradient}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ▶️ Watch
        </motion.button>
        <motion.button
          onClick={onAskAI}
          className="flex-1 py-2.5 rounded-2xl text-[12px] font-bold cursor-pointer relative overflow-hidden"
          style={{
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(129,140,248,0.24)',
            color: '#eef2ff',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.08), transparent 70%)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">🤖 Ask AI</span>
        </motion.button>
      </div>
    </div>
  </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   RHYME CARD (no Ask AI — purely for fun)
   ═══════════════════════════════════════════════════ */

const RhymeCard: React.FC<{
  rhyme: RhymeEntry;
  isWatched: boolean;
  isPlaying: boolean;
  accentColor: string;
  onWatch: () => void;
}> = ({ rhyme, isWatched, isPlaying, accentColor, onWatch }) => (
  <motion.div
    className={`rounded-3xl relative overflow-hidden group ${isPlaying ? 'ring-2 ring-pink-400/40' : ''}`}
    style={sheenGlass(accentColor)}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={spring}
    whileHover={{ scale: 1.03, y: -4 }}
  >
    <div className="relative aspect-video overflow-hidden rounded-t-3xl cursor-pointer" onClick={onWatch}>
      <img
        src={`https://img.youtube.com/vi/${rhyme.embedId}/mqdefault.jpg`}
        alt={rhyme.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ec4899">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {isWatched && (
        <div className="absolute top-2 right-2 text-[9px] font-bold text-white bg-green-500/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
          ✓ Watched
        </div>
      )}
    </div>
    <div className="p-5">
      <h3 className="text-[14px] font-black text-slate-100 mb-1">{rhyme.title}</h3>
      <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-4 line-clamp-2">
        {rhyme.context}
      </p>
      <motion.button
        onClick={onWatch}
        className="w-full py-2.5 rounded-2xl text-[12px] font-bold text-white bg-gradient-to-r from-pink-500 to-rose-400 shadow-md cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        🎵 Play Rhyme
      </motion.button>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════ */

const SectionHeader: React.FC<{
  icon: string;
  title: string;
  count: number;
  gradient: string;
}> = ({ icon, title, count, gradient }) => (
  <motion.div
    className="flex items-center gap-3 mb-5"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={spring}
  >
    <div
      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-gradient-to-br ${gradient} shadow-sm`}
    >
      {icon}
    </div>
    <div>
      <h2 className="text-base font-black text-slate-100">{title}</h2>
      <p className="text-[10px] text-slate-300 font-bold">{count} lessons</p>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   TYPING INDICATOR
   ═══════════════════════════════════════════════════ */

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-slate-300"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════
   CHAT BUBBLE
   ═══════════════════════════════════════════════════ */

const ChatBubble: React.FC<{ msg: ChatMsg; isStreaming?: boolean }> = ({ msg, isStreaming }) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="max-w-[85%] lg:max-w-[72%] px-5 py-3.5 text-[13px] leading-relaxed"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #6366f1, #818cf8)'
            : 'rgba(15,23,42,0.84)',
          color: isUser ? '#ffffff' : '#e2e8f0',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          border: isUser ? 'none' : '1px solid rgba(148,163,184,0.18)',
          boxShadow: isUser
            ? '0 4px 16px rgba(99,102,241,0.2)'
            : '0 12px 26px rgba(2,6,23,0.22)',
          backdropFilter: isUser ? 'none' : 'blur(8px)',
          whiteSpace: 'pre-wrap' as const,
          wordBreak: 'break-word' as const,
        }}
      >
        {msg.text}
        {isStreaming && (
          <motion.span
            className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom"
            style={{ background: isUser ? '#fff' : '#6366f1' }}
            animate={{ opacity: [0, 1] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   ASK AI SECTION (Chat) — LOCKED to parent subject
   No independent subject switcher. Subject comes from parent.
   ═══════════════════════════════════════════════════ */

const AskAiSection: React.FC<{
  subject: Subject;
  selectedChapter: ChapterInfo;
  chapters: ChapterInfo[];
  onChapterChange: (ch: ChapterInfo) => void;
  prefillRef: React.MutableRefObject<string>;
}> = ({ subject, selectedChapter, chapters, onChapterChange, prefillRef }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const accentColor = subject === 'English'
    ? '#ea580c'
    : subject === 'Maths'
      ? '#7c3aed'
      : subject === 'Science'
        ? '#16a34a'
        : subject === 'Hindi'
          ? '#65a30d'
          : '#f97316';
  const subjectLabel = getSubjectLabel(subject);
  const subjectIcon = subject === 'English' ? '📖' : subject === 'Maths' ? '🔢' : subject === 'Science' ? '🔬' : subject === 'Hindi' ? '🌿' : '📙';

  // Reset chat when subject changes (parent controls this)
  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput('');
    console.log('[AI Chat] Subject changed →', subject);
  }, [subject]);

  // Reset chat when chapter changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    console.log('[AI Chat] Chapter changed →', selectedChapter.name, '(', selectedChapter.subject, ')');
  }, [selectedChapter]);

  useEffect(() => {
    if (prefillRef.current) {
      setInput(prefillRef.current);
      prefillRef.current = '';
      inputRef.current?.focus();
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChapterSelect = useCallback((ch: ChapterInfo) => {
    onChapterChange(ch);
  }, [onChapterChange]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // DEBUG: log subject/chapter alignment
    console.log('[AI Send] Subject:', subject, '| Chapter:', selectedChapter.name, '| ChapterSubject:', selectedChapter.subject);

    // Guard: chapter must match subject
    if (selectedChapter.subject !== subject) {
      console.warn('[AI Send] MISMATCH! Chapter subject', selectedChapter.subject, '!= active subject', subject);
      setError(`Chapter mismatch detected. Switching to correct ${subjectLabel} chapter...`);
      return;
    }

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', text: text.trim() };
    const aiMsgId = `a-${Date.now()}`;
    const aiMsg: ChatMsg = { id: aiMsgId, role: 'assistant', text: '' };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setIsStreaming(true);
    setError(null);

    const history: { role: 'user' | 'assistant'; content: string }[] = [
      ...messages.slice(-10).map(m => ({ role: m.role, content: m.text })),
      { role: 'user' as const, content: text.trim() },
    ];

    try {
      await aiService.streamNCERTChat(
        history,
        selectedChapter.subject,
        selectedChapter.name,
        selectedChapter.context,
        (partial) => {
          setMessages(prev =>
            prev.map(m => (m.id === aiMsgId ? { ...m, text: partial } : m)),
          );
        },
        (_full) => { setIsStreaming(false); },
        (err) => {
          setIsStreaming(false);
          setError(err.message || 'Something went wrong. Please try again.');
          setMessages(prev => prev.filter(m => m.id !== aiMsgId));
        },
      );
    } catch {
      setIsStreaming(false);
      setError('Failed to connect. Please check your connection.');
    }
  }, [isStreaming, messages, selectedChapter, subject, subjectLabel]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  return (
    <motion.div
      className={panelInsetClass}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.12 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧠</span>
        <h2 className="text-base font-black text-slate-100">Ask AI Buddy</h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2" style={{
          background: subject === 'English' ? 'rgba(234,88,12,0.18)' : 'rgba(124,58,237,0.2)',
          color: '#f8fafc',
          border: `1px solid ${subject === 'English' ? 'rgba(251,146,60,0.35)' : 'rgba(167,139,250,0.32)'}`,
        }}>
          {subjectIcon} {subjectLabel}
        </span>
      </div>

      {/* Chapter selector — only shows chapters for current subject */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => handleChapterSelect(ch)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border whitespace-nowrap"
              style={{
                ...(!selectedChapter.id || selectedChapter.id !== ch.id ? chipGlass : {}),
                background: selectedChapter.id === ch.id ? accentColor : chipGlass.background,
                color: selectedChapter.id === ch.id ? '#fff' : '#e2e8f0',
                borderColor: selectedChapter.id === ch.id ? accentColor : 'rgba(148,163,184,0.2)',
              }}
            >
              Ch {ch.chapter} · {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat card */}
      <div className="rounded-3xl flex flex-col overflow-hidden" style={sheenGlass(accentColor)}>
        <div
          className="flex-1 overflow-y-auto px-5 py-5"
          style={{ minHeight: 300, maxHeight: 440, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <span className="text-4xl mb-3">🧠</span>
              <p className="text-sm font-bold text-slate-100">
                Ask about "{selectedChapter.name}"
              </p>
              <p className="text-xs text-slate-300 mt-1 max-w-[300px]">
                Use quick buttons below or type your question. AI stays grounded to NCERT Class 3 {subjectLabel} content.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isStreaming={isStreaming && msg.role === 'assistant' && i === messages.length - 1}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.text === '' && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="mx-5 mb-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-amber-700"
              style={{ background: 'rgba(254,243,199,0.6)', border: '1px solid rgba(251,191,36,0.2)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-5 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {QUICK_ACTIONS.map(a => (
            <motion.button
              key={a.label}
              onClick={() => sendMessage(a.prompt)}
              disabled={isStreaming}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
              style={{
                background: 'rgba(15,23,42,0.74)',
                border: '1px solid rgba(148,163,184,0.18)',
                color: '#e2e8f0',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{a.icon}</span>
              {a.label}
            </motion.button>
          ))}
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="flex items-end gap-2 px-5 pb-5 pt-2"
          style={{ borderTop: '1px solid rgba(148,163,184,0.18)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about "${selectedChapter.name}" (${subjectLabel})...`}
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all border"
            style={{
              background: 'rgba(15,23,42,0.78)',
              color: '#f8fafc',
              borderColor: 'rgba(148,163,184,0.18)',
              maxHeight: 100,
            }}
          />
          <motion.button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                : 'rgba(30,41,59,0.78)',
              color: input.trim() ? '#fff' : '#94a3b8',
              boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
              border: input.trim() ? 'none' : '1px solid rgba(148,163,184,0.18)',
            }}
            whileHover={input.trim() ? { scale: 1.05 } : {}}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.button>
        </form>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[10px] text-slate-300 font-medium">
          AI responses are grounded to NCERT Class 3 {subjectLabel} textbook. No external data.
        </span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════ */

export const NCERTAssistantPage: React.FC<{
  onBack?: () => void;
  onPlayVideo?: (video: VideoEntry, subject: VideoSubject) => void;
}> = ({ onBack, onPlayVideo }) => {
  /* ── State ─────────────────────────────────────── */
  const [selectedSubject, setSelectedSubject] = useState<Subject>('English');
  const [activeItem, setActiveItem] = useState<SyllabusItem | null>(null);
  const [activeIsRhyme, setActiveIsRhyme] = useState(false);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(getWatchedSet);

  // Chat state — ALWAYS synced with selectedSubject
  const [selectedChapter, setSelectedChapter] = useState<ChapterInfo>(CHAPTER_DATA.English[0]);
  const chatChapters = useMemo(() => CHAPTER_DATA[selectedSubject], [selectedSubject]);
  const prefillRef = useRef('');

  // Subject-specific items (no mixing)
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

  // All items for this subject only (for recently watched filtering)
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

  const theme = SUBJECT_THEME[selectedSubject];

  // Refresh watched set
  useEffect(() => {
    const id = setInterval(() => setWatchedSet(getWatchedSet()), 5000);
    return () => clearInterval(id);
  }, []);

  // ✅ STEP 3: Reset ALL state on subject switch
  useEffect(() => {
    setSelectedChapter(CHAPTER_DATA[selectedSubject][0]);
    setActiveItem(null);
    setActiveIsRhyme(false);
    console.log('[Subject Switch]', selectedSubject, '→ chapter reset to', CHAPTER_DATA[selectedSubject][0].name);
  }, [selectedSubject]);

  // Pick up book context from Books page
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ssms_ai_book_context');
      if (raw) {
        const ctx = JSON.parse(raw);
        if (ctx.subject) {
          const s: Subject = ctx.subject === 'Maths'
            ? 'Maths'
            : (ctx.subject === 'Science' || ctx.subject === 'EVS')
              ? 'Science'
              : ctx.subject === 'Hindi'
                ? 'Hindi'
                : ctx.subject === 'Gujarati'
                  ? 'Gujarati'
                  : 'English';
          const sLabel = getSubjectLabel(s);
          setSelectedSubject(s);
          const chaps = CHAPTER_DATA[s];
          if (ctx.chapter) {
            const match = chaps.find(c => c.name.includes(ctx.chapter));
            if (match) setSelectedChapter(match);
          }
          if (ctx.bookTitle) {
            prefillRef.current = `Tell me about ${ctx.chapter || ctx.bookTitle} from the ${sLabel} textbook.`;
          }
        }
        localStorage.removeItem('ssms_ai_book_context');
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Handlers ──────────────────────────────────── */

  const handleSubjectToggle = useCallback((s: Subject) => {
    setSelectedSubject(s);
    // State reset handled by useEffect above
  }, []);

  const handleWatchSyllabus = useCallback((item: SyllabusItem) => {
    // If dedicated player is available, navigate there
    if (onPlayVideo) {
      const allVideos = [...VIDEO_DATA.English, ...VIDEO_DATA.Maths, ...VIDEO_DATA.Science];
      const match = allVideos.find(v => v.embedId === item.embedId || v.id === item.id);
      if (match) {
        onPlayVideo(match, selectedSubject as VideoSubject);
        return;
      }
    }
    setActiveItem(item);
    setActiveIsRhyme(false);
  }, [onPlayVideo, selectedSubject]);

  const handleWatchRhyme = useCallback((r: RhymeEntry) => {
    if (onPlayVideo) {
      const allVideos = [...VIDEO_DATA.English, ...VIDEO_DATA.Maths, ...VIDEO_DATA.Science];
      const match = allVideos.find(v => v.embedId === r.embedId || v.id === r.id);
      if (match) {
        onPlayVideo(match, selectedSubject as VideoSubject);
        return;
      }
    }
    setActiveItem({ id: r.id, title: r.title, url: r.url, embedId: r.embedId });
    setActiveIsRhyme(true);
  }, [onPlayVideo, selectedSubject]);

  const handleAskAIFromUnit = useCallback((title: string) => {
    // Find best matching chapter in CURRENT subject's CHAPTER_DATA
    const chaps = CHAPTER_DATA[selectedSubject];
    const match = chaps.find(c =>
      title.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(title.toLowerCase().replace(/unit \d+ - |chapter \d+ - /i, '').replace(/[^\w\s]/g, '').trim())
    );
    if (match) {
      setSelectedChapter(match);
    }
    prefillRef.current = `Explain "${title}" for Class 3 students.`;

    setTimeout(() => {
      document.getElementById('ai-chat-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [selectedSubject]);

  // Find first unwatched item as recommended
  const recommendedId = useMemo(() => {
    return subjectUnits.find(u => !watchedSet.has(u.id))?.id || subjectUnits[0]?.id;
  }, [watchedSet, subjectUnits]);

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="w-full px-2 lg:px-4 py-8 space-y-10 relative">
      {/* Subject background tint */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        animate={{ background: theme.pageTint }}
        transition={{ duration: 0.4 }}
      />

      {/* Back to Hub button */}
      {onBack && (
        <motion.button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer mb-2"
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
      )}

      {/* 1. Hero */}
      <AiHero />

      {/* 2. Subject Toggle */}
      <SubjectToggle selected={selectedSubject} onChange={handleSubjectToggle} />

      {/* Recently Watched (filtered by current subject only) */}
      <RecentlyWatchedRow
        subjectItems={subjectAllItems}
        subjectIdSet={subjectIdSet}
        onWatch={handleWatchSyllabus}
        accentColor={theme.accentColor}
      />

      {/* Video Player (when active) */}
      <AnimatePresence>
        {activeItem && (
          <VideoPlayerSection
            item={activeItem}
            onClose={() => setActiveItem(null)}
            showAskAI={!activeIsRhyme}
            accentColor={theme.accentColor}
            onAskAI={() => {
              if (!activeIsRhyme && activeItem) {
                handleAskAIFromUnit(activeItem.title);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. Subject Content (animated swap) — units/chapters ONLY for selected subject */}
      <AnimatePresence mode="wait">
        <motion.div
          className={panelInsetClass}
          key={`units-${selectedSubject}`}
          initial={{ opacity: 0, x: selectedSubject === 'English' ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: selectedSubject === 'English' ? 24 : -24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <SectionHeader
            icon={theme.icon}
            title={theme.label}
            count={subjectUnits.length}
            gradient={theme.sectionGradient}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subjectUnits.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: i * 0.04 }}
              >
                <SyllabusCard
                  item={item}
                  isWatched={watchedSet.has(item.id)}
                  isPlaying={activeItem?.id === item.id}
                  gradient={theme.gradient}
                  accentColor={theme.accentColor}
                  recommended={item.id === recommendedId}
                  onWatch={() => handleWatchSyllabus(item)}
                  onAskAI={() => handleAskAIFromUnit(item.title)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 4. Rhymes Section — ONLY for selected subject, no cross-subject */}
      <AnimatePresence mode="wait">
        <motion.div
          className={panelInsetClass}
          key={`rhymes-${selectedSubject}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <motion.div
            className="rounded-3xl p-8 relative overflow-hidden mb-6"
            style={{
              ...sheenGlass(theme.rhymeAccent),
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <div className="text-center">
              <motion.span
                className="inline-block text-4xl mb-2"
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                🎶
              </motion.span>
              <h2 className="text-xl font-black text-slate-50">
                {getSubjectLabel(selectedSubject)} Rhymes Corner
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Sing along, have fun — no homework here! 🎵
              </p>
            </div>
          </motion.div>

          {subjectRhymes.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{theme.rhymeIcon}</span>
                <h3 className="text-sm font-bold text-slate-200">{theme.rhymeLabel}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {subjectRhymes.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: i * 0.04 }}
                  >
                    <RhymeCard
                      rhyme={r}
                      isWatched={watchedSet.has(r.id)}
                      isPlaying={activeItem?.id === r.id}
                      accentColor={theme.rhymeAccent}
                      onWatch={() => handleWatchRhyme(r)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-300 font-medium">More rhymes coming soon! 🎵</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 5. Ask AI Section — LOCKED to selectedSubject, no independent switch */}
      <div id="ai-chat-section">
        <AskAiSection
          subject={selectedSubject}
          selectedChapter={selectedChapter}
          chapters={chatChapters}
          onChapterChange={setSelectedChapter}
          prefillRef={prefillRef}
        />
      </div>
    </div>
  );
};

export default NCERTAssistantPage;
