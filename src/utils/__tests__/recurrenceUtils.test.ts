/**
 * Recurrence Utility Functions Tests
 *
 * Comprehensive tests for recurring task instance generation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateRecurringInstances,
  getNextOccurrence,
  isDateInExceptions,
  hasReachedEndCondition,
} from '../recurrenceUtils';
import type { Task, RecurrencePattern, RecurrenceEndCondition } from '../../types/task.types';

// =============================================================================
// Test Setup
// =============================================================================

describe('recurrenceUtils', () => {
  beforeEach(() => {
    // Mock current date to Feb 2, 2026 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 2)); // Month is 0-indexed, so 1 = February
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to create a minimal task for testing
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'test-task-1',
    userId: 'test-user',
    title: 'Test Task',
    description: '',
    categoryId: null,
    priority: { letter: 'A', number: 1 },
    status: 'in_progress',
    scheduledDate: new Date(2026, 1, 1), // Feb 1, 2026
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
  });

  // =============================================================================
  // isDateInExceptions Tests
  // =============================================================================

  describe('isDateInExceptions', () => {
    it('should return false for empty exceptions array', () => {
      const date = new Date(2026, 1, 5);
      expect(isDateInExceptions(date, [])).toBe(false);
    });

    it('should return true when date is in exceptions', () => {
      const date = new Date(2026, 1, 5);
      const exceptions = [new Date(2026, 1, 5)];
      expect(isDateInExceptions(date, exceptions)).toBe(true);
    });

    it('should return false when date is not in exceptions', () => {
      const date = new Date(2026, 1, 5);
      const exceptions = [new Date(2026, 1, 6), new Date(2026, 1, 7)];
      expect(isDateInExceptions(date, exceptions)).toBe(false);
    });

    it('should ignore time component when comparing dates', () => {
      const date = new Date(2026, 1, 5, 10, 30, 0);
      const exceptions = [new Date(2026, 1, 5, 14, 0, 0)];
      expect(isDateInExceptions(date, exceptions)).toBe(true);
    });

    it('should handle multiple exceptions', () => {
      const exceptions = [
        new Date(2026, 1, 5),
        new Date(2026, 1, 10),
        new Date(2026, 1, 15),
      ];
      expect(isDateInExceptions(new Date(2026, 1, 5), exceptions)).toBe(true);
      expect(isDateInExceptions(new Date(2026, 1, 10), exceptions)).toBe(true);
      expect(isDateInExceptions(new Date(2026, 1, 15), exceptions)).toBe(true);
      expect(isDateInExceptions(new Date(2026, 1, 12), exceptions)).toBe(false);
    });
  });

  // =============================================================================
  // hasReachedEndCondition Tests
  // =============================================================================

  describe('hasReachedEndCondition', () => {
    it('should return false for "never" end condition', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'never',
        endDate: null,
        maxOccurrences: null,
      };
      expect(hasReachedEndCondition(endCondition, 100, new Date(2030, 0, 1))).toBe(false);
    });

    it('should return false when date is before endDate', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'date',
        endDate: new Date(2026, 2, 1), // March 1, 2026
        maxOccurrences: null,
      };
      expect(hasReachedEndCondition(endCondition, 10, new Date(2026, 1, 15))).toBe(false);
    });

    it('should return true when date is after endDate', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'date',
        endDate: new Date(2026, 2, 1), // March 1, 2026
        maxOccurrences: null,
      };
      expect(hasReachedEndCondition(endCondition, 10, new Date(2026, 2, 5))).toBe(true);
    });

    it('should return false when count is below maxOccurrences', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'occurrences',
        endDate: null,
        maxOccurrences: 10,
      };
      expect(hasReachedEndCondition(endCondition, 5, new Date(2026, 1, 15))).toBe(false);
      expect(hasReachedEndCondition(endCondition, 9, new Date(2026, 1, 15))).toBe(false);
    });

    it('should return true when count reaches maxOccurrences', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'occurrences',
        endDate: null,
        maxOccurrences: 10,
      };
      expect(hasReachedEndCondition(endCondition, 10, new Date(2026, 1, 15))).toBe(true);
      expect(hasReachedEndCondition(endCondition, 11, new Date(2026, 1, 15))).toBe(true);
    });

    it('should handle missing endDate for date type', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'date',
        endDate: null,
        maxOccurrences: null,
      };
      expect(hasReachedEndCondition(endCondition, 10, new Date(2026, 1, 15))).toBe(false);
    });

    it('should handle missing maxOccurrences for occurrences type', () => {
      const endCondition: RecurrenceEndCondition = {
        type: 'occurrences',
        endDate: null,
        maxOccurrences: null,
      };
      expect(hasReachedEndCondition(endCondition, 10, new Date(2026, 1, 15))).toBe(false);
    });
  });

  // =============================================================================
  // getNextOccurrence Tests
  // =============================================================================

  describe('getNextOccurrence - Daily', () => {
    it('should calculate next day for daily recurrence with interval 1', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 1);
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2026, 1, 2));
    });

    it('should handle daily recurrence with interval > 1', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 3,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 1);
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2026, 1, 4));
    });

    it('should handle month boundaries for daily recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 28); // Feb 28 (non-leap year)
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2026, 2, 1)); // March 1
    });
  });

  describe('getNextOccurrence - Weekly', () => {
    it('should calculate next occurrence for single day of week', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Monday
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      // Starting from Sunday Feb 1, 2026
      const current = new Date(2026, 1, 1); // Sunday
      const next = getNextOccurrence(pattern, current);
      expect(next?.getDay()).toBe(1); // Should be Monday
      expect(next).toEqual(new Date(2026, 1, 2)); // Feb 2 (Monday)
    });

    it('should handle multiple days of week', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const monday = new Date(2026, 1, 2); // Feb 2 (Monday)
      const nextAfterMonday = getNextOccurrence(pattern, monday);
      expect(nextAfterMonday).toEqual(new Date(2026, 1, 4)); // Feb 4 (Wednesday)
    });

    it('should handle weekly recurrence with interval > 1', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 2,
        daysOfWeek: [1], // Monday
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const monday = new Date(2026, 1, 2); // Feb 2 (Monday)
      const next = getNextOccurrence(pattern, monday);
      expect(next).toEqual(new Date(2026, 1, 16)); // Feb 16 (Monday, 2 weeks later)
    });

    it('should return null for empty daysOfWeek', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 1);
      const next = getNextOccurrence(pattern, current);
      expect(next).toBeNull();
    });
  });

  describe('getNextOccurrence - Monthly', () => {
    it('should calculate next month for monthly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 15,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 15); // Feb 15
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2026, 2, 15)); // March 15
    });

    it('should handle 31st of month on months with fewer days', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 31,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const jan31 = new Date(2026, 0, 31); // Jan 31
      const next = getNextOccurrence(pattern, jan31);
      // February 2026 has 28 days, so should return Feb 28
      expect(next).toEqual(new Date(2026, 1, 28)); // Feb 28
    });

    it('should handle monthly recurrence with interval > 1', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 3,
        daysOfWeek: [],
        dayOfMonth: 10,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 10); // Feb 10
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2026, 4, 10)); // May 10 (3 months later)
    });

    it('should return null for missing dayOfMonth', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 15);
      const next = getNextOccurrence(pattern, current);
      expect(next).toBeNull();
    });
  });

  describe('getNextOccurrence - Yearly', () => {
    it('should calculate next year for yearly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 15,
        monthOfYear: 3, // March
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 2, 15); // March 15, 2026
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2027, 2, 15)); // March 15, 2027
    });

    it('should handle Feb 29 on non-leap years', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 29,
        monthOfYear: 2, // February
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      // 2024 is a leap year, 2025 is not
      const current = new Date(2024, 1, 29); // Feb 29, 2024
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2025, 1, 28)); // Feb 28, 2025 (non-leap year)
    });

    it('should handle yearly recurrence with interval > 1', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 2,
        daysOfWeek: [],
        dayOfMonth: 1,
        monthOfYear: 1, // January
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 0, 1); // Jan 1, 2026
      const next = getNextOccurrence(pattern, current);
      expect(next).toEqual(new Date(2028, 0, 1)); // Jan 1, 2028 (2 years later)
    });

    it('should return null for missing monthOfYear', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 15,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 2, 15);
      const next = getNextOccurrence(pattern, current);
      expect(next).toBeNull();
    });

    it('should return null for missing dayOfMonth', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: 3,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 2, 15);
      const next = getNextOccurrence(pattern, current);
      expect(next).toBeNull();
    });
  });

  describe('getNextOccurrence - Custom', () => {
    it('should return null for custom recurrence type', () => {
      const pattern: RecurrencePattern = {
        type: 'custom',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const current = new Date(2026, 1, 1);
      const next = getNextOccurrence(pattern, current);
      expect(next).toBeNull();
    });
  });

  // =============================================================================
  // generateRecurringInstances Tests
  // =============================================================================

  describe('generateRecurringInstances - Basic Functionality', () => {
    it('should return empty array for task with no recurrence', () => {
      const task = createTask({ recurrence: null });
      const rangeStart = new Date(2026, 1, 1);
      const rangeEnd = new Date(2026, 1, 28);
      const instances = generateRecurringInstances(task, rangeStart, rangeEnd);
      expect(instances).toEqual([]);
    });

    it('should return empty array for task with no scheduled date', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({ recurrence: pattern, scheduledDate: null });
      const rangeStart = new Date(2026, 1, 1);
      const rangeEnd = new Date(2026, 1, 28);
      const instances = generateRecurringInstances(task, rangeStart, rangeEnd);
      expect(instances).toEqual([]);
    });

    it('should return empty array for date range before task scheduledDate', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 2, 1), // March 1
        recurrence: pattern,
      });
      const rangeStart = new Date(2026, 1, 1); // Feb 1
      const rangeEnd = new Date(2026, 1, 28); // Feb 28
      const instances = generateRecurringInstances(task, rangeStart, rangeEnd);
      expect(instances).toEqual([]);
    });

    it('should generate instances within date range', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1), // Feb 1
        recurrence: pattern,
      });
      const rangeStart = new Date(2026, 1, 1);
      const rangeEnd = new Date(2026, 1, 5);
      const instances = generateRecurringInstances(task, rangeStart, rangeEnd);
      expect(instances.length).toBe(5); // Feb 1, 2, 3, 4, 5
    });
  });

  describe('generateRecurringInstances - Daily Recurrence', () => {
    it('should generate correct dates for daily pattern with interval 1', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 7)
      );
      expect(instances.length).toBe(7);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 1, 1));
      expect(instances[6].scheduledDate).toEqual(new Date(2026, 1, 7));
    });

    it('should handle daily pattern with interval > 1', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 2,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 10)
      );
      // Feb 1, 3, 5, 7, 9
      expect(instances.length).toBe(5);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 1, 1));
      expect(instances[1].scheduledDate).toEqual(new Date(2026, 1, 3));
      expect(instances[4].scheduledDate).toEqual(new Date(2026, 1, 9));
    });
  });

  describe('generateRecurringInstances - Weekly Recurrence', () => {
    it('should generate correct dates for single day of week', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Monday
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 2), // Feb 2 (Monday)
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 28)
      );
      // All Mondays in Feb 2026: 2, 9, 16, 23
      expect(instances.length).toBe(4);
      instances.forEach((instance) => {
        expect(instance.scheduledDate?.getDay()).toBe(1); // All should be Monday
      });
    });

    it('should handle multiple days of week selection', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 2), // Feb 2 (Monday)
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 2),
        new Date(2026, 1, 13)
      );
      // Feb 2(M), 4(W), 6(F), 9(M), 11(W), 13(F)
      expect(instances.length).toBe(6);
      instances.forEach((instance) => {
        const day = instance.scheduledDate?.getDay();
        expect([1, 3, 5]).toContain(day);
      });
    });

    it('should respect interval for weekly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 2,
        daysOfWeek: [1], // Monday
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 2), // Feb 2 (Monday)
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 2),
        new Date(2026, 2, 31)
      );
      // Feb 2, Feb 16, Mar 2, Mar 16, Mar 30
      expect(instances.length).toBe(5);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 1, 2));
      expect(instances[1].scheduledDate).toEqual(new Date(2026, 1, 16));
    });
  });

  describe('generateRecurringInstances - Monthly Recurrence', () => {
    it('should generate correct dates for middle of month', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 15,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 15), // Feb 15
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 15),
        new Date(2026, 4, 15)
      );
      // Feb 15, Mar 15, Apr 15, May 15
      expect(instances.length).toBe(4);
      instances.forEach((instance) => {
        expect(instance.scheduledDate?.getDate()).toBe(15);
      });
    });

    it('should handle 31st of month on months with fewer days', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 31,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 0, 31), // Jan 31
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 0, 31),
        new Date(2026, 2, 31)
      );
      // Jan 31, Feb 28 (non-leap year), Mar 31
      expect(instances.length).toBe(3);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 0, 31));
      expect(instances[1].scheduledDate).toEqual(new Date(2026, 1, 28)); // Feb has 28 days
      expect(instances[2].scheduledDate).toEqual(new Date(2026, 2, 31));
    });

    it('should respect interval for monthly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 3,
        daysOfWeek: [],
        dayOfMonth: 1,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 0, 1), // Jan 1
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 0, 1),
        new Date(2026, 11, 31)
      );
      // Jan 1, Apr 1, Jul 1, Oct 1
      expect(instances.length).toBe(4);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 0, 1));
      expect(instances[1].scheduledDate).toEqual(new Date(2026, 3, 1));
      expect(instances[2].scheduledDate).toEqual(new Date(2026, 6, 1));
      expect(instances[3].scheduledDate).toEqual(new Date(2026, 9, 1));
    });
  });

  describe('generateRecurringInstances - Yearly Recurrence', () => {
    it('should generate correct dates for yearly pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 15,
        monthOfYear: 3, // March
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 2, 15), // March 15, 2026
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 2, 15),
        new Date(2028, 2, 15)
      );
      // March 15: 2026, 2027, 2028
      expect(instances.length).toBe(3);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 2, 15));
      expect(instances[1].scheduledDate).toEqual(new Date(2027, 2, 15));
      expect(instances[2].scheduledDate).toEqual(new Date(2028, 2, 15));
    });

    it('should handle Feb 29 on non-leap years', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 29,
        monthOfYear: 2, // February
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2024, 1, 29), // Feb 29, 2024 (leap year)
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2024, 1, 29),
        new Date(2026, 1, 28)
      );
      // Feb 29 2024, Feb 28 2025, Feb 28 2026
      expect(instances.length).toBe(3);
      expect(instances[0].scheduledDate).toEqual(new Date(2024, 1, 29));
      expect(instances[1].scheduledDate).toEqual(new Date(2025, 1, 28));
      expect(instances[2].scheduledDate).toEqual(new Date(2026, 1, 28));
    });

    it('should respect interval for yearly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 2,
        daysOfWeek: [],
        dayOfMonth: 1,
        monthOfYear: 1, // January
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 0, 1), // Jan 1, 2026
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 0, 1),
        new Date(2030, 0, 1)
      );
      // Jan 1: 2026, 2028, 2030
      expect(instances.length).toBe(3);
      expect(instances[0].scheduledDate).toEqual(new Date(2026, 0, 1));
      expect(instances[1].scheduledDate).toEqual(new Date(2028, 0, 1));
      expect(instances[2].scheduledDate).toEqual(new Date(2030, 0, 1));
    });
  });

  describe('generateRecurringInstances - End Conditions', () => {
    it('should generate all instances for "never" end type', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 10)
      );
      expect(instances.length).toBe(10);
    });

    it('should stop at end date', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'date',
          endDate: new Date(2026, 1, 5),
          maxOccurrences: null,
        },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 10)
      );
      // Should stop at Feb 5 even though range goes to Feb 10
      expect(instances.length).toBe(5);
      expect(instances[instances.length - 1].scheduledDate).toEqual(new Date(2026, 1, 5));
    });

    it('should stop after max occurrences', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'occurrences',
          endDate: null,
          maxOccurrences: 5,
        },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 28)
      );
      expect(instances.length).toBe(5);
    });

    it('should handle end condition reached mid-range', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'occurrences',
          endDate: null,
          maxOccurrences: 3,
        },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 28)
      );
      expect(instances.length).toBe(3);
      expect(instances[2].scheduledDate).toEqual(new Date(2026, 1, 3));
    });
  });

  describe('generateRecurringInstances - Exceptions', () => {
    it('should exclude dates in exceptions array', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [new Date(2026, 1, 3), new Date(2026, 1, 5)],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 7)
      );
      // Should have Feb 1, 2, 4, 6, 7 (skipping 3 and 5)
      expect(instances.length).toBe(5);
      const dates = instances.map((i) => i.scheduledDate?.getDate());
      expect(dates).not.toContain(3);
      expect(dates).not.toContain(5);
    });

    it('should handle multiple exceptions correctly', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Monday
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [new Date(2026, 1, 9), new Date(2026, 1, 23)],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 2), // Feb 2 (Monday)
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 2),
        new Date(2026, 1, 28)
      );
      // Mondays: Feb 2, 16 (skipping 9 and 23)
      expect(instances.length).toBe(2);
    });

    it('should not count exceptions toward maxOccurrences', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: {
          type: 'occurrences',
          endDate: null,
          maxOccurrences: 5,
        },
        exceptions: [new Date(2026, 1, 3)],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 28)
      );
      // Should have 5 instances (not counting the exception)
      expect(instances.length).toBe(5);
    });
  });

  describe('generateRecurringInstances - Instance Properties', () => {
    it('should set isRecurringInstance to true', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 3)
      );
      instances.forEach((instance) => {
        expect(instance.isRecurringInstance).toBe(true);
      });
    });

    it('should set recurringParentId to parent task id', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        id: 'parent-task-123',
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 3)
      );
      instances.forEach((instance) => {
        expect(instance.recurringParentId).toBe('parent-task-123');
      });
    });

    it('should set instanceDate correctly', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 3)
      );
      expect(instances[0].instanceDate).toEqual(new Date(2026, 1, 1));
      expect(instances[1].instanceDate).toEqual(new Date(2026, 1, 2));
      expect(instances[2].instanceDate).toEqual(new Date(2026, 1, 3));
    });

    it('should inherit parent properties', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        title: 'Daily Task',
        description: 'This is a test',
        priority: { letter: 'B', number: 3 },
        categoryId: 'cat-123',
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 3)
      );
      instances.forEach((instance) => {
        expect(instance.title).toBe('Daily Task');
        expect(instance.description).toBe('This is a test');
        expect(instance.priority).toEqual({ letter: 'B', number: 3 });
        expect(instance.categoryId).toBe('cat-123');
      });
    });

    it('should have unique ID with correct format', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        id: 'parent-123',
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 3)
      );
      expect(instances[0].id).toBe('parent-123_2026-02-01');
      expect(instances[1].id).toBe('parent-123_2026-02-02');
      expect(instances[2].id).toBe('parent-123_2026-02-03');
    });

    it('should set recurrence to null for instances', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const task = createTask({
        scheduledDate: new Date(2026, 1, 1),
        recurrence: pattern,
      });
      const instances = generateRecurringInstances(
        task,
        new Date(2026, 1, 1),
        new Date(2026, 1, 3)
      );
      instances.forEach((instance) => {
        expect(instance.recurrence).toBeNull();
      });
    });
  });
});
