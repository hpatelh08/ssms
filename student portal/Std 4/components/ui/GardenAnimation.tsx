import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface GardenAnimationProps {
  attendance: string[];
  streak: number;
}

const PLANT_STAGES: Record<number, { emoji: string; label: string }> = {
  0: { emoji: '🟫', label: 'Empty' },
  1: { emoji: '🌱', label: 'Seed' },
  2: { emoji: '🌿', label: 'Sprout' },
  3: { emoji: '🌻', label: 'Flower' },
  4: { emoji: '🌸', label: 'Bloom' },
  5: { emoji: '🌳', label: 'Tree' },
};

function getPlantStage(dayIndex: number, consecutiveDays: number): number {
  if (dayIndex >= consecutiveDays) return 0;
  const daysFromStart = consecutiveDays - dayIndex;
  return Math.min(5, daysFromStart);
}

export const GardenAnimation: React.FC<GardenAnimationProps> = React.memo(({ attendance, streak }) => {
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative">
      {/* Floating leaves animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        {streak >= 3 && [0, 1, 2].map(i => (
          <motion.span
            key={`leaf-${i}`}
            className="absolute text-lg opacity-30"
            style={{
              left: `${20 + i * 30}%`,
              top: '-10%',
            }}
            animate={{
              y: ['0%', '120%'],
              x: [0, (i % 2 ? 1 : -1) * 30, (i % 2 ? -1 : 1) * 20, 0],
              rotate: [0, 180, 360],
              opacity: [0, 0.4, 0.3, 0],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              delay: i * 2.5,
              ease: 'easeInOut',
            }}
          >
            🍃
          </motion.span>
        ))}
      </div>

      {/* Garden grid */}
      <div className="grid grid-cols-7 gap-2 lg:gap-3 relative z-10">
        {weekDates.map((date, i) => {
          const isPresent = attendance.includes(date);
          const isToday = date === today;
          const stage = isPresent ? getPlantStage(i, Math.min(streak, 7)) : 0;
          const plant = PLANT_STAGES[stage];

          return (
            <motion.div
              key={date}
              className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-colors ${
                isToday
                  ? 'bg-green-100/60 border-2 border-green-300/50 shadow-sm shadow-green-200/30'
                  : isPresent
                  ? 'bg-green-50/40 border border-green-100/30'
                  : 'bg-gray-50/30 border border-gray-100/20'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2, scale: 1.05 }}
            >
              <span className="text-[10px] font-bold text-blue-400/70 uppercase">
                {dayNames[i]}
              </span>

              <motion.span
                className="text-2xl lg:text-3xl block"
                style={{
                  filter: isPresent ? 'drop-shadow(0 0 6px rgba(34,197,94,0.4))' : 'none',
                }}
                animate={
                  isPresent && isToday
                    ? { scale: [1, 1.1, 1], y: [0, -3, 0] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {plant.emoji}
              </motion.span>

              {/* Today indicator dot */}
              {isToday && (
                <motion.div
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Sparkle for high-stage plants */}
              {stage >= 4 && (
                <motion.div
                  className="absolute -top-1 -right-1 text-xs"
                  animate={{ scale: [0.8, 1.2, 0.8], rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ✨
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Growth legend */}
      <div className="flex items-center justify-center gap-4 mt-4 opacity-50">
        {[1, 2, 3, 4, 5].map(stage => (
          <div key={stage} className="flex items-center gap-1">
            <span className="text-sm">{PLANT_STAGES[stage].emoji}</span>
            <span className="text-[8px] font-bold text-gray-400">{PLANT_STAGES[stage].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

GardenAnimation.displayName = 'GardenAnimation';
