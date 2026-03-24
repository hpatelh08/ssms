import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import './Books.css';

/* ── Subject metadata ─────────────────────────────────────── */
const BOOKS_META = [
    {
        id: 1, title: 'Mathematics', slug: 'Std_8_math', subject: 'Math',
        icon: '📐', iconBg: '#EFF6FF', iconColor: '#2563EB',
        badgeColor: '#2563EB', badgeBg: '#EFF6FF',
    },
    {
        id: 2, title: 'English Literature', slug: 'Std_8_eng', subject: 'English',
        icon: '📖', iconBg: '#F0FDF4', iconColor: '#16A34A',
        badgeColor: '#15803D', badgeBg: '#DCFCE7',
    },
    {
        id: 3, title: 'Hindi', slug: 'Std_8_hindi', subject: 'Hindi',
        icon: 'अ', iconBg: '#FFF1F2', iconColor: '#BE123C',
        badgeColor: '#BE123C', badgeBg: '#FFE4E6',
    },
    {
        id: 4, title: 'Science', slug: 'Std_8_science', subject: 'Science',
        icon: '🔬', iconBg: '#F0FDFA', iconColor: '#0F766E',
        badgeColor: '#0F766E', badgeBg: '#CCFBF1',
    },
    {
        id: 5, title: 'Fine Arts', slug: 'Std_8_arts', subject: 'Arts',
        icon: '🎨', iconBg: '#FAF5FF', iconColor: '#7E22CE',
        badgeColor: '#7E22CE', badgeBg: '#F3E8FF',
    },
    {
        id: 6, title: 'Social Science', slug: 'Std_8_social', subject: 'Social Sc.',
        icon: '🌍', iconBg: '#FFF7ED', iconColor: '#C2410C',
        badgeColor: '#C2410C', badgeBg: '#FFEDD5',
    },
    {
        id: 7, title: 'Sanskrit', slug: 'Std_8_sanskrit', subject: 'Sanskrit',
        icon: 'स', iconBg: '#FDF2F8', iconColor: '#9D174D',
        badgeColor: '#9D174D', badgeBg: '#FCE7F3',
    },
    {
        id: 8, title: 'Physical Education', slug: 'Std_8_physed', subject: 'Phy. Ed.',
        icon: '🏃', iconBg: '#F7FEE7', iconColor: '#4D7C0F',
        badgeColor: '#4D7C0F', badgeBg: '#ECFCCB',
    },
    {
        id: 9, title: 'Vocational Education', slug: 'Std_8_voced', subject: 'Voc. Ed.',
        icon: '🛠️', iconBg: '#EEF2FF', iconColor: '#3730A3',
        badgeColor: '#3730A3', badgeBg: '#E0E7FF',
    },
];

const FILTERS = ['All Books', 'Recently Opened', 'Completed', 'Favorites', 'Pending'];

/* ── Circular SVG Progress Ring ─────────────────────────── */
function CircleRing({ pct }) {
    const r = 32, circ = 2 * Math.PI * r;
    return (
        <svg width="84" height="84" viewBox="0 0 84 84">
            <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
            </defs>
            <circle cx="42" cy="42" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <motion.circle
                cx="42" cy="42" r={r}
                fill="none" stroke="url(#ringGrad)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                transform="rotate(-90 42 42)"
            />
            <text x="42" y="47" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
                {pct}%
            </text>
        </svg>
    );
}

