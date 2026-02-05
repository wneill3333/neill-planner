/**
 * SearchResults Component
 *
 * Displays search results grouped by type (Tasks, Events, Notes).
 * Shows count per category, highlights matching text, and handles navigation.
 */

import { useMemo, type ReactElement } from 'react';
import type { Task, Event, Note } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { getStatusSymbol } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface SearchResultsProps {
  /** Search query for highlighting */
  query: string;
  /** Task results */
  tasks: Task[];
  /** Event results */
  events: Event[];
  /** Note results */
  notes: Note[];
  /** Whether search is in progress */
  isSearching?: boolean;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when an event is clicked */
  onEventClick?: (event: Event) => void;
  /** Callback when a note is clicked */
  onNoteClick?: (note: Note) => void;
  /** Callback when results panel should close */
  onClose?: () => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Highlight matching text in a string
 * Returns JSX with highlighted portions
 */
function highlightMatch(text: string, query: string): ReactElement {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 font-medium">{match}</mark>
      {after}
    </>
  );
}

/**
 * Truncate text to a maximum length
 */
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// =============================================================================
// Sub-Components
// =============================================================================

interface ResultSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

function ResultSection({ title, count, children }: ResultSectionProps) {
  if (count === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100">
        {title} <span className="text-gray-500">({count})</span>
      </h3>
      <ul className="divide-y divide-gray-200">{children}</ul>
    </div>
  );
}

interface TaskResultItemProps {
  task: Task;
  query: string;
  onClick?: (task: Task) => void;
}

function TaskResultItem({ task, query, onClick }: TaskResultItemProps) {
  const handleClick = () => {
    onClick?.(task);
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-gray-50"
        data-testid="task-result-item"
      >
        <div className="flex items-start gap-2">
          <span className="text-lg" aria-label={`Status: ${task.status}`}>
            {getStatusSymbol(task.status)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {highlightMatch(task.title, query)}
            </p>
            {task.description && (
              <p className="mt-1 text-sm text-gray-600">
                {highlightMatch(truncateText(task.description), query)}
              </p>
            )}
            {task.scheduledDate && (
              <p className="mt-1 text-xs text-gray-500">
                {formatDisplayDate(task.scheduledDate)}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-xs font-medium text-gray-500">
            {task.priority.letter}
            {task.priority.number}
          </span>
        </div>
      </button>
    </li>
  );
}

interface EventResultItemProps {
  event: Event;
  query: string;
  onClick?: (event: Event) => void;
}

function EventResultItem({ event, query, onClick }: EventResultItemProps) {
  const handleClick = () => {
    onClick?.(event);
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-gray-50"
        data-testid="event-result-item"
      >
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {highlightMatch(event.title, query)}
            </p>
            {event.description && (
              <p className="mt-1 text-sm text-gray-600">
                {highlightMatch(truncateText(event.description), query)}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formatDisplayDate(event.startTime)}
              {event.location && ` • ${event.location}`}
            </p>
          </div>
        </div>
      </button>
    </li>
  );
}

interface NoteResultItemProps {
  note: Note;
  query: string;
  onClick?: (note: Note) => void;
}

function NoteResultItem({ note, query, onClick }: NoteResultItemProps) {
  const handleClick = () => {
    onClick?.(note);
  };

  // Strip HTML tags from content for display (safe approach)
  const plainContent = useMemo(() => {
    // Safe approach: strip tags with regex instead of using innerHTML
    return note.content.replace(/<[^>]*>/g, '');
  }, [note.content]);

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-gray-50"
        data-testid="note-result-item"
      >
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {highlightMatch(note.title, query)}
            </p>
            {plainContent && (
              <p className="mt-1 text-sm text-gray-600">
                {highlightMatch(truncateText(plainContent), query)}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{formatDisplayDate(note.date)}</p>
          </div>
        </div>
      </button>
    </li>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * SearchResults - Display search results grouped by type
 *
 * Features:
 * - Results grouped by type (Tasks, Events, Notes)
 * - Count displayed for each category
 * - Highlighted matching text
 * - Click handlers for navigation
 * - Empty state when no results
 * - Loading state
 *
 * @example
 * ```tsx
 * <SearchResults
 *   query="meeting"
 *   tasks={taskResults}
 *   events={eventResults}
 *   notes={noteResults}
 *   onTaskClick={handleTaskClick}
 * />
 * ```
 */
export function SearchResults({
  query,
  tasks,
  events,
  notes,
  isSearching = false,
  onTaskClick,
  onEventClick,
  onNoteClick,
  className = '',
  testId = 'search-results',
}: SearchResultsProps) {
  const totalResults = tasks.length + events.length + notes.length;
  const hasResults = totalResults > 0;

  // Don't show anything if no query
  if (!query.trim()) {
    return null;
  }

  return (
    <div
      className={`
        absolute top-full left-0 right-0 mt-2
        bg-white border border-gray-200 rounded-lg shadow-lg
        max-h-96 overflow-y-auto
        z-50
        ${className}
      `}
      data-testid={testId}
      role="region"
      aria-label="Search results"
    >
      {/* Loading State */}
      {isSearching && (
        <div className="px-4 py-8 text-center" data-testid="search-loading">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Searching...</p>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && !hasResults && (
        <div className="px-4 py-8 text-center" data-testid="search-empty">
          <svg
            className="w-12 h-12 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-900">No results found</p>
          <p className="mt-1 text-sm text-gray-600">Try a different search term</p>
        </div>
      )}

      {/* Results */}
      {!isSearching && hasResults && (
        <div>
          <ResultSection title="Tasks" count={tasks.length}>
            {tasks.map((task) => (
              <TaskResultItem key={task.id} task={task} query={query} onClick={onTaskClick} />
            ))}
          </ResultSection>

          <ResultSection title="Events" count={events.length}>
            {events.map((event) => (
              <EventResultItem key={event.id} event={event} query={query} onClick={onEventClick} />
            ))}
          </ResultSection>

          <ResultSection title="Notes" count={notes.length}>
            {notes.map((note) => (
              <NoteResultItem key={note.id} note={note} query={query} onClick={onNoteClick} />
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
