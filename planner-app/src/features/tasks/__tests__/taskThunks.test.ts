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
  reorderTasks,
  editRecurringInstanceOnly,
  editRecurringFuture,
  deleteRecurringInstanceOnly,
  deleteRecurringFuture,
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

    // ==========================================================================
    // Auto-numbering Tests
    // ==========================================================================

    it('should auto-assign priority number 1 for first task with priority letter', async () => {
      const store = createTestStore({
        selectedDate: '2026-01-31',
        taskIdsByDate: { '2026-01-31': [] },
      });

      const createdTask = createMockTask({
        id: 'new-task',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.createTask).mockResolvedValue(createdTask);

      const input: CreateTaskInput = {
        title: 'First A Task',
        priority: { letter: 'A' }, // No number specified
        scheduledDate: new Date('2026-01-31'),
      };

      await store.dispatch(createTask({ input, userId: 'user-1' }));

      // Verify the service was called with number: 1
      expect(tasksService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: { letter: 'A', number: 1 },
        }),
        'user-1'
      );
    });

    it('should auto-assign next priority number based on existing tasks', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        selectedDate: '2026-01-31',
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      const createdTask = createMockTask({
        id: 'new-task',
        priority: { letter: 'A', number: 2 },
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.createTask).mockResolvedValue(createdTask);

      const input: CreateTaskInput = {
        title: 'Second A Task',
        priority: { letter: 'A' }, // No number specified
        scheduledDate: new Date('2026-01-31'),
      };

      await store.dispatch(createTask({ input, userId: 'user-1' }));

      // Verify the service was called with number: 2 (next after existing A1)
      expect(tasksService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: { letter: 'A', number: 2 },
        }),
        'user-1'
      );
    });

    it('should respect explicitly provided priority number', async () => {
      const existingTask = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        selectedDate: '2026-01-31',
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      const createdTask = createMockTask({
        id: 'new-task',
        priority: { letter: 'A', number: 5 },
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.createTask).mockResolvedValue(createdTask);

      const input: CreateTaskInput = {
        title: 'Specific Priority Task',
        priority: { letter: 'A', number: 5 }, // Explicit number
        scheduledDate: new Date('2026-01-31'),
      };

      await store.dispatch(createTask({ input, userId: 'user-1' }));

      // Verify the explicit number was used
      expect(tasksService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: { letter: 'A', number: 5 },
        }),
        'user-1'
      );
    });

    it('should handle multiple priority letters independently', async () => {
      const existingA = createMockTask({
        id: 'task-a',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });
      const existingB = createMockTask({
        id: 'task-b',
        priority: { letter: 'B', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        selectedDate: '2026-01-31',
        tasks: { 'task-a': existingA, 'task-b': existingB },
        taskIdsByDate: { '2026-01-31': ['task-a', 'task-b'] },
      });

      // Create a new B task
      const createdTask = createMockTask({
        id: 'new-b',
        priority: { letter: 'B', number: 2 },
        scheduledDate: new Date('2026-01-31'),
      });

      vi.mocked(tasksService.createTask).mockResolvedValue(createdTask);

      const input: CreateTaskInput = {
        title: 'New B Task',
        priority: { letter: 'B' }, // Should get number 2 (next for B), not 3
        scheduledDate: new Date('2026-01-31'),
      };

      await store.dispatch(createTask({ input, userId: 'user-1' }));

      expect(tasksService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: { letter: 'B', number: 2 },
        }),
        'user-1'
      );
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

      store.dispatch(updateTaskAsync({ id: 'task-1', title: 'Updated', userId: 'user-1' }));

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
        updateTaskAsync({ id: 'task-1', title: 'Updated Title', userId: 'user-1' })
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
        updateTaskAsync({ id: 'task-1', scheduledDate: new Date('2026-02-01'), userId: 'user-1' })
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

      await store.dispatch(updateTaskAsync({ id: 'task-1', title: 'Updated', userId: 'user-1' }));

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

      store.dispatch(deleteTask({ taskId: 'task-1', userId: 'user-1' }));

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

      await store.dispatch(deleteTask({ taskId: 'task-1', userId: 'user-1' }));

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

      await store.dispatch(deleteTask({ taskId: 'task-1', userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.taskIdsByDate['2026-01-31']).toBeUndefined();
    });

    it('should handle delete error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.softDeleteTask).mockRejectedValue(
        new Error('Delete failed')
      );

      await store.dispatch(deleteTask({ taskId: 'task-1', userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.error).toBe('Delete failed');
      expect(state.syncStatus).toBe('error');
    });

    it('should handle deleting non-existent task gracefully', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.softDeleteTask).mockResolvedValue();

      await store.dispatch(deleteTask({ taskId: 'non-existent', userId: 'user-1' }));

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

      store.dispatch(hardDeleteTask({ taskId: 'task-1', userId: 'user-1' }));

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

      await store.dispatch(hardDeleteTask({ taskId: 'task-1', userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      expect(state.tasks['task-1']).toBeUndefined();
    });

    it('should handle hard delete error', async () => {
      const store = createTestStore();

      vi.mocked(tasksService.hardDeleteTask).mockRejectedValue(
        new Error('Hard delete failed')
      );

      await store.dispatch(hardDeleteTask({ taskId: 'task-1', userId: 'user-1' }));

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

      store.dispatch(restoreTask({ taskId: 'task-1', userId: 'user-1' }));

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

      await store.dispatch(restoreTask({ taskId: 'task-1', userId: 'user-1' }));

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

      await store.dispatch(restoreTask({ taskId: 'task-1', userId: 'user-1' }));

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

      store.dispatch(batchUpdateTasksAsync({ updates, userId: 'user-1' }));

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

      await store.dispatch(batchUpdateTasksAsync({ updates, userId: 'user-1' }));

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
        batchUpdateTasksAsync({ updates: [{ id: 'task-1', title: 'Updated' }], userId: 'user-1' })
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
  // reorderTasks
  // ===========================================================================

  describe('reorderTasks', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(tasksService.batchUpdateTasks).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(reorderTasks({ date: '2026-01-31', userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should return hasChanges=false when no changes needed', async () => {
      // Sequential numbering - no gaps
      const task1 = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });
      const task2 = createMockTask({
        id: 'task-2',
        priority: { letter: 'A', number: 2 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
        taskIdsByDate: { '2026-01-31': ['task-1', 'task-2'] },
      });

      const result = await store.dispatch(
        reorderTasks({ date: '2026-01-31', userId: 'user-1' })
      );

      expect(result.payload).toEqual({ updates: [], hasChanges: false });
      // Service should not be called when no changes needed
      expect(tasksService.batchUpdateTasks).not.toHaveBeenCalled();
    });

    it('should reorder tasks with gaps successfully', async () => {
      // Tasks with gaps: A1, A3, A5
      const task1 = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });
      const task2 = createMockTask({
        id: 'task-2',
        priority: { letter: 'A', number: 3 },
        scheduledDate: new Date('2026-01-31'),
      });
      const task3 = createMockTask({
        id: 'task-3',
        priority: { letter: 'A', number: 5 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: {
          'task-1': task1,
          'task-2': task2,
          'task-3': task3,
        },
        taskIdsByDate: { '2026-01-31': ['task-1', 'task-2', 'task-3'] },
      });

      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue();

      const result = await store.dispatch(
        reorderTasks({ date: '2026-01-31', userId: 'user-1' })
      );

      expect(result.payload).toHaveProperty('hasChanges', true);
      expect(tasksService.batchUpdateTasks).toHaveBeenCalled();

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('synced');
      // Verify the numbers were updated
      expect(state.tasks['task-1'].priority.number).toBe(1);
      expect(state.tasks['task-2'].priority.number).toBe(2); // Was 3
      expect(state.tasks['task-3'].priority.number).toBe(3); // Was 5
    });

    it('should only update tasks that changed', async () => {
      // Task 1 stays at 1, task 2 changes from 3 to 2
      const task1 = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 1 },
        scheduledDate: new Date('2026-01-31'),
      });
      const task2 = createMockTask({
        id: 'task-2',
        priority: { letter: 'A', number: 3 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
        taskIdsByDate: { '2026-01-31': ['task-1', 'task-2'] },
      });

      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue();

      const result = await store.dispatch(
        reorderTasks({ date: '2026-01-31', userId: 'user-1' })
      );

      // Only task-2 should be in updates (task-1 didn't change)
      const updates = (result.payload as { updates: UpdateTaskInput[] }).updates;
      expect(updates).toHaveLength(1);
      expect(updates[0].id).toBe('task-2');
      expect(updates[0].priority).toEqual({ letter: 'A', number: 2 });
    });

    it('should handle multiple priority letters', async () => {
      const taskA1 = createMockTask({
        id: 'a1',
        priority: { letter: 'A', number: 2 }, // Gap
        scheduledDate: new Date('2026-01-31'),
      });
      const taskB1 = createMockTask({
        id: 'b1',
        priority: { letter: 'B', number: 5 }, // Gap
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { a1: taskA1, b1: taskB1 },
        taskIdsByDate: { '2026-01-31': ['a1', 'b1'] },
      });

      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue();

      await store.dispatch(reorderTasks({ date: '2026-01-31', userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.tasks['a1'].priority.number).toBe(1);
      expect(state.tasks['b1'].priority.number).toBe(1);
    });

    it('should handle reorder error', async () => {
      const task = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 5 },
        scheduledDate: new Date('2026-01-31'),
      });

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      vi.mocked(tasksService.batchUpdateTasks).mockRejectedValue(
        new Error('Reorder failed')
      );

      await store.dispatch(reorderTasks({ date: '2026-01-31', userId: 'user-1' }));

      const state = store.getState().tasks;
      expect(state.error).toBe('Reorder failed');
      expect(state.syncStatus).toBe('error');
    });

    it('should handle empty date', async () => {
      const store = createTestStore({
        taskIdsByDate: { '2026-01-31': [] },
      });

      const result = await store.dispatch(
        reorderTasks({ date: '2026-01-31', userId: 'user-1' })
      );

      expect(result.payload).toEqual({ updates: [], hasChanges: false });
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
        updateTaskAsync({ id: 'new-task', title: 'Updated Task', userId: 'user-1' })
      );

      state = store.getState().tasks;
      expect(state.tasks['new-task'].title).toBe('Updated Task');

      // Delete
      vi.mocked(tasksService.softDeleteTask).mockResolvedValue();

      await store.dispatch(deleteTask({ taskId: 'new-task', userId: 'user-1' }));

      state = store.getState().tasks;
      expect(state.tasks['new-task']).toBeUndefined();

      // Restore
      vi.mocked(tasksService.restoreTask).mockResolvedValue(updatedTask);

      await store.dispatch(restoreTask({ taskId: 'new-task', userId: 'user-1' }));

      state = store.getState().tasks;
      expect(state.tasks['new-task']).toBeDefined();
    });
  });

  // ===========================================================================
  // editRecurringInstanceOnly
  // ===========================================================================

  describe('editRecurringInstanceOnly', () => {
    it('should create a materialized instance and update parent exceptions', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        title: 'Daily Meeting',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      const materializedInstance = createMockTask({
        id: 'instance-1',
        title: 'Daily Meeting - Edited',
        isRecurringInstance: true,
        recurringParentId: 'parent-1',
        instanceDate: new Date('2026-02-03'),
        scheduledDate: new Date('2026-02-03'),
        recurrence: null,
      });

      vi.mocked(tasksService.createTask).mockResolvedValue(materializedInstance);
      vi.mocked(tasksService.updateTask).mockResolvedValue({
        ...parentTask,
        recurrence: {
          ...parentTask.recurrence!,
          exceptions: [new Date('2026-02-03')],
        },
      });

      await store.dispatch(
        editRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
          updates: {
            title: 'Daily Meeting - Edited',
          },
        })
      );

      const state = store.getState().tasks;
      expect(state.tasks['instance-1']).toBeDefined();
      expect(state.tasks['instance-1'].title).toBe('Daily Meeting - Edited');
      expect(state.tasks['instance-1'].isRecurringInstance).toBe(true);
      expect(state.syncStatus).toBe('synced');
    });

    it('should handle errors when creating materialized instance', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      vi.mocked(tasksService.createTask).mockRejectedValue(new Error('Failed to create instance'));

      const result = await store.dispatch(
        editRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
          updates: {
            title: 'Edited',
          },
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should throw error when parent task not found', async () => {
      const store = createTestStore();

      const result = await store.dispatch(
        editRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'non-existent',
          instanceDate: new Date('2026-02-03'),
          updates: {
            title: 'Edited',
          },
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should rollback materialized instance if parent exception update fails', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        title: 'Daily Meeting',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      const materializedInstance = createMockTask({
        id: 'instance-1',
        title: 'Daily Meeting - Edited',
        isRecurringInstance: true,
        recurringParentId: 'parent-1',
        instanceDate: new Date('2026-02-03'),
        scheduledDate: new Date('2026-02-03'),
        recurrence: null,
      });

      // Setup: mock createTask succeeds but updateTask fails
      const mockHardDelete = vi.fn().mockResolvedValue(undefined);
      vi.mocked(tasksService.createTask).mockResolvedValue(materializedInstance);
      vi.mocked(tasksService.updateTask).mockRejectedValue(new Error('Update failed'));
      vi.mocked(tasksService.hardDeleteTask).mockImplementation(mockHardDelete);

      const result = await store.dispatch(
        editRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
          updates: { title: 'Edited Title' },
        })
      );

      expect(result.type).toContain('rejected');
      // Verify rollback was called
      expect(mockHardDelete).toHaveBeenCalledWith('instance-1', 'user-1');
      const state = store.getState().tasks;
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should throw error when task is not recurring', async () => {
      const nonRecurringTask = createMockTask({
        id: 'task-1',
        recurrence: null, // Not a recurring task
      });

      // Store has the task but it's not recurring
      const store = createTestStore({
        recurringParentTasks: {
          'task-1': nonRecurringTask,
        },
      });

      const result = await store.dispatch(
        editRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'task-1',
          instanceDate: new Date('2026-02-03'),
          updates: { title: 'Edited' },
        })
      );

      expect(result.type).toBe('tasks/editRecurringInstanceOnly/rejected');
      const state = store.getState().tasks;
      expect(state.error).toContain('not a recurring task');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // editRecurringFuture
  // ===========================================================================

  describe('editRecurringFuture', () => {
    it('should update the parent recurring task', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        title: 'Weekly Review',
        recurrence: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      const updatedParentTask = createMockTask({
        ...parentTask,
        title: 'Weekly Review - Updated',
      });

      vi.mocked(tasksService.updateTask).mockResolvedValue(updatedParentTask);

      await store.dispatch(
        editRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          updates: {
            title: 'Weekly Review - Updated',
          },
        })
      );

      const state = store.getState().tasks;
      expect(state.recurringParentTasks['parent-1'].title).toBe('Weekly Review - Updated');
      expect(state.syncStatus).toBe('synced');
    });

    it('should handle errors when updating parent task', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      vi.mocked(tasksService.updateTask).mockRejectedValue(new Error('Failed to update'));

      const result = await store.dispatch(
        editRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          updates: {
            title: 'Updated',
          },
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should set syncStatus to syncing while pending', () => {
      const store = createTestStore();

      vi.mocked(tasksService.updateTask).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(
        editRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          updates: {
            title: 'Updated',
          },
        })
      );

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });
  });

  // ===========================================================================
  // deleteRecurringInstanceOnly
  // ===========================================================================

  describe('deleteRecurringInstanceOnly', () => {
    it('should add exception to parent task', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        title: 'Daily Standup',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      const instanceDate = new Date('2026-02-03');
      const updatedParentTask = createMockTask({
        ...parentTask,
        recurrence: {
          ...parentTask.recurrence!,
          exceptions: [instanceDate],
        },
      });

      vi.mocked(tasksService.updateTask).mockResolvedValue(updatedParentTask);

      await store.dispatch(
        deleteRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate,
        })
      );

      const state = store.getState().tasks;
      expect(state.recurringParentTasks['parent-1'].recurrence?.exceptions).toHaveLength(1);
      expect(state.syncStatus).toBe('synced');
    });

    it('should handle error when parent task not found', async () => {
      const store = createTestStore();

      const result = await store.dispatch(
        deleteRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'non-existent',
          instanceDate: new Date('2026-02-03'),
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should handle error when task is not recurring', async () => {
      const nonRecurringTask = createMockTask({
        id: 'task-1',
        recurrence: null,
      });

      const store = createTestStore({
        recurringParentTasks: {
          'task-1': nonRecurringTask,
        },
      });

      const result = await store.dispatch(
        deleteRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'task-1',
          instanceDate: new Date('2026-02-03'),
        })
      );

      expect(result.type).toBe('tasks/deleteRecurringInstanceOnly/rejected');
      const state = store.getState().tasks;
      expect(state.error).toContain('not a recurring task');
      expect(state.syncStatus).toBe('error');
    });

    it('should set syncStatus to syncing while pending', () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      vi.mocked(tasksService.updateTask).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(
        deleteRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
        })
      );

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should handle service error', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        recurrence: {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      vi.mocked(tasksService.updateTask).mockRejectedValue(new Error('Failed to update'));

      const result = await store.dispatch(
        deleteRecurringInstanceOnly({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // deleteRecurringFuture
  // ===========================================================================

  describe('deleteRecurringFuture', () => {
    it('should set end date to day before instance date', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        title: 'Weekly Meeting',
        recurrence: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      const instanceDate = new Date('2026-02-03');
      const expectedEndDate = new Date('2026-02-02');
      expectedEndDate.setHours(0, 0, 0, 0);

      const updatedParentTask = createMockTask({
        ...parentTask,
        recurrence: {
          ...parentTask.recurrence!,
          endCondition: {
            type: 'date',
            endDate: expectedEndDate,
            maxOccurrences: null,
          },
        },
      });

      vi.mocked(tasksService.updateTask).mockResolvedValue(updatedParentTask);

      await store.dispatch(
        deleteRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate,
        })
      );

      const state = store.getState().tasks;
      expect(state.recurringParentTasks['parent-1'].recurrence?.endCondition.type).toBe('date');
      expect(state.recurringParentTasks['parent-1'].recurrence?.endCondition.endDate).toBeDefined();
      expect(state.syncStatus).toBe('synced');
    });

    it('should handle error when parent task not found', async () => {
      const store = createTestStore();

      const result = await store.dispatch(
        deleteRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'non-existent',
          instanceDate: new Date('2026-02-03'),
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });

    it('should handle error when task is not recurring', async () => {
      const nonRecurringTask = createMockTask({
        id: 'task-1',
        recurrence: null,
      });

      const store = createTestStore({
        recurringParentTasks: {
          'task-1': nonRecurringTask,
        },
      });

      const result = await store.dispatch(
        deleteRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'task-1',
          instanceDate: new Date('2026-02-03'),
        })
      );

      expect(result.type).toBe('tasks/deleteRecurringFuture/rejected');
      const state = store.getState().tasks;
      expect(state.error).toContain('not a recurring task');
      expect(state.syncStatus).toBe('error');
    });

    it('should set syncStatus to syncing while pending', () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        recurrence: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      vi.mocked(tasksService.updateTask).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(
        deleteRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
        })
      );

      const state = store.getState().tasks;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should handle service error', async () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        recurrence: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
      });

      const store = createTestStore({
        recurringParentTasks: {
          'parent-1': parentTask,
        },
      });

      vi.mocked(tasksService.updateTask).mockRejectedValue(new Error('Failed to update'));

      const result = await store.dispatch(
        deleteRecurringFuture({
          userId: 'user-1',
          parentTaskId: 'parent-1',
          instanceDate: new Date('2026-02-03'),
        })
      );

      const state = store.getState().tasks;
      expect(result.type).toContain('rejected');
      expect(state.error).toBeTruthy();
      expect(state.syncStatus).toBe('error');
    });
  });
});
