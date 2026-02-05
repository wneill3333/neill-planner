/**
 * Google Calendar Slice Tests
 *
 * Tests for Google Calendar Redux slice, actions, and reducers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import googleCalendarReducer, {
  googleCalendarSlice,
  checkConnectionStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  syncAllEventsToGoogle,
  syncFromGoogle,
  selectIsConnected,
  selectIsSyncing,
  selectLastSyncTime,
  selectSyncError,
  selectSyncProgress,
  clearSyncError,
  setSyncProgress,
  type GoogleCalendarState,
} from '../googleCalendarSlice';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../../services/googleCalendar', () => ({
  initializeGoogleAuth: vi.fn(),
  requestCalendarAccess: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('../../../services/firebase/googleCalendarCredentials.service', () => ({
  saveCredentials: vi.fn(),
  getCredentials: vi.fn(),
  deleteCredentials: vi.fn(),
  hasCredentials: vi.fn(),
}));

vi.mock('../../../services/googleCalendar/syncService', () => ({
  syncEventsToGoogle: vi.fn(),
  importEventsFromGoogle: vi.fn(),
}));

import * as googleCalendarService from '../../../services/googleCalendar';
import * as credentialsService from '../../../services/firebase/googleCalendarCredentials.service';
import * as syncService from '../../../services/googleCalendar/syncService';

const mockInitializeGoogleAuth = vi.mocked(googleCalendarService.initializeGoogleAuth);
const mockRequestCalendarAccess = vi.mocked(googleCalendarService.requestCalendarAccess);
const mockDisconnect = vi.mocked(googleCalendarService.disconnect);
const mockSaveCredentials = vi.mocked(credentialsService.saveCredentials);
const mockGetCredentials = vi.mocked(credentialsService.getCredentials);
const mockDeleteCredentials = vi.mocked(credentialsService.deleteCredentials);
const mockHasCredentials = vi.mocked(credentialsService.hasCredentials);
const mockSyncEventsToGoogle = vi.mocked(syncService.syncEventsToGoogle);
const mockImportEventsFromGoogle = vi.mocked(syncService.importEventsFromGoogle);

// =============================================================================
// Test Helpers
// =============================================================================

function createTestStore(preloadedState: Partial<{ googleCalendar: GoogleCalendarState }> = {}) {
  return configureStore({
    reducer: {
      googleCalendar: googleCalendarReducer,
      events: (state = { events: {} }) => state,
    },
    preloadedState,
  });
}

const mockCredentials = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  scope: 'https://www.googleapis.com/auth/calendar',
  updatedAt: new Date(),
};

// =============================================================================
// Tests
// =============================================================================

describe('googleCalendarSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = googleCalendarSlice.reducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        isConnected: false,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
        availableCalendars: [],
        selectedCalendarId: null,
        isLoadingCalendars: false,
      });
    });
  });

  describe('reducers', () => {
    it('should handle clearSyncError', () => {
      const initialState: GoogleCalendarState = {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: 'Test error',
        syncProgress: null,
        availableCalendars: [],
        selectedCalendarId: null,
        isLoadingCalendars: false,
      };
      const state = googleCalendarSlice.reducer(initialState, clearSyncError());
      expect(state.syncError).toBeNull();
    });

    it('should handle setSyncProgress', () => {
      const initialState: GoogleCalendarState = {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
        availableCalendars: [],
        selectedCalendarId: null,
        isLoadingCalendars: false,
      };
      const progress = { total: 10, completed: 5, failed: 1 };
      const state = googleCalendarSlice.reducer(initialState, setSyncProgress(progress));
      expect(state.syncProgress).toEqual(progress);
    });
  });

  describe('selectors', () => {
    it('should select isConnected', () => {
      const state = {
        googleCalendar: {
          isConnected: true,
          isSyncing: false,
          lastSyncTime: null,
          syncError: null,
          syncProgress: null,
        },
      };
      expect(selectIsConnected(state as any)).toBe(true);
    });

    it('should select isSyncing', () => {
      const state = {
        googleCalendar: {
          isConnected: true,
          isSyncing: true,
          lastSyncTime: null,
          syncError: null,
          syncProgress: null,
        },
      };
      expect(selectIsSyncing(state as any)).toBe(true);
    });

    it('should select lastSyncTime', () => {
      const syncTime = '2024-01-01T00:00:00Z';
      const state = {
        googleCalendar: {
          isConnected: true,
          isSyncing: false,
          lastSyncTime: syncTime,
          syncError: null,
          syncProgress: null,
        },
      };
      expect(selectLastSyncTime(state as any)).toBe(syncTime);
    });

    it('should select syncError', () => {
      const error = 'Test error';
      const state = {
        googleCalendar: {
          isConnected: true,
          isSyncing: false,
          lastSyncTime: null,
          syncError: error,
          syncProgress: null,
        },
      };
      expect(selectSyncError(state as any)).toBe(error);
    });

    it('should select syncProgress', () => {
      const progress = { total: 10, completed: 5, failed: 1 };
      const state = {
        googleCalendar: {
          isConnected: true,
          isSyncing: true,
          lastSyncTime: null,
          syncError: null,
          syncProgress: progress,
        },
      };
      expect(selectSyncProgress(state as any)).toEqual(progress);
    });
  });

  describe('checkConnectionStatus thunk', () => {
    it('should set isConnected to true when credentials exist and are valid', async () => {
      mockHasCredentials.mockResolvedValue(true);
      mockGetCredentials.mockResolvedValue(mockCredentials);

      const store = createTestStore();
      await store.dispatch(checkConnectionStatus('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(true);
    });

    it('should set isConnected to false when credentials do not exist', async () => {
      mockHasCredentials.mockResolvedValue(false);

      const store = createTestStore();
      await store.dispatch(checkConnectionStatus('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(false);
    });

    it('should set isConnected to false when credentials are expired', async () => {
      mockHasCredentials.mockResolvedValue(true);
      mockGetCredentials.mockResolvedValue({
        ...mockCredentials,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      const store = createTestStore();
      await store.dispatch(checkConnectionStatus('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(false);
    });

    it('should handle errors and return false', async () => {
      mockHasCredentials.mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const store = createTestStore();
      await store.dispatch(checkConnectionStatus('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('connectGoogleCalendar thunk', () => {
    it('should connect and save credentials on success', async () => {
      mockInitializeGoogleAuth.mockImplementation(() => {});
      mockRequestCalendarAccess.mockResolvedValue(mockCredentials);
      mockSaveCredentials.mockResolvedValue();

      const store = createTestStore();
      await store.dispatch(connectGoogleCalendar({ userId: 'user-123', clientId: 'client-123' }));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(true);
      expect(state.syncError).toBeNull();
      expect(mockInitializeGoogleAuth).toHaveBeenCalledWith('client-123');
      expect(mockSaveCredentials).toHaveBeenCalledWith('user-123', mockCredentials);
    });

    it('should handle connection errors', async () => {
      const error = new Error('OAuth error');
      mockInitializeGoogleAuth.mockImplementation(() => {});
      mockRequestCalendarAccess.mockRejectedValue(error);

      const store = createTestStore();
      await store.dispatch(connectGoogleCalendar({ userId: 'user-123', clientId: 'client-123' }));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(false);
      expect(state.syncError).toBe('OAuth error');
    });
  });

  describe('disconnectGoogleCalendar thunk', () => {
    it('should disconnect and clear credentials on success', async () => {
      mockDisconnect.mockResolvedValue();
      mockDeleteCredentials.mockResolvedValue();

      const store = createTestStore({
        googleCalendar: {
          isConnected: true,
          isSyncing: false,
          lastSyncTime: '2024-01-01T00:00:00Z',
          syncError: null,
          syncProgress: null,
        },
      });

      await store.dispatch(disconnectGoogleCalendar('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isConnected).toBe(false);
      expect(state.lastSyncTime).toBeNull();
      expect(state.syncError).toBeNull();
      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockDeleteCredentials).toHaveBeenCalledWith('user-123');
    });

    it('should handle disconnection errors', async () => {
      const error = new Error('Delete error');
      mockDisconnect.mockResolvedValue();
      mockDeleteCredentials.mockRejectedValue(error);

      const store = createTestStore({
        googleCalendar: {
          isConnected: true,
          isSyncing: false,
          lastSyncTime: null,
          syncError: null,
          syncProgress: null,
        },
      });

      await store.dispatch(disconnectGoogleCalendar('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.syncError).toBe('Delete error');
    });
  });

  describe('syncAllEventsToGoogle thunk', () => {
    it('should sync events successfully', async () => {
      mockGetCredentials.mockResolvedValue(mockCredentials);
      mockSyncEventsToGoogle.mockResolvedValue({ synced: 8, failed: 2 });

      const store = createTestStore();
      await store.dispatch(syncAllEventsToGoogle('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncTime).not.toBeNull();
      expect(state.syncError).toBeNull();
    });

    it('should handle sync errors', async () => {
      mockGetCredentials.mockResolvedValue(mockCredentials);
      mockSyncEventsToGoogle.mockRejectedValue(new Error('Sync failed'));

      const store = createTestStore();
      await store.dispatch(syncAllEventsToGoogle('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe('Sync failed');
    });

    it('should handle missing credentials', async () => {
      mockGetCredentials.mockResolvedValue(null);

      const store = createTestStore();
      await store.dispatch(syncAllEventsToGoogle('user-123'));

      const state = store.getState().googleCalendar;
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe('Not connected to Google Calendar');
    });
  });

  describe('syncFromGoogle thunk', () => {
    it('should import events successfully', async () => {
      mockGetCredentials.mockResolvedValue(mockCredentials);
      mockImportEventsFromGoogle.mockResolvedValue([
        { id: 'event-1', summary: 'Event 1' },
        { id: 'event-2', summary: 'Event 2' },
      ] as any);

      const store = createTestStore();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await store.dispatch(syncFromGoogle({ userId: 'user-123', startDate, endDate }));

      const state = store.getState().googleCalendar;
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncTime).not.toBeNull();
      expect(state.syncError).toBeNull();
    });

    it('should handle import errors', async () => {
      mockGetCredentials.mockResolvedValue(mockCredentials);
      mockImportEventsFromGoogle.mockRejectedValue(new Error('Import failed'));

      const store = createTestStore();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await store.dispatch(syncFromGoogle({ userId: 'user-123', startDate, endDate }));

      const state = store.getState().googleCalendar;
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe('Import failed');
    });

    it('should handle missing credentials', async () => {
      mockGetCredentials.mockResolvedValue(null);

      const store = createTestStore();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await store.dispatch(syncFromGoogle({ userId: 'user-123', startDate, endDate }));

      const state = store.getState().googleCalendar;
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe('Not connected to Google Calendar');
    });
  });
});
