/**
 * Google Calendar Redux Slice
 *
 * Manages state for Google Calendar integration including connection status,
 * sync operations, and credentials.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store/store';
import type { GoogleCalendarListEntry } from '../../types/googleCalendar.types';
import type { Event } from '../../types';
import {
  initializeGoogleAuth,
  requestCalendarAccess,
  disconnect as disconnectGoogle,
} from '../../services/googleCalendar';
import {
  saveCredentials,
  getCredentials,
  deleteCredentials,
  hasCredentials,
  updateSelectedCalendar,
} from '../../services/firebase/googleCalendarCredentials.service';
import { getCalendarList, setAccessToken } from '../../services/googleCalendar/googleCalendarService';
import { syncEventsToGoogle, importEventsFromGoogle } from '../../services/googleCalendar/syncService';
import { createEvent as createEventInFirestore } from '../../services/firebase/events.service';

/** Google Calendar state shape */
export interface GoogleCalendarState {
  /** Whether user has connected Google Calendar */
  isConnected: boolean;
  /** Whether a sync operation is in progress */
  isSyncing: boolean;
  /** Timestamp of last successful sync */
  lastSyncTime: string | null;
  /** Error message from last operation */
  syncError: string | null;
  /** Sync progress information */
  syncProgress: {
    total: number;
    completed: number;
    failed: number;
  } | null;
  /** Available calendars with write access */
  availableCalendars: GoogleCalendarListEntry[];
  /** Selected calendar ID (null = use 'primary') */
  selectedCalendarId: string | null;
  /** Whether calendar list is loading */
  isLoadingCalendars: boolean;
}

/** Initial state */
const initialState: GoogleCalendarState = {
  isConnected: false,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  syncProgress: null,
  availableCalendars: [],
  selectedCalendarId: null,
  isLoadingCalendars: false,
};

/**
 * Check if user has valid Google Calendar credentials
 * Also loads the selected calendar ID if credentials exist
 */
export const checkConnectionStatus = createAsyncThunk<
  { isConnected: boolean; selectedCalendarId: string | null },
  string, // userId
  { state: RootState }
>('googleCalendar/checkConnectionStatus', async (userId) => {
  try {
    const hasCredentialsStored = await hasCredentials(userId);
    if (!hasCredentialsStored) {
      return { isConnected: false, selectedCalendarId: null };
    }

    // Get credentials to check expiration
    const credentials = await getCredentials(userId);
    if (!credentials) {
      return { isConnected: false, selectedCalendarId: null };
    }

    // Check if credentials are expired
    const now = new Date();
    const isExpired = credentials.expiresAt <= now;
    return {
      isConnected: !isExpired,
      selectedCalendarId: credentials.selectedCalendarId,
    };
  } catch (error) {
    console.error('Failed to check connection status:', error);
    return { isConnected: false, selectedCalendarId: null };
  }
});

/**
 * Fetch available calendars from Google Calendar API
 */
export const fetchAvailableCalendars = createAsyncThunk<
  GoogleCalendarListEntry[],
  string, // userId
  { state: RootState }
>('googleCalendar/fetchAvailableCalendars', async (userId, { rejectWithValue }) => {
  try {
    const credentials = await getCredentials(userId);
    if (!credentials) {
      return rejectWithValue('Not connected to Google Calendar');
    }

    // Set access token for API calls
    setAccessToken(credentials.accessToken, credentials.expiresAt);

    // Fetch calendar list
    const calendars = await getCalendarList();
    return calendars;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch calendars';
    return rejectWithValue(message);
  }
});

/**
 * Set the selected calendar for sync
 */
export const setSelectedCalendar = createAsyncThunk<
  string | null,
  { userId: string; calendarId: string | null },
  { state: RootState }
>('googleCalendar/setSelectedCalendar', async ({ userId, calendarId }, { rejectWithValue }) => {
  try {
    await updateSelectedCalendar(userId, calendarId);
    return calendarId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update calendar selection';
    return rejectWithValue(message);
  }
});

/**
 * Connect Google Calendar by requesting OAuth access
 */
export const connectGoogleCalendar = createAsyncThunk<
  void,
  { userId: string; clientId: string },
  { state: RootState }
