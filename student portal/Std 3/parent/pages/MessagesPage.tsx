import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

type PortalMessage = {
  id: string;
  title: string;
  content: string;
  author: string;
  date?: string;
  createdAt?: string;
  priority?: string;
  recipientType?: string;
  recipientRole?: string;
  recipientClasses?: string[];
  targetClassId?: string;
  recipientStudentId?: string;
  recipientParentId?: string;
  recipientClassId?: string;
  className?: string;
  division?: string;
  senderName?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead?: boolean;
};

type PortalMeeting = {
  id: string;
  teacherName: string;
  studentName: string;
  rollNumber: string;
  meetingType: string;
  meetingDate: string;
  meetingTime: string;
  meetingPurpose: string;
  status: string;
  standard?: string;
  division?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Theme = {
  page: string;
  panel: string;
  header: string;
  chipBg: string;
  chipFg: string;
  title: string;
  body: string;
  articleBg: string;
  articleBorder: string;
  articleShadow: string;
  asideBg: string;
  noteBg: string;
  noteBorder: string;
  meetingPanelBg?: string;
  meetingPanelBorder?: string;
  meetingPanelShadow?: string;
};

const DEFAULT_GRADE = 3;
const TEACHER_API_BASE = `${window.location.protocol}//${window.location.hostname}:5002`;

const MESSAGE_THEMES: Record<number, Theme> = {
  1: {
    page: 'linear-gradient(180deg, rgba(255,248,242,0.92) 0%, rgba(255,255,255,0.96) 100%)',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,244,236,0.88) 100%)',
    header: 'linear-gradient(90deg, rgba(255,237,225,0.9), rgba(255,250,245,0.95), rgba(255,241,230,0.92))',
    chipBg: 'rgba(255,122,89,0.12)',
    chipFg: '#dc5f3f',
    title: '#1f2937',
    body: '#5b6472',
    articleBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,250,246,0.96) 100%)',
    articleBorder: 'rgba(255, 210, 193, 0.65)',
    articleShadow: '0 14px 34px rgba(255, 122, 89, 0.08)',
    asideBg: 'linear-gradient(180deg, #ff7a59 0%, #f59e0b 100%)',
    noteBg: 'rgba(255,255,255,0.12)',
    noteBorder: 'rgba(255,255,255,0.18)',
    meetingPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,247,236,0.96) 100%)',
    meetingPanelBorder: 'rgba(255, 211, 188, 0.72)',
    meetingPanelShadow: '0 18px 48px rgba(255, 122, 89, 0.10)',
  },
  2: {
    page: 'linear-gradient(180deg, rgba(242,255,247,0.94) 0%, rgba(250,255,252,0.98) 100%)',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(240,255,246,0.90) 100%)',
    header: 'linear-gradient(90deg, rgba(229,251,238,0.95), rgba(255,255,255,0.98), rgba(233,252,243,0.95))',
    chipBg: 'rgba(16,185,129,0.12)',
    chipFg: '#0f9d6a',
    title: '#163a2d',
    body: '#49615a',
    articleBg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(245,255,249,0.96) 100%)',
    articleBorder: 'rgba(194, 245, 219, 0.7)',
    articleShadow: '0 14px 34px rgba(16, 185, 129, 0.08)',
    asideBg: 'linear-gradient(180deg, #10b981 0%, #22c55e 100%)',
    noteBg: 'rgba(255,255,255,0.12)',
    noteBorder: 'rgba(255,255,255,0.18)',
    meetingPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,255,248,0.96) 100%)',
    meetingPanelBorder: 'rgba(190, 237, 213, 0.72)',
    meetingPanelShadow: '0 18px 48px rgba(16, 185, 129, 0.10)',
  },
  3: {
    page: 'radial-gradient(circle at top, rgba(18,30,62,0.96) 0%, rgba(8,12,28,0.98) 38%, rgba(5,8,20,1) 100%)',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(235,245,255,0.94) 100%)',
    header: 'linear-gradient(90deg, rgba(236,240,255,0.96), rgba(255,255,255,0.98), rgba(230,246,255,0.96))',
    chipBg: 'rgba(79,70,229,0.12)',
    chipFg: '#4f46e5',
    title: '#10182f',
    body: '#4f5f77',
    articleBg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(242,247,255,0.96) 100%)',
    articleBorder: 'rgba(198, 210, 255, 0.7)',
    articleShadow: '0 14px 34px rgba(79, 70, 229, 0.08)',
    asideBg: 'linear-gradient(180deg, #10182f 0%, #1d4ed8 55%, #0ea5e9 100%)',
    noteBg: 'rgba(255,255,255,0.08)',
    noteBorder: 'rgba(255,255,255,0.16)',
    meetingPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,246,255,0.96) 100%)',
    meetingPanelBorder: 'rgba(194, 205, 247, 0.74)',
    meetingPanelShadow: '0 18px 48px rgba(79, 70, 229, 0.10)',
  },
  4: {
    page: 'linear-gradient(180deg, rgba(255,248,228,0.94) 0%, rgba(255,253,245,0.98) 100%)',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,248,235,0.9) 100%)',
    header: 'linear-gradient(90deg, rgba(255,240,207,0.95), rgba(255,255,255,0.98), rgba(255,247,216,0.95))',
    chipBg: 'rgba(245,158,11,0.12)',
    chipFg: '#d97706',
    title: '#4a3411',
    body: '#66574a',
    articleBg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(255,249,239,0.96) 100%)',
    articleBorder: 'rgba(248, 220, 176, 0.7)',
    articleShadow: '0 14px 34px rgba(245, 158, 11, 0.08)',
    asideBg: 'linear-gradient(180deg, #f59e0b 0%, #f97316 100%)',
    noteBg: 'rgba(255,255,255,0.14)',
    noteBorder: 'rgba(255,255,255,0.18)',
    meetingPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,250,241,0.96) 100%)',
    meetingPanelBorder: 'rgba(248, 220, 176, 0.74)',
    meetingPanelShadow: '0 18px 48px rgba(245, 158, 11, 0.10)',
  },
  5: {
    page: 'linear-gradient(180deg, rgba(241,249,244,0.94) 0%, rgba(251,255,252,0.98) 100%)',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(242,251,244,0.9) 100%)',
    header: 'linear-gradient(90deg, rgba(226,246,233,0.95), rgba(255,255,255,0.98), rgba(233,250,237,0.95))',
    chipBg: 'rgba(34,197,94,0.12)',
    chipFg: '#15803d',
    title: '#123122',
    body: '#4a5c52',
    articleBg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(245,252,247,0.96) 100%)',
    articleBorder: 'rgba(194, 235, 208, 0.72)',
    articleShadow: '0 14px 34px rgba(34, 197, 94, 0.08)',
    asideBg: 'linear-gradient(180deg, #15803d 0%, #22c55e 100%)',
    noteBg: 'rgba(255,255,255,0.12)',
    noteBorder: 'rgba(255,255,255,0.18)',
    meetingPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,251,246,0.96) 100%)',
    meetingPanelBorder: 'rgba(191, 233, 207, 0.74)',
    meetingPanelShadow: '0 18px 48px rgba(34, 197, 94, 0.10)',
  },
  6: {
    page: 'linear-gradient(180deg, rgba(239,250,255,0.94) 0%, rgba(250,254,255,0.98) 100%)',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(237,248,255,0.9) 100%)',
    header: 'linear-gradient(90deg, rgba(219,243,255,0.95), rgba(255,255,255,0.98), rgba(227,248,255,0.95))',
    chipBg: 'rgba(14,165,233,0.12)',
    chipFg: '#0369a1',
    title: '#0f3551',
    body: '#4b6477',
    articleBg: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(244,251,255,0.96) 100%)',
    articleBorder: 'rgba(189, 230, 248, 0.72)',
    articleShadow: '0 14px 34px rgba(14, 165, 233, 0.08)',
    asideBg: 'linear-gradient(180deg, #0ea5e9 0%, #14b8a6 100%)',
    noteBg: 'rgba(255,255,255,0.12)',
    noteBorder: 'rgba(255,255,255,0.18)',
    meetingPanelBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,250,255,0.96) 100%)',
    meetingPanelBorder: 'rgba(184, 226, 245, 0.74)',
    meetingPanelShadow: '0 18px 48px rgba(14, 165, 233, 0.10)',
  },
};

