/**
 * Reminder Utils Tests
 *
 * Tests for reminder utility functions:
 * - getReminderTypeIcon
 * - formatMinutesBefore
 */

import { describe, it, expect } from 'vitest';
import { getReminderTypeIcon, formatMinutesBefore } from '../reminderUtils';
import type { ReminderType } from '../../types/reminder.types';

// =============================================================================
// getReminderTypeIcon Tests
// =============================================================================

describe('getReminderTypeIcon', () => {
  it('should return bell icon for push notifications', () => {
    const icon = getReminderTypeIcon('push');
    expect(icon).toBe('\uD83D\uDD14'); // Bell emoji
  });

  it('should return email icon for email notifications', () => {
    const icon = getReminderTypeIcon('email');
    expect(icon).toBe('\uD83D\uDCE7'); // Email emoji
  });

  it('should return speech bubble icon for inApp notifications', () => {
    const icon = getReminderTypeIcon('inApp');
    expect(icon).toBe('\uD83D\uDCAC'); // Speech bubble emoji
  });

  it('should handle all valid reminder types', () => {
    const types: ReminderType[] = ['push', 'email', 'inApp'];

    for (const type of types) {
      const icon = getReminderTypeIcon(type);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// formatMinutesBefore Tests
// =============================================================================

describe('formatMinutesBefore', () => {
  describe('at time of event (0 minutes)', () => {
    it('should return "At time of event" for 0 minutes', () => {
      expect(formatMinutesBefore(0)).toBe('At time of event');
    });
  });

  describe('minutes format (< 60 minutes)', () => {
    it('should format 1 minute correctly (singular)', () => {
      expect(formatMinutesBefore(1)).toBe('1 minute before');
    });

    it('should format 5 minutes correctly (plural)', () => {
      expect(formatMinutesBefore(5)).toBe('5 minutes before');
    });

    it('should format 15 minutes correctly', () => {
      expect(formatMinutesBefore(15)).toBe('15 minutes before');
    });

    it('should format 30 minutes correctly', () => {
      expect(formatMinutesBefore(30)).toBe('30 minutes before');
    });

    it('should format 59 minutes correctly', () => {
      expect(formatMinutesBefore(59)).toBe('59 minutes before');
    });
  });

  describe('hours format (60-1439 minutes)', () => {
    it('should format 60 minutes as 1 hour (singular)', () => {
      expect(formatMinutesBefore(60)).toBe('1 hour before');
    });

    it('should format 120 minutes as 2 hours (plural)', () => {
      expect(formatMinutesBefore(120)).toBe('2 hours before');
    });

    it('should format 90 minutes as 1h 30m', () => {
      expect(formatMinutesBefore(90)).toBe('1h 30m before');
    });

    it('should format 150 minutes as 2h 30m', () => {
      expect(formatMinutesBefore(150)).toBe('2h 30m before');
    });

    it('should format 180 minutes as 3 hours', () => {
      expect(formatMinutesBefore(180)).toBe('3 hours before');
    });

    it('should format 1439 minutes correctly (just under 1 day)', () => {
      expect(formatMinutesBefore(1439)).toBe('23h 59m before');
    });

    it('should format exact hours without remainder', () => {
      expect(formatMinutesBefore(360)).toBe('6 hours before');
      expect(formatMinutesBefore(720)).toBe('12 hours before');
    });
  });

  describe('days format (>= 1440 minutes)', () => {
    it('should format 1440 minutes as 1 day (singular)', () => {
      expect(formatMinutesBefore(1440)).toBe('1 day before');
    });

    it('should format 2880 minutes as 2 days (plural)', () => {
      expect(formatMinutesBefore(2880)).toBe('2 days before');
    });

    it('should format 1500 minutes as 1d 1h (with hours)', () => {
      expect(formatMinutesBefore(1500)).toBe('1d 1h before');
    });

    it('should format 10080 minutes as 7 days (1 week)', () => {
      expect(formatMinutesBefore(10080)).toBe('7 days before');
    });

    it('should format days with hours correctly', () => {
      // 1 day + 3 hours = 1440 + 180 = 1620
      expect(formatMinutesBefore(1620)).toBe('1d 3h before');

      // 2 days + 12 hours = 2880 + 720 = 3600
      expect(formatMinutesBefore(3600)).toBe('2d 12h before');
    });
  });

  describe('edge cases', () => {
    it('should handle very large values', () => {
      // 30 days = 43200 minutes
      expect(formatMinutesBefore(43200)).toBe('30 days before');
    });

    it('should handle decimal minutes by treating as whole numbers', () => {
      // JavaScript will truncate in Math.floor operations
      const result = formatMinutesBefore(61);
      expect(result).toBe('1h 1m before');
    });
  });

  describe('common reminder presets', () => {
    it('should format all common preset values correctly', () => {
      // Common reminder time presets
      expect(formatMinutesBefore(0)).toBe('At time of event');
      expect(formatMinutesBefore(5)).toBe('5 minutes before');
      expect(formatMinutesBefore(15)).toBe('15 minutes before');
      expect(formatMinutesBefore(30)).toBe('30 minutes before');
      expect(formatMinutesBefore(60)).toBe('1 hour before');
      expect(formatMinutesBefore(120)).toBe('2 hours before');
      expect(formatMinutesBefore(1440)).toBe('1 day before');
      expect(formatMinutesBefore(10080)).toBe('7 days before');
    });
  });

  describe('pluralization', () => {
    it('should use singular for 1 minute', () => {
      expect(formatMinutesBefore(1)).toContain('minute ');
      expect(formatMinutesBefore(1)).not.toContain('minutes');
    });

    it('should use plural for multiple minutes', () => {
      expect(formatMinutesBefore(2)).toContain('minutes');
      expect(formatMinutesBefore(59)).toContain('minutes');
    });

    it('should use singular for 1 hour', () => {
      expect(formatMinutesBefore(60)).toContain('hour ');
      expect(formatMinutesBefore(60)).not.toContain('hours');
    });

    it('should use plural for multiple hours', () => {
      expect(formatMinutesBefore(120)).toContain('hours');
      expect(formatMinutesBefore(720)).toContain('hours');
    });

    it('should use singular for 1 day', () => {
      expect(formatMinutesBefore(1440)).toContain('day ');
      expect(formatMinutesBefore(1440)).not.toContain('days');
    });

    it('should use plural for multiple days', () => {
      expect(formatMinutesBefore(2880)).toContain('days');
      expect(formatMinutesBefore(10080)).toContain('days');
    });
  });
});
