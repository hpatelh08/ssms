/**
 * parent/pages/NCERTAssistantPage.tsx
 * ─────────────────────────────────────────────────────
 * AI Buddy Learning Zone — Strict Subject Isolation
 *
 * Structure per subject:
 *  1. AiHero — pastel gradient banner
 *  2. SubjectToggle — [ English ] [ Maths ] [ Science ] [ Social Science ] pill switch
 *  3. Recently Watched row (filtered by subject)
 *  4. Subject Section — units/chapters for selected subject
 *  5. Ask AI Buddy Chat — LOCKED to selectedSubject + selectedChapter
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHAPTER_DATA, type Subject, type ChapterInfo } from '../../data/ncertChapters';
import { englishUnits, type UnitEntry } from '../../data/englishUnits';
import { mathsChapters, type MathsChapterEntry } from '../../data/mathsChapters';
import { scienceChapters } from '../../data/scienceChapters';
import { hindiChapters } from '../../data/hindiChapters';
import { socialScienceChapters } from '../../data/socialScienceChapters';
import { englishRhymes, type RhymeEntry } from '../../data/englishRhymes';
import { mathsRhymes } from '../../data/mathsRhymes';
import { aiService } from '../../services/geminiService';
import { VIDEO_DATA, type VideoEntry, type VideoSubject } from '../../data/videoConfig';
import SafeYouTubeEmbed from '../../components/SafeYouTubeEmbed';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* Subject theme config */
const SUBJECT_THEME = {
  English: {
    toggleBg: 'bg-purple-500',
    gradient: 'from-orange-500 to-amber-500',
    sectionGradient: 'from-orange-100 to-amber-100',
    pageTint: 'rgba(237,233,254,0.12)',
    icon: '📘',
    label: 'English Learning Units',
    rhymeLabel: 'English Extra Videos',
    rhymeIcon: '📖',
  },
  Maths: {
    toggleBg: 'bg-blue-500',
    gradient: 'from-violet-500 to-purple-500',
    sectionGradient: 'from-violet-100 to-purple-100',
    pageTint: 'rgba(219,234,254,0.12)',
    icon: '📗',
    label: 'Maths Learning Chapters',
    rhymeLabel: 'Maths Extra Videos',
    rhymeIcon: '🔢',
  },
  Science: {
    toggleBg: 'bg-green-500',
    gradient: 'from-green-500 to-teal-500',
    sectionGradient: 'from-green-100 to-teal-100',
    pageTint: 'rgba(209,250,229,0.12)',
    icon: '🔬',
    label: 'Science Learning Units',
    rhymeLabel: 'Science Extra Videos',
    rhymeIcon: '🧪',
  },
  'Social Science': {
    toggleBg: 'bg-rose-500',
    gradient: 'from-rose-500 to-pink-500',
    sectionGradient: 'from-rose-100 to-pink-100',
    pageTint: 'rgba(255,228,230,0.12)',
    icon: '🌍',
    label: 'Social Science Learning Units',
    rhymeLabel: 'Social Science Extra Videos',
    rhymeIcon: '🗺️',
  },
  Hindi: {
    toggleBg: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    sectionGradient: 'from-amber-100 to-orange-100',
    pageTint: 'rgba(254,243,199,0.12)',
    icon: '📕',
    label: 'Hindi Learning Units',
    rhymeLabel: 'Hindi Extra Videos',
    rhymeIcon: '✍️',
  },
} as const;

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
  { label: 'Explain simply', icon: '💡', prompt: 'Explain this chapter simply so a Class 6 student can understand easily.' },
  { label: 'Give example', icon: '🎯', prompt: 'Give a fun, relatable real-life example from this chapter for my child.' },
  { label: 'Give worksheet', icon: '📝', prompt: 'Generate a 5-question worksheet from this chapter suitable for a Class 6 student.' },
  { label: 'Parent tip', icon: '👨‍👩‍👧', prompt: 'Give me a practical parent teaching tip for this chapter that I can use at home.' },
];

