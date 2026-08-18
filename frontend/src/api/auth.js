import api from './axiosInstance';

export const registerUser = async (name, email, password, phone, confirmPassword) => {
  const res = await api.post('/auth/register', { name, email, password, phone, confirmPassword });
  return res.data.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};

// FIX: real profile update (was previously faked via an unused localStorage key)
export const updateProfile = async (name, phone) => {
  const res = await api.patch('/auth/me', { name, phone });
  return res.data.data;
};
