import React, { useMemo } from 'react';
import LearningPathMap, { LearningPathLevel } from '../../components/LearningPathMap';

function getFunFactsProgress() {
  try {
    const arr = JSON.parse(localStorage.getItem('ssms_funfacts_progress') || '[]');
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

const FunFactsParentReport: React.FC = () => {
  // Example: Each fact category is a level
  const progress = useMemo(getFunFactsProgress, []);
  const categories = [
    { id: 'space', label: 'Space', icon: '🚀', color: '#6366f1' },
    { id: 'animals', label: 'Animals', icon: '🦁', color: '#f59e0b' },
    { id: 'science', label: 'Science', icon: '🔬', color: '#10b981' },
    { id: 'history', label: 'History', icon: '🏺', color: '#f472b6' },
    { id: 'nature', label: 'Nature', icon: '🌳', color: '#22d3ee' },
    { id: 'random', label: 'Random', icon: '🎲', color: '#fbbf24' },
  ];
  const levels: LearningPathLevel[] = categories.map((cat, i) => ({
    ...cat,
    shape: i === 1 ? 'hex' : i === 2 ? 'star' : i === 3 ? 'square' : 'circle',
    completed: progress.includes(cat.id),
    current: progress.length === i,
  }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 0 }}>
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 24,
        boxShadow: '0 2px 16px rgba(92,106,196,0.06)',
        padding: 32,
        marginTop: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>🌟</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>Fun Facts Progress</div>
            <div style={{ fontSize: 14, color: '#6B6FCF', fontWeight: 500 }}>Student's progress in Fun Facts categories</div>
          </div>
        </div>
        <LearningPathMap title="Fun Facts Path" levels={levels} />
      </div>
    </div>
  );
};

export default FunFactsParentReport;
