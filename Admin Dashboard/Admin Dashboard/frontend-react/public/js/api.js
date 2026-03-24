// =============================================
//  API.JS â€” Frontend API Service Layer
//  Connects frontend to Express backend
// =============================================

const API_BASE = '/api';
const TOKEN_KEY = 'ssms_token';
const MOCK_STUDENTS_KEY = 'ssms_mock_students';
const MOCK_STUDENTS_VERSION_KEY = 'ssms_mock_students_version';
const MOCK_STUDENTS_VERSION = '2026-03-24-v3';
const MOCK_FEES_KEY = 'ssms_mock_fees';
const MOCK_FEES_VERSION_KEY = 'ssms_mock_fees_version';
const MOCK_FEES_VERSION = '2026-03-24-v4';
const MOCK_ATTENDANCE_OVERRIDES_KEY = 'ssms_mock_attendance_overrides';
const MOCK_ATTENDANCE_VERSION_KEY = 'ssms_mock_attendance_version';
const MOCK_ATTENDANCE_VERSION = '2026-03-24-v1';

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

function getMockAttendancePeopleList(personType = 'student', cls = '') {
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

function buildMockAttendanceDayDetail(dateStr, personType = 'student', cls = '') {
  const people = getMockAttendancePeopleList(personType, cls);
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
    return classNo !== null && classNo >= 1 && classNo <= 8;
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
    const query = qs.toString();
    const res = await api.get('/teachers' + (query ? '?' + query : ''));
    return res;
  } catch (e) {
    console.warn('Teachers API unavailable, using mock data');
    const arr = typeof TEACHERS !== 'undefined' ? JSON.parse(JSON.stringify(TEACHERS)) : [];
    return { totalRecords: arr.length, totalPages: 1, currentPage: 1, data: arr };
  }
}

