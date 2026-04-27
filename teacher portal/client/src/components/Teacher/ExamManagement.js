import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, FileText, Calendar, Clock, User, Edit, Trash2, Eye, Download, CheckCircle, BookOpen, Award } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiUrl } from '../../config/api';
import { getAssignedTeacherClassNumber, getAssignedTeacherSection, matchesAssignedTeacherClass } from '../../teacherIdentity';
import { loadClassStudents, loadTeacherClasses } from '../../services/teacherBackendData';

const ExamManagement = ({ currentUser }) => {
  const TEACHER_SYNC_URL = apiUrl('/api/teacher/exams/public-sync');
  const ADMIN_SYNC_URL = 'http://127.0.0.1:5000/api/exams/public-sync';
  const isSubmissionComplete = (status) => {
    if (!status) return true;
    const normalized = String(status).toLowerCase();
    return ['submitted', 'completed', 'graded'].includes(normalized);
  };

  const getExamStorageKey = () => `teacher-exams-${currentUser?._id || currentUser?.email || 'default'}`;
  const buildExamKey = (exam) => {
    const classId = exam?.class?._id || exam?.class || '';
    const subjectId = exam?.subject?._id || exam?.subject || '';
    const date = exam?.date || exam?.examDate || '';
    return `${exam?.examName || ''}|${date}|${classId}|${subjectId}`;
  };
  const buildMarksExamGroupKey = (exam) => {
    const classId = exam?.class?._id || exam?.class || '';
    const examName = String(exam?.examName || '').trim().toLowerCase();
    const examType = String(exam?.examType || '').trim().toLowerCase();
    const date = String(exam?.date || exam?.examDate || '').trim();
    const startTime = String(exam?.startTime || '').trim().toLowerCase();
    const endTime = String(exam?.endTime || '').trim().toLowerCase();
    const totalMarks = String(exam?.totalMarks || '').trim();
    const passingMarks = String(exam?.passingMarks || '').trim();
    return [classId, examName, examType, date, startTime, endTime, totalMarks, passingMarks].join('|');
  };
  const normalizeExamType = (value) => {
    const raw = String(value || '').trim();
    return raw ? raw.toLowerCase() : 'general';
  };
  const formatExamType = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return 'General';
    return raw
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase());
  };
  const formatDate = (value) => {
    if (!value) return 'TBA';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const statusLabel = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'ongoing') return 'In Progress';
    if (value === 'completed') return 'Completed';
    if (value === 'cancelled') return 'Cancelled';
    if (value === 'upcoming' || value === 'scheduled') return 'Upcoming';
    return 'Scheduled';
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
  const saveLocalExams = (list) => {
    const key = getExamStorageKey();
    localStorage.setItem(key, JSON.stringify(list));
  };
  const buildPublicExamPayload = (exam) => {
    const classNumber = String(exam?.class?.className || exam?.class?.name || exam?.class || '').match(/\d+/)?.[0] || '';
    return {
      id: String(exam?._id || exam?.id || '').trim(),
      name: String(exam?.examName || exam?.name || 'Exam').trim(),
      class: classNumber,
      subject: String(exam?.subject?.subjectName || exam?.subject || '').trim(),
      date: String(exam?.date || exam?.examDate || '').trim(),
      duration: `${String(exam?.startTime || '').trim()} - ${String(exam?.endTime || '').trim()}`.trim(),
      maxMarks: Number(exam?.totalMarks || exam?.maxMarks || 100) || 100,
      status: String(exam?.status || 'Scheduled').trim(),
      examType: String(exam?.examType || '').trim(),
      startTime: String(exam?.startTime || '').trim(),
      endTime: String(exam?.endTime || '').trim(),
      passingMarks: Number(exam?.passingMarks || 0) || 0,
      description: String(exam?.description || '').trim(),
      source: 'teacher-portal',
    };
  };
  const syncExamsToAdmin = async (list) => {
    const payload = (Array.isArray(list) ? list : []).map(buildPublicExamPayload).filter((exam) => exam.id);
    if (!payload.length) return;
    try {
      await Promise.allSettled([
        axios.post(TEACHER_SYNC_URL, { exams: payload }, { timeout: 1500 }),
        axios.post(ADMIN_SYNC_URL, { exams: payload }, { timeout: 1500 }),
      ]);
    } catch {
      // Best-effort sync only.
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
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('exams');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [gradingData, setGradingData] = useState({});
  const [marksStudents, setMarksStudents] = useState([]);
  const [marksSelectedClass, setMarksSelectedClass] = useState('');
  const [marksExams, setMarksExams] = useState([]);
  const [marksSubjects, setMarksSubjects] = useState([]);
  const [marksSelectedExamGroup, setMarksSelectedExamGroup] = useState('');
  const [marksSelectedExamType, setMarksSelectedExamType] = useState('');
  const [marksExamData, setMarksExamData] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectChapters, setSubjectChapters] = useState({});
  const [subjectDates, setSubjectDates] = useState({});
  const [formData, setFormData] = useState({
    examName: '',
    examType: 'quiz',
    subject: '',
    class: '',
    date: '',
    startTime: '',
    endTime: '',
    totalMarks: '',
    passingMarks: '',
    description: '',
    chapter: ''
  });

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.assignedClass) {
      // Find the class ID that matches the user's assigned class
      const classToSelect = classes.find((cls) => matchesAssignedTeacherClass(cls, currentUser));
      if (classToSelect) {
        setFormData(prev => ({
          ...prev,
          class: classToSelect._id
        }));
      }
    }
  }, [classes, currentUser]);

  useEffect(() => {
    const loadSubjectsForClass = async () => {
      if (!formData.class) {
        setSubjects([]);
        setSelectedSubjects([]);
        setSubjectChapters({});
        setSubjectDates({});
        return;
      }

      const selectedClass = classes.find(c => c._id === formData.class);
      if (!selectedClass) {
        setSubjects([]);
        setSelectedSubjects([]);
        setSubjectChapters({});
        setSubjectDates({});
        return;
      }

      try {
        const std = String(selectedClass.className || '').match(/\d+/)?.[0] || '';
        const section = String(selectedClass.section || '').trim().toUpperCase();
        if (std && section) {
          const response = await axios.get(apiUrl('/api/class/timetable'), {
            params: { std, section },
            timeout: 4000
          });
          const schedule = response?.data?.data?.schedule || {};
          const subjectSet = new Set();
          Object.values(schedule).forEach((slots) => {
            (slots || []).forEach((slot) => {
              if (slot?.isBreak || !slot?.subject) return;
              subjectSet.add(String(slot.subject).trim());
            });
          });
          const subjectList = Array.from(subjectSet)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ _id: name, subjectName: name }));
          if (subjectList.length) {
            setSubjects(subjectList);
            return;
          }
        }
      } catch {
        // Fall back to stored class subjects.
      }

      setSubjects(selectedClass.subjects || []);
    };

    loadSubjectsForClass();
  }, [formData.class, classes]);

  useEffect(() => {
    if (formData.subject) {
      setSelectedSubjects([formData.subject]);
      return;
    }

    if (!formData._id) {
      setSelectedSubjects([]);
    }
  }, [formData.subject, formData._id]);

  const marksSubjectList = marksSubjects;
  const marksExamGroups = React.useMemo(() => {
    const groups = new Map();
    const sourceExams = marksExams.length ? marksExams : exams;
    const selectedClassLabel = String(marksSelectedClass || '').trim();

    sourceExams.forEach((exam) => {
      const examClassId = String(exam.class?._id || exam.class || '').trim();
      const examClassName = String(exam.class?.className || exam.class?.name || '').trim();
      const classMatches = !selectedClassLabel
        || examClassId === selectedClassLabel
        || examClassName === selectedClassLabel
        || String(exam.class?.className || '').trim() === String(marksSelectedClass || '').trim();
      if (!classMatches) return;

      const key = buildMarksExamGroupKey(exam);
      const subjectName = String(exam.subject?.subjectName || exam.subject || '').trim() || 'Subject';
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          examName: String(exam.examName || 'Exam').trim(),
          examType: String(exam.examType || '').trim(),
          examTypeKey: normalizeExamType(exam.examType),
          className: exam.class?.className || exam.class?.name || exam.class || '',
          section: exam.class?.section || exam.class?.division || '',
          date: exam.date || exam.examDate || exam.startDate || '',
          startTime: exam.startTime || '',
          endTime: exam.endTime || '',
          totalMarks: exam.totalMarks || 0,
          passingMarks: exam.passingMarks || 0,
          exams: [],
          subjects: [],
        });
      }
      const group = groups.get(key);
      group.exams.push(exam);
      if (!group.subjects.includes(subjectName)) {
        group.subjects.push(subjectName);
      }
    });

    return Array.from(groups.values())
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map((group) => ({
        ...group,
        exams: group.exams.sort((a, b) => {
          const subjectA = String(a.subject?.subjectName || a.subject || '').trim();
          const subjectB = String(b.subject?.subjectName || b.subject || '').trim();
          return subjectA.localeCompare(subjectB);
        }),
      }));
  }, [marksExams, exams, marksSelectedClass]);

  const marksExamTypeOptions = React.useMemo(() => {
    const types = new Map();
    marksExamGroups.forEach((group) => {
      const key = group.examTypeKey || normalizeExamType(group.examType);
      if (!types.has(key)) {
        types.set(key, formatExamType(group.examType));
      }
    });
    return Array.from(types.entries()).map(([value, label]) => ({ value, label }));
  }, [marksExamGroups]);

  const filteredMarksExamGroups = React.useMemo(() => {
    if (!marksSelectedExamType) return marksExamGroups;
    return marksExamGroups.filter((group) => (group.examTypeKey || normalizeExamType(group.examType)) === marksSelectedExamType);
  }, [marksExamGroups, marksSelectedExamType]);

  const selectedMarksExamGroup = React.useMemo(() => {
    if (!filteredMarksExamGroups.length || !marksSelectedExamGroup) return null;
    return filteredMarksExamGroups.find((group) => group.key === marksSelectedExamGroup) || null;
  }, [filteredMarksExamGroups, marksSelectedExamGroup]);

  const selectedMarksGroupExams = selectedMarksExamGroup?.exams || [];
  const selectedMarksGroupColumns = selectedMarksGroupExams.map((exam) => ({
    examId: exam._id,
    subjectName: String(exam.subject?.subjectName || exam.subject || 'Subject').trim() || 'Subject',
    totalMarks: exam.totalMarks || 0,
  }));

  const getStudentLookupKeys = (student) => [
    student?._id,
    student?.studentId,
    student?.id,
    student?.student_id,
  ]
    .map((key) => String(key || '').trim())
    .filter(Boolean);

  const selectedExamMarksLookup = React.useMemo(() => {
    const lookup = {};
    examResults.forEach((result) => {
      const value = gradingData[result._id]?.marks ?? result.marksObtained ?? '';
      getStudentLookupKeys(result.student).forEach((key) => {
        lookup[key] = value;
      });
    });
    return lookup;
  }, [examResults, gradingData]);

  const findMarksGroupForExam = (exam) => {
    if (!exam) return null;
    const exactKey = buildMarksExamGroupKey(exam);
    return marksExamGroups.find((group) => {
      if (group.key === exactKey) return true;
      if (group.examName && exam.examName && String(group.examName).trim().toLowerCase() === String(exam.examName).trim().toLowerCase()) {
        return true;
      }
      const subjectName = String(exam.subject?.subjectName || exam.subject || '').trim().toLowerCase();
      const groupSubjectMatch = Array.isArray(group.subjects) && group.subjects.some((subject) => String(subject || '').trim().toLowerCase() === subjectName);
      const classMatch = String(group.className || '').trim() === String(exam.class?.className || exam.class?.name || exam.class || '').trim();
      return groupSubjectMatch && classMatch;
    }) || null;
  };

  useEffect(() => {
    if (marksSelectedClass) {
      setMarksExams(exams.filter((exam) => {
        const examClassId = String(exam.class?._id || exam.class || '').trim();
        const examClassName = String(exam.class?.className || exam.class?.name || '').trim();
        const selectedClassLabel = String(marksSelectedClass || '').trim();
        return examClassId === selectedClassLabel || examClassName === selectedClassLabel || !selectedClassLabel;
      }));
      loadClassStudents(marksSelectedClass, currentUser, classes)
        .then((loadedStudents) => setMarksStudents(loadedStudents))
        .catch((error) => {
          console.error('Error fetching marks students:', error);
          setMarksStudents([]);
        });

      const selectedClass = classes.find((cls) => cls._id === marksSelectedClass);
      if (selectedClass) {
        const std = String(selectedClass.className || '').match(/\d+/)?.[0] || '';
        const section = String(selectedClass.section || '').trim().toUpperCase();
        if (std && section) {
          axios.get(apiUrl('/api/class/timetable'), {
            params: { std, section },
            timeout: 4000
          }).then((response) => {
            const schedule = response?.data?.data?.schedule || {};
            const subjectSet = new Set();
            Object.values(schedule).forEach((slots) => {
              (slots || []).forEach((slot) => {
                if (slot?.isBreak || !slot?.subject) return;
                subjectSet.add(String(slot.subject).trim());
              });
            });
            const subjectList = Array.from(subjectSet)
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b))
              .map((name) => ({ _id: name, subjectName: name }));
            setMarksSubjects(subjectList);
          }).catch(() => {
            setMarksSubjects([]);
          });
        }
      }
    }
  }, [marksSelectedClass, classes, currentUser, exams]);

  useEffect(() => {
    const loadMarksForExamGroup = async () => {
      if (!marksSelectedClass || !marksSelectedExamGroup || marksStudents.length === 0) {
        setMarksExamData({});
        return;
      }

      const token = localStorage.getItem('token');
      const group = marksExamGroups.find((item) => item.key === marksSelectedExamGroup);
      const examsForGroup = group?.exams || [];

      const nextData = {};
      await Promise.all(examsForGroup.map(async (exam) => {
        try {
          const subjectId = exam.subject?._id || exam.subject || '';
          const response = await axios.get(apiUrl('/api/teacher/marks'), {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
              classId: marksSelectedClass,
              examId: exam._id,
              subjectId
            },
            timeout: 1000
          });
          const rows = response?.data?.data || [];
          const cached = readMarksCache(exam._id);
          const marksByStudent = { ...(cached?.marksByStudent || {}) };
          rows.forEach((row) => {
            const studentId = row.student?._id || row.student?.studentId || row.student || '';
            if (studentId) marksByStudent[String(studentId)] = row.marksObtained;
          });
          nextData[exam._id] = {
            marksByStudent,
            totalMarks: rows[0]?.totalMarks || cached?.totalMarks || exam.totalMarks || 0
          };
        } catch {
          const cached = readMarksCache(exam._id);
          nextData[exam._id] = {
            marksByStudent: cached?.marksByStudent || {},
            totalMarks: cached?.totalMarks || exam.totalMarks || 0
          };
        }
      }));

      setMarksExamData(nextData);
    };

    loadMarksForExamGroup();
  }, [marksSelectedClass, marksSelectedExamGroup, marksStudents.length, marksExamGroups]);

  useEffect(() => {
    if (!marksExamTypeOptions.length) {
      setMarksSelectedExamType('');
      setMarksSelectedExamGroup('');
      return;
    }
    setMarksSelectedExamType((current) => {
      if (!current) return '';
      if (marksExamTypeOptions.some((option) => option.value === current)) {
        return current;
      }
      return '';
    });
  }, [marksExamTypeOptions]);

  useEffect(() => {
    if (!filteredMarksExamGroups.length) {
      setMarksSelectedExamGroup('');
      return;
    }
    setMarksSelectedExamGroup((current) => {
      if (!current) return '';
      if (filteredMarksExamGroups.some((group) => group.key === current)) {
        return current;
      }
      return '';
    });
  }, [filteredMarksExamGroups]);

  useEffect(() => {
    const matchedGroup = findMarksGroupForExam(selectedExam);
    if (matchedGroup?.key) {
      setMarksSelectedExamGroup(matchedGroup.key);
      if (matchedGroup.examTypeKey) {
        setMarksSelectedExamType(matchedGroup.examTypeKey);
      }
    }
  }, [selectedExam, marksExamGroups]);

  useEffect(() => {
    // Auto-select class for marks tab
    if (classes.length > 0 && !marksSelectedClass) {
      setMarksSelectedClass(classes[0]._id);
    }
  }, [classes]);

  const calcMarksGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const fetchClasses = async () => {
    try {
      const loadedClasses = await loadTeacherClasses(currentUser);
      setClasses(loadedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get(apiUrl('/api/teacher/exams'), {
        headers: buildTeacherHeaders(),
        timeout: 1000
      });
      const remoteExams = response.data.data || [];
      const localExams = loadLocalExams();
      const merged = mergeExams(remoteExams, localExams);
      setExams(merged);
      syncExamsToAdmin(merged);
    } catch (error) {
      console.error('Error fetching exams:', error);
      const localExams = loadLocalExams();
      setExams(localExams);
      syncExamsToAdmin(localExams);
    }
  };

  const fetchExamResults = async (examId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl(`/api/teacher/exams/${examId}/results`), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      setExamResults(response.data.data);
      // Initialize grading data
      const initialGrading = {};
      response.data.data.forEach(result => {
        initialGrading[result._id] = { marks: result.marksObtained, remarks: result.remarks };
      });
      const gradingKey = `grading-data-${examId}`;
      let savedGrading = {};
      const savedRaw = localStorage.getItem(gradingKey);
      if (savedRaw) {
        try { savedGrading = JSON.parse(savedRaw) || {}; } catch { /* ignore */ }
      }
      const mergedGrading = { ...initialGrading, ...savedGrading };
      setGradingData(mergedGrading);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      const selectedExamDetails = exams.find(e => e._id === examId) || { totalMarks: 100, passingMarks: 35 };
      const baseTotalMarks = selectedExamDetails.totalMarks;

      try {
        const token = localStorage.getItem('token');
        const subjectId = selectedExamDetails.subject?._id || selectedExamDetails.subject || '';
        const classId = selectedExamDetails.class?._id || selectedExamDetails.class || '';
        if (classId && subjectId) {
          const marksResponse = await axios.get(apiUrl('/api/teacher/marks'), {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
              classId,
              examId,
              subjectId
            },
            timeout: 1000
          });
          const serverResults = marksResponse?.data?.data || [];
          if (serverResults.length > 0) {
            setExamResults(serverResults.map((mark) => ({
              _id: mark._id,
              student: mark.student,
              marksObtained: mark.marksObtained,
              totalMarks: mark.totalMarks,
              passingMarks: selectedExamDetails.passingMarks,
              remarks: mark.remarks || ''
            })));
            const initialGrading = {};
            serverResults.forEach(mark => {
              initialGrading[mark._id] = { marks: mark.marksObtained, remarks: mark.remarks };
            });
            const gradingKey = `grading-data-${examId}`;
            let savedGrading = {};
            const savedRaw = localStorage.getItem(gradingKey);
            if (savedRaw) {
              try { savedGrading = JSON.parse(savedRaw) || {}; } catch { /* ignore */ }
            }
            const mergedGrading = { ...initialGrading, ...savedGrading };
            setGradingData(mergedGrading);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall back to local mock data.
      }

      // Check if graded marks already exist in localStorage
      const savedGradedKey = `graded-marks-${examId}`;
      const savedGraded = localStorage.getItem(savedGradedKey);
      let savedGradedMap = {};
      if (savedGraded) { try { savedGradedMap = JSON.parse(savedGraded); } catch { /* ignore */ } }

      const fallbackClassId = selectedExamDetails.class?._id || classes[0]?._id || marksSelectedClass || '';
      const fallbackStudents = await loadClassStudents(fallbackClassId, currentUser, classes);

      const mockResults = fallbackStudents.map((student, index) => ({
        _id: `MOCK_RES_${index + 1}`,
        student: {
          name: student.name,
          studentId: student.studentId
        },
        marksObtained: savedGradedMap[student.name]?.[selectedSubject] ?? '',
        totalMarks: baseTotalMarks,
        passingMarks: selectedExamDetails.passingMarks,
        remarks: ''
      }));

      setExamResults(mockResults);
      const initialGrading = {};
      mockResults.forEach(result => {
        initialGrading[result._id] = { marks: result.marksObtained, remarks: result.remarks };
      });
      const gradingKey = `grading-data-${examId}`;
      let savedGrading = {};
      const savedRaw = localStorage.getItem(gradingKey);
      if (savedRaw) {
        try { savedGrading = JSON.parse(savedRaw) || {}; } catch { /* ignore */ }
      }
      const mergedGrading = { ...initialGrading, ...savedGrading };
      setGradingData(mergedGrading);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const buildTeacherHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      return headers;
    }

    const teacherId = currentUser?._id || currentUser?.teacherId || currentUser?.id || currentUser?.email || '';
    headers['X-Teacher-Id'] = String(teacherId || '');
    headers['X-Teacher-Email'] = String(currentUser?.email || '');
    headers['X-Teacher-Name'] = String(currentUser?.name || currentUser?.fullName || '');
    headers['X-Teacher-Class'] = String(getAssignedTeacherClassNumber(currentUser) || currentUser?.assignedClass || '');
    headers['X-Teacher-Division'] = String(getAssignedTeacherSection(currentUser) || currentUser?.division || '');
    return headers;
  };

  const handleChapterChange = (subjectId, value) => {
    setSubjectChapters((prev) => ({
      ...prev,
      [subjectId]: value
    }));
    setSelectedSubjects((prev) => (prev.includes(subjectId) ? prev : [...prev, subjectId]));
  };

  const handleSubjectDateChange = (subjectId, value) => {
    setSubjectDates((prev) => ({
      ...prev,
      [subjectId]: value
    }));
    setSelectedSubjects((prev) => (prev.includes(subjectId) ? prev : [...prev, subjectId]));
  };

  const handleSubjectToggle = (subjectId) => {
    if (!subjectId) return;
    setSelectedSubjects((prev) => {
      if (formData._id) {
        return [subjectId];
      }
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      }
      return [...prev, subjectId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const chapterSubjects = Object.keys(subjectChapters || {}).filter((subjectId) => subjectChapters[subjectId]);
      const datedSubjects = Object.keys(subjectDates || {}).filter((subjectId) => subjectDates[subjectId]);
      const subjectIds = selectedSubjects.length
        ? selectedSubjects
        : ((chapterSubjects.length || datedSubjects.length) ? Array.from(new Set([...chapterSubjects, ...datedSubjects])) : (formData.subject ? [formData.subject] : []));

      if (subjectIds.length === 0) {
        alert('Please select at least one subject.');
        setLoading(false);
        return;
      }

      if (formData._id) {
        // Update existing exam
        await axios.put(apiUrl(`/api/teacher/exams/${formData._id}`), {
          ...formData,
          subject: subjectIds[0],
          chapter: subjectChapters[subjectIds[0]] || '',
          date: subjectDates[subjectIds[0]] || formData.date
        }, {
          headers: buildTeacherHeaders()
        });
        await fetchExams();
      } else {
        // Create new exam(s)
        const createdExams = [];
        for (const subjectId of subjectIds) {
          const response = await axios.post(apiUrl('/api/teacher/exams'), {
            ...formData,
            subject: subjectId,
            chapter: subjectChapters[subjectId] || '',
            date: subjectDates[subjectId] || formData.date
          }, {
            headers: buildTeacherHeaders()
          });
          const createdExam = response?.data?.data;
          if (createdExam) {
            createdExams.push(createdExam);
          }
        }

        if (createdExams.length > 0) {
          const localExams = loadLocalExams();
          const filtered = localExams.filter((exam) => !createdExams.some((created) => buildExamKey(created) === buildExamKey(exam)));
          saveLocalExams(filtered);
          const merged = mergeExams(createdExams, exams);
          setExams(merged);
          syncExamsToAdmin(merged);
        } else {
          await fetchExams();
        }
      }

      setFormData({
        examName: '',
        examType: 'quiz',
        subject: '',
        class: '',
        date: '',
        startTime: '',
        endTime: '',
        totalMarks: '',
        passingMarks: '',
        description: '',
        chapter: ''
      });
      setSelectedSubjects([]);
      setSubjectChapters({});
      setSubjectDates({});
      setShowForm(false);

      setLoading(false);
    } catch (error) {
      console.error('Error creating/updating exam:', error);

      // Fallback optimistic UI update for error scenario
      const subjectIds = selectedSubjects.length
        ? selectedSubjects
        : (formData.subject ? [formData.subject] : []);
      const fallbackSubjects = subjectIds.length ? subjectIds : [formData.subject || ''];
      const mockExams = fallbackSubjects.map((subjectId, index) => ({
        _id: `local_${Date.now()}_${index + 1}`,
        examName: formData.examName,
        examType: formData.examType,
        subject: subjects.find(s => s._id === subjectId) || { subjectName: 'Selected Subject' },
        class: classes.find(c => c._id === formData.class) || { className: getAssignedTeacherClassNumber(currentUser), section: getAssignedTeacherSection(currentUser) },
        date: subjectDates[subjectId] || formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'scheduled',
        totalMarks: formData.totalMarks,
        passingMarks: formData.passingMarks
      }));
      const localExams = loadLocalExams();
      saveLocalExams([...mockExams, ...localExams]);
      const merged = mergeExams(mockExams, exams);
      setExams(merged);
      syncExamsToAdmin(merged);
      setShowForm(false);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        if (String(id || '').startsWith('local_')) {
          const localExams = loadLocalExams();
          const filtered = localExams.filter((exam) => exam._id !== id);
          saveLocalExams(filtered);
          const merged = exams.filter((exam) => exam._id !== id);
          setExams(merged);
          syncExamsToAdmin(merged);
          return;
        }
        await axios.delete(apiUrl(`/api/teacher/exams/${id}`), {
          headers: buildTeacherHeaders()
        });
        syncExamsToAdmin(exams.filter((exam) => exam._id !== id));
        fetchExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const handleGradingChange = (resultId, field, value) => {
    setGradingData(prev => {
      const next = {
        ...prev,
        [resultId]: {
          ...prev[resultId],
          [field]: value
        }
      };
      if (selectedExam?._id) {
        localStorage.setItem(`grading-data-${selectedExam._id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const saveGradingToMarks = (resultId) => {
    // Save graded marks so Marks tab can read them
    const result = examResults.find(r => r._id === resultId);
    if (!result || !selectedSubject || !selectedExam) return;

    const studentId = result.student?.studentId || result._id;
    const studentName = result.student?.name || '';
    const examId = selectedExam._id;
    const subjectName = selectedSubject;
    const marksValue = gradingData[resultId]?.marks;

    // Key: graded-marks-{examId}
    const storageKey = `graded-marks-${examId}`;
    const saved = localStorage.getItem(storageKey);
    let gradedMap = {};
    if (saved) { try { gradedMap = JSON.parse(saved); } catch { /* ignore */ } }

    // Structure: { studentName: { subjectName: marks } }
    if (!gradedMap[studentName]) gradedMap[studentName] = {};
    gradedMap[studentName][subjectName] = Number(marksValue) || 0;

    localStorage.setItem(storageKey, JSON.stringify(gradedMap));
  };

  const persistGradeForResult = async (resultId, token) => {
    saveGradingToMarks(resultId);

    const result = examResults.find((item) => item._id === resultId);
    if (!result || !selectedExam) return;

    const subjectId = selectedExam.subject?._id || selectedExam.subject || '';
    const classId = selectedExam.class?._id || selectedExam.class || '';
    const studentId = result.student?._id || result.student?.studentId || result.studentId || '';
    if (!subjectId || !classId || !studentId) return;

    await axios.post(apiUrl('/api/teacher/marks'), {
      examId: selectedExam._id,
      subjectId,
      classId,
      marksData: [{
        studentId,
        marksObtained: Number(gradingData[resultId].marks) || 0,
        totalMarks: getResultTotalMarks(result),
        remarks: gradingData[resultId].remarks || ''
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const getResultTotalMarks = (result) => {
    if (!result) return Number(selectedExam?.totalMarks || 0) || 0;
    return Number(result.totalMarks || selectedExam?.totalMarks || 0) || 0;
  };

  const buildMarksCacheKey = (examId) => `teacher-marks-cache-${examId}`;

  const readMarksCache = (examId) => {
    const saved = localStorage.getItem(buildMarksCacheKey(examId));
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  };

  const syncMarksCacheForExam = (examId, rows, totalMarks) => {
    if (!examId) return;

    const marksByStudent = {};
    (rows || []).forEach((row) => {
      const value = Number(row?.marksObtained) || 0;
      const keys = [
        row?.student?._id,
        row?.student?.studentId,
        row?.studentId,
        row?.student,
        row?._id,
      ]
        .map((key) => String(key || '').trim())
        .filter(Boolean);

      keys.forEach((key) => {
        marksByStudent[key] = value;
      });
    });

    const payload = {
      marksByStudent,
      totalMarks: Number(totalMarks) || 0,
      updatedAt: Date.now(),
    };

    localStorage.setItem(buildMarksCacheKey(examId), JSON.stringify(payload));
    setMarksExamData((prev) => ({
      ...prev,
      [examId]: payload,
    }));
  };

  const findInvalidMarks = () => {
    const invalid = [];
    examResults.forEach((result) => {
      if (!isSubmissionComplete(result.status)) return;
      const valueRaw = gradingData[result._id]?.marks;
      if (valueRaw === '' || valueRaw === null || valueRaw === undefined) return;
      const value = Number(valueRaw);
      const total = getResultTotalMarks(result);
      if (!Number.isFinite(value) || value < 0 || (total && value > total)) {
        invalid.push({ result, value, total });
      }
    });
    return invalid;
  };

  const handleSaveAllGrades = async () => {
    if (!selectedExam || examResults.length === 0) return;

    try {
      const invalid = findInvalidMarks();
      if (invalid.length > 0) {
        alert('Obtained marks must be between 0 and total marks. Please fix the highlighted entries before saving.');
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('token');

      const subjectId = selectedExam.subject?._id || selectedExam.subject || '';
      const classId = selectedExam.class?._id || selectedExam.class || '';
      const marksPayload = [];

      for (const result of examResults) {
        if (!isSubmissionComplete(result.status)) continue;
        saveGradingToMarks(result._id);
        const studentId = result.student?._id || result.student?.studentId || result.studentId || '';
        if (!studentId) continue;
        marksPayload.push({
          studentId,
          marksObtained: Number(gradingData[result._id]?.marks) || 0,
          totalMarks: getResultTotalMarks(result),
          remarks: gradingData[result._id]?.remarks || ''
        });
      }

      if (subjectId && classId && marksPayload.length > 0) {
        await axios.post(apiUrl('/api/teacher/marks'), {
          examId: selectedExam._id,
          subjectId,
          classId,
          marksData: marksPayload
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (selectedExam?._id) {
        localStorage.setItem(`grading-data-${selectedExam._id}`, JSON.stringify(gradingData));
        syncMarksCacheForExam(selectedExam._id, examResults.map((result) => ({
          ...result,
          student: result.student,
          marksObtained: Number(gradingData[result._id]?.marks) || 0,
        })), getResultTotalMarks(examResults[0]));
      }
      await fetchExamResults(selectedExam._id);
      setLoading(false);
    } catch (error) {
      console.error('Error saving all grades:', error);
      setLoading(false);
    }
  };

  const handleMarkAllGood = () => {
    if (!selectedExam) return;

    setGradingData((prev) => {
      const updated = { ...prev };
      examResults.forEach((result) => {
        updated[result._id] = {
          ...(updated[result._id] || { marks: '', remarks: '' }),
          remarks: 'Good'
        };
      });
      localStorage.setItem(`grading-data-${selectedExam._id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleGradeStudent = async (resultId) => {
    try {
      const result = examResults.find((item) => item._id === resultId);
      const total = getResultTotalMarks(result);
      const valueRaw = gradingData[resultId]?.marks;
      const value = valueRaw === '' || valueRaw === null || valueRaw === undefined ? '' : Number(valueRaw);
      if (value !== '' && (!Number.isFinite(value) || value < 0 || (total && value > total))) {
        alert('Obtained marks must be between 0 and total marks.');
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('token');

      await persistGradeForResult(resultId, token);

      if (selectedExam) {
        syncMarksCacheForExam(selectedExam._id, examResults.map((row) => ({
          ...row,
          marksObtained: Number(gradingData[row._id]?.marks) || 0,
        })), getResultTotalMarks(result));
      }

      fetchExamResults(selectedExam._id);
      setLoading(false);
    } catch (error) {
      console.error('Error updating grade:', error);
      setLoading(false);
    }
  };


  const publishResults = async (examId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.post(apiUrl(`/api/teacher/exams/${examId}/publish-results`), {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Results published successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Error publishing results:', error);
      setLoading(false);
    }
  };

  const exportResults = () => {
    try {
      if (!exams || exams.length === 0) {
        alert('No exam data available to export');
        return;
      }

      // Prepare data for export
      const exportData = exams.map(exam => ({
        'Exam Name': exam.examName,
        'Type': exam.examType.replace('_', ' '),
        'Subject': exam.subject?.subjectName || 'N/A',
        'Class': `${exam.class?.className || 'N/A'} - ${exam.class?.section || 'N/A'}`,
        'Date': new Date(exam.date).toLocaleDateString(),
        'Time': `${exam.startTime} - ${exam.endTime}`,
        'Total Marks': exam.totalMarks,
        'Passing Marks': exam.passingMarks,
        'Status': exam.status
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Exam List");

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `Exam_List_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Failed to export results. Please try again.');
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Exam & Marks Management</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Schedule exams and manage marks</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'exams' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Exam
            </button>
          )}
          {activeTab === 'analytics' && (
            <button
              onClick={exportResults}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Results
            </button>
          )}
          {activeTab === 'marks' && null}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100/80 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'exams'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <BookOpen className="h-4 w-4" />
            Exams
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'grading'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <CheckCircle className="h-4 w-4" />
            Grading
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'marks'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Award className="h-4 w-4" />
            Marks
          </button>
        </div>

        <div className="p-6">
          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              {/* Upcoming Exams Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exams
                  .filter(e => new Date(e.date) >= new Date())
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(exam => (
                  <div key={exam._id} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold uppercase py-1 px-2 bg-white/30 rounded-full">Upcoming</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1 truncate">{exam.examName}</h4>
                    <p className="text-blue-100 text-sm mb-4">{exam.class?.className} - {exam.class?.section} • {exam.subject?.subjectName}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.startTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(exam.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Exam</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Name *</label>
                        <input
                          type="text"
                          name="examName"
                          value={formData.examName}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter exam name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                        <select
                          name="class"
                          value={formData.class}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls._id} value={cls._id}>
                              {cls.className} - {cls.section}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type *</label>
                        <select
                          name="examType"
                          value={formData.examType}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="unit_test">Unit Test</option>
                          <option value="mid_term">Mid Term</option>
                          <option value="final_exam">Final Exam</option>
                          <option value="quiz">Quiz</option>
                          <option value="practical">Practical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subjects *</label>
                      <div className={`p-4 border border-gray-300 rounded-xl ${!formData.class ? 'bg-gray-100' : 'bg-gradient-to-br from-white to-blue-50/40'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {subjects.map((subject) => {
                            const active = selectedSubjects.includes(subject._id);
                            return (
                              <div key={subject._id} className={`rounded-xl border ${active ? 'border-blue-200 bg-white shadow-sm' : 'border-gray-200 bg-white/80'} p-3`}> 
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    disabled={!formData.class}
                                    onClick={() => handleSubjectToggle(subject._id)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${active
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'} ${!formData.class ? 'opacity-60' : ''}`}
                                  >
                                    {subject.subjectName}
                                  </button>
                                  <span className="text-[10px] text-gray-400">Chapter + Date</span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <input
                                    type="text"
                                    value={subjectChapters[subject._id] || ''}
                                    onChange={(e) => handleChapterChange(subject._id, e.target.value)}
                                    disabled={!formData.class}
                                    className={`w-28 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!formData.class ? 'bg-gray-100' : ''}`}
                                    placeholder="Chapter"
                                  />
                                  <input
                                    type="date"
                                    value={subjectDates[subject._id] || ''}
                                    onChange={(e) => handleSubjectDateChange(subject._id, e.target.value)}
                                    disabled={!formData.class}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!formData.class ? 'bg-gray-100' : ''}`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {subjects.length === 0 && (
                            <span className="text-xs text-gray-400">No subjects available</span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Subjects can appear side-by-side with chapter and date inputs.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks *</label>
                        <input
                          type="number"
                          name="totalMarks"
                          value={formData.totalMarks}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Total marks"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks *</label>
                        <input
                          type="number"
                          name="passingMarks"
                          value={formData.passingMarks}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Passing marks"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Exam description"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {loading ? 'Saving...' : formData._id ? 'Update Exam' : 'Create Exam'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setFormData({
                            examName: '',
                            examType: 'quiz',
                            subject: '',
                            class: '',
                            date: '',
                            startTime: '',
                            endTime: '',
                            totalMarks: '',
                            passingMarks: '',
                            description: '',
                            chapter: ''
                          });
                          setSelectedSubjects([]);
                          setSubjectChapters({});
                          setSubjectDates({});
                        }}
                        className="px-6 py-3 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}


          {/* Grading Tab */}
          {activeTab === 'grading' && (
            <div>
              {!selectedSubject ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(subjects.length ? subjects : []).map((subj, index) => {
                    const palette = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-indigo-500', 'bg-red-500'];
                    const color = palette[index % palette.length];
                    const name = subj.subjectName || '';
                    return (
                    <div
                      key={subj._id || name}
                      onClick={() => setSelectedSubject(name)}
                      className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                    >
                      <div className={`${color} p-8 flex flex-col items-center justify-center text-center`}>
                        <div className="mb-4 bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-white uppercase tracking-wider">{name}</h4>
                      </div>
                      <div className="p-4 bg-gray-50 text-center text-gray-600 text-sm font-medium border-t flex justify-between items-center group-hover:bg-blue-50">
                        <span>View Grading</span>
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  )})}
                  {subjects.length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-8">No subjects found for this class.</div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedSubject(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5 text-gray-500 rotate-45" /> {/* Using rotate as back button */}
                      </button>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">{selectedSubject}</span>
                          Grading Sheet
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Class: 8 - B</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-gray-50 px-4 py-2 rounded-lg border">
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Exam Name</label>
                        <select
                          className="bg-transparent text-sm font-semibold outline-none"
                          onChange={(e) => {
                            const exam = exams.find(ex => ex._id === e.target.value);
                            setSelectedExam(exam);
                            if (exam) fetchExamResults(exam._id);
                          }}
                          value={selectedExam?._id || ''}
                        >
                          <option value="">Select Exam</option>
                          {exams.filter(e => e.subject?.subjectName === selectedSubject || e.subject === selectedSubject).map(exam => (
                            <option key={exam._id} value={exam._id}>{exam.examName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 rounded-lg border">
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Exam Date</label>
                        <div className="text-sm font-semibold">
                          {selectedExam ? new Date(selectedExam.date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                {selectedExam ? (
                  <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">Student Results</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Quick remark fill for all rows</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMarkAllGood}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                          title="Fill Good remark for all results"
                        >
                          <span className="text-base leading-none">🙂</span>
                          All Good
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAllGrades}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
                          title="Save all grades"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Save All Grades
                        </button>
                      </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-4 font-semibold text-gray-600">Roll No</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Subject</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Total Marks</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Obtained Marks</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Remarks</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examResults.map((result, index) => {
                            const percentage = ((result.marksObtained / result.totalMarks) * 100).toFixed(2);
                            const grade = getGrade(percentage);

                            return (
                              <tr key={result._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="px-6 py-4 text-blue-600 font-medium">#{index + 1}</td>
                                <td className="px-6 py-4 font-semibold text-gray-800">
                                  {result.student?.name}
                                  <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{result.student?.studentId}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{selectedSubject}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-bold">{result.totalMarks}</td>
                                <td className="px-6 py-4">
                                  <input
                                    type="number"
                                    min="0"
                                    max={result.totalMarks}
                                    value={gradingData[result._id]?.marks || ''}
                                    onChange={(e) => handleGradingChange(result._id, 'marks', e.target.value)}
                                    className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-blue-600"
                                    placeholder="Marks"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={gradingData[result._id]?.remarks || ''}
                                    onChange={(e) => handleGradingChange(result._id, 'remarks', e.target.value)}
                                    className="w-full min-w-[150px] p-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Enter feedback..."
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleGradeStudent(result._id)}
                                    disabled={loading}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md disabled:bg-gray-400"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-gray-700 mb-2">No Exam Selected</h4>
                      <p className="text-gray-500">Please select an exam from the dropdown above to start grading for {selectedSubject}.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Marks Tab */}
          {activeTab === 'marks' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/60">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-500">Marks Entry</p>
                      <h3 className="mt-1 text-lg font-bold text-gray-800">Select an exam to open subject-wise columns</h3>
                      <p className="mt-1 text-sm text-gray-500">Each exam group opens as one table with all its subjects.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                      {marksExamGroups.length} exam{marksExamGroups.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="p-5 border-b border-gray-100">
                  <div className="max-w-3xl grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-2">
                        Select Exam Type
                      </label>
                      <select
                        value={marksSelectedExamType}
                        onChange={(e) => setMarksSelectedExamType(e.target.value)}
                        disabled={marksExamTypeOptions.length === 0}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {marksExamTypeOptions.length === 0 ? (
                          <option value="">No exam types</option>
                        ) : (
                          <>
                            <option value="">Select Exam Type</option>
                            {marksExamTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-2">
                        Select Exam Name
                      </label>
                      <select
                        value={marksSelectedExamGroup}
                        onChange={(e) => setMarksSelectedExamGroup(e.target.value)}
                        disabled={filteredMarksExamGroups.length === 0}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {filteredMarksExamGroups.length === 0 ? (
                          <option value="">No exams for this type</option>
                        ) : (
                          <>
                            <option value="">Select Exam</option>
                            {filteredMarksExamGroups.map((group) => (
                              <option key={group.key} value={group.key}>
                                {(() => {
                                  const examName = group.examName || 'Exam';
                                  const subjects = group.subjects && group.subjects.length
                                    ? group.subjects
                                    : ['Subject'];
                                  return [examName, ...subjects].join('\n');
                                })()}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  {marksExamGroups.length === 0 && (
                    <p className="mt-3 text-sm text-gray-400">Exam ka data abhi load nahi hua ya is class ke liye exam publish nahi hua.</p>
                  )}
                </div>
              </div>

              {!selectedMarksExamGroup ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                  Select an exam from the dropdown above to view its subject-wise marks sheet.
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-white">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-500">Selected Exam</p>
                        <h3 className="mt-1 text-xl font-bold text-gray-800">{selectedMarksExamGroup.examName || 'Exam'}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {selectedMarksExamGroup.subjects && selectedMarksExamGroup.subjects.length
                            ? selectedMarksExamGroup.subjects.join(' | ')
                            : 'Subject'}
                          {selectedMarksExamGroup.date ? ` - ${formatDate(selectedMarksExamGroup.date)}` : ''}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        {selectedMarksGroupColumns.length} subject{selectedMarksGroupColumns.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 sticky left-0 bg-gray-50 z-20">#</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 sticky left-16 bg-gray-50 z-20 border-r border-gray-100">Student Name</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">Section</th>
                          {selectedMarksGroupColumns.map((column, index) => {
                            const palette = [
                              'bg-indigo-100 text-indigo-700',
                              'bg-blue-100 text-blue-700',
                              'bg-emerald-100 text-emerald-700',
                              'bg-fuchsia-100 text-fuchsia-700',
                              'bg-amber-100 text-amber-700',
                              'bg-rose-100 text-rose-700',
                              'bg-violet-100 text-violet-700',
                              'bg-cyan-100 text-cyan-700',
                            ];
                            const themeClass = palette[index % palette.length];
                            return (
                              <th key={column.examId} className={`px-6 py-4 text-[10px] uppercase tracking-widest font-bold ${themeClass}`}>
                                <div className="truncate">{column.subjectName}</div>
                                <div className="mt-1 text-[9px] opacity-75">/ {column.totalMarks || '-'}</div>
                              </th>
                            );
                          })}
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 text-center bg-gray-50">Total</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 text-center bg-gray-50">%</th>
                          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 text-center bg-gray-50">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {marksStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6 + selectedMarksGroupColumns.length} className="px-6 py-10 text-center text-gray-400">
                              No students found for this class.
                            </td>
                          </tr>
                        ) : selectedMarksGroupColumns.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                              No subjects are linked to the selected exam.
                            </td>
                          </tr>
                        ) : marksStudents.map((student, index) => {
                          const cells = selectedMarksGroupColumns.map((column) => {
                            const examData = marksExamData[column.examId] || { marksByStudent: {}, totalMarks: column.totalMarks || 0 };
                            const studentKeys = getStudentLookupKeys(student);
                            const obtained = studentKeys
                              .map((key) => examData.marksByStudent[key] ?? selectedExamMarksLookup[key])
                              .find((value) => value !== undefined && value !== null && value !== '') ?? '';
                            const totalMarks = examData.totalMarks || column.totalMarks || 0;
                            return {
                              subjectName: column.subjectName,
                              obtained,
                              totalMarks,
                            };
                          });
                          const totalObtained = cells.reduce((sum, cell) => sum + (Number(cell.obtained) || 0), 0);
                          const maxTotal = cells.reduce((sum, cell) => sum + (Number(cell.totalMarks) || 0), 0);
                          const percentage = maxTotal ? Math.round((totalObtained / maxTotal) * 100) : 0;
                          const grade = calcMarksGrade(percentage);

                          return (
                            <tr key={student._id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-6 py-4 font-mono text-blue-600 text-sm sticky left-0 bg-white z-10">{String(index + 1).padStart(2, '0')}</td>
                              <td className="px-6 py-4 sticky left-16 bg-white z-10 border-r border-gray-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                <div className="font-bold text-gray-800 text-sm">{student.name}</div>
                                <div className="text-[9px] text-gray-400 font-medium uppercase mt-0.5 tracking-tighter">{student.studentId}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">{student.section || profile?.section || profile?.division || 'A'}</td>
                              {cells.map((cell) => (
                                <td key={`${student._id}-${cell.subjectName}`} className="px-6 py-4 text-center">
                                  <span className="inline-flex min-w-[42px] justify-center rounded-lg bg-gray-50 px-3 py-1 text-sm font-bold text-gray-700">
                                    {cell.obtained === '' ? '-' : cell.obtained}
                                  </span>
                                </td>
                              ))}
                              <td className="px-6 py-4 text-center bg-gray-50">
                                <span className="font-extrabold text-gray-900 text-sm">{totalObtained}</span>
                              </td>
                              <td className="px-6 py-4 text-center bg-gray-50">
                                <span className="font-extrabold text-emerald-700 text-sm">{percentage}%</span>
                              </td>
                              <td className="px-6 py-4 text-center bg-gray-50">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ring-1 ring-inset ${
                                  grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
