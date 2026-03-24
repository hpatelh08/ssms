import { AuditLogEntry } from '../types';

const MAX_LOG_ENTRIES = 500;
const STORAGE_KEY = 'ssms_audit_log';

export function logAction(
  action: string,
  category: AuditLogEntry['category'],
  details: Record<string, unknown> = {}
): void {
  const entry: AuditLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    category,
    details,
  };

  try {
    const existing = getAuditLog();
    const updated = [entry, ...existing].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Audit log write failed:', err);
  }
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getAIInteractionLog(): AuditLogEntry[] {
  return getAuditLog().filter(e => e.category === 'ai');
}

export function clearAuditLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
