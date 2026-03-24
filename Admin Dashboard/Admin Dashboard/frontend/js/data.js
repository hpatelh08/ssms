// =============================================
//  DATA.JS — Mock Data for Smart School System
// =============================================

// --- STUDENTS ---
const STUDENTS = [
  { id:1, gr_number:'GR-005', student_id:'STU2024005', student_password:'Stu@005', name:'Karan Mehta',   admission:'ADM-2024-005', class:'8', section:'A', parent:'Deepak Mehta', phone:'9876543214', status:'Inactive', fees:'Pending', dob:'2011-09-30', gender:'Male',   address:'90 Blue Ave, Gurgaon' },
  { id:2, gr_number:'GR-006', student_id:'STU2024006', student_password:'Stu@006', name:'Ananya Verma',  admission:'ADM-2024-006', class:'8', section:'B', parent:'Sanjay Verma', phone:'9876543215', status:'Active',   fees:'Pending', dob:'2011-12-15', gender:'Female', address:'11 Rose St, Delhi' },
  { id:3, gr_number:'GR-007', student_id:'STU2024007', student_password:'Stu@007', name:'Dev Kumar',     admission:'ADM-2024-007', class:'7', section:'A', parent:'Vijay Kumar',  phone:'9876543216', status:'Active',   fees:'Pending', dob:'2012-06-08', gender:'Male',   address:'23 Oak Lane, Delhi' },
  { id:4, gr_number:'GR-008', student_id:'STU2024008', student_password:'Stu@008', name:'Ritika Joshi',  admission:'ADM-2024-008', class:'7', section:'B', parent:'Sunil Joshi',  phone:'9876543217', status:'Active',   fees:'Pending', dob:'2012-08-21', gender:'Female', address:'45 River Rd, Faridabad' },
  { id:5, gr_number:'GR-009', student_id:'STU2024009', student_password:'Stu@009', name:'Aakash Tiwari', admission:'ADM-2024-009', class:'6', section:'A', parent:'Ram Tiwari',   phone:'9876543218', status:'Active',   fees:'Pending', dob:'2013-02-14', gender:'Male',   address:'67 Hill St, Delhi' },
  { id:6, gr_number:'GR-010', student_id:'STU2024010', student_password:'Stu@010', name:'Meera Kapoor',  admission:'ADM-2024-010', class:'6', section:'C', parent:'Ajay Kapoor',  phone:'9876543219', status:'Active',   fees:'Pending', dob:'2013-11-03', gender:'Female', address:'89 Maple Ave, Noida' },
];

// --- TEACHERS ---
const TEACHER_SECTIONS = ['A', 'B', 'C'];
const TEACHER_FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Krish', 'Ishaan', 'Rohan', 'Dev', 'Ananya', 'Diya', 'Myra', 'Aisha', 'Siya', 'Meera', 'Ritika', 'Kavya', 'Priyansh', 'Yash', 'Dhruv', 'Tanvi', 'Kiara'];
const TEACHER_LAST_NAMES = ['Sharma', 'Patel', 'Verma', 'Gupta', 'Joshi', 'Mehta', 'Kapoor', 'Singh', 'Desai', 'Nair', 'Yadav', 'Iyer', 'Kulkarni', 'Tiwari', 'Chauhan', 'Rao'];
const TEACHER_SUBJECTS = [
  'Gujarati',
  'English',
  'Hindi',
  'Sanskrit',
  'Mathematics',
  'Environmental Studies (EVS)',
  'Science',
  'Social Science',
  'Computer / IT',
  'General Knowledge (GK)',
  'Drawing / Art',
  'Physical Education (PT)'
];
const TEACHER_QUALIFICATIONS = ['B.Ed', 'M.Ed', 'M.Sc', 'M.A', 'B.Tech', 'M.Com'];

function padTeacher(num, size = 3) {
  return String(num).padStart(size, '0');
}

function generateTeachers() {
  const teachers = [];
  for (let id = 1; id <= 35; id += 1) {
    const first = TEACHER_FIRST_NAMES[(id + 2) % TEACHER_FIRST_NAMES.length];
    const last = TEACHER_LAST_NAMES[(id + 4) % TEACHER_LAST_NAMES.length];
    const std = ((id - 1) % 8) + 1;
    const section = TEACHER_SECTIONS[(id - 1) % TEACHER_SECTIONS.length];
    teachers.push({
      id,
      name: `${first} ${last}`,
      emp: `EMP-${100 + id}`,
      subject: TEACHER_SUBJECTS[(id - 1) % TEACHER_SUBJECTS.length],
      class: id <= 24 ? `${std}${section}` : `Class ${std}`,
      salary: 32000 + (id % 10) * 2500,
      phone: `98${String(11001000 + id).slice(-8)}`,
      email: `teacher${100 + id}@teacher.com`,
      status: 'Active',
      qualification: TEACHER_QUALIFICATIONS[(id - 1) % TEACHER_QUALIFICATIONS.length],
      join: `${2015 + (id % 9)}-${padTeacher(((id + 1) % 12) + 1, 2)}-15`,
      teacher_id: `TCH2024${padTeacher(id, 3)}`,
      teacher_password: `Tch@${padTeacher(id)}`
    });
  }
  return teachers;
}

