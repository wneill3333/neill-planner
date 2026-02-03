/**
 * DateNavigation Component Tests
 *
 * Comprehensive tests for the DateNavigation component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateNavigation } from '../DateNavigation';

// =============================================================================
// Test Setup
// =============================================================================

describe('DateNavigation', () => {
  // Mock current date to Feb 2, 2026 for consistent testing
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 2)); // Month is 0-indexed, so 1 = February
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render date navigation component', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-navigation')).toBeInTheDocument();
    });

    it('should render previous day button', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('previous-day-button')).toBeInTheDocument();
    });

    it('should render next day button', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('next-day-button')).toBeInTheDocument();
    });

    it('should render today button', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('today-button')).toBeInTheDocument();
    });

    it('should render date display', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-display')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const handleDateChange = vi.fn();
      render(
        <DateNavigation
          selectedDate="2026-02-02"
          onDateChange={handleDateChange}
          testId="custom-date-nav"
        />
      );

      expect(screen.getByTestId('custom-date-nav')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const handleDateChange = vi.fn();
      render(
        <DateNavigation
          selectedDate="2026-02-02"
          onDateChange={handleDateChange}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('date-navigation')).toHaveClass('custom-class');
    });
  });

  // =============================================================================
  // Date Display Tests
  // =============================================================================

  describe('Date Display', () => {
    it('should display formatted date', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-display')).toHaveTextContent('Monday, February 2, 2026');
    });

    it('should display different dates correctly', () => {
      const handleDateChange = vi.fn();
      const { rerender } = render(
        <DateNavigation selectedDate="2026-01-24" onDateChange={handleDateChange} />
      );

      expect(screen.getByTestId('date-display')).toHaveTextContent('Saturday, January 24, 2026');

      rerender(<DateNavigation selectedDate="2026-12-25" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-display')).toHaveTextContent('Friday, December 25, 2026');
    });

    it('should have aria-live for date updates', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const dateDisplay = screen.getByTestId('date-display');
      expect(dateDisplay).toHaveAttribute('aria-live', 'polite');
      expect(dateDisplay).toHaveAttribute('aria-atomic', 'true');
    });
  });

  // =============================================================================
  // Today Indicator Tests
  // =============================================================================

  describe('Today Indicator', () => {
    it('should show today indicator when today is selected', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const todayIndicator = screen.getByTestId('today-indicator');
      expect(todayIndicator).toBeInTheDocument();
      expect(todayIndicator).toHaveTextContent('Today');
    });

    it('should not show today indicator when other dates are selected', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />);

      expect(screen.queryByTestId('today-indicator')).not.toBeInTheDocument();
    });

    it('should apply amber styling to date display when today is selected', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const dateDisplay = screen.getByTestId('date-display');
      expect(dateDisplay).toHaveClass('text-amber-700');
      expect(dateDisplay).not.toHaveClass('text-gray-800');
    });

    it('should apply neutral styling to date display when other dates are selected', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />);

      const dateDisplay = screen.getByTestId('date-display');
      expect(dateDisplay).toHaveClass('text-gray-800');
      expect(dateDisplay).not.toHaveClass('text-amber-700');
    });

    it('should update today indicator when date changes to/from today', () => {
      const handleDateChange = vi.fn();
      const { rerender } = render(
        <DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />
      );

      // Should not show indicator for non-today date
      expect(screen.queryByTestId('today-indicator')).not.toBeInTheDocument();
      expect(screen.getByTestId('date-display')).toHaveClass('text-gray-800');

      // Rerender with today's date
      rerender(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      // Should show indicator for today
      expect(screen.getByTestId('today-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('date-display')).toHaveClass('text-amber-700');

      // Rerender with different date
      rerender(<DateNavigation selectedDate="2026-02-03" onDateChange={handleDateChange} />);

      // Should not show indicator again
      expect(screen.queryByTestId('today-indicator')).not.toBeInTheDocument();
      expect(screen.getByTestId('date-display')).toHaveClass('text-gray-800');
    });

    it('should have aria-label on today indicator', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const todayIndicator = screen.getByTestId('today-indicator');
      expect(todayIndicator).toHaveAttribute('aria-label', 'Today');
    });

    it('should apply amber badge styling to today indicator', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const todayIndicator = screen.getByTestId('today-indicator');
      expect(todayIndicator).toHaveClass('bg-amber-100');
      expect(todayIndicator).toHaveClass('text-amber-800');
      expect(todayIndicator).toHaveClass('border-amber-200');
      expect(todayIndicator).toHaveClass('rounded-full');
    });
  });

  // =============================================================================
  // Navigation Button Tests
  // =============================================================================

  describe('Navigation Buttons', () => {
    it('should call onDateChange with previous day when previous button clicked', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('previous-day-button'));

      expect(handleDateChange).toHaveBeenCalledTimes(1);
      expect(handleDateChange).toHaveBeenCalledWith('2026-02-01');
    });

    it('should call onDateChange with next day when next button clicked', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('next-day-button'));

      expect(handleDateChange).toHaveBeenCalledTimes(1);
      expect(handleDateChange).toHaveBeenCalledWith('2026-02-03');
    });

    it('should handle month boundaries when navigating backward', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('previous-day-button'));

      expect(handleDateChange).toHaveBeenCalledWith('2026-01-31');
    });

    it('should handle month boundaries when navigating forward', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-01-31" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('next-day-button'));

      expect(handleDateChange).toHaveBeenCalledWith('2026-02-01');
    });

    it('should handle year boundaries when navigating backward', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-01-01" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('previous-day-button'));

      expect(handleDateChange).toHaveBeenCalledWith('2025-12-31');
    });

    it('should handle year boundaries when navigating forward', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2025-12-31" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('next-day-button'));

      expect(handleDateChange).toHaveBeenCalledWith('2026-01-01');
    });
  });

  // =============================================================================
  // Today Button Tests
  // =============================================================================

  describe('Today Button', () => {
    it('should call onDateChange with today when today button clicked', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-01-24" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('today-button'));

      expect(handleDateChange).toHaveBeenCalledTimes(1);
      expect(handleDateChange).toHaveBeenCalledWith('2026-02-02'); // Mocked today
    });

    it('should disable today button when already on today', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const todayButton = screen.getByTestId('today-button');
      expect(todayButton).toBeDisabled();
    });

    it('should not disable today button when on a different date', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />);

      const todayButton = screen.getByTestId('today-button');
      expect(todayButton).not.toBeDisabled();
    });

    it('should not call onDateChange when today button clicked while disabled', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('today-button'));

      expect(handleDateChange).not.toHaveBeenCalled();
    });

    it('should update disabled state when date changes to/from today', () => {
      const handleDateChange = vi.fn();
      const { rerender } = render(
        <DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />
      );

      let todayButton = screen.getByTestId('today-button');
      expect(todayButton).not.toBeDisabled();

      rerender(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      todayButton = screen.getByTestId('today-button');
      expect(todayButton).toBeDisabled();

      rerender(<DateNavigation selectedDate="2026-02-03" onDateChange={handleDateChange} />);

      todayButton = screen.getByTestId('today-button');
      expect(todayButton).not.toBeDisabled();
    });
  });

  // =============================================================================
  // Keyboard Navigation Tests
  // =============================================================================

  describe('Keyboard Navigation', () => {
    it('should navigate to previous day on ArrowLeft', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(handleDateChange).toHaveBeenCalledWith('2026-02-01');
    });

    it('should navigate to next day on ArrowRight', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(handleDateChange).toHaveBeenCalledWith('2026-02-03');
    });

    it('should navigate to today on lowercase t', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-01-24" onDateChange={handleDateChange} />);

      fireEvent.keyDown(window, { key: 't' });

      expect(handleDateChange).toHaveBeenCalledWith('2026-02-02');
    });

    it('should navigate to today on uppercase T', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-01-24" onDateChange={handleDateChange} />);

      fireEvent.keyDown(window, { key: 'T' });

      expect(handleDateChange).toHaveBeenCalledWith('2026-02-02');
    });

    it('should not trigger navigation on other keys', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space' });
      fireEvent.keyDown(window, { key: 'a' });

      expect(handleDateChange).not.toHaveBeenCalled();
    });

    it('should not trigger navigation when input is focused', () => {
      const handleDateChange = vi.fn();
      render(
        <div>
          <input type="text" data-testid="test-input" />
          <DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />
        </div>
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowLeft' });
      fireEvent.keyDown(input, { key: 'ArrowRight' });
      fireEvent.keyDown(input, { key: 't' });

      expect(handleDateChange).not.toHaveBeenCalled();
    });

    it('should not trigger navigation when textarea is focused', () => {
      const handleDateChange = vi.fn();
      render(
        <div>
          <textarea data-testid="test-textarea" />
          <DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />
        </div>
      );

      const textarea = screen.getByTestId('test-textarea');
      textarea.focus();

      fireEvent.keyDown(textarea, { key: 'ArrowLeft' });

      expect(handleDateChange).not.toHaveBeenCalled();
    });

    it('should prevent default on handled keyboard events', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });

      const preventDefaultSpy = vi.spyOn(leftEvent, 'preventDefault');

      window.dispatchEvent(leftEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-navigation')).toHaveAttribute('role', 'navigation');
    });

    it('should have aria-label for navigation', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-navigation')).toHaveAttribute(
        'aria-label',
        'Date navigation'
      );
    });

    it('should have aria-label for previous button', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('previous-day-button')).toHaveAttribute(
        'aria-label',
        'Previous day'
      );
    });

    it('should have aria-label for next button', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('next-day-button')).toHaveAttribute('aria-label', 'Next day');
    });

    it('should have descriptive aria-label for today button when enabled', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-01" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('today-button')).toHaveAttribute('aria-label', 'Go to today');
    });

    it('should have descriptive aria-label for today button when disabled', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('today-button')).toHaveAttribute(
        'aria-label',
        'Already on today'
      );
    });

    it('should have aria-hidden on SVG icons', () => {
      const handleDateChange = vi.fn();
      const { container } = render(
        <DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />
      );

      const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBe(2); // Previous and Next day arrows
    });

    it('should be keyboard accessible - all buttons are buttons', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('previous-day-button').tagName).toBe('BUTTON');
      expect(screen.getByTestId('next-day-button').tagName).toBe('BUTTON');
      expect(screen.getByTestId('today-button').tagName).toBe('BUTTON');
    });

    it('should have type="button" on all buttons', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('previous-day-button')).toHaveAttribute('type', 'button');
      expect(screen.getByTestId('next-day-button')).toHaveAttribute('type', 'button');
      expect(screen.getByTestId('today-button')).toHaveAttribute('type', 'button');
    });
  });

  // =============================================================================
  // Memoization Tests
  // =============================================================================

  describe('Memoization', () => {
    it('should not re-render when props are unchanged', () => {
      const handleDateChange = vi.fn();
      const { rerender } = render(
        <DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />
      );

      const firstRenderElement = screen.getByTestId('date-navigation');

      rerender(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const secondRenderElement = screen.getByTestId('date-navigation');

      // Component should maintain the same instance
      expect(firstRenderElement).toBe(secondRenderElement);
    });

    it('should re-render when selectedDate changes', () => {
      const handleDateChange = vi.fn();
      const { rerender } = render(
        <DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />
      );

      expect(screen.getByTestId('date-display')).toHaveTextContent('Monday, February 2, 2026');

      rerender(<DateNavigation selectedDate="2026-02-03" onDateChange={handleDateChange} />);

      expect(screen.getByTestId('date-display')).toHaveTextContent('Tuesday, February 3, 2026');
    });

    it('should re-render when className changes', () => {
      const handleDateChange = vi.fn();
      const { rerender } = render(
        <DateNavigation
          selectedDate="2026-02-02"
          onDateChange={handleDateChange}
          className="class1"
        />
      );

      expect(screen.getByTestId('date-navigation')).toHaveClass('class1');

      rerender(
        <DateNavigation
          selectedDate="2026-02-02"
          onDateChange={handleDateChange}
          className="class2"
        />
      );

      expect(screen.getByTestId('date-navigation')).toHaveClass('class2');
      expect(screen.getByTestId('date-navigation')).not.toHaveClass('class1');
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle rapid navigation clicks', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-02" onDateChange={handleDateChange} />);

      const nextButton = screen.getByTestId('next-day-button');

      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(handleDateChange).toHaveBeenCalledTimes(3);
      expect(handleDateChange).toHaveBeenNthCalledWith(1, '2026-02-03');
      expect(handleDateChange).toHaveBeenNthCalledWith(2, '2026-02-03');
      expect(handleDateChange).toHaveBeenNthCalledWith(3, '2026-02-03');
    });

    it('should handle leap year dates correctly', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2024-02-28" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('next-day-button'));

      expect(handleDateChange).toHaveBeenCalledWith('2024-02-29');
    });

    it('should handle non-leap year dates correctly', () => {
      const handleDateChange = vi.fn();
      render(<DateNavigation selectedDate="2026-02-28" onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByTestId('next-day-button'));

      expect(handleDateChange).toHaveBeenCalledWith('2026-03-01');
    });
  });
});
