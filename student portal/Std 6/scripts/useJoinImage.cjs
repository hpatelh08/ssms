const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// Find exact start and end of the block to replace
const startMarker = '{/* ── Gold chain SVG ── */}';
const endMarker   = '\n\n      {positions.map((pos, i) =>';

const startIdx = s.indexOf(startMarker);
const endIdx   = s.indexOf(endMarker, startIdx);

if (startIdx === -1) { console.error('START MARKER NOT FOUND'); process.exit(1); }
if (endIdx   === -1) { console.error('END MARKER NOT FOUND');   process.exit(1); }

const before = s.slice(0, startIdx);
const after  = s.slice(endIdx); // keeps the \n\n      {positions.map...

const newBlock = `{/* ── Image chain connectors ── */}
      {positions.slice(0, -1).map((pos, idx) => {
        const next = positions[idx + 1];
        const x1 = (pos.left  / 100) * containerWidth;
        const y1 = (pos.top   / 100) * CONTAINER_H;
        const x2 = (next.left / 100) * containerWidth;
        const y2 = (next.top  / 100) * CONTAINER_H;
        const dx = x2 - x1, dy = y2 - y1;
        const dist  = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <img
            key={\`conn-\${idx}\`}
            src="/assets/buttons/join the level.png"
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: mx,
              top: my,
              width: dist,
              height: 52,
              objectFit: 'fill',
              transform: \`translate(-50%, -50%) rotate(\${angle}deg)\`,
              transformOrigin: 'center center',
              zIndex: 3,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        );
      })}`;

s = before + newBlock + after;
fs.writeFileSync(p, s, 'utf8');

console.log('Done. Checks:');
console.log('img connector present:', s.includes('join the level.png'));
console.log('SVG gone:', !s.includes('<svg'));
console.log('old path gone:', !s.includes('strokeDasharray'));