const TEACHERS = generateTeachers();

// --- CLASSES ---
const CLASSES = [
  { id:'CLS001', name:'Class 10-A', teacher:'Priya Verma',   students:38, room:'101' },
  { id:'CLS002', name:'Class 10-B', teacher:'Amit Gupta',    students:35, room:'102' },
  { id:'CLS003', name:'Class 9-A',  teacher:'Sunita Singh',  students:40, room:'201' },
  { id:'CLS004', name:'Class 9-B',  teacher:'Manoj Trivedi', students:37, room:'202' },
  { id:'CLS005', name:'Class 9-C',  teacher:'Kavita Rao',    students:36, room:'203' },
  { id:'CLS006', name:'Class 8-A',  teacher:'Rahul Desai',   students:42, room:'301' },
  { id:'CLS007', name:'Class 8-B',  teacher:'Pooja Iyer',    students:39, room:'302' },
  { id:'CLS008', name:'Class 7-A',  teacher:'Priya Verma',   students:36, room:'401' },
  { id:'CLS009', name:'Class 7-B',  teacher:'Amit Gupta',    students:34, room:'402' },
  { id:'CLS010', name:'Class 6-A',  teacher:'Kavita Rao',    students:40, room:'501' },
];

// --- FEE RECORDS ---
const FEES = [
  { id:'FEE001', student:'Aryan Singh',   cls:'10-A', amount:800, paid:0, due:800, month:'Jan 2025', status:'Pending', date:'-' },
  { id:'FEE002', student:'Priya Sharma',  cls:'10-B', amount:800, paid:0, due:800, month:'Jan 2025', status:'Pending', date:'-' },
  { id:'FEE003', student:'Rohan Gupta',   cls:'9-A',  amount:800, paid:0, due:800, month:'Jan 2025', status:'Pending', date:'-' },
  { id:'FEE004', student:'Sneha Patel',   cls:'9-C',  amount:800, paid:0, due:800, month:'Jan 2025', status:'Pending', date:'-' },
];
const DASH_FEE_TOTALS = FEES.reduce((totals, fee) => {
  totals.pendingFees += Math.max(Number(fee.due) || 0, 0);
  totals.totalRevenue += Math.max(Number(fee.paid) || 0, 0);
  return totals;
}, { pendingFees: 0, totalRevenue: 0 });

// --- EXAMS ---
const EXAMS = [
  { id:'EXM001', name:'Mid-Term Exam',   class:'1', subject:'English',                    date:'2025-02-06', duration:'2 hrs', maxMarks:50,  status:'Completed' },
  { id:'EXM002', name:'Mid-Term Exam',   class:'2', subject:'Mathematics',                date:'2025-02-08', duration:'2 hrs', maxMarks:50,  status:'Completed' },
  { id:'EXM003', name:'Unit Test 1',     class:'3', subject:'Environmental Studies (EVS)',date:'2025-02-10', duration:'1 hr',  maxMarks:30,  status:'Completed' },
  { id:'EXM004', name:'Unit Test 1',     class:'4', subject:'Hindi',                      date:'2025-02-12', duration:'1 hr',  maxMarks:40,  status:'Completed' },
  { id:'EXM005', name:'Class Test',      class:'5', subject:'Gujarati',                   date:'2025-02-18', duration:'1 hr',  maxMarks:30,  status:'Scheduled' },
  { id:'EXM006', name:'Mid-Term Exam',   class:'6', subject:'Science',                    date:'2025-02-20', duration:'3 hrs', maxMarks:100, status:'Scheduled' },
  { id:'EXM007', name:'Mid-Term Exam',   class:'7', subject:'Social Science',             date:'2025-02-24', duration:'3 hrs', maxMarks:100, status:'Scheduled' },
  { id:'EXM008', name:'Annual Exam',     class:'8', subject:'All Subjects',               date:'2025-03-10', duration:'3 hrs', maxMarks:100, status:'Upcoming' },
];

