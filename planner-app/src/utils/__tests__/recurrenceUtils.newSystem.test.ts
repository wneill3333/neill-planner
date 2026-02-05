/**
 * Tests for the new recurring pattern system utilities
 *
 * These tests cover the materialized instance generation functions
 * including getNthWeekdayOfMonth, getNextOccurrenceForPattern, and generateOccurrenceDates.
 */

import { describe, it, expect } from 'vitest';
import { startOfDay } from 'date-fns';
import {
  getNthWeekdayOfMonth,
  getNextOccurrenceForPattern,
  generateOccurrenceDates,
} from '../recurrenceUtils';
import type { RecurringPattern, TaskPriority } from '../../types';

// Helper to create a local date (avoiding timezone issues)
function localDate(year: number, month: number, day: number): Date {
  return startOfDay(new Date(year, month - 1, day));
}

// Helper to create a base pattern for testing
function createTestPattern(overrides: Partial<RecurringPattern> = {}): RecurringPattern {
  const basePriority: TaskPriority = { letter: 'A', number: 1 };
  return {
    id: 'test-pattern',
    userId: 'test-user',
    title: 'Test Pattern',
    description: '',
    categoryId: null,
    priority: basePriority,
    startTime: null,
    duration: null,
    type: 'daily',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    nthWeekday: null,
    specificDatesOfMonth: null,
    daysAfterCompletion: null,
    endCondition: { type: 'never', endDate: null, maxOccurrences: null },
    startDate: localDate(2026, 2, 1),
    generatedUntil: localDate(2026, 5, 1),
    activeInstanceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

// Helper to compare dates by date portion only (ignore time/timezone)
function sameDate(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

describe('getNthWeekdayOfMonth', () => {
  describe('positive nth values (1st, 2nd, 3rd, etc.)', () => {
    it('should find the 1st Monday of February 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 2, 1, 1); // 1st Monday
      expect(sameDate(result, localDate(2026, 2, 2))).toBe(true); // Feb 2, 2026
    });

    it('should find the 2nd Tuesday of March 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 3, 2, 2); // 2nd Tuesday
      expect(sameDate(result, localDate(2026, 3, 10))).toBe(true); // March 10, 2026
    });

    it('should find the 3rd Friday of January 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 1, 3, 5); // 3rd Friday
      expect(sameDate(result, localDate(2026, 1, 16))).toBe(true); // Jan 16, 2026
    });

    it('should find the 4th Sunday of April 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 4, 4, 0); // 4th Sunday
      expect(sameDate(result, localDate(2026, 4, 26))).toBe(true); // April 26, 2026
    });

    it('should return null for 5th occurrence that does not exist', () => {
      const result = getNthWeekdayOfMonth(2026, 2, 5, 1); // 5th Monday of Feb (doesn't exist)
      expect(result).toBeNull();
    });

    it('should find 5th occurrence when it exists', () => {
      // March 2026 has 5 Sundays
      const result = getNthWeekdayOfMonth(2026, 3, 5, 0); // 5th Sunday of March
      expect(sameDate(result, localDate(2026, 3, 29))).toBe(true); // March 29, 2026
    });
  });

  describe('negative nth values (last)', () => {
    it('should find the last Friday of March 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 3, -1, 5); // Last Friday
      expect(sameDate(result, localDate(2026, 3, 27))).toBe(true); // March 27, 2026
    });

    it('should find the last Monday of February 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 2, -1, 1); // Last Monday
      expect(sameDate(result, localDate(2026, 2, 23))).toBe(true); // Feb 23, 2026
    });

    it('should find the last Sunday of December 2026', () => {
      const result = getNthWeekdayOfMonth(2026, 12, -1, 0); // Last Sunday
      expect(sameDate(result, localDate(2026, 12, 27))).toBe(true); // Dec 27, 2026
    });
  });

  describe('edge cases', () => {
    it('should return null for n=0', () => {
      const result = getNthWeekdayOfMonth(2026, 2, 0, 1);
      expect(result).toBeNull();
    });

    it('should return null for invalid weekday', () => {
      const result = getNthWeekdayOfMonth(2026, 2, 1, 7);
      expect(result).toBeNull();
    });

    it('should return null for invalid month', () => {
      const result = getNthWeekdayOfMonth(2026, 13, 1, 1);
      expect(result).toBeNull();
    });
  });
});

