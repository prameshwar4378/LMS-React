import api from './axios';

export const getRoomTypesApi = async () => {
  const res = await api.get('/room-types/');
  return res.data;
};

export const createRoomTypeApi = async (data) => {
  const res = await api.post('/room-types/', data);
  return res.data;
};

export const updateRoomTypeApi = async (id, data) => {
  const res = await api.put(`/room-types/${id}/`, data);
  return res.data;
};

export const patchRoomTypeApi = async (id, data) => {
  const res = await api.patch(`/room-types/${id}/`, data);
  return res.data;
};

export const deleteRoomTypeApi = async (id) => {
  const res = await api.delete(`/room-types/${id}/`);
  return res.data;
};

export const getRoomsApi = async () => {
  const res = await api.get('/rooms/');
  return res.data;
};

export const createRoomApi = async (data) => {
  const res = await api.post('/rooms/', data);
  return res.data;
};

export const updateRoomApi = async (id, data) => {
  const res = await api.put(`/rooms/${id}/`, data);
  return res.data;
};

export const updateRoomStatusApi = async (id, status) => {
  const res = await api.post(`/rooms/${id}/update_status/`, { status });
  return res.data;
};

export const deleteRoomApi = async (id) => {
  const res = await api.delete(`/rooms/${id}/`);
  return res.data;
};

export const checkAvailabilityApi = async (checkIn, checkOut, roomType = '', excludeBookingId = null, excludeStayId = null) => {
  let url = `/rooms/availability/?check_in=${checkIn}&check_out=${checkOut}`;
  if (roomType) url += `&room_type=${roomType}`;
  if (excludeBookingId) url += `&exclude_booking_id=${excludeBookingId}`;
  if (excludeStayId) url += `&exclude_stay_id=${excludeStayId}`;
  const res = await api.get(url);
  return res.data;
};

export const getRoomActivityApi = async (roomId) => {
  const res = await api.get(`/rooms/${roomId}/activity/`);
  return res.data;
};

export const requestRoomDeletionApi = async (roomId, data) => {
  const res = await api.post(`/rooms/${roomId}/request_deletion/`, data);
  return res.data;
};

export const getRoomDeletionRequestsApi = async (status = '') => {
  const url = status ? `/room-deletion-requests/?status=${status}` : '/room-deletion-requests/';
  const res = await api.get(url);
  return res.data;
};

export const getPendingRoomDeletionRequestsApi = async () => {
  const res = await api.get('/room-deletion-requests/pending/');
  return res.data;
};

export const approveRoomDeletionRequestApi = async (requestId, data = {}) => {
  const res = await api.post(`/room-deletion-requests/${requestId}/approve/`, data);
  return res.data;
};

export const rejectRoomDeletionRequestApi = async (requestId, data = {}) => {
  const res = await api.post(`/room-deletion-requests/${requestId}/reject/`, data);
  return res.data;
};

