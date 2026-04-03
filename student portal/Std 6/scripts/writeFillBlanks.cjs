const fs = require('fs');
const p = 'e:/intership/Std 6/Std 6/child/FillBlanksPage.tsx';

const newContent = `import React, { useEffect, useRef, useState } from 'react';
import { fillBlanksLevelsMCQ } from '../data/fillBlanksLevelsMCQ';

/* ── CSS (injected once, scoped to fb-* classes) ── */
const FB_CSS_ID = 'fb-mine-css-v1';
if (typeof document !== 'undefined' && !document.getElementById(FB_CSS_ID)) {
  const st = document.createElement('style');
  st.id = FB_CSS_ID;
  st.textContent = \`
    @keyframes fb-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,200,0,0.7); }
      50%      { box-shadow: 0 0 0 14px rgba(255,200,0,0); }
    }
    @keyframes fb-bob {
      0%,100% { transform: translate(-50%,-50%) translateY(0); }
      50%      { transform: translate(-50%,-50%) translateY(-6px); }
    }
    .fb-node { transition: transform 0.18s cubic-bezier(.34,1.56,.64,1); -webkit-tap-highlight-color:transparent; outline:none; }
    .fb-node:not([disabled]):hover { transform: translate(-50%,-50%) scale(1.18) translateY(-4px) !important; }
    .fb-node:not([disabled]):active { transform: translate(-50%,-50%) scale(0.93) !important; }
    .fb-node.fb-current { animation: fb-pulse 1.8s ease-in-out infinite; }
    .fb-node.fb-done    { animation: fb-bob   2.8s ease-in-out infinite; }
  \`;
  document.head.appendChild(st);
}

/* ── Road positions (same layout as game LevelGrid) ── */
const ROAD_POS: { top: number; left: number }[] = [
  { top:  16.0, left: 62 },
  { top:  18.5, left: 58 },
  { top:  20.0, left: 45 },
  { top:  22.0, left: 40 },
  { top:  24.5, left: 40 },
  { top:  27.0, left: 44 },
  { top:  28.5, left: 60 },
  { top:  30.5, left: 48 },
  { top:  32.0, left: 70 },
  { top:  33.5, left: 44 },
  { top:  35.0, left: 60 },
  { top:  37.0, left: 40 },
  { top:  39.5, left: 45 },
  { top:  42.5, left: 45 },
  { top:  45.0, left: 30 },
  { top:  46.5, left: 50 },
  { top:  48.0, left: 70 },
  { top:  50.5, left: 60 },
  { top:  52.0, left: 40 },
  { top:  54.5, left: 30 },
  { top:  57.0, left: 48 },
  { top:  58.0, left: 78 },
  { top:  61.0, left: 71 },
  { top:  63.0, left: 52 },
  { top:  64.5, left: 71 },
  { top:  67.5, left: 70 },
  { top:  70.0, left: 60 },
  { top:  72.5, left: 70 },
  { top:  74.0, left: 50 },
  { top:  76.5, left: 60 },
  { top:  79.0, left: 58 },
  { top:  81.7, left: 52 },
  { top:  84.0, left: 38 },
  { top:  86.5, left: 50 },
  { top:  88.5, left: 40 },
  { top:  91.2, left: 36 },
  { top:  93.5, left: 44 },
  { top:  95.5, left: 56 },
  { top:  97.5, left: 65 },
  { top:  99.0, left: 80 },
];

const CONTAINER_H = 3800;
const TOTAL_LEVELS = fillBlanksLevelsMCQ.length || 40;

/* ── helpers ── */
function loadProgress(): Record<number, { correct: number; total: number }> {
  try {
    const arr = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]') as any[];
    const map: Record<number, { correct: number; total: number }> = {};
    arr.forEach((p: any) => { map[p.level] = { correct: p.correct ?? 0, total: p.total ?? 0 }; });
    return map;
  } catch { return {}; }
}

function saveProgress(level: number, correct: number, total: number) {
  let arr: any[] = [];
  try { arr = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]'); } catch {}
  const idx = arr.findIndex((p: any) => p.level === level);
  const entry = { level, correct, total, date: new Date().toISOString() };
  if (idx >= 0) arr[idx] = entry; else arr.push(entry);
  localStorage.setItem('ssms_fillblanks_progress', JSON.stringify(arr));
}

function getStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const r = correct / total;
  if (r >= 0.85) return 3;
  if (r >= 0.60) return 2;
  return 1;
}

/* ── Level Map ── */
const FillBlanksLevelMap: React.FC<{ onSelect: (l: number) => void }> = ({ onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);
  const [progress] = useState(() => loadProgress());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width));
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width || 400);
    return () => ro.disconnect();
  }, []);

  const currentLevel = (() => {
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (!progress[i]) return i;
    }
    return TOTAL_LEVELS;
  })();

  const positions = ROAD_POS.slice(0, TOTAL_LEVELS);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: CONTAINER_H + 'px',
        backgroundImage: 'url("/assets/background/background.png")',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        borderRadius: 20,
        boxShadow: '0 0 0 3px rgba(255,195,50,0.55), 0 12px 48px rgba(60,30,0,0.65)',
        border: '2.5px solid rgba(255,195,50,0.5)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header banner */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 16px 36px',
        background: 'linear-gradient(180deg,rgba(5,2,0,0.95) 0%,rgba(25,10,0,0.82) 55%,transparent 100%)',
        zIndex: 10, pointerEvents: 'none', textAlign: 'center',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#FFB300', letterSpacing: '0.12em', textTransform: 'uppercase', textShadow: '0 1px 6px rgba(0,0,0,0.95)' }}>
          {'\\u270F\\uFE0F'} {TOTAL_LEVELS} Levels
        </p>
        <h2 style={{
          margin: 0, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, fontStyle: 'italic',
          color: '#FFD700',
          textShadow: '0 0 10px rgba(255,200,0,0.9),0 2px 14px rgba(0,0,0,0.98),0 0 32px rgba(255,150,0,0.55)',
          letterSpacing: '0.05em',
        }}>Fill in the Blanks</h2>
      </div>

      {/* Chain connectors */}
      {positions.slice(0, -1).map((pos, idx) => {
        const next = positions[idx + 1];
        const x1 = (pos.left  / 100) * containerWidth;
        const y1 = (pos.top   / 100) * CONTAINER_H;
        const x2 = (next.left / 100) * containerWidth;
        const y2 = (next.top  / 100) * CONTAINER_H;
        const dx = x2 - x1, dy = y2 - y1;
        const dist  = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <img
            key={'conn-' + idx}
            src="/assets/buttons/join the level.png"
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: (x1 + x2) / 2,
              top:  (y1 + y2) / 2,
              width: dist,
              height: 52,
              objectFit: 'fill',
              transform: 'translate(-50%,-50%) rotate(' + angle + 'deg)',
              transformOrigin: 'center center',
              zIndex: 3,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        );
      })}

      {/* Level buttons */}
      {positions.map((pos, i) => {
        const level = i + 1;
        const done = !!progress[level];
        const isCurrent = level === currentLevel;
        const locked = !done && !isCurrent;
        const imgSrc = done
          ? '/assets/buttons/completed level.png'
          : isCurrent
            ? '/assets/buttons/play level button.png'
            : '/assets/buttons/next level button.png';
        const cls = 'fb-node' + (isCurrent ? ' fb-current' : done ? ' fb-done' : '');
        const stars = done ? getStars(progress[level].correct, progress[level].total) : 0;

        return (
          <div
            key={level}
            style={{
              position: 'absolute',
              top: pos.top + '%',
              left: pos.left + '%',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {done && stars > 0 && (
              <div style={{ fontSize: 13, lineHeight: 1, filter: 'drop-shadow(0 1px 4px rgba(255,180,0,0.7))', position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                {'\\u2B50'.repeat(stars)}
              </div>
            )}
            {isCurrent && (
              <div style={{ position: 'absolute', right: -36, top: 0, fontSize: 22, filter: 'drop-shadow(0 2px 6px rgba(255,180,0,0.8))', animation: 'fb-bob 2s ease-in-out infinite', zIndex: 6 }}>
                {'\\uD83E\\uDE99'}
              </div>
            )}
            <button
              onClick={locked ? undefined : () => onSelect(level)}
              disabled={locked}
              className={cls}
              style={{
                position: 'relative',
                width: 96, height: 96,
                padding: 0,
                background: 'none',
                border: 'none',
                borderRadius: '50%',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.55 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translate(-50%,-50%)',
              }}
            >
              <img
                src={imgSrc}
                alt={'level ' + level}
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
              />
              <span style={{ position: 'relative', zIndex: 2, fontWeight: 900, fontSize: locked ? 23 : 21, lineHeight: 1, color: '#fff', textShadow: '0 1px 5px rgba(0,0,0,0.85)' }}>
                {locked ? '\\uD83D\\uDD12' : level}
              </span>
              {isCurrent && (
                <span style={{ position: 'relative', zIndex: 2, fontSize: 11, fontWeight: 900, marginTop: 4, color: '#FFF8E1', letterSpacing: '0.14em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>PLAY</span>
              )}
              {done && (
                <span style={{ position: 'relative', zIndex: 2, fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)', marginTop: 3, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  {'\\u2713'}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* ── Quiz view ── */
const QuizView: React.FC<{ level: number; onBack: () => void }> = ({ level, onBack }) => {
  const levelData = fillBlanksLevelsMCQ.find(l => l.level === level);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  if (!levelData) return (
    <div style={{ textAlign: 'center', padding: 32, color: '#e53e3e', fontWeight: 700 }}>
      No questions found for Level {level}.
      <br />
      <button onClick={onBack} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, background: '#fed7aa', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Back</button>
    </div>
  );

  const total = levelData.questions.length;

  const handleAnswer = (opt: string) => {
    if (selected[qIdx]) return;
    const next = { ...selected, [qIdx]: opt };
    setSelected(next);
    setTimeout(() => {
      if (qIdx + 1 < total) {
        setQIdx(qIdx + 1);
      } else {
        const correct = Object.entries(next).filter(([i, o]) => levelData.questions[Number(i)].answer === o).length;
        saveProgress(level, correct, total);
        setDone(true);
      }
    }, 900);
  };

  if (done) {
    const correct = Object.entries(selected).filter(([i, o]) => levelData.questions[Number(i)].answer === o).length;
    const stars = getStars(correct, total);
    return (
      <div style={{ textAlign: 'center', padding: 32, maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>
          {'\\u2B50'.repeat(stars)}{'\\u2606'.repeat(3 - stars)}
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 24, color: '#D97706', marginBottom: 8 }}>Level {level} Complete!</h2>
        <p style={{ color: '#374151', fontWeight: 600, marginBottom: 24 }}>{correct} / {total} correct</p>
        <button onClick={onBack} style={{ padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#FCD34D,#F59E0B)', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', color: '#78350F', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>
          Back to Map
        </button>
      </div>
    );
  }

  const q = levelData.questions[qIdx];
  const sel = selected[qIdx];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', border: '1.5px solid #E2E8F0', fontWeight: 700, fontSize: 18, cursor: 'pointer', color: '#6B7280' }}>
          {'\\u2190'}
        </button>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, color: '#1F2937' }}>Fill in the Blanks — Level {level}</h3>
          <p style={{ margin: 0, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Question {qIdx + 1} of {total}</p>
        </div>
      </div>
      <div style={{ width: '100%', height: 8, borderRadius: 99, background: '#E2E8F0', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: ((qIdx / total) * 100) + '%', background: 'linear-gradient(90deg,#FCD34D,#F59E0B)', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderRadius: 20, padding: '20px 24px', marginBottom: 20, border: '1.5px solid #FDE68A', boxShadow: '0 2px 12px rgba(245,158,11,0.1)' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: '#1F2937', lineHeight: 1.5 }}>
          {q.question.replace('_____', '______')}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.options.map((opt, oi) => {
          const isSelected = sel === opt;
          const isCorrect = opt === q.answer;
          const bg = !sel
            ? 'linear-gradient(135deg,#FFF7ED,#FEF3C7)'
            : isSelected
              ? (isCorrect ? 'linear-gradient(135deg,#D1FAE5,#A7F3D0)' : 'linear-gradient(135deg,#FEE2E2,#FECACA)')
              : (isCorrect && !!sel ? 'linear-gradient(135deg,#D1FAE5,#A7F3D0)' : 'linear-gradient(135deg,#F9FAFB,#F3F4F6)');
          const border = !sel ? '#FDE68A' : isSelected ? (isCorrect ? '#34D399' : '#F87171') : (isCorrect && !!sel ? '#34D399' : '#E5E7EB');
          return (
            <button key={oi} disabled={!!sel} onClick={() => handleAnswer(opt)}
              style={{ padding: '14px 12px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: bg, border: '2px solid ' + border, cursor: sel ? 'default' : 'pointer', color: '#1F2937', textAlign: 'center', lineHeight: 1.3, transition: 'all 0.2s', boxShadow: !sel ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
              {opt}
            </button>
          );
        })}
      </div>
      {sel && (
        <div style={{ marginTop: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, color: sel === q.answer ? '#059669' : '#DC2626' }}>
          {sel === q.answer ? 'Correct!' : 'Correct answer: ' + q.answer}
        </div>
      )}
    </div>
  );
};

/* ── Main Page ── */
const FillBlanksPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  return (
    <div style={{ minHeight: '100vh', padding: '16px 16px 80px', boxSizing: 'border-box' }}>
      {selectedLevel === null ? (
        <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px,3vw,40px) clamp(16px,4vw,60px)', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: 24, padding: 'clamp(16px,2vw,28px) clamp(20px,3vw,36px)', marginBottom: 32, boxShadow: '0 4px 24px rgba(245,158,11,0.15)', boxSizing: 'border-box' }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1F2937' }}>Fill in the Blanks</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{TOTAL_LEVELS} levels — complete each to unlock the next</p>
          </div>
          <FillBlanksLevelMap onSelect={setSelectedLevel} />
        </div>
      ) : (
        <QuizView level={selectedLevel} onBack={() => setSelectedLevel(null)} />
      )}
    </div>
  );
};

export default FillBlanksPage;
`;

fs.writeFileSync(p, newContent, 'utf8');
console.log('Written. Length:', fs.readFileSync(p,'utf8').length);
