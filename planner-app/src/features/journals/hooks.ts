/**
 * Journal Hooks
 *
 * Custom hooks for journal-related operations.
 * These hooks provide a convenient interface for components to interact with the journals slice.
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAllJournals,
  selectEntriesByJournal,
  selectJournalsLoading,
  selectEntriesLoading,
  selectJournalsError,
} from './journalSlice';
import { fetchUserJournals, fetchJournalEntries } from './journalThunks';
import type { Journal, JournalEntry } from '../../types';

// =============================================================================
// Hook Interfaces
// =============================================================================

/**
 * Return type for useJournals hook
 */
export interface UseJournalsResult {
  journals: Journal[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Return type for useJournalEntries hook
 */
export interface UseJournalEntriesResult {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// =============================================================================
// Custom Hooks
// =============================================================================

/**
 * Hook to fetch and manage all journals for a user
 *
 * Automatically fetches journals when the userId changes.
 * Returns the journals, loading state, error state, and a refetch function.
 *
 * @param userId - User ID to fetch journals for
 * @returns Journals data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { journals, loading, error, refetch } = useJournals(userId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <JournalList journals={journals} onRefresh={refetch} />;
 * ```
 */
export function useJournals(userId: string): UseJournalsResult {
  const dispatch = useAppDispatch();

  // Select journals from state
  const journals = useAppSelector(selectAllJournals);
  const loading = useAppSelector(selectJournalsLoading);
  const error = useAppSelector(selectJournalsError);

  // Fetch journals on mount and when userId changes
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserJournals({ userId }));
    }
  }, [dispatch, userId]);

  // Refetch function
  const refetch = useCallback(() => {
    if (userId) {
      dispatch(fetchUserJournals({ userId }));
    }
  }, [dispatch, userId]);

  return {
    journals,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch and manage entries for a specific journal
 *
 * Automatically fetches entries when the journalId or userId changes.
 * Returns the entries, loading state, error state, and a refetch function.
 *
 * @param journalId - Journal ID to fetch entries for (null to skip fetching)
 * @param userId - User ID to fetch entries for
 * @returns Entries data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { entries, loading, error, refetch } = useJournalEntries(journalId, userId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <EntryList entries={entries} onRefresh={refetch} />;
 * ```
 */
export function useJournalEntries(journalId: string | null, userId: string): UseJournalEntriesResult {
  const dispatch = useAppDispatch();

  // Select entries from state
  const entries = useAppSelector((state) =>
    journalId ? selectEntriesByJournal(state, journalId) : []
  );
  const loading = useAppSelector(selectEntriesLoading);
  const error = useAppSelector(selectJournalsError);

  // Fetch entries on mount and when journalId/userId changes
  useEffect(() => {
    if (journalId && userId) {
      dispatch(fetchJournalEntries({ journalId, userId }));
    }
  }, [dispatch, journalId, userId]);

  // Refetch function
  const refetch = useCallback(() => {
    if (journalId && userId) {
      dispatch(fetchJournalEntries({ journalId, userId }));
    }
  }, [dispatch, journalId, userId]);

  return {
    entries,
    loading,
    error,
    refetch,
  };
}
