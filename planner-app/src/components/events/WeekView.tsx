/**
 * WeekView Component
 *
 * Displays a traditional 7-day grid (Sunday-Saturday) with events.
 * Features:
 * - Week navigation (previous/next week, today button)
 * - Event display with times and category colors
 * - Current day highlight
 * - Click day to navigate to Daily View
 *
 * @module components/events/WeekView
 */

import { memo, useMemo, useCallback } from 'react';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  isSameDay,
  format,
  startOfDay,
} from 'date-fns';
import type { Event, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface WeekViewProps {
  /** Events to display in the week view */
  events: Event[];
  /** Selected date for the week view */
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

// =============================================================================
// Component
// =============================================================================

/**
 * WeekView - Displays events in a 7-day grid view
 *
 * Shows a traditional calendar week (Sunday-Saturday) with events listed
 * under each day. Includes week navigation and current day highlighting.
 *
 * @param props - WeekViewProps
 * @returns JSX element representing the week view
 */
function WeekViewComponent({
  events,
  selectedDate,
  categories = {},
  onDateSelect,
  onDayClick,
  onEventClick,
}: WeekViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  // Calculate week range
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => endOfWeek(selectedDate), [selectedDate]);

  // Generate array of 7 days for the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Group events by day
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  // Navigation handlers
  const handlePreviousWeek = useCallback(() => {
    const previousWeek = addWeeks(selectedDate, -1);
    onDateSelect(previousWeek);
  }, [selectedDate, onDateSelect]);

  const handleNextWeek = useCallback(() => {
    const nextWeek = addWeeks(selectedDate, 1);
    onDateSelect(nextWeek);
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
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Previous week"
          >
            ◀
          </button>
          <h2 className="text-lg font-semibold">
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Next week"
          >
            ▶
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          aria-label="Go to current week"
        >
          Today
        </button>
      </div>

      {/* Day headers */}
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

      {/* Week grid */}
      <div className="grid grid-cols-7 flex-1 overflow-hidden">
        {weekDays.map((day) => {
          const dayKey = getDateKey(day);
          const dayEvents = eventsByDay[dayKey] || [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={dayKey}
              className={`border-r border-gray-200 last:border-r-0 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors ${
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
              data-testid={`day-column-${dayKey}`}
            >
              {/* Date number */}
              <div
                className={`px-2 py-2 text-center border-b border-gray-200 ${
                  isToday ? 'font-bold text-blue-600' : 'text-gray-700'
                }`}
              >
                <div className="text-2xl">{format(day, 'd')}</div>
              </div>

              {/* Events list */}
              <div className="flex-1 overflow-y-auto p-1 space-y-1">
                {dayEvents.map((event) => {
                  const category = event.categoryId ? categories[event.categoryId] : null;
                  const categoryColor = category?.color || '#9CA3AF';

                  return (
                    <div
                      key={event.id}
                      className="px-2 py-1 rounded text-xs bg-white border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      style={{
                        borderLeft: `3px solid ${categoryColor}`,
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
                      data-testid={`event-item-${event.id}`}
                    >
                      <div className="font-semibold text-gray-700">
                        {format(event.startTime, 'h:mm a')}
                      </div>
                      <div className="text-gray-600 truncate" title={event.title}>
                        {truncateText(event.title, 20)}
                      </div>
                    </div>
                  );
                })}
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
function arePropsEqual(prevProps: WeekViewProps, nextProps: WeekViewProps): boolean {
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
export const WeekView = memo(WeekViewComponent, arePropsEqual);

export default WeekView;
