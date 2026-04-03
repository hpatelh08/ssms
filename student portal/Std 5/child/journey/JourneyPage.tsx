import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  computeJourneySnapshot,
  type JourneyNodeSnapshot,
  type JourneySectionSnapshot,
} from './journeyEngine';
import { getJourneyIcon, getJourneyMedal, journeyAssets } from './journeyAssets';

interface JourneyPageProps {
  onBack: () => void;
}

interface Point {
  x: number;
  y: number;
}

const TOP_PADDING = 120;
const STEP_Y = 120;
const MIN_MAP_WIDTH = 360;
const END_OFFSET_FROM_LAST_NODE = 72;
const END_BOTTOM_PADDING = 34;
const BACKGROUND_IMAGE_RATIO = 1536 / 1024;
const BACKGROUND_OVERLAP = 500;

function buildNodePoints(mapWidth: number, count: number): Point[] {
  const centerX = mapWidth / 2;
  const swing = Math.max(72, Math.min(188, mapWidth * 0.24));
  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    x: centerX + (index % 2 === 0 ? -swing : swing),
    y: TOP_PADDING + index * STEP_Y,
  }));
}

function buildSvgPath(points: Point[]): string {
  if (!points.length) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlY = (current.y + next.y) / 2;
    d += ` Q ${current.x} ${controlY} ${next.x} ${next.y}`;
  }
  return d;
}

function nodeBaseImage(state: JourneyNodeSnapshot['state']): string {
  if (state === 'completed') return journeyAssets.achievements.completed;
  if (state === 'active') return journeyAssets.achievements.available;
  return journeyAssets.achievements.locked;
}

function metricLabel(value: number): string {
  return `${value}%`;
}