function getMessageTheme(grade: number) {
  return MESSAGE_THEMES[grade as keyof typeof MESSAGE_THEMES] || MESSAGE_THEMES[3];
}

function buildClassIds(grade: number): string[] {
  return ['A', 'B', 'C'].map(section => `admin-class-${grade}-${section}`);
}

function normalizeClassTarget(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const direct = raw.match(/^admin-class-(\d+)-([A-Z])$/i);
  if (direct) {
    return `admin-class-${parseInt(direct[1], 10)}-${direct[2].toUpperCase()}`;
  }

  const compact = raw.match(/(?:class|std)?\s*[-:]?\s*(\d+)\s*[-_\s]*([A-Z])?/i);
  if (compact) {
    const section = (compact[2] || 'A').toUpperCase();
    return `admin-class-${parseInt(compact[1], 10)}-${section}`;
  }

  const digits = raw.match(/\d+/);
  if (digits) {
    return `admin-class-${parseInt(digits[0], 10)}-A`;
  }

  return raw.toLowerCase();
}

function getAudienceLabel(message: PortalMessage): string {
  const type = String(message.recipientType || message.recipientRole || 'all').toLowerCase();
  if (type === 'class') return 'Class';
  if (type === 'student') return 'Student';
  if (type === 'parent') return 'Parent';
  return 'All';
}

