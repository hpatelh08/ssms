import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Users, BookOpen, Calendar, Filter, Printer, Eye, Share2, X, Heart, ClipboardList, BarChart2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports = ({ currentUser }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [previewReport, setPreviewReport] = useState(null);

  const initialClassId = currentUser?.assignedClass ? 'teacher-class' : '';

  const [reportParams, setReportParams] = useState({
    classId: initialClassId,
    subjectId: '',
    studentId: ''
  });

  const [students, setStudents] = useState([]);

  // Mock data for classes and subjects - Filtered by teacher's assigned class
  const classes = currentUser?.assignedClass
    ? [{ _id: 'teacher-class', className: currentUser.assignedClass, section: currentUser.division }]
    : [
      { _id: '1', className: 'Class 1', section: 'A' },
      { _id: '2', className: 'Class 2', section: 'B' },
      { _id: '3', className: 'Class 3', section: 'C' }
    ];

  const [subjects] = useState([
    { _id: '1', subjectName: 'Mathematics' },
    { _id: '2', subjectName: 'Science' },
    { _id: '3', subjectName: 'English' },
    { _id: '4', subjectName: 'Hindi' },
    { _id: '5', subjectName: 'Gujarati' },
    { _id: '6', subjectName: 'Sanskrit' }
  ]);

  useEffect(() => {
    if (reportParams.classId) {
      fetchStudents(reportParams.classId);
    } else {
      setStudents([]);
    }
  }, [reportParams.classId]);

  const fetchStudents = async (classId) => {
    // MOCK 45 Indian Students
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
  };

  const reportTypes = [
    { id: 'marks', name: 'Marks Report', icon: FileText },
    { id: 'assignment', name: 'Assignment Completion Report', icon: BookOpen },
    { id: 'performance', name: 'Performance Report', icon: Users }
  ];

  // Build full student profile data (details, health, marks, assignments, attendance)
  const getStudentFullProfile = (student) => {
    const className = currentUser?.assignedClass || '8';
    const section = currentUser?.division || 'B';
    const idx = students.findIndex(s => s._id === student._id);
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const age = 14 + (idx % 4);

    // Personal Details
    const personal = {
      name: student.name,
      studentId: student.studentId,
      class: `${className} - ${section}`,
      gender: idx % 2 === 0 ? 'Male' : 'Female',
      age,
      dateOfBirth: new Date(2026 - age, idx % 12, (idx % 28) + 1).toLocaleDateString('en-IN'),
      fatherName: `Mr. ${student.name.split(' ')[1] || 'Parent'}`,
      motherName: `Mrs. ${student.name.split(' ')[1] || 'Parent'}`,
      phone: `98${String(10000000 + idx).padStart(8, '0')}`,
      address: `Street ${idx + 1}, City`
    };

    // Health Record
    const health = {
      bloodGroup: bloodGroups[idx % bloodGroups.length],
      healthStatus: 'Fit',
      allergies: idx % 5 === 0 ? 'Dust allergy' : 'None',
      weight: `${35 + (idx % 20)} kg`
    };

    // All Subject Marks from localStorage
    const subjectNames = ['Mathematics', 'Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit'];
    const marksData = [];
    // Check all graded-marks keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('graded-marks-')) {
        try {
          const examId = key.replace('graded-marks-', '');
          const data = JSON.parse(localStorage.getItem(key));
          if (data[student.name]) {
            Object.entries(data[student.name]).forEach(([subject, marks]) => {
              marksData.push({ examId, subject, marks });
            });
          }
        } catch { /* skip */ }
      }
    }
    // If no localStorage marks, generate mock marks
    if (marksData.length === 0) {
      subjectNames.forEach(sub => {
        marksData.push({ examId: 'Mid Term', subject: sub, marks: 60 + Math.floor(Math.random() * 35) });
      });
    }

    // Assignment Submissions from localStorage
    const assignmentData = [];
    const teacherEmail = currentUser?.email || '';
    try {
      const assignments = JSON.parse(localStorage.getItem(`assignments-data-${teacherEmail}`)) || [];
      assignments.forEach(asgn => {
        const submissions = JSON.parse(localStorage.getItem(`submissions-data-${asgn._id}`)) || [];
        const studentSub = submissions.find(s => s.student?.name === student.name || s.student?.studentId === student.studentId);
        const grading = JSON.parse(localStorage.getItem(`grading-data-${asgn._id}`)) || {};
        const grade = studentSub ? grading[studentSub._id] : null;

        assignmentData.push({
          title: asgn.title,
          subject: asgn.subject?.subjectName || 'General',
          dueDate: asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString('en-IN') : '-',
          status: studentSub ? (studentSub.status === 'graded' ? 'Graded' : 'Submitted') : 'Not Submitted',
          marks: grade?.marks || '-',
          remarks: grade?.remarks || '-'
        });
      });
    } catch { /* skip */ }
    // If no localStorage assignments, generate mock
    if (assignmentData.length === 0) {
      subjectNames.slice(0, 4).forEach(sub => {
        const submitted = Math.random() > 0.2;
        assignmentData.push({
          title: `${sub} Assignment`,
          subject: sub,
          dueDate: new Date(2026, 2, Math.floor(Math.random() * 28) + 1).toLocaleDateString('en-IN'),
          status: submitted ? 'Submitted' : 'Not Submitted',
          marks: submitted ? `${65 + Math.floor(Math.random() * 30)}` : '-',
          remarks: submitted ? 'Good' : '-'
        });
      });
    }

    // Attendance from localStorage
    let totalDays = 0, presentDays = 0, absentDays = 0, uniformYes = 0, idCardYes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('attendance-data-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data[student._id]) {
            totalDays++;
            if (data[student._id].status === 'present') presentDays++;
            else absentDays++;
            if (data[student._id].uniformStatus === 'yes') uniformYes++;
            if (data[student._id].idCardStatus === 'yes') idCardYes++;
          }
        } catch { /* skip */ }
      }
    }
    // If no localStorage attendance, generate mock
    if (totalDays === 0) {
      totalDays = 220;
      presentDays = 180 + (idx % 35);
      absentDays = totalDays - presentDays;
      uniformYes = presentDays - (idx % 5);
      idCardYes = presentDays - (idx % 3);
    }

    const attendance = {
      totalDays,
      presentDays,
      absentDays,
      percentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0',
      uniformCompliance: totalDays > 0 ? ((uniformYes / totalDays) * 100).toFixed(1) : '0',
      idCardCompliance: totalDays > 0 ? ((idCardYes / totalDays) * 100).toFixed(1) : '0'
    };

    return { personal, health, marksData, assignmentData, attendance };
  };

  const generatePerformancePDF = (report) => {
    const student = students.find(s => s._id === report.studentDbId || s._id === report.studentId);
    if (!student) return;

    const profile = getStudentFullProfile(student);
    const doc = new jsPDF();
    let y = 15;

    // Header
    doc.setFillColor(67, 56, 202);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Performance Report', 105, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Class: ${profile.personal.class} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 105, 26, { align: 'center' });
    y = 45;

    // 1. Personal Details
    doc.setTextColor(67, 56, 202);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Personal Details', 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [],
      body: [
        ['Name', profile.personal.name, 'Student ID', profile.personal.studentId],
        ['Class', profile.personal.class, 'Gender', profile.personal.gender],
        ['Age', String(profile.personal.age), 'Date of Birth', profile.personal.dateOfBirth],
        ['Father', profile.personal.fatherName, 'Mother', profile.personal.motherName],
        ['Phone', profile.personal.phone, 'Address', profile.personal.address]
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 2: { fontStyle: 'bold', cellWidth: 30 } },
    });
    y = doc.lastAutoTable.finalY + 10;

    // 2. Health Record
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Health Record', 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [['Blood Group', 'Health Status', 'Weight', 'Allergies']],
      body: [[profile.health.bloodGroup, profile.health.healthStatus, profile.health.weight, profile.health.allergies]],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] },
    });
    y = doc.lastAutoTable.finalY + 10;

    // 3. Subject Marks
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. All Subject Marks', 14, y);
    y += 3;
    const marksTotal = profile.marksData.reduce((s, m) => s + Number(m.marks), 0);
    const marksAvg = profile.marksData.length > 0 ? (marksTotal / profile.marksData.length).toFixed(1) : '0';
    autoTable(doc, {
      startY: y,
      head: [['Subject', 'Exam', 'Marks (out of 100)', 'Grade']],
      body: [
        ...profile.marksData.map(m => {
          const marks = Number(m.marks);
          const grade = marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 60 ? 'B' : marks >= 50 ? 'C' : marks >= 35 ? 'D' : 'F';
          return [m.subject, m.examId, String(marks), grade];
        }),
        [{ content: `Total: ${marksTotal} | Average: ${marksAvg}%`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [239, 246, 255] } }]
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Check if need new page
    if (y > 210) { doc.addPage(); y = 15; }

    // 4. Assignment Submissions
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Assignment Submissions', 14, y);
    y += 3;
    const totalAssignments = profile.assignmentData.length;
    const submittedCount = profile.assignmentData.filter(a => a.status !== 'Not Submitted').length;
    autoTable(doc, {
      startY: y,
      head: [['Assignment', 'Subject', 'Due Date', 'Status', 'Marks', 'Remarks']],
      body: [
        ...profile.assignmentData.map(a => [a.title, a.subject, a.dueDate, a.status, a.marks, a.remarks]),
        [{ content: `Submission Rate: ${submittedCount}/${totalAssignments} (${totalAssignments > 0 ? ((submittedCount / totalAssignments) * 100).toFixed(0) : 0}%)`, colSpan: 6, styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 251, 235] } }]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [245, 158, 11] },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Check if need new page
    if (y > 230) { doc.addPage(); y = 15; }

    // 5. Attendance Summary
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Attendance Summary', 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [['Total Days', 'Present', 'Absent', 'Attendance %', 'Uniform %', 'ID Card %']],
      body: [[
        profile.attendance.totalDays,
        profile.attendance.presentDays,
        profile.attendance.absentDays,
        `${profile.attendance.percentage}%`,
        `${profile.attendance.uniformCompliance}%`,
        `${profile.attendance.idCardCompliance}%`
      ]],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246] },
    });
    y = doc.lastAutoTable.finalY + 12;

    // Overall Summary Box
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 25, 3, 3, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Summary', 20, y + 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Academic Average: ${marksAvg}%  |  Attendance: ${profile.attendance.percentage}%  |  Assignment Rate: ${totalAssignments > 0 ? ((submittedCount / totalAssignments) * 100).toFixed(0) : 0}%`, 20, y + 17);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Teacher Portal - Confidential', 14, 290);
    }

    return doc;
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }
    if (selectedReport === 'performance' && !reportParams.studentId) {
      alert('Performance Report requires selecting a specific student');
      return;
    }

    setLoading(true);

    const selectedStudent = students.find(s => s._id === reportParams.studentId);
    const studentSuffix = selectedStudent ? `_${selectedStudent.name.replace(/\s+/g, '_')}` : '_Class';

    setTimeout(() => {
      const mockReport = {
        id: Date.now(),
        type: selectedReport,
        generatedAt: new Date().toISOString(),
        status: 'completed',
        isIndividual: !!reportParams.studentId,
        studentName: selectedStudent?.name || null,
        studentId: selectedStudent?.studentId || null,
        studentDbId: selectedStudent?._id || null,
        className: `${currentUser?.assignedClass || '8'} - ${currentUser?.division || 'B'}`,
        subjectName: subjects.find(s => s._id === reportParams.subjectId)?.subjectName || 'All Subjects',
        fileName: `${selectedReport}${studentSuffix}_report_${new Date().toISOString().split('T')[0]}.pdf`
      };

      setReports(prev => [mockReport, ...prev]);
      setLoading(false);
      alert(`Report generated successfully: ${mockReport.fileName}`);
    }, 1500);
  };

  const getReportData = (report) => {
    // Shared mock students for the report content
    const reportStudents = report.isIndividual
      ? [{ id: '1', rollNo: report.studentId || '101', name: report.studentName, attendance: '95%', marks: '88', status: 'Completed', grade: 'A' }]
      : students.slice(0, 15).map((s, idx) => ({
        id: idx + 1,
        rollNo: s.studentId,
        name: s.name,
        attendance: `${85 + Math.floor(Math.random() * 15)}%`,
        marks: `${70 + Math.floor(Math.random() * 30)}`,
        status: Math.random() > 0.2 ? 'Completed' : 'Pending',
        grade: ['A+', 'A', 'B+', 'B'][Math.floor(Math.random() * 4)]
      }));

    return reportStudents;
  };

  const handleDownload = (report) => {
    if (report.type === 'performance') {
      const doc = generatePerformancePDF(report);
      if (doc) doc.save(report.fileName);
      return;
    }
    const data = getReportData(report);

    if (report.type === 'assignment') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, report.fileName.replace('.pdf', '.xlsx'));
    } else {
      generatePDF(report, data, 'download');
    }
  };

  const handlePrint = (report) => {
    if (report.type === 'performance') {
      const doc = generatePerformancePDF(report);
      if (doc) {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      }
      return;
    }
    const data = getReportData(report);
    generatePDF(report, data, 'print');
  };

  const generatePDF = (report, data, action) => {
    const doc = new jsPDF();
    const title = reportTypes.find(t => t.id === report.type)?.name || 'Report';

    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(12);
    doc.text(`Class: ${report.className}`, 14, 32);
    doc.text(`Subject: ${report.subjectName}`, 14, 40);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, 48);
    if (report.isIndividual) {
      doc.text(`Student: ${report.studentName} (${report.studentId})`, 14, 56);
    }

    const tableColumn = ["Roll No", "Name", "Attendance", "Marks", "Grade"];
    if (report.type === 'assignment') tableColumn[3] = "Status";

    const tableRows = data.map(s => [s.rollNo, s.name, s.attendance, report.type === 'assignment' ? s.status : s.marks, s.grade]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: report.isIndividual ? 65 : 55,
    });

    if (action === 'download') {
      doc.save(report.fileName);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">Generate, preview and download detailed reports</p>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Section: Report Type */}
        <div className="p-8 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Select Report Type</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((report, i) => {
              const IconComponent = report.icon;
              const gradients = [
                { bg: 'from-blue-500 to-indigo-600', light: 'from-blue-50 to-indigo-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' },
                { bg: 'from-amber-500 to-orange-500', light: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
                { bg: 'from-purple-500 to-pink-500', light: 'from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
              ];
              const g = gradients[i % gradients.length];
              const isSelected = selectedReport === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`relative overflow-hidden p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200 bg-gradient-to-br ${g.light} ${
                    isSelected
                      ? `${g.border} shadow-md scale-[1.02]`
                      : `border-transparent hover:${g.border} hover:shadow-sm`
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${g.bg} ${isSelected ? 'opacity-10' : 'opacity-5'} rounded-bl-full`} />
                  <div className={`p-4 rounded-2xl shadow-sm ${g.icon}`}>
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <span className={`text-sm font-bold text-center ${g.text}`}>{report.name}</span>
                  <div className={`h-1 rounded-full bg-gradient-to-r ${g.bg} transition-all duration-200 ${isSelected ? 'w-8' : 'w-4 opacity-40'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Fill Details */}
        <div className="p-8 bg-gray-50/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Fill Report Details</p>
          <div className={`grid grid-cols-1 ${selectedReport === 'performance' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
              <select
                value={reportParams.classId}
                onChange={(e) => setReportParams(prev => ({ ...prev, classId: e.target.value }))}
                disabled={!!currentUser?.assignedClass}
                className={`w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm ${
                  !!currentUser?.assignedClass ? 'cursor-not-allowed text-gray-700 font-semibold' : ''
                }`}
              >
                {!currentUser?.assignedClass && <option value="">All Classes</option>}
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.className} - {cls.section}</option>
                ))}
              </select>
            </div>

            {selectedReport !== 'performance' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                <select
                  value={reportParams.subjectId}
                  onChange={(e) => setReportParams(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.subjectName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {selectedReport === 'performance' ? 'Select Student' : 'Particular Student (Optional)'}
              </label>
              <select
                value={reportParams.studentId}
                onChange={(e) => setReportParams(prev => ({ ...prev, studentId: e.target.value }))}
                disabled={!reportParams.classId}
                className={`w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm ${
                  !reportParams.classId ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">{selectedReport === 'performance' ? 'Select a Student' : 'All Students (Class Report)'}</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>{student.studentId} - {student.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="px-8 pb-8">
          <button
            onClick={handleGenerateReport}
            disabled={loading || !selectedReport}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-200 ${
              loading || !selectedReport
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-200 active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Generating Report...</span></>
            ) : (
              <><Download className="h-5 w-5" /><span>Generate Report</span></>
            )}
          </button>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Generated Reports</h3>
            <p className="text-xs text-gray-400 mt-0.5">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</p>
          </div>
          {reports.length > 0 && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">{reports.length} Total</span>
          )}
        </div>

        <div className="p-6">
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map(report => {
                const reportType = reportTypes.find(rt => rt.id === report.type);
                const IconComponent = reportType?.icon || FileText;
                const colors = [
                  { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-green-100 text-green-700' },
                  { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-green-100 text-green-700' },
                  { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-green-100 text-green-700' },
                ];
                const ci = reportTypes.findIndex(r => r.id === report.type);
                const c = colors[ci % colors.length] || colors[0];
                return (
                  <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${c.bg}`}>
                        <IconComponent className={`h-5 w-5 ${c.icon}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{reportType?.name}</p>
                        <p className="text-xs text-gray-400">{new Date(report.generatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.badge}`}>{report.status}</span>
                      <button onClick={() => setPreviewReport(report)} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-bold transition-colors shadow-sm">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button onClick={() => handleDownload(report)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold transition-colors shadow-sm">
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                      <button onClick={() => handlePrint(report)} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 text-xs font-bold transition-colors shadow-sm">
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                      {report.isIndividual && (
                        <button onClick={() => alert(`Report for ${report.studentName} has been forwarded to their parent.`)} className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-xs font-bold transition-colors shadow-sm">
                          <Share2 className="h-3.5 w-3.5" /> Forward to Parent
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                <FileText className="h-9 w-9 text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold">No reports generated yet</p>
              <p className="text-gray-400 text-sm mt-1">Generate your first report using the form above</p>
            </div>
          )}
        </div>
      </div>
      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {reportTypes.find(t => t.id === previewReport.type)?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Generated on {new Date(previewReport.generatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {previewReport.type === 'performance' && previewReport.studentDbId ? (() => {
                const student = students.find(s => s._id === previewReport.studentDbId);
                if (!student) return <p className="text-gray-500">Student data not found</p>;
                const profile = getStudentFullProfile(student);
                return (
                  <div className="space-y-6">
                    {/* Personal Details */}
                    <div>
                      <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={16} /> Personal Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(profile.personal).map(([key, val]) => (
                          <div key={key} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-sm font-semibold text-gray-800">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Health Record */}
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Heart size={16} /> Health Record</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(profile.health).map(([key, val]) => (
                          <div key={key} className="bg-emerald-50 rounded-xl p-3">
                            <p className="text-[10px] text-emerald-500 uppercase font-bold">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-sm font-semibold text-gray-800">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subject Marks */}
                    <div>
                      <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2"><BarChart2 size={16} /> All Subject Marks</h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="p-3 text-left text-xs font-bold text-blue-700">Subject</th>
                              <th className="p-3 text-left text-xs font-bold text-blue-700">Exam</th>
                              <th className="p-3 text-left text-xs font-bold text-blue-700">Marks</th>
                              <th className="p-3 text-left text-xs font-bold text-blue-700">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {profile.marksData.map((m, i) => {
                              const marks = Number(m.marks);
                              const grade = marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 60 ? 'B' : marks >= 50 ? 'C' : marks >= 35 ? 'D' : 'F';
                              return (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="p-3 text-sm font-medium text-gray-800">{m.subject}</td>
                                  <td className="p-3 text-sm text-gray-600">{m.examId}</td>
                                  <td className="p-3 text-sm font-bold text-gray-900">{marks}</td>
                                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    marks >= 80 ? 'bg-green-100 text-green-700' : marks >= 60 ? 'bg-blue-100 text-blue-700' : marks >= 35 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                  }`}>{grade}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-blue-50 font-bold">
                              <td colSpan={2} className="p-3 text-sm text-blue-700">Average</td>
                              <td colSpan={2} className="p-3 text-sm text-blue-700">
                                {profile.marksData.length > 0 ? (profile.marksData.reduce((s, m) => s + Number(m.marks), 0) / profile.marksData.length).toFixed(1) : 0}%
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Assignment Submissions */}
                    <div>
                      <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2"><ClipboardList size={16} /> Assignment Submissions</h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-amber-50">
                              <th className="p-3 text-left text-xs font-bold text-amber-700">Assignment</th>
                              <th className="p-3 text-left text-xs font-bold text-amber-700">Subject</th>
                              <th className="p-3 text-left text-xs font-bold text-amber-700">Due Date</th>
                              <th className="p-3 text-left text-xs font-bold text-amber-700">Status</th>
                              <th className="p-3 text-left text-xs font-bold text-amber-700">Marks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {profile.assignmentData.map((a, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="p-3 text-sm font-medium text-gray-800">{a.title}</td>
                                <td className="p-3 text-sm text-gray-600">{a.subject}</td>
                                <td className="p-3 text-sm text-gray-600">{a.dueDate}</td>
                                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  a.status === 'Submitted' || a.status === 'Graded' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>{a.status}</span></td>
                                <td className="p-3 text-sm font-bold text-gray-800">{a.marks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div>
                      <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar size={16} /> Attendance Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-purple-700">{profile.attendance.totalDays}</p>
                          <p className="text-xs text-purple-400 font-bold">Total Days</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-green-700">{profile.attendance.presentDays}</p>
                          <p className="text-xs text-green-400 font-bold">Present</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-red-600">{profile.attendance.absentDays}</p>
                          <p className="text-xs text-red-400 font-bold">Absent</p>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-indigo-700">{profile.attendance.percentage}%</p>
                          <p className="text-xs text-indigo-400 font-bold">Attendance %</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-blue-700">{profile.attendance.uniformCompliance}%</p>
                          <p className="text-xs text-blue-400 font-bold">Uniform %</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-amber-700">{profile.attendance.idCardCompliance}%</p>
                          <p className="text-xs text-amber-400 font-bold">ID Card %</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
              <>
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-600 font-semibold mb-1">Class Details</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Class:</span>
                    <span className="text-gray-800 font-bold">{previewReport.className}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="text-gray-800 font-bold">{previewReport.subjectName}</span>
                  </div>
                </div>
                {previewReport.isIndividual && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-green-600 font-semibold mb-1">Student Details</p>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-800 font-bold">{previewReport.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="text-gray-800 font-bold">{previewReport.studentId}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Roll No</th>
                      <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Attendance</th>
                      <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {previewReport.type === 'assignment' ? 'Status' : 'Marks'}
                      </th>
                      <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getReportData(previewReport).map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm text-gray-700">{student.rollNo}</td>
                        <td className="p-3 text-sm text-gray-900 font-medium">{student.name}</td>
                        <td className="p-3 text-sm text-gray-700">{student.attendance}</td>
                        <td className="p-3 text-sm">
                          {previewReport.type === 'assignment' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {student.status}
                            </span>
                          ) : (
                            <span className="font-semibold text-gray-900">{student.marks}</span>
                          )}
                        </td>
                        <td className="p-3 text-sm font-bold text-blue-600">{student.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => handlePrint(previewReport)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Printer className="h-5 w-5" />
                Print
              </button>
              <button
                onClick={() => handleDownload(previewReport)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="h-5 w-5" />
                Download PDF/Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;