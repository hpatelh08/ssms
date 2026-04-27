const fs = require('fs');
const path = require('path');

const examSyncPath = path.join(__dirname, 'exam-sync.json');

function readExamSyncFile() {
  try {
    if (!fs.existsSync(examSyncPath)) return [];
    const raw = fs.readFileSync(examSyncPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeExamSyncFile(exams) {
  const next = Array.isArray(exams) ? exams : [];
  fs.writeFileSync(examSyncPath, JSON.stringify(next, null, 2));
  return next;
}

function normalizeStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'completed') return 'Completed';
  if (value === 'ongoing') return 'Ongoing';
  if (value === 'cancelled') return 'Cancelled';
  if (value === 'upcoming') return 'Upcoming';
  return 'Scheduled';
}

function normalizeExamRecord(exam = {}) {
  const id = String(exam.id || exam._id || exam.examId || '').trim();
  return {
    id,
    name: String(exam.name || exam.examName || 'Exam').trim(),
    class: String(exam.class || '').trim(),
    subject: String(exam.subject || '').trim(),
    date: String(exam.date || '').trim(),
    duration: String(exam.duration || '').trim(),
    max_marks: Number(exam.max_marks ?? exam.maxMarks ?? exam.totalMarks ?? 100) || 100,
    status: normalizeStatus(exam.status),
    examType: String(exam.examType || '').trim(),
    startTime: String(exam.startTime || '').trim(),
    endTime: String(exam.endTime || '').trim(),
    passingMarks: Number(exam.passingMarks || 0) || 0,
    description: String(exam.description || '').trim(),
    teacherId: String(exam.teacherId || exam.teacher || '').trim(),
    source: String(exam.source || 'teacher').trim(),
  };
}

function upsertExamRecord(exam) {
  const record = normalizeExamRecord(exam);
  if (!record.id) return record;
  const list = readExamSyncFile();
  const idx = list.findIndex((item) => String(item.id || '').trim() === record.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...record };
  else list.push(record);
  writeExamSyncFile(list);
  return record;
}

function removeExamRecord(examId) {
  const id = String(examId || '').trim();
  if (!id) return [];
  const next = readExamSyncFile().filter((item) => String(item.id || '').trim() !== id);
  writeExamSyncFile(next);
  return next;
}

module.exports = {
  examSyncPath,
  readExamSyncFile,
  writeExamSyncFile,
  normalizeExamRecord,
  upsertExamRecord,
  removeExamRecord,
};
