import axios from 'axios';

// Dynamic API Base URL Config:
// Local Development: http://127.0.0.1:8000/api
// Live Production: https://lmsdjangobackend.pythonanywhere.com/api

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]'
);

export const API_HOST_URL = isLocalhost
  ? 'http://127.0.0.1:8000'
  : 'https://lmsdjangobackend.pythonanywhere.com';

export const API_BASE_URL = `${API_HOST_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const selectedPropId = localStorage.getItem('lms_selected_property_id');
    if (selectedPropId && !config.headers['X-Property-ID']) {
      config.headers['X-Property-ID'] = selectedPropId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.hash = '#/login';
        }
      }
    }

    if (
      error.response &&
      (error.response.status === 402 ||
       error.response.data?.error === 'SUBSCRIPTION_EXPIRED' ||
       (error.response.status === 403 && (error.response.data?.error === 'PROPERTY_SUSPENDED' || error.response.data?.is_suspended)))
    ) {
      if (!window.location.hash.includes('/subscription') &&
          !window.location.hash.includes('/platform') &&
          !window.location.hash.includes('/login')) {
        window.location.hash = '#/subscription';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
