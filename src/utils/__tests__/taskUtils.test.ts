/**
 * Task Utility Functions Tests
 *
 * Comprehensive tests for task manipulation, grouping, and display utilities.
 */

import { describe, it, expect } from 'vitest';
import type { Task } from '../../types';
import {
  PRIORITY_COLORS,
  PRIORITY_COLOR_CLASSES,
  PRIORITY_LABELS,
  STATUS_COLORS,
  groupTasksByPriority,
  sortTasksByPriority,
  getStatusSymbol,
  getPriorityColor,
  getPriorityColorClasses,
  getStatusColor,
  formatPriorityLabel,
  isTaskComplete,
  isTaskDeleted,
  isTaskRecurring,
  getNonEmptyPriorityGroups,
  countTasksByStatus,
  getCompletionPercentage,
} from '../taskUtils';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: null,
    date: '2024-01-15',
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    categoryId: null,
    estimatedMinutes: null,
    actualMinutes: null,
    notes: null,
    recurrence: null,
    parentTaskId: null,
    isRecurringInstance: false,
    originalDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    completedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

// =============================================================================
// Priority Constants Tests
// =============================================================================

describe('Priority Constants', () => {
  describe('PRIORITY_COLORS', () => {
    it('should have colors for all priority letters', () => {
      expect(PRIORITY_COLORS.A).toBe('#EF4444'); // Red
      expect(PRIORITY_COLORS.B).toBe('#F97316'); // Orange
      expect(PRIORITY_COLORS.C).toBe('#EAB308'); // Yellow
      expect(PRIORITY_COLORS.D).toBe('#6B7280'); // Gray
    });

    it('should have exactly 4 priority colors', () => {
      expect(Object.keys(PRIORITY_COLORS)).toHaveLength(4);
    });
  });

  describe('PRIORITY_COLOR_CLASSES', () => {
    it('should have Tailwind classes for all priority letters', () => {
      expect(PRIORITY_COLOR_CLASSES.A).toEqual({
        bg: 'bg-red-500',
        text: 'text-red-600',
        border: 'border-red-500',
      });
      expect(PRIORITY_COLOR_CLASSES.B).toEqual({
        bg: 'bg-orange-500',
        text: 'text-orange-600',
        border: 'border-orange-500',
      });
      expect(PRIORITY_COLOR_CLASSES.C).toEqual({
        bg: 'bg-yellow-500',
        text: 'text-yellow-600',
        border: 'border-yellow-500',
      });
      expect(PRIORITY_COLOR_CLASSES.D).toEqual({
        bg: 'bg-gray-500',
        text: 'text-gray-600',
        border: 'border-gray-500',
      });
    });
  });

  describe('PRIORITY_LABELS', () => {
    it('should have human-readable labels for all priority letters', () => {
      expect(PRIORITY_LABELS.A).toBe('Vital');
      expect(PRIORITY_LABELS.B).toBe('Important');
      expect(PRIORITY_LABELS.C).toBe('Optional');
      expect(PRIORITY_LABELS.D).toBe('Delegate');
    });
  });
});

// =============================================================================
// Status Constants Tests
// =============================================================================

describe('Status Constants', () => {
  describe('STATUS_COLORS', () => {
    it('should have colors for all task statuses', () => {
      expect(STATUS_COLORS.in_progress).toBe('#3B82F6'); // Blue
      expect(STATUS_COLORS.forward).toBe('#8B5CF6'); // Purple
      expect(STATUS_COLORS.complete).toBe('#22C55E'); // Green
      expect(STATUS_COLORS.delete).toBe('#EF4444'); // Red
      expect(STATUS_COLORS.delegate).toBe('#F97316'); // Orange
    });

    it('should have exactly 5 status colors', () => {
      expect(Object.keys(STATUS_COLORS)).toHaveLength(5);
    });
  });
});

// =============================================================================
// groupTasksByPriority Tests
// =============================================================================

