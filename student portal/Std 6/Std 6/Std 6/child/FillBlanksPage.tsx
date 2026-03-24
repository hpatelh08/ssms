import React, { useState } from 'react';
import { fillBlanksLevelsMCQ } from '../data/fillBlanksLevelsMCQ';

// --- CandyCrushLevelMap Component and helpers ---
type CandyCrushLevelMapProps = {
  totalLevels: number;
  onSelectLevel: (level: number) => void;
};

const CANDY_EMOJIS = ["🍬", "🍭", "🍫", "🍡", "🍩", "🍪", "🍦", "🍰", "🧁", "🍒", "🍓", "🍉", "🍊", "🍋", "🍎", "🍏", "🍇", "🍌", "🍍", "🥝"];

function getNodePositions(count: number, width: number, height: number) {
  const margin = 60;
  const stepY = count > 1 ? (height - 2 * margin) / (count - 1) : 0;
  const amplitude = width / 3;
  return Array.from({ length: count }, (_, i) => {
    const y = margin + i * stepY;
    const x = i % 2 === 0 ? margin : width - margin;
    const curve = count > 1 ? Math.sin((i / (count - 1)) * Math.PI) * amplitude : 0;
    return { x: x + (i % 2 === 0 ? curve : -curve), y };
  });
}

const CandyCrushLevelMap: React.FC<CandyCrushLevelMapProps> = ({ totalLevels, onSelectLevel }) => {
  const width = 400;
  const height = Math.max(700, totalLevels * 80);
  const nodeR = 22;
  const positions = getNodePositions(totalLevels, width, height);
  const pathD = positions.map((pos, i) =>
    i === 0 ? `M${pos.x},${pos.y}` : `L${pos.x},${pos.y}`
  ).join(" ");
  const emojiDecos = positions.map((pos, i) => {
    if (i % 20 === 1 && i < CANDY_EMOJIS.length * 10) {
      return (
        <text
          key={"emoji-" + i}
          x={pos.x + (i % 4 === 1 ? 40 : -40)}
          y={pos.y + (i % 4 < 2 ? -30 : 30)}
          fontSize="28"
          style={{ pointerEvents: "none" }}
        >
          {CANDY_EMOJIS[i % CANDY_EMOJIS.length]}
        </text>
      );
    }
    return null;
  });
  let completedLevels: number[] = [];
  try {
    const allProgress = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]');
    completedLevels = allProgress.map((p: any) => p.level);
  } catch {}
  const currentLevelIdx = completedLevels.length;
  return (
    <div style={{ position: "relative", width, height, background: "linear-gradient(180deg, #f8e8ff 0%, #e0f7fa 100%)", borderRadius: 32, boxShadow: "0 4px 24px #0001", overflow: "visible", margin: "0 auto" }}>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}>
        <path d={pathD} stroke="#a259f7" strokeWidth={10} fill="none" strokeLinecap="round" filter="url(#glow)" />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {emojiDecos}
      </svg>
      {positions.map((pos, i) => {
        const isCurrent = i === currentLevelIdx;
        const isCompleted = completedLevels.includes(i + 1);
        return (
          <button
            key={i + 1}
            className="level-node-btn"
            style={{
              position: "absolute",
              left: pos.x - nodeR,
              top: pos.y - nodeR,
              width: nodeR * 2,
              height: nodeR * 2,
              borderRadius: "50%",
              background: isCurrent
                ? "radial-gradient(circle at 60% 40%, #fff 60%, #ffeb3b 100%)"
                : isCompleted
                ? "linear-gradient(135deg, #a5f7a2 60%, #6ee7b7 100%)"
                : "linear-gradient(135deg, #fff 60%, #e0e0e0 100%)",
              border: isCurrent ? "3px solid #ff9800" : "2px solid #a259f7",
              boxShadow: isCurrent ? "0 0 16px 4px #ff980088" : "0 2px 8px #0002",
              zIndex: 2,
              fontWeight: 700,
              fontSize: 15,
              color: isCompleted ? "#388e3c" : isCurrent ? "#ff9800" : "#6a1b9a",
              transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
              cursor: "pointer",
              outline: isCurrent ? "3px solid #fff59d" : undefined,
              animation: isCurrent ? "bounce 1.2s infinite alternate" : undefined,
            }}
            onClick={() => onSelectLevel(i + 1)}
            title={`Level ${i + 1}`}
          >
            {isCompleted ? "⭐" : isCurrent ? "🦊" : "🔒"}
            <div style={{ fontSize: 12 }}>{i + 1}</div>
          </button>
        );
      })}
      <div style={{ position: "absolute", left: 24, top: 24, fontSize: 36, animation: "floatY 3s ease-in-out infinite alternate" }}>🦊</div>
      <div style={{ position: "absolute", right: 24, bottom: 24, fontSize: 32, animation: "floatY 2.2s 1s ease-in-out infinite alternate" }}>🌈</div>
      <style>{`
        @keyframes bounce {
          0% { transform: scale(1) translateY(0); }
          100% { transform: scale(1.12) translateY(-10px); }
        }
        @keyframes floatY {
          0% { transform: translateY(0); }
          100% { transform: translateY(-18px); }
        }
        .level-node-btn:active {
          filter: brightness(0.95) saturate(1.2);
        }
      `}</style>
    </div>
  );
};

