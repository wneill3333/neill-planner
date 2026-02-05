/**
 * Event Async Thunks
 *
 * Redux Toolkit async thunks for event CRUD operations.
 * These thunks interact with the Firebase events service and handle
 * loading states, errors, and optimistic updates.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Event, CreateEventInput, UpdateEventInput } from '../../types/event.types';
import * as eventsService from '../../services/firebase/events.service';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * Payload for fetching events by date
 */
export interface FetchEventsByDatePayload {
  userId: string;
  date: Date;
}

/**
 * Payload for creating an event
 */
export interface CreateEventPayload {
  input: CreateEventInput;
  userId: string;
}

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch all events for a user
 *
 * Retrieves all non-deleted events for the given user from Firestore.
 */
export const fetchUserEvents = createAsyncThunk<
  Event[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('events/fetchUserEvents', async ({ userId }, { rejectWithValue }) => {
  try {
    const events = await eventsService.getUserEvents(userId);
    return events;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return rejectWithValue({ message });
  }
});

/**
 * Fetch events for a specific date
 *
 * Retrieves all non-deleted events for the given user and date from Firestore.
 */
export const fetchEventsByDate = createAsyncThunk<
  { events: Event[]; date: string },
  FetchEventsByDatePayload,
  { state: RootState; rejectValue: ThunkError }
>('events/fetchEventsByDate', async ({ userId, date }, { rejectWithValue }) => {
  try {
    const events = await eventsService.getEventsByDate(userId, date);
    const dateString = date.toISOString().split('T')[0];
    return { events, date: dateString };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new event
 *
 * Creates an event in Firestore and adds it to the local state.
 * The event is immediately available in the UI after creation.
 */
export const createEventAsync = createAsyncThunk<
  Event,
  CreateEventPayload,
  { state: RootState; rejectValue: ThunkError }
>('events/createEvent', async ({ input, userId }, { rejectWithValue }) => {
  try {
    const event = await eventsService.createEvent(input, userId);
    return event;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create event';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing event
 *
 * Updates an event in Firestore and reflects the changes in local state.
 */
export const updateEventAsync = createAsyncThunk<
  Event,
  UpdateEventInput & { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('events/updateEventAsync', async (input, { rejectWithValue }) => {
  try {
    const { userId, ...updateInput } = input;
    const event = await eventsService.updateEvent(updateInput, userId);
    return event;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update event';
    return rejectWithValue({ message });
  }
});

/**
 * Delete an event (soft delete)
 *
 * Performs a soft delete by setting the deletedAt timestamp.
 * The event is removed from the local state but remains in Firestore
 * for potential recovery.
 */
export const deleteEventAsync = createAsyncThunk<
  string,
  { eventId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('events/deleteEvent', async ({ eventId, userId }, { rejectWithValue }) => {
  try {
    await eventsService.deleteEvent(eventId, userId);
    return eventId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete event';
    return rejectWithValue({ message });
  }
});

/**
 * Fetch recurring events (for instance generation)
 *
 * Retrieves all recurring parent events for a user. These are events that have
 * a recurrence pattern defined and will be used to generate instances for display.
 */
export const fetchRecurringEvents = createAsyncThunk<
  Event[],
  { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('events/fetchRecurringEvents', async ({ userId }, { rejectWithValue }) => {
  try {
    const events = await eventsService.getRecurringEvents(userId);
    return events;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recurring events';
    return rejectWithValue({ message });
  }
});

/**
 * Restore a soft-deleted event
 *
 * Restores a previously soft-deleted event by clearing the deletedAt timestamp.
 */
export const restoreEventAsync = createAsyncThunk<
  Event,
  { eventId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('events/restoreEvent', async ({ eventId, userId }, { rejectWithValue }) => {
  try {
    const event = await eventsService.restoreEvent(eventId, userId);
    return event;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore event';
    return rejectWithValue({ message });
  }
});

/**
 * Permanently delete an event (hard delete)
 *
 * Permanently removes the event from Firestore.
 * Use with caution - this action cannot be undone.
 */
export const hardDeleteEventAsync = createAsyncThunk<
  string,
  { eventId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('events/hardDeleteEvent', async ({ eventId, userId }, { rejectWithValue }) => {
  try {
    await eventsService.hardDeleteEvent(eventId, userId);
    return eventId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to permanently delete event';
    return rejectWithValue({ message });
  }
});
