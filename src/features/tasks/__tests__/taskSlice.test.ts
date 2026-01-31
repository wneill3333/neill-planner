/**
 * Task Slice Tests
 *
 * Comprehensive tests for the task Redux slice including:
 * - Initial state
 * - All reducers
 * - All selectors
 * - Date index management
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import taskReducer, {
  initialState,
  setTasks,
  addTask,
  updateTask,
  removeTask,
  setSelectedDate,
  setLoading,
  setError,
  setSyncStatus,
  clearTasks,
  reorderTasksLocal,
  batchUpdateTasks,
  selectAllTasks,
  selectTaskById,
  selectTasksByDate,
  selectTasksForSelectedDate,
  selectSelectedDate,
  selectTasksLoading,
  selectTasksError,
  selectTasksSyncStatus,
  selectTasksByPriorityForDate,
  selectTaskCountForDate,
  selectCompletedTaskCountForDate,
  selectTasksLoadedForDate,
  type TasksState,
} from '../taskSlice';
import type { Task } from '../../../types';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a test store with the task reducer
 */
function createTestStore(preloadedState?: Partial<TasksState>) {
  return configureStore({
    reducer: { tasks: taskReducer },
    preloadedState: preloadedState ? { tasks: { ...initialState, ...preloadedState } } : undefined,
  });
}

