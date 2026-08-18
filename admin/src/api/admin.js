import axios from 'axios';

// ── FIX 3: baseURL from environment variable, never hardcoded ──
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(res => res, err => {
  // FIX: only auto-logout on a 401 from an *authenticated* request (an
  // expired/invalid session). Previously this fired on every 401, including
  // a failed /admin/login attempt with a wrong password — which forced a
  // redirect to '/' before AdminLogin.jsx's catch block could show the
  // "Invalid admin credentials" message.
  const hadAuthHeader = Boolean(err.config?.headers?.Authorization);
  if (err.response?.status === 401 && hadAuthHeader) { sessionStorage.clear(); window.location.href = '/'; }
  return Promise.reject(err);
});

export const adminLogin               = (email, password)  => api.post('/admin/login', { email, password }).then(r => r.data.data);
export const getStats                 = ()                  => api.get('/admin/stats').then(r => r.data.data);
export const getAllAppointments        = (params={})         => api.get('/admin/appointments', { params }).then(r => r.data.data);
export const updateAppointmentStatus  = (id, status, cancelReason = '') => api.patch(`/admin/appointments/${id}/status`, { status, cancelReason }).then(r => r.data.data);
export const deleteAppointment        = (id)                => api.delete(`/admin/appointments/${id}`).then(r => r.data);
export const getAllDoctors             = ()                  => api.get('/admin/doctors').then(r => r.data.data);
export const addDoctor = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
  return api.post('/admin/doctors', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data);
};
export const updateDoctor             = (id, data)          => api.patch(`/admin/doctors/${id}`, data).then(r => r.data.data);
export const toggleDoctorAvailability = (id)                => api.patch(`/admin/doctors/${id}/availability`).then(r => r.data.data);
export const deleteDoctor             = (id)                => api.delete(`/admin/doctors/${id}`).then(r => r.data);
export const getAllUsers               = ()                  => api.get('/admin/users').then(r => r.data.data);
export const updateUserStatus         = (id, active)        => api.patch(`/admin/users/${id}/status`, { active }).then(r => r.data.data);
