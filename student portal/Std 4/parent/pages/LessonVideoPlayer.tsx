/**
 * parent/pages/LessonVideoPlayer.tsx
 * ─────────────────────────────────────────────────────
 * Child-Safe Dedicated Video Player Page
 *
 * Features:
 *  ① Safe YouTube embed (no-cookie mode, no external links)
 *  ② Colorful child-friendly UI
 *  ③ Video progress tracking (start, partial, complete)
 *  ④ AI Learning Assistant below video
 *  ⑤ Auto-suggest next lesson card
 *  ⑥ Preload next video on hover
 *  ⑦ Fullscreen safe mode (inside iframe only)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VIDEO_DATA, ALL_VIDEOS, type VideoEntry, type VideoSubject } from '../../data/videoConfig';
import SafeYouTubeEmbed from '../../components/SafeYouTubeEmbed';
import { logActivity } from '../../services/activityLogger';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

/* ── localStorage keys ──────────────────────────── */
const PROGRESS_KEY = 'ssms_video_progress';
const WATCH_KEY = 'ssms_video_watched';
const RECENT_KEY = 'ssms_video_recent';
const XP_KEY = 'ssms_video_xp_awarded';

type WatchStatus = 'not-started' | 'watching' | 'completed';

interface VideoProgress {
  videoId: string;
  status: WatchStatus;
  watchTimeMs: number;
  startedAt?: string;
  completedAt?: string;
}

/* ── Progress helpers ───────────────────────────── */
function getVideoProgress(videoId: string): VideoProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const map: Record<string, VideoProgress> = raw ? JSON.parse(raw) : {};
    return map[videoId] || { videoId, status: 'not-started', watchTimeMs: 0 };
  } catch { return { videoId, status: 'not-started', watchTimeMs: 0 }; }
}

function saveVideoProgress(progress: VideoProgress) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const map: Record<string, VideoProgress> = raw ? JSON.parse(raw) : {};
    map[progress.videoId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function markWatched(videoId: string) {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(videoId)) { set.push(videoId); }
    localStorage.setItem(WATCH_KEY, JSON.stringify(set));
  } catch { /* ignore */ }
}

function addToRecent(videoId: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    let recent: string[] = raw ? JSON.parse(raw) : [];
    recent = recent.filter(id => id !== videoId);
    recent.unshift(videoId);
    if (recent.length > 8) recent = recent.slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch { /* ignore */ }
}

function awardVideoXP(videoId: string) {
  try {
    const raw = localStorage.getItem(XP_KEY);
    const awarded: string[] = raw ? JSON.parse(raw) : [];
    if (awarded.includes(videoId)) return;
    awarded.push(videoId);
    localStorage.setItem(XP_KEY, JSON.stringify(awarded));
    const xpRaw = localStorage.getItem('ssms_xp_state');
    if (xpRaw) {
      const state = JSON.parse(xpRaw);
      state.xp = (state.xp || 0) + 20;
      localStorage.setItem('ssms_xp_state', JSON.stringify(state));
    }
  } catch { /* ignore */ }
}

/* ── Glass style ───────────────────────────────── */
const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 6px 28px rgba(99,102,241,0.06)',
};