const JourneyPage: React.FC<JourneyPageProps> = ({ onBack }) => {
  const [snapshot, setSnapshot] = useState(() => computeJourneySnapshot());
  const [selectedNode, setSelectedNode] = useState<JourneyNodeSnapshot | null>(null);
  const [mapWidth, setMapWidth] = useState(MIN_MAP_WIDTH);
  const [shellWidth, setShellWidth] = useState(MIN_MAP_WIDTH);
  const [activeSectionId, setActiveSectionId] = useState<JourneySectionSnapshot['id'] | null>(null);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refresh = () => setSnapshot(computeJourneySnapshot());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    const updateShellWidth = () => {
      const next = shellRef.current?.clientWidth ?? MIN_MAP_WIDTH;
      setShellWidth(Math.max(MIN_MAP_WIDTH, next));
    };

    updateShellWidth();
    window.addEventListener('resize', updateShellWidth);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateShellWidth) : null;
    if (shellRef.current && observer) observer.observe(shellRef.current);

    return () => {
      window.removeEventListener('resize', updateShellWidth);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      const next = scrollRef.current?.clientWidth ?? layoutRef.current?.clientWidth ?? MIN_MAP_WIDTH;
      setMapWidth(Math.max(MIN_MAP_WIDTH, next));
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateWidth) : null;
    if (observer) {
      if (layoutRef.current) observer.observe(layoutRef.current);
      if (scrollRef.current) observer.observe(scrollRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      observer?.disconnect();
    };
  }, []);

  const sectionMap = useMemo(() => {
    const map = new Map<JourneySectionSnapshot['id'], JourneySectionSnapshot>();
    for (const section of snapshot.sections) map.set(section.id, section);
    return map;
  }, [snapshot.sections]);

  const points = useMemo(() => buildNodePoints(mapWidth, snapshot.nodes.length), [mapWidth, snapshot.nodes.length]);
  const sectionFirstPointMap = useMemo(() => {
    const map = new Map<JourneySectionSnapshot['id'], Point>();
    for (const node of snapshot.nodes) {
      if (map.has(node.sectionId)) continue;
      const point = points[node.globalIndex];
      if (point) map.set(node.sectionId, point);
    }
    return map;
  }, [snapshot.nodes, points]);
  const pathD = useMemo(() => buildSvgPath(points), [points]);
  const lastNodeY = points[points.length - 1]?.y ?? TOP_PADDING;
  const endPillTop = lastNodeY + END_OFFSET_FROM_LAST_NODE;
  const mapHeight = endPillTop + 34 + END_BOTTOM_PADDING;
  const backgroundTileHeight = mapWidth * BACKGROUND_IMAGE_RATIO;
  const backgroundStep = Math.max(120, backgroundTileHeight - BACKGROUND_OVERLAP);
  const backgroundTileCount = Math.max(1, Math.ceil((mapHeight + BACKGROUND_OVERLAP) / backgroundStep) + 1);
  const backgroundTiles = useMemo(
    () => Array.from({ length: backgroundTileCount }, (_, index) => index * backgroundStep),
    [backgroundTileCount, backgroundStep],
  );
  const completedRatio =
    snapshot.totalMilestones <= 1 ? 0 : snapshot.completedMilestones / (snapshot.totalMilestones - 1);
  const useSplitLayout = shellWidth >= 1180;

  useEffect(() => {
    if (!snapshot.activeNodeId || !scrollRef.current) return;
    const activeNode = snapshot.nodes.find((node) => node.id === snapshot.activeNodeId);
    if (!activeNode) return;
    const point = points[activeNode.globalIndex];
    if (!point) return;
    const target = Math.max(0, point.y - 260);
    scrollRef.current.scrollTo({ top: target, behavior: 'smooth' });
  }, [snapshot.activeNodeId, snapshot.nodes, points]);

  useEffect(() => {
    if (activeSectionId || !snapshot.sections.length) return;
    setActiveSectionId(snapshot.sections[0].id);
  }, [activeSectionId, snapshot.sections]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg,#edf8e7 0%,#dcecd4 24%,#d0e4c4 52%,#c4dcb6 100%)',
      }}
    >
      <div
        ref={shellRef}
        style={{
          width: 'min(100%, 1460px)',
          margin: '0 auto',
          padding: '12px 10px 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: useSplitLayout ? '320px minmax(0,1fr)' : '1fr',
            gap: 12,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              borderRadius: 24,
              padding: '14px 14px 16px',
              background: 'linear-gradient(135deg, rgba(52,104,67,0.95), rgba(95,139,61,0.92))',
              border: '1px solid rgba(225,241,205,0.45)',
              boxShadow: '0 18px 30px rgba(52,104,67,0.28)',
              color: '#fff',
              position: useSplitLayout ? 'sticky' : 'relative',
              top: useSplitLayout ? 10 : undefined,
              zIndex: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                style={{
                  border: '1px solid rgba(225,241,205,0.45)',
                  background: 'rgba(236,247,226,0.18)',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontWeight: 800,
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
                aria-label="Back"
              >
                {'<'}
              </motion.button>

              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>LEARNING JOURNEY</p>
                <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 700 }}>
                  {snapshot.completedMilestones}/{snapshot.totalMilestones} milestones
                </p>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  width: '100%',
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(225,241,205,0.28)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${snapshot.overallProgress}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg,#c4df86,#86b35d,#4f8a50)',
                  }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700 }}>
                Overall Progress: {snapshot.overallProgress}%
              </p>
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              {snapshot.sections.map((section) => (
                <motion.button
                  key={section.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    const point = sectionFirstPointMap.get(section.id);
                    if (!point || !scrollRef.current) return;
                    scrollRef.current.scrollTo({
                      top: Math.max(0, point.y - 210),
                      behavior: 'smooth',
                    });
                  }}
                  style={{
                    borderRadius: 18,
                    border:
                      activeSectionId === section.id
                        ? '1px solid rgba(225,241,205,0.78)'
                        : '1px solid rgba(225,241,205,0.32)',
                    background:
                      activeSectionId === section.id
                        ? 'linear-gradient(135deg, rgba(236,247,226,0.44), rgba(206,228,191,0.3))'
                        : 'linear-gradient(135deg, rgba(236,247,226,0.28), rgba(206,228,191,0.18))',
                    padding: '12px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    minHeight: 88,
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow:
                      activeSectionId === section.id
                        ? '0 0 0 1px rgba(225,241,205,0.32), 0 10px 18px rgba(28,62,43,0.18)'
                        : '0 8px 14px rgba(28,62,43,0.12)',
                  }}
                >
                  <img
                    src={getJourneyIcon(section.visualKey)}
                    alt=""
                    draggable={false}
                    style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 900,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {section.label}
                    </p>
                    <p
                      style={{
                        margin: '5px 0 0',
                        fontSize: 12,
                        fontWeight: 700,
                        opacity: 0.95,
                        textTransform: 'capitalize',
                      }}
                    >
                      {section.metrics.total}% - {section.currentLeague}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div
            ref={layoutRef}
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid rgba(225,241,205,0.45)',
              boxShadow: '0 20px 36px rgba(52,104,67,0.16)',
              background: 'rgba(240,249,234,0.46)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              ref={scrollRef}
              style={{
                position: 'relative',
                height: '77vh',
                minHeight: 620,
                overflowY: 'auto',
              }}
            >
            <div style={{ position: 'relative', minHeight: mapHeight }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {backgroundTiles.map((top, index) => (
                  <div
                    key={`bg-tile-${index}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top,
                      width: '100%',
                      height: backgroundTileHeight,
                      backgroundImage: `url(${index === 0 ? journeyAssets.background : journeyAssets.path})`,
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '100% 100%',
                      opacity: 1,
                    }}
                  />
                ))}
              </div>

              <svg
                width="100%"
                height={mapHeight}
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                <defs>
                  <linearGradient id="journey-progress-line" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c5d766" />
                    <stop offset="35%" stopColor="#7cae55" />
                    <stop offset="100%" stopColor="#3f8f3a" />
                  </linearGradient>
                </defs>
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(255,255,255,0.78)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#journey-progress-line)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={Math.max(0.003, 1 - completedRatio)}
                />
              </svg>


              {snapshot.nodes.map((node) => {
                const point = points[node.globalIndex];
                if (!point) return null;

                const isLocked = node.state === 'locked';
                const isActive = node.state === 'active';
                const isComplete = node.state === 'completed';

                const size = node.nodeType === 'medal' ? 108 : 88;
                const centerAsset =
                  node.nodeType === 'medal'
                    ? getJourneyMedal(node.sectionVisualKey)
                    : getJourneyIcon(node.sectionVisualKey);

                return (
                  <div key={node.id}>
                    <motion.button
                      whileHover={isLocked ? {} : { scale: 1.05 }}
                      whileTap={isLocked ? {} : { scale: 0.95 }}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        if (!isLocked) setSelectedNode(node);
                      }}
                      style={{
                        position: 'absolute',
                        left: point.x - size / 2,
                        top: point.y - size / 2,
                        width: size,
                        height: size,
                        border: 'none',
                        background: 'transparent',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        padding: 0,
                        zIndex: 14,
                        filter: isLocked ? 'grayscale(1) opacity(0.85)' : 'none',
                      }}
                    >
                      <img
                        src={nodeBaseImage(node.state)}
                        alt=""
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: isActive ? 'drop-shadow(0 0 14px rgba(34,197,94,0.7))' : 'none',
                        }}
                      />
                      <img
                        src={centerAsset}
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: node.nodeType === 'medal' ? 64 : 42,
                          height: node.nodeType === 'medal' ? 64 : 42,
                          transform: 'translate(-50%, -50%)',
                          objectFit: 'contain',
                          opacity: isLocked ? 0.6 : 1,
                        }}
                      />

                      {isActive && (
                        <img
                          src={journeyAssets.effects.sparkle}
                          alt=""
                          draggable={false}
                          style={{
                            position: 'absolute',
                            right: -10,
                            top: -12,
                            width: 38,
                            height: 38,
                            objectFit: 'contain',
                          }}
                        />
                      )}

                      {isComplete && node.isNewlyUnlocked && (
                        <img
                          src={journeyAssets.effects.confetti}
                          alt=""
                          draggable={false}
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: -18,
                            width: 62,
                            height: 62,
                            transform: 'translateX(-50%)',
                            objectFit: 'contain',
                          }}
                        />
                      )}
                    </motion.button>

                    {node.showSectionTag && (
                      <div
                        style={{
                          position: 'absolute',
                          left: point.x + (node.globalIndex % 2 === 0 ? -178 : 44),
                          top: point.y - 56,
                          borderRadius: 999,
                          padding: '5px 10px',
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#2f5f3d',
                          background: 'rgba(243,250,236,0.95)',
                          border: '1px solid rgba(143,184,108,0.3)',
                          whiteSpace: 'nowrap',
                          zIndex: 12,
                        }}
                      >
                        {node.sectionLabel}
                      </div>
                    )}

                    {node.showLeagueTag && (
                      <div
                        style={{
                          position: 'absolute',
                          left: point.x + (node.globalIndex % 2 === 0 ? 52 : -130),
                          top: point.y + 24,
                          borderRadius: 10,
                          padding: '3px 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#476b53',
                          background: 'rgba(238,247,230,0.92)',
                          border: '1px solid rgba(143,184,108,0.32)',
                          zIndex: 11,
                        }}
                      >
                        {node.leagueLabel}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.52)',
              display: 'grid',
              placeItems: 'center',
              padding: 14,
              zIndex: 130,
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 22,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 24px 44px rgba(15,23,42,0.25)',
              }}
            >
              {(() => {
                const section = sectionMap.get(selectedNode.sectionId);
                if (!section) return null;
                return (
                  <>
                    <div
                      style={{
                        padding: '14px 16px',
                        color: '#fff',
                        background: section.gradient,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, opacity: 0.96 }}>{section.label}</p>
                      <h3 style={{ margin: '4px 0 0', fontSize: 24, lineHeight: 1.15, fontWeight: 900 }}>
                        {selectedNode.leagueLabel}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.94 }}>
                        Milestone target: {selectedNode.threshold}%
                      </p>
                    </div>

                    <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#446a4f', fontWeight: 700 }}>
                        Section Progress: <b>{section.metrics.total}%</b>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#446a4f' }}>
                        Levels/Tasks: <b>{metricLabel(section.metrics.levelsTasks)}</b>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#446a4f' }}>
                        Subject Quizzes: <b>{metricLabel(section.metrics.subjectQuizzes)}</b>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#446a4f' }}>
                        Videos: <b>{metricLabel(section.metrics.videos)}</b>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#446a4f' }}>
                        Books: <b>{metricLabel(section.metrics.books)}</b>
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedNode(null)}
                        style={{
                          marginTop: 6,
                          border: 'none',
                          borderRadius: 12,
                          padding: '10px 12px',
                          fontWeight: 900,
                          color: '#fff',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg,#3f8f3a,#5f8b3d)',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JourneyPage;

