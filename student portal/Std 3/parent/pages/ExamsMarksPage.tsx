import React, { useEffect, useMemo, useState } from 'react';
import { getTeacherPortalJson } from '../../services/teacherPortal';
import { useAuth } from '../../auth/AuthContext';

type StudentLike = {
  studentId?: string;
  parentAccessKey?: string;
  studentName?: string;
  className?: string;
  section?: string;
  division?: string;
  grade?: number;
  grNo?: string;
  admissionNumber?: string;
  children?: Array<{
    studentId?: string;
    grNo?: string;
    admissionNumber?: string;
    parentAccessKey?: string;
    studentName?: string;
  }>;
};

type ExamItem = {
  id: string;
  name: string;
  class: string;
  subject: string;
  date: string;
  duration: string;
  maxMarks: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'scheduled';
  upcoming?: boolean;
  isToday?: boolean;
};

type MarksItem = {
  student: string;
  class: string;
  exam_type: string;
  roll?: string;
  section?: string;
  marks: Record<string, number>;
  total: number;
  maxTotal: number;
  percent: number;
  grade: string;
};

type Theme = {
  hero: string;
  panel: string;
  label: string;
  accent: string;
  chip: string;
  border: string;
  shadow: string;
};

const THEMES: Record<string, Theme> = {
  1: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.97), rgba(15,23,42,0.95), rgba(30,64,175,0.92))',
    panel: 'rgba(15,23,42,0.56)',
    label: 'text-sky-100/70',
    accent: '#dbeafe',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 28px 60px rgba(2,6,23,0.40)',
  },
  2: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.97), rgba(8,47,73,0.95), rgba(13,148,136,0.90))',
    panel: 'rgba(15,23,42,0.56)',
    label: 'text-cyan-100/70',
    accent: '#ecfeff',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 28px 60px rgba(2,6,23,0.40)',
  },
  3: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.98), rgba(15,23,42,0.96), rgba(76,29,149,0.92))',
    panel: 'rgba(15,23,42,0.58)',
    label: 'text-violet-100/72',
    accent: '#f5f3ff',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 30px 70px rgba(2,6,23,0.44)',
  },
  4: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.97), rgba(69,10,10,0.94), rgba(190,24,93,0.90))',
    panel: 'rgba(15,23,42,0.56)',
    label: 'text-rose-100/70',
    accent: '#fff7ed',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 28px 60px rgba(2,6,23,0.40)',
  },
  5: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.97), rgba(5,46,22,0.94), rgba(101,163,13,0.90))',
    panel: 'rgba(15,23,42,0.56)',
    label: 'text-emerald-100/70',
    accent: '#f0fdf4',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 28px 60px rgba(2,6,23,0.40)',
  },
  6: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.97), rgba(8,47,73,0.94), rgba(2,132,199,0.90))',
    panel: 'rgba(15,23,42,0.56)',
    label: 'text-cyan-100/70',
    accent: '#f0f9ff',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 28px 60px rgba(2,6,23,0.40)',
  },
  default: {
    hero: 'linear-gradient(135deg, rgba(2,6,23,0.97), rgba(15,23,42,0.95), rgba(59,130,246,0.90))',
    panel: 'rgba(15,23,42,0.56)',
    label: 'text-sky-100/70',
    accent: '#eff6ff',
    chip: 'rgba(255,255,255,0.08)',
    border: 'rgba(148,163,184,0.16)',
    shadow: '0 28px 60px rgba(2,6,23,0.40)',
  },
};

