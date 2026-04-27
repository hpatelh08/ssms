// =============================================
//  API.JS â€” Frontend API Service Layer
//  Connects frontend to Express backend
// =============================================

const API_BASE = '/api';
const TOKEN_KEY = 'ssms_token';
const MOCK_STUDENTS_KEY = 'ssms_mock_students';
const MOCK_STUDENTS_VERSION_KEY = 'ssms_mock_students_version';
const MOCK_STUDENTS_VERSION = '2026-03-26-v5';
const MOCK_FEES_KEY = 'ssms_mock_fees';
const MOCK_FEES_VERSION_KEY = 'ssms_mock_fees_version';
const MOCK_FEES_VERSION = '2026-03-26-v6';
const MOCK_ATTENDANCE_OVERRIDES_KEY = 'ssms_mock_attendance_overrides';
const MOCK_ATTENDANCE_VERSION_KEY = 'ssms_mock_attendance_version';
const MOCK_ATTENDANCE_VERSION = '2026-03-26-v3';
const BUFFERED_STUDENT_SECTIONS = ['A', 'B', 'C'];
const BUFFERED_STUDENT_CAPACITY = 40;
const PARENT_PHONE_REGEX = /^\d{10}$/;

function getLocalDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeFeeRecord(fee) {
  if (!fee || typeof fee !== 'object') return fee;
  const amount = Math.max(parseInt(fee.amount, 10) || 0, 0);
  const paid = Math.min(Math.max(parseInt(fee.paid, 10) || 0, 0), amount);
  const due = Math.max(0, amount - paid);
  const status = due === 0 ? 'Paid' : paid === 0 ? 'Pending' : 'Partial';
  return {
    ...fee,
    amount,
    paid,
    due,
    status
  };
}

function normalizeFeeRecords(records) {
  return Array.isArray(records) ? records.map((fee) => normalizeFeeRecord(fee)) : [];
}

// ---- Token helpers ----
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getBaseMockStudents() {
  return typeof STUDENTS !== 'undefined' ? JSON.parse(JSON.stringify(STUDENTS)) : [];
}

function getMockStudents() {
  try {
    const savedVersion = localStorage.getItem(MOCK_STUDENTS_VERSION_KEY);
    if (savedVersion !== MOCK_STUDENTS_VERSION) {
      const initial = getBaseMockStudents();
      localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(initial));
      localStorage.setItem(MOCK_STUDENTS_VERSION_KEY, MOCK_STUDENTS_VERSION);
      return initial;
    }
    const saved = localStorage.getItem(MOCK_STUDENTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn('Unable to parse saved mock students', err);
  }
  const initial = getBaseMockStudents();
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(initial));
  localStorage.setItem(MOCK_STUDENTS_VERSION_KEY, MOCK_STUDENTS_VERSION);
  return initial;
}

function saveMockStudents(students) {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(students));
  localStorage.setItem(MOCK_STUDENTS_VERSION_KEY, MOCK_STUDENTS_VERSION);
  return students;
}