describe('getNextOccurrenceForPattern', () => {
  describe('daily patterns', () => {
    it('should return next day for interval=1', () => {
      const pattern = createTestPattern({ type: 'daily', interval: 1 });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 5));
      expect(sameDate(result, localDate(2026, 2, 6))).toBe(true);
    });

    it('should return day after 3 days for interval=3', () => {
      const pattern = createTestPattern({ type: 'daily', interval: 3 });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 5));
      expect(sameDate(result, localDate(2026, 2, 8))).toBe(true);
    });
  });

  describe('weekly patterns', () => {
    it('should return next Monday for Mon-only pattern', () => {
      const pattern = createTestPattern({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Monday
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 2)); // Monday
      expect(sameDate(result, localDate(2026, 2, 9))).toBe(true); // Next Monday
    });

    it('should return next occurrence in multi-day pattern', () => {
      const pattern = createTestPattern({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 2)); // Monday
      expect(sameDate(result, localDate(2026, 2, 4))).toBe(true); // Wednesday
    });

    it('should return null for empty daysOfWeek', () => {
      const pattern = createTestPattern({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [],
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 2));
      expect(result).toBeNull();
    });
  });

  describe('monthly patterns with nthWeekday', () => {
    it('should return 2nd Tuesday of next month', () => {
      const pattern = createTestPattern({
        type: 'monthly',
        interval: 1,
        nthWeekday: { n: 2, weekday: 2 }, // 2nd Tuesday
      });
      // Start from Feb 10 (2nd Tuesday of Feb 2026)
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 10));
      expect(sameDate(result, localDate(2026, 3, 10))).toBe(true); // 2nd Tuesday of March
    });

    it('should return last Friday of next month', () => {
      const pattern = createTestPattern({
        type: 'monthly',
        interval: 1,
        nthWeekday: { n: -1, weekday: 5 }, // Last Friday
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 27)); // Last Fri of Feb
      expect(sameDate(result, localDate(2026, 3, 27))).toBe(true); // Last Friday of March
    });
  });

  describe('monthly patterns with specificDatesOfMonth', () => {
    it('should return next specific date in current month', () => {
      const pattern = createTestPattern({
        type: 'monthly',
        interval: 1,
        specificDatesOfMonth: [1, 15], // 1st and 15th
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 1));
      expect(sameDate(result, localDate(2026, 2, 15))).toBe(true); // Feb 15
    });

    it('should return first specific date of next month when past all dates', () => {
      const pattern = createTestPattern({
        type: 'monthly',
        interval: 1,
        specificDatesOfMonth: [1, 15],
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 15));
      expect(sameDate(result, localDate(2026, 3, 1))).toBe(true); // March 1
    });
  });

  describe('monthly patterns with standard dayOfMonth', () => {
    it('should return same day of next month', () => {
      const pattern = createTestPattern({
        type: 'monthly',
        interval: 1,
        dayOfMonth: 15,
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 15));
      expect(sameDate(result, localDate(2026, 3, 15))).toBe(true); // March 15
    });

    it('should handle month-end edge case (31st in February)', () => {
      const pattern = createTestPattern({
        type: 'monthly',
        interval: 1,
        dayOfMonth: 31,
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 1, 31));
      expect(sameDate(result, localDate(2026, 2, 28))).toBe(true); // Feb 28 (no Feb 31)
    });
  });

  describe('yearly patterns', () => {
    it('should return same date next year', () => {
      const pattern = createTestPattern({
        type: 'yearly',
        interval: 1,
        monthOfYear: 3, // March
        dayOfMonth: 15,
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 3, 15));
      expect(sameDate(result, localDate(2027, 3, 15))).toBe(true); // March 15, 2027
    });

    it('should handle leap year Feb 29', () => {
      const pattern = createTestPattern({
        type: 'yearly',
        interval: 1,
        monthOfYear: 2, // February
        dayOfMonth: 29,
      });
      // 2027 is not a leap year
      const result = getNextOccurrenceForPattern(pattern, localDate(2024, 2, 29)); // 2024 is leap year
      expect(sameDate(result, localDate(2025, 2, 28))).toBe(true); // Feb 28, 2025
    });
  });

  describe('afterCompletion patterns', () => {
    it('should return null (next date is calculated on completion)', () => {
      const pattern = createTestPattern({
        type: 'afterCompletion',
        daysAfterCompletion: 42, // 6 weeks
      });
      const result = getNextOccurrenceForPattern(pattern, localDate(2026, 2, 5));
      expect(result).toBeNull();
    });
  });
});

