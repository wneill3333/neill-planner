/**
 * Note Type Definitions for Neill Planner
 *
 * Notes support rich text formatting and can be linked to tasks and events.
 * Notes are date-specific and appear in the Daily View.
 */

// =============================================================================
// Attachment Types
// =============================================================================

/**
 * Metadata for a file attached to a note
 */
export interface NoteAttachment {
  /** Unique identifier for this attachment */
  id: string;
  /** Original file name */
  fileName: string;
  /** MIME type (e.g., 'image/jpeg', 'application/pdf') */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Firebase Storage path */
  storagePath: string;
  /** Public download URL */
  downloadUrl: string;
  /** Thumbnail URL (same as downloadUrl for images, null for PDFs) */
  thumbnailUrl: string | null;
  /** Upload timestamp */
  uploadedAt: Date;
}

/**
 * Attachment size and type limits
 */
export const ATTACHMENT_LIMITS = {
  /** Maximum file size per attachment (10MB) */
  maxFileSizeBytes: 10 * 1024 * 1024,
  /** Maximum total size per note (50MB) */
  maxTotalSizeBytes: 50 * 1024 * 1024,
  /** Maximum number of attachments per note */
  maxAttachments: 20,
  /** Allowed MIME types */
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'application/pdf',
  ] as const,
} as const;

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
  attachments: [],
  deletedAt: null,
} as const;

/**
 * Notes grouped by date (ISO date string as key)
 */
export type NotesByDate = Record<string, Note[]>;
