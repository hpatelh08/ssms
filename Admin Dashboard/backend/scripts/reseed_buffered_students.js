const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.resolve(__dirname, '..', 'database.sqlite'));

const SECTIONS = ['A', 'B', 'C'];
const SECTION_CAPACITY = 40;
const SEEDED_STUDENTS_PER_SECTION = 35;
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Krish', 'Ishaan', 'Rohan', 'Dev', 'Ananya', 'Diya', 'Myra', 'Aisha', 'Siya', 'Meera', 'Ritika', 'Kavya', 'Priyansh', 'Yash', 'Dhruv', 'Tanvi', 'Kiara'];
const LAST_NAMES = ['Sharma', 'Patel', 'Verma', 'Gupta', 'Joshi', 'Mehta', 'Kapoor', 'Singh', 'Desai', 'Nair', 'Yadav', 'Iyer', 'Kulkarni', 'Tiwari', 'Chauhan', 'Rao'];
const STREETS = ['Main Street', 'Park Avenue', 'Lake Road', 'Rose Colony', 'Green View', 'Hill Side', 'River Lane', 'Maple Avenue'];
const PRIMARY_SUBJECTS = ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'];
const UPPER_SUBJECTS = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'];
const FEE_TOTALS = {
  1: 13000,
  2: 14000,
  3: 15000,
  4: 16000,
  5: 17000,
  6: 18000,
};

function pad(value, size = 3) {
  return String(value).padStart(size, '0');
}

function toSqlDate(date) {
  return date.toISOString().slice(0, 10);
}

function toSqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getBufferedSequence(standard, section, offsetWithinSection) {
  const sectionIndex = SECTIONS.indexOf(section);
  const blockIndex = ((standard - 1) * SECTIONS.length) + sectionIndex;
  return (blockIndex * SECTION_CAPACITY) + offsetWithinSection;
}

function buildCreatedAt(index) {
  const date = new Date(Date.UTC(2025, 5, 1, 9, 0, 0));
  date.setUTCDate(date.getUTCDate() + ((index - 1) % 280));
  return toSqlDateTime(date);
}

function feeStatusFromPaid(total, paid) {
  if (paid >= total) return 'Paid';
  if (paid > 0) return 'Partial';
  return 'Pending';
}

function deterministicScore(sequence, salt, min = 58, max = 98) {
  const span = max - min + 1;
  return min + ((sequence * 7 + salt * 11) % span);
}

function gradeFromPercent(percent) {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B';
  if (percent >= 60) return 'C';
  if (percent >= 50) return 'D';
  return 'F';
}

function attendanceStatus(personId, dateStr) {
  const seedText = `${personId}|${dateStr}`;
  let hash = 0;
  for (let index = 0; index < seedText.length; index += 1) {
    hash = ((hash * 31) + seedText.charCodeAt(index)) >>> 0;
  }
  const score = hash % 100;
  if (score >= 95) return 'L';
  if (score >= 87) return 'A';
  return 'P';
}

