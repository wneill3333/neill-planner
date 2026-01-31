/**
 * Task Thunks Tests
 *
 * Comprehensive tests for async thunks in the tasks feature.
 * Tests cover all CRUD operations with mocked Firebase service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import taskReducer, { initialState } from '../taskSlice';
import {
  fetchTasksByDate,
  createTask,
  updateTaskAsync,
  deleteTask,
  hardDeleteTask,
  restoreTask,
  batchUpdateTasksAsync,
  fetchTasksByDateRange,
} from '../taskThunks';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../types';
import * as tasksService from '../../../services/firebase/tasks.service';

// Mock the tasks service
vi.mock('../../../services/firebase/tasks.service');

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a test store with tasks reducer
 */
function createTestStore(preloadedState?: Partial<typeof initialState>) {
  return configureStore({
    reducer: {
      tasks: taskReducer,
    },
    preloadedState: preloadedState
      ? { tasks: { ...initialState, ...preloadedState } }
      : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ['tasks.tasks'],
        },
      }),
  });
}

/**
 * Create a mock task for testing
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  const now = new Date();
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: 'Test description',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date('2026-01-31'),
    scheduledTime: null,
    recurrence: null,
    linkedNoteIds: [],
    linkedEventId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Task Thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // fetchTasksByDate
  // ===========================================================================

  describe('fetchTasksByDate', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.getTasksByDate).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('syncing');
    });

    it('should fetch tasks successfully', async () => {
      const store = createTestStore();
      const mockTasks = [
        createMockTask({ id: 'task-1', title: 'Task 1' }),
        createMockTask({ id: 'task-2', title: 'Task 2' }),
      ];

      vi.mocked(tasksService.getTasksByDate).mockResolvedValue(mockTasks);

      await store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('synced');
      expect(Object.keys(state.tasks)).toHaveLength(2);
      expect(state.tasks['task-1'].title).toBe('Task 1');
      expect(state.tasks['task-2'].title).toBe('Task 2');
    });

    it('should update taskIdsByDate index', async () => {
      const store = createTestStore();
      const mockTasks = [
        createMockTask({ id: 'task-1', scheduledDate: new Date('2026-01-31') }),
      ];

      vi.mocked(tasksService.getTasksByDate).mockResolvedValue(mockTasks);

      await store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.taskIdsByDate['2026-01-31']).toContain('task-1');
    });

    it('should replace existing tasks for the same date', async () => {
      const existingTask = createMockTask({
        id: 'old-task',
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'old-task': existingTask },
        taskIdsByDate: { '2026-01-31': ['old-task'] },
      });

      const newTask = createMockTask({
        id: 'new-task',
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.getTasksByDate).mockResolvedValue([newTask]);

      await store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.tasks['old-task']).toBeUndefined();
      expect(state.tasks['new-task']).toBeDefined();
      expect(state.taskIdsByDate['2026-01-31']).toEqual(['new-task']);
    });

    it('should handle fetch error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.getTasksByDate).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.syncStatus).toBe('error');
    });

    it('should handle unknown error type', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.getTasksByDate).mockRejectedValue('Unknown error');

      await store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.error).toBe('Failed to fetch tasks');
    });
  });

  // ===========================================================================
  // createTask
  // ===========================================================================

  describe('createTask', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.createTask).mockImplementation(
        () => new Promise(() => {})
      );

      const input: CreateTaskInput = {
        title: 'New Task',
        priority: { letter: 'B', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      };

      store.dispatch(createTask({ input, userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should create task successfully', async () => {
      const store = createTestStore();

      const input: CreateTaskInput = {
        title: 'New Task',
        description: 'New description',
        priority: { letter: 'B', number: 2 },
        scheduledDate: new Date('2026-01-31'),
      };

      const createdTask = createMockTask({
        id: 'new-task-id',
        title: 'New Task',
        description: 'New description',
        priority: { letter: 'B', number: 2 },
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.createTask).mockResolvedValue(createdTask);

      await store.dispatch(createTask({ input, userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['new-task-id']).toBeDefined();
      expect(state.tasks['new-task-id'].title).toBe('New Task');
      expect(state.taskIdsByDate['2026-01-31']).toContain('new-task-id');
    });

    it('should handle create error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.createTask).mockRejectedValue(
        new Error('Create failed')
      );

      const input: CreateTaskInput = {
        title: 'New Task',
        priority: { letter: 'A', number: 1 },
      };

      await store.dispatch(createTask({ input, userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.error).toBe('Create failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // updateTaskAsync
  // ===========================================================================

  describe('updateTaskAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.updateTask).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(updateTaskAsync({ id: 'task-1', title: 'Updated' }));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should update task successfully', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        title: 'Original Title',
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      const updatedTask = createMockTask({
        id: 'task-1',
        title: 'Updated Title',
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.updateTask).mockResolvedValue(updatedTask);

      await store.dispatch(
        updateTaskAsync({ id: 'task-1', title: 'Updated Title' })
      );

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['task-1'].title).toBe('Updated Title');
    });

    it('should handle date change', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      const updatedTask = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-02-01'),
      });

      vi.mocked(tasksService.updateTask).mockResolvedValue(updatedTask);

      await store.dispatch(
        updateTaskAsync({ id: 'task-1', scheduledDate: new Date('2026-02-01') })
      );

      const state = store.getState().tasks;
      // Old date should be empty or undefined (empty arrays are cleaned up)
      const oldDateTasks = state.taskIdsByDate['2026-01-31'] || [];
      expect(oldDateTasks).not.toContain('task-1');
      expect(state.taskIdsByDate['2026-02-01']).toContain('task-1');
    });

    it('should handle update error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.updateTask).mockRejectedValue(
        new Error('Update failed')
      );

      await store.dispatch(updateTaskAsync({ id: 'task-1', title: 'Updated' }));

      const state = store.getState().tasks;
      expect(state.error).toBe('Update failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // deleteTask (soft delete)
  // ===========================================================================

  describe('deleteTask', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.softDeleteTask).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(deleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should soft delete task successfully', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      vi.mocked(tasksService.softDeleteTask).mockResolvedValue();

      await store.dispatch(deleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['task-1']).toBeUndefined();
      // Empty arrays are cleaned up, so check for empty or undefined
      const dateTasks = state.taskIdsByDate['2026-01-31'] || [];
      expect(dateTasks).not.toContain('task-1');
    });

    it('should clean up empty date arrays', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      vi.mocked(tasksService.softDeleteTask).mockResolvedValue();

      await store.dispatch(deleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.taskIdsByDate['2026-01-31']).toBeUndefined();
    });

    it('should handle delete error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.softDeleteTask).mockRejectedValue(
        new Error('Delete failed')
      );

      await store.dispatch(deleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.error).toBe('Delete failed');
      expect(state.syncStatus).toBe('error');
    });

    it('should handle deleting non-existent task gracefully', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.softDeleteTask).mockResolvedValue();

      await store.dispatch(deleteTask('non-existent'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      // No error should occur
      expect(state.error).toBeNull();
    });
  });

  // ===========================================================================
  // hardDeleteTask (permanent delete)
  // ===========================================================================

  describe('hardDeleteTask', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.hardDeleteTask).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(hardDeleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should permanently delete task successfully', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      vi.mocked(tasksService.hardDeleteTask).mockResolvedValue();

      await store.dispatch(hardDeleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['task-1']).toBeUndefined();
    });

    it('should handle hard delete error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.hardDeleteTask).mockRejectedValue(
        new Error('Hard delete failed')
      );

      await store.dispatch(hardDeleteTask('task-1'));

      const state = store.getState().tasks;
      expect(state.error).toBe('Hard delete failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // restoreTask
  // ===========================================================================

  describe('restoreTask', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.restoreTask).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(restoreTask('task-1'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should restore task successfully', async () => {
      const store = createTestStore();

      const restoredTask = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-01-31'),
        deletedAt: null,
      });

      vi.mocked(tasksService.restoreTask).mockResolvedValue(restoredTask);

      await store.dispatch(restoreTask('task-1'));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['task-1']).toBeDefined();
      expect(state.taskIdsByDate['2026-01-31']).toContain('task-1');
    });

    it('should handle restore error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.restoreTask).mockRejectedValue(
        new Error('Restore failed')
      );

      await store.dispatch(restoreTask('task-1'));

      const state = store.getState().tasks;
      expect(state.error).toBe('Restore failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // batchUpdateTasksAsync
  // ===========================================================================

  describe('batchUpdateTasksAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.batchUpdateTasks).mockImplementation(
        () => new Promise(() => {})
      );

      const updates: UpdateTaskInput[] = [
        { id: 'task-1', priority: { number: 1 } },
        { id: 'task-2', priority: { number: 2 } },
      ];

      store.dispatch(batchUpdateTasksAsync(updates));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should batch update tasks successfully', async () => {
      const task1 = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 3 },
      });
      const task2 = createMockTask({
        id: 'task-2',
        priority: { letter: 'A', number: 4 },
      });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
        taskIdsByDate: { '2026-01-31': ['task-1', 'task-2'] },
      });

      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue();

      const updates: UpdateTaskInput[] = [
        { id: 'task-1', priority: { number: 1 } },
        { id: 'task-2', priority: { number: 2 } },
      ];

      await store.dispatch(batchUpdateTasksAsync(updates));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['task-1'].priority.number).toBe(1);
      expect(state.tasks['task-2'].priority.number).toBe(2);
    });

    it('should handle batch update error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.batchUpdateTasks).mockRejectedValue(
        new Error('Batch update failed')
      );

      await store.dispatch(
        batchUpdateTasksAsync([{ id: 'task-1', title: 'Updated' }])
      );

      const state = store.getState().tasks;
      expect(state.error).toBe('Batch update failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // fetchTasksByDateRange
  // ===========================================================================

  describe('fetchTasksByDateRange', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.getTasksByDateRange).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(
        fetchTasksByDateRange({
          userId: 'user-1',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.loading).toBe(true);
      expect(state.syncStatus).toBe('syncing');
    });

    it('should fetch tasks for date range successfully', async () => {
      const store = createTestStore();

      const mockTasks = [
        createMockTask({
          id: 'task-1',
          scheduledDate: new Date('2026-01-15'),
        }),
        createMockTask({
          id: 'task-2',
          scheduledDate: new Date('2026-01-20'),
        }),
        createMockTask({
          id: 'task-3',
          scheduledDate: new Date('2026-01-25'),
        }),
      ];

      vi.mocked(tasksService.getTasksByDateRange).mockResolvedValue(mockTasks);

      await store.dispatch(
        fetchTasksByDateRange({
          userId: 'user-1',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.loading).toBe(false);
      expect(state.syncStatus).toBe('synced');
      expect(Object.keys(state.tasks)).toHaveLength(3);
      expect(state.taskIdsByDate['2026-01-15']).toContain('task-1');
      expect(state.taskIdsByDate['2026-01-20']).toContain('task-2');
      expect(state.taskIdsByDate['2026-01-25']).toContain('task-3');
    });

    it('should handle date range fetch error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.getTasksByDateRange).mockRejectedValue(
        new Error('Range fetch failed')
      );

      await store.dispatch(
        fetchTasksByDateRange({
          userId: 'user-1',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Range fetch failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('should clear error after successful operation', async () => {
      const store = createTestStore({ error: 'Previous error' });

      vi.mocked(tasksService.getTasksByDate).mockResolvedValue([]);

      await store.dispatch(
        fetchTasksByDate({
          userId: 'user-1',
          date: new Date('2026-01-31'),
        })
      );

      const state = store.getState().tasks;
      expect(state.error).toBeNull();
    });

    it('should handle multiple concurrent operations', async () => {
      const store = createTestStore();

      const task1 = createMockTask({
        id: 'task-1',
        scheduledDate: new Date('2026-01-31'),
      });
      const task2 = createMockTask({
        id: 'task-2',
        scheduledDate: new Date('2026-02-01'),
      });

      vi.mocked(tasksService.getTasksByDate)
        .mockResolvedValueOnce([task1])
        .mockResolvedValueOnce([task2]);

      // Dispatch both operations concurrently
      await Promise.all([
        store.dispatch(
          fetchTasksByDate({
            userId: 'user-1',
            date: new Date('2026-01-31'),
          })
        ),
        store.dispatch(
          fetchTasksByDate({
            userId: 'user-1',
            date: new Date('2026-02-01'),
          })
        ),
      ]);

      const state = store.getState().tasks;
      expect(Object.keys(state.tasks)).toHaveLength(2);
      expect(state.tasks['task-1']).toBeDefined();
      expect(state.tasks['task-2']).toBeDefined();
    });

    it('should maintain state consistency through CRUD cycle', async () => {
      const store = createTestStore();

      // Create
      const createdTask = createMockTask({
        id: 'new-task',
        title: 'New Task',
        scheduledDate: new Date('2026-01-31'),
      });
      vi.mocked(tasksService.createTask).mockResolvedValue(createdTask);

      await store.dispatch(
        createTask({
          input: {
            title: 'New Task',
            priority: { letter: 'A', number: 1 },
            scheduledDate: new Date('2026-01-31'),
          },
          userId: 'user-1',
        })
      );

      let state = store.getState().tasks;
      expect(state.tasks['new-task']).toBeDefined();

      // Update
      const updatedTask = createMockTask({
        id: 'new-task',
        title: 'Updated Task',
        scheduledDate: new Date('2026-01-31'),
      });
      vi.mocked(tasksService.updateTask).mockResolvedValue(updatedTask);

      await store.dispatch(
        updateTaskAsync({ id: 'new-task', title: 'Updated Task' })
      );

      state = store.getState().tasks;
      expect(state.tasks['new-task'].title).toBe('Updated Task');

      // Delete
      vi.mocked(tasksService.softDeleteTask).mockResolvedValue();

      await store.dispatch(deleteTask('new-task'));

      state = store.getState().tasks;
      expect(state.tasks['new-task']).toBeUndefined();

      // Restore
      vi.mocked(tasksService.restoreTask).mockResolvedValue(updatedTask);

      await store.dispatch(restoreTask('new-task'));

      state = store.getState().tasks;
      expect(state.tasks['new-task']).toBeDefined();
    });
  });
});
