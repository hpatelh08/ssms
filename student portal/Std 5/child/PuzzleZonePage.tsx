/**
 * child/PuzzleZonePage.tsx
 * ─────────────────────────────────────────────────────
 * Puzzle Zone Hub — 3 puzzle/logic games for Std 5.
 * Premium UI: vibrant gradient cards, stars, XP badges.
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell } from "../games/GameShell";
import { useGameEvents } from "./useGameEvents";

/* ── Game definitions ───────────────────────────── */

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

const PUZZLE_GAMES: GameDef[] = [
  {
    gameTypeId: "findThePair",
    subject: "puzzle-zone",
    chapter: "jigsaw-puzzle",
    title: "Jigsaw Puzzle",
    subtitle: "Match the pieces —\nconnect related pairs!",
    icon: "🧩",
    bg: "linear-gradient(160deg, #3b82f6 0%, #2563eb 100%)",
    glow: "rgba(59,130,246,0.40)",
    tag: "Matching",
    tagColor: "#93c5fd",
    xp: 20,
  },
  {
    gameTypeId: "brainMaze",
    subject: "puzzle-zone",
    chapter: "maze-game",
    title: "Maze Game",
    subtitle: "Navigate the maze —\nfind the right path!",
    icon: "🗺️",
    bg: "linear-gradient(160deg, #f97316 0%, #ea580c 100%)",
    glow: "rgba(249,115,22,0.40)",
    tag: "Navigate",
    tagColor: "#fed7aa",
    xp: 20,
  },
  {
    gameTypeId: "logicPuzzle",
    subject: "puzzle-zone",
    chapter: "logic-blocks",
    title: "Logic Blocks",
    subtitle: "Place blocks by rules —\ncrack the logic!",
    icon: "🔷",
    bg: "linear-gradient(160deg, #5f8b3d 0%, #6d28d9 100%)",
    glow: "rgba(95,139,61,0.40)",
    tag: "HARD",
    tagColor: "#ddd6fe",
    xp: 20,
  },
];

/* ── Read stars from localStorage ───────────────── */
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

/* ── Stars display ──────────────────────────────── */
const StarRow: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{ fontSize: 16, opacity: i < count ? 1 : 0.25, filter: i < count ? "drop-shadow(0 0 4px rgba(251,191,36,0.7))" : "none" }}>
        ⭐
      </span>
    ))}
  </div>
);

/* ── Single game card — matching Brain Boost image 2 style ── */
const PuzzleGameCard: React.FC<{
  game: GameDef;
  index: number;
  onPlay: (g: GameDef) => void;
}> = React.memo(({ game, index, onPlay }) => {
  const [pressed, setPressed] = useState(false);
  const isHard = game.tag === "HARD";

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
      {/* HARD badge */}
      {isHard && (
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 10,
          background: "linear-gradient(135deg,#4d7a38,#2f6f3a)",
          color: "#fff", fontSize: 10, fontWeight: 900,
          borderRadius: 8, padding: "3px 10px", letterSpacing: 1,
          boxShadow: "0 2px 8px rgba(79,70,229,0.45)",
        }}>HARD</div>
      )}

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
        <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.13)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -24, left: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.09)", pointerEvents: "none" }} />
        <div style={{
          fontSize: 80, lineHeight: 1,
          filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.22))",
          userSelect: "none",
        }}>
          {game.icon}
        </div>
      </div>

      {/* White bottom area */}
      <div style={{ padding: "22px 22px 26px", display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 19, fontWeight: 900, lineHeight: 1.2 }}>{game.title}</h3>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 12, lineHeight: 1.55, fontWeight: 500, whiteSpace: "pre-line" }}>{game.subtitle}</p>
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
              border: "none", borderRadius: 20, padding: "9px 22px",
              color: "#fff", fontSize: 14, fontWeight: 900,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              boxShadow: `0 4px 14px ${game.glow}`, letterSpacing: 0.5,
            }}
          >
            PLAY <span style={{ fontSize: 11 }}>▶</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
PuzzleGameCard.displayName = "PuzzleGameCard";

