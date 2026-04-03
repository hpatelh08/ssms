// GardenSky.tsx — Animated sky with gradient, floating clouds, sparkles, butterflies, and sun
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CLOUD_SHAPES, generateSparklePositions, getRandomFloat, getRandomInt } from './GardenEngine';

interface GardenSkyProps {
  streak: number;
  isWatering: boolean;
  attendancePercentage?: number;
}

// ─── Sun Component ────────────────────────────────────────────
const AnimatedSun: React.FC<{ streak: number }> = React.memo(({ streak }) => {
  const sunSize = Math.min(60 + streak * 3, 90);
  const glowRadius = sunSize + 20;

  return (
    <motion.div
      className="absolute"
      style={{ top: '8%', right: '10%' }}
      animate={{
        y: [0, -6, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: glowRadius,
          height: glowRadius,
          background: 'radial-gradient(circle, rgba(255,220,50,0.35) 0%, rgba(255,180,0,0.1) 50%, transparent 70%)',
          top: -(glowRadius - sunSize) / 2,
          left: -(glowRadius - sunSize) / 2,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Sun rays */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 3,
            height: sunSize * 0.4,
            background: 'linear-gradient(to bottom, rgba(255,200,0,0.6), transparent)',
            borderRadius: 2,
            left: sunSize / 2 - 1.5,
            top: -sunSize * 0.25,
            transformOrigin: `1.5px ${sunSize / 2 + sunSize * 0.25}px`,
            transform: `rotate(${i * 45}deg)`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
      {/* Sun face */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: sunSize,
          height: sunSize,
          background: 'radial-gradient(circle at 35% 35%, #FFE66D, #FFCC02, #FF9500)',
        }}
      >
        <span className="text-2xl select-none">
          😊
        </span>
      </div>
    </motion.div>
  );
});
AnimatedSun.displayName = 'AnimatedSun';

// ─── Cloud Component ──────────────────────────────────────────
const FloatingCloud: React.FC<{ index: number; yPos: number }> = React.memo(({ index, yPos }) => {
  const pathIndex = index % CLOUD_SHAPES.length;
  const scale = 0.6 + (index % 3) * 0.25;
  const duration = 35 + index * 12;
  const startX = -120 - index * 40;

  return (
    <motion.svg
      viewBox="0 0 80 35"
      className="absolute pointer-events-none"
      style={{
        width: 80 * scale,
        height: 35 * scale,
        top: `${yPos}%`,

      }}
      initial={{ x: startX }}
      animate={{ x: ['calc(-10vw)', 'calc(110vw)'] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay: index * 4,
      }}
    >
      <path
        d={CLOUD_SHAPES[pathIndex]}
        fill="white"
        fillOpacity={0.65 + index * 0.05}
      />
    </motion.svg>
  );
});
FloatingCloud.displayName = 'FloatingCloud';

// ─── Sparkle Particle ─────────────────────────────────────────
const Sparkle: React.FC<{ x: number; y: number; delay: number; duration: number; size: number }> = React.memo(
  ({ x, y, delay, duration, size }) => (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgba(255,255,200,0.9), rgba(255,215,0,0.5))',
      }}
      animate={{
        scale: [0, 1.2, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  )
);
Sparkle.displayName = 'Sparkle';

// ─── Butterfly ────────────────────────────────────────────────
const Butterfly: React.FC<{ index: number }> = React.memo(({ index }) => {
  const colors = ['#FF69B4', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'];
  const color = colors[index % colors.length];
  const startX = getRandomFloat(10, 80);
  const startY = getRandomFloat(20, 70);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${startX}%`, top: `${startY}%`, fontSize: 14 + index * 2 }}
      animate={{
        x: [0, 40, -20, 60, -30, 10, 0],
        y: [0, -25, 15, -40, 20, -10, 0],
        rotate: [0, -10, 15, -5, 10, -8, 0],
      }}
      transition={{
        duration: 12 + index * 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 2.5,
      }}
    >
      <motion.span
        animate={{ scaleX: [1, 0.3, 1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ display: 'inline-block', color }}
      >
        🦋
      </motion.span>
    </motion.div>
  );
});
Butterfly.displayName = 'Butterfly';

// ─── Rain Drop (for watering animation) ──────────────────────
const RainDrops: React.FC = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
    {Array.from({ length: 15 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute w-0.5 rounded-full"
        style={{
          left: `${5 + i * 6.5}%`,
          height: getRandomInt(10, 20),
          background: 'linear-gradient(to bottom, rgba(100,180,255,0.7), rgba(100,180,255,0.1))',
        }}
        initial={{ top: '-5%', opacity: 0 }}
        animate={{ top: '105%', opacity: [0, 0.8, 0.8, 0] }}
        transition={{
          duration: getRandomFloat(0.6, 1.2),
          repeat: Infinity,
          delay: getRandomFloat(0, 0.8),
          ease: 'linear',
        }}
      />
    ))}
  </div>
));
RainDrops.displayName = 'RainDrops';

// ─── Rainbow (attendance ≥ 85%) ────────────────────────────────
const Rainbow: React.FC = React.memo(() => {
  const colors = ['#FF6B6B', '#FFA500', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'];
  return (
    <motion.svg
      viewBox="0 0 200 100"
      className="absolute top-[5%] left-[15%] w-[70%] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ duration: 2, delay: 1 }}
    >
      {colors.map((color, i) => (
        <path
          key={i}
          d={`M ${10 + i * 3},${95 - i * 2} A ${90 - i * 6},${80 - i * 5} 0 0 1 ${190 - i * 3},${95 - i * 2}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
    </motion.svg>
  );
});
Rainbow.displayName = 'Rainbow';

// ─── Flying Bird (attendance ≥ 85%) ────────────────────────────
const FlyingBird: React.FC<{ index: number }> = React.memo(({ index }) => {
  const y = 10 + index * 12;
  const dur = 14 + index * 5;
  return (
    <motion.div
      className="absolute pointer-events-none text-base"
      style={{ top: `${y}%` }}
      initial={{ x: '-5vw' }}
      animate={{ x: '110vw' }}
      transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay: index * 4 }}
    >
      🐦
    </motion.div>
  );
});
FlyingBird.displayName = 'FlyingBird';

