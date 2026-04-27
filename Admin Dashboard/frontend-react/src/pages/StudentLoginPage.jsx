import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const demoStudents = [
  {
    name: 'Aarav Patel',
    studentId: 'STU20240021',
    password: 'Stu@0021',
    className: 'Class 1A',
    accent: '#ff7a59',
    soft: '#ffd9cf',
  },
  {
    name: 'Vivaan Sharma',
    studentId: 'STU20240002',
    password: 'Stu@0002',
    className: 'Class 1A',
    accent: '#2f9e44',
    soft: '#dff4e1',
  },
  {
    name: 'Aditya Verma',
    studentId: 'STU20240003',
    password: 'Stu@0003',
    className: 'Class 1A',
    accent: '#7c3aed',
    soft: '#e8dcff',
  },
];

const loginCards = [
  {
    grade: 1,
    badge: 'Std 1',
    title: 'Open Std 1',
    theme: 'Cartoon Theme',
    description: 'Step into a playful cartoon world filled with cheerful colors and friendly shapes.',
    chips: ['Bright doodles', 'Happy clouds', 'Playful stickers'],
    accent: '#ff7a59',
    soft: '#ffd9cf',
  },
  {
    grade: 2,
    badge: 'Std 2',
    title: 'Open Std 2 login',
    theme: 'Garden Theme',
    description: 'A fresh garden world with leaves, blooms, and soft green light welcomes Std 2.',
    chips: ['Blooming flowers', 'Leaf trails', 'Tiny birds'],
    accent: '#2f9e44',
    soft: '#dff4e1',
  },
  {
    grade: 3,
    badge: 'Std 3',
    title: 'Open Std 3',
    theme: 'Space Theme',
    description: 'Travel through a bright galaxy with stars, planets, and a glowing rocket trail.',
    chips: ['Star trails', 'Friendly planets', 'Rocket sparks'],
    accent: '#7c3aed',
    soft: '#e8dcff',
  },
  {
    grade: 4,
    badge: 'Std 4',
    title: 'Open Std 4 login',
    theme: 'Gold Mining Theme',
    description: 'Step into a gold mining world with warm lantern light and treasure-filled tunnels.',
    chips: ['Lantern glow', 'Gold ore', 'Treasure tunnel'],
    accent: '#d4a017',
    soft: '#fff0bf',
  },
  {
    grade: 5,
    badge: 'Std 5',
    title: 'Open Std 5',
    theme: 'Forest Theme',
    description: 'A calm forest login with trees, moss, and layered greens keeps Std 5 warm and focused.',
    chips: ['Forest canopy', 'Moss path', 'Morning light'],
    accent: '#2d6a4f',
    soft: '#dcefe5',
  },
  {
    grade: 6,
    badge: 'Std 6',
    title: 'Open Std 6',
    theme: 'Water Theme',
    description: 'Blue waves, bubbles, and coral light make Std 6 feel fresh and lively.',
    chips: ['Ocean waves', 'Bubble shine', 'Coral glow'],
    accent: '#0891b2',
    soft: '#cffafe',
  },
];

function getStudentPortalUrl(grade) {
  const port = 3000 + grade;
  return `http://127.0.0.1:${port}`;
}

function getTeacherPortalBaseUrl() {
  return `${window.location.protocol}//${window.location.hostname}:5001`;
}

function formatAnnouncementDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError('');

        const response = await fetch(
          `${getTeacherPortalBaseUrl()}/api/communication/announcements?role=student&limit=6`
        );

        if (!response.ok) {
          throw new Error(`Failed to load announcements (${response.status})`);
        }

        const data = await response.json();
        if (mounted) {
          setAnnouncements(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (error) {
        if (mounted) {
          setAnnouncements([]);
          setAnnouncementsError('Announcements will appear here once teachers post them.');
        }
      } finally {
        if (mounted) {
          setAnnouncementsLoading(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_22%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(37,99,235,0.12)] lg:grid-cols-[1.02fr_0.98fr]">
        <aside className="relative flex flex-col gap-8 overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_55%,#2563eb_100%)] px-8 py-10 text-white sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -top-24 right-[-6rem] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-5rem] left-[-4rem] h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <span className="text-2xl">🎓</span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Student Portal</p>
                <h1 className="text-2xl font-black">Smart School Access</h1>
              </div>
            </div>

            <h2 className="max-w-md text-4xl font-black leading-tight sm:text-5xl">
              A clean login screen for students, built from scratch.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/80 sm:text-base">
              Sign in with the Student ID and password shown in the admin panel.
              Parent Access Key is available for family verification when needed.
            </p>

            <div className="mt-8 grid gap-3">
              {['Attendance', 'Assignments', 'Reports'].map((label) => (
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mb-1 text-sm font-bold">{label}</div>
                  <p className="text-sm leading-6 text-white/75">
                    {label === 'Attendance' && 'Check daily status, remarks, and uniform / I-Card updates.'}
                    {label === 'Assignments' && 'See homework, classwork, and upcoming submission dates.'}
                    {label === 'Reports' && 'Review marks, progress cards, and parent updates in one place.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-auto rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white/90">Demo credentials</p>
            <div className="mt-4 space-y-2">
              {demoStudents.map((student) => (
                <div key={student.studentId} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-white/70">{student.className}</p>
                    </div>
                    <div className="text-right text-xs text-white/75">
                      <p>{student.studentId}</p>
                      <p>{student.password}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex items-start justify-center px-5 py-10 sm:px-10 lg:py-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Student Login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Enter the credentials from the admin side to access the student area.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Student ID</p>
                    <p className="mt-1 font-bold text-slate-900">Enter Student ID</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Class</p>
                    <p className="mt-1 font-bold text-slate-900">Class 1A</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {loginCards.map((card) => (
                      <button
                        key={card.grade}
                        type="button"
                        onClick={() => {
                          window.location.href = getStudentPortalUrl(card.grade);
                        }}
                        className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span className="rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: card.accent }}>
                            {card.badge}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{card.theme}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {card.chips.map((chip) => (
                            <span key={chip} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: card.soft, color: card.accent }}>
                              {chip}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-blue-500">School Updates</p>
                      <h3 className="mt-1 text-xl font-black text-slate-900">Latest Announcements</h3>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      Student portal
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {announcementsLoading && (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Loading announcements...
                      </div>
                    )}

                    {!announcementsLoading && announcements.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        {announcementsError || 'No student announcements yet.'}
                      </div>
                    )}

                    {!announcementsLoading && announcements.map((announcement) => (
                      <div key={announcement.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-black text-slate-900">{announcement.title}</h4>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{announcement.content}</p>
                          </div>
                          <span className="rounded-full px-3 py-1 text-xs font-bold capitalize text-white"
                            style={{
                              background:
                                announcement.priority === 'urgent'
                                  ? '#dc2626'
                                  : announcement.priority === 'high'
                                    ? '#f97316'
                                    : announcement.priority === 'medium'
                                      ? '#2563eb'
                                      : '#22c55e',
                            }}
                          >
                            {announcement.priority || 'medium'}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                          <span>By {announcement.author || 'Teacher'}</span>
                          <span>{formatAnnouncementDate(announcement.date || announcement.createdAt)}</span>
                          <span>
                            For {' '}
                            {announcement.recipientRole === 'all'
                              ? 'All Students'
                              : announcement.recipientRole === 'parent'
                                ? 'Parents'
                                : announcement.recipientRole === 'teacher'
                                  ? 'Teachers'
                                  : 'Students'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  Back to Admin Login
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
