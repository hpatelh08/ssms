import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setActiveSection } from '../store/uiSlice';
import { logActivity } from '../store/activitySlice';
import { apiService } from '../services/api';
import './SubjectPage.css';

const BACKEND = import.meta.env.MODE === 'development' ? 'http://127.0.0.1:8000' : '';

async function downloadChapter(filePath, filename) {
    try {
        const token = localStorage.getItem('authToken');
        const url   = `${BACKEND}${filePath}`;
        const res   = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href     = blobUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(blobUrl);
    } catch {
        alert('Download failed. Please try again.');
    }
}

/* Subject metadata (color + label) by slug */
const META = {
    Std_8_math:     { label: 'Mathematics',          icon: '📐', color: '#2563EB', bg: '#EFF6FF' },
    Std_8_eng:     { label: 'English Literature',   icon: '📖', color: '#16A34A', bg: '#F0FDF4' },
    Std_8_hindi:    { label: 'Hindi',                icon: 'अ',  color: '#BE123C', bg: '#FFF1F2' },
    Std_8_science:  { label: 'Science',              icon: '🔬', color: '#0F766E', bg: '#F0FDFA' },
    Std_8_arts:     { label: 'Fine Arts',            icon: '🎨', color: '#7E22CE', bg: '#FAF5FF' },
    Std_8_social:   { label: 'Social Science',       icon: '🌍', color: '#C2410C', bg: '#FFF7ED' },
    Std_8_sanskrit: { label: 'Sanskrit',             icon: 'स',  color: '#9D174D', bg: '#FDF2F8' },
    Std_8_physed:   { label: 'Physical Education',   icon: '🏃', color: '#4D7C0F', bg: '#F7FEE7' },
    Std_8_voced:    { label: 'Vocational Education', icon: '🛠️', color: '#3730A3', bg: '#EEF2FF' },
};

/* ── Chapter Card ── */
function ChapterCard({ item, subject, color, bg, index, isLastOpened }) {
    const navigate = useNavigate();
    const isIndex  = item.title.toLowerCase() === 'index';

    return (
        <motion.div
            className={`sp-chapter-card${item.completed ? ' sp-chapter-card--completed' : ''}${isLastOpened ? ' sp-chapter-card--last-opened' : ''}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
            style={{ '--accent': color, '--accent-bg': bg }}
        >
            {/* Completion badge */}
            {item.completed && (
                <div className="sp-chapter-card__badge" title="Completed">✅</div>
            )}

            {/* Continue reading indicator */}
            {isLastOpened && !item.completed && (
                <div className="sp-chapter-card__continue-badge" style={{ background: color }}>
                    Continue
                </div>
            )}

            <div className="sp-chapter-card__icon" style={{ background: bg }}>
                {isIndex ? (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="4" y="2" width="20" height="26" rx="3" fill={color} opacity="0.15"/>
                        <rect x="4" y="2" width="20" height="26" rx="3" stroke={color} strokeWidth="1.5"/>
                        <line x1="9" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="9" y1="14" x2="19" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="9" y1="18" x2="15" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="24" cy="24" r="6" fill={color}/>
                        <line x1="22" y1="24" x2="26" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="24" y1="22" x2="24" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                ) : item.completed ? (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="4" y="2" width="20" height="26" rx="3" fill="#16a34a" opacity="0.15"/>
                        <rect x="4" y="2" width="20" height="26" rx="3" stroke="#16a34a" strokeWidth="1.5"/>
                        <polyline points="8,16 12,20 20,11" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                ) : (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="4" y="2" width="20" height="26" rx="3" fill="#94a3b8" opacity="0.13"/>
                        <rect x="4" y="2" width="20" height="26" rx="3" stroke="#94a3b8" strokeWidth="1.5"/>
                        <line x1="9" y1="10" x2="19" y2="10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="9" y1="14" x2="19" y2="14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="9" y1="18" x2="15" y2="18" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                )}
            </div>
            <div className="sp-chapter-card__body">
                <h3 className="sp-chapter-card__title">{item.title}</h3>
                <p className="sp-chapter-card__sub">
                    {item.completed ? 'Completed' : 'PDF Document'}
                </p>
            </div>
            <div className="sp-chapter-card__actions">
                <motion.button
                    className="sp-btn sp-btn--read"
                    style={{ background: color }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/books/${subject}/chapter/${item.id}`, {
                        state: { file: item.file, title: item.title }
                    })}
                >
                    📖 {item.completed ? 'Review' : isLastOpened ? 'Continue' : 'Read'}
                </motion.button>
                <button
                    className="sp-btn sp-btn--dl"
                    onClick={() => downloadChapter(item.file, item.filename)}
                    aria-label={`Download ${item.title}`}
                >
                    ⬇ Download
                </button>
            </div>
        </motion.div>
    );
}

