import React, { useState, useEffect, useRef } from 'react';
import { Users, BookOpen, Calendar, Edit, Eye, Trash2, Clock, Book, Target, User, Monitor, MapPin } from 'lucide-react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { fetchTeacherTeachingTimetable } from '../../services/timetable';
import { loadTeacherClasses } from '../../services/teacherBackendData';

const ADMIN_TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ADMIN_TIMETABLE_ROWS = [
  { type: 'lecture', num: 1 },
  { type: 'lecture', num: 2 },
  { type: 'lecture', num: 3 },
  { type: 'break', label: 'Break' },
  { type: 'lecture', num: 4 },
  { type: 'break', label: 'Lunch Break' },
  { type: 'lecture', num: 5 },
  { type: 'lecture', num: 6 },
  { type: 'lecture', num: 7 }
];

function getAdminTimetableBadgeColor(subject = '') {
  const value = String(subject || '').toLowerCase();
  if (value.includes('math')) return { bg: 'rgba(99,102,241,0.12)', fg: '#4F46E5', border: 'rgba(99,102,241,0.22)' };
  if (value.includes('english')) return { bg: 'rgba(139,92,246,0.12)', fg: '#7C3AED', border: 'rgba(139,92,246,0.22)' };
  if (value.includes('hindi')) return { bg: 'rgba(250,204,21,0.16)', fg: '#B45309', border: 'rgba(250,204,21,0.24)' };
  if (value.includes('gujarati')) return { bg: 'rgba(244,114,182,0.12)', fg: '#DB2777', border: 'rgba(244,114,182,0.22)' };
  if (value.includes('science') || value.includes('evs')) return { bg: 'rgba(34,197,94,0.12)', fg: '#059669', border: 'rgba(34,197,94,0.22)' };
  if (value.includes('drawing')) return { bg: 'rgba(251,146,60,0.14)', fg: '#EA580C', border: 'rgba(251,146,60,0.24)' };
  if (value.includes('pt')) return { bg: 'rgba(14,165,233,0.12)', fg: '#0284C7', border: 'rgba(14,165,233,0.22)' };
  if (value.includes('moral')) return { bg: 'rgba(100,116,139,0.12)', fg: '#475569', border: 'rgba(100,116,139,0.22)' };
  if (value.includes('gk')) return { bg: 'rgba(20,184,166,0.12)', fg: '#0F766E', border: 'rgba(20,184,166,0.22)' };
  if (value.includes('social')) return { bg: 'rgba(249,115,22,0.12)', fg: '#EA580C', border: 'rgba(249,115,22,0.22)' };
  return { bg: 'rgba(129,140,248,0.12)', fg: '#4F46E5', border: 'rgba(129,140,248,0.22)' };
}

const ADMIN_TIMETABLE_CARD_STYLE = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,247,255,0.95) 100%)',
  border: '1px solid rgba(129,140,248,0.16)',
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: '0 18px 45px rgba(99,102,241,0.10)'
};

const ADMIN_TIMETABLE_TABLE_STYLE = {
  width: '100%',
  minWidth: 760,
  borderCollapse: 'separate',
  borderSpacing: 0
};

const ADMIN_TIMETABLE_HEAD_STYLE = {
  padding: '16px 14px',
  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
  color: '#fff',
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 800,
  textAlign: 'left'
};

const ADMIN_TIMETABLE_DAY_HEAD_STYLE = {
  ...ADMIN_TIMETABLE_HEAD_STYLE,
  textAlign: 'center'
};

const ADMIN_TIMETABLE_TIME_CELL_STYLE = {
  padding: '14px 12px',
  borderTop: '1px solid rgba(226,232,240,0.95)',
  color: '#3B3FAF',
  fontSize: 12,
  fontWeight: 800,
  background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(255,255,255,0.92))',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle'
};

const ADMIN_TIMETABLE_EMPTY_STYLE = {
  padding: '12px 10px',
  borderTop: '1px solid rgba(226,232,240,0.95)',
  borderLeft: '1px solid rgba(226,232,240,0.95)',
  textAlign: 'center',
  background: 'rgba(255,255,255,0.90)',
  verticalAlign: 'middle'
};

const ADMIN_TIMETABLE_BREAK_STYLE = {
  background: 'rgba(99,102,241,0.08)'
};

