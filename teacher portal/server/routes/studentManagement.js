import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js'; // Assuming Student model exists
import Class from '../models/Class.js'; // Assuming Class model exists

const router = express.Router();

// GET /api/student/profile
router.get('/profile', async (req, res) => {
  try {
    const { studentId } = req.query;
    const student = await Student.findById(studentId).populate('classId');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ data: student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/student/all
router.get('/all', async (req, res) => {
  try {
    const { classId } = req.query;
    let query = {};
    if (classId) {
      query.classId = classId;
    }
    const students = await Student.find(query).populate('classId');
    res.json({ data: students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/student/academic-history
router.get('/academic-history', async (req, res) => {
  try {
    const { studentId } = req.query;
    const student = await Student.findById(studentId).populate('academicHistory');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ data: student.academicHistory || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/student/performance
router.get('/performance', async (req, res) => {
  try {
    const { studentId, classId } = req.query;
    let query = {};
    if (classId) {
      query.classId = classId;
    }
    
    let students;
    if (studentId) {
      const student = await Student.findById(studentId);
      students = student ? [student] : [];
    } else {
      students = await Student.find(query);
    }
    
    // Calculate performance metrics
    const performanceData = students.map(student => ({
      _id: student._id,
      name: student.name,
      averagePercentage: student.averagePercentage || 0,
      improvementRate: student.improvementRate || 0,
      className: student.classId?.className,
      section: student.classId?.section,
      attendanceRate: student.attendanceRate || 0
    }));
    
    res.json({ data: performanceData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/student/remarks
router.post('/remarks', async (req, res) => {
  try {
    const { studentId, remark, type } = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { 
        $push: { 
          behaviorRemarks: { 
            remark, 
            type, 
            date: new Date(), 
            teacherId: req.user?.id 
          } 
        } 
      },
      { new: true }
    );
    
    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/student/health-records
router.get('/health-records', async (req, res) => {
  try {
    const { studentId } = req.query;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ 
      data: {
        name: student.name,
        bloodGroup: student.bloodGroup,
        dateOfBirth: student.dateOfBirth,
        age: student.age,
        healthInfo: student.healthInfo,
        allergies: student.allergies,
        medicalHistory: student.medicalHistory,
        emergencyContact: student.emergencyContact
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/student/health-records
router.put('/health-records', async (req, res) => {
  try {
    const {
      studentId,
      name,
      bloodGroup,
      dateOfBirth,
      age,
      healthInfo,
      allergies,
      medicalHistory,
      emergencyContact
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (age !== undefined) updateData.age = age === null || age === '' ? null : Number(age);
    if (healthInfo !== undefined) updateData.healthInfo = healthInfo;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true }
    );
    
    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/student/ptm-scheduled
router.get('/ptm-scheduled', async (req, res) => {
  try {
    // In a real application, this would fetch scheduled PTMs
    // For now, returning mock data
    const scheduledMeetings = [
      {
        _id: '1',
        student: { name: 'John Smith', className: '9', section: 'A' },
        meetingType: 'regular',
        date: '2024-02-28',
        time: '10:00',
        purpose: 'Regular progress discussion',
        status: 'scheduled'
      },
      {
        _id: '2',
        student: { name: 'Emma Johnson', className: '10', section: 'B' },
        meetingType: 'concern',
        date: '2024-03-02',
        time: '14:30',
        purpose: 'Discuss behavioral concerns',
        status: 'scheduled'
      }
    ];
    
    res.json({ data: scheduledMeetings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/student/ptm-schedule
router.post('/ptm-schedule', async (req, res) => {
  try {
    const { studentId, meetingType, date, time, purpose } = req.body;
    
    // In a real application, this would save the PTM to the database
    // For now, returning mock response
    
    const newMeeting = {
      _id: Date.now().toString(),
      studentId,
      meetingType,
      date,
      time,
      purpose,
      createdAt: new Date()
    };
    
    res.json({ success: true, data: newMeeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/student/ptm-update/:meetingId
router.put('/ptm-update/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { date, time, purpose, status } = req.body;
    
    // In a real application, this would update the PTM in the database
    // For now, returning mock response
    
    const updatedMeeting = {
      _id: meetingId,
      date,
      time,
      purpose,
      status,
      updatedAt: new Date()
    };
    
    res.json({ success: true, data: updatedMeeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/student/ptm-cancel/:meetingId
router.delete('/ptm-cancel/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // In a real application, this would update the meeting status to cancelled
    // For now, returning mock response
    
    res.json({ success: true, message: 'Meeting cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
