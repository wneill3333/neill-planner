/**
 * reorderTasksAsync Thunk Tests
 *
 * Tests for the drag-and-drop persistence thunk
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import taskReducer from '../taskSlice';
import { reorderTasksAsync } from '../taskThunks';
import * as tasksService from '../../../services/firebase/tasks.service';
import type { Task, PriorityLetter } from '../../../types';

// Mock the Firebase service
vi.mock('../../../services/firebase/tasks.service', () => ({
  batchUpdateTasks: vi.fn(),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: '',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: null,
    recurrence: null,
    linkedNoteIds: [],
    linkedEventId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}

function createTestStore(tasks: Task[] = []) {
  const tasksById: Record<string, Task> = {};
  const taskIdsByDate: Record<string, string[]> = {};

  for (const task of tasks) {
    tasksById[task.id] = task;
    const dateString = task.scheduledDate.toISOString().split('T')[0];
    if (!taskIdsByDate[dateString]) {
      taskIdsByDate[dateString] = [];
    }
    taskIdsByDate[dateString].push(task.id);
  }

  return configureStore({
    reducer: {
      tasks: taskReducer,
    },
    preloadedState: {
      tasks: {
        tasks: tasksById,
        taskIdsByDate,
        selectedDate: '2024-01-15',
        loading: false,
        error: null,
        syncStatus: 'synced',
        reorderRollbackState: null,
      },
    },
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('reorderTasksAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should create update inputs with new priority numbers', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-a2', priority: { letter: 'A', number: 2 } }),
        createMockTask({ id: 'task-a3', priority: { letter: 'A', number: 3 } }),
      ];

      const store = createTestStore(tasks);

      // Mock successful batch update
      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue(undefined);

      // Reorder: A3, A1, A2
      const reorderedIds = ['task-a3', 'task-a1', 'task-a2'];
      await store.dispatch(
        reorderTasksAsync({
          taskIds: reorderedIds,
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      // Verify batchUpdateTasks was called with correct updates
      expect(tasksService.batchUpdateTasks).toHaveBeenCalledTimes(1);
      expect(tasksService.batchUpdateTasks).toHaveBeenCalledWith(
        [
          { id: 'task-a3', priority: { letter: 'A', number: 1 } },
          { id: 'task-a1', priority: { letter: 'A', number: 2 } },
          { id: 'task-a2', priority: { letter: 'A', number: 3 } },
        ],
        'user-1'
      );
    });

    it('should handle single task (no actual reorder)', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
      ];

      const store = createTestStore(tasks);
      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue(undefined);

      await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a1'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      // Should still call service with one update
      expect(tasksService.batchUpdateTasks).toHaveBeenCalledWith(
        [{ id: 'task-a1', priority: { letter: 'A', number: 1 } }],
        'user-1'
      );
    });

    it('should update sync status to synced on success', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-a2', priority: { letter: 'A', number: 2 } }),
      ];

      const store = createTestStore(tasks);
      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue(undefined);

      await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a2', 'task-a1'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      const state = store.getState();
      expect(state.tasks.syncStatus).toBe('synced');
      expect(state.tasks.error).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should reject when task not found', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
      ];

      const store = createTestStore(tasks);

      // Try to reorder with non-existent task ID
      const result = await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a1', 'task-nonexistent'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      expect(result.type).toBe('tasks/reorderTasksAsync/rejected');
      expect(result.payload).toEqual({
        message: 'Invalid task in reorder: task-nonexistent',
      });
    });

    it('should reject when task has wrong priority letter', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-b1', priority: { letter: 'B', number: 1 } }),
      ];

      const store = createTestStore(tasks);

      // Try to reorder A tasks with a B task included
      const result = await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a1', 'task-b1'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      expect(result.type).toBe('tasks/reorderTasksAsync/rejected');
      expect(result.payload).toEqual({
        message: 'Invalid task in reorder: task-b1',
      });
    });

    it('should handle Firebase service errors', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-a2', priority: { letter: 'A', number: 2 } }),
      ];

      const store = createTestStore(tasks);

      // Mock service failure
      const serviceError = new Error('Firebase: Permission denied');
      vi.mocked(tasksService.batchUpdateTasks).mockRejectedValue(serviceError);

      const result = await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a2', 'task-a1'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      expect(result.type).toBe('tasks/reorderTasksAsync/rejected');
      expect(result.payload).toEqual({
        message: 'Firebase: Permission denied',
      });
    });

    it('should set error state on rejection', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
      ];

      const store = createTestStore(tasks);
      vi.mocked(tasksService.batchUpdateTasks).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a1'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      const state = store.getState();
      expect(state.tasks.syncStatus).toBe('error');
      // The error message is the original error, not the generic message
      expect(state.tasks.error).toBe('Network error');
    });

    it('should rollback priority numbers on service error', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
        createMockTask({ id: 'task-a2', priority: { letter: 'A', number: 2 } }),
        createMockTask({ id: 'task-a3', priority: { letter: 'A', number: 3 } }),
      ];

      const store = createTestStore(tasks);

      // First apply optimistic update via reorderTasksLocal
      // Import the action to simulate what the container does
      const { reorderTasksLocal } = await import('../taskSlice');

      // Apply optimistic update (A3, A1, A2 - moving A3 to first position)
      store.dispatch(
        reorderTasksLocal({
          taskIds: ['task-a3', 'task-a1', 'task-a2'],
          priorityLetter: 'A' as PriorityLetter,
        })
      );

      // Verify optimistic update was applied
      let state = store.getState();
      expect(state.tasks.tasks['task-a3'].priority.number).toBe(1);
      expect(state.tasks.tasks['task-a1'].priority.number).toBe(2);
      expect(state.tasks.tasks['task-a2'].priority.number).toBe(3);
      expect(state.tasks.reorderRollbackState).not.toBeNull();

      // Mock service to fail
      vi.mocked(tasksService.batchUpdateTasks).mockRejectedValue(
        new Error('Network error')
      );

      // Dispatch the async thunk which will fail
      await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a3', 'task-a1', 'task-a2'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      // Verify priorities rolled back to original values
      state = store.getState();
      expect(state.tasks.tasks['task-a1'].priority.number).toBe(1);
      expect(state.tasks.tasks['task-a2'].priority.number).toBe(2);
      expect(state.tasks.tasks['task-a3'].priority.number).toBe(3);
      expect(state.tasks.reorderRollbackState).toBeNull();
      expect(state.tasks.syncStatus).toBe('error');
    });
  });

  describe('Priority Number Calculation', () => {
    it('should assign sequential 1-based numbers', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 5 } }),
        createMockTask({ id: 'task-a2', priority: { letter: 'A', number: 10 } }),
        createMockTask({ id: 'task-a3', priority: { letter: 'A', number: 15 } }),
      ];

      const store = createTestStore(tasks);
      vi.mocked(tasksService.batchUpdateTasks).mockResolvedValue(undefined);

      await store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a1', 'task-a2', 'task-a3'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      // Should renumber to 1, 2, 3 regardless of original numbers
      expect(tasksService.batchUpdateTasks).toHaveBeenCalledWith(
        [
          { id: 'task-a1', priority: { letter: 'A', number: 1 } },
          { id: 'task-a2', priority: { letter: 'A', number: 2 } },
          { id: 'task-a3', priority: { letter: 'A', number: 3 } },
        ],
        'user-1'
      );
    });
  });

  describe('Loading States', () => {
    it('should set sync status to syncing when pending', async () => {
      const tasks = [
        createMockTask({ id: 'task-a1', priority: { letter: 'A', number: 1 } }),
      ];

      const store = createTestStore(tasks);

      // Create a promise we can control
      let resolveService: () => void;
      const servicePromise = new Promise<void>((resolve) => {
        resolveService = resolve;
      });

      vi.mocked(tasksService.batchUpdateTasks).mockReturnValue(servicePromise);

      // Dispatch the thunk
      const promise = store.dispatch(
        reorderTasksAsync({
          taskIds: ['task-a1'],
          priorityLetter: 'A' as PriorityLetter,
          userId: 'user-1',
        })
      );

      // Check pending state
      let state = store.getState();
      expect(state.tasks.syncStatus).toBe('syncing');

      // Resolve the service call
      resolveService!();
      await promise;

      // Check fulfilled state
      state = store.getState();
      expect(state.tasks.syncStatus).toBe('synced');
    });
  });
});
