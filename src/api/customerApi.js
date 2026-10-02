import api from './axios';
import { triggerShiftRefresh } from '../utils/shiftEvents';

export const getCustomersApi = async (params = '') => {
  let queryParams = {};
  if (typeof params === 'string') {
    if (params.trim()) queryParams.search = params.trim();
  } else if (params && typeof params === 'object') {
    queryParams = { ...params };
  }
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
      searchParams.append(k, v);
    }
  });
  const qs = searchParams.toString();
  const url = qs ? `/customers/?${qs}` : '/customers/';
  const res = await api.get(url);
  return Array.isArray(res.data) ? res.data : (res.data?.results || []);
};

export const getCustomerByIdApi = async (id) => {
  const res = await api.get(`/customers/${id}/`);
  return res.data;
};

export const getCustomerHistoryApi = async (id) => {
  const res = await api.get(`/customers/${id}/history/`);
  return res.data;
};

export const searchCustomersApi = async (query = '') => {
  const term = typeof query === 'string' ? query.trim() : '';
  if (!term) return [];
  const res = await api.get(`/customers/search/?q=${encodeURIComponent(term)}`);
  return Array.isArray(res.data) ? res.data : (res.data?.results || []);
};

export const createCustomerApi = async (formData) => {
  // Let axios / browser handle multipart/form-data boundary automatically for FormData
  const res = await api.post('/customers/', formData);
  return res.data;
};

export const updateCustomerApi = async (id, formData) => {
  const customerId = (typeof id === 'object' && id !== null) ? (id.id || id) : id;
  // Use PATCH for partial updates, and let Axios/browser set multipart boundary automatically
  const res = await api.patch(`/customers/${customerId}/`, formData);
  return res.data;
};

export const uploadCustomerDocumentApi = async (customerId, title, file) => {
  const formData = new FormData();
  if (title) formData.append('title', title);
  formData.append('document_file', file);
  const res = await api.post(`/customers/${customerId}/upload_document/`, formData);
  return res.data;
};

export const removeCustomerPhotoApi = async (customerId) => {
  const res = await api.delete(`/customers/${customerId}/remove_photo/`);
  return res.data;
};

export const removeCustomerIdFrontApi = async (customerId) => {
  const res = await api.delete(`/customers/${customerId}/remove_id_front/`);
  return res.data;
};

export const removeCustomerIdBackApi = async (customerId) => {
  const res = await api.delete(`/customers/${customerId}/remove_id_back/`);
  return res.data;
};

export const deleteCustomerDocumentApi = async (documentId) => {
  const res = await api.delete(`/customer-documents/${documentId}/`);
  return res.data;
};

export const deleteCustomerApi = async (id) => {
  const res = await api.delete(`/customers/${id}/`);
  return res.data;
};

export const recordCustomerPaymentApi = async (customerId, paymentData) => {
  const res = await api.post(`/customers/${customerId}/record_payment/`, paymentData);
  triggerShiftRefresh();
  return res.data;
};

export const refundCustomerCreditApi = async (customerId, refundData) => {
  const res = await api.post(`/customers/${customerId}/refund_credit/`, refundData);
  triggerShiftRefresh();
  return res.data;
};

export const getCustomerWalletsApi = async (params = {}) => {
  const res = await api.get('/customers/wallets/', { params });
  return res.data;
};