/* ── Progress Ring (small) ── */
function MiniProgressRing({ pct, color, size = 56 }) {
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <motion.circle
                cx={size/2} cy={size/2} r={r}
                fill="none" stroke={color} strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                transform={`rotate(-90 ${size/2} ${size/2})`}
            />
            <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">
                {pct}%
            </text>
        </svg>
    );
}

export default function SubjectPage() {
    const { subject } = useParams();
    const navigate    = useNavigate();
    const dispatch    = useDispatch();
    const meta        = META[subject] || { label: subject, icon: '📚', color: '#6366f1', bg: '#EEF2FF' };
    const user        = useSelector((state) => state.auth.user);

    const goToBooks = () => {
        dispatch(setActiveSection('books'));
        navigate(`/dashboard/${user?.uid}`);
    };

    const [chapters, setChapters] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);
    const [search,   setSearch]   = useState('');

    // ZIP download state
    const [dlState, setDlState] = useState({
        status: 'idle',   // 'idle' | 'building' | 'downloading'
        sizeMB: null,
        cached: null,
    });

    // Pre-fetch ZIP info so size shows on button before click.
    // Mounted guard prevents React StrictMode double-invocation from flooding requests.
    useEffect(() => {
        let mounted = true;
        apiService.getZipInfo(subject)
            .then(({ data }) => {
                if (mounted) setDlState(prev => ({ ...prev, sizeMB: data.size_mb, cached: data.cached }));
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, [subject]);

    const fetchChapters = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiService.getSubjectChapters(subject);
            setChapters(Array.isArray(data) ? data : []);
        } catch (e) {
            const status = e.response?.status;
            const detail = e.response?.data?.detail || '';
            // Treat 404 / "not found" as simply no PDFs uploaded yet
            if (status === 404 || detail.toLowerCase().includes('not found')) {
                setChapters([]);
            } else {
                setError(detail || 'Could not load chapters');
            }
        } finally {
            setLoading(false);
        }
    }, [subject]);

    useEffect(() => { fetchChapters(); }, [fetchChapters]);

    /* ── Log book opening activity ── */
    useEffect(() => {
        if (user?.uid && !loading && chapters.length > 0) {
            dispatch(logActivity({
                user_id: user.uid,
                event_type: 'BOOK_OPENED',
                title: `Opened ${meta.label}`,
                description: `Browsing ${meta.label} chapters`,
                subject: meta.label,
                metadata: {
                    subject_slug: subject,
                    chapter_count: chapters.length
                }
            }));
        }
    }, [user, dispatch, meta.label, subject, chapters.length, loading]);

    /* ── Computed ── */
    // Index/Intro/Annexure/Warm-up are reference material — excluded from chapter count and progress
    const chapterItems   = useMemo(() => chapters.filter(c => !c.is_index), [chapters]);
    const completedCount = useMemo(() => chapterItems.filter(c => c.completed).length, [chapterItems]);
    const totalCount     = chapterItems.length;
    const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const filtered = useMemo(() => {
        if (!search.trim()) return chapters;
        const q = search.toLowerCase();
        return chapters.filter(c => c.title.toLowerCase().includes(q));
    }, [chapters, search]);

    const handleDownloadAll = async () => {
        if (dlState.status !== 'idle') return;  // Prevent double-click
        try {
            // Use pre-fetched dlState — no extra getZipInfo call needed
            const isCached = dlState.cached;
            setDlState(prev => ({ ...prev, status: isCached ? 'downloading' : 'building' }));

            // Download — backend builds ZIP on first call, serves cache on subsequent calls
            const resp = await apiService.downloadAllPdfs(subject);

            // Refresh info once after download to show updated 'Cached' badge
            apiService.getZipInfo(subject)
                .then(({ data }) => setDlState({ status: 'idle', sizeMB: data.size_mb, cached: true }))
                .catch(() => setDlState(prev => ({ ...prev, status: 'idle' })));

            const url  = URL.createObjectURL(resp.data);
            const link = document.createElement('a');
            const niceName = (meta.label || subject).replace(/\s+/g, '_');
            link.href     = url;
            link.download = `${niceName}_Full.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            setDlState(prev => ({ ...prev, status: 'idle' }));
            alert('Download failed. Please try again.');
        }
    };

    return (
        <div className="sp-page">

            {/* ── Top bar ── */}
            <div className="sp-topbar">
                <button className="sp-back-btn" onClick={goToBooks} aria-label="Go back to My Books">
                    ← Back
                </button>
            </div>

            {/* ── Header ── */}
            <motion.div
                className="sp-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="sp-header__icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                </div>
                <div className="sp-header__body">
                    <h1 className="sp-header__title" style={{ color: meta.color }}>{meta.label}</h1>
                    <p className="sp-header__sub">
                        {loading ? 'Loading…' : `${totalCount} Chapter${totalCount !== 1 ? 's' : ''} · Digital Version`}
                    </p>
                    {!loading && totalCount > 0 && (
                        <div className="sp-header__progress">
                            <div className="sp-header__progress-bar" style={{ background: meta.bg }}>
                                <motion.div
                                    className="sp-header__progress-fill"
                                    style={{ background: meta.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="sp-header__progress-text">
                                {completedCount}/{totalCount} chapter{totalCount !== 1 ? 's' : ''} completed
                            </span>
                        </div>
                    )}
                </div>

                {!loading && totalCount > 0 && (
                    <MiniProgressRing pct={progressPct} color={meta.color} />
                )}

                <motion.button
                    className={`sp-dl-all-btn${dlState.status !== 'idle' ? ' sp-dl-all-btn--busy' : ''}`}
                    style={{ background: dlState.status !== 'idle' ? '#64748b' : meta.color }}
                    whileHover={dlState.status === 'idle' ? { scale: 1.04 } : {}}
                    whileTap={dlState.status === 'idle' ? { scale: 0.97 } : {}}
                    onClick={handleDownloadAll}
                    disabled={dlState.status !== 'idle'}
                    title={dlState.sizeMB ? `File size: ~${dlState.sizeMB} MB` : undefined}
                >
                    {dlState.status === 'idle' && (
                        <>
                            ⬇ Download Full Book
                            {dlState.sizeMB != null && (
                                <span className="sp-dl-all-btn__size"> · {dlState.sizeMB} MB</span>
                            )}
                            {dlState.cached === true && (
                                <span className="sp-dl-all-btn__badge sp-dl-all-btn__badge--cached">Cached</span>
                            )}
                        </>
                    )}
                    {dlState.status === 'building' && (
                        <><span className="sp-dl-spinner" /> Building ZIP…</>
                    )}
                    {dlState.status === 'downloading' && (
                        <><span className="sp-dl-spinner" /> Downloading…</>
                    )}
                </motion.button>
            </motion.div>

            {/* ── Search bar ── */}
            {!loading && totalCount > 3 && (
                <div className="sp-search-bar">
                    <span className="sp-search-icon">🔍</span>
                    <input
                        className="sp-search-input"
                        placeholder="Search chapters..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="sp-search-clear" onClick={() => setSearch('')}>×</button>
                    )}
                </div>
            )}

            {/* ── Body ── */}
            {loading && (
                <div className="sp-state">
                    <div className="sp-spinner"></div>
                    <p>Loading chapters…</p>
                </div>
            )}

            {!loading && error && (
                <div className="sp-state sp-state--error">
                    <span>⚠️</span>
                    <p>{error}</p>
                    <button className="sp-retry-btn" onClick={fetchChapters}>Retry</button>
                </div>
            )}

            {!loading && !error && chapters.length === 0 && (
                <div className="sp-state">
                    <span style={{ fontSize: '3rem' }}>📭</span>
                    <p>No PDFs uploaded yet for <strong>{meta.label}</strong>.</p>
                    <p className="sp-state__hint">
                        Place PDF files inside:<br />
                        <code>backend/uploads/{subject}/</code>
                    </p>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && chapters.length > 0 && (
                <div className="sp-state">
                    <span style={{ fontSize: '3rem' }}>🔍</span>
                    <p>No chapters matching "<strong>{search}</strong>"</p>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <motion.div className="sp-grid" layout>
                    <AnimatePresence>
                        {filtered.map((ch, i) => (
                            <ChapterCard
                                key={ch.id}
                                item={ch}
                                subject={subject}
                                color={meta.color}
                                bg={meta.bg}
                                index={i}
                                isLastOpened={ch.isLastOpened}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
