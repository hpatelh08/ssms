import React from 'react';

const ArcadeGamePage: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: 32,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 0 24px rgba(251,146,60,0.7))' }}>🕹️</div>
    <h1 style={{
      fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, margin: '0 0 12px',
      background: 'linear-gradient(135deg, #FB923C, #FBBF24)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>
      Arcade Games
    </h1>
    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 600, maxWidth: 360, lineHeight: 1.6 }}>
      Fun arcade-style learning games coming soon!
    </p>
    <div style={{
      marginTop: 32, padding: '12px 32px', borderRadius: 99,
      background: 'linear-gradient(135deg, #FB923C, #F97316)',
      color: '#fff', fontWeight: 800, fontSize: 14,
      boxShadow: '0 4px 24px rgba(249,115,22,0.4)',
    }}>
      🚀 Coming Soon
    </div>
  </div>
);

export default ArcadeGamePage;
