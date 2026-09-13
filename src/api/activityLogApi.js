import api from './axios';

export const getActivityLogsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  if (params.model && params.model !== 'ALL') query.append('model', params.model);
  if (params.action && params.action !== 'ALL') query.append('action', params.action);
  if (params.search) query.append('search', params.search);
  if (params.days) query.append('days', params.days);

  const qs = query.toString();
  const url = qs ? `/activity-logs/?${qs}` : '/activity-logs/';
  const res = await api.get(url);
  return res.data;
};
