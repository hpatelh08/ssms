const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8');

// Use CRLF-aware replacement
const oldStr = '}> = React.memo(({ total, difficulty, meta, getStatus, onSelect }) => {\r\n  const positions = MINE_ROAD_POSITIONS.slice(0, total);';
const newStr = `}> = React.memo(({ total, difficulty, meta, getStatus, onSelect }) => {
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
  });`.replace(/\n/g, '\r\n');

if (!s.includes(oldStr)) {
  console.error('OLD STRING NOT FOUND! Trying LF-only search...');
  const oldStrLF = oldStr.replace(/\r\n/g, '\n');
  if (s.includes(oldStrLF)) {
    console.log('LF version found, using that');
    s = s.replace(oldStrLF, newStr.replace(/\r\n/g, '\n'));
  } else {
    console.error('STILL NOT FOUND - dumping nearby content:');
    const idx = s.indexOf('MINE_ROAD_POSITIONS.slice(0, total)');
    console.log(JSON.stringify(s.slice(Math.max(0,idx-100), idx+50)));
    process.exit(1);
  }
} else {
  s = s.replace(oldStr, newStr);
}

// Also add ref={containerRef} to the div
s = s.replace(
  /(<div\s*\r?\n\s*className="lg-mine-map")/,
  '<div\r\n      ref={containerRef}\r\n      className="lg-mine-map"'
);

fs.writeFileSync(p, s, 'utf8');
console.log('Done. Checks:');
console.log('containerRef var:', s.includes('containerRef'));
console.log('ref={containerRef}:', s.includes('ref={containerRef}'));
console.log('chainSegments:', s.includes('chainSegments'));
