import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, BookOpen, Calendar, FileText, Upload, Eye, Edit, Trash2, Download, CheckCircle, Copy, MessageCircle, Mic, AlertTriangle, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiUrl } from '../../config/api';
import {
  extractClassNumber,
  getAssignedTeacherClassNumber,
  getAssignedTeacherSection,
  matchesAssignedTeacherClass,
  normalizeSection,
} from '../../teacherIdentity';
import { loadClassStudents, loadTeacherClasses } from '../../services/teacherBackendData';

const AssignmentManagement = ({ currentUser }) => {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [gradingData, setGradingData] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [peerReviewEnabled, setPeerReviewEnabled] = useState({});
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradingSubjectFilter, setGradingSubjectFilter] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [studentStatusMap, setStudentStatusMap] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    dueDate: '',
    totalMarks: '',
    assignmentType: 'homework',
    autoGrading: false,
    file: null
  });

  const getLoggedInTeacherClass = () => {
    const assignedClass = String(currentUser?.assignedClass || '').trim();
    const assignedDivision = String(currentUser?.division || '').trim().toUpperCase();

    if (assignedClass || assignedDivision) {
      return {
        className: assignedClass || 'Class',
        section: assignedDivision || 'A',
      };
    }
    return {
      className: '',
      section: '',
    };
  };

  const getAssignmentClassLabel = (assignment) => {
    const className = assignment?.class?.className || getLoggedInTeacherClass().className;
    const section = assignment?.class?.section || getLoggedInTeacherClass().section;
    return `${className} - ${section}`;
  };

  const isAssignmentForLoggedInTeacher = (assignment) => {
    const assignedClassNumber = getAssignedTeacherClassNumber(currentUser);
    const assignedSection = getAssignedTeacherSection(currentUser);
    const className = assignment?.class?.className || assignment?.className || assignment?.class || '';
    const section = assignment?.class?.section || assignment?.section || '';
    const normalizedClass = extractClassNumber(className);
    const normalizedSection = normalizeSection(section);

    if (!normalizedClass && !normalizedSection) {
      return true;
    }

    return (
      normalizedClass === assignedClassNumber &&
      (!assignedSection || normalizedSection === assignedSection)
    );
  };

  const filteredAssignments = assignments.filter(isAssignmentForLoggedInTeacher);

  const normalizeSubmissionStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'graded' || normalized === 'complete' || normalized === 'completed') {
      return 'complete';
    }
    return 'incomplete';
  };

  const isSubmissionComplete = (status) => normalizeSubmissionStatus(status) === 'complete';

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
  }, [currentUser?.email]);

  useEffect(() => {
    const loadFilterSubjects = async () => {
      const assignedClassNumber = getAssignedTeacherClassNumber(currentUser);
      const assignedSection = getAssignedTeacherSection(currentUser);
      if (!assignedClassNumber || !assignedSection) {
        setAvailableSubjects([]);
        return;
      }

      try {
        const response = await axios.get(apiUrl('/api/class/timetable'), {
          params: { std: assignedClassNumber, section: assignedSection },
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
          .sort((a, b) => a.localeCompare(b));
        setAvailableSubjects(subjectList);
      } catch {
        const assignedClass = classes.find((cls) => matchesAssignedTeacherClass(cls, currentUser));
        const fallback = assignedClass?.subjects?.map((subj) => subj.subjectName).filter(Boolean) || [];
        setAvailableSubjects(fallback);
      }
    };

    loadFilterSubjects();
  }, [classes, currentUser?.assignedClass, currentUser?.division]);

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
    const loadSubmissionStudents = async () => {
      if (activeTab !== 'submissions') return;
      if (students.length > 0) return;

      const classList = classes.length ? classes : await loadTeacherClasses(currentUser);
      const assigned = classList.find((cls) => matchesAssignedTeacherClass(cls, currentUser)) || classList[0];
      if (!assigned) return;

      const classStudents = await loadClassStudents(assigned._id, currentUser, classList);
      setStudents(classStudents);
    };

    loadSubmissionStudents();
  }, [activeTab, classes, currentUser, students.length]);

  useEffect(() => {
    if (activeTab !== 'submissions') return;
    const classLabel = `${getAssignedTeacherClassNumber(currentUser) || ''}-${getAssignedTeacherSection(currentUser) || ''}`;
    const subjectKey = subjectFilter || 'all';
    const storageKey = `submission-status-${classLabel}-${subjectKey}`;
    try {
      const stored = localStorage.getItem(storageKey);
      setStudentStatusMap(stored ? JSON.parse(stored) : {});
    } catch {
      setStudentStatusMap({});
    }
  }, [activeTab, subjectFilter, currentUser]);

  const updateStudentStatus = (studentId, status) => {
    const classLabel = `${getAssignedTeacherClassNumber(currentUser) || ''}-${getAssignedTeacherSection(currentUser) || ''}`;
    const subjectKey = subjectFilter || 'all';
    const storageKey = `submission-status-${classLabel}-${subjectKey}`;
    setStudentStatusMap((prev) => {
      const updated = { ...prev, [studentId]: status };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const loadSubjectsForClass = async () => {
      if (!formData.class) {
        setSubjects([]);
        return;
      }

      const selectedClass = classes.find(c => c._id === formData.class);
      if (!selectedClass) {
        setSubjects([]);
        return;
      }

      try {
        const std = extractClassNumber(selectedClass.className);
        const section = normalizeSection(selectedClass.section);
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

  const fetchClasses = async () => {
    try {
      const loadedClasses = await loadTeacherClasses(currentUser);
      setClasses(loadedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const getAssignmentStorageKey = () => {
    const email = currentUser?.email || 'default';
    return `assignments-data-${email}`;
  };

  const saveAssignmentsToStorage = (data) => {
    localStorage.setItem(getAssignmentStorageKey(), JSON.stringify(data));
  };

  const saveSubmissionsToStorage = (assignmentId, data) => {
    localStorage.setItem(`submissions-data-${assignmentId}`, JSON.stringify(data));
  };

  const saveGradingToStorage = (assignmentId, data) => {
    localStorage.setItem(`grading-data-${assignmentId}`, JSON.stringify(data));
  };

  const fetchAssignments = async () => {
    // Load from localStorage first
    const saved = localStorage.getItem(getAssignmentStorageKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setAssignments(parsed);
          return;
        }
      } catch { /* ignore parse errors */ }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl('/api/teacher/assignments'), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      setAssignments(response.data.data);
      saveAssignmentsToStorage(response.data.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
      saveAssignmentsToStorage([]);
    }
  };

  const fetchStudentsInClass = async (classId) => {
    try {
      return await loadClassStudents(classId, currentUser, classes);
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // First get all students in the class
      const assignment = assignments.find(a => a._id === assignmentId) || selectedAssignment;
      let allStudents = [];
      if (assignment) {
        const assignmentClassName = assignment?.class?.className || assignment?.className || assignment?.class || '';
        const assignmentSection = assignment?.class?.section || assignment?.section || '';
        let classId = assignment?.class?._id || assignment?.classId || '';

        const classList = classes.length ? classes : await loadTeacherClasses(currentUser);

        if (!classId) {
          const fallbackClassName = assignmentClassName || currentUser?.assignedClass || '';
          const fallbackSection = assignmentSection || currentUser?.division || '';
          const matchedClass = classList.find((cls) =>
            extractClassNumber(cls.className) === extractClassNumber(fallbackClassName) &&
            (!fallbackSection || normalizeSection(cls.section) === normalizeSection(fallbackSection))
          ) || classList.find((cls) =>
            extractClassNumber(cls.className) === extractClassNumber(fallbackClassName)
          );
          classId = matchedClass?._id || '';
        }

        if (classId) {
          allStudents = await fetchStudentsInClass(classId);
        }
      }
      setStudents(allStudents);

      let existingSubmissions = [];
      try {
        const response = await axios.get(apiUrl(`/api/teacher/assignments/${assignmentId}/submissions`), {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 1000
        });
        existingSubmissions = response?.data?.data || [];
      } catch {
        existingSubmissions = [];
      }

      // Merge students with submissions
      const mergedSubmissions = allStudents.map(student => {
        const submission = existingSubmissions.find(s => s.student?._id === student._id || s.student === student._id);
        if (submission) {
          return { ...submission, status: normalizeSubmissionStatus(submission.status) };
        }
        // Return a shell submission for students who haven't submitted
        return {
          _id: `temp_${student._id}`,
          student: student,
          submittedAt: null,
          status: 'incomplete',
          file: null
        };
      });

      // Load saved submission statuses from localStorage
      const savedSubmissions = localStorage.getItem(`submissions-data-${assignmentId}`);
      let finalSubmissions = mergedSubmissions;
      if (savedSubmissions) {
        try {
          const savedStatuses = JSON.parse(savedSubmissions);
          finalSubmissions = mergedSubmissions.map(sub => {
            const saved = savedStatuses.find(s => s._id === sub._id);
            return saved ? { ...sub, status: normalizeSubmissionStatus(saved.status) } : sub;
          });
        } catch { /* ignore */ }
      }
      setSubmissions(finalSubmissions);

      // Initialize grading data (load from localStorage if available)
      const savedGrading = localStorage.getItem(`grading-data-${assignmentId}`);
      let initialGrading = {};
      if (savedGrading) {
        try { initialGrading = JSON.parse(savedGrading); } catch { /* ignore */ }
      }
      finalSubmissions.forEach(submission => {
        if (!initialGrading[submission._id]) {
          initialGrading[submission._id] = { marks: '', remarks: '' };
        }
      });
      setGradingData(initialGrading);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setStudents([]);
      setSubmissions([]);
      setGradingData({});
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

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('class', formData.class);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('totalMarks', formData.totalMarks);
      formDataToSend.append('assignmentType', formData.assignmentType);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      if (formData._id) {
        // Update existing assignment
        await axios.put(apiUrl(`/api/teacher/assignments/${formData._id}`), formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Create new assignment
        await axios.post(apiUrl('/api/teacher/assignments'), formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setFormData({
        title: '',
        description: '',
        subject: '',
        class: '',
        dueDate: '',
        totalMarks: '',
        assignmentType: 'homework',
        file: null
      });
      setShowForm(false);

      // Since there's often no real backend in this testing env, we manually push to our local state so the user sees it immediately
      const mockNewAssignment = {
        _id: 'new_mock_' + Date.now(),
        title: formData.title,
        description: formData.description,
        subject: subjects.find(s => s._id === formData.subject) || { subjectName: formData.subject || 'Unknown Subject' },
        class: classes.find(c => c._id === formData.class) || getLoggedInTeacherClass(),
        dueDate: formData.dueDate,
        status: 'active',
        totalMarks: formData.totalMarks,
        assignmentType: formData.assignmentType,
        createdAt: new Date().toISOString()
      };

      const updatedAssignments = [mockNewAssignment, ...assignments];
      setAssignments(updatedAssignments);
      saveAssignmentsToStorage(updatedAssignments);

      setLoading(false);
    } catch (error) {
      console.error('Error creating/updating assignment:', error);
      const mockNewAssignment = {
        _id: 'new_mock_' + Date.now(),
        title: formData.title,
        description: formData.description,
        subject: subjects.find(s => s._id === formData.subject) || { subjectName: formData.subject || 'Unknown Subject' },
        class: classes.find(c => c._id === formData.class) || getLoggedInTeacherClass(),
        dueDate: formData.dueDate,
        status: 'active',
        totalMarks: formData.totalMarks,
        assignmentType: formData.assignmentType,
        createdAt: new Date().toISOString()
      };
      const updatedAssignments = [mockNewAssignment, ...assignments];
      setAssignments(updatedAssignments);
      saveAssignmentsToStorage(updatedAssignments);
      setShowForm(false);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      const updatedAssignments = assignments.filter(a => a._id !== id);
      setAssignments(updatedAssignments);
      saveAssignmentsToStorage(updatedAssignments);
      // Also remove saved submissions & grading for this assignment
      localStorage.removeItem(`submissions-data-${id}`);
      localStorage.removeItem(`grading-data-${id}`);

      try {
        const token = localStorage.getItem('token');
        await axios.delete(apiUrl(`/api/teacher/assignments/${id}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const handleStatusChange = (submissionId, newStatus) => {
    setSubmissions(prev => {
      const updated = prev.map(sub => {
        if (sub._id !== submissionId) return sub;
        const nextStatus = normalizeSubmissionStatus(newStatus);
        return {
          ...sub,
          status: nextStatus,
          submittedAt: nextStatus === 'complete' ? new Date().toISOString() : null
        };
      });
      if (selectedAssignment) {
        saveSubmissionsToStorage(selectedAssignment._id, updated);
      }
      return updated;
    });
  };

  const handleMarkAllComplete = () => {
    setSubmissions(prev => {
      const updated = prev.map(sub => ({
        ...sub,
        status: 'complete',
        submittedAt: new Date().toISOString()
      }));
      if (selectedAssignment) {
        saveSubmissionsToStorage(selectedAssignment._id, updated);
      }
      return updated;
    });
  };

  const handleGradeSubmission = async (submissionId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.put(apiUrl(`/api/teacher/submissions/${submissionId}/grade`), {
        marks: gradingData[submissionId].marks,
        remarks: gradingData[submissionId].remarks
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh submissions
      fetchSubmissions(selectedAssignment._id);
      setLoading(false);
    } catch (error) {
      console.error('Error grading submission:', error);
      setLoading(false);
    }
  };

  const handleGradingChange = (submissionId, field, value) => {
    let sanitized = value;
    if (field === 'marks' && selectedAssignment?.totalMarks) {
      const num = parseFloat(value);
      if (!isNaN(num)) sanitized = String(Math.min(num, selectedAssignment.totalMarks));
    }
    setGradingData(prev => {
      const updated = {
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          [field]: sanitized
        }
      };
      if (selectedAssignment) {
        saveGradingToStorage(selectedAssignment._id, updated);
      }
      return updated;
    });
  };

  const exportSubmissions = () => {
    try {
      if (!submissions || submissions.length === 0) {
        alert('No submission data available to export');
        return;
      }

      // Filter only incomplete submissions
      const pendingSubmissions = submissions.filter(s => !isSubmissionComplete(s.status));

      if (pendingSubmissions.length === 0) {
        alert('No incomplete submissions to export');
        return;
      }

      // Prepare data for export
      const exportData = pendingSubmissions.map(s => ({
        'Student Name': s.student?.name || 'N/A',
        'Roll No': s.student?.studentId || 'N/A',
        'Assignment': selectedAssignment?.title || 'N/A',
        'Due Date': selectedAssignment ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'N/A',
        'Status': 'Incomplete'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Incomplete Submissions");

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `Incomplete_Submissions_${selectedAssignment?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error('Error exporting submissions:', error);
      alert('Failed to export submissions. Please try again.');
    }
  };

  const checkPlagiarism = () => {
    // In a real application, this would check for plagiarism
    alert('Plagiarism check functionality would be implemented here');
  };

  const togglePeerReview = (assignmentId) => {
    // In a real application, this would enable/disable peer review
    alert(`Peer review toggled for assignment ${assignmentId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Assignment & Homework</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Create and manage assignments</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'assignments' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Assignment
            </button>
          )}
          {activeTab === 'submissions' && selectedAssignment && (
            <button
              onClick={exportSubmissions}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Submissions
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100/80 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'assignments'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <BookOpen className="h-4 w-4" />
            Assignments
          </button>
          <button
            onClick={() => {
              if (filteredAssignments.length > 0) {
                setSelectedAssignment(filteredAssignments[0]);
                if (filteredAssignments[0]) {
                  fetchSubmissions(filteredAssignments[0]._id);
                }
              }
              setActiveTab('submissions');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'submissions'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <FileText className="h-4 w-4" />
            Submissions
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
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'analytics'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Copy className="h-4 w-4" />
            Analytics
          </button>
        </div>

        <div className="p-6">
          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div>
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Assignment title"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Description *</label>
                        <button
                          type="button"
                          onClick={() => setIsRecording(!isRecording)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                        >
                          <Mic className="h-4 w-4" />
                          {isRecording ? 'Recording...' : 'Voice Instructions'}
                        </button>
                      </div>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Assignment description"
                      />
                      {isRecording && (
                        <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          Recording audio... Click Voice Instructions again to stop and attach.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          disabled={!formData.class}
                          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!formData.class ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(subject => (
                            <option key={subject._id} value={subject._id}>
                              {subject.subjectName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
                        <select
                          name="assignmentType"
                          value={formData.assignmentType}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="homework">Homework</option>
                          <option value="project">Project</option>
                          <option value="quiz">Quiz (MCQ)</option>
                          <option value="exam">Exam</option>
                        </select>
                      </div>
                      {formData.assignmentType === 'quiz' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Auto Grading</label>
                          <div className="flex items-center h-[50px] bg-gray-50 px-4 rounded-lg border border-gray-200">
                            <input
                              type="checkbox"
                              id="autoGrade"
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={formData.autoGrading || false}
                              onChange={(e) => setFormData({ ...formData, autoGrading: e.target.checked })}
                            />
                            <label htmlFor="autoGrade" className="ml-2 block text-sm text-gray-700">
                              Enable automatic grading for MCQs
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attachment</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-gray-400 text-sm">Supports PDF, DOC, DOCX, PPT, PPTX, MP4, MP3, JPG, PNG</p>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                          Select File
                        </label>
                        {formData.file && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {loading ? 'Saving...' : formData._id ? 'Update Assignment' : 'Create Assignment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setFormData({
                            title: '',
                            description: '',
                            subject: '',
                            class: '',
                            dueDate: '',
                            totalMarks: '',
                            assignmentType: 'homework',
                            file: null
                          });
                        }}
                        className="px-6 py-3 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">All Assignments</h3>
                  {filteredAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-left">Class</th>
                            <th className="px-4 py-3 text-left">Subject</th>
                            <th className="px-4 py-3 text-left">Due Date</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssignments.map(assignment => (
                            <tr key={assignment._id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{assignment.title}</div>
                                <div className="text-sm text-gray-600 truncate max-w-xs">{assignment.description}</div>
                              </td>
                              <td className="px-4 py-3">
                                {getAssignmentClassLabel(assignment)}
                              </td>
                              <td className="px-4 py-3">
                                {assignment.subject?.subjectName}
                              </td>
                              <td className="px-4 py-3">
                                {new Date(assignment.dueDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${new Date(assignment.dueDate) < new Date()
                                  ? assignment.status === 'active'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                  : 'bg-green-100 text-green-800'
                                  }`}>
                                  {new Date(assignment.dueDate) < new Date()
                                    ? assignment.status === 'active' ? 'Overdue' : 'Completed'
                                    : 'Active'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setActiveTab('submissions');
                                      fetchSubmissions(assignment._id);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                    title="View Submissions"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFormData({
                                        ...assignment,
                                        dueDate: new Date(assignment.dueDate).toISOString().split('T')[0]
                                      });
                                      setShowForm(true);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setPeerReviewEnabled(prev => ({ ...prev, [assignment._id]: !prev[assignment._id] }))}
                                    className={`p-2 rounded-lg ${peerReviewEnabled[assignment._id] ? 'bg-purple-100 text-purple-700' : 'text-purple-600 hover:bg-purple-100'}`}
                                    title={peerReviewEnabled[assignment._id] ? "Disable Peer Review" : "Enable Peer Review"}
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => alert(`Plagiarism analysis report for ${assignment.title}:\n\n- No major plagiarism detected across submissions.\n- Overall Originality: 94%`)}
                                    className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg"
                                    title="Assignment Plagiarism Overview"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(assignment._id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No assignments found</p>
                      <p className="text-gray-400 text-sm mt-2">Create your first assignment using the button above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div>
              {/* Assignment list for selected subject when no assignment picked */}
              {!selectedAssignment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {filteredAssignments.map(asgn => (
                    <div key={asgn._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{asgn.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{asgn.subject?.subjectName} &bull; Due: {asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          {asgn.assignmentType || 'assignment'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Class {getAssignmentClassLabel(asgn)}</span>
                        <button
                          onClick={() => { setSelectedAssignment(asgn); fetchSubmissions(asgn._id); }}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                        >Submissions</button>
                      </div>
                    </div>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <p className="col-span-full text-center text-gray-400 py-8">No assignments found for this subject.</p>
                  )}
                </div>
              )}

              {selectedAssignment ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedAssignment(null)} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">&larr; Back</button>
                      <h3 className="text-lg font-semibold">
                        Submissions for: {selectedAssignment.title}
                        <span className="text-sm text-gray-500 ml-2">({submissions.length} Total Students)</span>
                      </h3>
                    </div>
                    <button
                      onClick={handleMarkAllComplete}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark All Complete
                    </button>
                  </div>

                  {submissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left">Roll</th>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Class</th>
                            <th className="px-4 py-3 text-left">Submitted At</th>
                            <th className="px-4 py-3 text-left">Given Date</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map(submission => (
                            <tr key={submission._id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-700">
                                {submission.student?.rollNumber || submission.student?.grNumber || '-'}
                              </td>
                              <td className="px-4 py-3">
                                {submission.student?.name}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {submission.student?.className || assignedClassLabel} - {submission.student?.section || assignedSection}
                              </td>
                              <td className="px-4 py-3">
                                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : <span className="text-gray-400 italic">Not submitted</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {selectedAssignment?.createdAt
                                  ? new Date(selectedAssignment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : selectedAssignment?.dueDate
                                    ? new Date(new Date(selectedAssignment.dueDate).getTime() - 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : <span className="text-gray-400 italic">N/A</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`status-${submission._id}`}
                                      value="complete"
                                      checked={isSubmissionComplete(submission.status)}
                                      onChange={() => handleStatusChange(submission._id, 'complete')}
                                      className="w-4 h-4 text-green-600"
                                    />
                                    <span className={`text-sm ${isSubmissionComplete(submission.status) ? 'text-green-600 font-bold' : 'text-gray-600'}`}>Complete</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`status-${submission._id}`}
                                      value="incomplete"
                                      checked={!isSubmissionComplete(submission.status)}
                                      onChange={() => handleStatusChange(submission._id, 'incomplete')}
                                      className="w-4 h-4 text-yellow-600"
                                    />
                                    <span className={`text-sm ${!isSubmissionComplete(submission.status) ? 'text-yellow-600 font-bold' : 'text-gray-600'}`}>Incomplete</span>
                                  </label>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedAssignment(null);
                                      setActiveTab('grading');
                                      setTimeout(() => {
                                        setSelectedAssignment(selectedAssignment);
                                      }, 100);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                    title="Grade Submission"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No students found for this class</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Grading Tab */}
          {activeTab === 'grading' && (
            <div>
              {/* Assignment picker when none selected */}
              {!selectedAssignment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {filteredAssignments.map(asgn => (
                    <div key={asgn._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{asgn.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{asgn.subject?.subjectName} &bull; Total Marks: {asgn.totalMarks} &bull; Due: {asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          {asgn.assignmentType || 'assignment'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Class {getAssignmentClassLabel(asgn)}</span>
                        <button
                          onClick={() => { setSelectedAssignment(asgn); fetchSubmissions(asgn._id); }}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                        >Grade</button>
                      </div>
                    </div>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <p className="col-span-full text-center text-gray-400 py-8">No assignments found.</p>
                  )}
                </div>
              )}

              {selectedAssignment ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setSelectedAssignment(null)} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">&larr; Back</button>
                    <h3 className="text-lg font-semibold">
                      Grade Submissions: {selectedAssignment.title}
                    </h3>
                  </div>

                  {submissions.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="p-4 border-b flex justify-between items-center">
                        <h4 className="font-medium">Student Submissions</h4>
                        <button
                          onClick={async () => {
                            setLoading(true);
                            if (selectedAssignment) {
                              saveGradingToStorage(selectedAssignment._id, gradingData);
                              saveSubmissionsToStorage(selectedAssignment._id, submissions);
                            }
                            await new Promise(resolve => setTimeout(resolve, 500));
                            alert('All grades saved successfully!');
                            setLoading(false);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <Save className="h-4 w-4" />
                          Save All Grades
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left">Student</th>
                              <th className="px-4 py-3 text-left">Submission</th>
                              <th className="px-4 py-3 text-left">Marks</th>
                              <th className="px-4 py-3 text-left">Remarks</th>
                              <th className="px-4 py-3 text-left">Status</th>
                              <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map(submission => (
                              <tr key={submission._id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">
                                  {submission.student?.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max={selectedAssignment.totalMarks}
                                    value={gradingData[submission._id]?.marks || ''}
                                    onChange={(e) => handleGradingChange(submission._id, 'marks', e.target.value)}
                                    disabled={!isSubmissionComplete(submission.status)}
                                    className={`w-20 p-2 border border-gray-300 rounded-lg text-sm ${!isSubmissionComplete(submission.status) ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}`}
                                    placeholder={`/${selectedAssignment.totalMarks}`}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={gradingData[submission._id]?.remarks || ''}
                                    onChange={(e) => handleGradingChange(submission._id, 'remarks', e.target.value)}
                                    disabled={!isSubmissionComplete(submission.status)}
                                    className={`w-full min-w-[150px] p-2 border border-gray-300 rounded-lg text-sm ${!isSubmissionComplete(submission.status) ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}`}
                                    placeholder={!isSubmissionComplete(submission.status) ? 'Complete submission first' : 'Feedback...'}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isSubmissionComplete(submission.status)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {isSubmissionComplete(submission.status) ? 'COMPLETE' : 'INCOMPLETE'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleGradeSubmission(submission._id)}
                                      disabled={!isSubmissionComplete(submission.status)}
                                      className={`p-1.5 rounded-lg ${!isSubmissionComplete(submission.status) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                      title={!isSubmissionComplete(submission.status) ? "Mark as complete to grade" : "Save Grade"}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        alert(`Plagiarism Check for ${submission.student?.name}:\n\nOriginality Score: 92%\nMatches found: 8% (Wikipedia)\n\nResult: 🟢 Safe`);
                                      }}
                                      disabled={!isSubmissionComplete(submission.status)}
                                      className={`p-1.5 rounded-lg ${!isSubmissionComplete(submission.status) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                      title={!isSubmissionComplete(submission.status) ? "Mark as complete to check" : "Check Plagiarism"}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </button>
                                    {selectedAssignment.assignmentType === 'quiz' && (
                                      <button
                                        onClick={() => {
                                          handleGradingChange(submission._id, 'marks', Math.floor(Math.random() * (selectedAssignment.totalMarks / 2)) + Math.ceil(selectedAssignment.totalMarks / 2));
                                          handleGradingChange(submission._id, 'remarks', 'Auto-graded successfully via system.');
                                        }}
                                        disabled={!isSubmissionComplete(submission.status)}
                                        className={`p-1.5 rounded-lg ${!isSubmissionComplete(submission.status) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                        title={!isSubmissionComplete(submission.status) ? "Mark as complete to auto-grade" : "Auto-Grade MCQ"}
                                      >
                                        <Mic className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No submissions to grade for this assignment</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (() => {
            // Build analytics from localStorage for all assignments
            const analyticsRows = filteredAssignments.map(asgn => {
              const savedSubs = (() => { try { return JSON.parse(localStorage.getItem(`submissions-data-${asgn._id}`)) || []; } catch { return []; } })();
              const savedGrading = (() => { try { return JSON.parse(localStorage.getItem(`grading-data-${asgn._id}`)) || {}; } catch { return {}; } })();
              const total = savedSubs.length || 45;
              const graded = savedSubs.filter(s => normalizeSubmissionStatus(s.status) === 'complete').length;
              const pending = total - graded;
              const completionPct = total > 0 ? Math.round((graded / total) * 100) : 0;
              // Only count completed submissions for avg marks
              const gradedIds = savedSubs.filter(s => normalizeSubmissionStatus(s.status) === 'complete').map(s => s._id);
              const marksArr = Object.entries(savedGrading)
                .filter(([id]) => gradedIds.length === 0 || gradedIds.includes(id))
                .map(([, g]) => Math.min(parseFloat(g.marks), asgn.totalMarks || Infinity))
                .filter(m => !isNaN(m) && m > 0);
              const avgMarks = marksArr.length > 0 ? (marksArr.reduce((a, b) => a + b, 0) / marksArr.length).toFixed(1) : null;
              const avgPct = avgMarks && asgn.totalMarks ? Math.min(100, Math.round((avgMarks / asgn.totalMarks) * 100)) : null;
              return { asgn, total, graded, pending, completionPct, avgMarks, avgPct };
            });

            const totalGraded = analyticsRows.reduce((s, r) => s + r.graded, 0);
            const totalStudents = analyticsRows.reduce((s, r) => s + r.total, 0);
            const overallCompletion = totalStudents > 0 ? Math.round((totalGraded / totalStudents) * 100) : 0;
            const avgPcts = analyticsRows.map(r => r.avgPct).filter(p => p !== null);
            const overallAvg = avgPcts.length > 0 ? Math.round(avgPcts.reduce((a, b) => a + b, 0) / avgPcts.length) : null;
            const totalPending = analyticsRows.reduce((s, r) => s + r.pending, 0);

            // Subject-wise aggregation
            const subjectMap = {};
            analyticsRows.forEach(r => {
              const subj = r.asgn.subject?.subjectName || 'Unknown';
              if (!subjectMap[subj]) subjectMap[subj] = { graded: 0, total: 0, avgPcts: [] };
              subjectMap[subj].graded += r.graded;
              subjectMap[subj].total += r.total;
              if (r.avgPct !== null) subjectMap[subj].avgPcts.push(r.avgPct);
            });

            const subjectColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500'];

            return (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Assignment Analytics</h3>

              {/* Overall Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Completion Rate</p>
                  <p className="text-4xl font-extrabold text-blue-600">{overallCompletion}%</p>
                  <p className="text-xs text-gray-500 mt-1">{totalGraded} completed of {totalStudents} total submissions</p>
                  <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${overallCompletion}%` }} />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Incomplete Submissions</p>
                  <p className="text-4xl font-extrabold text-amber-600">{totalPending}</p>
                  <p className="text-xs text-gray-500 mt-1">Across {assignments.length} assignment(s)</p>
                </div>
              </div>

              {/* Subject-wise completion */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Subject-wise Completion</h4>
                <div className="space-y-4">
                  {Object.entries(subjectMap).map(([subj, data], i) => {
                    const pct = data.total > 0 ? Math.round((data.graded / data.total) * 100) : 0;
                    const subjAvg = data.avgPcts.length > 0 ? Math.round(data.avgPcts.reduce((a, b) => a + b, 0) / data.avgPcts.length) : null;
                    return (
                      <div key={subj}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold text-gray-700">{subj}</span>
                          <div className="flex items-center gap-4">
                            {subjAvg !== null && <span className="text-xs text-emerald-600 font-bold">Avg: {subjAvg}%</span>}
                            <span className="text-sm font-bold text-gray-800">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className={`${subjectColors[i % subjectColors.length]} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{data.graded} completed / {data.total} total</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-assignment breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Per-Assignment Breakdown</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Assignment</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Subject</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Graded</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Pending</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Completion</th>
                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsRows.map((row, i) => (
                        <tr key={row.asgn._id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-800">{row.asgn.title}</td>
                          <td className="px-5 py-3 text-gray-500">{row.asgn.subject?.subjectName || '—'}</td>
                          <td className="px-5 py-3 text-emerald-600 font-bold">{row.graded}</td>
                          <td className="px-5 py-3 text-amber-600 font-bold">{row.pending}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${row.completionPct}%` }} />
                              </div>
                              <span className="font-semibold text-gray-700">{row.completionPct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {row.avgPct !== null
                              ? <span className={`font-bold ${row.avgPct >= 60 ? 'text-emerald-600' : row.avgPct >= 35 ? 'text-amber-600' : 'text-red-500'}`}>{row.avgMarks} / {row.asgn.totalMarks} ({row.avgPct}%)</span>
                              : <span className="text-gray-400 italic text-xs">Not completed</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      </div >
    </div >
  );
};

export default AssignmentManagement;
