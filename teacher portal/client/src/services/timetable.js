import axios from 'axios';
import { apiUrl } from '../config/api';
import teachers from '../data/teachers';

const PRIMARY_STANDARD_MAX = 5;
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
const SUBJECTS_BY_STD = {
  primary: ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'],
  upper: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing']
};
const TT_TEACHERS = {
  Computer: ['Krish Nair', 'Priyansh Mehta', 'Siya Tiwari'],
  Drawing: ['Dhruv Singh', 'Ritika Rao', 'Rohan Iyer'],
  English: ['Diya Chauhan', 'Ishaan Kapoor', 'Yash Verma'],
  EVS: ['Aarav Kapoor', 'Diya Yadav', 'Meera Verma'],
  GK: ['Ishaan Yadav', 'Meera Chauhan', 'Yash Kapoor'],
  Gujarati: ['Ananya Tiwari', 'Krish Mehta', 'Priyansh Patel'],
  Hindi: ['Dhruv Gupta', 'Myra Rao', 'Rohan Singh'],
  Mathematics: ['Ananya Nair', 'Kiara Mehta', 'Siya Patel'],
  PT: ['Dev Kulkarni', 'Kavya Sharma'],
  Sanskrit: ['Aisha Sharma', 'Dev Desai', 'Tanvi Joshi'],
  Science: ['Myra Iyer', 'Ritika Gupta', 'Vivaan Singh'],
  'Social Science': ['Aditya Desai', 'Aisha Kulkarni', 'Kavya Joshi']
};

const SUPPORTED_TEACHER_STANDARDS = [1, 2, 3, 4, 5, 6, 7];
const SUPPORTED_TEACHER_SECTIONS = ['A', 'B', 'C'];

function getRootAppBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5000';
  }

  const host = window.location.hostname || '127.0.0.1';
  return `http://${host}:5000`;
}

function hasSchedule(payload) {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    payload.schedule &&
    typeof payload.schedule === 'object'
  );
}

function extractPayload(response) {
  return response?.data?.data || response?.data || null;
}

function buildLocalGeneratedTimetable(std, section) {
  const standard = parseInt(String(std || '').match(/\d+/)?.[0] || '1', 10);
  const division = String(section || 'A').trim().toUpperCase() || 'A';
  const isPrimary = standard <= PRIMARY_STANDARD_MAX;
  const subjectPool = isPrimary ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;

  let seed = standard * 1000 + division.charCodeAt(0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const getTeacher = (subject) => {
    const pool = TT_TEACHERS[subject] || ['TBD'];
    const index = (standard + division.charCodeAt(0)) % pool.length;
    return pool[index];
  };

  const schedule = {};

  TT_DAYS.forEach((day) => {
    const slots = day === 'Saturday' ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY;
    const shuffledSubjects = [...subjectPool].sort(() => rand() - 0.5);
    let subjectIndex = 0;

    schedule[day] = slots.map((slot) => {
      if (slot.isBreak) {
        return { ...slot, subject: null, teacher: null };
      }

      const subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
      subjectIndex += 1;
      return {
        ...slot,
        subject,
        teacher: getTeacher(subject)
      };
    });
  });

  return {
    std: standard,
    section: division,
    source: 'generated',
    schedule,
    days: TT_DAYS
  };
}

function normalizeTeacherName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? String(parseInt(match[0], 10)) : '';
}

function normalizeDivision(value) {
  return String(value || '').trim().toUpperCase();
}

function resolveTeacherIdentity(currentUser = {}) {
  const assignedClass = normalizeClassNumber(currentUser?.assignedClass);
  const division = normalizeDivision(currentUser?.division);
  const email = normalizeTeacherName(currentUser?.email);
  const name = String(currentUser?.name || '').trim();

  const byEmail = teachers.find((teacher) => normalizeTeacherName(teacher.email) === email);
  const byAssignment = teachers.find((teacher) => (
    normalizeClassNumber(teacher.assignedClass) === assignedClass &&
    normalizeDivision(teacher.division) === division
  ));
  const byName = teachers.find((teacher) => normalizeTeacherName(teacher.name) === normalizeTeacherName(name));

  const resolved = byEmail || byAssignment || byName || null;

  return {
    name: resolved?.name || name || 'Teacher',
    email: resolved?.email || currentUser?.email || '',
    assignedClass: resolved?.assignedClass || assignedClass || '',
    division: resolved?.division || division || '',
    source: resolved ? (resolved === byEmail ? 'email' : resolved === byAssignment ? 'assignment' : 'name') : 'session'
  };
}

