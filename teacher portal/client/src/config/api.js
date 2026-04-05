const DEFAULT_API_BASE_URL = 'http://127.0.0.1:5002';

export const API_BASE_URL = String(process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL)
  .replace(/\/+$/, '');

export function apiUrl(path = '') {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
