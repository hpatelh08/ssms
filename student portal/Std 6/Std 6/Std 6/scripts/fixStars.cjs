const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// 1. Add getStars prop to RailwayLevelMap type
s = s.replace(
  `  getStatus: (l:number) => 'completed'|'current'|'available'|'locked';
  onSelect: (l:number) => void;
}> = React.memo(({ total, difficulty, meta, getStatus, onSelect }) => {`,
  `  getStatus: (l:number) => 'completed'|'current'|'available'|'locked';
  getStars: (l:number) => number;
  onSelect: (l:number) => void;
}> = React.memo(({ total, difficulty, meta, getStatus, getStars, onSelect }) => {`
);

// 2. Replace hardcoded ⭐⭐⭐ with dynamic star count
s = s.replace(
  `{status === 'completed' && (
              <div style={{ display: 'flex', gap: 1, fontSize: 11, lineHeight: 1, filter: 'drop-shadow(0 1px 4px rgba(255,180,0,0.7))' }}>⭐⭐⭐</div>
            )}`,
  `{status === 'completed' && (
              <div style={{ display: 'flex', gap: 1, fontSize: 11, lineHeight: 1, filter: 'drop-shadow(0 1px 4px rgba(255,180,0,0.7))' }}>
                {'⭐'.repeat(getStars(level))}
              </div>
            )}`
);

// 3. Add getStars callback in LevelGrid before the return
s = s.replace(
  `  const getStatus = useCallback((level: number): 'completed' | 'current' | 'available' | 'locked' => {`,
  `  const getStars = useCallback((level: number): number => {
    const ml = progress?.miniLevels[level];
    if (!ml?.completed) return 0;
    const ratio = ml.total > 0 ? ml.score / ml.total : 0;
    if (ratio >= 0.85) return 3;
    if (ratio >= 0.60) return 2;
    return 1;
  }, [progress]);

  const getStatus = useCallback((level: number): 'completed' | 'current' | 'available' | 'locked' => {`
);

// 4. Pass getStars to <RailwayLevelMap />
s = s.replace(
  `        getStatus={getStatus}
        onSelect={onSelectLevel}`,
  `        getStatus={getStatus}
        getStars={getStars}
        onSelect={onSelectLevel}`
);

fs.writeFileSync(p, s, 'utf8');

console.log('Done. Checks:');
console.log('getStars prop type added:', s.includes('getStars: (l:number) => number'));
console.log('getStars callback added:', s.includes('getStars = useCallback'));
console.log('getStars passed to map:', s.includes('getStars={getStars}'));
console.log('dynamic stars render:', s.includes("'⭐'.repeat(getStars(level))"));
console.log('hardcoded ⭐⭐⭐ gone:', !s.includes('⭐⭐⭐'));
