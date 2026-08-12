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

export const checkAvailabilityApi = async (checkIn, checkOut, roomType = '') => {
  let url = `/rooms/availability/?check_in=${checkIn}&check_out=${checkOut}`;
  if (roomType) url += `&room_type=${roomType}`;
  const res = await api.get(url);
  return res.data;
};
