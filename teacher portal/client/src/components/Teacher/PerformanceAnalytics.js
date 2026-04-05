import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Line, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, AlertTriangle, Users, MessageCircle, BarChart2, Award, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../../config/api';
import { getAssignedTeacherClassNumber, getAssignedTeacherSection } from '../../teacherIdentity';
import { loadTeacherClasses, loadTeacherStudents } from '../../teacherAdminData';
import { readSyllabusAnalyticsForClass } from '../../utils/syllabusAnalytics';

const PerformanceAnalytics = ({ currentUser }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [syllabusSyncTick, setSyllabusSyncTick] = useState(0);
  const chartRef = React.useRef(null);

  const handleSegmentHover = (e, sub) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
    }
    setHoveredSubject(sub);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    const refreshSyllabusAnalytics = () => {
      setSyllabusSyncTick((tick) => tick + 1);
    };

    const handleStorageChange = (event) => {
      if (event?.key && !String(event.key).startsWith('syllabus-data-')) return;
      refreshSyllabusAnalytics();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('syllabus-data-updated', refreshSyllabusAnalytics);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('syllabus-data-updated', refreshSyllabusAnalytics);
    };
  }, []);

  useEffect(() => {
    const fetchClassroomStudents = async () => {
      try {
        const classes = await loadTeacherClasses(currentUser);
        const students = await loadTeacherStudents(currentUser, classes);
        setClassroomStudents(students);
      } catch (fetchError) {
        console.error('Error fetching classroom students for analytics:', fetchError);
        setClassroomStudents([]);
      }
    };

    fetchClassroomStudents();
  }, [currentUser?.email, currentUser?.assignedClass, currentUser?.division]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl('/api/teacher/analytics'), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 1000
      });
      setAnalyticsData(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
      setLoading(false);
    }
  };
  // Use actual analytics data only; otherwise keep empty state.
  const effectiveData = analyticsData || {
    classPerformance: [],
    subjectPerformance: [],
    attendanceOverview: [],
    gradeDistribution: [],
    weakStudents: [],
    topPerformers: [],
    weeklyAttendanceTrend: [],
    syllabusStatus: []
  };

  const overallStats = {
    totalStudents: classroomStudents.length,
    averageClassPerformance: effectiveData.classPerformance.length
      ? effectiveData.classPerformance.reduce((acc, cls) => acc + (cls.averagePercentage || 0), 0) / effectiveData.classPerformance.length
      : 0,
    overallAttendance: effectiveData.attendanceOverview.length
      ? effectiveData.attendanceOverview.reduce((acc, cls) => acc + (cls.averageAttendance || 0), 0) / effectiveData.attendanceOverview.length
      : 0,
    strongestSubject: effectiveData.subjectPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage)[0]?.subjectName || 'N/A',
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  const className = currentUser?.assignedClass || getAssignedTeacherClassNumber(currentUser);
  const section = currentUser?.division || getAssignedTeacherSection(currentUser);
  const liveSyllabus = readSyllabusAnalyticsForClass(className, section).map((item) => ({
    subjectName: item.subjectName,
    completionPercentage: item.percent
  }));
  const syllabusData = liveSyllabus.length > 0 ? liveSyllabus : effectiveData.syllabusStatus;

  // Dynamically compute failed students from localStorage marks data
  const getFailedStudents = () => {
    const className = currentUser?.assignedClass || getAssignedTeacherClassNumber(currentUser);
    const section = currentUser?.division || getAssignedTeacherSection(currentUser);
    const passingMarks = 35;
    const studentMarks = {}; // { studentName: [marks...] }

    // Read all graded-marks-* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('graded-marks-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          Object.entries(data).forEach(([name, subjects]) => {
            if (!studentMarks[name]) studentMarks[name] = [];
            Object.values(subjects).forEach(m => studentMarks[name].push(Number(m) || 0));
          });
        } catch { /* skip */ }
      }
    }

    // Also read marks-data-* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('marks-data-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          Object.entries(data).forEach(([stuId, subjects]) => {
            const actualStudent = classroomStudents.find((student) => student._id === stuId);
            const name = actualStudent?.name || stuId;
            if (!studentMarks[name]) studentMarks[name] = [];
            Object.values(subjects).forEach(m => {
              if (!studentMarks[name].includes(Number(m))) studentMarks[name].push(Number(m) || 0);
            });
          });
        } catch { /* skip */ }
      }
    }

    // Find students whose average is below passing
    const failedStudents = [];
    Object.entries(studentMarks).forEach(([name, marks]) => {
      if (marks.length > 0) {
        const avg = Math.round(marks.reduce((s, m) => s + m, 0) / marks.length);
        if (avg < passingMarks) {
          failedStudents.push({ studentName: name, className, section, averagePercentage: avg });
        }
      }
    });

    // Sort by lowest average first
    failedStudents.sort((a, b) => a.averagePercentage - b.averagePercentage);
    return failedStudents;
  };

  const failedStudents = getFailedStudents();
  // Use actual failed students if available, otherwise fallback to mock
  const interventionStudents = failedStudents.length > 0 ? failedStudents : effectiveData.weakStudents;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Class {currentUser?.assignedClass}-{currentUser?.division} Analytics</h2>
          <p className="text-gray-500 mt-1">Class Teacher Performance Overview</p>
        </div>
        {!analyticsData && (
          <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full border border-blue-100 flex items-center gap-2">
            <TrendingUp size={16} /> No live analytics available
          </span>
        )}
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Overall Perf.', value: `${overallStats.averageClassPerformance.toFixed(1)}%`, icon: <TrendingUp className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Attendance', value: `${overallStats.overallAttendance.toFixed(1)}%`, icon: <Users className="text-green-600" />, bg: 'bg-green-50' },
          { label: 'Weak Students', value: interventionStudents.length, icon: <AlertTriangle className="text-red-600" />, bg: 'bg-red-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-50 hover:shadow-xl transition-shadow cursor-default">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-4 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grade Distribution */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-50 p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Award className="text-yellow-500" /> Grade Spread
          </h3>
          <div className="h-[300px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={effectiveData.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="grade"
                >
                  {effectiveData.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Compliance & Attendance Trends */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-50 p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" /> Weekly Trends
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                barSize={14}
                data={(() => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
                  // Average each metric across all week days
                  const trend = effectiveData.weeklyAttendanceTrend || [];
                  const avgAttn = trend.length ? Math.round(trend.reduce((s, d) => s + (d.percentage || 0), 0) / trend.length) : 0;
                  const avgUnif = trend.length ? Math.round(trend.reduce((s, d) => s + (d.uniform || 0), 0) / trend.length) : 0;
                  const avgIcard = trend.length ? Math.round(trend.reduce((s, d) => s + (d.icard || 0), 0) / trend.length) : 0;
                  return [
                    { name: 'Icard', value: avgIcard, fill: '#f59e0b' },
                    { name: 'Uniform', value: avgUnif, fill: '#3b82f6' },
                    { name: 'Attendance', value: avgAttn, fill: '#10b981' },
                  ];
                })()}
                startAngle={210}
                endAngle={-30}
              >
                <RadialBar
                  background={{ fill: '#f3f4f6' }}
                  dataKey="value"
                  cornerRadius={12}
                />
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#374151' }}
                  labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '13px', lineHeight: '28px' }}
                  formatter={(value) => <span style={{ color: '#374151', fontWeight: 500 }}>{value}</span>}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Performance Index */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-50 p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" /> Subject Performance Index
          </h3>
          <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div className="relative w-64 h-64 mb-6" ref={chartRef}>
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                {(() => {
                  const subjects = effectiveData.subjectPerformance;
                  const total = subjects.reduce((sum, s) => sum + s.averagePercentage, 0);
                  const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#14B8A6'];
                  let cumulativePercent = 0;
                  const radius = 70;
                  const circumference = 2 * Math.PI * radius;
                  return subjects.map((sub, i) => {
                    const percent = (sub.averagePercentage / total) * 100;
                    const offset = (cumulativePercent / 100) * circumference;
                    const dashLength = (percent / 100) * circumference;
                    cumulativePercent += percent;
                    const isActive = selectedSubject?.subjectName === sub.subjectName || hoveredSubject?.subjectName === sub.subjectName;
                    return (
                      <circle
                        key={i}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth={isActive ? 38 : 32}
                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                        strokeDashoffset={-offset}
                        className="cursor-pointer transition-all duration-200"
                        style={{ filter: isActive ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                        onClick={() => setSelectedSubject(selectedSubject?.subjectName === sub.subjectName ? null : sub)}
                        onMouseEnter={(e) => handleSegmentHover(e, sub)}
                        onMouseMove={(e) => handleSegmentHover(e, sub)}
                        onMouseLeave={() => setHoveredSubject(null)}
                      />
                    );
                  });
                })()}
              </svg>
              {/* Hover Tooltip */}
              {hoveredSubject && (
                <div
                  className="absolute z-20 pointer-events-none bg-gray-800 text-white px-3 py-2 rounded-xl shadow-lg text-xs whitespace-nowrap"
                  style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, -100%)' }}
                >
                  <p className="font-bold text-sm">{hoveredSubject.subjectName}</p>
                  <p>Avg: <span className="font-semibold">{hoveredSubject.averagePercentage}%</span> &nbsp; High: <span className="text-green-300 font-semibold">{hoveredSubject.highestScore}</span> &nbsp; Low: <span className="text-red-300 font-semibold">{hoveredSubject.lowestScore}</span></p>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-gray-800">
                  {(hoveredSubject || selectedSubject)
                    ? `${(hoveredSubject || selectedSubject).averagePercentage}%`
                    : effectiveData.subjectPerformance.length > 0
                      ? `${Math.round(effectiveData.subjectPerformance.reduce((sum, s) => sum + s.averagePercentage, 0) / effectiveData.subjectPerformance.length)}%`
                      : '0%'}
                </span>
                <span className="text-xs text-gray-400 font-medium">{(hoveredSubject || selectedSubject) ? (hoveredSubject || selectedSubject).subjectName : 'Average'}</span>
              </div>
            </div>
            {/* Selected Subject Info */}
            {selectedSubject && (
              <div className="w-full max-w-sm mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-800">{selectedSubject.subjectName}</h4>
                  <button onClick={() => setSelectedSubject(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">&times;</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-white rounded-xl">
                    <p className="text-xs text-gray-400 font-semibold">Average</p>
                    <p className="text-lg font-extrabold text-indigo-600">{selectedSubject.averagePercentage}%</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-xl">
                    <p className="text-xs text-gray-400 font-semibold">Highest</p>
                    <p className="text-lg font-extrabold text-green-600">{selectedSubject.highestScore}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-xl">
                    <p className="text-xs text-gray-400 font-semibold">Lowest</p>
                    <p className="text-lg font-extrabold text-red-500">{selectedSubject.lowestScore}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-sm">
              {(() => {
                const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#14B8A6'];
                return effectiveData.subjectPerformance.map((sub, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 transition-colors ${
                      selectedSubject?.subjectName === sub.subjectName ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSubject(selectedSubject?.subjectName === sub.subjectName ? null : sub)}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-sm font-medium text-gray-600 truncate">{sub.subjectName}</span>
                    <span className="text-sm font-bold text-gray-800 ml-auto">{sub.averagePercentage}%</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Academic Champions + Intervention Tracker */}
        <div className="flex flex-col gap-8">
          {/* Top Performers */}
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl shadow-xl border border-indigo-100 p-8 flex-1">
            <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
              <Award className="text-yellow-500" /> Academic Champions
            </h3>
            <div className="space-y-4">
              {effectiveData.topPerformers.map((student, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm hover:translate-x-2 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 text-white rounded-full flex justify-center items-center font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{student.studentName}</h4>
                      <p className="text-xs text-gray-500">Class {student.className}-{student.section}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600">{student.averagePercentage}%</p>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase">Avg Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Tracker */}
          <div className="bg-gradient-to-br from-red-50 to-white rounded-3xl shadow-xl border border-red-100 p-8 flex-1">
            <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="text-red-500" /> Intervention Tracker
            </h3>
            <div className="space-y-4">
              {interventionStudents.map((student, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-red-100 shadow-sm hover:translate-x-2 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex justify-center items-center font-bold">
                      !
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{student.studentName}</h4>
                      <p className="text-xs text-gray-500">Class {student.className}-{student.section}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{student.averagePercentage}%</p>
                      <p className="text-[10px] font-bold text-red-300 uppercase">Avg Score</p>
                    </div>
                    <button className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerformanceAnalytics;
