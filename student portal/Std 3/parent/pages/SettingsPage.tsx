import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../child/SoundProvider';
import { useAuth } from '../../auth/AuthContext';
import { playtimeManager } from '../../services/playtimeManager';

const CLR = {
  primary: '#E2E8F0',
  secondary: '#CBD5E1',
  muted: '#94A3B8',
  border: 'rgba(148,163,184,0.22)',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };
const ICON_STYLE: React.CSSProperties = { fontSize: 18, lineHeight: 1 };
const PANEL_BASE = 'linear-gradient(180deg, rgba(7,12,28,0.9) 0%, rgba(15,23,42,0.8) 100%)';
const SUBPANEL_BASE = 'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.74) 100%)';
const PANEL_BORDER = 'rgba(148,163,184,0.16)';
const PANEL_SHADOW = '0 18px 48px rgba(2,6,23,0.26)';
const panelBackground = (overlay?: string) => (overlay ? `${overlay}, ${PANEL_BASE}` : PANEL_BASE);
const subPanelBackground = (overlay?: string) => (overlay ? `${overlay}, ${SUBPANEL_BASE}` : SUBPANEL_BASE);

const PARENT_SETTINGS_STORAGE_KEY = 'ssms_parent_settings_v1';

interface NotificationPreferences {
  dailySummary: boolean;
  weeklyReport: boolean;
  smsAlerts: boolean;
}

interface PermissionSettings {
  allowGames: boolean;
  allowAiBuddy: boolean;
  allowExtendedPlay: boolean;
}

interface ParentSettingsExtras {
  email: string;
  emergencyContact: string;
  notifications: NotificationPreferences;
  permissions: PermissionSettings;
}

interface ParentFormState {
  parentName: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  oldParentAccessKey: string;
  parentAccessKey: string;
}

interface SaveFeedback {
  tone: 'success' | 'error';
  message: string;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  dailySummary: true,
  weeklyReport: true,
  smsAlerts: false,
};

const DEFAULT_PERMISSIONS: PermissionSettings = {
  allowGames: true,
  allowAiBuddy: true,
  allowExtendedPlay: false,
};

function buildSettingsStorageKey(studentId: string): string {
  return `${PARENT_SETTINGS_STORAGE_KEY}:${studentId.toUpperCase()}`;
}

function buildDefaultEmail(studentId: string): string {
  return `${studentId.toLowerCase()}@family.local`;
}

function loadParentSettingsExtras(studentId: string): ParentSettingsExtras | null {
  try {
    const raw = localStorage.getItem(buildSettingsStorageKey(studentId));
    if (!raw) return null;
    return JSON.parse(raw) as ParentSettingsExtras;
  } catch {
    return null;
  }
}

