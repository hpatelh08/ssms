import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Heart, AlertTriangle, Calendar, FileText, Search, Eye, X } from 'lucide-react';

const StudentManagement = ({ currentUser }) => {
  const attendanceMockNames = [
    'Aarav Sharma', 'Vivaan Patel', 'Aditya Singh', 'Vihaan Kumar', 'Arjun Gupta',
    'Sai Krishna', 'Reyansh Reddy', 'Ayaan Khan', 'Krishna Iyer', 'Ishaan Verma',
    'Rudra Joshi', 'Dhruv Desai', 'Kabir Das', 'Atharv Yadav', 'Rishi Tiwari',
    'Adwait Pandey', 'Aanya Sharma', 'Diya Patel', 'Ananya Singh', 'Myra Kumar',
    'Kavya Gupta', 'Siya Reddy', 'Navya Khan', 'Aaradhya Iyer', 'Saanvi Verma',
    'Nyra Joshi', 'Sneha Desai', 'Ira Das', 'Riya Yadav', 'Tara Tiwari',
    'Kiara Pandey', 'Advik Nair', 'Pranav Menon', 'Rohan Sethi', 'Karthik Pillai',
    'Siddharth Rao', 'Neel Thakur', 'Dev Bhardwaj', 'Rahul Chatterjee', 'Nikhil Sen',
    'Mira Nair', 'Anika Menon', 'Zara Sethi', 'Nisha Thakur', 'Pooja Bhardwaj'
  ];

  const [activeTab, setActiveTab] = useState('profiles');
  const [students, setStudents] = useState([]);
  const [profileStudents, setProfileStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [ptmData, setPtmData] = useState({
    studentId: '',
    rollNumber: '',
    meetingType: 'regular',
    date: '',
    time: '',
    purpose: ''
  });
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [ptmStatusFilter, setPtmStatusFilter] = useState('pending');
  const [healthEditStudentId, setHealthEditStudentId] = useState('');
  const [healthForm, setHealthForm] = useState({
    studentId: '',
    name: '',
    age: '',
    weight: '',
    allergies: ''
  });
  const [savingHealthRecord, setSavingHealthRecord] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    name: '', surname: '', rollNumber: '', dateOfBirth: '', age: '',
    bloodGroup: '', email: '', phone: '', address: '', studentId: '',
    className: '', division: '', admissionDate: '', fatherName: '',
    motherName: '', parentPhone: ''
  });

  useEffect(() => {
    fetchClasses();
  }, [currentUser?.assignedClass, currentUser?.division]);

  useEffect(() => {
    if (activeTab === 'ptm') {
      fetchUpcomingMeetings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!filterClass) return;
    fetchStudents(filterClass);
  }, [filterClass]);

  useEffect(() => {
    const selectedClassInfo = classes.find((cls) => cls._id === filterClass);
    const className = selectedClassInfo?.className || currentUser?.assignedClass || '10th';
    const section = selectedClassInfo?.section || currentUser?.division || 'A';
    const classId = selectedClassInfo?._id || filterClass || '';
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const remarkLevels = ['Good', 'Average', 'Bad'];

    const cardsData = attendanceMockNames.map((name, index) => {
      const age = 14 + (index % 4);
      const dateOfBirth = new Date(2026 - age, index % 12, (index % 28) + 1);
      const safeName = name.toLowerCase().replace(/\s+/g, '.');
      const averagePercentage = 65 + (index % 25);
      const remark = remarkLevels[index % remarkLevels.length];

      return {
        _id: `MOCK_STU_${index + 1}`,
        rollNumber: `R${String(index + 1).padStart(3, '0')}`,
        studentId: `STU${String(index + 1).padStart(3, '0')}`,
        name,
        classId,
        className,
        section,
        gender: index % 2 === 0 ? 'Male' : 'Female',
        age,
        remark,
        dateOfBirth,
        bloodGroup: bloodGroups[index % bloodGroups.length],
        email: `${safeName}@school.com`,
        phone: `98${String(10000000 + index).padStart(8, '0')}`,
        address: `Street ${index + 1}, City`,
        fatherName: `Mr. ${name.split(' ')[1] || 'Parent'}`,
        motherName: `Mrs. ${name.split(' ')[1] || 'Parent'}`,
        parentPhone: `99${String(20000000 + index).padStart(8, '0')}`,
        admissionDate: new Date(2021, index % 12, ((index + 10) % 28) + 1),
        currentGPA: (2.5 + ((index % 10) * 0.15)).toFixed(2),
        averagePercentage,
        attendanceRate: 80 + (index % 20),
        healthInfo: 'Fit',
        allergies: index % 5 === 0 ? 'Dust allergy' : 'None',
        behaviorRemarks: remark
      };
    });

    setProfileStudents(cardsData);
  }, [classes, filterClass, currentUser?.assignedClass, currentUser?.division]);

  const getClassIdValue = (classId) => {
    if (!classId) return '';
    if (typeof classId === 'string') return classId;
    if (typeof classId === 'object') return classId._id || '';
    return '';
  };

  const normalizeStudentData = (student) => {
    const populatedClass = typeof student.classId === 'object' ? student.classId : null;

    return {
      ...student,
      classId: getClassIdValue(student.classId),
      className: student.className || populatedClass?.className || '',
      section: student.section || populatedClass?.section || ''
    };
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatDateForInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const getAgeFromDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return '';

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? String(age) : '';
  };

  const getEmergencyContactText = (emergencyContact) => {
    if (!emergencyContact) return 'No emergency contact available';
    if (typeof emergencyContact === 'string') return emergencyContact;

    const contactText = [
      emergencyContact.name,
      emergencyContact.phone,
      emergencyContact.relationship
    ]
      .filter(Boolean)
      .join(' | ');

    return contactText || 'No emergency contact available';
  };

  const getRemarkStyle = (remark) => {
    const normalizedRemark = String(remark || '').toLowerCase();
    if (normalizedRemark === 'good') return 'bg-green-100 text-green-700';
    if (normalizedRemark === 'bad') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getBehaviorRemarksText = (behaviorRemarks, fallbackRemark = '') => {
    if (Array.isArray(behaviorRemarks)) {
      const remarks = behaviorRemarks
        .map((entry) => (typeof entry === 'string' ? entry : entry?.remark))
        .filter(Boolean);

      if (remarks.length > 0) return remarks.join(', ');
    }

    if (typeof behaviorRemarks === 'string' && behaviorRemarks.trim()) {
      return behaviorRemarks;
    }

    if (fallbackRemark) {
      return fallbackRemark;
    }

    return 'No behavior remarks recorded';
  };

  const getPtmStorageKey = () => `teacher-ptm-meetings-${currentUser?.email || 'default'}`;

  const getDashboardPendingTaskKey = () => `teacher-pending-tasks-${currentUser?.email || 'default'}`;

  const normalizeMeetingRecord = (meeting) => ({
    ...meeting,
    status: meeting?.status === 'completed' ? 'completed' : 'pending'
  });

  const sortMeetingsByDateTime = (meetings) => [...meetings].sort((a, b) => {
    const firstDate = new Date(`${a?.date || ''}T${a?.time || '00:00'}`).getTime();
    const secondDate = new Date(`${b?.date || ''}T${b?.time || '00:00'}`).getTime();
    return firstDate - secondDate;
  });

  const getTodayIsoLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const syncPtmPendingTasksToDashboard = (meetings) => {
    const todayIso = getTodayIsoLocal();
    const todayPendingMeetings = meetings.filter((meeting) => (
      meeting.status === 'pending' && meeting.date === todayIso
    ));

    const dashboardPendingTasks = todayPendingMeetings.map((meeting) => ({
      id: `ptm-task-${meeting._id}`,
      title: `PTM Meeting: ${meeting.student?.name || 'Student'}`,
      due: `Today${meeting.time ? `, ${meeting.time}` : ''}`,
      priority: 'high'
    }));

    localStorage.setItem(getDashboardPendingTaskKey(), JSON.stringify(dashboardPendingTasks));
  };

  const persistUpcomingMeetings = (meetings) => {
    const normalizedMeetings = sortMeetingsByDateTime(meetings.map(normalizeMeetingRecord));
    setUpcomingMeetings(normalizedMeetings);
    localStorage.setItem(getPtmStorageKey(), JSON.stringify(normalizedMeetings));
    syncPtmPendingTasksToDashboard(normalizedMeetings);
  };

  const fetchUpcomingMeetings = () => {
    try {
      const storedMeetings = localStorage.getItem(getPtmStorageKey());
      const parsedMeetings = storedMeetings ? JSON.parse(storedMeetings) : [];
      const safeMeetings = Array.isArray(parsedMeetings) ? parsedMeetings : [];
      const normalizedMeetings = sortMeetingsByDateTime(safeMeetings.map(normalizeMeetingRecord));

      setUpcomingMeetings(normalizedMeetings);
      syncPtmPendingTasksToDashboard(normalizedMeetings);
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error);
      setUpcomingMeetings([]);
      syncPtmPendingTasksToDashboard([]);
    }
  };

  const handleScheduleMeeting = async () => {
    const normalizedInputRoll = normalizeRollNumber(ptmData.rollNumber);
    const matchedStudentByRoll = ptmStudents.find(
      (student) => normalizeRollNumber(student.rollNumber) === normalizedInputRoll
    );
    const selectedStudentId = ptmData.studentId || matchedStudentByRoll?._id || '';

    if (!selectedStudentId) {
      alert('Please select a valid student or enter a correct roll number');
      return;
    }

    if (!ptmData.date || !ptmData.time || !ptmData.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const selectedStudent = ptmStudents.find((student) => student._id === selectedStudentId) || matchedStudentByRoll;
      const newMeeting = {
        _id: `ptm-${Date.now()}`,
        student: {
          _id: selectedStudent?._id,
          name: selectedStudent?.name || 'Student',
          className: selectedStudent?.className || '',
          section: selectedStudent?.section || '',
          rollNumber: selectedStudent?.rollNumber || ''
        },
        meetingType: ptmData.meetingType,
        date: ptmData.date,
        time: ptmData.time,
        purpose: ptmData.purpose.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      persistUpcomingMeetings([...upcomingMeetings, newMeeting]);

      // Reset form
      setPtmData({
        studentId: '',
        rollNumber: '',
        meetingType: 'regular',
        date: '',
        time: '',
        purpose: ''
      });

      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Error scheduling meeting');
    }
  };

  const handleRescheduleMeeting = async (meetingId) => {
    const meeting = upcomingMeetings.find((item) => item._id === meetingId);
    if (!meeting) return;

    const updatedDate = window.prompt('Enter new date (YYYY-MM-DD)', meeting.date || '');
    if (!updatedDate) return;

    const updatedTime = window.prompt('Enter new time (HH:MM)', meeting.time || '');
    if (!updatedTime) return;

    const updatedMeetings = upcomingMeetings.map((item) => (
      item._id === meetingId ? { ...item, date: updatedDate, time: updatedTime } : item
    ));

    persistUpcomingMeetings(updatedMeetings);
    alert('Meeting rescheduled successfully!');
  };

  const handleCancelMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        const updatedMeetings = upcomingMeetings.filter((meeting) => meeting._id !== meetingId);
        persistUpcomingMeetings(updatedMeetings);
        alert('Meeting cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        alert('Error cancelling meeting');
      }
    }
  };

  const handleToggleMeetingStatus = (meetingId) => {
    const updatedMeetings = upcomingMeetings.map((meeting) => (
      meeting._id === meetingId
        ? { ...meeting, status: meeting.status === 'completed' ? 'pending' : 'completed' }
        : meeting
    ));

    persistUpcomingMeetings(updatedMeetings);
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/all', {
        params: {
          classId
        },
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      setStudents((response.data.data || []).map(normalizeStudentData));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      const assignedClasses = response.data.data || [];
      const normalizedAssignedClass = String(currentUser?.assignedClass || '').trim().toLowerCase();
      const normalizedAssignedSection = String(currentUser?.division || '').trim().toLowerCase();

      const classTeacherClass = assignedClasses.find((cls) => (
        String(cls.className || '').trim().toLowerCase() === normalizedAssignedClass &&
        String(cls.section || '').trim().toLowerCase() === normalizedAssignedSection
      ));

      const visibleClasses = classTeacherClass ? [classTeacherClass] : assignedClasses;
      setClasses(visibleClasses);

      if (visibleClasses.length > 0) {
        setFilterClass(visibleClasses[0]._id);
      } else {
        setStudents([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setLoading(false);
    }
  };

  const filteredStudents = profileStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || getClassIdValue(student.classId) === filterClass;
    return matchesSearch && matchesClass;
  });

  const healthStudents = profileStudents.filter((student) => {
    const matchesClass = !filterClass || getClassIdValue(student.classId) === filterClass;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch ||
      String(student.name || '').toLowerCase().includes(normalizedSearch) ||
      String(student.rollNumber || '').toLowerCase().includes(normalizedSearch);

    return matchesClass && matchesSearch;
  });

  const ptmStudents = profileStudents.filter((student) => (
    !filterClass || getClassIdValue(student.classId) === filterClass
  ));

  const normalizeRollNumber = (value) => {
    const rawValue = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!rawValue) return '';

    const numericPart = rawValue.startsWith('R') ? rawValue.slice(1) : rawValue;
    if (/^\d+$/.test(numericPart)) {
      return `R${numericPart.padStart(3, '0')}`;
    }

    return rawValue.startsWith('R') ? rawValue : `R${rawValue}`;
  };

  const filteredUpcomingMeetings = upcomingMeetings.filter((meeting) => (
    ptmStatusFilter === 'all' || meeting.status === ptmStatusFilter
  ));

  const handlePtmStudentChange = (studentId) => {
    const selected = ptmStudents.find((student) => student._id === studentId);

    setPtmData((prev) => ({
      ...prev,
      studentId,
      rollNumber: selected?.rollNumber || prev.rollNumber
    }));
  };

  const handlePtmRollNumberChange = (rollNumber) => {
    const normalizedInputRoll = normalizeRollNumber(rollNumber);
    const exactMatch = ptmStudents.find(
      (student) => normalizeRollNumber(student.rollNumber) === normalizedInputRoll
    );

    setPtmData((prev) => ({
      ...prev,
      rollNumber,
      studentId: exactMatch ? exactMatch._id : ''
    }));
  };

  const handleOpenHealthEdit = (student) => {
    setHealthEditStudentId(student._id);
    setHealthForm({
      studentId: student._id,
      name: student.name || '',
      age: student.age ? String(student.age) : getAgeFromDateOfBirth(student.dateOfBirth),
      weight: student.weight ? String(student.weight) : '',
      allergies: student.allergies || ''
    });
  };

  const handleHealthFormChange = (field, value) => {
    setHealthForm((prev) => {
      const updatedForm = { ...prev, [field]: value };

      if (field === 'dateOfBirth') {
        updatedForm.age = getAgeFromDateOfBirth(value);
      }

      return updatedForm;
    });
  };

  const handleSaveHealthRecord = async () => {
    if (!healthForm.studentId) {
      alert('Student not found');
      return;
    }

    try {
      setSavingHealthRecord(true);
      const sanitizedAge = healthForm.age === '' ? null : Number(healthForm.age);
      const age = Number.isFinite(sanitizedAge) ? sanitizedAge : null;
      const allergies = String(healthForm.allergies || '').trim();
      const weight = String(healthForm.weight || '').trim();
      const updatedFields = {
        age,
        allergies
      };

      if (weight) {
        updatedFields.healthInfo = `Weight: ${weight} kg`;
      }

      if (String(healthForm.studentId).startsWith('MOCK_STU_')) {
        setProfileStudents((prev) =>
          prev.map((student) => (
            student._id === healthForm.studentId ? { ...student, ...updatedFields } : student
          ))
        );
      } else {
        const token = localStorage.getItem('token');
        const response = await axios.put('http://localhost:5000/api/student/health-records', {
          studentId: healthForm.studentId,
          ...updatedFields
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const updatedStudent = normalizeStudentData(response.data.data);
        setStudents((prev) =>
          prev.map((student) => (student._id === updatedStudent._id ? updatedStudent : student))
        );
        setProfileStudents((prev) =>
          prev.map((student) => (student._id === updatedStudent._id ? { ...student, ...updatedStudent } : student))
        );
      }

      setHealthEditStudentId('');
      alert('Health record updated successfully');
    } catch (error) {
      console.error('Error updating health record:', error);
      alert('Error updating health record');
    } finally {
      setSavingHealthRecord(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setActiveTab('profiles');
  };

  const handleAddNewStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleSaveNewStudent = () => {
    if (!addStudentForm.name.trim() || !addStudentForm.rollNumber.trim()) {
      alert('First Name and Roll Number are required');
      return;
    }

    const normalizedRoll = normalizeRollNumber(addStudentForm.rollNumber);
    const hasDuplicateRoll = profileStudents.some(
      (student) => normalizeRollNumber(student.rollNumber) === normalizedRoll
    );

    if (hasDuplicateRoll) {
      alert('This roll number already exists');
      return;
    }

    const fullName = `${addStudentForm.name.trim()} ${addStudentForm.surname.trim()}`.trim();
    const className = addStudentForm.className || String(currentUser?.assignedClass || '').trim() || 'N/A';
    const section = addStudentForm.division || String(currentUser?.division || '').trim() || 'N/A';

    const newStudent = {
      _id: `MOCK_STU_MANUAL_${Date.now()}`,
      rollNumber: normalizedRoll,
      studentId: addStudentForm.studentId || `STU${String(profileStudents.length + 1).padStart(3, '0')}`,
      name: fullName,
      classId: filterClass || '',
      className,
      section,
      gender: 'N/A',
      age: addStudentForm.age || getAgeFromDateOfBirth(addStudentForm.dateOfBirth) || '',
      remark: 'Average',
      dateOfBirth: addStudentForm.dateOfBirth,
      bloodGroup: addStudentForm.bloodGroup,
      email: addStudentForm.email,
      phone: addStudentForm.phone,
      address: addStudentForm.address,
      fatherName: addStudentForm.fatherName,
      motherName: addStudentForm.motherName,
      parentPhone: addStudentForm.parentPhone,
      admissionDate: addStudentForm.admissionDate,
      currentGPA: '0.00',
      averagePercentage: 0,
      attendanceRate: 0,
      healthInfo: '',
      allergies: '',
      behaviorRemarks: 'Average'
    };

    setProfileStudents((prev) => [newStudent, ...prev]);
    setShowAddStudentModal(false);
    setAddStudentForm({
      name: '', surname: '', rollNumber: '', dateOfBirth: '', age: '',
      bloodGroup: '', email: '', phone: '', address: '', studentId: '',
      className: '', division: '', admissionDate: '', fatherName: '',
      motherName: '', parentPhone: ''
    });
    alert('New student added successfully');
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Student Management</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">View and manage student profiles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100/80 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'profiles'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <User className="h-4 w-4" />
            Student Profiles
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'health'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Heart className="h-4 w-4" />
            Health Records
          </button>
          <button
            onClick={() => setActiveTab('ptm')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'ptm'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Calendar className="h-4 w-4" />
            PTM Scheduler
          </button>
        </div>

        <div className="p-6">
          {/* Student Profiles Tab */}
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search students by name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {classes.length > 0 && (
                  <div>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      disabled={classes.length <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>
                          {cls.className} - {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddNewStudent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                >
                  Add New Student
                </button>
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map(student => (
                  <div key={student._id} className="border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center text-indigo-700 font-bold">
                        {(student.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.className} - {student.section}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Student Name</p>
                        <p className="text-sm font-medium text-gray-800">{student.name}</p>
                      </div>
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Roll Number</p>
                        <p className="text-sm font-medium text-gray-800">{student.rollNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Class - Division</p>
                        <p className="text-sm font-medium text-gray-800">{student.className || 'N/A'} - {student.section || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm font-medium text-gray-800">{student.gender || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                      <h5 className="font-medium text-amber-800">Remark</h5>
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded text-xs font-semibold ${getRemarkStyle(student.remark)}`}>
                        {(student.remark || 'Average').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleViewStudent(student)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Records Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by student name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {classes.length > 0 && (
                  <div>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      disabled={classes.length <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.className} - {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddNewStudent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                >
                  Add New Student
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {healthStudents.map(student => (
                  <div key={student._id} className="border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                      <div>
                        <h4 className="font-semibold">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.className} - {student.section}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Student Name</p>
                        <p className="text-sm font-medium text-gray-800">{student.name}</p>
                      </div>
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Blood Group</p>
                        <p className="text-sm font-medium text-gray-800">{student.bloodGroup || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Birth Date</p>
                        <p className="text-sm font-medium text-gray-800">{formatDate(student.dateOfBirth)}</p>
                      </div>
                      <div className="bg-slate-50 border rounded p-2">
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="text-sm font-medium text-gray-800">
                          {student.age || getAgeFromDateOfBirth(student.dateOfBirth) || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <h5 className="font-medium text-red-800 flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Health Information
                        </h5>
                        <p className="text-sm text-red-600 mt-1">
                          {student.healthInfo || 'No health records available'}
                        </p>
                      </div>

                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                        <h5 className="font-medium text-blue-800">Emergency Contact</h5>
                        <p className="text-sm text-blue-600 mt-1">
                          {getEmergencyContactText(student.emergencyContact)}
                        </p>
                      </div>

                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <h5 className="font-medium text-yellow-800">Allergies</h5>
                        <p className="text-sm text-yellow-600 mt-1">
                          {student.allergies || 'No allergies recorded'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenHealthEdit(student)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4" />
                        Edit Record
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {healthStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm.trim()
                      ? 'No student found for this name or roll number'
                      : 'No students found in assigned class'}
                  </p>
                </div>
              )}
            </div>
          )}
          {/* PTM Scheduler Tab */}
          {activeTab === 'ptm' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold mb-4">Schedule Parent-Teacher Meeting</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                      <select
                        value={ptmData.studentId}
                        onChange={(e) => handlePtmStudentChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a student</option>
                        {ptmStudents.map(student => (
                          <option key={student._id} value={student._id}>
                            {student.name} (Roll: {student.rollNumber}) - {student.className} {student.section}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                      <input
                        type="text"
                        value={ptmData.rollNumber}
                        onChange={(e) => handlePtmRollNumberChange(e.target.value)}
                        placeholder="Type roll number (e.g. R003)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {ptmData.rollNumber.trim() && !ptmData.studentId && (
                        <p className="text-xs text-red-600 mt-1">No student found for this roll number</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                    <select
                      value={ptmData.meetingType}
                      onChange={(e) => setPtmData({ ...ptmData, meetingType: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="regular">Regular PTM</option>
                      <option value="concern">Concern Meeting</option>
                      <option value="progress">Progress Discussion</option>
                      <option value="behavior">Behavior Issues</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={ptmData.date}
                      onChange={(e) => setPtmData({ ...ptmData, date: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={ptmData.time}
                      onChange={(e) => setPtmData({ ...ptmData, time: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Purpose</label>
                  <textarea
                    rows="3"
                    value={ptmData.purpose}
                    onChange={(e) => setPtmData({ ...ptmData, purpose: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Briefly describe the purpose of the meeting..."
                  ></textarea>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleScheduleMeeting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold">Scheduled Meetings</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPtmStatusFilter('pending')}
                      className={`px-3 py-1 text-sm rounded-lg border ${ptmStatusFilter === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-gray-600 border-gray-300'
                        }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setPtmStatusFilter('completed')}
                      className={`px-3 py-1 text-sm rounded-lg border ${ptmStatusFilter === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-white text-gray-600 border-gray-300'
                        }`}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => setPtmStatusFilter('all')}
                      className={`px-3 py-1 text-sm rounded-lg border ${ptmStatusFilter === 'all'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-gray-600 border-gray-300'
                        }`}
                    >
                      All
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredUpcomingMeetings.map((meeting) => {
                    const meetingStatus = meeting.status === 'completed' ? 'completed' : 'pending';
                    const meetingType = String(meeting.meetingType || 'regular');

                    return (
                      <div key={meeting._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium">Meeting with {meeting.student?.name}'s Parents</h4>
                              <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${meetingStatus === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                                  }`}
                              >
                                {meetingStatus === 'completed' ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {meeting.student?.className} - {meeting.student?.section} | {meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} PTM
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Date: {new Date(meeting.date).toLocaleDateString()} | Time: {meeting.time}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{meeting.purpose}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleToggleMeetingStatus(meeting._id)}
                              className={`px-3 py-1 text-sm rounded-lg ${meetingStatus === 'completed'
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                            >
                              {meetingStatus === 'completed' ? 'Mark Pending' : 'Mark Complete'}
                            </button>
                            <button
                              onClick={() => handleRescheduleMeeting(meeting._id)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelMeeting(meeting._id)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredUpcomingMeetings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        {ptmStatusFilter === 'all'
                          ? 'No meetings scheduled'
                          : `No ${ptmStatusFilter} meetings`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {healthEditStudentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 z-10 px-6 py-4 border-b bg-white flex items-center justify-between">
              <h3 className="text-xl font-semibold">Edit Health Record</h3>
              <button
                type="button"
                onClick={() => setHealthEditStudentId('')}
                className="text-gray-500 hover:text-gray-700"
              >
                x
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="0"
                    value={healthForm.age}
                    onChange={(e) => handleHealthFormChange('age', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={healthForm.weight}
                    onChange={(e) => handleHealthFormChange('weight', e.target.value)}
                    placeholder="Ex: 45.5"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <textarea
                    rows="3"
                    value={healthForm.allergies}
                    onChange={(e) => handleHealthFormChange('allergies', e.target.value)}
                    placeholder="List any allergies..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setHealthEditStudentId('')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHealthRecord}
                  disabled={savingHealthRecord}
                  className={`px-4 py-2 rounded-lg text-white ${savingHealthRecord ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {savingHealthRecord ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-blue-50/40 to-emerald-100/30 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
          ></div>

          <div className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[28px] border border-white/80 bg-gradient-to-br from-[#f4fbff] via-[#f6f8ff] to-[#f5fff8] shadow-[0_28px_70px_-30px_rgba(15,23,42,0.45)]">
            <div className="sticky top-0 z-10 px-6 sm:px-8 py-4 border-b border-slate-200/70 bg-white/80 backdrop-blur-md flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Student Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">Academic, personal and health overview</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50/90 via-blue-50/90 to-emerald-50/90 p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold border border-indigo-200/70">
                      {(selectedStudent.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h4>
                      <p className="text-slate-600 mt-0.5">Roll No: {selectedStudent.rollNumber || 'N/A'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/80 text-slate-700 border border-slate-200">
                          Class {selectedStudent.className || 'N/A'} - {selectedStudent.section || 'N/A'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                          {selectedStudent.gender || 'N/A'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getRemarkStyle(selectedStudent.remark)}`}>
                          Remark: {selectedStudent.remark || 'Average'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="min-w-[88px] rounded-xl border border-white/70 bg-white/75 p-3 text-center">
                      <p className="text-[11px] text-slate-500">Attendance</p>
                      <p className="text-base font-bold text-slate-900">{selectedStudent.attendanceRate || 'N/A'}%</p>
                    </div>
                    <div className="min-w-[88px] rounded-xl border border-white/70 bg-white/75 p-3 text-center">
                      <p className="text-[11px] text-slate-500">Avg Score</p>
                      <p className="text-base font-bold text-slate-900">{selectedStudent.averagePercentage?.toFixed(2) || '0.00'}%</p>
                    </div>
                    <div className="min-w-[88px] rounded-xl border border-white/70 bg-white/75 p-3 text-center">
                      <p className="text-[11px] text-slate-500">GPA</p>
                      <p className="text-base font-bold text-slate-900">{selectedStudent.currentGPA || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
                  <h5 className="font-semibold text-slate-900 mb-3">Personal Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border-b border-sky-100 pb-1.5"><span className="text-slate-500">Gender</span><span className="text-slate-800 font-medium">{selectedStudent.gender || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-sky-100 pb-1.5"><span className="text-slate-500">Date of Birth</span><span className="text-slate-800 font-medium">{formatDate(selectedStudent.dateOfBirth)}</span></div>
                    <div className="flex items-center justify-between border-b border-sky-100 pb-1.5"><span className="text-slate-500">Age</span><span className="text-slate-800 font-medium">{selectedStudent.age || getAgeFromDateOfBirth(selectedStudent.dateOfBirth) || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-sky-100 pb-1.5"><span className="text-slate-500">Blood Group</span><span className="text-slate-800 font-medium">{selectedStudent.bloodGroup || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-sky-100 pb-1.5"><span className="text-slate-500">Email</span><span className="text-slate-800 font-medium">{selectedStudent.email || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-sky-100 pb-1.5"><span className="text-slate-500">Phone</span><span className="text-slate-800 font-medium">{selectedStudent.phone || 'N/A'}</span></div>
                    <div className="flex items-start justify-between gap-3"><span className="text-slate-500">Address</span><span className="text-slate-800 font-medium text-right">{selectedStudent.address || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                  <h5 className="font-semibold text-slate-900 mb-3">Academic Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Student ID</span><span className="text-slate-800 font-medium">{selectedStudent.studentId || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Roll Number</span><span className="text-slate-800 font-medium">{selectedStudent.rollNumber || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Class</span><span className="text-slate-800 font-medium">{selectedStudent.className || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Division</span><span className="text-slate-800 font-medium">{selectedStudent.section || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Admission Date</span><span className="text-slate-800 font-medium">{formatDate(selectedStudent.admissionDate)}</span></div>
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Current GPA</span><span className="text-slate-800 font-medium">{selectedStudent.currentGPA || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5"><span className="text-slate-500">Average Score</span><span className="text-slate-800 font-medium">{selectedStudent.averagePercentage?.toFixed(2) || '0.00'}%</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Attendance Rate</span><span className="text-slate-800 font-medium">{selectedStudent.attendanceRate || 'N/A'}%</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
                  <h5 className="font-semibold text-slate-900 mb-3">Health Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-1.5"><span className="text-slate-500">Health Info</span><span className="text-slate-800 font-medium">{selectedStudent.healthInfo || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Allergies</span><span className="text-slate-800 font-medium">{selectedStudent.allergies || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                  <h5 className="font-semibold text-slate-900 mb-3">Parent/Guardian</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5"><span className="text-slate-500">Father Name</span><span className="text-slate-800 font-medium">{selectedStudent.fatherName || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5"><span className="text-slate-500">Mother Name</span><span className="text-slate-800 font-medium">{selectedStudent.motherName || 'N/A'}</span></div>
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5"><span className="text-slate-500">Parent Phone</span><span className="text-slate-800 font-medium">{selectedStudent.parentPhone || 'N/A'}</span></div>
                    <div className="flex items-start justify-between gap-3"><span className="text-slate-500">Emergency Contact</span><span className="text-slate-800 font-medium text-right">{getEmergencyContactText(selectedStudent.emergencyContact)}</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                <h5 className="font-semibold text-slate-900 mb-2">Behavior Remark</h5>
                <p className="text-sm text-slate-700 leading-relaxed">{getBehaviorRemarksText(selectedStudent.behaviorRemarks, selectedStudent.remark)}</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Add New Student Modal */}
      {
        showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
            <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 px-6 py-4 border-b bg-white flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Student</h3>
                <button onClick={() => setShowAddStudentModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" value={addStudentForm.name} onChange={e => setAddStudentForm({ ...addStudentForm, name: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Given Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                    <input type="text" value={addStudentForm.surname} onChange={e => setAddStudentForm({ ...addStudentForm, surname: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Last Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input type="text" value={addStudentForm.rollNumber} onChange={e => setAddStudentForm({ ...addStudentForm, rollNumber: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="e.g. R001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" value={addStudentForm.dateOfBirth} onChange={e => setAddStudentForm({ ...addStudentForm, dateOfBirth: e.target.value })} className="w-full p-2.5 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input type="number" value={addStudentForm.age} onChange={e => setAddStudentForm({ ...addStudentForm, age: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Years" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <input type="text" value={addStudentForm.bloodGroup} onChange={e => setAddStudentForm({ ...addStudentForm, bloodGroup: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="e.g. O+" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input type="text" value={addStudentForm.studentId} onChange={e => setAddStudentForm({ ...addStudentForm, studentId: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="e.g. STU001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <input type="text" value={addStudentForm.className} onChange={e => setAddStudentForm({ ...addStudentForm, className: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="e.g. 10th" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                    <input type="text" value={addStudentForm.division} onChange={e => setAddStudentForm({ ...addStudentForm, division: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="e.g. A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                    <input type="date" value={addStudentForm.admissionDate} onChange={e => setAddStudentForm({ ...addStudentForm, admissionDate: e.target.value })} className="w-full p-2.5 border rounded-lg" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={addStudentForm.email} onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="student@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" value={addStudentForm.phone} onChange={e => setAddStudentForm({ ...addStudentForm, phone: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Student Phone" />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea value={addStudentForm.address} onChange={e => setAddStudentForm({ ...addStudentForm, address: e.target.value })} className="w-full p-2.5 border rounded-lg" rows="2" placeholder="Full residential address"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                    <input type="text" value={addStudentForm.fatherName} onChange={e => setAddStudentForm({ ...addStudentForm, fatherName: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Father Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                    <input type="text" value={addStudentForm.motherName} onChange={e => setAddStudentForm({ ...addStudentForm, motherName: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Mother Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                    <input type="text" value={addStudentForm.parentPhone} onChange={e => setAddStudentForm({ ...addStudentForm, parentPhone: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Parent Contact Number" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowAddStudentModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                  <button type="button" onClick={handleSaveNewStudent} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium">Save Student</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default StudentManagement;

