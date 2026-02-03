/**
 * TimeBlockCalendar Component
 *
 * Displays events as time blocks in a vertical hourly calendar view.
 * Features:
 * - 6 AM to 10 PM time slots (16 hours)
 * - Events positioned by start time, sized by duration
 * - Overlapping events displayed side-by-side
 * - Click empty area to create event
 * - Current time indicator (red line, today only)
 * - Category colors with contrasting text
 * - Recurrence and confidential icons
 *
 * @module components/events/TimeBlockCalendar
 */

import { memo, useMemo, useEffect, useState, useCallback } from 'react';
import {
  startOfDay,
  addMinutes,
  differenceInMinutes,
  isSameDay,
  format,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns';
import type { Event, Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface TimeBlockCalendarProps {
  /** Events to display in the calendar */
  events: Event[];
  /** Selected date for the calendar view */
  selectedDate: Date;
  /** Categories for event color coding */
  categories?: Record<string, Category>;
  /** Callback when clicking empty slot to create event */
  onCreateEvent: (startTime: Date, endTime: Date) => void;
  /** Callback when clicking an event block */
  onEventClick: (event: Event) => void;
}

/**
 * Internal type for positioned event blocks
 */
interface PositionedEvent {
  event: Event;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
  category?: Category | null;
}

// =============================================================================
// Constants
// =============================================================================

const HOUR_HEIGHT = 60; // pixels per hour
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60; // 1px per minute
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM (22:00)
const TOTAL_HOURS = END_HOUR - START_HOUR; // 16 hours
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT; // 960px

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get contrasting text color (black or white) based on background color
 */
function getContrastingTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Round time to nearest 30 minutes
 */
function roundToNearest30Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 30) * 30;
  return setMinutes(setSeconds(setMilliseconds(date, 0), 0), roundedMinutes);
}

/**
 * Calculate position from day start in pixels
 */
function calculateTopPosition(time: Date, dayStart: Date): number {
  const minutesFromStart = differenceInMinutes(time, dayStart);
  return minutesFromStart * PIXELS_PER_MINUTE;
}

/**
 * Check if two events overlap
 */
function eventsOverlap(event1: Event, event2: Event): boolean {
  return event1.startTime < event2.endTime && event1.endTime > event2.startTime;
}

/**
 * Calculate column positions for overlapping events
 */
function calculateEventPositions(events: Event[], categories: Record<string, Category>): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const positioned: PositionedEvent[] = [];
  const dayStart = setHours(setMinutes(startOfDay(sortedEvents[0].startTime), 0), START_HOUR);

  for (const event of sortedEvents) {
    // Calculate basic position
    const top = calculateTopPosition(event.startTime, dayStart);
    const duration = differenceInMinutes(event.endTime, event.startTime);
    const height = duration * PIXELS_PER_MINUTE;

    // Find overlapping events
    const overlapping = positioned.filter((p) => eventsOverlap(p.event, event));

    // Determine column
    let column = 0;
    const usedColumns = new Set(overlapping.map((p) => p.column));
    while (usedColumns.has(column)) {
      column++;
    }

    // Calculate total columns needed
    const totalColumns = Math.max(column + 1, ...overlapping.map((p) => p.totalColumns));

    // Update total columns for overlapping events
    overlapping.forEach((p) => {
      p.totalColumns = totalColumns;
    });

    // Get category
    const category = event.categoryId ? categories[event.categoryId] : null;

    positioned.push({
      event,
      top,
      height,
      column,
      totalColumns,
      category,
    });
  }

  return positioned;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TimeBlockCalendar - Displays events in a vertical time-block view
 *
 * Shows a 6 AM to 10 PM timeline with events positioned as colored blocks.
 * Handles overlapping events by displaying them side-by-side.
 *
 * @param props - TimeBlockCalendarProps
 * @returns JSX element representing the time-block calendar
 */
