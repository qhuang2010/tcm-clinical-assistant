/**
 * Authenticated fetch wrapper.
 * Automatically handles 401 by clearing token and reloading to login page.
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    // Return a never-resolving promise to prevent further processing
    return new Promise(() => {});
  }

  return response;
}
