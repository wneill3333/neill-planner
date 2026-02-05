/**
 * Date Utility Functions
 *
 * Helper functions for date manipulation and display using date-fns.
 *
 * IMPORTANT: Date Serialization Strategy
 * ======================================
 * Redux serializes Date objects to ISO strings. Firebase Timestamps also
 * convert to/from ISO strings. This can cause timezone issues when:
 * - UTC midnight ISO string → new Date() → local timezone interpretation
 * - Local startOfDay() shifts date ±1 day depending on timezone offset
 *
 * Our strategy:
 * 1. Store dates as ISO date strings (YYYY-MM-DD) without time component
 * 2. All date comparisons use string format, not Date objects
 * 3. normalizeToDateString() is the canonical conversion function
 * 4. Display formatting happens only in UI layer
 */

import {
  format,
  addDays as dateFnsAddDays,
  parseISO,
  isToday as dateFnsIsToday,
  startOfDay,
} from 'date-fns';

// =============================================================================
// CRITICAL: Date Normalization for Redux/Firebase Compatibility
// =============================================================================

/**
 * Normalize any date input to a canonical YYYY-MM-DD string.
 * This is the PRIMARY function for date comparisons and storage.
 *
 * Handles:
 * - Date objects (uses local date components)
 * - ISO strings with time (e.g., "2026-01-24T00:00:00.000Z")
 * - ISO date strings (e.g., "2026-01-24")
 * - Invalid inputs (returns empty string)
 *
 * @param date - Date object, ISO string, or null/undefined
 * @returns YYYY-MM-DD string, or empty string if invalid
 *
 * @example
 * normalizeToDateString(new Date(2026, 0, 24)) // "2026-01-24"
 * normalizeToDateString("2026-01-24T00:00:00.000Z") // "2026-01-24"
 * normalizeToDateString("2026-01-24") // "2026-01-24"
 */
export function normalizeToDateString(date: Date | string | null | undefined): string {
  if (!date) return '';

  if (typeof date === 'string') {
    // Already a date string without time? Return as-is after validation
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // ISO string with time component - extract just the date part
    // This avoids timezone conversion issues
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
    // Try parsing as a Date and extracting components
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      // Use LOCAL date components to preserve the intended calendar date
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
    return '';
  }

  // Handle Firestore Timestamp objects (have toDate() method but aren't Date instances)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof date === 'object' && date !== null && typeof (date as any).toDate === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateObj = (date as any).toDate();
    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      // Use LOCAL date components - the date was stored as local midnight
      return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    }
    return '';
  }

  // Date object - use LOCAL date components to preserve the intended calendar date
  // Using UTC components would shift the date for users west of UTC (e.g., EST, PST)
  // Example: Feb 5, 2026 00:00 EST = Feb 4, 2026 19:00 UTC - getUTCDate() would return 4!
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Unknown type - log warning and return empty
  console.warn('[normalizeToDateString] Unknown date type:', typeof date, date);
  return '';
}

/**
 * Convert any date input to a Date object for date-fns operations.
 * Uses parseISO for strings to maintain consistency.
 *
 * @param date - Date object or ISO string
 * @returns Date object at local midnight for the given date
 */
export function toDateObject(date: Date | string): Date {
  if (date instanceof Date) {
    return startOfDay(date);
  }
  // For strings, normalize first then parse to avoid timezone issues
  const dateString = normalizeToDateString(date);
  if (!dateString) {
    return new Date(NaN); // Invalid date
  }
  // parseISO('YYYY-MM-DD') creates a date at local midnight
  return parseISO(dateString);
}

/**
 * Check if two dates represent the same calendar day.
 * Uses string comparison to avoid timezone issues.
 *
 * @param date1 - First date (Date or string)
 * @param date2 - Second date (Date or string)
 * @returns true if same day, false otherwise
 */
export function isSameDateString(
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined
): boolean {
  const str1 = normalizeToDateString(date1);
  const str2 = normalizeToDateString(date2);
  return str1 !== '' && str1 === str2;
}

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
