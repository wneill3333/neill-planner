/**
 * Type Definitions Index
 *
 * Central export point for all type definitions
 */

// =============================================================================
// Task Types
// =============================================================================
export type {
  PriorityLetter,
  TaskPriority,
  TaskStatus,
  RecurrenceType,
  RecurrenceEndType,
  RecurrenceEndCondition,
  InstanceModification,
  RecurrencePattern,
  NthWeekday,
  RecurringPattern,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  CreateRecurringPatternInput,
  UpdateRecurringPatternInput,
  TasksByPriority,
} from './task.types';

export {
  TaskStatusSymbols,
  TaskStatusLabels,
  DEFAULT_TASK_VALUES,
  PRIORITY_LETTERS,
} from './task.types';

// =============================================================================
// Event Types
// =============================================================================
export type { Event, CreateEventInput, UpdateEventInput, EventsByDate } from './event.types';

export { DEFAULT_EVENT_VALUES } from './event.types';

// =============================================================================
// Category Types
// =============================================================================
export type {
  CategoryColor,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './category.types';

export {
  CATEGORY_COLORS,
  CATEGORY_COLOR_NAMES,
  NONE_CATEGORY_ID,
  NONE_CATEGORY,
  // Deprecated: Use NONE_CATEGORY instead
  NONE_CATEGORY as UNCATEGORIZED_CATEGORY,
  DEFAULT_CATEGORY_VALUES,
} from './category.types';

// =============================================================================
// Note Types
// =============================================================================
export type { Note, NoteAttachment, CreateNoteInput, UpdateNoteInput, NotesByDate } from './note.types';

export { ATTACHMENT_LIMITS, DEFAULT_NOTE_VALUES } from './note.types';

// =============================================================================
// User Types
// =============================================================================
export type {
  UserRole,
  User,
  AllowedUser,
  AddAllowedUserInput,
  ThemeOption,
  FontSizeOption,
  WeekStartDay,
  PlatformType,
  NotificationSettings,
  UserSettings,
  UpdateUserInput,
  UpdateUserSettingsInput,
} from './user.types';

export {
  USER_ROLE_LABELS,
  INITIAL_ADMIN_EMAIL,
  DEFAULT_USER_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  THEME_OPTIONS,
  FONT_SIZE_OPTIONS,
  WEEK_START_OPTIONS,
} from './user.types';

// =============================================================================
// Common Types
// =============================================================================
export type {
  SyncStatus,
  SyncQueueItem,
  DateRange,
  TimeString,
  ISODateString,
  ApiResponse,
  PaginatedResponse,
  SortDirection,
  SortOption,
  TaskSortField,
  EventSortField,
  NoteSortField,
  LoadingState,
  ModalState,
  ToastType,
  Toast,
  ValidationError,
  ValidationResult,
  TaskId,
  EventId,
  NoteId,
  CategoryId,
  UserId,
} from './common.types';

export {
  SYNC_STATUS_INFO,
  createTaskId,
  createEventId,
  createNoteId,
  createCategoryId,
  createUserId,
} from './common.types';

// =============================================================================
// Reminder Types
// =============================================================================
export type {
  ReminderType,
  SnoozeOption,
  ReminderStatus,
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeReminderInput,
  ReminderNotification,
  NotificationPermissionStatus,
  DeviceToken,
  RemindersByItem,
} from './reminder.types';

export {
  SNOOZE_OPTIONS,
  SNOOZE_OPTION_LABELS,
  DEFAULT_REMINDER_VALUES,
  DEFAULT_REMINDER_MINUTES,
  REMINDER_TIME_PRESETS,
  REMINDER_TYPE_LABELS,
} from './reminder.types';

// =============================================================================
// Sync Types
// =============================================================================
export type {
  ConflictItem,
  SyncConflictResolution,
} from './sync.types';

// =============================================================================
// Google Calendar Types
// =============================================================================
export type {
  GoogleCalendarCredentials,
  GoogleCalendarEvent,
  GoogleCalendarConflictResolution,
  SyncDirection,
  SyncResult,
  ConflictInfo,
} from './googleCalendar.types';

// =============================================================================
// Google Drive Types
// =============================================================================
export type {
  GoogleDriveCredentials,
  BackupFrequency,
  BackupRetentionCount,
  BackupConfig,
  BackupData,
  BackupFileInfo,
  BackupResult,
  RestoreResult,
} from './googleDrive.types';

export {
  DEFAULT_BACKUP_CONFIG,
  BACKUP_FREQUENCY_OPTIONS,
  BACKUP_RETENTION_OPTIONS,
  BACKUP_FORMAT_VERSION,
  APP_VERSION,
  BACKUP_FOLDER_NAME,
} from './googleDrive.types';

// =============================================================================
// AI Types
// =============================================================================
export type { ParseTaskRequest, ParsedTaskData, GenerateNoteRequest, ParsedNoteData } from './ai.types';
