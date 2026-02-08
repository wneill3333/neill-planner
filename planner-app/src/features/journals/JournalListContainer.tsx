/**
 * JournalListContainer Component
 *
 * Container component for JournalList that connects to Redux store.
 * Fetches journals for the current user and handles journal selection.
 */

import { useCallback, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectAllJournals, selectJournalsLoading } from './journalSlice';
import { selectAllCategories } from '../categories/categorySlice';
import { useJournals } from './hooks';
import { useAuth } from '../auth';
import { JournalList } from '../../components/journals/JournalList';
import type { Journal, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface JournalListContainerProps {
  /** Callback when a journal is clicked for viewing/editing */
  onJournalSelect?: (journal: Journal) => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalListContainer - Connected journal list component
 *
 * Responsibilities:
 * - Fetch journals for current user
 * - Handle journal selection for viewing/editing
 * - Show loading and error states
 *
 * @example
 * ```tsx
 * <JournalListContainer
 *   onJournalSelect={handleSelectJournal}
 * />
 * ```
 */
export function JournalListContainer({
  onJournalSelect,
  className,
  testId,
}: JournalListContainerProps) {
  const { user } = useAuth();
  const journals = useAppSelector(selectAllJournals);
  const loading = useAppSelector(selectJournalsLoading);
  const categories = useAppSelector(selectAllCategories);

  // Build a lookup map: categoryId -> Category
  const categoriesById = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const cat of categories) {
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  // Fetch journals for the current user (hook handles useEffect)
  const { error } = useJournals(user?.id || '');

  /**
   * Handle journal click - passes to parent callback
   */
  const handleJournalClick = useCallback((journal: Journal) => {
    if (onJournalSelect) {
      onJournalSelect(journal);
    }
  }, [onJournalSelect]);

  // Error state
  if (error) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className || ''}`}
        data-testid={testId ? `${testId}-error` : 'journal-list-error'}
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
            Failed to load journals
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <JournalList
      journals={journals}
      categoriesById={categoriesById}
      onJournalClick={handleJournalClick}
      loading={loading}
      className={className}
      testId={testId}
    />
  );
}
