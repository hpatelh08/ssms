// =============================================
//  REPORTS ROUTES — Download School Reports
//  Generates: HTML (print/PDF) + CSV exports
// =============================================
const { Router } = require('express');
const db          = require('../config/db');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);
router.use(authorize('super_admin', 'admin'));

// ─── helpers ────────────────────────────────

const now  = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
const date = () => new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric', timeZone:'Asia/Kolkata' });

function sendCSV(res, filename, headers, rows) {
  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8
}

function htmlPage(title, bodyHTML) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff;padding:20px 28px;}
  .rpt-header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #4f46e5;padding-bottom:12px;margin-bottom:18px;}
  .rpt-logo{font-size:22px;font-weight:800;color:#4f46e5;letter-spacing:-0.5px;}
  .rpt-logo span{color:#06b6d4;}
  .rpt-meta{text-align:right;font-size:11px;color:#64748b;}
  .rpt-title{font-size:16px;font-weight:700;color:#1e293b;margin-bottom:2px;}
  .rpt-subtitle{font-size:12px;color:#64748b;margin-bottom:16px;}
  .kpi-grid{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;}
  .kpi{flex:1;min-width:120px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;}
  .kpi-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;}
  .kpi-val{font-size:18px;font-weight:800;color:#4f46e5;margin-top:2px;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  th{background:#4f46e5;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:11.5px;}
  tr:nth-child(even) td{background:#f8fafc;}
  .sect-title{font-size:13px;font-weight:700;color:#4f46e5;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;}
  .badge-green{background:#dcfce7;color:#15803d;}
  .badge-red{background:#fee2e2;color:#b91c1c;}
  .badge-orange{background:#ffedd5;color:#c2410c;}
  .badge-blue{background:#dbeafe;color:#1d4ed8;}
  .rpt-footer{border-top:1px solid #e2e8f0;padding-top:10px;margin-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;}
  @media print{body{padding:0;} .no-print{display:none;}}
</style>
</head>
<body>
<div class="rpt-header">
  <div class="rpt-logo">Smart<span>School</span> ERP</div>
  <div class="rpt-meta">
    <div style="font-weight:700;font-size:12px;">${title}</div>
    <div>Generated: ${now()}</div>
  </div>
</div>
${bodyHTML}
<div class="rpt-footer">
  <span>SmartSchool ERP — Confidential</span>
  <span>Generated on ${date()} &nbsp;|&nbsp; Authorized by Admin</span>
</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`;
}

// ─── 1. School Summary ────────────────────
// GET /api/reports/school-summary
router.get('/school-summary', (req, res) => {
  const year = req.query.year || '';
  const yearLabel = year ? ` — ${year}` : '';
  const fileYear  = year ? `_${year}` : '';
  // KPIs
  const stu    = db.prepare("SELECT COUNT(*) c FROM students").get().c;
  const active = db.prepare("SELECT COUNT(*) c FROM students WHERE status='Active'").get().c;
  const tch    = db.prepare("SELECT COUNT(*) c FROM teachers").get().c;
  const cls    = db.prepare("SELECT COUNT(*) c FROM classes").get().c;
  const exams  = db.prepare("SELECT COUNT(*) c FROM exams WHERE status IN ('Scheduled','Upcoming')").get().c;
  const attRec = db.prepare("SELECT COUNT(*) c FROM attendance").get().c;
  const attP   = db.prepare("SELECT COUNT(*) c FROM attendance WHERE status='P'").get().c;
  const attPct = attRec > 0 ? (attP / attRec * 100).toFixed(1) : 0;
  const pendFees = db.prepare("SELECT COALESCE(SUM(due),0) val FROM fees WHERE status!='Paid'").get().val;

  // Top students by results
  const topStudents = db.prepare(
    "SELECT student, roll, percent, grade FROM results ORDER BY CAST(percent AS REAL) DESC LIMIT 10"
  ).all();

  // Recent notices
  const notices = db.prepare("SELECT title, date, urgent, target FROM notices ORDER BY date DESC LIMIT 5").all();

  // Class-wise student count
  const classWise = db.prepare(
    "SELECT class, COUNT(*) cnt FROM students GROUP BY class ORDER BY CAST(class AS INTEGER)"
  ).all();

  // Fee collection summary
  const feeSummary = db.prepare(`
    SELECT
      COUNT(CASE WHEN fees='Paid'    THEN 1 END) paid,
      COUNT(CASE WHEN fees='Partial' THEN 1 END) partial,
      COUNT(CASE WHEN fees='Pending' THEN 1 END) pending
    FROM students
  `).get();

  const body = `
  <div class="rpt-subtitle">School Overview Report${yearLabel} — ${date()}</div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Total Students</div><div class="kpi-val">${stu}</div></div>
    <div class="kpi"><div class="kpi-label">Active Students</div><div class="kpi-val">${active}</div></div>
    <div class="kpi"><div class="kpi-label">Teachers</div><div class="kpi-val">${tch}</div></div>
    <div class="kpi"><div class="kpi-label">Classes</div><div class="kpi-val">${cls}</div></div>
    <div class="kpi"><div class="kpi-label">Attendance %</div><div class="kpi-val">${attPct}%</div></div>
    <div class="kpi"><div class="kpi-label">Upcoming Exams</div><div class="kpi-val">${exams}</div></div>
    <div class="kpi"><div class="kpi-label">Pending Fees</div><div class="kpi-val">₹${Number(pendFees).toLocaleString('en-IN')}</div></div>
    <div class="kpi"><div class="kpi-label">Fee Paid</div><div class="kpi-val">${feeSummary.paid}</div></div>
  </div>

  <div class="sect-title">📚 Class-wise Student Distribution</div>
  <table>
    <tr><th>Class</th><th>Total Students</th></tr>
    ${classWise.map(c => `<tr><td>Class ${c.class}</td><td>${c.cnt}</td></tr>`).join('')}
  </table>

  <div class="sect-title">💰 Fee Status Overview</div>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    <tr><td><span class="badge badge-green">Paid</span></td><td>${feeSummary.paid}</td></tr>
    <tr><td><span class="badge badge-orange">Partial</span></td><td>${feeSummary.partial}</td></tr>
    <tr><td><span class="badge badge-red">Pending</span></td><td>${feeSummary.pending}</td></tr>
  </table>

  ${topStudents.length ? `
  <div class="sect-title">🏆 Top 10 Students by Marks</div>
  <table>
    <tr><th>Roll</th><th>Student Name</th><th>Percentage</th><th>Grade</th></tr>
    ${topStudents.map(s => `<tr><td>${s.roll}</td><td>${s.student}</td><td>${s.percent}%</td>
      <td><span class="badge ${s.grade==='A+'?'badge-green':s.grade==='F'?'badge-red':'badge-blue'}">${s.grade}</span></td></tr>`).join('')}
  </table>` : ''}

  ${notices.length ? `
  <div class="sect-title">📢 Recent Notices</div>
  <table>
    <tr><th>Title</th><th>Date</th><th>Target</th><th>Urgent</th></tr>
    ${notices.map(n => `<tr><td>${n.title}</td><td>${n.date||'-'}</td>
      <td>${n.target||'All'}</td>
      <td><span class="badge ${n.urgent?'badge-red':'badge-blue'}">${n.urgent?'Yes':'No'}</span></td></tr>`).join('')}
  </table>` : ''}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="school_summary${fileYear}.html"`);
  res.send(htmlPage('School Summary Report', body));
});

// ─── 2. Marks / Results Report ────────────
// GET /api/reports/marks?grade=A&format=csv
router.get('/marks', (req, res) => {
  const { grade, format, year } = req.query;
  const yearLabel = year ? ` — ${year}` : '';
  const fileYear  = year ? `_${year}` : '';
  let where = [], params = [];
  if (grade) { where.push('grade = ?'); params.push(grade); }
  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(
    `SELECT roll, student, math, sci, eng, hin, ss, total, percent, grade FROM results ${whereSQL} ORDER BY CAST(percent AS REAL) DESC`
  ).all(...params);

  if (format === 'csv' || req.headers.accept?.includes('csv')) {
    return sendCSV(res, `marks_report${fileYear}.csv`,
      ['Roll', 'Student Name', 'Math', 'Science', 'English', 'Hindi', 'Soc.Std', 'Total', 'Percentage', 'Grade'],
      rows.map(r => [r.roll, r.student, r.math, r.sci, r.eng, r.hin, r.ss, r.total, r.percent + '%', r.grade])
    );
  }

  const body = `
  <div class="rpt-subtitle">Results / Marks Report${grade ? ' — Grade: ' + grade : ''}${yearLabel} — ${date()}</div>
  <table>
    <tr><th>#</th><th>Roll</th><th>Student Name</th><th>Math</th><th>Science</th><th>English</th><th>Hindi</th><th>Soc.Std</th><th>Total</th><th>%</th><th>Grade</th></tr>
    ${rows.length ? rows.map((r, i) => `
    <tr>
      <td>${i+1}</td><td>${r.roll}</td><td>${r.student}</td>
      <td>${r.math}</td><td>${r.sci}</td><td>${r.eng}</td><td>${r.hin}</td><td>${r.ss}</td>
      <td><strong>${r.total}</strong></td><td><strong>${r.percent}%</strong></td>
      <td><span class="badge ${r.grade==='A+'||r.grade==='A'?'badge-green':r.grade==='F'?'badge-red':'badge-blue'}">${r.grade}</span></td>
    </tr>`).join('') : '<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:20px;">No results found</td></tr>'}
  </table>
  <div style="font-size:11px;color:#64748b;">Total records: ${rows.length}</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="marks_report${fileYear}.html"`);
  res.send(htmlPage('Marks Report', body));
});

// ─── 3. Students List ─────────────────────
// GET /api/reports/students?class=10&status=Active&format=csv
router.get('/students', (req, res) => {
  const { class: cls, status, format, year } = req.query;
  const yearLabel = year ? ` — ${year}` : '';
  const fileYear  = year ? `_${year}` : '';
  let where = [], params = [];
  if (cls)    { where.push('class = ?');  params.push(cls); }
  if (status) { where.push('status = ?'); params.push(status); }
  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(
    `SELECT admission, gr_number, name, class, section, gender, phone, fees, status, dob FROM students ${whereSQL} ORDER BY CAST(class AS INTEGER), name`
  ).all(...params);

  if (format === 'csv') {
    return sendCSV(res, `students_export${fileYear}.csv`,
      ['Admission No', 'GR Number', 'Name', 'Class', 'Section', 'Gender', 'Phone', 'Fee Status', 'Status', 'DOB'],
      rows.map(r => [r.admission, r.gr_number, r.name, r.class, r.section, r.gender, r.phone, r.fees, r.status, r.dob])
    );
  }

  const body = `
  <div class="rpt-subtitle">Student Directory${cls?' — Class '+cls:''}${status?' — '+status:''}${yearLabel} — ${date()}</div>
  <table>
    <tr><th>#</th><th>Adm No</th><th>GR No</th><th>Name</th><th>Class</th><th>Sec</th><th>Gender</th><th>Phone</th><th>Fee Status</th><th>Status</th></tr>
    ${rows.length ? rows.map((r,i) => `
    <tr>
      <td>${i+1}</td><td>${r.admission}</td><td>${r.gr_number||'-'}</td><td>${r.name}</td>
      <td>${r.class}</td><td>${r.section}</td><td>${r.gender||'-'}</td><td>${r.phone||'-'}</td>
      <td><span class="badge ${r.fees==='Paid'?'badge-green':r.fees==='Partial'?'badge-orange':'badge-red'}">${r.fees}</span></td>
      <td><span class="badge ${r.status==='Active'?'badge-green':'badge-red'}">${r.status}</span></td>
    </tr>`).join('') : '<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:20px;">No students found</td></tr>'}
  </table>
  <div style="font-size:11px;color:#64748b;">Total: ${rows.length} students</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="students_list${fileYear}.html"`);
  res.send(htmlPage('Student Directory', body));
});

// ─── 4. Attendance Report ─────────────────
// GET /api/reports/attendance?class=10&date=2026-03&format=csv
router.get('/attendance', (req, res) => {
  const { class: cls, month, format, year } = req.query;
  const yearLabel = year ? ` — ${year}` : '';
  const fileYear  = year ? `_${year}` : '';
  let where = ['person_type = ?'], params = ['student'];
  if (cls)   { where.push('class = ?'); params.push(cls); }
  if (month) { where.push("date LIKE ?"); params.push(month + '%'); }
  const whereSQL = 'WHERE ' + where.join(' AND ');

  const rows = db.prepare(`
    SELECT a.person_id, COALESCE(s.name, s1.name) AS name, a.class, a.date, a.status
    FROM attendance a
    LEFT JOIN students s ON s.student_id = a.person_id
    LEFT JOIN students s1 ON CAST(a.person_id AS TEXT) = CAST(s1.id AS TEXT)
    ${whereSQL}
    ORDER BY a.date DESC, a.class, COALESCE(s.name, s1.name)
    LIMIT 2000
  `).all(...params);

  if (format === 'csv') {
    return sendCSV(res, `attendance_export${fileYear}.csv`,
      ['Student ID', 'Name', 'Class', 'Date', 'Status'],
      rows.map(r => [r.person_id, r.name||'-', r.class||'-', r.date, r.status==='P'?'Present':r.status==='A'?'Absent':'Leave'])
    );
  }

  const statusLabel = s => s==='P'?'Present':s==='A'?'Absent':'Leave';
  const statusBadge = s => s==='P'?'badge-green':s==='A'?'badge-red':'badge-orange';

  const body = `
  <div class="rpt-subtitle">Attendance Report${cls?' — Class '+cls:''}${month?' — '+month:''}${yearLabel} — ${date()}</div>
  <table>
    <tr><th>#</th><th>Student Name</th><th>Class</th><th>Date</th><th>Status</th></tr>
    ${rows.length ? rows.map((r,i) => `
    <tr>
      <td>${i+1}</td><td>${r.name||r.person_id}</td><td>${r.class||'-'}</td><td>${r.date}</td>
      <td><span class="badge ${statusBadge(r.status)}">${statusLabel(r.status)}</span></td>
    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px;">No attendance records found</td></tr>'}
  </table>
  <div style="font-size:11px;color:#64748b;">Total records: ${rows.length}</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="attendance_report${fileYear}.html"`);
  res.send(htmlPage('Attendance Report', body));
});

// ─── 5. Fee Report ───────────────────────
// GET /api/reports/fees?status=Pending&format=csv
router.get('/fees', (req, res) => {
  const { status, format, year } = req.query;
  const yearLabel = year ? ` — ${year}` : '';
  const fileYear  = year ? `_${year}` : '';
  let where = [], params = [];
  if (status) { where.push('s.fees = ?'); params.push(status); }
  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(`
    SELECT s.admission, s.name, s.class, s.section, s.phone, s.fees AS fee_status,
           COALESCE(SUM(f.paid),0) AS total_paid, COALESCE(SUM(f.due),0) AS total_due
    FROM students s
    LEFT JOIN fees f ON LOWER(TRIM(f.student)) = LOWER(TRIM(s.name))
    ${whereSQL}
    GROUP BY s.id
    ORDER BY CAST(s.class AS INTEGER), s.name
  `).all(...params);

  if (format === 'csv') {
    return sendCSV(res, `fee_export${fileYear}.csv`,
      ['Admission No', 'Name', 'Class', 'Section', 'Phone', 'Fee Status', 'Total Paid (₹)', 'Total Due (₹)'],
      rows.map(r => [r.admission, r.name, r.class, r.section, r.phone||'', r.fee_status,
        r.total_paid, r.total_due])
    );
  }

  const body = `
  <div class="rpt-subtitle">Fee Report${status?' — '+status+' only':''}${yearLabel} — ${date()}</div>
  <table>
    <tr><th>#</th><th>Adm No</th><th>Name</th><th>Class</th><th>Sec</th><th>Phone</th><th>Status</th><th>Paid (₹)</th><th>Due (₹)</th></tr>
    ${rows.length ? rows.map((r,i) => `
    <tr>
      <td>${i+1}</td><td>${r.admission}</td><td>${r.name}</td><td>${r.class}</td><td>${r.section}</td>
      <td>${r.phone||'-'}</td>
      <td><span class="badge ${r.fee_status==='Paid'?'badge-green':r.fee_status==='Partial'?'badge-orange':'badge-red'}">${r.fee_status}</span></td>
      <td style="color:#15803d;font-weight:600;">₹${Number(r.total_paid).toLocaleString('en-IN')}</td>
      <td style="color:${r.total_due>0?'#b91c1c':'#15803d'};font-weight:600;">₹${Number(r.total_due).toLocaleString('en-IN')}</td>
    </tr>`).join('') : '<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:20px;">No fee records found</td></tr>'}
  </table>
  <div style="font-size:11px;color:#64748b;">Total: ${rows.length} students &nbsp;|&nbsp;
    Total Paid: ₹${rows.reduce((s,r)=>s+r.total_paid,0).toLocaleString('en-IN')} &nbsp;|&nbsp;
    Total Due: ₹${rows.reduce((s,r)=>s+r.total_due,0).toLocaleString('en-IN')}</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="fee_report${fileYear}.html"`);
  res.send(htmlPage('Fee Report', body));
});

module.exports = router;
