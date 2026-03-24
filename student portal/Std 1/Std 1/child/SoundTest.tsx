import React from 'react';
import { useSound, type SoundType } from './SoundProvider';

const ALL_SOUNDS: SoundType[] = ['click', 'correct', 'wrong', 'celebrate', 'level'];

/**
 * Temporary debug component — renders a row of test buttons
 * that fire each sound type directly from a real click event.
 * Check browser DevTools console for [Sound] debug logs.
 */
const SoundTest: React.FC = () => {
  const { play, muted, toggleMute } = useSound();

  return (
    <div
      style={{
        margin: '16px 0',
        padding: '12px',
        background: '#fef3c7',
        borderRadius: '12px',
        border: '2px dashed #f59e0b',
      }}
    >
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
        🔧 Sound Debug Panel {muted ? '(MUTED)' : '(ACTIVE)'}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {ALL_SOUNDS.map(type => (
          <button
            key={type}
            onClick={() => play(type)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            🔊 {type}
          </button>
        ))}
      </div>

      <button
        onClick={toggleMute}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          background: muted ? '#fee2e2' : '#d1fae5',
          border: '1px solid' + (muted ? '#fca5a5' : '#6ee7b7'),
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {muted ? '🔇 Unmute' : '🔊 Mute'}
      </button>

      <p style={{ fontSize: '11px', color: '#a16207', marginTop: '8px' }}>
        Open DevTools → Console → click a button → look for [Sound] logs
      </p>
    </div>
  );
};

export default React.memo(SoundTest);
