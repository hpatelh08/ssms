import type { AuditLogEntry } from '../types';

export interface LiveMonitoringState {
  badge: string;
  badgeColor: string;
  indicatorColor: string;
  lastSession: string;
  sessionLength: string;
  currentActivity: string;
}

function formatLastSeen(timestamp: string): string {
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return 'No session yet';

  const diffMinutes = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function humanizeScreen(screen: unknown): string {
  const raw = String(screen ?? '').trim();
  if (!raw) return 'Student dashboard';
  if (raw.toLowerCase() === 'garden') return '📚 Practice Zone';

  const label = raw.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  const iconMap: Record<string, string> = {
    Home: '🏠',
    Play: '🎮',
    Journey: '🗺️',
    'Space War': '🚀',
    'Solar System': '🪐',
  };

  const icon = iconMap[label] ?? '📚';
  return `${icon} ${label}`;
}

function describeActivity(entry: AuditLogEntry): string {
  if (entry.category === 'game') {
    const game = String(entry.details?.game ?? '').trim();
    return game ? `🎮 ${game}` : '🎮 Playing a game';
  }
  if (entry.category === 'ai') {
    return '🤖 AI learning';
  }
  if (entry.category === 'homework') {
    return '📝 Homework practice';
  }
  if (entry.action === 'navigation') {
    return humanizeScreen(entry.details?.screen);
  }
  if (entry.action === 'tree_watered' || entry.action === 'garden_activity') {
    return '📚 Practice activity';
  }
  return '📚 Learning activity';
}

export function buildLiveMonitoring(log: AuditLogEntry[]): LiveMonitoringState {
  const studentEntries = [...log]
    .filter(entry => entry.category !== 'parent')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (studentEntries.length === 0) {
    return {
      badge: 'Waiting',
      badgeColor: '#94A3B8',
      indicatorColor: '#94A3B8',
      lastSession: 'No activity yet',
      sessionLength: '0 minutes',
      currentActivity: 'Student dashboard',
    };
  }

  const latest = studentEntries[0];
  const latestTs = new Date(latest.timestamp).getTime();
  const liveWindowMs = 2 * 60 * 1000;
  const activeWindowMs = 12 * 60 * 60 * 1000;
  const sessionGapMs = 20 * 60 * 1000;

  let sessionStartTs = latestTs;
  for (let index = 1; index < studentEntries.length; index += 1) {
    const currentTs = new Date(studentEntries[index].timestamp).getTime();
    if (sessionStartTs - currentTs > sessionGapMs) break;
    sessionStartTs = currentTs;
  }

  const ageMs = Date.now() - latestTs;
  const durationMinutes = Math.max(1, Math.ceil((latestTs - sessionStartTs) / 60000) || 1);
  const isLive = ageMs <= liveWindowMs;
  const isActiveToday = ageMs <= activeWindowMs;

  return {
    badge: isLive ? 'Live Now' : isActiveToday ? 'Active Today' : 'Offline',
    badgeColor: isLive ? '#22C55E' : isActiveToday ? '#6366F1' : '#94A3B8',
    indicatorColor: isLive ? '#22C55E' : isActiveToday ? '#6366F1' : '#94A3B8',
    lastSession: formatLastSeen(latest.timestamp),
    sessionLength: `${durationMinutes} minute${durationMinutes === 1 ? '' : 's'}`,
    currentActivity: describeActivity(latest),
  };
}
