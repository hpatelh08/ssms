import React, { useMemo } from 'react';
import { TOTAL_FILL_BLANK_QUESTIONS } from '../../data/fillBlanksQuestions';

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
  indigo: '#6366F1',
  mint: '#10B981',
  rose: '#F472B6',
};

function getFillBlanksProgress() {
  try {
    const arr = JSON.parse(localStorage.getItem('ssms_fillblanks_progress') || '[]');
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

const FillBlanksParentReport: React.FC = () => {
  const fillBlanks = useMemo(getFillBlanksProgress, []);
  const totalQuestionsAvailable = TOTAL_FILL_BLANK_QUESTIONS;
  const completed = fillBlanks.length;
  const totalQuestions = fillBlanks.reduce((a, p) => a + (p.total || 0), 0);
  const totalCorrect = fillBlanks.reduce((a, p) => a + (p.correct || 0), 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const lastPlayed = fillBlanks.length > 0 ? new Date(fillBlanks[fillBlanks.length - 1].date).toLocaleString() : '—';

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
          <span style={{ fontSize: 28 }}>✍️</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: CLR.primary }}>Fill in the Blanks Progress</div>
            <div style={{ fontSize: 14, color: CLR.secondary, fontWeight: 500 }}>Endless practice with generated, non-repeating questions</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Questions Completed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLR.indigo }}>{completed} / {totalQuestionsAvailable} target</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Accuracy</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLR.mint }}>{accuracy}%</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.primary }}>Last Played</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: CLR.rose }}>{lastPlayed}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: CLR.muted, marginTop: 6, marginBottom: 10 }}>
          Total Questions Attempted: <b>{totalQuestions}</b> &nbsp;|&nbsp; Correct: <b>{totalCorrect}</b>
        </div>
        {completed > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CLR.secondary, marginBottom: 6 }}>Recent Questions</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {fillBlanks.slice(-5).reverse().map((p, i) => (
                <div key={i} style={{ background: '#F3F4F6', borderRadius: 10, padding: '8px 14px', fontSize: 14, color: CLR.primary }}>
                  Question {p.questionNumber || p.level}: <b>{p.correct}/{p.total}</b> correct
                  <span style={{ color: CLR.muted, fontSize: 13, marginLeft: 8 }}>{new Date(p.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FillBlanksParentReport;
