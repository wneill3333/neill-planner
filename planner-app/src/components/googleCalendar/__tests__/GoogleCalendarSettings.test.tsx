/**
 * GoogleCalendarSettings Component Tests
 *
 * Tests for the Google Calendar settings UI component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { GoogleCalendarSettings } from '../GoogleCalendarSettings';
import googleCalendarReducer from '../../../features/googleCalendar/googleCalendarSlice';
import { AuthContext, type AuthContextType } from '../../../features/auth';
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

import * as googleCalendarService from '../../../services/googleCalendar';
import * as credentialsService from '../../../services/firebase/googleCalendarCredentials.service';

const mockRequestCalendarAccess = vi.mocked(googleCalendarService.requestCalendarAccess);
const mockSaveCredentials = vi.mocked(credentialsService.saveCredentials);

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

function renderComponent(store: ReturnType<typeof createTestStore>, user: User | null = mockUser) {
  const authValue: AuthContextType = {
    user,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };

  return render(
    <Provider store={store}>
      <AuthContext.Provider value={authValue}>
        <GoogleCalendarSettings />
      </AuthContext.Provider>
    </Provider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('GoogleCalendarSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    const store = createTestStore();
    renderComponent(store);

    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Sync your events with Google Calendar')).toBeInTheDocument();
  });

  it('should show "Not Connected" status when not connected', () => {
    const store = createTestStore();
    renderComponent(store);

    expect(screen.getByText('Not Connected')).toBeInTheDocument();
  });

  it('should show "Connected" status when connected', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    renderComponent(store);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show "Connect Google Calendar" button when not connected', () => {
    const store = createTestStore();
    renderComponent(store);

    expect(screen.getByText('Connect Google Calendar')).toBeInTheDocument();
  });

  it('should show "Sync Now" and "Disconnect" buttons when connected', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    renderComponent(store);

    expect(screen.getByText('Sync Now')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('should show last sync time when available', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    renderComponent(store);

    expect(screen.getByText(/Last synced:/)).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: false,
        isSyncing: false,
        lastSyncTime: null,
        syncError: 'Failed to connect',
        syncProgress: null,
      },
    });
    renderComponent(store);

    expect(screen.getByText('Failed to connect')).toBeInTheDocument();
  });

  it('should dismiss error when dismiss button is clicked', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: false,
        isSyncing: false,
        lastSyncTime: null,
        syncError: 'Failed to connect',
        syncProgress: null,
      },
    });
    renderComponent(store);

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    waitFor(() => {
      expect(screen.queryByText('Failed to connect')).not.toBeInTheDocument();
    });
  });

  it('should show sync progress when syncing', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: {
          total: 10,
          completed: 5,
          failed: 0,
        },
      },
    });
    renderComponent(store);

    expect(screen.getByText('Syncing events...')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('should show failed events count when sync has failures', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: {
          total: 10,
          completed: 8,
          failed: 2,
        },
      },
    });
    renderComponent(store);

    expect(screen.getByText('2 events failed to sync')).toBeInTheDocument();
  });

  it('should disable buttons when syncing', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    renderComponent(store);

    const syncButton = screen.getByText('Syncing...');
    const disconnectButton = screen.getByText('Disconnect');

    expect(syncButton).toBeDisabled();
    expect(disconnectButton).toBeDisabled();
  });

  it('should show warning when Google Client ID is not configured', () => {
    // Mock import.meta.env to return empty client ID
    const originalEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    // @ts-expect-error - Mocking environment variable
    import.meta.env.VITE_GOOGLE_CLIENT_ID = '';

    const store = createTestStore();
    renderComponent(store);

    expect(
      screen.getByText(/Google Client ID not configured/)
    ).toBeInTheDocument();

    // Restore original value
    // @ts-expect-error - Restoring environment variable
    import.meta.env.VITE_GOOGLE_CLIENT_ID = originalEnv;
  });
});