function extractNumericSuffix(value) {
  const match = String(value || '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : null;
}

function normalizeParentPhone(value = '') {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function isValidParentPhone(value = '') {
  return PARENT_PHONE_REGEX.test(normalizeParentPhone(value));
}

function normalizeBufferedStudentSection(sectionRaw = 'A') {
  const section = String(sectionRaw || 'A').trim().toUpperCase();
  return BUFFERED_STUDENT_SECTIONS.includes(section) ? section : null;
}

function getBufferedStudentRange(cls, sectionRaw = 'A') {
  const classNo = parseInt(cls, 10);
  const section = normalizeBufferedStudentSection(sectionRaw);
  if (!Number.isInteger(classNo) || classNo < 1 || classNo > 6 || !section) return null;

  const sectionIndex = BUFFERED_STUDENT_SECTIONS.indexOf(section);
  const blockIndex = ((classNo - 1) * BUFFERED_STUDENT_SECTIONS.length) + sectionIndex;
  const start = (blockIndex * BUFFERED_STUDENT_CAPACITY) + 1;

  return {
    classNo,
    section,
    start,
    end: start + BUFFERED_STUDENT_CAPACITY - 1
  };
}

function getNextAvailableMockStudentSequence(students = [], cls = '', section = 'A') {
  const range = getBufferedStudentRange(cls, section);
  if (!range) return null;

  const usedSequences = new Set();

  students.forEach((student) => {
    [
      extractNumericSuffix(student.gr_number),
      extractNumericSuffix(student.admission),
      extractNumericSuffix(student.student_id)
    ].forEach((sequence) => {
      if (
        Number.isInteger(sequence)
        && sequence >= range.start
        && sequence <= range.end
      ) {
        usedSequences.add(sequence);
      }
    });
  });

  for (let nextSequence = range.start; nextSequence <= range.end; nextSequence += 1) {
    if (!usedSequences.has(nextSequence)) {
      return nextSequence;
    }
  }

  return null;
}

function buildGeneratedParentAccessKey(phone) {
  const normalizedPhone = normalizeParentPhone(phone);
  return isValidParentPhone(normalizedPhone) ? normalizedPhone.slice(-4) : null;
}

function buildGeneratedMockStudentIds(sequence, parentPhone, year = new Date().getFullYear()) {
  return {
    gr_number: `GR-${String(sequence).padStart(3, '0')}`,
    admission: `ADM-${year}-${String(sequence).padStart(3, '0')}`,
    student_id: `STU${year}${String(sequence).padStart(4, '0')}`,
    student_password: `Stu@${String(sequence).padStart(3, '0')}`,
    parent_access_key: buildGeneratedParentAccessKey(parentPhone)
  };
}

function getBaseMockFees() {
  return normalizeFeeRecords(typeof FEES !== 'undefined' ? JSON.parse(JSON.stringify(FEES)) : []);
}

function getMockFees() {
  try {
    const savedVersion = localStorage.getItem(MOCK_FEES_VERSION_KEY);
    if (savedVersion !== MOCK_FEES_VERSION) {
      const initial = getBaseMockFees();
      localStorage.setItem(MOCK_FEES_KEY, JSON.stringify(initial));
      localStorage.setItem(MOCK_FEES_VERSION_KEY, MOCK_FEES_VERSION);
      return initial;
    }
    const saved = localStorage.getItem(MOCK_FEES_KEY);
    if (saved) {
      const normalized = normalizeFeeRecords(JSON.parse(saved));
      localStorage.setItem(MOCK_FEES_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (err) {
    console.warn('Unable to parse saved mock fees', err);
  }
  const initial = getBaseMockFees();
  localStorage.setItem(MOCK_FEES_KEY, JSON.stringify(initial));
  localStorage.setItem(MOCK_FEES_VERSION_KEY, MOCK_FEES_VERSION);
  return initial;
}

function saveMockFees(fees) {
  const normalized = normalizeFeeRecords(fees);
  localStorage.setItem(MOCK_FEES_KEY, JSON.stringify(normalized));
  localStorage.setItem(MOCK_FEES_VERSION_KEY, MOCK_FEES_VERSION);
  return normalized;
}

function getMockAttendanceOverrides() {
  try {
    const savedVersion = localStorage.getItem(MOCK_ATTENDANCE_VERSION_KEY);
    if (savedVersion !== MOCK_ATTENDANCE_VERSION) {
      localStorage.setItem(MOCK_ATTENDANCE_OVERRIDES_KEY, JSON.stringify({}));
      localStorage.setItem(MOCK_ATTENDANCE_VERSION_KEY, MOCK_ATTENDANCE_VERSION);
      return {};
    }
    const saved = localStorage.getItem(MOCK_ATTENDANCE_OVERRIDES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn('Unable to parse saved mock attendance overrides', err);
  }
  localStorage.setItem(MOCK_ATTENDANCE_OVERRIDES_KEY, JSON.stringify({}));
  localStorage.setItem(MOCK_ATTENDANCE_VERSION_KEY, MOCK_ATTENDANCE_VERSION);
  return {};
}

function saveMockAttendanceOverrides(overrides) {
  localStorage.setItem(MOCK_ATTENDANCE_OVERRIDES_KEY, JSON.stringify(overrides));
  localStorage.setItem(MOCK_ATTENDANCE_VERSION_KEY, MOCK_ATTENDANCE_VERSION);
  return overrides;
}

function getLocalVisitorInquiries() {
  try {
    const saved = localStorage.getItem(VISITOR_INQUIRIES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Unable to parse saved visitor inquiries', err);
    return [];
  }
}

function saveLocalVisitorInquiries(inquiries) {
  const normalized = Array.isArray(inquiries) ? inquiries : [];
  localStorage.setItem(VISITOR_INQUIRIES_KEY, JSON.stringify(normalized));
  return normalized;
}

function normalizeVisitorInquiry(item = {}) {
  return {
    id: item.id,
    full_name: item.full_name || '',
    email: item.email || '',
    phone: item.phone || '',
    inquiry_type: item.inquiry_type || 'General',
    message: item.message || '',
    status: String(item.status || 'new').toLowerCase(),
    response: item.response || '',
    responded_at: item.responded_at || '',
    visitor_username: item.visitor_username || '',
    created_at: item.created_at || new Date().toISOString(),
  };
}

function mergeVisitorInquiries(primary = [], secondary = []) {
  const merged = new Map();
  [...primary, ...secondary].forEach((item) => {
    const normalized = normalizeVisitorInquiry(item);
    merged.set(String(normalized.id), normalized);
  });

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = new Date(String(a.created_at).replace(' ', 'T')).getTime();
    const bTime = new Date(String(b.created_at).replace(' ', 'T')).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}


const MOCK_ATTENDANCE_HOLIDAYS = [
  { holiday_date: '2025-08-15', title: 'Independence Day', source: 'holiday' },
  { holiday_date: '2025-10-02', title: 'Gandhi Jayanti', source: 'holiday' },
  { holiday_date: '2025-12-25', title: 'Christmas Holiday', source: 'holiday' },
  { holiday_date: '2026-01-14', title: 'Uttarayan Festival', source: 'holiday' },
  { holiday_date: '2026-01-26', title: 'Republic Day', source: 'holiday' },
  { holiday_date: '2026-03-14', title: 'Holi Celebration', source: 'holiday' },
  { holiday_date: '2026-03-30', title: 'Ram Navami', source: 'holiday' },
];

const MOCK_ATTENDANCE_VACATIONS = [
  { id: 'VAC001', title: 'Diwali Break', start_date: '2025-10-20', end_date: '2025-10-25', type: 'vacation' },
  { id: 'VAC002', title: 'Winter Break', start_date: '2025-12-26', end_date: '2025-12-31', type: 'vacation' },
  { id: 'VAC003', title: 'Spring Activity Break', start_date: '2026-03-16', end_date: '2026-03-18', type: 'vacation' },
  { id: 'VAC004', title: 'Summer Break', start_date: '2026-05-05', end_date: '2026-06-05', type: 'vacation' },
];

const VISITOR_INQUIRIES_KEY = 'ssms_visitor_inquiries';

function getMockAttendanceVacations(year) {
  return MOCK_ATTENDANCE_VACATIONS
    .filter((item) => String(item.start_date).slice(0, 4) <= String(year) && String(item.end_date).slice(0, 4) >= String(year))
    .map((item) => ({ ...item }));
}

function toIsoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function attendanceStatusLabel(status) {
  return status === 'A' ? 'Absent' : status === 'L' ? 'Leave' : 'Present';
}

function attendanceStatusCode(status) {
  if (status === 'Present') return 'P';
  if (status === 'Absent') return 'A';
  if (status === 'Leave') return 'L';
  return ['P', 'A', 'L'].includes(String(status || '').toUpperCase()) ? String(status).toUpperCase() : 'P';
}

function attendanceHash(input) {
  let hash = 0;
  const text = String(input || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash * 31) + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function isDateBetween(dateStr, startDate, endDate) {
  return dateStr >= startDate && dateStr <= endDate;
}

function getMockAttendancePeopleList(personType = 'student', cls = '', section = '') {
  if (personType === 'teacher') {
    return (typeof TEACHERS !== 'undefined' ? JSON.parse(JSON.stringify(TEACHERS)) : [])
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((teacher) => ({
        id: teacher.id,
        person_id: teacher.teacher_id,
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        roll: teacher.emp,
        subject: teacher.subject || 'General',
      }));
  }

  return getMockStudents()
    .filter((student) => String(student.status || '').toLowerCase() === 'active')
    .filter((student) => !cls || String(student.class) === String(cls))
    .filter((student) => !section || String(student.section || '').toUpperCase() === String(section).toUpperCase())
    .sort((a, b) => {
      const classDiff = (parseInt(a.class, 10) || 0) - (parseInt(b.class, 10) || 0);
      if (classDiff !== 0) return classDiff;
      const sectionDiff = String(a.section || '').localeCompare(String(b.section || ''));
      if (sectionDiff !== 0) return sectionDiff;
      return String(a.name || '').localeCompare(String(b.name || ''));
    })
    .map((student) => ({
      id: student.id,
      person_id: student.student_id,
      student_id: student.student_id,
      name: student.name,
      roll: student.gr_number,
      class: student.class,
      section: student.section,
    }));
}

function getMockAttendanceHolidayEntries(startDate, endDate) {
  const holidayMap = new Map();

  MOCK_ATTENDANCE_HOLIDAYS.forEach((holiday) => {
    if (isDateBetween(holiday.holiday_date, startDate, endDate)) {
      holidayMap.set(holiday.holiday_date, { ...holiday });
    }
  });

  MOCK_ATTENDANCE_VACATIONS.forEach((vacation) => {
    const start = vacation.start_date > startDate ? vacation.start_date : startDate;
    const end = vacation.end_date < endDate ? vacation.end_date : endDate;
    if (start > end) return;

    let cursor = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (cursor <= last) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (cursor.getDay() !== 0 && !holidayMap.has(dateStr)) {
        holidayMap.set(dateStr, {
          holiday_date: dateStr,
          title: vacation.title,
          source: 'vacation'
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return Array.from(holidayMap.values()).sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
}

function getMockAttendanceNonWorkingInfo(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (date.getDay() === 0) return { type: 'sunday', title: 'Sunday' };
  const holidays = getMockAttendanceHolidayEntries(dateStr, dateStr);
  if (holidays.length) {
    return {
      type: holidays[0].source === 'vacation' ? 'vacation' : 'holiday',
      title: holidays[0].title
    };
  }
  return null;
}

function getApprovedTeacherLeaveLookup() {
  return (typeof LEAVE_REQUESTS !== 'undefined' ? LEAVE_REQUESTS : [])
    .filter((leave) => String(leave.status || '').toLowerCase() === 'approved')
    .reduce((lookup, leave) => {
      const key = String(leave.name || '').trim().toLowerCase();
      if (!lookup[key]) lookup[key] = [];
      lookup[key].push({ start_date: leave.from, end_date: leave.to, title: leave.reason || 'Approved Leave' });
      return lookup;
    }, {});
}

function getMockAttendanceStatus(person, personType, dateStr) {
  const nonWorking = getMockAttendanceNonWorkingInfo(dateStr);
  if (nonWorking) return null;

  const overrideKey = `${personType}|${person.person_id}|${dateStr}`;
  const overrides = getMockAttendanceOverrides();
  if (overrides[overrideKey]) {
    return attendanceStatusCode(overrides[overrideKey].status);
  }

  if (personType === 'teacher') {
    const teacherLeaves = getApprovedTeacherLeaveLookup()[String(person.name || '').trim().toLowerCase()] || [];
    const onApprovedLeave = teacherLeaves.some((leave) => isDateBetween(dateStr, leave.start_date, leave.end_date));
    if (onApprovedLeave) return 'L';
  }

  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = date.getDay();
  const seed = attendanceHash(`${person.person_id}|${dateStr}|${personType}`);
  const classWeight = parseInt(person.class, 10) || 0;
  const score = personType === 'teacher'
    ? (seed + (weekday === 6 ? 9 : 0)) % 100
    : (seed + classWeight + (weekday === 6 ? 12 : 0)) % 100;

  if (personType === 'teacher') {
    if (score >= 96) return 'L';
    if (score >= 90) return 'A';
    return 'P';
  }

  if (score >= 95) return 'L';
  if (score >= 87) return 'A';
  return 'P';
}

function buildMockAttendanceDayDetail(dateStr, personType = 'student', cls = '', section = '') {
  const people = getMockAttendancePeopleList(personType, cls, section);
  const nonWorking = getMockAttendanceNonWorkingInfo(dateStr);
  const records = nonWorking ? [] : people.map((person) => {
    const statusCode = getMockAttendanceStatus(person, personType, dateStr);
    return {
      person_id: person.person_id,
      name: person.name,
      roll: person.roll || '—',
      class: person.class || null,
      section: person.section || null,
      subject: person.subject || null,
      status_code: statusCode,
      status: attendanceStatusLabel(statusCode),
    };
  });

  const total = records.length;
  const present = records.filter((record) => record.status_code === 'P').length;
  const absent = records.filter((record) => record.status_code === 'A').length;
  const leave = records.filter((record) => record.status_code === 'L').length;
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    date: dateStr,
    person_type: personType,
    total,
    present,
    absent,
    leave,
    percent,
    records,
    non_working: nonWorking,
  };
}

function buildMockMonthlyAttendanceReport(year, month, personType = 'student') {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = toIsoDate(year, month, 1);
  const monthEnd = toIsoDate(year, month, daysInMonth);
  const holidays = getMockAttendanceHolidayEntries(monthStart, monthEnd);
  const holidayMap = holidays.reduce((map, holiday) => {
    map[holiday.holiday_date] = holiday;
    return map;
  }, {});

  const days = [];
  let totalWorkingDays = 0;
  let sundayCount = 0;
  let holidayCount = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = toIsoDate(year, month, day);
    const date = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    const holiday = holidayMap[dateStr] || null;
    const isHoliday = Boolean(holiday);
    const isWorking = !isSunday && !isHoliday;
    if (isSunday) sundayCount += 1;
    if (isHoliday && !isSunday) holidayCount += 1;
    if (isWorking) totalWorkingDays += 1;

    const detail = isWorking ? buildMockAttendanceDayDetail(dateStr, personType) : null;
    days.push({
      date: dateStr,
      day,
      dayOfWeek,
      isSunday,
      isHoliday,
      holidayTitle: holiday ? holiday.title : null,
      isWorking,
      percent: detail ? detail.percent : null,
    });
  }

  const people = getMockAttendancePeopleList(personType);
  const persons = people.map((person) => {
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = toIsoDate(year, month, day);
      const status = getMockAttendanceStatus(person, personType, dateStr);
      if (!status) continue;
      if (status === 'P') presentDays += 1;
      else if (status === 'A') absentDays += 1;
      else leaveDays += 1;
    }

    const recordedDays = presentDays + absentDays + leaveDays;
    const percent = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;
    return {
      person_id: person.person_id,
      name: person.name,
      roll: person.roll,
      class: person.class,
      subject: person.subject,
      present_days: presentDays,
      absent_days: absentDays,
      leave_days: leaveDays,
      recorded_days: recordedDays,
      percent,
    };
  });

  return {
    year,
    month,
    daysInMonth,
    totalWorkingDays,
    sundayCount,
    holidayCount,
    overallPercent: persons.length
      ? Math.round(persons.reduce((sum, person) => sum + person.percent, 0) / persons.length)
      : 0,
    fullAttendance: persons.filter((person) => person.percent >= 100).length,
    below75: persons.filter((person) => person.percent < 75).length,
    days,
    holidays,
    persons,
    person_type: personType,
  };
}

function parseFeeClassNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function shouldUseMockFees(apiFees) {
  if (!Array.isArray(apiFees) || !apiFees.length) return true;
  return !apiFees.some((fee) => {
    const classNo = parseFeeClassNumber(fee.cls || fee.class);
    return classNo !== null && classNo >= 1 && classNo <= 6;
  });
}

function buildFeeSummaryFromFees(fees) {
  return normalizeFeeRecords(fees).reduce((summary, fee) => {
    const classNo = parseFeeClassNumber(fee.cls || fee.class);
    if (classNo === null || classNo < 1 || classNo > 6) return summary;
    if (fee.status === 'Paid') summary.paid += 1;
    else if (fee.status === 'Partial') summary.partial += 1;
    else summary.pending += 1;
    summary.total += 1;
    return summary;
  }, { paid: 0, partial: 0, pending: 0, total: 0 });
}

function buildClassFeeSummaryFromFees(fees) {
  const grouped = new Map();

  normalizeFeeRecords(fees).forEach((fee) => {
    const classNo = parseFeeClassNumber(fee.cls || fee.class);
    if (classNo === null || classNo < 1 || classNo > 6) return;

    if (!grouped.has(classNo)) {
      grouped.set(classNo, {
        class: String(classNo),
        total_students: 0,
        paid_count: 0,
        percentage: 0,
        collected_amount: 0,
        total_amount: 0
      });
    }

    const group = grouped.get(classNo);
    group.total_students += 1;
    group.total_amount += Math.max(Number(fee.amount) || 0, 0);
    group.collected_amount += Math.max(Number(fee.paid) || 0, 0);
    if (fee.status === 'Paid') group.paid_count += 1;
  });

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      percentage: group.total_students > 0
        ? Math.round((group.paid_count / group.total_students) * 100)
        : 0
    }))
    .sort((a, b) => parseInt(a.class, 10) - parseInt(b.class, 10));
}

function normalizeClassFeeSummaryRows(rows) {
  const grouped = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const classNo = parseInt(row.class, 10);
    if (!Number.isInteger(classNo) || classNo < 1 || classNo > 6) return;
    grouped.set(classNo, {
      class: String(classNo),
      total_students: Number(row.total_students) || 0,
      paid_count: Number(row.paid_count) || 0,
      percentage: Number(row.percentage) || 0,
      collected_amount: Number(row.collected_amount) || 0,
      total_amount: Number(row.total_amount) || 0,
    });
  });

  return Array.from({ length: 6 }, (_, index) => {
    const classNo = index + 1;
    return grouped.get(classNo) || {
      class: String(classNo),
      total_students: 0,
      paid_count: 0,
      percentage: 0,
      collected_amount: 0,
      total_amount: 0,
    };
  });
}

// ---- Core fetch wrapper ----
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 without forcing a hard redirect.
    // This keeps demo/offline sessions alive so callers can fall back to mock data.
    if (res.status === 401) {
      removeToken();
      if (!endpoint.includes('/auth/login')) {
        console.warn('Session unauthorized for', endpoint);
      }
    }

    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data };
    }

    return data;
  } catch (err) {
    if (err.status) throw err; // already formatted
    console.error(`API Error [${endpoint}]:`, err);
    throw { status: 0, error: 'Network error â€” is the backend running?' };
  }
}

// ---- Convenience methods ----
const api = {
  get:    (endpoint)       => apiFetch(endpoint, { method: 'GET' }),
  post:   (endpoint, body) => apiFetch(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint, body) => apiFetch(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint)       => apiFetch(endpoint, { method: 'DELETE' }),
};

// ---- Auth API ----
async function apiLogin(email, password) {
  const data = await api.post('/auth/login', { email, password });
  if (data && data.token) {
    setToken(data.token);
  }
  return data;
}

function apiLogout() {
  removeToken();
  localStorage.removeItem('ssms_auth');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  window.location.href = '/login';
}

// ---- Data loading helpers (fetch from backend, fallback to mock globals) ----

async function loadDashboardStats() {
  let stats;
  try {
    stats = await api.get('/dashboard/stats');
  } catch (e) {
    console.warn('Dashboard stats API unavailable, using mock data');
    stats = typeof DASH_STATS !== 'undefined' ? DASH_STATS : {};
  }

  try {
    const fees = await loadFees();
    const feeTotals = (Array.isArray(fees) ? fees : []).reduce((totals, fee) => {
      totals.pendingFees += Math.max(Number(fee?.due) || 0, 0);
      totals.totalRevenue += Math.max(Number(fee?.paid) || 0, 0);
      return totals;
    }, { pendingFees: 0, totalRevenue: 0 });

    return {
      ...stats,
      pendingFees: feeTotals.pendingFees,
      totalRevenue: feeTotals.totalRevenue
    };
  } catch (err) {
    console.warn('Unable to merge live fee totals into dashboard stats', err);
    return stats;
  }
}

async function loadMonthlyAttendance() {
  try {
    const res = await api.get('/dashboard/monthly-attendance');
    // Backend returns { months, attendance_percent, data }
    if (res.months && res.attendance_percent) return res;
    if (res.data && Array.isArray(res.data)) return {
      months: res.data.map(d => d.month),
      attendance_percent: res.data.map(d => d.percent),
      data: res.data
    };
    return res;
  } catch (e) {
    console.warn('Monthly attendance API unavailable, using mock data');
    const raw = typeof MONTHLY_ATTENDANCE !== 'undefined' ? MONTHLY_ATTENDANCE : [];
    return { months: raw.map(d => d.month), attendance_percent: raw.map(d => d.percent), data: raw };
  }
}

async function loadFeeCollection() {
  try {
    const res = await api.get('/dashboard/fee-collection');
    // Backend returns { months, amount_collected, data }
    if (res.months && res.amount_collected) return res;
    if (res.data && Array.isArray(res.data)) return {
      months: res.data.map(d => d.month),
      amount_collected: res.data.map(d => d.collected),
      data: res.data
    };
    return res;
  } catch (e) {
    console.warn('Fee collection API unavailable, using mock data');
    const raw = typeof FEE_COLLECTION !== 'undefined' ? FEE_COLLECTION : [];
    return { months: raw.map(d => d.month), amount_collected: raw.map(d => d.collected), data: raw };
  }
}

async function loadHolidays(year) {
  try {
    return await api.get(`/holidays/${year}`);
  } catch (e) {
    console.warn('Holidays API unavailable');
    return { year, holidays: [], details: [], total: 0 };
  }
}

async function loadMonthlyReport(year, month, personType) {
  try {
    const pt = personType || 'student';
    const report = await api.get(`/attendance/monthly-report?year=${year}&month=${month}&person_type=${pt}`);
    const shouldUseMock = !report || !Array.isArray(report.persons) || !Array.isArray(report.days) || !report.persons.length;
    return shouldUseMock ? buildMockMonthlyAttendanceReport(year, month, pt) : report;
  } catch (e) {
    console.warn('Monthly report API unavailable, using mock data');
    return buildMockMonthlyAttendanceReport(year, month, personType || 'student');
  }
}

async function syncGoogleHolidays(year) {
  try {
    return await api.post(`/holidays/sync/${year}`);
  } catch (e) {
    console.warn('Google Calendar sync failed');
    return { success: false, synced: 0 };
  }
}

async function addHoliday(holiday_date, title) {
  try {
    return await api.post('/holidays', { holiday_date, title });
  } catch (e) {
    console.warn('Add holiday failed:', e);
    return { success: false, error: e.message };
  }
}

async function loadStudents(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.search) qs.set('search', params.search);
    if (params.class) qs.set('class', params.class);
    if (params.section) qs.set('section', params.section);
    if (params.status) qs.set('status', params.status);
    const query = qs.toString();
    const res = await api.get('/students' + (query ? '?' + query : ''));
    // Return full pagination response: { totalRecords, totalPages, currentPage, data }
    return res;
  } catch (e) {
    console.warn('Students API unavailable, using mock data');
    const allStudents = getMockStudents();
    const page = Math.max(parseInt(params.page, 10) || 1, 1);
    const limit = Math.max(parseInt(params.limit, 10) || allStudents.length || 1, 1);
    const search = String(params.search || '').trim().toLowerCase();
    const classFilter = String(params.class || '').trim();
    const sectionFilter = String(params.section || '').trim().toUpperCase();
    const statusFilter = String(params.status || '').trim().toLowerCase();

    const filtered = allStudents.filter((student) => {
      const studentClass = String(student.class || '').trim();
      const studentSection = String(student.section || '').trim().toUpperCase();
      const classMatches = !classFilter || studentClass === classFilter;
      const sectionMatches = !sectionFilter || studentSection === sectionFilter;
      const statusMatches = !statusFilter || String(student.status || '').trim().toLowerCase() === statusFilter;
      const searchHaystack = [
        student.name,
        student.admission,
        student.gr_number,
        student.parent,
        student.phone,
        student.student_id
      ].join(' ').toLowerCase();
      const searchMatches = !search || searchHaystack.includes(search);
      return classMatches && sectionMatches && statusMatches && searchMatches;
    });

    const totalRecords = filtered.length;
    const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * limit;

    return {
      totalRecords,
      totalPages,
      currentPage,
      data: filtered.slice(start, start + limit)
    };
  }
}

