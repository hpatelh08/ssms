import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    selectAttendancePercentage,
    selectAttendanceStats,
    selectMotivationalMessage
} from '../../store/attendanceSlice';
import './AttendanceProgress.css';

function AttendanceProgress() {
    const percentage = useSelector(selectAttendancePercentage);
    const stats = useSelector(selectAttendanceStats);
    const motivation = useSelector(selectMotivationalMessage);

    const size = 200;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const safePercentage = Math.max(0, Math.min(percentage, 100));
    const offset = circumference - (safePercentage / 100) * circumference;

    const getProgressColor = () => {
        if (safePercentage >= 95) return '#10b981';
        if (safePercentage >= 85) return '#3b82f6';
        if (safePercentage >= 75) return '#f59e0b';
        return '#ef4444';
    };

    const getBadgeLabel = () => {
        if (safePercentage >= 95) return 'Star Student';
        if (safePercentage >= 85) return 'Great Work';
        if (safePercentage >= 75) return 'Keep Going';
        return 'Need Improvement';
    };

    const getBadgeGradient = () => {
        if (safePercentage >= 95) return 'linear-gradient(135deg,#22c55e,#16a34a)';
        if (safePercentage >= 85) return 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
        if (safePercentage >= 75) return 'linear-gradient(135deg,#f59e0b,#d97706)';
        return 'linear-gradient(135deg,#ef4444,#b91c1c)';
    };

    const progressColor = getProgressColor();

    return (
        <motion.div
            className="attendance-card-v2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="acv2-left">
                <div className="acv2-progress-wrapper">
                    <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        className="acv2-ring"
                        aria-label={`Attendance percentage ${safePercentage}%`}
                    >
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth={strokeWidth}
                        />
                        <motion.circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={progressColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 10px ${progressColor}50)` }}
                        />
                    </svg>

                    <div className="acv2-center-text">
                        <motion.h2
                            style={{ color: progressColor }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                        >
                            {safePercentage}%
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            {motivation.message}
                        </motion.p>
                        <motion.span
                            className="acv2-center-emoji"
                            initial={{ scale: 0, rotate: -150 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.6, type: 'spring', stiffness: 150 }}
                        >
                            {motivation.emoji}
                        </motion.span>
                    </div>

                    {safePercentage === 100 && (
                        <motion.div
                            className="acv2-confetti"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            🎊
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="acv2-right">
                <div className="acv2-title-section">
                    <div className="acv2-title-left">
                        <span className="acv2-icon" aria-hidden="true">📈</span>
                        <h3>Attendance Overview</h3>
                    </div>
                    <motion.span
                        className="acv2-badge"
                        style={{ background: getBadgeGradient() }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 220 }}
                    >
                        {getBadgeLabel()}
                    </motion.span>
                </div>

                <div className="acv2-stats-grid">
                    {[
                        { cls: 'present', label: 'Present', value: stats.presentDays },
                        { cls: 'absent', label: 'Absent', value: stats.absentDays },
                        { cls: 'total', label: 'Total Days', value: stats.totalDays }
                    ].map(({ cls, label, value }, index) => (
                        <motion.div
                            key={cls}
                            className={`acv2-stat-box ${cls}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.35 }}
                        >
                            <span className="acv2-stat-label">{label}</span>
                            <h4>{value}</h4>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default AttendanceProgress;
