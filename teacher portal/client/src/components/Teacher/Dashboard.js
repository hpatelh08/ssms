import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  BookOpen,
  Users,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle,
  Bell,
  TrendingUp,
  Gift,
  ChevronRight,
  FileText,
  MessageSquare,
  UserCircle,
  Mail,
  LogOut,
  X,
  Camera,
  KeyRound,
  Trash2,
  BarChart3,
  Target,
  Award,
  User,
  Plus
} from 'lucide-react';
import { getAssignedTeacherClassNumber, getAssignedTeacherSection } from '../../teacherIdentity';
import { fetchTeacherTeachingTimetable } from '../../teacherTimetable';
import { loadTeacherNotifications } from '../../teacherAdminData';
import { apiUrl } from '../../config/api';
import {
  normalizeSubjectKey,
  readSyllabusAnalyticsForClass
} from '../../utils/syllabusAnalytics';

function getAdminBackendBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5000';
  }
  const host = window.location.hostname || '127.0.0.1';
  return `${window.location.protocol}//${host}:5000`;
}

function normalizeLookup(value) {
  return String(value || '').trim().toLowerCase();
}

function shouldResolveTeacherProfile(user) {
  const teacherId = String(user?.teacherId || '').trim();
  const email = String(user?.email || '').trim();
  if (!teacherId && !email) return false;

  const name = String(user?.name || '').trim();
  if (!name) return true;
  if (name.toLowerCase() === 'teacher') return true;
  if (teacherId) return name === teacherId;
  return name === email;
}

function parseTeacherClassFromAdmin(rawClass, rawDivision) {
  const classText = String(rawClass || '').trim();
  const divisionText = String(rawDivision || '').trim().toUpperCase();
  const match = classText.match(/(\d+)\s*[- ]?\s*([A-Za-z])?$/);

  if (!match) {
    return {
      assignedClass: classText,
      division: divisionText
    };
  }

  return {
    assignedClass: match[1],
    division: divisionText || String(match[2] || '').trim().toUpperCase()
  };
}

function findTeacherRecord(teachers = [], user = {}) {
  const teacherIdKey = normalizeLookup(user?.teacherId);
  const emailKey = normalizeLookup(user?.email);

  return teachers.find((teacher) => {
    const idKey = normalizeLookup(teacher?.teacher_id || teacher?.teacherId || teacher?.emp || teacher?.id);
    const email = normalizeLookup(teacher?.email);
    return (teacherIdKey && idKey && teacherIdKey === idKey) || (emailKey && emailKey === email);
  });
}

