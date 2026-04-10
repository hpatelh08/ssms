const DEFAULT_TEACHER_BASE_URL = 'http://127.0.0.1:5002';

export function getTeacherPortalBaseUrl() {
  return `${window.location.protocol}//${window.location.hostname}:5002`.replace(/\/+$/, '');
}

export async function getTeacherPortalJson(path: string) {
  const response = await fetch(`${getTeacherPortalBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`);
  const data = await response.json().catch(() => ({}));
  if (response.status === 404) {
    return { data: [] };
  }
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}

export function toTeacherFileUrl(filePath?: string | null) {
  const path = String(filePath || '').trim();
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${getTeacherPortalBaseUrl()}${path}`;
  return `${getTeacherPortalBaseUrl()}/${path}`;
}
