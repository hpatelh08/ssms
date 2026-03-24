import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    selectAttendanceStats,
    selectPerfectAttendanceBadge,
    selectRiskLevel
} from '../../store/attendanceSlice';
import './AttendanceStatsCard.css';

function AttendanceStatsCard() {
    const stats = useSelector(selectAttendanceStats);
    const hasPerfectBadge = useSelector(selectPerfectAttendanceBadge);
    const riskLevel = useSelector(selectRiskLevel);

    const riskCopy = {
        low: {
            label: 'On Track',
            text: 'Your attendance is healthy and consistent.'
        },
        medium: {
            label: 'Watch It',
            text: 'A few more present days will lift your score quickly.'
        },
        high: {
            label: 'Needs Attention',
            text: 'Regular attendance is important. Try not to miss school days.'
        }
    };

    const summaryCards = [
        {
            key: 'streak',
            emoji: '🔥',
            label: 'Current Streak',
            value: `${stats.streak || 0} days`
        },
        {
            key: 'rate',
            emoji: '📌',
            label: 'Attendance Rate',
            value: `${stats.percentage || 0}%`
        },
        {
            key: 'risk',
            emoji: '🛡️',
            label: 'Status',
            value: riskCopy[riskLevel]?.label || 'On Track'
        }
    ];

    return (
        <div className="attendance-stats-card">
            <div className="stats-section">
                <div className="card-header">
                    <div className="header-left">
                        <span className="header-icon" aria-hidden="true">✨</span>
                        <h3>Attendance Highlights</h3>
                    </div>
                </div>

                <div className="summary-row">
                    {summaryCards.map((item, index) => (
                        <motion.div
                            key={item.key}
                            className="summary-item"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.08 }}
                        >
                            <div className="summary-emoji">{item.emoji}</div>
                            <div className="summary-label">{item.label}</div>
                            <div className="summary-count">{item.value}</div>
                        </motion.div>
                    ))}
                </div>

                <div className={`status-strip status-strip--${riskLevel}`}>
                    <div>
                        <span className="status-strip__label">{riskCopy[riskLevel]?.label}</span>
                        <p className="status-strip__text">{riskCopy[riskLevel]?.text}</p>
                    </div>
                    <span className="status-strip__value">{stats.presentDays}/{stats.totalDays || 0}</span>
                </div>
            </div>

            {hasPerfectBadge && (
                <motion.div
                    className="badge-section"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 140 }}
                >
                    <div className="perfect-badge">
                        <motion.div
                            className="badge-icon"
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            🏅
                        </motion.div>
                        <div className="badge-content">
                            <div className="badge-title">Perfect Month</div>
                            <div className="badge-subtitle">30+ day attendance streak unlocked</div>
                        </div>
                    </div>

                    <motion.div
                        className="star-explosion"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ✨
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

export default AttendanceStatsCard;
