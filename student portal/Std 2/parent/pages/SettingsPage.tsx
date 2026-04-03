/**
 * parent/pages/SettingsPage.tsx
 * ─────────────────────────────────────────────────────
 * Parent settings: playtime limit, sound, reset progress.
 * Upgraded UI with glassmorphic cards and premium styling.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../child/SoundProvider';
import { useGlobalPlayTimer } from '../../child/GlobalPlayTimerProvider';
import { useAuth } from '../../auth/AuthContext';

const CLR = {
  primary: '#3B3FAF',
  secondary: '#6B6FCF',
  muted: '#8F94D4',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

/* ── Toggle Switch ── */

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      position: 'relative', width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
      background: on ? 'linear-gradient(135deg, #10B981, #34D399)' : '#CBD5E1',
      boxShadow: on ? '0 2px 8px rgba(16,185,129,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
      transition: 'background 0.2s',
    }}
  >
    <motion.div
      style={{
        position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
        background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      }}
      animate={{ left: on ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
);

/* ── Setting Row ── */

const SettingRow: React.FC<{
  icon: string; title: string; description: string;
  right: React.ReactNode;
}> = ({ icon, title, description, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.05))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: CLR.primary, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '2px 0 0 0' }}>{description}</p>
      </div>
    </div>
    <div>{right}</div>
  </div>
);

/* ── Glass Card Wrapper ── */
const SettingsCard: React.FC<{ children: React.ReactNode; delay?: number; gradient?: string }> = ({ children, delay = 0, gradient }) => (
  <motion.div
    style={{
      background: gradient || 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 18, padding: 24,
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 2px 16px rgba(92,106,196,0.06), 0 1px 3px rgba(92,106,196,0.03)',
    }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay }}
    whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(92,106,196,0.09)' }}
  >
    {children}
  </motion.div>
);

/* ── Main Component ── */