function saveParentSettingsExtras(studentId: string, extras: ParentSettingsExtras): void {
  try {
    localStorage.setItem(buildSettingsStorageKey(studentId), JSON.stringify(extras));
  } catch {
    // Ignore storage failures in private mode or quota limits.
  }
}

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      position: 'relative',
      width: 48,
      height: 26,
      borderRadius: 13,
      border: 'none',
      cursor: 'pointer',
      background: on
        ? 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(52,211,153,0.88))'
        : 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(51,65,85,0.85))',
      boxShadow: on ? '0 2px 8px rgba(16,185,129,0.35)' : '0 2px 8px rgba(2,6,23,0.35)',
      transition: 'background 0.2s',
    }}
  >
    <motion.div
      style={{
        position: 'absolute',
        top: 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#F8FAFC',
        boxShadow: '0 1px 6px rgba(2,6,23,0.35)',
      }}
      animate={{ left: on ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
);

const SettingRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  right: React.ReactNode;
}> = ({ icon, title, description, right }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '12px 0',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.08))'),
          border: `1px solid ${PANEL_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: CLR.primary, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: CLR.muted, margin: '2px 0 0 0' }}>{description}</p>
      </div>
    </div>
    <div>{right}</div>
  </div>
);

const SettingsCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  gradient?: string;
}> = ({ children, delay = 0, gradient }) => (
  <motion.div
    style={{
      background: panelBackground(gradient),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 24,
      padding: 24,
      border: `1px solid ${PANEL_BORDER}`,
      boxShadow: PANEL_SHADOW,
    }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...spring, delay }}
    whileHover={{ y: -1, boxShadow: '0 22px 52px rgba(2,6,23,0.32)' }}
  >
    {children}
  </motion.div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  showToggle?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', multiline = false, showToggle = false }) => {
  const isPasswordToggle = type === 'password' && showToggle;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const effectiveType = isPasswordToggle ? (passwordVisible ? 'text' : 'password') : type;
  const inputPaddingRight = isPasswordToggle ? 48 : 16;

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: CLR.secondary,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{
            resize: 'vertical',
            minHeight: 112,
            borderRadius: 18,
            border: `1px solid ${CLR.border}`,
            background: 'rgba(15,23,42,0.74)',
            padding: '14px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: '#E2E8F0',
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(2,6,23,0.45)',
          }}
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type={effectiveType}
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={placeholder}
            style={{
              height: 52,
              width: '100%',
              borderRadius: 18,
              border: `1px solid ${CLR.border}`,
              background: 'rgba(15,23,42,0.74)',
              padding: `0 ${inputPaddingRight}px 0 16px`,
              fontSize: 14,
              fontWeight: 600,
              color: '#E2E8F0',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(2,6,23,0.45)',
              boxSizing: 'border-box',
            }}
          />
          {isPasswordToggle && (
            <button
              type="button"
              aria-label={passwordVisible ? 'Hide value' : 'Show value'}
              onClick={() => setPasswordVisible(isVisible => !isVisible)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i
                aria-hidden
                className={`fas ${passwordVisible ? 'fa-eye-slash' : 'fa-eye'} fa-fw`}
                style={{ ...ICON_STYLE, fontSize: 16, color: '#94A3B8' }}
              />
            </button>
          )}
        </div>
      )}
    </label>
  );
};

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        background: subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.22), rgba(236,72,153,0.08))'),
        border: `1px solid ${PANEL_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: CLR.primary, margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 12, fontWeight: 500, color: CLR.muted, margin: '4px 0 0 0', lineHeight: '18px' }}>
        {subtitle}
      </p>
    </div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { muted, toggleMute } = useSound();
  const { studentProfile, updateStudentProfile } = useAuth();

  const [playtimeLimit, setPlaytimeLimit] = useState(60);
  const [playtimeEnabled, setPlaytimeEnabled] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const [formState, setFormState] = useState<ParentFormState>({
    parentName: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    oldParentAccessKey: '',
    parentAccessKey: '',
  });
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [permissions, setPermissions] = useState<PermissionSettings>(DEFAULT_PERMISSIONS);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  useEffect(() => {
    const settings = playtimeManager.getSettings();
    setPlaytimeLimit(settings.dailyLimitMinutes);
    setPlaytimeEnabled(settings.enabled);
  }, []);

  useEffect(() => {
    if (!studentProfile) return;

    const extras = loadParentSettingsExtras(studentProfile.studentId);
    setFormState({
      parentName: studentProfile.parentName,
      phone: studentProfile.phone,
      email: extras?.email ?? buildDefaultEmail(studentProfile.studentId),
      address: studentProfile.address,
      emergencyContact: extras?.emergencyContact ?? studentProfile.phone,
      oldParentAccessKey: '',
      parentAccessKey: studentProfile.parentAccessKey,
    });
    setNotifications(extras?.notifications ?? DEFAULT_NOTIFICATIONS);
    setPermissions(extras?.permissions ?? DEFAULT_PERMISSIONS);
  }, [studentProfile]);

  const handlePlaytimeToggle = () => {
    setPlaytimeEnabled(previous => {
      const next = !previous;
      playtimeManager.saveSettings({ dailyLimitMinutes: playtimeLimit, enabled: next });
      return next;
    });
  };

  const handlePlaytimeChange = (minutes: number) => {
    setPlaytimeLimit(minutes);
    playtimeManager.saveSettings({ dailyLimitMinutes: minutes, enabled: playtimeEnabled });
  };

  const handleReset = () => {
    const keys = [
      'child_xp_state',
      'ssms_stats_v2',
      'ssms_audit_log',
      'ssms_homework',
      'arcade_game_stars',
    ];
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors.
      }
    });
    setResetDone(true);
    setShowReset(false);
    window.setTimeout(() => setResetDone(false), 3000);
  };

  const handleSaveParentSettings = () => {
    if (!studentProfile) return;

    if (
      !formState.parentName.trim() ||
      !formState.phone.trim() ||
      !formState.email.trim() ||
      !formState.address.trim() ||
      !formState.parentAccessKey.trim()
    ) {
      setSaveFeedback({
        tone: 'error',
        message: 'Please fill in all required parent contact and access fields.',
      });
      return;
    }

    const nextAccessKey = formState.parentAccessKey.trim();
    const currentAccessKey = studentProfile.parentAccessKey.trim();
    const isAccessKeyChanging = nextAccessKey !== currentAccessKey;

    if (isAccessKeyChanging && formState.oldParentAccessKey.trim() !== currentAccessKey) {
      setSaveFeedback({
        tone: 'error',
        message: 'Enter the current access key to change it.',
      });
      return;
    }

    const result = updateStudentProfile({
      parentName: formState.parentName.trim(),
      phone: formState.phone.trim(),
      address: formState.address.trim(),
      parentAccessKey: nextAccessKey,
    });

    if (!result.ok) {
      setSaveFeedback({
        tone: 'error',
        message: result.error ?? 'Unable to save parent settings.',
      });
      return;
    }

    saveParentSettingsExtras(studentProfile.studentId, {
      email: formState.email.trim(),
      emergencyContact: formState.emergencyContact.trim(),
      notifications,
      permissions,
    });

    setSaveFeedback({
      tone: 'success',
      message: isAccessKeyChanging
        ? 'Parent settings saved. The new access key is now required for the next parent login.'
        : 'Parent settings saved.',
    });
    setFormState(previous => ({ ...previous, oldParentAccessKey: '' }));
    window.setTimeout(() => setSaveFeedback(null), 3200);
  };

  if (!studentProfile) {
    return null;
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 999,
            background: subPanelBackground('linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.08))'),
            color: '#C7D2FE',
            border: `1px solid ${PANEL_BORDER}`,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Parent controls only
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: CLR.primary, margin: '12px 0 0 0' }}>Settings</h1>
        <p style={{ fontSize: 14, fontWeight: 500, color: CLR.muted, marginTop: 6, lineHeight: '22px' }}>
          Update guardian details, notification rules, access controls, and parental preferences without cluttering the dashboard.
        </p>
      </motion.div>

      <SettingsCard
        delay={0.04}
        gradient="linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.08), rgba(56,189,248,0.08))"
      >
        <SectionHeading
          icon={<i aria-hidden className="fas fa-user-shield" style={ICON_STYLE} />}
          title="Guardian Details and Access"
          subtitle="Edit guardian information and require the current access key before changing it."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <InputField
            label="Parent Name"
            value={formState.parentName}
            onChange={value => setFormState(previous => ({ ...previous, parentName: value }))}
            placeholder="Enter parent name"
          />
          <InputField
            label="Phone Number"
            value={formState.phone}
            onChange={value => setFormState(previous => ({ ...previous, phone: value }))}
            placeholder="Enter phone number"
            type="tel"
          />
          <InputField
            label="Email"
            value={formState.email}
            onChange={value => setFormState(previous => ({ ...previous, email: value }))}
            placeholder="Enter contact email"
            type="email"
          />
          <InputField
            label="Emergency Contact"
            value={formState.emergencyContact}
            onChange={value => setFormState(previous => ({ ...previous, emergencyContact: value }))}
            placeholder="Emergency contact number"
            type="tel"
          />
          <InputField
            label="Current Access Key"
            value={formState.oldParentAccessKey}
            onChange={value => setFormState(previous => ({ ...previous, oldParentAccessKey: value }))}
            placeholder="Required only to change key"
            type="password"
            showToggle
          />
          <InputField
            label="Parent Access Key"
            value={formState.parentAccessKey}
            onChange={value => setFormState(previous => ({ ...previous, parentAccessKey: value }))}
            placeholder="Enter new access key"
            type="password"
            showToggle
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <InputField
            label="Address"
            value={formState.address}
            onChange={value => setFormState(previous => ({ ...previous, address: value }))}
            placeholder="Enter family address"
            multiline
          />
        </div>

        <AnimatePresence>
          {saveFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 16,
                background:
                  saveFeedback.tone === 'success'
                    ? 'rgba(16,185,129,0.16)'
                    : 'rgba(239,68,68,0.16)',
                border:
                  saveFeedback.tone === 'success'
                    ? '1px solid rgba(16,185,129,0.34)'
                    : '1px solid rgba(239,68,68,0.34)',
                color: saveFeedback.tone === 'success' ? '#6EE7B7' : '#FDA4AF',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {saveFeedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: CLR.muted }}>
            Changes stay on this device. Changing the parent access key requires the current key first.
          </p>
          <motion.button
            type="button"
            onClick={handleSaveParentSettings}
            style={{
              padding: '12px 18px',
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 12px 26px rgba(99,102,241,0.24)',
            }}
            whileHover={{ scale: 1.03, boxShadow: '0 16px 30px rgba(99,102,241,0.3)' }}
            whileTap={{ scale: 0.97 }}
          >
            Save Parent Settings
          </motion.button>
        </div>
      </SettingsCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <SettingsCard delay={0.08}>
        <SectionHeading
          icon={<i aria-hidden className="fas fa-bell" style={ICON_STYLE} />}
          title="Notification Preferences"
          subtitle="Choose how guardian updates should be delivered."
        />
          <SettingRow
            icon={<i aria-hidden className="fas fa-calendar-day" style={ICON_STYLE} />}
            title="Daily Summary"
            description="Send a short end-of-day learning summary."
            right={
              <Toggle
                on={notifications.dailySummary}
                onToggle={() =>
                  setNotifications(previous => ({ ...previous, dailySummary: !previous.dailySummary }))
                }
              />
            }
          />
          <SettingRow
            icon={<i aria-hidden className="fas fa-chart-line" style={ICON_STYLE} />}
            title="Weekly Report"
            description="Prepare a weekly progress digest for parent review."
            right={
              <Toggle
                on={notifications.weeklyReport}
                onToggle={() =>
                  setNotifications(previous => ({ ...previous, weeklyReport: !previous.weeklyReport }))
                }
              />
            }
          />
          <SettingRow
            icon={<i aria-hidden className="fas fa-sms" style={ICON_STYLE} />}
            title="SMS Alerts"
            description="Receive urgent attendance or playtime alerts by SMS."
            right={
              <Toggle
                on={notifications.smsAlerts}
                onToggle={() => setNotifications(previous => ({ ...previous, smsAlerts: !previous.smsAlerts }))}
              />
            }
          />
        </SettingsCard>

        <SettingsCard delay={0.1}>
          <SectionHeading
            icon={<i aria-hidden className="fas fa-shield-alt" style={ICON_STYLE} />}
            title="Child Permissions"
            subtitle="Decide which student-side experiences are available."
          />
          <SettingRow
            icon={<i aria-hidden className="fas fa-gamepad" style={ICON_STYLE} />}
            title="Allow Learning Games"
            description="Keep progress games and reward loops available in Student view."
            right={
              <Toggle
                on={permissions.allowGames}
                onToggle={() => setPermissions(previous => ({ ...previous, allowGames: !previous.allowGames }))}
              />
            }
          />
          <SettingRow
            icon={<i aria-hidden className="fas fa-robot" style={ICON_STYLE} />}
            title="Allow AI Buddy"
            description="Show AI helper tools and assisted practice areas."
            right={
              <Toggle
                on={permissions.allowAiBuddy}
                onToggle={() => setPermissions(previous => ({ ...previous, allowAiBuddy: !previous.allowAiBuddy }))}
              />
            }
          />
          <SettingRow
            icon={<i aria-hidden className="fas fa-hourglass-half" style={ICON_STYLE} />}
            title="Extended Play Window"
            description="Permit sessions to continue slightly beyond the standard playtime limit."
            right={
              <Toggle
                on={permissions.allowExtendedPlay}
                onToggle={() =>
                  setPermissions(previous => ({ ...previous, allowExtendedPlay: !previous.allowExtendedPlay }))
                }
              />
            }
          />
        </SettingsCard>
      </div>

      <SettingsCard delay={0.12}>
        <SectionHeading
          icon={<i aria-hidden className="fas fa-volume-up" style={ICON_STYLE} />}
          title="Sound"
          subtitle="Control audio feedback for the student dashboard."
        />
        <SettingRow
          icon={<i aria-hidden className="fas fa-volume-mute" style={ICON_STYLE} />}
          title="Mute All Sounds"
          description={muted ? 'Sounds are currently off.' : 'Sounds are currently on.'}
          right={<Toggle on={muted} onToggle={toggleMute} />}
        />
      </SettingsCard>

      <SettingsCard delay={0.16}>
        <SectionHeading
          icon={<i aria-hidden className="fas fa-stopwatch" style={ICON_STYLE} />}
          title="Playtime Limit"
          subtitle="Set a daily time limit for your child’s session."
        />
        <SettingRow
          icon={<i aria-hidden className="fas fa-stopwatch" style={ICON_STYLE} />}
          title="Enable Playtime Limit"
          description={playtimeEnabled ? `Active - ${playtimeLimit} min/day` : 'Currently disabled'}
          right={<Toggle on={playtimeEnabled} onToggle={handlePlaytimeToggle} />}
        />

        <AnimatePresence>
          {playtimeEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 14, borderTop: `1px solid ${CLR.border}`, marginTop: 8 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: CLR.secondary,
                    display: 'block',
                    marginBottom: 10,
                  }}
                >
                  Daily limit: <span style={{ color: '#10B981' }}>{playtimeLimit} minutes</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[10, 20, 30, 45, 60, 90, 120].map(minutes => (
                    <motion.button
                      key={minutes}
                      type="button"
                      onClick={() => handlePlaytimeChange(minutes)}
                      style={{
                        padding: '8px 4px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 10,
                        border:
                          playtimeLimit === minutes
                            ? '2px solid #10B981'
                            : '1px solid rgba(99,102,241,0.15)',
                        background:
                          playtimeLimit === minutes
                            ? 'rgba(16,185,129,0.1)'
                            : 'rgba(15,23,42,0.62)',
                        color: playtimeLimit === minutes ? '#10B981' : CLR.secondary,
                        cursor: 'pointer',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {minutes}min
                    </motion.button>
                  ))}
                </div>

                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={playtimeLimit}
                  onChange={event => handlePlaytimeChange(Number(event.target.value))}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 99,
                    appearance: 'none',
                    cursor: 'pointer',
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((playtimeLimit - 10) / 110) * 100}%, #e2e8f0 ${((playtimeLimit - 10) / 110) * 100}%, #e2e8f0 100%)`,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>10 min</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>60 min</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CLR.muted }}>120 min</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      <SettingsCard delay={0.2}>
        <SectionHeading
          icon={<i aria-hidden className="fas fa-database" style={ICON_STYLE} />}
          title="Data Management"
          subtitle="Manage your child’s learning data stored on this device."
        />

        <SettingRow
          icon={<i aria-hidden className="fas fa-hdd" style={ICON_STYLE} />}
          title="Local Storage"
          description="All dashboard data is stored locally on this device."
          right={
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#10B981',
                background: 'rgba(16,185,129,0.08)',
                padding: '3px 10px',
                borderRadius: 8,
              }}
            >
              Private
            </span>
          }
        />

        <div style={{ borderTop: `1px solid ${CLR.border}`, paddingTop: 12, marginTop: 8 }}>
          <SettingRow
            icon={<i aria-hidden className="fas fa-trash-alt" style={ICON_STYLE} />}
            title="Reset All Progress"
            description="Clears XP, stats, homework, and game data."
            right={
              <motion.button
                type="button"
                onClick={() => setShowReset(true)}
                style={{
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  color: '#DC2626',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  cursor: 'pointer',
                }}
                whileHover={{ background: 'rgba(239,68,68,0.12)' }}
                whileTap={{ scale: 0.96 }}
              >
                Reset
              </motion.button>
            }
          />
        </div>

        <AnimatePresence>
          {showReset && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 14,
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', margin: '0 0 10px 0' }}>
                Are you sure? This will permanently delete all progress.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <motion.button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 10,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.20)',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Yes, Reset Everything
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowReset(false)}
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 10,
                    color: CLR.secondary,
                    background: 'rgba(15,23,42,0.72)',
                    border: `1px solid ${PANEL_BORDER}`,
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {resetDone && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                fontSize: 12,
                fontWeight: 700,
                color: '#059669',
                textAlign: 'center',
              }}
            >
              All progress has been reset. Refresh the student dashboard to start fresh.
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      <SettingsCard delay={0.24} gradient="linear-gradient(135deg, rgba(99,102,241,0.16), rgba(56,189,248,0.08))">
        <SectionHeading
          icon={<i aria-hidden className="fas fa-info-circle" style={ICON_STYLE} />}
          title="About"
          subtitle="Reference details for this local parent dashboard."
        />
        <div style={{ fontSize: 12, color: CLR.secondary, lineHeight: '20px' }}>
          <p style={{ margin: '0 0 6px 0' }}>
            <strong>Student Smart Management System</strong> - Std 3 Edition
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            A gamified learning platform for young students with parental oversight.
          </p>
          <p style={{ fontSize: 10, color: CLR.muted, margin: '8px 0 0 0' }}>
            All data is stored locally. No network or cloud services are used.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
};

export default SettingsPage;