function getFirstIncompleteLevel(): number {
  try {
    const done: { level: number }[] = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]');
    const doneSet = new Set(done.map(p => p.level));
    for (const lvl of fillBlanksLevelsMCQ) {
      if (!doneSet.has(lvl.level)) return lvl.level;
    }
    // All levels done — restart from level 1
    return fillBlanksLevelsMCQ[0]?.level ?? 1;
  } catch {
    return fillBlanksLevelsMCQ[0]?.level ?? 1;
  }
}

const FillBlanksPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    fillBlanksLevelsMCQ.length > 0 ? getFirstIncompleteLevel() : null
  );
  const [selectedOptions, setSelectedOptions] = useState<{ [qIdx: number]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const levelData = fillBlanksLevelsMCQ.find(l => l.level === selectedLevel);

  return (
    <div className="min-h-screen px-4 py-6 pb-28 lg:pb-8">
      <h1 className="text-2xl font-black text-orange-600 mb-4">Fill in the Blanks</h1>
      {levelData ? (
        <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow">
          <h2 className="text-lg font-bold mb-3">Level {levelData.level}</h2>
          {currentQuestionIdx < levelData.questions.length ? (
            (() => {
              const q = levelData.questions[currentQuestionIdx];
              const selected = selectedOptions[currentQuestionIdx];
              const isCorrect = selected === q.answer;
              return (
                <div className="mb-6">
                  <p className="font-semibold mb-2">Q{currentQuestionIdx + 1}. {q.question.replace('_____', '______')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oidx) => (
                      <button
                        key={oidx}
                        className={`rounded-xl px-4 py-2 font-bold border transition-all ${selected === opt ? (isCorrect ? 'bg-green-200 border-green-500 text-green-800' : 'bg-red-200 border-red-500 text-red-800') : 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'}`}
                        disabled={!!selected}
                        onClick={() => {
                          setSelectedOptions(prev => ({ ...prev, [currentQuestionIdx]: opt }));
                          setTimeout(() => {
                            setCurrentQuestionIdx(idx => idx + 1);
                          }, 1000); // 1 second delay to show feedback
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <div className={`mt-2 font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? 'Correct!' : `Incorrect. Correct answer: ${q.answer}`}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            (() => {
              // Save progress to localStorage
              const total = levelData.questions.length;
              const correct = Object.entries(selectedOptions).filter(([idx, opt]) => levelData.questions[Number(idx)].answer === opt).length;
              const progress = {
                level: levelData.level,
                total,
                correct,
                date: new Date().toISOString(),
              };
              // Save or update progress for this level
              let allProgress = [];
              try {
                allProgress = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]');
              } catch {}
              const idx = allProgress.findIndex((p: any) => p.level === levelData.level);
              if (idx >= 0) allProgress[idx] = progress;
              else allProgress.push(progress);
              localStorage.setItem('ssms_fillblanks_progress', JSON.stringify(allProgress));
              return <div className="text-center font-bold text-green-600 mb-4">All questions completed!</div>;
            })()
          )}
          <button
            className="mt-6 px-5 py-2 rounded-xl bg-orange-200 text-orange-800 font-bold hover:bg-orange-300"
            onClick={() => {
              setSelectedLevel(getFirstIncompleteLevel());
              setSelectedOptions({});
              setShowResult(false);
              setCurrentQuestionIdx(0);
            }}
          >Next Level →</button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow text-center text-red-500 font-bold">
          No questions found for this level.
          <button
            className="mt-6 px-5 py-2 rounded-xl bg-orange-200 text-orange-800 font-bold hover:bg-orange-300"
            onClick={() => {
              setSelectedLevel(getFirstIncompleteLevel());
              setSelectedOptions({});
              setShowResult(false);
              setCurrentQuestionIdx(0);
            }}
          >Next Level →</button>
        </div>
      )}
    </div>
  );
};

export default FillBlanksPage;
