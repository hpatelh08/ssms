import React from 'react';

const FloatingWorld: React.FC = React.memo(() => {
  return (
    <div className="floating-world" aria-hidden="true">
      {/* Clouds */}
      <div className="cloud cloud--1" />
      <div className="cloud cloud--2" />
      <div className="cloud cloud--3" />

      {/* Sparkles */}
      <div className="sparkle sparkle--1" />
      <div className="sparkle sparkle--2" />
      <div className="sparkle sparkle--3" />
      <div className="sparkle sparkle--4" />
      <div className="sparkle sparkle--5" />
    </div>
  );
});

FloatingWorld.displayName = 'FloatingWorld';

export { FloatingWorld };