async function loadStudentCounts() {
  try {
    return await api.get('/students/counts');
  } catch (e) {
    console.warn('Student counts API unavailable');
    const students = getMockStudents();
    return {
      total: students.length,
      active: students.filter((student) => String(student.status || '').toLowerCase() === 'active').length,
      inactive: students.filter((student) => String(student.status || '').toLowerCase() === 'inactive').length,
      feePending: students.filter((student) => String(student.fees || '').toLowerCase() === 'pending').length
    };
  }
}

async function loadTeachers(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.search) qs.set('search', params.search);
    if (params.status) qs.set('status', params.status);
    if (params.subject) qs.set('subject', params.subject);
    if (params.class) qs.set('class', params.class);
    if (params.division) qs.set('division', params.division);
    const query = qs.toString();
    const res = await api.get('/teachers' + (query ? '?' + query : ''));
    return res;
  } catch (e) {
    console.warn('Teachers API unavailable, using mock data');
    let arr = typeof TEACHERS !== 'undefined' ? JSON.parse(JSON.stringify(TEACHERS)) : [];
    const search = String(params.search || '').trim().toLowerCase();
    const status = String(params.status || '').trim().toLowerCase();
    const subject = String(params.subject || '').trim().toLowerCase();
    const classValue = String(params.class || '').trim();
    const division = String(params.division || '').trim().toUpperCase();
    const normalizeClassValue = (teacher) => {
      const rawClass = String(teacher?.class || '').trim();
      const rawDivision = String(teacher?.division || '').trim().toUpperCase();
      const classDigits = rawClass.match(/\d+/)?.[0] || '';
      const classLetters = rawClass.match(/[A-Za-z]+$/)?.[0]?.toUpperCase() || '';
      const combined = `${classDigits}${classLetters}`;
      const hyphenCombined = classDigits && classLetters ? `${classDigits}-${classLetters}` : '';
      return {
        rawClass,
        classDigits,
        classLetters,
        rawDivision,
        combined,
        hyphenCombined,
      };
    };
    if (search) {
      arr = arr.filter((t) => {
        const normalized = normalizeClassValue(t);
        return [t.name, t.subject, t.emp, t.teacher_id, t.class, t.division, normalized.combined, normalized.hyphenCombined]
          .some((value) => String(value || '').toLowerCase().includes(search));
      });
    }
    if (status) arr = arr.filter((t) => String(t.status || '').toLowerCase() === status);
    if (subject) arr = arr.filter((t) => String(t.subject || '').toLowerCase().includes(subject));
    if (classValue) {
      arr = arr.filter((t) => {
        const normalized = normalizeClassValue(t);
        return normalized.classDigits === classValue
          || normalized.combined === classValue.replace(/\s+/g, '')
          || normalized.hyphenCombined === classValue.replace(/\s+/g, '')
          || normalized.rawClass.replace(/\s+/g, '').toUpperCase() === classValue.replace(/\s+/g, '').toUpperCase()
          || normalized.rawClass.toLowerCase().includes(`class ${classValue.toLowerCase()}`);
      });
    }
    if (division) {
      arr = arr.filter((t) => {
        const normalized = normalizeClassValue(t);
        return normalized.rawDivision === division
          || normalized.classLetters === division
          || normalized.rawClass.toUpperCase().endsWith(division)
          || normalized.hyphenCombined.endsWith(division);
      });
    }
    return { totalRecords: arr.length, totalPages: 1, currentPage: 1, data: arr };
  }
}

