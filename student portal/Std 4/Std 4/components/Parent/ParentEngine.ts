// ParentEngine.ts — State management & utilities for Parent Control Center
// useReducer-based state, types, mock data generators, helpers
import { UserStats, SkillLevel, TextbookChunk, TeacherMessage, AuditLogEntry } from '../../types';
import { getAuditLog, getAIInteractionLog } from '../../utils/auditLog';

// ─── Types ────────────────────────────────────────────────────
export interface InsightReview {
  messageId: string;
  reviewed: boolean;
  acknowledged: boolean;
  reviewedAt?: string;
}

export interface ParentNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface FeedProgress {
  status: 'idle' | 'previewing' | 'feeding' | 'success' | 'error';
  progress: number; // 0-100
}

export interface WeeklyEngagement {
  totalActivities: number;
  gamesPlayed: number;
  homeworkDone: number;
  aiQuestions: number;
  booksUsed: number;
  daysActive: number;
}

export interface ParentState {
  // UI
  activeSection: string | null;
  safeMode: boolean;
  // Insights
  insightReviews: Record<string, InsightReview>;
  expandedInsight: string | null;
  // Knowledge
  feedProgress: FeedProgress;
  showPreview: boolean;
  subjectFilter: 'All' | 'English' | 'Math';
  // Audit
  showAuditLog: boolean;
  auditFilter: 'all' | 'ai' | 'game' | 'homework' | 'attendance' | 'parent' | 'navigation';
  expandedAuditEntry: string | null;
  // Modals
  showReflectionModal: boolean;
  showReportModal: boolean;
  // Notes
  parentNotes: ParentNote[];
  noteInput: string;
  // Engagement
  weeklyEngagement: WeeklyEngagement;
}

export type ParentAction =
  | { type: 'SET_ACTIVE_SECTION'; section: string | null }
  | { type: 'TOGGLE_SAFE_MODE' }
  | { type: 'REVIEW_INSIGHT'; messageId: string }
  | { type: 'ACKNOWLEDGE_INSIGHT'; messageId: string }
  | { type: 'EXPAND_INSIGHT'; messageId: string | null }
  | { type: 'SET_FEED_PROGRESS'; progress: FeedProgress }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_SUBJECT_FILTER'; filter: 'All' | 'English' | 'Math' }
  | { type: 'TOGGLE_AUDIT_LOG' }
  | { type: 'SET_AUDIT_FILTER'; filter: ParentState['auditFilter'] }
  | { type: 'EXPAND_AUDIT_ENTRY'; entryId: string | null }
  | { type: 'TOGGLE_REFLECTION_MODAL' }
  | { type: 'TOGGLE_REPORT_MODAL' }
  | { type: 'ADD_NOTE'; note: ParentNote }
  | { type: 'DELETE_NOTE'; noteId: string }
  | { type: 'SET_NOTE_INPUT'; input: string }
  | { type: 'SET_WEEKLY_ENGAGEMENT'; engagement: WeeklyEngagement };

// ─── Reducer ──────────────────────────────────────────────────
export function parentReducer(state: ParentState, action: ParentAction): ParentState {
  switch (action.type) {
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.section };
    case 'TOGGLE_SAFE_MODE':
      return { ...state, safeMode: !state.safeMode };
    case 'REVIEW_INSIGHT':
      return {
        ...state,
        insightReviews: {
          ...state.insightReviews,
          [action.messageId]: {
            ...state.insightReviews[action.messageId],
            messageId: action.messageId,
            reviewed: true,
            reviewedAt: new Date().toISOString(),
          },
        },
      };
    case 'ACKNOWLEDGE_INSIGHT':
      return {
        ...state,
        insightReviews: {
          ...state.insightReviews,
          [action.messageId]: {
            ...state.insightReviews[action.messageId],
            messageId: action.messageId,
            acknowledged: true,
          },
        },
      };
    case 'EXPAND_INSIGHT':
      return { ...state, expandedInsight: action.messageId };
    case 'SET_FEED_PROGRESS':
      return { ...state, feedProgress: action.progress };
    case 'TOGGLE_PREVIEW':
      return { ...state, showPreview: !state.showPreview };
    case 'SET_SUBJECT_FILTER':
      return { ...state, subjectFilter: action.filter };
    case 'TOGGLE_AUDIT_LOG':
      return { ...state, showAuditLog: !state.showAuditLog };
    case 'SET_AUDIT_FILTER':
      return { ...state, auditFilter: action.filter };
    case 'EXPAND_AUDIT_ENTRY':
      return { ...state, expandedAuditEntry: action.entryId };
    case 'TOGGLE_REFLECTION_MODAL':
      return { ...state, showReflectionModal: !state.showReflectionModal };
    case 'TOGGLE_REPORT_MODAL':
      return { ...state, showReportModal: !state.showReportModal };
    case 'ADD_NOTE':
      return { ...state, parentNotes: [action.note, ...state.parentNotes], noteInput: '' };
    case 'DELETE_NOTE':
      return { ...state, parentNotes: state.parentNotes.filter(n => n.id !== action.noteId) };
    case 'SET_NOTE_INPUT':
      return { ...state, noteInput: action.input };
    case 'SET_WEEKLY_ENGAGEMENT':
      return { ...state, weeklyEngagement: action.engagement };
    default:
      return state;
  }
}

