import api from './axiosInstance';
import { DOCTORS } from '../data/doctors';

// FIX: previously fell back to mock data on ANY error (including a real
// 500 from the backend), which would silently hide server bugs behind
// what looks like a normal doctor list. Now only falls back when the
// backend is genuinely unreachable (no response at all), and logs real
// server errors to the console instead of hiding them.
export const getAllDoctors = async () => {
  try {
    const res = await api.get('/doctors');
    return res.data.data;
  } catch (err) {
    if (!err.response) return DOCTORS; // backend not running / network error
    console.error('Failed to load doctors:', err.response.data?.message || err.message);
    throw err;
  }
};

export const getSiteStats = async () => {
  try {
    const res = await api.get('/doctors/stats');
    return res.data.data;
  } catch {
    return null;
  }
};

export const getDoctorById = async (id) => {
  try {
    const res = await api.get(`/doctors/${id}`);
    return res.data.data;
  } catch (err) {
    if (err.response) throw err; // real backend error (e.g. 404) — don't mask it
    // fallback to local data only when the backend is unreachable
    const doc = DOCTORS.find(d => String(d.id) === String(id) || String(d._id) === String(id));
    if (!doc) throw new Error('Doctor not found');
    return doc;
  }
};
