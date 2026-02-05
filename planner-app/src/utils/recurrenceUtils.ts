/**
 * Recurrence Utility Functions
 *
 * Utilities for generating recurring task instances based on recurrence patterns.
 *
 * IMPORTANT: Date Handling Strategy
 * =================================
 * All date comparisons use string format (YYYY-MM-DD) to avoid timezone issues.
 * See dateUtils.ts for the normalizeToDateString() function which handles
 * Redux-serialized ISO strings and Date objects consistently.
 */

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfDay,
  isBefore,
  isAfter,
  format,
  getDaysInMonth,
  getDay,
  setDate,
  isLeapYear,
} from 'date-fns';
import type { Task, RecurrencePattern, RecurrenceEndCondition, InstanceModification } from '../types/task.types';
import { normalizeToDateString, toDateObject } from './dateUtils';

/**
 * Maximum number of recurring instances to generate to prevent infinite loops
 */
const MAX_RECURRING_INSTANCES = 1000;

/**
 * Check if a date is in the exceptions list
 *
 * @param date - The date to check (Date object or ISO string)
 * @param exceptions - Array of exception dates (may be Date objects or ISO strings from Redux)
 * @returns True if the date matches any exception (comparing by date string, not time)
 *
 * @example
 * ```ts
 * const date = new Date(2026, 1, 5);
 * const exceptions = [new Date(2026, 1, 5, 10, 0)]; // Different time, same day
 * isDateInExceptions(date, exceptions); // true
 *
 * // Also handles Redux-serialized ISO strings
 * isDateInExceptions("2026-02-05", ["2026-02-05T00:00:00.000Z"]); // true
 * ```
 */
export function isDateInExceptions(date: Date | string, exceptions: (Date | string)[]): boolean {
  const dateString = normalizeToDateString(date);
  if (!dateString) return false;
  return exceptions.some((exception) => normalizeToDateString(exception) === dateString);
}

/**
 * Check if the recurrence has reached its end condition
 *
 * @param endCondition - The end condition to evaluate
 * @param count - Current number of occurrences generated
 * @param currentDate - The current date being evaluated
 * @returns True if the recurrence should stop based on the end condition
 *
 * @example
 * ```ts
 * // End by date
 * hasReachedEndCondition(
 *   { type: 'date', endDate: new Date(2026, 2, 1), maxOccurrences: null },
 *   10,
 *   new Date(2026, 2, 5)
 * ); // true (current date is after end date)
 *
 * // End by occurrences
 * hasReachedEndCondition(
 *   { type: 'occurrences', endDate: null, maxOccurrences: 5 },
 *   5,
 *   new Date(2026, 1, 15)
 * ); // true (reached max occurrences)
 * ```
 */
export function hasReachedEndCondition(
  endCondition: RecurrenceEndCondition,
  count: number,
  currentDate: Date | string
): boolean {
  switch (endCondition.type) {
    case 'never':
      return false;

    case 'date': {
      if (!endCondition.endDate) return false;
      // Use string comparison to avoid timezone issues
      const currentDateString = normalizeToDateString(currentDate);
      const endDateString = normalizeToDateString(endCondition.endDate);
      if (!currentDateString || !endDateString) return false;
      // Compare strings lexicographically (YYYY-MM-DD format allows this)
      return currentDateString > endDateString;
    }

    case 'occurrences':
      if (!endCondition.maxOccurrences) return false;
      return count >= endCondition.maxOccurrences;

    default:
      return false;
  }
}

/**
 * Get the next occurrence date based on recurrence pattern
 *
 * @param pattern - The recurrence pattern configuration
 * @param currentDate - The current occurrence date (will find the next one after this)
 * @returns The next occurrence date, or null if unable to calculate
 *
 * @remarks
 * - For daily: Adds interval days to current date
 * - For weekly: Finds next day matching daysOfWeek, respecting interval
 * - For monthly: Advances by interval months, handling month-end edge cases
 * - For yearly: Advances by interval years, handling leap year edge cases
 * - For custom: Not yet implemented, returns null
 *
 * @example
 * ```ts
 * // Daily recurrence every 2 days
 * getNextOccurrence(
 *   { type: 'daily', interval: 2, ... },
 *   new Date(2026, 1, 1)
 * ); // Feb 3, 2026
 *
 * // Weekly recurrence on Mondays
 * getNextOccurrence(
 *   { type: 'weekly', interval: 1, daysOfWeek: [1], ... },
 *   new Date(2026, 1, 2) // Monday Feb 2
 * ); // Monday Feb 9
 * ```
 */
