/**
 * NoteItem Component
 *
 * Displays a single note item in the notes list.
 * Shows title, content preview, category color, and linked items indicator.
 */

import { memo } from 'react';
import type { Note } from '../../types';
import { AttachmentThumbnail } from './AttachmentThumbnail';

// =============================================================================
// Types
// =============================================================================

export interface NoteItemProps {
  /** Note to display */
  note: Note;
  /** Category color (hex string) for left border */
  categoryColor?: string | null;
  /** Click handler for editing note */
  onClick?: (note: Note) => void;
  /** Whether to show the date alongside the time */
  showDate?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Strips HTML tags from a string to get plain text
 * Uses DOMParser for XSS-safe parsing
 */
function stripHtml(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Get content preview (first 100 characters)
 */
function getContentPreview(content: string): string {
  const plainText = stripHtml(content);
  if (plainText.length <= 100) {
    return plainText;
  }
  return plainText.substring(0, 100) + '...';
}

/**
 * Format a Date to a readable timestamp string down to the minute.
 * If showDate is true, includes the date portion (e.g., "Feb 6, 2026 2:35 PM").
 * If showDate is false, shows time only (e.g., "2:35 PM").
 */
function formatTimestamp(date: Date, showDate: boolean): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  if (showDate) {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return date.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// =============================================================================
// Component
// =============================================================================

/**
 * NoteItem - Display a single note
 *
 * Visual features:
 * - Left border colored by category
 * - Title in bold
 * - Content preview (first 100 chars, HTML stripped)
 * - Link indicator (📎) if note has linked tasks/events
 * - Hover state
 *
 * @example
 * ```tsx
 * <NoteItem
 *   note={note}
 *   categoryColor="#3B82F6"
 *   onClick={handleEditNote}
 * />
 * ```
 */
export const NoteItem = memo(function NoteItem({
  note,
  categoryColor,
  onClick,
  showDate = false,
  className = '',
  testId,
}: NoteItemProps) {
  const hasLinks = note.linkedTaskIds.length > 0 || note.linkedEventIds.length > 0;
  const contentPreview = note.content ? getContentPreview(note.content) : '';

  const handleClick = () => {
    if (onClick) {
      onClick(note);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(note);
    }
  };

  // Determine border color - use category color or default gray
  const borderColor = categoryColor || '#D1D5DB';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group
        relative
        p-4
        bg-white
        border border-gray-200
        rounded-lg
        cursor-pointer
        transition-all duration-150
        hover:shadow-md
        hover:border-gray-300
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
        ${className}
      `}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: borderColor,
      }}
      data-testid={testId || `note-item-${note.id}`}
      aria-label={`Note: ${note.title}`}
    >
      {/* Title and Link Indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1 break-words">
          {note.title}
        </h3>
        {hasLinks && (
          <span
            className="text-gray-400 text-lg flex-shrink-0"
            aria-label={`Has ${note.linkedTaskIds.length + note.linkedEventIds.length} linked items`}
            title="Has linked tasks or events"
          >
            📎
          </span>
        )}
      </div>

      {/* Timestamp */}
      <p className="text-xs text-gray-400 mb-1" data-testid={`${testId || `note-item-${note.id}`}-timestamp`}>
        {formatTimestamp(note.createdAt, showDate)}
      </p>

      {/* Content Preview */}
      {contentPreview && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 break-words">
          {contentPreview}
        </p>
      )}

      {/* Empty state for no content */}
      {!contentPreview && (
        <p className="text-sm text-gray-400 italic">
          No content
        </p>
      )}

      {/* Attachment Indicator */}
      {note.attachments && note.attachments.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
          {note.attachments.slice(0, 3).map((attachment) => (
            <AttachmentThumbnail
              key={attachment.id}
              attachment={attachment}
              size="sm"
              onView={() => window.open(attachment.downloadUrl, '_blank')}
            />
          ))}
          {note.attachments.length > 3 && (
            <span className="text-xs text-gray-500 ml-1">
              +{note.attachments.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
});