describe('groupTasksByPriority', () => {
  it('should return empty groups when no tasks', () => {
    const result = groupTasksByPriority([]);

    expect(result.A).toEqual([]);
    expect(result.B).toEqual([]);
    expect(result.C).toEqual([]);
    expect(result.D).toEqual([]);
  });

  it('should group tasks by priority letter', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', priority: { letter: 'A', number: 1 } }),
      createMockTask({ id: '2', priority: { letter: 'B', number: 1 } }),
      createMockTask({ id: '3', priority: { letter: 'A', number: 2 } }),
      createMockTask({ id: '4', priority: { letter: 'C', number: 1 } }),
    ];

    const result = groupTasksByPriority(tasks);

    expect(result.A).toHaveLength(2);
    expect(result.B).toHaveLength(1);
    expect(result.C).toHaveLength(1);
    expect(result.D).toHaveLength(0);
  });

  it('should sort tasks within each group by priority number', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'A3', priority: { letter: 'A', number: 3 } }),
      createMockTask({ id: '2', title: 'A1', priority: { letter: 'A', number: 1 } }),
      createMockTask({ id: '3', title: 'A2', priority: { letter: 'A', number: 2 } }),
    ];

    const result = groupTasksByPriority(tasks);

    expect(result.A[0].title).toBe('A1');
    expect(result.A[1].title).toBe('A2');
    expect(result.A[2].title).toBe('A3');
  });

  it('should handle all priority letters', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', priority: { letter: 'D', number: 1 } }),
      createMockTask({ id: '2', priority: { letter: 'C', number: 1 } }),
      createMockTask({ id: '3', priority: { letter: 'B', number: 1 } }),
      createMockTask({ id: '4', priority: { letter: 'A', number: 1 } }),
    ];

    const result = groupTasksByPriority(tasks);

    expect(result.A).toHaveLength(1);
    expect(result.B).toHaveLength(1);
    expect(result.C).toHaveLength(1);
    expect(result.D).toHaveLength(1);
  });
});

// =============================================================================
// sortTasksByPriority Tests
// =============================================================================

describe('sortTasksByPriority', () => {
  it('should return empty array for empty input', () => {
    const result = sortTasksByPriority([]);
    expect(result).toEqual([]);
  });

  it('should sort tasks by priority letter first', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', priority: { letter: 'C', number: 1 } }),
      createMockTask({ id: '2', priority: { letter: 'A', number: 1 } }),
      createMockTask({ id: '3', priority: { letter: 'B', number: 1 } }),
    ];

    const result = sortTasksByPriority(tasks);

    expect(result[0].priority.letter).toBe('A');
    expect(result[1].priority.letter).toBe('B');
    expect(result[2].priority.letter).toBe('C');
  });

  it('should sort by number when letters are the same', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'A3', priority: { letter: 'A', number: 3 } }),
      createMockTask({ id: '2', title: 'A1', priority: { letter: 'A', number: 1 } }),
      createMockTask({ id: '3', title: 'A2', priority: { letter: 'A', number: 2 } }),
    ];

    const result = sortTasksByPriority(tasks);

    expect(result[0].title).toBe('A1');
    expect(result[1].title).toBe('A2');
    expect(result[2].title).toBe('A3');
  });

  it('should not modify the original array', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', priority: { letter: 'C', number: 1 } }),
      createMockTask({ id: '2', priority: { letter: 'A', number: 1 } }),
    ];
    const originalFirst = tasks[0];

    sortTasksByPriority(tasks);

    expect(tasks[0]).toBe(originalFirst);
  });

  it('should handle complex sorting correctly', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'B2', priority: { letter: 'B', number: 2 } }),
      createMockTask({ id: '2', title: 'A1', priority: { letter: 'A', number: 1 } }),
      createMockTask({ id: '3', title: 'A2', priority: { letter: 'A', number: 2 } }),
      createMockTask({ id: '4', title: 'B1', priority: { letter: 'B', number: 1 } }),
      createMockTask({ id: '5', title: 'C1', priority: { letter: 'C', number: 1 } }),
    ];

    const result = sortTasksByPriority(tasks);

    expect(result.map((t) => t.title)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1']);
  });
});