function getWorkingDates(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const last = new Date(`${endDate}T00:00:00Z`);

  while (cursor <= last) {
    if (cursor.getUTCDay() !== 0) {
      dates.push(toSqlDate(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function subjectListForClass(standard) {
  return standard <= 5 ? PRIMARY_SUBJECTS : UPPER_SUBJECTS;
}

function buildStudents() {
  const students = [];
  let recordId = 1;

  for (let standard = 1; standard <= 6; standard += 1) {
    for (const section of SECTIONS) {
      for (let roll = 1; roll <= SEEDED_STUDENTS_PER_SECTION; roll += 1) {
        const first = FIRST_NAMES[(recordId - 1) % FIRST_NAMES.length];
        const last = LAST_NAMES[Math.floor((recordId - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
        const sequence = getBufferedSequence(standard, section, roll);
        const birthDate = new Date(Date.UTC(2016 - standard, recordId % 12, (roll % 28) + 1));
        const phone = `98${String(765430000 + recordId).slice(-8)}`;
        const feeTotal = FEE_TOTALS[standard];
        const feeVariant = recordId % 6;
        const paid = feeVariant === 0 ? feeTotal : feeVariant === 1 ? Math.round(feeTotal * 0.5) : 0;

        students.push({
          gr_number: `GR-${pad(sequence)}`,
          student_id: `STU2024${pad(sequence, 4)}`,
          student_password: `Stu@${pad(sequence)}`,
          name: `${first} ${last}`,
          admission: `ADM-2024-${pad(sequence)}`,
          class: String(standard),
          section,
          parent: `${FIRST_NAMES[recordId % FIRST_NAMES.length]} ${last}`,
          phone,
          status: 'Active',
          fees: feeStatusFromPaid(feeTotal, paid),
          dob: toSqlDate(birthDate),
          gender: recordId % 2 === 0 ? 'Female' : 'Male',
          blood_group: null,
          address: `${(recordId % 120) + 1} ${STREETS[recordId % STREETS.length]}, Ahmedabad`,
          parent_access_key: phone.slice(-4),
          parent_id: null,
          created_at: buildCreatedAt(recordId),
          sequence,
        });

        recordId += 1;
      }
    }
  }

  return students;
}

function buildFees(students) {
  return students.map((student, index) => {
    const standard = parseInt(student.class, 10);
    const amount = FEE_TOTALS[standard];
    const paid = student.fees === 'Paid'
      ? amount
      : student.fees === 'Partial'
        ? Math.round(amount * 0.5)
        : 0;
    const due = Math.max(amount - paid, 0);

    return {
      id: `FEE${pad(index + 1, 4)}`,
      student: student.name,
      cls: `${student.class}-${student.section}`,
      amount,
      paid,
      due,
      month: 'Apr 2025',
      status: feeStatusFromPaid(amount, paid),
      date: paid > 0 ? student.created_at.slice(0, 10) : '',
      created_at: student.created_at,
    };
  });
}

function buildAttendanceRows(students) {
  const rows = [];
  const workingDates = getWorkingDates('2026-03-01', '2026-03-26');

  for (const dateStr of workingDates) {
    const createdAt = `${dateStr} 11:00:00`;
    for (const student of students) {
      rows.push({
        person_id: student.student_id,
        person_type: 'student',
        date: dateStr,
        status: attendanceStatus(student.student_id, dateStr),
        class: student.class,
        section: student.section,
        subject: null,
        created_at: createdAt,
      });
    }
  }

  return rows;
}

function buildResultsRows(students) {
  const rows = [];

  for (const examType of ['midterm', 'annual']) {
    for (const student of students) {
      const saltOffset = examType === 'annual' ? 5 : 0;
      const math = deterministicScore(student.sequence, 1 + saltOffset);
      const sci = deterministicScore(student.sequence, 2 + saltOffset);
      const eng = deterministicScore(student.sequence, 3 + saltOffset);
      const hin = deterministicScore(student.sequence, 4 + saltOffset);
      const ss = deterministicScore(student.sequence, 5 + saltOffset);
      const total = math + sci + eng + hin + ss;
      const percent = ((total / 500) * 100).toFixed(1);

      rows.push({
        student: student.name,
        roll: student.gr_number,
        math,
        sci,
        eng,
        hin,
        ss,
        total,
        grade: gradeFromPercent(parseFloat(percent)),
        percent,
        class: student.class,
        exam_type: examType,
        created_at: examType === 'annual' ? '2026-02-18 10:30:00' : '2025-11-15 10:30:00',
      });
    }
  }

  return rows;
}

function buildMarksRows(students) {
  const rows = [];

  for (const examType of ['midterm', 'annual']) {
    const saltOffset = examType === 'annual' ? 3 : 0;
    for (const student of students) {
      const standard = parseInt(student.class, 10);
      const subjects = subjectListForClass(standard);

      subjects.forEach((subject, subjectIndex) => {
        rows.push({
          student: student.name,
          class: student.class,
          exam_type: examType,
          subject,
          marks: deterministicScore(student.sequence, subjectIndex + 1 + saltOffset),
          created_at: examType === 'annual' ? '2026-02-18 10:45:00' : '2025-11-15 10:45:00',
        });
      });
    }
  }

  return rows;
}

function loadExistingClassMeta() {
  const rows = db.prepare('SELECT id, name, teacher, room FROM classes WHERE name LIKE ?').all('Class %');
  return new Map(rows.map((row) => [row.name, row]));
}

function main() {
  const existingClassMeta = loadExistingClassMeta();
  const students = buildStudents();
  const fees = buildFees(students);
  const attendanceRows = buildAttendanceRows(students);
  const resultsRows = buildResultsRows(students);
  const marksRows = buildMarksRows(students);

  const reseed = db.transaction(() => {
    db.prepare('DELETE FROM parent_children').run();
    db.prepare('DELETE FROM parents').run();
    db.prepare("DELETE FROM attendance WHERE person_type = 'student'").run();
    db.prepare('DELETE FROM results').run();
    db.prepare('DELETE FROM marks').run();
    db.prepare('DELETE FROM fees').run();
    db.prepare('DELETE FROM students').run();
    db.prepare("DELETE FROM classes WHERE name LIKE 'Class %'").run();

    const insertStudent = db.prepare(`
      INSERT INTO students (
        gr_number, student_id, student_password, name, admission, class, section, parent,
        phone, status, fees, dob, gender, blood_group, address, parent_access_key, parent_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFee = db.prepare(`
      INSERT INTO fees (id, student, cls, amount, paid, due, month, status, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAttendance = db.prepare(`
      INSERT INTO attendance (person_id, person_type, date, status, class, section, subject, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertResult = db.prepare(`
      INSERT INTO results (student, roll, math, sci, eng, hin, ss, total, grade, percent, class, exam_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMark = db.prepare(`
      INSERT INTO marks (student, class, exam_type, subject, marks, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertClass = db.prepare('INSERT INTO classes (id, name, teacher, students, room) VALUES (?, ?, ?, ?, ?)');

    students.forEach((student) => {
      insertStudent.run(
        student.gr_number,
        student.student_id,
        student.student_password,
        student.name,
        student.admission,
        student.class,
        student.section,
        student.parent,
        student.phone,
        student.status,
        student.fees,
        student.dob,
        student.gender,
        student.blood_group,
        student.address,
        student.parent_access_key,
        student.parent_id,
        student.created_at
      );
    });

    fees.forEach((fee) => {
      insertFee.run(
        fee.id,
        fee.student,
        fee.cls,
        fee.amount,
        fee.paid,
        fee.due,
        fee.month,
        fee.status,
        fee.date,
        fee.created_at
      );
    });

    attendanceRows.forEach((row) => {
      insertAttendance.run(
        row.person_id,
        row.person_type,
        row.date,
        row.status,
        row.class,
        row.section,
        row.subject,
        row.created_at
      );
    });

    resultsRows.forEach((row) => {
      insertResult.run(
        row.student,
        row.roll,
        row.math,
        row.sci,
        row.eng,
        row.hin,
        row.ss,
        row.total,
        row.grade,
        row.percent,
        row.class,
        row.exam_type,
        row.created_at
      );
    });

    marksRows.forEach((row) => {
      insertMark.run(
        row.student,
        row.class,
        row.exam_type,
        row.subject,
        row.marks,
        row.created_at
      );
    });

    for (let standard = 1; standard <= 6; standard += 1) {
      for (const section of SECTIONS) {
        const name = `Class ${standard}-${section}`;
        const existing = existingClassMeta.get(name);
        insertClass.run(
          existing?.id || `CLS_AUTO_${standard}${section}`,
          name,
          existing?.teacher || '',
          SEEDED_STUDENTS_PER_SECTION,
          existing?.room || ''
        );
      }
    }
  });

  reseed();

  console.log(`Seeded ${students.length} students across 18 sections.`);
  console.log(`Seeded ${fees.length} fees, ${attendanceRows.length} attendance rows, ${resultsRows.length} results, ${marksRows.length} marks.`);
  console.log(`Each section now has ${SEEDED_STUDENTS_PER_SECTION} students with ${SECTION_CAPACITY - SEEDED_STUDENTS_PER_SECTION} buffered GR slots.`);
}

main();
