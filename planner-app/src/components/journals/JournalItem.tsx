/**
 * JournalItem Component
 *
 * Displays a single journal as a clickable card with metadata.
 */

import { memo } from 'react';
import type { Journal } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface JournalItemProps {
  /** Journal to display */
  journal: Journal;
  /** Category color for the color indicator (null if uncategorized) */
  categoryColor?: string | null;
  /** Click handler for opening journal */
  onClick?: (journal: Journal) => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JournalItem - Display single journal card
 *
 * Features:
 * - Clickable card with hover effect
 * - Shows title, description, entry count
 * - Displays last activity date
 *
 * @example
 * ```tsx
 * <JournalItem
 *   journal={journal}
 *   onClick={handleOpenJournal}
 * />
 * ```
 */
export const JournalItem = memo(function JournalItem({
  journal,
  categoryColor,
  onClick,
  testId,
}: JournalItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(journal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(journal);
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${categoryColor ? 'border-l-4' : ''}`}
      style={categoryColor ? { borderLeftColor: categoryColor } : undefined}
      data-testid={testId || 'journal-item'}
    >
      {/* Title */}
      <h3 className="font-medium text-gray-900 mb-1">
        {journal.title}
      </h3>

      {/* Description */}
      {journal.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {journal.description}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {/* Entry count badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
            {journal.entryCount} {journal.entryCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Last activity */}
        <span className="text-gray-500">
          {journal.lastEntryAt
            ? `Last entry ${new Date(journal.lastEntryAt).toLocaleDateString()}`
            : 'No entries yet'}
        </span>
      </div>
    </div>
  );
});
