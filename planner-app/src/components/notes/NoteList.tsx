/**
 * NoteList Component
 *
 * Displays a list of notes for the selected date.
 * Shows empty state when no notes are present.
 */

import { memo } from 'react';
import { NoteItem } from './NoteItem';
import type { Note, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface NoteListProps {
  /** Notes to display */
  notes: Note[];
  /** Categories for color mapping */
  categories: Category[];
  /** Click handler for editing a note */
  onNoteClick?: (note: Note) => void;
  /** Loading state */
  loading?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get category color by ID
 */
function getCategoryColor(categoryId: string | null, categories: Category[]): string | null {
  if (!categoryId) return null;
  const category = categories.find(c => c.id === categoryId);
  return category?.color || null;
}

// =============================================================================
// Component
// =============================================================================

/**
 * NoteList - Display list of notes
 *
 * Features:
 * - Displays notes as clickable cards
 * - Shows category colors via left border
 * - Empty state when no notes exist
 * - Loading state support
 *
 * @example
 * ```tsx
 * <NoteList
 *   notes={notes}
 *   categories={categories}
 *   onNoteClick={handleEditNote}
 * />
 * ```
 */
export const NoteList = memo(function NoteList({
  notes,
  categories,
  onNoteClick,
  loading = false,
  className = '',
  testId,
}: NoteListProps) {
  // Loading state
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className}`}
        data-testid={testId || 'note-list-loading'}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading notes"
          />
          <p className="mt-2 text-sm text-gray-600">
            Loading notes...
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (notes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className}`}
        data-testid={testId || 'note-list-empty'}
      >
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No notes for this date
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new note.
          </p>
        </div>
      </div>
    );
  }

  // Notes list
  return (
    <div
      className={`space-y-3 ${className}`}
      data-testid={testId || 'note-list'}
      role="list"
      aria-label="Notes list"
    >
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          categoryColor={getCategoryColor(note.categoryId, categories)}
          onClick={onNoteClick}
          testId={`note-item-${note.id}`}
        />
      ))}
    </div>
  );
});