/* ── Subject KPI Card (per-subject strip) ────────────────── */
function SubjectKpiCard({ book }) {
    const navigate = useNavigate();
    const { title, icon, iconBg, iconColor, badgeColor, progress, chapters, completedCount } = book;
    const status   = progress === 100 ? 'Done' : progress > 0 ? 'In Progress' : 'Not Started';
    const statusBg = progress === 100 ? '#dcfce7' : progress > 0 ? '#eff6ff' : '#f1f5f9';
    const statusCl = progress === 100 ? '#15803d' : progress > 0 ? '#2563eb'  : '#94a3b8';
    return (
        <motion.div
            className="sk-card"
            whileHover={{ y: -4, boxShadow: '0 14px 32px rgba(0,0,0,0.11)' }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate(`/books/${book.slug}`)}
            style={{ cursor: 'pointer' }}
            title={title}
        >
            <div className="sk-card__icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
            <div className="sk-card__title">{title}</div>
            <div className="sk-card__bar-wrap">
                <motion.div
                    className="sk-card__bar"
                    style={{ background: iconColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            <div className="sk-card__pct" style={{ color: iconColor }}>{progress}%</div>
            <div className="sk-card__chapters">{completedCount} / {chapters} ch</div>
            <span className="sk-card__status" style={{ color: statusCl, background: statusBg }}>{status}</span>
        </motion.div>
    );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon, iconBg, label, value, sub, ring, pct }) {
    return (
        <motion.div
            className="sc-kpi"
            whileHover={{ scale: 1.04, boxShadow: '0 16px 36px rgba(0,0,0,0.11)' }}
            transition={{ duration: 0.22 }}
        >
            {ring ? (
                <>
                    <div className="sc-kpi__label">{label}</div>
                    <CircleRing pct={pct} />
                </>
            ) : (
                <>
                    <div className="sc-kpi__icon" style={{ background: iconBg }}>{icon}</div>
                    <div className="sc-kpi__label">{label}</div>
                    <div className="sc-kpi__val">{value}</div>
                    {sub && <div className="sc-kpi__sub">{sub}</div>}
                </>
            )}
        </motion.div>
    );
}

/* ── Subject Card ─────────────────────────────────────────── */
function SubjectCard({ book, isFav, onFavToggle }) {
    const navigate = useNavigate();

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const resp = await apiService.downloadAllPdfs(book.slug);
            const url  = URL.createObjectURL(resp.data);
            const link = document.createElement('a');
            link.href     = url;
            link.download = `${book.title.replace(/\s+/g, '_')}_Full.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            alert('No PDFs available for download yet.');
        }
    };
    const {
        id, title, icon, iconBg, iconColor,
        badgeColor, badgeBg,
        progress, chapters, lastOpened,
    } = book;

    const btnLabel =
        chapters === 0   ? 'Explore' :
        progress === 100 ? 'Review' :
        progress > 0     ? 'Continue' :
                           'Start Learning';

    const subtitle = chapters === 0
        ? 'Coming Soon'
        : lastOpened
            ? `${chapters} Chapters • Last opened ${lastOpened}`
            : `${chapters} Chapters`;
    return (
        <motion.div
            className="sc-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.13)' }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate(`/books/${book.slug}`)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`Open ${title} subject page`}
        >
            {/* Icon circle */}
            <div
                className="sc-card__icon-circle"
                style={{ background: iconBg, color: iconColor }}
            >
                {icon}
            </div>

            {/* Title */}
            <h3 className="sc-card__title">{title}</h3>

            {/* Subtitle */}
            <p className="sc-card__subtitle">{subtitle}</p>

            {/* Completion / status badge */}
            <span
                className="sc-card__badge"
                style={chapters === 0
                    ? { color: '#92400e', background: '#fef3c7' }
                    : { color: badgeColor, background: badgeBg }
                }
                aria-label={chapters === 0 ? 'Coming soon' : `${progress}% completed`}
            >
                {chapters === 0 ? '🔒 Coming Soon' : `${progress}% Completed`}
            </span>

            {/* Actions */}
            <div className="sc-card__actions">
                {/* Heart */}
                <button
                    className={`sc-card__icon-btn${isFav ? ' sc-card__icon-btn--fav' : ''}`}
                    onClick={e => { e.stopPropagation(); onFavToggle(id); }}
                    aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                >
                    {isFav ? '❤️' : '🤍'}
                </button>

                {/* CTA */}
                <motion.button
                    className="sc-card__cta"
                    style={{ background: iconColor }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/books/${book.slug}`)}
                    aria-label={`${btnLabel} ${title}`}
                >
                    {btnLabel}
                </motion.button>

                {/* Download */}
                <button
                    className="sc-card__icon-btn"
                    onClick={handleDownload}
                    aria-label={`Download ${title}`}
                    title={`Download all PDFs for ${title}`}
                >
                    ⬇️
                </button>
            </div>
        </motion.div>
    );
}

