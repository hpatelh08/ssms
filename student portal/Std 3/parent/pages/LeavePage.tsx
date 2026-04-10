import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

type ChildOption = {
  studentId: string;
  studentName: string;
  className: string;
  division: string;
  grNo?: string;
  admissionNumber?: string;
  parentName?: string;
};

type LeaveRecord = {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  classId: string;
  className: string;
  division: string;
  classTeacherName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  teacherResponseReason?: string;
  submittedAt?: string;
  actionTakenAt?: string;
};

const TEACHER_API_BASE = `${window.location.protocol}//${window.location.hostname}:5002`;

function normalize(value: string): string {
  return String(value || '').trim();
}

function normalizeUpper(value: string): string {
  return normalize(value).toUpperCase();
}

function buildParentIdentifiers(profile: any): string[] {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  const values = [
    profile?.studentId,
    profile?.student_id,
    profile?.grNo,
    profile?.grNumber,
    profile?.admissionNumber,
    profile?.admission_number,
    profile?.rollNumber,
    profile?.roll_number,
    ...children.flatMap((child: any) => [
      child?.studentId,
      child?.grNo,
      child?.admissionNumber,
      child?.rollNumber,
    ]),
  ];
  return [...new Set(values.map((value) => normalizeUpper(value)).filter(Boolean))];
}

function buildChildOptions(profile: any): ChildOption[] {
  const children = Array.isArray(profile?.children) ? profile.children : [];
  if (children.length > 0) {
    return children.map((child: any) => ({
      studentId: normalize(child.studentId || child.student_id || ''),
      studentName: normalize(child.studentName || child.name || profile?.studentName || profile?.studentName || 'Student'),
      className: normalize(child.className || child.class || profile?.className || `Std ${profile?.grade || ''}`),
      division: normalizeUpper(child.division || child.section || profile?.division || 'A'),
      grNo: normalize(child.grNo || child.gr_number || ''),
      admissionNumber: normalize(child.admissionNumber || child.admission_number || ''),
      parentName: normalize(child.parentName || profile?.parentName || ''),
    }));
  }

  return [{
    studentId: normalize(profile?.studentId || ''),
    studentName: normalize(profile?.studentName || profile?.name || 'Student'),
    className: normalize(profile?.className || `Std ${profile?.grade || 4}`),
    division: normalizeUpper(profile?.division || 'A'),
    grNo: normalize(profile?.grNo || profile?.grNumber || ''),
    admissionNumber: normalize(profile?.admissionNumber || ''),
    parentName: normalize(profile?.parentName || profile?.fatherName || ''),
  }];
}

