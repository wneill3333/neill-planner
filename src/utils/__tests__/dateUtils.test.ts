/**
 * Date Utility Functions Tests
 *
 * Comprehensive tests for date manipulation and display utilities.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  formatDisplayDate,
  addDays,
  isToday,
  parseISODate,
  toISODateString,
  getTodayString,
} from '../dateUtils';

// =============================================================================
// Test Setup
// =============================================================================

describe('dateUtils', () => {
  beforeEach(() => {
    // Mock current date to Feb 2, 2026 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 2)); // Month is 0-indexed, so 1 = February
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =============================================================================
  // formatDisplayDate Tests
  // =============================================================================

  describe('formatDisplayDate', () => {
    it('should format ISO string to full date display', () => {
      const result = formatDisplayDate('2026-01-24');
      expect(result).toBe('Saturday, January 24, 2026');
    });

    it('should format Date object to full date display', () => {
      const date = new Date(2026, 0, 24); // January 24, 2026
      const result = formatDisplayDate(date);
      expect(result).toBe('Saturday, January 24, 2026');
    });

    it('should handle different months correctly', () => {
      expect(formatDisplayDate('2026-02-02')).toBe('Monday, February 2, 2026');
      expect(formatDisplayDate('2026-03-15')).toBe('Sunday, March 15, 2026');
      expect(formatDisplayDate('2026-12-25')).toBe('Friday, December 25, 2026');
    });

    it('should handle leap year dates', () => {
      // 2024 is a leap year
      const result = formatDisplayDate('2024-02-29');
      expect(result).toBe('Thursday, February 29, 2024');
    });

    it('should handle year boundaries', () => {
      expect(formatDisplayDate('2025-12-31')).toBe('Wednesday, December 31, 2025');
      expect(formatDisplayDate('2026-01-01')).toBe('Thursday, January 1, 2026');
    });

    it('should display single-digit days without leading zero', () => {
      const result = formatDisplayDate('2026-01-05');
      expect(result).toBe('Monday, January 5, 2026');
    });

    it('should display correct day of week', () => {
      expect(formatDisplayDate('2026-02-02')).toContain('Monday');
      expect(formatDisplayDate('2026-02-07')).toContain('Saturday');
      expect(formatDisplayDate('2026-02-08')).toContain('Sunday');
    });
  });

  // =============================================================================
  // addDays Tests
  // =============================================================================

  describe('addDays', () => {
    it('should add positive days to ISO string', () => {
      expect(addDays('2026-01-24', 1)).toBe('2026-01-25');
      expect(addDays('2026-01-24', 7)).toBe('2026-01-31');
      expect(addDays('2026-01-24', 10)).toBe('2026-02-03');
    });

    it('should add negative days (subtract) from ISO string', () => {
      expect(addDays('2026-01-24', -1)).toBe('2026-01-23');
      expect(addDays('2026-01-24', -7)).toBe('2026-01-17');
      expect(addDays('2026-01-24', -30)).toBe('2025-12-25');
    });

    it('should add zero days (return same date)', () => {
      expect(addDays('2026-01-24', 0)).toBe('2026-01-24');
    });

    it('should add days to Date object', () => {
      const date = new Date(2026, 0, 24); // January 24, 2026
      expect(addDays(date, 1)).toBe('2026-01-25');
      expect(addDays(date, -1)).toBe('2026-01-23');
    });

    it('should handle month boundaries correctly', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01'); // Jan -> Feb
      expect(addDays('2026-02-01', -1)).toBe('2026-01-31'); // Feb -> Jan
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); // Feb -> Mar (non-leap year)
    });

    it('should handle year boundaries correctly', () => {
      expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
      expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    });

    it('should handle leap year correctly', () => {
      // 2024 is a leap year
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    });

    it('should handle large day increments', () => {
      expect(addDays('2026-01-01', 365)).toBe('2027-01-01');
      expect(addDays('2026-12-31', -365)).toBe('2025-12-31');
    });
  });

  // =============================================================================
  // isToday Tests
  // =============================================================================

  describe('isToday', () => {
    it('should return true for today as ISO string', () => {
      expect(isToday('2026-02-02')).toBe(true);
    });

    it('should return true for today as Date object', () => {
      const today = new Date(2026, 1, 2);
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      expect(isToday('2026-02-01')).toBe(false);
    });

    it('should return false for tomorrow', () => {
      expect(isToday('2026-02-03')).toBe(false);
    });

    it('should return false for dates in different months', () => {
      expect(isToday('2026-01-02')).toBe(false);
      expect(isToday('2026-03-02')).toBe(false);
    });

    it('should return false for dates in different years', () => {
      expect(isToday('2025-02-02')).toBe(false);
      expect(isToday('2027-02-02')).toBe(false);
    });

    it('should handle Date object with different times correctly', () => {
      // Should be true regardless of time on the same day
      const morning = new Date(2026, 1, 2, 8, 0, 0);
      const evening = new Date(2026, 1, 2, 20, 30, 0);
      expect(isToday(morning)).toBe(true);
      expect(isToday(evening)).toBe(true);
    });
  });

  // =============================================================================
  // parseISODate Tests
  // =============================================================================

  describe('parseISODate', () => {
    it('should parse ISO string to Date object', () => {
      const result = parseISODate('2026-01-24');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(24);
    });

    it('should parse different dates correctly', () => {
      const date1 = parseISODate('2026-02-02');
      expect(date1.getFullYear()).toBe(2026);
      expect(date1.getMonth()).toBe(1); // February is 1
      expect(date1.getDate()).toBe(2);

      const date2 = parseISODate('2025-12-31');
      expect(date2.getFullYear()).toBe(2025);
      expect(date2.getMonth()).toBe(11); // December is 11
      expect(date2.getDate()).toBe(31);
    });

    it('should handle leap year dates', () => {
      const leapDay = parseISODate('2024-02-29');
      expect(leapDay.getFullYear()).toBe(2024);
      expect(leapDay.getMonth()).toBe(1);
      expect(leapDay.getDate()).toBe(29);
    });
  });

  // =============================================================================
  // toISODateString Tests
  // =============================================================================

  describe('toISODateString', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date(2026, 0, 24); // January 24, 2026
      expect(toISODateString(date)).toBe('2026-01-24');
    });

    it('should handle single-digit months with leading zero', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(toISODateString(date)).toBe('2026-01-05');
    });

    it('should handle single-digit days with leading zero', () => {
      const date = new Date(2026, 11, 5); // December 5, 2026
      expect(toISODateString(date)).toBe('2026-12-05');
    });

    it('should handle year boundaries', () => {
      expect(toISODateString(new Date(2025, 11, 31))).toBe('2025-12-31');
      expect(toISODateString(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('should ignore time component', () => {
      const morning = new Date(2026, 0, 24, 8, 30, 0);
      const evening = new Date(2026, 0, 24, 20, 30, 0);
      expect(toISODateString(morning)).toBe('2026-01-24');
      expect(toISODateString(evening)).toBe('2026-01-24');
    });

    it('should be inverse of parseISODate', () => {
      const original = '2026-01-24';
      const parsed = parseISODate(original);
      const converted = toISODateString(parsed);
      expect(converted).toBe(original);
    });
  });

  // =============================================================================
  // getTodayString Tests
  // =============================================================================

  describe('getTodayString', () => {
    it('should return today as ISO string', () => {
      expect(getTodayString()).toBe('2026-02-02');
    });

    it('should return same value when called multiple times', () => {
      const first = getTodayString();
      const second = getTodayString();
      expect(first).toBe(second);
    });

    it('should match toISODateString(new Date())', () => {
      const direct = toISODateString(new Date());
      const fromHelper = getTodayString();
      expect(fromHelper).toBe(direct);
    });

    it('should return true when passed to isToday', () => {
      const today = getTodayString();
      expect(isToday(today)).toBe(true);
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration tests', () => {
    it('should handle round-trip conversion: ISO -> Date -> ISO', () => {
      const original = '2026-01-24';
      const date = parseISODate(original);
      const converted = toISODateString(date);
      expect(converted).toBe(original);
    });

    it('should handle date arithmetic chain', () => {
      const start = '2026-01-24';
      const plus7 = addDays(start, 7);
      const minus3 = addDays(plus7, -3);
      const expected = addDays(start, 4);
      expect(minus3).toBe(expected);
    });

    it('should format date after arithmetic', () => {
      const base = '2026-01-24';
      const nextWeek = addDays(base, 7);
      const formatted = formatDisplayDate(nextWeek);
      expect(formatted).toBe('Saturday, January 31, 2026');
    });

    it('should check if date arithmetic results in today', () => {
      const yesterday = '2026-02-01';
      const tomorrow = '2026-02-03';
      expect(isToday(addDays(yesterday, 1))).toBe(true);
      expect(isToday(addDays(tomorrow, -1))).toBe(true);
    });
  });
});
