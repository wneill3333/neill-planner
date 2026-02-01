/**
 * Firestore Utilities
 *
 * Helper functions for converting between JavaScript Date objects
 * and Firestore Timestamp objects. Reduces code duplication across
 * service layers.
 *
 * This module provides:
 * - Single value conversions (Date ↔ Timestamp)
 * - Batch conversions for objects with multiple date fields
 * - Date string utilities for ISO format handling
 * - Type guards for Timestamp detection
 *
 * @module utils/firestoreUtils
 */

import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Date Conversion Utilities
// =============================================================================

/**
 * Convert a Date object to Firestore Timestamp, handling null/undefined.
 *
 * @param date - Date to convert (can be null or undefined)
 * @returns Firestore Timestamp or null
 *
 * @example
 * const timestamp = dateToTimestamp(new Date()); // Timestamp
 * const nullTimestamp = dateToTimestamp(null);   // null
 */
export function dateToTimestamp(date: Date | null | undefined): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

/**
 * Convert Firestore Timestamp to Date, handling null/undefined with optional fallback.
 *
 * @param timestamp - Firestore Timestamp to convert
 * @param fallback - Optional fallback date if timestamp is null (defaults to current date)
 * @returns Date object
 *
 * @example
 * const date = timestampToDate(firestoreTimestamp);           // Date from timestamp
 * const dateWithFallback = timestampToDate(null, new Date()); // Fallback date
 * const currentDate = timestampToDate(null);                  // Current date as fallback
 */
export function timestampToDate(
  timestamp: Timestamp | null | undefined,
  fallback: Date = new Date()
): Date {
  return timestamp?.toDate() ?? fallback;
}

/**
 * Convert Firestore Timestamp to Date, returning null if timestamp is null/undefined.
 *
 * @param timestamp - Firestore Timestamp to convert
 * @returns Date object or null
 *
 * @example
 * const date = timestampToDateOrNull(firestoreTimestamp); // Date or null
 */
export function timestampToDateOrNull(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp?.toDate() ?? null;
}

// =============================================================================
// Batch Conversion Utilities
// =============================================================================

/**
 * Fields that contain Date objects and need conversion to Timestamps.
 */
export type DateFieldName =
  | 'scheduledDate'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'instanceDate'
  | 'endDate'
  | 'lastLoginAt';

/**
 * Convert multiple Date fields to Timestamps in an object.
 *
 * Creates a new object with the specified Date fields converted to Timestamps.
 * Non-date fields are copied as-is.
 *
 * @param obj - Object with potential Date fields
 * @param fields - Array of field names to convert
 * @returns New object with converted fields
 *
 * @example
 * const task = { title: 'Test', scheduledDate: new Date(), createdAt: new Date() };
 * const forFirestore = convertDatesToTimestamps(task, ['scheduledDate', 'createdAt']);
 * // { title: 'Test', scheduledDate: Timestamp, createdAt: Timestamp }
 */
export function convertDatesToTimestamps<T extends Record<string, unknown>>(
  obj: T,
  fields: DateFieldName[]
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (value instanceof Date) {
      (result as Record<string, unknown>)[field] = dateToTimestamp(value);
    } else if (value === null || value === undefined) {
      (result as Record<string, unknown>)[field] = null;
    }
  }

  return result;
}

/**
 * Convert multiple Timestamp fields to Dates in an object.
 *
 * Creates a new object with the specified Timestamp fields converted to Dates.
 * Non-timestamp fields are copied as-is.
 *
 * @param obj - Object with potential Timestamp fields
 * @param fields - Array of field names to convert
 * @param fallbacks - Optional record of fallback dates for each field
 * @returns New object with converted fields
 *
 * @example
 * const firestoreData = { title: 'Test', createdAt: Timestamp.now() };
 * const appData = convertTimestampsToDates(firestoreData, ['createdAt']);
 * // { title: 'Test', createdAt: Date }
 */
export function convertTimestampsToDates<T extends Record<string, unknown>>(
  obj: T,
  fields: DateFieldName[],
  fallbacks?: Partial<Record<DateFieldName, Date>>
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (value instanceof Timestamp) {
      (result as Record<string, unknown>)[field] = value.toDate();
    } else if ((value === null || value === undefined) && fallbacks?.[field]) {
      (result as Record<string, unknown>)[field] = fallbacks[field];
    } else if (value === null || value === undefined) {
      (result as Record<string, unknown>)[field] = null;
    }
  }

  return result;
}

// =============================================================================
// Date String Utilities
// =============================================================================

/**
 * Get ISO date string (YYYY-MM-DD) from a Date object.
 *
 * @param date - Date object to convert
 * @returns ISO date string or null if date is null/undefined
 *
 * @example
 * const dateStr = getDateString(new Date('2024-01-15')); // '2024-01-15'
 * const nullStr = getDateString(null);                   // null
 */
export function getDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Parse an ISO date string to a Date object.
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Date object set to midnight UTC
 *
 * @example
 * const date = parseISODateString('2024-01-15'); // Date at midnight UTC
 */
export function parseISODateString(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

/**
 * Check if a value is a valid Firestore Timestamp.
 *
 * @param value - Value to check
 * @returns True if value is a Timestamp
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}
