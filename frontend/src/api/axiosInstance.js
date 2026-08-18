import axios from 'axios';

// ── FIX 3: baseURL from environment variable, never hardcoded ──
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('medicare_user') || 'null');
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    // FIX: only force-redirect on 401s from *authenticated* requests (i.e. a
    // logged-in session that expired/became invalid). Previously this fired
    // on EVERY 401, including a failed /auth/login or /auth/register attempt
    // — which meant a wrong-password login triggered a full page reload to
    // /login before the user ever saw the "Invalid credentials" message set
    // in the calling page's catch block.
    const hadAuthHeader = Boolean(err.config?.headers?.Authorization);
    if (err.response?.status === 401 && hadAuthHeader) {
      localStorage.removeItem('medicare_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
