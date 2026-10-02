import { useState, useCallback } from 'react';
import { getStoredColumnVisibility, saveStoredColumnVisibility } from '../utils/columnPersistence';

/**
 * Custom React hook for persisting table column visibility configurations across
 * browser refreshes and page navigations in localStorage.
 *
 * @param {string} storageKey - Unique localStorage key for the table
 * @param {Object} defaultColumns - Initial/default column visibility map { [key: string]: boolean }
 * @returns {Object} { columnVisibility, setColumnVisibility, toggleColumnVisibility, resetColumnVisibility, visibleColumnCount }
 */
export const usePersistentColumns = (storageKey, defaultColumns = {}) => {
  const [columnVisibility, setColumnVisibilityState] = useState(() => {
    return getStoredColumnVisibility(storageKey, defaultColumns);
  });

  const setColumnVisibility = useCallback((updater) => {
    setColumnVisibilityState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredColumnVisibility(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const toggleColumnVisibility = useCallback((key) => {
    setColumnVisibilityState((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Prevent user from accidentally hiding all columns (at least 1 must remain visible)
      if (!Object.values(updated).some(Boolean)) {
        return prev;
      }
      saveStoredColumnVisibility(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  const resetColumnVisibility = useCallback(() => {
    const allVisible = {};
    Object.keys(defaultColumns).forEach((k) => {
      allVisible[k] = true;
    });
    setColumnVisibilityState(allVisible);
    saveStoredColumnVisibility(storageKey, allVisible);
  }, [storageKey, defaultColumns]);

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length || 1;

  return {
    columnVisibility,
    setColumnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    visibleColumnCount,
  };
};

export default usePersistentColumns;
