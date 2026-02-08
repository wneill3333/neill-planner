/**
 * JournalList Component
 *
 * Displays a grid of journal cards.
 * Shows empty state when no journals are present.
 */

import { memo } from 'react';
import { JournalItem } from './JournalItem';
import type { Journal, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface JournalListProps {
  /** Journals to display */
  journals: Journal[];
  /** Categories keyed by ID for resolving category colors */
  categoriesById?: Record<string, Category>;
  /** Click handler for opening a journal */
  onJournalClick?: (journal: Journal) => void;
  /** Loading state */
  loading?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalList - Display list of journals
 *
 * Features:
 * - Displays journals as clickable cards
 * - Empty state when no journals exist
 * - Loading state support
 *
 * @example
 * ```tsx
 * <JournalList
 *   journals={journals}
 *   onJournalClick={handleOpenJournal}
 * />
 * ```
 */
export const JournalList = memo(function JournalList({
  journals,
  categoriesById = {},
  onJournalClick,
  loading = false,
  className = '',
  testId,
}: JournalListProps) {
  // Loading state
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className}`}
        data-testid={testId || 'journal-list-loading'}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading journals"
          />
          <p className="mt-2 text-sm text-gray-600">
            Loading journals...
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (journals.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className}`}
        data-testid={testId || 'journal-list-empty'}
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No journals yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new journal.
          </p>
        </div>
      </div>
    );
  }

  // Journals list
  return (
    <div
      className={`space-y-3 ${className}`}
      data-testid={testId || 'journal-list'}
      role="list"
      aria-label="Journals list"
    >
      {journals.map((journal) => (
        <JournalItem
          key={journal.id}
          journal={journal}
          categoryColor={journal.categoryId ? categoriesById[journal.categoryId]?.color : null}
          onClick={onJournalClick}
          testId={`journal-item-${journal.id}`}
        />
      ))}
    </div>
  );
});
