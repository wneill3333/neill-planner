/**
 * Event Hooks
 *
 * Custom hooks for event-related functionality.
 * Provides data fetching, state management, and event operations for components.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectEventsWithRecurringInstances,
  selectAllEvents,
  selectEventsLoading,
  selectEventsError,
  selectEventsSyncStatus,
  selectRecurringEventsLoaded,
  selectEventById,
  selectRecurringParentEvents,
} from './eventSlice';
import { fetchEventsByDate, fetchRecurringEvents, fetchUserEvents } from './eventThunks';
import { generateRecurringInstances } from '../../utils/recurrenceUtils';
import { startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import type { Event } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface UseEventsByDateResult {
  /** Events for the specified date */
  events: Event[];
  /** Whether events are currently loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status */
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  /** Refetch events for the date */
  refetch: () => void;
}

export interface UseEventResult {
  /** The event if found */
  event: Event | undefined;
  /** Whether the event is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

export interface UseEventsByRangeResult {
  /** Events within the specified date range */
  events: Event[];
  /** Whether events are currently loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status */
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  /** Refetch events */
  refetch: () => void;
}

// =============================================================================
// useEventsByDate Hook
// =============================================================================

/**
 * Hook to fetch and manage events for a specific date.
 *
 * This hook provides a complete interface for working with events on a given date,
 * automatically fetching data when needed and providing helper functions for updates.
 *
 * Features:
 * - Automatic data fetching when date changes
 * - Automatic recurring event loading if not initialized
 * - Race condition protection to prevent duplicate fetches
 * - Memoized helper functions for common operations
 *
 * Performance Considerations:
 * - Uses Redux state caching via memoized selectors
 * - Uses ref to track in-flight requests and prevent duplicates
 *
 * @param date - Date object for which to fetch events
 * @param userId - User ID to fetch events for (null for unauthenticated)
 *
 * @returns Object containing:
 * - `events`: Array of events for the specified date (including recurring instances)
 * - `loading`: Boolean indicating if events are currently being fetched
 * - `error`: Error message string if fetch failed, null otherwise
 * - `syncStatus`: Current sync status ('synced', 'syncing', 'error', 'offline')
 * - `refetch`: Function to manually refetch events for this date
 *
 * @example
 * ```tsx
 * function DayView() {
 *   const { user } = useAuth();
 *   const date = new Date('2024-01-15');
 *   const { events, loading, error, refetch } = useEventsByDate(date, user?.id ?? null);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return (
 *     <div>
 *       {events.map(event => (
 *         <EventItem key={event.id} event={event} />
 *       ))}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEventsByDate(date: Date, userId: string | null): UseEventsByDateResult {
  const dispatch = useAppDispatch();

  // Ref to track if a fetch is in progress to prevent race conditions
  const eventsFetchInProgressRef = useRef(false);
  const recurringEventsFetchInProgressRef = useRef(false);

  // Convert date to local date string (YYYY-MM-DD) for selector
  const dateString = useMemo(() => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [date]);

  // Memoize selectors to prevent creating new function references on every render
  const selectEventsForDate = useMemo(
    () => (state: Parameters<typeof selectEventsWithRecurringInstances>[0]) =>
      selectEventsWithRecurringInstances(state, dateString),
    [dateString]
  );

  // Selectors - using memoized selectors from eventSlice
  const events = useAppSelector(selectEventsForDate);
  const loading = useAppSelector(selectEventsLoading);
  const error = useAppSelector(selectEventsError);
  const syncStatus = useAppSelector(selectEventsSyncStatus);
  const recurringEventsLoaded = useAppSelector(selectRecurringEventsLoaded);

  // Fetch events when date or userId changes - with race condition protection
  useEffect(() => {
    // Early return if conditions not met
    if (!userId || !date) return;

    // Use atomic flag check to prevent race condition
    if (eventsFetchInProgressRef.current) return;

    eventsFetchInProgressRef.current = true;
    let aborted = false;

    const fetchData = async () => {
      try {
        await dispatch(fetchEventsByDate({ userId, date })).unwrap();
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch events:', error);
        }
      } finally {
        if (!aborted) {
          eventsFetchInProgressRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
      eventsFetchInProgressRef.current = false;
    };
  }, [dispatch, userId, date]);

  // Fetch recurring events if not already loaded - with race condition protection
  useEffect(() => {
    // Early return if conditions not met
    if (!userId || recurringEventsLoaded) return;

    // Use atomic flag check to prevent race condition
    if (recurringEventsFetchInProgressRef.current) return;

    recurringEventsFetchInProgressRef.current = true;
    let aborted = false;

    const fetchData = async () => {
      try {
        await dispatch(fetchRecurringEvents({ userId })).unwrap();
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch recurring events:', error);
        }
      } finally {
        if (!aborted) {
          recurringEventsFetchInProgressRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
      recurringEventsFetchInProgressRef.current = false;
    };
  }, [dispatch, userId, recurringEventsLoaded]);

  // Memoized refetch function - allows manual refresh
  const refetch = useCallback(() => {
    if (userId && date) {
      dispatch(fetchEventsByDate({ userId, date }));
    }
  }, [dispatch, userId, date]);

  return {
    events,
    loading,
    error,
    syncStatus,
    refetch,
  };
}

// =============================================================================
// useEvent Hook
// =============================================================================

/**
 * Hook to get a single event by ID.
 *
 * @param eventId - ID of the event to retrieve
 * @returns Object containing the event, loading state, and error
 *
 * @example
 * ```tsx
 * function EventDetail({ eventId }: { eventId: string }) {
 *   const { event, loading, error } = useEvent(eventId);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *   if (!event) return <NotFound />;
 *
 *   return <EventCard event={event} />;
 * }
 * ```
 */
