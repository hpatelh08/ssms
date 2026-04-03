import React, { useMemo } from 'react';
import spaceBackground from '../assets/background/space-background.png';

interface Star {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const SpaceShellBackground: React.FC = React.memo(() => {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 3,
        duration: 2.5 + Math.random() * 4,
        delay: Math.random() * 4,
        opacity: 0.35 + Math.random() * 0.55,
      })),
    [],
  );

  return (
    <div className="space-shell-bg" aria-hidden="true">
      <div
        className="space-shell-bg__image"
        style={{ backgroundImage: `url(${spaceBackground})` }}
      />
      <div className="space-shell-bg__nebula space-shell-bg__nebula--one" />
      <div className="space-shell-bg__nebula space-shell-bg__nebula--two" />
      <div className="space-shell-bg__grid" />
      {stars.map(star => (
        <span
          key={star.id}
          className="space-shell-bg__star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

SpaceShellBackground.displayName = 'SpaceShellBackground';

export default SpaceShellBackground;
