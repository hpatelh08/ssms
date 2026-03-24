import React, { useState, useEffect } from 'react';
import { useCelebrate } from './useCelebrationController';
import LevelPathMap from './LevelPathMap';
import { useAddXP } from './XPProvider';
import { recordJourneyLevel, JOURNEY_GAMES } from './journey/journeyProgress';
import { logActivity } from '../services/activityLogger';
import wordBuilderPdfLevels from '../STD 04/word_builder_1000.json';

const WB_STORAGE_KEY = 'wordBuilder_currentLevel';
const XP_PER_LEVEL = 25;

type WordBuilderPdfLevel = {
    letters: string[];
    answers: string[];
};

const WORD_BUILDER_PDF_LEVELS = (wordBuilderPdfLevels as WordBuilderPdfLevel[])
    .filter((entry) => Array.isArray(entry.letters) && Array.isArray(entry.answers) && entry.letters.length > 0)
    .map((entry) => ({
        letters: entry.letters.map((letter) => String(letter).trim().toUpperCase()).filter(Boolean),
        answers: Array.from(new Set(entry.answers.map((word) => String(word).trim().toUpperCase()).filter(Boolean))),
    }));

const WB_LEVELS = Math.min(200, WORD_BUILDER_PDF_LEVELS.length);

const WordBuilderGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const celebrate = useCelebrate();
    const addXP = useAddXP();

    const [level, setLevel] = useState<number>(() => {
        try { return Math.max(1, parseInt(localStorage.getItem(WB_STORAGE_KEY) || '1', 10)); }
        catch { return 1; }
    });

    const [setIndex, setSetIndex] = useState(0);
    const [input, setInput] = useState('');
    const [usedIndexes, setUsedIndexes] = useState<number[]>([]);
    const [words, setWords] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [showLevelComplete, setShowLevelComplete] = useState(false);
    const [earnedXP, setEarnedXP] = useState(0);
    const [found, setFound] = useState<Set<string>>(new Set());
    const [missedWords, setMissedWords] = useState<string[]>([]);
    const [showMap, setShowMap] = useState(true);

    // Persist level to localStorage whenever it changes
    useEffect(() => {
        try { localStorage.setItem(WB_STORAGE_KEY, String(level)); } catch { /* ignore */ }
    }, [level]);

    // Using PDF levels directly for progression (no generated extra words)
    const levelData = WORD_BUILDER_PDF_LEVELS[(level - 1) % WB_LEVELS] ?? { letters: ['A', 'B', 'C'], answers: [] };
    const letters = levelData.letters;
    const validWords = levelData.answers;


    const handleLetterClick = (idx: number) => {
        if (usedIndexes.includes(idx)) return;
        setInput(input + letters[idx]);
        setUsedIndexes([...usedIndexes, idx]);
        setMessage('');
    };

    const handleBackspace = () => {
        if (input.length === 0) return;
        setUsedIndexes(usedIndexes.slice(0, -1));
        setInput(input.slice(0, -1));
        setMessage('');
    };

    const handleClear = () => {
        setInput('');
        setUsedIndexes([]);
        setMessage('');
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const word = input.trim().toUpperCase();
        if (word.length < 3) {
            setMessage('Word must be at least 3 letters.');
            return;
        }
        if (!validWords.includes(word)) {
            setMessage('This word is not in this level list.');
            return;
        }
        if (found.has(word)) {
            setMessage('Already found!');
            return;
        }
        setWords([...words, word]);
        setFound(new Set([...found, word]));
        setInput('');
        setUsedIndexes([]);
        setMessage('');
    };

    const handleNext = () => {
        const missed = validWords.filter(w => !found.has(w));
        setMissedWords(missed);
        celebrate('confetti');
        addXP(XP_PER_LEVEL);
        setEarnedXP(XP_PER_LEVEL);
        recordJourneyLevel(JOURNEY_GAMES.WORD_BUILDER);
        logActivity('worldBuilder', 3);
        setShowLevelComplete(true);
    };

    const handleContinue = () => {
        setShowLevelComplete(false);
        const nextLevel = level < WB_LEVELS ? level + 1 : 1;
        setLevel(nextLevel);
        setWords([]);
        setFound(new Set());
        setMissedWords([]);
        setInput('');
        setUsedIndexes([]);
        setMessage('');
    };

    const handleLevelSelect = (selectedLevel: number) => {
        setLevel(selectedLevel);
        setWords([]);
        setFound(new Set());
        setMissedWords([]);
        setInput('');
        setUsedIndexes([]);
        setMessage('');
        setShowMap(false);
    };

    if (showMap) {
        return (
            <LevelPathMap
                currentLevel={level}
                totalLevels={WB_LEVELS}
                onSelectLevel={handleLevelSelect}
                onBack={onBack}
                title="🔤 Word Builder"
            />
        );
    }

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
                        {missedWords.length > 0 && (
                            <div style={{ marginBottom: 16, textAlign: 'left', background: '#fef3c7', borderRadius: 14, padding: '12px 16px', border: '1.5px solid #fcd34d' }}>
                                <div style={{ fontWeight: 800, color: '#92400e', fontSize: 14, marginBottom: 8 }}>📚 Words you missed ({missedWords.length}):</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {missedWords.map((w, i) => (
                                        <span key={i} style={{ background: '#fde68a', color: '#78350f', fontWeight: 800, fontSize: 14, borderRadius: 8, padding: '4px 10px', letterSpacing: 1 }}>{w}</span>
                                    ))}
                                </div>
                            </div>
                        )}
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
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5', marginBottom: 12, letterSpacing: 1 }}>🔤 Word Builder</h2>
            <div style={{ marginBottom: 10, fontWeight: 700, color: '#6366f1', fontSize: 18 }}>
                Level {level}
            </div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: '#0ea5e9' }}>Make as many words as you can using these letters:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                {letters.map((l, i) => (
                    <button
                        key={i}
                        onClick={() => handleLetterClick(i)}
                        disabled={usedIndexes.includes(i)}
                        style={{
                            display: 'inline-block',
                            background: usedIndexes.includes(i) ? '#a5b4fc' : '#6366f1',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: 28,
                            borderRadius: 10,
                            padding: '10px 18px',
                            boxShadow: '0 2px 8px #a5b4fc',
                            letterSpacing: 2,
                            opacity: usedIndexes.includes(i) ? 0.5 : 1,
                            cursor: usedIndexes.includes(i) ? 'not-allowed' : 'pointer',
                            border: 'none',
                            marginRight: 2,
                            marginLeft: 2,
                            transition: 'background 0.18s, opacity 0.18s',
                        }}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <div style={{
                    minWidth: 120,
                    minHeight: 44,
                    background: '#f3f4f6',
                    border: '2px solid #818cf8',
                    borderRadius: 10,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color: '#3730a3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                }}>{input || <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Click letters</span>}</div>
                <button onClick={handleBackspace} style={{
                    padding: '8px 12px', borderRadius: 8, background: '#fca5a5', color: '#fff', fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px #fca5a5',
                }}>⌫</button>
                <button onClick={handleClear} style={{
                    padding: '8px 12px', borderRadius: 8, background: '#a5b4fc', color: '#fff', fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px #a5b4fc',
                }}>Clear</button>
                <button onClick={() => handleSubmit()} style={{
                    padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)', color: '#fff', fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px #a5b4fc',
                }}>Add</button>
            </div>
            {message && <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 10 }}>{message}</div>}
            <div style={{ marginBottom: 18 }}>
                <h4 style={{ fontSize: 16, color: '#6366f1', fontWeight: 800, marginBottom: 8 }}>Your Words ({words.length} / {validWords.length} possible):</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    {words.map((w, i) => (
                        <span key={i} style={{
                            background: '#bbf7d0',
                            color: '#166534',
                            fontWeight: 800,
                            fontSize: 16,
                            borderRadius: 8,
                            padding: '6px 14px',
                            letterSpacing: 1,
                        }}>{w}</span>
                    ))}
                </div>
            </div>
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
                Next Level
            </button>
        </div>
    );
};

export default WordBuilderGame;