describe('generateOccurrenceDates', () => {
  describe('daily patterns', () => {
    it('should generate daily occurrences for 7 days', () => {
      const pattern = createTestPattern({
        type: 'daily',
        interval: 1,
        startDate: localDate(2026, 2, 1),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 7)
      );

      expect(dates).toHaveLength(7);
      expect(sameDate(dates[0], localDate(2026, 2, 1))).toBe(true);
      expect(sameDate(dates[6], localDate(2026, 2, 7))).toBe(true);
    });

    it('should generate every-other-day occurrences', () => {
      const pattern = createTestPattern({
        type: 'daily',
        interval: 2,
        startDate: localDate(2026, 2, 1),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 10)
      );

      expect(dates).toHaveLength(5); // Feb 1, 3, 5, 7, 9
      expect(sameDate(dates[0], localDate(2026, 2, 1))).toBe(true);
      expect(sameDate(dates[1], localDate(2026, 2, 3))).toBe(true);
      expect(sameDate(dates[4], localDate(2026, 2, 9))).toBe(true);
    });
  });

  describe('weekly patterns', () => {
    it('should generate Mon/Wed/Fri occurrences', () => {
      const pattern = createTestPattern({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        startDate: localDate(2026, 2, 2), // Monday
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 2),
        localDate(2026, 2, 13)
      );

      // Feb 2026: Mon 2, Wed 4, Fri 6, Mon 9, Wed 11, Fri 13
      expect(dates.length).toBeGreaterThanOrEqual(5);
      expect(sameDate(dates[0], localDate(2026, 2, 2))).toBe(true); // Mon
      expect(sameDate(dates[1], localDate(2026, 2, 4))).toBe(true); // Wed
      expect(sameDate(dates[2], localDate(2026, 2, 6))).toBe(true); // Fri
    });

    it('should generate bi-weekly occurrences', () => {
      const pattern = createTestPattern({
        type: 'weekly',
        interval: 2,
        daysOfWeek: [1], // Monday only
        startDate: localDate(2026, 2, 2),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 2),
        localDate(2026, 3, 2)
      );

      // Feb 2 (Mon), Feb 16 (Mon), March 2 (Mon)
      expect(dates.length).toBeGreaterThanOrEqual(2);
      expect(sameDate(dates[0], localDate(2026, 2, 2))).toBe(true);
    });
  });

  describe('end conditions', () => {
    it('should stop at endDate', () => {
      const pattern = createTestPattern({
        type: 'daily',
        interval: 1,
        startDate: localDate(2026, 2, 1),
        endCondition: {
          type: 'date',
          endDate: localDate(2026, 2, 5),
          maxOccurrences: null,
        },
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 10)
      );

      expect(dates).toHaveLength(5); // Feb 1-5
    });

    it('should stop at maxOccurrences', () => {
      const pattern = createTestPattern({
        type: 'daily',
        interval: 1,
        startDate: localDate(2026, 2, 1),
        endCondition: {
          type: 'occurrences',
          endDate: null,
          maxOccurrences: 5,
        },
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 28)
      );

      expect(dates).toHaveLength(5);
    });
  });

  describe('afterCompletion patterns', () => {
    it('should return only the startDate for afterCompletion', () => {
      const pattern = createTestPattern({
        type: 'afterCompletion',
        daysAfterCompletion: 42,
        startDate: localDate(2026, 2, 5),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 28)
      );

      expect(dates).toHaveLength(1);
      expect(sameDate(dates[0], localDate(2026, 2, 5))).toBe(true);
    });

    it('should return empty if startDate is outside range', () => {
      const pattern = createTestPattern({
        type: 'afterCompletion',
        daysAfterCompletion: 42,
        startDate: localDate(2026, 3, 1),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 28)
      );

      expect(dates).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should return empty array when range is before pattern start', () => {
      const pattern = createTestPattern({
        type: 'daily',
        interval: 1,
        startDate: localDate(2026, 3, 1),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 1),
        localDate(2026, 2, 28)
      );

      expect(dates).toHaveLength(0);
    });

    it('should handle range starting mid-pattern', () => {
      const pattern = createTestPattern({
        type: 'daily',
        interval: 1,
        startDate: localDate(2026, 2, 1),
      });

      const dates = generateOccurrenceDates(
        pattern,
        localDate(2026, 2, 15),
        localDate(2026, 2, 20)
      );

      expect(dates).toHaveLength(6); // Feb 15-20
      expect(sameDate(dates[0], localDate(2026, 2, 15))).toBe(true);
    });
  });
});
