/**
 * Event Type Definitions for Neill Planner
 *
 * Events are time-blocked calendar entries with start/end times.
 * Supports Google Calendar sync and confidential events.
 */

import type { RecurrencePattern } from './task.types';

// =============================================================================
// Event Interface
// =============================================================================

/**
 * Complete Event entity
 */
export interface Event {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Event title (required) */
  title: string;
  /** Event description (optional) */
  description: string;
  /** Reference to category (null = uncategorized) */
  categoryId: string | null;
  /** Event start time (required) */
  startTime: Date;
  /** Event end time (required) */
  endTime: Date;
  /** Event location (optional) */
  location: string;
  /** Whether event is confidential (hidden from shared calendars) */
  isConfidential: boolean;
  /** Alternate title shown in Google Calendar when confidential */
  alternateTitle: string | null;
  /** Recurrence pattern (null = non-recurring) */
  recurrence: RecurrencePattern | null;
  /** Array of linked note IDs */
  linkedNoteIds: string[];
  /** Array of linked task IDs */
  linkedTaskIds: string[];
  /** Google Calendar event ID (for sync) */
  googleCalendarId: string | null;
  /** Whether this is a generated instance of a recurring event */
  isRecurringInstance: boolean;
  /** Reference to parent recurring event */
  recurringParentId: string | null;
  /** Date this instance represents (for recurring instances) */
  instanceDate: Date | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: Date | null;
  /** Array of reminder IDs associated with this event */
  reminderIds: string[];
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a new event
 * Omits auto-generated fields
 */
export interface CreateEventInput {
  title: string;
  description?: string;
  categoryId?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string;
  isConfidential?: boolean;
  alternateTitle?: string | null;
  recurrence?: RecurrencePattern | null;
  linkedNoteIds?: string[];
  linkedTaskIds?: string[];
  /** Array of reminder IDs associated with this event */
  reminderIds?: string[];
}

/**
 * Input for updating an existing event
 * All fields optional except id
 */
export interface UpdateEventInput {
  id: string;
  title?: string;
  description?: string;
  categoryId?: string | null;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isConfidential?: boolean;
  alternateTitle?: string | null;
  recurrence?: RecurrencePattern | null;
  linkedNoteIds?: string[];
  linkedTaskIds?: string[];
  /** Array of reminder IDs associated with this event */
  reminderIds?: string[];
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Default values for new events
 */
export const DEFAULT_EVENT_VALUES: Partial<Event> = {
  description: '',
  categoryId: null,
  location: '',
  isConfidential: false,
  alternateTitle: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedTaskIds: [],
  googleCalendarId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  deletedAt: null,
  reminderIds: [],
} as const;

/**
 * Event sorted by start time
 */
export type EventsByDate = Record<string, Event[]>;
