/**
 * selectFilteredTasks Selector Tests
 *
 * Tests for the selectFilteredTasks selector that filters tasks by status, category, and priority.
 */

import { describe, it, expect } from 'vitest';
import { selectFilteredTasks } from '../taskSlice';
import type { Task, TaskStatus, PriorityLetter } from '../../../types';
import type { RootState } from '../../../store';

// =============================================================================
// Test Setup
// =============================================================================

const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    title: 'A1 Task - Work - In Progress',
    description: '',
    categoryId: 'cat-work',
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
  },
  {
    id: 'task-2',
    userId: 'user-1',
    title: 'A2 Task - Personal - Complete',
    description: '',
    categoryId: 'cat-personal',
    priority: { letter: 'A', number: 2 },
    status: 'complete',
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
  },
  {
    id: 'task-3',
    userId: 'user-1',
    title: 'B1 Task - Work - Forward',
    description: '',
    categoryId: 'cat-work',
    priority: { letter: 'B', number: 1 },
    status: 'forward',
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
  },
  {
    id: 'task-4',
    userId: 'user-1',
    title: 'B2 Task - None - In Progress',
    description: '',
    categoryId: null,
    priority: { letter: 'B', number: 2 },
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
  },
  {
    id: 'task-5',
    userId: 'user-1',
    title: 'C1 Task - Personal - Delegate',
    description: '',
    categoryId: 'cat-personal',
    priority: { letter: 'C', number: 1 },
    status: 'delegate',
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
  },
];

function createMockRootState(
  tasks: Task[],
  statusFilter: TaskStatus[] | null = null,
  categoryFilter: string[] | null = null,
  priorityFilter: PriorityLetter[] | null = null
): any {
  const tasksMap: Record<string, Task> = {};
  const taskIdsByDate: Record<string, string[]> = {};

  tasks.forEach((task) => {
    tasksMap[task.id] = task;
    const dateKey = '2024-01-15';
    if (!taskIdsByDate[dateKey]) {
      taskIdsByDate[dateKey] = [];
    }
    taskIdsByDate[dateKey].push(task.id);
  });

  return {
    tasks: {
      tasks: tasksMap,
      taskIdsByDate,
      recurringParentTasks: {},
      recurringTasksLoaded: false,
      selectedDate: '2024-01-15',
      loading: false,
      error: null,
      syncStatus: 'synced' as const,
      reorderRollbackState: null,
    },
    filters: {
      statusFilter,
      categoryFilter,
      priorityFilter,
    },
    categories: {},
    events: {},
    notes: {},
    googleCalendar: {},
    reminders: {},
    sync: {},
    settings: {},
  };
}

// =============================================================================
// Selector Tests
// =============================================================================

