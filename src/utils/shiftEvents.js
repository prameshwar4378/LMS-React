import queryClient from '../queryClient';

/**
 * Triggers an immediate refresh of Shift Till data across the entire application:
 * 1. Invalidates TanStack Query cache for ['shifts']
 * 2. Fires window event 'shift-till-update-needed' for instant local updates
 * 3. Updates localStorage 'lms_last_shift_update' to notify other tabs/windows
 */
export const triggerShiftRefresh = () => {
  try {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
    window.dispatchEvent(new CustomEvent('shift-till-update-needed', {
      detail: { timestamp: Date.now() }
    }));
    try {
      localStorage.setItem('lms_last_shift_update', Date.now().toString());
    } catch {
      // ignore storage access exceptions
    }
  } catch (err) {
    console.warn('triggerShiftRefresh error:', err);
  }
};
