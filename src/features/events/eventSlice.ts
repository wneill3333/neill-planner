/**
 * Event Slice
 *
 * Redux Toolkit slice for event state management.
 * Handles normalized event storage, date-based indexing, and CRUD operations.
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { startOfDay } from 'date-fns';
import type { Event, SyncStatus } from '../../types';
import type { RootState } from '../../store';
import { generateRecurringInstances } from '../../utils/recurrenceUtils';
import {
  fetchUserEvents,
  fetchEventsByDate,
  createEventAsync,
  updateEventAsync,
  deleteEventAsync,
  fetchRecurringEvents,
  restoreEventAsync,
  hardDeleteEventAsync,
} from './eventThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the events slice
 */
export interface EventsState {
  /** Normalized events storage - events indexed by ID */
  events: Record<string, Event>;
  /** Event IDs indexed by date (ISO date string) for quick lookup */
  eventIdsByDate: Record<string, string[]>;
  /** Recurring parent events (events with recurrence patterns) indexed by ID */
  recurringParentEvents: Record<string, Event>;
  /** Whether recurring parent events have been loaded */
  recurringEventsLoaded: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get ISO date string from a Date object or return null
 */
function getDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Add an event ID to the date index
 */
function addEventToDateIndex(
  eventIdsByDate: Record<string, string[]>,
  date: string | null,
  eventId: string
): void {
  if (!date) return;
  if (!eventIdsByDate[date]) {
    eventIdsByDate[date] = [];
  }
  if (!eventIdsByDate[date].includes(eventId)) {
    eventIdsByDate[date].push(eventId);
  }
}

/**
 * Remove an event ID from the date index
 */
function removeEventFromDateIndex(
  eventIdsByDate: Record<string, string[]>,
  date: string | null,
  eventId: string
): void {
  if (!date || !eventIdsByDate[date]) return;
  const index = eventIdsByDate[date].indexOf(eventId);
  if (index > -1) {
    eventIdsByDate[date].splice(index, 1);
  }
  // Clean up empty arrays
  if (eventIdsByDate[date].length === 0) {
    delete eventIdsByDate[date];
  }
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: EventsState = {
  events: {},
  eventIdsByDate: {},
  recurringParentEvents: {},
  recurringEventsLoaded: false,
  loading: false,
  error: null,
  syncStatus: 'synced',
};

// =============================================================================
// Slice
// =============================================================================

export const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    /**
     * Clear all events (useful for logout)
     */
    clearEvents: (state) => {
      state.events = {};
      state.eventIdsByDate = {};
      state.recurringParentEvents = {};
      state.recurringEventsLoaded = false;
      state.error = null;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // fetchUserEvents
    // ==========================================================================
    builder
      .addCase(fetchUserEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchUserEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.syncStatus = 'synced';

        // Add all events to state
        for (const event of action.payload) {
          state.events[event.id] = event;
          const dateString = getDateString(event.startTime);
          addEventToDateIndex(state.eventIdsByDate, dateString, event.id);
        }
      })
      .addCase(fetchUserEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch events';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchEventsByDate
    // ==========================================================================
    builder
      .addCase(fetchEventsByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchEventsByDate.fulfilled, (state, action) => {
        const { events, date } = action.payload;
        state.loading = false;
        state.syncStatus = 'synced';

        // Clear existing event IDs for this date
        if (state.eventIdsByDate[date]) {
          // Remove old events that are only indexed under this date
          for (const eventId of state.eventIdsByDate[date]) {
            const event = state.events[eventId];
            if (event) {
              const eventDate = getDateString(event.startTime);
              if (eventDate === date) {
                delete state.events[eventId];
              }
            }
          }
        }
        state.eventIdsByDate[date] = [];

        // Add new events
        for (const event of events) {
          state.events[event.id] = event;
          const eventDate = getDateString(event.startTime);
          addEventToDateIndex(state.eventIdsByDate, eventDate, event.id);
        }
      })
      .addCase(fetchEventsByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch events';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // createEventAsync
    // ==========================================================================
    builder
      .addCase(createEventAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createEventAsync.fulfilled, (state, action) => {
        const event = action.payload;
        state.events[event.id] = event;
        const dateString = getDateString(event.startTime);
        addEventToDateIndex(state.eventIdsByDate, dateString, event.id);

        // If event has recurrence, also add to recurringParentEvents
        if (event.recurrence) {
          state.recurringParentEvents[event.id] = event;
        }

        state.syncStatus = 'synced';
      })
      .addCase(createEventAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create event';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateEventAsync
    // ==========================================================================
    builder
      .addCase(updateEventAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateEventAsync.fulfilled, (state, action) => {
        const updatedEvent = action.payload;
        const existingEvent = state.events[updatedEvent.id];

        if (existingEvent) {
          // Handle date change
          const oldDate = getDateString(existingEvent.startTime);
          const newDate = getDateString(updatedEvent.startTime);

          if (oldDate !== newDate) {
            removeEventFromDateIndex(state.eventIdsByDate, oldDate, updatedEvent.id);
            addEventToDateIndex(state.eventIdsByDate, newDate, updatedEvent.id);
          }
        }

        state.events[updatedEvent.id] = updatedEvent;

        // Handle recurrence changes
        if (updatedEvent.recurrence) {
          state.recurringParentEvents[updatedEvent.id] = updatedEvent;
        } else if (state.recurringParentEvents[updatedEvent.id]) {
          delete state.recurringParentEvents[updatedEvent.id];
        }

        state.syncStatus = 'synced';
      })
      .addCase(updateEventAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update event';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteEventAsync
    // ==========================================================================
    builder
      .addCase(deleteEventAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteEventAsync.fulfilled, (state, action) => {
        const eventId = action.payload;
        const event = state.events[eventId];

        if (event) {
          const dateString = getDateString(event.startTime);
          removeEventFromDateIndex(state.eventIdsByDate, dateString, eventId);
          delete state.events[eventId];
        }

        // Also remove from recurringParentEvents if present
        if (state.recurringParentEvents[eventId]) {
          delete state.recurringParentEvents[eventId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(deleteEventAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete event';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // fetchRecurringEvents
    // ==========================================================================
    builder
      .addCase(fetchRecurringEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecurringEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringEventsLoaded = true;

        // Store recurring parent events
        for (const event of action.payload) {
          state.recurringParentEvents[event.id] = event;
        }
      })
      .addCase(fetchRecurringEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch recurring events';
      });

    // ==========================================================================
    // restoreEventAsync
    // ==========================================================================
    builder
      .addCase(restoreEventAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(restoreEventAsync.fulfilled, (state, action) => {
        const event = action.payload;
        state.events[event.id] = event;
        const dateString = getDateString(event.startTime);
        addEventToDateIndex(state.eventIdsByDate, dateString, event.id);

        // If event has recurrence, also add to recurringParentEvents
        if (event.recurrence) {
          state.recurringParentEvents[event.id] = event;
        }

        state.syncStatus = 'synced';
      })
      .addCase(restoreEventAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to restore event';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // hardDeleteEventAsync
    // ==========================================================================
    builder
      .addCase(hardDeleteEventAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(hardDeleteEventAsync.fulfilled, (state, action) => {
        const eventId = action.payload;
        const event = state.events[eventId];

        if (event) {
          const dateString = getDateString(event.startTime);
          removeEventFromDateIndex(state.eventIdsByDate, dateString, eventId);
          delete state.events[eventId];
        }

        // Also remove from recurringParentEvents if present
        if (state.recurringParentEvents[eventId]) {
          delete state.recurringParentEvents[eventId];
        }

        state.syncStatus = 'synced';
      })
      .addCase(hardDeleteEventAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to permanently delete event';
        state.syncStatus = 'error';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const { clearEvents, setError, clearError } = eventSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all events as an array
 */
export const selectAllEvents = createSelector(
  [(state: RootState) => state.events.events],
  (events): Event[] => Object.values(events)
);

/**
 * Select an event by ID
 */
export const selectEventById = (state: RootState, eventId: string): Event | undefined =>
  state.events.events[eventId];

/**
 * Select events for a specific date.
 *
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 * Only recomputes when events or eventIdsByDate changes.
 *
 * @param state - Redux state
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of events for the specified date
 */
export const selectEventsByDate = createSelector(
  [
    (state: RootState) => state.events.events,
    (state: RootState) => state.events.eventIdsByDate,
    (_state: RootState, date: string) => date,
  ],
  (events, eventIdsByDate, date): Event[] => {
    const eventIds = eventIdsByDate[date] || [];
    return eventIds.map((id) => events[id]).filter((event): event is Event => !!event);
  }
);

/**
 * Select events for a specific date, including recurring event instances.
 *
 * Combines regular events with generated instances from recurring parent events.
 * Uses createSelector for memoization to prevent unnecessary re-renders.
 *
 * @param state - Redux state
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of events including both regular events and recurring instances
 */
export const selectEventsWithRecurringInstances = createSelector(
  [
    (state: RootState) => state.events.events,
    (state: RootState) => state.events.eventIdsByDate,
    (state: RootState) => state.events.recurringParentEvents,
    (_state: RootState, date: string) => date,
  ],
  (events, eventIdsByDate, recurringParentEvents, date): Event[] => {
    // Get regular events for the date
    const eventIds = eventIdsByDate[date] || [];
    const regularEvents = eventIds.map((id) => events[id]).filter((event): event is Event => !!event);

    // Parse and validate date string
    const [year, month, day] = date.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.warn(`Invalid date format in selector: ${date}`);
      return regularEvents;
    }
    const dateObj = startOfDay(new Date(year, month - 1, day)); // month - 1 because JS Date is 0-indexed

    // Track which recurring parent IDs already have materialized instances OR
    // the parent event itself is already in regular events for this date
    const materializedParentIds = new Set(
      regularEvents
        .filter((event) => event.isRecurringInstance && event.recurringParentId)
        .map((event) => event.recurringParentId as string)
    );

    // Also track parent events that are directly in regular events (original scheduled date)
    const parentEventIdsInRegularEvents = new Set(
      regularEvents.filter((event) => event.recurrence !== null).map((event) => event.id)
    );

    // Generate instances for all recurring parent events
    const recurringInstances: Event[] = [];
    // Defensive check for undefined/null recurringParentEvents (e.g., in tests with incomplete state)
    if (!recurringParentEvents) {
      return regularEvents;
    }
    for (const parentEvent of Object.values(recurringParentEvents)) {
      // Skip if this parent already has a materialized instance on this date
      if (materializedParentIds.has(parentEvent.id)) {
        continue;
      }

      // Skip if the parent event itself is already in regular events for this date
      if (parentEventIdsInRegularEvents.has(parentEvent.id)) {
        continue;
      }

      // Skip events that definitely won't have instances on this date
      if (parentEvent.startTime && startOfDay(parentEvent.startTime) > dateObj) {
        continue;
      }

      // Generate instances for this single date
      const instances = generateRecurringInstances(parentEvent, dateObj, dateObj);
      recurringInstances.push(...instances);
    }

    // Combine regular events and recurring instances
    const allEvents = [...regularEvents, ...recurringInstances];

    // Sort by start time
    return allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
);

/**
 * Select loading state
 */
export const selectEventsLoading = (state: RootState): boolean => state.events.loading;

/**
 * Select error state
 */
export const selectEventsError = (state: RootState): string | null => state.events.error;

/**
 * Select sync status
 */
export const selectEventsSyncStatus = (state: RootState): SyncStatus => state.events.syncStatus;

/**
 * Select whether recurring parent events have been loaded
 */
export const selectRecurringEventsLoaded = (state: RootState): boolean =>
  state.events.recurringEventsLoaded ?? false;

/**
 * Select all recurring parent events
 */
export const selectRecurringParentEvents = (state: RootState): Record<string, Event> =>
  state.events.recurringParentEvents;

// =============================================================================
// Reducer Export
// =============================================================================

export default eventSlice.reducer;
