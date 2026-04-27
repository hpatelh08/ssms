import React, { useEffect, useMemo, useState } from 'react';
import { getTeacherPortalJson, toTeacherFileUrl } from '../../services/teacherPortal';

type StudentLike = {
  studentId?: string;
  parentAccessKey?: string;
  studentName?: string;
  className?: string;
  section?: string;
  division?: string;
  grade?: number;
  children?: Array<Partial<StudentLike> & Record<string, unknown>>;
};

type ChildOption = {
  studentId: string;
  parentAccessKey: string;
  studentName: string;
  className: string;
  division: string;
};

type AssignmentRecord = {
  _id: string;
  title?: string;
  description?: string;
  dueDate?: string;
  totalMarks?: number;
  assignmentType?: string;
  subject?: { subjectName?: string } | string;
  standard?: string;
  division?: string;
  class?: { className?: string; section?: string; _id?: string } | string;
  createdAt?: string;
  attachment?: { filename?: string; path?: string; originalName?: string; size?: number; mimetype?: string } | null;
  attachments?: Array<{ filename?: string; path?: string; originalName?: string; size?: number; mimetype?: string }>;
};

type Theme = {
  hero: string;
  heroShadow: string;
  panelBg: string;
  panelBorder: string;
  label: string;
  chipBg: string;
  chipText: string;
  buttonFrom: string;
  buttonTo: string;
  buttonShadow: string;
  cardBorder: string;
  cardShadow: string;
  accent: string;
};

const ASSIGNMENT_THEME_MAP: Record<string, Theme> = {
  '1': {
    hero: 'linear-gradient(135deg, rgba(79,70,229,0.96), rgba(99,102,241,0.96), rgba(168,85,247,0.92))',
    heroShadow: '0 22px 50px rgba(99,102,241,0.22)',
    panelBg: 'rgba(255,255,255,0.16)',
    panelBorder: 'rgba(255,255,255,0.15)',
    label: 'text-white/70',
    chipBg: 'bg-indigo-50',
    chipText: 'text-indigo-700',
    buttonFrom: 'from-indigo-600',
    buttonTo: 'to-violet-600',
    buttonShadow: 'shadow-[0_12px_28px_rgba(79,70,229,0.24)]',
    cardBorder: 'border-white/70',
    cardShadow: 'shadow-[0_16px_40px_rgba(99,102,241,0.10)]',
    accent: 'text-indigo-500',
  },
  '2': {
    hero: 'linear-gradient(135deg, rgba(16,185,129,0.96), rgba(14,165,233,0.95), rgba(59,130,246,0.92))',
    heroShadow: '0 22px 50px rgba(14,165,233,0.22)',
    panelBg: 'rgba(255,255,255,0.16)',
    panelBorder: 'rgba(255,255,255,0.15)',
    label: 'text-white/70',
    chipBg: 'bg-cyan-50',
    chipText: 'text-cyan-700',
    buttonFrom: 'from-cyan-600',
    buttonTo: 'to-sky-600',
    buttonShadow: 'shadow-[0_12px_28px_rgba(14,165,233,0.24)]',
    cardBorder: 'border-white/70',
    cardShadow: 'shadow-[0_16px_40px_rgba(14,165,233,0.10)]',
    accent: 'text-cyan-600',
  },
  '3': {
    hero: 'linear-gradient(135deg, rgba(8,15,35,0.98), rgba(24,27,72,0.96), rgba(67,56,202,0.94))',
    heroShadow: '0 22px 50px rgba(67,56,202,0.26)',
    panelBg: 'rgba(10,16,34,0.32)',
    panelBorder: 'rgba(148,163,184,0.22)',
    label: 'text-cyan-100/70',
    chipBg: 'bg-cyan-950/40',
    chipText: 'text-cyan-200',
    buttonFrom: 'from-cyan-500',
    buttonTo: 'to-indigo-500',
    buttonShadow: 'shadow-[0_12px_28px_rgba(34,211,238,0.24)]',
    cardBorder: 'border-cyan-200/20',
    cardShadow: 'shadow-[0_16px_40px_rgba(15,23,42,0.30)]',
    accent: 'text-cyan-300',
  },
  '4': {
    hero: 'linear-gradient(135deg, rgba(249,115,22,0.96), rgba(239,68,68,0.96), rgba(236,72,153,0.92))',
    heroShadow: '0 22px 50px rgba(249,115,22,0.22)',
    panelBg: 'rgba(255,255,255,0.16)',
    panelBorder: 'rgba(255,255,255,0.15)',
    label: 'text-white/75',
    chipBg: 'bg-rose-50',
    chipText: 'text-rose-700',
    buttonFrom: 'from-orange-500',
    buttonTo: 'to-pink-500',
    buttonShadow: 'shadow-[0_12px_28px_rgba(249,115,22,0.24)]',
    cardBorder: 'border-white/70',
    cardShadow: 'shadow-[0_16px_40px_rgba(249,115,22,0.10)]',
    accent: 'text-orange-500',
  },
  '5': {
    hero: 'linear-gradient(135deg, rgba(34,197,94,0.96), rgba(16,185,129,0.96), rgba(14,165,233,0.92))',
    heroShadow: '0 22px 50px rgba(34,197,94,0.22)',
    panelBg: 'rgba(255,255,255,0.16)',
    panelBorder: 'rgba(255,255,255,0.15)',
    label: 'text-white/75',
    chipBg: 'bg-emerald-50',
    chipText: 'text-emerald-700',
    buttonFrom: 'from-emerald-600',
    buttonTo: 'to-teal-600',
    buttonShadow: 'shadow-[0_12px_28px_rgba(16,185,129,0.24)]',
    cardBorder: 'border-white/70',
    cardShadow: 'shadow-[0_16px_40px_rgba(16,185,129,0.10)]',
    accent: 'text-emerald-600',
  },
  '6': {
    hero: 'linear-gradient(135deg, rgba(14,165,233,0.96), rgba(59,130,246,0.96), rgba(34,197,94,0.92))',
    heroShadow: '0 22px 50px rgba(14,165,233,0.22)',
    panelBg: 'rgba(255,255,255,0.16)',
    panelBorder: 'rgba(255,255,255,0.15)',
    label: 'text-white/75',
    chipBg: 'bg-cyan-50',
    chipText: 'text-cyan-700',
    buttonFrom: 'from-cyan-600',
    buttonTo: 'to-sky-600',
    buttonShadow: 'shadow-[0_12px_28px_rgba(14,165,233,0.24)]',
    cardBorder: 'border-white/70',
    cardShadow: 'shadow-[0_16px_40px_rgba(14,165,233,0.10)]',
    accent: 'text-cyan-600',
  },
};

