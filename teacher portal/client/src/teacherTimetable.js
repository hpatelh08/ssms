import axios from 'axios';
import { apiUrl } from './config/api';

const TT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TT_SLOTS_WEEKDAY = [
  { num: 1, time: '07:00 - 07:40' },
  { num: 2, time: '07:40 - 08:20' },
  { num: 3, time: '08:20 - 09:00' },
  { num: 4, time: '09:00 - 09:40' },
  { num: 'B', time: '09:40 - 10:00', isBreak: true },
  { num: 5, time: '10:00 - 10:40' },
  { num: 6, time: '10:40 - 11:20' },
  { num: 7, time: '11:20 - 12:00' }
];
const TT_SLOTS_SATURDAY = [
  { num: 1, time: '07:00 - 07:40' },
  { num: 2, time: '07:40 - 08:20' },
  { num: 3, time: '08:20 - 09:00' },
  { num: 'B', time: '09:00 - 09:20', isBreak: true },
  { num: 4, time: '09:20 - 10:00' },
  { num: 5, time: '10:00 - 10:40' },
  { num: 6, time: '10:40 - 11:20' }
];

function normalizeClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

function normalizeDivision(value) {
  return String(value || '').trim().toUpperCase();
}

function extractTeacherClassInfo(currentUser = {}) {
  const rawClass = String(currentUser?.classTeacherOf || currentUser?.assignedClass || currentUser?.class || '').trim();
  const match = rawClass.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);

  if (match) {
    return {
      std: String(parseInt(match[1], 10)),
      section: normalizeDivision(currentUser?.division || match[2] || ''),
    };
  }

  return {
    std: normalizeClassNumber(currentUser?.assignedClass || currentUser?.classTeacherStd || ''),
    section: normalizeDivision(currentUser?.division || currentUser?.classTeacherDiv || ''),
  };
}

function normalizeTeacherName(value) {
  return String(value || '').trim().toLowerCase();
}

function buildEmptySchedule() {
  const makeDay = (slots) => slots.map((slot) => ({
    ...slot,
    subject: null,
    teacher: null,
    classLabel: null,
    std: null,
    section: null
  }));

  return {
    Monday: makeDay(TT_SLOTS_WEEKDAY),
    Tuesday: makeDay(TT_SLOTS_WEEKDAY),
    Wednesday: makeDay(TT_SLOTS_WEEKDAY),
    Thursday: makeDay(TT_SLOTS_WEEKDAY),
    Friday: makeDay(TT_SLOTS_WEEKDAY),
    Saturday: makeDay(TT_SLOTS_SATURDAY)
  };
}

function mapEmptyResult(std, section) {
  return {
    std: String(std || '').match(/\d+/)?.[0] || '',
    section: normalizeDivision(section) || '',
    source: 'empty',
    note: `Timetable not available for class ${std}${section || ''}.`,
    schedule: buildEmptySchedule(),
    days: TT_DAYS
  };
}

async function fetchClassTimetable(std, section) {
  const response = await axios.get(apiUrl('/api/class/timetable'), {
    params: { std, section },
    timeout: 4000
  });
  return response?.data?.data || null;
}

export async function fetchTeacherTimetable(std, section) {
  if (!String(std || '').trim() || !String(section || '').trim()) {
    return mapEmptyResult(std, section);
  }
  try {
    const payload = await fetchClassTimetable(std, section);
    if (payload && typeof payload === 'object' && payload.schedule) {
      return payload;
    }
  } catch (error) {
    console.warn('Failed to load timetable from admin backend:', error.message);
  }

  return mapEmptyResult(std, section);
}