async function loadTeacherCounts() {
  try {
    return await api.get('/teachers/counts');
  } catch (e) {
    console.warn('Teacher counts API unavailable');
    const teachers = typeof TEACHERS !== 'undefined' ? JSON.parse(JSON.stringify(TEACHERS)) : [];
    const activeTeachers = teachers.filter((teacher) => String(teacher.status || '').toLowerCase() === 'active');
    const subjectCount = new Set(teachers.map((teacher) => String(teacher.subject || '').trim()).filter(Boolean)).size;
    const avgSalary = teachers.length
      ? Math.round(teachers.reduce((sum, teacher) => sum + (parseInt(teacher.salary, 10) || 0), 0) / teachers.length)
      : 0;
    return {
      total: teachers.length,
      active: activeTeachers.length,
      inactive: teachers.length - activeTeachers.length,
      subjects: subjectCount,
      avgSalary
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
    const date = params.date || new Date().toISOString().slice(0, 10);
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

async function loadAttendancePeople(personType = 'student', cls = '') {
  try {
    const qs = new URLSearchParams({ person_type: personType });
    if (cls) qs.set('class', cls);
    const res = await api.get('/attendance/people?' + qs.toString());
    const rows = res.data || [];
    return rows.length ? rows : getMockAttendancePeopleList(personType, cls);
  } catch (e) {
    console.warn('Attendance people API unavailable, using mock data');
    return getMockAttendancePeopleList(personType, cls);
  }
}

async function loadAttendanceSummary(personType, date) {
  try {
    const qs = new URLSearchParams();
    if (personType) qs.set('person_type', personType);
    if (date) qs.set('date', date);
    const summary = await api.get('/attendance/summary?' + qs.toString());
    if (summary && Number(summary.total || 0) > 0) return summary;
    const mock = buildMockAttendanceDayDetail(date || new Date().toISOString().slice(0, 10), personType || 'student');
    return { total: mock.total, present: mock.present, absent: mock.absent, leave: mock.leave, rate: mock.percent };
  } catch (e) {
    console.warn('Attendance summary API unavailable, using mock data');
    const mock = buildMockAttendanceDayDetail(date || new Date().toISOString().slice(0, 10), personType || 'student');
    return { total: mock.total, present: mock.present, absent: mock.absent, leave: mock.leave, rate: mock.percent };
  }
}

async function checkAttendanceDate(date) {
  try {
    return await api.get('/attendance/check-date?date=' + date);
  } catch (e) {
    const errors = [];
    const today = new Date().toISOString().slice(0, 10);
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

async function loadAttendanceDayDetail(date, personType = 'student', cls = '') {
  try {
    const qs = new URLSearchParams({ date, person_type: personType });
    const detail = await api.get('/attendance/day?' + qs.toString());
    const shouldUseMock = !detail || !Array.isArray(detail.records) || !detail.records.length;
    return shouldUseMock ? buildMockAttendanceDayDetail(date, personType, cls) : detail;
  } catch (e) {
    console.warn('Attendance day detail API unavailable, using mock data');
    return buildMockAttendanceDayDetail(date, personType, cls);
  }
}

async function loadTimetable(std = 10, section = 'A') {
  try {
    return await api.get(`/timetable?std=${encodeURIComponent(std)}&section=${encodeURIComponent(section)}`);
  } catch (e) {
    console.warn('Timetable API unavailable, using generated fallback');
    const safeStd = parseInt(std, 10) || 10;
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

async function loadTimetableLayout(std = 10, section = 'A') {
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
    return Number.isInteger(classNumber) && classNumber >= 1 && classNumber <= 8;
  });
  try {
    const res = await api.get('/exams');
    return filterSupportedExams(res.data || res);
  } catch (e) {
    console.warn('Exams API unavailable, using mock data');
    return filterSupportedExams(typeof EXAMS !== 'undefined' ? JSON.parse(JSON.stringify(EXAMS)) : []);
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
    return await api.get('/dashboard/fee-summary');
  } catch (e) {
    console.warn('Fee summary API unavailable');
    return { paid: 0, partial: 0, pending: 0, total: 0 };
  }
}

async function loadClassFeeSummary() {
  try {
    return await api.get('/dashboard/class-fee-summary');
  } catch (e) {
    console.warn('Class fee summary API unavailable');
    return [];
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
    console.warn('Create student API failed', e);
    const students = getMockStudents();
    const nextId = students.reduce((max, student) => Math.max(max, Number(student.id) || 0), 0) + 1;
    const created = { id: nextId, ...data };
    saveMockStudents([...students, created]);
    return created;
  }
}
async function apiUpdateStudent(id, data) {
  try {
    return await api.put(`/students/${id}`, data);
  } catch (e) {
    console.warn('Update student API failed', e);
    const students = getMockStudents();
    const updated = students.map((student) =>
      String(student.id) === String(id) ? { ...student, ...data, id: student.id } : student
    );
    saveMockStudents(updated);
    return updated.find((student) => String(student.id) === String(id)) || null;
  }
}
async function apiDeleteStudent(id) {
  try {
    return await api.delete(`/students/${id}`);
  } catch (e) {
    console.warn('Delete student API failed', e);
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

// ---- Parents API ----
async function loadParents() {
  try { return await api.get('/parents'); } catch (e) { console.warn('Parents API unavailable', e); return []; }
}
async function loadParentCounts() {
  try { return await api.get('/parents/counts'); } catch (e) { return { active: 0, inactive: 0, total: 0 }; }
}
async function apiCreateParent(data) {
  try { return await api.post('/parents', data); } catch (e) { console.warn('Create parent API failed', e); return null; }
}
async function apiUpdateParent(id, data) {
  try { return await api.put(`/parents/${id}`, data); } catch (e) { console.warn('Update parent API failed', e); return null; }
}
async function apiDeleteParent(id) {
  try { return await api.delete(`/parents/${id}`); } catch (e) { console.warn('Delete parent API failed', e); return null; }
}
async function apiUpdateParentPassword(id, password) {
  try { return await api.put(`/parents/${id}/password`, { password }); } catch (e) { console.warn('Update parent password failed', e); return null; }
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