function buildAcademicQuery(profile: StudentLike | null): string {
  const studentId = String(profile?.studentId || profile?.children?.[0]?.studentId || '').trim();
  const accessKey = String(profile?.parentAccessKey || profile?.children?.[0]?.parentAccessKey || '').trim();
  const aliases = [
    profile?.studentName,
    profile?.studentId,
    profile?.grNo,
    profile?.admissionNumber,
    ...(Array.isArray(profile?.children) ? profile.children.flatMap((child) => [
      child?.studentName,
      child?.studentId,
      child?.grNo,
      child?.admissionNumber,
    ]) : []),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const params = new URLSearchParams();
  if (studentId) params.set('studentId', studentId);
  if (accessKey) params.set('accessKey', accessKey);
  if (aliases.length) params.set('aliases', aliases.join(','));
  return params.toString();
}

function getTheme(grade?: number) {
  return THEMES[String(grade || 4)] || THEMES.default;
}

function formatDate(value: string): string {
  if (!value) return 'TBA';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(status: string): string {
  const value = String(status || '').toLowerCase();
  if (value === 'ongoing') return 'In Progress';
  if (value === 'completed') return 'Completed';
  if (value === 'cancelled') return 'Cancelled';
  if (value === 'upcoming' || value === 'scheduled') return 'Upcoming';
  return 'Scheduled';
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isOnOrAfterToday(value: string): boolean {
  const raw = String(value || '').trim();
  if (!raw) return false;

  const dateOnly = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly >= getTodayIsoDate();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return parsed.getTime() >= startOfToday.getTime();
}

function isUpcomingExam(exam: ExamItem): boolean {
  if (!isOnOrAfterToday(exam.date)) return false;
  const status = String(exam.status || '').trim().toLowerCase();
  if (status === 'completed' || status === 'cancelled') return false;
  return true;
}

function subjectColumnsForClass(classNo: string | number): string[] {
  const n = parseInt(String(classNo || 4), 10);
  return n <= 5
    ? ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK']
    : ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'];
}

export const ExamsMarksPage: React.FC = () => {
  const { studentProfile, user } = useAuth();
  const profile = studentProfile as StudentLike | null;
  const theme = useMemo(() => getTheme(profile?.grade || user.grade), [profile?.grade, user.grade]);
  const query = useMemo(() => buildAcademicQuery(profile), [profile]);

  const [activeTab, setActiveTab] = useState<'exams' | 'grading' | 'marks'>('exams');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [marks, setMarks] = useState<MarksItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examType, setExamType] = useState<string>('midterm');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const queryReady = Boolean(query) && /studentId=/.test(query) && /accessKey=/.test(query);
      if (!queryReady) {
        setLoading(false);
        setExams([]);
        setMarks([]);
        setError('Parent access key or student ID is missing for this profile.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [examsPayload, marksPayload] = await Promise.all([
          getTeacherPortalJson(`/api/parent/my-child-exams?${query}`),
          getTeacherPortalJson(`/api/parent/my-child-marks?${query}`),
        ]);

        if (cancelled) return;
        const nextExams = Array.isArray(examsPayload?.data) ? examsPayload.data : [];
        const nextMarks = Array.isArray(marksPayload?.data) ? marksPayload.data : [];
        setExams(nextExams);
        setMarks(nextMarks);
        if (!nextMarks.some((item) => item.exam_type === examType) && nextMarks[0]?.exam_type) {
          setExamType(nextMarks[0].exam_type);
        }
      } catch (err) {
        if (!cancelled) {
          setExams([]);
          setMarks([]);
          setError(err instanceof Error ? err.message : 'Failed to load exams and marks');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [examType, profile?.parentAccessKey, profile?.studentId, query]);

  const classNo = String(profile?.grade || user.grade || 4);
  const subjectColumns = useMemo(() => subjectColumnsForClass(classNo), [classNo]);

  const upcomingExams = useMemo(() => {
    const deduped = new Map<string, ExamItem>();
    exams.forEach((exam) => {
      if (!isUpcomingExam(exam)) return;
      const key = String(exam.id || `${exam.name}|${exam.subject}|${exam.date}`).trim();
      if (!deduped.has(key)) {
        deduped.set(key, exam);
      }
    });

    return Array.from(deduped.values()).sort((a, b) => {
      const aDate = String(a.date || '');
      const bDate = String(b.date || '');
      return aDate.localeCompare(bDate) || String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [exams]);

  const completedExams = useMemo(
    () => exams.filter((exam) => String(exam.status || '').trim().toLowerCase() === 'completed'),
    [exams],
  );
  const marksGridTemplate = useMemo(() => {
    return `minmax(180px, 2.4fr) 92px repeat(${subjectColumns.length}, minmax(54px, 1fr)) 70px 72px 72px`;
  }, [subjectColumns.length]);

  const groupedMarks = useMemo(() => {
    const map = new Map<string, MarksItem[]>();
    marks.forEach((item) => {
      const key = String(item.exam_type || 'midterm');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [marks]);

  const currentMarks = useMemo(() => groupedMarks.get(examType) || [], [groupedMarks, examType]);
  const totalMarkedSubjects = currentMarks.reduce((sum, item) => sum + Object.keys(item.marks || {}).length, 0);
  const averagePercent = currentMarks.length
    ? Math.round(currentMarks.reduce((sum, item) => sum + (item.percent || 0), 0) / currentMarks.length)
    : 0;

  const nextExam = upcomingExams[0] || null;
  const shellCardClass = 'rounded-3xl border border-slate-700/60 bg-slate-950/72 shadow-2xl backdrop-blur-xl';
  const innerCardClass = 'rounded-2xl border border-slate-700/50 bg-white/5';
  const tabRailClass = 'rounded-[1.75rem] border border-slate-700/60 bg-slate-950/70 p-2.5 shadow-2xl backdrop-blur-xl';
  const tabActiveClass = 'bg-gradient-to-r from-cyan-400/25 via-sky-500/25 to-violet-500/30 text-white shadow-lg';
  const tabInactiveClass = 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white';

  return (
    <div className="relative mx-auto w-full max-w-7xl space-y-5 px-3 py-6 text-slate-100 lg:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 overflow-hidden">
        <div className="absolute left-4 top-8 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute right-4 top-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute inset-x-8 top-28 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      </div>
      <section
        className="relative overflow-hidden rounded-[2rem] border border-white/10 p-6 text-white lg:p-7"
        style={{
          background: theme.hero,
          boxShadow: theme.shadow,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10),transparent_32%)]" />
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-[11px] font-black tracking-[0.35em] uppercase ${theme.label}`}>Exams & Marks Management</p>
            <h1 className="mt-2 text-2xl font-black lg:text-3xl">Upcoming exams and marks entry</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200/80 lg:text-base">
              Read-only class report for {profile?.className || `Std ${classNo}`}
              {profile?.section || profile?.division ? ` - ${profile.section || profile.division}` : ''}.
              All upcoming exams are shown below, sorted by date.
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3 backdrop-blur-md"
            style={{ background: theme.panel, border: `1px solid ${theme.border}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300/70">Visible to</p>
            <p className="text-lg font-black text-slate-50">{profile?.studentName || 'Parent child'}</p>
          </div>
        </div>
      </section>

      <div className={`${tabRailClass} flex flex-wrap gap-2`}>
        {(['exams', 'grading', 'marks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
              activeTab === tab ? tabActiveClass : tabInactiveClass
            }`}
          >
            {tab === 'exams' ? 'Exams' : tab === 'grading' ? 'Grading' : 'Marks'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`${shellCardClass} p-8 text-center`}>
          <p className="font-semibold text-slate-300">Loading exams and marks...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 font-semibold text-rose-100 shadow-2xl backdrop-blur-xl">
          {error}
        </div>
      ) : (
        <>
          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className={`${shellCardClass} p-5`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-cyan-300">Upcoming</p>
                    <h2 className="mt-1 text-xl font-black text-slate-50">Scheduled exams</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Count</p>
                    <p className="text-2xl font-black text-slate-50">{upcomingExams.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {!nextExam ? (
                    <div className={`${innerCardClass} p-5 text-center text-slate-300`}>
                      No upcoming exams found for this class.
                    </div>
                  ) : (
                    <div
                      key={nextExam.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        nextExam.isToday
                          ? 'border-cyan-300/50 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(103,232,249,0.10)]'
                          : 'border-slate-700/50 bg-white/5 hover:border-cyan-400/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black tracking-[0.24em] uppercase text-cyan-300">{nextExam.subject || 'Subject'}</p>
                          <h3 className="mt-1 truncate text-lg font-black text-slate-50">{nextExam.name}</h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {formatDate(nextExam.date)} - {nextExam.duration || 'Duration N/A'} - Max {nextExam.maxMarks} marks
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          nextExam.status === 'ongoing'
                            ? 'bg-amber-500/15 text-amber-100'
                            : nextExam.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-100'
                              : nextExam.status === 'cancelled'
                                ? 'bg-rose-500/15 text-rose-100'
                                : 'bg-violet-500/15 text-violet-100'
                        }`}>
                          {statusLabel(nextExam.status)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`${shellCardClass} p-5`}>
                <p className="text-xs font-black tracking-[0.25em] uppercase text-violet-300">Next Orbit</p>
                <h2 className="mt-1 text-xl font-black text-slate-50">{nextExam?.name || 'No exam scheduled'}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {nextExam
                    ? `${nextExam.subject || 'Subject'} - ${formatDate(nextExam.date)} - ${nextExam.duration || 'Duration N/A'}`
                    : 'Exams will appear here once the teacher schedules them.'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Upcoming</p>
                    <p className="mt-1 text-2xl font-black text-cyan-50">{upcomingExams.length}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Completed</p>
                    <p className="mt-1 text-2xl font-black text-emerald-50">{completedExams.length}</p>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200">Class</p>
                    <p className="mt-1 text-xl font-black text-fuchsia-50">{profile?.className || `Std ${classNo}`}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Section</p>
                    <p className="mt-1 text-xl font-black text-amber-50">{profile?.section || profile?.division || 'A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grading' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className={`${shellCardClass} p-5`}>
                <p className="text-xs font-black tracking-[0.25em] uppercase text-cyan-300">Marks Snapshot</p>
                <h2 className="mt-1 text-xl font-black text-slate-50">Class performance</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Entries</p>
                    <p className="mt-1 text-2xl font-black text-sky-50">{currentMarks.length}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Avg %</p>
                    <p className="mt-1 text-2xl font-black text-emerald-50">{averagePercent}%</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Subjects</p>
                    <p className="mt-1 text-2xl font-black text-amber-50">{totalMarkedSubjects}</p>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200">Best Grade</p>
                    <p className="mt-1 text-2xl font-black text-fuchsia-50">
                      {currentMarks[0]?.grade || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`lg:col-span-2 ${shellCardClass} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-violet-300">Exams</p>
                    <h2 className="mt-1 text-xl font-black text-slate-50">Result entry overview</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                    {currentMarks.length} record{currentMarks.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700/50">
                  <div className="grid grid-cols-12 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                    <div className="col-span-4">Exam Type</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-2 text-center">Max</div>
                    <div className="col-span-2 text-center">Percent</div>
                    <div className="col-span-2 text-center">Grade</div>
                  </div>
                  {currentMarks.length === 0 ? (
                    <div className="bg-slate-950/40 px-4 py-6 text-center text-slate-300">
                      No published marks found for this exam type yet.
                    </div>
                  ) : currentMarks.map((item) => (
                    <div key={`${item.student}-${item.exam_type}`} className="grid grid-cols-12 items-center border-t border-slate-700/50 bg-slate-950/25 px-4 py-4">
                      <div className="col-span-4 min-w-0">
                        <p className="truncate font-black text-slate-50">{item.exam_type}</p>
                        <p className="truncate text-xs text-slate-300">{item.student}</p>
                      </div>
                      <div className="col-span-2 text-center font-black text-slate-200">{item.total}</div>
                      <div className="col-span-2 text-center font-black text-slate-200">{item.maxTotal}</div>
                      <div className="col-span-2 text-center font-black text-emerald-300">{item.percent}%</div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-50">
                          {item.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marks' && (
            <div className="space-y-4">
              <div className={`${shellCardClass} p-5`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-cyan-300">Marks Entry</p>
                    <h2 className="mt-1 text-xl font-black text-slate-50">Subject-wise result sheet</h2>
                    <p className="mt-1 text-sm text-slate-300">Choose the exam type and review marks exactly like the admin table.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(groupedMarks.keys()).map((key) => (
                      <button
                        key={key}
                        onClick={() => setExamType(key)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                          examType === key
                            ? 'border border-cyan-300/30 bg-cyan-500/15 text-cyan-50 shadow-md'
                            : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className={`${shellCardClass} p-5`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black tracking-[0.25em] uppercase text-violet-300">Exam Type</p>
                      <h3 className="mt-1 text-lg font-black text-slate-50">{examType}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Subject Count</p>
                      <p className="text-2xl font-black text-slate-50">{subjectColumns.length}</p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-700/50">
                    <div className="min-w-[920px]">
                      <div className="grid bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-300" style={{ gridTemplateColumns: marksGridTemplate }}>
                        <div>Student</div>
                        <div className="text-center">Roll</div>
                        {subjectColumns.map((subject) => (
                          <div key={subject} className="text-center">{subject.slice(0, 6)}</div>
                        ))}
                        <div className="text-center">Total</div>
                        <div className="text-center">%</div>
                        <div className="text-center">Grade</div>
                      </div>

                      {currentMarks.length === 0 ? (
                        <div className="bg-slate-950/40 px-4 py-8 text-center text-slate-300">
                          No marks have been published for this exam type yet.
                        </div>
                      ) : currentMarks.map((item) => (
                        <div key={`${item.student}-${item.exam_type}`} className="grid items-center border-t border-slate-700/50 bg-slate-950/25 px-4 py-4" style={{ gridTemplateColumns: marksGridTemplate }}>
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-50">{item.student}</p>
                            <p className="truncate text-xs text-slate-300">{item.section || profile?.section || profile?.division || 'A'}</p>
                          </div>
                          <div className="text-center font-bold text-slate-200">{item.roll || '-'}</div>
                          {subjectColumns.map((subject) => (
                            <div key={subject} className="text-center font-bold text-slate-200">
                              {item.marks[subject] ?? '-'}
                            </div>
                          ))}
                          <div className="text-center font-black text-slate-50">{item.total}</div>
                          <div className="text-center font-black text-emerald-300">{item.percent}%</div>
                          <div className="text-center">
                            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-black text-cyan-50">
                              {item.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamsMarksPage;
