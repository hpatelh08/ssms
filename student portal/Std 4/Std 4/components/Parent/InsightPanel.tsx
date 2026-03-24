// InsightPanel.tsx — Teacher insights with expandable cards, key phrase highlights, reactions
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeacherMessage } from '../../types';
import { highlightKeyPhrases, formatTimestamp, type InsightReview } from './ParentEngine';

interface InsightPanelProps {
  messages: TeacherMessage[];
  reviews: Record<string, InsightReview>;
  expandedId: string | null;
  onReview: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onExpand: (id: string | null) => void;
}

// ─── Teacher Avatar ───────────────────────────────────────────
const TeacherAvatar: React.FC<{ name: string }> = React.memo(({ name }) => {
  const initial = name.charAt(0).toUpperCase();
  const bgColors = ['from-blue-400 to-blue-500', 'from-purple-400 to-purple-500', 'from-emerald-400 to-emerald-500', 'from-amber-400 to-amber-500'];
  const bg = bgColors[initial.charCodeAt(0) % bgColors.length];

  return (
    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm`}>
      {initial}
    </div>
  );
});
TeacherAvatar.displayName = 'TeacherAvatar';

// ─── Single Insight Card ──────────────────────────────────────
const InsightCard: React.FC<{
  message: TeacherMessage;
  review: InsightReview | undefined;
  isExpanded: boolean;
  index: number;
  onReview: () => void;
  onAcknowledge: () => void;
  onExpand: () => void;
}> = React.memo(({ message, review, isExpanded, index, onReview, onAcknowledge, onExpand }) => {
  const highlighted = highlightKeyPhrases(message.text);
  const isReviewed = review?.reviewed;
  const isAcknowledged = review?.acknowledged;

  return (
    <motion.div
      className={`relative rounded-2xl border transition-all overflow-hidden cursor-pointer ${
        isExpanded
          ? 'bg-white/70 border-blue-200/50 shadow-lg shadow-blue-500/5'
          : isReviewed
          ? 'bg-white/40 border-green-200/30 hover:bg-white/60'
          : 'bg-white/40 border-white/40 hover:bg-white/60'
      }`}
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 150 }}
      onClick={onExpand}
      layout
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <TeacherAvatar name={message.sender} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-blue-800 text-sm">{message.sender}</span>
              <div className="flex items-center gap-2">
                {isReviewed && (
                  <motion.span
                    className="text-[9px] bg-green-100/60 text-green-600 font-bold px-2 py-0.5 rounded-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    ✓ Reviewed
                  </motion.span>
                )}
                <motion.span
                  className="text-[10px] text-gray-400 font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {formatTimestamp(message.date)}
                </motion.span>
              </div>
            </div>

            {/* Text with highlighted key phrases */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {highlighted.map((part, i) =>
                part.isHighlight ? (
                  <span
                    key={i}
                    className="bg-yellow-100/80 text-yellow-800 font-semibold px-1 rounded"
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </p>
          </div>
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="mt-3 pt-3 border-t border-gray-100/50"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="flex items-center gap-2">
                {!isReviewed && (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); onReview(); }}
                    className="flex items-center gap-1.5 bg-blue-50/60 text-blue-500 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-blue-100/30 hover:bg-blue-100/60 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✓ Mark as Reviewed
                  </motion.button>
                )}

                <motion.button
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
                  className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                    isAcknowledged
                      ? 'bg-green-50/60 text-green-600 border-green-200/30'
                      : 'bg-gray-50/60 text-gray-500 border-gray-100/30 hover:bg-amber-50/60 hover:text-amber-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  👍 {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                </motion.button>

                {review?.reviewedAt && (
                  <span className="text-[9px] text-gray-400 ml-auto">
                    Reviewed {formatTimestamp(review.reviewedAt)}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unread indicator */}
      {!isReviewed && (
        <motion.div
          className="absolute top-3 left-0 w-1 h-6 bg-blue-400 rounded-r-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});
InsightCard.displayName = 'InsightCard';

// ─── Main Panel ───────────────────────────────────────────────
export const InsightPanel: React.FC<InsightPanelProps> = React.memo(({
  messages, reviews, expandedId, onReview, onAcknowledge, onExpand,
}) => {
  const unreviewed = messages.filter(m => !reviews[m.id]?.reviewed).length;

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 border border-white/50 shadow-lg shadow-blue-500/[0.03]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100/80 to-indigo-50/60 flex items-center justify-center border border-blue-200/30"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-lg">✉️</span>
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">Teacher Insights</h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {unreviewed > 0 ? `${unreviewed} unreviewed` : 'All reviewed'}
            </p>
          </div>
        </div>

        {unreviewed > 0 && (
          <motion.div
            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-black"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {unreviewed}
          </motion.div>
        )}
      </div>

      <div className="space-y-3">
        {messages.map((msg, i) => (
          <InsightCard
            key={msg.id}
            message={msg}
            review={reviews[msg.id]}
            isExpanded={expandedId === msg.id}
            index={i}
            onReview={() => onReview(msg.id)}
            onAcknowledge={() => onAcknowledge(msg.id)}
            onExpand={() => onExpand(expandedId === msg.id ? null : msg.id)}
          />
        ))}
      </div>
    </motion.div>
  );
});

InsightPanel.displayName = 'InsightPanel';
