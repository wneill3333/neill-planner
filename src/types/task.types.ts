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
export type TaskStatus = 'in_progress' | 'forward' | 'complete' | 'delete' | 'delegate';

/**
 * Visual symbols for each task status
 */
export const TaskStatusSymbols: Record<TaskStatus, string> = {
  in_progress: '●',
  forward: '➜',
  complete: '✔',
  delete: '✘',
  delegate: '◯',
} as const;

/**
 * Human-readable labels for task statuses
 */
export const TaskStatusLabels: Record<TaskStatus, string> = {
  in_progress: 'In Progress',
  forward: 'Forward',
  complete: 'Complete',
  delete: 'Delete',
  delegate: 'Delegate',
} as const;

// =============================================================================
// Recurrence Types
// =============================================================================

/**
 * Type of recurrence pattern
 */
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

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
 * Complete recurrence pattern definition
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
  /** When the recurrence ends */
  endCondition: RecurrenceEndCondition;
  /** Specific dates to skip (exceptions) */
  exceptions: Date[];
}

// =============================================================================
// Task Interface
// =============================================================================

/**
 * Complete Task entity
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
  /** Scheduled time in HH:MM format (null = no specific time) */
  scheduledTime: string | null;
  /** Recurrence pattern (null = non-recurring) */
  recurrence: RecurrencePattern | null;
  /** Array of linked note IDs */
  linkedNoteIds: string[];
  /** Linked event ID (optional) */
  linkedEventId: string | null;
  /** Whether this is a generated instance of a recurring task */
  isRecurringInstance: boolean;
  /** Reference to parent recurring task */
  recurringParentId: string | null;
  /** Date this instance represents (for recurring instances) */
  instanceDate: Date | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: Date | null;
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
  scheduledTime?: string | null;
  recurrence?: RecurrencePattern | null;
  linkedNoteIds?: string[];
  linkedEventId?: string | null;
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
  scheduledTime?: string | null;
  recurrence?: RecurrencePattern | null;
  linkedNoteIds?: string[];
  linkedEventId?: string | null;
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
  scheduledTime: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedEventId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  deletedAt: null,
} as const;

/**
 * Priority letter display colors (for UI)
 */
export const PRIORITY_COLORS: Record<PriorityLetter, string> = {
  A: '#EF4444', // Red
  B: '#F97316', // Orange
  C: '#EAB308', // Yellow
  D: '#9CA3AF', // Gray
} as const;
