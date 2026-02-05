/**
 * Note Hooks
 *
 * Custom hooks for note-related operations.
 * These hooks provide a convenient interface for components to interact with the notes slice.
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectNotesByDate, selectNoteById, selectNotesLoading, selectNotesError } from './noteSlice';
import { fetchNotesByDate } from './noteThunks';
import type { Note } from '../../types';

// =============================================================================
// Hook Interfaces
// =============================================================================

/**
 * Return type for useNotesByDate hook
 */
export interface UseNotesByDateResult {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Return type for useNote hook
 */
export interface UseNoteResult {
  note: Note | undefined;
  loading: boolean;
  error: string | null;
}

// =============================================================================
// Custom Hooks
// =============================================================================

/**
 * Hook to fetch and manage notes for a specific date
 *
 * Automatically fetches notes when the date or userId changes.
 * Returns the notes, loading state, error state, and a refetch function.
 *
 * @param date - Date object for the target date
 * @param userId - User ID to fetch notes for
 * @returns Notes data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { notes, loading, error, refetch } = useNotesByDate(selectedDate, userId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <NoteList notes={notes} onRefresh={refetch} />;
 * ```
 */
export function useNotesByDate(date: Date, userId: string): UseNotesByDateResult {
  const dispatch = useAppDispatch();

  // Get date string for selector and stable dependency
  const dateString = date.toISOString().split('T')[0];

  // Select notes from state
  const notes = useAppSelector((state) => selectNotesByDate(state, dateString));
  const loading = useAppSelector(selectNotesLoading);
  const error = useAppSelector(selectNotesError);

  // Fetch notes on mount and when date/userId changes
  // Use dateString instead of date for stable dependency comparison
  useEffect(() => {
    if (userId) {
      dispatch(fetchNotesByDate({ userId, date }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, dateString, userId]);

  // Refetch function
  const refetch = () => {
    if (userId) {
      dispatch(fetchNotesByDate({ userId, date }));
    }
  };

  return {
    notes,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to get a single note by ID
 *
 * Does not trigger any fetching - expects the note to already be in state.
 * Use this for displaying note details when the note list has already been fetched.
 *
 * @param noteId - ID of the note to retrieve
 * @returns Note data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { note, loading, error } = useNote(noteId);
 *
 * if (!note) return <NotFound />;
 * return <NoteDetails note={note} />;
 * ```
 */
export function useNote(noteId: string): UseNoteResult {
  const note = useAppSelector((state) => selectNoteById(state, noteId));
  const loading = useAppSelector(selectNotesLoading);
  const error = useAppSelector(selectNotesError);

  return {
    note,
    loading,
    error,
  };
}