>('googleCalendar/connect', async ({ userId, clientId }, { rejectWithValue }) => {
  try {
    // Initialize Google auth
    initializeGoogleAuth(clientId);

    // Request access
    const credentials = await requestCalendarAccess();

    // Save credentials to Firestore
    await saveCredentials(userId, credentials);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect';
    return rejectWithValue(message);
  }
});

/**
 * Disconnect Google Calendar by deleting credentials
 */
export const disconnectGoogleCalendar = createAsyncThunk<
  void,
  string, // userId
  { state: RootState }
>('googleCalendar/disconnect', async (userId, { rejectWithValue }) => {
  try {
    // Revoke access token
    await disconnectGoogle();

    // Delete credentials from Firestore
    await deleteCredentials(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect';
    return rejectWithValue(message);
  }
});

/**
 * Sync all events to Google Calendar
 */
export const syncAllEventsToGoogle = createAsyncThunk<
  { synced: number; failed: number },
  string, // userId
  { state: RootState }
>('googleCalendar/syncToGoogle', async (userId, { getState, rejectWithValue, dispatch }) => {
  try {
    // Get credentials (includes selectedCalendarId)
    const credentials = await getCredentials(userId);
    if (!credentials) {
      return rejectWithValue('Not connected to Google Calendar');
    }

    // Convert events object to array
    const { events } = getState();
    const eventArray = Object.values(events.events);
    const total = eventArray.length;

    // Update progress
    dispatch(googleCalendarSlice.actions.setSyncProgress({ total, completed: 0, failed: 0 }));

    // Sync events to selected calendar (or 'primary' if not set)
    const result = await syncEventsToGoogle(eventArray, credentials, credentials.selectedCalendarId);

    return {
      synced: result.synced,
      failed: result.failed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync';
    return rejectWithValue(message);
  }
});

/**
 * Import events from Google Calendar
 *
 * Fetches events from Google Calendar, saves them to Firestore,
 * and returns the created events.
 */
export const syncFromGoogle = createAsyncThunk<
  Event[], // Array of created events
  { userId: string; startDate: Date; endDate: Date },
  { state: RootState }
>('googleCalendar/syncFromGoogle', async ({ userId, startDate, endDate }, { rejectWithValue, getState }) => {
  try {
    // Get credentials (includes selectedCalendarId)
    const credentials = await getCredentials(userId);
    if (!credentials) {
      return rejectWithValue('Not connected to Google Calendar');
    }

    // Import events from selected calendar (or 'primary' if not set)
    const importedEventData = await importEventsFromGoogle(
      userId,
      startDate,
      endDate,
      credentials,
      credentials.selectedCalendarId
    );

    if (importedEventData.length === 0) {
      return [];
    }

    // Get existing events to check for duplicates (by googleCalendarId)
    const { events } = getState();
    const existingGoogleIds = new Set(
      Object.values(events.events)
        .filter(e => e.googleCalendarId)
        .map(e => e.googleCalendarId)
    );

    // Filter out events that already exist locally
    const newEventsData = importedEventData.filter(
      e => e.googleCalendarId && !existingGoogleIds.has(e.googleCalendarId)
    );

    // Save new events to Firestore
    const createdEvents: Event[] = [];
    for (const eventData of newEventsData) {
      try {
        const createdEvent = await createEventInFirestore(
          {
            title: eventData.title,
            description: eventData.description,
            categoryId: eventData.categoryId,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            location: eventData.location,
            isConfidential: eventData.isConfidential,
            alternateTitle: eventData.alternateTitle,
            recurrence: eventData.recurrence,
            googleCalendarId: eventData.googleCalendarId,
          },
          userId
        );
        createdEvents.push(createdEvent);
      } catch (error) {
        console.error('Failed to save imported event:', eventData.title, error);
        // Continue with other events
      }
    }

    return createdEvents;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import';
    return rejectWithValue(message);
  }
});

/**
 * Google Calendar slice
 */
export const googleCalendarSlice = createSlice({
  name: 'googleCalendar',
  initialState,
  reducers: {
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.syncError = action.payload;
    },
    clearSyncError: (state) => {
      state.syncError = null;
    },
    setSyncProgress: (
      state,
      action: PayloadAction<{ total: number; completed: number; failed: number }>
    ) => {
      state.syncProgress = action.payload;
    },
    clearSyncProgress: (state) => {
      state.syncProgress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check connection status
      .addCase(checkConnectionStatus.fulfilled, (state, action) => {
        state.isConnected = action.payload.isConnected;
        state.selectedCalendarId = action.payload.selectedCalendarId;
      })
      // Fetch available calendars
      .addCase(fetchAvailableCalendars.pending, (state) => {
        state.isLoadingCalendars = true;
      })
      .addCase(fetchAvailableCalendars.fulfilled, (state, action) => {
        state.availableCalendars = action.payload;
        state.isLoadingCalendars = false;
      })
      .addCase(fetchAvailableCalendars.rejected, (state, action) => {
        state.isLoadingCalendars = false;
        state.syncError = typeof action.payload === 'string' ? action.payload : 'Failed to fetch calendars';
      })
      // Set selected calendar
      .addCase(setSelectedCalendar.fulfilled, (state, action) => {
        state.selectedCalendarId = action.payload;
      })
      .addCase(setSelectedCalendar.rejected, (state, action) => {
        state.syncError = typeof action.payload === 'string' ? action.payload : 'Failed to set calendar';
      })
      // Connect
      .addCase(connectGoogleCalendar.pending, (state) => {
        state.syncError = null;
      })
      .addCase(connectGoogleCalendar.fulfilled, (state) => {
        state.isConnected = true;
        state.syncError = null;
      })
      .addCase(connectGoogleCalendar.rejected, (state, action) => {
        state.isConnected = false;
        state.syncError = typeof action.payload === 'string' ? action.payload : 'Failed to connect';
      })
      // Disconnect
      .addCase(disconnectGoogleCalendar.pending, (state) => {
        state.syncError = null;
      })
      .addCase(disconnectGoogleCalendar.fulfilled, (state) => {
        state.isConnected = false;
        state.lastSyncTime = null;
        state.syncError = null;
        state.syncProgress = null;
        state.availableCalendars = [];
        state.selectedCalendarId = null;
      })
      .addCase(disconnectGoogleCalendar.rejected, (state, action) => {
        state.syncError = typeof action.payload === 'string' ? action.payload : 'Failed to disconnect';
      })
      // Sync to Google
      .addCase(syncAllEventsToGoogle.pending, (state) => {
        state.isSyncing = true;
        state.syncError = null;
      })
      .addCase(syncAllEventsToGoogle.fulfilled, (state) => {
        state.isSyncing = false;
        state.lastSyncTime = new Date().toISOString();
        state.syncError = null;
        state.syncProgress = null;
      })
      .addCase(syncAllEventsToGoogle.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncError = typeof action.payload === 'string' ? action.payload : 'Failed to sync';
        state.syncProgress = null;
      })
      // Sync from Google
      .addCase(syncFromGoogle.pending, (state) => {
        state.isSyncing = true;
        state.syncError = null;
      })
      .addCase(syncFromGoogle.fulfilled, (state) => {
        state.isSyncing = false;
        state.lastSyncTime = new Date().toISOString();
        state.syncError = null;
      })
      .addCase(syncFromGoogle.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncError = typeof action.payload === 'string' ? action.payload : 'Failed to import';
      });
  },
});

export const { setSyncing, setSyncError, clearSyncError, setSyncProgress, clearSyncProgress } =
  googleCalendarSlice.actions;

/** Selectors */
export const selectIsConnected = (state: RootState) => state.googleCalendar.isConnected;
export const selectIsSyncing = (state: RootState) => state.googleCalendar.isSyncing;
export const selectLastSyncTime = (state: RootState) => state.googleCalendar.lastSyncTime;
export const selectSyncError = (state: RootState) => state.googleCalendar.syncError;
export const selectSyncProgress = (state: RootState) => state.googleCalendar.syncProgress;
export const selectAvailableCalendars = (state: RootState) => state.googleCalendar.availableCalendars;
export const selectSelectedCalendarId = (state: RootState) => state.googleCalendar.selectedCalendarId;
export const selectIsLoadingCalendars = (state: RootState) => state.googleCalendar.isLoadingCalendars;

export default googleCalendarSlice.reducer;
