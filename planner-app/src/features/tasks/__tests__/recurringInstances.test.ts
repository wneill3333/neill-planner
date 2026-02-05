/**
 * Tests for Recurring Task Instance Display (Step 6.2.2)
 *
 * Verifies that recurring task instances are correctly generated and displayed
 * alongside regular tasks in the task list.
 */

import { describe, it, expect } from 'vitest';
import { startOfDay } from 'date-fns';
import type { Task, RecurrencePattern } from '../../../types';
import { selectTasksWithRecurringInstances } from '../taskSlice';
import type { RootState } from '../../../store';

/**
 * Helper to create a mock Redux state
 */
function createMockState(
  tasks: Record<string, Task> = {},
  taskIdsByDate: Record<string, string[]> = {},
  recurringParentTasks: Record<string, Task> = {}
): RootState {
  return {
    tasks: {
      tasks,
      taskIdsByDate,
      recurringParentTasks,
      recurringTasksLoaded: true,
      selectedDate: '2026-02-03',
      loading: false,
      error: null,
      syncStatus: 'synced',
      reorderRollbackState: null,
    },
    categories: {
      categories: {},
      initialized: false,
      loading: false,
      error: null,
    },
  } as RootState;
}

/**
 * Helper to create a regular task
 */
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Regular Task',
    description: '',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date('2026-02-03'),
    scheduledTime: null,
    recurrence: null,
    linkedNoteIds: [],
    linkedEventId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Helper to create a recurring parent task
 */
function createRecurringTask(
  id: string,
  scheduledDate: Date,
  recurrence: RecurrencePattern,
  overrides: Partial<Task> = {}
): Task {
  return createTask({
    id,
    title: 'Recurring Task',
    scheduledDate,
    recurrence,
    ...overrides,
  });
}