function getAssignmentTheme(grade?: number | string | null): Theme {
  return ASSIGNMENT_THEME_MAP[String(grade || '')] || ASSIGNMENT_THEME_MAP['1'];
}

function getClassLabel(item: AssignmentRecord, student?: StudentLike | null) {
  const className = item.class && typeof item.class === 'object' ? item.class.className : item.standard;
  const section = item.class && typeof item.class === 'object' ? item.class.section : item.division;
  const fallbackGrade = student?.grade ? `Std ${student.grade}` : '';
  return `${className || fallbackGrade}${section ? `-${section}` : ''}`.replace(/^-|-$/g, '') || 'Class';
}

function getAssignmentFileLink(item: AssignmentRecord) {
  const attachment = item.attachment || item.attachments?.[0] || null;
  return toTeacherFileUrl(attachment?.path || '');
}

function getAssignmentDownloadName(item: AssignmentRecord, fallbackLink: string) {
  const attachment = item.attachment || item.attachments?.[0] || null;
  const candidate =
    attachment?.originalName ||
    attachment?.filename ||
    (fallbackLink ? (() => {
      try {
        const parsed = new URL(fallbackLink);
        return decodeURIComponent(parsed.pathname.split('/').pop() || '');
      } catch {
        return '';
      }
    })() : '') ||
    item.title ||
    'assignment';
  return String(candidate)
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim() || 'assignment';
}

function buildTeacherFileActionUrl(source: string, disposition: 'inline' | 'attachment', filename: string) {
  const url = String(source || '').trim();
  if (!url) return '';
  const teacherPortalBase = `${window.location.protocol}//${window.location.hostname}:5002`;
  if (/^https?:\/\//i.test(url) && !url.startsWith(teacherPortalBase)) {
    return url;
  }
  const params = new URLSearchParams({
    url,
    disposition,
  });
  if (filename) params.set('filename', filename);
  return `/teacher-file?${params.toString()}`;
}

function normalize(value: unknown): string {
  return String(value || '').trim();
}

function normalizeUpper(value: unknown): string {
  return normalize(value).toUpperCase();
}

function buildParentVisibilityIdentifiers(profile: StudentLike | null): string[] {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  const values = [
    profile?.studentId,
    ...(children.flatMap((child) => [
      child?.studentId,
      child?.student_id,
      child?.grNo,
      child?.gr_number,
      child?.admissionNumber,
      child?.admission_number,
      child?.rollNumber,
      child?.roll_number,
    ] as Array<unknown>)),
  ];
  return [...new Set(values.map((value) => normalize(value)).filter(Boolean))];
}

function buildChildOptions(profile: StudentLike | null): ChildOption[] {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  if (children.length > 0) {
    return children.map((child) => ({
      studentId: normalize(child.studentId || child.student_id || ''),
      parentAccessKey: normalize(child.parentAccessKey || profile?.parentAccessKey || ''),
      studentName: normalize(child.studentName || child.name || profile?.studentName || 'Student'),
      className: normalize(child.className || child.class || profile?.className || `Std ${profile?.grade || ''}`),
      division: normalizeUpper(child.division || child.section || profile?.division || 'A'),
    }));
  }

  return [{
    studentId: normalize(profile?.studentId || ''),
    parentAccessKey: normalize(profile?.parentAccessKey || ''),
    studentName: normalize(profile?.studentName || 'Student'),
    className: normalize(profile?.className || `Std ${profile?.grade || ''}`),
    division: normalizeUpper(profile?.division || 'A'),
  }];
}

