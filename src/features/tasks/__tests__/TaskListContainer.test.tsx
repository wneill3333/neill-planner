/**
 * TaskListContainer Component Tests
 *
 * Integration tests for the TaskListContainer component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { TaskListContainer } from '../TaskListContainer';
import taskReducer from '../taskSlice';
import categoryReducer from '../../categories/categorySlice';
import { AuthContext, type AuthContextType } from '../../auth';
import {
  createMockTask,
  createMockCategory,
  createMockUser,
  resetMockCounters,
} from '../../../test/mockData';
import type { User, Task } from '../../../types';

// =============================================================================
// Mocks
// =============================================================================

// Mock Firebase services
vi.mock('../../../services/firebase/tasks.service', () => ({
  getTasksByDate: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('../../../services/firebase/categories.service', () => ({
  getCategories: vi.fn(),
}));

import * as tasksService from '../../../services/firebase/tasks.service';
import * as categoriesService from '../../../services/firebase/categories.service';

const mockGetTasksByDate = vi.mocked(tasksService.getTasksByDate);
const mockUpdateTask = vi.mocked(tasksService.updateTask);
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

describe('TaskListContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    mockGetTasksByDate.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);
  });

  // ===========================================================================
  // Authentication States
  // ===========================================================================

  describe('Authentication States', () => {
    it('should show unauthenticated state when no user', () => {
      renderWithProviders(<TaskListContainer />, { user: null });

      expect(screen.getByTestId('unauthenticated-state')).toBeInTheDocument();
      expect(screen.getByText('Please sign in')).toBeInTheDocument();
      expect(screen.getByText('Sign in to view your tasks')).toBeInTheDocument();
    });

    it('should show loading state while auth is loading', () => {
      renderWithProviders(<TaskListContainer />, {
        user: null,
        authLoading: true,
      });

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show tasks when authenticated with preloaded state', async () => {
      const user = createMockUser();
      const task = createMockTask({ id: 'task-1', title: 'Test Task 1' });

      // Preload the store with tasks already fetched
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

      renderWithProviders(<TaskListContainer />, { user, store });

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Loading and Error States
  // ===========================================================================

  describe('Loading and Error States', () => {
    it('should show loading state when loading is true', () => {
      const user = createMockUser();

      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: {},
          selectedDate: '2024-01-15',
          loading: true,
          error: null,
          syncStatus: 'syncing',
        },
      });

      renderWithProviders(<TaskListContainer />, { user, store });

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show error state when error exists', () => {
      const user = createMockUser();

      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: { '2024-01-15': [] }, // Mark date as loaded to prevent refetch
          selectedDate: '2024-01-15',
          loading: false,
          error: 'Failed to fetch tasks',
          syncStatus: 'error',
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

      renderWithProviders(<TaskListContainer />, { user, store });

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch tasks')).toBeInTheDocument();
    });

    it('should provide retry button on error', async () => {
      const user = createMockUser();
      mockGetTasksByDate.mockResolvedValueOnce([]);

      const store = createTestStore({
        tasks: {
          tasks: {},
          taskIdsByDate: { '2024-01-15': [] }, // Mark date as loaded to prevent refetch
          selectedDate: '2024-01-15',
          loading: false,
          error: 'Network error',
          syncStatus: 'error',
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

      renderWithProviders(<TaskListContainer />, { user, store });

      expect(screen.getByTestId('error-state')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry loading tasks/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);

      // The refetch should have been called
      await waitFor(() => {
        expect(mockGetTasksByDate).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Empty State
  // ===========================================================================

  describe('Empty State', () => {
    it('should show empty state when no tasks', () => {
      const user = createMockUser();

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

      renderWithProviders(<TaskListContainer />, { user, store });

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show default empty message', () => {
      const user = createMockUser();

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

      renderWithProviders(<TaskListContainer />, { user, store });

      // DraggableTaskList shows its own empty state
      expect(screen.getByText('No tasks for this day')).toBeInTheDocument();
    });

    it('should show add task hint in empty state', () => {
      const user = createMockUser();

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

      renderWithProviders(<TaskListContainer />, { user, store });

      // DraggableTaskList shows hint to add tasks
      expect(screen.getByText(/click the \+ button/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Task Rendering
  // ===========================================================================

  describe('Task Rendering', () => {
    it('should render tasks grouped by priority with drag handles', () => {
      const user = createMockUser();
      const taskA = createMockTask({ id: 'task-a1', title: 'A Task', priorityLetter: 'A', priorityNumber: 1 });
      const taskB = createMockTask({ id: 'task-b1', title: 'B Task', priorityLetter: 'B', priorityNumber: 1 });

      const store = createTestStore({
        tasks: {
          tasks: { 'task-a1': taskA, 'task-b1': taskB },
          taskIdsByDate: { '2024-01-15': ['task-a1', 'task-b1'] },
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

      renderWithProviders(<TaskListContainer />, { user, store });

      // DraggableTaskList uses sortable-priority-group prefix
      expect(screen.getByTestId('sortable-priority-group-A')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-priority-group-B')).toBeInTheDocument();
      expect(screen.getByText('A Task')).toBeInTheDocument();
      expect(screen.getByText('B Task')).toBeInTheDocument();

      // Should have drag handles
      expect(screen.getByTestId('drag-handle-task-a1')).toBeInTheDocument();
      expect(screen.getByTestId('drag-handle-task-b1')).toBeInTheDocument();
    });

    it('should show category colors', () => {
      const user = createMockUser();
      const category = createMockCategory({ id: 'cat-1', color: '#FF5733' });
      const task = createMockTask({ id: 'task-1', title: 'Categorized Task', categoryId: 'cat-1' });

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
          categories: { 'cat-1': category },
          categoryIds: ['cat-1'],
          loading: false,
          error: null,
          syncStatus: 'synced',
          initialized: true,
        },
      });

      renderWithProviders(<TaskListContainer />, { user, store });

      expect(screen.getByText('Categorized Task')).toBeInTheDocument();
      const colorIndicator = screen.getByTestId('category-color');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should hide category colors when showCategoryColors is false', () => {
      const user = createMockUser();
      const task = createMockTask({ id: 'task-1', title: 'Task' });

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

      renderWithProviders(<TaskListContainer showCategoryColors={false} />, { user, store });

      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.queryByTestId('category-color')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Task Interactions
  // ===========================================================================

  describe('Task Interactions', () => {
    it('should call onTaskClick when task is clicked', () => {
      const user = createMockUser();
      const task = createMockTask({ id: 'task-1', title: 'Clickable Task' });

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

      const handleTaskClick = vi.fn();

      renderWithProviders(
        <TaskListContainer onTaskClick={handleTaskClick} />,
        { user, store }
      );

      expect(screen.getByText('Clickable Task')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('task-item-task-1'));

      expect(handleTaskClick).toHaveBeenCalledWith(task);
    });

    it('should cycle task status when status symbol is clicked', async () => {
      const user = createMockUser();
      const task = createMockTask({
        id: 'task-1',
        title: 'Status Task',
        status: 'in_progress',
      });
      const updatedTask = { ...task, status: 'complete' as const };

      mockUpdateTask.mockResolvedValue(updatedTask);

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

      renderWithProviders(<TaskListContainer />, { user, store });

      expect(screen.getByText('Status Task')).toBeInTheDocument();

      // Click status symbol
      const statusSymbol = screen.getByTestId('status-symbol');
      fireEvent.click(statusSymbol);

      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'task-1',
            status: 'complete', // Next status after in_progress
          }),
          undefined
        );
      });
    });

    it('should not call onTaskClick when status symbol is clicked', () => {
      const user = createMockUser();
      const task = createMockTask({ id: 'task-1', title: 'Task' });

      mockUpdateTask.mockResolvedValue(task);

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

      const handleTaskClick = vi.fn();

      renderWithProviders(
        <TaskListContainer onTaskClick={handleTaskClick} />,
        { user, store }
      );

      expect(screen.getByText('Task')).toBeInTheDocument();

      const statusSymbol = screen.getByTestId('status-symbol');
      fireEvent.click(statusSymbol);

      expect(handleTaskClick).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Props
  // ===========================================================================

  describe('Props', () => {
    it('should pass testId to TaskList', () => {
      const user = createMockUser();
      const task = createMockTask();

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

      renderWithProviders(<TaskListContainer testId="custom-container" />, { user, store });

      expect(screen.getByTestId('custom-container')).toBeInTheDocument();
    });
  });
});