// --- RESULTS (marks entry) ---
const RESULTS = [
  { student:'Aryan Singh',  roll:'01', math:85, sci:78, eng:88, hin:72, ss:80, total:403, grade:'A+', percent:'80.6' },
  { student:'Priya Sharma', roll:'02', math:92, sci:88, eng:95, hin:85, ss:90, total:450, grade:'A+', percent:'90.0' },
  { student:'Shivam Yadav', roll:'03', math:65, sci:70, eng:72, hin:68, ss:75, total:350, grade:'B',  percent:'70.0' },
  { student:'Divya Mishra', roll:'04', math:55, sci:60, eng:68, hin:72, ss:62, total:317, grade:'C',  percent:'63.4' },
  { student:'Rohan Gupta',  roll:'05', math:78, sci:74, eng:80, hin:70, ss:76, total:378, grade:'A',  percent:'75.6' },
];

// --- ATTENDANCE ---
const ATTENDANCE_DATA = [
  { id:'STU001', name:'Aryan Singh',  roll:'01', status:'P', percent:92 },
  { id:'STU002', name:'Priya Sharma', roll:'02', status:'P', percent:88 },
  { id:'STU003', name:'Rohan Gupta',  roll:'03', status:'A', percent:75 },
  { id:'STU004', name:'Sneha Patel',  roll:'04', status:'P', percent:95 },
  { id:'STU005', name:'Karan Mehta',  roll:'05', status:'L', percent:68 },
  { id:'STU006', name:'Ananya Verma', roll:'06', status:'P', percent:90 },
  { id:'STU007', name:'Dev Kumar',    roll:'07', status:'P', percent:85 },
  { id:'STU008', name:'Ritika Joshi', roll:'08', status:'A', percent:72 },
];

// --- NOTICES ---
const NOTICES = [
  { id:'NOT001', title:'Annual Day Celebration', body:'Annual Day will be celebrated on 15th March 2025. All students and parents are required to attend.', target:'All',      date:'2025-01-20', urgent:false, author:'Admin' },
  { id:'NOT002', title:'Exam Schedule — Mid Term', body:'Mid-Term exams for Classes 9 and 10 will begin from 10th February 2025. Detailed timetable attached.', target:'Student', date:'2025-01-18', urgent:true,  author:'Admin' },
  { id:'NOT003', title:'Fee Reminder — January',  body:'Parents are reminded to clear pending fees for January before 31st January 2025 to avoid late fees.', target:'Parent',  date:'2025-01-15', urgent:true,  author:'Accountant' },
  { id:'NOT004', title:'Staff Meeting',           body:'All teaching and non-teaching staff are requested to attend the monthly staff meeting on 22nd January at 3PM.', target:'Teacher', date:'2025-01-14', urgent:false, author:'Principal' },
  { id:'NOT005', title:'Republic Day Holiday',   body:'School will remain closed on 26th January 2025 on account of Republic Day.', target:'All', date:'2025-01-12', urgent:false, author:'Admin' },
  { id:'NOT006', title:'Winter Uniform Dates',   body:'Students are advised to wear winter uniform from 1st December 2024 to 28th February 2025.', target:'Student', date:'2024-11-28', urgent:false, author:'Admin' },
];

// --- HR / STAFF ---
const STAFF = [
  { id:'HR001', name:'Rahul Sharma',     dept:'Administration', role:'Principal',      salary:80000, status:'Active',   leave:2,  join:'2010-06-01' },
  { id:'HR002', name:'Neha Joshi',       dept:'Accounts',       role:'Accountant',     salary:40000, status:'Active',   leave:1,  join:'2018-03-15' },
  { id:'HR003', name:'Priya Verma',      dept:'Teaching',       role:'Senior Teacher', salary:45000, status:'Active',   leave:0,  join:'2019-06-01' },
  { id:'HR004', name:'Amit Gupta',       dept:'Teaching',       role:'Teacher',        salary:42000, status:'Active',   leave:3,  join:'2020-07-15' },
  { id:'HR005', name:'Sunita Singh',     dept:'Teaching',       role:'Teacher',        salary:38000, status:'Active',   leave:1,  join:'2018-04-20' },
  { id:'HR006', name:'Manoj Trivedi',    dept:'Teaching',       role:'Teacher',        salary:36000, status:'Active',   leave:0,  join:'2021-01-10' },
  { id:'HR007', name:'Raj Kumar',        dept:'Support',        role:'Lab Assistant',  salary:22000, status:'Active',   leave:2,  join:'2015-09-01' },
  { id:'HR008', name:'Meena Devi',       dept:'Support',        role:'Office Staff',   salary:20000, status:'Active',   leave:4,  join:'2014-01-05' },
  { id:'HR009', name:'Suresh Singh',     dept:'Support',        role:'Security',       salary:18000, status:'Active',   leave:1,  join:'2012-03-20' },
  { id:'HR010', name:'Rahul Desai',      dept:'Teaching',       role:'Teacher',        salary:48000, status:'Inactive', leave:0,  join:'2022-03-05' },
];

