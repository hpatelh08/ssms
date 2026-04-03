// GrowthStage.tsx — Animated plant growth visualization
// 6 stages: Soil → Seed → Sprout → Flower → Bloom → Tree
// Each stage has unique cartoon-style SVG with smooth scaling/spring animations
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GROWTH_STAGES, type GrowthLevel, type DayInfo } from './GardenEngine';

interface GrowthStageProps {
  day: DayInfo;
  index: number;
  isSelected: boolean;
  onSelect: (day: DayInfo) => void;
}

// ─── Individual Plant Cell ────────────────────────────────────
export const GrowthStage: React.FC<GrowthStageProps> = React.memo(({ day, index, isSelected, onSelect }) => {
  const stage = GROWTH_STAGES[day.growthLevel];

  return (
    <motion.div
      className="flex flex-col items-center gap-1 cursor-pointer select-none"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 18 }}
      onClick={() => onSelect(day)}
    >
      {/* Day label */}
      <span className="text-[9px] font-extrabold text-blue-500/70 uppercase tracking-wider">
        {day.dayLabel}
      </span>

      {/* Plant container */}
      <motion.div
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
          day.isToday
            ? 'ring-2 ring-blue-400/70 ring-offset-2 ring-offset-transparent bg-gradient-to-b from-blue-50/60 to-blue-100/40'
            : isSelected
            ? 'ring-2 ring-amber-400/70 ring-offset-2 bg-gradient-to-b from-amber-50/40 to-amber-100/30'
            : day.isPresent
            ? 'bg-gradient-to-b from-green-50/50 to-green-100/30 hover:from-green-100/60 hover:to-green-200/40'
            : 'bg-gradient-to-b from-gray-50/30 to-gray-100/20'
        }`}
        whileHover={{ scale: 1.12, y: -5 }}
        whileTap={{ scale: 0.92 }}
        layout
      >
        {/* Plant emoji with spring entrance */}
        {day.isPresent ? (
          <motion.span
            className="text-3xl sm:text-4xl block"
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: 1,
              rotate: 0,
              y: day.isToday ? [0, -3, 0] : 0,
            }}
            transition={{
              scale: { type: 'spring', stiffness: 400, damping: 12, delay: index * 0.08 },
              y: day.isToday ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined,
            }}
            style={{}}

          >
            {stage.emoji}
          </motion.span>
        ) : (
          // Empty soil dot
          <motion.span
            className="text-2xl opacity-30"
            animate={{ opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🟫
          </motion.span>
        )}

        {/* Today indicator pulse */}
        {day.isToday && (
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Milestone star */}
        {day.isMilestone && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 text-sm"
            animate={{ scale: [0.8, 1.3, 0.8], rotate: [0, 180, 360] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            ⭐
          </motion.div>
        )}

        {/* Growth sparkle for high stages */}
        {day.growthLevel >= 4 && (
          <motion.div
            className="absolute -top-2 -left-1 text-xs"
            animate={{
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0],
              y: [0, -8],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
          >
            ✨
          </motion.div>
        )}
      </motion.div>

      {/* Date number */}
      <span className={`text-[10px] font-bold ${day.isToday ? 'text-blue-500' : day.isPresent ? 'text-green-600/70' : 'text-gray-400'}`}>
        {day.dayOfMonth}
      </span>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1.5 rounded-xl whitespace-nowrap z-30 shadow-xl"
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {day.isPresent
              ? `${stage.label} • ${day.consecutiveDays} day${day.consecutiveDays !== 1 ? 's' : ''} streak`
              : 'Rest day'
            }
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

GrowthStage.displayName = 'GrowthStage';

// ─── Growth Legend ────────────────────────────────────────────
interface GrowthLegendProps {
  compact?: boolean;
}

export const GrowthLegend: React.FC<GrowthLegendProps> = React.memo(({ compact = false }) => {
  const stages = compact
    ? [1, 3, 5] as GrowthLevel[]
    : [0, 1, 2, 3, 4, 5] as GrowthLevel[];

  return (
    <motion.div
      className="flex items-center justify-center gap-3 sm:gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ delay: 0.5 }}
    >
      {stages.map((lvl, i) => {
        const s = GROWTH_STAGES[lvl];
        return (
          <motion.div
            key={lvl}
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
          >
            <span className="text-sm">{s.emoji}</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase">{s.label}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

GrowthLegend.displayName = 'GrowthLegend';

// ─── Garden Row (row of plants) ──────────────────────────────
interface GardenRowProps {
  days: DayInfo[];
  selectedDay: DayInfo | null;
  onSelectDay: (day: DayInfo) => void;
}

export const GardenRow: React.FC<GardenRowProps> = React.memo(({ days, selectedDay, onSelectDay }) => {
  // Show last 7 days or the full range
  const displayDays = days.length > 9 ? days.slice(-7) : days;

  return (
    <div className="space-y-3">
      <div className={`grid gap-2 sm:gap-3 ${displayDays.length <= 7 ? 'grid-cols-7' : 'grid-cols-7 sm:grid-cols-9'}`}>
        {displayDays.map((day, i) => (
          <GrowthStage
            key={day.date}
            day={day}
            index={i}
            isSelected={selectedDay?.date === day.date}
            onSelect={onSelectDay}
          />
        ))}
      </div>

      {/* Animated soil line */}
      <motion.div
        className="h-2 rounded-full overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, #D2B48C20, #8B6914 30, #A0522D40, #8B691430)' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139,105,20,0.15), transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        {/* Worm peeking */}
        <motion.span
          className="absolute text-[8px]"
          style={{ top: -2 }}
          animate={{ left: ['10%', '90%', '10%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        >
          🐛
        </motion.span>
      </motion.div>
    </div>
  );
});

GardenRow.displayName = 'GardenRow';
