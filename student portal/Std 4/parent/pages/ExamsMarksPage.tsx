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
  default: {
    hero: 'linear-gradient(135deg, rgba(59,130,246,0.96), rgba(99,102,241,0.96), rgba(168,85,247,0.94))',
    panel: 'rgba(255,255,255,0.16)',
    label: 'text-white/75',
    accent: '#ffffff',
    chip: 'rgba(255,255,255,0.16)',
    border: 'rgba(255,255,255,0.18)',
    shadow: '0 24px 50px rgba(99,102,241,0.22)',
  },
  4: {
    hero: 'linear-gradient(135deg, rgba(249,115,22,0.96), rgba(239,68,68,0.96), rgba(236,72,153,0.94))',
    panel: 'rgba(255,255,255,0.16)',
    label: 'text-white/75',
    accent: '#fff7ed',
    chip: 'rgba(255,255,255,0.16)',
    border: 'rgba(255,255,255,0.18)',
    shadow: '0 24px 50px rgba(249,115,22,0.22)',
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
      if (!profile?.studentId || !String(profile?.parentAccessKey || '').trim()) {
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

  const upcomingExams = useMemo(
    () => exams.filter((exam) => exam.upcoming || exam.status === 'ongoing' || exam.status === 'scheduled'),
    [exams],
  );

  const completedExams = useMemo(
    () => exams.filter((exam) => exam.status === 'completed'),
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

  const nextExam = upcomingExams[0] || exams[0] || null;

  return (
    <div className="w-full px-3 lg:px-6 py-6 space-y-5 max-w-7xl mx-auto">
      <section
        className="relative overflow-hidden rounded-3xl p-6 lg:p-7 text-white"
        style={{
          background: theme.hero,
          boxShadow: theme.shadow,
        }}
      >
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-[11px] font-black tracking-[0.35em] uppercase ${theme.label}`}>Exams & Marks Management</p>
            <h1 className="mt-2 text-2xl lg:text-3xl font-black">Upcoming exams and marks entry</h1>
            <p className="mt-2 max-w-2xl text-sm lg:text-base text-white/80">
              Read-only class report for {profile?.className || `Std ${classNo}`}
              {profile?.section || profile?.division ? ` - ${profile.section || profile.division}` : ''}.
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3 backdrop-blur-md"
            style={{ background: theme.panel, border: `1px solid ${theme.border}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Visible to</p>
            <p className="text-lg font-black">{profile?.studentName || 'Parent child'}</p>
          </div>
        </div>
      </section>

      <div className="rounded-3xl bg-white/90 p-3 shadow-sm backdrop-blur-md border border-white/70 flex flex-wrap gap-2">
        {(['exams', 'grading', 'marks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-transparent text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab === 'exams' ? 'Exams' : tab === 'grading' ? 'Grading' : 'Marks'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur-md">
          <p className="font-semibold text-slate-500">Loading exams and marks...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 font-semibold text-rose-700">
          {error}
        </div>
      ) : (
        <>
          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-3xl bg-white/92 p-5 backdrop-blur-md border border-white/70 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-fuchsia-500">Upcoming</p>
                    <h2 className="mt-1 text-xl font-black text-slate-800">Scheduled exams</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Count</p>
                    <p className="text-2xl font-black text-slate-800">{upcomingExams.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {upcomingExams.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-slate-500">
                      No upcoming exams found for this class.
                    </div>
                  ) : upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`rounded-2xl border p-4 ${
                        exam.isToday ? 'border-fuchsia-300 bg-fuchsia-50/70' : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black tracking-[0.24em] uppercase text-fuchsia-500">{exam.subject || 'Subject'}</p>
                          <h3 className="mt-1 text-lg font-black text-slate-800 truncate">{exam.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(exam.date)} · {exam.duration || 'Duration N/A'} · Max {exam.maxMarks} marks
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          exam.status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                          exam.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          exam.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-fuchsia-100 text-fuchsia-700'
                        }`}>
                          {statusLabel(exam.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white/92 p-5 backdrop-blur-md border border-white/70 shadow-sm">
                <p className="text-xs font-black tracking-[0.25em] uppercase text-indigo-500">Next Exam</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">{nextExam?.name || 'No exam scheduled'}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {nextExam
                    ? `${nextExam.subject || 'Subject'} · ${formatDate(nextExam.date)} · ${nextExam.duration || 'Duration N/A'}`
                    : 'Exams will appear here once the teacher schedules them.'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Upcoming</p>
                    <p className="mt-1 text-2xl font-black text-indigo-700">{upcomingExams.length}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Completed</p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">{completedExams.length}</p>
                  </div>
                  <div className="rounded-2xl bg-fuchsia-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-400">Class</p>
                    <p className="mt-1 text-xl font-black text-fuchsia-700">{profile?.className || `Std ${classNo}`}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Section</p>
                    <p className="mt-1 text-xl font-black text-amber-700">{profile?.section || profile?.division || 'A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grading' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl bg-white/92 p-5 backdrop-blur-md border border-white/70 shadow-sm">
                <p className="text-xs font-black tracking-[0.25em] uppercase text-sky-500">Marks Snapshot</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">Class performance</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-sky-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">Entries</p>
                    <p className="mt-1 text-2xl font-black text-sky-700">{currentMarks.length}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Avg %</p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">{averagePercent}%</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Subjects</p>
                    <p className="mt-1 text-2xl font-black text-amber-700">{totalMarkedSubjects}</p>
                  </div>
                  <div className="rounded-2xl bg-fuchsia-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-500">Best Grade</p>
                    <p className="mt-1 text-2xl font-black text-fuchsia-700">
                      {currentMarks[0]?.grade || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-3xl bg-white/92 p-5 backdrop-blur-md border border-white/70 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-fuchsia-500">Exams</p>
                    <h2 className="mt-1 text-xl font-black text-slate-800">Result entry overview</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    {currentMarks.length} record{currentMarks.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    <div className="col-span-4">Exam Type</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-2 text-center">Max</div>
                    <div className="col-span-2 text-center">Percent</div>
                    <div className="col-span-2 text-center">Grade</div>
                  </div>
                  {currentMarks.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-500 bg-white">
                      No published marks found for this exam type yet.
                    </div>
                  ) : currentMarks.map((item) => (
                    <div key={`${item.student}-${item.exam_type}`} className="grid grid-cols-12 items-center border-t border-slate-100 px-4 py-4 bg-white">
                      <div className="col-span-4 min-w-0">
                        <p className="font-black text-slate-800 truncate">{item.exam_type}</p>
                        <p className="text-xs text-slate-500 truncate">{item.student}</p>
                      </div>
                      <div className="col-span-2 text-center font-black text-slate-700">{item.total}</div>
                      <div className="col-span-2 text-center font-black text-slate-700">{item.maxTotal}</div>
                      <div className="col-span-2 text-center font-black text-emerald-700">{item.percent}%</div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
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
              <div className="rounded-3xl bg-white/92 p-5 backdrop-blur-md border border-white/70 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-indigo-500">Marks Entry</p>
                    <h2 className="mt-1 text-xl font-black text-slate-800">Subject-wise result sheet</h2>
                    <p className="mt-1 text-sm text-slate-500">Choose the exam type and review marks exactly like the admin table.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(groupedMarks.keys()).map((key) => (
                      <button
                        key={key}
                        onClick={() => setExamType(key)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                          examType === key
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-3xl bg-white/92 p-5 backdrop-blur-md border border-white/70 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black tracking-[0.25em] uppercase text-fuchsia-500">Exam Type</p>
                      <h3 className="mt-1 text-lg font-black text-slate-800">{examType}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Subject Count</p>
                      <p className="text-2xl font-black text-slate-800">{subjectColumns.length}</p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                    <div className="min-w-[920px]">
                  <div className="grid bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500" style={{ gridTemplateColumns: marksGridTemplate }}>
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
                        <div className="bg-white px-4 py-8 text-center text-slate-500">
                          No marks have been published for this exam type yet.
                        </div>
                      ) : currentMarks.map((item) => (
                        <div key={`${item.student}-${item.exam_type}`} className="grid items-center border-t border-slate-100 bg-white px-4 py-4" style={{ gridTemplateColumns: marksGridTemplate }}>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 truncate">{item.student}</p>
                            <p className="text-xs text-slate-500 truncate">{item.section || profile?.section || profile?.division || 'A'}</p>
                          </div>
                          <div className="text-center font-bold text-slate-700">{item.roll || '-'}</div>
                          {subjectColumns.map((subject) => (
                            <div key={subject} className="text-center font-bold text-slate-700">
                              {item.marks[subject] ?? '-'}
                            </div>
                          ))}
                          <div className="text-center font-black text-slate-800">{item.total}</div>
                          <div className="text-center font-black text-emerald-700">{item.percent}%</div>
                          <div className="text-center">
                            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
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