// ─── Initial State ────────────────────────────────────────────
export function createInitialParentState(): ParentState {
  const savedNotes = localStorage.getItem('ssms_parent_notes');
  const savedReviews = localStorage.getItem('ssms_insight_reviews');
  const savedSafeMode = localStorage.getItem('ssms_safe_mode');

  return {
    activeSection: null,
    safeMode: savedSafeMode === 'true',
    insightReviews: savedReviews ? JSON.parse(savedReviews) : {},
    expandedInsight: null,
    feedProgress: { status: 'idle', progress: 0 },
    showPreview: false,
    subjectFilter: 'All',
    showAuditLog: false,
    auditFilter: 'all',
    expandedAuditEntry: null,
    showReflectionModal: false,
    showReportModal: false,
    parentNotes: savedNotes ? JSON.parse(savedNotes) : [],
    noteInput: '',
    weeklyEngagement: computeWeeklyEngagement(),
  };
}

// ─── Engagement Computation ───────────────────────────────────
export function computeWeeklyEngagement(): WeeklyEngagement {
  const logs = getAuditLog();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekLogs = logs.filter(l => new Date(l.timestamp) >= oneWeekAgo);
  const gameLogs = weekLogs.filter(l => l.category === 'game');
  const homeworkLogs = weekLogs.filter(l => l.category === 'homework' && l.action.includes('complete'));
  const aiLogs = weekLogs.filter(l => l.category === 'ai');
  const activeDays = new Set(weekLogs.map(l => l.timestamp.split('T')[0])).size;

  return {
    totalActivities: weekLogs.length,
    gamesPlayed: gameLogs.length,
    homeworkDone: homeworkLogs.length,
    aiQuestions: aiLogs.length,
    booksUsed: new Set(aiLogs.map(l => (l.details as any)?.subject).filter(Boolean)).size,
    daysActive: activeDays,
  };
}

// ─── Skill Level Helpers ──────────────────────────────────────
export const SKILL_EMOJI: Record<SkillLevel, string> = {
  Star: '🤩',
  Active: '😊',
  Improving: '🙂',
  Developing: '👶',
};

export const SKILL_TOOLTIP: Record<SkillLevel, string> = {
  Star: 'Excelling — consistently demonstrates strong understanding',
  Active: 'Engaged — actively participating and making progress',
  Improving: 'Growing — showing steady improvement with practice',
  Developing: 'Starting — building foundational skills',
};

export const SKILL_PROGRESS: Record<SkillLevel, number> = {
  Developing: 25,
  Improving: 50,
  Active: 75,
  Star: 100,
};

export const SKILL_COLORS: Record<string, { gradient: string; bar: string; glow: string }> = {
  Reading: { gradient: 'from-orange-100/70 to-amber-50/50', bar: 'from-orange-400 to-amber-400', glow: 'rgba(251,146,60,0.3)' },
  Writing: { gradient: 'from-blue-100/70 to-cyan-50/50', bar: 'from-blue-400 to-cyan-400', glow: 'rgba(59,130,246,0.3)' },
  Participation: { gradient: 'from-purple-100/70 to-pink-50/50', bar: 'from-purple-400 to-pink-400', glow: 'rgba(168,85,247,0.3)' },
};

// ─── Teacher Remark Highlights ────────────────────────────────
export function highlightKeyPhrases(text: string): { text: string; isHighlight: boolean }[] {
  const keywords = [
    'great progress', 'well done', 'keep practicing', 'improvement',
    'excellent', 'needs attention', 'good effort', 'practice',
    'Remember', 'wonderful', 'proud', 'focus',
  ];
  const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map(part => ({
    text: part,
    isHighlight: keywords.some(k => k.toLowerCase() === part.toLowerCase()),
  }));
}

// ─── Audit Helpers ────────────────────────────────────────────
export const AUDIT_CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ai: { label: 'AI', color: 'text-cyan-600', bg: 'bg-cyan-100/60', icon: '🤖' },
  homework: { label: 'Homework', color: 'text-amber-600', bg: 'bg-amber-100/60', icon: '📝' },
  game: { label: 'Game', color: 'text-purple-600', bg: 'bg-purple-100/60', icon: '🎮' },
  attendance: { label: 'Attendance', color: 'text-green-600', bg: 'bg-green-100/60', icon: '📅' },
  parent: { label: 'Parent', color: 'text-blue-600', bg: 'bg-blue-100/60', icon: '🛡️' },
  navigation: { label: 'Nav', color: 'text-gray-500', bg: 'bg-gray-100/60', icon: '🧭' },
};

export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Persistence ──────────────────────────────────────────────
export function persistParentState(state: ParentState) {
  try {
    localStorage.setItem('ssms_parent_notes', JSON.stringify(state.parentNotes));
    localStorage.setItem('ssms_insight_reviews', JSON.stringify(state.insightReviews));
    localStorage.setItem('ssms_safe_mode', String(state.safeMode));
  } catch (e) {
    console.warn('Parent state persistence failed:', e);
  }
}
