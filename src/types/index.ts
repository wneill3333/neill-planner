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
  RecurrencePattern,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
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
  UNCATEGORIZED_CATEGORY,
  DEFAULT_CATEGORY_VALUES,
} from './category.types';

// =============================================================================
// Note Types
// =============================================================================
export type { Note, CreateNoteInput, UpdateNoteInput, NotesByDate } from './note.types';

export { DEFAULT_NOTE_VALUES } from './note.types';

// =============================================================================
// User Types
// =============================================================================
export type {
  UserRole,
  User,
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
  ConflictChoice,
  ConflictResolution,
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
