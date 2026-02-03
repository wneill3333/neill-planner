/**
 * Date Utility Functions
 *
 * Helper functions for date manipulation and display using date-fns.
 */

import {
  format,
  addDays as dateFnsAddDays,
  parseISO,
  isToday as dateFnsIsToday,
  startOfDay,
} from 'date-fns';

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format a date for display
 * @param date - Date object or ISO date string (YYYY-MM-DD)
 * @returns Formatted date string like "Saturday, January 24, 2026"
 *
 * @example
 * formatDisplayDate('2026-01-24') // "Saturday, January 24, 2026"
 * formatDisplayDate(new Date(2026, 0, 24)) // "Saturday, January 24, 2026"
 */
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : startOfDay(date);
  return format(dateObj, 'EEEE, MMMM d, yyyy');
}

/**
 * Format a date as short abbreviated format
 * @param date - Date object or ISO date string (YYYY-MM-DD)
 * @returns Formatted date string like "Mon, Jan 1"
 *
 * @example
 * formatShortDate('2026-01-24') // "Sat, Jan 24"
 * formatShortDate(new Date(2026, 0, 1)) // "Thu, Jan 1"
 */
export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : startOfDay(date);
  return format(dateObj, 'EEE, MMM d');
}

// =============================================================================
// Date Manipulation
// =============================================================================

/**
 * Add days to a date and return ISO string
 * @param date - Date object or ISO date string (YYYY-MM-DD)
 * @param days - Number of days to add (can be negative)
 * @returns ISO date string (YYYY-MM-DD)
 *
 * @example
 * addDays('2026-01-24', 1) // "2026-01-25"
 * addDays('2026-01-24', -1) // "2026-01-23"
 * addDays(new Date(2026, 0, 24), 7) // "2026-01-31"
 */
export function addDays(date: Date | string, days: number): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const newDate = dateFnsAddDays(dateObj, days);
  return toISODateString(newDate);
}

// =============================================================================
// Date Comparison
// =============================================================================

/**
 * Check if a date is today
 * @param date - Date object or ISO date string (YYYY-MM-DD)
 * @returns true if the date is today, false otherwise
 *
 * @example
 * isToday('2026-02-02') // true (if today is Feb 2, 2026)
 * isToday(new Date()) // true
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsIsToday(dateObj);
}

// =============================================================================
// Date Parsing and Conversion
// =============================================================================

/**
 * Parse an ISO date string to Date object
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Date object
 *
 * @example
 * parseISODate('2026-01-24') // Date object for Jan 24, 2026
 */
export function parseISODate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Convert a Date object to ISO date string
 * @param date - Date object
 * @returns ISO date string (YYYY-MM-DD)
 *
 * @example
 * toISODateString(new Date(2026, 0, 24)) // "2026-01-24"
 */
export function toISODateString(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

/**
 * Get today's date as ISO string
 * @returns ISO date string for today (YYYY-MM-DD)
 *
 * @example
 * getTodayString() // "2026-02-02" (if today is Feb 2, 2026)
 */
export function getTodayString(): string {
  return toISODateString(new Date());
}
