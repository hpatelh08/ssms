import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Line, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, AlertTriangle, Users, MessageCircle, BarChart2, Award, CheckCircle2 } from 'lucide-react';

const PerformanceAnalytics = ({ currentUser }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
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

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/analytics', {
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

  // Fallback to mock data if actual data is unavailable or has errors
  const effectiveData = analyticsData || {
    classPerformance: [
      { className: '8', section: 'B', averagePercentage: 78, highestScore: 95, lowestScore: 45 }
    ],
    subjectPerformance: [
      { subjectName: 'Math', averagePercentage: 85, highestScore: 100, lowestScore: 60 },
      { subjectName: 'Science', averagePercentage: 72, highestScore: 94, lowestScore: 35 },
      { subjectName: 'English', averagePercentage: 90, highestScore: 98, lowestScore: 75 },
      { subjectName: 'Hindi', averagePercentage: 88, highestScore: 96, lowestScore: 70 },
      { subjectName: 'Gujarati', averagePercentage: 92, highestScore: 99, lowestScore: 80 },
      { subjectName: 'Sanskrit', averagePercentage: 84, highestScore: 97, lowestScore: 65 }
    ],
    attendanceOverview: [
      { className: '8', section: 'B', averageAttendance: 94 }
    ],
    gradeDistribution: [
      { grade: 'A+', count: 4 },
      { grade: 'A', count: 12 },
      { grade: 'B', count: 15 },
      { grade: 'C', count: 5 },
      { grade: 'D', count: 2 },
      { grade: 'F', count: 1 }
    ],
    weakStudents: [
      { studentName: 'Aditya Dave', className: '8', section: 'B', averagePercentage: 38 }
    ],
    topPerformers: [
      { studentName: 'Hetvi Patel', className: '8', section: 'B', averagePercentage: 96 },
      { studentName: 'Vihan Mehta', className: '8', section: 'B', averagePercentage: 92 }
    ],
    weeklyAttendanceTrend: [
      { date: '2026-02-23', percentage: 95, uniform: 90, icard: 94 }, // Monday
      { date: '2026-02-24', percentage: 94, uniform: 91, icard: 95 }, // Tuesday
      { date: '2026-02-25', percentage: 91, uniform: 88, icard: 92 }, // Wednesday
      { date: '2026-02-26', percentage: 96, uniform: 94, icard: 96 }, // Thursday
      { date: '2026-02-27', percentage: 94, uniform: 92, icard: 95 }, // Friday
      { date: '2026-02-28', percentage: 93, uniform: 95, icard: 97 }  // Saturday
    ],
    syllabusStatus: [
      { subjectName: 'Math', completionPercentage: 75 },
      { subjectName: 'Science', completionPercentage: 60 },
      { subjectName: 'English', completionPercentage: 85 },
      { subjectName: 'Hindi', completionPercentage: 80 },
      { subjectName: 'Gujarati', completionPercentage: 90 },
      { subjectName: 'Sanskrit', completionPercentage: 70 }
    ]
  };

  const overallStats = {
    totalStudents: (effectiveData.weakStudents?.length || 0) + (effectiveData.topPerformers?.length || 0) + 50,
    averageClassPerformance: effectiveData.classPerformance.reduce((acc, cls) => acc + (cls.averagePercentage || 0), 0) / effectiveData.classPerformance.length,
    overallAttendance: effectiveData.attendanceOverview.reduce((acc, cls) => acc + (cls.averageAttendance || 0), 0) / effectiveData.attendanceOverview.length,
    strongestSubject: effectiveData.subjectPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage)[0]?.subjectName || 'N/A',
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  // Read actual syllabus progress from ClassManagement localStorage
  const getLiveSyllabusStatus = () => {
    const className = currentUser?.assignedClass || '8';
    const section = currentUser?.division || 'B';
    const classKey = `${className}-${section}`;
    const saved = localStorage.getItem(`syllabus-data-${classKey}`);
    if (!saved) return null;
    try {
      const syllabusMap = JSON.parse(saved);
      return Object.entries(syllabusMap).map(([key, chapters]) => {
        const subjectName = key.replace(/-\d+$/, '');
        const totalTopics = chapters.reduce((s, ch) => s + ch.subTopics.length, 0);
        const completedTopics = chapters.reduce((s, ch) => s + ch.subTopics.filter(t => t.completed).length, 0);
        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        return { subjectName, completionPercentage };
      });
    } catch { return null; }
  };

  const liveSyllabus = getLiveSyllabusStatus();
  const syllabusData = liveSyllabus || effectiveData.syllabusStatus;

  // Dynamically compute failed students from localStorage marks data
  const getFailedStudents = () => {
    const className = currentUser?.assignedClass || '8';
    const section = currentUser?.division || 'B';
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
          const indianNames = [
            "Aarav Sharma", "Vivaan Patel", "Aditya Singh", "Vihaan Kumar", "Arjun Gupta",
            "Sai Krishna", "Reyansh Reddy", "Ayaan Khan", "Krishna Iyer", "Ishaan Verma",
            "Rudra Joshi", "Dhruv Desai", "Kabir Das", "Atharv Yadav", "Rishi Tiwari",
            "Adwait Pandey", "Aanya Sharma", "Diya Patel", "Ananya Singh", "Myra Kumar",
            "Kavya Gupta", "Siya Reddy", "Navya Khan", "Aaradhya Iyer", "Saanvi Verma",
            "Nyra Joshi", "Sneha Desai", "Ira Das", "Riya Yadav", "Tara Tiwari",
            "Kiara Pandey", "Advik Nair", "Pranav Menon", "Rohan Sethi", "Karthik Pillai",
            "Siddharth Rao", "Neel Thakur", "Dev Bhardwaj", "Rahul Chatterjee", "Nikhil Sen"
          ];
          Object.entries(data).forEach(([stuId, subjects]) => {
            const idx = parseInt(stuId.replace('MOCK_STU_', '')) - 1;
            const name = indianNames[idx] || stuId;
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
            <TrendingUp size={16} /> Data Mode: Simulated
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