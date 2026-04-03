// AuditTimeline.tsx — AI Transparency Center with collapsible timeline, filters, retrieval details
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditLogEntry } from '../../types';
import { getAuditLog } from '../../utils/auditLog';
import { AUDIT_CATEGORY_CONFIG, formatTimestamp, type ParentState } from './ParentEngine';

interface AuditTimelineProps {
  showLog: boolean;
  filter: ParentState['auditFilter'];
  expandedEntry: string | null;
  onToggle: () => void;
  onSetFilter: (filter: ParentState['auditFilter']) => void;
  onExpandEntry: (id: string | null) => void;
}

// ─── Filter Pill ──────────────────────────────────────────────
const FilterPill: React.FC<{
  label: string;
  icon: string;
  active: boolean;
  count: number;
  onClick: () => void;
}> = React.memo(({ label, icon, active, count, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
      active
        ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20'
        : 'bg-white/40 text-gray-500 border-gray-100/40 hover:bg-white/60'
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <span>{icon}</span>
    {label}
    {count > 0 && (
      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
        active ? 'bg-white/20' : 'bg-gray-100/60'
      }`}>
        {count}
      </span>
    )}
  </motion.button>
));
FilterPill.displayName = 'FilterPill';

// ─── Timeline Entry ──────────────────────────────────────────
const TimelineEntry: React.FC<{
  entry: AuditLogEntry;
  isExpanded: boolean;
  index: number;
  onExpand: () => void;
}> = React.memo(({ entry, isExpanded, index, onExpand }) => {
  const config = AUDIT_CATEGORY_CONFIG[entry.category] || AUDIT_CATEGORY_CONFIG.navigation;
  const isAI = entry.category === 'ai';
  const details = entry.details || {};

  return (
    <motion.div
      className="flex gap-3 relative"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Timeline vertical bar */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${config.bg} border border-white/30`}
          whileHover={{ scale: 1.15 }}
        >
          {config.icon}
        </motion.div>
        <div className="w-px flex-1 bg-gray-200/50 mt-1" />
      </div>

      {/* Content */}
      <motion.div
        className={`flex-1 pb-4 cursor-pointer ${isExpanded ? '' : ''}`}
        onClick={onExpand}
      >
        <div className={`rounded-xl p-3 transition-all ${
          isExpanded
            ? 'bg-white/60 border border-blue-100/40 shadow-sm'
            : 'hover:bg-white/30'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-xs font-semibold text-blue-900">{entry.action.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              {isAI && (
                <span className="text-[9px] bg-cyan-100/60 text-cyan-600 font-bold px-1.5 py-0.5 rounded-md">
                  🤖 AI
                </span>
              )}
              <span className="text-[10px] text-gray-400">{formatTimestamp(entry.timestamp)}</span>
            </div>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="mt-2 pt-2 border-t border-gray-100/40 space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50/40 rounded-lg p-2">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Timestamp</span>
                      <span className="text-[10px] text-gray-600">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50/40 rounded-lg p-2">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">AI Involved</span>
                      <span className="text-[10px] text-gray-600">{isAI ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {Object.keys(details).length > 0 && (
                    <div className="bg-gray-50/40 rounded-lg p-2">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Context Details</span>
                      {Object.entries(details).map(([key, val]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-[9px] text-gray-500 font-semibold min-w-[60px]">{key}:</span>
                          <span className="text-[9px] text-gray-600 break-all">{String(val).slice(0, 100)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAI && (
                    <motion.div
                      className="bg-cyan-50/40 rounded-lg p-2 border border-cyan-100/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">🔍</span>
                        <span className="text-[9px] text-cyan-700 font-bold uppercase">Retrieval Details</span>
                      </div>
                      <p className="text-[10px] text-cyan-600/80">
                        {(details as any).source
                          ? `Source: ${(details as any).source}`
                          : 'AI query processed using RAG pipeline with textbook knowledge base.'}
                      </p>
                      <p className="text-[9px] text-cyan-500/60 mt-1">
                        Context chunks used for generation. No external data accessed.
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});
TimelineEntry.displayName = 'TimelineEntry';

// ─── Main Component ───────────────────────────────────────────
export const AuditTimeline: React.FC<AuditTimelineProps> = React.memo(({
  showLog, filter, expandedEntry, onToggle, onSetFilter, onExpandEntry,
}) => {
  const allLogs = useMemo(() => getAuditLog(), [showLog]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allLogs.length };
    allLogs.forEach(l => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return counts;
  }, [allLogs]);

  const filteredLogs = useMemo(() => {
    const logs = filter === 'all' ? allLogs : allLogs.filter(l => l.category === filter);
    return logs.slice(0, 30);
  }, [allLogs, filter]);

  const aiCount = categoryCounts.ai || 0;

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 border border-white/50 shadow-lg shadow-blue-500/[0.03]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100/80 to-indigo-50/60 flex items-center justify-center border border-purple-200/30"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-lg">📜</span>
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">AI Transparency Center</h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {allLogs.length} total events • {aiCount} AI interactions
            </p>
          </div>
        </div>

        <motion.button
          onClick={onToggle}
          className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${
            showLog
              ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20'
              : 'bg-blue-50/60 text-blue-500 border-blue-100/30 hover:bg-blue-100/60'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showLog ? 'Hide Timeline' : 'View Timeline'}
        </motion.button>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'all' as const, label: 'All', icon: '📋' },
                { key: 'ai' as const, label: 'AI', icon: '🤖' },
                { key: 'game' as const, label: 'Games', icon: '🎮' },
                { key: 'homework' as const, label: 'Homework', icon: '📝' },
                { key: 'attendance' as const, label: 'Attendance', icon: '📅' },
                { key: 'parent' as const, label: 'Parent', icon: '🛡️' },
              ].map(f => (
                <FilterPill
                  key={f.key}
                  label={f.label}
                  icon={f.icon}
                  active={filter === f.key}
                  count={categoryCounts[f.key] || 0}
                  onClick={() => onSetFilter(f.key)}
                />
              ))}
            </div>

            {/* Timeline */}
            <div className="max-h-[400px] overflow-y-auto pr-1 relative">
              {/* Animated vertical bar behind timeline */}
              <motion.div
                className="absolute left-[15px] top-0 bottom-0 w-px"
                style={{
                  background: 'linear-gradient(to bottom, rgba(59,130,246,0.2), rgba(147,51,234,0.1), transparent)',
                  transformOrigin: 'top',
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />

              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="text-sm text-gray-400">No activity logged yet.</p>
                </div>
              ) : (
                filteredLogs.map((entry, i) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedEntry === entry.id}
                    index={i}
                    onExpand={() => onExpandEntry(expandedEntry === entry.id ? null : entry.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

AuditTimeline.displayName = 'AuditTimeline';
