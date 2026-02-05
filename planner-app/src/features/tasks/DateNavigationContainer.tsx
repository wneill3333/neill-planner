/**
 * DateNavigationContainer Component
 *
 * Container component that connects DateNavigation to Redux store.
 * Handles date selection state and dispatching actions.
 */

import { useCallback } from 'react';
import { DateNavigation } from '../../components/common/DateNavigation';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedDate, setSelectedDate } from './taskSlice';

// =============================================================================
// Types
// =============================================================================

export interface DateNavigationContainerProps {
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DateNavigationContainer - Connects DateNavigation to Redux store
 *
 * @param props - DateNavigationContainerProps
 * @returns JSX element representing connected date navigation
 */
export function DateNavigationContainer({
  className,
  testId,
}: DateNavigationContainerProps = {}) {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector(selectSelectedDate);

  // Handle date change
  const handleDateChange = useCallback(
    (date: string) => {
      dispatch(setSelectedDate(date));
    },
    [dispatch]
  );

  return (
    <DateNavigation
      selectedDate={selectedDate}
      onDateChange={handleDateChange}
      className={className}
      testId={testId}
    />
  );
}

export default DateNavigationContainer;
