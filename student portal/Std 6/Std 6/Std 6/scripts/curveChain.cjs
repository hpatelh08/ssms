const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8');

// Normalize to LF for easier matching
s = s.replace(/\r\n/g, '\n');

const oldBlock = `        {positions.slice(0, -1).map((pos, idx) => {
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
        })}`;

const newBlock = `        {positions.slice(0, -1).map((pos, idx) => {
          const next = positions[idx + 1];
          const x1 = (pos.left  / 100) * containerWidth;
          const y1 = (pos.top   / 100) * CONTAINER_H;
          const x2 = (next.left / 100) * containerWidth;
          const y2 = (next.top  / 100) * CONTAINER_H;
          // Midpoint
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          // Perpendicular sag: rotate 90°, scale by sag factor
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const sag = Math.min(len * 0.22, 60); // sag depth, capped at 60px
          // Sag always downward: perp unit vector (rotated 90° clockwise)
          const px = -dy / len, py = dx / len;
          // Control point for quadratic bezier — sagged toward bottom of arc
          const cpx = mx + px * sag;
          const cpy = my + py * sag;
          const d = \`M\${x1},\${y1} Q\${cpx},\${cpy} \${x2},\${y2}\`;
          return (
            <g key={idx}>
              {/* deep shadow */}
              <path d={d} fill="none"
                stroke="rgba(0,0,0,0.45)" strokeWidth={22} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* dark gold border */}
              <path d={d} fill="none"
                stroke="#7A4500" strokeWidth={18} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* main gold fill */}
              <path d={d} fill="none"
                stroke="#C87800" strokeWidth={13} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* bright gold */}
              <path d={d} fill="none"
                stroke="#FFD700" strokeWidth={8} strokeLinecap="round"
                strokeDasharray="26 14" />
              {/* shine highlight */}
              <path d={d} fill="none"
                stroke="rgba(255,255,200,0.55)" strokeWidth={3} strokeLinecap="round"
                strokeDasharray="26 14" />
            </g>
          );
        })}`;

if (s.includes(oldBlock)) {
  s = s.replace(oldBlock, newBlock);
  console.log('Replaced lines with curved paths');
} else {
  console.error('OLD BLOCK NOT FOUND');
  process.exit(1);
}

fs.writeFileSync(p, s, 'utf8');
console.log('Done. Curved path present:', s.includes('Q${cpx},${cpy}') || s.includes('Q${cpx},${cpy}') || s.includes('cpx'));
