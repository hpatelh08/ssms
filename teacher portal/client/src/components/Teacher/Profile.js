import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LogOut, UserCircle, Mail, BadgeInfo, BookOpen, Users, Award, Phone, MapPin } from 'lucide-react';
import { fetchTeacherTeachingTimetable } from '../../teacherTimetable';

const ProfileField = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-[0.18em] mb-2">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-slate-900 font-semibold text-sm break-words">{value || 'Not available'}</div>
  </div>
);

export default function TeacherProfile({ currentUser, onBack, onLogout }) {
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [weeklyTimetable, setWeeklyTimetable] = useState([]);
  const [timetableNote, setTimetableNote] = useState('');
  const profile = useMemo(() => ({
    name: currentUser?.name || currentUser?.teacherId || 'Teacher',
    teacherId: currentUser?.teacherId || '',
    email: currentUser?.email || '',
    assignedClass: currentUser?.assignedClass || '',
    division: currentUser?.division || '',
    subject: currentUser?.subject || '',
  }), [currentUser]);

  useEffect(() => {
    let mounted = true;
    const loadTimetable = async () => {
      if (!currentUser) return;
      try {
        setTimetableLoading(true);
        const timetableData = await fetchTeacherTeachingTimetable(currentUser);
        const schedule = timetableData?.schedule || {};
        const days = timetableData?.days || Object.keys(schedule);
        const mapped = days.map((day) => ({
          day,
          lectures: (schedule[day] || []).filter((slot) => !slot?.isBreak && slot?.subject).map((slot) => ({
            id: `${day}-${slot.num}`,
            subject: slot.subject,
            class: slot.classLabel || `${slot.std || profile.assignedClass || '-'}-${slot.section || profile.division || '-'}`,
            time: slot.time || '',
            teacher: slot.teacher || '',
          }))
        }));
        if (mounted) {
          setWeeklyTimetable(mapped);
          setTimetableNote(timetableData?.note || '');
        }
      } catch {
        if (mounted) {
          setWeeklyTimetable([]);
          setTimetableNote('Unable to load timetable right now.');
        }
      } finally {
        if (mounted) setTimetableLoading(false);
      }
    };
    loadTimetable();
    return () => { mounted = false; };
  }, [currentUser, profile.assignedClass, profile.division]);

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Profile data not found. Please login again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Details from the teacher account used to log in.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
              <UserCircle className="h-12 w-12 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">Teacher Account</div>
              <h2 className="mt-1 text-2xl font-black leading-tight">{profile.name}</h2>
              <p className="mt-1 text-sm text-indigo-100">{profile.teacherId || profile.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-indigo-100 text-xs font-bold uppercase tracking-[0.18em]">Assigned Class</div>
              <div className="mt-1 text-lg font-bold">Std {profile.assignedClass || '-'}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-indigo-100 text-xs font-bold uppercase tracking-[0.18em]">Division</div>
              <div className="mt-1 text-lg font-bold">{profile.division || '-'}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-indigo-100 text-xs font-bold uppercase tracking-[0.18em]">Subject</div>
              <div className="mt-1 text-lg font-bold">{profile.subject || '-'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileField icon={<BadgeInfo className="h-4 w-4" />} label="Teacher ID" value={profile.teacherId} />
            <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <ProfileField icon={<BookOpen className="h-4 w-4" />} label="Assigned Class" value={`Std ${profile.assignedClass || '-'}`} />
            <ProfileField icon={<Users className="h-4 w-4" />} label="Division" value={profile.division} />
            <ProfileField icon={<Award className="h-4 w-4" />} label="Subject" value={profile.subject} />
            <ProfileField icon={<Phone className="h-4 w-4" />} label="Role" value={currentUser?.role || 'teacher'} />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 leading-7">
            This profile is loaded from the teacher account that logged in. If admin updates the teacher record, the next login will reflect the updated class, division, or subject.
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Timetable</div>
                <div className="text-sm font-semibold text-slate-900">Teacher's own schedule</div>
              </div>
              {timetableLoading && <div className="text-xs font-medium text-slate-500">Loading...</div>}
            </div>
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {weeklyTimetable.flatMap((day) => day.lectures.map((lecture) => (
                <div key={lecture.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{day.day}</div>
                  <div className="mt-1 font-bold text-slate-900">{lecture.subject}</div>
                  <div className="text-sm text-slate-600">Class {lecture.class} | {lecture.time}</div>
                </div>
              )))}
              {!timetableLoading && weeklyTimetable.every((day) => day.lectures.length === 0) && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No lectures found for this teacher.
                </div>
              )}
            </div>
            {timetableNote && <div className="mt-3 text-xs text-slate-500">{timetableNote}</div>}
          </div>

          {currentUser?.address && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                <MapPin className="h-4 w-4" />
                Address
              </div>
              <div className="text-sm font-medium text-slate-800">{currentUser.address}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