/**
 * Create a mock task with default values
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  const now = new Date();
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user-123',
    title: 'Test Task',
    description: '',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: now,
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

/**
 * Get date string from Date object
 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// =============================================================================
// Initial State Tests
// =============================================================================

describe('Task Slice', () => {
  describe('Initial State', () => {
    it('should have correct initial state shape', () => {
      const store = createTestStore();
      const state = store.getState().tasks;

      expect(state.tasks).toEqual({});
      expect(state.taskIdsByDate).toEqual({});
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('synced');
    });

    it('should have selectedDate set to today', () => {
      const store = createTestStore();
      const state = store.getState().tasks;
      const today = new Date().toISOString().split('T')[0];

      expect(state.selectedDate).toBe(today);
    });
  });

  // ===========================================================================
  // setTasks Reducer Tests
  // ===========================================================================

  describe('setTasks reducer', () => {
    it('should set tasks for a specific date', () => {
      const store = createTestStore();
      const date = '2026-01-31';
      const scheduledDate = new Date('2026-01-31');
      const tasks = [
        createMockTask({ id: 'task-1', title: 'Task 1', scheduledDate }),
        createMockTask({ id: 'task-2', title: 'Task 2', scheduledDate }),
      ];

      store.dispatch(setTasks({ tasks, date }));

      const state = store.getState().tasks;
      expect(Object.keys(state.tasks)).toHaveLength(2);
      expect(state.tasks['task-1'].title).toBe('Task 1');
      expect(state.tasks['task-2'].title).toBe('Task 2');
      expect(state.taskIdsByDate[date]).toEqual(['task-1', 'task-2']);
    });

    it('should replace existing tasks for the same date', () => {
      const date = '2026-01-31';
      const scheduledDate = new Date('2026-01-31');
      const oldTask = createMockTask({ id: 'old-task', title: 'Old', scheduledDate });
      const newTask = createMockTask({ id: 'new-task', title: 'New', scheduledDate });

      const store = createTestStore({
        tasks: { 'old-task': oldTask },
        taskIdsByDate: { [date]: ['old-task'] },
      });

      store.dispatch(setTasks({ tasks: [newTask], date }));

      const state = store.getState().tasks;
      expect(state.tasks['old-task']).toBeUndefined();
      expect(state.tasks['new-task'].title).toBe('New');
      expect(state.taskIdsByDate[date]).toEqual(['new-task']);
    });

    it('should handle empty task array', () => {
      const date = '2026-01-31';
      const scheduledDate = new Date('2026-01-31');
      const existingTask = createMockTask({ id: 'task-1', scheduledDate });

      const store = createTestStore({
        tasks: { 'task-1': existingTask },
        taskIdsByDate: { [date]: ['task-1'] },
      });

      store.dispatch(setTasks({ tasks: [], date }));

      const state = store.getState().tasks;
      expect(state.tasks['task-1']).toBeUndefined();
      expect(state.taskIdsByDate[date]).toEqual([]);
    });

    it('should not affect tasks on other dates', () => {
      const date1 = '2026-01-30';
      const date2 = '2026-01-31';
      const task1 = createMockTask({ id: 'task-1', scheduledDate: new Date(date1) });
      const task2 = createMockTask({ id: 'task-2', scheduledDate: new Date(date2) });

      const store = createTestStore({
        tasks: { 'task-1': task1 },
        taskIdsByDate: { [date1]: ['task-1'] },
      });

      store.dispatch(setTasks({ tasks: [task2], date: date2 }));

      const state = store.getState().tasks;
      expect(state.tasks['task-1']).toBeDefined();
      expect(state.tasks['task-2']).toBeDefined();
      expect(state.taskIdsByDate[date1]).toEqual(['task-1']);
      expect(state.taskIdsByDate[date2]).toEqual(['task-2']);
    });
  });

  // ===========================================================================
  // addTask Reducer Tests
  // ===========================================================================

  describe('addTask reducer', () => {
    it('should add a task to the store', () => {
      const store = createTestStore();
      const task = createMockTask({ id: 'task-1', title: 'New Task' });

      store.dispatch(addTask(task));

      const state = store.getState().tasks;
      expect(state.tasks['task-1']).toBeDefined();
      expect(state.tasks['task-1'].title).toBe('New Task');
    });

    it('should add task to date index', () => {
      const store = createTestStore();
      const date = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', scheduledDate: date });

      store.dispatch(addTask(task));

      const state = store.getState().tasks;
      const dateString = toDateString(date);
      expect(state.taskIdsByDate[dateString]).toContain('task-1');
    });

    it('should handle task with null scheduledDate', () => {
      const store = createTestStore();
      const task = createMockTask({ id: 'task-1', scheduledDate: null });

      store.dispatch(addTask(task));

      const state = store.getState().tasks;
      expect(state.tasks['task-1']).toBeDefined();
      // Should not be in any date index
      expect(Object.values(state.taskIdsByDate).flat()).not.toContain('task-1');
    });

    it('should not duplicate task ID in date index', () => {
      const date = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', scheduledDate: date });
      const dateString = toDateString(date);

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { [dateString]: ['task-1'] },
      });

      // Try to add same task again
      store.dispatch(addTask(task));

      const state = store.getState().tasks;
      // Should not have duplicates
      expect(state.taskIdsByDate[dateString].filter((id) => id === 'task-1')).toHaveLength(1);
    });
  });

  // ===========================================================================
  // updateTask Reducer Tests
  // ===========================================================================

  describe('updateTask reducer', () => {
    it('should update task properties', () => {
      const task = createMockTask({ id: 'task-1', title: 'Original' });
      const store = createTestStore({
        tasks: { 'task-1': task },
      });

      store.dispatch(updateTask({ id: 'task-1', title: 'Updated' }));

      const state = store.getState().tasks;
      expect(state.tasks['task-1'].title).toBe('Updated');
    });

    it('should preserve unchanged properties', () => {
      const task = createMockTask({
        id: 'task-1',
        title: 'Original',
        description: 'Description',
        priority: { letter: 'A', number: 1 },
      });
      const store = createTestStore({
        tasks: { 'task-1': task },
      });

      store.dispatch(updateTask({ id: 'task-1', title: 'Updated' }));

      const state = store.getState().tasks;
      expect(state.tasks['task-1'].description).toBe('Description');
      expect(state.tasks['task-1'].priority).toEqual({ letter: 'A', number: 1 });
    });

    it('should handle date change and update index', () => {
      const oldDate = new Date('2026-01-30');
      const newDate = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', scheduledDate: oldDate });
      const oldDateString = toDateString(oldDate);
      const newDateString = toDateString(newDate);

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { [oldDateString]: ['task-1'] },
      });

      store.dispatch(updateTask({ id: 'task-1', scheduledDate: newDate }));

      const state = store.getState().tasks;
      expect(state.taskIdsByDate[oldDateString]).toBeUndefined();
      expect(state.taskIdsByDate[newDateString]).toContain('task-1');
    });

    it('should handle changing from scheduled to unscheduled', () => {
      const date = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', scheduledDate: date });
      const dateString = toDateString(date);

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { [dateString]: ['task-1'] },
      });

      store.dispatch(updateTask({ id: 'task-1', scheduledDate: null }));

      const state = store.getState().tasks;
      expect(state.taskIdsByDate[dateString]).toBeUndefined();
    });

    it('should do nothing for non-existent task', () => {
      const store = createTestStore();

      store.dispatch(updateTask({ id: 'non-existent', title: 'Updated' }));

      const state = store.getState().tasks;
      expect(state.tasks['non-existent']).toBeUndefined();
    });
  });

  // ===========================================================================
  // removeTask Reducer Tests
  // ===========================================================================

  describe('removeTask reducer', () => {
    it('should remove task from store', () => {
      const task = createMockTask({ id: 'task-1' });
      const store = createTestStore({
        tasks: { 'task-1': task },
      });

      store.dispatch(removeTask('task-1'));

      const state = store.getState().tasks;
      expect(state.tasks['task-1']).toBeUndefined();
    });

    it('should remove task from date index', () => {
      const date = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', scheduledDate: date });
      const dateString = toDateString(date);

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { [dateString]: ['task-1'] },
      });

      store.dispatch(removeTask('task-1'));

      const state = store.getState().tasks;
      expect(state.taskIdsByDate[dateString]).toBeUndefined();
    });

    it('should clean up empty date index arrays', () => {
      const date = new Date('2026-01-31');
      const task1 = createMockTask({ id: 'task-1', scheduledDate: date });
      const task2 = createMockTask({ id: 'task-2', scheduledDate: date });
      const dateString = toDateString(date);

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
        taskIdsByDate: { [dateString]: ['task-1', 'task-2'] },
      });

      store.dispatch(removeTask('task-1'));

      let state = store.getState().tasks;
      expect(state.taskIdsByDate[dateString]).toEqual(['task-2']);

      store.dispatch(removeTask('task-2'));

      state = store.getState().tasks;
      expect(state.taskIdsByDate[dateString]).toBeUndefined();
    });

    it('should do nothing for non-existent task', () => {
      const task = createMockTask({ id: 'task-1' });
      const store = createTestStore({
        tasks: { 'task-1': task },
      });

      store.dispatch(removeTask('non-existent'));

      const state = store.getState().tasks;
      expect(state.tasks['task-1']).toBeDefined();
    });
  });

  // ===========================================================================
  // Other Reducers Tests
  // ===========================================================================

  describe('setSelectedDate reducer', () => {
    it('should update selected date', () => {
      const store = createTestStore();

      store.dispatch(setSelectedDate('2026-02-15'));

      const state = store.getState().tasks;
      expect(state.selectedDate).toBe('2026-02-15');
    });
  });

  describe('setLoading reducer', () => {
    it('should set loading to true', () => {
      const store = createTestStore();

      store.dispatch(setLoading(true));

      expect(store.getState().tasks.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const store = createTestStore({ loading: true });

      store.dispatch(setLoading(false));

      expect(store.getState().tasks.loading).toBe(false);
    });
  });

  describe('setError reducer', () => {
    it('should set error message', () => {
      const store = createTestStore();

      store.dispatch(setError('Something went wrong'));

      expect(store.getState().tasks.error).toBe('Something went wrong');
    });

    it('should clear error with null', () => {
      const store = createTestStore({ error: 'Previous error' });

      store.dispatch(setError(null));

      expect(store.getState().tasks.error).toBeNull();
    });
  });

  describe('setSyncStatus reducer', () => {
    it('should update sync status', () => {
      const store = createTestStore();

      store.dispatch(setSyncStatus('syncing'));
      expect(store.getState().tasks.syncStatus).toBe('syncing');

      store.dispatch(setSyncStatus('error'));
      expect(store.getState().tasks.syncStatus).toBe('error');

      store.dispatch(setSyncStatus('synced'));
      expect(store.getState().tasks.syncStatus).toBe('synced');
    });
  });

  describe('clearTasks reducer', () => {
    it('should clear all tasks and indexes', () => {
      const task1 = createMockTask({ id: 'task-1', scheduledDate: new Date('2026-01-31') });
      const task2 = createMockTask({ id: 'task-2', scheduledDate: new Date('2026-02-01') });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
        taskIdsByDate: { '2026-01-31': ['task-1'], '2026-02-01': ['task-2'] },
        error: 'Some error',
      });

      store.dispatch(clearTasks());

      const state = store.getState().tasks;
      expect(state.tasks).toEqual({});
      expect(state.taskIdsByDate).toEqual({});
      expect(state.error).toBeNull();
    });

    it('should preserve selectedDate and other meta fields', () => {
      const store = createTestStore({
        selectedDate: '2026-03-15',
        syncStatus: 'offline',
      });

      store.dispatch(clearTasks());

      const state = store.getState().tasks;
      expect(state.selectedDate).toBe('2026-03-15');
      expect(state.syncStatus).toBe('offline');
    });
  });

  describe('reorderTasksLocal reducer', () => {
    it('should update priority numbers based on new order', () => {
      const date = new Date('2026-01-31');
      const task1 = createMockTask({
        id: 'task-1',
        priority: { letter: 'A', number: 1 },
        scheduledDate: date,
      });
      const task2 = createMockTask({
        id: 'task-2',
        priority: { letter: 'A', number: 2 },
        scheduledDate: date,
      });
      const task3 = createMockTask({
        id: 'task-3',
        priority: { letter: 'A', number: 3 },
        scheduledDate: date,
      });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2, 'task-3': task3 },
      });

      // Reorder: task-3 first, task-1 second, task-2 third
      store.dispatch(
        reorderTasksLocal({ taskIds: ['task-3', 'task-1', 'task-2'], priorityLetter: 'A' })
      );

      const state = store.getState().tasks;
      expect(state.tasks['task-3'].priority.number).toBe(1);
      expect(state.tasks['task-1'].priority.number).toBe(2);
      expect(state.tasks['task-2'].priority.number).toBe(3);
    });

    it('should only update tasks matching the priority letter', () => {
      const task1 = createMockTask({ id: 'task-1', priority: { letter: 'A', number: 1 } });
      const task2 = createMockTask({ id: 'task-2', priority: { letter: 'B', number: 1 } });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
      });

      store.dispatch(reorderTasksLocal({ taskIds: ['task-1', 'task-2'], priorityLetter: 'A' }));

      const state = store.getState().tasks;
      expect(state.tasks['task-1'].priority.number).toBe(1);
      // task-2 should be unchanged (different priority letter)
      expect(state.tasks['task-2'].priority.number).toBe(1);
    });
  });

  describe('batchUpdateTasks reducer', () => {
    it('should update multiple existing tasks', () => {
      const date = new Date('2026-01-31');
      const task1 = createMockTask({ id: 'task-1', title: 'Original 1', scheduledDate: date });
      const task2 = createMockTask({ id: 'task-2', title: 'Original 2', scheduledDate: date });

      const store = createTestStore({
        tasks: { 'task-1': task1, 'task-2': task2 },
        taskIdsByDate: { '2026-01-31': ['task-1', 'task-2'] },
      });

      const updatedTask1 = { ...task1, title: 'Updated 1' };
      const updatedTask2 = { ...task2, title: 'Updated 2' };

      store.dispatch(batchUpdateTasks([updatedTask1, updatedTask2]));

      const state = store.getState().tasks;
      expect(state.tasks['task-1'].title).toBe('Updated 1');
      expect(state.tasks['task-2'].title).toBe('Updated 2');
    });

    it('should add new tasks and update existing ones', () => {
      const date = new Date('2026-01-31');
      const existingTask = createMockTask({ id: 'existing', scheduledDate: date });
      const newTask = createMockTask({ id: 'new', title: 'New Task', scheduledDate: date });

      const store = createTestStore({
        tasks: { existing: existingTask },
        taskIdsByDate: { '2026-01-31': ['existing'] },
      });

      const updatedExisting = { ...existingTask, title: 'Updated' };
      store.dispatch(batchUpdateTasks([updatedExisting, newTask]));

      const state = store.getState().tasks;
      expect(state.tasks['existing'].title).toBe('Updated');
      expect(state.tasks['new'].title).toBe('New Task');
      expect(state.taskIdsByDate['2026-01-31']).toContain('new');
    });

    it('should handle date changes in batch', () => {
      const oldDate = new Date('2026-01-30');
      const newDate = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', scheduledDate: oldDate });

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { '2026-01-30': ['task-1'] },
      });

      const updatedTask = { ...task, scheduledDate: newDate };
      store.dispatch(batchUpdateTasks([updatedTask]));

      const state = store.getState().tasks;
      expect(state.taskIdsByDate['2026-01-30']).toBeUndefined();
      expect(state.taskIdsByDate['2026-01-31']).toContain('task-1');
    });
  });

  // ===========================================================================
  // Selector Tests
  // ===========================================================================

  describe('Selectors', () => {
    describe('selectAllTasks', () => {
      it('should return all tasks as array', () => {
        const task1 = createMockTask({ id: 'task-1' });
        const task2 = createMockTask({ id: 'task-2' });

        const store = createTestStore({
          tasks: { 'task-1': task1, 'task-2': task2 },
        });

        const allTasks = selectAllTasks(store.getState());
        expect(allTasks).toHaveLength(2);
        expect(allTasks.map((t) => t.id).sort()).toEqual(['task-1', 'task-2']);
      });

      it('should return empty array when no tasks', () => {
        const store = createTestStore();
        expect(selectAllTasks(store.getState())).toEqual([]);
      });
    });

    describe('selectTaskById', () => {
      it('should return task by ID', () => {
        const task = createMockTask({ id: 'task-1', title: 'Test' });
        const store = createTestStore({ tasks: { 'task-1': task } });

        expect(selectTaskById(store.getState(), 'task-1')?.title).toBe('Test');
      });

      it('should return undefined for non-existent ID', () => {
        const store = createTestStore();
        expect(selectTaskById(store.getState(), 'non-existent')).toBeUndefined();
      });
    });

    describe('selectTasksByDate', () => {
      it('should return tasks for specific date', () => {
        const date = new Date('2026-01-31');
        const task1 = createMockTask({ id: 'task-1', scheduledDate: date });
        const task2 = createMockTask({ id: 'task-2', scheduledDate: date });

        const store = createTestStore({
          tasks: { 'task-1': task1, 'task-2': task2 },
          taskIdsByDate: { '2026-01-31': ['task-1', 'task-2'] },
        });

        const tasks = selectTasksByDate(store.getState(), '2026-01-31');
        expect(tasks).toHaveLength(2);
      });

      it('should return empty array for date with no tasks', () => {
        const store = createTestStore();
        expect(selectTasksByDate(store.getState(), '2026-01-31')).toEqual([]);
      });

      it('should filter out undefined tasks (stale index)', () => {
        const task = createMockTask({ id: 'task-1' });

        const store = createTestStore({
          tasks: { 'task-1': task },
          taskIdsByDate: { '2026-01-31': ['task-1', 'deleted-task'] },
        });

        const tasks = selectTasksByDate(store.getState(), '2026-01-31');
        expect(tasks).toHaveLength(1);
        expect(tasks[0].id).toBe('task-1');
      });
    });

    describe('selectTasksForSelectedDate', () => {
      it('should return tasks for the selected date', () => {
        const date = new Date('2026-01-31');
        const task = createMockTask({ id: 'task-1', scheduledDate: date });

        const store = createTestStore({
          tasks: { 'task-1': task },
          taskIdsByDate: { '2026-01-31': ['task-1'] },
          selectedDate: '2026-01-31',
        });

        const tasks = selectTasksForSelectedDate(store.getState());
        expect(tasks).toHaveLength(1);
        expect(tasks[0].id).toBe('task-1');
      });
    });

    describe('selectSelectedDate', () => {
      it('should return the selected date', () => {
        const store = createTestStore({ selectedDate: '2026-03-15' });
        expect(selectSelectedDate(store.getState())).toBe('2026-03-15');
      });
    });

    describe('selectTasksLoading', () => {
      it('should return loading state', () => {
        const store = createTestStore({ loading: true });
        expect(selectTasksLoading(store.getState())).toBe(true);
      });
    });

    describe('selectTasksError', () => {
      it('should return error message', () => {
        const store = createTestStore({ error: 'Error occurred' });
        expect(selectTasksError(store.getState())).toBe('Error occurred');
      });
    });

    describe('selectTasksSyncStatus', () => {
      it('should return sync status', () => {
        const store = createTestStore({ syncStatus: 'syncing' });
        expect(selectTasksSyncStatus(store.getState())).toBe('syncing');
      });
    });

    describe('selectTasksByPriorityForDate', () => {
      it('should return tasks grouped and sorted by priority', () => {
        const date = new Date('2026-01-31');
        const taskA2 = createMockTask({
          id: 'a2',
          priority: { letter: 'A', number: 2 },
          scheduledDate: date,
        });
        const taskA1 = createMockTask({
          id: 'a1',
          priority: { letter: 'A', number: 1 },
          scheduledDate: date,
        });
        const taskB1 = createMockTask({
          id: 'b1',
          priority: { letter: 'B', number: 1 },
          scheduledDate: date,
        });
        const taskC1 = createMockTask({
          id: 'c1',
          priority: { letter: 'C', number: 1 },
          scheduledDate: date,
        });

        const store = createTestStore({
          tasks: { a2: taskA2, a1: taskA1, b1: taskB1, c1: taskC1 },
          taskIdsByDate: { '2026-01-31': ['a2', 'a1', 'b1', 'c1'] },
        });

        const grouped = selectTasksByPriorityForDate(store.getState(), '2026-01-31');

        expect(grouped.A).toHaveLength(2);
        expect(grouped.A[0].id).toBe('a1'); // Sorted by number
        expect(grouped.A[1].id).toBe('a2');
        expect(grouped.B).toHaveLength(1);
        expect(grouped.C).toHaveLength(1);
        expect(grouped.D).toHaveLength(0);
      });

      it('should return empty groups for date with no tasks', () => {
        const store = createTestStore();
        const grouped = selectTasksByPriorityForDate(store.getState(), '2026-01-31');

        expect(grouped).toEqual({ A: [], B: [], C: [], D: [] });
      });
    });

    describe('selectTaskCountForDate', () => {
      it('should return count of tasks for date', () => {
        const store = createTestStore({
          taskIdsByDate: { '2026-01-31': ['a', 'b', 'c'] },
        });

        expect(selectTaskCountForDate(store.getState(), '2026-01-31')).toBe(3);
      });

      it('should return 0 for date with no tasks', () => {
        const store = createTestStore();
        expect(selectTaskCountForDate(store.getState(), '2026-01-31')).toBe(0);
      });
    });

    describe('selectCompletedTaskCountForDate', () => {
      it('should return count of completed tasks', () => {
        const date = new Date('2026-01-31');
        const task1 = createMockTask({ id: 't1', status: 'complete', scheduledDate: date });
        const task2 = createMockTask({ id: 't2', status: 'in_progress', scheduledDate: date });
        const task3 = createMockTask({ id: 't3', status: 'complete', scheduledDate: date });

        const store = createTestStore({
          tasks: { t1: task1, t2: task2, t3: task3 },
          taskIdsByDate: { '2026-01-31': ['t1', 't2', 't3'] },
        });

        expect(selectCompletedTaskCountForDate(store.getState(), '2026-01-31')).toBe(2);
      });
    });

    describe('selectTasksLoadedForDate', () => {
      it('should return true if date has been loaded', () => {
        const store = createTestStore({
          taskIdsByDate: { '2026-01-31': [] },
        });

        expect(selectTasksLoadedForDate(store.getState(), '2026-01-31')).toBe(true);
      });

      it('should return false if date has not been loaded', () => {
        const store = createTestStore();
        expect(selectTasksLoadedForDate(store.getState(), '2026-01-31')).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle task with complex recurrence pattern', () => {
      const store = createTestStore();
      const task = createMockTask({
        id: 'recurring',
        recurrence: {
          type: 'weekly',
          interval: 2,
          daysOfWeek: [1, 3, 5],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: {
            type: 'occurrences',
            endDate: null,
            maxOccurrences: 10,
          },
          exceptions: [new Date('2026-02-01')],
        },
      });

      store.dispatch(addTask(task));

      const state = store.getState().tasks;
      expect(state.tasks['recurring'].recurrence?.type).toBe('weekly');
      expect(state.tasks['recurring'].recurrence?.daysOfWeek).toEqual([1, 3, 5]);
    });

    it('should handle rapid successive updates', () => {
      const date = new Date('2026-01-31');
      const task = createMockTask({ id: 'task-1', title: 'Original', scheduledDate: date });
      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { '2026-01-31': ['task-1'] },
      });

      // Rapid updates
      for (let i = 0; i < 100; i++) {
        store.dispatch(updateTask({ id: 'task-1', title: `Update ${i}` }));
      }

      const state = store.getState().tasks;
      expect(state.tasks['task-1'].title).toBe('Update 99');
    });

    it('should handle updating all task properties at once', () => {
      const oldDate = new Date('2026-01-30');
      const newDate = new Date('2026-01-31');
      const task = createMockTask({
        id: 'task-1',
        title: 'Old',
        description: 'Old desc',
        scheduledDate: oldDate,
        priority: { letter: 'D', number: 1 },
        status: 'in_progress',
      });

      const store = createTestStore({
        tasks: { 'task-1': task },
        taskIdsByDate: { '2026-01-30': ['task-1'] },
      });

      store.dispatch(
        updateTask({
          id: 'task-1',
          title: 'New',
          description: 'New desc',
          scheduledDate: newDate,
          priority: { letter: 'A', number: 5 },
          status: 'complete',
          categoryId: 'cat-1',
        })
      );

      const state = store.getState().tasks;
      const updated = state.tasks['task-1'];

      expect(updated.title).toBe('New');
      expect(updated.description).toBe('New desc');
      expect(updated.priority).toEqual({ letter: 'A', number: 5 });
      expect(updated.status).toBe('complete');
      expect(updated.categoryId).toBe('cat-1');
      expect(state.taskIdsByDate['2026-01-30']).toBeUndefined();
      expect(state.taskIdsByDate['2026-01-31']).toContain('task-1');
    });

    it('should handle special characters in task title', () => {
      const store = createTestStore();
      const task = createMockTask({
        id: 'task-1',
        title: 'Test <script>alert("xss")</script> & "quotes" \'apostrophe\' 日本語',
      });

      store.dispatch(addTask(task));

      const state = store.getState().tasks;
      expect(state.tasks['task-1'].title).toBe(
        'Test <script>alert("xss")</script> & "quotes" \'apostrophe\' 日本語'
      );
    });
  });
});
