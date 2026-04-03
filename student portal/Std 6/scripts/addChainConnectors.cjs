const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8');

// 1. Add useRef to the React import
s = s.replace(
  "import React, { useMemo, useCallback, useEffect, useState } from 'react';",
  "import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';"
);

// 2. Replace RailwayLevelMap inner body — add containerRef, containerWidth, and chain connectors
s = s.replace(
  `}> = React.memo(({ total, difficulty, meta, getStatus, onSelect }) => {
  const positions = MINE_ROAD_POSITIONS.slice(0, total);

  return (
    <div
      className="lg-mine-map"
      style={{`,
  `}> = React.memo(({ total, difficulty, meta, getStatus, onSelect }) => {
  const positions = MINE_ROAD_POSITIONS.slice(0, total);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const CONTAINER_H = 3800;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width || 600);
    return () => ro.disconnect();
  }, []);

  // Compute chain segment props between consecutive level nodes
  const chainSegments = positions.slice(0, -1).map((pos, i) => {
    const next = positions[i + 1];
    const x1 = (pos.left  / 100) * containerWidth;
    const y1 = (pos.top   / 100) * CONTAINER_H;
    const x2 = (next.left / 100) * containerWidth;
    const y2 = (next.top  / 100) * CONTAINER_H;
    const dx = x2 - x1, dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
    return { midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, length, angle, key: i };
  });

  return (
    <div
      ref={containerRef}
      className="lg-mine-map"
      style={{`
);

// 3. Insert chain segment renders BEFORE the level positions map
s = s.replace(
  `      {positions.map((pos, i) => {`,
  `      {/* ── Gold chain connectors between levels ── */}
      {chainSegments.map(seg => (
        <img
          key={\`chain-\${seg.key}\`}
          src="/assets/connectors/chain.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: seg.midX,
            top:  seg.midY,
            width: seg.length,
            height: 52,
            objectFit: 'fill',
            transform: \`translate(-50%, -50%) rotate(\${seg.angle}deg)\`,
            transformOrigin: 'center center',
            zIndex: 3,
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: 0.92,
            filter: 'drop-shadow(0 2px 6px rgba(180,120,0,0.5))',
          }}
        />
      ))}

      {positions.map((pos, i) => {`
);

fs.writeFileSync(p, s, 'utf8');
console.log('Done. Checks:');
console.log('useRef imported:', s.includes('useRef'));
console.log('containerRef added:', s.includes('containerRef'));
console.log('chainSegments added:', s.includes('chainSegments'));
console.log('chain img rendered:', s.includes('chain.png'));
