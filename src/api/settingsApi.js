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

export const getHotelBranchesApi = async () => {
  const res = await api.get('/settings/branches/');
  return res.data;
};

export const logWhatsAppMessageApi = async (data) => {
  const res = await api.post('/whatsapp-logs/', data);
  return res.data;
};

export const getWhatsAppLogsApi = async (params = {}) => {
  const res = await api.get('/whatsapp-logs/', { params });
  return res.data;
};