describe('selectTasksWithRecurringInstances', () => {
  describe('basic functionality', () => {
    it('should return regular tasks when no recurring tasks exist', () => {
      const date = '2026-02-03';
      const regularTask = createTask({
        id: 'task-1',
        scheduledDate: new Date(date),
      });

      const state = createMockState(
        { 'task-1': regularTask },
        { [date]: ['task-1'] },
        {}
      );

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
      expect(result[0].isRecurringInstance).toBe(false);
    });

    it('should generate instances for daily recurring tasks', () => {
      const date = '2026-02-03';
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      // Should have one instance for Feb 3
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recurring-1_2026-02-03');
      expect(result[0].isRecurringInstance).toBe(true);
      expect(result[0].recurringParentId).toBe('recurring-1');
      expect(result[0].recurrence).toBeNull();
    });

    it('should combine regular tasks and recurring instances', () => {
      const date = '2026-02-03';
      const regularTask = createTask({
        id: 'task-1',
        scheduledDate: new Date(date),
        priority: { letter: 'B', number: 1 },
      });

      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'A', number: 1 } }
      );

      const state = createMockState(
        { 'task-1': regularTask },
        { [date]: ['task-1'] },
        { 'recurring-1': recurringTask }
      );

      const result = selectTasksWithRecurringInstances(state, date);

      // Should have both tasks
      expect(result).toHaveLength(2);

      // Should be sorted by priority (A before B)
      expect(result[0].priority.letter).toBe('A');
      expect(result[0].isRecurringInstance).toBe(true);
      expect(result[1].priority.letter).toBe('B');
      expect(result[1].isRecurringInstance).toBe(false);
    });
  });

  describe('recurrence patterns', () => {
    it('should generate instances for weekly recurring tasks', () => {
      const date = '2026-02-03'; // Tuesday
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-02-03'), // Start on Tuesday
        {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [2], // Tuesday = 2
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recurring-1_2026-02-03');
      expect(result[0].isRecurringInstance).toBe(true);
    });

    it('should not generate instances on days not in daysOfWeek', () => {
      const date = '2026-02-04'; // Wednesday
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-02-03'), // Start on Tuesday
        {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [2], // Tuesday only
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      // Should be empty - no instance on Wednesday
      expect(result).toHaveLength(0);
    });

    it('should generate instances for monthly recurring tasks', () => {
      const date = '2026-02-15'; // 15th of the month
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-01-15'), // Start on Jan 15
        {
          type: 'monthly',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: 15,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recurring-1_2026-02-15');
    });
  });

  describe('end conditions', () => {
    it('should not generate instances after end date', () => {
      const date = '2026-02-10';
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date(2026, 1, 1), // Feb 1, 2026 (month is 0-indexed)
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: {
            type: 'date',
            endDate: new Date(2026, 1, 5), // Feb 5, 2026 - Ends before Feb 10
            maxOccurrences: null,
          },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      // Should be empty - end date is before Feb 10
      expect(result).toHaveLength(0);
    });

    it('should respect max occurrences when generating instances', () => {
      const date = '2026-02-03';
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date(2026, 1, 1), // Feb 1, 2026
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: {
            type: 'occurrences',
            endDate: null,
            maxOccurrences: 3, // Only 3 occurrences total
          },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      // Should have instance for Feb 3 (which is the 3rd occurrence)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recurring-1_2026-02-03');
    });
  });

  describe('exceptions', () => {
    it('should not generate instances on exception dates', () => {
      const date = '2026-02-03';
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date(2026, 1, 1), // Feb 1, 2026
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [new Date(2026, 1, 3)], // Exception on Feb 3, 2026
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      // Should be empty - Feb 3 is an exception
      expect(result).toHaveLength(0);
    });
  });

  describe('sorting and priority', () => {
    it('should sort tasks by priority letter then number', () => {
      // Recurring instances inherit only the priority LETTER from the parent.
      // The NUMBER is auto-assigned based on existing regular tasks for that day.
      const date = '2026-02-03';
      const taskB2 = createTask({
        id: 'task-b2',
        scheduledDate: new Date(date),
        priority: { letter: 'B', number: 2 },
      });

      const taskA2 = createTask({
        id: 'task-a2',
        scheduledDate: new Date(date),
        priority: { letter: 'A', number: 2 },
      });

      const taskA1Recurring = createRecurringTask(
        'recurring-a1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'A', number: 1 } } // Parent has A1, but instance gets auto-numbered
      );

      const state = createMockState(
        { 'task-b2': taskB2, 'task-a2': taskA2 },
        { [date]: ['task-b2', 'task-a2'] },
        { 'recurring-a1': taskA1Recurring }
      );

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toHaveLength(3);
      // Regular A2 comes first, then recurring instance gets A3 (next available)
      expect(result[0].priority).toEqual({ letter: 'A', number: 2 }); // A2 regular
      expect(result[1].priority).toEqual({ letter: 'A', number: 3 }); // A3 instance (auto-numbered)
      expect(result[2].priority).toEqual({ letter: 'B', number: 2 }); // B2 regular
    });
  });

  describe('multiple recurring tasks', () => {
    it('should generate instances from multiple recurring parent tasks', () => {
      const date = '2026-02-03';
      const recurring1 = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'A', number: 1 } }
      );

      const recurring2 = createRecurringTask(
        'recurring-2',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'B', number: 1 } }
      );

      const state = createMockState(
        {},
        {},
        { 'recurring-1': recurring1, 'recurring-2': recurring2 }
      );

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('recurring-1_2026-02-03');
      expect(result[1].id).toBe('recurring-2_2026-02-03');
    });
  });

  describe('instance properties', () => {
    it('should set correct properties on generated instances', () => {
      const date = '2026-02-03';
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        {
          title: 'Daily Task',
          description: 'Test description',
          categoryId: 'cat-1',
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toHaveLength(1);
      const instance = result[0];

      // Check instance-specific properties
      expect(instance.id).toBe('recurring-1_2026-02-03');
      expect(instance.isRecurringInstance).toBe(true);
      expect(instance.recurringParentId).toBe('recurring-1');
      expect(instance.recurrence).toBeNull();

      // Check inherited properties
      expect(instance.title).toBe('Daily Task');
      expect(instance.description).toBe('Test description');
      expect(instance.categoryId).toBe('cat-1');

      // Parse the date to match what the selector does
      const [year, month, day] = date.split('-').map(Number);
      const expectedDate = startOfDay(new Date(year, month - 1, day));

      expect(instance.scheduledDate).toEqual(expectedDate);
      expect(instance.instanceDate).toEqual(expectedDate);
    });
  });

  describe('edge cases', () => {
    it('should handle empty state gracefully', () => {
      const date = '2026-02-03';
      const state = createMockState({}, {}, {});

      const result = selectTasksWithRecurringInstances(state, date);

      expect(result).toEqual([]);
    });

    it('should not generate instances before task start date', () => {
      const date = '2026-02-01';
      const recurringTask = createRecurringTask(
        'recurring-1',
        new Date('2026-02-05'), // Starts after Feb 1
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        }
      );

      const state = createMockState({}, {}, { 'recurring-1': recurringTask });

      const result = selectTasksWithRecurringInstances(state, date);

      // Should be empty - start date is after Feb 1
      expect(result).toHaveLength(0);
    });

    it('should handle invalid date format gracefully', () => {
      const invalidDate = 'invalid-date';
      const regularTask = createTask({
        id: 'task-1',
        scheduledDate: new Date('2026-02-03'),
      });

      const state = createMockState(
        { 'task-1': regularTask },
        { '2026-02-03': ['task-1'] },
        {}
      );

      const result = selectTasksWithRecurringInstances(state, invalidDate);

      // Should return empty array for invalid date
      expect(result).toEqual([]);
    });
  });

  describe('materialized instances (deduplication)', () => {
    it('should not generate instance when materialized instance exists for date', () => {
      const date = '2026-02-03';

      // Create a recurring parent task
      const recurringParent = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'A', number: 1 } }
      );

      // Create a materialized instance (a regular task that was originally a recurring instance)
      const materializedInstance = createTask({
        id: 'materialized-instance-1',
        scheduledDate: new Date(date),
        isRecurringInstance: true,
        recurringParentId: 'recurring-1',
        instanceDate: new Date(date),
        priority: { letter: 'A', number: 1 },
        title: 'Modified Recurring Task',
      });

      const state = createMockState(
        { 'materialized-instance-1': materializedInstance },
        { [date]: ['materialized-instance-1'] },
        { 'recurring-1': recurringParent }
      );

      const result = selectTasksWithRecurringInstances(state, date);

      // Should only have the materialized instance, not a duplicate generated one
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('materialized-instance-1');
      expect(result[0].title).toBe('Modified Recurring Task');
    });

    it('should generate instance when materialized instance is for different parent', () => {
      const date = '2026-02-03';

      // Create two recurring parent tasks
      const recurringParent1 = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'A', number: 1 } }
      );

      const recurringParent2 = createRecurringTask(
        'recurring-2',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'B', number: 1 } }
      );

      // Materialized instance only for recurring-1
      const materializedInstance = createTask({
        id: 'materialized-instance-1',
        scheduledDate: new Date(date),
        isRecurringInstance: true,
        recurringParentId: 'recurring-1',
        instanceDate: new Date(date),
        priority: { letter: 'A', number: 1 },
      });

      const state = createMockState(
        { 'materialized-instance-1': materializedInstance },
        { [date]: ['materialized-instance-1'] },
        { 'recurring-1': recurringParent1, 'recurring-2': recurringParent2 }
      );

      const result = selectTasksWithRecurringInstances(state, date);

      // Should have materialized instance for recurring-1 and generated instance for recurring-2
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('materialized-instance-1');
      expect(result[1].id).toBe('recurring-2_2026-02-03');
    });

    it('should handle multiple materialized instances from different parents', () => {
      const date = '2026-02-03';

      const recurringParent1 = createRecurringTask(
        'recurring-1',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'A', number: 1 } }
      );

      const recurringParent2 = createRecurringTask(
        'recurring-2',
        new Date('2026-02-01'),
        {
          type: 'daily',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: null,
          monthOfYear: null,
          endCondition: { type: 'never', endDate: null, maxOccurrences: null },
          exceptions: [],
        },
        { priority: { letter: 'B', number: 1 } }
      );

      // Both have materialized instances
      const materializedInstance1 = createTask({
        id: 'materialized-instance-1',
        scheduledDate: new Date(date),
        isRecurringInstance: true,
        recurringParentId: 'recurring-1',
        instanceDate: new Date(date),
        priority: { letter: 'A', number: 1 },
      });

      const materializedInstance2 = createTask({
        id: 'materialized-instance-2',
        scheduledDate: new Date(date),
        isRecurringInstance: true,
        recurringParentId: 'recurring-2',
        instanceDate: new Date(date),
        priority: { letter: 'B', number: 1 },
      });

      const state = createMockState(
        {
          'materialized-instance-1': materializedInstance1,
          'materialized-instance-2': materializedInstance2,
        },
        { [date]: ['materialized-instance-1', 'materialized-instance-2'] },
        { 'recurring-1': recurringParent1, 'recurring-2': recurringParent2 }
      );

      const result = selectTasksWithRecurringInstances(state, date);

      // Should only have the two materialized instances, no generated duplicates
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('materialized-instance-1');
      expect(result[1].id).toBe('materialized-instance-2');
    });
  });
});
