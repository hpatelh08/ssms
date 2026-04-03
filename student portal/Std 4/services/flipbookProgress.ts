export const FLIPBOOK_PROGRESS_UPDATED_EVENT = 'ssms:flipbook-progress-updated';

export function saveFlipbookProgress(bookId: string, pageNum: number, totalPages: number) {
  const key = 'ssms_flipbook_progress';
  try {
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    const pct = Math.min(100, Math.round((pageNum / totalPages) * 100));
    if (!map[bookId] || pct > map[bookId]) {
      map[bookId] = pct;
      localStorage.setItem(key, JSON.stringify(map));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(FLIPBOOK_PROGRESS_UPDATED_EVENT, {
          detail: { bookId, progressPercent: pct },
        }));
      }
    }
  } catch {}
}

export function getFlipbookProgress(bookId: string): number {
  const key = 'ssms_flipbook_progress';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const map = JSON.parse(raw);
    return map[bookId] || 0;
  } catch {
    return 0;
  }
}
