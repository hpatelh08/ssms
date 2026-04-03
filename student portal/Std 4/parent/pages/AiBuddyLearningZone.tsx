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

/* ═══════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════ */

const AiHero: React.FC = () => (
  <motion.div
    className="rounded-3xl p-10 relative overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, rgba(237,233,254,0.75), rgba(252,231,243,0.65), rgba(219,234,254,0.75))',
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 10px 36px rgba(99,102,241,0.08)',
    }}
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
      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
      animate={{ y: [0, 10, 0], x: [0, -5, 0], rotate: [0, 15, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    />
    <motion.div
      className="absolute top-12 left-1/3 w-8 h-8 rounded-full opacity-[0.07]"
      style={{ background: 'linear-gradient(135deg, #f472b6, #ec4899)' }}
      animate={{ y: [0, -8, 0], x: [0, 8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />
    <div className="absolute -top-14 -left-14 w-44 h-44 -orange- rounded-full opacity-[0.05] blur-3xl" />
    <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-pink-300 rounded-full opacity-[0.05] blur-3xl" />

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
        style={{
          background: 'linear-gradient(90deg, #f59e0b, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        AI Buddy Learning Zone
      </h1>
      <p className="text-sm mt-2 font-bold" style={{ color: '#9ca3af' }}>
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
  gradient: string;
  titleColor: string;
  descColor: string;
  delay: number;
  onClick: () => void;
  badge?: string;
  badgeBg?: string;
}

const HubCard: React.FC<HubCardProps> = ({ icon, title, description, gradient, titleColor, descColor, delay, onClick, badge, badgeBg }) => (
  <motion.button
    onClick={onClick}
    className="relative rounded-[20px] p-6 text-left cursor-pointer overflow-hidden group w-full"
    style={{
      background: gradient,
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      minHeight: 180,
    }}
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ ...spring, delay }}
    whileHover={{ y: -6, scale: 1.02, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
    whileTap={{ scale: 0.97 }}
  >
    {/* Decorative glow */}
    <div
      className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none opacity-20"
      style={{ background: `radial-gradient(circle, ${titleColor}30, transparent)` }}
    />

    <div className="relative z-10 flex flex-col h-full">
      <motion.span
        className="inline-block text-4xl mb-4"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
      >
        {icon}
      </motion.span>
      <h3 className="text-lg font-black mb-1.5" style={{ color: titleColor }}>{title}</h3>
      <p className="text-xs font-medium leading-relaxed" style={{ color: descColor }}>{description}</p>
      {badge && (
        <span
          className="inline-block mt-auto pt-3 text-[10px] font-bold px-3 py-1 rounded-full w-fit"
          style={{ background: badgeBg || `${titleColor}15`, color: titleColor }}
        >
          {badge}
        </span>
      )}
    </div>

    {/* Arrow indicator */}
    <div
      className="absolute bottom-5 right-5 w-8 h-8 rounded-full flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
      style={{ background: `${titleColor}12` }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={titleColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
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
        style={{ background: 'rgba(237,233,254,0.06)' }}
      />

      {/* 1. Hero */}
      <AiHero />

      {/* 2. Hub Cards — 2×2 Grid */}
      <div className="grid grid-cols-2 gap-5 lg:gap-6">
        <HubCard
          icon="🎬"
          title="Watch Learning Videos"
          description="Short animated lessons for every chapter"
          gradient="linear-gradient(135deg, #ffe9c9, #ffd48b)"
          titleColor="#ff8a00"
          descColor="#b86e00"
          delay={0.08}
          onClick={onOpenVideos}
          badge="All Subjects"
        />
        <HubCard
          icon="🧠"
          title="Ask AI Buddy"
          description="Get simple, kid-friendly AI explanations"
          gradient="linear-gradient(135deg, #e8dcff, #d2c6ff)"
          titleColor="#6b5cff"
          descColor="#5146b3"
          delay={0.12}
          onClick={onOpenAskAI}
          badge="AI Powered"
        />
        {onOpenWeeklyReport && (
          <HubCard
            icon="📊"
            title="Weekly Learning Report"
            description="AI insights, progress & parent tips"
            gradient="linear-gradient(135deg, #e2f1ff, #cfe8ff)"
            titleColor="#3aa6ff"
            descColor="#2878b8"
            delay={0.16}
            onClick={onOpenWeeklyReport}
            badge="AI Insights"
          />
        )}
        <HubCard
          icon="👨‍👩‍👧"
          title="Parent Insights"
          description="Quick tips for teaching at home"
          gradient="linear-gradient(135deg, #e6ffe9, #c6ffd0)"
          titleColor="#28c76f"
          descColor="#1e9652"
          delay={0.20}
          onClick={() => {
            document.getElementById('parent-tips-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          badge="Home Learning"
        />
      </div>

      {/* 3. Large CTA — Ask AI Buddy */}
      <motion.div
        className="rounded-3xl p-8 relative overflow-hidden text-center cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(232,220,255,0.8), rgba(210,198,255,0.7), rgba(207,232,255,0.6))',
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 10px 36px rgba(99,102,241,0.1)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.24 }}
        whileHover={{ y: -3, boxShadow: '0 14px 44px rgba(99,102,241,0.16)' }}
        onClick={onOpenAskAI}
      >
        <div className="absolute -top-10 -left-10 w-32 h-32 -amber- rounded-full opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-pink-300 rounded-full opacity-[0.06] blur-3xl" />

        <div className="relative z-10">
          <motion.span
            className="inline-block text-5xl mb-3"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🧠
          </motion.span>
          <h2 className="text-xl font-black mb-1" style={{ color: '#6b5cff' }}>
            Need help understanding something?
          </h2>
          <p className="text-sm font-medium mb-4" style={{ color: '#8b83c9' }}>
            Ask any question about your lessons. AI Buddy explains it simply!
          </p>
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6b5cff, #fbbf24)',
              boxShadow: '0 4px 16px rgba(107,92,255,0.3)',
            }}
          >
            Ask AI Buddy →
          </div>
        </div>
      </motion.div>

      {/* Parent Tips Card */}
      <motion.div
        id="parent-tips-section"
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(230,255,233,0.7), rgba(198,255,208,0.5))',
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 6px 24px rgba(40,199,111,0.06)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.28 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">👨‍👩‍👧</span>
          <div>
            <h3 className="text-sm font-black" style={{ color: '#28c76f' }}>Parent Tips</h3>
            <p className="text-[10px] font-medium" style={{ color: '#6bb886' }}>Quick tips for teaching at home</p>
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
                background: 'rgba(255,255,255,0.55)',
                border: `1px solid ${tip.color}15`,
              }}
            >
              <span className="text-lg">{tip.icon}</span>
              <p className="text-[11px] font-medium mt-2 leading-relaxed" style={{ color: tip.color }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AiBuddyLearningZone;
