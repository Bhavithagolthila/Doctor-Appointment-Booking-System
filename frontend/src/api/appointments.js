import api from './axiosInstance';

export const bookAppointment = async (payload) => {
  const res = await api.post('/appointments', payload);
  return res.data.data;
};

export const getUserAppointments = async (userId) => {
  const res = await api.get(`/appointments/user/${userId}`);
  return res.data.data;
};

export const cancelAppointment = async (id) => {
  const res = await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
  return res.data.data;
};

// FIX: wire up the already-existing backend endpoint so the slot picker
// can grey out times that are already booked for a doctor on a given date.
export const getBookedSlots = async (doctorId, date) => {
  try {
    const res = await api.get('/appointments/slots/booked', { params: { doctorId, date } });
    return res.data.data; // array of booked "HH:MM" time values
  } catch {
    return [];
  }
};