function TimeBlockCalendarComponent({
  events,
  selectedDate,
  categories = {},
  onCreateEvent,
  onEventClick,
}: TimeBlockCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isToday = isSameDay(selectedDate, currentTime);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate positioned events
  const positionedEvents = useMemo(
    () => calculateEventPositions(events, categories),
    [events, categories]
  );

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    if (!isToday) return null;
    const dayStart = setHours(setMinutes(startOfDay(selectedDate), 0), START_HOUR);
    return calculateTopPosition(currentTime, dayStart);
  }, [isToday, currentTime, selectedDate]);

  // Handle calendar click to create event
  const handleCalendarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle clicks on the calendar itself, not on events
      if ((e.target as HTMLElement).closest('[data-event-block]')) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const minutesFromStart = Math.floor(clickY / PIXELS_PER_MINUTE);

      const dayStart = setHours(setMinutes(startOfDay(selectedDate), 0), START_HOUR);
      const clickedTime = addMinutes(dayStart, minutesFromStart);
      const roundedTime = roundToNearest30Minutes(clickedTime);
      const endTime = addMinutes(roundedTime, 60); // Default 1-hour duration

      onCreateEvent(roundedTime, endTime);
    },
    [selectedDate, onCreateEvent]
  );

  // Generate time slot labels
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push({
        hour,
        label: format(setHours(new Date(), hour), 'h a'),
      });
    }
    return slots;
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Time labels column */}
      <div className="flex-shrink-0 w-16 border-r border-gray-200">
        {timeSlots.map(({ hour, label }) => (
          <div
            key={hour}
            className="relative text-xs text-gray-500 text-right pr-2"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            <span className="absolute -top-2">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 relative overflow-y-auto">
        <div
          className="relative cursor-pointer"
          style={{ height: `${CALENDAR_HEIGHT}px` }}
          onClick={handleCalendarClick}
          role="button"
          tabIndex={0}
          aria-label={`Calendar for ${format(selectedDate, 'MMMM d, yyyy')}. Click to create event.`}
        >
          {/* Hour grid lines */}
          {timeSlots.map(({ hour }) => (
            <div
              key={hour}
              className="absolute w-full border-t border-gray-200"
              style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* Current time indicator */}
          {isToday && currentTimePosition !== null && (
            <div
              className="absolute w-full border-t-2 border-red-500 z-20"
              style={{ top: `${currentTimePosition}px` }}
              aria-label="Current time"
            >
              <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          )}

          {/* Event blocks */}
          {positionedEvents.map(({ event, top, height, column, totalColumns, category }) => {
            const categoryColor = category?.color || '#9CA3AF';
            const textColor = getContrastingTextColor(categoryColor);
            const width = `${100 / totalColumns}%`;
            const left = `${(column * 100) / totalColumns}%`;

            return (
              <div
                key={event.id}
                data-event-block
                className="absolute px-2 py-1 rounded shadow-sm border border-opacity-20 border-black cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 20)}px`, // Minimum height for visibility
                  left,
                  width: `calc(${width} - 4px)`, // Small gap between columns
                  backgroundColor: categoryColor,
                  color: textColor,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onEventClick(event);
                  }
                }}
                aria-label={`Event: ${event.title}. ${format(event.startTime, 'h:mm a')} to ${format(event.endTime, 'h:mm a')}${category ? `. Category: ${category.name}` : ''}${event.recurrence ? '. Recurring' : ''}${event.isConfidential ? '. Confidential' : ''}`}
                data-testid={`event-block-${event.id}`}
              >
                <div className="text-xs font-semibold truncate">
                  {event.title}
                  {event.recurrence && (
                    <span className="ml-1" title="Recurring event" aria-label="Recurring">
                      ↻
                    </span>
                  )}
                  {event.isConfidential && (
                    <span className="ml-1" title="Confidential" aria-label="Confidential">
                      🔒
                    </span>
                  )}
                </div>
                {height >= 30 && (
                  <div className="text-xs opacity-90">
                    {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 * Only re-renders when relevant props change
 */
function arePropsEqual(
  prevProps: TimeBlockCalendarProps,
  nextProps: TimeBlockCalendarProps
): boolean {
  return (
    prevProps.events === nextProps.events &&
    prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
    prevProps.categories === nextProps.categories &&
    prevProps.onCreateEvent === nextProps.onCreateEvent &&
    prevProps.onEventClick === nextProps.onEventClick
  );
}

// Export memoized component
export const TimeBlockCalendar = memo(TimeBlockCalendarComponent, arePropsEqual);

export default TimeBlockCalendar;