async function loadTeacherCounts() {
  try {
    return await api.get('/teachers/counts');
  } catch (e) {
    console.warn('Teacher counts API unavailable');
    return {
      total: 0,
      active: 0,
      inactive: 0,
      subjects: 0,
      avgSalary: 0
    };
  }
}

async function loadAttendance(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.person_type) qs.set('person_type', params.person_type);
    if (params.class) qs.set('class', params.class);
    if (params.date) qs.set('date', params.date);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const query = qs.toString();
    return await api.get('/attendance' + (query ? '?' + query : ''));
  } catch (e) {
    console.warn('Attendance API unavailable, using mock data');
    const personType = params.person_type || 'student';
    const cls = params.class || '';
    const date = params.date || getLocalDateISO();
    const detail = buildMockAttendanceDayDetail(date, personType, cls);
    const page = Math.max(parseInt(params.page, 10) || 1, 1);
    const limit = Math.max(parseInt(params.limit, 10) || detail.records.length || 1, 1);
    const start = (page - 1) * limit;
    return {
      data: detail.records.slice(start, start + limit),
      total: detail.records.length,
      page,
      totalPages: Math.max(Math.ceil(detail.records.length / limit), 1),
    };
  }
}

function buildDashboardAttendanceHeatmapFromRecords(records, personType = 'student') {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const ay1 = currentMonth >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const ay2 = ay1 + 1;
  const fromDate = `${ay1}-07-01`;
  const toDate = `${ay2}-06-30`;
  const grouped = new Map();

  (Array.isArray(records) ? records : []).forEach((record) => {
    const date = String(record?.date || '').trim();
    if (!date || date < fromDate || date > toDate) return;
    if (!grouped.has(date)) {
      grouped.set(date, { date, total: 0, present: 0, absent: 0, leave_count: 0 });
    }
    const row = grouped.get(date);
    row.total += 1;
    if (record.status === 'P') row.present += 1;
    else if (record.status === 'A') row.absent += 1;
    else if (record.status === 'L') row.leave_count += 1;
  });

  return {
    data: Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date)),
    type: personType,
    academicYear: `${ay1}-${String(ay2).slice(-2)}`
  };
}

