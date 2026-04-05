import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { INITIAL_MESSAGES } from '../constants';

type MenuTab = 'messages' | 'announcements';

const ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'PTM update',
    text: 'Parent-teacher meeting is scheduled for this week. Please check your notes.',
    date: 'Today',
  },
  {
    id: 'a2',
    title: 'Homework reminder',
    text: 'Complete the math practice and reading assignment before Friday.',
    date: 'Tomorrow',
  },
  {
    id: 'a3',
    title: 'School notice',
    text: 'Wear your school uniform for the upcoming activity day.',
    date: 'This week',
  },
];

interface PortalMenuProps {
  compact?: boolean;
}

const PortalMenu: React.FC<PortalMenuProps> = ({ compact = false }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MenuTab>('messages');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const initials = useMemo(() => user.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'S4', [user.name]);

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-center rounded-full"
        style={{
          width: compact ? 42 : 44,
          height: compact ? 42 : 44,
          background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
          color: '#fff',
          boxShadow: '0 12px 26px rgba(79,70,229,0.18)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open messages menu"
      >
        <span className="text-[11px] font-black">{initials}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-14 z-50 w-[320px] overflow-hidden rounded-[28px]"
            style={{
              background: 'rgba(255,255,255,0.97)',
              border: '1px solid rgba(148,163,184,0.2)',
              boxShadow: '0 24px 60px rgba(15,23,42,0.14)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-white px-5 py-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-500">
                Student Menu
              </div>
              <div className="mt-2 text-[18px] font-black text-slate-900">{user.name}</div>
              <div className="mt-1 text-[12px] font-semibold text-slate-500">
                {user.role} · Std {user.grade} · {user.username}
              </div>
            </div>

              <div className="flex gap-2 px-4 pt-4">
              {[
                { id: 'messages', label: 'Messages' },
                { id: 'announcements', label: 'Announcements' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as MenuTab)}
                  className="flex-1 rounded-2xl px-3 py-2 text-[12px] font-extrabold transition-all"
                  style={{
                    background: tab === item.id ? 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' : '#f8fafc',
                    color: tab === item.id ? '#fff' : '#475569',
                    boxShadow: tab === item.id ? '0 10px 22px rgba(79,70,229,0.18)' : 'none',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="max-h-[320px] overflow-y-auto px-4 py-4">
              {tab === 'messages' && (
                <div className="space-y-3">
                  {INITIAL_MESSAGES.map(message => (
                    <div key={message.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-extrabold text-indigo-700">{message.sender}</div>
                          <div className="mt-1 text-[13px] font-semibold text-slate-700">{message.text}</div>
                        </div>
                        <div className="shrink-0 text-[10px] font-bold text-slate-400">{message.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'announcements' && (
                <div className="space-y-3">
                  {ANNOUNCEMENTS.map(item => (
                    <div key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-extrabold text-amber-700">{item.title}</div>
                          <div className="mt-1 text-[13px] font-semibold text-slate-700">{item.text}</div>
                        </div>
                        <div className="shrink-0 text-[10px] font-bold text-slate-400">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-4">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-[13px] font-extrabold text-white transition-transform hover:scale-[1.01]"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortalMenu;
