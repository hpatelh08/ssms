/**
 * parent/pages/AiBuddyLearningZone.tsx
 * ─────────────────────────────────────────────────────
 * AI Buddy Learning Zone — Clean Hub / Landing Page
 *
 * Upgraded UI: 2×2 shiny square cards, themed colors (no black text),
 * floating pastel background shapes, child-friendly design.
 *
 * Cards: Watch Videos · Ask AI Buddy · Weekly Report · Parent Insights
 */

import React from 'react';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };
const panelInsetClass = 'mx-3 md:mx-4 lg:mx-5';

const topbarGlass: React.CSSProperties = {
  background: 'var(--gradient-topbar)',
  border: '1px solid rgba(148,163,184,0.18)',
  boxShadow: 'var(--shadow-soft)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
};

const glassSurface = (accent: string): React.CSSProperties => ({
  ...topbarGlass,
  background: `radial-gradient(circle at top right, ${accent}24, transparent 36%), radial-gradient(circle at bottom left, ${accent}16, transparent 28%), var(--gradient-topbar)`,
});

/* ═══════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════ */

const AiHero: React.FC = () => (
  <motion.div
    className={`${panelInsetClass} rounded-3xl p-10 relative overflow-hidden`}
    style={glassSurface('#818cf8')}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay: 0.04 }}
  >
    {/* Floating shapes */}
    <motion.div
      className="absolute top-4 right-12 w-14 h-14 rounded-full opacity-[0.10]"
      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
      animate={{ y: [0, -12, 0], x: [0, 6, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-6 left-10 w-10 h-10 rounded-2xl opacity-[0.08]"
      style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}
      animate={{ y: [0, 10, 0], x: [0, -5, 0], rotate: [0, 15, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    />
    <motion.div
      className="absolute top-12 left-1/3 w-8 h-8 rounded-full opacity-[0.07]"
      style={{ background: 'linear-gradient(135deg, #f472b6, #ec4899)' }}
      animate={{ y: [0, -8, 0], x: [0, 8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />
    <div className="absolute -top-14 -left-14 w-44 h-44 bg-purple-300 rounded-full opacity-[0.05] blur-3xl" />
    <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-pink-300 rounded-full opacity-[0.05] blur-3xl" />

    <div className="relative z-10 text-center">
      <motion.span
        className="inline-block text-5xl mb-3"
        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🤖
      </motion.span>
      <h1 className="text-2xl font-black tracking-tight" style={{ color: '#f8fafc' }}>
        AI Buddy Learning Zone
      </h1>
      <p className="text-sm mt-2 font-bold" style={{ color: '#cbd5e1' }}>
        Watch · Learn · Ask · Grow 🌱
      </p>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════
   SQUARE HUB CARD
   ═══════════════════════════════════════════════════ */

interface HubCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  delay: number;
  onClick: () => void;
  badge?: string;
}

const HubCard: React.FC<HubCardProps> = ({ icon, title, description, accentColor, delay, onClick, badge }) => (
  <motion.button
    onClick={onClick}
    className="relative rounded-[20px] p-6 text-left cursor-pointer overflow-hidden group w-full"
    style={{
      ...glassSurface(accentColor),
      minHeight: 180,
    }}
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ ...spring, delay }}
    whileHover={{ y: -6, scale: 1.02, boxShadow: '0 20px 44px rgba(2,6,23,0.34)' }}
    whileTap={{ scale: 0.97 }}
  >
    {/* Decorative glow */}
    <div
      className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none opacity-20"
      style={{ background: `radial-gradient(circle, ${accentColor}40, transparent)` }}
    />

    <div className="relative z-10 flex flex-col h-full">
      <motion.span
        className="inline-block text-4xl mb-4"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
      >
        {icon}
      </motion.span>
      <h3 className="text-lg font-black mb-1.5" style={{ color: '#f8fafc' }}>{title}</h3>
      <p className="text-xs font-medium leading-relaxed" style={{ color: '#cbd5e1' }}>{description}</p>
      {badge && (
        <span
          className="inline-block mt-auto pt-3 text-[10px] font-bold px-3 py-1 rounded-full w-fit"
          style={{
            background: `${accentColor}1f`,
            color: '#e2e8f0',
            border: `1px solid ${accentColor}40`,
          }}
        >
          {badge}
        </span>
      )}
    </div>

    {/* Arrow indicator */}
    <div
      className="absolute bottom-5 right-5 w-8 h-8 rounded-full flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
      style={{ background: `${accentColor}20` }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  </motion.button>
);

/* ═══════════════════════════════════════════════════
   MAIN HUB COMPONENT
   ═══════════════════════════════════════════════════ */

interface Props {
  onOpenAskAI: () => void;
  onOpenVideos: () => void;
  onOpenWorksheets?: () => void;
  onOpenWeeklyReport?: () => void;
}

export const AiBuddyLearningZone: React.FC<Props> = ({ onOpenAskAI, onOpenVideos, onOpenWeeklyReport }) => {
  return (
    <div className="w-full px-2 lg:px-4 py-8 space-y-10 relative">
      {/* Subtle background tint */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: 'rgba(30,41,59,0.2)' }}
      />

      {/* 1. Hero */}
      <AiHero />

      {/* 2. Hub Cards — 2×2 Grid */}
      <div className={`grid grid-cols-2 gap-5 lg:gap-6 ${panelInsetClass}`}>
        <HubCard
          icon="🎬"
          title="Watch Learning Videos"
          description="Short animated lessons for every chapter"
          accentColor="#f59e0b"
          delay={0.08}
          onClick={onOpenVideos}
          badge="English & Maths"
        />
        <HubCard
          icon="🧠"
          title="Ask AI Buddy"
          description="Get simple, kid-friendly AI explanations"
          accentColor="#8b5cf6"
          delay={0.12}
          onClick={onOpenAskAI}
          badge="AI Powered"
        />
        {onOpenWeeklyReport && (
          <HubCard
            icon="📊"
            title="Weekly Learning Report"
            description="AI insights, progress & parent tips"
            accentColor="#38bdf8"
            delay={0.16}
            onClick={onOpenWeeklyReport}
            badge="AI Insights"
          />
        )}
        <HubCard
          icon="👨‍👩‍👧"
          title="Parent Insights"
          description="Quick tips for teaching at home"
          accentColor="#22c55e"
          delay={0.20}
          onClick={() => {
            document.getElementById('parent-tips-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          badge="Home Learning"
        />
      </div>

      {/* 3. Large CTA — Ask AI Buddy */}
      <motion.div
        className={`${panelInsetClass} rounded-3xl p-8 relative overflow-hidden text-center cursor-pointer`}
        style={glassSurface('#8b5cf6')}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.24 }}
        whileHover={{ y: -3, boxShadow: '0 20px 44px rgba(2,6,23,0.34)' }}
        onClick={onOpenAskAI}
      >
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-300 rounded-full opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-pink-300 rounded-full opacity-[0.06] blur-3xl" />

        <div className="relative z-10">
          <motion.span
            className="inline-block text-5xl mb-3"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🧠
          </motion.span>
          <h2 className="text-xl font-black mb-1" style={{ color: '#f8fafc' }}>
            Need help understanding something?
          </h2>
          <p className="text-sm font-medium mb-4" style={{ color: '#cbd5e1' }}>
            Ask any question about your lessons. AI Buddy explains it simply!
          </p>
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6b5cff, #818cf8)',
              boxShadow: '0 10px 22px rgba(79,70,229,0.32)',
            }}
          >
            Ask AI Buddy →
          </div>
        </div>
      </motion.div>

      {/* Parent Tips Card */}
      <motion.div
        id="parent-tips-section"
        className={`${panelInsetClass} rounded-3xl p-6 relative overflow-hidden`}
        style={glassSurface('#22c55e')}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.28 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">👨‍👩‍👧</span>
          <div>
            <h3 className="text-sm font-black" style={{ color: '#f8fafc' }}>Parent Tips</h3>
            <p className="text-[10px] font-medium" style={{ color: '#cbd5e1' }}>Quick tips for teaching at home</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '🎯', text: 'Use everyday objects to teach counting and patterns', color: '#6b5cff' },
            { icon: '📖', text: 'Read together for 10 minutes before bedtime', color: '#ff8a00' },
            { icon: '🎨', text: 'Encourage drawing to build fine motor skills', color: '#ec4899' },
          ].map((tip, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{
                ...glassSurface(tip.color),
                border: `1px solid ${tip.color}40`,
              }}
            >
              <span className="text-lg">{tip.icon}</span>
              <p className="text-[11px] font-medium mt-2 leading-relaxed" style={{ color: '#e2e8f0' }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AiBuddyLearningZone;
