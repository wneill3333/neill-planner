/**
 * MonthView Component
 *
 * Displays a traditional monthly calendar grid with events.
 * Features:
 * - 6 rows x 7 columns calendar grid (handles all month layouts)
 * - Month navigation (previous/next month, today button)
 * - Events shown with time and truncated title
 * - Current day highlight
 * - Days from other months in lighter color
 * - Click day to navigate to Daily View
 * - Category color indicators on events
 *
 * @module components/events/MonthView
 */

import { memo, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addDays,
  isSameDay,
  isSameMonth,
  format,
  startOfDay,
  eachDayOfInterval,
} from 'date-fns';
import type { Event, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface MonthViewProps {
  /** Events to display in the month view */
  events: Event[];
  /** Selected date for the month view */
  selectedDate: Date;
  /** Categories for event color coding */
  categories?: Record<string, Category>;
  /** Callback for navigation (prev/next/today buttons) */
  onDateSelect: (date: Date) => void;
  /** Optional callback for clicking a specific day cell (if not provided, uses onDateSelect) */
  onDayClick?: (date: Date) => void;
  /** Optional callback for clicking an event to edit/delete it */
  onEventClick?: (event: Event) => void;
}

/**
 * Internal type for events grouped by day
 */
interface EventsByDay {
  [dateKey: string]: Event[];
}

// =============================================================================
// Constants
// =============================================================================

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_EVENTS = 3; // Maximum events to show before "+N more"

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a date key for grouping events by day
 */
function getDateKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

/**
 * Group events by their day
 */
function groupEventsByDay(events: Event[]): EventsByDay {
  const grouped: EventsByDay = {};

  for (const event of events) {
    const key = getDateKey(event.startTime);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(event);
  }

  // Sort events within each day by start time
  for (const key in grouped) {
    grouped[key].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  return grouped;
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Calculate calendar grid days ensuring always 42 days (6 weeks)
 * This provides a consistent layout for all months regardless of their
 * starting day or number of days.
 */
function getMonthGridDays(monthStart: Date, monthEnd: Date): Date[] {
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Ensure we always have 42 days (6 weeks) for consistent grid layout
  if (days.length < 42) {
    const additionalDaysNeeded = 42 - days.length;
    const extendedEnd = addDays(calendarEnd, additionalDaysNeeded);
    return eachDayOfInterval({ start: calendarStart, end: extendedEnd });
  }

  return days;
}

// =============================================================================
// Component
// =============================================================================

/**
 * MonthView - Displays events in a traditional monthly calendar grid
 *
 * Shows a calendar month with 6 weeks (to handle all possible month layouts).
 * Events are listed under each day with time and title. Includes month
 * navigation and current day highlighting.
 *
 * @param props - MonthViewProps
 * @returns JSX element representing the month view
 */
function MonthViewComponent({
  events,
  selectedDate,
  categories = {},
  onDateSelect,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  // Calculate month range
  const monthStart = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const monthEnd = useMemo(() => endOfMonth(selectedDate), [selectedDate]);

  // Generate array of all visible days (42 days = 6 weeks)
  const calendarDays = useMemo(() => {
    return getMonthGridDays(monthStart, monthEnd);
  }, [monthStart, monthEnd]);

  // Group events by day
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  // Navigation handlers
  const handlePreviousMonth = useCallback(() => {
    const previousMonth = addMonths(selectedDate, -1);
    onDateSelect(previousMonth);
  }, [selectedDate, onDateSelect]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = addMonths(selectedDate, 1);
    onDateSelect(nextMonth);
  }, [selectedDate, onDateSelect]);

  const handleToday = useCallback(() => {
    onDateSelect(new Date());
  }, [onDateSelect]);

  const handleDayClick = useCallback(
    (day: Date) => {
      // Use onDayClick if provided, otherwise fall back to onDateSelect
      if (onDayClick) {
        onDayClick(day);
      } else {
        onDateSelect(day);
      }
    },
    [onDateSelect, onDayClick]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Previous month"
          >
            ◀
          </button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Next month"
          >
            ▶
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          aria-label="Go to current month"
        >
          Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_NAMES.map((dayName) => (
          <div
            key={dayName}
            className="px-2 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid - 6 rows of 7 days */}
      <div className="grid grid-cols-7 flex-1 overflow-hidden" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
        {calendarDays.map((day) => {
          const dayKey = getDateKey(day);
          const dayEvents = eventsByDay[dayKey] || [];
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const remainingCount = dayEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={dayKey}
              className={`border-r border-b border-gray-200 last:border-r-0 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden ${
                isToday ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleDayClick(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDayClick(day);
                }
              }}
              aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${isToday ? ' (Today)' : ''}. ${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}.`}
              data-testid={`day-cell-${dayKey}`}
            >
              {/* Date number */}
              <div
                className={`px-2 py-1 text-right ${
                  isToday
                    ? 'font-bold text-blue-600'
                    : isCurrentMonth
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                <span
                  className={`text-sm ${
                    isToday ? 'bg-blue-600 text-white rounded-full px-2 py-1' : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events list */}
              <div className="flex-1 px-1 space-y-0.5 overflow-hidden">
                {visibleEvents.map((event) => {
                  const category = event.categoryId ? categories[event.categoryId] : null;
                  const categoryColor = category?.color || '#9CA3AF';

                  return (
                    <div
                      key={event.id}
                      className="px-1 py-0.5 rounded text-xs bg-white border-l-2 hover:shadow-sm transition-shadow cursor-pointer truncate"
                      style={{
                        borderLeftColor: categoryColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (onEventClick) {
                          onEventClick(event);
                        }
                      }}
                      title={`${format(event.startTime, 'h:mm a')} - ${event.title}`}
                      data-testid={`event-item-${event.id}`}
                    >
                      <span className="font-semibold text-gray-600">
                        {format(event.startTime, 'h:mm a')}
                      </span>{' '}
                      <span className="text-gray-700">{truncateText(event.title, 15)}</span>
                    </div>
                  );
                })}
                {remainingCount > 0 && (
                  <div
                    className="px-1 py-0.5 text-xs text-blue-600 font-semibold cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(day);
                    }}
                    data-testid={`more-events-${dayKey}`}
                  >
                    +{remainingCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 * Only re-renders when relevant props change
 */
function arePropsEqual(prevProps: MonthViewProps, nextProps: MonthViewProps): boolean {
  return (
    prevProps.events === nextProps.events &&
    prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
    prevProps.categories === nextProps.categories &&
    prevProps.onDateSelect === nextProps.onDateSelect &&
    prevProps.onDayClick === nextProps.onDayClick &&
    prevProps.onEventClick === nextProps.onEventClick
  );
}

// Export memoized component
export const MonthView = memo(MonthViewComponent, arePropsEqual);

export default MonthView;
