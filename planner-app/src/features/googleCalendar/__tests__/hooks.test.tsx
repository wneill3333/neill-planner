/**
 * Google Calendar Hooks Tests
 *
 * Tests for useGoogleCalendar, useAutoSync, and useLastSyncTime hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { useGoogleCalendar, useAutoSync, useLastSyncTime } from '../hooks';
import googleCalendarReducer from '../googleCalendarSlice';
import { AuthContext, type AuthContextType } from '../../auth';
import type { User } from '../../../types';

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

import * as credentialsService from '../../../services/firebase/googleCalendarCredentials.service';

const mockHasCredentials = vi.mocked(credentialsService.hasCredentials);

// =============================================================================
// Test Helpers
// =============================================================================

const mockUser: User = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
};

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      googleCalendar: googleCalendarReducer,
      events: (state = { events: {} }) => state,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

function createWrapper(
  store: ReturnType<typeof createTestStore>,
  user: User | null = mockUser
) {
  const authValue: AuthContextType = {
    user,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <Provider store={store}>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </Provider>
    );
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useGoogleCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasCredentials.mockResolvedValue(false);
  });

  it('should return initial state', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncTime).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.syncProgress).toBeNull();
  });

  it('should check connection status on mount', async () => {
    mockHasCredentials.mockResolvedValue(true);

    const store = createTestStore();
    const wrapper = createWrapper(store);
    renderHook(() => useGoogleCalendar(), { wrapper });

    await waitFor(() => {
      expect(mockHasCredentials).toHaveBeenCalledWith('test-user-123');
    });
  });

  it('should not check connection status when user is null', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store, null);
    renderHook(() => useGoogleCalendar(), { wrapper });

    expect(mockHasCredentials).not.toHaveBeenCalled();
  });

  it('should provide connect function', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(result.current.connect).toBeInstanceOf(Function);
  });

  it('should provide disconnect function', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(result.current.disconnect).toBeInstanceOf(Function);
  });

  it('should provide syncToGoogle function', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(result.current.syncToGoogle).toBeInstanceOf(Function);
  });

  it('should provide syncFromGoogle function', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(result.current.syncFromGoogle).toBeInstanceOf(Function);
  });

  it('should provide clearError function', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(result.current.clearError).toBeInstanceOf(Function);
  });

  it('should throw error when connecting without user', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store, null);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(() => result.current.connect('client-id')).toThrow('User not authenticated');
  });

  it('should throw error when disconnecting without user', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store, null);
    const { result } = renderHook(() => useGoogleCalendar(), { wrapper });

    expect(() => result.current.disconnect()).toThrow('User not authenticated');
  });
});

describe('useAutoSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not set up interval when not connected', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    renderHook(() => useAutoSync(true), { wrapper });

    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

    // No sync should have been triggered
    const state = store.getState().googleCalendar;
    expect(state.isSyncing).toBe(false);
  });

  it('should not set up interval when disabled', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const wrapper = createWrapper(store);
    renderHook(() => useAutoSync(false), { wrapper });

    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

    // No sync should have been triggered
    const state = store.getState().googleCalendar;
    expect(state.isSyncing).toBe(false);
  });

  it('should not set up interval when user is null', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const wrapper = createWrapper(store, null);
    renderHook(() => useAutoSync(true), { wrapper });

    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

    // No sync should have been triggered
    const state = store.getState().googleCalendar;
    expect(state.isSyncing).toBe(false);
  });
});

describe('useLastSyncTime', () => {
  it('should return null when no sync has occurred', () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useLastSyncTime(), { wrapper });

    expect(result.current).toBeNull();
  });

  it('should return "Just now" for recent sync', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useLastSyncTime(), { wrapper });

    expect(result.current).toBe('Just now');
  });

  it('should return minutes for sync less than 1 hour ago', () => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: fifteenMinutesAgo.toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useLastSyncTime(), { wrapper });

    expect(result.current).toMatch(/^\d+ minutes? ago$/);
  });

  it('should return hours for sync less than 1 day ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: twoHoursAgo.toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useLastSyncTime(), { wrapper });

    expect(result.current).toMatch(/^\d+ hours? ago$/);
  });

  it('should return days for sync more than 1 day ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: threeDaysAgo.toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useLastSyncTime(), { wrapper });

    expect(result.current).toMatch(/^\d+ days? ago$/);
  });
});