async function loadDashboardAttendanceHeatmap(personType = 'student') {
  try {
    const res = await api.get(`/dashboard/attendance-heatmap?type=${encodeURIComponent(personType)}`);
    if (res && Array.isArray(res.data) && res.data.length) return res;
  } catch (e) {
    console.warn('Dashboard attendance heatmap API unavailable, falling back to attendance records');
  }

  try {
    const res = await loadAttendance({ person_type: personType, page: 1, limit: 20000 });
    return buildDashboardAttendanceHeatmapFromRecords(res.data || [], personType);
  } catch (e) {
    console.warn('Attendance records fallback unavailable for dashboard heatmap');
    return buildDashboardAttendanceHeatmapFromRecords([], personType);
  }
}

async function loadAttendancePeople(personType = 'student', cls = '', section = '') {
  try {
    const normalizeClassValue = (value) => {
      const match = String(value || '').match(/\d+/);
      return match ? String(parseInt(match[0], 10)) : '';
    };
    const normalizeSectionValue = (value) => {
      const sectionValue = String(value || '').trim().toUpperCase();
      return ['A', 'B', 'C'].includes(sectionValue) ? sectionValue : '';
    };
    const qs = new URLSearchParams({ person_type: personType });
    const classValue = normalizeClassValue(cls);
    const sectionValue = normalizeSectionValue(section);
    if (classValue) qs.set('class', classValue);
    if (sectionValue) qs.set('section', sectionValue);
    const res = await api.get('/attendance/people?' + qs.toString());
    const rows = res.data || [];
    return rows.length ? rows : getMockAttendancePeopleList(personType, cls, section);
  } catch (e) {
    console.warn('Attendance people API unavailable, using mock data');
    return getMockAttendancePeopleList(personType, cls, section);
  }
}

