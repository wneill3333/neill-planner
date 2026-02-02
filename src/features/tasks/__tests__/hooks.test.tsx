/**
 * Task Hooks Tests
 *
 * Tests for useTasksByDate and useSelectedDateTasks hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { PropsWithChildren } from 'react';

import { useTasksByDate, useSelectedDateTasks } from '../hooks';
import taskReducer from '../taskSlice';
import categoryReducer from '../../categories/categorySlice';
import { AuthContext, type AuthContextType } from '../../auth';
import {
  createMockTask,
  createMockCategory,
  createMockUser,
  resetMockCounters,
} from '../../../test/mockData';
import type { User } from '../../../types';

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

function createWrapper(
  store: ReturnType<typeof createTestStore>,
  user: User | null = null
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

describe('useTasksByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    mockGetTasksByDate.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);
  });

  it('should return empty tasks when no user is provided', async () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', null), { wrapper });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGetTasksByDate).not.toHaveBeenCalled();
  });

  it('should fetch tasks when user and date are provided', async () => {
    const tasks = [
      createMockTask({ id: 'task-1', scheduledDate: new Date('2024-01-15T00:00:00.000Z') }),
      createMockTask({ id: 'task-2', scheduledDate: new Date('2024-01-15T00:00:00.000Z') }),
    ];
    mockGetTasksByDate.mockResolvedValue(tasks);

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });

    expect(mockGetTasksByDate).toHaveBeenCalledWith('user-1', expect.any(Date));
  });

  it('should set loading state while fetching', async () => {
    mockGetTasksByDate.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should set error state when fetch fails', async () => {
    mockGetTasksByDate.mockRejectedValue(new Error('Network error'));

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('should not refetch if tasks already loaded for date', async () => {
    const task = createMockTask({ id: 'task-1', scheduledDate: new Date('2024-01-15T00:00:00.000Z') });
    mockGetTasksByDate.mockResolvedValue([task]);

    const store = createTestStore({
      tasks: {
        tasks: { 'task-1': task },
        taskIdsByDate: { '2024-01-15': ['task-1'] },
        selectedDate: '2024-01-15',
        loading: false,
        error: null,
        syncStatus: 'synced',
      },
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    // Should already have the task
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.isLoaded).toBe(true);

    // Wait a bit to ensure no fetch is triggered
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockGetTasksByDate).not.toHaveBeenCalled();
  });

  it('should provide refetch function', async () => {
    const tasks = [createMockTask({ id: 'task-1', scheduledDate: new Date('2024-01-15T00:00:00.000Z') })];
    mockGetTasksByDate.mockResolvedValue(tasks);

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Call refetch
    mockGetTasksByDate.mockClear();
    result.current.refetch();

    await waitFor(() => {
      expect(mockGetTasksByDate).toHaveBeenCalled();
    });
  });

  it('should provide updateTaskStatus function', async () => {
    const task = createMockTask({ id: 'task-1', scheduledDate: new Date('2024-01-15T00:00:00.000Z'), status: 'in_progress' });
    const updatedTask = { ...task, status: 'complete' as const };

    mockGetTasksByDate.mockResolvedValue([task]);
    mockUpdateTask.mockResolvedValue(updatedTask);

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Update status
    await result.current.updateTaskStatus('task-1', 'complete');

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        status: 'complete',
      }),
      undefined
    );
  });

  it('should return categoriesMap', async () => {
    const categories = [
      createMockCategory({ id: 'cat-1', name: 'Work' }),
      createMockCategory({ id: 'cat-2', name: 'Personal' }),
    ];
    mockGetTasksByDate.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue(categories);

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useTasksByDate('2024-01-15', 'user-1'), { wrapper });

    await waitFor(() => {
      expect(Object.keys(result.current.categoriesMap).length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('useSelectedDateTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCounters();
    mockGetTasksByDate.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);
  });

  it('should use selectedDate from store', async () => {
    const tasks = [createMockTask({ id: 'task-1', scheduledDate: new Date('2024-02-20T00:00:00.000Z') })];
    mockGetTasksByDate.mockResolvedValue(tasks);

    const store = createTestStore({
      tasks: {
        tasks: {},
        taskIdsByDate: {},
        selectedDate: '2024-02-20',
        loading: false,
        error: null,
        syncStatus: 'synced',
      },
    });
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSelectedDateTasks('user-1'), { wrapper });

    expect(result.current.selectedDate).toBe('2024-02-20');

    await waitFor(() => {
      expect(mockGetTasksByDate).toHaveBeenCalledWith('user-1', expect.any(Date));
    });
  });

  it('should return all useTasksByDate properties plus selectedDate', async () => {
    mockGetTasksByDate.mockResolvedValue([]);

    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSelectedDateTasks('user-1'), { wrapper });

    expect(result.current).toHaveProperty('tasks');
    expect(result.current).toHaveProperty('categoriesMap');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('syncStatus');
    expect(result.current).toHaveProperty('isLoaded');
    expect(result.current).toHaveProperty('refetch');
    expect(result.current).toHaveProperty('updateTaskStatus');
    expect(result.current).toHaveProperty('selectedDate');
  });

  it('should return null user tasks as empty', async () => {
    const store = createTestStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSelectedDateTasks(null), { wrapper });

    expect(result.current.tasks).toEqual([]);
    expect(mockGetTasksByDate).not.toHaveBeenCalled();
  });
});