// --- LEAVE REQUESTS ---
const LEAVE_REQUESTS = [
  { id:'LV001', name:'Priya Verma',   role:'Teacher',    from:'2025-01-24', to:'2025-01-26', days:3, reason:'Family function',   status:'Approved' },
  { id:'LV002', name:'Amit Gupta',    role:'Teacher',    from:'2025-01-28', to:'2025-01-30', days:3, reason:'Medical leave',     status:'Pending'  },
  { id:'LV003', name:'Meena Devi',    role:'Support',    from:'2025-02-03', to:'2025-02-06', days:4, reason:'Personal work',     status:'Pending'  },
  { id:'LV004', name:'Suresh Singh',  role:'Security',   from:'2025-01-15', to:'2025-01-15', days:1, reason:'Emergency',        status:'Approved' },
  { id:'LV005', name:'Sunita Singh',  role:'Teacher',    from:'2025-02-10', to:'2025-02-11', days:2, reason:'Medical checkup',   status:'Rejected' },
];

// --- DASHBOARD STATS ---
const DASH_STATS = {
  totalStudents: 487,
  totalTeachers: 35,
  totalClasses: 24,
  attendancePercent: 87.4,
  pendingFees: DASH_FEE_TOTALS.pendingFees,
  upcomingExams: 6,
  totalRevenue: DASH_FEE_TOTALS.totalRevenue,
  newAdmissions: 24,
};

// --- Monthly attendance data for chart ---
const MONTHLY_ATTENDANCE = [
  { month:'Apr', percent:88 }, { month:'May', percent:82 },
  { month:'Jun', percent:79 }, { month:'Jul', percent:90 },
  { month:'Aug', percent:86 }, { month:'Sep', percent:91 },
  { month:'Oct', percent:93 }, { month:'Nov', percent:89 },
  { month:'Dec', percent:76 }, { month:'Jan', percent:87 },
];

// --- Fee collection for chart ---
const FEE_COLLECTION = [
  { month:'Sep', collected:280000 }, { month:'Oct', collected:320000 },
  { month:'Nov', collected:290000 }, { month:'Dec', collected:250000 },
  { month:'Jan', collected:310000 },
];

// --- FEE STRUCTURE (Individual per class) ---
const FEE_STRUCTURE = [
  { class: 1, total: 13000, tuition: 11000, lab: 500,  sports: 1000, misc: 500, accent: '#ff914d' },
  { class: 2, total: 14000, tuition: 12000, lab: 500,  sports: 1000, misc: 500, accent: '#ff6b6b' },
  { class: 3, total: 15000, tuition: 13000, lab: 500,  sports: 1000, misc: 500, accent: '#f7b731' },
  { class: 4, total: 16000, tuition: 14000, lab: 500,  sports: 1000, misc: 500, accent: '#fed330' },
  { class: 5, total: 17000, tuition: 15000, lab: 500,  sports: 1000, misc: 500, accent: '#26de81' },
  { class: 6, total: 18000, tuition: 15500, lab: 1000, sports: 1000, misc: 500, accent: '#20bf6b' },
  { class: 7, total: 19000, tuition: 16500, lab: 1000, sports: 1000, misc: 500, accent: '#45aaf2' },
  { class: 8, total: 20000, tuition: 17500, lab: 1000, sports: 1000, misc: 500, accent: '#2d98da' },
];

// ---- Utility helpers ----

// =============================================
//  TIMETABLE DATA — GSEB / NCERT Based
// =============================================