const Dashboard = ({ currentUser, onLogout, onNavigate }) => {
  const LECTURE_DURATION_MINUTES = 40;
  const [resolvedTeacher, setResolvedTeacher] = useState(null);

  const activeTeacher = resolvedTeacher || currentUser;
  const assignedClassNumber = getAssignedTeacherClassNumber(activeTeacher);
  const assignedSection = getAssignedTeacherSection(activeTeacher);
  const assignedClassLabel = `${assignedClassNumber}-${assignedSection}`;
  const timetableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const defaultPendingTasks = [
    { id: 1, title: `Review Classwork (${assignedClassLabel})`, due: 'Today, 5:00 PM', priority: 'high' },
    { id: 2, title: 'Upload Study Material', due: 'Tomorrow, 10:00 AM', priority: 'medium' },
    { id: 3, title: 'Review Leave Requests', due: 'Tomorrow, 2:00 PM', priority: 'low' }
  ];

  const announcements = [
    { id: 1, title: 'Staff Meeting in Main Hall', date: 'Today, 3:00 PM', type: 'urgent' },
    { id: 2, title: 'Science Fair Registration extended', date: 'Oct 25', type: 'info' }
  ];

  const upcomingExams = [
    { id: 1, subject: 'Class Test', class: assignedClassLabel, date: 'This Week', time: '09:00 AM' },
    { id: 2, subject: 'Subject Revision', class: assignedClassLabel, date: 'Next Week', time: '11:00 AM' }
  ];

  const alerts = [
    { id: 1, type: 'birthday', message: `Class ${assignedClassLabel} reminders available today.`, icon: <Gift className="w-5 h-5 text-pink-500" /> },
    { id: 2, type: 'event', message: 'Annual Sports Day planning at 4 PM', icon: <Calendar className="w-5 h-5 text-blue-500" /> }
  ];

  const teacherDisplayName = activeTeacher?.name || 'Teacher';
  const teacherIdentifier = activeTeacher?.teacherId || activeTeacher?.email || '';
  const teacherAssignedClass = activeTeacher?.assignedClass || '';
  const teacherDivision = activeTeacher?.division || '';
  const teacherSubject = activeTeacher?.subject || '';

  const getPtmStorageKey = () => `teacher-ptm-meetings-${teacherIdentifier || 'default'}`;

  const getTodayIsoLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPtmPendingTasks = () => {
    try {
      const todayIso = getTodayIsoLocal();
      const storedMeetings = localStorage.getItem(getPtmStorageKey());
      const parsedMeetings = storedMeetings ? JSON.parse(storedMeetings) : [];
      const meetings = Array.isArray(parsedMeetings) ? parsedMeetings : [];

      return meetings
        .filter((meeting) => meeting?.status !== 'completed' && meeting?.date === todayIso)
        .sort((a, b) => String(a?.time || '00:00').localeCompare(String(b?.time || '00:00')))
        .map((meeting) => ({
          id: `ptm-task-${meeting._id || `${meeting.student?.rollNumber || 'student'}-${meeting.date}-${meeting.time}`}`,
          title: `PTM Meeting: ${meeting.student?.name || 'Student'}`,
          due: `Today${meeting?.time ? `, ${meeting.time}` : ''}`,
          priority: 'high'
        }));
    } catch (error) {
      console.error('Error loading PTM pending tasks:', error);
      return [];
    }
  };

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [ptmPendingTasks, setPtmPendingTasks] = useState([]);
  const [weeklyTimetable, setWeeklyTimetable] = useState(() =>
    timetableDays.map((day) => ({ day, lectures: [] }))
  );
  const [timetableNote, setTimetableNote] = useState('');
  const [timetableError, setTimetableError] = useState('');
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [classSubjectSet, setClassSubjectSet] = useState(null);
  const [teacherNotifications, setTeacherNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [syllabusSyncTick, setSyllabusSyncTick] = useState(0);
  const [teachingNotes, setTeachingNotes] = useState({});
  const [selectedLectureKey, setSelectedLectureKey] = useState('');

  // Attendance summary from localStorage
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, total: 0, uniformYes: 0, uniformNo: 0, idCardYes: 0, idCardNo: 0 });

  useEffect(() => {
    if (!currentUser || !shouldResolveTeacherProfile(currentUser)) return;

    let cancelled = false;
    let retryTimer = null;
    const resolveTeacherProfile = async () => {
      try {
        const response = await axios.get(apiUrl('/api/auth/teacher-lookup'), {
          params: { teacherId: currentUser.teacherId || currentUser.email || '' },
          timeout: 4000
        });
        const match = response?.data?.user;
        if (!match || cancelled) return;

        const parsedClass = parseTeacherClassFromAdmin(match.class, match.division);
        const updatedTeacher = {
          ...currentUser,
          name: String(match.name || currentUser.name || '').trim() || currentUser.name,
          email: String(match.email || currentUser.email || '').trim(),
          teacherId: String(currentUser.teacherId || match.teacher_id || match.emp || match.email || '').trim(),
          assignedClass: String(parsedClass.assignedClass || currentUser.assignedClass || '').trim(),
          division: String(parsedClass.division || currentUser.division || '').trim().toUpperCase(),
          subject: String(currentUser.subject || match.subject || '').trim()
        };

        if (!cancelled) {
          setResolvedTeacher(updatedTeacher);
          localStorage.setItem('user', JSON.stringify(updatedTeacher));
        }
      } catch {
        try {
          const response = await axios.get(`${getAdminBackendBaseUrl()}/api/master/teacher-data`, { timeout: 4000 });
          const payload = response?.data?.data || response?.data || {};
          const teachers = Array.isArray(payload) ? payload : Array.isArray(payload?.teachers) ? payload.teachers : [];
          const match = findTeacherRecord(teachers, currentUser);
          if (!match || cancelled) return;

          const parsedClass = parseTeacherClassFromAdmin(match.class, match.division);
          const updatedTeacher = {
            ...currentUser,
            name: String(match.name || currentUser.name || '').trim() || currentUser.name,
            email: String(match.email || currentUser.email || '').trim(),
            teacherId: String(currentUser.teacherId || match.teacher_id || match.emp || match.email || '').trim(),
            assignedClass: String(parsedClass.assignedClass || currentUser.assignedClass || '').trim(),
            division: String(parsedClass.division || currentUser.division || '').trim().toUpperCase(),
            subject: String(currentUser.subject || match.subject || '').trim()
          };

          if (!cancelled) {
            setResolvedTeacher(updatedTeacher);
            localStorage.setItem('user', JSON.stringify(updatedTeacher));
          }
        } catch {
          if (!cancelled) {
            retryTimer = setTimeout(resolveTeacherProfile, 5000);
          }
        }
      }
    };

    resolveTeacherProfile();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [currentUser]);

  useEffect(() => {
    const loadAttendanceSummary = () => {
      try {
        const stored = localStorage.getItem('attendance-summary');
        if (stored) {
          const parsed = JSON.parse(stored);
          const today = new Date().toISOString().split('T')[0];
          if (parsed.date === today) {
            setAttendanceSummary({
              present: parsed.present || 0,
              absent: parsed.absent || 0,
              total: parsed.total || 0,
              uniformYes: parsed.uniformYes || 0,
              uniformNo: parsed.uniformNo || 0,
              idCardYes: parsed.idCardYes || 0,
              idCardNo: parsed.idCardNo || 0
            });
          } else {
            setAttendanceSummary({ present: 0, absent: 0, total: 0, uniformYes: 0, uniformNo: 0, idCardYes: 0, idCardNo: 0 });
          }
        }
      } catch {
        setAttendanceSummary({ present: 0, absent: 0, total: 0, uniformYes: 0, uniformNo: 0, idCardYes: 0, idCardNo: 0 });
      }
    };

    loadAttendanceSummary();

    const handleStorageChange = (e) => {
      if (!e.key || e.key === 'attendance-summary') {
        loadAttendanceSummary();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const intervalId = setInterval(loadAttendanceSummary, 30 * 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const refreshSyllabusSummary = () => {
      setSyllabusSyncTick((tick) => tick + 1);
    };

    const handleStorageChange = (event) => {
      if (event?.key && !String(event.key).startsWith('syllabus-data-')) return;
      refreshSyllabusSummary();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('syllabus-data-updated', refreshSyllabusSummary);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('syllabus-data-updated', refreshSyllabusSummary);
    };
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!activeTeacher) return;

      try {
        setNotificationsLoading(true);
        const notifications = await loadTeacherNotifications(activeTeacher, 5);
        setTeacherNotifications(Array.isArray(notifications) ? notifications : []);
      } catch (error) {
        console.error('Error loading teacher notifications:', error);
        setTeacherNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);

    return () => clearInterval(intervalId);
  }, [activeTeacher, teacherIdentifier]);

  const parseTimeToMinutes = (timeText) => {
    const match = timeText?.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3] ? match[3].toUpperCase() : '';
    const normalizedHours = period
      ? (period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours)
      : hours;
    return normalizedHours * 60 + minutes;
  };

  const formatMinutesToTime = (totalMinutes) => {
    const minutesInDay = 24 * 60;
    const normalizedMinutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;

    const hours24 = Math.floor(normalizedMinutes / 60);
    const minutes = normalizedMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;

    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const getLectureTimeRange = (startTime) => {
    if (String(startTime || '').includes(' - ')) {
      return startTime;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    if (startMinutes === null) return startTime;

    const endMinutes = startMinutes + LECTURE_DURATION_MINUTES;
    return `${formatMinutesToTime(startMinutes)} - ${formatMinutesToTime(endMinutes)}`;
  };

  const getLectureStatus = (timeRange) => {
    const [startTime, endTime] = timeRange.split('-').map((value) => value.trim());
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null) return 'upcoming';

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    if (nowMinutes < startMinutes) return 'upcoming';
    if (nowMinutes < endMinutes) return 'ongoing';
    return 'completed';
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadTeacherTimetable = async () => {
      if (!activeTeacher) return;

      try {
        setTimetableLoading(true);
        const timetableData = await fetchTeacherTeachingTimetable(activeTeacher);
        const schedule = timetableData.schedule || {};
        const mappedWeeklyTimetable = timetableDays.map((day) => ({
          day,
          lectures: (schedule[day] || [])
            .filter((slot) => !slot?.isBreak && slot?.subject)
            .map((slot) => ({
              id: `${day}-${slot.num}`,
              subject: slot.subject,
              class: slot.classLabel || `${slot.std || assignedClassNumber}-${slot.section || assignedSection}`,
              time: slot.time || '',
              teacher: slot.teacher || '',
              period: slot.num
            }))
        }));

        setWeeklyTimetable(mappedWeeklyTimetable);
        setTimetableNote(timetableData.note || '');
        setTimetableError('');
      } catch (error) {
        console.error('Error loading dashboard timetable:', error);
        setWeeklyTimetable(timetableDays.map((day) => ({ day, lectures: [] })));
        setTimetableNote('');
        setTimetableError('Unable to load your teaching timetable right now.');
      } finally {
        setTimetableLoading(false);
      }
    };

    loadTeacherTimetable();
  }, [activeTeacher, assignedClassNumber, assignedSection]);

  useEffect(() => {
    const loadClassSubjects = async () => {
      if (!assignedClassNumber || !assignedSection) return;
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
            subjectSet.add(normalizeSubjectKey(slot.subject));
          });
        });
        setClassSubjectSet(subjectSet);
      } catch {
        setClassSubjectSet(null);
      }
    };

    loadClassSubjects();
  }, [assignedClassNumber, assignedSection]);

  useEffect(() => {
    const syncPtmPendingTasks = () => {
      setPtmPendingTasks(getPtmPendingTasks());
    };

    syncPtmPendingTasks();

    const intervalId = setInterval(syncPtmPendingTasks, 60 * 1000);
    const handleStorageChange = (event) => {
      if (!event.key || event.key === getPtmStorageKey()) {
        syncPtmPendingTasks();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [teacherIdentifier]);

  const todayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const todayIso = currentTime.toLocaleDateString('en-CA');
  const todaysClasses = weeklyTimetable.find((daySchedule) => daySchedule.day === todayName)?.lectures || [];

  const todaysClassesWithStatus = todaysClasses.map((lecture) => {
    const timeRange = lecture.time || getLectureTimeRange(lecture.startTime);

    return {
      ...lecture,
      time: timeRange,
      status: getLectureStatus(timeRange)
    };
  });

  const todaysLecturePlan = todaysClassesWithStatus;
  const teachingNotesStorageKey = `teacher-teaching-notes-${teacherIdentifier || 'default'}`;

  const buildLectureNoteKey = (lecture) => [
    lecture.subject || '',
    lecture.class || '',
    lecture.time || '',
    lecture.startTime || '',
    lecture.room || ''
  ].join('|');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(teachingNotesStorageKey);
      const parsed = stored ? JSON.parse(stored) : {};
      setTeachingNotes(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
    } catch {
      setTeachingNotes({});
    }
  }, [teachingNotesStorageKey]);

  const handleTeachingNoteChange = (lecture, value) => {
    const lectureKey = buildLectureNoteKey(lecture);
    setTeachingNotes((prev) => {
      const nextNotes = {
        ...prev,
        [todayIso]: {
          ...(prev[todayIso] || {}),
          [lectureKey]: value
        }
      };
      localStorage.setItem(teachingNotesStorageKey, JSON.stringify(nextNotes));
      return nextNotes;
    });
  };

  const getTeachingNoteValue = (lecture) => {
    const lectureKey = buildLectureNoteKey(lecture);
    return teachingNotes?.[todayIso]?.[lectureKey] || '';
  };

  const isLectureSelected = (lecture) => selectedLectureKey === buildLectureNoteKey(lecture);

  const getTeachingNotePreview = (lecture) => {
    const note = getTeachingNoteValue(lecture).trim();
    if (!note) return '';
    return note.length > 140 ? `${note.slice(0, 140)}...` : note;
  };

  const handleAddTeachingNote = (lecture) => {
    if (lecture) {
      const note = getTeachingNoteValue(lecture).trim();
      if (!note) return;
    }
    setSelectedLectureKey('');
  };

  const pendingTasks = [...defaultPendingTasks, ...ptmPendingTasks];
  const highPriorityTaskCount = pendingTasks.filter((task) => task.priority === 'high').length;

  const getTasksStorageKey = () => `teacher-todo-tasks-${teacherIdentifier || 'default'}`;

  const [todoTasks, setTodoTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(`teacher-todo-tasks-${teacherIdentifier || 'default'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    localStorage.setItem(getTasksStorageKey(), JSON.stringify(todoTasks));
  }, [todoTasks, teacherIdentifier]);

  const handleAddTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    setTodoTasks((prev) => [
      ...prev,
      { id: Date.now(), title: trimmed, completed: false }
    ]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (id) => {
    setTodoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id) => {
    setTodoTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });
  const [showAlertsEvents, setShowAlertsEvents] = useState(false);
  const [showRecentUpdates, setShowRecentUpdates] = useState(true);

  const profileInputRef = useRef(null);
  const alertsEventsRef = useRef(null);
  const recentAnnouncementsRef = useRef(null);

  useEffect(() => {
    const storageKey = teacherIdentifier || 'default';
    if (!storageKey) return;
    const savedImage = localStorage.getItem(`teacher-profile-image-${storageKey}`) || '';
    setProfileImage(savedImage);
  }, [teacherIdentifier]);

  useEffect(() => {
    if (!showProfileModal && !showTimetableModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showProfileModal, showTimetableModal]);

  const handleProfileLogout = () => {
    if (!onLogout) return;

    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const handleQuickAction = (targetPage) => {
    if (!onNavigate) return;
    onNavigate(targetPage);
  };

  const openRecentAnnouncements = () => {
    setShowRecentUpdates(true);
    setShowAlertsEvents(true);
    requestAnimationFrame(() => {
      (recentAnnouncementsRef.current || alertsEventsRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleProfileImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return;

    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const imageData = fileReader.result;
      if (typeof imageData !== 'string') return;

      setProfileImage(imageData);
      const storageKey = teacherIdentifier || 'default';
      if (storageKey) {
        localStorage.setItem(`teacher-profile-image-${storageKey}`, imageData);
      }
      event.target.value = '';
    };

    fileReader.readAsDataURL(selectedFile);
  };

  const handleProfileImageRemove = () => {
    setProfileImage('');
    const storageKey = teacherIdentifier || 'default';
    if (storageKey) {
      localStorage.removeItem(`teacher-profile-image-${storageKey}`);
    }
    if (profileInputRef.current) {
      profileInputRef.current.value = '';
    }
  };

  const handlePasswordChangeSubmit = (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Please fill all password fields.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordFeedback({ type: 'success', message: 'Password updated successfully.' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getLectureStatusStyle = (status) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'ongoing') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  const currentHour = currentTime.getHours();
  let greeting = 'Good Evening';
  if (currentHour < 12) {
    greeting = 'Good Morning';
  } else if (currentHour < 18) {
    greeting = 'Good Afternoon';
  }

  if (!currentUser) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 px-4 py-3 rounded-lg">
        User data not found. Please login again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {/* Header with Greeting and Gamification */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white to-indigo-50/50 p-6 rounded-3xl shadow-soft border border-gray-100/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center hover:from-indigo-200 hover:to-purple-200 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <UserCircle className="w-10 h-10" />
            )}
          </button>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">{greeting}, {teacherDisplayName}!</h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Here's your overview for today</p>
          </div>
        </div>
      </div>

      {/* Actionable Insights Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" /> Actionable Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => handleQuickAction('attendance')}
            className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 font-medium">Present Students</p>
                <h3 className="text-3xl font-bold mt-2">{attendanceSummary.present}</h3>
                <p className="text-emerald-100 text-sm mt-2 flex items-center gap-1 font-medium bg-emerald-400/30 w-max px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Today
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div
            onClick={() => handleQuickAction('attendance')}
            className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-100 font-medium">Absent Students</p>
                <h3 className="text-3xl font-bold mt-2">{attendanceSummary.absent}</h3>
                <p className="text-red-100 text-sm mt-2 flex items-center gap-1 font-medium bg-red-400/30 w-max px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" /> Today
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div
            onClick={() => handleQuickAction('attendance')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 font-medium">Uniform</p>
                <h3 className="text-3xl font-bold mt-2">{attendanceSummary.uniformNo}</h3>
                <p className="text-blue-100 text-sm mt-2 flex items-center gap-1 font-medium bg-blue-400/30 w-max px-2 py-0.5 rounded-full">
                  Without Uniform
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div
            onClick={() => handleQuickAction('attendance')}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 font-medium">ID Card</p>
                <h3 className="text-3xl font-bold mt-2">{attendanceSummary.idCardNo}</h3>
                <p className="text-purple-100 text-sm mt-2 font-medium bg-purple-400/30 w-max px-2 py-0.5 rounded-full">
                  Without ID Card
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Today's Classes
              </h3>
              <button
                onClick={() => setShowTimetableModal(true)}
                className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                View Timetable <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            {timetableNote && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {timetableNote}
              </div>
            )}
            {timetableError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {timetableError}
              </div>
            )}
            {timetableLoading ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Loading timetable for Class {assignedClassLabel}...
              </div>
            ) : todaysClassesWithStatus.length > 0 ? (
              <div className="space-y-4">
                {todaysClassesWithStatus.map((cls) => (
                  <div key={cls.id} className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group shadow-sm hover:shadow">
                    <div
                      className={`w-1.5 h-12 rounded-full mr-4 ${cls.status === 'completed'
                        ? 'bg-emerald-400'
                        : cls.status === 'ongoing'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-gray-300'
                        }`}
                    ></div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800">{cls.subject}</h4>
                      <p className="text-gray-500 text-sm font-medium">{cls.class} - {cls.time}</p>
                    </div>
                    <div>
                      {cls.status === 'completed' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Completed</span>}
                      {cls.status === 'ongoing' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                          Ongoing
                        </span>
                      )}
                      {cls.status === 'upcoming' && (
                        <button className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 shadow-sm">
                          Start Session
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                No lectures scheduled for today in Class {assignedClassLabel}.
              </div>
            )}
          </div>

          {/* Student Performance Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Performance Summary
              </h3>
            </div>
            <div className="space-y-6">
              {(() => {
                const gradientColors = [
                  'from-blue-500 to-blue-600',
                  'from-emerald-400 to-emerald-500',
                  'from-indigo-500 to-purple-500',
                  'from-pink-400 to-rose-500',
                  'from-amber-400 to-orange-500',
                  'from-cyan-400 to-teal-500',
                ];
                const hoverColors = [
                  'group-hover:from-blue-400 group-hover:to-blue-500',
                  'group-hover:from-emerald-300 group-hover:to-emerald-400',
                  'group-hover:from-indigo-400 group-hover:to-purple-400',
                  'group-hover:from-pink-300 group-hover:to-rose-400',
                  'group-hover:from-amber-300 group-hover:to-orange-400',
                  'group-hover:from-cyan-300 group-hover:to-teal-400',
                ];

                const uniqueSyllabusResults = readSyllabusAnalyticsForClass(assignedClassNumber, assignedSection)
                  .map((item) => ({
                    subjectName: item.subjectName,
                    percent: item.percent
                  }))
                  .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

                const filteredResults = classSubjectSet && classSubjectSet.size > 0
                  ? uniqueSyllabusResults.filter((item) => classSubjectSet.has(normalizeSubjectKey(item.subjectName)))
                  : uniqueSyllabusResults;

                if (filteredResults.length === 0) {
                  // Fallback if no syllabus data
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No syllabus data available</p>
                      <p className="text-xs mt-1">Complete syllabus in Class Management to see progress here</p>
                    </div>
                  );
                }

                return filteredResults.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between text-sm mb-2 text-gray-700 font-bold">
                      <span>{item.subjectName}</span>
                      <span>{item.percent}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${gradientColors[idx % gradientColors.length]} h-3 rounded-full ${hoverColors[idx % hoverColors.length]} transition-colors duration-300`}
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Birthday/Event Alerts */}
          {showAlertsEvents && (
            <div ref={alertsEventsRef} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-sm border border-pink-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-pink-500 animate-bounce" /> Alerts & Events
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAlertsEvents(false)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-pink-200 bg-white text-pink-600 hover:bg-pink-50 hover:text-pink-700 transition-colors shadow-sm"
                  aria-label="Close alerts and events"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 bg-white/70 backdrop-blur-sm p-3.5 rounded-xl border border-pink-200/50 shadow-sm transition-transform hover:-translate-y-0.5">
                    <div className="mt-0.5 bg-white p-1.5 rounded-lg shadow-sm">{alert.icon}</div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcement */}
          {showRecentUpdates && (
            <div ref={recentAnnouncementsRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-lg font-bold text-gray-800">Announcement</h3>
                <button
                  type="button"
                  onClick={() => setShowRecentUpdates(false)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
                  aria-label="Close recent updates"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-bold text-gray-700">New Student Notifications</p>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                    {teacherNotifications.length} items
                  </span>
                </div>
                <div className="space-y-3">
                  {notificationsLoading && (
                    <div className="text-sm text-gray-500 font-medium">Loading notifications...</div>
                  )}
                  {!notificationsLoading && teacherNotifications.length === 0 && (
                    <div className="text-sm text-gray-500 font-medium">
                      No new student notifications right now.
                    </div>
                  )}
                  {teacherNotifications.map((notification) => (
                    <div
                      key={`recent-${notification.id}`}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${notification.type === 'student_added' ? 'border-emerald-100 bg-emerald-50/70' : 'border-gray-100 bg-gray-50/70'}`}
                    >
                      <div className="mt-0.5 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                        {notification.type === 'student_added' ? 'NEW' : 'INFO'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.body}</p>
                      </div>
                      <div className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-3">Recent Announcements</p>
                <div className="space-y-5 px-2">
                  {announcements.map((ann, idx) => (
                    <div key={ann.id} className="relative flex items-start gap-4">
                      {idx !== announcements.length - 1 && (
                        <div className="absolute top-5 left-1.5 w-0.5 h-[calc(100%+0.5rem)] bg-gray-200 -z-10" />
                      )}
                      <div className={`mt-1 flex-shrink-0 w-3.5 h-3.5 rounded-full border-[3px] shadow-sm box-content bg-white ${ann.type === 'urgent' ? 'border-red-500' : 'border-blue-500'}`} />
                      <div className="flex-1 pb-1">
                        <p className={`text-sm font-bold ${ann.type === 'urgent' ? 'text-red-600' : 'text-gray-800'} leading-snug`}>
                          {ann.title}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 mt-1.5 bg-gray-50 w-max px-2 py-0.5 rounded-md">{ann.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Narrower) */}
        <div className="space-y-6">
          {/* Today's To-Do List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-500" /> Today's Tasks
              </h3>
              <span className="text-xs font-bold text-gray-400">{todoTasks.filter(t => !t.completed).length} remaining</span>
            </div>

            {/* Add Task Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a new task..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
              <button
                onClick={handleAddTask}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {todoTasks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No tasks yet. Add one above!</p>
              )}
              {todoTasks.map((task) => (
                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
                  task.completed ? 'border-green-100 bg-green-50/40' : 'border-gray-100 hover:border-amber-200 hover:bg-amber-50/30'
                }`}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                  />
                  <p className={`text-sm font-bold flex-1 ${
                    task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}>
                    {task.title}
                  </p>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickAction('students')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all border border-gray-100 group shadow-sm hover:shadow"
              >
                <Users className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-700">Add Student</span>
              </button>
              <button
                type="button"
                onClick={openRecentAnnouncements}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-purple-50 hover:border-purple-100 transition-all border border-gray-100 group shadow-sm hover:shadow"
              >
                <Bell className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-purple-700">Notification</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('communication')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all border border-gray-100 group shadow-sm hover:shadow"
              >
                <MessageSquare className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-700">Message</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTimetableModal(true)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition-all border border-gray-100 group shadow-sm hover:shadow"
              >
                <Calendar className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700">Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('study-materials')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-amber-50 hover:border-amber-100 transition-all border border-gray-100 group shadow-sm hover:shadow"
              >
                <BookOpen className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-amber-700">Upload Notes</span>
              </button>
              <button
                type="button"
                onClick={openRecentAnnouncements}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-pink-50 hover:border-pink-100 transition-all border border-gray-100 group shadow-sm hover:shadow"
              >
                <Bell className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-pink-700">Announcement</span>
              </button>
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Upcoming Exams
              </h3>
            </div>
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="p-4 rounded-xl border border-blue-50 bg-gradient-to-r from-blue-50/50 to-transparent hover:from-blue-50 transition-colors">
                  <p className="text-sm font-bold text-gray-800">{exam.subject}</p>
                  <div className="flex justify-between items-center mt-3 text-xs text-gray-600 font-semibold gap-2">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">{exam.class}</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm text-indigo-600">{exam.date} - {exam.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" onClick={() => setShowTimetableModal(false)}></div>

          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-indigo-100 bg-white shadow-2xl">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-5 sm:px-7 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Weekly Timetable</h3>
                <p className="text-sm text-indigo-600 font-semibold mt-1">Class {assignedClassLabel} timetable from Admin Portal</p>
              </div>
              <button
                onClick={() => setShowTimetableModal(false)}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {timetableNote && (
              <div className="mx-5 mt-5 sm:mx-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {timetableNote}
              </div>
            )}
            {timetableError && (
              <div className="mx-5 mt-5 sm:mx-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {timetableError}
              </div>
            )}

            <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyTimetable.map((daySchedule) => (
                <div key={daySchedule.day} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                    <p className="text-base font-bold text-indigo-800">{daySchedule.day}</p>
                  </div>

                  <div className="p-4 space-y-3">
                    {timetableLoading && (
                      <p className="text-sm font-medium text-gray-500">Loading timetable...</p>
                    )}

                    {!timetableLoading && daySchedule.lectures.length === 0 && (
                      <p className="text-sm font-medium text-gray-500">No lectures scheduled</p>
                    )}

                    {daySchedule.lectures.map((lecture) => (
                      <div key={lecture.id} className="rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2.5">
                        <p className="text-sm font-bold text-gray-800">{lecture.subject}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Class {lecture.class} - {lecture.time || getLectureTimeRange(lecture.startTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-md" onClick={() => setShowProfileModal(false)}></div>

          <div className="relative z-10 w-full max-w-5xl max-h-[92vh] rounded-3xl border border-indigo-100 bg-white shadow-2xl flex flex-col overflow-hidden mt-4">
            <div className="z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-5 sm:px-7 py-4 flex items-center justify-between rounded-t-3xl flex-shrink-0">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Teacher Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-10 h-10 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-5">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center">
                      {profileImage ? (
                        <img src={profileImage} alt="Teacher profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-16 h-16 text-indigo-500" />
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-lg font-bold text-gray-800">{teacherDisplayName}</p>
                      <p className="text-sm text-gray-600 capitalize mb-2">{currentUser?.role || 'teacher'}</p>

                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                          <User className="w-4 h-4" />
                          {teacherDisplayName}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                          <BookOpen className="w-4 h-4" />
                          Class {teacherAssignedClass || assignedClassNumber}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                          <Users className="w-4 h-4" />
                          Division {teacherDivision || assignedSection}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                          <Award className="w-4 h-4" />
                          {teacherSubject || 'Teacher'}
                        </span>
                      </div>

                      <input
                        ref={profileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        <button
                          onClick={() => profileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
                        >
                          <Camera className="w-4 h-4" /> Upload Profile Picture
                        </button>
                        <button
                          onClick={handleProfileImageRemove}
                          disabled={!profileImage}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${profileImage
                            ? 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          <Trash2 className="w-4 h-4" /> Remove Profile Picture
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <p className="bg-white/90 border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      {teacherIdentifier}
                    </p>
                    <p className="bg-white/90 border border-indigo-100 rounded-lg px-3 py-2 text-gray-700">
                      <span className="font-semibold">Total Today's Lectures:</span> {todaysLecturePlan.length}
                    </p>
                  </div>

                  <button
                    onClick={handleProfileLogout}
                    disabled={!onLogout}
                    className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${onLogout ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'
                      }`}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h4 className="text-base font-bold text-gray-800 mb-4">Today's Lecture Class and Time</h4>
                  <div className="space-y-3">
                    {todaysLecturePlan.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No lectures scheduled for {todayName}.
                      </p>
                    )}
                    {todaysLecturePlan.map((lecture) => (
                        <div key={`lecture-${lecture.id}`} className="p-3 rounded-lg border border-gray-100 bg-gray-50/70">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{lecture.subject}</p>
                              <p className="text-xs text-gray-600">Class {lecture.class} - {lecture.time}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getLectureStatusStyle(lecture.status)}`}>
                              {lecture.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h4 className="text-base font-bold text-gray-800 mb-4">What to Teach in Today's Classes</h4>
                  <div className="space-y-3">
                    {todaysLecturePlan.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No lectures scheduled for {todayName}.
                      </p>
                    )}
                    {todaysLecturePlan.map((lecture) => (
                      <div
                        key={`plan-${lecture.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedLectureKey(buildLectureNoteKey(lecture))}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedLectureKey(buildLectureNoteKey(lecture));
                          }
                        }}
                        className={`rounded-lg border p-3.5 transition-colors cursor-pointer ${isLectureSelected(lecture)
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm font-bold text-indigo-700 mb-1">
                              {lecture.subject} - Class {lecture.class}
                            </p>
                            <p className="text-xs text-gray-500">{lecture.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getLectureStatusStyle(lecture.status)}`}>
                              {lecture.status}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedLectureKey(buildLectureNoteKey(lecture));
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
                              aria-label="Add teaching note"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {isLectureSelected(lecture) ? (
                          <div className="space-y-3">
                            <textarea
                              value={getTeachingNoteValue(lecture)}
                              onChange={(event) => handleTeachingNoteChange(lecture, event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                              placeholder="Write what you want to teach today..."
                              rows={4}
                              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 resize-none"
                            />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleAddTeachingNote(lecture);
                              }}
                              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          getTeachingNotePreview(lecture) ? (
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-700">
                              {getTeachingNotePreview(lecture)}
                            </p>
                          ) : null
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" /> Change Password
                  </h4>
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />

                    {passwordFeedback.message && (
                      <p
                        className={`text-sm font-medium ${passwordFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                      >
                        {passwordFeedback.message}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
