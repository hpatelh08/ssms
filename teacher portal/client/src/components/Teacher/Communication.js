import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Users, Mail, MessageCircle, Bell, UserPlus, Hash, AtSign, Search, ChevronDown } from 'lucide-react';
import { apiUrl } from '../../config/api';
import { matchesAssignedTeacherClass } from '../../teacherIdentity';
import { loadTeacherClasses, loadTeacherStudents } from '../../teacherAdminData';

const Communication = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('compose'); // compose, announcements
  const [messageData, setMessageData] = useState({
    recipientType: 'class',
    recipientId: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedStudentRecipients, setSelectedStudentRecipients] = useState([]);
  const [selectedParentRecipients, setSelectedParentRecipients] = useState([]);
  const recipientDropdownRef = useRef(null);
  const teacherSessionKey = currentUser?._id || currentUser?.id || currentUser?.teacherId || currentUser?.email || '';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getStudentMessageKey = (student) => {
    if (!student) return '';
    return String(
      student.studentId
      || student.grNo
      || student.grNumber
      || student.admissionNumber
      || student.rollNumber
      || student._id
      || ''
    ).trim().toUpperCase();
  };

  const findStudentByMessageKey = (value) => {
    const target = String(value || '').trim().toUpperCase();
    return students.find((student) => getStudentMessageKey(student) === target);
  };

  useEffect(() => {
    fetchClasses();
    fetchAnnouncements();
    fetchConversations();
  }, [currentUser?.email]);

  useEffect(() => {
    fetchStudents();
  }, [classes, currentUser?.email]);

  useEffect(() => {
    if (!students.length) return;

    const pendingKey = 'teacher-pending-attendance-sms';
    const raw = localStorage.getItem(pendingKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      const parentIds = Array.isArray(draft?.recipientParentIds) ? draft.recipientParentIds.filter(Boolean) : [];
      if (draft?.recipientType === 'parent' && parentIds.length > 0) {
        setActiveTab('compose');
        setMessageData((prev) => ({
          ...prev,
          recipientType: 'parent',
          recipientId: '',
          subject: draft.subject || prev.subject,
          message: draft.message || prev.message,
        }));
        setSelectedParentRecipients(parentIds);
        setSelectedStudentRecipients([]);
        setRecipientSearchTerm('');
        setShowRecipientDropdown(false);
      }
      localStorage.removeItem(pendingKey);
    } catch (error) {
      console.warn('Failed to load pending attendance draft:', error);
      localStorage.removeItem(pendingKey);
    }
  }, [students]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(event.target)) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.assignedClass) {
      // Find the class ID that matches the user's assigned class
      const classToSelect = classes.find((cls) => matchesAssignedTeacherClass(cls, currentUser));
      if (classToSelect) {
        setMessageData(prev => ({
          ...prev,
          recipientId: classToSelect._id
        }));
      }
    }
  }, [classes, currentUser]);

  const fetchClasses = async () => {
    try {
      const loadedClasses = await loadTeacherClasses(currentUser);
      setClasses(loadedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const fetchedStudents = await loadTeacherStudents(currentUser, classes);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (messageData.recipientId) {
      const selectedClass = classes.find(c => c._id === messageData.recipientId);
      if (selectedClass) {
        // In a real app, you would fetch sections for the class
        setSections(['A', 'B', 'C']); // Mock sections
      }
    }
  }, [messageData.recipientId, classes]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(apiUrl(`/api/messages/teacher/${teacherSessionKey}`), {
        headers: getAuthHeaders(),
        params: {
          createdBy: teacherSessionKey,
          limit: 20,
        },
        timeout: 3000,
      });

      const loadedAnnouncements = response?.data?.data || [];
      setAnnouncements(Array.isArray(loadedAnnouncements) ? loadedAnnouncements : []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  const fetchConversations = async () => {
    try {
      // Mock data for conversations
      setConversations([
        {
          id: 1,
          participant: 'John Smith (Parent)',
          lastMessage: 'Hi, I wanted to discuss my child\'s progress...',
          timestamp: '2 hours ago',
          unread: 2
        },
        {
          id: 2,
          participant: 'Sarah Johnson (Student)',
          lastMessage: 'Can you please clarify the assignment deadline?',
          timestamp: '1 day ago',
          unread: 0
        },
        {
          id: 3,
          participant: 'Mrs. Davis (Colleague)',
          lastMessage: 'Thanks for sharing the lesson plan!',
          timestamp: '3 days ago',
          unread: 0
        }
      ]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMessageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getSelectedRecipientIds = () => {
    if (messageData.recipientType === 'student') return selectedStudentRecipients;
    if (messageData.recipientType === 'parent') return selectedParentRecipients;
    return [];
  };

  const setSelectedRecipientIds = (ids = []) => {
    if (messageData.recipientType === 'student') {
      setSelectedStudentRecipients(ids);
    } else if (messageData.recipientType === 'parent') {
      setSelectedParentRecipients(ids);
    }
  };

  const clearRecipientSelections = () => {
    setSelectedStudentRecipients([]);
    setSelectedParentRecipients([]);
  };

  const toggleRecipientSelection = (student) => {
    const key = getStudentMessageKey(student);
    if (!key) return;
    const next = new Set(getSelectedRecipientIds());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedRecipientIds(Array.from(next));
  };

  const handleSendAnnouncement = async () => {
    if (!messageData.subject || !messageData.message) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedRecipientIds = getSelectedRecipientIds();
    if (messageData.recipientType !== 'class' && selectedRecipientIds.length === 0) {
      alert(`Please select at least one ${messageData.recipientType === 'student' ? 'student' : 'parent'}`);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(apiUrl('/api/messages/send'), {
        title: messageData.subject,
        content: messageData.message,
        priority: messageData.priority,
        recipientType: messageData.recipientType,
        recipientStudentId: messageData.recipientType === 'student' ? (selectedRecipientIds[0] || '') : '',
        recipientStudentIds: messageData.recipientType === 'student' ? selectedRecipientIds : [],
        recipientParentId: messageData.recipientType === 'parent' ? (selectedRecipientIds[0] || '') : '',
        recipientParentIds: messageData.recipientType === 'parent' ? selectedRecipientIds : [],
        recipientClassId: messageData.recipientType === 'class' ? resolveTargetClassId() : '',
        className: currentUser?.assignedClass || '',
        division: currentUser?.division || 'A',
        createdBy: teacherSessionKey,
        senderEmail: currentUser?.email || '',
        senderTeacherId: currentUser?.teacherId || '',
        authorName: currentUser?.name || 'Teacher',
      }, {
        headers: getAuthHeaders(),
        timeout: 3000,
      });

      const savedAnnouncement = response?.data?.data;
      setAnnouncements(prev => (savedAnnouncement ? [savedAnnouncement, ...prev] : prev));
      setSuccess('Announcement sent successfully!');
      setMessageData({
        recipientType: 'class',
        recipientId: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      clearRecipientSelections();
      setRecipientSearchTerm('');
      setShowRecipientDropdown(false);
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending announcement:', error);
      setLoading(false);
      alert(error?.response?.data?.error || 'Failed to send announcement');
    }
  };

  const handleSendMessage = async () => {
    if (!messageData.subject || !messageData.message) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedRecipientIds = getSelectedRecipientIds();
    if (messageData.recipientType !== 'class' && selectedRecipientIds.length === 0) {
      alert(`Please select at least one ${messageData.recipientType === 'student' ? 'student' : 'parent'}`);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(apiUrl('/api/messages/send'), {
        title: messageData.subject,
        content: messageData.message,
        priority: messageData.priority,
        recipientType: messageData.recipientType,
        recipientStudentId: messageData.recipientType === 'student' ? (selectedRecipientIds[0] || '') : '',
        recipientStudentIds: messageData.recipientType === 'student' ? selectedRecipientIds : [],
        recipientParentId: messageData.recipientType === 'parent' ? (selectedRecipientIds[0] || '') : '',
        recipientParentIds: messageData.recipientType === 'parent' ? selectedRecipientIds : [],
        recipientClassId: messageData.recipientType === 'class' ? resolveTargetClassId() : '',
        className: currentUser?.assignedClass || '',
        division: currentUser?.division || 'A',
        createdBy: teacherSessionKey,
        senderEmail: currentUser?.email || '',
        senderTeacherId: currentUser?.teacherId || '',
        authorName: currentUser?.name || 'Teacher',
      }, {
        headers: getAuthHeaders(),
        timeout: 3000,
      });

      const savedMessage = response?.data?.data;
      setAnnouncements(prev => (savedMessage ? [savedMessage, ...prev] : prev));
      setSuccess('Message sent successfully!');
      setMessageData({
        recipientType: 'class',
        recipientId: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      clearRecipientSelections();
      setRecipientSearchTerm('');
      setShowRecipientDropdown(false);
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      alert(error?.response?.data?.error || 'Failed to send message');
    }
  };

  const handleRecipientTypeChange = (type) => {
    setMessageData(prev => ({
      ...prev,
      recipientType: type,
      recipientId: ''
    }));
    clearRecipientSelections();
    setRecipientSearchTerm('');
    setShowRecipientDropdown(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStudents = students.filter(student => {
    return (
      (student.name && student.name.toLowerCase().includes(recipientSearchTerm.toLowerCase())) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(recipientSearchTerm.toLowerCase())) ||
      (student.fatherName && student.fatherName.toLowerCase().includes(recipientSearchTerm.toLowerCase())) ||
      (student.motherName && student.motherName.toLowerCase().includes(recipientSearchTerm.toLowerCase()))
    );
  });

  const extractClassNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    return match ? String(parseInt(match[0], 10)) : '';
  };

  const normalizeSection = (value) => String(value || '').trim().toUpperCase() || 'A';

  const buildAdminClassId = (className, section) => {
    const classNumber = extractClassNumber(className);
    const normalizedSection = normalizeSection(section);
    return classNumber ? `admin-class-${classNumber}-${normalizedSection}` : '';
  };

  const resolveFallbackTeacherClassId = () => {
    return buildAdminClassId(
      currentUser?.assignedClass || currentUser?.className || currentUser?.class || currentUser?.std || getAssignedTeacherClassNumber(currentUser),
      currentUser?.division || currentUser?.section || getAssignedTeacherSection(currentUser)
    );
  };

  const resolveStudentClassId = (student) => {
    if (!student) return '';
    return buildAdminClassId(
      student.className || student.class || student.grade || currentUser?.assignedClass || getAssignedTeacherClassNumber(currentUser),
      student.section || student.division || currentUser?.division || getAssignedTeacherSection(currentUser)
    );
  };

  const resolveTargetClassId = () => {
    if (messageData.recipientType === 'class') {
      const selectedClass = classes.find(c => String(c._id) === String(messageData.recipientId));
      return (
        buildAdminClassId(
          selectedClass?.className || selectedClass?.class || selectedClass?.std || currentUser?.assignedClass || messageData.recipientId,
          selectedClass?.section || selectedClass?.division || currentUser?.division || 'A'
        ) || resolveFallbackTeacherClassId()
      );
    }

    const selectedStudent = findStudentByMessageKey(messageData.recipientId);
    return resolveStudentClassId(selectedStudent) || resolveFallbackTeacherClassId();
  };

  const tabButtonBase =
    'inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2';

  const recipientOptions = [
    { type: 'class', label: 'Class', hint: 'Send to the whole class', icon: Users },
    { type: 'student', label: 'Student', hint: 'Target one or more students', icon: UserPlus },
    { type: 'parent', label: 'Parent', hint: 'Reach one or more parents', icon: AtSign },
  ];

  const priorityMeta = {
    low: {
      label: 'Low',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      swatch: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      badge: 'bg-amber-50 text-amber-700 ring-amber-200',
      swatch: 'bg-amber-500',
    },
    high: {
      label: 'High',
      badge: 'bg-rose-50 text-rose-700 ring-rose-200',
      swatch: 'bg-rose-500',
    },
  };

  const currentPriority = priorityMeta[messageData.priority] || priorityMeta.medium;
  const selectedRecipientIds = getSelectedRecipientIds();
  const selectedRecipientLabel = messageData.recipientType === 'student' ? 'students' : 'parents';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-r from-white via-slate-50 to-indigo-50/70 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_30%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-200/70">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-indigo-600">
                <MessageCircle className="h-3.5 w-3.5" />
                Communication Center
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Announcement</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Send announcements to students & parents with a clean, class-aware workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[340px]">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Active Tab</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {activeTab === 'compose' ? 'Sent Message' : 'Announcements'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Queue</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{announcements.length} Items</div>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Bell className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium">{success}</div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/70 p-3">
          <button
            onClick={() => setActiveTab('compose')}
            className={`${tabButtonBase} ${activeTab === 'compose'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/70'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-sm'
              }`}
          >
            <Send className="h-4 w-4" />
            Sent Message
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`${tabButtonBase} ${activeTab === 'announcements'
              ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg shadow-slate-200/70'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
              }`}
          >
            <Bell className="h-4 w-4" />
            Announcements
          </button>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'compose' && (
            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 p-5 shadow-sm md:p-7">
                <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900">Compose New Message</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose the audience, set priority, and send a polished school update.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <Hash className="h-3.5 w-3.5 text-indigo-500" />
                    Class aware delivery
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">Message Type</label>
                      <span className="text-xs font-medium text-slate-400">Choose one or more recipients</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {recipientOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = messageData.recipientType === option.type;
                        return (
                          <button
                            key={option.type}
                            type="button"
                            onClick={() => handleRecipientTypeChange(option.type)}
                            className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${selected
                              ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-[0_12px_28px_rgba(79,70,229,0.12)]'
                              : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                              }`}
                          >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${selected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                              }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${selected ? 'text-indigo-700' : 'text-slate-800'}`}>
                                {option.label}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">{option.hint}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="priority-select">
                        Priority
                      </label>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${currentPriority.badge}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${currentPriority.swatch}`} />
                        {currentPriority.label}
                      </span>
                    </div>
                    <select
                      id="priority-select"
                      name="priority"
                      value={messageData.priority}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {messageData.recipientType !== 'class' && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-slate-700">
                        {messageData.recipientType === 'student' ? 'Select Students' : 'Select Parents'}
                      </label>
                      <span className="text-xs font-medium text-slate-400">
                        {selectedRecipientIds.length} selected
                      </span>
                    </div>

                    {selectedRecipientIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipientIds.map((recipientId) => {
                          const student = findStudentByMessageKey(recipientId);
                          const label = messageData.recipientType === 'student'
                            ? (student?.name || recipientId)
                            : (student
                              ? (student.fatherName || student.motherName
                                ? `${student.fatherName || student.motherName} • ${student.name}`
                                : `Parent of ${student.name}`)
                              : recipientId);
                          return (
                            <button
                              key={recipientId}
                              type="button"
                              onClick={() => toggleRecipientSelection(student || { studentId: recipientId, _id: recipientId })}
                              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              <span className="h-2 w-2 rounded-full bg-indigo-500" />
                              {label}
                              <span aria-hidden="true" className="text-indigo-400">×</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="relative" ref={recipientDropdownRef}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                        onClick={() => setShowRecipientDropdown((value) => !value)}
                      >
                        <span className={selectedRecipientIds.length ? 'text-slate-900' : 'text-slate-400'}>
                          {selectedRecipientIds.length
                            ? `Selected ${selectedRecipientIds.length} ${selectedRecipientLabel}`
                            : `Choose ${messageData.recipientType === 'student' ? 'students' : 'parents'}`}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>

                      {showRecipientDropdown && (
                        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                              placeholder={messageData.recipientType === 'student'
                                ? 'Search by name or roll number...'
                                : 'Search by parent or student name...'}
                              value={recipientSearchTerm}
                              onChange={(e) => setRecipientSearchTerm(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {filteredStudents.length > 0 ? (
                              filteredStudents.map(student => {
                                const key = getStudentMessageKey(student) || student._id;
                                const checked = selectedRecipientIds.includes(key);
                                const displayName = messageData.recipientType === 'student'
                                  ? student.name
                                  : (student.fatherName || student.motherName
                                    ? `${student.fatherName || student.motherName} (Parent of ${student.name})`
                                    : `Parent of ${student.name}`);
                                return (
                                  <button
                                    type="button"
                                    key={key}
                                    className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50"
                                    onClick={() => toggleRecipientSelection(student)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${checked ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                                        ✓
                                      </span>
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                                        <div className="mt-1 text-xs text-slate-500">
                                          {messageData.recipientType === 'student'
                                            ? `Roll No: ${student.rollNumber || 'N/A'}`
                                            : `Class: ${student.className || 'N/A'}-${student.section || 'N/A'}`}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${checked ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                      {checked ? 'Selected' : 'Add'}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-4 py-6 text-center text-sm text-slate-500">No results found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="subject-input">
                        Subject *
                      </label>
                      <span className="text-xs text-slate-400">Keep it short and clear</span>
                    </div>
                    <input
                      id="subject-input"
                      type="text"
                      name="subject"
                      value={messageData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Enter subject"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="message-input">
                        Message *
                      </label>
                      <span className="text-xs text-slate-400">Add the full announcement or note</span>
                    </div>
                    <textarea
                      id="message-input"
                      name="message"
                      value={messageData.message}
                      onChange={handleInputChange}
                      required
                      rows="7"
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Type your message here..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleSendMessage}
                    disabled={loading}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${loading ? 'cursor-not-allowed bg-slate-400' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 active:translate-y-0'}`}
                  >
                    <Send className="h-4 w-4" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                  <button
                    onClick={handleSendAnnouncement}
                    disabled={loading}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${loading ? 'cursor-not-allowed bg-slate-400' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-700 active:translate-y-0'}`}
                  >
                    <Bell className="h-4 w-4" />
                    {loading ? 'Sending...' : 'Post Announcement'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Recent Announcements</h3>
                <p className="text-sm text-slate-500">A clean history of posted messages and class updates.</p>
              </div>
              {announcements.length > 0 ? (
                <div className="grid gap-4">
                  {announcements.map(announcement => (
                    <div
                      key={announcement.id}
                      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                            <Bell className="h-3.5 w-3.5 text-indigo-500" />
                            Announcement
                          </div>
                          <h4 className="mt-3 text-lg font-extrabold tracking-tight text-slate-900">{announcement.title}</h4>
                          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{announcement.content}</p>
                        </div>
                        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getPriorityColor(announcement.priority)}`}>
                          <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                          {announcement.priority}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          By {announcement.author}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-400" />
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                    <Bell className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-800">No announcements yet</p>
                  <p className="mt-1 text-sm text-slate-500">Posted announcements will appear here once you publish them.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication;
