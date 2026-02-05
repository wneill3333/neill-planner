/**
 * Priority Utility Tests
 *
 * Tests for priority number calculation, reordering, and gap detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNextPriorityNumber,
  getMaxPriorityNumber,
  reorderTasksInPriority,
  reorderAllTasks,
  getTasksWithChangedPriority,
  hasGapsInPriorityNumbering,
  getGapCountsByPriority,
} from '../priorityUtils';
import { createMockTask, resetMockCounters } from '../../test/mockData';
import type { Task } from '../../types';

// Reset counters before each test for consistent IDs
beforeEach(() => {
  resetMockCounters();
});

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a task with specific priority
 */
function createTaskWithPriority(
  id: string,
  letter: 'A' | 'B' | 'C' | 'D',
  number: number
): Task {
  return createMockTask({
    id,
    priorityLetter: letter,
    priorityNumber: number,
  });
}

// =============================================================================
// getNextPriorityNumber Tests
// =============================================================================

describe('getNextPriorityNumber', () => {
  it('should return 1 for empty task list', () => {
    expect(getNextPriorityNumber([], 'A')).toBe(1);
    expect(getNextPriorityNumber([], 'B')).toBe(1);
    expect(getNextPriorityNumber([], 'C')).toBe(1);
    expect(getNextPriorityNumber([], 'D')).toBe(1);
  });

  it('should return 1 when no tasks with the given priority letter exist', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
    ];

    expect(getNextPriorityNumber(tasks, 'B')).toBe(1);
    expect(getNextPriorityNumber(tasks, 'C')).toBe(1);
    expect(getNextPriorityNumber(tasks, 'D')).toBe(1);
  });

  it('should return max + 1 for existing tasks', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'A', 3),
    ];

    expect(getNextPriorityNumber(tasks, 'A')).toBe(4);
  });

  it('should handle gaps in numbering (return max + 1, not fill gap)', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3), // Gap - no A2
      createTaskWithPriority('3', 'A', 5), // Gap - no A4
    ];

    // Should return 6, not 2 (doesn't fill gaps)
    expect(getNextPriorityNumber(tasks, 'A')).toBe(6);
  });

  it('should work correctly for each priority letter independently', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'B', 1),
      createTaskWithPriority('4', 'C', 1),
      createTaskWithPriority('5', 'C', 2),
      createTaskWithPriority('6', 'C', 3),
    ];

    expect(getNextPriorityNumber(tasks, 'A')).toBe(3);
    expect(getNextPriorityNumber(tasks, 'B')).toBe(2);
    expect(getNextPriorityNumber(tasks, 'C')).toBe(4);
    expect(getNextPriorityNumber(tasks, 'D')).toBe(1);
  });

  it('should handle single task', () => {
    const tasks = [createTaskWithPriority('1', 'A', 1)];

    expect(getNextPriorityNumber(tasks, 'A')).toBe(2);
  });

  it('should handle non-sequential starting numbers', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 5), // Starts at 5
      createTaskWithPriority('2', 'A', 6),
    ];

    expect(getNextPriorityNumber(tasks, 'A')).toBe(7);
  });
});

// =============================================================================
// getMaxPriorityNumber Tests
// =============================================================================

describe('getMaxPriorityNumber', () => {
  it('should return 0 for empty task list', () => {
    expect(getMaxPriorityNumber([], 'A')).toBe(0);
  });

  it('should return 0 when no tasks with the given priority letter exist', () => {
    const tasks = [createTaskWithPriority('1', 'A', 1)];

    expect(getMaxPriorityNumber(tasks, 'B')).toBe(0);
  });

  it('should return the maximum number for the priority letter', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 5),
      createTaskWithPriority('3', 'A', 3),
    ];

    expect(getMaxPriorityNumber(tasks, 'A')).toBe(5);
  });
});

// =============================================================================
// reorderTasksInPriority Tests
// =============================================================================