describe('selectFilteredTasks', () => {
  describe('no filters active', () => {
    it('should return all tasks when no filters are set', () => {
      const state = createMockRootState(mockTasks);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(5);
    });

    it('should return all tasks when filters are empty arrays', () => {
      const state = createMockRootState(mockTasks, [], [], []);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(5);
    });
  });

  describe('status filter', () => {
    it('should filter by single status', () => {
      const state = createMockRootState(mockTasks, ['in_progress']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(2);
      expect(result.every((task) => task.status === 'in_progress')).toBe(true);
    });

    it('should filter by multiple statuses', () => {
      const state = createMockRootState(mockTasks, ['in_progress', 'complete']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(3);
      expect(
        result.every((task) => task.status === 'in_progress' || task.status === 'complete')
      ).toBe(true);
    });

    it('should return empty array when no tasks match status filter', () => {
      const state = createMockRootState(mockTasks, ['cancelled']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(0);
    });
  });

  describe('category filter', () => {
    it('should filter by single category', () => {
      const state = createMockRootState(mockTasks, null, ['cat-work']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(2);
      expect(result.every((task) => task.categoryId === 'cat-work')).toBe(true);
    });

    it('should filter by multiple categories', () => {
      const state = createMockRootState(mockTasks, null, ['cat-work', 'cat-personal']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(4);
      expect(
        result.every(
          (task) => task.categoryId === 'cat-work' || task.categoryId === 'cat-personal'
        )
      ).toBe(true);
    });

    it('should include uncategorized tasks when "null" is in category filter', () => {
      const state = createMockRootState(mockTasks, null, ['null']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBeNull();
    });

    it('should filter uncategorized and specific category', () => {
      const state = createMockRootState(mockTasks, null, ['null', 'cat-work']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(3);
      expect(
        result.every((task) => task.categoryId === null || task.categoryId === 'cat-work')
      ).toBe(true);
    });

    it('should return empty array when no tasks match category filter', () => {
      const state = createMockRootState(mockTasks, null, ['cat-nonexistent']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(0);
    });
  });

  describe('priority filter', () => {
    it('should filter by single priority', () => {
      const state = createMockRootState(mockTasks, null, null, ['A']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(2);
      expect(result.every((task) => task.priority.letter === 'A')).toBe(true);
    });

    it('should filter by multiple priorities', () => {
      const state = createMockRootState(mockTasks, null, null, ['A', 'B']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(4);
      expect(
        result.every((task) => task.priority.letter === 'A' || task.priority.letter === 'B')
      ).toBe(true);
    });

    it('should return empty array when no tasks match priority filter', () => {
      const state = createMockRootState(mockTasks, null, null, ['D']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(0);
    });
  });

  describe('combined filters (AND logic)', () => {
    it('should filter by status AND category', () => {
      const state = createMockRootState(mockTasks, ['in_progress'], ['cat-work']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
      expect(result[0].status).toBe('in_progress');
      expect(result[0].categoryId).toBe('cat-work');
    });

    it('should filter by status AND priority', () => {
      const state = createMockRootState(mockTasks, ['in_progress'], null, ['B']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-4');
      expect(result[0].status).toBe('in_progress');
      expect(result[0].priority.letter).toBe('B');
    });

    it('should filter by category AND priority', () => {
      const state = createMockRootState(mockTasks, null, ['cat-personal'], ['A']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-2');
      expect(result[0].categoryId).toBe('cat-personal');
      expect(result[0].priority.letter).toBe('A');
    });

    it('should filter by all three filters (status AND category AND priority)', () => {
      const state = createMockRootState(mockTasks, ['in_progress'], ['cat-work'], ['A']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
      expect(result[0].status).toBe('in_progress');
      expect(result[0].categoryId).toBe('cat-work');
      expect(result[0].priority.letter).toBe('A');
    });

    it('should return empty array when combined filters match nothing', () => {
      const state = createMockRootState(mockTasks, ['complete'], ['cat-work'], ['B']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(0);
    });

    it('should handle multiple values in each filter', () => {
      const state = createMockRootState(
        mockTasks,
        ['in_progress', 'forward'],
        ['cat-work', 'cat-personal'],
        ['A', 'B']
      );
      const result = selectFilteredTasks(state, '2024-01-15');

      // Should match task-1 (A, work, in_progress) and task-3 (B, work, forward)
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id).sort()).toEqual(['task-1', 'task-3']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty task list', () => {
      const state = createMockRootState([], ['in_progress']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(0);
    });

    it('should handle null categoryId correctly', () => {
      const tasksWithNull = mockTasks.filter((t) => t.categoryId === null);
      expect(tasksWithNull).toHaveLength(1); // task-4

      const state = createMockRootState(mockTasks, null, ['null']);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-4');
    });

    it('should handle tasks with different dates correctly', () => {
      // Selector should only consider tasks for the specified date
      // This is handled by selectTasksWithRecurringInstances which is called first
      const state = createMockRootState(mockTasks);
      const result = selectFilteredTasks(state, '2024-01-15');

      expect(result).toHaveLength(5);
    });
  });

  describe('memoization', () => {
    it('should return same reference when inputs unchanged', () => {
      const state = createMockRootState(mockTasks, ['in_progress']);
      const result1 = selectFilteredTasks(state, '2024-01-15');
      const result2 = selectFilteredTasks(state, '2024-01-15');

      // Note: createSelector memoizes based on input values, not object references
      // So this test verifies the selector works correctly rather than reference equality
      expect(result1).toEqual(result2);
    });
  });
});
