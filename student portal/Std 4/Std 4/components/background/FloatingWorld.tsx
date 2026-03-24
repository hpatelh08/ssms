/**
 * 🌈 FloatingWorld – Persistent Animated Cartoon Background
 * ==========================================================
 * Flying birds, floating butterflies, soft clouds, sparkle particles.
 * Uses CSS animations + requestAnimationFrame for 60fps.
 * Low opacity, non-distracting, globally applied behind all layouts.
 */

import React, { useEffect, useRef, useMemo } from 'react';

// ─── Bird Path (SVG) ─────────────────────────────────────

const BirdSVG: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 40 20" fill="none">
    <path
      d="M0 10 Q10 0 20 10 Q30 0 40 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    >
      <animate attributeName="d" dur="0.6s" repeatCount="indefinite"
        values="M0 10 Q10 0 20 10 Q30 0 40 10;M0 10 Q10 6 20 10 Q30 6 40 10;M0 10 Q10 0 20 10 Q30 0 40 10" />
    </path>
  </svg>
);

// ─── Butterfly SVG ───────────────────────────────────────

const ButterflySVG: React.FC<{ size: number; color1: string; color2: string }> = ({ size, color1, color2 }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <g transform="translate(15,15)">
      <ellipse cx="-6" cy="-3" rx="6" ry="8" fill={color1} opacity="0.7">
        <animateTransform attributeName="transform" type="rotate" from="0 -6 -3" to="-30 -6 -3" dur="0.3s" repeatCount="indefinite" values="0 -6 -3;-30 -6 -3;0 -6 -3" />
      </ellipse>
      <ellipse cx="6" cy="-3" rx="6" ry="8" fill={color2} opacity="0.7">
        <animateTransform attributeName="transform" type="rotate" from="0 6 -3" to="30 6 -3" dur="0.3s" repeatCount="indefinite" values="0 6 -3;30 6 -3;0 6 -3" />
      </ellipse>
      <ellipse cx="0" cy="2" rx="1.5" ry="6" fill="#555" opacity="0.4" />
    </g>
  </svg>
);

// ─── Cloud SVG ───────────────────────────────────────────

const CloudSVG: React.FC<{ width: number }> = ({ width }) => (
  <svg width={width} height={width * 0.5} viewBox="0 0 120 60" fill="none">
    <ellipse cx="60" cy="40" rx="50" ry="18" fill="rgba(255,255,255,0.35)" />
    <ellipse cx="40" cy="30" rx="30" ry="22" fill="rgba(255,255,255,0.3)" />
    <ellipse cx="75" cy="28" rx="28" ry="20" fill="rgba(255,255,255,0.32)" />
    <ellipse cx="55" cy="22" rx="22" ry="18" fill="rgba(255,255,255,0.28)" />
  </svg>
);

// ─── Sparkle Canvas (requestAnimationFrame) ──────────────

const SparkleCanvas: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const particles = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      speed: 0.1 + Math.random() * 0.3,
      opacity: 0,
      phase: Math.random() * Math.PI * 2,
    })),
  []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        const x = (p.x / 100) * canvas.width;
        const baseY = (p.y / 100) * canvas.height;
        const y = baseY + Math.sin(time * p.speed * 3 + p.phase) * 15;
        const opacity = (Math.sin(time * p.speed * 2 + p.phase) + 1) * 0.15;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Cross sparkle
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - p.size * 2, y);
        ctx.lineTo(x + p.size * 2, y);
        ctx.moveTo(x, y - p.size * 2);
        ctx.lineTo(x, y + p.size * 2);
        ctx.stroke();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
});
SparkleCanvas.displayName = 'SparkleCanvas';

// ─── Main FloatingWorld Component ────────────────────────

interface FloatingItem {
  id: number;
  type: 'bird' | 'butterfly' | 'cloud';
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  color1: string;
  color2: string;
}

const BIRD_COLORS = ['rgba(100,130,200,0.25)', 'rgba(80,120,180,0.2)', 'rgba(120,100,160,0.22)'];
const BUTTERFLY_COLORS = [
  ['rgba(236,72,153,0.25)', 'rgba(168,85,247,0.25)'],
  ['rgba(59,130,246,0.22)', 'rgba(6,182,212,0.22)'],
  ['rgba(245,158,11,0.25)', 'rgba(249,115,22,0.2)'],
  ['rgba(16,185,129,0.22)', 'rgba(52,211,153,0.2)'],
];

export const FloatingWorld: React.FC = React.memo(() => {
  const items = useMemo<FloatingItem[]>(() => {
    const list: FloatingItem[] = [];

    // Birds (4)
    for (let i = 0; i < 4; i++) {
      list.push({
        id: i,
        type: 'bird',
        x: -10,
        y: 8 + Math.random() * 30,
        size: 24 + Math.random() * 16,
        speed: 25 + Math.random() * 35,
        delay: i * 8 + Math.random() * 5,
        color1: BIRD_COLORS[i % BIRD_COLORS.length],
        color2: '',
      });
    }

    // Butterflies (5)
    for (let i = 0; i < 5; i++) {
      const colors = BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length];
      list.push({
        id: 10 + i,
        type: 'butterfly',
        x: Math.random() * 90,
        y: 15 + Math.random() * 60,
        size: 18 + Math.random() * 12,
        speed: 12 + Math.random() * 18,
        delay: i * 4 + Math.random() * 3,
        color1: colors[0],
        color2: colors[1],
      });
    }

    // Clouds (3)
    for (let i = 0; i < 3; i++) {
      list.push({
        id: 20 + i,
        type: 'cloud',
        x: -15,
        y: 5 + i * 18 + Math.random() * 10,
        size: 80 + Math.random() * 60,
        speed: 50 + Math.random() * 40,
        delay: i * 15 + Math.random() * 10,
        color1: '',
        color2: '',
      });
    }

    return list;
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
      style={{ opacity: 0.7 }}
    >
      {/* Sparkle particles via canvas */}
      <SparkleCanvas />

      {/* Flying birds */}
      {items.filter(i => i.type === 'bird').map(bird => (
        <div
          key={`bird-${bird.id}`}
          className="absolute"
          style={{
            top: `${bird.y}%`,
            animation: `floatBirdX ${bird.speed}s linear ${bird.delay}s infinite`,
            willChange: 'transform',
          }}
        >
          <div style={{ animation: `floatBirdY 3s ease-in-out infinite` }}>
            <BirdSVG size={bird.size} color={bird.color1} />
          </div>
        </div>
      ))}

      {/* Floating butterflies */}
      {items.filter(i => i.type === 'butterfly').map(bf => (
        <div
          key={`bf-${bf.id}`}
          className="absolute"
          style={{
            left: `${bf.x}%`,
            top: `${bf.y}%`,
            animation: `floatButterflyDrift ${bf.speed}s ease-in-out ${bf.delay}s infinite alternate`,
            willChange: 'transform',
          }}
        >
          <div style={{ animation: `floatButterflyBob 2.5s ease-in-out infinite` }}>
            <ButterflySVG size={bf.size} color1={bf.color1} color2={bf.color2} />
          </div>
        </div>
      ))}

      {/* Soft moving clouds */}
      {items.filter(i => i.type === 'cloud').map(cloud => (
        <div
          key={`cloud-${cloud.id}`}
          className="absolute"
          style={{
            top: `${cloud.y}%`,
            animation: `floatCloudX ${cloud.speed}s linear ${cloud.delay}s infinite`,
            willChange: 'transform',
          }}
        >
          <CloudSVG width={cloud.size} />
        </div>
      ))}
    </div>
  );
});

FloatingWorld.displayName = 'FloatingWorld';
