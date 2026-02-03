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
  selectEventsLoading,
  selectEventsError,
  selectEventsSyncStatus,
  selectRecurringEventsLoaded,
  selectEventById,
} from './eventSlice';
import { fetchEventsByDate, fetchRecurringEvents } from './eventThunks';
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

  // Convert date to ISO string for selector
  const dateString = useMemo(() => date.toISOString().split('T')[0], [date]);

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