function buildOfflineWorksheet(chapter: ChapterInfo): string {
  const chapterTitle = chapter.name.replace(/\s+/g, ' ').trim();
  const cleanContext = chapter.context.replace(/\s+/g, ' ').trim();

  return [
    `I could not reach the AI just now, so here is a simple worksheet for "${chapterTitle}":`,
    '',
    '1. What is this chapter mainly about?',
    '2. Write two important ideas from the chapter.',
    '3. Name one character, object, or example from the chapter.',
    '4. What lesson does this chapter teach?',
    '5. Write one real-life connection to this chapter.',
    '',
    `Hint: ${cleanContext}`,
  ].join('\n');
}

function buildOfflineFallbackReply(prompt: string, chapter: ChapterInfo): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('worksheet')) {
    return buildOfflineWorksheet(chapter);
  }

  if (lower.includes('example')) {
    return `A simple real-life example from "${chapter.name}" is: ${chapter.context}`;
  }

  if (lower.includes('parent tip')) {
    return [
      `Parent tip for "${chapter.name}":`,
      'Read the chapter together.',
      'Ask your child to say the main idea in their own words.',
      'Then connect one idea to something from daily life.',
    ].join('\n');
  }

  if (lower.includes('explain')) {
    return [
      `Here is a simple explanation of "${chapter.name}":`,
      chapter.context,
      'Ask your child to tell you the main idea in one short sentence.',
    ].join('\n\n');
  }

  return `This chapter, "${chapter.name}", is about ${chapter.context}. Try asking about the main idea, a character, or the lesson it teaches.`;
}

/* ═══════════════════════════════════════════════════
   GLASS CARD STYLE
   ═══════════════════════════════════════════════════ */

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 6px 28px rgba(99,102,241,0.06), 0 2px 8px rgba(0,0,0,0.03)',
};

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

const SCIENCE_IDS = new Set(scienceChapters.map(c => c.id));
const HINDI_IDS = new Set(hindiChapters.map(c => c.id));
const SOCIAL_SCIENCE_IDS = new Set(socialScienceChapters.map(c => c.id));

/* ═══════════════════════════════════════════════════
   1️⃣  HERO
   ═══════════════════════════════════════════════════ */

