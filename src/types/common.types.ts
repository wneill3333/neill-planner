/**
 * Common Type Definitions for Neill Planner
 *
 * Shared types used across multiple modules.
 */

// =============================================================================
// Sync Types
// =============================================================================

/**
 * Sync status for items
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

/**
 * Sync status display information
 */
export const SYNC_STATUS_INFO: Record<SyncStatus, { icon: string; label: string; color: string }> =
  {
    synced: { icon: '✓', label: 'Synced', color: '#22C55E' }, // Green
    syncing: { icon: '↻', label: 'Syncing', color: '#3B82F6' }, // Blue
    pending: { icon: '●', label: 'Pending', color: '#EAB308' }, // Yellow
    offline: { icon: '○', label: 'Offline', color: '#9CA3AF' }, // Gray
    error: { icon: '⚠', label: 'Error', color: '#EF4444' }, // Red
  } as const;

/**
 * Sync queue item for offline changes
 */
export interface SyncQueueItem {
  /** Unique identifier */
  id: string;
  /** Type of operation */
  operation: 'create' | 'update' | 'delete';
  /** Collection name */
  collection: 'tasks' | 'events' | 'notes' | 'categories';
  /** Document ID being modified */
  documentId: string;
  /** Data payload */
  data: unknown;
  /** Timestamp when queued */
  timestamp: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Current status */
  status: 'pending' | 'syncing' | 'failed';
}

// =============================================================================
// Date/Time Types
// =============================================================================

/**
 * Date range for queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Time string in HH:MM format
 */
export type TimeString = string;

/**
 * ISO date string (YYYY-MM-DD)
 */
export type ISODateString = string;

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// Filter & Sort Types
// =============================================================================

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic sort option
 */
export interface SortOption<T extends string> {
  field: T;
  direction: SortDirection;
}

/**
 * Task sort fields
 */
export type TaskSortField = 'priority' | 'scheduledDate' | 'createdAt' | 'title';

/**
 * Event sort fields
 */
export type EventSortField = 'startTime' | 'createdAt' | 'title';

/**
 * Note sort fields
 */
export type NoteSortField = 'date' | 'createdAt' | 'title';

// =============================================================================
// UI State Types
// =============================================================================

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: unknown;
}

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// =============================================================================
// Conflict Resolution Types
// =============================================================================

/**
 * Conflict resolution choice
 */
export type ConflictChoice = 'local' | 'server' | 'merge';

/**
 * Conflict resolution record
 */
export interface ConflictResolution {
  localVersion: unknown;
  serverVersion: unknown;
  userChoice: ConflictChoice;
  mergedVersion?: unknown;
  timestamp: number;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// ID Types (for type safety)
// =============================================================================

/**
 * Branded types for IDs to prevent mixing different ID types
 */
export type TaskId = string & { readonly __brand: 'TaskId' };
export type EventId = string & { readonly __brand: 'EventId' };
export type NoteId = string & { readonly __brand: 'NoteId' };
export type CategoryId = string & { readonly __brand: 'CategoryId' };
export type UserId = string & { readonly __brand: 'UserId' };

/**
 * Helper to create branded IDs (for use in factories/services)
 */
export const createTaskId = (id: string): TaskId => id as TaskId;
export const createEventId = (id: string): EventId => id as EventId;
export const createNoteId = (id: string): NoteId => id as NoteId;
export const createCategoryId = (id: string): CategoryId => id as CategoryId;
export const createUserId = (id: string): UserId => id as UserId;