function buildEmptyTeacherTimetable() {
  const createDaySlots = (slots) => slots.map((slot) => (
    slot.isBreak
      ? { ...slot, subject: null, teacher: null, classLabel: null, std: null, section: null }
      : { ...slot, subject: null, teacher: null, classLabel: null, std: null, section: null }
  ));

  return {
    schedule: {
      Monday: createDaySlots(TT_SLOTS_WEEKDAY),
      Tuesday: createDaySlots(TT_SLOTS_WEEKDAY),
      Wednesday: createDaySlots(TT_SLOTS_WEEKDAY),
      Thursday: createDaySlots(TT_SLOTS_WEEKDAY),
      Friday: createDaySlots(TT_SLOTS_WEEKDAY),
      Saturday: createDaySlots(TT_SLOTS_SATURDAY)
    },
    days: TT_DAYS,
    slotsWeekday: TT_SLOTS_WEEKDAY,
    slotsSaturday: TT_SLOTS_SATURDAY,
    source: 'filtered',
    note: '',
    matchedClasses: [],
    lectureCount: 0
  };
}

export async function fetchTeacherTimetable(std, section) {
  let lastError = null;

  try {
    const primaryResponse = await axios.get(apiUrl('/api/class/timetable'), {
      params: { std, section },
      timeout: 3000
    });
    const primaryPayload = extractPayload(primaryResponse);
    if (hasSchedule(primaryPayload)) {
      return primaryPayload;
    }
  } catch (error) {
    lastError = error;
  }

  const fallbackResponse = await axios.get(`${getRootAppBaseUrl()}/api/teacher-portal/timetable`, {
    params: { std, section },
    timeout: 3000
  }).catch((error) => {
    lastError = error;
    return null;
  });

  const fallbackPayload = extractPayload(fallbackResponse);
  if (hasSchedule(fallbackPayload)) {
    return fallbackPayload;
  }

  if (lastError) {
    console.warn('Using local generated timetable fallback:', lastError.message);
  }

  return buildLocalGeneratedTimetable(std, section);
}

export async function fetchTeacherTeachingTimetable(currentUser) {
  const teacherIdentity = resolveTeacherIdentity(currentUser);
  const teacherName = String(teacherIdentity.name || '').trim();
  const normalizedTeacherName = normalizeTeacherName(teacherName);
  const targetTimetable = buildEmptyTeacherTimetable();
  const matchedClasses = new Set();

  if (!normalizedTeacherName) {
    targetTimetable.note = 'Teacher name not found in the current session.';
    return targetTimetable;
  }

  const classRequests = [];
  SUPPORTED_TEACHER_STANDARDS.forEach((std) => {
    SUPPORTED_TEACHER_SECTIONS.forEach((section) => {
      classRequests.push({ std, section });
    });
  });

  const results = await Promise.all(
    classRequests.map(async ({ std, section }) => {
      try {
        const payload = await fetchTeacherTimetable(std, section);
        return { std, section, payload };
      } catch (error) {
        console.warn(`Failed to load timetable for ${std}${section}:`, error);
        return { std, section, payload: buildLocalGeneratedTimetable(std, section) };
      }
    })
  );

  let lectureCount = 0;

  results.forEach(({ std, section, payload }) => {
    const schedule = payload?.schedule || {};
    const classLabel = `${std}${section}`;

    TT_DAYS.forEach((day) => {
      const slots = schedule[day] || [];
      slots.forEach((slot) => {
        if (slot?.isBreak || !slot?.subject) return;
        if (normalizeTeacherName(slot.teacher) !== normalizedTeacherName) return;

        matchedClasses.add(classLabel);
        lectureCount += 1;

        const targetDaySlots = targetTimetable.schedule[day];
        if (!Array.isArray(targetDaySlots)) return;

        const slotIndex = targetDaySlots.findIndex((entry) => entry.num === slot.num);
        if (slotIndex === -1) return;

        targetDaySlots[slotIndex] = {
          ...targetDaySlots[slotIndex],
          ...slot,
          std,
          section,
          classLabel
        };
      });
    });
  });

  targetTimetable.note = lectureCount
    ? ''
    : `No timetable slots found for ${teacherName}.`;
  targetTimetable.matchedClasses = Array.from(matchedClasses);
  targetTimetable.lectureCount = lectureCount;
  targetTimetable.teacherName = teacherName;
  targetTimetable.teacherIdentity = teacherIdentity;

  return targetTimetable;
}
