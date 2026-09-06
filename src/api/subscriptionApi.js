import api from './axios';

/**
 * Fetch current subscription status for active hotel property
 */
export const getCurrentSubscriptionApi = async () => {
  const response = await api.get('/subscription/current/');
  return response.data;
};

/**
 * Fetch available SaaS subscription plans
 */
export const getSubscriptionPlansApi = async () => {
  const response = await api.get('/subscription/plans/');
  return response.data;
};

