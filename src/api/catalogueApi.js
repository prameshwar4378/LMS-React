import api, { API_BASE_URL } from './axios';
import axios from 'axios';

// Public endpoints (no auth required)
export const getPublicCatalogueApi = async (propertyCode, branchCode = null) => {
  const url = branchCode
    ? `${API_BASE_URL}/catalogue/public/${propertyCode}/?branch=${branchCode}`
    : `${API_BASE_URL}/catalogue/public/${propertyCode}/`;
  const response = await axios.get(url);
  return response.data;
};

export const submitPublicInquiryApi = async (propertyCode, inquiryData) => {
  const response = await axios.post(`${API_BASE_URL}/catalogue/public/${propertyCode}/inquire/`, inquiryData);
  return response.data;
};

// Authenticated CMS endpoints (Tenant-scoped via api instance)
export const getCatalogueConfigApi = async (propertyId = null) => {
  const params = propertyId ? { property: propertyId } : {};
  const response = await api.get('/catalogue/config/current/', { params });
  return response.data;
};

export const updateCatalogueConfigApi = async (formData, propertyId = null) => {
  const params = propertyId ? { property: propertyId } : {};
  const isFormData = formData instanceof FormData;
  const config = {
    params,
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  };
  const response = await api.post('/catalogue/config/current/', formData, config);
  return response.data;
};

export const copyBrandDefaultsApi = async (propertyId = null) => {
  const params = propertyId ? { property: propertyId } : {};
  const response = await api.post('/catalogue/config/copy_brand_defaults/', {}, { params });
  return response.data;
};

// Room Type Photos
export const getRoomTypePhotosApi = async (roomTypeId = null) => {
  const params = roomTypeId ? { room_type: roomTypeId } : {};
  const response = await api.get('/catalogue/photos/', { params });
  return response.data;
};

export const uploadRoomPhotoApi = async (formData) => {
  const response = await api.post('/catalogue/photos/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteRoomPhotoApi = async (photoId) => {
  const response = await api.delete(`/catalogue/photos/${photoId}/`);
  return response.data;
};

export const setPrimaryRoomPhotoApi = async (photoId) => {
  const response = await api.post(`/catalogue/photos/${photoId}/set_primary/`);
  return response.data;
};

// Hotel Gallery Photos
export const getHotelGalleryPhotosApi = async (propertyId = null) => {
  const params = propertyId ? { property: propertyId } : {};
  const response = await api.get('/catalogue/gallery-photos/', { params });
  return response.data;
};

export const uploadHotelGalleryPhotoApi = async (formData) => {
  const response = await api.post('/catalogue/gallery-photos/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateHotelGalleryPhotoApi = async (photoId, data) => {
  const response = await api.patch(`/catalogue/gallery-photos/${photoId}/`, data);
  return response.data;
};

export const deleteHotelGalleryPhotoApi = async (photoId) => {
  const response = await api.delete(`/catalogue/gallery-photos/${photoId}/`);
  return response.data;
};

// Catalogue Inquiries
export const getCatalogueInquiriesApi = async (params = {}) => {
  const response = await api.get('/catalogue/inquiries/', { params });
  return response.data;
};

export const updateInquiryStatusApi = async (inquiryId, status, notes = '') => {
  const response = await api.post(`/catalogue/inquiries/${inquiryId}/update_status/`, { status, notes });
  return response.data;
};
