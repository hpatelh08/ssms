import User from '../models/User.js';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Exam from '../models/Exam.js';
import Attendance from '../models/Attendance.js';
import Mark from '../models/Mark.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Announcement from '../models/Announcement.js';
import LeaveApplication from '../models/LeaveApplication.js';
import Subject from '../models/Subject.js';
import { isTeacher } from '../middleware/auth.js';

const fallbackStudyMaterials = [];

// Get teacher dashboard data
export const getDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get teacher's assigned classes
    const assignedClasses = await Class.find({ classTeacher: teacherId }).populate('subjects');

    // Calculate total students
    let totalStudents = 0;
    assignedClasses.forEach(cls => {
      totalStudents += cls.students.length;
    });

    // Get today's classes (for the teacher's assigned classes)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock today's classes - in a real app, this would come from a timetable system
    const todaysClasses = assignedClasses.map(cls => ({
      className: cls.className,
      section: cls.section,
      subject: cls.subjects[0]?.subjectName || 'General',
      time: '09:00 - 10:00', // This would come from timetable
      room: cls.roomNumber || 'N/A'
    }));

    // Get pending assignments to grade
    const pendingAssignments = await Assignment.countDocuments({
      teacher: teacherId,
      status: 'active',
      dueDate: { $lt: new Date() }
    });

    // Get upcoming exams
    const upcomingExams = await Exam.find({
      teacher: teacherId,
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5);

    // Format upcoming exams for dashboard
    const formattedUpcomingExams = upcomingExams.map(exam => ({
      name: exam.examName,
      date: new Date(exam.date).toLocaleDateString(),
      time: exam.startTime,
      className: exam.class?.className,
      section: exam.class?.section
    }));

    // Get recent announcements
    const recentAnnouncements = await Announcement.find({
      'recipients.specificUsers': { $in: [teacherId] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ createdAt: -1 }).limit(5);

    // Format announcements
    const formattedAnnouncements = recentAnnouncements.map(announcement => ({
      title: announcement.title,
      content: announcement.content,
      date: new Date(announcement.createdAt).toLocaleDateString(),
      author: announcement.sender?.name || 'Admin'
    }));

    // Get student performance summary
    const marks = await Mark.find({ teacher: teacherId }).populate('student', 'name');

    // Calculate average performance
    let totalPercentage = 0;
    marks.forEach(mark => {
      totalPercentage += mark.percentage || 0;
    });
    const avgPerformance = marks.length > 0 ? Math.round(totalPercentage / marks.length) : 0;

    // Calculate performance by subject
    const subjectPerformance = {};
    marks.forEach(mark => {
      const subjectName = mark.subject?.subjectName;
      if (subjectName) {
        if (!subjectPerformance[subjectName]) {
          subjectPerformance[subjectName] = { total: 0, count: 0 };
        }
        subjectPerformance[subjectName].total += mark.percentage || 0;
        subjectPerformance[subjectName].count++;
      }
    });

    const formattedSubjectPerformance = Object.keys(subjectPerformance).map(subject => {
      const avg = Math.round(subjectPerformance[subject].total / subjectPerformance[subject].count);
      return { name: subject, average: avg };
    });

    const performanceSummary = {
      overallAverage: avgPerformance,
      subjects: formattedSubjectPerformance
    };

    // Get pending tasks
    const pendingTasksList = [
      { title: 'Grade Assignment 1', description: 'Mathematics assignment submissions', deadline: 'Today' },
      { title: 'Take Attendance', description: 'Class 8A attendance for today', deadline: 'Today' },
      { title: 'Prepare Lesson Plan', description: 'Chapter 5 science lesson plan', deadline: 'Tomorrow' },
    ];

    // Get birthday alerts (mock data)
    const birthdays = [
      { studentName: 'Rahul Sharma', class: '8', section: 'A', date: 'Feb 25' },
      { studentName: 'Priya Patel', class: '9', section: 'B', date: 'Feb 25' },
    ];

    // Get substitution classes (mock data - in a real app this would come from a substitution management system)
    const substitutionClasses = [
      {
        className: '9',
        section: 'A',
        subject: 'Mathematics',
        originalTeacher: 'Mr. Johnson',
        date: 'Feb 25, 2024',
        time: '10:00 - 11:00'
      },
      {
        className: '10',
        section: 'B',
        subject: 'Science',
        originalTeacher: 'Ms. Williams',
        date: 'Feb 25, 2024',
        time: '11:30 - 12:30'
      },
    ];

    res.json({
      success: true,
      data: {
        teacherName: req.user.name,
        totalStudents,
        classesToday: assignedClasses.length,
        pendingTasks: pendingTasksList.length,
        avgPerformance,
        todaysClasses,
        pendingTasksList,
        announcements: formattedAnnouncements,
        performanceSummary,
        upcomingExams: formattedUpcomingExams,
        birthdays,
        substitutionClasses
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get teacher's classes
export const getClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const classes = await Class.find({ classTeacher: teacherId })
      .populate('students', 'name email')
      .populate('subjects.teacher', 'name email');

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get class details
export const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId)
      .populate('students', 'name email')
      .populate('subjects.teacher', 'name email');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignments for teacher
export const getAssignments = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId, status } = req.query;

    let filter = { teacher: teacherId };
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate('class', 'className section')
      .populate('subject', 'subjectName')
      .sort({ dueDate: -1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, class: classId, dueDate, totalMarks, assignmentType } = req.body;

    const assignment = new Assignment({
      title,
      description,
      subject,
      class: classId,
      teacher: req.user._id,
      dueDate,
      totalMarks,
      assignmentType
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get exams for teacher
export const getExams = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId } = req.query;

    let filter = { teacher: teacherId };
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;

    const exams = await Exam.find(filter)
      .populate('class', 'className section')
      .populate('subject', 'subjectName')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create exam
export const createExam = async (req, res) => {
  try {
    const { examName, examType, subject, class: classId, date, startTime, endTime, totalMarks, passingMarks, description } = req.body;

    const exam = new Exam({
      examName,
      examType,
      subject,
      class: classId,
      teacher: req.user._id,
      date,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      description
    });

    await exam.save();

    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get students in class
export const getStudentsInClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId).populate('students', 'name email phone address');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      success: true,
      data: classData.students
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get study materials
export const getStudyMaterials = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let materials = fallbackStudyMaterials.filter(
        (material) => String(material.teacher) === String(teacherId)
      );

      if (classId) {
        materials = materials.filter((material) => String(material.class?._id || '') === String(classId));
      }

      if (subjectId) {
        materials = materials.filter((material) => String(material.subject?._id || '') === String(subjectId));
      }

      return res.json({
        success: true,
        data: materials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    }

    let filter = { teacher: teacherId };
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;

    const materials = await StudyMaterial.find(filter)
      .populate('class', 'className section')
      .populate('subject', 'subjectName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload study material
export const uploadStudyMaterial = async (req, res) => {
  try {
    const { title, description, subject, class: classId, materialType, url } = req.body;

    if (materialType === 'link' && !url) {
      return res.status(400).json({ error: 'URL is required for link type material' });
    }

    if (materialType !== 'link' && !req.file) {
      return res.status(400).json({ error: 'File is required for this material type' });
    }

    if (mongoose.connection.readyState !== 1) {
      const fallbackMaterial = {
        _id: `FB_MAT_${Date.now()}`,
        title,
        description,
        teacher: req.user._id,
        materialType,
        class: {
          _id: classId,
          className: 'N/A',
          section: 'N/A'
        },
        subject: {
          _id: subject,
          subjectName: 'N/A'
        },
        url: materialType === 'link' ? url : '',
        file: req.file
          ? {
            filename: req.file.filename,
            path: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size
          }
          : undefined,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackMode: true
      };

      fallbackStudyMaterials.unshift(fallbackMaterial);

      return res.status(201).json({
        success: true,
        data: fallbackMaterial,
        message: 'Stored in fallback mode because MongoDB is not connected.'
      });
    }

    const material = new StudyMaterial({
      title,
      description,
      subject,
      class: classId,
      teacher: req.user._id,
      materialType,
      url: materialType === 'link' ? url : undefined,
      file: {
        filename: req.file?.filename,
        path: req.file?.path,
        originalName: req.file?.originalname,
        size: req.file?.size
      }
    });

    await material.save();

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get attendance records for class
export const getAttendanceRecords = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const teacherId = req.user._id;

    let filter = { class: classId, teacher: teacherId };
    if (date) {
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = { $gte: dateObj, $lt: nextDay };
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('subject', 'subjectName');

    res.json({
      success: true,
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;
    const teacherId = req.user._id;

    // Validate class belongs to teacher
    const classData = await Class.findOne({ _id: classId, classTeacher: teacherId });
    if (!classData) {
      return res.status(403).json({ error: 'Unauthorized to mark attendance for this class' });
    }

    // Process attendance data
    const results = [];
    for (const record of attendanceData) {
      const { studentId, status, subject, remarks } = record;

      // Check if attendance already exists for this student on this date
      let attendance = await Attendance.findOne({
        student: studentId,
        date: new Date(date),
        class: classId
      });

      if (attendance) {
        // Update existing attendance
        attendance.status = status;
        attendance.subject = subject;
        attendance.remarks = remarks;
        attendance.teacher = teacherId;
        await attendance.save();
      } else {
        // Create new attendance record
        attendance = new Attendance({
          student: studentId,
          class: classId,
          subject,
          date: new Date(date),
          status,
          teacher: teacherId,
          remarks
        });
        await attendance.save();
      }

      results.push({
        studentId: attendance.student,
        status: attendance.status,
        date: attendance.date
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get marks for class
export const getMarks = async (req, res) => {
  try {
    const { classId, examId, subjectId } = req.query;
    const teacherId = req.user._id;

    let filter = { class: classId, teacher: teacherId };
    if (examId) filter.exam = examId;
    if (subjectId) filter.subject = subjectId;

    const marks = await Mark.find(filter)
      .populate('student', 'name email')
      .populate('exam', 'examName date')
      .populate('subject', 'subjectName');

    res.json({
      success: true,
      data: marks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enter marks
export const enterMarks = async (req, res) => {
  try {
    const { examId, subjectId, classId, marksData } = req.body;
    const teacherId = req.user._id;

    // Validate exam belongs to teacher
    const exam = await Exam.findOne({ _id: examId, teacher: teacherId });
    if (!exam) {
      return res.status(403).json({ error: 'Unauthorized to enter marks for this exam' });
    }

    const results = [];
    for (const mark of marksData) {
      const { studentId, marksObtained, totalMarks, remarks } = mark;

      // Check if marks already exist
      let existingMark = await Mark.findOne({
        exam: examId,
        student: studentId,
        subject: subjectId
      });

      if (existingMark) {
        // Update existing marks
        existingMark.marksObtained = marksObtained;
        existingMark.totalMarks = totalMarks;
        existingMark.remarks = remarks;
        existingMark.teacher = teacherId;
        await existingMark.save();
        results.push(existingMark);
      } else {
        // Create new mark record
        const newMark = new Mark({
          student: studentId,
          exam: examId,
          subject: subjectId,
          class: classId,
          marksObtained,
          totalMarks,
          teacher: teacherId,
          remarks
        });
        await newMark.save();
        results.push(newMark);
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get leave applications for teacher
export const getLeaveApplications = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // For now, returning all leave applications where teacher is involved
    // In a real system, this would be more specific to teacher's class students
    const leaves = await LeaveApplication.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Apply for leave (for teacher themselves)
export const applyForLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const leaveApplication = new LeaveApplication({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await leaveApplication.save();

    res.status(201).json({
      success: true,
      data: leaveApplication
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get performance analytics
export const getPerformanceAnalytics = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId);

    // Prepare filter for class-specific analytics
    const classFilter = {};
    if (teacher.assignedClass && teacher.division) {
      // Find the actual Class model ID for filtering
      const assignedClassObj = await Class.findOne({
        className: teacher.assignedClass,
        section: teacher.division
      });
      if (assignedClassObj) {
        classFilter.class = assignedClassObj._id;
      }
    }

    // Get class-wise performance
    const classPerformance = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: '$class',
          className: { $first: '$classInfo.className' },
          section: { $first: '$classInfo.section' },
          averagePercentage: { $avg: '$percentage' },
          totalStudents: { $sum: 1 },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      }
    ]);

    // Get subject-wise performance
    const subjectPerformance = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $unwind: '$subjectInfo'
      },
      {
        $group: {
          _id: '$subject',
          subjectName: { $first: '$subjectInfo.subjectName' },
          averagePercentage: { $avg: '$percentage' },
          totalStudents: { $sum: 1 },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      }
    ]);

    // Get weak students (below 40%)
    const weakStudents = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          percentage: { $lt: 40 },
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: '$student',
          studentName: { $first: '$studentInfo.name' },
          className: { $first: '$classInfo.className' },
          section: { $first: '$classInfo.section' },
          averagePercentage: { $avg: '$percentage' },
          subjectsStruggled: { $push: '$subject' }
        }
      }
    ]);

    // Get attendance-wise performance (mock/aggregate)
    const attendanceOverview = await Attendance.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $group: {
          _id: '$class',
          averageAttendance: {
            $avg: {
              $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $project: {
          className: '$classInfo.className',
          section: '$classInfo.section',
          averageAttendance: 1
        }
      }
    ]);

    // Get Grade Distribution
    const gradeDistribution = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          ...classFilter
        }
      },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          grade: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get Top Performers (above 80%)
    const topPerformers = await Mark.aggregate([
      {
        $match: {
          teacher: teacherId,
          percentage: { $gte: 80 },
          ...classFilter
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $group: {
          _id: '$student',
          studentName: { $first: '$studentInfo.name' },
          className: { $first: '$classInfo.className' },
          section: { $first: '$classInfo.section' },
          averagePercentage: { $avg: '$percentage' }
        }
      },
      {
        $sort: { averagePercentage: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get Weekly Attendance Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyAttendanceTrend = await Attendance.aggregate([
      {
        $match: {
          teacher: teacherId,
          date: { $gte: sevenDaysAgo },
          ...classFilter
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          averageAttendance: {
            $avg: {
              $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
            }
          },
          uniformCompliance: {
            $avg: {
              $cond: [{ $eq: ['$uniform', true] }, 100, 0]
            }
          },
          icardCompliance: {
            $avg: {
              $cond: [{ $eq: ['$icard', true] }, 100, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          percentage: '$averageAttendance',
          uniform: '$uniformCompliance',
          icard: '$icardCompliance',
          _id: 0
        }
      }
    ]);

    // Get Syllabus Status
    const syllabusStatus = await Subject.find(classFilter.class ? { class: classFilter.class } : {})
      .select('subjectName completionPercentage');

    res.json({
      success: true,
      data: {
        classPerformance,
        subjectPerformance,
        weakStudents,
        attendanceOverview,
        gradeDistribution,
        topPerformers,
        weeklyAttendanceTrend,
        syllabusStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};