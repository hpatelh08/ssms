import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getDifficultyLabel,
  getDailyRemainingNewLevels,
  hasReachedDailyLimit,
  isLevelCompleted,
  type SaveOceanProgress,
} from './saveTheOceanLevelSystem';

interface SaveTheOceanLevelMapProps {
  progress: SaveOceanProgress;
  onSelectLevel: (levelNumber: number) => void;
}

interface NodePoint {
  level: number;
  x: number;
  y: number;
}

const LEVELS_PER_PAGE = 60;
const LEVELS_PER_ROW = 6;
const HORIZONTAL_GAP = 140;
const VERTICAL_GAP = 120;
const NODE_SIZE = 62;
const SIDE_PADDING = 58;
const TOP_PADDING = 70;

interface PositionConfig {
  totalLevels: number;
  levelsPerRow: number;
  horizontalGap: number;
  verticalGap: number;
  sidePadding: number;
  topPadding: number;
  curveOffset?: number;
}

function clampPage(page: number): number {
  return Math.max(1, page);
}

function generateLevelPositions(config: PositionConfig): NodePoint[] {
  const {
    totalLevels,
    levelsPerRow,
    horizontalGap,
    verticalGap,
    sidePadding,
    topPadding,
    curveOffset = 0,
  } = config;

  return Array.from({ length: totalLevels }).map((_, index) => {
    const row = Math.floor(index / levelsPerRow);
    const col = index % levelsPerRow;
    const isReverse = row % 2 !== 0;
    const snakeCol = isReverse ? (levelsPerRow - 1 - col) : col;

    return {
      level: index + 1,
      x: sidePadding + snakeCol * horizontalGap,
      y: topPadding + row * verticalGap + (curveOffset === 0 ? 0 : Math.sin((col / (levelsPerRow - 1)) * Math.PI) * curveOffset),
    };
  });
}

