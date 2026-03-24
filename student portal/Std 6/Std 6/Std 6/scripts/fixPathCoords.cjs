const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/games/LevelGrid.tsx';
let s = fs.readFileSync(p, 'utf8');

const oldBlock = s.match(/const MINE_ROAD_POSITIONS[\s\S]*?\];/)[0];

const newBlock = `const MINE_ROAD_POSITIONS: { top: number; left: number }[] = [
  // Sweep 1 (1-10): path entrance right-side → left apex
  { top:  2.0, left: 56 }, // 1  -- cave path entrance
  { top:  4.5, left: 54 }, // 2
  { top:  7.0, left: 52 }, // 3
  { top:  9.5, left: 50 }, // 4
  { top: 12.0, left: 48 }, // 5
  { top: 14.5, left: 46 }, // 6
  { top: 17.0, left: 44 }, // 7
  { top: 19.5, left: 42 }, // 8
  { top: 22.0, left: 41 }, // 9
  { top: 24.5, left: 40 }, // 10 -- left apex
  // Sweep 2 (11-20): left apex → right swing
  { top: 27.0, left: 41 }, // 11
  { top: 29.5, left: 43 }, // 12
  { top: 32.0, left: 45 }, // 13
  { top: 34.5, left: 47 }, // 14
  { top: 37.0, left: 49 }, // 15
  { top: 39.5, left: 51 }, // 16
  { top: 42.0, left: 53 }, // 17
  { top: 44.5, left: 54 }, // 18
  { top: 47.0, left: 55 }, // 19
  { top: 49.5, left: 55 }, // 20 -- right apex
  // Sweep 3 (21-30): right apex → left apex
  { top: 52.0, left: 54 }, // 21
  { top: 54.5, left: 52 }, // 22
  { top: 57.0, left: 50 }, // 23
  { top: 59.5, left: 48 }, // 24
  { top: 62.0, left: 46 }, // 25
  { top: 64.5, left: 44 }, // 26
  { top: 67.0, left: 42 }, // 27
  { top: 69.5, left: 41 }, // 28
  { top: 72.0, left: 40 }, // 29
  { top: 74.5, left: 39 }, // 30 -- left apex
  // Sweep 4 (31-40): left apex → centre finish
  { top: 77.0, left: 40 }, // 31
  { top: 79.5, left: 42 }, // 32
  { top: 82.0, left: 44 }, // 33
  { top: 84.5, left: 46 }, // 34
  { top: 87.0, left: 48 }, // 35
  { top: 89.5, left: 50 }, // 36
  { top: 91.5, left: 51 }, // 37
  { top: 93.5, left: 52 }, // 38
  { top: 95.5, left: 53 }, // 39
  { top: 97.0, left: 53 }, // 40 -- deep mine floor
];`;

s = s.replace(oldBlock, newBlock);
fs.writeFileSync(p, s, 'utf8');
console.log('Done. Verifying level 1:', s.match(/left: 56 \}, \/\/ 1/) ? 'OK' : 'FAIL');