export function useEvent(eventId: string): UseEventResult {
  const event = useAppSelector((state) => selectEventById(state, eventId));
  const loading = useAppSelector(selectEventsLoading);
  const error = useAppSelector(selectEventsError);

  return {
    event,
    loading,
    error,
  };
}

// =============================================================================
// useEventsByRange Hook
// =============================================================================

/**
 * Hook to fetch and manage events for a date range.
 *
 * Used by WeekView and MonthView to display events across multiple days.
 * Fetches all user events and filters to the specified range, including
 * recurring event instances.
 *
 * @param startDate - Start date of the range (inclusive)
 * @param endDate - End date of the range (inclusive)
 * @param userId - User ID to fetch events for (null for unauthenticated)
 *
 * @returns Object containing events, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function WeekView() {
 *   const { user } = useAuth();
 *   const startDate = startOfWeek(new Date());
 *   const endDate = endOfWeek(new Date());
 *   const { events, loading, error } = useEventsByRange(startDate, endDate, user?.id ?? null);
 *
 *   if (loading) return <LoadingSpinner />;
 *   return <EventGrid events={events} />;
 * }
 * ```
 */
export function useEventsByRange(
  startDate: Date,
  endDate: Date,
  userId: string | null
): UseEventsByRangeResult {
  const dispatch = useAppDispatch();

  // Ref to track if a fetch is in progress to prevent race conditions
  const fetchInProgressRef = useRef(false);
  const recurringFetchInProgressRef = useRef(false);

  // Selectors
  const allEvents = useAppSelector(selectAllEvents);
  const recurringParentEvents = useAppSelector(selectRecurringParentEvents);
  const loading = useAppSelector(selectEventsLoading);
  const error = useAppSelector(selectEventsError);
  const syncStatus = useAppSelector(selectEventsSyncStatus);
  const recurringEventsLoaded = useAppSelector(selectRecurringEventsLoaded);

  // Normalize dates to start of day for consistent comparison
  const normalizedStart = useMemo(() => startOfDay(startDate), [startDate]);
  const normalizedEnd = useMemo(() => startOfDay(endDate), [endDate]);

  // Filter events to the date range and generate recurring instances
  const events = useMemo(() => {
    // Get regular events within the range
    const regularEventsInRange = allEvents.filter((event) => {
      const eventDate = startOfDay(event.startTime);
      return eventDate >= normalizedStart && eventDate <= normalizedEnd;
    });

    // Track which recurring parent IDs already have events in the range
    const materializedParentIds = new Set(
      regularEventsInRange
        .filter((event) => event.isRecurringInstance && event.recurringParentId)
        .map((event) => event.recurringParentId as string)
    );

    // Also track parent events that are directly in regular events
    const parentEventIdsInRange = new Set(
      regularEventsInRange.filter((event) => event.recurrence !== null).map((event) => event.id)
    );

    // Generate recurring instances for the date range
    const recurringInstances: Event[] = [];
    if (recurringParentEvents) {
      for (const parentEvent of Object.values(recurringParentEvents)) {
        // Generate instances for each day in the range
        const instances = generateRecurringInstances(parentEvent, normalizedStart, normalizedEnd);

        // Filter out instances that already have materialized events
        for (const instance of instances) {
          const instanceDate = startOfDay(instance.startTime);

          // Check if this date already has a materialized instance or the parent itself
          const hasMaterialized = regularEventsInRange.some(
            (event) =>
              (event.recurringParentId === parentEvent.id || event.id === parentEvent.id) &&
              isSameDay(event.startTime, instanceDate)
          );

          if (!hasMaterialized) {
            recurringInstances.push(instance);
          }
        }
      }
    }

    // Combine and sort by start time
    const combined = [...regularEventsInRange, ...recurringInstances];
    return combined.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [allEvents, recurringParentEvents, normalizedStart, normalizedEnd]);

  // Fetch all user events when userId changes - with race condition protection
  useEffect(() => {
    if (!userId) return;
    if (fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    let aborted = false;

    const fetchData = async () => {
      try {
        await dispatch(fetchUserEvents({ userId })).unwrap();
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch user events:', error);
        }
      } finally {
        if (!aborted) {
          fetchInProgressRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
      fetchInProgressRef.current = false;
    };
  }, [dispatch, userId]);

  // Fetch recurring events if not already loaded
  useEffect(() => {
    if (!userId || recurringEventsLoaded) return;
    if (recurringFetchInProgressRef.current) return;

    recurringFetchInProgressRef.current = true;
    let aborted = false;

    const fetchData = async () => {
      try {
        await dispatch(fetchRecurringEvents({ userId })).unwrap();
      } catch (error) {
        if (!aborted) {
          console.error('Failed to fetch recurring events:', error);
        }
      } finally {
        if (!aborted) {
          recurringFetchInProgressRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
      recurringFetchInProgressRef.current = false;
    };
  }, [dispatch, userId, recurringEventsLoaded]);

  // Memoized refetch function
  const refetch = useCallback(() => {
    if (userId) {
      dispatch(fetchUserEvents({ userId }));
    }
  }, [dispatch, userId]);

  return {
    events,
    loading,
    error,
    syncStatus,
    refetch,
  };
}
