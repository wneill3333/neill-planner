/**
 * TimeBlockCalendar Component
 *
 * Displays events as time blocks in a vertical hourly calendar view.
 * Features:
 * - 6 AM to 10 PM time slots (16 hours)
 * - Events positioned by start time, sized by duration
 * - Overlapping events displayed side-by-side
 * - Click empty area to create event
 * - Drag events vertically to change start time (5-minute snapping)
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
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
  /** Callback when dragging an event to change its time */
  onEventTimeChange?: (event: Event, newStartTime: Date, newEndTime: Date) => void;
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

const HOUR_HEIGHT = 80; // pixels per hour (increased for readability)
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM (22:00)
const TOTAL_HOURS = END_HOUR - START_HOUR; // 16 hours
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
const TIME_SNAP_MINUTES = 5; // Snap to 5-minute intervals

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
 * Round time to nearest interval (default 5 minutes)
 */
function roundToNearestInterval(date: Date, intervalMinutes: number = TIME_SNAP_MINUTES): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
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
function calculateEventPositions(events: Event[], categories: Record<string, Category>, selectedDate: Date): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const positioned: PositionedEvent[] = [];
  const dayStart = setHours(setMinutes(startOfDay(selectedDate), 0), START_HOUR);

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
// Draggable Event Block Component
// =============================================================================

interface DraggableEventBlockProps {
  event: Event;
  top: number;
  height: number;
  left: string;
  width: string;
  categoryColor: string;
  textColor: string;
  category?: Category | null;
  onEventClick: (event: Event) => void;
  isDraggingEnabled: boolean;
}

/**
 * DraggableEventBlock - Individual event block with drag functionality
 */
function DraggableEventBlock({
  event,
  top,
  height,
  left,
  width,
  categoryColor,
  textColor,
  category,
  onEventClick,
  isDraggingEnabled,
}: DraggableEventBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    disabled: !isDraggingEnabled,
    data: {
      event,
      originalTop: top,
    },
  });

  const style = {
    top: `${top}px`,
    height: `${Math.max(height, 20)}px`,
    left,
    width: `calc(${width} - 4px)`,
    backgroundColor: categoryColor,
    color: textColor,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDraggingEnabled ? 'grab' : 'pointer',
    zIndex: isDragging ? 1000 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      data-event-block
      className="absolute px-2 py-1 rounded shadow-sm border border-opacity-20 border-black hover:shadow-md transition-shadow overflow-hidden"
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onEventClick(event);
        }
      }}
      onDoubleClick={(e) => {
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
  onEventTimeChange,
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
    () => calculateEventPositions(events, categories, selectedDate),
    [events, categories, selectedDate]
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
      const roundedTime = roundToNearestInterval(clickedTime);
      const endTime = addMinutes(roundedTime, 60); // Default 1-hour duration

      onCreateEvent(roundedTime, endTime);
    },
    [selectedDate, onCreateEvent]
  );

  // Handle drag end to update event time
  const handleDragEnd = useCallback(
    (dragEvent: DragEndEvent) => {
      if (!onEventTimeChange) return;

      const { active, delta } = dragEvent;
      const { event, originalTop } = active.data.current as { event: Event; originalTop: number };

      // Calculate new position based on drag delta
      const newTop = originalTop + delta.y;
      const minutesFromStart = Math.floor(newTop / PIXELS_PER_MINUTE);

      // Use the EVENT's original date to preserve the day (not selectedDate which may differ)
      const dayStart = setHours(setMinutes(startOfDay(event.startTime), 0), START_HOUR);
      const newStartTime = roundToNearestInterval(addMinutes(dayStart, minutesFromStart));

      // Preserve event duration
      const duration = differenceInMinutes(event.endTime, event.startTime);
      const newEndTime = addMinutes(newStartTime, duration);

      // Only update if the time actually changed
      if (newStartTime.getTime() !== event.startTime.getTime()) {
        onEventTimeChange(event, newStartTime, newEndTime);
      }
    },
    [onEventTimeChange]
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
    <DndContext onDragEnd={handleDragEnd}>
      {/* Single scroll container so time labels and calendar grid scroll together */}
      <div className="h-full overflow-y-auto">
        <div className="flex" style={{ height: `${CALENDAR_HEIGHT}px` }}>
          {/* Time labels column */}
          <div className="flex-shrink-0 w-20 border-r border-gray-200 bg-gray-50">
            {timeSlots.map(({ hour, label }) => (
              <div
                key={hour}
                className="relative text-sm font-medium text-gray-700 text-right pr-3"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute top-0 right-3 -translate-y-1/2 bg-gray-50 px-1">{label}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            className="flex-1 relative cursor-pointer"
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
                <DraggableEventBlock
                  key={event.id}
                  event={event}
                  top={top}
                  height={height}
                  left={left}
                  width={width}
                  categoryColor={categoryColor}
                  textColor={textColor}
                  category={category}
                  onEventClick={onEventClick}
                  isDraggingEnabled={!!onEventTimeChange}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DndContext>
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
    prevProps.onEventClick === nextProps.onEventClick &&
    prevProps.onEventTimeChange === nextProps.onEventTimeChange
  );
}

// Export memoized component
export const TimeBlockCalendar = memo(TimeBlockCalendarComponent, arePropsEqual);

export default TimeBlockCalendar;
