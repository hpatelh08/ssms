import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Calendar, Edit, Eye, Trash2, Plus, Clock, Book, FileText, Target, User, Monitor, MapPin } from 'lucide-react';

const ClassManagement = ({ currentUser }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [timetable, setTimetable] = useState({});
  const [lessonPlans, setLessonPlans] = useState([]);
  const [virtualLinks, setVirtualLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    subject: '',
    topic: '',
    date: '',
    duration: '',
    objectives: '',
    materials: ''
  });
  const [seatingArrangement, setSeatingArrangement] = useState({
    rows: 5,
    cols: 6,
    students: []
  });
  const [syllabusMap, setSyllabusMap] = useState({});
  const [expandedSyllabusSubjectKey, setExpandedSyllabusSubjectKey] = useState(null);

  const extractClassNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    return match ? match[0] : '';
  };

  const normalizeSection = (value) => String(value || '').trim().toUpperCase();

  const getAssignedSection = () => {
    const division = normalizeSection(currentUser?.division);
    if (division) return division;

    const classValue = String(currentUser?.assignedClass || '');
    const match = classValue.match(/[-\s]([A-Za-z])$/);
    return match ? normalizeSection(match[1]) : '';
  };

  const findAssignedClass = (availableClasses = []) => {
    if (!availableClasses.length) return null;

    const assignedClassNumber = extractClassNumber(currentUser?.assignedClass);
    const assignedSection = getAssignedSection();

    if (!assignedClassNumber) return availableClasses[0];

    const exactMatch = availableClasses.find((cls) =>
      extractClassNumber(cls.className) === assignedClassNumber &&
      (!assignedSection || normalizeSection(cls.section) === assignedSection)
    );
    if (exactMatch) return exactMatch;

    return availableClasses.find((cls) =>
      extractClassNumber(cls.className) === assignedClassNumber
    ) || availableClasses[0];
  };

  const getChapterTitlesBySubject = (subjectName = '') => {
    const normalizedSubject = String(subjectName).toLowerCase();

    if (normalizedSubject.includes('math')) {
      return [
        'Rational Numbers',
        'Linear Equations in One Variable',
        'Understanding Quadrilaterals',
        'Practical Geometry',
        'Data Handling',
        'Squares and Square Roots',
        'Cubes and Cube Roots',
        'Comparing Quantities',
        'Algebraic Expressions and Identities',
        'Mensuration',
        'Exponents and Powers',
        'Direct and Inverse Proportions'
      ];
    }

    if (normalizedSubject.includes('science')) {
      return [
        'Crop Production and Management',
        'Microorganisms: Friend and Foe',
        'Synthetic Fibres and Plastics',
        'Materials: Metals and Non-Metals',
        'Coal and Petroleum',
        'Combustion and Flame',
        'Conservation of Plants and Animals',
        'Cell: Structure and Functions',
        'Reproduction in Animals',
        'Reaching the Age of Adolescence',
        'Force and Pressure',
        'Friction'
      ];
    }

    if (normalizedSubject.includes('english')) {
      return [
        'The Best Christmas Present in the World',
        'The Tsunami',
        'Glimpses of the Past',
        'Bepin Choudhury\'s Lapse of Memory',
        'The Summit Within',
        'This is Jody\'s Fawn',
        'A Visit to Cambridge',
        'A Short Monsoon Diary',
        'The Great Stone Face - I',
        'The Great Stone Face - II'
      ];
    }

    return Array.from({ length: 10 }, (_, idx) => `Chapter ${idx + 1}`);
  };

  const getSubTopicTitlesBySubject = (subjectName = '') => {
    const normalizedSubject = String(subjectName).toLowerCase();

    if (normalizedSubject.includes('math')) {
      return ['Concepts', 'Solved Examples', 'Practice Questions'];
    }
    if (normalizedSubject.includes('science')) {
      return ['Theory', 'Diagrams / Activity', 'Worksheet'];
    }
    if (normalizedSubject.includes('english')) {
      return ['Reading', 'Grammar', 'Writing Practice'];
    }
    return ['Concepts', 'Class Notes', 'Assessment'];
  };

  const buildSyllabusForSubject = (subjectName = '') => {
    const chapterTitles = getChapterTitlesBySubject(subjectName);
    const subTopicTitles = getSubTopicTitlesBySubject(subjectName);
    const completedChapterCount = Math.max(1, Math.floor(chapterTitles.length * 0.6));

    return chapterTitles.map((chapterTitle, chapterIdx) => {
      const chapterCompleted = chapterIdx < completedChapterCount;
      const chapterInProgress = chapterIdx === completedChapterCount;

      return {
        chapterName: `Chapter ${chapterIdx + 1}: ${chapterTitle}`,
        subTopics: subTopicTitles.map((subTopicTitle, subTopicIdx) => ({
          name: subTopicTitle,
          completed: chapterCompleted || (chapterInProgress && subTopicIdx === 0)
        }))
      };
    });
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.assignedClass) {
      const classToSelect = findAssignedClass(classes);
      if (classToSelect) {
        setSelectedClass(classToSelect);
        // Also switch to timetable tab by default when class is auto-selected
        setActiveTab('timetable');
      }
    }
  }, [classes, currentUser]);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
      fetchLessonPlans();
      fetchSeatingArrangement();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass?.subjects?.length) {
      setSyllabusMap({});
      setExpandedSyllabusSubjectKey(null);
      return;
    }

    const classKey = `${selectedClass.className}-${selectedClass.section}`;
    const savedSyllabus = localStorage.getItem(`syllabus-data-${classKey}`);

    if (savedSyllabus) {
      try {
        const parsed = JSON.parse(savedSyllabus);
        setSyllabusMap(parsed);
      } catch {
        const generatedSyllabus = {};
        selectedClass.subjects.forEach((subject, index) => {
          const subjectKey = `${subject.subjectName}-${index}`;
          generatedSyllabus[subjectKey] = buildSyllabusForSubject(subject.subjectName);
        });
        setSyllabusMap(generatedSyllabus);
        localStorage.setItem(`syllabus-data-${classKey}`, JSON.stringify(generatedSyllabus));
      }
    } else {
      const generatedSyllabus = {};
      selectedClass.subjects.forEach((subject, index) => {
        const subjectKey = `${subject.subjectName}-${index}`;
        generatedSyllabus[subjectKey] = buildSyllabusForSubject(subject.subjectName);
      });
      setSyllabusMap(generatedSyllabus);
      localStorage.setItem(`syllabus-data-${classKey}`, JSON.stringify(generatedSyllabus));
    }

    setExpandedSyllabusSubjectKey(`${selectedClass.subjects[0].subjectName}-0`);
  }, [selectedClass]);

  const saveSyllabusToLocalStorage = (updatedMap) => {
    if (selectedClass) {
      const classKey = `${selectedClass.className}-${selectedClass.section}`;
      localStorage.setItem(`syllabus-data-${classKey}`, JSON.stringify(updatedMap));
    }
  };

  const toggleSubTopicCompletion = (subjectKey, chapterIndex, subTopicIndex) => {
    setSyllabusMap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const subTopic = updated[subjectKey][chapterIndex].subTopics[subTopicIndex];
      subTopic.completed = !subTopic.completed;
      saveSyllabusToLocalStorage(updated);
      return updated;
    });
  };

  const toggleChapterCompletion = (subjectKey, chapterIndex) => {
    setSyllabusMap(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const chapter = updated[subjectKey][chapterIndex];
      const allCompleted = chapter.subTopics.every(st => st.completed);
      chapter.subTopics.forEach(st => { st.completed = !allCompleted; });
      saveSyllabusToLocalStorage(updated);
      return updated;
    });
  };

  const fetchClasses = async () => {
    const assignedClassNumber = extractClassNumber(currentUser?.assignedClass) || '8';
    const assignedSection = getAssignedSection() || 'B';

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      const mockFallbackClass = {
        _id: 'mock_class_id',
        className: `${assignedClassNumber}th`,
        section: assignedSection,
        subjects: [
          { subjectName: 'Mathematics', teacher: { name: 'Mr. Sharma' } },
          { subjectName: 'Science', teacher: { name: 'Mrs. Gupta' } },
          { subjectName: 'English', teacher: { name: 'Mr. Patel' } }
        ],
        students: Array.from({ length: 30 }, (_, i) => ({
          _id: `stu_${i}`,
          name: `Student ${i + 1}`
        }))
      };

      // Filter for classes 8, 9, 10
      let filteredClasses = (response.data.data || []).filter(cls =>
        ['8', '9', '10'].includes(extractClassNumber(cls.className))
      );

      if (assignedClassNumber) {
        const teacherClasses = filteredClasses.filter((cls) =>
          extractClassNumber(cls.className) === assignedClassNumber &&
          (!assignedSection || normalizeSection(cls.section) === assignedSection)
        );

        if (teacherClasses.length > 0) {
          filteredClasses = teacherClasses;
        }
      }

      if (!filteredClasses || filteredClasses.length === 0) {
        filteredClasses = [mockFallbackClass];
      }

      setClasses(filteredClasses);
      const classToSelect = findAssignedClass(filteredClasses);
      if (classToSelect) setSelectedClass(classToSelect);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      const mockFallbackClass = {
        _id: 'mock_class_id',
        className: `${assignedClassNumber}th`,
        section: assignedSection,
        subjects: [
          { subjectName: 'Mathematics', teacher: { name: 'Mr. Sharma' } },
          { subjectName: 'Science', teacher: { name: 'Mrs. Gupta' } },
          { subjectName: 'English', teacher: { name: 'Mr. Patel' } }
        ],
        students: Array.from({ length: 30 }, (_, i) => ({
          _id: `stu_${i}`,
          name: `Student ${i + 1}`
        }))
      };
      setClasses([mockFallbackClass]);
      if (!selectedClass) setSelectedClass(mockFallbackClass);
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    // Mock timetable data - in a real app, this would come from an API
    const mockTimetable = {
      Monday: [
        { period: '1', subject: 'Mathematics', time: '9:00 - 10:00', teacher: 'You' },
        { period: '2', subject: 'Science', time: '10:00 - 11:00', teacher: 'You' },
        { period: '3', subject: 'English', time: '11:30 - 12:30', teacher: 'Other Teacher' },
      ],
      Tuesday: [
        { period: '1', subject: 'Physics', time: '9:00 - 10:00', teacher: 'You' },
        { period: '2', subject: 'Chemistry', time: '10:00 - 11:00', teacher: 'You' },
        { period: '3', subject: 'Mathematics', time: '11:30 - 12:30', teacher: 'You' },
      ],
      Wednesday: [
        { period: '1', subject: 'Biology', time: '9:00 - 10:00', teacher: 'You' },
        { period: '2', subject: 'Mathematics', time: '10:00 - 11:00', teacher: 'You' },
        { period: '3', subject: 'Science', time: '11:30 - 12:30', teacher: 'You' },
      ],
    };
    setTimetable(mockTimetable);
  };

  const fetchLessonPlans = async () => {
    // Mock lesson plans - in a real app, this would come from an API
    const mockPlans = [
      {
        id: 1,
        subject: 'Mathematics',
        topic: 'Algebra Basics',
        date: '2024-01-15',
        duration: '60 mins',
        objectives: 'Understand basic algebraic equations',
        materials: 'Textbook, Calculator'
      },
      {
        id: 2,
        subject: 'Science',
        topic: 'Cell Biology',
        date: '2024-01-16',
        duration: '45 mins',
        objectives: 'Learn about cell structure',
        materials: 'Microscope, Worksheets'
      }
    ];
    setLessonPlans(mockPlans);
  };

  const fetchSeatingArrangement = async () => {
    // Mock seating arrangement - in a real app, this would come from an API
    if (selectedClass) {
      const students = selectedClass.students || [];
      setSeatingArrangement(prev => ({
        ...prev,
        students: students.slice(0, prev.rows * prev.cols)
      }));
    }
  };

  const handleCreateLessonPlan = async (e) => {
    e.preventDefault();

    const newPlan = {
      id: Date.now(),
      ...lessonFormData,
      date: new Date().toISOString().split('T')[0]
    };

    setLessonPlans([...lessonPlans, newPlan]);
    setLessonFormData({
      subject: '',
      topic: '',
      date: '',
      duration: '',
      objectives: '',
      materials: ''
    });
    setShowLessonModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLessonFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeatingInputChange = (e) => {
    const { name, value } = e.target;
    setSeatingArrangement(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  const generateSeatingChart = () => {
    if (selectedClass) {
      const students = [...selectedClass.students];
      const totalSeats = seatingArrangement.rows * seatingArrangement.cols;
      const filledSeats = students.slice(0, totalSeats);

      // Pad with empty seats if needed
      const seats = [...filledSeats];
      while (seats.length < totalSeats) {
        seats.push(null);
      }

      setSeatingArrangement(prev => ({
        ...prev,
        students: seats
      }));
    }
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
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Class Management</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Manage classes, timetable & syllabus</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100/80 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'classes'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Users className="h-4 w-4" />
            Assigned Classes
          </button>
          <button
            onClick={() => {
              if (classes.length > 0 && !selectedClass) {
                // Auto-select the first class if none is selected
                setSelectedClass(findAssignedClass(classes) || classes[0]);
              }
              setActiveTab('timetable');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'timetable'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Clock className="h-4 w-4" />
            Timetable
          </button>
          <button
            onClick={() => {
              if (classes.length > 0 && !selectedClass) {
                setSelectedClass(findAssignedClass(classes) || classes[0]);
              }
              setActiveTab('lesson-plans');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'lesson-plans'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <FileText className="h-4 w-4" />
            Lesson Plans
          </button>
          <button
            onClick={() => {
              if (classes.length > 0 && !selectedClass) {
                setSelectedClass(findAssignedClass(classes) || classes[0]);
              }
              setActiveTab('syllabus');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'syllabus'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Target className="h-4 w-4" />
            Syllabus Tracking
          </button>
        </div>

        <div className="p-6">
          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                  <div
                    key={cls._id}
                    className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${selectedClass?._id === cls._id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                      }`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{cls.className}</h3>
                        <p className="text-gray-600">Section: {cls.section}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{cls.students?.length || 0} Students</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{cls.subjects?.length || 0} Subjects</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Room: {cls.roomNumber || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-700 mb-2">Subjects & Teachers:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {cls.subjects?.map((subject, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>{subject.subjectName}</span>
                            <span className="text-gray-500">{subject.teacher?.name || 'TBA'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {classes.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No classes assigned to you</p>
                  <p className="text-gray-400 text-sm mt-2">Contact administrator to assign classes</p>
                </div>
              )}
            </div>
          )}

          {/* Timetable Tab */}
          {activeTab === 'timetable' && selectedClass && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Timetable for {selectedClass.className} - {selectedClass.section}</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left">Day</th>
                      <th className="px-4 py-3 text-left">Period</th>
                      <th className="px-4 py-3 text-left">Subject</th>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(timetable).map(([day, periods]) => (
                      <React.Fragment key={day}>
                        {periods.map((period, idx) => (
                          <tr key={`${day}-${idx}`} className="border-b hover:bg-gray-50">
                            {idx === 0 && (
                              <td rowSpan={periods.length} className="px-4 py-3 font-medium bg-gray-50">
                                {day}
                              </td>
                            )}
                            <td className="px-4 py-3">{period.period}</td>
                            <td className="px-4 py-3">{period.subject}</td>
                            <td className="px-4 py-3">{period.time}</td>
                            <td className="px-4 py-3">{period.teacher}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lesson Plans Tab */}
          {activeTab === 'lesson-plans' && selectedClass && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Lesson Plans for {selectedClass.className} - {selectedClass.section}</h3>
                <button
                  onClick={() => setShowLessonModal(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Lesson Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessonPlans.map(plan => (
                  <div key={plan.id} className="border rounded-xl p-4 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{plan.topic}</h4>
                        <p className="text-sm text-gray-600">{plan.subject}</p>
                      </div>
                      <span className="text-sm text-gray-500">{plan.date}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm"><strong>Duration:</strong> {plan.duration}</p>
                      <p className="text-sm"><strong>Objectives:</strong> {plan.objectives}</p>
                      <p className="text-sm"><strong>Materials:</strong> {plan.materials}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Syllabus Tracking Tab */}
          {activeTab === 'syllabus' && selectedClass && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Syllabus Tracking for {selectedClass.className} - {selectedClass.section}</h3>

              <div className="space-y-4">
                {selectedClass.subjects?.map((subject, index) => {
                  const subjectKey = `${subject.subjectName}-${index}`;
                  const chapters = syllabusMap[subjectKey] || [];
                  const totalChapters = chapters.length;
                  const completedChapters = chapters.filter((chapter) =>
                    chapter.subTopics.every((subTopic) => subTopic.completed)
                  ).length;
                  const remainingChapters = totalChapters - completedChapters;
                  const progressPercentage = totalChapters > 0
                    ? Math.round((completedChapters / totalChapters) * 100)
                    : 0;
                  const isExpanded = expandedSyllabusSubjectKey === subjectKey;

                  return (
                    <div key={subjectKey} className="border rounded-lg p-4 bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedSyllabusSubjectKey(isExpanded ? null : subjectKey)}
                        className="w-full text-left"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">{subject.subjectName}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-blue-700">{progressPercentage}%</span>
                            <span className="text-xs font-medium text-gray-500">
                              {isExpanded ? 'Hide Chapters' : 'View Chapters'}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
                        <p>Completed: {completedChapters} / {totalChapters}</p>
                        <p>Remaining: {remainingChapters}</p>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {chapters.map((chapter, chapterIndex) => {
                            const completedSubTopics = chapter.subTopics.filter((subTopic) => subTopic.completed).length;
                            const isChapterCompleted = completedSubTopics === chapter.subTopics.length;
                            const isChapterInProgress = !isChapterCompleted && completedSubTopics > 0;
                            const chapterStatusText = isChapterCompleted
                              ? 'Completed'
                              : isChapterInProgress
                                ? 'In Progress'
                                : 'Pending';
                            const chapterStatusClass = isChapterCompleted
                              ? 'bg-green-100 text-green-700'
                              : isChapterInProgress
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700';

                            return (
                              <div key={`${subjectKey}-chapter-${chapterIndex}`} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium text-gray-800">{chapter.chapterName}</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${chapterStatusClass}`}>
                                      {chapterStatusText}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleChapterCompletion(subjectKey, chapterIndex)}
                                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                                        isChapterCompleted
                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                                      }`}
                                    >
                                      {isChapterCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {chapter.subTopics.map((subTopic, subTopicIndex) => (
                                    <button
                                      key={`${subjectKey}-chapter-${chapterIndex}-subtopic-${subTopicIndex}`}
                                      type="button"
                                      onClick={() => toggleSubTopicCompletion(subjectKey, chapterIndex, subTopicIndex)}
                                      className="flex items-center gap-2 text-sm hover:bg-gray-100 rounded px-1 py-0.5 transition-colors text-left"
                                    >
                                      <span className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        subTopic.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'
                                      }`}>
                                        {subTopic.completed && <span className="text-xs">✓</span>}
                                      </span>
                                      <span className={subTopic.completed ? 'text-gray-700 line-through' : 'text-gray-500'}>
                                        {subTopic.name}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Plan Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Lesson Plan</h3>
            <form onSubmit={handleCreateLessonPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  name="subject"
                  value={lessonFormData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Subject</option>
                  {selectedClass?.subjects?.map((subject, idx) => (
                    <option key={idx} value={subject.subjectName}>{subject.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  name="topic"
                  value={lessonFormData.topic}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lesson topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={lessonFormData.duration}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 60 mins"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives</label>
                <textarea
                  name="objectives"
                  value={lessonFormData.objectives}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What should students learn?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Needed</label>
                <input
                  type="text"
                  name="materials"
                  value={lessonFormData.materials}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Books, equipment, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Lesson Plan
                </button>
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