function getPathD(points: NodePoint[]): string {
  if (!points.length) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${midX} ${prev.y}, ${midX} ${midY}`;
    d += ` Q ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function levelNodeStyle(state: 'locked' | 'current' | 'completed' | 'replay') {
  if (state === 'completed') {
    return {
      bg: 'linear-gradient(145deg, #7ad9c3, #57bfa4)',
      border: '2px solid rgba(244,255,251,0.95)',
      color: '#ffffff',
      opacity: 1,
    };
  }
  if (state === 'current') {
    return {
      bg: 'linear-gradient(145deg, #f7d89f, #f0b1c6)',
      border: '2px solid rgba(255,249,234,0.96)',
      color: '#24515c',
      opacity: 1,
    };
  }
  return {
    bg: 'linear-gradient(145deg, #77cfe3, #58b8cf)',
    border: '2px solid rgba(233,251,255,0.94)',
    color: '#ffffff',
    opacity: 1,
  };
}

export const SaveTheOceanLevelMap: React.FC<SaveTheOceanLevelMapProps> = ({
  progress,
  onSelectLevel,
}) => {
  const [containerWidth, setContainerWidth] = useState(900);
  const [pathLen, setPathLen] = useState(0);
  const [page, setPage] = useState(() => Math.max(1, Math.ceil((progress.lastPlayedLevel || 1) / LEVELS_PER_PAGE)));
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setPage(clampPage(Math.ceil((progress.lastPlayedLevel || 1) / LEVELS_PER_PAGE)));
  }, [progress.lastPlayedLevel]);

  const pageStart = (page - 1) * LEVELS_PER_PAGE + 1;
  const pageEnd = pageStart + LEVELS_PER_PAGE - 1;
  const pageLevels = useMemo(() => Array.from({ length: LEVELS_PER_PAGE }, (_, i) => pageStart + i), [pageStart]);

  const points = useMemo(() => {
    const maxMapWidth = 900;
    const usable = Math.min(maxMapWidth, Math.max(620, containerWidth));
    const dynamicGap = (usable - SIDE_PADDING * 2) / (LEVELS_PER_ROW - 1);

    const relativePositions = generateLevelPositions({
      totalLevels: LEVELS_PER_PAGE,
      levelsPerRow: LEVELS_PER_ROW,
      horizontalGap: dynamicGap,
      verticalGap: VERTICAL_GAP,
      sidePadding: SIDE_PADDING,
      topPadding: TOP_PADDING,
      curveOffset: 0,
    });

    return relativePositions.map((p, i) => ({ ...p, level: pageLevels[i] }));
  }, [containerWidth, pageLevels]);

  const pathD = useMemo(() => getPathD(points), [points]);

  useEffect(() => {
    if (!pathRef.current) return;
    try {
      setPathLen(pathRef.current.getTotalLength());
    } catch {
      setPathLen(0);
    }
  }, [pathD]);

  const mapHeight = useMemo(() => {
    const rows = Math.ceil(pageLevels.length / LEVELS_PER_ROW);
    return TOP_PADDING + Math.max(0, rows - 1) * VERTICAL_GAP + 120;
  }, [pageLevels.length]);

  const dailyRemaining = getDailyRemainingNewLevels(progress);
  const limitReached = hasReachedDailyLimit(progress);

  return (
    <div>
      <div
        style={{
          borderRadius: 24,
          border: '1px solid rgba(157,221,232,0.62)',
          background: 'linear-gradient(180deg, rgba(249,255,255,0.96) 0%, rgba(234,249,252,0.95) 68%, rgba(238,252,248,0.94) 100%)',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 14px 36px rgba(97,170,183,0.16), inset 0 1px 0 rgba(255,255,255,0.75)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 24 }}>🧭</span>
          <span style={{ fontWeight: 900, color: '#1f6673', fontSize: 18, fontFamily: 'Nunito, sans-serif' }}>
            Ocean Level Path: {pageStart}-{pageEnd}
          </span>
          <span style={{ fontWeight: 700, color: '#2b6f80', fontSize: 13, padding: '4px 10px', borderRadius: 999, background: 'rgba(221,246,251,0.96)', border: '1px solid rgba(161,219,230,0.45)' }}>
            {getDifficultyLabel(pageStart)} to {getDifficultyLabel(pageEnd)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: '#226979', fontSize: 13, padding: '4px 10px', borderRadius: 999, background: 'rgba(225,250,246,0.96)', border: '1px solid rgba(161,219,210,0.45)' }}>
            Today: {5 - dailyRemaining}/5 new levels
          </span>
          {limitReached && (
            <span style={{ fontWeight: 800, color: '#8b5b3d', fontSize: 13, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,236,208,0.96)', border: '1px solid rgba(245,205,154,0.42)' }}>
              Daily limit reached
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: 28,
          overflow: 'hidden',
          border: '1px solid rgba(163,223,233,0.62)',
          backgroundImage:
            "linear-gradient(180deg, rgba(246,253,255,0.28) 0%, rgba(204,239,246,0.18) 42%, rgba(202,242,236,0.16) 100%), url('/background/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'screen',
          filter: 'saturate(0.98) contrast(1.01)',
          boxShadow: '0 16px 40px rgba(97,170,183,0.18)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 12% 16%, rgba(255,255,255,0.48) 0, rgba(255,255,255,0.12) 6%, transparent 7%), radial-gradient(circle at 84% 18%, rgba(255,255,255,0.42) 0, rgba(255,255,255,0.08) 5%, transparent 6%), linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 18%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-8%',
            right: '-8%',
            top: '8%',
            height: 90,
            pointerEvents: 'none',
            background: 'radial-gradient(120% 90% at 50% 100%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 54%, transparent 55%)',
            opacity: 0.9,
          }}
        />
        <div
          ref={mapContainerRef}
          style={{
            position: 'relative',
            minHeight: mapHeight,
            paddingBottom: 24,
          }}
        >
          <svg
            width="100%"
            height={mapHeight}
            viewBox={`0 0 ${containerWidth} ${mapHeight}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id="ocean-path-line" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#72cfe2" />
                <stop offset="50%" stopColor="#82d8d7" />
                <stop offset="100%" stopColor="#8dd8b9" />
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="rgba(106,186,205,0.24)"
              strokeWidth={28}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <motion.path
              ref={pathRef}
              d={pathD}
              fill="none"
              stroke="url(#ocean-path-line)"
              strokeWidth={14}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              initial={{ strokeDasharray: pathLen || 1, strokeDashoffset: pathLen || 1 }}
              animate={{ strokeDasharray: pathLen || 1, strokeDashoffset: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>

          {points.map((node) => {
            const completed = isLevelCompleted(progress, node.level);
            const isCurrent = node.level === progress.highestUnlockedLevel && !completed;
            const canPlay = true;
            const state = completed ? 'completed' : isCurrent ? 'current' : 'replay';
            const style = levelNodeStyle(state);
            const starCount = progress.completedLevels[node.level]?.bestStars ?? 0;

            return (
              <motion.button
                key={`ocean-node-${node.level}`}
                onClick={() => canPlay && onSelectLevel(node.level)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  transform: 'translate(-50%, -50%)',
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  borderRadius: '50%',
                  border: style.border,
                  background: style.bg,
                  color: style.color,
                  opacity: style.opacity,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1,
                  padding: 0,
                  cursor: canPlay ? 'pointer' : 'not-allowed',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: 16,
                  zIndex: isCurrent ? 3 : 2,
                  boxShadow: isCurrent
                    ? '0 0 0 6px rgba(252,231,186,0.45), 0 12px 24px rgba(227,168,184,0.28)'
                    : completed
                      ? '0 10px 18px rgba(87,191,164,0.26)'
                      : '0 8px 16px rgba(88,184,207,0.24)',
                }}
              >
                {node.level}
                {completed && (
                  <span style={{ position: 'absolute', top: -10, right: -8, fontSize: 20 }}>✅</span>
                )}
                {node.level % 25 === 0 && (
                  <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 16 }}>🏁</span>
                )}
                {completed && starCount > 0 && (
                  <span style={{ position: 'absolute', bottom: -17, left: '50%', transform: 'translateX(-50%)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {'⭐'.repeat(starCount)}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => setPage((prev) => clampPage(prev - 1))}
          disabled={page <= 1}
          style={{
            border: 'none',
            padding: '10px 14px',
            borderRadius: 12,
            background: page <= 1 ? 'rgba(153,178,186,0.55)' : 'linear-gradient(135deg, #74cddd, #5cb8ce)',
            color: '#fff',
            fontWeight: 800,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            fontFamily: 'Nunito, sans-serif',
            boxShadow: page <= 1 ? 'none' : '0 10px 20px rgba(92,184,206,0.22)',
          }}
        >
          ← Previous
        </button>

        <div style={{ alignSelf: 'center', fontSize: 13, fontWeight: 800, color: '#275e6c', fontFamily: 'Nunito, sans-serif' }}>
          Page {page}
        </div>

        <button
          onClick={() => setPage((prev) => clampPage(prev + 1))}
          disabled={false}
          style={{
            border: 'none',
            padding: '10px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #74cddd, #5cb8ce)',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
            boxShadow: '0 10px 20px rgba(92,184,206,0.22)',
          }}
        >
          Next →
        </button>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        <LegendPill color="linear-gradient(145deg, #f59e0b, #ea580c)" label="Current" />
        <LegendPill color="linear-gradient(145deg, #22c55e, #16a34a)" label="Completed" />
        <LegendPill color="linear-gradient(145deg, #38bdf8, #0284c7)" label="Replay" />
      </div>
    </div>
  );
};

const LegendPill: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      padding: '5px 10px',
      background: 'rgba(255,255,255,0.78)',
      border: '1px solid rgba(171,221,230,0.72)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    }}
  >
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
    <span style={{ fontSize: 12, fontWeight: 800, color: '#365f69', fontFamily: 'Nunito, sans-serif' }}>{label}</span>
  </div>
);

export default SaveTheOceanLevelMap;
