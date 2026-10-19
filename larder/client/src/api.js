// In local dev, Vite's dev server proxies /api to the Express server (see
// vite.config.js), so an empty base works. In production there's no such
// proxy, so VITE_API_URL must point at the deployed backend.
const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'larder_token';
const USERNAME_KEY = 'larder_username';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const getUsername = () => localStorage.getItem(USERNAME_KEY) || '';

export const setSession = (token, username) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. a 502 with plain text) — fall through with data = null
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request('/api/auth/register', { method: 'POST', body: { username, password }, auth: false }),
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: { username, password }, auth: false }),

  searchRecipes: (q) => request(`/api/recipes/search?q=${encodeURIComponent(q)}`),
  getRecipe: (id) => request(`/api/recipes/${id}`),

  getPantry: () => request('/api/pantry'),
  setPantryItem: (name, have) => request('/api/pantry', { method: 'PATCH', body: { name, have } }),
};
