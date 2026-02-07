/**
 * Task Type Definitions for Neill Planner
 *
 * Based on Franklin-Covey methodology with A-B-C-D priority system.
 */

// =============================================================================
// Priority Types
// =============================================================================

/**
 * Priority letter indicating urgency/importance level
 * A = Vital (must do today, serious consequences if not)
 * B = Important (should do today, mild consequences if not)
 * C = Optional (nice to do, no consequences if not)
 * D = Delegate (can be assigned to others or deferred)
 */
export type PriorityLetter = 'A' | 'B' | 'C' | 'D';

/**
 * Array of all priority letters in order
 * Useful for iteration and mapping operations
 */
export const PRIORITY_LETTERS: readonly PriorityLetter[] = ['A', 'B', 'C', 'D'] as const;

/**
 * Task priority combining letter and number (e.g., A1, A2, B1)
 */
export interface TaskPriority {
  letter: PriorityLetter;
  number: number;
}

// =============================================================================
// Status Types
// =============================================================================

/**
 * Task status representing current state
 */
export type TaskStatus = 'in_progress' | 'forward' | 'complete' | 'cancelled' | 'delegate';

/**
 * Visual symbols for each task status
 */
export const TaskStatusSymbols: Record<TaskStatus, string> = {
  in_progress: '●',
  forward: '➜',
  complete: '✔',
  cancelled: '✘',
  delegate: '◯',
} as const;

/**
 * Human-readable labels for task statuses
 */
export const TaskStatusLabels: Record<TaskStatus, string> = {
  in_progress: 'In Progress',
  forward: 'Forward',
  complete: 'Complete',
  cancelled: 'Cancelled',
  delegate: 'Delegate',
} as const;

// =============================================================================
// Recurrence Types
// =============================================================================

/**
 * Type of recurrence pattern
 * - daily: Every N days
 * - weekly: Every N weeks on specific days
 * - monthly: Every N months on a specific day
 * - yearly: Every N years on a specific date
 * - afterCompletion: N days/weeks after task completion (for tasks like "haircut", "change air filter")
 * @deprecated 'custom' is deprecated in favor of specific pattern types
 */
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'afterCompletion' | 'custom';

/**
 * How the recurrence ends
 */
export type RecurrenceEndType = 'never' | 'date' | 'occurrences';

/**
 * End condition for recurring tasks
 */
export interface RecurrenceEndCondition {
  type: RecurrenceEndType;
  endDate: Date | null;
  maxOccurrences: number | null;
}

/**
 * Instance-specific modifications for a recurring task
 * Keyed by ISO date string (YYYY-MM-DD)
 * @deprecated This interface is deprecated in the new materialized instances system
 */
export interface InstanceModification {
  /** Override status for this specific instance */
  status?: TaskStatus;
  /** Override title for this specific instance */
  title?: string;
  /** Override description for this specific instance */
  description?: string;
}

/**
 * Nth weekday specification for monthly recurrence
 * e.g., { n: 2, weekday: 2 } = 2nd Tuesday
 * e.g., { n: -1, weekday: 5 } = Last Friday
 */
export interface NthWeekday {
  /** Which occurrence (1-5 for first through fifth, -1 for last) */
  n: number;
  /** Day of week (0=Sun, 1=Mon, ..., 6=Sat) */
  weekday: number;
}

/**
 * @deprecated Use RecurringPattern (the new standalone document) instead
 * Legacy recurrence pattern embedded in Task documents
 */
export interface RecurrencePattern {
  /** Type of recurrence */
  type: RecurrenceType;
  /** Interval between occurrences (e.g., every 2 weeks) */
  interval: number;
  /** Days of week for weekly recurrence (0=Sun, 1=Mon, ..., 6=Sat) */
  daysOfWeek: number[];
  /** Day of month for monthly recurrence (1-31) */
  dayOfMonth: number | null;
  /** Month of year for yearly recurrence (1-12) */
  monthOfYear: number | null;

  // NEW recurrence capabilities (added for new UI, used when creating patterns)
  /** Nth weekday of month (e.g., { n: 2, weekday: 2 } = 2nd Tuesday) */
  nthWeekday?: NthWeekday | null;
  /** Specific dates of month (e.g., [1, 15] for 1st and 15th) */
  specificDatesOfMonth?: number[] | null;
  /** Days after completion for 'afterCompletion' type */
  daysAfterCompletion?: number | null;

  /** When the recurrence ends */
  endCondition: RecurrenceEndCondition;
  /** Specific dates to skip (exceptions) */
  exceptions: Date[];
  /** Instance-specific modifications (keyed by ISO date string YYYY-MM-DD) */
  instanceModifications?: Record<string, InstanceModification>;
}

// =============================================================================
// NEW Recurring Pattern Type (Standalone Document)
// =============================================================================

