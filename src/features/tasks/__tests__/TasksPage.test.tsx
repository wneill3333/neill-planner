/**
 * TasksPage Component Tests
 *
 * Integration tests for the TasksPage component including:
 * - Page rendering
 * - Modal integration (opens modal on FAB click)
 * - Date display
 * - TaskListContainer integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { TasksPage } from '../TasksPage';
import taskReducer from '../taskSlice';
import categoryReducer from '../../categories/categorySlice';
import { AuthContext, type AuthContextType } from '../../auth';
import {
  createMockTask,
  createMockUser,
  resetMockCounters,
} from '../../../test/mockData';
import type { User } from '../../../types';

// =============================================================================
// Mocks
// =============================================================================

// Mock the useFocusManagement hook
vi.mock('../../../hooks/useFocusManagement', () => ({
  useFocusManagement: vi.fn(() => ({ current: null })),
}));

// Mock Firebase services
vi.mock('../../../services/firebase/tasks.service', () => ({
  getTasksByDate: vi.fn(),
  updateTask: vi.fn(),
  createTask: vi.fn(),
}));

vi.mock('../../../services/firebase/categories.service', () => ({
  getCategories: vi.fn(),
}));

import * as tasksService from '../../../services/firebase/tasks.service';
import * as categoriesService from '../../../services/firebase/categories.service';

const mockGetTasksByDate = vi.mocked(tasksService.getTasksByDate);
const mockCreateTask = vi.mocked(tasksService.createTask);
const mockGetCategories = vi.mocked(categoriesService.getCategories);

// =============================================================================
// Test Helpers
// =============================================================================

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      categories: categoryReducer,
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

  return {
    ...render(ui, { wrapper: Wrapper }),
    store,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('TasksPage', () => {
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
      renderWithProviders(<TasksPage testId="test-tasks-page" />);

      expect(screen.getByTestId('test-tasks-page')).toBeInTheDocument();
    });

    it('should render with default testId when not provided', () => {
      renderWithProviders(<TasksPage />);

      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });

    it('should render page header with app title', () => {
      renderWithProviders(<TasksPage />);

      expect(screen.getByText('Neill Planner')).toBeInTheDocument();
      expect(screen.getByText('Franklin-Covey Productivity System')).toBeInTheDocument();
    });

    it('should render the floating action button', () => {
      renderWithProviders(<TasksPage />);

      expect(screen.getByTestId('create-task-fab')).toBeInTheDocument();
      expect(screen.getByLabelText('Create new task')).toBeInTheDocument();
    });

    it('should render skip to main content link for accessibility', () => {
      renderWithProviders(<TasksPage />);

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('should render TaskListContainer with tasks when available', () => {
      const user = createMockUser();
      const task = createMockTask({ id: 'task-1', title: 'Sample Task' });

      const store = createTestStore({
        tasks: {
          tasks: { 'task-1': task },
          taskIdsByDate: { '2024-01-15': ['task-1'] },
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          syncStatus: 'synced',
        },
        categories: {
          categories: {},
          categoryIds: [],
          loading: false,
          error: null,
          syncStatus: 'synced',
          initialized: true,
        },
      });

      renderWithProviders(<TasksPage />, { user, store });

      // When there are tasks, TaskList should render with the testId
      expect(screen.getByTestId('tasks-page-list')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Date Display Tests
  // ===========================================================================

  describe('Date Display', () => {
    it('should display the selected date info in subtitle', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          syncStatus: 'idle',
        },
      });

      renderWithProviders(<TasksPage />, { store });

      // Should show the date info in the subtitle text
      expect(screen.getByText(/2024-01-15/i)).toBeInTheDocument();
    });

    it('should display a formatted date heading', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2024-07-15',
          loading: false,
          error: null,
          syncStatus: 'idle',
        },
      });

      renderWithProviders(<TasksPage />, { store });

      // Should display the date heading (by ID)
      const heading = document.getElementById('selected-date-heading');
      expect(heading).toBeInTheDocument();
      // The heading should have some content (either "Today", "Tomorrow", or a date string like "Monday, July 15, 2024")
      expect(heading?.textContent).toBeTruthy();
    });

    it('should show selected date in subtitle', () => {
      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2025-03-20',
          loading: false,
          error: null,
          syncStatus: 'idle',
        },
      });

      renderWithProviders(<TasksPage />, { store });

      // Subtitle should mention the date
      expect(screen.getByText(/Tasks scheduled for/i)).toBeInTheDocument();
      expect(screen.getByText(/2025-03-20/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Modal Integration Tests
  // ===========================================================================

  describe('Modal Integration', () => {
    it('should not render CreateTaskModal initially', () => {
      renderWithProviders(<TasksPage />);

      // Modal should not be visible initially (check for the modal testId)
      expect(screen.queryByTestId('tasks-page-create-modal')).not.toBeInTheDocument();
    });

    it('should open CreateTaskModal when FAB is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TasksPage />);

      // Click the floating action button
      await user.click(screen.getByTestId('create-task-fab'));

      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('tasks-page-create-modal')).toBeInTheDocument();
      });

      // Check that the modal title is rendered
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should open modal on FAB click and show modal title', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          syncStatus: 'idle',
        },
        categories: {
          categories: {},
          categoryIds: [],
          loading: false,
          error: null,
          syncStatus: 'synced',
          initialized: true,
        },
      });

      renderWithProviders(<TasksPage />, { user: mockUser, store });

      // Click the FAB
      await user.click(screen.getByLabelText('Create new task'));

      // Modal should open
      await waitFor(() => {
        expect(screen.getByTestId('tasks-page-create-modal')).toBeInTheDocument();
      });

      // Modal should have dialog role
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TasksPage />);

      // Open the modal
      await user.click(screen.getByTestId('create-task-fab'));

      await waitFor(() => {
        expect(screen.getByTestId('tasks-page-create-modal')).toBeInTheDocument();
      });

      // Click the close button
      await user.click(screen.getByLabelText('Close modal'));

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('tasks-page-create-modal')).not.toBeInTheDocument();
      });
    });

    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TasksPage />);

      // Open the modal
      await user.click(screen.getByTestId('create-task-fab'));

      await waitFor(() => {
        expect(screen.getByTestId('tasks-page-create-modal')).toBeInTheDocument();
      });

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('tasks-page-create-modal')).not.toBeInTheDocument();
      });
    });

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TasksPage />);

      // Open the modal
      await user.click(screen.getByTestId('create-task-fab'));

      await waitFor(() => {
        expect(screen.getByTestId('tasks-page-create-modal')).toBeInTheDocument();
      });

      // Click the backdrop (the fixed overlay with bg-black class)
      const backdrop = document.querySelector('[aria-hidden="true"][class*="bg-black"]');
      expect(backdrop).toBeInTheDocument();
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('tasks-page-create-modal')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper landmark roles', () => {
      renderWithProviders(<TasksPage />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<TasksPage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Neill Planner');
    });

    it('should have accessible FAB with aria-label', () => {
      renderWithProviders(<TasksPage />);

      const fab = screen.getByTestId('create-task-fab');
      expect(fab).toHaveAttribute('aria-label', 'Create new task');
    });
  });

  // ===========================================================================
  // Task List Integration Tests
  // ===========================================================================

  describe('Task List Integration', () => {
    it('should display tasks in TaskListContainer when authenticated', async () => {
      const mockUser = createMockUser();
      const task = createMockTask({ id: 'task-1', title: 'My Test Task' });

      const store = createTestStore({
        tasks: {
          tasks: { 'task-1': task },
          taskIdsByDate: { '2024-01-15': ['task-1'] },
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          syncStatus: 'synced',
        },
        categories: {
          categories: {},
          categoryIds: [],
          loading: false,
          error: null,
          syncStatus: 'synced',
          initialized: true,
        },
      });

      renderWithProviders(<TasksPage />, { user: mockUser, store });

      await waitFor(() => {
        expect(screen.getByText('My Test Task')).toBeInTheDocument();
      });
    });

    it('should show empty message when no tasks and authenticated', async () => {
      const mockUser = createMockUser();

      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: { '2024-01-15': [] },
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          syncStatus: 'synced',
        },
        categories: {
          categories: {},
          categoryIds: [],
          loading: false,
          error: null,
          syncStatus: 'synced',
          initialized: true,
        },
      });

      renderWithProviders(<TasksPage />, { user: mockUser, store });

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('should show unauthenticated state when no user', () => {
      renderWithProviders(<TasksPage />, { user: null });

      expect(screen.getByTestId('unauthenticated-state')).toBeInTheDocument();
    });
  });
});
