import api from './axios';

export const getBookingsApi = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/bookings/${query ? `?${query}` : ''}`);
  return res.data;
};

export const getBookingByIdApi = async (id) => {
  const res = await api.get(`/bookings/${id}/`);
  return res.data;
};

export const createBookingApi = async (data) => {
  const res = await api.post('/bookings/', data);
  return res.data;
};

export const updateBookingApi = async (id, data) => {
  const res = await api.put(`/bookings/${id}/`, data);
  return res.data;
};

export const cancelBookingApi = async (id) => {
  const res = await api.post(`/bookings/${id}/cancel/`);
  return res.data;
};

export const checkInBookingApi = async (id, data = {}) => {
  const res = await api.post(`/bookings/${id}/check_in/`, data);
  return res.data;
};

export const deleteBookingApi = async (id) => {
  const res = await api.delete(`/bookings/${id}/`);
  return res.data;
};
