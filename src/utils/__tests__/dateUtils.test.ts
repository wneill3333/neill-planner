/**
 * Date Utility Functions Tests
 *
 * Comprehensive tests for date manipulation and display utilities.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  formatDisplayDate,
  formatShortDate,
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
  // formatShortDate Tests
  // =============================================================================

  describe('formatShortDate', () => {
    it('should format ISO string to short date display', () => {
      const result = formatShortDate('2026-01-24');
      expect(result).toBe('Sat, Jan 24');
    });

    it('should format Date object to short date display', () => {
      const date = new Date(2026, 0, 24); // January 24, 2026
      const result = formatShortDate(date);
      expect(result).toBe('Sat, Jan 24');
    });

    it('should handle different months correctly', () => {
      expect(formatShortDate('2026-02-02')).toBe('Mon, Feb 2');
      expect(formatShortDate('2026-03-15')).toBe('Sun, Mar 15');
      expect(formatShortDate('2026-12-25')).toBe('Fri, Dec 25');
    });

    it('should display single-digit days without leading zero', () => {
      expect(formatShortDate('2026-01-01')).toBe('Thu, Jan 1');
      expect(formatShortDate('2026-01-05')).toBe('Mon, Jan 5');
      expect(formatShortDate('2026-01-09')).toBe('Fri, Jan 9');
    });

    it('should display double-digit days correctly', () => {
      expect(formatShortDate('2026-01-10')).toBe('Sat, Jan 10');
      expect(formatShortDate('2026-01-15')).toBe('Thu, Jan 15');
      expect(formatShortDate('2026-01-31')).toBe('Sat, Jan 31');
    });

    it('should abbreviate day names correctly', () => {
      expect(formatShortDate('2026-02-02')).toContain('Mon'); // Monday
      expect(formatShortDate('2026-02-03')).toContain('Tue'); // Tuesday
      expect(formatShortDate('2026-02-04')).toContain('Wed'); // Wednesday
      expect(formatShortDate('2026-02-05')).toContain('Thu'); // Thursday
      expect(formatShortDate('2026-02-06')).toContain('Fri'); // Friday
      expect(formatShortDate('2026-02-07')).toContain('Sat'); // Saturday
      expect(formatShortDate('2026-02-08')).toContain('Sun'); // Sunday
    });

    it('should abbreviate month names correctly', () => {
      expect(formatShortDate('2026-01-15')).toContain('Jan'); // January
      expect(formatShortDate('2026-02-15')).toContain('Feb'); // February
      expect(formatShortDate('2026-03-15')).toContain('Mar'); // March
      expect(formatShortDate('2026-04-15')).toContain('Apr'); // April
      expect(formatShortDate('2026-05-15')).toContain('May'); // May
      expect(formatShortDate('2026-06-15')).toContain('Jun'); // June
      expect(formatShortDate('2026-07-15')).toContain('Jul'); // July
      expect(formatShortDate('2026-08-15')).toContain('Aug'); // August
      expect(formatShortDate('2026-09-15')).toContain('Sep'); // September
      expect(formatShortDate('2026-10-15')).toContain('Oct'); // October
      expect(formatShortDate('2026-11-15')).toContain('Nov'); // November
      expect(formatShortDate('2026-12-15')).toContain('Dec'); // December
    });

    it('should handle leap year dates', () => {
      // 2024 is a leap year
      const result = formatShortDate('2024-02-29');
      expect(result).toBe('Thu, Feb 29');
    });

    it('should handle year boundaries', () => {
      expect(formatShortDate('2025-12-31')).toBe('Wed, Dec 31');
      expect(formatShortDate('2026-01-01')).toBe('Thu, Jan 1');
    });

    it('should handle today correctly', () => {
      // Mocked date is Feb 2, 2026
      expect(formatShortDate('2026-02-02')).toBe('Mon, Feb 2');
    });

    it('should be shorter than formatDisplayDate', () => {
      const isoDate = '2026-01-24';
      const short = formatShortDate(isoDate);
      const full = formatDisplayDate(isoDate);
      expect(short.length).toBeLessThan(full.length);
    });

    it('should maintain consistent format structure', () => {
      // Format should always be: "DDD, MMM D" where DDD=3 chars, MMM=3 chars, D=1-2 chars
      const result = formatShortDate('2026-01-24');
      const parts = result.split(', ');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(3); // Day abbreviation (e.g., "Sat")

      const monthDay = parts[1].split(' ');
      expect(monthDay).toHaveLength(2);
      expect(monthDay[0]).toHaveLength(3); // Month abbreviation (e.g., "Jan")
      expect(parseInt(monthDay[1])).toBeGreaterThan(0); // Day number
      expect(parseInt(monthDay[1])).toBeLessThanOrEqual(31); // Valid day
    });

    it('should handle Date object with different times correctly', () => {
      // Should format the same regardless of time on the same day
      const morning = new Date(2026, 1, 2, 8, 0, 0);
      const evening = new Date(2026, 1, 2, 20, 30, 0);
      expect(formatShortDate(morning)).toBe('Mon, Feb 2');
      expect(formatShortDate(evening)).toBe('Mon, Feb 2');
    });

    it('should work with dates far in the future', () => {
      expect(formatShortDate('2030-06-15')).toBe('Sat, Jun 15');
      expect(formatShortDate('2050-12-25')).toBe('Sun, Dec 25');
    });

    it('should work with dates in the past', () => {
      expect(formatShortDate('2020-01-01')).toBe('Wed, Jan 1');
      expect(formatShortDate('2000-02-14')).toBe('Mon, Feb 14');
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