export function getNextOccurrence(
  pattern: RecurrencePattern,
  currentDate: Date
): Date | null {
  const normalized = startOfDay(currentDate);

  switch (pattern.type) {
    case 'daily':
      return addDays(normalized, pattern.interval);

    case 'weekly': {
      // For weekly recurrence, find the next day in daysOfWeek
      if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
        return null;
      }

      // Weekly recurrence algorithm:
      // 1. Start searching from the day after currentDate
      // 2. For interval=1: Find the next day in daysOfWeek (within the same week or next week)
      // 3. For interval>1: Must also be in the correct week interval (every N weeks)
      //
      // Example: If pattern is "every 2 weeks on Mon/Wed" starting Feb 2 (Monday):
      // - Feb 2 (Mon) -> Feb 4 (Wed) - same week interval
      // - Feb 4 (Wed) -> Feb 16 (Mon) - skip to week interval 2
      // - Feb 16 (Mon) -> Feb 18 (Wed) - same week interval

      let candidate = addDays(normalized, 1);
      const startWeek = Math.floor(
        (candidate.getTime() - normalized.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      // Look for the next occurrence within the next 7 * interval days
      for (let i = 0; i < 7 * pattern.interval; i++) {
        const dayOfWeek = getDay(candidate);
        const currentWeek = Math.floor(
          (candidate.getTime() - normalized.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );

        // Check if this day is in our daysOfWeek and we're in the right week interval
        if (
          pattern.daysOfWeek.includes(dayOfWeek) &&
          currentWeek % pattern.interval === startWeek % pattern.interval
        ) {
          return candidate;
        }

        candidate = addDays(candidate, 1);
      }

      // If we didn't find it in the current interval, jump to the next interval
      return addWeeks(normalized, pattern.interval);
    }

    case 'monthly': {
      if (!pattern.dayOfMonth) {
        return null;
      }

      const nextMonth = addMonths(normalized, pattern.interval);
      const daysInNextMonth = getDaysInMonth(nextMonth);

      // Handle case where dayOfMonth doesn't exist in the target month (e.g., 31st in February)
      const targetDay = Math.min(pattern.dayOfMonth, daysInNextMonth);
      return setDate(nextMonth, targetDay);
    }

    case 'yearly': {
      if (!pattern.monthOfYear || !pattern.dayOfMonth) {
        return null;
      }

      let nextYear = addYears(normalized, pattern.interval);

      // Set to the target month
      nextYear = new Date(nextYear.getFullYear(), pattern.monthOfYear - 1, 1);

      // Handle Feb 29 on non-leap years
      if (pattern.monthOfYear === 2 && pattern.dayOfMonth === 29) {
        if (!isLeapYear(nextYear)) {
          return setDate(nextYear, 28);
        }
      }

      const daysInMonth = getDaysInMonth(nextYear);
      const targetDay = Math.min(pattern.dayOfMonth, daysInMonth);
      return setDate(nextYear, targetDay);
    }

    case 'custom':
      // Custom patterns are not yet implemented
      return null;

    default:
      return null;
  }
}

/**
 * Generate recurring task instances within a date range
 *
 * Creates virtual task instances for each occurrence of a recurring task within the specified
 * date range. Each instance inherits properties from the parent task but has its own unique
 * ID, instance date, and scheduled date.
 *
 * @param task - The parent recurring task with recurrence pattern
 * @param rangeStart - Start of date range to generate instances (inclusive)
 * @param rangeEnd - End of date range to generate instances (inclusive)
 * @returns Array of task instances, one for each occurrence in the range
 *
 * @remarks
 * - Returns empty array if task has no recurrence pattern or scheduled date
 * - Returns empty array if range is entirely before task's scheduled date
 * - Respects exception dates (skips instances on those dates)
 * - Respects end conditions (never, date, occurrences)
 * - Instance IDs use format: `${parentId}_${YYYY-MM-DD}`
 * - Instances have `isRecurringInstance: true` and `recurrence: null`
 * - Instances inherit title, description, priority, category from parent
 *
 * @example
 * ```ts
 * const dailyTask = {
 *   id: 'task-1',
 *   scheduledDate: new Date(2026, 1, 1),
 *   recurrence: {
 *     type: 'daily',
 *     interval: 1,
 *     endCondition: { type: 'never', endDate: null, maxOccurrences: null },
 *     exceptions: []
 *   },
 *   // ... other task properties
 * };
 *
 * const instances = generateRecurringInstances(
 *   dailyTask,
 *   new Date(2026, 1, 1),
 *   new Date(2026, 1, 7)
 * );
 * // Returns 7 instances (Feb 1-7, 2026)
 * // instances[0].id === 'task-1_2026-02-01'
 * // instances[0].isRecurringInstance === true
 * ```
 */
export function generateRecurringInstances(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date
): Task[] {
  // Return empty array if task has no recurrence pattern
  if (!task.recurrence) {
    return [];
  }

  // Return empty array if task has no scheduled date
  if (!task.scheduledDate) {
    return [];
  }

  const pattern = task.recurrence;

  // Validate pattern configuration
  if (pattern.interval <= 0) {
    console.warn(`Invalid interval ${pattern.interval} for task ${task.id}. Interval must be > 0.`);
    return [];
  }

  if (pattern.type === 'weekly' && (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0)) {
    console.warn(`Weekly recurrence requires at least one day of week for task ${task.id}.`);
    return [];
  }

  if (pattern.type === 'monthly' && (pattern.dayOfMonth === null || pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
    console.warn(`Monthly recurrence requires valid dayOfMonth (1-31) for task ${task.id}.`);
    return [];
  }

  if (pattern.type === 'yearly') {
    if (pattern.monthOfYear === null || pattern.monthOfYear < 1 || pattern.monthOfYear > 12) {
      console.warn(`Yearly recurrence requires valid monthOfYear (1-12) for task ${task.id}.`);
      return [];
    }
    if (pattern.dayOfMonth === null || pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
      console.warn(`Yearly recurrence requires valid dayOfMonth (1-31) for task ${task.id}.`);
      return [];
    }
  }

  const instances: Task[] = [];
  const normalizedRangeStart = startOfDay(rangeStart);
  const normalizedRangeEnd = startOfDay(rangeEnd);

  // Use consistent date conversion to avoid timezone issues
  // normalizeToDateString handles both Date objects and Redux-serialized ISO strings
  const taskStartDateString = normalizeToDateString(task.scheduledDate);
  if (!taskStartDateString) {
    return [];
  }
  const taskStartDate = toDateObject(taskStartDateString);

  // Create Set for O(1) exception lookup using normalized date strings
  // This ensures consistent comparison regardless of how dates are serialized
  const exceptionDates = new Set(
    pattern.exceptions.map((d) => normalizeToDateString(d)).filter(Boolean)
  );

  // Get instance modifications map for O(1) lookup
  const instanceModifications: Record<string, InstanceModification> = pattern.instanceModifications || {};

  // If range is before task start date, return empty
  if (isAfter(taskStartDate, normalizedRangeEnd)) {
    return [];
  }

  // For occurrence-based end conditions, we need to count occurrences from the start
  // Calculate how many occurrences have happened before rangeStart
  let occurrenceCount = 0;
  if (pattern.endCondition.type === 'occurrences' && isBefore(taskStartDate, normalizedRangeStart)) {
    // For daily recurrence, count from task start to rangeStart (exclusive)
    let countDate = taskStartDate;

    // For weekly recurrence, find the first valid day
    if (pattern.type === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      const dayOfWeek = getDay(countDate);
      if (!pattern.daysOfWeek.includes(dayOfWeek)) {
        const next = getNextOccurrence(pattern, countDate);
        if (next) {
          countDate = next;
        }
      }
    }

    while (isBefore(countDate, normalizedRangeStart)) {
      const dateKey = format(countDate, 'yyyy-MM-dd');
      if (!exceptionDates.has(dateKey)) {
        occurrenceCount++;
      }
      // Check if we've already reached the max occurrences
      if (pattern.endCondition.maxOccurrences && occurrenceCount >= pattern.endCondition.maxOccurrences) {
        return []; // Already exceeded max occurrences before range start
      }
      const next = getNextOccurrence(pattern, countDate);
      if (!next) break;
      countDate = next;
    }
  }

  // Start from the task's scheduled date or range start, whichever is later
  let currentDate = isBefore(taskStartDate, normalizedRangeStart)
    ? normalizedRangeStart
    : taskStartDate;

  // For weekly recurrence, we need to find the first occurrence on or after currentDate
  if (pattern.type === 'weekly') {
    // If currentDate is after taskStartDate, we need to find the next valid day
    if (isAfter(currentDate, taskStartDate)) {
      let candidate = currentDate;
      let found = false;

      // Look ahead up to 7 * interval days to find the first occurrence
      for (let i = 0; i < 7 * pattern.interval; i++) {
        const dayOfWeek = getDay(candidate);
        if (pattern.daysOfWeek.includes(dayOfWeek)) {
          currentDate = candidate;
          found = true;
          break;
        }
        candidate = addDays(candidate, 1);
      }

      if (!found) {
        // If still not found, get next occurrence from task start
        const next = getNextOccurrence(pattern, taskStartDate);
        if (next) {
          currentDate = next;
        }
      }
    } else {
      // Starting from task start, find first valid day
      const dayOfWeek = getDay(currentDate);
      if (!pattern.daysOfWeek.includes(dayOfWeek)) {
        const next = getNextOccurrence(pattern, currentDate);
        if (next) {
          currentDate = next;
        }
      }
    }
  } else {
    // For non-weekly patterns, if we're starting from rangeStart (not task start),
    // we need to find the first occurrence on or after rangeStart
    if (isBefore(taskStartDate, currentDate)) {
      // Calculate how many intervals have passed
      let candidate = taskStartDate;
      while (isBefore(candidate, currentDate)) {
        const next = getNextOccurrence(pattern, candidate);
        if (!next) break;
        candidate = next;
      }
      currentDate = candidate;
    }
  }

  // Generate instances
  while (
    !isAfter(currentDate, normalizedRangeEnd) &&
    !hasReachedEndCondition(pattern.endCondition, occurrenceCount, currentDate) &&
    instances.length < MAX_RECURRING_INSTANCES
  ) {
    // Skip if date is in exceptions
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    if (!exceptionDates.has(dateKey)) {
      // Create instance
      // Note: priority.number is set to 0 to indicate it needs auto-numbering
      // The selector will assign the actual number based on existing tasks for that day
      const dateString = format(currentDate, 'yyyy-MM-dd');

      // Check for instance-specific modifications
      const modification = instanceModifications[dateString];

      const instance: Task = {
        ...task,
        id: `${task.id}_${dateString}`,
        scheduledDate: new Date(currentDate),
        instanceDate: new Date(currentDate),
        isRecurringInstance: true,
        recurringParentId: task.id,
        recurrence: null, // Instances don't have their own recurrence
        priority: {
          letter: task.priority.letter,
          number: 0, // Will be auto-assigned based on that day's tasks
        },
        // Apply instance-specific modifications if they exist
        ...(modification?.status && { status: modification.status }),
        ...(modification?.title && { title: modification.title }),
        ...(modification?.description && { description: modification.description }),
      };

      instances.push(instance);
      occurrenceCount++;
    }

    // Get next occurrence
    const next = getNextOccurrence(pattern, currentDate);
    if (!next) break;
    currentDate = next;
  }

  // Warn if we hit the safety limit
  if (instances.length >= MAX_RECURRING_INSTANCES) {
    console.warn(
      `Reached maximum recurring instances limit (${MAX_RECURRING_INSTANCES}) for task ${task.id}. ` +
        `This may indicate an issue with the recurrence pattern or date range.`
    );
  }

  return instances;
}
