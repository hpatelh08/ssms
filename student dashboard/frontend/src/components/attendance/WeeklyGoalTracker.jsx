import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectWeeklyAttendance } from '../../store/attendanceSlice';
import './WeeklyGoalTracker.css';

const useCountUp = (target, duration = 1200, delay = 300) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let start = null;
        let rafId;

        const timeoutId = setTimeout(() => {
            const step = (timestamp) => {
                if (!start) {
                    start = timestamp;
                }

                const progress = Math.min((timestamp - start) / duration, 1);
                setValue(Math.round(progress * target));

                if (progress < 1) {
                    rafId = requestAnimationFrame(step);
                }
            };

            rafId = requestAnimationFrame(step);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
        };
    }, [target, duration, delay]);

    return value;
};

const cardVariants = {
    hidden: { opacity: 0, y: 22, scale: 0.97 },
    show: (index) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.45,
            delay: 0.75 + index * 0.1,
            ease: [0.4, 0, 0.2, 1]
        }
    })
};

const WeeklyGoalTracker = () => {
    const { present, absent, goal, progress } = useSelector(selectWeeklyAttendance);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hasShownConfetti, setHasShownConfetti] = useState(false);

    const animatedPresent = useCountUp(present, 1000, 350);
    const animatedAbsent = useCountUp(absent, 1000, 450);
    const animatedGoal = useCountUp(goal, 1000, 550);

    useEffect(() => {
        if (progress >= 100 && !hasShownConfetti) {
            setShowConfetti(true);
            setHasShownConfetti(true);

            const timeoutId = setTimeout(() => setShowConfetti(false), 2500);
            return () => clearTimeout(timeoutId);
        }
    }, [progress, hasShownConfetti]);

    const getProgressMessage = () => {
        if (progress >= 100) return { emoji: '🎉', text: 'Goal complete. Amazing week!' };
        if (progress > 80) return { emoji: '🌟', text: 'Outstanding progress this week.' };
        if (progress >= 40) return { emoji: '🚀', text: "You're moving in the right direction." };
        return { emoji: '💪', text: "Let's push a little harder this week." };
    };

    const message = getProgressMessage();
    const circumference = 534;
    const safeProgress = Math.max(0, Math.min(progress, 100));
    const strokeOffset = circumference - ((circumference * safeProgress) / 100);

    const confettiColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f59e0b', '#10b981', '#8b5cf6'];
    const confettiParticles = Array.from({ length: 24 }, (_, index) => ({
        id: index,
        color: confettiColors[index % confettiColors.length],
        x: Math.random() * 100,
        delay: Math.random() * 0.25
    }));

    return (
        <motion.div
            className="weekly-goal-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
            <div className="goal-header">
                <div className="header-left">
                    <span className="header-icon" aria-hidden="true">🎯</span>
                    <h3>Weekly Goal Tracker</h3>
                </div>

                <div className="header-badges">
                    {safeProgress >= 100 && (
                        <motion.div
                            className="star-badge"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        >
                            Weekly Star
                        </motion.div>
                    )}
                    <div className="progress-pill">{safeProgress}%</div>
                </div>
            </div>

            <AnimatePresence>
                {showConfetti && (
                    <div className="confetti-container">
                        {confettiParticles.map((particle) => (
                            <motion.div
                                key={particle.id}
                                className="confetti-piece"
                                style={{ backgroundColor: particle.color, left: `${particle.x}%` }}
                                initial={{ y: -20, opacity: 1, rotate: 0 }}
                                animate={{ y: 320, opacity: 0, rotate: 360 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 2.2, delay: particle.delay, ease: 'easeIn' }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <div className="circular-progress-container">
                <svg className="circular-progress" viewBox="0 0 200 200" aria-label={`Weekly goal progress ${safeProgress}%`}>
                    <circle className="progress-bg" cx="100" cy="100" r="85" fill="none" />
                    <motion.circle
                        className="progress-bar"
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: strokeOffset }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 }}
                    />
                </svg>

                <div className="goal-center">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45, delay: 0.45 }}
                    >
                        {present}/{goal}
                    </motion.h2>
                    <p>Days Present</p>
                    <motion.span
                        className="goal-emoji"
                        animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                    >
                        {message.emoji}
                    </motion.span>
                </div>
            </div>

            <div className="divider" />

            <div className="linear-progress-wrapper">
                <div className="progress-labels-top">
                    <span className="progress-message">{message.text}</span>
                    <span className="progress-percentage">{safeProgress}%</span>
                </div>
                <div className="linear-progress-bg">
                    <motion.div
                        className="linear-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${safeProgress}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
                    />
                </div>
            </div>

            <div className="goal-metrics">
                {[
                    { cls: 'present', icon: '✅', label: 'Present', value: animatedPresent, index: 0 },
                    { cls: 'absent', icon: '❌', label: 'Absent', value: animatedAbsent, index: 1 },
                    { cls: 'goal', icon: '🎯', label: 'Working Days', value: animatedGoal, index: 2 }
                ].map(({ cls, icon, label, value, index }) => (
                    <motion.div
                        key={cls}
                        className={`metric ${cls}`}
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="show"
                        whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    >
                        <div className="metric-icon">{icon}</div>
                        <div className="metric-body">
                            <p className="metric-label">{label}</p>
                            <h3 className="metric-value">{value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default WeeklyGoalTracker;