export const ClassAssignmentsPage: React.FC<{ studentProfile: StudentLike | null }> = ({ studentProfile }) => {
  const [items, setItems] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useMemo(() => getAssignmentTheme(studentProfile?.grade), [studentProfile?.grade]);
  const studentOptions = useMemo(() => buildChildOptions(studentProfile), [studentProfile]);
  const selectedStudent = studentOptions[0];
  const parentIdentifiers = useMemo(() => buildParentVisibilityIdentifiers(studentProfile), [studentProfile]);

  const query = useMemo(() => {
    const studentId = String(selectedStudent?.studentId || studentProfile?.studentId || '').trim();
    const accessKey = String(selectedStudent?.parentAccessKey || studentProfile?.parentAccessKey || '').trim();
    const aliases = parentIdentifiers.join(',');
    return `studentId=${encodeURIComponent(studentId)}&accessKey=${encodeURIComponent(accessKey)}&aliases=${encodeURIComponent(aliases)}`;
  }, [parentIdentifiers, selectedStudent?.parentAccessKey, selectedStudent?.studentId, studentProfile?.parentAccessKey, studentProfile?.studentId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!selectedStudent?.studentId || !selectedStudent?.parentAccessKey) {
        setItems([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getTeacherPortalJson(`/api/parent/my-child-assignments?${query}`);
        if (!cancelled) {
          setItems(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : 'Failed to load assignments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, selectedStudent?.parentAccessKey, selectedStudent?.studentId]);

  return (
    <div className="w-full px-3 lg:px-6 py-6 space-y-5 max-w-6xl mx-auto">
      <section
        className="relative overflow-hidden rounded-3xl p-6 lg:p-7 text-white"
        style={{
          background: theme.hero,
          boxShadow: theme.heroShadow,
        }}
      >
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-[11px] font-black tracking-[0.35em] uppercase ${theme.label}`}>Class Assignments</p>
            <h1 className="mt-2 text-2xl lg:text-3xl font-black">Assignments for your child&apos;s class</h1>
            <p className="mt-2 max-w-2xl text-sm lg:text-base text-white/80">
              Only assignments for {selectedStudent?.className || studentProfile?.className || `Std ${studentProfile?.grade || ''}`}
              {selectedStudent?.division || studentProfile?.section || studentProfile?.division ? ` - ${selectedStudent?.division || studentProfile?.section || studentProfile?.division}` : ''} appear here.
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3 backdrop-blur-md"
            style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Visible to</p>
            <p className="text-lg font-black">{selectedStudent?.studentName || studentProfile?.studentName || 'Parent child'}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md">
          <p className="font-semibold text-slate-500">Loading assignments...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 font-semibold text-rose-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-sm backdrop-blur-md">
          <p className="text-lg font-black text-slate-700">No assignments available</p>
          <p className="mt-1 text-sm text-slate-500">Assignments uploaded for this class will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const fileLink = getAssignmentFileLink(item);
            const downloadName = getAssignmentDownloadName(item, fileLink);
            const viewLink = buildTeacherFileActionUrl(fileLink, 'inline', downloadName);
            const downloadLink = buildTeacherFileActionUrl(fileLink, 'attachment', downloadName);
            const subject = typeof item.subject === 'object' ? item.subject?.subjectName : item.subject;
            return (
              <article
                key={item._id}
                className={`rounded-3xl bg-white/88 p-5 backdrop-blur-md border ${theme.cardBorder} ${theme.cardShadow}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-xs font-black tracking-[0.28em] uppercase ${theme.accent}`}>Assignment</p>
                    <h2 className="mt-1 truncate text-xl font-black text-slate-800">{item.title || 'Untitled assignment'}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {subject || 'Subject not set'}
                      {item.assignmentType ? ` · ${item.assignmentType}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${theme.chipBg} ${theme.chipText}`}>
                    {getClassLabel(item, studentProfile)}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {item.description || 'No description provided.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Due date</p>
                    <p className="mt-1 font-bold text-slate-700">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Total marks</p>
                    <p className="mt-1 font-bold text-slate-700">{item.totalMarks ?? 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Uploaded {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'recently'}
                  </p>
                  {fileLink ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={viewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        View
                      </a>
                      <a
                        href={downloadLink}
                        download={downloadName}
                        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r ${theme.buttonFrom} ${theme.buttonTo} px-4 py-2 text-xs font-black text-white ${theme.buttonShadow} transition-shadow hover:shadow-lg`}
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">No attachment</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