export const SettingsPage: React.FC = () => {
  const { muted, toggleMute } = useSound();
  const { user } = useAuth();
  const {
    limitEnabled,
    limitMinutes,
    running,
    pendingLimitMinutes,
    setPlaytimeLimit,
  } = useGlobalPlayTimer();

  const [playtimeLimitDraft, setPlaytimeLimitDraft] = useState<number>(limitMinutes);
  const [playtimeEnabledDraft, setPlaytimeEnabledDraft] = useState<boolean>(limitEnabled);
  const [playtimeSaveNote, setPlaytimeSaveNote] = useState('');

  const settingsKey = `ssms_parent_settings_std_${user.grade}`;
  const [parentName, setParentName] = useState(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return user.name || 'Parent';
      const parsed = JSON.parse(saved) as { parentName?: string };
      return parsed.parentName || user.name || 'Parent';
    } catch { return user.name || 'Parent'; }
  });
  const [phone, setPhone] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return ''; return (JSON.parse(s) as { phone?: string }).phone || ''; } catch { return ''; }
  });
  const [email, setEmail] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return ''; return (JSON.parse(s) as { email?: string }).email || ''; } catch { return ''; }
  });
  const [address, setAddress] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return ''; return (JSON.parse(s) as { address?: string }).address || ''; } catch { return ''; }
  });
  const [emergencyContact, setEmergencyContact] = useState(() => {
    try {
      const s = localStorage.getItem(settingsKey);
      if (!s) return phone;
      return (JSON.parse(s) as { emergencyContact?: string }).emergencyContact || phone;
    } catch { return phone; }
  });
  const [oldParentAccessKey, setOldParentAccessKey] = useState('');
  const [parentAccessKey, setParentAccessKey] = useState(() => {
    try { return localStorage.getItem('ssms_parent_access_key') || '2025'; } catch { return '2025'; }
  });
  const [showCurrentAccessKey, setShowCurrentAccessKey] = useState(false);
  const [showNewAccessKey, setShowNewAccessKey] = useState(false);
  const [dailySummary, setDailySummary] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return true; return (JSON.parse(s) as { dailySummary?: boolean }).dailySummary ?? true; } catch { return true; }
  });
  const [weeklyReport, setWeeklyReport] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return true; return (JSON.parse(s) as { weeklyReport?: boolean }).weeklyReport ?? true; } catch { return true; }
  });
  const [smsAlerts, setSmsAlerts] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return false; return (JSON.parse(s) as { smsAlerts?: boolean }).smsAlerts ?? false; } catch { return false; }
  });
  const [allowGames, setAllowGames] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return true; return (JSON.parse(s) as { allowGames?: boolean }).allowGames ?? true; } catch { return true; }
  });
  const [allowAiBuddy, setAllowAiBuddy] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return true; return (JSON.parse(s) as { allowAiBuddy?: boolean }).allowAiBuddy ?? true; } catch { return true; }
  });
  const [allowExtendedPlay, setAllowExtendedPlay] = useState(() => {
    try { const s = localStorage.getItem(settingsKey); if (!s) return false; return (JSON.parse(s) as { allowExtendedPlay?: boolean }).allowExtendedPlay ?? false; } catch { return false; }
  });
  const [saveFeedback, setSaveFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setPlaytimeLimitDraft(limitMinutes);
    setPlaytimeEnabledDraft(limitEnabled);
  }, [limitMinutes, limitEnabled]);

  const playtimeChanged = useMemo(
    () => playtimeLimitDraft !== limitMinutes || playtimeEnabledDraft !== limitEnabled,
    [playtimeLimitDraft, limitMinutes, playtimeEnabledDraft, limitEnabled],
  );

  const handlePlaytimeToggle = useCallback(() => {
    setPlaytimeEnabledDraft(prev => !prev);
    setPlaytimeSaveNote('');
  }, []);

  const handlePlaytimeChange = useCallback((mins: number) => {
    setPlaytimeLimitDraft(mins);
    setPlaytimeSaveNote('');
  }, []);

  const handleSavePlaytime = useCallback(() => {
    setPlaytimeLimit(playtimeLimitDraft, playtimeEnabledDraft);

    if (!playtimeEnabledDraft) {
      setPlaytimeSaveNote('Playtime limit disabled. Timer is paused.');
      return;
    }

    if (running && playtimeLimitDraft !== limitMinutes) {
      setPlaytimeSaveNote('Saved. New limit will apply on the next timer reset.');
      return;
    }

    setPlaytimeSaveNote('Saved. New limit applied immediately.');
  }, [setPlaytimeLimit, playtimeLimitDraft, playtimeEnabledDraft, running, limitMinutes]);

  const handleSaveParentSettings = useCallback(() => {
    if (!parentName.trim() || !phone.trim() || !email.trim() || !address.trim() || !parentAccessKey.trim()) {
      setSaveFeedback({ tone: 'error', message: 'Please fill all required parent fields.' });
      return;
    }
    const currentKey = (() => {
      try { return localStorage.getItem('ssms_parent_access_key') || '2025'; } catch { return '2025'; }
    })();
    const keyChanged = parentAccessKey.trim() !== currentKey;
    if (keyChanged && oldParentAccessKey.trim() !== currentKey) {
      setSaveFeedback({ tone: 'error', message: 'Enter current access key to change it.' });
      return;
    }
    try {
      localStorage.setItem(settingsKey, JSON.stringify({
        parentName: parentName.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), emergencyContact: emergencyContact.trim(),
        dailySummary, weeklyReport, smsAlerts, allowGames, allowAiBuddy, allowExtendedPlay,
      }));
      localStorage.setItem('ssms_parent_access_key', parentAccessKey.trim());
      setSaveFeedback({ tone: 'success', message: keyChanged ? 'Saved. New access key is active.' : 'Parent settings saved.' });
      setOldParentAccessKey('');
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch {
      setSaveFeedback({ tone: 'error', message: 'Unable to save settings on this device.' });
    }
  }, [address, allowAiBuddy, allowExtendedPlay, allowGames, dailySummary, email, emergencyContact, oldParentAccessKey, parentAccessKey, parentName, phone, settingsKey, smsAlerts, weeklyReport]);

  /* Reset confirmation */
  const [showReset, setShowReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = useCallback(() => {
    const keys = [
      'child_xp_state', 'ssms_stats_v2', 'ssms_audit_log',
      'ssms_homework', 'ssms_tree_state', 'arcade_game_stars',
      'ssms_garden_log',
    ];
    keys.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    setResetDone(true);
    setShowReset(false);
    setTimeout(() => setResetDone(false), 3000);
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: CLR.primary, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, fontWeight: 500, color: CLR.muted, marginTop: 4 }}>Manage preferences and parental controls</p>
      </motion.div>

      <SettingsCard delay={0.03}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: CLR.primary, margin: 0 }}>Guardian Details and Access</h3>
            <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '2px 0 0 0' }}>Update parent profile and secure parent access key.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Parent name" style={{ borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 12px' }} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={{ borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 12px' }} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 12px' }} />
          <input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Emergency contact" style={{ borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 12px' }} />
          <div style={{ position: 'relative' }}>
            <input value={oldParentAccessKey} onChange={e => setOldParentAccessKey(e.target.value)} placeholder="Current access key" type={showCurrentAccessKey ? 'text' : 'password'} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 42px 10px 12px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowCurrentAccessKey(v => !v)} aria-label={showCurrentAccessKey ? 'Hide key' : 'Show key'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
              {showCurrentAccessKey ? '🙈' : '👁️'}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input value={parentAccessKey} onChange={e => setParentAccessKey(e.target.value)} placeholder="New access key" type={showNewAccessKey ? 'text' : 'password'} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 42px 10px 12px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowNewAccessKey(v => !v)} aria-label={showNewAccessKey ? 'Hide key' : 'Show key'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
              {showNewAccessKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" rows={3} style={{ width: '100%', marginTop: 10, borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', padding: '10px 12px' }} />
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: CLR.secondary, margin: '0 0 8px 0' }}>Notification Preferences</p>
            <SettingRow icon="📅" title="Daily Summary" description="Daily learning summary" right={<Toggle on={dailySummary} onToggle={() => setDailySummary(v => !v)} />} />
            <SettingRow icon="📈" title="Weekly Report" description="Weekly progress digest" right={<Toggle on={weeklyReport} onToggle={() => setWeeklyReport(v => !v)} />} />
            <SettingRow icon="📱" title="SMS Alerts" description="Urgent alerts by SMS" right={<Toggle on={smsAlerts} onToggle={() => setSmsAlerts(v => !v)} />} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: CLR.secondary, margin: '0 0 8px 0' }}>Child Permissions</p>
            <SettingRow icon="🎮" title="Allow Learning Games" description="Enable student games" right={<Toggle on={allowGames} onToggle={() => setAllowGames(v => !v)} />} />
            <SettingRow icon="🧠" title="Allow AI Buddy" description="Enable AI help tools" right={<Toggle on={allowAiBuddy} onToggle={() => setAllowAiBuddy(v => !v)} />} />
            <SettingRow icon="⏳" title="Extended Play Window" description="Allow extra play window" right={<Toggle on={allowExtendedPlay} onToggle={() => setAllowExtendedPlay(v => !v)} />} />
          </div>
        </div>
        {saveFeedback && (
          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: saveFeedback.tone === 'success' ? '#059669' : '#DC2626', background: saveFeedback.tone === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
            {saveFeedback.message}
          </div>
        )}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <motion.button onClick={handleSaveParentSettings} type="button" style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 10, color: '#fff', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', cursor: 'pointer' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            Save Parent Settings
          </motion.button>
        </div>
      </SettingsCard>

      {/* Sound Settings */}
      <SettingsCard delay={0.05}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🔊</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: CLR.primary, margin: 0 }}>Sound</h3>
            <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '2px 0 0 0' }}>Control audio feedback for the student dashboard.</p>
          </div>
        </div>
        <SettingRow
          icon="🔇"
          title="Mute All Sounds"
          description={muted ? 'Sounds are currently OFF' : 'Sounds are currently ON'}
          right={<Toggle on={muted} onToggle={toggleMute} />}
        />
      </SettingsCard>

      {/* Playtime Limit */}
      <SettingsCard delay={0.1}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>⏱️</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: CLR.primary, margin: 0 }}>Playtime Limit</h3>
            <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '2px 0 0 0' }}>Set a daily time limit for your child's session.</p>
          </div>
        </div>
        <SettingRow
          icon="⏰"
          title="Enable Playtime Limit"
          description={playtimeEnabledDraft ? `Active — ${playtimeLimitDraft} min/day` : 'Currently disabled'}
          right={<Toggle on={playtimeEnabledDraft} onToggle={handlePlaytimeToggle} />}
        />

        <AnimatePresence>
          {playtimeEnabledDraft && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(99,102,241,0.08)', marginTop: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: CLR.secondary, display: 'block', marginBottom: 10 }}>
                  Daily limit: <span style={{ color: '#10B981' }}>{playtimeLimitDraft} minutes</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={playtimeLimitDraft}
                  onChange={e => handlePlaytimeChange(Number(e.target.value))}
                  style={{
                    width: '100%', height: 6, borderRadius: 3, appearance: 'none' as const, cursor: 'pointer',
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((playtimeLimitDraft - 10) / 110) * 100}%, #e2e8f0 ${((playtimeLimitDraft - 10) / 110) * 100}%, #e2e8f0 100%)`,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>10 min</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>60 min</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>120 min</span>
                </div>

                {pendingLimitMinutes !== null && running && (
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e', margin: '10px 0 0' }}>
                    Pending next session: {pendingLimitMinutes} minutes
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 12, flexWrap: 'wrap' }}>
          <motion.button
            onClick={handleSavePlaytime}
            disabled={!playtimeChanged}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 10,
              border: 'none',
              color: '#fff',
              cursor: playtimeChanged ? 'pointer' : 'not-allowed',
              opacity: playtimeChanged ? 1 : 0.55,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            }}
            whileHover={playtimeChanged ? { scale: 1.03 } : {}}
            whileTap={playtimeChanged ? { scale: 0.96 } : {}}
          >
            Save Playtime Setting
          </motion.button>

          {playtimeSaveNote && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
              {playtimeSaveNote}
            </span>
          )}
        </div>
      </SettingsCard>

      {/* Data & Reset */}
      <SettingsCard delay={0.15}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🗄️</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: CLR.primary, margin: 0 }}>Data Management</h3>
            <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '2px 0 0 0' }}>Manage your child's learning data stored on this device.</p>
          </div>
        </div>

        <SettingRow
          icon="📊"
          title="Local Storage"
          description="All data is stored locally on this device"
          right={
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#10B981',
              background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: 8,
            }}>Private</span>
          }
        />

        <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)', paddingTop: 12, marginTop: 8 }}>
          <SettingRow
            icon="🗑️"
            title="Reset All Progress"
            description="Clears XP, stats, tree, homework, and game data"
            right={
              <motion.button
                onClick={() => setShowReset(true)}
                style={{
                  padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 10,
                  color: '#DC2626', background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer',
                }}
                whileHover={{ background: 'rgba(239,68,68,0.12)' }}
                whileTap={{ scale: 0.96 }}
              >
                Reset
              </motion.button>
            }
          />
        </div>

        {/* Reset confirmation */}
        <AnimatePresence>
          {showReset && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                marginTop: 14, padding: 16, borderRadius: 14,
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', margin: '0 0 10px 0' }}>
                ⚠️ Are you sure? This will permanently delete all progress.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  onClick={handleReset}
                  style={{
                    padding: '6px 16px', fontSize: 11, fontWeight: 700, borderRadius: 10,
                    color: '#fff', background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.20)',
                  }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                >
                  Yes, Reset Everything
                </motion.button>
                <motion.button
                  onClick={() => setShowReset(false)}
                  style={{
                    padding: '6px 16px', fontSize: 11, fontWeight: 700, borderRadius: 10,
                    color: CLR.secondary, background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(226,232,240,0.5)', cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success toast */}
        <AnimatePresence>
          {resetDone && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: 14, padding: 12, borderRadius: 14,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                fontSize: 12, fontWeight: 700, color: '#059669', textAlign: 'center',
              }}
            >
              ✅ All progress has been reset. Refresh the student dashboard to start fresh.
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      {/* About section */}
      <SettingsCard delay={0.2} gradient="linear-gradient(135deg, rgba(248,250,252,0.8), rgba(219,234,254,0.3))">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: CLR.primary, margin: 0 }}>About</h3>
        </div>
        <div style={{ fontSize: 12, color: CLR.secondary, lineHeight: '20px' }}>
          <p style={{ margin: '0 0 6px 0' }}><strong>Student Smart Management System</strong> — Std 2 Edition</p>
          <p style={{ margin: '0 0 6px 0' }}>A gamified learning platform for young students with parental oversight.</p>
          <p style={{ fontSize: 10, color: CLR.muted, margin: '8px 0 0 0' }}>All data is stored locally. No network or cloud services used.</p>
        </div>
      </SettingsCard>
    </div>
  );
};

export default SettingsPage;
