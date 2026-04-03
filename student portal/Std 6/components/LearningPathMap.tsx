import React from 'react';
import { motion } from 'framer-motion';

export interface LearningPathLevel {
  id: string | number;
  label: string;
  icon: string;
  color: string;
  shape?: 'circle' | 'hex' | 'star' | 'square';
  completed?: boolean;
  current?: boolean;
}

interface LearningPathMapProps {
  title?: string;
  levels: LearningPathLevel[];
  onLevelClick?: (level: LearningPathLevel) => void;
  currentLevel?: string | number;
  style?: React.CSSProperties;
}

const shapeClass = (shape: string) => {
  switch (shape) {
    case 'hex': return 'learningpath-hex';
    case 'star': return 'learningpath-star';
    case 'square': return 'rounded-2xl';
    default: return 'rounded-full';
  }
};

const LearningPathMap: React.FC<LearningPathMapProps> = ({
  title = 'My Learning Path',
  levels,
  onLevelClick,
  currentLevel,
  style = {},
}) => {
  // Path curve points for SVG
  const pathPoints = [
    { x: 60, y: 220 },
    { x: 160, y: 160 },
    { x: 260, y: 220 },
    { x: 360, y: 160 },
    { x: 460, y: 220 },
    { x: 560, y: 160 },
  ];
  // Place levels along the path
  const getPos = (i: number) => pathPoints[i] || { x: 60 + i * 100, y: 220 - (i % 2) * 60 };

  return (
    <div className="learningpath-bg rounded-3xl p-4 md:p-8 relative overflow-x-auto" style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #fef9c3 100%)', ...style }}>
      <h2 className="text-center text-2xl font-black mb-4" style={{ letterSpacing: 1, color: '#f43f5e', textShadow: '0 2px 8px #fff8' }}>{title}</h2>
      <div style={{ position: 'relative', minHeight: 320, minWidth: 640 }}>
        {/* SVG Path */}
        <svg width="640" height="320" style={{ position: 'absolute', left: 0, top: 0, zIndex: 0 }}>
          <path d="M60 220 Q160 160 260 220 Q360 160 460 220 Q560 160 560 160" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" strokeDasharray="16 16" />
        </svg>
        {/* Levels */}
        {levels.map((lvl, i) => {
          const pos = getPos(i);
          const isCurrent = lvl.current || lvl.id === currentLevel;
          return (
            <motion.button
              key={lvl.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => onLevelClick?.(lvl)}
              className={`absolute flex flex-col items-center justify-center font-black text-lg shadow-xl ${shapeClass(lvl.shape || 'circle')}`}
              style={{
                left: pos.x, top: pos.y,
                width: 90, height: 90,
                background: isCurrent ? 'linear-gradient(135deg, #fbbf24 60%, #f472b6 100%)' : lvl.color,
                color: isCurrent ? '#fff' : '#222',
                border: isCurrent ? '4px solid #f43f5e' : '3px solid #fff',
                zIndex: 2,
                boxShadow: isCurrent ? '0 0 0 8px #fbbf2433, 0 4px 16px #fbbf2444' : '0 2px 8px #0002',
                transition: 'all 0.2s',
              }}
            >
              <span className="text-3xl mb-1" style={{ textShadow: '0 2px 8px #fff8' }}>{lvl.icon}</span>
              <span className="text-base font-black" style={{ textShadow: '0 2px 8px #fff8' }}>{lvl.label}</span>
              {lvl.completed && <span className="text-xs mt-1">🏆</span>}
            </motion.button>
          );
        })}
      </div>
      {/* Cute animals/characters (optional) */}
      <div className="absolute left-2 bottom-2 text-3xl select-none pointer-events-none">🦉</div>
      <div className="absolute right-2 bottom-2 text-3xl select-none pointer-events-none">🐰</div>
    </div>
  );
};

// CSS for hex/star shapes (add to global CSS or module)
// .learningpath-hex { clip-path: polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%); }
// .learningpath-star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }

export default LearningPathMap;
