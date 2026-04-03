import React, { useMemo } from 'react';

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  indigo: '#6366F1',
  mint: '#10B981',
  rose: '#F472B6',
};

function getBrainPuzzleProgress() {
  try {
    const arr = JSON.parse(localStorage.getItem('ssms_brainpuzzle_progress') || '[]');
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

const BrainPuzzleParentReport: React.FC = () => {
  const progress = useMemo(getBrainPuzzleProgress, []);
  const totalGames = 4; // Sudoku, Maze, Logic, Pattern
  const completed = progress.length;
  const totalAttempts = progress.reduce((a, p) => a + (p.attempts || 0), 0);
  const totalWins = progress.reduce((a, p) => a + (p.wins || 0), 0);
  const lastPlayed = progress.length > 0 ? new Date(progress[progress.length - 1].date).toLocaleString() : '—';

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
          <span style={{ fontSize: 28 }}>🧠</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: CLR.primary }}>Brain Puzzle Progress</div>
            <div style={{ fontSize: 14, color: CLR.secondary, fontWeight: 500 }}>Student's progress in Sudoku, Maze, Logic, and Pattern games</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Games Played</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLR.indigo }}>{completed} / {totalGames}</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Total Attempts</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLR.mint }}>{totalAttempts}</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Total Wins</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLR.rose }}>{totalWins}</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Last Played</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: CLR.rose }}>{lastPlayed}</div>
          </div>
        </div>
        {/* Recent Games */}
        {completed > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.secondary, marginBottom: 6 }}>Recent Games</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {progress.slice(-5).reverse().map((p, i) => (
                <div key={i} style={{ background: '#F3F4F6', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: CLR.primary }}>
                  {p.game}: <b>{p.wins}/{p.attempts}</b> wins
                  <span style={{ color: CLR.muted, fontSize: 11, marginLeft: 8 }}>{new Date(p.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainPuzzleParentReport;
