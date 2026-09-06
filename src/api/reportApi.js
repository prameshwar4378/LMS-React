import api from './axios';

/**
 * Fetch unified report data with dynamic filters.
 * @param {Object} params - { category, report_id, period, start_date, end_date, start_datetime, end_datetime, room_id, room_type_id, status, payment_method, charge_type_id, search }
 */
export const getReportDataApi = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  const res = await api.get(`/reports/data/${query ? `?${query}` : ''}`);
  return res.data;
};

/**
 * Fetch dropdown options for report filter bar (Rooms, Room Types, Categories, Statuses, Lodge info)
 */
export const getReportFilterOptionsApi = async () => {
  const res = await api.get('/reports/filter-options/');
  return res.data;
};

/**
 * Fetch daily Night Audit closing digest
 */
export const getNightAuditApi = async () => {
  const res = await api.get('/reports/night-audit/');
  return res.data;
};

// Legacy APIs retained for backward compatibility
export const getDashboardReportApi = async () => {
  const res = await api.get('/reports/dashboard/');
  return res.data;
};

export const getRevenueReportApi = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/reports/revenue/${query ? `?${query}` : ''}`);
  return res.data;
};

export const getOccupancyReportApi = async () => {
  const res = await api.get('/reports/occupancy/');
  return res.data;
};

export const getGuestRegisterReportApi = async (search = '') => {
  const url = search ? `/reports/guest-register/?search=${encodeURIComponent(search)}` : '/reports/guest-register/';
  const res = await api.get(url);
  return res.data;
};

/**
 * Fetch Cashier Reconciliation & Discrepancy Analytics report.
 * @param {Object} params - { period, start_date, end_date }
 */
export const getShiftReconciliationReportApi = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  const res = await api.get(`/reports/shift-reconciliations/${query ? `?${query}` : ''}`);
  return res.data;
};

