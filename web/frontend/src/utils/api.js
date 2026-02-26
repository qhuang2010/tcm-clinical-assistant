/**
 * Authenticated fetch wrapper.
 * Automatically handles 401 by clearing token and reloading to login page.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    // Return a never-resolving promise to prevent further processing
    return new Promise(() => { });
  }

  return response;
}
