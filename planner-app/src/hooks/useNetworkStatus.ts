/**
 * useNetworkStatus Hook
 *
 * Custom hook to monitor network connectivity status and update Redux state.
 * Listens to browser online/offline events and synchronizes with the sync slice.
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setOnlineStatus, selectIsOnline, selectSyncStatus } from '../features/sync/syncSlice';
import type { SyncStatus } from '../types/common.types';

// =============================================================================
// Types
// =============================================================================

export interface NetworkStatus {
  /** Whether the app is currently online */
  isOnline: boolean;
  /** Current sync status */
  syncStatus: SyncStatus;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useNetworkStatus - Monitor network connectivity
 *
 * Features:
 * - Monitors navigator.onLine status
 * - Listens to online/offline browser events
 * - Updates Redux sync state automatically
 * - Returns current online status and sync status
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, syncStatus } = useNetworkStatus();
 *
 *   return (
 *     <div>
 *       {isOnline ? 'Connected' : 'Offline'}
 *       {syncStatus === 'syncing' && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const syncStatus = useAppSelector(selectSyncStatus);

  useEffect(() => {
    // Update initial online status
    const currentOnlineStatus = navigator.onLine;
    dispatch(setOnlineStatus(currentOnlineStatus));

    // Event handlers for online/offline events
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return {
    isOnline,
    syncStatus,
  };
}

export default useNetworkStatus;
