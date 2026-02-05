/**
 * TasksPage Component Tests
 *
 * Integration tests for the TasksPage component.
 * Tests the integration of AppLayout and DailyView.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { TasksPage } from '../TasksPage';
import taskReducer from '../taskSlice';
import categoryReducer from '../../categories/categorySlice';
import noteReducer from '../../notes/noteSlice';
import eventReducer from '../../events/eventSlice';
import { AuthContext, type AuthContextType } from '../../auth';
import { createMockUser, resetMockCounters } from '../../../test/mockData';
import type { User } from '../../../types';

// =============================================================================
// Mocks
// =============================================================================

// Mock Firebase services
vi.mock('../../../services/firebase/tasks.service', () => ({
  getTasksByDate: vi.fn(),
  updateTask: vi.fn(),
  createTask: vi.fn(),
  reorderTasksInDate: vi.fn(),
}));

vi.mock('../../../services/firebase/categories.service', () => ({
  getCategories: vi.fn(),
}));

import * as tasksService from '../../../services/firebase/tasks.service';
import * as categoriesService from '../../../services/firebase/categories.service';

const mockGetTasksByDate = vi.mocked(tasksService.getTasksByDate);
const mockGetCategories = vi.mocked(categoriesService.getCategories);

// =============================================================================
// Test Helpers
// =============================================================================

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      categories: categoryReducer,
      notes: noteReducer,
      events: eventReducer,
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
  user?: User | null;
  authLoading?: boolean;
}

function renderWithProviders(
  ui: React.ReactElement,
  { store = createTestStore(), user = null, authLoading = false }: RenderOptions = {}
) {
  const authValue: AuthContextType = {
    user,
    loading: authLoading,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Provider store={store}>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

// =============================================================================
// Test Setup
// =============================================================================

describe('TasksPage', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    mockGetTasksByDate.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render the page with testId', () => {
      renderWithProviders(<TasksPage testId="test-tasks-page" />, { user: mockUser });

      expect(screen.getByTestId('test-tasks-page')).toBeInTheDocument();
    });

    it('should render with default testId when not provided', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });

    it('should render app layout wrapper', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      // Check for app layout
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    it('should render daily view component', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      // Check for daily view
      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });

    it('should render page header with app title', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      expect(screen.getByText('Neill Planner')).toBeInTheDocument();
      expect(screen.getByText('What matters most')).toBeInTheDocument();
    });

    it('should render skip to main content link for accessibility', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('should render tab navigation', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      expect(screen.getByTestId('tab-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('tab-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('tab-notes')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('should integrate AppLayout and DailyView', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      // AppLayout should wrap DailyView
      const appLayout = screen.getByTestId('app-layout');
      const dailyView = screen.getByTestId('tasks-page');

      expect(appLayout).toBeInTheDocument();
      expect(dailyView).toBeInTheDocument();

      // DailyView should be inside AppLayout
      expect(appLayout).toContainElement(dailyView);
    });

    it('should have proper semantic structure', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Should have banner landmark (header)
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have skip to main content link', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have main content area with correct id', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('should have navigation landmarks', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      const navigations = screen.getAllByRole('navigation');
      expect(navigations.length).toBeGreaterThan(0);
    });

    it('should have tablist for view switching', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // User Context Tests
  // ===========================================================================

  describe('User Context', () => {
    it('should render when user is authenticated', () => {
      renderWithProviders(<TasksPage />, { user: mockUser });

      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });

    it('should render layout components without user', () => {
      renderWithProviders(<TasksPage />, { user: null });

      // AppLayout should still render
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();

      // Header should still render
      expect(screen.getByText('Neill Planner')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle undefined testId gracefully', () => {
      renderWithProviders(<TasksPage testId={undefined} />, { user: mockUser });

      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });

    it('should render without errors when store is empty', () => {
      const emptyStore = createTestStore();
      renderWithProviders(<TasksPage />, { store: emptyStore, user: mockUser });

      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });
  });
});