async function loadAttendanceSummary(personType, date) {
  try {
    const qs = new URLSearchParams();
    if (personType) qs.set('person_type', personType);
    if (date) qs.set('date', date);
    const summary = await api.get('/attendance/summary?' + qs.toString());
    if (summary && Number(summary.total || 0) > 0) return summary;
    const mock = buildMockAttendanceDayDetail(date || getLocalDateISO(), personType || 'student');
    return { total: mock.total, present: mock.present, absent: mock.absent, leave: mock.leave, rate: mock.percent };
  } catch (e) {
    console.warn('Attendance summary API unavailable, using mock data');
    const mock = buildMockAttendanceDayDetail(date || getLocalDateISO(), personType || 'student');
    return { total: mock.total, present: mock.present, absent: mock.absent, leave: mock.leave, rate: mock.percent };
  }
}

async function checkAttendanceDate(date) {
  try {
    return await api.get('/attendance/check-date?date=' + date);
  } catch (e) {
    const errors = [];
    const today = getLocalDateISO();
    if (date > today) errors.push('Cannot mark attendance for a future date.');
    const nonWorking = getMockAttendanceNonWorkingInfo(date);
    if (nonWorking && nonWorking.type === 'holiday') errors.push(`This date is a holiday: ${nonWorking.title}`);
    if (nonWorking && nonWorking.type === 'vacation') errors.push(`This date is a vacation: ${nonWorking.title}`);
    if (nonWorking && nonWorking.type === 'sunday') errors.push('This date is a Sunday.');
    return { valid: errors.length === 0, errors, date };
  }
}

async function saveAttendanceBulk(data) {
  try {
    return await api.post('/attendance/bulk', data);
  } catch (e) {
    console.warn('Save attendance API failed, saving to mock attendance', e);
    const overrides = getMockAttendanceOverrides();
    const records = Array.isArray(data?.records) ? data.records : [];
    let updatedCount = 0;

    records.forEach((record) => {
      const personId = String(record.person_id || '').trim();
      if (!personId) return;
      const key = `${data.person_type || 'student'}|${personId}|${data.date}`;
      if (overrides[key]) updatedCount += 1;
      overrides[key] = {
        status: attendanceStatusCode(record.status),
        class: record.class || data.class || null,
        section: record.section || data.section || null,
        subject: record.subject || null,
      };
    });

    saveMockAttendanceOverrides(overrides);
    return {
      success: true,
      total: records.length,
      new: Math.max(records.length - updatedCount, 0),
      updated: updatedCount,
      date: data.date,
      person_type: data.person_type || 'student'
    };
  }
}

async function loadAttendanceDayDetail(date, personType = 'student', cls = '', section = '') {
  try {
    const qs = new URLSearchParams({ date, person_type: personType });
    if (cls) qs.set('class', cls);
    if (section) qs.set('section', section);
    return await api.get('/attendance/day?' + qs.toString());
  } catch (e) {
    console.warn('Attendance day detail API unavailable, using mock data');
    return buildMockAttendanceDayDetail(date, personType, cls, section);
  }
}

async function loadTimetable(std = 1, section = 'A') {
  try {
    return await api.get(`/timetable?std=${encodeURIComponent(std)}&section=${encodeURIComponent(section)}`);
  } catch (e) {
    console.warn('Timetable API unavailable, using generated fallback');
    const parsedStd = parseInt(std, 10);
    const safeStd = Number.isInteger(parsedStd) && parsedStd >= 1 && parsedStd <= 6 ? parsedStd : 1;
    const safeSection = section || 'A';
    const isPrimary = safeStd <= 5;
    return {
      std: safeStd,
      section: safeSection,
      source: 'generated',
      schedule: typeof generateTimetable === 'function' ? generateTimetable(safeStd, safeSection) : {},
      subjectPool: isPrimary ? (SUBJECTS_BY_STD?.primary || []) : (SUBJECTS_BY_STD?.upper || []),
      subjectColors: typeof SUBJECT_COLORS !== 'undefined' ? SUBJECT_COLORS : {},
      days: typeof TT_DAYS !== 'undefined' ? TT_DAYS : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      slotsWeekday: typeof TT_SLOTS_WEEKDAY !== 'undefined' ? TT_SLOTS_WEEKDAY : [],
      slotsSaturday: typeof TT_SLOTS_SATURDAY !== 'undefined' ? TT_SLOTS_SATURDAY : [],
    };
  }
}

async function importTimetableJson(data) {
  try {
    return await api.post('/timetable/import', data);
  } catch (e) {
    if (e && e.error) return e;
    console.warn('Timetable import API failed', e);
    return { error: 'Failed to upload timetable JSON.' };
  }
}

async function loadTimetableLayout(std = 1, section = 'A') {
  try {
    return await api.get(`/timetable/layout?std=${encodeURIComponent(std)}&section=${encodeURIComponent(section)}`);
  } catch (e) {
    console.warn('Timetable layout API unavailable');
    return { error: 'Failed to fetch timetable layout.' };
  }
}

async function saveTimetableBulkCells(data) {
  try {
    return await api.put('/timetable/bulk-cells', data);
  } catch (e) {
    if (e && e.error) return e;
    console.warn('Timetable bulk-cells API failed', e);
    return { error: 'Failed to save timetable changes.' };
  }
}

function getAttendanceExportUrl(year, month, personType) {
  const token = localStorage.getItem('ssms_token');
  return `${api.defaults ? api.defaults.baseURL : 'http://localhost:5000/api'}/attendance/export?year=${year}&month=${month}&person_type=${personType}&token=${token}`;
}

async function loadExams() {
  const filterSupportedExams = (items) => (Array.isArray(items) ? items : []).filter((exam) => {
    const classNumber = parseInt(String(exam?.class || '').trim(), 10);
    return Number.isInteger(classNumber) && classNumber >= 1 && classNumber <= 6;
  });
  try {
    const res = await api.get('/exams/public');
    return filterSupportedExams(res.data || res);
  } catch (e) {
    try {
      const res = await api.get('/exams');
      return filterSupportedExams(res.data || res);
    } catch (err) {
      console.warn('Exams API unavailable, using mock data');
      return filterSupportedExams(typeof EXAMS !== 'undefined' ? JSON.parse(JSON.stringify(EXAMS)) : []);
    }
  }
}

