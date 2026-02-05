/**
 * Google Calendar Settings Component
 *
 * Allows users to connect/disconnect Google Calendar and manage sync settings.
 */

import { useEffect } from 'react';
import { useGoogleCalendar, useLastSyncTime } from '../../features/googleCalendar/hooks';
import { Button } from '../common/Button';
import { Loader2, CheckCircle2, XCircle, Calendar, ChevronDown } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Google Calendar Settings Component
 */
export function GoogleCalendarSettings() {
  const {
    isConnected,
    isSyncing,
    error,
    syncProgress,
    availableCalendars,
    selectedCalendarId,
    isLoadingCalendars,
    connect,
    disconnect,
    syncToGoogle,
    clearError,
    fetchCalendars,
    selectCalendar,
  } = useGoogleCalendar();

  // Fetch available calendars when connected
  useEffect(() => {
    if (isConnected && availableCalendars.length === 0 && !isLoadingCalendars) {
      fetchCalendars();
    }
  }, [isConnected, availableCalendars.length, isLoadingCalendars, fetchCalendars]);

  const lastSyncTime = useLastSyncTime();

  const handleConnect = async () => {
    try {
      await connect(GOOGLE_CLIENT_ID);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleSync = async () => {
    try {
      await syncToGoogle();
    } catch (err) {
      console.error('Failed to sync:', err);
    }
  };

  const handleCalendarChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const calendarId = e.target.value || null;
    try {
      await selectCalendar(calendarId);
    } catch (err) {
      console.error('Failed to change calendar:', err);
    }
  };

  // Get the display name for the currently selected calendar
  const getSelectedCalendarName = () => {
    if (!selectedCalendarId) {
      const primary = availableCalendars.find((c) => c.primary);
      return primary ? `${primary.summary} (Primary)` : 'Primary Calendar';
    }
    const selected = availableCalendars.find((c) => c.id === selectedCalendarId);
    return selected ? selected.summary : 'Selected Calendar';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Google Calendar</h3>
            <p className="text-sm text-muted-foreground">
              Sync your events with Google Calendar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-800">{error}</span>
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isConnected && lastSyncTime && (
        <p className="text-sm text-muted-foreground">
          Last synced: {lastSyncTime}
        </p>
      )}

      {isConnected && (
        <div className="space-y-2">
          <label htmlFor="calendar-select" className="block text-sm font-medium">
            Sync to Calendar
          </label>
          {isLoadingCalendars ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading calendars...
            </div>
          ) : availableCalendars.length > 0 ? (
            <div className="relative">
              <select
                id="calendar-select"
                value={selectedCalendarId || availableCalendars.find((c) => c.primary)?.id || availableCalendars[0]?.id || ''}
                onChange={handleCalendarChange}
                disabled={isSyncing}
                className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {availableCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary}
                    {calendar.primary ? ' (Primary)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No writable calendars found.{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => fetchCalendars()}
              >
                Refresh
              </button>
            </p>
          )}
          {availableCalendars.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Events will sync to: {getSelectedCalendarName()}
            </p>
          )}
        </div>
      )}

      {isSyncing && syncProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Syncing events...</span>
            <span>
              {syncProgress.completed} / {syncProgress.total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${syncProgress.total > 0 ? (syncProgress.completed / syncProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
          {syncProgress.failed > 0 && (
            <p className="text-sm text-amber-600">
              {syncProgress.failed} event{syncProgress.failed > 1 ? 's' : ''} failed to sync
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={handleConnect} disabled={isSyncing}>
            Connect Google Calendar
          </Button>
        ) : (
          <>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>
            <Button variant="secondary" onClick={handleDisconnect} disabled={isSyncing}>
              Disconnect
            </Button>
          </>
        )}
      </div>

      {!GOOGLE_CLIENT_ID && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your environment
            variables.
          </p>
        </div>
      )}
    </div>
  );
}
