import React from 'react';
import type { ChildScreen } from '../ChildLayout';

interface Props {
  onNavigate?: (screen: ChildScreen) => void;
}

const ITEM_STYLE_BASE: React.CSSProperties = {
  borderRadius: 16,
  padding: '14px 0',
  marginBottom: 14,
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  border: 'none',
  width: '100%',
};

const JourneySidebarReplacement: React.FC<Props> = ({ onNavigate }) => (
  <div style={{
    width: 260,
    background: 'linear-gradient(180deg, #f5f7ff 0%, #e0e7ff 100%)',
    borderRight: '1px solid #e0e7ff',
    boxShadow: '2px 0 12px rgba(88,28,135,0.08)',
    minHeight: '100vh',
    padding: '32px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    overflowY: 'auto',
  }}>
    <div style={{ fontSize: 38, marginBottom: 12 }}>
      <span role="img" aria-label="puzzle">🧩</span>
    </div>
    <div style={{ width: '90%' }}>

      {/* Fun Facts */}
      <button
        style={{ ...ITEM_STYLE_BASE, background: '#f3f4f6', color: '#6366f1', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}
        onClick={() => onNavigate?.('funfacts')}
      >
        <span style={{ fontSize: 22 }}>🌟</span> Fun Facts
      </button>

      {/* Brain Puzzles */}
      <button
        style={{ ...ITEM_STYLE_BASE, background: '#e0f2fe', color: '#22d3ee', boxShadow: '0 2px 8px rgba(16,185,129,0.04)' }}
        onClick={() => onNavigate?.('puzzles')}
      >
        <span style={{ fontSize: 22 }}>🧩</span> Brain Puzzles
      </button>

      {/* Fill in the Blanks */}
      <button
        style={{ ...ITEM_STYLE_BASE, background: '#fef3c7', color: '#f59e0b', boxShadow: '0 2px 8px rgba(245,158,11,0.04)' }}
        onClick={() => onNavigate?.('fillblanks')}
      >
        <span style={{ fontSize: 22 }}>✍️</span> Fill in the Blanks
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(99,102,241,0.12)', margin: '6px 0 18px' }} />

      {/* Arcade Game */}
      <button
        style={{ ...ITEM_STYLE_BASE, background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', color: '#f97316', boxShadow: '0 2px 8px rgba(249,115,22,0.10)' }}
        onClick={() => onNavigate?.('arcade')}
      >
        <span style={{ fontSize: 22 }}>🕹️</span> Arcade Game
      </button>

      {/* Math World */}
      <button
        style={{ ...ITEM_STYLE_BASE, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#10b981', boxShadow: '0 2px 8px rgba(16,185,129,0.10)' }}
        onClick={() => onNavigate?.('mathworld')}
      >
        <span style={{ fontSize: 22 }}>🔢</span> Math World
      </button>

      {/* English Kingdom */}
      <button
        style={{ ...ITEM_STYLE_BASE, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#7c3aed', boxShadow: '0 2px 8px rgba(124,58,237,0.10)' }}
        onClick={() => onNavigate?.('englishkingdom')}
      >
        <span style={{ fontSize: 22 }}>🏰</span> English Kingdom
      </button>

    </div>
  </div>
);

export default JourneySidebarReplacement;