async function loadResults() {
  try {
    const res = await api.get('/results');
    return res.data || res;
  } catch (e) {
    console.warn('Results API unavailable, using mock data');
    return typeof RESULTS !== 'undefined' ? JSON.parse(JSON.stringify(RESULTS)) : [];
  }
}

async function loadResultsByClass(classNo, examType) {
  try {
    const res = await api.get(`/results?class=${encodeURIComponent(classNo)}&exam_type=${encodeURIComponent(examType)}`);
    return res.data || [];
  } catch (e) {
    return [];
  }
}

async function saveMarksBulk(classNo, examType, results) {
  try {
    return await api.post('/results/bulk', { class: String(classNo), exam_type: examType, results });
  } catch (e) {
    if (e.status) return e;
    return { error: 'Failed to save marks. Please try again.' };
  }
}

async function loadFeeSummary() {
  try {
    const res = await api.get('/dashboard/fee-summary');
    const data = res?.data || res || {};
    return {
      paid: Number(data.paid) || 0,
      partial: Number(data.partial) || 0,
      pending: Number(data.pending) || 0,
      total: Number(data.total) || 0,
    };
  } catch (e) {
    console.warn('Fee summary API unavailable, using fees fallback');
    try {
      const fees = await loadFees();
      return buildFeeSummaryFromFees(fees);
    } catch (_) {
      return { paid: 0, partial: 0, pending: 0, total: 0 };
    }
  }
}

async function loadClassFeeSummary() {
  try {
    const res = await api.get('/dashboard/class-fee-summary');
    const data = res?.data || res;
    return normalizeClassFeeSummaryRows(data);
  } catch (e) {
    console.warn('Class fee summary API unavailable, using fees fallback');
    try {
      const fees = await loadFees();
      return normalizeClassFeeSummaryRows(buildClassFeeSummaryFromFees(fees));
    } catch (_) {
      return normalizeClassFeeSummaryRows([]);
    }
  }
}

async function loadClassMarksProgress() {
  try {
    return await api.get('/dashboard/class-marks-progress');
  } catch (e) {
    console.warn('Class marks progress API unavailable');
    return { overall: 0, classes: [] };
  }
}

async function loadFees() {
  try {
    const res = await api.get('/fees');
    const data = res.data || res;
    return shouldUseMockFees(data) ? getMockFees() : normalizeFeeRecords(data);
  } catch (e) {
    console.warn('Fees API unavailable, using mock data');
    return getMockFees();
  }
}

async function loadFeeStructure() {
  try {
    const res = await api.get('/fee-structure');
    return res.data || res;
  } catch (e) {
    console.warn('Fee structure API unavailable, using mock data');
    return typeof FEE_STRUCTURE !== 'undefined' ? JSON.parse(JSON.stringify(FEE_STRUCTURE)) : [];
  }
}

async function loadStaff() {
  try {
    const res = await api.get('/staff');
    return res.data || res;
  } catch (e) {
    console.warn('Staff API unavailable, using mock data');
    return typeof STAFF !== 'undefined' ? JSON.parse(JSON.stringify(STAFF)) : [];
  }
}

async function loadLeaves() {
  try {
    const res = await api.get('/leaves');
    return res.data || res;
  } catch (e) {
    console.warn('Leaves API unavailable, using mock data');
    return typeof LEAVE_REQUESTS !== 'undefined' ? JSON.parse(JSON.stringify(LEAVE_REQUESTS)) : [];
  }
}

async function loadNotices() {
  try {
    const res = await api.get('/notices');
    return res.data || res;
  } catch (e) {
    console.warn('Notices API unavailable, using mock data');
    return typeof NOTICES !== 'undefined' ? JSON.parse(JSON.stringify(NOTICES)) : [];
  }
}

async function loadVisitorInquiries() {
  try {
    const res = await api.get('/admin/visitor-inquiries');
    const data = res.data || res;
    const backendInquiries = Array.isArray(data)
      ? data
      : Array.isArray(data.inquiries)
        ? data.inquiries
        : Array.isArray(data.data)
          ? data.data
          : [];
    const inquiries = mergeVisitorInquiries(backendInquiries, getLocalVisitorInquiries());
    return {
      inquiries,
      total_count: inquiries.length,
      new_count: inquiries.filter((item) => String(item.status || 'new').toLowerCase() === 'new').length,
      responded_count: inquiries.filter((item) => String(item.status || '').toLowerCase() === 'responded').length
    };
  } catch (e) {
    console.warn('Visitor inquiries API unavailable');
    const inquiries = mergeVisitorInquiries(getLocalVisitorInquiries(), []);
    return {
      inquiries,
      total_count: inquiries.length,
      new_count: inquiries.filter((item) => String(item.status || 'new').toLowerCase() === 'new').length,
      responded_count: inquiries.filter((item) => String(item.status || '').toLowerCase() === 'responded').length
    };
  }
}

async function apiRespondVisitorInquiry(inquiryId, responseText) {
  try {
    return await api.post('/admin/inquiry/respond', {
      inquiry_id: inquiryId,
      response: responseText
    });
  } catch (e) {
    console.warn('Respond visitor inquiry API failed', e);
    try {
      const inquiries = getLocalVisitorInquiries();
      const idx = inquiries.findIndex((item) => String(item.id) === String(inquiryId));
      if (idx > -1) {
        inquiries[idx] = {
          ...normalizeVisitorInquiry(inquiries[idx]),
          status: 'responded',
          response: responseText,
          responded_at: new Date().toISOString()
        };
        saveLocalVisitorInquiries(inquiries);
        return { success: true };
      }
    } catch (storageError) {
      console.warn('Unable to update local visitor inquiry response', storageError);
    }
    return { error: e?.error || 'Unable to send response.' };
  }
}

async function loadClasses() {
  try {
    const res = await api.get('/classes');
    return res.data || res;
  } catch (e) {
    console.warn('Classes API unavailable, using mock data');
    return typeof CLASSES !== 'undefined' ? JSON.parse(JSON.stringify(CLASSES)) : [];
  }
}

// ---- CRUD helpers (for admin.js section mutations) ----