// ─── Main GardenSky ───────────────────────────────────────────
export const GardenSky: React.FC<GardenSkyProps> = React.memo(({ streak, isWatering, attendancePercentage = 90 }) => {
  const sparkles = useMemo(() => generateSparklePositions(streak >= 5 ? 12 : 6), [streak]);
  const cloudCount = 4;
  const butterflyCount = streak >= 3 ? Math.min(streak, 5) : 1;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
      {/* Sky gradient — shifts warmer with higher streak */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: streak >= 7
            ? [
                'linear-gradient(180deg, #87CEEB 0%, #B0E0FF 30%, #E8F5E9 60%, #C8E6C9 100%)',
                'linear-gradient(180deg, #7EC8E3 0%, #A5D8FF 30%, #DCEDC8 60%, #AED581 100%)',
                'linear-gradient(180deg, #87CEEB 0%, #B0E0FF 30%, #E8F5E9 60%, #C8E6C9 100%)',
              ]
            : streak >= 3
            ? [
                'linear-gradient(180deg, #89CFF0 0%, #BDE0FE 35%, #E8F5E9 70%, #E0E0E0 100%)',
                'linear-gradient(180deg, #80C7E8 0%, #B0D8F0 35%, #D5ECC2 70%, #D0D0D0 100%)',
                'linear-gradient(180deg, #89CFF0 0%, #BDE0FE 35%, #E8F5E9 70%, #E0E0E0 100%)',
              ]
            : [
                'linear-gradient(180deg, #B0C4DE 0%, #D3E0EA 40%, #F0F0F0 100%)',
                'linear-gradient(180deg, #A8BDD0 0%, #C8D8E4 40%, #E8E8E8 100%)',
                'linear-gradient(180deg, #B0C4DE 0%, #D3E0EA 40%, #F0F0F0 100%)',
              ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Sun */}
      <AnimatedSun streak={streak} />

      {/* Clouds */}
      {Array.from({ length: cloudCount }, (_, i) => (
        <FloatingCloud key={`cloud-${i}`} index={i} yPos={8 + i * 10} />
      ))}

      {/* Sparkles (more with higher streak) */}
      {sparkles.map((sp, i) => (
        <Sparkle key={`sparkle-${i}`} {...sp} />
      ))}

      {/* Butterflies */}
      {Array.from({ length: butterflyCount }, (_, i) => (
        <Butterfly key={`butterfly-${i}`} index={i} />
      ))}

      {/* Rainbow + Birds (attendance ≥ 85%) */}
      {attendancePercentage >= 85 && <Rainbow />}
      {attendancePercentage >= 85 && Array.from({ length: 3 }, (_, i) => (
        <FlyingBird key={`bird-${i}`} index={i} />
      ))}

      {/* Watering rain effect */}
      {isWatering && <RainDrops />}

      {/* Ground grass gradient */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '18%',
          background: 'linear-gradient(to top, rgba(76,175,80,0.25), rgba(139,195,74,0.1), transparent)',
        }}
      />
    </div>
  );
});

GardenSky.displayName = 'GardenSky';
