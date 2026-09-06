import { API_HOST_URL } from '../api/axios';

/**
 * Returns a fully qualified media URL for image/file paths.
 * If the path is relative (/media/...), prepends API_HOST_URL.
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_HOST_URL}${url}`;
  return `${API_HOST_URL}/${url}`;
};
