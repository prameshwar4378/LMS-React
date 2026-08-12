import api from './axios';

export const getCustomersApi = async (search = '') => {
  const url = search ? `/customers/?search=${encodeURIComponent(search)}` : '/customers/';
  const res = await api.get(url);
  return res.data;
};

export const getCustomerByIdApi = async (id) => {
  const res = await api.get(`/customers/${id}/`);
  return res.data;
};

export const getCustomerHistoryApi = async (id) => {
  const res = await api.get(`/customers/${id}/history/`);
  return res.data;
};

export const searchCustomersApi = async (query) => {
  const res = await api.get(`/customers/search/?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const createCustomerApi = async (formData) => {
  // Can accept FormData (for photo & doc files) or JSON object
  const headers = formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.post('/customers/', formData, { headers });
  return res.data;
};

export const updateCustomerApi = async (id, formData) => {
  const headers = formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.put(`/customers/${id}/`, formData, { headers });
  return res.data;
};

export const uploadCustomerDocumentApi = async (customerId, title, file) => {
  const formData = new FormData();
  if (title) formData.append('title', title);
  formData.append('document_file', file);
  const res = await api.post(`/customers/${customerId}/upload_document/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
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
