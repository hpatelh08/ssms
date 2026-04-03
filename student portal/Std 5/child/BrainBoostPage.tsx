/**
 * child/BrainBoostPage.tsx
 * -----------------------------------------------------
 * Brain Boost Hub — 3 thinking/memory games for Std 5.
 * Premium UI: vibrant gradient cards, stars, XP badges.
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell } from "../games/GameShell";
import { useGameEvents } from "./useGameEvents";

/* -- Game definitions ----------------------------- */

interface GameDef {
  gameTypeId: string;
  subject:    string;
  chapter:    string;
  title:      string;
  subtitle:   string;
  icon:       string;
  bg:         string;
  glow:       string;
  tag:        string;
  tagColor:   string;
  xp:         number;
}

const BRAIN_GAMES: GameDef[] = [
  {
    gameTypeId: "missingNumber",
    subject: "brain-boost",
    chapter: "pattern-match",
    title: "Pattern Match",
    subtitle: "Number & shape patterns —\nfind what comes next!",
    icon: "🔢",
    bg: "linear-gradient(160deg, #6cb57a 0%, #3f8f58 100%)",
    glow: "rgba(63,143,88,0.40)",
    tag: "Patterns",
    tagColor: "#c9f5cd",
    xp: 20,
  },
  {
    gameTypeId: "memoryCards",
    subject: "brain-boost",
    chapter: "memory-cards",
    title: "Memory Cards",
    subtitle: "Flip cards, find the pairs —\ntrain your memory!",
    icon: "🃏",
    bg: "linear-gradient(160deg, #8eb86a 0%, #5f8f43 100%)",
    glow: "rgba(95,143,67,0.40)",
    tag: "Memory",
    tagColor: "#e5f2c7",
    xp: 20,
  },
  {
    gameTypeId: "hiddenObject",
    subject: "brain-boost",
    chapter: "find-odd-one",
    title: "Find the Odd One",
    subtitle: "Spot the one that does\nnot belong!",
    icon: "🔎",
    bg: "linear-gradient(160deg, #7aa483 0%, #4f7b58 100%)",
    glow: "rgba(79,123,88,0.40)",
    tag: "Logic",
    tagColor: "#d9ead7",
    xp: 20,
  },
];

/* -- Read stars from localStorage ----------------- */
function readStars(chapter: string): number {
  try {
    const raw = localStorage.getItem("arcade_game_stars");
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, number>;
      return obj[chapter] ?? 0;
    }
  } catch { /* ignore */ }
  return 0;
}

/* -- Stars display -------------------------------- */
const StarRow: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{ fontSize: 16, opacity: i < count ? 1 : 0.25, filter: i < count ? "drop-shadow(0 0 4px rgba(251,191,36,0.7))" : "none" }}>
        ⭐
      </span>
    ))}
  </div>
);