/* Subject → soft pastel color map */
const SUBJECT_COLORS = {
  'Mathematics':      { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Science':          { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  'English':          { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  'Social Science':   { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  'Hindi':            { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  'Gujarati':         { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  'Sanskrit':         { bg: '#fae8ff', text: '#86198f', border: '#e879f9' },
  'Computer / IT':    { bg: '#cffafe', text: '#155e75', border: '#67e8f9' },
  'Environmental Studies (EVS)': { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  'Drawing / Art':    { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'Physical Education (PT)': { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'Moral Science':    { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
  'General Knowledge (GK)': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
};

/* Subject lists by standard group */
const SUBJECTS_BY_STD = {
  primary: ['English', 'Mathematics', 'Environmental Studies (EVS)', 'Gujarati', 'Hindi', 'Drawing / Art', 'Physical Education (PT)', 'Moral Science', 'General Knowledge (GK)'],
  upper:   ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer / IT', 'Physical Education (PT)', 'Drawing / Art'],
};

/* Teacher pool for timetable assignment */
const TT_TEACHERS = {
  'Mathematics':    ['Priya Verma', 'Rajan Shah'],
  'Science':        ['Amit Gupta', 'Neelam Joshi'],
  'English':        ['Sunita Singh', 'Deepa Nair'],
  'Social Science': ['Kavita Rao', 'Manoj Trivedi'],
  'Hindi':          ['Manoj Trivedi', 'Seema Yadav'],
  'Gujarati':       ['Heena Desai', 'Bhavna Patel'],
  'Sanskrit':       ['Pankaj Sharma', 'Meera Iyer'],
  'Computer / IT':  ['Rahul Desai', 'Vikram Jain'],
  'Environmental Studies (EVS)': ['Amit Gupta', 'Pooja Iyer'],
  'Drawing / Art':  ['Anita Mehta'],
  'Physical Education (PT)': ['Sanjay Kulkarni'],
  'Moral Science':  ['Kavita Rao'],
  'General Knowledge (GK)': ['Sunita Singh'],
};

/* Lecture time slots */
const TT_SLOTS_WEEKDAY = [
  { num: 1, time: '07:00 – 07:40' },
  { num: 2, time: '07:40 – 08:20' },
  { num: 3, time: '08:20 – 09:00' },
  { num: 4, time: '09:00 – 09:40' },
  { num: 'B', time: '09:40 – 10:00', isBreak: true },
  { num: 5, time: '10:00 – 10:40' },
  { num: 6, time: '10:40 – 11:20' },
  { num: 7, time: '11:20 – 12:00' },
];

const TT_SLOTS_SATURDAY = [
  { num: 1, time: '07:00 – 07:40' },
  { num: 2, time: '07:40 – 08:20' },
  { num: 3, time: '08:20 – 09:00' },
  { num: 'B', time: '09:00 – 09:20', isBreak: true },
  { num: 4, time: '09:20 – 10:00' },
  { num: 5, time: '10:00 – 10:40' },
  {num: 6, time: '10:40 – 11:20' },
];

const TT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* Deterministic timetable generator — creates a full week for any std+section */
function generateTimetable(std, section) {
  const isPrimary = std <= 5;
  const subjectPool = isPrimary ? SUBJECTS_BY_STD.primary : SUBJECTS_BY_STD.upper;

  // Simple seeded pseudo-random for deterministic output per std+section
  let seed = std * 1000 + section.charCodeAt(0);
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

  function getTeacher(subject) {
    const pool = TT_TEACHERS[subject] || ['TBD'];
    // Use std+section to deterministically pick a teacher
    const idx = (std + section.charCodeAt(0)) % pool.length;
    return pool[idx];
  }

  const schedule = {};
  TT_DAYS.forEach(day => {
    const isSat = day === 'Saturday';
    const slots = isSat ? TT_SLOTS_SATURDAY : TT_SLOTS_WEEKDAY;
    const lectures = [];
    // Shuffle subjects for variety
    const shuffled = [...subjectPool].sort(() => rand() - 0.5);
    let si = 0;
    slots.forEach(slot => {
      if (slot.isBreak) {
        lectures.push({ ...slot, subject: null, teacher: null });
      } else {
        const subj = shuffled[si % shuffled.length];
        si++;
        lectures.push({ ...slot, subject: subj, teacher: getTeacher(subj) });
      }
    });
    schedule[day] = lectures;
  });
  return schedule;
}

function formatMoney(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function formatDate(d) {
  if (!d || d === '-') return '-';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function gradeColor(g) {
  if (['A+','A'].includes(g)) return 'badge-success';
  if (g === 'B') return 'badge-info';
  if (g === 'C') return 'badge-warning';
  return 'badge-danger';
}
function feeStatusBadge(s) {
  return {Paid:'badge-success', Pending:'badge-danger', Partial:'badge-warning'}[s] || 'badge-gray';
}
function statusBadge(s) {
  return {Active:'badge-success', Inactive:'badge-gray', Approved:'badge-success', Rejected:'badge-danger', Pending:'badge-warning', Scheduled:'badge-info', Completed:'badge-success', Upcoming:'badge-purple'}[s] || 'badge-gray';
}
function avatarColor(name) {
  const colors = ['#4f46e5','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
}
