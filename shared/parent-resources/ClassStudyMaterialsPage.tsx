import React, { useEffect, useMemo, useState } from 'react';
import { getTeacherPortalJson, toTeacherFileUrl } from '../teacherPortal';

type StudentLike = {
  studentId?: string;
  parentAccessKey?: string;
  studentName?: string;
  className?: string;
  section?: string;
  division?: string;
  grade?: number;
};

type MaterialRecord = {
  _id: string;
  title?: string;
  description?: string;
  materialType?: string;
  subject?: { subjectName?: string } | string;
  standard?: string;
  division?: string;
  class?: { className?: string; section?: string; _id?: string } | string;
  createdAt?: string;
  file?: { filename?: string; path?: string; originalName?: string; size?: number; mimetype?: string } | null;
  url?: string;
  fileUrl?: string;
};

function getClassLabel(item: MaterialRecord, student?: StudentLike | null) {
  const className = item.class && typeof item.class === 'object'
    ? item.class.className
    : item.standard;
  const section = item.class && typeof item.class === 'object'
    ? item.class.section
    : item.division;
  return `${className || student?.grade || ''}${section ? `-${section}` : ''}`.replace(/^-|-$/g, '') || 'Class';
}

function getMaterialLink(item: MaterialRecord) {
  return toTeacherFileUrl(item.file?.path || item.fileUrl || item.url || '');
}

export const ClassStudyMaterialsPage: React.FC<{ studentProfile: StudentLike | null }> = ({ studentProfile }) => {
  const [items, setItems] = useState<MaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const studentId = String(studentProfile?.studentId || '').trim();
    const accessKey = String(studentProfile?.parentAccessKey || '').trim();
    return `studentId=${encodeURIComponent(studentId)}&accessKey=${encodeURIComponent(accessKey)}`;
  }, [studentProfile?.studentId, studentProfile?.parentAccessKey]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!studentProfile?.studentId || !studentProfile?.parentAccessKey) {
        setItems([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await getTeacherPortalJson(`/api/parent/my-child-study-materials?${query}`);
        if (!cancelled) {
          setItems(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : 'Failed to load study materials');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [query, studentProfile?.parentAccessKey, studentProfile?.studentId]);

  return (
    <div className="w-full px-3 lg:px-6 py-6 space-y-5 max-w-6xl mx-auto">
      <section
        className="rounded-3xl p-6 lg:p-7 text-white overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.96), rgba(14,165,233,0.96), rgba(59,130,246,0.92))',
          boxShadow: '0 22px 50px rgba(14,165,233,0.22)',
        }}
      >
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.35em] uppercase text-white/70">Study Materials</p>
            <h1 className="text-2xl lg:text-3xl font-black mt-2">Materials for your child&apos;s class</h1>
            <p className="mt-2 text-sm lg:text-base text-white/80 max-w-2xl">
              Only study materials for {studentProfile?.className || `Std ${studentProfile?.grade || ''}`}
              {studentProfile?.section || studentProfile?.division ? ` - ${studentProfile.section || studentProfile.division}` : ''} appear here.
            </p>
          </div>
          <div className="rounded-2xl bg-white/16 border border-white/15 px-4 py-3 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Visible to</p>
            <p className="text-lg font-black">{studentProfile?.studentName || 'Parent child'}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/70 shadow-sm p-8 text-center">
          <p className="text-slate-500 font-semibold">Loading study materials...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-5 text-rose-700 font-semibold">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/70 shadow-sm p-10 text-center">
          <p className="text-lg font-black text-slate-700">No study materials available</p>
          <p className="text-sm text-slate-500 mt-1">Uploaded materials for this class will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => {
            const link = getMaterialLink(item);
            const subject = typeof item.subject === 'object' ? item.subject?.subjectName : item.subject;
            return (
              <article
                key={item._id}
                className="rounded-3xl bg-white/88 backdrop-blur-md border border-white/70 shadow-[0_16px_40px_rgba(14,165,233,0.10)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black tracking-[0.28em] uppercase text-cyan-600">Study Material</p>
                    <h2 className="text-xl font-black text-slate-800 mt-1 truncate">{item.title || 'Untitled material'}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {subject || 'Subject not set'} {item.materialType ? `• ${item.materialType}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 rounded-full text-xs font-black bg-cyan-50 text-cyan-700">
                    {getClassLabel(item, studentProfile)}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600 whitespace-pre-line">
                  {item.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Uploaded {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'recently'}
                  </p>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-xs font-black text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      View / Download
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">No file</span>
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
