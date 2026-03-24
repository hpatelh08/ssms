import React from 'react';

const MathWorldPage: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    padding: 32,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 0 24px rgba(52,211,153,0.7))' }}>🔢</div>
    <h1 style={{
      fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, margin: '0 0 12px',
      background: 'linear-gradient(135deg, #34D399, #10B981)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>
      Math World
    </h1>
    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 600, maxWidth: 360, lineHeight: 1.6 }}>
      Explore an exciting world of numbers, equations and puzzles!
    </p>
    <div style={{
      marginTop: 32, padding: '12px 32px', borderRadius: 99,
      background: 'linear-gradient(135deg, #34D399, #10B981)',
      color: '#fff', fontWeight: 800, fontSize: 14,
      boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
    }}>
      🚀 Coming Soon
    </div>
  </div>
);

export default MathWorldPage;
