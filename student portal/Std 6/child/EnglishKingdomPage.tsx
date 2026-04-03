import React from 'react';

const EnglishKingdomPage: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #3b1f6b 0%, #5a2d82 50%, #7c3aed 100%)',
    padding: 32,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.8))' }}>🏰</div>
    <h1 style={{
      fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, margin: '0 0 12px',
      background: 'linear-gradient(135deg, #C4B5FD, #A78BFA)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>
      English Kingdom
    </h1>
    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 600, maxWidth: 360, lineHeight: 1.6 }}>
      Conquer the realm of grammar, vocabulary and reading!
    </p>
    <div style={{
      marginTop: 32, padding: '12px 32px', borderRadius: 99,
      background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
      color: '#fff', fontWeight: 800, fontSize: 14,
      boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
    }}>
      🚀 Coming Soon
    </div>
  </div>
);

export default EnglishKingdomPage;