/* ── Page ───────────────────────────────────────── */
const PuzzleZonePage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
            {/* Garden / outdoor background */}
            <div style={{
              minHeight: "100vh",
              background: `
                radial-gradient(ellipse 90% 45% at 50% 0%, rgba(255,255,255,0.55) 0%, transparent 60%),
                radial-gradient(ellipse 50% 50% at 15% 60%, rgba(144,238,144,0.30) 0%, transparent 55%),
                radial-gradient(ellipse 50% 50% at 85% 65%, rgba(100,200,100,0.25) 0%, transparent 55%),
                linear-gradient(180deg,
                  #87ceeb 0%,
                  #b0dff5 14%,
                  #c8efc8 14%,
                  #6fcf6f 30%,
                  #4caf50 50%,
                  #388e3c 100%
                )
              `,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Tree silhouettes left */}
              <div style={{ position: "absolute", top: "18%", left: "2%", width: 60, height: 120, background: "radial-gradient(ellipse 60% 50% at 50% 40%, #2e7d32 0%, #1b5e20 100%)", borderRadius: "50% 50% 30% 30%", pointerEvents: "none", zIndex: 0, filter: "blur(1px)", opacity: 0.85 }} />
              <div style={{ position: "absolute", top: "22%", left: "0%", width: 40, height: 80, background: "radial-gradient(ellipse 60% 50% at 50% 40%, #388e3c 0%, #2e7d32 100%)", borderRadius: "50% 50% 30% 30%", pointerEvents: "none", zIndex: 0, filter: "blur(1px)", opacity: 0.75 }} />
              {/* Tree silhouettes right */}
              <div style={{ position: "absolute", top: "16%", right: "2%", width: 65, height: 130, background: "radial-gradient(ellipse 60% 50% at 50% 40%, #2e7d32 0%, #1b5e20 100%)", borderRadius: "50% 50% 30% 30%", pointerEvents: "none", zIndex: 0, filter: "blur(1px)", opacity: 0.85 }} />
              <div style={{ position: "absolute", top: "24%", right: "0%", width: 45, height: 90, background: "radial-gradient(ellipse 60% 50% at 50% 40%, #43a047 0%, #2e7d32 100%)", borderRadius: "50% 50% 30% 30%", pointerEvents: "none", zIndex: 0, filter: "blur(1px)", opacity: 0.75 }} />
              {/* Cloud shapes */}
              <div style={{ position: "absolute", top: "4%", left: "20%", width: 100, height: 36, background: "rgba(255,255,255,0.80)", borderRadius: 50, pointerEvents: "none", zIndex: 0, filter: "blur(2px)" }} />
              <div style={{ position: "absolute", top: "2%", left: "55%", width: 130, height: 42, background: "rgba(255,255,255,0.72)", borderRadius: 50, pointerEvents: "none", zIndex: 0, filter: "blur(2px)" }} />
              {/* Flower dots on ground */}
              {[15,28,42,58,72,86].map((l,i) => (
                <div key={i} style={{ position: "absolute", bottom: `${8+(i%3)*4}%`, left: `${l}%`, fontSize: 16, pointerEvents: "none", zIndex: 0, opacity: 0.7 }}>🌼</div>
              ))}

              {/* Content */}
              <div style={{ position: "relative", zIndex: 1 }}>

            {/* Hero Header */}
            <div style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 55%, #0d9488 100%)", padding: "18px 28px 28px", borderRadius: "20px 20px 36px 36px", margin: "16px 16px 0", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(16,185,129,0.45), 0 2px 8px rgba(0,0,0,0.12)", border: "2px solid rgba(255,255,255,0.18)" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -30, right: 40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 15, right: 110, width: 55, height: 55, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 14, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6, backdropFilter: "blur(6px)" }}>
                ← Back
              </motion.button>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, flexShrink: 0, boxShadow: "0 6px 20px rgba(0,0,0,0.20)" }}>🧩</motion.div>
                <div>
                  <h1 style={{ color: "#fff", fontSize: 34, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>Puzzle Zone</h1>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "6px 0 0", fontWeight: 500 }}>Solve puzzles & discover hidden patterns!</p>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[{ e: "🧩", l: "Matching" }, { e: "🗺️", l: "Navigate" }, { e: "💛", l: "Logic" }].map(({ e, l }) => (
                      <span key={l} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.95)", background: "rgba(255,255,255,0.20)", borderRadius: 10, padding: "4px 12px", display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid rgba(255,255,255,0.22)" }}>
                        {e} {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Cards Grid — 3 columns */}
            <div style={{
              padding: "28px 24px 40px",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(420px, 1fr))",
              justifyContent: "center",
              alignItems: "stretch",
              gap: 28,
              width: "100%",
              maxWidth: "1500px",
              margin: "0 auto"
            }}>
              {PUZZLE_GAMES.map((game, i) => (
                <PuzzleGameCard key={game.chapter} game={game} index={i} onPlay={setActiveGame} />
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

export default PuzzleZonePage;
