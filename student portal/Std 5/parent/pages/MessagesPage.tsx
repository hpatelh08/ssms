import React, { useEffect, useMemo, useState } from 'react';

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
};

const GRADE = 5;
const TEACHER_API_BASE = `${window.location.protocol}//${window.location.hostname}:5001`;

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

async function loadMessages(grade: number): Promise<PortalMessage[]> {
  const response = await fetch(`${TEACHER_API_BASE}/api/communication/announcements?limit=100`);
  if (!response.ok) throw new Error(`Failed to load messages (${response.status})`);
  const data = await response.json().catch(() => ({}));
  const classIds = buildClassIds(grade);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .filter((item: PortalMessage) => {
      const classes = Array.isArray(item.recipientClasses) ? item.recipientClasses.map(normalizeClassTarget) : [];
      const targetClassId = normalizeClassTarget(item.targetClassId || '');
      const audience = String(item.recipientType || item.recipientRole || 'all').toLowerCase();
      const classMatch = classes.some(classId => classIds.includes(classId)) || classIds.includes(targetClassId);
      if (classMatch) return true;
      if (audience === 'all') return true;
      if (audience === 'parent' || audience === 'student') return classIds.includes(targetClassId);
      return false;
    })
    .sort((a: PortalMessage, b: PortalMessage) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
}

export const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const loaded = await loadMessages(GRADE);
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
          const loaded = await loadMessages(GRADE);
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
  }, []);

  const subtitle = useMemo(() => `Only messages selected for Std ${GRADE} will appear here.`, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_24px_80px_rgba(92,106,196,0.12)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-extrabold uppercase tracking-[0.22em]">Parent Inbox</div>
          <h1 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">Messages for parents</h1>
          <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl">{subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 md:p-8">
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-sm text-slate-500 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">Loading messages...</div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const priorityStyle = getPriorityStyle(message.priority);
                return (
                  <article key={message.id} className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-500">{message.author || 'Teacher'}</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">{message.title}</h2>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: priorityStyle.bg, color: priorityStyle.fg }}>{getAudienceLabel(message)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{message.content}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-400">
                      <span>{message.date || message.createdAt ? new Date(message.date || message.createdAt || '').toLocaleString() : ''}</span>
                      <span>Std {GRADE}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-sm text-slate-500 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
                {error || 'No messages yet.'}
              </div>
            )}
          </div>

          <aside className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white shadow-[0_18px_60px_rgba(59,130,246,0.25)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/75">Quick Note</p>
            <h2 className="mt-3 text-2xl font-black">Only parent-relevant school updates appear here.</h2>
            <p className="mt-3 text-sm leading-6 text-white/85">Class messages, student messages, and parent messages will show here when the teacher sends them.</p>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                <p className="text-sm font-bold">Class updates</p>
                <p className="text-xs mt-1 text-white/75">Sent to the whole class and all parents.</p>
              </div>
              <div className="rounded-2xl bg-white/12 border border-white/15 p-4">
                <p className="text-sm font-bold">Student and parent messages</p>
                <p className="text-xs mt-1 text-white/75">Shown with the correct subtitle.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
