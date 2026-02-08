/**
 * JournalDetail Component
 *
 * Displays journal details with entries in reverse chronological order.
 */

import { memo } from 'react';
import { JournalEntryItem } from './JournalEntryItem';
import type { Journal, JournalEntry } from '../../types';
import type { NoteAttachment } from '../../types/note.types';

// =============================================================================
// Types
// =============================================================================

export interface JournalDetailProps {
  /** Journal to display */
  journal: Journal;
  /** Entries for this journal */
  entries: JournalEntry[];
  /** Category color for the color indicator */
  categoryColor?: string | null;
  /** Category name for display */
  categoryName?: string | null;
  /** Loading state for entries */
  entriesLoading?: boolean;
  /** Handler to go back to journals list */
  onBack: () => void;
  /** Handler to edit journal */
  onEdit: () => void;
  /** Handler to add new entry */
  onAddEntry: () => void;
  /** Handler to edit an entry */
  onEditEntry?: (entry: JournalEntry) => void;
  /** Handler to delete an entry */
  onDeleteEntry?: (entry: JournalEntry) => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalDetail - Display journal with entries
 *
 * Features:
 * - Back button to journals list
 * - Journal title and description
 * - Edit journal button
 * - Add entry button
 * - List of entries (newest first)
 * - Empty state when no entries
 *
 * @example
 * ```tsx
 * <JournalDetail
 *   journal={journal}
 *   entries={entries}
 *   onBack={handleBack}
 *   onEdit={handleEditJournal}
 *   onAddEntry={handleAddEntry}
 * />
 * ```
 */
export const JournalDetail = memo(function JournalDetail({
  journal,
  entries,
  categoryColor,
  categoryName,
  entriesLoading = false,
  onBack,
  onEdit,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  className = '',
  testId,
}: JournalDetailProps) {
  return (
    <div
      className={`space-y-6 ${className}`}
      data-testid={testId || 'journal-detail'}
    >
      {/* Header */}
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:underline"
          data-testid="back-button"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Journals
        </button>

        {/* Title and actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {journal.title}
            </h1>
            {categoryColor && categoryName && (
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-gray-500">{categoryName}</span>
              </div>
            )}
            {journal.description && (
              <p className="text-sm text-gray-600">
                {journal.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit Journal button */}
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
              data-testid="edit-journal-button"
            >
              Edit
            </button>

            {/* Add Entry button */}
            <button
              onClick={onAddEntry}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
              data-testid="add-entry-button"
            >
              + Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Entries section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Entries
        </h2>

        {/* Loading state */}
        {entriesLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div
                className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"
                role="status"
                aria-label="Loading entries"
              />
              <p className="mt-2 text-sm text-gray-600">
                Loading entries...
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!entriesLoading && entries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No entries yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your first entry to start tracking.
              </p>
            </div>
          </div>
        )}

        {/* Entries list (already sorted by container) */}
        {!entriesLoading && entries.length > 0 && (
          <div className="space-y-4" role="list" aria-label="Journal entries">
            {entries.map((entry) => (
              <JournalEntryItem
                key={entry.id}
                entry={entry}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
                testId={`journal-entry-${entry.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
