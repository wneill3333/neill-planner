/**
 * NoteListContainer Component
 *
 * Container component for NoteList that connects to Redux store.
 * Fetches notes for the selected date and provides categories for color display.
 */

import { useCallback, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectNotesForSelectedDate, selectNotesLoading } from './noteSlice';
import { selectAllCategories } from '../categories/categorySlice';
import { selectSelectedDate } from '../tasks/taskSlice';
import { useNotesByDate } from './hooks';
import { useAuth } from '../auth';
import { NoteList } from '../../components/notes/NoteList';
import { parseISODateString } from '../../utils/firestoreUtils';
import type { Note } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface NoteListContainerProps {
  /** Callback when a note is clicked for editing */
  onNoteClick?: (note: Note) => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * NoteListContainer - Connected note list component
 *
 * Responsibilities:
 * - Fetch notes for selected date
 * - Provide categories for color display
 * - Handle note selection for editing
 * - Show loading and error states
 *
 * @example
 * ```tsx
 * <NoteListContainer
 *   onNoteClick={handleEditNote}
 * />
 * ```
 */
export function NoteListContainer({
  onNoteClick,
  className,
  testId,
}: NoteListContainerProps) {
  const { user } = useAuth();
  const selectedDate = useAppSelector(selectSelectedDate);
  const notes = useAppSelector(selectNotesForSelectedDate);
  const loading = useAppSelector(selectNotesLoading);
  const categories = useAppSelector(selectAllCategories);

  // Convert ISO date string to Date object for hook (memoized to prevent re-creation)
  // Use parseISODateString to create local midnight (new Date("2026-02-05") would be UTC midnight!)
  const dateObj = useMemo(() => parseISODateString(selectedDate), [selectedDate]);

  // Fetch notes for the selected date (hook handles useEffect)
  const { error } = useNotesByDate(dateObj, user?.id || '');

  /**
   * Handle note click - passes to parent callback
   */
  const handleNoteClick = useCallback((note: Note) => {
    if (onNoteClick) {
      onNoteClick(note);
    }
  }, [onNoteClick]);

  // Error state
  if (error) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className || ''}`}
        data-testid={testId ? `${testId}-error` : 'note-list-error'}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Failed to load notes
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <NoteList
      notes={notes}
      categories={categories}
      onNoteClick={handleNoteClick}
      loading={loading}
      className={className}
      testId={testId}
    />
  );
}
