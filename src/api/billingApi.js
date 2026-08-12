import api from './axios';

export const getChargeTypesApi = async () => {
  const res = await api.get('/charge-types/');
  return res.data;
};

export const createChargeTypeApi = async (data) => {
  const res = await api.post('/charge-types/', data);
  return res.data;
};

export const deleteChargeTypeApi = async (id) => {
  const res = await api.delete(`/charge-types/${id}/`);
  return res.data;
};

export const getExtraChargesApi = async (stayId) => {
  const res = await api.get(`/extra-charges/?stay=${stayId}`);
  return res.data;
};

export const createExtraChargeApi = async (data) => {
  const res = await api.post('/extra-charges/', data);
  return res.data;
};

export const deleteExtraChargeApi = async (id) => {
  const res = await api.delete(`/extra-charges/${id}/`);
  return res.data;
};

export const getPaymentsApi = async (stayId = '') => {
  const url = stayId ? `/payments/?stay=${stayId}` : '/payments/';
  const res = await api.get(url);
  return res.data;
};

export const createPaymentApi = async (data) => {
  const res = await api.post('/payments/', data);
  return res.data;
};

export const updatePaymentApi = async (id, data) => {
  const res = await api.patch(`/payments/${id}/`, data);
  return res.data;
};

export const deletePaymentApi = async (id) => {
  const res = await api.delete(`/payments/${id}/`);
  return res.data;
};

export const getInvoiceByStayApi = async (stayId) => {
  const res = await api.get(`/invoices/by-stay/${stayId}/`);
  return res.data;
};
