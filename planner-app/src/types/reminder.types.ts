/**
 * Reminder Type Definitions for Neill Planner
 *
 * Supports personal reminders for tasks and events with push, email, and in-app
 * notification types. Includes snooze functionality and multi-device support.
 */

// =============================================================================
// Reminder Types
// =============================================================================

/**
 * Type of notification delivery method
 */
export type ReminderType = 'push' | 'email' | 'inApp';

/**
 * Available snooze duration options in minutes
 * - 5 minutes
 * - 15 minutes
 * - 30 minutes
 * - 60 minutes (1 hour)
 */
export type SnoozeOption = 5 | 15 | 30 | 60;

/**
 * All available snooze options as an array
 */
export const SNOOZE_OPTIONS: readonly SnoozeOption[] = [5, 15, 30, 60] as const;

/**
 * Human-readable labels for snooze options
 */
export const SNOOZE_OPTION_LABELS: Record<SnoozeOption, string> = {
  5: '5 minutes',
  15: '15 minutes',
  30: '30 minutes',
  60: '1 hour',
} as const;

/**
 * Status of a reminder
 */
export type ReminderStatus = 'pending' | 'triggered' | 'dismissed' | 'snoozed';

// =============================================================================
// Reminder Interface
// =============================================================================

/**
 * Complete Reminder entity
 *
 * Reminders are personal to the creator and trigger based on the associated
 * task or event's scheduled time minus the minutesBefore offset.
 */
export interface Reminder {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Owner user ID (personal to creator) */
  userId: string;
  /** Associated task ID (mutually exclusive with eventId) */
  taskId: string | null;
  /** Associated event ID (mutually exclusive with taskId) */
  eventId: string | null;
  /** Notification delivery type */
  type: ReminderType;
  /** Minutes before the scheduled time to trigger reminder */
  minutesBefore: number;
  /** Current status of the reminder */
  status: ReminderStatus;
  /** Scheduled trigger time (calculated from task/event time minus minutesBefore) */
  scheduledTime: Date;
  /** Time when the reminder was actually triggered (if triggered) */
  triggeredAt: Date | null;
  /** Time when the reminder was dismissed (if dismissed) */
  dismissedAt: Date | null;
  /** If snoozed, the new scheduled time */
  snoozedUntil: Date | null;
  /** Number of times this reminder has been snoozed */
  snoozeCount: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a new reminder
 * Either taskId or eventId must be provided, but not both
 */
export interface CreateReminderInput {
  /** Associated task ID (mutually exclusive with eventId) */
  taskId?: string | null;
  /** Associated event ID (mutually exclusive with taskId) */
  eventId?: string | null;
  /** Notification delivery type */
  type: ReminderType;
  /** Minutes before the scheduled time to trigger reminder */
  minutesBefore: number;
  /** Scheduled trigger time (optional - will be calculated if not provided) */
  scheduledTime?: Date;
}

/**
 * Input for updating an existing reminder
 */
export interface UpdateReminderInput {
  id: string;
  type?: ReminderType;
  minutesBefore?: number;
  status?: ReminderStatus;
  scheduledTime?: Date;
  snoozedUntil?: Date | null;
}

/**
 * Input for snoozing a reminder
 */
export interface SnoozeReminderInput {
  reminderId: string;
  snoozeMinutes: SnoozeOption;
}

// =============================================================================
// Notification Types
// =============================================================================

/**
 * Notification to be displayed to the user
 * Used for both push notifications and in-app banners
 */
export interface ReminderNotification {
  /** Reminder ID this notification is for */
  reminderId: string;
  /** Notification title (task/event title) */
  title: string;
  /** Notification body/message */
  body: string;
  /** Type of item (task or event) */
  itemType: 'task' | 'event';
  /** ID of the associated task or event */
  itemId: string;
  /** Scheduled time of the task/event */
  scheduledTime: Date;
  /** Time the notification was triggered */
  triggeredAt: Date;
  /** Whether this notification supports snooze */
  canSnooze: boolean;
  /** Whether this notification has been dismissed */
  isDismissed: boolean;
  /** Priority level for sorting/display (based on task priority or event time) */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Payload for notification permission status
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// =============================================================================
// FCM Types
// =============================================================================

/**
 * FCM device token registration
 */
export interface DeviceToken {
  /** The FCM token string */
  token: string;
  /** User ID this token belongs to */
  userId: string;
  /** Platform (web, android, ios) */
  platform: 'web' | 'android' | 'ios';
  /** Browser/device identifier */
  deviceId: string;
  /** When the token was registered */
  createdAt: Date;
  /** When the token was last refreshed */
  updatedAt: Date;
  /** Whether the token is still active */
  isActive: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Default values for new reminders
 */
export const DEFAULT_REMINDER_VALUES: Partial<Reminder> = {
  status: 'pending',
  triggeredAt: null,
  dismissedAt: null,
  snoozedUntil: null,
  snoozeCount: 0,
} as const;

/**
 * Default reminder minutes before for common scenarios
 */
export const DEFAULT_REMINDER_MINUTES: Record<string, number> = {
  task: 15, // 15 minutes before task
  event: 30, // 30 minutes before event
  allDay: 60 * 24, // 1 day before for all-day events
} as const;

/**
 * Common reminder time presets (in minutes)
 */
export const REMINDER_TIME_PRESETS: readonly { label: string; minutes: number }[] = [
  { label: 'At time of event', minutes: 0 },
  { label: '5 minutes before', minutes: 5 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 60 * 24 },
  { label: '1 week before', minutes: 60 * 24 * 7 },
] as const;

/**
 * Type labels for reminder notification methods
 */
export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  push: 'Push Notification',
  email: 'Email',
  inApp: 'In-App Banner',
} as const;

/**
 * Reminders grouped by item type
 */
export type RemindersByItem = Record<string, Reminder[]>;
