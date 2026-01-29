/**
 * Note Type Definitions for Neill Planner
 *
 * Notes support rich text formatting and can be linked to tasks and events.
 * Notes are date-specific and appear in the Daily View.
 */

// =============================================================================
// Note Interface
// =============================================================================

/**
 * Complete Note entity
 */
export interface Note {
  /** Unique identifier (auto-generated UUID) */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Note title */
  title: string;
  /** Note content (rich text - HTML or Markdown) */
  content: string;
  /** Date this note is associated with */
  date: Date;
  /** Reference to category (null = uncategorized) */
  categoryId: string | null;
  /** Array of linked task IDs */
  linkedTaskIds: string[];
  /** Array of linked event IDs */
  linkedEventIds: string[];
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
 * Input for creating a new note
 */
export interface CreateNoteInput {
  title: string;
  content?: string;
  date: Date;
  categoryId?: string | null;
  linkedTaskIds?: string[];
  linkedEventIds?: string[];
}

/**
 * Input for updating an existing note
 */
export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  date?: Date;
  categoryId?: string | null;
  linkedTaskIds?: string[];
  linkedEventIds?: string[];
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Default values for new notes
 */
export const DEFAULT_NOTE_VALUES: Partial<Note> = {
  content: '',
  categoryId: null,
  linkedTaskIds: [],
  linkedEventIds: [],
  deletedAt: null,
} as const;

/**
 * Notes grouped by date (ISO date string as key)
 */
export type NotesByDate = Record<string, Note[]>;
