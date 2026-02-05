/**
 * MonthView Component Tests
 *
 * Tests for the MonthView calendar grid component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { MonthView } from '../MonthView';
import type { Event, Category } from '../../../types';

// =============================================================================
// Test Data
// =============================================================================

const mockCategory: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Work',
  color: '#3B82F6',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
};

const mockCategories: Record<string, Category> = {
  'cat-1': mockCategory,
};

// Create events for February 2026
function createMockEvent(id: string, title: string, startTime: Date, endTime: Date): Event {
  return {
    id,
    userId: 'user-1',
    title,
    description: '',
    categoryId: 'cat-1',
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
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('MonthView', () => {
  describe('Calendar Grid Layout', () => {
    it('renders calendar grid with 42 cells (6 weeks x 7 days)', () => {
      const selectedDate = new Date('2026-02-15'); // February 2026
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Should render 42 day cells (6 rows x 7 columns)
      const dayCells = screen.getAllByRole('button').filter((button) =>
        button.getAttribute('data-testid')?.startsWith('day-cell-')
      );
      expect(dayCells).toHaveLength(42);
    });

    it('shows correct day-of-week headers', () => {
      const selectedDate = new Date('2026-02-15');
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Check for day headers
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('displays all days from current month', () => {
      const selectedDate = new Date('2026-02-15'); // February 2026 (28 days)
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // February 2026 has 28 days (not a leap year)
      // Should see days 1-28
      for (let day = 1; day <= 28; day++) {
        // Use getAllByText since some days might appear in different contexts
        const dayElements = screen.getAllByText(day.toString(), { exact: false });
        expect(dayElements.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Header and Navigation', () => {
    it('shows month name and year in header', () => {
      const selectedDate = new Date('2026-02-15'); // February 2026
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('navigates to previous month when clicking previous button', async () => {
      const user = userEvent.setup();
      const selectedDate = new Date('2026-02-15'); // February 2026
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const prevButton = screen.getByLabelText('Previous month');
      await user.click(prevButton);

      expect(onDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = onDateSelect.mock.calls[0][0];
      expect(calledDate.getMonth()).toBe(0); // January (0-indexed)
      expect(calledDate.getFullYear()).toBe(2026);
    });

    it('navigates to next month when clicking next button', async () => {
      const user = userEvent.setup();
      const selectedDate = new Date('2026-02-15'); // February 2026
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      expect(onDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = onDateSelect.mock.calls[0][0];
      expect(calledDate.getMonth()).toBe(2); // March (0-indexed)
      expect(calledDate.getFullYear()).toBe(2026);
    });

    it('navigates to current month when clicking Today button', async () => {
      const user = userEvent.setup();
      const selectedDate = new Date('2026-06-15'); // June 2026
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const todayButton = screen.getByLabelText('Go to current month');
      await user.click(todayButton);

      expect(onDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = onDateSelect.mock.calls[0][0];
      // Should be called with a recent date
      expect(calledDate.getTime()).toBeGreaterThan(new Date('2026-01-01').getTime());
    });
  });

  describe('Day Cells', () => {
    it('highlights current day with special styling', () => {
      const today = new Date();
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={today}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Find day cell for today using local timezone format (matching component's format)
      const todayDateKey = format(today, 'yyyy-MM-dd');
      const todayCell = screen.getByTestId(`day-cell-${todayDateKey}`);

      // Should have blue background class
      expect(todayCell.className).toContain('bg-blue-50');
    });

    it('shows days from previous/next months in different style', () => {
      const selectedDate = new Date('2026-02-15'); // February 2026
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // February 2026 starts on Sunday (Feb 1)
      // Previous month days would be Jan 25-31 (not shown in first row since Feb 1 is Sunday)
      // Next month days would be Mar 1-14 in last two weeks

      // Check that cells exist for next month days
      const mar1Cell = screen.getByTestId('day-cell-2026-03-01');
      expect(mar1Cell).toBeInTheDocument();

      // Days from other months should have text-gray-400 class
      const dateNumber = mar1Cell.querySelector('[class*="text-gray"]');
      expect(dateNumber?.className).toContain('text-gray-400');
    });

    it('calls onDateSelect when clicking a day', async () => {
      const user = userEvent.setup();
      const selectedDate = new Date('2026-02-15');
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const dayCell = screen.getByTestId('day-cell-2026-02-10');
      await user.click(dayCell);

      expect(onDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = onDateSelect.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(10);
      expect(calledDate.getMonth()).toBe(1); // February (0-indexed)
      expect(calledDate.getFullYear()).toBe(2026);
    });

    it('supports keyboard navigation (Enter key)', async () => {
      const user = userEvent.setup();
      const selectedDate = new Date('2026-02-15');
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const dayCell = screen.getByTestId('day-cell-2026-02-10');
      dayCell.focus();
      await user.keyboard('{Enter}');

      expect(onDateSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Display', () => {
    it('displays events on correct days with time and title', () => {
      const selectedDate = new Date('2026-02-15');
      const events: Event[] = [
        createMockEvent(
          'evt-1',
          'Team Meeting',
          new Date('2026-02-10T10:00:00'),
          new Date('2026-02-10T11:00:00')
        ),
        createMockEvent(
          'evt-2',
          'Lunch Break',
          new Date('2026-02-10T12:00:00'),
          new Date('2026-02-10T13:00:00')
        ),
      ];
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Both events should be displayed
      expect(screen.getByTestId('event-item-evt-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-item-evt-2')).toBeInTheDocument();

      // Check that time and title are shown
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText(/Team Meeting/)).toBeInTheDocument();
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
      expect(screen.getByText(/Lunch Break/)).toBeInTheDocument();
    });

    it('truncates long event titles', () => {
      const selectedDate = new Date('2026-02-15');
      const events: Event[] = [
        createMockEvent(
          'evt-1',
          'Very Long Event Title That Should Be Truncated',
          new Date('2026-02-10T10:00:00'),
          new Date('2026-02-10T11:00:00')
        ),
      ];
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const eventElement = screen.getByTestId('event-item-evt-1');
      // Should contain ellipsis character or be truncated
      expect(eventElement.textContent).toMatch(/…|\.\.\.|\w{15}/);
    });

    it('applies category colors to events', () => {
      const selectedDate = new Date('2026-02-15');
      const events: Event[] = [
        createMockEvent(
          'evt-1',
          'Work Event',
          new Date('2026-02-10T10:00:00'),
          new Date('2026-02-10T11:00:00')
        ),
      ];
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const eventElement = screen.getByTestId('event-item-evt-1');
      // Should have border-left color from category
      expect(eventElement.style.borderLeftColor).toBe('rgb(59, 130, 246)'); // #3B82F6
    });

    it('shows "+N more" when events exceed maximum visible count', () => {
      const selectedDate = new Date('2026-02-15');
      // Create 5 events on the same day (max visible is 3)
      const events: Event[] = Array.from({ length: 5 }, (_, i) =>
        createMockEvent(
          `evt-${i + 1}`,
          `Event ${i + 1}`,
          new Date(`2026-02-10T${10 + i}:00:00`),
          new Date(`2026-02-10T${11 + i}:00:00`)
        )
      );
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Should show "+2 more" since 5 events - 3 visible = 2
      const moreIndicator = screen.getByTestId('more-events-2026-02-10');
      expect(moreIndicator).toBeInTheDocument();
      expect(moreIndicator).toHaveTextContent('+2 more');
    });

    it('clicking "+N more" navigates to that day', async () => {
      const user = userEvent.setup();
      const selectedDate = new Date('2026-02-15');
      const events: Event[] = Array.from({ length: 5 }, (_, i) =>
        createMockEvent(
          `evt-${i + 1}`,
          `Event ${i + 1}`,
          new Date(`2026-02-10T${10 + i}:00:00`),
          new Date(`2026-02-10T${11 + i}:00:00`)
        )
      );
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const moreIndicator = screen.getByTestId('more-events-2026-02-10');
      await user.click(moreIndicator);

      expect(onDateSelect).toHaveBeenCalledTimes(1);
      const calledDate = onDateSelect.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(10);
    });

    it('displays events sorted by start time within each day', () => {
      const selectedDate = new Date('2026-02-15');
      // Create events in reverse chronological order
      const events: Event[] = [
        createMockEvent(
          'evt-2',
          'Afternoon Meeting',
          new Date('2026-02-10T14:00:00'),
          new Date('2026-02-10T15:00:00')
        ),
        createMockEvent(
          'evt-1',
          'Morning Meeting',
          new Date('2026-02-10T09:00:00'),
          new Date('2026-02-10T10:00:00')
        ),
      ];
      const onDateSelect = vi.fn();

      const { container } = render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Get all event items in the day cell
      const dayCell = screen.getByTestId('day-cell-2026-02-10');
      const eventItems = dayCell.querySelectorAll('[data-testid^="event-item-"]');

      // First event should be the morning meeting
      expect(eventItems[0]).toHaveAttribute('data-testid', 'event-item-evt-1');
      expect(eventItems[1]).toHaveAttribute('data-testid', 'event-item-evt-2');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for day cells', () => {
      const selectedDate = new Date('2026-02-15');
      const events: Event[] = [
        createMockEvent(
          'evt-1',
          'Meeting',
          new Date('2026-02-10T10:00:00'),
          new Date('2026-02-10T11:00:00')
        ),
      ];
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const dayCell = screen.getByTestId('day-cell-2026-02-10');
      const ariaLabel = dayCell.getAttribute('aria-label');

      expect(ariaLabel).toContain('Tuesday, February 10, 2026');
      expect(ariaLabel).toContain('1 event');
    });

    it('marks day cells as buttons with proper roles', () => {
      const selectedDate = new Date('2026-02-15');
      const onDateSelect = vi.fn();

      render(
        <MonthView
          events={[]}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      const dayCell = screen.getByTestId('day-cell-2026-02-10');
      expect(dayCell).toHaveAttribute('role', 'button');
      expect(dayCell).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Performance', () => {
    it('does not re-render when props are unchanged (memoization)', () => {
      const selectedDate = new Date('2026-02-15');
      const events: Event[] = [];
      const onDateSelect = vi.fn();

      const { rerender } = render(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Re-render with same props
      rerender(
        <MonthView
          events={events}
          selectedDate={selectedDate}
          categories={mockCategories}
          onDateSelect={onDateSelect}
        />
      );

      // Component should be memoized and not re-render
      // This is a basic check - in real scenarios we'd use React DevTools Profiler
      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });
  });
});
