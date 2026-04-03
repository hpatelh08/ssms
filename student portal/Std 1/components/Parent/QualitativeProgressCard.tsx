// QualitativeProgressCard.tsx — Enhanced skill cards with animated progress, tooltips, reflection modal
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillLevel } from '../../types';
import { SKILL_EMOJI, SKILL_TOOLTIP, SKILL_PROGRESS, SKILL_COLORS } from './ParentEngine';

interface QualitativeProgressCardProps {
  skills: { reading: SkillLevel; writing: SkillLevel; participation: SkillLevel };
  onViewReflection: () => void;
}

// ─── Single Skill Card ────────────────────────────────────────
const SkillCard: React.FC<{
  label: string;
  level: SkillLevel;
  index: number;
}> = React.memo(({ label, level, index }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const emoji = SKILL_EMOJI[level];
  const tooltip = SKILL_TOOLTIP[level];
  const progress = SKILL_PROGRESS[level];
  const colors = SKILL_COLORS[label] || SKILL_COLORS.Reading;

  return (
    <motion.div
      className={`relative bg-gradient-to-br ${colors.gradient} p-5 rounded-2xl border border-white/50 overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, type: 'spring', stiffness: 150 }}
      whileHover={{ y: -3, scale: 1.02, boxShadow: `0 8px 30px ${colors.glow}` }}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
    >
      {/* Background glow on improvement */}
      {(level === 'Active' || level === 'Star') && (
        <motion.div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${colors.glow}, transparent)` }}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Animated emoji */}
        <motion.span
          className="text-4xl mb-3 block"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
          style={{ filter: `drop-shadow(0 0 10px ${colors.glow})` }}
        >
          {emoji}
        </motion.span>

        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-[0.15em] mb-1">{label}</span>
        <span className="text-lg font-black text-blue-900">{level}</span>

        {/* Progress bar */}
        <div className="w-full mt-3 h-1.5 bg-gray-200/40 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, delay: 0.3 + index * 0.15, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[9px] text-gray-400 mt-1 font-medium">{progress}% engagement</span>
      </div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900/92 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-2 rounded-xl shadow-xl z-30 max-w-[200px] text-center"
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {tooltip}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-gray-900/92 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
SkillCard.displayName = 'SkillCard';

// ─── Main Progress Section ────────────────────────────────────
export const QualitativeProgressCard: React.FC<QualitativeProgressCardProps> = React.memo(({
  skills,
  onViewReflection,
}) => {
  const skillEntries: { label: string; level: SkillLevel }[] = [
    { label: 'Reading', level: skills.reading },
    { label: 'Writing', level: skills.writing },
    { label: 'Participation', level: skills.participation },
  ];

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 border border-white/50 shadow-lg shadow-blue-500/[0.03]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100/80 to-emerald-50/60 flex items-center justify-center border border-green-200/30"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-lg">📊</span>
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">Qualitative Progress</h3>
            <p className="text-[10px] text-gray-400 font-medium">Engagement-based assessment • No ranking</p>
          </div>
        </div>

        <motion.button
          onClick={onViewReflection}
          className="flex items-center gap-1.5 bg-blue-50/60 text-blue-500 text-xs font-bold px-3 py-2 rounded-xl border border-blue-100/30 hover:bg-blue-100/60 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📌 Monthly Reflection
        </motion.button>
      </div>

      {/* Skill Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {skillEntries.map((skill, i) => (
          <SkillCard key={skill.label} label={skill.label} level={skill.level} index={i} />
        ))}
      </div>

      {/* Governance footer */}
      <p className="text-[10px] text-gray-400 text-center italic mt-2">
        "Progress is measured by engagement and activity completion, not competition."
      </p>
    </motion.div>
  );
});

QualitativeProgressCard.displayName = 'QualitativeProgressCard';

// ─── Reflection Modal ─────────────────────────────────────────
interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: { reading: SkillLevel; writing: SkillLevel; participation: SkillLevel };
}

export const ReflectionModal: React.FC<ReflectionModalProps> = React.memo(({ isOpen, onClose, skills }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-blue-900/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white/95 backdrop-blur-xl rounded-[24px] p-8 max-w-lg w-full shadow-2xl border border-white/50"
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">📋</span>
              <h3 className="text-xl font-black text-blue-900">Monthly Reflection</h3>
              <p className="text-xs text-gray-400 mt-1">Qualitative summary — February 2026</p>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { label: 'Reading', level: skills.reading, detail: 'Engaging with phonics and simple sentences. Shows enthusiasm during read-aloud sessions.' },
                { label: 'Writing', level: skills.writing, detail: 'Practicing letter formation. Growing confidence with short words and tracing exercises.' },
                { label: 'Participation', level: skills.participation, detail: 'Actively raises hand and contributes to group activities. Good collaboration with peers.' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100/40"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{SKILL_EMOJI[item.level]}</span>
                    <span className="font-bold text-blue-900 text-sm">{item.label}</span>
                    <span className="text-[10px] bg-blue-50/60 text-blue-500 font-bold px-2 py-0.5 rounded-lg ml-auto">{item.level}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.detail}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-[10px] text-gray-400 text-center italic mb-4">
              This reflection is generated from engagement patterns. No competitive comparison is made.
            </p>

            <motion.button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-blue-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ReflectionModal.displayName = 'ReflectionModal';
