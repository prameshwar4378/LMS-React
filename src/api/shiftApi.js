import api from './axios';

/**
 * Fetch current user's active shift and live till financials.
 */
export const getCurrentShiftApi = async () => {
  const res = await api.get('/shifts/current/');
  return res.data;
};

/**
 * Open a new shift.
 * @param {Object} data - { opening_balance, opening_notes, handover_id }
 */
export const openShiftApi = async (data) => {
  const res = await api.post('/shifts/open/', data);
  return res.data;
};

/**
 * Fetch list of shifts with dynamic filters.
 * @param {Object} params - { user, status, start_date, end_date, discrepancy_only, my_only, search }
 */
export const getShiftsApi = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  const res = await api.get(`/shifts/${query ? `?${query}` : ''}`);
  return res.data;
};

/**
 * Fetch detailed shift audit report by ID.
 */
export const getShiftDetailsApi = async (id) => {
  const res = await api.get(`/shifts/${id}/`);
  return res.data;
};

/**
 * Close shift with cash denomination counts and discrepancy justification.
 * @param {number|string} id - Shift ID
 * @param {Object} data - { denominations: [{ denomination, quantity, unit_value }], actual_cash, closing_notes, difference_reason }
 */
export const closeShiftApi = async (id, data) => {
  const res = await api.post(`/shifts/${id}/close/`, data);
  return res.data;
};

/**
 * Record a cash expense paid from the till.
 * @param {number|string} id - Shift ID
 * @param {FormData|Object} data - { category, amount, description, receipt }
 */
export const addShiftExpenseApi = async (id, data) => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.post(`/shifts/${id}/expenses/`, data, { headers });
  return res.data;
};

/**
 * Record cash added (Float in) or removed (Float out / Drop).
 * @param {number|string} id - Shift ID
 * @param {Object} data - { adjustment_type, amount, reason, notes }
 */
export const addShiftAdjustmentApi = async (id, data) => {
  const res = await api.post(`/shifts/${id}/adjustments/`, data);
  return res.data;
};

/**
 * Manager approves shift discrepancy / pending reconciliation.
 */
export const approveShiftDiscrepancyApi = async (id, data = {}) => {
  const res = await api.post(`/shifts/${id}/approve/`, data);
  return res.data;
};

/**
 * Manager rejects shift discrepancy and sends back for recount.
 */
export const rejectShiftDiscrepancyApi = async (id, data) => {
  const res = await api.post(`/shifts/${id}/reject/`, data);
  return res.data;
};

/**
 * Manager / Admin reopens a closed shift with justification.
 */
export const reopenShiftApi = async (id, data) => {
  const res = await api.post(`/shifts/${id}/reopen/`, data);
  return res.data;
};

/**
 * Initiate cash handover to another receptionist.
 * @param {number|string} id - Shift ID
 * @param {Object} data - { to_user, amount, notes, close_from_shift }
 */
export const createShiftHandoverApi = async (id, data) => {
  const res = await api.post(`/shifts/${id}/handover/`, data);
  return res.data;
};

/**
 * Incoming receptionist accepts a pending handover.
 * @param {number|string} handoverId - Handover ID
 * @param {Object} data - Optional { cash_drawer, opening_notes }
 */
export const acceptShiftHandoverApi = async (handoverId, data = {}) => {
  const res = await api.post(`/shifts/handovers/${handoverId}/accept/`, data);
  return res.data;
};

/**
 * Incoming receptionist rejects a pending handover.
 * @param {number|string} handoverId - Handover ID
 * @param {Object} data - { reason }
 */
export const rejectShiftHandoverApi = async (handoverId, data) => {
  const res = await api.post(`/shifts/handovers/${handoverId}/reject/`, data);
  return res.data;
};

/**
 * Update a recorded petty cash expense.
 */
export const updateShiftExpenseApi = async (shiftId, expenseId, data) => {
  const isFormData = data instanceof FormData;
  const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const res = await api.patch(`/shifts/${shiftId}/expenses/${expenseId}/`, data, { headers });
  return res.data;
};

/**
 * Update a recorded cash float or drop adjustment.
 */
export const updateShiftAdjustmentApi = async (shiftId, adjustmentId, data) => {
  const res = await api.patch(`/shifts/${shiftId}/adjustments/${adjustmentId}/`, data);
  return res.data;
};

/**
 * Fetch summary dashboard stats for shifts.
 */
export const getShiftSummaryStatsApi = async () => {
  const res = await api.get('/shifts/summary_stats/');
  return res.data;
};

/**
 * Manager / Super Admin forcibly closes an abandoned or overdue shift.
 * @param {number|string} id - Shift ID
 * @param {Object} data - { reason, actual_cash }
 */
export const forceCloseShiftApi = async (id, data) => {
  const res = await api.post(`/shifts/${id}/force_close/`, data);
  return res.data;
};

/**
 * Fetch all active physical cash drawers / POS stations.
 */
export const getCashDrawersApi = async () => {
  const res = await api.get('/shifts/cash_drawers/');
  return res.data;
};

/**
 * Fetch active staff members eligible to receive shift handover in the same hotel & branch.
 */
export const getHandoverRecipientsApi = async () => {
  const res = await api.get('/shifts/handover_recipients/');
  return res.data;
};



