/**
 * services/playtimeManager.ts
 * ═══════════════════════════════════════════════════
 * Centralized Playtime Limit Manager
 * 
 * Features:
 * - Parent-controlled daily playtime limits
 * - Pause/resume across game sessions
 * - Daily reset at midnight
 * - Persistent storage
 * - Single source of truth for all games
 */

const STORAGE_KEY = 'ssms_playtime_session';
const SETTINGS_KEY = 'ssms_playtime_settings';

export interface PlaytimeSettings {
  dailyLimitMinutes: number; // 0 = unlimited
  enabled: boolean;
}

export interface PlaytimeSession {
  remainingSeconds: number;
  isRunning: boolean;
  lastDate: string; // YYYY-MM-DD
  lastActiveTimestamp: number;
}

type PlaytimeListener = (session: PlaytimeSession) => void;

class PlaytimeManager {
  private session: PlaytimeSession;
  private settings: PlaytimeSettings;
  private intervalId: number | null = null;
  private listeners: Set<PlaytimeListener> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.session = this.loadSession();
    this.checkDailyReset();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageSync);
    }
  }

  /* ── Settings Management ── */
  
  private loadSettings(): PlaytimeSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { dailyLimitMinutes: 60, enabled: true };
      return JSON.parse(raw) as PlaytimeSettings;
    } catch {
      return { dailyLimitMinutes: 60, enabled: true };
    }
  }

  public saveSettings(settings: PlaytimeSettings): void {
    const previousSettings = this.settings;
    this.settings = settings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    const nextLimitSeconds = Math.max(0, Math.round(settings.dailyLimitMinutes * 60));

    if (!settings.enabled) {
      this.stopInterval();
      this.session.isRunning = false;
      this.session.remainingSeconds = Infinity;
    } else if (previousSettings.enabled && Number.isFinite(this.session.remainingSeconds)) {
      const previousLimitSeconds = Math.max(0, Math.round(previousSettings.dailyLimitMinutes * 60));
      const usedSeconds = Math.max(0, previousLimitSeconds - this.session.remainingSeconds);
      this.session.remainingSeconds = Math.max(0, nextLimitSeconds - usedSeconds);
      if (this.session.remainingSeconds <= 0) {
        this.stopInterval();
        this.session.isRunning = false;
      }
    } else {
      this.stopInterval();
      this.session.isRunning = false;
      this.session.remainingSeconds = nextLimitSeconds;
    }

    this.session.lastDate = this.getTodayString();
    this.session.lastActiveTimestamp = Date.now();
    this.saveSession();
    this.notifyListeners();
  }

  public getSettings(): PlaytimeSettings {
    return { ...this.settings };
  }

  /* ── Session Management ── */

  private loadSession(): PlaytimeSession {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.createNewSession();
      const session = JSON.parse(raw) as PlaytimeSession;
      
      // Validate session
      if (!session.lastDate || typeof session.remainingSeconds !== 'number') {
        return this.createNewSession();
      }
      
      return session;
    } catch {
      return this.createNewSession();
    }
  }

  private createNewSession(): PlaytimeSession {
    return {
      remainingSeconds: this.settings.dailyLimitMinutes * 60,
      isRunning: false,
      lastDate: this.getTodayString(),
      lastActiveTimestamp: Date.now(),
    };
  }

  private saveSession(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /* ── Daily Reset Logic ── */

  private getTodayString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private checkDailyReset(): void {
    const today = this.getTodayString();
    
    if (this.session.lastDate !== today) {
      // New day - reset timer
      this.session.remainingSeconds = this.settings.enabled 
        ? this.settings.dailyLimitMinutes * 60 
        : Infinity;
      this.session.lastDate = today;
      this.session.isRunning = false;
      this.saveSession();
      this.notifyListeners();
    }
  }

  /* ── Timer Control ── */

  public startTimer(): void {
    if (!this.settings.enabled) return; // Unlimited mode
    if (this.session.remainingSeconds <= 0) return; // Time expired
    if (this.session.isRunning) return; // Already running

    this.session.isRunning = true;
    this.session.lastActiveTimestamp = Date.now();
    this.saveSession();

    // Clear any existing interval
    this.stopInterval();

    // Start countdown
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 1000);

    this.notifyListeners();
  }

  public pauseTimer(): void {
    if (!this.session.isRunning) return;

    this.session.isRunning = false;

    this.stopInterval();

    this.saveSession();
    this.notifyListeners();
  }

  private tick(): void {
    if (!this.session.isRunning) return;
    if (this.session.remainingSeconds <= 0) {
      this.onTimeExpired();
      return;
    }

    this.session.remainingSeconds -= 1;
    this.session.lastActiveTimestamp = Date.now();
    this.saveSession();
    this.notifyListeners();
  }

  private onTimeExpired(): void {
    this.session.remainingSeconds = 0;
    this.pauseTimer();
    this.notifyListeners();
    
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('playtimeExpired'));
  }

  /* ── Getters ── */

  public getSession(): PlaytimeSession {
    this.checkDailyReset();
    return { ...this.session };
  }

  public getRemainingSeconds(): number {
    this.checkDailyReset();
    return this.session.remainingSeconds;
  }

  public isRunning(): boolean {
    return this.session.isRunning;
  }

  public hasTimeRemaining(): boolean {
    if (!this.settings.enabled) return true;
    return this.session.remainingSeconds > 0;
  }

  public formatTime(): { minutes: number; seconds: number } {
    const total = Math.max(0, Math.floor(this.session.remainingSeconds));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return { minutes, seconds };
  }

  /* ── Listener System ── */

  public subscribe(listener: PlaytimeListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const sessionCopy = { ...this.session };
    this.listeners.forEach(listener => {
      try {
        listener(sessionCopy);
      } catch (err) {
        console.error('Playtime listener error:', err);
      }
    });
  }

  private handleStorageSync = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY && event.key !== SETTINGS_KEY) return;

    this.settings = this.loadSettings();
    this.session = this.loadSession();
    this.checkDailyReset();

    if (!this.session.isRunning) {
      this.stopInterval();
    }

    this.notifyListeners();
  };

  /* ── Cleanup ── */

  public destroy(): void {
    this.pauseTimer();
    this.listeners.clear();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageSync);
    }
  }
}

// Singleton instance
export const playtimeManager = new PlaytimeManager();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    playtimeManager.pauseTimer();
  });
}