/* ═══════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════ */
const StatusBadge: React.FC<{ status: WatchStatus }> = ({ status }) => {
  const config = {
    'not-started': { label: 'Not Started', bg: 'rgba(156,163,175,0.1)', color: '#9CA3AF', icon: '⏳' },
    'watching':    { label: 'Watching…',   bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', icon: '▶️' },
    'completed':   { label: 'Completed ✓', bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', icon: '✅' },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.icon} {config.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   NEXT LESSON CARD
   ═══════════════════════════════════════════════════ */
const NextLessonCard: React.FC<{
  video: VideoEntry;
  onPlay: (v: VideoEntry) => void;
}> = ({ video, onPlay }) => {
  const [preloaded, setPreloaded] = useState(false);

  return (
    <motion.div
      className="rounded-3xl overflow-hidden cursor-pointer group"
      style={glass}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.2 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPlay(video)}
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
      <div className="flex items-center gap-4 p-5">
        {/* Thumbnail */}
        <div className="w-28 h-20 rounded-2xl overflow-hidden shrink-0 relative">
          <img
            src={`https://img.youtube.com/vi/${video.embedId}/mqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center -amber-/10 group-hover:-amber-/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold -amber- mb-1">▶ Up Next</p>
          <h4 className="text-[14px] font-black -amber- truncate">{video.title}</h4>
          <p className="text-[11px] -amber- font-medium mt-0.5 line-clamp-1">{video.context}</p>
        </div>

        <motion.div
          className="w-10 h-10 rounded-full bg-gradient-to-br -amber- -orange- flex items-center justify-center shrink-0 shadow-md"
          whileHover={{ scale: 1.15 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN: LessonVideoPlayer
   ═══════════════════════════════════════════════════ */
export interface LessonVideoPlayerProps {
  video: VideoEntry;
  subject: VideoSubject;
  onBack: () => void;
  onPlayVideo?: (video: VideoEntry, subject: VideoSubject) => void;
  onAskAI?: () => void;
}

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  video,
  subject,
  onBack,
  onPlayVideo,
  onAskAI,
}) => {
  const [progress, setProgress] = useState<VideoProgress>(() => getVideoProgress(video.id));
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const videoRef = useRef<HTMLDivElement>(null);

  /* ── Scroll to top when video page opens ──── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also scroll the video player into view as a fallback
    setTimeout(() => {
      videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [video.id]);

  /* ── All videos for this subject ─────────────── */
  const subjectVideos = useMemo(() => VIDEO_DATA[subject], [subject]);

  /* ── Next video ──────────────────────────────── */
  const nextVideo = useMemo(() => {
    const idx = subjectVideos.findIndex(v => v.id === video.id);
    if (idx >= 0 && idx < subjectVideos.length - 1) return subjectVideos[idx + 1];
    return subjectVideos[0] !== video ? subjectVideos[0] : null;
  }, [subjectVideos, video]);

  /* ── Auto-tracking ───────────────────────────── */
  useEffect(() => {
    // Mark as watching
    const p = getVideoProgress(video.id);
    if (p.status === 'not-started') {
      p.status = 'watching';
      p.startedAt = new Date().toISOString();
    }
    saveVideoProgress(p);
    setProgress(p);
    addToRecent(video.id);
    startTimeRef.current = Date.now();

    // Track watch time every 5s
    watchTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const updated = getVideoProgress(video.id);
      updated.watchTimeMs = (updated.watchTimeMs || 0) + 5000;
      // After 30s, auto-mark as completed
      if (elapsed >= 30_000 && updated.status !== 'completed') {
        updated.status = 'completed';
        updated.completedAt = new Date().toISOString();
        markWatched(video.id);
        awardVideoXP(video.id);
      }
      saveVideoProgress(updated);
      setProgress({ ...updated });
    }, 5000);

    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      const elapsedMins = Math.floor((Date.now() - startTimeRef.current) / 60000);
      if (elapsedMins >= 1) logActivity('watchVideo', elapsedMins);
    };
  }, [video.id]);

  /* ── Handle play next ─────────────────────────── */
  const handlePlayNext = useCallback((v: VideoEntry) => {
    if (onPlayVideo) {
      onPlayVideo(v, subject);
    }
  }, [onPlayVideo, subject]);

  const accentColor = subject === 'English' ? '#F59E0B' : '#f59e0b';

  return (
    <div className="w-full px-2 lg:px-4 py-6 space-y-6 relative max-w-5xl mx-auto">
      {/* Subject tint */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        animate={{ background: subject === 'English' ? 'rgba(254,249,195,0.08)' : 'rgba(237,233,254,0.08)' }}
        transition={{ duration: 0.4 }}
      />

      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 14,
          padding: '8px 18px',
          color: '#6B7AA6',
        }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Lessons
      </motion.button>

      {/* Title bar */}
      <motion.div
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
              border: `2px solid ${accentColor}30`,
            }}
          >
            {subject === 'English' ? '📖' : '🔢'}
          </div>
          <div>
            <h1
              className="text-lg font-black"
              style={{
                background: subject === 'English'
                  ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                  : 'linear-gradient(90deg, #f59e0b, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {video.title}
            </h1>
            <p className="text-[11px] text-gray-400 font-medium">
              {subject} · Class 4 · AI Lessons
            </p>
          </div>
        </div>
        <StatusBadge status={progress.status} />
      </motion.div>

      {/* VIDEO PLAYER */}
      <motion.div
        ref={videoRef}
        className="rounded-3xl overflow-hidden video-container"
        style={{
          background: 'white',
          boxShadow: '0 18px 40px rgba(99,102,241,0.12), 0 6px 16px rgba(99,102,241,0.06)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring}
      >
        {/* Player header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-white text-xs">▶</span>
            </motion.div>
            <div>
              <h3 className="text-[13px] font-black" style={{ color: accentColor }}>{video.title}</h3>
              <p className="text-[10px] font-medium" style={{ color: `${accentColor}99` }}>Now Playing · Safe Mode</p>
            </div>
          </div>

          {progress.status === 'completed' && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              ✅ +20 XP earned
            </span>
          )}
        </div>

        {/* Embedded video — Safe YouTube Embed */}
        <SafeYouTubeEmbed embedId={video.embedId} title={video.title} />

        {/* Video context */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(99,102,241,0.06)' }}>
          <p className="text-[12px] font-medium leading-relaxed" style={{ color: `${accentColor}BB` }}>
            📚 {video.context}
          </p>
        </div>
      </motion.div>

      {/* ASK AI BUDDY BUTTON */}
      {onAskAI && (
        <motion.button
          onClick={onAskAI}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-3xl cursor-pointer"
          style={{
            ...glass,
            background: 'linear-gradient(135deg, rgba(238,242,255,0.9), rgba(224,231,255,0.9))',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xl">🤖</span>
          <span className="text-[13px] font-black -amber-">Ask AI Buddy</span>
          <span className="text-[10px] -amber- font-medium">— Get help with this lesson</span>
        </motion.button>
      )}

      {/* NEXT LESSON */}
      {nextVideo && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⏭️</span>
            <h3 className="text-[13px] font-black" style={{ color: accentColor }}>Up Next</h3>
          </div>
          <NextLessonCard video={nextVideo} onPlay={handlePlayNext} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[10px] text-gray-400 font-medium">
          Safe viewing mode · No external links · AI grounded to NCERT Class 4 {subject}
        </span>
      </div>
    </div>
  );
};

export default LessonVideoPlayer;
