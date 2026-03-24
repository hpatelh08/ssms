import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import AttendanceCalendar from './attendance/AttendanceCalendar';
import AttendanceProgress from './attendance/AttendanceProgress';
import AttendanceStatsCard from './attendance/AttendanceStatsCard';
import WeeklyGoalTracker from './attendance/WeeklyGoalTracker';
import HolidayKPI from './HolidayKPI';
import {
    fetchAttendance,
    initializeAttendance,
    selectAttendanceLoading,
    selectAttendanceError
} from '../store/attendanceSlice';
import { fetchHolidays } from '../store/holidaysSlice';
import './Attendance.css';

function Attendance({ profile }) {
    const dispatch = useDispatch();
    const loading = useSelector(selectAttendanceLoading);
    const error = useSelector(selectAttendanceError);

    useEffect(() => {
        if (!profile) {
            return;
        }

        dispatch(initializeAttendance({
            percentage: Math.round(profile.attendance_percentage || 0),
            presentDays: profile.present_days || 0,
            absentDays: profile.absent_days || 0,
            totalDays: profile.total_days || 0,
            streak: profile.attendance_streak || 0
        }));

        if (profile.uid) {
            dispatch(fetchAttendance(profile.uid));
        }

        dispatch(fetchHolidays());
    }, [profile, dispatch]);

    if (!profile || loading) {
        return (
            <div className="attendance-loading">
                <div className="spinner"></div>
                <p>Loading attendance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="attendance-error">
                <h3>Unable to load attendance</h3>
                <p>{error}</p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="attendance-section"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="attendance-header" variants={itemVariants}>
                <div className="attendance-header-left">
                    <motion.h1
                        className="section-title"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <span className="title-icon" aria-hidden="true">📊</span>
                        Attendance Tracker
                    </motion.h1>
                </div>

                <motion.div
                    className="header-decoration"
                    animate={{ y: [0, -8, 0], rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span aria-hidden="true">📚</span>
                </motion.div>
            </motion.div>

            <motion.div
                className="smart-calendar-section"
                variants={itemVariants}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 280 }}
            >
                <AttendanceCalendar />
            </motion.div>

            <div className="attendance-grid">
                <div className="attendance-top-row">
                    <motion.div
                        className="progress-card"
                        variants={itemVariants}
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 280 }}
                    >
                        <AttendanceProgress />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <WeeklyGoalTracker />
                    </motion.div>
                </div>

                <motion.div
                    className="holiday-kpi-row"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 280 }}
                >
                    <HolidayKPI />
                </motion.div>

                <motion.div
                    className="stats-card"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 280 }}
                >
                    <AttendanceStatsCard />
                </motion.div>
            </div>

            <motion.div
                className="floating-cloud"
                animate={{ x: [0, 14, 0], y: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
                <span aria-hidden="true">☁️</span>
            </motion.div>
        </motion.div>
    );
}

export default Attendance;
