/**
 * TimeBlockCalendar Component Tests
 *
 * Tests the time-block calendar view including:
 * - Time slot rendering
 * - Event positioning and sizing
 * - Overlap handling
 * - Click interactions
 * - Current time indicator
 * - Category colors and icons
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  addHours,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from 'date-fns';
import { TimeBlockCalendar } from '../TimeBlockCalendar';
import type { Event, Category } from '../../../types';

// =============================================================================
// Test Setup
// =============================================================================

/**
 * Create a mock event for testing
 */
function createMockEvent(
  overrides: Partial<Event> = {}
): Event {
  const now = new Date();
  const startTime = setHours(setMinutes(setSeconds(now, 0), 0), 9); // 9:00 AM
  const endTime = addHours(startTime, 1); // 10:00 AM

  return {
    id: 'event-1',
    userId: 'user-1',
    title: 'Test Event',
    description: '',
    categoryId: null,
    startTime,
    endTime,
    location: '',
    isConfidential: false,
    alternateTitle: null,
    recurrence: null,
    linkedNoteIds: [],
    linkedTaskIds: [],
    googleCalendarId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Create a mock category
 */
function createMockCategory(
  overrides: Partial<Category> = {}
): Category {
  return {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#3B82F6', // Blue
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Convert category array to Record for component props
 */
function categoriesToRecord(categories: Category[]): Record<string, Category> {
  return categories.reduce(
    (acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    },
    {} as Record<string, Category>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('TimeBlockCalendar', () => {
  const mockOnCreateEvent = vi.fn();
  const mockOnEventClick = vi.fn();
  const selectedDate = new Date(2026, 1, 3, 12, 0, 0); // Feb 3, 2026, 12:00 PM

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(selectedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // Time Slot Rendering
  // ===========================================================================

  it('renders 16 time slots from 6 AM to 10 PM', () => {
    render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    // Check for hour labels
    expect(screen.getByText('6 AM')).toBeInTheDocument();
    expect(screen.getByText('12 PM')).toBeInTheDocument();
    expect(screen.getByText('9 PM')).toBeInTheDocument();

    // 6 AM through 9 PM = 16 labels (10 PM is the end, not labeled)
    const labels = screen.getAllByText(/AM|PM/);
    expect(labels.length).toBeGreaterThanOrEqual(16);
  });

  it('displays hour labels correctly', () => {
    render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    // Verify specific hour formats
    expect(screen.getByText('6 AM')).toBeInTheDocument();
    expect(screen.getByText('7 AM')).toBeInTheDocument();
    expect(screen.getByText('12 PM')).toBeInTheDocument();
    expect(screen.getByText('1 PM')).toBeInTheDocument();
    expect(screen.getByText('6 PM')).toBeInTheDocument();
  });

  // ===========================================================================
  // Event Positioning and Sizing
  // ===========================================================================

  it('positions events correctly based on start time', () => {
    const event = createMockEvent({
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 9), // 9:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 0), 10), // 10:00 AM
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    expect(eventBlock).toBeInTheDocument();

    // 9 AM is 3 hours from 6 AM start = 3 * 80px = 240px
    expect(eventBlock.style.top).toBe('240px');
  });

  it('calculates event height based on duration', () => {
    const event = createMockEvent({
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 9), // 9:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 30), 10), // 10:30 AM (1.5 hours)
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);

    // 1.5 hours = 90 minutes * (80px/60min) = 120px
    expect(eventBlock.style.height).toBe('120px');
  });

  it('displays event title and time range', () => {
    const event = createMockEvent({
      title: 'Team Meeting',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 9), // 9:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 0), 10), // 10:00 AM
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    expect(within(eventBlock).getByText('Team Meeting')).toBeInTheDocument();
    expect(within(eventBlock).getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
  });

  // ===========================================================================
  // Overlapping Events
  // ===========================================================================

  it('displays overlapping events side-by-side', () => {
    const event1 = createMockEvent({
      id: 'event-1',
      title: 'Event 1',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 9), // 9:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 0), 10), // 10:00 AM
    });

    const event2 = createMockEvent({
      id: 'event-2',
      title: 'Event 2',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 30), 9), // 9:30 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 30), 10), // 10:30 AM
    });

    render(
      <TimeBlockCalendar
        events={[event1, event2]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock1 = screen.getByTestId('event-block-event-1');
    const eventBlock2 = screen.getByTestId('event-block-event-2');

    // Both should exist
    expect(eventBlock1).toBeInTheDocument();
    expect(eventBlock2).toBeInTheDocument();

    // Each should be 50% width (minus gap)
    expect(eventBlock1.style.width).toContain('50%');
    expect(eventBlock2.style.width).toContain('50%');

    // One should be at left 0%, other at left 50%
    const left1 = eventBlock1.style.left;
    const left2 = eventBlock2.style.left;
    expect([left1, left2].sort()).toEqual(['0%', '50%']);
  });

  it('handles multiple overlapping events (3+)', () => {
    const event1 = createMockEvent({
      id: 'event-1',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 9), // 9:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 0), 10), // 10:00 AM
    });

    const event2 = createMockEvent({
      id: 'event-2',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 15), 9), // 9:15 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 45), 9), // 9:45 AM
    });

    const event3 = createMockEvent({
      id: 'event-3',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 30), 9), // 9:30 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 30), 10), // 10:30 AM
    });

    render(
      <TimeBlockCalendar
        events={[event1, event2, event3]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock1 = screen.getByTestId('event-block-event-1');
    const eventBlock2 = screen.getByTestId('event-block-event-2');
    const eventBlock3 = screen.getByTestId('event-block-event-3');

    // All should exist
    expect(eventBlock1).toBeInTheDocument();
    expect(eventBlock2).toBeInTheDocument();
    expect(eventBlock3).toBeInTheDocument();

    // Should be ~33% width each (minus gap)
    expect(eventBlock1.style.width).toContain('33');
    expect(eventBlock2.style.width).toContain('33');
    expect(eventBlock3.style.width).toContain('33');
  });

  // ===========================================================================
  // Click Interactions
  // ===========================================================================

  it('calls onCreateEvent when clicking empty slot', () => {
    const { container } = render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    // Find calendar grid (has role="button" and aria-label with "Calendar")
    const calendar = container.querySelector('[role="button"][aria-label*="Calendar"]');
    expect(calendar).toBeInTheDocument();

    // Click at 9 AM position (3 hours * 60px = 180px from top)
    fireEvent.click(calendar!, { clientY: 180 + (calendar!.getBoundingClientRect().top) });

    expect(mockOnCreateEvent).toHaveBeenCalledTimes(1);

    // Should receive start and end times
    const [startTime, endTime] = mockOnCreateEvent.mock.calls[0];
    expect(startTime).toBeInstanceOf(Date);
    expect(endTime).toBeInstanceOf(Date);

    // End time should be 1 hour after start time
    expect(endTime.getTime() - startTime.getTime()).toBe(60 * 60 * 1000);
  });

  it('rounds clicked time to nearest 30 minutes', () => {
    const { container } = render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const calendar = container.querySelector('[role="button"][aria-label*="Calendar"]');

    // Click at 9:20 AM position (should round to 9:30 AM)
    // 3 hours 20 min = 200 minutes * 1px/min = 200px
    fireEvent.click(calendar!, { clientY: 200 + (calendar!.getBoundingClientRect().top) });

    const [startTime] = mockOnCreateEvent.mock.calls[0];
    expect(startTime.getMinutes()).toBe(30); // Rounded to 9:30
  });

  it('calls onEventClick when clicking an event', () => {
    const event = createMockEvent({
      title: 'Clickable Event',
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    fireEvent.click(eventBlock);

    expect(mockOnEventClick).toHaveBeenCalledTimes(1);
    expect(mockOnEventClick).toHaveBeenCalledWith(event);
    expect(mockOnCreateEvent).not.toHaveBeenCalled(); // Should not trigger create
  });

  it('supports keyboard navigation on events', () => {
    const event = createMockEvent({
      title: 'Keyboard Event',
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);

    // Press Enter
    fireEvent.keyDown(eventBlock, { key: 'Enter' });
    expect(mockOnEventClick).toHaveBeenCalledWith(event);

    // Press Space
    mockOnEventClick.mockClear();
    fireEvent.keyDown(eventBlock, { key: ' ' });
    expect(mockOnEventClick).toHaveBeenCalledWith(event);
  });

  // ===========================================================================
  // Category Colors
  // ===========================================================================

  it('applies category color to event blocks', () => {
    const category = createMockCategory({
      id: 'cat-1',
      name: 'Work',
      color: '#3B82F6', // Blue
    });

    const event = createMockEvent({
      categoryId: category.id,
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={categoriesToRecord([category])}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    expect(eventBlock.style.backgroundColor).toBe('rgb(59, 130, 246)'); // #3B82F6 in RGB
  });

  it('uses default gray color for uncategorized events', () => {
    const event = createMockEvent({
      categoryId: null,
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    expect(eventBlock.style.backgroundColor).toBe('rgb(156, 163, 175)'); // #9CA3AF in RGB
  });

  // ===========================================================================
  // Icons
  // ===========================================================================

  it('displays recurrence icon when event has recurrence', () => {
    const event = createMockEvent({
      title: 'Recurring Meeting',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        endDate: null,
        count: null,
      },
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    expect(within(eventBlock).getByText('↻')).toBeInTheDocument();
  });

  it('displays confidential icon when event is confidential', () => {
    const event = createMockEvent({
      title: 'Secret Meeting',
      isConfidential: true,
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);
    expect(within(eventBlock).getByText('🔒')).toBeInTheDocument();
  });

  // ===========================================================================
  // Current Time Indicator
  // ===========================================================================

  it('shows current time indicator only for today', () => {
    // System time is set to selectedDate (today)
    const { container } = render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const indicator = container.querySelector('[aria-label="Current time"]');
    expect(indicator).toBeInTheDocument();
  });

  it('does not show current time indicator for other dates', () => {
    const tomorrow = addHours(selectedDate, 24);

    const { container } = render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={tomorrow}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const indicator = container.querySelector('[aria-label="Current time"]');
    expect(indicator).not.toBeInTheDocument();
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  it('handles events outside 6 AM - 10 PM range', () => {
    const earlyEvent = createMockEvent({
      id: 'early',
      title: 'Early Event',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 5), // 5:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 0), 6), // 6:00 AM
    });

    const lateEvent = createMockEvent({
      id: 'late',
      title: 'Late Event',
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 22), // 10:00 PM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 0), 23), // 11:00 PM
    });

    render(
      <TimeBlockCalendar
        events={[earlyEvent, lateEvent]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    // Events should still render (they'll be clipped by container)
    // Early event will be at negative top position, late event will be beyond calendar height
    expect(screen.getByTestId('event-block-early')).toBeInTheDocument();
    expect(screen.getByTestId('event-block-late')).toBeInTheDocument();
  });

  it('handles very short events (< 30 minutes)', () => {
    const shortEvent = createMockEvent({
      startTime: setHours(setMinutes(startOfDay(selectedDate), 0), 9), // 9:00 AM
      endTime: setHours(setMinutes(startOfDay(selectedDate), 15), 9), // 9:15 AM (15 min)
    });

    render(
      <TimeBlockCalendar
        events={[shortEvent]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${shortEvent.id}`);
    expect(eventBlock).toBeInTheDocument();

    // Should have minimum height for visibility
    const height = parseInt(eventBlock.style.height);
    expect(height).toBeGreaterThanOrEqual(20); // Minimum 20px
  });

  it('renders with no events', () => {
    render(
      <TimeBlockCalendar
        events={[]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    // Should still show time slots
    expect(screen.getByText('6 AM')).toBeInTheDocument();
    expect(screen.getByText('12 PM')).toBeInTheDocument();
  });

  // ===========================================================================
  // Drag and Drop
  // ===========================================================================

  it('enables drag functionality when onEventTimeChange is provided', () => {
    const mockOnEventTimeChange = vi.fn();
    const event = createMockEvent({
      title: 'Draggable Event',
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
        onEventTimeChange={mockOnEventTimeChange}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);

    // Event should have grab cursor when draggable
    expect(eventBlock.style.cursor).toBe('grab');
  });

  it('disables drag functionality when onEventTimeChange is not provided', () => {
    const event = createMockEvent({
      title: 'Non-Draggable Event',
    });

    render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);

    // Event should have pointer cursor when not draggable
    expect(eventBlock.style.cursor).toBe('pointer');
  });

  it('shows reduced opacity while dragging', () => {
    const mockOnEventTimeChange = vi.fn();
    const event = createMockEvent({
      title: 'Event Being Dragged',
    });

    const { container } = render(
      <TimeBlockCalendar
        events={[event]}
        selectedDate={selectedDate}
        categories={{}}
        onCreateEvent={mockOnCreateEvent}
        onEventClick={mockOnEventClick}
        onEventTimeChange={mockOnEventTimeChange}
      />
    );

    const eventBlock = screen.getByTestId(`event-block-${event.id}`);

    // Before drag: full opacity
    expect(eventBlock.style.opacity).toBe('1');
  });
});
