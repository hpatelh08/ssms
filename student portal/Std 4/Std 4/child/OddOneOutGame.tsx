import React, { useState, useEffect, useCallback } from 'react';
import { useCelebrate } from './useCelebrationController';
import { useAddXP } from './XPProvider';
import { recordJourneyLevel, JOURNEY_GAMES } from './journey/journeyProgress';
import LevelPathMap from './LevelPathMap';
import { logActivity } from '../services/activityLogger';

const OOO_STORAGE_KEY = 'oddOneOut_currentLevel';
const XP_PER_LEVEL = 25;


// Use the provided answer key file (format: "words → Answer: answer")
import questionsWithAnswersRaw from '../STD 04/odd_one_out_1000_with_answers.txt?raw';

function parseQuestionsWithAnswers(raw: string) {
    return raw
        .split('\n')
        .map(line => {
            const match = line.match(/^(\d+)\.\s+([^→]+)→ Answer: (.+)$/);
            if (!match) return null;
            const words = match[2].split(',').map(w => w.trim());
            const answer = match[3].trim();
            return { words, answer };
        })
        .filter(Boolean);
}

const ALL_QUESTIONS = parseQuestionsWithAnswers(questionsWithAnswersRaw);
const LEVELS = 200;
const QUESTIONS_PER_LEVEL = 5;
const TOTAL_QUESTIONS = LEVELS * QUESTIONS_PER_LEVEL;
const ODD_ONE_OUT_QUESTIONS = ALL_QUESTIONS.slice(0, TOTAL_QUESTIONS);



const OddOneOutGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const celebrate = useCelebrate();
    const addXP = useAddXP();

    const [level, setLevel] = useState<number>(() => {
        try { return Math.max(1, parseInt(localStorage.getItem(OOO_STORAGE_KEY) || '1', 10)); }
        catch { return 1; }
    }); // 1-based
    const [questionIndex, setQuestionIndex] = useState(0); // 0-4 in a level
    const [selected, setSelected] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [showLevelComplete, setShowLevelComplete] = useState(false);
    const [earnedXP, setEarnedXP] = useState(0);
    const [showMap, setShowMap] = useState(true);

    // Persist level to localStorage whenever it changes
    useEffect(() => {
        try { localStorage.setItem(OOO_STORAGE_KEY, String(level)); } catch { /* ignore */ }
    }, [level]);

    // Get questions for current level
    const startIdx = (level - 1) * QUESTIONS_PER_LEVEL;
    const questions = ODD_ONE_OUT_QUESTIONS.slice(startIdx, startIdx + QUESTIONS_PER_LEVEL);
    const question = questions[questionIndex];

    const handleSelect = (word: string) => {
        setSelected(word);
        setShowResult(true);
        if (word === question.answer) setScore((s) => s + 1);
    };

    const handleNext = () => {
        setSelected(null);
        setShowResult(false);
        if (questionIndex < QUESTIONS_PER_LEVEL - 1) {
            setQuestionIndex((prev) => prev + 1);
        } else {
            // End of level — show celebration before advancing
            celebrate('confetti');
            addXP(XP_PER_LEVEL);
            setEarnedXP(XP_PER_LEVEL);
            recordJourneyLevel(JOURNEY_GAMES.ODD_ONE_OUT);
            logActivity('oddOneOut', 3);
            setShowLevelComplete(true);
        }
    };

    const handleContinue = () => {
        setShowLevelComplete(false);
        const nextLevel = level < LEVELS ? level + 1 : 1;
        setQuestionIndex(0);
        setLevel(nextLevel);
        setScore(0);
    };

    const handleLevelSelect = useCallback((selectedLevel: number) => {
        setLevel(selectedLevel);
        setQuestionIndex(0);
        setSelected(null);
        setShowResult(false);
        setScore(0);
        setShowMap(false);
    }, []);

    if (showMap) {
        return (
            <LevelPathMap
                currentLevel={level}
                totalLevels={LEVELS}
                onSelectLevel={handleLevelSelect}
                onBack={onBack}
                title="🚗 Odd One Out"
            />
        );
    }

    if (!question) return null;

    return (
        <div style={{
            maxWidth: 440,
            margin: '48px auto',
            background: 'linear-gradient(135deg, #f0f4ff 60%, #e0f7fa 100%)',
            borderRadius: 24,
            boxShadow: '0 8px 32px #c7d2fe99',
            padding: 32,
            textAlign: 'center',
            position: 'relative',
            border: '2px solid #a5b4fc',
        }}>
            {/* ── Level Complete Overlay ── */}
            {showLevelComplete && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(79,70,229,0.82)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999,
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 28,
                        padding: '40px 52px',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                        animation: 'popIn 0.35s cubic-bezier(.34,1.56,.64,1)',
                    }}>
                        <div style={{ fontSize: 72, lineHeight: 1.1 }}>🎉</div>
                        <h2 style={{ fontSize: 30, fontWeight: 900, color: '#4f46e5', margin: '12px 0 8px' }}>
                            Level {level} Complete!
                        </h2>
                        <div style={{
                            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                            color: '#fff',
                            borderRadius: 20,
                            padding: '10px 28px',
                            fontWeight: 900,
                            fontSize: 26,
                            display: 'inline-block',
                            margin: '10px 0',
                            boxShadow: '0 4px 12px #fbbf2466',
                        }}>⭐ +{earnedXP} XP</div>
                        <p style={{ color: '#6366f1', fontWeight: 700, fontSize: 17, margin: '14px 0 20px' }}>
                            Amazing work! Keep it up! 🚀
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => { setShowLevelComplete(false); setShowMap(true); }}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: 16,
                                    background: '#fff',
                                    color: '#6366f1',
                                    fontWeight: 900,
                                    fontSize: 17,
                                    border: '2px solid #6366f1',
                                    cursor: 'pointer',
                                }}
                            >
                                🗺️ Map
                            </button>
                            <button
                                onClick={handleContinue}
                                style={{
                                    padding: '12px 36px',
                                    borderRadius: 16,
                                    background: 'linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontSize: 17,
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 16px #a5b4fc',
                                    letterSpacing: 0.5,
                                }}
                            >
                                Continue ➜
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button style={{ position: 'absolute', left: 18, top: 18, background: '#fff', border: '1.5px solid #818cf8', borderRadius: 8, padding: '4px 12px', fontWeight: 700, color: '#6366f1', cursor: 'pointer', zIndex: 2 }} onClick={() => setShowMap(true)}>
                ⬅ Map
            </button>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5', marginBottom: 12, letterSpacing: 1 }}>🧩 Odd One Out</h2>
            <div style={{ marginBottom: 10, fontWeight: 700, color: '#6366f1', fontSize: 18 }}>
                Level {level} / {LEVELS} &nbsp;|&nbsp; Question {questionIndex + 1} / {QUESTIONS_PER_LEVEL}
            </div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: '#0ea5e9' }}>Choose the word that is different:</p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 18,
                justifyContent: 'center',
                marginBottom: 32,
            }}>
                {question.words.map((word) => (
                    <button
                        key={word}
                        onClick={() => handleSelect(word)}
                        disabled={!!selected}
                        style={{
                            padding: '16px 0',
                            borderRadius: 16,
                            border: selected === word ? (word === question.answer ? '2.5px solid #22c55e' : '2.5px solid #ef4444') : '2.5px solid #818cf8',
                            background: selected === word ? (word === question.answer ? 'linear-gradient(90deg, #bbf7d0 60%, #dbeafe 100%)' : 'linear-gradient(90deg, #fecaca 60%, #f3f4f6 100%)') : 'linear-gradient(90deg, #f3f4f6 60%, #e0e7ff 100%)',
                            color: '#3730a3',
                            fontWeight: 800,
                            fontSize: 18,
                            cursor: selected ? 'not-allowed' : 'pointer',
                            boxShadow: selected === word ? (word === question.answer ? '0 0 0 4px #bbf7d0' : '0 0 0 4px #fecaca') : '0 2px 8px #e0e7ff',
                            outline: 'none',
                            transition: 'all 0.18s',
                        }}
                    >
                        {word}
                    </button>
                ))}
            </div>
            {showResult && (
                <div style={{ marginBottom: 18 }}>
                    {selected === question.answer ? (
                        <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>✅ Correct! Great job! 🎉</span>
                    ) : (
                        <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>❌ Oops! The answer is "{question.answer}".</span>
                    )}
                </div>
            )}
            <button
                onClick={handleNext}
                style={{
                    padding: '12px 36px',
                    borderRadius: 14,
                    background: 'linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 17,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px #a5b4fc',
                    marginTop: 8,
                    letterSpacing: 0.5,
                }}
            >
                {questionIndex < QUESTIONS_PER_LEVEL - 1 ? 'Next Question' : 'Next Level'}
            </button>
        </div>
    );
};

export default OddOneOutGame;
