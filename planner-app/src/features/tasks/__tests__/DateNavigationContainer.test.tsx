/**
 * DateNavigationContainer Component Tests
 *
 * Integration tests for the DateNavigationContainer component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { DateNavigationContainer } from '../DateNavigationContainer';
import taskReducer from '../taskSlice';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      tasks: taskReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

interface RenderOptions {
  store?: ReturnType<typeof createTestStore>;
}

function renderWithProviders(
  ui: React.ReactElement,
  { store = createTestStore() }: RenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper }),
    store,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('DateNavigationContainer', () => {
  // Mock current date to Feb 2, 2026 for consistent testing
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 2)); // Month is 0-indexed, so 1 = February
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render date navigation component', () => {
      renderWithProviders(<DateNavigationContainer />);

      expect(screen.getByTestId('date-navigation')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderWithProviders(<DateNavigationContainer className="custom-class" />);

      expect(screen.getByTestId('date-navigation')).toHaveClass('custom-class');
    });

    it('should render with custom testId', () => {
      renderWithProviders(<DateNavigationContainer testId="custom-nav" />);

      expect(screen.getByTestId('custom-nav')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Redux Integration Tests
  // =============================================================================

  describe('Redux Integration', () => {
    it('should display selected date from Redux store', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-01-24',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      expect(screen.getByTestId('date-display')).toHaveTextContent('Saturday, January 24, 2026');
    });

    it('should display today as default selected date', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02', // Set to mocked today
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      // Default selectedDate should be today
      expect(screen.getByTestId('date-display')).toHaveTextContent('Monday, February 2, 2026');
    });

    it('should update Redux store when navigating to previous day', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('previous-day-button'));

      const state = store.getState();
      expect(state.tasks.selectedDate).toBe('2026-02-01');
    });

    it('should update Redux store when navigating to next day', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('next-day-button'));

      const state = store.getState();
      expect(state.tasks.selectedDate).toBe('2026-02-03');
    });

    it('should update Redux store when navigating to today', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-01-24',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('today-button'));

      const state = store.getState();
      expect(state.tasks.selectedDate).toBe('2026-02-02'); // Mocked today
    });

    it('should reflect store updates in UI', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      const { rerender } = renderWithProviders(<DateNavigationContainer />, { store });

      expect(screen.getByTestId('date-display')).toHaveTextContent('Monday, February 2, 2026');

      // Simulate external store update
      store.dispatch({ type: 'tasks/setSelectedDate', payload: '2026-12-25' });

      rerender(<DateNavigationContainer />);

      expect(screen.getByTestId('date-display')).toHaveTextContent('Friday, December 25, 2026');
    });
  });

  // =============================================================================
  // Navigation Tests
  // =============================================================================

  describe('Navigation', () => {
    it('should handle multiple navigation clicks', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('next-day-button'));
      fireEvent.click(screen.getByTestId('next-day-button'));
      fireEvent.click(screen.getByTestId('next-day-button'));

      const state = store.getState();
      expect(state.tasks.selectedDate).toBe('2026-02-05');
    });

    it('should handle forward and backward navigation', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('next-day-button'));
      fireEvent.click(screen.getByTestId('next-day-button'));
      expect(store.getState().tasks.selectedDate).toBe('2026-02-04');

      fireEvent.click(screen.getByTestId('previous-day-button'));
      expect(store.getState().tasks.selectedDate).toBe('2026-02-03');
    });

    it('should handle month boundaries', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-01-31',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('next-day-button'));
      expect(store.getState().tasks.selectedDate).toBe('2026-02-01');

      fireEvent.click(screen.getByTestId('previous-day-button'));
      expect(store.getState().tasks.selectedDate).toBe('2026-01-31');
    });

    it('should handle year boundaries', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2025-12-31',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.click(screen.getByTestId('next-day-button'));
      expect(store.getState().tasks.selectedDate).toBe('2026-01-01');

      fireEvent.click(screen.getByTestId('previous-day-button'));
      expect(store.getState().tasks.selectedDate).toBe('2025-12-31');
    });
  });

  // =============================================================================
  // Keyboard Navigation Tests
  // =============================================================================

  describe('Keyboard Navigation', () => {
    it('should update Redux store when navigating with ArrowLeft', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(store.getState().tasks.selectedDate).toBe('2026-02-01');
    });

    it('should update Redux store when navigating with ArrowRight', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(store.getState().tasks.selectedDate).toBe('2026-02-03');
    });

    it('should update Redux store when navigating with T key', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-01-24',
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      fireEvent.keyDown(window, { key: 't' });

      expect(store.getState().tasks.selectedDate).toBe('2026-02-02'); // Mocked today
    });
  });

  // =============================================================================
  // Today Button State Tests
  // =============================================================================

  describe('Today Button State', () => {
    it('should disable today button when selected date is today', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-02', // Today
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      expect(screen.getByTestId('today-button')).toBeDisabled();
    });

    it('should enable today button when selected date is not today', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-01-24', // Not today
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      expect(screen.getByTestId('today-button')).not.toBeDisabled();
    });

    it('should update button state when navigating to/from today', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2026-02-01', // Day before today
          loading: false,
          error: null,
          syncStatus: 'synced',
          reorderRollbackState: null,
        },
      });

      renderWithProviders(<DateNavigationContainer />, { store });

      expect(screen.getByTestId('today-button')).not.toBeDisabled();

      fireEvent.click(screen.getByTestId('next-day-button'));

      expect(screen.getByTestId('today-button')).toBeDisabled();

      fireEvent.click(screen.getByTestId('previous-day-button'));

      expect(screen.getByTestId('today-button')).not.toBeDisabled();
    });
  });
});
