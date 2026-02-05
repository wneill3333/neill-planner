/**
 * Google Calendar Hooks
 *
 * Custom React hooks for Google Calendar integration.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../auth/useAuth';
import {
  checkConnectionStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  syncAllEventsToGoogle,
  syncFromGoogle,
  fetchAvailableCalendars,
  setSelectedCalendar,
  selectIsConnected,
  selectIsSyncing,
  selectLastSyncTime,
  selectSyncError,
  selectSyncProgress,
  selectAvailableCalendars,
  selectSelectedCalendarId,
  selectIsLoadingCalendars,
  clearSyncError,
} from './googleCalendarSlice';

/**
 * Main hook for Google Calendar integration
 *
 * @returns Google Calendar state and actions
 */
export function useGoogleCalendar() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const isConnected = useAppSelector(selectIsConnected);
  const isSyncing = useAppSelector(selectIsSyncing);
  const lastSyncTime = useAppSelector(selectLastSyncTime);
  const error = useAppSelector(selectSyncError);
  const syncProgress = useAppSelector(selectSyncProgress);
  const availableCalendars = useAppSelector(selectAvailableCalendars);
  const selectedCalendarId = useAppSelector(selectSelectedCalendarId);
  const isLoadingCalendars = useAppSelector(selectIsLoadingCalendars);

  // Check connection status on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(checkConnectionStatus(user.id));
    }
  }, [dispatch, user?.id]);

  const connect = useCallback(
    (clientId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return dispatch(connectGoogleCalendar({ userId: user.id, clientId }));
    },
    [dispatch, user?.id]
  );

  const disconnect = useCallback(() => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    return dispatch(disconnectGoogleCalendar(user.id));
  }, [dispatch, user?.id]);

  const syncToGoogle = useCallback(() => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    return dispatch(syncAllEventsToGoogle(user.id));
  }, [dispatch, user?.id]);

  const syncFromGoogleCalendar = useCallback(
    (startDate: Date, endDate: Date) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return dispatch(syncFromGoogle({ userId: user.id, startDate, endDate }));
    },
    [dispatch, user?.id]
  );

  const clearError = useCallback(() => {
    dispatch(clearSyncError());
  }, [dispatch]);

  const fetchCalendars = useCallback(() => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    return dispatch(fetchAvailableCalendars(user.id));
  }, [dispatch, user?.id]);

  const selectCalendar = useCallback(
    (calendarId: string | null) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return dispatch(setSelectedCalendar({ userId: user.id, calendarId }));
    },
    [dispatch, user?.id]
  );

  return {
    isConnected,
    isSyncing,
    lastSyncTime,
    error,
    syncProgress,
    availableCalendars,
    selectedCalendarId,
    isLoadingCalendars,
    connect,
    disconnect,
    syncToGoogle,
    syncFromGoogle: syncFromGoogleCalendar,
    clearError,
    fetchCalendars,
    selectCalendar,
  };
}

/**
 * Hook that triggers background sync every 5 minutes when connected
 *
 * @param enabled - Whether auto-sync is enabled (default: true)
 */
export function useAutoSync(enabled: boolean = true) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const isConnected = useAppSelector(selectIsConnected);
  const isSyncing = useAppSelector(selectIsSyncing);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(isSyncing);

  // Keep ref updated
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    // Only set up interval if connected, enabled, not currently syncing, and user is authenticated
    if (!enabled || !isConnected || isSyncing || !user?.id) {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval for auto-sync every 5 minutes
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    intervalRef.current = setInterval(() => {
      // Only sync if not already syncing (use ref to avoid stale closure)
      if (!isSyncingRef.current && user?.id) {
        dispatch(syncAllEventsToGoogle(user.id));
      }
    }, SYNC_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isConnected, isSyncing, user?.id, dispatch]);
}

/**
 * Hook to get formatted last sync time
 *
 * @returns Formatted sync time string or null
 */
export function useLastSyncTime() {
  const lastSyncTime = useAppSelector(selectLastSyncTime);

  if (!lastSyncTime) {
    return null;
  }

  const syncDate = new Date(lastSyncTime);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}