/**
 * RecurringPattern - Standalone document that defines recurrence rules
 *
 * In the new architecture, patterns are stored separately from tasks.
 * When a recurring pattern is created, real task instances are generated
 * for the next 90 days. Future instances are generated on-demand.
 *
 * @example Daily task every 2 days:
 * ```ts
 * const pattern: RecurringPattern = {
 *   id: 'pattern-1',
 *   userId: 'user-1',
 *   title: 'Take vitamins',
 *   type: 'daily',
 *   interval: 2, // every 2 days
 *   startDate: new Date(),
 *   endCondition: { type: 'never', endDate: null, maxOccurrences: null },
 *   generatedUntil: new Date('2026-05-05'), // 90 days out
 *   ...
 * };
 * ```
 *
 * @example Completion-based recurrence (e.g., haircut every 6 weeks):
 * ```ts
 * const pattern: RecurringPattern = {
 *   type: 'afterCompletion',
 *   daysAfterCompletion: 42, // 6 weeks
 *   activeInstanceId: 'task-123', // current active instance
 *   ...
 * };
 * ```
 */
export interface RecurringPattern {
  /** Unique identifier for the pattern */
  id: string;
  /** Owner user ID */
  userId: string;

  // =========================================================================
  // Template properties (inherited by generated instances)
  // =========================================================================

  /** Task title template */
  title: string;
  /** Task description template */
  description: string;
  /** Category ID for generated tasks */
  categoryId: string | null;
  /** Priority for generated tasks */
  priority: TaskPriority;

  // =========================================================================
  // Optional scheduling for calendar integration
  // =========================================================================

  /** Start time for the task (24hr format, e.g., "09:00") */
  startTime: string | null;
  /** Duration in minutes */
  duration: number | null;

  // =========================================================================
  // Recurrence configuration
  // =========================================================================

  /** Type of recurrence */
  type: RecurrenceType;
  /** Interval between occurrences (days/weeks/months depending on type) */
  interval: number;
  /** Days of week for weekly recurrence (0=Sun, 1=Mon, ..., 6=Sat) */
  daysOfWeek: number[];
  /** Day of month for monthly recurrence (1-31) */
  dayOfMonth: number | null;
  /** Month of year for yearly recurrence (1-12) */
  monthOfYear: number | null;

  // =========================================================================
  // NEW recurrence capabilities
  // =========================================================================

  /** Nth weekday of month (e.g., { n: 2, weekday: 2 } = 2nd Tuesday, { n: -1, weekday: 5 } = last Friday) */
  nthWeekday: NthWeekday | null;
  /** Specific dates of month (e.g., [1, 15] for 1st and 15th) */
  specificDatesOfMonth: number[] | null;
  /** Days after completion for 'afterCompletion' type */
  daysAfterCompletion: number | null;

  // =========================================================================
  // End condition
  // =========================================================================

  /** When the recurrence ends */
  endCondition: RecurrenceEndCondition;

  // =========================================================================
  // Instance tracking
  // =========================================================================

  /** When the pattern starts generating instances */
  startDate: Date;
  /** Last date instances have been generated to (for on-demand generation) */
  generatedUntil: Date;
  /** For 'afterCompletion' type: the current active instance ID */
  activeInstanceId: string | null;

  // =========================================================================
  // Metadata
  // =========================================================================

  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: Date | null;
}

// =============================================================================
// Task Interface
// =============================================================================

/**
 * Complete Task entity
 *
 * In the new recurring task architecture, each task is either:
 * 1. A standalone non-recurring task (recurringPatternId = null)
 * 2. An instance generated from a RecurringPattern (recurringPatternId = pattern ID)
 *
 * When generated from a pattern, tasks are fully materialized documents.
 * They can be edited independently without affecting other instances.
 */
export interface Task {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Task title (required, max 500 chars) */
  title: string;
  /** Task description (optional, max 5000 chars) */
  description: string;
  /** Reference to category (null = uncategorized) */
  categoryId: string | null;
  /** Priority with letter and number */
  priority: TaskPriority;
  /** Current status */
  status: TaskStatus;
  /** Scheduled date (null = unscheduled) */
  scheduledDate: Date | null;

  // =========================================================================
  // NEW: Optional scheduling for calendar integration
  // =========================================================================

  /** Start time for the task (24hr format, e.g., "09:00") */
  startTime: string | null;
  /** End time for the task (24hr format, e.g., "10:30") */
  endTime: string | null;
  /** Duration in minutes (can be calculated from start/end or set explicitly) */
  duration: number | null;
  /** If true + has startTime, task shows on calendar */
  showOnCalendar: boolean;

  // =========================================================================
  // NEW: Reference to recurring pattern (replaces old recurrence field)
  // =========================================================================

  /** Reference to RecurringPattern document (null = non-recurring) */
  recurringPatternId: string | null;

  // =========================================================================
  // LEGACY: Old recurrence fields (deprecated, kept for migration)
  // =========================================================================

  /** @deprecated Use recurringPatternId instead. Embedded recurrence pattern (null = non-recurring) */
  recurrence: RecurrencePattern | null;
  /** @deprecated No longer used. Old flag for virtual instances. */
  isRecurringInstance: boolean;
  /** @deprecated Use recurringPatternId instead. Reference to parent recurring task */
  recurringParentId: string | null;
  /** @deprecated No longer used. Date this instance represents (for recurring instances) */
  instanceDate: Date | null;
  /** @deprecated Replaced by startTime. Scheduled time in HH:MM format */
  scheduledTime: string | null;

