/**
 * NoteRangeList Component
 *
 * Displays notes grouped by date for week and month views.
 * Each date group shows a date header followed by the notes for that date.
 */

import { memo, useMemo } from 'react';
import { NoteItem } from './NoteItem';
import type { Note, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface NoteRangeListProps {
  /** Notes to display (should be pre-sorted by date) */
  notes: Note[];
  /** Categories for color mapping */
  categories: Category[];
  /** Click handler for editing a note */
  onNoteClick?: (note: Note) => void;
  /** Loading state */
  loading?: boolean;
  /** Label for the empty state (e.g., "this week", "this month") */
  emptyLabel?: string;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getCategoryColor(categoryId: string | null, categories: Category[]): string | null {
  if (!categoryId) return null;
  const category = categories.find(c => c.id === categoryId);
  return category?.color || null;
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface NoteGroup {
  dateKey: string;
  dateLabel: string;
  notes: Note[];
}

// =============================================================================
// Component
// =============================================================================

export const NoteRangeList = memo(function NoteRangeList({
  notes,
  categories,
  onNoteClick,
  loading = false,
  emptyLabel = 'this period',
  className = '',
  testId,
}: NoteRangeListProps) {
  // Group notes by date
  const groups = useMemo((): NoteGroup[] => {
    const map = new Map<string, Note[]>();
    for (const note of notes) {
      const key = getDateKey(note.date);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(note);
    }

    // Sort groups by date key ascending
    const sortedKeys = [...map.keys()].sort();
    return sortedKeys.map(key => ({
      dateKey: key,
      dateLabel: formatDateHeader(map.get(key)![0].date),
      notes: map.get(key)!,
    }));
  }, [notes]);

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className}`}
        data-testid={testId ? `${testId}-loading` : 'note-range-list-loading'}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading notes"
          />
          <p className="mt-2 text-sm text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (notes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className}`}
        data-testid={testId ? `${testId}-empty` : 'note-range-list-empty'}
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
            No notes for {emptyLabel}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new note.
          </p>
        </div>
      </div>
    );
  }

  // Grouped notes list
  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid={testId || 'note-range-list'}
      role="list"
      aria-label="Notes list"
    >
      {groups.map((group) => (
        <div key={group.dateKey} data-testid={`note-group-${group.dateKey}`}>
          {/* Date Header */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            {group.dateLabel}
          </h3>
          {/* Notes for this date */}
          <div className="space-y-2">
            {group.notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                categoryColor={getCategoryColor(note.categoryId, categories)}
                onClick={onNoteClick}
                showDate={false}
                testId={`note-item-${note.id}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
