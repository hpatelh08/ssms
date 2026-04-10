import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiUrl } from '../../config/api';
import { getAssignedTeacherClassNumber, getAssignedTeacherSection } from '../../teacherIdentity';
import { loadClassStudents, loadTeacherClasses } from '../../teacherAdminData';

const MarksManagement = ({ currentUser }) => {
  const getExamStorageKey = () => `teacher-exams-${currentUser?._id || currentUser?.email || 'default'}`;
  const buildExamKey = (exam) => {
    const classId = exam?.class?._id || exam?.class || '';
    const subjectId = exam?.subject?._id || exam?.subject || '';
    const date = exam?.date || exam?.examDate || '';
    return `${exam?.examName || ''}|${date}|${classId}|${subjectId}`;
  };
  const loadLocalExams = () => {
    const key = getExamStorageKey();
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const mergeExams = (remoteList, localList) => {
    const remoteKeys = new Set(remoteList.map(buildExamKey));
    const merged = [...remoteList];
    localList.forEach((exam) => {
      if (!remoteKeys.has(buildExamKey(exam))) {
        merged.push(exam);
      }
    });
    return merged;
  };
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const subjectList = [
    { _id: 'sub_1', subjectName: 'Math' },
    { _id: 'sub_2', subjectName: 'Science' },
    { _id: 'sub_3', subjectName: 'English' },
    { _id: 'sub_4', subjectName: 'Gujarati' },
    { _id: 'sub_5', subjectName: 'Hindi' },
    { _id: 'sub_6', subjectName: 'Sanskrit' }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExams();
      fetchStudentsInClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedExam) {
      fetchMarks();
    }
  }, [selectedClass, selectedExam, students.length]); // Dependencies for mark fetch

  const fetchClasses = async () => {
    try {
      const loadedClasses = await loadTeacherClasses(currentUser);
      setClasses(loadedClasses);
      setSubjects(subjectList);

      if (loadedClasses.length > 0) {
        setSelectedClass(loadedClasses[0]._id);
      }
    } catch (error) {
      setSubjects(subjectList);
    }
  };

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl(`/api/teacher/exams?class=${selectedClass}`), {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 1000
      });
      if (!response.data.data || response.data.data.length === 0) throw new Error('Empty');
      const remoteExams = response.data.data || [];
      const localExams = loadLocalExams();
      const merged = mergeExams(remoteExams, localExams).filter((exam) => {
        const examClassId = exam?.class?._id || exam?.class || '';
        return !selectedClass || examClassId === selectedClass;
      });
      setExams(merged);
    } catch (error) {
      const localExams = loadLocalExams().filter((exam) => {
        const examClassId = exam?.class?._id || exam?.class || '';
        return !selectedClass || examClassId === selectedClass;
      });
      setExams(localExams);
      if (localExams.length === 0) setSelectedExam('');
    }
  };

  const fetchStudentsInClass = async (classId) => {
    const loadedStudents = await loadClassStudents(classId, currentUser, classes);
    setStudents(loadedStudents);
  };

  const fetchMarks = async () => {
    if (students.length === 0) return;
    setLoading(true);
    const consolidatedMarks = {};
    students.forEach((student) => {
      consolidatedMarks[student._id] = {};
      subjectList.forEach((sub) => {
        consolidatedMarks[student._id][sub._id] = '';
      });
    });
    setMarks(consolidatedMarks);

    const remarksKey = `marks-remarks-${selectedClass}-${selectedExam}`;
    try {
      const savedRemarks = localStorage.getItem(remarksKey);
      setRemarks(savedRemarks ? JSON.parse(savedRemarks) : {});
    } catch {
      setRemarks({});
    }
    setLoading(false);
  };

  const saveRemarks = (nextRemarks) => {
    const remarksKey = `marks-remarks-${selectedClass}-${selectedExam}`;
    localStorage.setItem(remarksKey, JSON.stringify(nextRemarks));
  };

  const handleRemarkChange = (studentId, value) => {
    setRemarks((prev) => {
      const updated = {
        ...prev,
        [studentId]: value
      };
      saveRemarks(updated);
      return updated;
    });
  };

  const handleMarkAllGood = () => {
    const updated = {};
    students.forEach((student) => {
      updated[student._id] = 'Good';
    });
    setRemarks(updated);
    saveRemarks(updated);
  };

  const calculateTotal = (studentId) => {
    const studentMarks = marks[studentId] || {};
    return Object.values(studentMarks).reduce((sum, val) => sum + (val || 0), 0);
  };

  const calculateAverage = (studentId) => {
    const total = calculateTotal(studentId);
    return Math.round(total / subjectList.length);
  };

  const calculateGrade = (avg) => {
    if (avg >= 90) return 'A+';
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B+';
    if (avg >= 60) return 'B';
    if (avg >= 50) return 'C';
    if (avg >= 40) return 'D';
    return 'F';
  };

  const handleExportCSV = () => {
    if (!selectedExam || students.length === 0) return;

    // Header row
    const headers = ['Roll No', 'Student Name', ...subjectList.map(s => s.subjectName), 'Total', 'Avg%', 'Grade'];

    // Data rows
    const rows = students.map((student, index) => {
      const studentMarks = marks[student._id] || {};
      const total = calculateTotal(student._id);
      const avg = calculateAverage(student._id);
      const grade = calculateGrade(avg);

      return [
        `#${String(index + 1).padStart(2, '0')}`,
        student.name,
        ...subjectList.map(sub => studentMarks[sub._id] || '-'),
        total,
        `${avg}%`,
        grade
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Marks_Sheet_${classes.find(c => c._id === selectedClass)?.className}_${exams.find(e => e._id === selectedExam)?.examName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Marks Management</h2>
          <p className="text-gray-500 mt-1">
            Consolidated subject-wise results for Class {getAssignedTeacherClassNumber(currentUser)} - {getAssignedTeacherSection(currentUser)}
          </p>
        </div>
        <div className="flex gap-3">
          {selectedExam && (
            <button
              onClick={handleMarkAllGood}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-emerald-700 hover:bg-emerald-100 transition shadow-sm font-semibold"
              title="Mark all remarks as Good"
            >
              <span className="text-base leading-none">🙂</span>
              All Good
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none cursor-pointer"
              >
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.className} - {cls.section} (Primary)</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exam Period</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none cursor-pointer"
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>{exam.examName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedExam ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-5 font-bold text-gray-400 text-[10px] uppercase tracking-widest sticky left-0 bg-white z-20">Roll No</th>
                  <th className="px-6 py-5 font-bold text-gray-400 text-[10px] uppercase tracking-widest sticky left-24 bg-white z-20 border-r border-gray-100">Student Name</th>
                  {subjectList.map(sub => (
                    <th key={sub._id} className="px-4 py-5 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-center">{sub.subjectName}</th>
                  ))}
                  <th className="px-6 py-5 font-bold text-blue-500 text-[10px] uppercase tracking-widest text-center bg-blue-50/50 border-l border-blue-100">Total</th>
                  <th className="px-6 py-5 font-bold text-blue-500 text-[10px] uppercase tracking-widest text-center bg-blue-50/50">Avg %</th>
                  <th className="px-6 py-5 font-bold text-blue-500 text-[10px] uppercase tracking-widest text-center bg-blue-50/50 rounded-tr-2xl">Grade</th>
                  <th className="px-6 py-5 font-bold text-blue-500 text-[10px] uppercase tracking-widest text-center bg-blue-50/50">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student, index) => {
                  const total = calculateTotal(student._id);
                  const avg = calculateAverage(student._id);
                  const grade = calculateGrade(avg);

                  return (
                    <tr key={student._id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono text-blue-600 text-sm sticky left-0 bg-white group-hover:bg-gray-50">
                        #{String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 sticky left-24 bg-white group-hover:bg-gray-50 border-r border-gray-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                        <div className="font-bold text-gray-800 text-sm">{student.name}</div>
                        <div className="text-[9px] text-gray-400 font-medium uppercase mt-0.5 tracking-tighter">{student.studentId}</div>
                      </td>
                      {subjectList.map(sub => (
                        <td key={sub._id} className="px-4 py-4 text-center">
                          <span className={`inline-block w-8 text-sm font-semibold ${(marks[student._id]?.[sub._id] || 0) < 60 ? 'text-orange-500' : 'text-gray-600'
                            }`}>
                            {marks[student._id]?.[sub._id] || '-'}
                          </span>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center bg-blue-50/20 border-l border-blue-50">
                        <span className="font-extrabold text-gray-900 text-sm">{total}</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50/20">
                        <span className="font-extrabold text-blue-600 text-sm">{avg}%</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50/20">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ring-1 ring-inset ${grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                          grade.startsWith('B') ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                            grade.startsWith('C') ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                              'bg-rose-50 text-rose-700 ring-rose-200'
                          }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50/20">
                        <input
                          type="text"
                          value={remarks[student._id] || ''}
                          onChange={(e) => handleRemarkChange(student._id, e.target.value)}
                          placeholder="Good"
                          className="w-full max-w-[180px] p-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center bg-white">
            <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-12 transition group-hover:rotate-0">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No Exam Selected</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">Please select an exam period from the dropdown above to view student marks.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 font-medium px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Great Performance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Needs Improvement</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:text-blue-600 transition disabled:opacity-30" disabled><ChevronLeft className="h-4 w-4" /></button>
          <span>Page 1 of 1</span>
          <button className="p-1 hover:text-blue-600 transition disabled:opacity-30" disabled><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default MarksManagement;