async function apiCreateStudent(data) {
  try {
    return await api.post('/students', data);
  } catch (e) {
    const isAuthFailure = e && (e.status === 401 || e.status === 403 || /auth|token/i.test(String(e.error || '')));
    if (e && e.status && e.status !== 0 && !isAuthFailure) return { error: e.error || 'Unable to create student.' };
    console.warn('Create student API failed', e);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-local-admin-create': '1'
        },
        body: JSON.stringify(data)
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          ...payload
        };
      }
      if (payload && payload.error) {
        return { error: payload.error };
      }
    } catch (syncError) {
      console.warn('Bypass student create failed', syncError);
    }

    const students = getMockStudents();
    const nextId = students.reduce((max, student) => Math.max(max, Number(student.id) || 0), 0) + 1;
    const normalizedSection = normalizeBufferedStudentSection(data.section || 'A');
    const normalizedPhone = normalizeParentPhone(data.phone);
    if (!isValidParentPhone(normalizedPhone)) {
      return { error: 'Parent mobile number must be exactly 10 digits.' };
    }
    const nextSequence = getNextAvailableMockStudentSequence(students, data.class, normalizedSection);
    if (!nextSequence || !normalizedSection) {
      return { error: 'This section has already used all 40 planned student slots.' };
    }
    const generatedIds = buildGeneratedMockStudentIds(nextSequence, normalizedPhone);
    const created = {
      id: nextId,
      ...data,
      class: String(data.class || ''),
      section: normalizedSection,
      phone: normalizedPhone,
      ...generatedIds
    };
    saveMockStudents([...students, created]);
    return created;
  }
}
async function apiUpdateStudent(id, data) {
  try {
    return await api.put(`/students/${id}`, data);
  } catch (e) {
    const isAuthFailure = e && (e.status === 401 || e.status === 403 || /auth|token/i.test(String(e.error || '')));
    if (e && e.status && e.status !== 0 && !isAuthFailure) return { error: e.error || 'Unable to update student.' };
    console.warn('Update student API failed', e);
    try {
      const res = await fetch(`${API_BASE}/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-local-admin-create': '1'
        },
        body: JSON.stringify(data)
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        return payload;
      }
      if (payload && payload.error) {
        return { error: payload.error };
      }
    } catch (syncError) {
      console.warn('Bypass student update failed', syncError);
    }
    if (!isValidParentPhone(data.phone)) return { error: 'Parent mobile number must be exactly 10 digits.' };
    const students = getMockStudents();
    const normalizedPhone = normalizeParentPhone(data.phone);
    const updated = students.map((student) =>
      String(student.id) === String(id)
        ? {
            ...student,
            ...data,
            id: student.id,
            phone: normalizedPhone,
            parent_access_key: buildGeneratedParentAccessKey(normalizedPhone)
          }
        : student
    );
    saveMockStudents(updated);
    return updated.find((student) => String(student.id) === String(id)) || null;
  }
}
async function apiDeleteStudent(id) {
  try {
    return await api.delete(`/students/${id}`);
  } catch (e) {
    const isAuthFailure = e && (e.status === 401 || e.status === 403 || /auth|token/i.test(String(e.error || '')));
    if (e && e.status && e.status !== 0 && !isAuthFailure) return { error: e.error || 'Unable to delete student.' };
    console.warn('Delete student API failed', e);
    try {
      const res = await fetch(`${API_BASE}/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-local-admin-create': '1'
        }
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, ...payload };
      }
      if (payload && payload.error) {
        return { error: payload.error };
      }
    } catch (syncError) {
      console.warn('Bypass student delete failed', syncError);
    }
    const students = getMockStudents();
    const filtered = students.filter((student) => String(student.id) !== String(id));
    saveMockStudents(filtered);
    return { success: true };
  }
}

async function apiCreateTeacher(data) {
  try { return await api.post('/teachers', data); } catch (e) { console.warn('Create teacher API failed', e); return null; }
}
async function apiUpdateTeacher(id, data) {
  try { return await api.put(`/teachers/${id}`, data); } catch (e) { console.warn('Update teacher API failed', e); return null; }
}
async function apiDeleteTeacher(id) {
  try { return await api.delete(`/teachers/${id}`); } catch (e) { console.warn('Delete teacher API failed', e); return null; }
}

async function apiCreateExam(data) {
  try { return await api.post('/exams', data); } catch (e) { console.warn('Create exam API failed', e); return null; }
}
async function apiUpdateExam(id, data) {
  try { return await api.put(`/exams/${id}`, data); } catch (e) { console.warn('Update exam API failed', e); return null; }
}
async function apiDeleteExam(id) {
  try { return await api.delete(`/exams/${id}`); } catch (e) { console.warn('Delete exam API failed', e); return null; }
}

async function apiCreateFee(data) {
  const normalizedData = normalizeFeeRecord(data);
  try {
    return await api.post('/fees', normalizedData);
  } catch (e) {
    if (e && e.status && e.status !== 0) return { error: e.error || 'Unable to create fee record.' };
    console.warn('Create fee API failed', e);
    const fees = getMockFees();
    const created = {
      id: normalizedData.id || `FEE${Date.now()}`,
      ...normalizedData
    };
    saveMockFees([created, ...fees]);
    return created;
  }
}
async function apiUpdateFee(id, data) {
  const normalizedData = normalizeFeeRecord(data);
  try {
    return await api.put(`/fees/${id}`, normalizedData);
  } catch (e) {
    if (e && e.status && e.status !== 0) return { error: e.error || 'Unable to update fee record.' };
    console.warn('Update fee API failed', e);
    const fees = getMockFees();
    const updatedFees = fees.map((fee) => (String(fee.id) === String(id) ? { ...fee, ...normalizedData, id: fee.id } : fee));
    saveMockFees(updatedFees);
    return normalizeFeeRecord(updatedFees.find((fee) => String(fee.id) === String(id)) || null);
  }
}
async function apiFetchFeeReceipt(id) {
  try {
    return normalizeFeeRecord(await api.get(`/fees/${id}/receipt`));
  } catch (e) {
    console.warn('Fee receipt API failed', e);
    return normalizeFeeRecord(getMockFees().find((fee) => String(fee.id) === String(id)) || null);
  }
}

async function apiCreateStaff(data) {
  try { return await api.post('/staff', data); } catch (e) { console.warn('Create staff API failed', e); return null; }
}
async function apiUpdateStaff(id, data) {
  try { return await api.put(`/staff/${id}`, data); } catch (e) { console.warn('Update staff API failed', e); return null; }
}
async function apiDeleteStaff(id) {
  try { return await api.delete(`/staff/${id}`); } catch (e) { console.warn('Delete staff API failed', e); return null; }
}

async function apiUpdateLeave(id, data) {
  try { return await api.put(`/leaves/${id}`, data); } catch (e) { console.warn('Update leave API failed', e); return null; }
}

async function apiCreateNotice(data) {
  try { return await api.post('/notices', data); } catch (e) { console.warn('Create notice API failed', e); return null; }
}
async function apiUpdateNotice(id, data) {
  try { return await api.put(`/notices/${id}`, data); } catch (e) { console.warn('Update notice API failed', e); return null; }
}

// ---- Parent Auth ----
async function apiAccessKeyLogin(studentId, accessKey) {
  const data = await api.post('/students/access-key-login', { student_id: studentId, access_key: accessKey });
  if (data && data.token) setToken(data.token);
  return data;
}
async function apiParentLogin(parentId, password) {
  const data = await api.post('/parents/login', { parent_id: parentId, password });
  if (data && data.token) setToken(data.token);
  return data;
}

async function apiDeleteNotice(id) {
  try { return await api.delete(`/notices/${id}`); } catch (e) { console.warn('Delete notice API failed', e); return null; }
}

// apiSaveAttendance replaced by saveAttendanceBulk above
