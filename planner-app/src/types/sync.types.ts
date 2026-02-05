/**
 * Sync Type Definitions for Neill Planner
 *
 * Types related to offline sync and conflict resolution.
 */

import type { ConflictChoice } from './common.types';

// Re-export ConflictChoice from common types for convenience
export type { ConflictChoice } from './common.types';

// =============================================================================
// Conflict Resolution Types
// =============================================================================

/**
 * A single conflict item representing a mismatch between local and server data
 */
export interface ConflictItem {
  /** Unique identifier for this conflict */
  id: string;
  /** The collection where the conflict occurred */
  collection: 'tasks' | 'events' | 'notes' | 'categories' | 'reminders';
  /** The local version of the data */
  localVersion: unknown;
  /** The server version of the data */
  serverVersion: unknown;
  /** Timestamp when the local version was modified */
  localTimestamp: number;
  /** Timestamp when the server version was modified */
  serverTimestamp: number;
}

/**
 * A conflict resolution decision made by the user for sync conflicts
 */
export interface SyncConflictResolution {
  /** ID of the conflict being resolved */
  conflictId: string;
  /** User's choice for resolution */
  choice: ConflictChoice;
  /** Optional merged data (if user chose 'merge') */
  resolvedData?: unknown;
}