// =============================================================================
// Display Function Tests
// =============================================================================

describe('getStatusSymbol', () => {
  it('should return correct symbol for in_progress', () => {
    expect(getStatusSymbol('in_progress')).toBe('●');
  });

  it('should return correct symbol for forward', () => {
    expect(getStatusSymbol('forward')).toBe('➜');
  });

  it('should return correct symbol for complete', () => {
    expect(getStatusSymbol('complete')).toBe('✔');
  });

  it('should return correct symbol for delete', () => {
    expect(getStatusSymbol('delete')).toBe('✘');
  });

  it('should return correct symbol for delegate', () => {
    expect(getStatusSymbol('delegate')).toBe('◯');
  });
});

describe('getPriorityColor', () => {
  it('should return correct color for each priority letter', () => {
    expect(getPriorityColor('A')).toBe('#EF4444');
    expect(getPriorityColor('B')).toBe('#F97316');
    expect(getPriorityColor('C')).toBe('#EAB308');
    expect(getPriorityColor('D')).toBe('#6B7280');
  });
});

describe('getPriorityColorClasses', () => {
  it('should return correct Tailwind classes for each priority', () => {
    const classesA = getPriorityColorClasses('A');
    expect(classesA.bg).toBe('bg-red-500');
    expect(classesA.text).toBe('text-red-600');
    expect(classesA.border).toBe('border-red-500');

    const classesD = getPriorityColorClasses('D');
    expect(classesD.bg).toBe('bg-gray-500');
    expect(classesD.text).toBe('text-gray-600');
    expect(classesD.border).toBe('border-gray-500');
  });
});

describe('getStatusColor', () => {
  it('should return correct color for each status', () => {
    expect(getStatusColor('in_progress')).toBe('#3B82F6');
    expect(getStatusColor('forward')).toBe('#8B5CF6');
    expect(getStatusColor('complete')).toBe('#22C55E');
    expect(getStatusColor('delete')).toBe('#EF4444');
    expect(getStatusColor('delegate')).toBe('#F97316');
  });
});

describe('formatPriorityLabel', () => {
  it('should format priority as letter+number', () => {
    const task = createMockTask({ priority: { letter: 'A', number: 1 } });
    expect(formatPriorityLabel(task)).toBe('A1');
  });

  it('should handle different combinations', () => {
    expect(formatPriorityLabel(createMockTask({ priority: { letter: 'B', number: 3 } }))).toBe('B3');
    expect(formatPriorityLabel(createMockTask({ priority: { letter: 'C', number: 10 } }))).toBe('C10');
    expect(formatPriorityLabel(createMockTask({ priority: { letter: 'D', number: 5 } }))).toBe('D5');
  });
});

// =============================================================================
// Task State Check Tests
// =============================================================================

describe('isTaskComplete', () => {
  it('should return true for completed tasks', () => {
    const task = createMockTask({ status: 'complete' });
    expect(isTaskComplete(task)).toBe(true);
  });

  it('should return false for non-completed tasks', () => {
    expect(isTaskComplete(createMockTask({ status: 'in_progress' }))).toBe(false);
    expect(isTaskComplete(createMockTask({ status: 'forward' }))).toBe(false);
    expect(isTaskComplete(createMockTask({ status: 'delete' }))).toBe(false);
    expect(isTaskComplete(createMockTask({ status: 'delegate' }))).toBe(false);
  });
});

describe('isTaskDeleted', () => {
  it('should return true for tasks with delete status', () => {
    const task = createMockTask({ status: 'delete' });
    expect(isTaskDeleted(task)).toBe(true);
  });

  it('should return true for tasks with deletedAt timestamp', () => {
    const task = createMockTask({ status: 'in_progress', deletedAt: new Date() });
    expect(isTaskDeleted(task)).toBe(true);
  });

  it('should return false for active tasks', () => {
    const task = createMockTask({ status: 'in_progress', deletedAt: null });
    expect(isTaskDeleted(task)).toBe(false);
  });
});

