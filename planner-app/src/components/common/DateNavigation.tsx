/**
 * DateNavigation Component
 *
 * A navigation component for selecting dates with previous/next day buttons.
 *
 * Features:
 * - Left/Right arrow buttons for previous/next day navigation
 * - Display formatted date in center
 * - "Today" button to jump to current date (disabled when already on today)
 * - Calendar picker button for quick date selection
 * - Keyboard support: Arrow keys for navigation, 'T' for today
 * - Accessibility: ARIA labels, focus management
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { addMonths, parseISO } from 'date-fns';
import { formatDisplayDate, addDays, isToday, getTodayString, toISODateString, parseISODate } from '../../utils/dateUtils';
import { DatePicker } from './DatePicker';

export type NavigationStep = 'day' | 'week' | 'month';

// =============================================================================
// Types
// =============================================================================

export interface DateNavigationProps {
  /** Selected date as ISO string (YYYY-MM-DD) */
  selectedDate: string;
  /** Callback when date changes */
  onDateChange: (date: string) => void;
  /** Navigation step size: day (default), week, or month */
  navigationStep?: NavigationStep;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DateNavigation - Displays date navigation controls
 *
 * @param props - DateNavigationProps
 * @returns JSX element representing date navigation
 */
function DateNavigationComponent({
  selectedDate,
  onDateChange,
  navigationStep = 'day',
  className = '',
  testId = 'date-navigation',
}: DateNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const formattedDate = formatDisplayDate(selectedDate);
  const isTodaySelected = isToday(selectedDate);

  const stepLabel = navigationStep === 'month' ? 'month' : navigationStep === 'week' ? 'week' : 'day';

  // Navigate backward by the current step
  const handlePreviousDay = useCallback(() => {
    if (navigationStep === 'month') {
      const newDate = addMonths(parseISO(selectedDate), -1);
      onDateChange(toISODateString(newDate));
    } else {
      const days = navigationStep === 'week' ? -7 : -1;
      onDateChange(addDays(selectedDate, days));
    }
  }, [selectedDate, onDateChange, navigationStep]);

  // Navigate forward by the current step
  const handleNextDay = useCallback(() => {
    if (navigationStep === 'month') {
      const newDate = addMonths(parseISO(selectedDate), 1);
      onDateChange(toISODateString(newDate));
    } else {
      const days = navigationStep === 'week' ? 7 : 1;
      onDateChange(addDays(selectedDate, days));
    }
  }, [selectedDate, onDateChange, navigationStep]);

  // Navigate to today
  const handleToday = useCallback(() => {
    if (!isTodaySelected) {
      onDateChange(getTodayString());
    }
  }, [isTodaySelected, onDateChange]);

  // Handle date picker selection
  const handleDatePickerChange = useCallback((date: Date | null) => {
    if (date) {
      onDateChange(toISODateString(date));
    }
    setShowDatePicker(false);
  }, [onDateChange]);

  // Toggle calendar picker
  const handleToggleCalendar = useCallback(() => {
    setShowDatePicker(prev => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if the event target is within our component or no input is focused
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousDay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextDay();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          handleToday();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePreviousDay, handleNextDay, handleToday]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-between gap-2 sm:gap-4 ${className}`}
      data-testid={testId}
      role="navigation"
      aria-label="Date navigation"
    >
      {/* Previous Day Button */}
      <button
        type="button"
        onClick={handlePreviousDay}
        className="
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10
          rounded-lg
          bg-white border border-gray-300
          text-gray-700
          transition-all duration-150
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          active:scale-95
        "
        aria-label={`Previous ${stepLabel}`}
        data-testid="previous-day-button"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Date Display */}
      <div
        className={`
          flex-1 text-center
          px-3 py-2 sm:px-4 sm:py-2.5
          text-base sm:text-lg font-medium
          min-w-0
          transition-colors duration-150
          ${isTodaySelected ? 'text-amber-700' : 'text-gray-800'}
        `}
        data-testid="date-display"
        aria-live="polite"
        aria-atomic="true"
      >
        {isTodaySelected && (
          <span
            className="
              inline-block px-2 py-0.5 mb-1
              text-xs font-semibold
              bg-amber-100 text-amber-800
              rounded-full
              border border-amber-200
            "
            data-testid="today-indicator"
            aria-label="Today"
          >
            Today
          </span>
        )}
        <span className="truncate block">{formattedDate}</span>
      </div>

      {/* Today Button */}
      <button
        type="button"
        onClick={handleToday}
        disabled={isTodaySelected}
        className="
          px-3 py-2 sm:px-4 sm:py-2.5
          rounded-lg
          text-sm sm:text-base font-medium
          bg-amber-500 text-white
          transition-all duration-150
          hover:bg-amber-600
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          active:scale-95
          disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
          disabled:hover:bg-gray-300 disabled:active:scale-100
          whitespace-nowrap
        "
        aria-label={isTodaySelected ? 'Already on today' : 'Go to today'}
        data-testid="today-button"
      >
        Today
      </button>

      {/* Calendar Picker Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleCalendar}
          className="
            flex items-center justify-center
            w-9 h-9 sm:w-10 sm:h-10
            rounded-lg
            bg-white border border-gray-300
            text-gray-700
            transition-all duration-150
            hover:bg-gray-50 hover:border-gray-400
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
            active:scale-95
          "
          aria-label="Open calendar picker"
          aria-expanded={showDatePicker}
          data-testid="calendar-picker-button"
        >
          <svg
            className="w-5 h-5"
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
        </button>

        {/* Calendar Picker Popup */}
        {showDatePicker && (
          <div
            className="absolute z-50 top-full mt-2 right-0 bg-white shadow-lg rounded-lg border border-gray-200 p-2"
            data-testid="calendar-picker-popup"
          >
            <DatePicker
              value={parseISODate(selectedDate)}
              onChange={handleDatePickerChange}
              testId="date-navigation-date-picker"
              autoOpen
            />
          </div>
        )}
      </div>

      {/* Next Day Button */}
      <button
        type="button"
        onClick={handleNextDay}
        className="
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10
          rounded-lg
          bg-white border border-gray-300
          text-gray-700
          transition-all duration-150
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          active:scale-95
        "
        aria-label={`Next ${stepLabel}`}
        data-testid="next-day-button"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: DateNavigationProps, nextProps: DateNavigationProps): boolean {
  return (
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.navigationStep === nextProps.navigationStep &&
    prevProps.className === nextProps.className &&
    prevProps.testId === nextProps.testId
  );
}

// Export memoized component
export const DateNavigation = memo(DateNavigationComponent, arePropsEqual);

export default DateNavigation;
