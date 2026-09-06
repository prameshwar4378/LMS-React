import api from './axios';

export const getPlatformPropertiesApi = async () => {
  const response = await api.get('/platform/properties/');
  return response.data;
};

export const createPlatformPropertyApi = async (propertyData) => {
  const response = await api.post('/platform/properties/', propertyData);
  return response.data;
};

export const togglePlatformPropertyStatusApi = async (id) => {
  const response = await api.patch(`/platform/properties/${id}/toggle_status/`);
  return response.data;
};

export const resetPropertyOwnerPasswordApi = async (id) => {
  const response = await api.post(`/platform/properties/${id}/reset_owner_password/`);
  return response.data;
};

export const renewPropertySubscriptionApi = async (id, data) => {
  const response = await api.post(`/platform/properties/${id}/renew_subscription/`, data);
  return response.data;
};

export const getPlatformSubscriptionsApi = async () => {
  const response = await api.get('/platform/subscriptions/');
  return response.data;
};

export const createPlatformSubscriptionPlanApi = async (planData) => {
  const response = await api.post('/platform/subscriptions/', planData);
  return response.data;
};

export const updatePlatformSubscriptionPlanApi = async (id, planData) => {
  const response = await api.put(`/platform/subscriptions/${id}/`, planData);
  return response.data;
};

export const deletePlatformSubscriptionPlanApi = async (id) => {
  const response = await api.delete(`/platform/subscriptions/${id}/`);
  return response.data;
};

export const applyCustomSubscriptionApi = async (customData) => {
  const response = await api.post('/platform/subscriptions/apply-custom/', customData);
  return response.data;
};


export const getPlatformPropertyDetailApi = async (id) => {
  const response = await api.get(`/platform/properties/${id}/`);
  return response.data;
};

export const updatePlatformPropertyApi = async (id, data) => {
  const response = await api.put(`/platform/properties/${id}/`, data);
  return response.data;
};

export const addHotelBranchApi = async (propertyId, branchData) => {
  const response = await api.post(`/platform/properties/${propertyId}/add_branch/`, branchData);
  return response.data;
};

export const toggleHotelBranchStatusApi = async (propertyId, branchId) => {
  const response = await api.patch(`/platform/properties/${propertyId}/toggle_branch/`, { branch_id: branchId });
  return response.data;
};

export const getPlatformHealthApi = async () => {
  const response = await api.get('/platform/health/');
  return response.data;
};

export const addPlatformStaffApi = async (propertyId, staffData) => {
  const response = await api.post(`/platform/properties/${propertyId}/add_staff/`, staffData);
  return response.data;
};

export const deletePlatformStaffApi = async (propertyId, userId) => {
  const response = await api.post(`/platform/properties/${propertyId}/delete_staff/`, { user_id: userId });
  return response.data;
};

export const resetPlatformStaffPasswordApi = async (propertyId, userId, password = null) => {
  const payload = { user_id: userId };
  if (password) payload.password = password;
  const response = await api.post(`/platform/properties/${propertyId}/reset_staff_password/`, payload);
  return response.data;
};

export const recordPropertySubscriptionPaymentApi = async (propertyId, paymentData) => {
  const response = await api.post(`/platform/properties/${propertyId}/record_payment/`, paymentData);
  return response.data;
};

export const deletePropertySubscriptionPaymentApi = async (propertyId, paymentId) => {
  const response = await api.post(`/platform/properties/${propertyId}/delete_payment/`, { payment_id: paymentId });
  return response.data;
};

