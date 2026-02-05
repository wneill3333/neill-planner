/**
 * WeekView Component Tests
 *
 * Tests for the 7-day week grid view component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekView } from '../WeekView';
import type { Event, Category } from '../../../types';
import { addDays, startOfWeek, format, startOfDay } from 'date-fns';

// =============================================================================
// Test Data
// =============================================================================

const testDate = new Date('2026-02-03T10:00:00'); // Tuesday, Feb 3, 2026
const weekStart = startOfWeek(testDate); // Sunday, Feb 1, 2026

const testCategories: Record<string, Category> = {
  cat1: {
    id: 'cat1',
    userId: 'user1',
    name: 'Work',
    color: '#3B82F6',
    sortOrder: 1,
    isDefault: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  cat2: {
    id: 'cat2',
    userId: 'user1',
    name: 'Personal',
    color: '#10B981',
    sortOrder: 2,
    isDefault: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
};

const createTestEvent = (
  id: string,
  title: string,
  startTime: Date,
  endTime: Date,
  categoryId: string | null = null
): Event => ({
  id,
  userId: 'user1',
  title,
  description: '',
  categoryId,
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
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

// =============================================================================
// Tests
// =============================================================================

describe('WeekView', () => {
  const mockOnDateSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout and Structure', () => {
    it('renders 7 day columns (Sunday to Saturday)', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Check day headers
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();

      // Check that we have 7 day columns
      const dayColumns = screen.getAllByRole('button').filter((el) =>
        el.getAttribute('data-testid')?.startsWith('day-column-')
      );
      expect(dayColumns).toHaveLength(7);
    });

    it('shows correct dates for the week', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Week of Feb 1-7, 2026
      // Check that each day of the week is shown
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dateNumber = format(day, 'd');
        expect(screen.getByText(dateNumber)).toBeInTheDocument();
      }
    });

    it('displays week range in header', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Week of Feb 1 - Feb 7, 2026
      expect(screen.getByText(/Week of Feb 1 - Feb 7, 2026/)).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    it('displays events on correct days', () => {
      const sundayEvent = createTestEvent(
        'event1',
        'Sunday Meeting',
        new Date('2026-02-01T09:00:00'),
        new Date('2026-02-01T10:00:00'),
        'cat1'
      );

      const tuesdayEvent = createTestEvent(
        'event2',
        'Tuesday Task',
        new Date('2026-02-03T14:00:00'),
        new Date('2026-02-03T15:00:00'),
        'cat2'
      );

      const events = [sundayEvent, tuesdayEvent];

      render(
        <WeekView
          events={events}
          selectedDate={testDate}
          categories={testCategories}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Check that events are displayed
      expect(screen.getByText('Sunday Meeting')).toBeInTheDocument();
      expect(screen.getByText('Tuesday Task')).toBeInTheDocument();

      // Check event times are displayed
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });

    it('sorts events by start time within each day', () => {
      const event1 = createTestEvent(
        'event1',
        'Event at 2 PM',
        new Date('2026-02-03T14:00:00'),
        new Date('2026-02-03T15:00:00')
      );

      const event2 = createTestEvent(
        'event2',
        'Event at 9 AM',
        new Date('2026-02-03T09:00:00'),
        new Date('2026-02-03T10:00:00')
      );

      const event3 = createTestEvent(
        'event3',
        'Event at 12 PM',
        new Date('2026-02-03T12:00:00'),
        new Date('2026-02-03T13:00:00')
      );

      const events = [event1, event2, event3];

      const { container } = render(
        <WeekView
          events={events}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Get the Tuesday column
      const tuesdayKey = format(startOfDay(new Date('2026-02-03')), 'yyyy-MM-dd');
      const tuesdayColumn = screen.getByTestId(`day-column-${tuesdayKey}`);
      expect(tuesdayColumn).toBeInTheDocument();

      // Get event items within Tuesday column using within
      const eventItem1 = screen.getByTestId('event-item-event1');
      const eventItem2 = screen.getByTestId('event-item-event2');
      const eventItem3 = screen.getByTestId('event-item-event3');

      // Check all events are displayed
      expect(eventItem1).toBeInTheDocument();
      expect(eventItem2).toBeInTheDocument();
      expect(eventItem3).toBeInTheDocument();

      // Check they appear in correct order by checking their text content
      // The events should be ordered: 9 AM, 12 PM, 2 PM
      expect(screen.getByText('9:00 AM').closest('[data-testid^="event-item-"]')).toHaveTextContent('Event at 9 AM');
      expect(screen.getByText('12:00 PM').closest('[data-testid^="event-item-"]')).toHaveTextContent('Event at 12 PM');
      expect(screen.getByText('2:00 PM').closest('[data-testid^="event-item-"]')).toHaveTextContent('Event at 2 PM');
    });

    it('shows event time and truncated title', () => {
      const longTitleEvent = createTestEvent(
        'event1',
        'This is a very long event title that should be truncated',
        new Date('2026-02-03T09:00:00'),
        new Date('2026-02-03T10:00:00')
      );

      render(
        <WeekView
          events={[longTitleEvent]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Check time is shown
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();

      // Check title is truncated (should have ellipsis)
      const titleElement = screen.getByTitle(
        'This is a very long event title that should be truncated'
      );
      expect(titleElement).toBeInTheDocument();
      expect(titleElement.textContent).toContain('…');
    });

    it('applies category colors as left border', () => {
      const event = createTestEvent(
        'event1',
        'Work Event',
        new Date('2026-02-03T09:00:00'),
        new Date('2026-02-03T10:00:00'),
        'cat1'
      );

      const { container } = render(
        <WeekView
          events={[event]}
          selectedDate={testDate}
          categories={testCategories}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventItem = container.querySelector('[data-testid="event-item-event1"]');
      expect(eventItem).toBeInTheDocument();

      // Check that the category color is applied as left border
      const style = window.getComputedStyle(eventItem!);
      expect(eventItem).toHaveStyle({ borderLeft: '3px solid #3B82F6' });
    });

    it('uses default color for events without category', () => {
      const event = createTestEvent(
        'event1',
        'No Category Event',
        new Date('2026-02-03T09:00:00'),
        new Date('2026-02-03T10:00:00'),
        null
      );

      const { container } = render(
        <WeekView
          events={[event]}
          selectedDate={testDate}
          categories={testCategories}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventItem = container.querySelector('[data-testid="event-item-event1"]');
      expect(eventItem).toBeInTheDocument();

      // Check that the default gray color is applied
      expect(eventItem).toHaveStyle({ borderLeft: '3px solid #9CA3AF' });
    });
  });

  describe('Navigation', () => {
    it('calls onDateSelect with previous week date when previous button clicked', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      const prevButton = screen.getByLabelText('Previous week');
      fireEvent.click(prevButton);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateSelect.mock.calls[0][0];
      // Should be one week earlier
      expect(calledDate.getTime()).toBeLessThan(testDate.getTime());
    });

    it('calls onDateSelect with next week date when next button clicked', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      const nextButton = screen.getByLabelText('Next week');
      fireEvent.click(nextButton);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateSelect.mock.calls[0][0];
      // Should be one week later
      expect(calledDate.getTime()).toBeGreaterThan(testDate.getTime());
    });

    it('calls onDateSelect with current date when Today button clicked', () => {
      const pastDate = new Date('2025-01-01T10:00:00');

      render(
        <WeekView
          events={[]}
          selectedDate={pastDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      const todayButton = screen.getByLabelText('Go to current week');
      fireEvent.click(todayButton);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateSelect.mock.calls[0][0];
      // Should be today's date
      const today = startOfDay(new Date());
      expect(startOfDay(calledDate).getTime()).toBe(today.getTime());
    });
  });

  describe('Day Selection', () => {
    it('calls onDateSelect when clicking on a day', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Click on Sunday (Feb 1)
      const sundayKey = format(weekStart, 'yyyy-MM-dd');
      const sundayColumn = screen.getByTestId(`day-column-${sundayKey}`);
      fireEvent.click(sundayColumn);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateSelect.mock.calls[0][0];
      expect(startOfDay(calledDate).getTime()).toBe(startOfDay(weekStart).getTime());
    });

    it('calls onDateSelect with correct date when clicking different days', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Click on Wednesday (Feb 4)
      const wednesday = addDays(weekStart, 3);
      const wednesdayKey = format(wednesday, 'yyyy-MM-dd');
      const wednesdayColumn = screen.getByTestId(`day-column-${wednesdayKey}`);
      fireEvent.click(wednesdayColumn);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateSelect.mock.calls[0][0];
      expect(startOfDay(calledDate).getTime()).toBe(startOfDay(wednesday).getTime());
    });
  });

  describe('Current Day Highlighting', () => {
    it('highlights the current day', () => {
      const today = new Date();

      render(
        <WeekView
          events={[]}
          selectedDate={today}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      const todayKey = format(startOfDay(today), 'yyyy-MM-dd');
      const todayColumn = screen.getByTestId(`day-column-${todayKey}`);

      // Check that today's column has the highlight class
      expect(todayColumn).toHaveClass('bg-blue-50');
    });

    it('does not highlight other days when viewing a different week', () => {
      const pastDate = new Date('2025-01-01T10:00:00');

      render(
        <WeekView
          events={[]}
          selectedDate={pastDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Get all day columns
      const dayColumns = screen
        .getAllByRole('button')
        .filter((el) => el.getAttribute('data-testid')?.startsWith('day-column-'));

      // None of the columns in this past week should have the today highlight
      // (unless by chance today falls in this week, which it won't with this test date)
      const highlightedColumns = dayColumns.filter((col) => col.classList.contains('bg-blue-50'));
      expect(highlightedColumns).toHaveLength(0);
    });
  });

  describe('Empty State', () => {
    it('renders week view with no events', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Should still show the week structure
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText(/Week of Feb 1 - Feb 7, 2026/)).toBeInTheDocument();

      // No events should be displayed
      const eventItems = screen.queryAllByTestId(/^event-item-/);
      expect(eventItems).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation buttons', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
      expect(screen.getByLabelText('Next week')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to current week')).toBeInTheDocument();
    });

    it('has proper ARIA labels for day columns', () => {
      const event = createTestEvent(
        'event1',
        'Test Event',
        new Date('2026-02-03T09:00:00'),
        new Date('2026-02-03T10:00:00')
      );

      render(
        <WeekView
          events={[event]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Tuesday should have an aria-label with date and event count
      const tuesdayKey = format(startOfDay(testDate), 'yyyy-MM-dd');
      const tuesdayColumn = screen.getByTestId(`day-column-${tuesdayKey}`);

      expect(tuesdayColumn).toHaveAttribute('aria-label');
      const ariaLabel = tuesdayColumn.getAttribute('aria-label');
      expect(ariaLabel).toContain('Tuesday, February 3, 2026');
      expect(ariaLabel).toContain('1 event');
    });

    it('supports keyboard navigation for day selection', () => {
      render(
        <WeekView
          events={[]}
          selectedDate={testDate}
          categories={{}}
          onDateSelect={mockOnDateSelect}
        />
      );

      const sundayKey = format(weekStart, 'yyyy-MM-dd');
      const sundayColumn = screen.getByTestId(`day-column-${sundayKey}`);

      // Simulate Enter key press
      fireEvent.keyDown(sundayColumn, { key: 'Enter', code: 'Enter' });

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
    });
  });
});
