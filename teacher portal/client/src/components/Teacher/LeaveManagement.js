import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle, User, Plus, Edit, Trash2, Mail, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LeaveManagement = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [parentLeaves, setParentLeaves] = useState([]);

  useEffect(() => {
    fetchLeaveApplications();
    loadParentLeaves();
  }, []);

  const loadParentLeaves = () => {
    const saved = localStorage.getItem('parent-leave-applications');
    if (saved) {
      try { setParentLeaves(JSON.parse(saved)); return; } catch { /* ignore */ }
    }
    const mockParentLeaves = [
      { _id: 'pl_1', studentName: 'Aarav Sharma', parentName: 'Mr. Sharma', leaveType: 'sick', startDate: '2026-03-07', endDate: '2026-03-08', reason: 'Child is having fever and needs rest', status: 'pending', appliedDate: '2026-03-05' },
      { _id: 'pl_2', studentName: 'Diya Patel', parentName: 'Mr. Patel', leaveType: 'casual', startDate: '2026-03-10', endDate: '2026-03-10', reason: 'Family function - wedding ceremony', status: 'pending', appliedDate: '2026-03-04' },
      { _id: 'pl_3', studentName: 'Vivaan Patel', parentName: 'Mrs. Patel', leaveType: 'sick', startDate: '2026-03-06', endDate: '2026-03-07', reason: 'Doctor appointment and medical checkup', status: 'approved', appliedDate: '2026-03-03' },
      { _id: 'pl_4', studentName: 'Arjun Gupta', parentName: 'Mr. Gupta', leaveType: 'casual', startDate: '2026-03-12', endDate: '2026-03-12', reason: 'Out of station for personal work', status: 'pending', appliedDate: '2026-03-05' },
      { _id: 'pl_5', studentName: 'Ananya Singh', parentName: 'Mrs. Singh', leaveType: 'sick', startDate: '2026-03-04', endDate: '2026-03-05', reason: 'Child had food poisoning', status: 'rejected', appliedDate: '2026-03-03' },
    ];
    setParentLeaves(mockParentLeaves);
    localStorage.setItem('parent-leave-applications', JSON.stringify(mockParentLeaves));
  };

  const handleParentLeaveAction = (leaveId, action) => {
    const updated = parentLeaves.map(leave =>
      leave._id === leaveId ? { ...leave, status: action } : leave
    );
    setParentLeaves(updated);
    localStorage.setItem('parent-leave-applications', JSON.stringify(updated));
  };

  const fetchLeaveApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      setLeaveApplications(response.data.data);
    } catch (error) {
      console.error('Error fetching leave applications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Calculate leave duration
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 2) {
      const msg = 'Leave application can only be for a maximum of 2 days.';
      setError(msg);
      alert(msg);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post('http://localhost:5000/api/teacher/leaves', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setFormData({
          leaveType: 'casual',
          startDate: '',
          endDate: '',
          reason: ''
        });
        setShowApplyForm(false);
        setSuccess('Leave application submitted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchLeaveApplications();
      } else {
        throw new Error('Server returned unsuccessful status');
      }
    } catch (error) {
      console.error('Error submitting leave application:', error);

      // MOCK FALLBACK: If server fails, add a mock record locally for demonstration
      const mockLeave = {
        _id: 'mock_' + Date.now(),
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setLeaveApplications([mockLeave, ...leaveApplications]);

      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: ''
      });
      setShowApplyForm(false);
      setSuccess('Leave (Offline Mode) submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);

      alert('Application submitted (Development Mode). Note: Server connection was unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Leave Management</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Apply for leave & manage requests</p>
        </div>
        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          Apply Leave
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {showApplyForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="bereavement">Bereavement Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reason for leave"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-lg text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="px-6 py-3 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Parent Leave Applications */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold">Parent Leave Applications</h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {parentLeaves.filter(l => l.status === 'pending').length} Pending
            </span>
          </div>
          {parentLeaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Parent</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Dates</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parentLeaves.map(leave => (
                    <tr key={leave._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{leave.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{leave.parentName}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">{leave.leaveType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1} day(s)
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">{leave.reason}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(leave.status)}
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(leave.status)}`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {leave.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleParentLeaveAction(leave._id, 'approved')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleParentLeaveAction(leave._id, 'rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Action taken</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No parent leave applications</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">My Leave Applications</h3>
          {leaveApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Leave Type</th>
                    <th className="px-4 py-3 text-left">Dates</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Applied Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveApplications.map(application => (
                    <tr key={application._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{application.leaveType.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {new Date(application.startDate).toLocaleDateString()} -
                          {new Date(application.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(new Date(application.endDate) - new Date(application.startDate)) / (1000 * 60 * 60 * 24) + 1} days
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {application.reason}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave applications found</p>
              <p className="text-gray-400 text-sm mt-2">Apply for leave using the button above</p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Leave Days</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
            <button
              onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Total Leave Days Report', 14, 22);
                doc.setFontSize(11);
                doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
                autoTable(doc, {
                  startY: 40,
                  head: [['Leave Type', 'Start Date', 'End Date', 'Days', 'Status']],
                  body: leaveApplications.map(app => [
                    app.leaveType.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()),
                    new Date(app.startDate).toLocaleDateString(),
                    new Date(app.endDate).toLocaleDateString(),
                    Math.ceil((new Date(app.endDate) - new Date(app.startDate)) / (1000 * 60 * 60 * 24)) + 1,
                    app.status.charAt(0).toUpperCase() + app.status.slice(1)
                  ]),
                });
                doc.text(`Total Leave Days: 24`, 14, doc.lastAutoTable.finalY + 12);
                doc.save('Total_Leave_Days_Report.pdf');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
            <button
              onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Present Days Report', 14, 22);
                doc.setFontSize(11);
                doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
                autoTable(doc, {
                  startY: 40,
                  head: [['#', 'Date', 'Status']],
                  body: Array.from({ length: 8 }, (_, i) => [
                    i + 1,
                    new Date(2026, 2, i + 1).toLocaleDateString(),
                    'Present'
                  ]),
                });
                doc.text(`Total Present Days: 8`, 14, doc.lastAutoTable.finalY + 12);
                doc.save('Present_Days_Report.pdf');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;