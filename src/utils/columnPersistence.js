/**
 * Utility for persisting table column visibility configurations in browser localStorage.
 */

/**
 * Retrieve saved column visibility map from localStorage merged with defaults.
 *
 * @param {string} storageKey - Unique localStorage key
 * @param {Object} defaultColumns - Default column mapping { [key: string]: boolean }
 * @returns {Object}
 */
export const getStoredColumnVisibility = (storageKey, defaultColumns = {}) => {
  if (!storageKey || typeof window === 'undefined') return defaultColumns;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Merge with defaultColumns so newly introduced columns remain visible by default
        return { ...defaultColumns, ...parsed };
      }
    }
  } catch (err) {
    console.error(`Failed to load column visibility for "${storageKey}":`, err);
  }
  return defaultColumns;
};

/**
 * Save column visibility map to localStorage.
 *
 * @param {string} storageKey - Unique localStorage key
 * @param {Object} visibility - Column visibility mapping
 */
export const saveStoredColumnVisibility = (storageKey, visibility) => {
  if (!storageKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(visibility));
  } catch (err) {
    console.error(`Failed to persist column visibility for "${storageKey}":`, err);
  }
};

/**
 * Remove saved column visibility from localStorage.
 *
 * @param {string} storageKey - Unique localStorage key
 */
export const removeStoredColumnVisibility = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey);
  } catch (err) {
    console.error(`Failed to clear column visibility for "${storageKey}":`, err);
  }
};