function AdminTimetableTable({
  timetable,
  loading,
  error,
  emptyMessage,
  getTimeLabel,
  renderCell
}) {
  const days = timetable?.days || ADMIN_TIMETABLE_DAYS;

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 px-4 py-10 text-center text-sm text-indigo-600">
        Loading timetable...
      </div>
    );
  }

  if (error || !timetable?.schedule) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 px-4 py-10 text-center text-sm text-indigo-600">
        {error || emptyMessage || 'No timetable available yet.'}
      </div>
    );
  }

  return (
    <div style={ADMIN_TIMETABLE_CARD_STYLE}>
      <div style={{ overflowX: 'auto' }}>
        <table style={ADMIN_TIMETABLE_TABLE_STYLE}>
          <thead>
            <tr>
              <th style={ADMIN_TIMETABLE_HEAD_STYLE}>Time</th>
              {days.map((day) => (
                <th key={day} style={ADMIN_TIMETABLE_DAY_HEAD_STYLE}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ADMIN_TIMETABLE_ROWS.map((row) => {
              if (row.type === 'break') {
                return (
                  <tr key={row.label} style={ADMIN_TIMETABLE_BREAK_STYLE}>
                    <td colSpan={days.length + 1} style={{
                      padding: '12px 14px',
                      borderTop: '1px solid rgba(226,232,240,0.95)',
                      textAlign: 'center',
                      color: '#4F46E5',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.04em'
                    }}>
                      {row.label} ☕ - 20 min
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={`lecture-${row.num}`}>
                  <td style={ADMIN_TIMETABLE_TIME_CELL_STYLE}>
                    <div>Lecture {row.num}</div>
                    <div style={{ fontSize: 10, color: '#8F94D4', fontWeight: 700, marginTop: 3 }}>
                      {getTimeLabel(row)}
                    </div>
                  </td>
                  {days.map((day) => (
                    <td key={`${day}-${row.num}`} style={ADMIN_TIMETABLE_EMPTY_STYLE}>
                      {renderCell({ day, row })}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ClassManagement = ({ currentUser }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [teacherTimetable, setTeacherTimetable] = useState({
    schedule: {},
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });
  const [timetableNote, setTimetableNote] = useState('');
  const [timetableError, setTimetableError] = useState('');
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [classTimetable, setClassTimetable] = useState({
    schedule: {},
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });
  const [classTimetableNote, setClassTimetableNote] = useState('');
  const [classTimetableError, setClassTimetableError] = useState('');
  const [classTimetableLoading, setClassTimetableLoading] = useState(false);
  const [virtualLinks, setVirtualLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [seatingArrangement, setSeatingArrangement] = useState({
    rows: 5,
    cols: 6,
    students: []
  });
  const [syllabusMap, setSyllabusMap] = useState({});
  const [expandedSyllabusSubjectKey, setExpandedSyllabusSubjectKey] = useState(null);
  const teacherTimetableLoadedRef = useRef(false);

  const extractClassNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    return match ? match[0] : '';
  };

  const normalizeSection = (value) => String(value || '').trim().toUpperCase();

  const extractSectionCode = (value) => {
    const normalized = normalizeSection(value);
    const match = normalized.match(/[ABC]/);
    return match ? match[0] : 'A';
  };

  const getAssignedSection = () => {
    const division = normalizeSection(currentUser?.division);
    if (division) return division;

    const classValue = String(currentUser?.assignedClass || '');
    const match = classValue.match(/[-\s]([A-Za-z])$/);
    return match ? normalizeSection(match[1]) : '';
  };

  const getDisplayClassName = (value) => extractClassNumber(value) || String(value || '').trim();

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
      fetchSeatingArrangement();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && activeTab === 'class-timetable') {
      loadClassTimetable();
    }
  }, [selectedClass, activeTab]);

  useEffect(() => {
    if (activeTab !== 'class-timetable' || !selectedClass) return undefined;

    const timer = setInterval(() => {
      loadClassTimetable();
    }, 30000);

    return () => clearInterval(timer);
  }, [selectedClass, activeTab]);

  useEffect(() => {
    if (activeTab !== 'timetable' || teacherTimetableLoadedRef.current) {
      return;
    }

    loadTeacherTimetable();
  }, [currentUser, activeTab]);

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
    try {
      setLoading(true);
      const loadedClasses = await loadTeacherClasses(currentUser);
      setClasses(loadedClasses);
      const classToSelect = findAssignedClass(loadedClasses);
      if (classToSelect) setSelectedClass(classToSelect);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setLoading(false);
    }
  };

  const loadTeacherTimetable = async () => {
    try {
      setTimetableLoading(true);
      const timetableData = await fetchTeacherTeachingTimetable(currentUser);
      setTeacherTimetable({
        schedule: timetableData?.schedule || {},
        days: timetableData?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        slotsWeekday: timetableData?.slotsWeekday || [],
        slotsSaturday: timetableData?.slotsSaturday || [],
        matchedClasses: timetableData?.matchedClasses || [],
        lectureCount: timetableData?.lectureCount || 0
      });
      setTimetableNote(timetableData?.note || '');
      setTimetableError('');
      teacherTimetableLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      setTeacherTimetable({
        schedule: {},
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      });
      setTimetableNote('');
      setTimetableError('Unable to load your teaching timetable right now.');
      teacherTimetableLoadedRef.current = true;
    } finally {
      setTimetableLoading(false);
    }
  };

  const loadClassTimetable = async () => {
    if (!selectedClass) return;

    try {
      setClassTimetableLoading(true);
      const std = extractClassNumber(selectedClass.className);
      const section = extractSectionCode(selectedClass.section);
      const response = await axios.get(apiUrl('/api/class/timetable'), {
        params: { std, section },
        timeout: 5000
      });
      const timetableData = response?.data?.data || response?.data || {};
      setClassTimetable({
        schedule: timetableData?.schedule || {},
        days: timetableData?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        slotsWeekday: timetableData?.slotsWeekday || [],
        slotsSaturday: timetableData?.slotsSaturday || []
      });
      setClassTimetableNote(timetableData?.note || '');
      setClassTimetableError('');
    } catch (error) {
      console.error('Error fetching class timetable:', error);
      setClassTimetable({
        schedule: {},
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      });
      setClassTimetableNote('');
      setClassTimetableError('Unable to load the admin timetable right now.');
    } finally {
      setClassTimetableLoading(false);
    }
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
            Teaching Timetable
          </button>
          <button
            onClick={() => {
              if (classes.length > 0 && !selectedClass) {
                setSelectedClass(findAssignedClass(classes) || classes[0]);
              }
              setActiveTab('class-timetable');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'class-timetable'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Calendar className="h-4 w-4" />
            Class Timetable
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
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">My Teaching Timetable</h3>
                {timetableNote && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {timetableNote}
                  </p>
                )}
                {timetableError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {timetableError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    {teacherTimetable.lectureCount || 0} teaching periods
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    {teacherTimetable.matchedClasses?.length || 0} classes found
                  </span>
                </div>
              </div>

              <AdminTimetableTable
                timetable={teacherTimetable}
                loading={timetableLoading}
                error={timetableError}
                emptyMessage="No teaching timetable available yet."
                getTimeLabel={(row) => teacherTimetable.slotsWeekday?.find((slot) => slot.num === row.num)?.time || ''}
                renderCell={({ day, row }) => {
                  const cell = (teacherTimetable.schedule?.[day] || []).find((slot) => slot.num === row.num && slot.subject);
                  if (!cell) {
                    return <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>-</div>;
                  }

                  const color = getAdminTimetableBadgeColor(cell.subject || '');
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      alignItems: 'stretch',
                      justifyContent: 'center',
                      minHeight: 72,
                      padding: '10px 12px',
                      borderRadius: 16,
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      boxShadow: '0 10px 24px rgba(99,102,241,0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: color.fg, lineHeight: '18px' }}>{cell.subject}</span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: color.fg,
                          background: 'rgba(255,255,255,0.70)',
                          border: `1px solid ${color.border}`,
                          borderRadius: 999,
                          padding: '3px 8px',
                          whiteSpace: 'nowrap'
                        }}>
                          {cell.classLabel || 'TBD'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: color.fg, opacity: 0.82 }}>
                        {cell.time || ''}
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}

          {/* Class Timetable Tab */}
          {activeTab === 'class-timetable' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Class Timetable {selectedClass ? `for ${selectedClass.className} - ${selectedClass.section}` : ''}
                </h3>
                {classTimetableNote && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {classTimetableNote}
                  </p>
                )}
                {classTimetableError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {classTimetableError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    Std {extractClassNumber(selectedClass?.className || currentUser?.assignedClass || '')}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    Section {selectedClass?.section || getAssignedSection() || 'A'}
                  </span>
                </div>
              </div>

              <AdminTimetableTable
                timetable={classTimetable}
                loading={classTimetableLoading}
                error={classTimetableError}
                emptyMessage="No class timetable available yet."
                getTimeLabel={(row) => classTimetable.slotsWeekday?.find((slot) => slot.num === row.num)?.time || ''}
                renderCell={({ day, row }) => {
                  const cell = (classTimetable.schedule?.[day] || []).find((slot) => slot.num === row.num && slot.subject);
                  if (!cell) {
                    return <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>-</div>;
                  }

                  const color = getAdminTimetableBadgeColor(cell.subject || '');
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      alignItems: 'stretch',
                      justifyContent: 'center',
                      minHeight: 72,
                      padding: '10px 12px',
                      borderRadius: 16,
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      boxShadow: '0 10px 24px rgba(99,102,241,0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: color.fg, lineHeight: '18px' }}>{cell.subject}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: color.fg, opacity: 0.82 }}>
                        {cell.time || ''}
                      </div>
                    </div>
                  );
                }}
              />
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

    </div>
  );
};

export default ClassManagement;