function formatDateRange(fromDate: string, toDate: string): string {
  if (!fromDate || !toDate) return 'N/A';
  const start = new Date(fromDate);
  const end = new Date(toDate);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function calculateTotalDays(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

function isNotFoundError(message: string): boolean {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('not found');
}

export default function LeavePage() {
  const { studentProfile } = useAuth();
  const studentOptions = useMemo(() => buildChildOptions(studentProfile), [studentProfile]);
  const parentIdentifiers = useMemo(() => buildParentIdentifiers(studentProfile), [studentProfile]);
  const primaryParentId = parentIdentifiers[0] || normalize(studentProfile?.studentId || '');

  const [selectedStudentId, setSelectedStudentId] = useState(studentOptions[0]?.studentId || '');
  const [leaveType, setLeaveType] = useState('sick');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<LeaveRecord[]>([]);

  useEffect(() => {
    if (!selectedStudentId && studentOptions[0]?.studentId) {
      setSelectedStudentId(studentOptions[0].studentId);
    }
  }, [selectedStudentId, studentOptions]);

  const selectedStudent = useMemo(
    () => studentOptions.find((item) => item.studentId === selectedStudentId) || studentOptions[0],
    [selectedStudentId, studentOptions]
  );

  const selectedClassKey = useMemo(() => {
    const classNumber = String(selectedStudent?.className || studentProfile?.className || studentProfile?.grade || 4).match(/\d+/)?.[0] || String(studentProfile?.grade || 4);
    const division = normalizeUpper(selectedStudent?.division || studentProfile?.division || 'A') || 'A';
    return `admin-class-${classNumber}-${division}`;
  }, [selectedStudent, studentProfile]);

  const fetchHistory = async () => {
    if (!primaryParentId) return;
    try {
      setFetching(true);
      const query = new URLSearchParams({
        aliases: parentIdentifiers.join(','),
      });
      const response = await fetch(`${TEACHER_API_BASE}/api/parent/leave/parent/${encodeURIComponent(primaryParentId)}?${query.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = String(payload?.error || payload?.message || 'Failed to load leave history.');
        if (response.status === 404 && isNotFoundError(message)) {
          setHistory([]);
          setError('');
          return;
        }
        throw new Error(message);
      }
      setHistory(Array.isArray(payload?.data) ? payload.data : []);
      setError('');
    } catch (err: any) {
      console.warn('Leave history load skipped:', err?.message || err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
    const interval = window.setInterval(() => {
      void fetchHistory();
    }, 20000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryParentId, selectedClassKey]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudent) {
      setError('Selected student not found.');
      return;
    }
    if (!fromDate || !toDate || new Date(toDate) < new Date(fromDate)) {
      setError('Invalid leave dates.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    const formData = new FormData();
    formData.append('studentId', selectedStudent.studentId);
    formData.append('studentName', selectedStudent.studentName);
    formData.append('parentId', primaryParentId);
    formData.append('parentAliases', parentIdentifiers.join(','));
    formData.append('parentName', normalize(studentProfile?.parentName || studentProfile?.fatherName || selectedStudent.parentName || 'Parent'));
    formData.append('className', selectedStudent.className);
    formData.append('division', selectedStudent.division || 'A');
    formData.append('leaveType', leaveType);
    formData.append('fromDate', fromDate);
    formData.append('toDate', toDate);
    formData.append('reason', reason.trim());
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      setLoading(true);
      const response = await fetch(`${TEACHER_API_BASE}/api/parent/leave/apply`, {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to submit leave application.');
      }

      setSuccess('Leave application submitted successfully.');
      setLeaveType('sick');
      setFromDate('');
      setToDate('');
      setReason('');
      setAttachment(null);
      const fileInput = document.getElementById('leave-attachment') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      await fetchHistory();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit leave application.');
    } finally {
      setLoading(false);
    }
  };

  const totalDays = calculateTotalDays(fromDate, toDate);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-700/60 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.18),transparent_24%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.92))] p-6 text-slate-100 shadow-[0_24px_60px_rgba(2,6,23,0.45)] md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.05),transparent)] opacity-60" />
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold tracking-[0.24em] uppercase text-cyan-200">
              <span aria-hidden="true">Leave Request</span>
              Student Leave Form
            </div>
            <h2 className="mt-3 text-3xl font-black">Apply leave for your child</h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Submit a leave request for your child. The request goes only to the child&apos;s class teacher and you can track status below.
            </p>
          </div>
          <div className="relative rounded-2xl border border-slate-700/70 bg-slate-950/55 px-4 py-3 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Selected Child</p>
            <p className="text-lg font-bold text-slate-100">{selectedStudent?.studentName || 'Student'}</p>
            <p className="text-sm text-slate-300">{selectedStudent?.className}{selectedStudent?.division || ''}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-cyan-100">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-700/70 bg-slate-950/75 p-5 text-slate-100 shadow-[0_18px_48px_rgba(2,6,23,0.35)] backdrop-blur md:p-6">
        <div className="flex items-center gap-3 border-b border-slate-700/70 pb-4">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
            <span aria-hidden="true" className="text-xl">Form</span>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-100">Apply for Leave</h3>
            <p className="text-sm text-slate-400">All fields marked with * are required.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">Student Name *</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
            >
              {studentOptions.map((child) => (
                <option key={child.studentId} value={child.studentId}>
                  {child.studentName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">Class / Division</span>
            <input
              readOnly
              value={`${selectedStudent?.className || studentProfile?.className || `Std ${studentProfile?.grade || 4}`}${selectedStudent?.division || studentProfile?.division || 'A'}`}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-300 outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">Leave Type *</span>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">Number of Days</span>
            <input
              readOnly
              value={totalDays > 0 ? `${totalDays} day(s)` : 'Auto calculated'}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-300 outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">From Date *</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-200">To Date *</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-200">Reason for Leave *</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Write the reason for leave"
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-200">Optional Attachment</span>
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-600/80 bg-slate-900/70 px-4 py-4">
              <span aria-hidden="true" className="text-slate-400">Attachment</span>
              <input
                id="leave-attachment"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-cyan-400"
              />
            </div>
            {attachment ? <p className="text-xs text-slate-400">Selected: {attachment.name}</p> : null}
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            Submit Leave Request
          </button>
          <button
            type="button"
            onClick={() => void fetchHistory()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/90"
          >
            <span aria-hidden="true">â†»</span>
            Refresh History
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[28px] border border-slate-700/70 bg-slate-950/75 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-2 border-b border-slate-700/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-100">Leave History</h3>
            <p className="text-sm text-slate-400">Track submitted leave requests, teacher response, and action date.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span aria-hidden="true">â±</span>
            {fetching ? 'Updating...' : `${history.length} request(s)`}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">
            <span aria-hidden="true" className="mb-3 text-4xl text-slate-500">No requests yet</span>
            <p className="font-semibold text-slate-200">No leave applications yet</p>
            <p className="text-sm text-slate-400">Submitted applications will show here after you apply.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-300 uppercase tracking-[0.12em] text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Leave Type</th>
                  <th className="px-5 py-3 text-left">Dates</th>
                  <th className="px-5 py-3 text-left">Total Days</th>
                  <th className="px-5 py-3 text-left">Reason</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Teacher Response</th>
                  <th className="px-5 py-3 text-left">Action Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {history.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-100">{item.studentName}</p>
                      <p className="text-xs text-slate-400">{item.className}{item.division || ''}</p>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-200">{item.leaveType}</td>
                    <td className="px-5 py-4 text-slate-200">
                      <div>{formatDateRange(item.fromDate, item.toDate)}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-200">{item.totalDays} day(s)</td>
                    <td className="max-w-[260px] px-5 py-4 text-slate-300">{item.reason}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[String(item.status || 'pending').toLowerCase()] || STATUS_STYLES.pending}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-5 py-4 text-slate-300">
                      {item.teacherResponseReason ? (
                        <p>{item.teacherResponseReason}</p>
                      ) : (
                        <span className="text-slate-500">Awaiting teacher response</span>
                      )}
                      {item.attachmentUrl ? (
                        <a
                          href={item.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/90"
                        >
                          <span aria-hidden="true">ðŸ“Ž</span>
                          {item.attachmentName || 'Attachment'}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {item.actionTakenAt ? new Date(item.actionTakenAt).toLocaleString() : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
