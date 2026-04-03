import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Users, Mail, MessageCircle, Bell, UserPlus, Hash, AtSign, Search, ChevronDown } from 'lucide-react';
import { apiUrl } from '../../config/api';
import { matchesAssignedTeacherClass } from '../../config/teacherClasses';
import { loadTeacherClasses, loadTeacherStudents } from '../../services/teacherBackendData';

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

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentDropdownRef = useRef(null);

  useEffect(() => {
    fetchClasses();
    fetchAnnouncements();
    fetchConversations();
  }, [currentUser?.email]);

  useEffect(() => {
    fetchStudents();
  }, [classes, currentUser?.email]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
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
      const response = await axios.get(apiUrl('/api/communication/announcements'), {
        params: {
          createdBy: currentUser?._id || '',
          role: 'all',
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

  const handleSendAnnouncement = async () => {
    if (!messageData.subject || !messageData.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(apiUrl('/api/communication/announcement'), {
        title: messageData.subject,
        content: messageData.message,
        priority: messageData.priority,
        recipientType: messageData.recipientType,
        recipientId: messageData.recipientId,
        targetClassId: resolveTargetClassId(),
        createdBy: currentUser?._id || '',
        authorName: currentUser?.name || 'Teacher',
      }, {
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

    try {
      setLoading(true);
      const response = await axios.post(apiUrl('/api/communication/announcement'), {
        title: messageData.subject,
        content: messageData.message,
        priority: messageData.priority,
        recipientType: messageData.recipientType,
        recipientId: messageData.recipientId,
        targetClassId: resolveTargetClassId(),
        createdBy: currentUser?._id || '',
        authorName: currentUser?.name || 'Teacher',
      }, {
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
      (student.name && student.name.toLowerCase().includes(studentSearchTerm.toLowerCase())) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(studentSearchTerm.toLowerCase()))
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

    const selectedStudent = students.find(student => String(student._id) === String(messageData.recipientId));
    return resolveStudentClassId(selectedStudent) || resolveFallbackTeacherClassId();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Announcement</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Send announcements to students & parents</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100/80 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'compose'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Send className="h-4 w-4" />
            Sent Message
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'announcements'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Bell className="h-4 w-4" />
            Announcements
          </button>
        </div>

        <div className="p-6">
          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Compose New Message</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRecipientTypeChange('class')}
                      className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 ${messageData.recipientType === 'class'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      <Users className="h-4 w-4" />
                      Class
                    </button>
                    <button
                      onClick={() => handleRecipientTypeChange('student')}
                      className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 ${messageData.recipientType === 'student'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Student
                    </button>
                    <button
                      onClick={() => handleRecipientTypeChange('parent')}
                      className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 ${messageData.recipientType === 'parent'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      <AtSign className="h-4 w-4" />
                      Parent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={messageData.priority}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {messageData.recipientType !== 'class' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {messageData.recipientType === 'student' ? 'Select Student' : 'Select Parent'}
                  </label>

                  {messageData.recipientType === 'student' ? (
                    <div className="relative" ref={studentDropdownRef}>
                      <div
                        className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
                        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                      >
                        <span className={messageData.recipientId ? 'text-gray-900' : 'text-gray-500'}>
                          {messageData.recipientId
                            ? students.find(s => s._id === messageData.recipientId)?.name
                            : 'Select a student'}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>

                      {showStudentDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div className="p-2 border-b flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              className="w-full outline-none text-sm"
                              placeholder="Search by name or roll number..."
                              value={studentSearchTerm}
                              onChange={(e) => setStudentSearchTerm(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredStudents.length > 0 ? (
                              filteredStudents.map(student => (
                                <div
                                  key={student._id}
                                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                  onClick={() => {
                                    handleInputChange({ target: { name: 'recipientId', value: student._id } });
                                    setShowStudentDropdown(false);
                                    setStudentSearchTerm('');
                                  }}
                                >
                                  <div className="font-medium text-sm">{student.name}</div>
                                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                                    <span>Roll No: {student.rollNumber || 'N/A'}</span>
                                    <span>Class: {student.className || 'N/A'}-{student.section || 'N/A'}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-sm text-gray-500 text-center">No students found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <select
                      name="recipientId"
                      value={messageData.recipientId}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Parent</option>
                      {students.map(student => (
                        <option key={student._id} value={student._id}>
                          {student.fatherName || student.motherName ? `${student.fatherName || student.motherName} (Parent of ${student.name})` : `Parent of ${student.name}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={messageData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  name="message"
                  value={messageData.message}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendMessage}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  <Bell className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Post Announcement'}
                </button>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Announcements</h3>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="border rounded-xl p-4 hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{announcement.title}</h4>
                          <p className="text-gray-600 mt-2">{announcement.content}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                        <span>By {announcement.author}</span>
                        <span>{new Date(announcement.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No announcements yet</p>
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
