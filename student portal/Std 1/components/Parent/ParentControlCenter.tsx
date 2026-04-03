// ParentControlCenter.tsx — Main Parent Control Center container
// Orchestrates all sub-panels, manages state via useReducer, persists to localStorage
import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { UserStats, TextbookChunk, TeacherMessage } from '../../types';
import { INITIAL_MESSAGES } from '../../constants';
import { getAuditLog, getAIInteractionLog } from '../../utils/auditLog';
import { generateReportCardPDF } from '../../services/reportGenerator';
import {
  parentReducer,
  createInitialParentState,
  computeWeeklyEngagement,
  persistParentState,
  ParentNote,
  FeedProgress,
} from './ParentEngine';
import { ParentGatewayHero } from './ParentGatewayHero';
import { QualitativeProgressCard } from './QualitativeProgressCard';
import { InsightPanel } from './InsightPanel';
import { EngagementInsightsPanel } from './EngagementInsightsPanel';
import { AuditTimeline } from './AuditTimeline';
import { WeeklySnapshot } from './WeeklySnapshot';
import { SafeModeToggle } from './SafeModeToggle';

interface ParentControlCenterProps {
  knowledgeBase: TextbookChunk[];
  stats: UserStats;
  onAddKnowledge: (chunk: TextbookChunk) => void;
  attendanceMetrics?: {
    totalSchoolDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
}

// ─── Main Exported Component ──────────────────────────────────
export const ParentDashboard: React.FC<ParentControlCenterProps> = React.memo(
  ({ knowledgeBase, stats, onAddKnowledge, attendanceMetrics }) => {
    const [state, dispatch] = useReducer(parentReducer, undefined, createInitialParentState);

    // Persist state changes
    useEffect(() => {
      persistParentState(state);
    }, [state.parentNotes, state.insightReviews, state.safeMode]);

    // Refresh weekly engagement on mount
    useEffect(() => {
      dispatch({ type: 'SET_WEEKLY_ENGAGEMENT', engagement: computeWeeklyEngagement() });
    }, []);

    // ─── Callbacks ──────────────────────────────────────────────
    const handleReviewInsight = useCallback(
      (messageId: string) => dispatch({ type: 'REVIEW_INSIGHT', messageId }),
      []
    );
    const handleAcknowledgeInsight = useCallback(
      (messageId: string) => dispatch({ type: 'ACKNOWLEDGE_INSIGHT', messageId }),
      []
    );
    const handleExpandInsight = useCallback(
      (messageId: string | null) => dispatch({ type: 'EXPAND_INSIGHT', messageId }),
      []
    );
    const handleSetFeedProgress = useCallback(
      (progress: FeedProgress) => dispatch({ type: 'SET_FEED_PROGRESS', progress }),
      []
    );
    const handleSetSubjectFilter = useCallback(
      (filter: 'All' | 'English' | 'Math') => dispatch({ type: 'SET_SUBJECT_FILTER', filter }),
      []
    );
    const handleTogglePreview = useCallback(() => dispatch({ type: 'TOGGLE_PREVIEW' }), []);
    const handleToggleAuditLog = useCallback(() => dispatch({ type: 'TOGGLE_AUDIT_LOG' }), []);
    const handleSetAuditFilter = useCallback(
      (filter: 'all' | 'ai' | 'game' | 'homework' | 'attendance' | 'parent' | 'navigation') =>
        dispatch({ type: 'SET_AUDIT_FILTER', filter }),
      []
    );
    const handleExpandAuditEntry = useCallback(
      (entryId: string | null) => dispatch({ type: 'EXPAND_AUDIT_ENTRY', entryId }),
      []
    );
    const handleToggleSafeMode = useCallback(() => dispatch({ type: 'TOGGLE_SAFE_MODE' }), []);
    const handleToggleReflection = useCallback(
      () => dispatch({ type: 'TOGGLE_REFLECTION_MODAL' }),
      []
    );
    const handleAddNote = useCallback(
      (note: ParentNote) => dispatch({ type: 'ADD_NOTE', note }),
      []
    );
    const handleDeleteNote = useCallback(
      (id: string) => dispatch({ type: 'DELETE_NOTE', noteId: id }),
      []
    );
    const handleSetNoteInput = useCallback(
      (input: string) => dispatch({ type: 'SET_NOTE_INPUT', input }),
      []
    );

    const handleDownloadReport = useCallback(() => {
      generateReportCardPDF({
        childName: 'Tiny Learner',
        stats,
        weeklyEngagement: state.weeklyEngagement,
        parentNotes: state.parentNotes.map(n => ({ text: n.text, date: n.date || new Date().toISOString() })),
        attendanceMetrics,
      });
    }, [state.weeklyEngagement, state.parentNotes, stats]);

    // Memoize messages
    const messages: TeacherMessage[] = useMemo(() => INITIAL_MESSAGES, []);

    return (
      <motion.div
        className="px-4 lg:px-8 py-4 max-w-5xl mx-auto space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* 1. Gateway Hero */}
        <ParentGatewayHero
          safeMode={state.safeMode}
          totalActivities={state.weeklyEngagement.totalActivities}
        />

        {/* 2. Safe Mode Toggle */}
        <SafeModeToggle enabled={state.safeMode} onToggle={handleToggleSafeMode} />

        {/* 3. Qualitative Progress Card */}
        <QualitativeProgressCard
          skills={stats.skills}
          onViewReflection={handleToggleReflection}
        />

        {/* 4. Teacher Insights */}
        <InsightPanel
          messages={messages}
          reviews={state.insightReviews}
          expandedId={state.expandedInsight}
          onReview={handleReviewInsight}
          onAcknowledge={handleAcknowledgeInsight}
          onExpand={handleExpandInsight}
        />

        {/* 5. Engagement Insights */}
        <EngagementInsightsPanel
          stats={stats}
          weeklyEngagement={state.weeklyEngagement}
        />

        {/* 6. AI Transparency Center */}
        <AuditTimeline
          showLog={state.showAuditLog}
          filter={state.auditFilter}
          expandedEntry={state.expandedAuditEntry}
          onToggle={handleToggleAuditLog}
          onSetFilter={handleSetAuditFilter}
          onExpandEntry={handleExpandAuditEntry}
        />

        {/* 7. Weekly Engagement Snapshot */}
        <WeeklySnapshot
          engagement={state.weeklyEngagement}
          stats={stats}
          parentNotes={state.parentNotes}
          noteInput={state.noteInput}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onSetNoteInput={handleSetNoteInput}
          onDownloadReport={handleDownloadReport}
        />

        {/* Governance Footer */}
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-[9px] text-gray-400 italic max-w-md mx-auto leading-relaxed">
            🛡️ AI is a support tool. Final decisions remain human-controlled.
            This system does not rank, predict, or compare students.
          </p>
        </motion.div>
      </motion.div>
    );
  }
);

ParentDashboard.displayName = 'ParentDashboard';
