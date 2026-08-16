import api from './axios';

export const getStaysApi = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/stays/${query ? `?${query}` : ''}`);
  return res.data;
};

export const getStayByIdApi = async (id) => {
  const res = await api.get(`/stays/${id}/`);
  return res.data;
};

export const updateStayApi = async (id, data) => {
  const res = await api.patch(`/stays/${id}/`, data);
  return res.data;
};

export const createWalkInStayApi = async (data) => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.post('/stays/walk_in/', data, { headers });
  return res.data;
};

export const getStayBillApi = async (id) => {
  const res = await api.get(`/stays/${id}/bill/`);
  return res.data;
};

export const extendStayApi = async (id, newCheckoutDate) => {
  const res = await api.post(`/stays/${id}/extend/`, { new_checkout_date: newCheckoutDate });
  return res.data;
};

export const checkoutStayApi = async (id, checkoutData) => {
  const res = await api.post(`/stays/${id}/checkout/`, checkoutData);
  return res.data;
};

export const getStayGuestsApi = async (stayId) => {
  const res = await api.get(`/stay-guests/?stay=${stayId}`);
  return res.data;
};

export const addStayGuestApi = async (formData) => {
  const headers = formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.post('/stay-guests/', formData, { headers });
  return res.data;
};

export const updateStayGuestApi = async (id, formData) => {
  const headers = formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.patch(`/stay-guests/${id}/`, formData, { headers });
  return res.data;
};

export const deleteStayGuestApi = async (id) => {
  const res = await api.delete(`/stay-guests/${id}/`);
  return res.data;
};
