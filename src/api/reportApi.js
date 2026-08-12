import api from './axios';

export const getDashboardReportApi = async () => {
  const res = await api.get('/reports/dashboard/');
  return res.data;
};

export const getRevenueReportApi = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/reports/revenue/${query ? `?${query}` : ''}`);
  return res.data;
};

export const getOccupancyReportApi = async () => {
  const res = await api.get('/reports/occupancy/');
  return res.data;
};

export const getGuestRegisterReportApi = async (search = '') => {
  const url = search ? `/reports/guest-register/?search=${encodeURIComponent(search)}` : '/reports/guest-register/';
  const res = await api.get(url);
  return res.data;
};
