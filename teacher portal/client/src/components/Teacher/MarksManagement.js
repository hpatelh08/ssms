import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const MarksManagement = ({ currentUser }) => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 1000
      });
      let filteredClasses = response.data.data.filter(cls => ['8', '9', '10'].includes(cls.className));

      const mockClass = {
        _id: 'mock_class_8b',
        className: '8',
        section: 'B',
        subjects: subjectList
      };

      if (!filteredClasses || filteredClasses.length === 0) {
        filteredClasses = [mockClass];
      }
      setClasses(filteredClasses);
      setSubjects(subjectList);

      // Auto-select Class 8 - B for this user
      if (filteredClasses.length > 0) {
        setSelectedClass(filteredClasses[0]._id);
      }
    } catch (error) {
      const mockClass = {
        _id: 'mock_class_8b',
        className: '8',
        section: 'B',
        subjects: subjectList
      };
      setClasses([mockClass]);
      setSubjects(subjectList);
      setSelectedClass(mockClass._id);
    }
  };

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/teacher/exams?class=${selectedClass}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 1000
      });
      if (!response.data.data || response.data.data.length === 0) throw new Error('Empty');
      setExams(response.data.data);
    } catch (error) {
      setExams([{
        _id: 'mock_exam_1',
        examName: 'Mid Term Exam',
        examType: 'mid_term',
        class: { className: '8', section: 'B' },
        date: new Date().toISOString()
      }]);
      setSelectedExam('mock_exam_1');
    }
  };

  const fetchStudentsInClass = async (classId) => {
    const indianNames = [
      "Aarav Sharma", "Vivaan Patel", "Aditya Singh", "Vihaan Kumar", "Arjun Gupta",
      "Sai Krishna", "Reyansh Reddy", "Ayaan Khan", "Krishna Iyer", "Ishaan Verma",
      "Rudra Joshi", "Dhruv Desai", "Kabir Das", "Atharv Yadav", "Rishi Tiwari",
      "Adwait Pandey", "Aanya Sharma", "Diya Patel", "Ananya Singh", "Myra Kumar",
      "Kavya Gupta", "Siya Reddy", "Navya Khan", "Aaradhya Iyer", "Saanvi Verma",
      "Nyra Joshi", "Sneha Desai", "Ira Das", "Riya Yadav", "Tara Tiwari",
      "Kiara Pandey", "Advik Nair", "Pranav Menon", "Rohan Sethi", "Karthik Pillai",
      "Siddharth Rao", "Neel Thakur", "Dev Bhardwaj", "Rahul Chatterjee", "Nikhil Sen"
    ];

    const mockStudents = indianNames.map((name, index) => ({
      _id: `MOCK_STU_${index + 1}`,
      studentId: `STU${String(index + 1).padStart(3, '0')}`,
      name: name
    }));
    setStudents(mockStudents);
  };

  const fetchMarks = async () => {
    if (students.length === 0) return;
    setLoading(true);
    // Generate mock consolidated data
    const consolidatedMarks = {};
    students.forEach(student => {
      consolidatedMarks[student._id] = {};
      subjectList.forEach(sub => {
        consolidatedMarks[student._id][sub._id] = Math.floor(Math.random() * 41) + 55; // 55-95
      });
    });
    setMarks(consolidatedMarks);
    setLoading(false);
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
          <p className="text-gray-500 mt-1">Consolidated subject-wise results for Class 8 - B</p>
        </div>
        <div className="flex gap-3">
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