/* -- Single game card — Image 2 style ------------ */
const BrainGameCard: React.FC<{
  game: GameDef;
  index: number;
  onPlay: (g: GameDef) => void;
}> = React.memo(({ game, index, onPlay }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      style={{
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: `0 10px 36px ${game.glow}, 0 2px 8px rgba(0,0,0,0.10)`,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "2.5px solid rgba(255,255,255,0.85)",
        cursor: "pointer",
        position: "relative",
      }}
      onClick={() => onPlay(game)}
    >
      {/* Colored top area with icon */}
      <div style={{
        background: game.bg,
        padding: "28px 20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        minHeight: 230,
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.13)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -24, left: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.09)", pointerEvents: "none" }} />
        {/* Large icon */}
        <div style={{
          fontSize: 80,
          lineHeight: 1,
          filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.22))",
          userSelect: "none",
        }}>
          {game.icon}
        </div>
      </div>

      {/* White bottom area */}
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ margin: 0, color: "#1f3d2b", fontSize: 19, fontWeight: 900, lineHeight: 1.2 }}>{game.title}</h3>
        <p style={{ margin: 0, color: "#5f6f62", fontSize: 12, lineHeight: 1.55, fontWeight: 500, whiteSpace: "pre-line" }}>{game.subtitle}</p>
        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{game.xp} XP</span>
          </div>
          <motion.button
            onPointerDown={(e) => { e.stopPropagation(); setPressed(true); }}
            onPointerUp={(e) => { e.stopPropagation(); setPressed(false); onPlay(game); }}
            onPointerLeave={() => setPressed(false)}
            animate={{ scale: pressed ? 0.91 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            style={{
              background: game.bg,
              border: "none",
              borderRadius: 20,
              padding: "9px 22px",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: `0 4px 14px ${game.glow}`,
              letterSpacing: 0.5,
            }}
          >
            PLAY <span style={{ fontSize: 11 }}>▶</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
BrainGameCard.displayName = "BrainGameCard";

/* -- Page ----------------------------------------- */
const BrainBoostPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const { handleGameWin, handleCorrect, handleWrong, handleClick } = useGameEvents();
  const handleBackToHub = useCallback(() => setActiveGame(null), []);

  return (
    <div style={{ minHeight: "100vh", borderRadius: 24, overflow: "hidden" }}>
      <AnimatePresence mode="wait">
        {activeGame ? (
          <motion.div key={activeGame.chapter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameShell
              gameTypeId={activeGame.gameTypeId}
              subject={activeGame.subject}
              chapter={activeGame.chapter}
              title={activeGame.title}
              icon={activeGame.icon}
              onExit={handleBackToHub}
              onGameWin={handleGameWin}
              onCorrectAnswer={handleCorrect}
              onWrongAnswer={handleWrong}
              onClickSound={handleClick}
            />
          </motion.div>
        ) : (
          <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Classroom background */}
            <div style={{
              minHeight: "100vh",
              background: `
                radial-gradient(ellipse 80% 40% at 50% 0%, #e8f7dd 0%, transparent 62%),
                radial-gradient(ellipse 60% 60% at 10% 50%, #d8efcb 0%, transparent 55%),
                radial-gradient(ellipse 50% 50% at 90% 60%, #c8e3b8 0%, transparent 55%),
                linear-gradient(180deg,#f5fbe8 0%,#e9f4da 18%,#deedcf 42%,#d4e6c2 68%,#c9dfb4 100%)
              `,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Classroom shelf strip (top right) */}
              <div style={{ position: "absolute", top: 0, right: 0, width: "30%", height: "100%", background: "linear-gradient(90deg, transparent 0%, rgba(99,151,84,0.10) 40%, rgba(99,151,84,0.16) 100%)", pointerEvents: "none", zIndex: 0 }} />
              {/* Floor shadow */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "20%", background: "linear-gradient(0deg, rgba(63,125,72,0.16) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />
              {/* Desk silhouettes */}
              <div style={{ position: "absolute", bottom: 0, left: "5%", width: 120, height: 60, background: "rgba(79,123,88,0.22)", borderRadius: "8px 8px 0 0", pointerEvents: "none", zIndex: 0 }} />
              <div style={{ position: "absolute", bottom: 0, right: "8%", width: 100, height: 50, background: "rgba(63,125,72,0.20)", borderRadius: "8px 8px 0 0", pointerEvents: "none", zIndex: 0 }} />

              {/* Content */}
              <div style={{ position: "relative", zIndex: 1 }}>

            {/* Hero Header */}
            <div style={{ background: "linear-gradient(135deg, #e9f5df 0%, #d4eac7 55%, #b8d5a2 100%)", padding: "18px 28px 28px", borderRadius: "20px 20px 36px 36px", margin: "16px 16px 0", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(63,125,72,0.22), 0 2px 8px rgba(0,0,0,0.10)", border: "2px solid rgba(255,255,255,0.35)" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -30, right: 40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 15, right: 110, width: 55, height: 55, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} style={{ background: "rgba(255,255,255,0.48)", border: "1.5px solid rgba(255,255,255,0.65)", borderRadius: 14, padding: "8px 16px", color: "#2f5f3a", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6, backdropFilter: "blur(6px)" }}>
                ← Back
              </motion.button>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,255,255,0.48)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, flexShrink: 0, boxShadow: "0 6px 20px rgba(63,125,72,0.20)" }}>🧠</motion.div>
                <div>
                  <h1 style={{ color: "#2f5f3a", fontSize: 34, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>Brain Boost</h1>
                  <p style={{ color: "rgba(48,91,62,0.88)", fontSize: 14, margin: "6px 0 0", fontWeight: 600 }}>Challenge your mind with 3 thinking games!</p>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[{ e: "🔢", l: "Patterns" }, { e: "🃏", l: "Memory" }, { e: "🔎", l: "Logic" }].map(({ e, l }) => (
                      <span key={l} style={{ fontSize: 11, fontWeight: 700, color: "#2f5f3a", background: "rgba(255,255,255,0.56)", borderRadius: 10, padding: "4px 12px", display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid rgba(255,255,255,0.66)" }}>
                        {e} {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Cards Grid — 3 columns */}
           <div
              style={{
                padding: "28px 24px 40px",
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(420px, 1fr))",
                justifyContent: "center",
                alignItems: "stretch",
                gap: 28,
                width: "100%",
                maxWidth: "1500px",
                margin: "0 auto"
              }}
            >
              {BRAIN_GAMES.map((game, i) => (
                <BrainGameCard key={game.chapter} game={game} index={i} onPlay={setActiveGame} />
              ))}
            </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrainBoostPage;
