import axios from 'axios';

const TOKEN_KEY = 'notes_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// One axios instance for the whole app. "/api" works in dev (Vite proxy)
// and in production (same domain as the Express API).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired, log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Turn any axios error into a readable message for the UI
export const errorMessage = (err) =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server. Is it running?' : err.message);

// ---- Auth endpoints ----
export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ---- Notes endpoints ----
export const notesApi = {
  list: (params) => api.get('/notes', { params }).then((r) => r.data),
  tags: () => api.get('/notes/tags').then((r) => r.data),
  get: (id) => api.get(`/notes/${id}`).then((r) => r.data),
  create: (note) => api.post('/notes', note).then((r) => r.data),
  update: (id, note) => api.put(`/notes/${id}`, note).then((r) => r.data),
  togglePin: (id) => api.patch(`/notes/${id}/pin`).then((r) => r.data),
  remove: (id) => api.delete(`/notes/${id}`).then((r) => r.data),
};

export default api;
