const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8');

// ------------------------------------------------------------------
// 1. Remove the old chainSegments computation (no longer needed)
// ------------------------------------------------------------------
const chainVarOld = `\r\n  const chainSegments = positions.slice(0, -1).map((pos, i) => {\r\n    const next = positions[i + 1];\r\n    const x1 = (pos.left  / 100) * containerWidth;\r\n    const y1 = (pos.top   / 100) * CONTAINER_H;\r\n    const x2 = (next.left / 100) * containerWidth;\r\n    const y2 = (next.top  / 100) * CONTAINER_H;\r\n    const dx = x2 - x1, dy = y2 - y1;\r\n    const length = Math.sqrt(dx * dx + dy * dy);\r\n    const angle  = Math.atan2(dy, dx) * (180 / Math.PI);\r\n    return { midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, length, angle, key: i };\r\n  });`;

if (s.includes(chainVarOld)) {
  s = s.replace(chainVarOld, '');
  console.log('Removed chainSegments var');
} else {
  // try LF
  const lf = chainVarOld.replace(/\r\n/g, '\n');
  if (s.includes(lf)) {
    s = s.replace(lf, '');
    console.log('Removed chainSegments var (LF)');
  } else {
    console.error('chainSegments var NOT found');
  }
}

// ------------------------------------------------------------------
// 2. Replace the broken <img> chain renderer with SVG gold chain
// ------------------------------------------------------------------
const oldRender = `{/* ── Gold chain connectors between levels ── */}
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
      ))}`;

const newRender = `{/* ── Gold chain SVG ── */}
      <svg
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        viewBox={\`0 0 \${containerWidth} \${CONTAINER_H}\`}
        preserveAspectRatio="none"
      >
        {positions.slice(0, -1).map((pos, idx) => {
          const next = positions[idx + 1];
          const x1 = (pos.left  / 100) * containerWidth;
          const y1 = (pos.top   / 100) * CONTAINER_H;
          const x2 = (next.left / 100) * containerWidth;
          const y2 = (next.top  / 100) * CONTAINER_H;
          return (
            <g key={idx}>
              {/* deep shadow */}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(0,0,0,0.45)" strokeWidth={22} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* dark gold border */}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#7A4500" strokeWidth={18} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* main gold fill */}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#C87800" strokeWidth={13} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* bright gold */}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#FFD700" strokeWidth={8} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* shine highlight */}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,200,0.55)" strokeWidth={3} strokeLinecap="round"
                strokeDasharray="26 14" />
            </g>
          );
        })}
      </svg>`;

// Normalize for matching
const normalizeWS = str => str.replace(/\r\n/g, '\n');
if (normalizeWS(s).includes(normalizeWS(oldRender))) {
  s = normalizeWS(s).replace(normalizeWS(oldRender), newRender);
  console.log('Replaced chain img with SVG chain');
} else {
  console.error('OLD RENDER BLOCK NOT FOUND');
  process.exit(1);
}

fs.writeFileSync(p, s, 'utf8');
console.log('\nFinal checks:');
console.log('chainSegments gone:', !s.includes('chainSegments'));
console.log('SVG chain present:', s.includes('Gold chain SVG'));
console.log('chain.png gone:', !s.includes('chain.png'));