/* ── Main Component ───────────────────────────────────────── */
export default function Books() {
    const navigate  = useNavigate();
    const user      = useSelector((state) => state.auth.user);
    const [filter,    setFilter]    = useState('All Books');
    const [search,    setSearch]    = useState('');
    const [favorites, setFavorites] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('bookFavorites') || '[]')); }
        catch { return new Set(); }
    });
    const [apiSubjects, setApiSubjects] = useState([]);  // from /api/books
    const [loadingApi, setLoadingApi]   = useState(true);

    /* ── Fetch real data from API ── */
    const fetchSubjects = useCallback(async () => {
        setLoadingApi(true);
        try {
            const { data } = await apiService.getAllSubjects();
            setApiSubjects(data);
        } catch {
            // Fallback: no API data, use metadata only
        } finally {
            setLoadingApi(false);
        }
    }, []);

    useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

    /* ── Merge API data into metadata ── */
    const BOOKS = useMemo(() => {
        return BOOKS_META.map(meta => {
            const api = apiSubjects.find(s => s.slug === meta.slug);
            const chapters = api?.count || 0;
            const completedCount = api?.completedCount || 0;
            const progress = chapters > 0 ? Math.round((completedCount / chapters) * 100) : 0;
            const lastOpenedAt = api?.lastOpenedAt || null;

            // Format last opened as relative time
            let lastOpened = null;
            if (progress === 100) {
                lastOpened = 'Completed';
            } else if (lastOpenedAt) {
                const diff = Date.now() - new Date(lastOpenedAt).getTime();
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (hours < 1) lastOpened = 'just now';
                else if (hours < 24) lastOpened = `${hours}h ago`;
                else if (days === 1) lastOpened = 'yesterday';
                else if (days < 7) lastOpened = `${days} days ago`;
                else lastOpened = `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
            }

            return {
                ...meta,
                chapters,
                completedCount,
                progress,
                lastOpened,
            };
        }); // Always show all 9 subjects regardless of whether PDFs are uploaded
    }, [apiSubjects]);

    // KPI totals — always based on all 9 subjects
    const totalCompleted = useMemo(() => BOOKS.filter(b => b.progress === 100).length, [BOOKS]);
    const avgProgress    = useMemo(() => {
        const withChapters = BOOKS.filter(b => b.chapters > 0);
        return withChapters.length > 0
            ? Math.round(withChapters.reduce((s, b) => s + b.progress, 0) / withChapters.length)
            : 0;
    }, [BOOKS]);
    const chaptersRead   = useMemo(() => BOOKS.reduce((s, b) => s + (b.completedCount || 0), 0), [BOOKS]);
    const totalChapters  = useMemo(() => BOOKS.reduce((s, b) => s + (b.chapters || 0), 0), [BOOKS]);

    const visible = useMemo(() => {
        const q = search.toLowerCase();
        return BOOKS.filter(b => {
            const matchSearch = !q || b.title.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q);
            if (!matchSearch) return false;
            switch (filter) {
                case 'Completed':       return b.progress === 100;
                case 'Favorites':       return favorites.has(b.id);
                case 'Pending':         return b.progress === 0;
                case 'Recently Opened': return b.lastOpened !== null && b.progress < 100;
                default:                return true;
            }
        });
    }, [filter, search, favorites, BOOKS]);

    const toggleFav = id => setFavorites(prev => {
        const s = new Set(prev);
        s.has(id) ? s.delete(id) : s.add(id);
        localStorage.setItem('bookFavorites', JSON.stringify([...s]));
        return s;
    });

    return (
        <div className="sc-wrapper">

            {/* ── KPI Row ── */}
            <div className="sc-kpi-row">
                <KpiCard icon="📚" iconBg="#EFF6FF" label="Total Books"     value={BOOKS_META.length} />
                <KpiCard icon="✅" iconBg="#F0FDF4" label="Completed"       value={totalCompleted} />
                <KpiCard ring pct={avgProgress}     label="Overall Progress" value={`${avgProgress}%`} />
                <KpiCard icon="📖" iconBg="#F5F3FF" label="Chapters Read"   value={chaptersRead} sub={`of ${totalChapters}`} />
            </div>

            {/* ── Toolbar ── */}
            <div className="sc-toolbar">
                <div className="sc-search-wrap">
                    <span className="sc-search-icon">🔍</span>
                    <input
                        className="sc-search"
                        placeholder="Search subjects..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search subjects"
                    />
                    {search && (
                        <button className="sc-search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
                    )}
                </div>
                <div className="sc-filters" role="tablist" aria-label="Filter books">
                    {FILTERS.map(f => (
                        <motion.button
                            key={f}
                            role="tab"
                            aria-selected={filter === f}
                            className={`sc-filter${filter === f ? ' sc-filter--active' : ''}`}
                            onClick={() => setFilter(f)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {f}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* ── Grid ── */}
            {visible.length === 0 ? (
                <div className="sc-empty">
                    <span>📭</span>
                    <p>No books found{search ? ` for "${search}"` : ` in "${filter}"`}</p>
                </div>
            ) : (
                <motion.div className="sc-grid" layout>
                    <AnimatePresence mode="popLayout">
                        {visible.map((book, i) => (
                            <motion.div
                                key={book.id}
                                layout
                                transition={{ duration: 0.22, delay: i * 0.045 }}
                            >
                                <SubjectCard
                                    book={book}
                                    isFav={favorites.has(book.id)}
                                    onFavToggle={toggleFav}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
