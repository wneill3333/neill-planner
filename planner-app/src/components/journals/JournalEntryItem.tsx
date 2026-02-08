/**
 * JournalEntryItem Component
 *
 * Displays a single journal entry with content and metadata.
 */

import { memo } from 'react';
import type { JournalEntry } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface JournalEntryItemProps {
  /** Entry to display */
  entry: JournalEntry;
  /** Handler to edit entry */
  onEdit?: (entry: JournalEntry) => void;
  /** Handler to delete entry */
  onDelete?: (entry: JournalEntry) => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format date and time for display
 */
function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalEntryItem - Display single journal entry
 *
 * Features:
 * - Rich text content display
 * - Edit and delete buttons
 * - Timestamp display
 * - Attachment count
 *
 * @example
 * ```tsx
 * <JournalEntryItem
 *   entry={entry}
 *   onEdit={handleEditEntry}
 *   onDelete={handleDeleteEntry}
 * />
 * ```
 */
export const JournalEntryItem = memo(function JournalEntryItem({
  entry,
  onEdit,
  onDelete,
  testId,
}: JournalEntryItemProps) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid={testId || 'journal-entry-item'}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        {/* Timestamp */}
        <span className="text-sm text-gray-600 font-medium">
          {formatDateTime(entry.createdAt)}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              title="Edit entry"
              aria-label="Edit entry"
              data-testid="edit-entry-button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(entry)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete entry"
              aria-label="Delete entry"
              data-testid="delete-entry-button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: entry.content }}
        data-testid="entry-content"
      />

      {/* Attachments indicator */}
      {entry.attachments && entry.attachments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <span>
              {entry.attachments.length} {entry.attachments.length === 1 ? 'attachment' : 'attachments'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