describe('reorderTasksInPriority', () => {
  it('should return empty array for empty input', () => {
    expect(reorderTasksInPriority([], 'A')).toEqual([]);
  });

  it('should return empty array when no tasks match the priority letter', () => {
    const tasks = [createTaskWithPriority('1', 'B', 1)];

    expect(reorderTasksInPriority(tasks, 'A')).toEqual([]);
  });

  it('should renumber tasks sequentially starting at 1', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'A', 3),
    ];

    const reordered = reorderTasksInPriority(tasks, 'A');

    expect(reordered).toHaveLength(3);
    expect(reordered[0].priority.number).toBe(1);
    expect(reordered[1].priority.number).toBe(2);
    expect(reordered[2].priority.number).toBe(3);
  });

  it('should fill gaps in numbering', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3), // Gap
      createTaskWithPriority('3', 'A', 5), // Gap
    ];

    const reordered = reorderTasksInPriority(tasks, 'A');

    expect(reordered[0].id).toBe('1');
    expect(reordered[0].priority.number).toBe(1);
    expect(reordered[1].id).toBe('2');
    expect(reordered[1].priority.number).toBe(2); // Was 3
    expect(reordered[2].id).toBe('3');
    expect(reordered[2].priority.number).toBe(3); // Was 5
  });

  it('should preserve task order by original number', () => {
    const tasks = [
      createTaskWithPriority('3', 'A', 5), // Out of order in array
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3),
    ];

    const reordered = reorderTasksInPriority(tasks, 'A');

    // Should be sorted by original number, then renumbered
    expect(reordered[0].id).toBe('1'); // Was number 1
    expect(reordered[1].id).toBe('2'); // Was number 3
    expect(reordered[2].id).toBe('3'); // Was number 5
  });

  it('should not modify tasks with different priority letters', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'B', 1), // Different letter
      createTaskWithPriority('3', 'A', 3),
    ];

    const reordered = reorderTasksInPriority(tasks, 'A');

    // Should only contain A tasks
    expect(reordered).toHaveLength(2);
    expect(reordered.every((t) => t.priority.letter === 'A')).toBe(true);
  });

  it('should return new task objects (immutability)', () => {
    const tasks = [createTaskWithPriority('1', 'A', 5)];

    const reordered = reorderTasksInPriority(tasks, 'A');

    expect(reordered[0]).not.toBe(tasks[0]);
    expect(reordered[0].priority).not.toBe(tasks[0].priority);
  });

  it('should handle single task', () => {
    const tasks = [createTaskWithPriority('1', 'A', 5)];

    const reordered = reorderTasksInPriority(tasks, 'A');

    expect(reordered).toHaveLength(1);
    expect(reordered[0].priority.number).toBe(1);
  });
});

// =============================================================================
// reorderAllTasks Tests
// =============================================================================

describe('reorderAllTasks', () => {
  it('should return empty result for empty input', () => {
    const result = reorderAllTasks([]);

    expect(result.tasks).toEqual([]);
    expect(result.hasChanges).toBe(false);
  });

  it('should reorder all priority groups', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3), // Gap
      createTaskWithPriority('3', 'B', 1),
      createTaskWithPriority('4', 'B', 5), // Gap
    ];

    const result = reorderAllTasks(tasks);

    expect(result.hasChanges).toBe(true);
    expect(result.tasks).toHaveLength(4);

    // Check A tasks
    const aTasks = result.tasks.filter((t) => t.priority.letter === 'A');
    expect(aTasks[0].priority.number).toBe(1);
    expect(aTasks[1].priority.number).toBe(2);

    // Check B tasks
    const bTasks = result.tasks.filter((t) => t.priority.letter === 'B');
    expect(bTasks[0].priority.number).toBe(1);
    expect(bTasks[1].priority.number).toBe(2);
  });

  it('should return hasChanges=false when no changes needed', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'B', 1),
    ];

    const result = reorderAllTasks(tasks);

    expect(result.hasChanges).toBe(false);
  });

  it('should handle tasks with multiple priority letters', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'B', 1),
      createTaskWithPriority('3', 'C', 1),
      createTaskWithPriority('4', 'D', 1),
    ];

    const result = reorderAllTasks(tasks);

    expect(result.tasks).toHaveLength(4);
    expect(result.hasChanges).toBe(false);
  });

  it('should preserve relative order within each group', () => {
    const tasks = [
      createTaskWithPriority('first', 'A', 2),
      createTaskWithPriority('second', 'A', 5),
      createTaskWithPriority('third', 'A', 10),
    ];

    const result = reorderAllTasks(tasks);

    const aTasks = result.tasks.filter((t) => t.priority.letter === 'A');
    expect(aTasks[0].id).toBe('first');
    expect(aTasks[1].id).toBe('second');
    expect(aTasks[2].id).toBe('third');
  });
});

// =============================================================================
// getTasksWithChangedPriority Tests
// =============================================================================

describe('getTasksWithChangedPriority', () => {
  it('should return empty array when no changes', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
    ];

    const result = getTasksWithChangedPriority(tasks, tasks);

    expect(result).toEqual([]);
  });

  it('should return only tasks that changed', () => {
    const original = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3),
      createTaskWithPriority('3', 'A', 5),
    ];

    const reordered = [
      createTaskWithPriority('1', 'A', 1), // No change
      createTaskWithPriority('2', 'A', 2), // Changed from 3
      createTaskWithPriority('3', 'A', 3), // Changed from 5
    ];

    const changed = getTasksWithChangedPriority(original, reordered);

    expect(changed).toHaveLength(2);
    expect(changed.find((t) => t.id === '2')?.priority.number).toBe(2);
    expect(changed.find((t) => t.id === '3')?.priority.number).toBe(3);
  });

  it('should handle empty arrays', () => {
    expect(getTasksWithChangedPriority([], [])).toEqual([]);
  });
});