describe('isTaskRecurring', () => {
  it('should return true for tasks with recurrence pattern', () => {
    const task = createMockTask({
      recurrence: {
        pattern: 'daily',
        interval: 1,
        endDate: null,
        daysOfWeek: null,
        dayOfMonth: null,
      },
    });
    expect(isTaskRecurring(task)).toBe(true);
  });

  it('should return true for recurring instances', () => {
    const task = createMockTask({ isRecurringInstance: true });
    expect(isTaskRecurring(task)).toBe(true);
  });

  it('should return false for non-recurring tasks', () => {
    const task = createMockTask({ recurrence: null, isRecurringInstance: false });
    expect(isTaskRecurring(task)).toBe(false);
  });
});

// =============================================================================
// Aggregation Function Tests
// =============================================================================

describe('getNonEmptyPriorityGroups', () => {
  it('should return empty array when all groups are empty', () => {
    const grouped = { A: [], B: [], C: [], D: [] };
    expect(getNonEmptyPriorityGroups(grouped)).toEqual([]);
  });

  it('should return only letters with tasks', () => {
    const grouped = {
      A: [createMockTask({ id: '1' })],
      B: [],
      C: [createMockTask({ id: '2' })],
      D: [],
    };

    const result = getNonEmptyPriorityGroups(grouped);

    expect(result).toEqual(['A', 'C']);
  });

  it('should preserve priority order (A, B, C, D)', () => {
    const grouped = {
      A: [createMockTask({ id: '1' })],
      B: [createMockTask({ id: '2' })],
      C: [createMockTask({ id: '3' })],
      D: [createMockTask({ id: '4' })],
    };

    const result = getNonEmptyPriorityGroups(grouped);

    expect(result).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('countTasksByStatus', () => {
  it('should return zeros for empty task list', () => {
    const result = countTasksByStatus([]);

    expect(result.in_progress).toBe(0);
    expect(result.forward).toBe(0);
    expect(result.complete).toBe(0);
    expect(result.delete).toBe(0);
    expect(result.delegate).toBe(0);
  });

  it('should count tasks correctly by status', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', status: 'in_progress' }),
      createMockTask({ id: '2', status: 'in_progress' }),
      createMockTask({ id: '3', status: 'complete' }),
      createMockTask({ id: '4', status: 'forward' }),
      createMockTask({ id: '5', status: 'delete' }),
      createMockTask({ id: '6', status: 'delegate' }),
      createMockTask({ id: '7', status: 'complete' }),
    ];

    const result = countTasksByStatus(tasks);

    expect(result.in_progress).toBe(2);
    expect(result.forward).toBe(1);
    expect(result.complete).toBe(2);
    expect(result.delete).toBe(1);
    expect(result.delegate).toBe(1);
  });
});

describe('getCompletionPercentage', () => {
  it('should return 0 for empty task list', () => {
    expect(getCompletionPercentage([])).toBe(0);
  });

  it('should return 0 when no tasks are completed', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'in_progress' }),
      createMockTask({ id: '2', status: 'in_progress' }),
    ];
    expect(getCompletionPercentage(tasks)).toBe(0);
  });

  it('should return 100 when all tasks are completed', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'complete' }),
      createMockTask({ id: '2', status: 'complete' }),
    ];
    expect(getCompletionPercentage(tasks)).toBe(100);
  });

  it('should calculate correct percentage', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'complete' }),
      createMockTask({ id: '2', status: 'in_progress' }),
      createMockTask({ id: '3', status: 'complete' }),
      createMockTask({ id: '4', status: 'in_progress' }),
    ];
    expect(getCompletionPercentage(tasks)).toBe(50);
  });

  it('should round to nearest integer', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'complete' }),
      createMockTask({ id: '2', status: 'in_progress' }),
      createMockTask({ id: '3', status: 'in_progress' }),
    ];
    // 1/3 = 33.33...
    expect(getCompletionPercentage(tasks)).toBe(33);
  });
});
