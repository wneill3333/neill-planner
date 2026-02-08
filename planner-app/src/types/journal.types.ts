/**
 * Journal Type Definitions for Neill Planner
 *
 * Journals are persistent topic containers where dated entries accumulate
 * in reverse chronological order. Unlike Notes (standalone, date-indexed),
 * a Journal is a long-lived container for tracking progress on a subject.
 */

import type { NoteAttachment } from './note.types';

// =============================================================================
// Journal Interface (the container)
// =============================================================================

/**
 * Complete Journal entity
 */
export interface Journal {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Journal title (e.g., "Project Alpha Progress") */
  title: string;
  /** Optional summary of the journal's purpose */
  description: string;
  /** Denormalized entry count for display */
  entryCount: number;
  /** Timestamp of the most recent entry (for sorting by activity) */
  lastEntryAt: Date | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Optional category ID */
  categoryId: string | null;
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: Date | null;
}

// =============================================================================
// Journal Entry Interface (individual dated entries)
// =============================================================================

/**
 * Complete JournalEntry entity
 */
export interface JournalEntry {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Foreign key to parent Journal */
  journalId: string;
  /** Owner user ID (for Firestore security rules) */
  userId: string;
  /** Rich text HTML content (TipTap) */
  content: string;
  /** File attachments */
  attachments: NoteAttachment[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete timestamp (null = not deleted) */
  deletedAt: Date | null;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a new journal
 */
export interface CreateJournalInput {
  title: string;
  description?: string;
  categoryId?: string | null;
}

/**
 * Input for updating an existing journal
 */
export interface UpdateJournalInput {
  id: string;
  title?: string;
  description?: string;
  categoryId?: string | null;
}

/**
 * Input for creating a new journal entry
 */
export interface CreateJournalEntryInput {
  journalId: string;
  content?: string;
}

/**
 * Input for updating an existing journal entry
 */
export interface UpdateJournalEntryInput {
  id: string;
  journalId: string;
  content?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Default values for new journals
 */
export const DEFAULT_JOURNAL_VALUES: Partial<Journal> = {
  description: '',
  categoryId: null,
  entryCount: 0,
  lastEntryAt: null,
  deletedAt: null,
} as const;

/**
 * Default values for new journal entries
 */
export const DEFAULT_JOURNAL_ENTRY_VALUES: Partial<JournalEntry> = {
  content: '',
  attachments: [],
  deletedAt: null,
} as const;
