const DEFAULT_ADMIN_BACKEND_PORT = 5000;

export function getAdminBackendBaseUrl() {
  return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_ADMIN_BACKEND_PORT}`;
}

export async function postAdminBackendJson(path: string, body: unknown) {
  const response = await fetch(`${getAdminBackendBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }

  return data;
}

