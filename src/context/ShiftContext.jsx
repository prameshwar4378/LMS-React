import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getCurrentShiftApi } from '../api/shiftApi';
import OpenShiftModal from '../components/OpenShiftModal';

const ShiftContext = createContext(null);

export const ShiftProvider = ({ children }) => {
  const { user, isShiftWise, isSingleOwner, selectedProperty } = useAuth();
  const queryClient = useQueryClient();
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);

  // Property ID for query key cache invalidation
  const propertyId = selectedProperty?.id || user?.property || user?.property_id;

  const {
    data: shiftData = null,
    isLoading: isLoadingShift,
    refetch: refetchShift
  } = useQuery({
    queryKey: ['shifts', 'current', propertyId],
    queryFn: getCurrentShiftApi,
    staleTime: 5 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: Boolean(user),
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  });

  // Listen to immediate till update events across the entire window and other browser tabs
  useEffect(() => {
    const handleShiftTillUpdate = () => {
      refetchShift();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'lms_last_shift_update') {
        refetchShift();
      }
    };

    window.addEventListener('shift-till-update-needed', handleShiftTillUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleShiftTillUpdate);

    return () => {
      window.removeEventListener('shift-till-update-needed', handleShiftTillUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleShiftTillUpdate);
    };
  }, [refetchShift]);

  const isServerShiftWise = shiftData?.is_shift_wise ?? isShiftWise;
  const isServerSingleOwner = shiftData?.operation_mode === 'SINGLE_OWNER' || isSingleOwner;
  const hasActiveShift = Boolean(shiftData?.has_active_shift);
  const activeShift = shiftData?.shift || null;

  const openShiftModal = useCallback(() => {
    if (hasActiveShift) return;
    setIsOpenShiftModalOpen(true);
  }, [hasActiveShift]);

  const closeShiftModal = useCallback(() => {
    setIsOpenShiftModalOpen(false);
  }, []);

  const handleShiftOpened = useCallback((newShift) => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['currentShift'] });
    queryClient.invalidateQueries({ queryKey: ['current-shift'] });
    queryClient.invalidateQueries({ queryKey: ['report'] });
    refetchShift();
  }, [queryClient, refetchShift]);

  const value = {
    shiftData,
    hasActiveShift,
    activeShift,
    isShiftWise: isServerShiftWise,
    isSingleOwner: isServerSingleOwner,
    isLoadingShift,
    isOpenShiftModalOpen: isOpenShiftModalOpen && !hasActiveShift,
    openShiftModal,
    closeShiftModal,
    refetchShift,
    // Whether this user/property strictly requires an open shift till for operations
    requiresActiveShift: Boolean(isServerShiftWise && !isServerSingleOwner && !hasActiveShift)
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
      {!hasActiveShift && !isServerSingleOwner && (
        <OpenShiftModal
          isOpen={isOpenShiftModalOpen && !hasActiveShift}
          onClose={closeShiftModal}
          onSuccess={handleShiftOpened}
          initialSuggestedBalance={shiftData?.suggested_opening_balance || 0}
          pendingHandovers={shiftData?.pending_handovers || []}
        />
      )}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    return {
      shiftData: null,
      hasActiveShift: true,
      activeShift: null,
      isShiftWise: false,
      isSingleOwner: true,
      isLoadingShift: false,
      isOpenShiftModalOpen: false,
      openShiftModal: () => {},
      closeShiftModal: () => {},
      refetchShift: () => {},
      requiresActiveShift: false,
    };
  }
  return context;
};

export default ShiftContext;
