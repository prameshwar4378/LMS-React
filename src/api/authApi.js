import api from './axios';

export const loginApi = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  return response.data;
};

export const getProfileApi = async () => {
  const response = await api.get('/auth/me/');
  return response.data;
};

export const getUsersApi = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const createUserApi = async (userData) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const updateUserApi = async (id, userData) => {
  const response = await api.put(`/users/${id}/`, userData);
  return response.data;
};

export const deleteUserApi = async (id) => {
  const response = await api.delete(`/users/${id}/`);
  return response.data;
};

export const getRolePermissionsApi = async () => {
  const response = await api.get('/role-permissions/');
  return response.data;
};

export const updateRolePermissionsApi = async (role, permissions) => {
  const response = await api.post('/role-permissions/', { role, permissions });
  return response.data;
};

export const resetRolePermissionsApi = async (role) => {
  const response = await api.post('/role-permissions/reset_defaults/', { role });
  return response.data;
};

export const resetUserPasswordApi = async (id, password = null) => {
  const payload = password ? { password } : {};
  const response = await api.post(`/users/${id}/reset_password/`, payload);
  return response.data;
};

export const toggleUserActiveApi = async (id) => {
  const response = await api.patch(`/users/${id}/toggle_active/`);
  return response.data;
};