const AiHero: React.FC = () => (
  <motion.div
    className="rounded-3xl p-10 relative overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, rgba(237,233,254,0.7), rgba(252,231,243,0.6), rgba(219,234,254,0.7))',
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 8px 32px rgba(99,102,241,0.06)',
    }}
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
      <h1 className="text-2xl font-black text-gray-800 tracking-tight">
        AI Buddy Learning Zone
      </h1>
      <p className="text-sm text-gray-400 mt-2 font-medium">
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
      className="inline-flex rounded-full p-1 gap-1 backdrop-blur-md shadow-md flex-wrap justify-center"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(255,255,255,0.5)',
      }}
    >
      {(['English', 'Maths', 'Science', 'Social Science', 'Hindi'] as Subject[]).map(s => {
        const isActive = selected === s;
        const theme = SUBJECT_THEME[s];
        const icons: Record<Subject, string> = { English: '📖', Maths: '🔢', Science: '🔬', 'Social Science': '🌍', Hindi: '📕' };
        return (
          <motion.button
            key={s}
            onClick={() => onChange(s)}
            className={`relative px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer
              ${isActive ? `${theme.toggleBg} text-white shadow-lg` : 'text-gray-400 hover:text-gray-600'}`}
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
              {icons[s]} {s}
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
}> = ({ subjectItems, subjectIdSet, onWatch }) => {
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.06 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🕐</span>
        <h2 className="text-sm font-black text-gray-700">Recently Watched</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {recentItems.map(v => (
          <motion.button
            key={v.id}
            onClick={() => onWatch(v)}
            className="shrink-0 rounded-2xl overflow-hidden cursor-pointer group text-left"
            style={{
              width: 190,
              ...glass,
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
            <p className="text-[11px] font-bold text-gray-700 p-2.5 truncate">{v.title}</p>
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
}> = ({ item, onClose, onAskAI, showAskAI = true }) => {
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
      className="rounded-3xl overflow-hidden relative video-container"
      style={{
        ...glass,
        boxShadow: '0 12px 48px rgba(99,102,241,0.1), 0 4px 12px rgba(0,0,0,0.04)',
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
            <h3 className="text-[14px] font-black text-gray-800">{item.title}</h3>
            <p className="text-[11px] text-gray-400 font-medium">Now Playing</p>
          </div>
        </div>
        <div className="flex gap-2">
          {showAskAI && (
            <motion.button
              onClick={onAskAI}
              className="text-[11px] font-bold text-indigo-600 px-4 py-2 rounded-full cursor-pointer"
              style={{ background: 'rgba(238,242,255,0.7)', border: '1px solid rgba(99,102,241,0.15)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🤖 Ask AI About This
            </motion.button>
          )}
          <motion.button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-400 text-sm cursor-pointer"
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
  onWatch: () => void;
  onAskAI: () => void;
  recommended?: boolean;
}> = ({ item, isWatched, isPlaying, gradient, onWatch, onAskAI, recommended }) => {
  const [preloaded, setPreloaded] = useState(false);

  return (
  <motion.div
    className={`rounded-3xl relative overflow-hidden group ${isPlaying ? 'ring-2 ring-indigo-400/40' : ''}`}
    style={glass}
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
      <h3 className="text-[14px] font-black text-gray-800 mb-3 leading-snug">{item.title}</h3>

      {/* Progress bar */}
      {isWatched && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 w-full" />
          </div>
          <p className="text-[9px] text-green-600 font-bold mt-1">+20 XP earned ⭐</p>
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
            background: 'rgba(238,242,255,0.7)',
            border: '1px solid rgba(99,102,241,0.15)',
            color: '#4f46e5',
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
  onWatch: () => void;
}> = ({ rhyme, isWatched, isPlaying, onWatch }) => (
  <motion.div
    className={`rounded-3xl relative overflow-hidden group ${isPlaying ? 'ring-2 ring-pink-400/40' : ''}`}
    style={glass}
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
      <h3 className="text-[14px] font-black text-gray-800 mb-1">{rhyme.title}</h3>
      <p className="text-[11px] text-gray-400 font-medium leading-relaxed mb-4 line-clamp-2">
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
      <h2 className="text-base font-black text-gray-800">{title}</h2>
      <p className="text-[10px] text-gray-400 font-bold">{count} lessons</p>
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
            : 'rgba(255,255,255,0.8)',
          color: isUser ? '#ffffff' : '#334155',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.5)',
          boxShadow: isUser
            ? '0 4px 16px rgba(99,102,241,0.2)'
            : '0 2px 8px rgba(0,0,0,0.04)',
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
  const accentColors: Record<Subject, string> = {
    English: '#ea580c',
    Maths: '#7c3aed',
    Science: '#16a34a',
    'Social Science': '#e11d48',
  };
  const accentColor = accentColors[subject];

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
      setError(`Chapter mismatch detected. Switching to correct ${subject} chapter...`);
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

    const applyFallback = () => {
      const fallbackText = buildOfflineFallbackReply(text.trim(), selectedChapter);
      setMessages(prev => prev.map(m => (
        m.id === aiMsgId ? { ...m, text: fallbackText } : m
      )));
      setIsStreaming(false);
      setError(null);
    };

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
          console.warn('[AI Chat] Falling back to offline reply:', err);
          applyFallback();
        },
      );
    } catch {
      applyFallback();
    }
  }, [isStreaming, messages, selectedChapter, subject]);

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.12 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧠</span>
        <h2 className="text-base font-black text-gray-800">Ask AI Buddy</h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2" style={{
          background: subject === 'English' ? 'rgba(234,88,12,0.1)' : 'rgba(124,58,237,0.1)',
          color: accentColor,
        }}>
          {subject === 'English' ? '📖' : '🔢'} {subject}
        </span>
      </div>

      {/* Chapter selector — only shows chapters for current subject */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => handleChapterSelect(ch)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border whitespace-nowrap"
              style={{
                background: selectedChapter.id === ch.id ? accentColor : 'rgba(255,255,255,0.6)',
                color: selectedChapter.id === ch.id ? '#fff' : '#64748b',
                borderColor: selectedChapter.id === ch.id ? accentColor : 'rgba(226,232,240,0.4)',
              }}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat card */}
      <div className="rounded-3xl flex flex-col overflow-hidden" style={glass}>
        <div
          className="flex-1 overflow-y-auto px-5 py-5"
          style={{ minHeight: 300, maxHeight: 440, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <span className="text-4xl mb-3">🧠</span>
              <p className="text-sm font-bold text-gray-600">
                Ask about "{selectedChapter.name}"
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-[300px]">
                Use quick buttons below or type your question. AI stays grounded to NCERT Class 6 {subject} content.
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
                background: 'rgba(248,250,252,0.7)',
                border: '1px solid rgba(226,232,240,0.4)',
                color: '#475569',
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
          style={{ borderTop: '1px solid rgba(226,232,240,0.3)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about "${selectedChapter.name}" (${subject})...`}
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none transition-all border"
            style={{
              background: 'rgba(248,250,252,0.6)',
              borderColor: 'rgba(226,232,240,0.3)',
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
                : 'rgba(226,232,240,0.5)',
              color: input.trim() ? '#fff' : '#94a3b8',
              boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
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
        <span className="text-[10px] text-gray-400 font-medium">
          AI responses are grounded to NCERT Class 6 {subject} textbook. No external data.
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
    () => {
      if (selectedSubject === 'English') return englishUnits;
      if (selectedSubject === 'Maths') return mathsChapters;
      // Science and Social Science: show CHAPTER_DATA items as SyllabusItems (no video cards)
      return [];
    },
    [selectedSubject],
  );

  const subjectRhymes: RhymeEntry[] = useMemo(
    () => {
      if (selectedSubject === 'English') return englishRhymes;
      if (selectedSubject === 'Maths') return mathsRhymes;
      return [];
    },
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
    return [];
  }, [selectedSubject]);

  const subjectIdSet = useMemo(() => {
    if (selectedSubject === 'English') return ENGLISH_IDS;
    if (selectedSubject === 'Maths') return MATHS_IDS;
    if (selectedSubject === 'Science') return SCIENCE_IDS;
    return SOCIAL_SCIENCE_IDS;
  }, [selectedSubject]);

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
          const s = ctx.subject === 'Maths' ? 'Maths' : 'English';
          setSelectedSubject(s as Subject);
          const chaps = CHAPTER_DATA[s as Subject];
          if (ctx.chapter) {
            const match = chaps.find(c => c.name.includes(ctx.chapter));
            if (match) setSelectedChapter(match);
          }
          if (ctx.bookTitle) {
            prefillRef.current = `Tell me about ${ctx.chapter || ctx.bookTitle} from the ${s} textbook.`;
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
      const allVideos = [...VIDEO_DATA.English, ...VIDEO_DATA.Maths];
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
      const allVideos = [...VIDEO_DATA.English, ...VIDEO_DATA.Maths];
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
    prefillRef.current = `Explain "${title}" for Class 6 students.`;

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
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer mb-2"
          style={{
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 14,
            padding: '8px 18px',
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
      />

      {/* Video Player (when active) */}
      <AnimatePresence>
        {activeItem && (
          <VideoPlayerSection
            item={activeItem}
            onClose={() => setActiveItem(null)}
            showAskAI={!activeIsRhyme}
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
          key={`units-${selectedSubject}`}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
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
                  recommended={item.id === recommendedId}
                  onWatch={() => handleWatchSyllabus(item)}
                  onAskAI={() => handleAskAIFromUnit(item.title)}
                />
              </motion.div>
            ))}
          </div>
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
