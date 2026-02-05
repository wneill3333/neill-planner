/**
 * SyncStatusIndicator Component Tests
 *
 * Tests for the sync status indicator component shown in the header.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { SyncStatusIndicator } from '../SyncStatusIndicator';
import googleCalendarReducer from '../../../features/googleCalendar/googleCalendarSlice';
import { AuthContext, type AuthContextType } from '../../../features/auth';
import type { User } from '../../../types';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../../services/firebase/googleCalendarCredentials.service', () => ({
  hasCredentials: vi.fn(),
}));

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
    },
    preloadedState,
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
        <SyncStatusIndicator />
      </AuthContext.Provider>
    </Provider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    const store = createTestStore();
    const { container } = renderComponent(store);

    expect(container).toBeTruthy();
  });

  it('should show CloudOff icon when not connected', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: false,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    // Check for CloudOff icon by aria-label
    const icon = container.querySelector('[aria-label="Google Calendar not connected"]');
    expect(icon).toBeInTheDocument();
  });

  it('should show Loader icon when syncing', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    // Check for Loader2 icon by aria-label
    const icon = container.querySelector('[aria-label="Syncing"]');
    expect(icon).toBeInTheDocument();
  });

  it('should show AlertCircle icon when there is an error', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: 'Sync failed',
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    // Check for AlertCircle icon by aria-label
    const icon = container.querySelector('[aria-label="Sync error"]');
    expect(icon).toBeInTheDocument();
  });

  it('should show CheckCircle icon when connected and synced', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    // Check for CheckCircle2 icon by aria-label
    const icon = container.querySelector('[aria-label="Synced"]');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct color for disconnected state', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: false,
        isSyncing: false,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    const icon = container.querySelector('.text-gray-400');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct color for syncing state', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    const icon = container.querySelector('.text-blue-500');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct color for error state', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: null,
        syncError: 'Sync failed',
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    const icon = container.querySelector('.text-amber-500');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct color for synced state', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    const icon = container.querySelector('.text-green-600');
    expect(icon).toBeInTheDocument();
  });

  it('should have spinning animation for syncing icon', () => {
    const store = createTestStore({
      googleCalendar: {
        isConnected: true,
        isSyncing: true,
        lastSyncTime: null,
        syncError: null,
        syncProgress: null,
      },
    });
    const { container } = renderComponent(store);

    const icon = container.querySelector('.animate-spin');
    expect(icon).toBeInTheDocument();
  });
});
