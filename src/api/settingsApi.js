import api from './axios';

export const getSettingsApi = async () => {
  const res = await api.get('/settings/');
  return res.data;
};

export const updateSettingsApi = async (data) => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.post('/settings/', data, { headers });
  return res.data;
};