// =============================================================================
// hasGapsInPriorityNumbering Tests
// =============================================================================

describe('hasGapsInPriorityNumbering', () => {
  it('should return false for empty list', () => {
    expect(hasGapsInPriorityNumbering([])).toBe(false);
  });

  it('should return false for sequential numbers starting at 1', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'A', 3),
    ];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(false);
  });

  it('should return true for gaps in numbering', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3), // Gap - missing 2
    ];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(true);
  });

  it('should return true when not starting at 1', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 2), // Should start at 1
      createTaskWithPriority('2', 'A', 3),
    ];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(true);
  });

  it('should check all priority groups independently', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'B', 1),
      createTaskWithPriority('4', 'B', 5), // Gap in B
    ];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(true);
  });

  it('should return false when all groups are sequential', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'B', 1),
      createTaskWithPriority('4', 'C', 1),
      createTaskWithPriority('5', 'C', 2),
    ];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(false);
  });

  it('should handle single task correctly', () => {
    const tasks = [createTaskWithPriority('1', 'A', 1)];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(false);
  });

  it('should handle single task not starting at 1', () => {
    const tasks = [createTaskWithPriority('1', 'A', 5)];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(true);
  });
});

// =============================================================================
// getGapCountsByPriority Tests
// =============================================================================

describe('getGapCountsByPriority', () => {
  it('should return all zeros for empty list', () => {
    const result = getGapCountsByPriority([]);

    expect(result).toEqual({ A: 0, B: 0, C: 0, D: 0 });
  });

  it('should return all zeros for sequential numbers', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'B', 1),
    ];

    const result = getGapCountsByPriority(tasks);

    expect(result).toEqual({ A: 0, B: 0, C: 0, D: 0 });
  });

  it('should count gaps correctly', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 3), // Gap
      createTaskWithPriority('3', 'A', 5), // Gap
      createTaskWithPriority('4', 'B', 2), // Gap (not starting at 1)
    ];

    const result = getGapCountsByPriority(tasks);

    expect(result.A).toBe(2); // Tasks 2 and 3 are not sequential
    expect(result.B).toBe(1); // Task 4 doesn't start at 1
    expect(result.C).toBe(0);
    expect(result.D).toBe(0);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Priority System Integration', () => {
  it('should handle full workflow: create, delete middle, reorder', () => {
    // Simulate creating A1, A2, A3
    let tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
      createTaskWithPriority('3', 'A', 3),
    ];

    // Verify no gaps
    expect(hasGapsInPriorityNumbering(tasks)).toBe(false);

    // Simulate deleting A2
    tasks = tasks.filter((t) => t.id !== '2');

    // Verify there are now gaps
    expect(hasGapsInPriorityNumbering(tasks)).toBe(true);

    // Reorder
    const result = reorderAllTasks(tasks);

    // Verify gaps are filled
    expect(result.hasChanges).toBe(true);
    expect(hasGapsInPriorityNumbering(result.tasks)).toBe(false);

    // Verify the former A3 is now A2
    const formerA3 = result.tasks.find((t) => t.id === '3');
    expect(formerA3?.priority.number).toBe(2);
  });

  it('should handle mixed priorities correctly', () => {
    const tasks = [
      createTaskWithPriority('a1', 'A', 1),
      createTaskWithPriority('b1', 'B', 1),
      createTaskWithPriority('a2', 'A', 5), // Gap
      createTaskWithPriority('b2', 'B', 2),
      createTaskWithPriority('c1', 'C', 3), // Gap (not starting at 1)
    ];

    expect(hasGapsInPriorityNumbering(tasks)).toBe(true);

    const result = reorderAllTasks(tasks);

    expect(result.hasChanges).toBe(true);

    // Verify each group is sequential
    const aTasks = result.tasks.filter((t) => t.priority.letter === 'A');
    expect(aTasks.map((t) => t.priority.number)).toEqual([1, 2]);

    const bTasks = result.tasks.filter((t) => t.priority.letter === 'B');
    expect(bTasks.map((t) => t.priority.number)).toEqual([1, 2]);

    const cTasks = result.tasks.filter((t) => t.priority.letter === 'C');
    expect(cTasks.map((t) => t.priority.number)).toEqual([1]);

    expect(hasGapsInPriorityNumbering(result.tasks)).toBe(false);
  });

  it('should auto-assign next number correctly', () => {
    const tasks = [
      createTaskWithPriority('1', 'A', 1),
      createTaskWithPriority('2', 'A', 2),
    ];

    const nextA = getNextPriorityNumber(tasks, 'A');
    const nextB = getNextPriorityNumber(tasks, 'B');

    expect(nextA).toBe(3);
    expect(nextB).toBe(1);
  });
});