function getPriorityStyle(priority?: string) {
  const value = String(priority || 'medium').toLowerCase();
  if (value === 'urgent') return { bg: 'rgba(239,68,68,0.12)', fg: '#DC2626' };
  if (value === 'high') return { bg: 'rgba(249,115,22,0.12)', fg: '#EA580C' };
  if (value === 'low') return { bg: 'rgba(16,185,129,0.12)', fg: '#059669' };
  return { bg: 'rgba(245,158,11,0.12)', fg: '#D97706' };
}

function normalizeIdentifier(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function buildParentVisibilityIdentifiers(profile: any): string[] {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  const values = [
    profile?.parentId,
    profile?.parent_id,
    profile?.parentAccessId,
    profile?.parentAccessKey,
    profile?.studentId,
    profile?.student_id,
    profile?.grNo,
    profile?.grNumber,
    profile?.gr_number,
    profile?.admissionNumber,
    profile?.admission_number,
    profile?.rollNumber,
    profile?.roll_number,
    ...children.flatMap((child: any) => [
      child?.parentId,
      child?.parent_id,
      child?.parentAccessId,
      child?.parentAccessKey,
      child?.studentId,
      child?.student_id,
      child?.grNo,
      child?.grNumber,
      child?.admissionNumber,
      child?.rollNumber,
    ]),
  ];
  return [...new Set(values.map(normalizeIdentifier).filter(Boolean))];
}

async function loadMessages(parentIdentifiers: string[], classKey: string): Promise<PortalMessage[]> {
  const primaryParentId = parentIdentifiers[0];
  if (!primaryParentId) return [];

  const query = new URLSearchParams({
    classId: classKey,
    limit: '100',
  });
  if (parentIdentifiers.length > 0) {
    query.set('aliases', parentIdentifiers.join(','));
    query.set('parentAliases', parentIdentifiers.join(','));
  }

  const response = await fetch(`${TEACHER_API_BASE}/api/messages/parent/${encodeURIComponent(primaryParentId)}?${query.toString()}`);
  if (!response.ok) throw new Error(`Failed to load messages (${response.status})`);
  const data = await response.json().catch(() => ({}));
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .sort((a: PortalMessage, b: PortalMessage) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
}

async function markMessageAsRead(messageId: string, parentIdentifiers: string[], classKey: string): Promise<void> {
  const primaryParentId = parentIdentifiers[0];
  if (!primaryParentId || !messageId) return;

  const response = await fetch(`${TEACHER_API_BASE}/api/messages/${encodeURIComponent(messageId)}/read?classId=${encodeURIComponent(classKey)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentId: primaryParentId,
      aliases: parentIdentifiers.join(','),
      parentAliases: parentIdentifiers,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || `Failed to mark message as read (${response.status})`);
  }
}

function buildParentQuery(parentIdentifiers: string[], classKey: string): string {
  const query = new URLSearchParams({
    classId: classKey,
  });
  const primaryParentId = parentIdentifiers[0];
  if (primaryParentId) query.set('parentId', primaryParentId);
  if (parentIdentifiers.length > 0) {
    const aliases = parentIdentifiers.join(',');
    query.set('aliases', aliases);
    query.set('parentAliases', aliases);
    query.set('studentAliases', aliases);
  }
  return query.toString();
}

async function loadMeetings(parentIdentifiers: string[], classKey: string): Promise<PortalMeeting[]> {
  const query = buildParentQuery(parentIdentifiers, classKey);
  const response = await fetch(`${TEACHER_API_BASE}/api/parent/my-meetings?${query}`);
  if (!response.ok) throw new Error(`Failed to load meetings (${response.status})`);
  const data = await response.json().catch(() => ({}));
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.sort((a: PortalMeeting, b: PortalMeeting) => {
    const first = new Date(`${a.meetingDate || ''}T${a.meetingTime || '00:00'}`).getTime();
    const second = new Date(`${b.meetingDate || ''}T${b.meetingTime || '00:00'}`).getTime();
    return second - first;
  });
}

type MessagesPageProps = {
  grade?: number;
  studentProfile?: any;
};

export const MessagesPageView: React.FC<MessagesPageProps> = ({ grade = DEFAULT_GRADE, studentProfile = null }) => {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [meetings, setMeetings] = useState<PortalMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [error, setError] = useState('');
  const [meetingError, setMeetingError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'child' | 'class'>('all');
  const [activeSection, setActiveSection] = useState<'messages' | 'meetings'>('messages');
  const theme = useMemo(() => getMessageTheme(grade), [grade]);
  const parentIdentifiers = useMemo(() => buildParentVisibilityIdentifiers(studentProfile), [studentProfile]);
  const primaryParentId = parentIdentifiers[0] || '';
  const classKey = useMemo(() => {
    const gradeValue = Number(studentProfile?.grade || grade) || grade;
    const division = String(studentProfile?.division || 'A').trim().toUpperCase() || 'A';
    return `admin-class-${gradeValue}-${division}`;
  }, [studentProfile?.division, studentProfile?.grade]);

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages;
    return messages.filter((message) => {
      const recipientType = String(message.recipientType || message.recipientRole || '').toLowerCase();
      if (activeFilter === 'direct') return recipientType === 'parent';
      if (activeFilter === 'child') return recipientType === 'student';
      if (activeFilter === 'class') return recipientType === 'class';
      return true;
    });
  }, [activeFilter, messages]);

  useEffect(() => {
    if (!primaryParentId) {
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const loaded = await loadMessages(parentIdentifiers, classKey);
        if (alive) setMessages(loaded);
      } catch {
        if (alive) {
          setMessages([]);
          setError('Messages will appear here once the teacher sends them.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const loaded = await loadMessages(parentIdentifiers, classKey);
          if (alive) setMessages(loaded);
        } catch {
          // Keep the last known messages on transient errors.
        }
      })();
    }, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [classKey, parentIdentifiers, primaryParentId]);

  useEffect(() => {
    if (activeSection !== 'meetings') return;
    if (!primaryParentId) {
      setMeetingLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setMeetingLoading(true);
        setMeetingError('');
        const loaded = await loadMeetings(parentIdentifiers, classKey);
        if (alive) setMeetings(loaded);
      } catch {
        if (alive) {
          setMeetings([]);
          setMeetingError('No meetings scheduled yet.');
        }
      } finally {
        if (alive) setMeetingLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [activeSection, classKey, parentIdentifiers, primaryParentId]);

  const subtitle = useMemo(() => `Only messages selected for Std ${grade} will appear here.`, [grade]);

  const handleRead = async (message: PortalMessage) => {
    if (message.isRead) return;
    try {
      await markMessageAsRead(message.id, parentIdentifiers, classKey);
      setMessages((previous) => previous.map((item) => (item.id === message.id ? { ...item, isRead: true } : item)));
      window.dispatchEvent(new CustomEvent('ssms-parent-message-updated'));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="rounded-[28px] backdrop-blur-xl overflow-hidden" style={{ background: theme.page, border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 24px 80px rgba(92,106,196,0.12)' }}>
        <div className="p-6 md:p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.65)', background: theme.header }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-[0.22em]" style={{ background: theme.chipBg, color: theme.chipFg }}>Parent Inbox</div>
          <h1 className="mt-4 text-3xl md:text-4xl font-black" style={{ color: theme.title }}>Messages for parents</h1>
          <p className="mt-2 text-sm md:text-base max-w-2xl" style={{ color: theme.body }}>{subtitle}</p>
        </div>

        <div className="px-6 md:px-8 pt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('messages')}
            className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
            style={{
              background: activeSection === 'messages' ? theme.chipBg : 'rgba(255,255,255,0.5)',
              color: activeSection === 'messages' ? theme.chipFg : theme.body,
              border: `1px solid ${activeSection === 'messages' ? theme.articleBorder : 'rgba(255,255,255,0.45)'}`,
            }}
          >
            Messages
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('meetings')}
            className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
            style={{
              background: activeSection === 'meetings' ? theme.chipBg : 'rgba(255,255,255,0.5)',
              color: activeSection === 'meetings' ? theme.chipFg : theme.body,
              border: `1px solid ${activeSection === 'meetings' ? theme.articleBorder : 'rgba(255,255,255,0.45)'}`,
            }}
          >
            Meeting
          </button>
        </div>

        <div className="px-6 md:px-8 pt-5 flex flex-wrap gap-2" style={{ display: activeSection === 'messages' ? 'flex' : 'none' }}>
          {(['all', 'direct', 'child', 'class'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{
                background: activeFilter === filter ? theme.chipBg : 'rgba(255,255,255,0.5)',
                color: activeFilter === filter ? theme.chipFg : theme.body,
                border: `1px solid ${activeFilter === filter ? theme.articleBorder : 'rgba(255,255,255,0.45)'}`,
              }}
            >
              {filter === 'all' ? 'All Messages' : filter === 'direct' ? 'Direct Messages' : filter === 'child' ? 'Child Messages' : 'Class Messages'}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 md:p-8" style={{ display: activeSection === 'messages' ? 'grid' : 'none' }}>
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border p-5 text-sm" style={{ background: theme.articleBg, borderColor: theme.articleBorder, color: theme.body, boxShadow: theme.articleShadow }}>Loading messages...</div>
            ) : filteredMessages.length > 0 ? (
              filteredMessages.map((message) => {
                const priorityStyle = getPriorityStyle(message.priority);
                const recipientType = String(message.recipientType || message.recipientRole || '').toLowerCase();
                const relationLabel = recipientType === 'parent'
                  ? 'Direct Parent Message'
                  : recipientType === 'student'
                    ? 'Child Message'
                    : 'Class Message';
                const isUnread = !message.isRead;
                return (
                  <article
                    key={message.id}
                    className="rounded-3xl border p-5 transition-all duration-200"
                    onClick={() => void handleRead(message)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void handleRead(message);
                      }
                    }}
                    style={{
                      background: isUnread ? 'rgba(255,255,255,0.99)' : theme.articleBg,
                      borderColor: isUnread ? theme.chipFg : theme.articleBorder,
                      boxShadow: isUnread ? '0 18px 42px rgba(79,70,229,0.12)' : theme.articleShadow,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: theme.chipFg }}>{message.author || 'Teacher'}</p>
                        <h2 className="mt-1 text-xl font-bold" style={{ color: theme.title, opacity: isUnread ? 1 : 0.92 }}>{message.title}</h2>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.body }}>{relationLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!message.isRead && (
                          <span className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>
                            New
                          </span>
                        )}
                        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: priorityStyle.bg, color: priorityStyle.fg }}>{getAudienceLabel(message)}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6" style={{ color: theme.body }}>{message.content}</p>
                    {message.attachmentUrl && (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
                        style={{ background: theme.chipBg, color: theme.chipFg }}
                      >
                        Attachment
                      </a>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      <span>{message.date || message.createdAt ? new Date(message.date || message.createdAt || '').toLocaleString() : ''}</span>
                      <span>{isUnread ? 'Unread' : 'Read'} · Std {grade}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border p-5 text-sm" style={{ background: theme.articleBg, borderColor: theme.articleBorder, color: theme.body, boxShadow: theme.articleShadow }}>
                {error || 'No messages yet.'}
              </div>
            )}
          </div>

          <aside className="rounded-3xl p-6 text-white" style={{ background: theme.asideBg, boxShadow: '0 18px 60px rgba(59,130,246,0.22)' }}>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/75">Quick Note</p>
            <h2 className="mt-3 text-2xl font-black">Only parent-relevant school updates appear here.</h2>
            <p className="mt-3 text-sm leading-6 text-white/85">Direct parent messages, child messages, and class messages will show here when the teacher sends them.</p>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl p-4" style={{ background: theme.noteBg, border: `1px solid ${theme.noteBorder}` }}>
                <p className="text-sm font-bold">Class updates</p>
                <p className="text-xs mt-1 text-white/75">Sent to the whole class and all parents.</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: theme.noteBg, border: `1px solid ${theme.noteBorder}` }}>
                <p className="text-sm font-bold">Student and parent messages</p>
                <p className="text-xs mt-1 text-white/75">Shown with the correct subtitle.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 md:p-8" style={{ display: activeSection === 'meetings' ? 'grid' : 'none' }}>
          <div className="space-y-4">
            {meetingLoading ? (
              <div className="rounded-3xl border p-5 text-sm" style={{ background: theme.meetingPanelBg || theme.articleBg, borderColor: theme.meetingPanelBorder || theme.articleBorder, color: theme.body, boxShadow: theme.meetingPanelShadow || theme.articleShadow }}>Loading meetings...</div>
            ) : meetings.length > 0 ? (
              meetings.map((meeting) => {
                const status = String(meeting.status || 'scheduled').toLowerCase();
                const statusLabel = status === 'completed'
                  ? 'Completed'
                  : status === 'cancelled'
                    ? 'Cancelled'
                    : status === 'rescheduled'
                      ? 'Rescheduled'
                      : 'Scheduled';

                return (
                  <article
                    key={meeting.id}
                  className="rounded-3xl border p-5"
                  style={{
                      background: theme.meetingPanelBg || theme.articleBg,
                      borderColor: theme.meetingPanelBorder || theme.articleBorder,
                      boxShadow: theme.meetingPanelShadow || theme.articleShadow,
                  }}
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: theme.chipFg }}>
                          {meeting.teacherName || 'Teacher'}
                        </p>
                        <h2 className="mt-1 text-xl font-bold" style={{ color: theme.title }}>
                          {meeting.studentName || 'Student'} Meeting
                        </h2>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.body }}>
                          {meeting.standard || ''}{meeting.division || ''}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          background:
                            status === 'completed'
                              ? 'rgba(16,185,129,0.12)'
                              : status === 'cancelled'
                                ? 'rgba(244,63,94,0.12)'
                                : status === 'rescheduled'
                                  ? 'rgba(14,165,233,0.12)'
                                  : 'rgba(245,158,11,0.12)',
                          color:
                            status === 'completed'
                              ? '#059669'
                              : status === 'cancelled'
                                ? '#e11d48'
                                : status === 'rescheduled'
                                  ? '#0284c7'
                                  : '#d97706',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm" style={{ color: theme.body }}>
                      <p><span className="font-semibold">Student Name:</span> {meeting.studentName || 'Student'}</p>
                      <p><span className="font-semibold">Roll Number:</span> {meeting.rollNumber || 'N/A'}</p>
                      <p><span className="font-semibold">Teacher:</span> {meeting.teacherName || 'Teacher'}</p>
                      <p><span className="font-semibold">Meeting Type:</span> {meeting.meetingType || 'Regular PTM'}</p>
                      <p><span className="font-semibold">Date:</span> {meeting.meetingDate || 'N/A'}</p>
                      <p><span className="font-semibold">Time:</span> {meeting.meetingTime || 'N/A'}</p>
                      <p><span className="font-semibold">Purpose:</span> {meeting.meetingPurpose || 'N/A'}</p>
                      <p><span className="font-semibold">Created At:</span> {meeting.createdAt ? new Date(meeting.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border p-5 text-sm" style={{ background: theme.meetingPanelBg || theme.articleBg, borderColor: theme.meetingPanelBorder || theme.articleBorder, color: theme.body, boxShadow: theme.meetingPanelShadow || theme.articleShadow }}>
                {meetingError || 'No meetings scheduled yet.'}
              </div>
            )}
          </div>

          <aside className="rounded-3xl p-6 text-white" style={{ background: theme.asideBg, boxShadow: theme.meetingPanelShadow || '0 18px 60px rgba(59,130,246,0.22)' }}>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/75">Meeting Tab</p>
            <h2 className="mt-3 text-2xl font-black">Parent-teacher meetings appear here only for your child.</h2>
            <p className="mt-3 text-sm leading-6 text-white/85">This section shows only student-linked meetings scheduled by teachers.</p>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl p-4" style={{ background: theme.noteBg, border: `1px solid ${theme.noteBorder}` }}>
                <p className="text-sm font-bold">Student-specific</p>
                <p className="text-xs mt-1 text-white/75">Other parents cannot see these meetings.</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: theme.noteBg, border: `1px solid ${theme.noteBorder}` }}>
                <p className="text-sm font-bold">Teacher scheduled</p>
                <p className="text-xs mt-1 text-white/75">Loaded from the database and linked to your child.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export const MessagesPage: React.FC = () => {
  const { studentProfile } = useAuth();
  return <MessagesPageView grade={DEFAULT_GRADE} studentProfile={studentProfile} />;
};

export default MessagesPage;