export async function fetchTeacherTeachingTimetable(currentUser) {
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    storedUser = null;
  }

  const identity = currentUser || storedUser || {};
  const teacherName = String(identity?.name || identity?.teacherId || identity?.email || 'Teacher');
  const targetTimetable = {
    schedule: buildEmptySchedule(),
    days: TT_DAYS,
    slotsWeekday: TT_SLOTS_WEEKDAY,
    slotsSaturday: TT_SLOTS_SATURDAY,
    source: 'teacher-view',
    note: '',
    matchedClasses: [],
    lectureCount: 0,
    teacherName,
    teacherIdentity: identity
  };

  const token = localStorage.getItem('token');

  const buildResult = (payload, options = {}) => {
    const schedule = {};
    let lectureCount = 0;
    TT_DAYS.forEach((day) => {
      const slots = Array.isArray(payload.schedule?.[day]) ? payload.schedule[day] : [];
      schedule[day] = slots.map((slot) => {
        if (slot?.isBreak) return slot;
        const entry = Array.isArray(slot?.entries) && slot.entries.length ? slot.entries[0] : null;
        const subject = entry?.subject ?? slot?.subject ?? null;
        const teacher = entry?.teacher ?? slot?.teacher ?? null;
        const std = entry?.std ?? slot?.std ?? payload.std ?? null;
        const section = entry?.section ?? slot?.section ?? payload.section ?? null;
        const classLabel = entry?.classLabel ?? slot?.classLabel ?? (std && section ? `${std}${section}` : options.classLabel || null);

        if (subject) lectureCount += 1;

        return {
          ...slot,
          subject,
          teacher,
          classLabel,
          std,
          section
        };
      });
    });

    return {
      ...targetTimetable,
      schedule,
      days: payload.days || TT_DAYS,
      slotsWeekday: payload.slotsWeekday || TT_SLOTS_WEEKDAY,
      slotsSaturday: payload.slotsSaturday || TT_SLOTS_SATURDAY,
      matchedClasses: payload.matchedClasses || [],
      lectureCount: payload.lectureCount ?? lectureCount,
      note: payload.note || (lectureCount ? '' : 'No lectures found for this teacher.')
    };
  };

  const buildAssignedClassFallback = async () => {
    const assignedClass = String(identity?.assignedClass || '').trim();
    const section = String(identity?.division || '').trim().toUpperCase();
    if (!assignedClass || !section) return null;

    try {
      const classPayload = await fetchClassTimetable(assignedClass, section);
      if (!classPayload || !classPayload.schedule) return null;

      return buildResult(classPayload, {
        classLabel: `${assignedClass}${section}`
      });
    } catch (error) {
      console.warn('Failed to load assigned class fallback timetable:', error.message);
      return null;
    }
  };

  const fetchTeacherView = async (name, idValue) => {
    const response = await axios.get(apiUrl('/api/teacher/timetable-public'), {
      params: {
        teacherId: idValue || '',
        teacher: name || ''
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 4000
    });
    return response?.data?.data || null;
  };

  try {
    const payload = await fetchTeacherView(teacherName, identity?.teacherId || identity?.email || '');
    if (payload && payload.schedule && payload.lectureCount) {
      return buildResult(payload);
    }

    const lookupId = identity?.teacherId || identity?.email || '';
    if (lookupId) {
      try {
        const lookup = await axios.get(apiUrl('/api/auth/teacher-lookup'), {
          params: { teacherId: lookupId },
          timeout: 4000
        });
        const resolvedName = String(lookup?.data?.user?.name || '').trim();
        if (resolvedName) {
          const retryPayload = await fetchTeacherView(resolvedName, lookupId);
          if (retryPayload && retryPayload.schedule && retryPayload.lectureCount) {
            return buildResult(retryPayload);
          }
        }
      } catch {
        // Ignore lookup failures and fall back to empty schedule.
      }
    }

    const fallback = await buildAssignedClassFallback();
    if (fallback) {
      return {
        ...fallback,
        note: fallback.lectureCount
          ? 'No direct teacher timetable found. Showing assigned class timetable data instead.'
          : 'No lectures found for this teacher.'
      };
    }
  } catch (error) {
    console.warn('Failed to load teacher timetable from admin view:', error.message);
  }

  return targetTimetable;
}
