/**
 * Sync Status Indicator Component
 *
 * Shows Google Calendar sync status in the header.
 */

import { useAppSelector } from '../../store/hooks';
import {
  selectIsConnected,
  selectIsSyncing,
  selectSyncError,
} from '../../features/googleCalendar/googleCalendarSlice';
import { useLastSyncTime } from '../../features/googleCalendar/hooks';
import { CheckCircle2, Loader2, AlertCircle, CloudOff } from 'lucide-react';

/**
 * Sync Status Indicator Component
 */
export function SyncStatusIndicator() {
  const isConnected = useAppSelector(selectIsConnected);
  const isSyncing = useAppSelector(selectIsSyncing);
  const syncError = useAppSelector(selectSyncError);
  const lastSyncTime = useLastSyncTime();

  if (!isConnected) {
    return (
      <div className="relative group">
        <CloudOff className="h-5 w-5 text-gray-400" aria-label="Google Calendar not connected" />
        <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
          Google Calendar not connected
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="relative group">
        <AlertCircle className="h-5 w-5 text-amber-500" aria-label="Sync error" />
        <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
          Sync error: {syncError}
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="relative group">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" aria-label="Syncing" />
        <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
          Syncing with Google Calendar...
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Synced" />
      <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
        <p>Google Calendar synced</p>
        {lastSyncTime && <p className="text-xs">Last sync: {lastSyncTime}</p>}
      </div>
    </div>
  );
}
