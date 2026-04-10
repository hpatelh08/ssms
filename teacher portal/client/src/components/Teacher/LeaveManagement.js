import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';

function getStatusTone(status = '') {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'approved') {
    return { bg: 'bg-green-100', fg: 'text-green-700', border: 'border-green-200', label: 'Approved' };
  }
  if (normalized === 'rejected') {
    return { bg: 'bg-red-100', fg: 'text-red-700', border: 'border-red-200', label: 'Rejected' };
  }
  return { bg: 'bg-amber-100', fg: 'text-amber-700', border: 'border-amber-200', label: 'Pending' };
}

function formatDateRange(fromDate, toDate) {
  if (!fromDate || !toDate) return 'N/A';
  const start = new Date(fromDate);
  const end = new Date(toDate);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function isNotFoundError(error) {
  const message = String(error?.response?.data?.error || error?.message || '').toLowerCase();
  const status = Number(error?.response?.status || 0);
  return status === 404 && message.includes('not found');
}

export default function LeaveManagement({ currentUser }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const authHeaders = useMemo(() => {
    const headers = {};
    const user = currentUser || {};
    const teacherIdentity = String(
      user.teacherId ||
      user.loginId ||
      user.email ||
      user.name ||
      user.classTeacherOf ||
      [user.assignedClass, user.division].filter(Boolean).join('-') ||
      ''
    ).trim();

    const hasLikelyJwt = token.includes('.') && token.split('.').length === 3;
    if (hasLikelyJwt) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (teacherIdentity) headers['X-Teacher-Id'] = teacherIdentity;
    if (user.email) headers['X-Teacher-Email'] = String(user.email).trim();
    if (user.name) headers['X-Teacher-Name'] = String(user.name).trim();
    if (user.assignedClass || user.classTeacherStd) headers['X-Teacher-Class'] = String(user.assignedClass || user.classTeacherStd || '').trim();
    if (user.division || user.classTeacherDiv) headers['X-Teacher-Division'] = String(user.division || user.classTeacherDiv || '').trim();
    return headers;
  }, [currentUser, token]);
  const teacherId = useMemo(() => {
    const value = String(
      currentUser?.teacherId ||
      currentUser?.loginId ||
      currentUser?.email ||
      currentUser?.name ||
      currentUser?.classTeacherOf ||
      [currentUser?.assignedClass, currentUser?.division].filter(Boolean).join('-') ||
      ''
    ).trim();
    return value;
  }, [currentUser]);

  const teacherLabel = useMemo(() => {
    const classLabel = [currentUser?.assignedClass || currentUser?.classTeacherStd || '', currentUser?.division || currentUser?.classTeacherDiv || '']
      .filter(Boolean)
      .join('');
    return classLabel ? `${classLabel}` : 'your class';
  }, [currentUser]);

  const fetchApplications = async () => {
    if (!teacherId) return;
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(apiUrl(`/api/teacher/leave/teacher/${encodeURIComponent(teacherId)}`), {
        headers: authHeaders,
        timeout: 8000,
        params: statusFilter !== 'all' ? { status: statusFilter } : {},
      });
      setApplications(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (err) {
      if (isNotFoundError(err)) {
        setApplications([]);
        setError('');
        return;
      }
      const message = err?.response?.data?.error || err?.message || 'Failed to load leave applications.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
    const interval = window.setInterval(() => {
      void fetchApplications();
    }, 20000);
    return () => window.clearInterval(interval);
  }, [teacherId, statusFilter]);

  const approveLeave = async (applicationId) => {
    try {
      setActionLoading(applicationId);
      setError('');
      await axios.patch(
        apiUrl(`/api/teacher/leave/teacher/${encodeURIComponent(applicationId)}/approve`),
        {},
        { headers: authHeaders }
      );
      setSuccess('Leave request approved.');
      await fetchApplications();
    } catch (err) {
      if (isNotFoundError(err)) {
        setSuccess('Leave request is no longer available.');
        await fetchApplications();
        return;
      }
      setError(err?.response?.data?.error || err?.message || 'Failed to approve leave request.');
    } finally {
      setActionLoading('');
    }
  };

  const openReject = (applicationId) => {
    setRejectTarget(applicationId);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      setActionLoading(rejectTarget);
      setError('');
      await axios.patch(
        apiUrl(`/api/teacher/leave/teacher/${encodeURIComponent(rejectTarget)}/reject`),
        { teacherResponseReason: rejectReason.trim() },
        { headers: authHeaders }
      );
      setSuccess('Leave request rejected.');
      setRejectTarget(null);
      setRejectReason('');
      await fetchApplications();
    } catch (err) {
      if (isNotFoundError(err)) {
        setRejectTarget(null);
        setRejectReason('');
        setSuccess('Leave request is no longer available.');
        await fetchApplications();
        return;
      }
      setError(err?.response?.data?.error || err?.message || 'Failed to reject leave request.');
    } finally {
      setActionLoading('');
    }
  };

  const filteredApplications = applications.filter((item) => {
    const matchesQuery = !query.trim() || [
      item.studentName,
      item.parentName,
      item.leaveType,
      item.reason,
      item.className,
      item.division,
    ].some((value) => String(value || '').toLowerCase().includes(query.trim().toLowerCase()));
    const matchesStatus = statusFilter === 'all' || String(item.status || '').toLowerCase() === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const counts = applications.reduce((acc, item) => {
    const status = String(item.status || 'pending').toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 md:p-7 text-white shadow-[0_16px_40px_rgba(79,70,229,0.18)] bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-600">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-[0.25em] uppercase">
              <ShieldAlert className="h-3.5 w-3.5" />
              Parent Leave Requests
            </div>
            <h2 className="text-3xl font-black">Leave Applications for {teacherLabel}</h2>
            <p className="text-white/80 max-w-2xl">
              Review parent leave requests, approve valid applications, and reject with a clear reason when needed.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">Pending</p>
              <p className="text-2xl font-black">{counts.pending || 0}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">Approved</p>
              <p className="text-2xl font-black">{counts.approved || 0}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">Rejected</p>
              <p className="text-2xl font-black">{counts.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 backdrop-blur border border-indigo-100 shadow-lg p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-600">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student, parent, class, type, or reason"
            className="w-full md:w-[380px] bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-3xl bg-white/90 backdrop-blur border border-indigo-100 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Parent Leave Applications</h3>
            <p className="text-sm text-slate-500">Only requests for your assigned class are visible here.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchApplications()}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading leave requests...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <MessageSquare className="h-12 w-12 mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">No leave requests found</p>
            <p className="text-sm text-slate-400">Requests from parents of {teacherLabel} will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.12em] text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Parent</th>
                  <th className="px-5 py-3 text-left">Class</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Dates</th>
                  <th className="px-5 py-3 text-left">Reason</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Attachment</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((application) => {
                  const tone = getStatusTone(application.status);
                  const canAct = String(application.status || '').toLowerCase() === 'pending';
                  return (
                    <tr key={application.id} className="align-top hover:bg-indigo-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{application.studentName}</p>
                            <p className="text-xs text-slate-500">{application.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div className="font-medium">{application.parentName || 'Parent'}</div>
                        <div className="text-xs text-slate-400">{application.parentId}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="font-semibold">{application.className}{application.division || ''}</div>
                        <div className="text-xs text-slate-400">{application.classId}</div>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-700">{application.leaveType}</td>
                      <td className="px-5 py-4 text-slate-700">
                        <div>{formatDateRange(application.fromDate, application.toDate)}</div>
                        <div className="text-xs text-slate-400">{application.totalDays} day(s)</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-[260px]">
                        <p className="line-clamp-3">{application.reason}</p>
                        {application.teacherResponseReason ? (
                          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            Teacher note: {application.teacherResponseReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${tone.bg} ${tone.fg} ${tone.border}`}>
                          {String(application.status || 'Pending')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {application.attachmentUrl ? (
                          <a
                            href={application.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {application.attachmentName || 'View'}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {canAct ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={actionLoading === application.id}
                              onClick={() => void approveLeave(application.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              {actionLoading === application.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === application.id}
                              onClick={() => openReject(application.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Action taken</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-extrabold text-slate-800">Reject Leave Request</h4>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Please add a clear rejection reason. The parent will see this reason in their Leave History.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter rejection reason..."
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmReject()}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
