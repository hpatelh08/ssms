import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Check, X, Clock, Download, MessageSquare, Phone, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AttendanceManagement = ({ currentUser }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('daily');

  // Search states for reports
  const [monthlySearch, setMonthlySearch] = useState('');
  const [monthlySelected, setMonthlySelected] = useState('');

  const [individualSearch, setIndividualSearch] = useState('');
  const [individualSelected, setIndividualSelected] = useState('');

  const [summarySearch, setSummarySearch] = useState('');
  const [summarySelected, setSummarySelected] = useState('');

  const monthlySelectedStudent = students.find((s) => s._id === monthlySelected);
  const individualSelectedStudent = students.find((s) => s._id === individualSelected);
  const summarySelectedStudent = students.find((s) => s._id === summarySelected);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsInClass(selectedClass);
    }
  }, [selectedClass]);

  // Load saved attendance when date changes
  useEffect(() => {
    if (!selectedDate || students.length === 0) return;
    const saved = localStorage.getItem(`attendance-data-${selectedClass}-${selectedDate}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAttendanceData(parsed);
      } catch {
        // If parse fails, keep current data
      }
    } else {
      // Reset to default for new date
      const initialAttendance = {};
      students.forEach(student => {
        initialAttendance[student._id] = {
          status: 'present',
          uniformStatus: 'yes',
          idCardStatus: 'yes',
          remarks: ''
        };
      });
      setAttendanceData(initialAttendance);
    }
  }, [selectedDate, students, selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });

      const assignedClasses = response.data.data || [];

      let activeUser = currentUser;
      if (!activeUser) {
        try {
          activeUser = JSON.parse(localStorage.getItem('user'));
        } catch { }
      }

      const normalizedAssignedClass = String(activeUser?.assignedClass || '').trim().toLowerCase();
      const normalizedAssignedSection = String(activeUser?.division || '').trim().toLowerCase();

      let visibleClasses = assignedClasses;

      if (normalizedAssignedClass && normalizedAssignedSection) {
        const classTeacherClass = assignedClasses.find((cls) => (
          String(cls.className || '').trim().toLowerCase() === normalizedAssignedClass &&
          String(cls.section || '').trim().toLowerCase() === normalizedAssignedSection
        ));
        visibleClasses = classTeacherClass ? [classTeacherClass] : [];
      } else if (normalizedAssignedClass) {
        visibleClasses = assignedClasses.filter((cls) => String(cls.className || '').trim().toLowerCase() === normalizedAssignedClass);
      }

      if (!visibleClasses || visibleClasses.length === 0) {
        visibleClasses = [{ _id: 'mock_class_id', className: '10th', section: 'A' }];
      }

      setClasses(visibleClasses);
      if (visibleClasses.length > 0 && !selectedClass) {
        setSelectedClass(visibleClasses[0]._id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      const mockClasses = [{ _id: 'mock_class_id', className: '10th', section: 'A' }];
      setClasses(mockClasses);
      if (!selectedClass) setSelectedClass(mockClasses[0]._id);
      setLoading(false);
    }
  };

  const fetchStudentsInClass = async (classId) => {
    try {
      setLoading(true);
      // MOCK 45 Indian Students as requested
      const indianNames = [
        "Aarav Sharma", "Vivaan Patel", "Aditya Singh", "Vihaan Kumar", "Arjun Gupta",
        "Sai Krishna", "Reyansh Reddy", "Ayaan Khan", "Krishna Iyer", "Ishaan Verma",
        "Rudra Joshi", "Dhruv Desai", "Kabir Das", "Atharv Yadav", "Rishi Tiwari",
        "Adwait Pandey", "Aanya Sharma", "Diya Patel", "Ananya Singh", "Myra Kumar",
        "Kavya Gupta", "Siya Reddy", "Navya Khan", "Aaradhya Iyer", "Saanvi Verma",
        "Nyra Joshi", "Sneha Desai", "Ira Das", "Riya Yadav", "Tara Tiwari",
        "Kiara Pandey", "Advik Nair", "Pranav Menon", "Rohan Sethi", "Karthik Pillai",
        "Siddharth Rao", "Neel Thakur", "Dev Bhardwaj", "Rahul Chatterjee", "Nikhil Sen",
        "Mira Nair", "Anika Menon", "Zara Sethi", "Nisha Thakur", "Pooja Bhardwaj"
      ];

      const mockStudentsData = indianNames.map((name, index) => ({
        _id: `MOCK_STU_${index + 1}`,
        studentId: `STU${String(index + 1).padStart(3, '0')}`,
        name: name
      }));

      setStudents(mockStudentsData);

      // Check if there's saved attendance for this date
      const saved = localStorage.getItem(`attendance-data-${classId}-${selectedDate}`);
      if (saved) {
        try {
          setAttendanceData(JSON.parse(saved));
        } catch {
          const initialAttendance = {};
          mockStudentsData.forEach(student => {
            initialAttendance[student._id] = {
              status: 'present',
              uniformStatus: 'yes',
              idCardStatus: 'yes',
              remarks: ''
            };
          });
          setAttendanceData(initialAttendance);
        }
      } else {
        // Initialize attendance data default to present
        const initialAttendance = {};
        mockStudentsData.forEach(student => {
          initialAttendance[student._id] = {
            status: 'present',
            uniformStatus: 'yes',
            idCardStatus: 'yes',
            remarks: ''
          };
        });
        setAttendanceData(initialAttendance);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleUniformChange = (studentId, uniformStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], uniformStatus }
    }));
  };

  const handleIdCardChange = (studentId, idCardStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], idCardStatus }
    }));
  };

  const submitAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const attendanceDataArray = Object.keys(attendanceData).map(studentId => ({
        studentId,
        status: attendanceData[studentId].status,
        uniformStatus: attendanceData[studentId].uniformStatus || 'yes',
        idCardStatus: attendanceData[studentId].idCardStatus || 'yes',
        remarks: attendanceData[studentId].remarks
      }));

      // Save attendance summary to localStorage for Dashboard (always runs)
      const presentCount = Object.values(attendanceData).filter(a => a.status === 'present').length;
      const absentCount = Object.values(attendanceData).filter(a => a.status === 'absent').length;
      const uniformYes = Object.values(attendanceData).filter(a => a.uniformStatus === 'yes').length;
      const uniformNo = Object.values(attendanceData).filter(a => a.uniformStatus === 'no').length;
      const idCardYes = Object.values(attendanceData).filter(a => a.idCardStatus === 'yes').length;
      const idCardNo = Object.values(attendanceData).filter(a => a.idCardStatus === 'no').length;
      const totalCount = Object.keys(attendanceData).length;
      const summary = {
        date: selectedDate,
        present: presentCount,
        absent: absentCount,
        total: totalCount,
        uniformYes,
        uniformNo,
        idCardYes,
        idCardNo,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('attendance-summary', JSON.stringify(summary));

      // Save full attendance data per date for persistence
      localStorage.setItem(`attendance-data-${selectedClass}-${selectedDate}`, JSON.stringify(attendanceData));

      // Also save full attendance records for export
      const fullRecords = Object.keys(attendanceData).map(studentId => {
        const student = students.find(s => s._id === studentId);
        return {
          studentId,
          studentName: student?.name || '',
          status: attendanceData[studentId].status,
          uniformStatus: attendanceData[studentId].uniformStatus || 'yes',
          idCardStatus: attendanceData[studentId].idCardStatus || 'yes',
          remarks: attendanceData[studentId].remarks || ''
        };
      });
      localStorage.setItem('attendance-records', JSON.stringify({
        date: selectedDate,
        classId: selectedClass,
        records: fullRecords
      }));

      try {
        await axios.post('http://localhost:5000/api/teacher/attendance', {
          classId: selectedClass,
          date: selectedDate,
          attendanceData: attendanceDataArray
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (apiError) {
        console.warn('API save failed, data saved locally:', apiError.message);
      }

      setSuccess('Attendance saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Default to current month if dates aren't set
    const start = fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = toDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Monthly Attendance Report', 14, 22);
      doc.setFontSize(12);

      if (monthlySelected) {
        // Single student export
        const student = students.find(s => s._id === monthlySelected);
        if (!student) return;

        doc.text(`Student: ${student.name} (${student.studentId})`, 14, 32);
        doc.text(`Date Range: ${start} to ${end}`, 14, 40);

        const tableData = [
          [selectedDate, attendanceData[student._id]?.status || 'present', attendanceData[student._id]?.uniformStatus || 'yes', attendanceData[student._id]?.idCardStatus || 'yes', attendanceData[student._id]?.remarks || 'N/A'],
        ];

        autoTable(doc, {
          startY: 50,
          head: [['Date', 'Status', 'Uniform', 'ID Card', 'Remarks']],
          body: tableData,
        });

        doc.save(`Attendance_Monthly_${student.studentId}.pdf`);
      } else {
        // All students export
        doc.text(`All Students Report`, 14, 32);
        doc.text(`Date: ${selectedDate}`, 14, 40);

        const tableData = students.map(student => [
          student.studentId,
          student.name,
          attendanceData[student._id]?.status || 'present',
          attendanceData[student._id]?.uniformStatus || 'yes',
          attendanceData[student._id]?.idCardStatus || 'yes',
          attendanceData[student._id]?.remarks || 'N/A'
        ]);

        autoTable(doc, {
          startY: 50,
          head: [['Student ID', 'Name', 'Status', 'Uniform', 'ID Card', 'Remarks']],
          body: tableData,
        });

        doc.save(`Attendance_All_Students_${selectedDate}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  const exportToExcel = () => {
    if (!individualSelected) {
      alert("Please select a student first.");
      return;
    }
    const student = students.find(s => s._id === individualSelected);
    if (!student) return;

    // Default to current month if dates aren't set
    const start = fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = toDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // Mock data
    const wsData = [
      ["Student ID", "Name", "Date", "Status", "Remarks"],
      [student.studentId, student.name, selectedDate, attendanceData[student._id]?.status || 'present', attendanceData[student._id]?.remarks || '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Individual_${student.studentId}.xlsx`);
  };

  const exportToCSV = () => {
    let dataToExport = students;
    if (summarySelected) {
      dataToExport = students.filter(s => s._id === summarySelected);
    }

    const wsData = [
      ["Student ID", "Name", "Current Date", "Status", "Uniform", "I-Card"],
      ...dataToExport.map(student => [
        student.studentId,
        student.name,
        selectedDate,
        attendanceData[student._id]?.status || 'present',
        attendanceData[student._id]?.uniformStatus || 'yes',
        attendanceData[student._id]?.idCardStatus || 'yes'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const csv = XLSX.utils.sheet_to_csv(ws);

    // Create a blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Summary_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendance = () => {
    setActiveTab('reports');
  };

  const handleBulkAction = (action) => {
    const updatedAttendance = { ...attendanceData };
    Object.keys(updatedAttendance).forEach(studentId => {
      updatedAttendance[studentId].status = action;
    });
    setAttendanceData(updatedAttendance);
  };

  const handleBulkUniformAction = (uniformStatus) => {
    const updatedAttendance = { ...attendanceData };
    Object.keys(updatedAttendance).forEach((studentId) => {
      updatedAttendance[studentId].uniformStatus = uniformStatus;
    });
    setAttendanceData(updatedAttendance);
  };

  const handleBulkIdCardAction = (idCardStatus) => {
    const updatedAttendance = { ...attendanceData };
    Object.keys(updatedAttendance).forEach((studentId) => {
      updatedAttendance[studentId].idCardStatus = idCardStatus;
    });
    setAttendanceData(updatedAttendance);
  };

  const sendSMSNotification = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get absent students
      const absentStudents = Object.keys(attendanceData).filter(
        studentId => attendanceData[studentId].status === 'absent'
      );

      if (absentStudents.length > 0) {
        await axios.post('http://localhost:5000/api/teacher/send-sms', {
          studentIds: absentStudents,
          message: `Your child was absent on ${selectedDate}. Please contact school for more information.`
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setSuccess(`${absentStudents.length} SMS notifications sent successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setSuccess('No absent students to notify.');
        setTimeout(() => setSuccess(''), 3000);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error sending SMS notifications:', error);
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Attendance Management</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Track and manage student attendance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sendSMSNotification}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
          >
            <MessageSquare className="h-4 w-4" />
            Send SMS
          </button>
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
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'daily'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Calendar className="h-4 w-4" />
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'reports'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Download className="h-4 w-4" />
            Reports
          </button>
        </div>

        <div className="p-6">
          {/* Daily Attendance Tab */}
          {activeTab === 'daily' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="font-semibold text-gray-700">Attendance Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
                <div className="flex-1" />
                <button
                  onClick={() => handleBulkAction('present')}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleBulkUniformAction('yes')}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Mark All Uniform
                </button>
                <button
                  onClick={() => handleBulkIdCardAction('yes')}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Mark All I-Card
                </button>
              </div>

              {students.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-6 mt-8">
                    <h3 className="text-2xl font-extrabold text-gray-800">Student Attendance</h3>
                    <div className="flex gap-4">
                      <span className="px-4 py-1.5 bg-green-100 text-green-700 font-semibold rounded-full text-sm">
                        Present: {Object.values(attendanceData).filter(a => a.status === 'present').length}
                      </span>
                      <span className="px-4 py-1.5 bg-red-100 text-red-700 font-semibold rounded-full text-sm">
                        Absent: {Object.values(attendanceData).filter(a => a.status === 'absent').length}
                      </span>
                    </div>
                  </div>

                  <div className="border rounded-xl overflow-hidden shadow-sm bg-white mb-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-6 py-4 font-semibold text-gray-600">Student ID</th>
                          <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
                          <th className="px-6 py-4 font-semibold text-gray-600">Attendance Status</th>
                          <th className="px-6 py-4 font-semibold text-gray-600">Uniform</th>
                          <th className="px-6 py-4 font-semibold text-gray-600">I-Card</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => {
                          const isAbsent = attendanceData[student._id]?.status === 'absent';
                          return (
                          <tr key={student._id} className={`border-b last:border-b-0 transition-colors ${isAbsent ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-4 text-blue-600 font-medium">{student.studentId}</td>
                            <td className="px-6 py-4 font-semibold text-gray-800">{student.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`status-${student._id}`}
                                    value="present"
                                    checked={attendanceData[student._id]?.status === 'present'}
                                    onChange={() => handleStatusChange(student._id, 'present')}
                                    className="w-5 h-5 text-green-500 bg-gray-100 border-gray-300 focus:ring-green-500 cursor-pointer"
                                  />
                                  <span className={`font-medium ${attendanceData[student._id]?.status === 'present' ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>Present</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`status-${student._id}`}
                                    value="absent"
                                    checked={isAbsent}
                                    onChange={() => handleStatusChange(student._id, 'absent')}
                                    className="w-5 h-5 accent-red-600 cursor-pointer"
                                  />
                                  <span className={`font-semibold ${isAbsent ? 'text-white bg-red-500 px-2 py-0.5 rounded-full text-xs' : 'text-gray-500 group-hover:text-gray-700'}`}>Absent</span>
                                </label>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isAbsent ? (
                                <span className="text-xs text-red-400 font-medium italic">N/A</span>
                              ) : (
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`uniform-${student._id}`}
                                    value="yes"
                                    checked={(attendanceData[student._id]?.uniformStatus || 'yes') === 'yes'}
                                    onChange={() => handleUniformChange(student._id, 'yes')}
                                    className="w-5 h-5 text-green-500 bg-gray-100 border-gray-300 focus:ring-green-500 cursor-pointer"
                                  />
                                  <span className={`font-medium ${(attendanceData[student._id]?.uniformStatus || 'yes') === 'yes' ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>Yes</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`uniform-${student._id}`}
                                    value="no"
                                    checked={attendanceData[student._id]?.uniformStatus === 'no'}
                                    onChange={() => handleUniformChange(student._id, 'no')}
                                    className="w-5 h-5 text-red-500 bg-gray-100 border-gray-300 focus:ring-red-500 cursor-pointer"
                                  />
                                  <span className={`font-medium ${attendanceData[student._id]?.uniformStatus === 'no' ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700'}`}>No</span>
                                </label>
                              </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isAbsent ? (
                                <span className="text-xs text-red-400 font-medium italic">N/A</span>
                              ) : (
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`idcard-${student._id}`}
                                    value="yes"
                                    checked={(attendanceData[student._id]?.idCardStatus || 'yes') === 'yes'}
                                    onChange={() => handleIdCardChange(student._id, 'yes')}
                                    className="w-5 h-5 text-green-500 bg-gray-100 border-gray-300 focus:ring-green-500 cursor-pointer"
                                  />
                                  <span className={`font-medium ${(attendanceData[student._id]?.idCardStatus || 'yes') === 'yes' ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>Yes</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={`idcard-${student._id}`}
                                    value="no"
                                    checked={attendanceData[student._id]?.idCardStatus === 'no'}
                                    onChange={() => handleIdCardChange(student._id, 'no')}
                                    className="w-5 h-5 text-red-500 bg-gray-100 border-gray-300 focus:ring-red-500 cursor-pointer"
                                  />
                                  <span className={`font-medium ${attendanceData[student._id]?.idCardStatus === 'no' ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700'}`}>No</span>
                                </label>
                              </div>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={submitAttendance}
                      disabled={loading || !selectedClass}
                      className={`px-8 py-3 rounded-lg text-white font-bold shadow-md transition-all ${loading || !selectedClass
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                    >
                      {loading ? 'Submitting...' : 'Save Attendance'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Attendance Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Report PDF */}
                  <div className="bg-white p-4 rounded-lg shadow min-h-[16rem] flex flex-col">
                    <div className="flex flex-col flex-1">
                      <h4 className="font-medium mb-3">Monthly Report (PDF)</h4>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search student..."
                          value={monthlySearch}
                          onChange={(e) => setMonthlySearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <select
                        value={monthlySelected}
                        onChange={(e) => setMonthlySelected(e.target.value)}
                        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                        size={4}
                      >
                        <option value="">-- All Students --</option>
                        {students
                          .filter(s => s.name.toLowerCase().includes(monthlySearch.toLowerCase()) || s.studentId.toLowerCase().includes(monthlySearch.toLowerCase()))
                          .map(student => (
                            <option key={`monthly-${student._id}`} value={student._id} className="py-1">
                              {student.name} ({student.studentId})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-600 mb-1 truncate" title={monthlySelectedStudent ? `${monthlySelectedStudent.name} (${monthlySelectedStudent.studentId})` : 'All Students'}>
                        Selected: <span className="font-medium text-gray-800">{monthlySelectedStudent ? `${monthlySelectedStudent.name} (${monthlySelectedStudent.studentId})` : 'All Students'}</span>
                      </p>
                    </div>
                    <button
                      onClick={exportToPDF}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-2 flex justify-center items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export to PDF
                    </button>
                  </div>

                  {/* Individual Student Excel */}
                  <div className="bg-white p-4 rounded-lg shadow min-h-[16rem] flex flex-col">
                    <div className="flex flex-col flex-1">
                      <h4 className="font-medium mb-3">Individual Student (Excel)</h4>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search student..."
                          value={individualSearch}
                          onChange={(e) => setIndividualSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <select
                        value={individualSelected}
                        onChange={(e) => setIndividualSelected(e.target.value)}
                        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                        size={4}
                      >
                        {students
                          .filter(s => s.name.toLowerCase().includes(individualSearch.toLowerCase()) || s.studentId.toLowerCase().includes(individualSearch.toLowerCase()))
                          .map(student => (
                            <option key={`individual-${student._id}`} value={student._id} className="py-1">
                              {student.name} ({student.studentId})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-600 mb-1 truncate" title={individualSelectedStudent ? `${individualSelectedStudent.name} (${individualSelectedStudent.studentId})` : 'None'}>
                        Selected: <span className="font-medium text-gray-800">{individualSelectedStudent ? `${individualSelectedStudent.name} (${individualSelectedStudent.studentId})` : 'None'}</span>
                      </p>
                    </div>
                    <button
                      onClick={exportToExcel}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mt-2 flex justify-center items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export to Excel
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default AttendanceManagement;