  // =========================================================================
  // Related items
  // =========================================================================

  /** Array of linked note IDs */
  linkedNoteIds: string[];
  /** Linked event ID (optional) */
  linkedEventId: string | null;
  /** Array of reminder IDs associated with this task */
  reminderIds: string[];

  // =========================================================================
  // Timestamps
  // =========================================================================

  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: Date | null;
  /** Completion timestamp (for 'afterCompletion' patterns) */
  completedAt: Date | null;
}

// =============================================================================
// Input Types (for creating/updating tasks)
// =============================================================================

/**
 * Input for creating a new task
 * Omits auto-generated fields
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  categoryId?: string | null;
  priority: {
    letter: PriorityLetter;
    number?: number; // Auto-assigned if not provided
  };
  status?: TaskStatus;
  scheduledDate?: Date | null;

  // NEW: Optional scheduling for calendar integration
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
  showOnCalendar?: boolean;

  // NEW: Reference to recurring pattern
  recurringPatternId?: string | null;

  // LEGACY: Old recurrence fields (deprecated, kept for migration)
  /** @deprecated Use recurringPatternId instead */
  recurrence?: RecurrencePattern | null;
  /** @deprecated No longer used */
  isRecurringInstance?: boolean;
  /** @deprecated Use recurringPatternId instead */
  recurringParentId?: string | null;
  /** @deprecated No longer used */
  instanceDate?: Date | null;
  /** @deprecated Replaced by startTime */
  scheduledTime?: string | null;

  linkedNoteIds?: string[];
  linkedEventId?: string | null;
  reminderIds?: string[];
}

/**
 * Input for updating an existing task
 * All fields optional except id
 */
export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  categoryId?: string | null;
  priority?: Partial<TaskPriority>;
  status?: TaskStatus;
  scheduledDate?: Date | null;

  // NEW: Optional scheduling for calendar integration
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
  showOnCalendar?: boolean;

  // NEW: Reference to recurring pattern
  recurringPatternId?: string | null;

  // LEGACY: Old recurrence fields (deprecated, kept for migration)
  /** @deprecated Use recurringPatternId instead */
  recurrence?: RecurrencePattern | null;
  /** @deprecated Replaced by startTime */
  scheduledTime?: string | null;

  linkedNoteIds?: string[];
  linkedEventId?: string | null;
  reminderIds?: string[];

  /** Completion timestamp (for 'afterCompletion' patterns) */
  completedAt?: Date | null;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Task grouped by priority letter
 */
export type TasksByPriority = Record<PriorityLetter, Task[]>;

/**
 * Default values for new tasks
 */
export const DEFAULT_TASK_VALUES: Partial<Task> = {
  description: '',
  categoryId: null,
  status: 'in_progress',
  linkedNoteIds: [],
  linkedEventId: null,
  deletedAt: null,
  reminderIds: [],
  // NEW: Calendar scheduling defaults
  startTime: null,
  endTime: null,
  duration: null,
  showOnCalendar: false,
  // NEW: Recurring pattern reference
  recurringPatternId: null,
  completedAt: null,
  // LEGACY: Keep for backward compatibility during migration
  recurrence: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  scheduledTime: null,
} as const;

// =============================================================================
// Input Types for RecurringPattern
// =============================================================================

/**
 * Input for creating a new recurring pattern
 * Creates the pattern and generates instances for the next 90 days
 */
export interface CreateRecurringPatternInput {
  // Template properties
  title: string;
  description?: string;
  categoryId?: string | null;
  priority: {
    letter: PriorityLetter;
    number?: number;
  };

  // Optional scheduling
  startTime?: string | null;
  duration?: number | null;

  // Recurrence configuration
  type: RecurrenceType;
  interval?: number; // defaults to 1
  daysOfWeek?: number[]; // for weekly
  dayOfMonth?: number | null; // for monthly
  monthOfYear?: number | null; // for yearly
  nthWeekday?: NthWeekday | null; // for nth weekday of month
  specificDatesOfMonth?: number[] | null; // for specific dates
  daysAfterCompletion?: number | null; // for afterCompletion type

  // End condition
  endCondition?: RecurrenceEndCondition;

  // Start date (defaults to today)
  startDate?: Date;
}

/**
 * Input for updating a recurring pattern
 * May optionally regenerate future instances
 */
export interface UpdateRecurringPatternInput {
  id: string;

  // Template properties (optional updates)
  title?: string;
  description?: string;
  categoryId?: string | null;
  priority?: Partial<TaskPriority>;

  // Optional scheduling
  startTime?: string | null;
  duration?: number | null;

  // Recurrence configuration (optional updates)
  type?: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
  nthWeekday?: NthWeekday | null;
  specificDatesOfMonth?: number[] | null;
  daysAfterCompletion?: number | null;

  // End condition
  endCondition?: RecurrenceEndCondition;

  // If true, regenerate all future instances with updated properties
  regenerateFutureInstances?: boolean;
}

// Note: PRIORITY_COLORS is defined in utils/taskUtils.ts to keep UI constants separate from types
