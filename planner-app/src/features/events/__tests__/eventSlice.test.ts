/**
 * Event Slice Tests
 *
 * Tests for the event Redux slice reducers, actions, and selectors.
 */

import { describe, it, expect } from 'vitest';
import eventReducer, {
  initialState,
  clearEvents,
  setError,
  clearError,
  selectAllEvents,
  selectEventById,
  selectEventsByDate,
  selectEventsWithRecurringInstances,
  selectEventsLoading,
  selectEventsError,
  selectEventsSyncStatus,
  selectRecurringEventsLoaded,
  selectRecurringParentEvents,
  type EventsState,
} from '../eventSlice';
import {
  fetchUserEvents,
  fetchEventsByDate,
  createEventAsync,
  updateEventAsync,
  deleteEventAsync,
  fetchRecurringEvents,
} from '../eventThunks';
import type { Event } from '../../../types';
import type { RootState } from '../../../store';

// =============================================================================
// Test Helpers
// =============================================================================

const mockEvent: Event = {
  id: 'event-1',
  userId: 'user-1',
  title: 'Test Event',
  description: 'Test description',
  categoryId: null,
  startTime: new Date('2024-01-15T10:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  location: 'Test Location',
  isConfidential: false,
  alternateTitle: null,
  recurrence: null,
  linkedNoteIds: [],
  linkedTaskIds: [],
  googleCalendarId: null,
  isRecurringInstance: false,
  recurringParentId: null,
  instanceDate: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null,
};

const mockRecurringEvent: Event = {
  ...mockEvent,
  id: 'event-2',
  title: 'Recurring Event',
  recurrence: {
    frequency: 'daily',
    interval: 1,
    byWeekday: [],
    byMonthday: [],
    byMonth: [],
    endCondition: {
      type: 'never',
      endDate: null,
      maxOccurrences: null,
    },
    exceptions: [],
  },
};

function createMockRootState(eventsState: Partial<EventsState> = {}): RootState {
  return {
    events: {
      ...initialState,
      ...eventsState,
    },
    tasks: {
      tasks: {},
      taskIdsByDate: {},
      recurringParentTasks: {},
      recurringTasksLoaded: false,
      selectedDate: '2024-01-15',
      loading: false,
      error: null,
      syncStatus: 'synced',
      reorderRollbackState: null,
    },
    categories: {
      categories: {},
      initialized: false,
      loading: false,
      error: null,
    },
  } as RootState;
}

// =============================================================================
// Reducer Tests
// =============================================================================

describe('eventSlice reducer', () => {
  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(eventReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('clearEvents', () => {
    it('should clear all events and reset state', () => {
      const state: EventsState = {
        events: { 'event-1': mockEvent },
        eventIdsByDate: { '2024-01-15': ['event-1'] },
        recurringParentEvents: { 'event-2': mockRecurringEvent },
        recurringEventsLoaded: true,
        loading: false,
        error: 'Some error',
        syncStatus: 'error',
      };

      const nextState = eventReducer(state, clearEvents());

      expect(nextState.events).toEqual({});
      expect(nextState.eventIdsByDate).toEqual({});
      expect(nextState.recurringParentEvents).toEqual({});
      expect(nextState.recurringEventsLoaded).toBe(false);
      expect(nextState.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const nextState = eventReducer(initialState, setError('Test error'));
      expect(nextState.error).toBe('Test error');
    });

    it('should clear error when null is passed', () => {
      const state: EventsState = { ...initialState, error: 'Previous error' };
      const nextState = eventReducer(state, setError(null));
      expect(nextState.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const state: EventsState = { ...initialState, error: 'Test error' };
      const nextState = eventReducer(state, clearError());
      expect(nextState.error).toBeNull();
    });
  });
});

// =============================================================================
// Extra Reducers Tests
// =============================================================================

describe('eventSlice extraReducers', () => {
  describe('fetchUserEvents', () => {
    it('should set loading to true on pending', () => {
      const action = { type: fetchUserEvents.pending.type };
      const nextState = eventReducer(initialState, action);

      expect(nextState.loading).toBe(true);
      expect(nextState.error).toBeNull();
      expect(nextState.syncStatus).toBe('syncing');
    });

    it('should add events on fulfilled', () => {
      const events = [mockEvent];
      const action = { type: fetchUserEvents.fulfilled.type, payload: events };
      const nextState = eventReducer(initialState, action);

      expect(nextState.loading).toBe(false);
      expect(nextState.syncStatus).toBe('synced');
      expect(nextState.events['event-1']).toEqual(mockEvent);
      expect(nextState.eventIdsByDate['2024-01-15']).toContain('event-1');
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchUserEvents.rejected.type,
        payload: { message: 'Fetch failed' },
      };
      const nextState = eventReducer(initialState, action);

      expect(nextState.loading).toBe(false);
      expect(nextState.error).toBe('Fetch failed');
      expect(nextState.syncStatus).toBe('error');
    });
  });

  describe('fetchEventsByDate', () => {
    it('should replace events for the date on fulfilled', () => {
      const existingState: EventsState = {
        ...initialState,
        events: { 'old-event': { ...mockEvent, id: 'old-event' } },
        eventIdsByDate: { '2024-01-15': ['old-event'] },
      };

      const newEvent = { ...mockEvent, id: 'new-event' };
      const action = {
        type: fetchEventsByDate.fulfilled.type,
        payload: { events: [newEvent], date: '2024-01-15' },
      };

      const nextState = eventReducer(existingState, action);

      expect(nextState.events['new-event']).toEqual(newEvent);
      expect(nextState.events['old-event']).toBeUndefined();
      expect(nextState.eventIdsByDate['2024-01-15']).toEqual(['new-event']);
    });
  });

  describe('createEventAsync', () => {
    it('should add event on fulfilled', () => {
      const action = { type: createEventAsync.fulfilled.type, payload: mockEvent };
      const nextState = eventReducer(initialState, action);

      expect(nextState.events['event-1']).toEqual(mockEvent);
      expect(nextState.eventIdsByDate['2024-01-15']).toContain('event-1');
      expect(nextState.syncStatus).toBe('synced');
    });

    it('should add recurring event to recurringParentEvents', () => {
      const action = { type: createEventAsync.fulfilled.type, payload: mockRecurringEvent };
      const nextState = eventReducer(initialState, action);

      expect(nextState.events['event-2']).toEqual(mockRecurringEvent);
      expect(nextState.recurringParentEvents['event-2']).toEqual(mockRecurringEvent);
    });
  });

  describe('updateEventAsync', () => {
    it('should update event on fulfilled', () => {
      const existingState: EventsState = {
        ...initialState,
        events: { 'event-1': mockEvent },
        eventIdsByDate: { '2024-01-15': ['event-1'] },
      };

      const updatedEvent = { ...mockEvent, title: 'Updated Title' };
      const action = { type: updateEventAsync.fulfilled.type, payload: updatedEvent };

      const nextState = eventReducer(existingState, action);

      expect(nextState.events['event-1'].title).toBe('Updated Title');
    });

    it('should handle date change', () => {
      const existingState: EventsState = {
        ...initialState,
        events: { 'event-1': mockEvent },
        eventIdsByDate: { '2024-01-15': ['event-1'] },
      };

      const updatedEvent = {
        ...mockEvent,
        startTime: new Date('2024-01-16T10:00:00Z'),
      };
      const action = { type: updateEventAsync.fulfilled.type, payload: updatedEvent };

      const nextState = eventReducer(existingState, action);

      expect(nextState.eventIdsByDate['2024-01-15']).toBeUndefined();
      expect(nextState.eventIdsByDate['2024-01-16']).toContain('event-1');
    });
  });

  describe('deleteEventAsync', () => {
    it('should remove event on fulfilled', () => {
      const existingState: EventsState = {
        ...initialState,
        events: { 'event-1': mockEvent },
        eventIdsByDate: { '2024-01-15': ['event-1'] },
      };

      const action = { type: deleteEventAsync.fulfilled.type, payload: 'event-1' };

      const nextState = eventReducer(existingState, action);

      expect(nextState.events['event-1']).toBeUndefined();
      expect(nextState.eventIdsByDate['2024-01-15']).toBeUndefined();
    });
  });

  describe('fetchRecurringEvents', () => {
    it('should store recurring parent events on fulfilled', () => {
      const action = {
        type: fetchRecurringEvents.fulfilled.type,
        payload: [mockRecurringEvent],
      };

      const nextState = eventReducer(initialState, action);

      expect(nextState.recurringEventsLoaded).toBe(true);
      expect(nextState.recurringParentEvents['event-2']).toEqual(mockRecurringEvent);
    });
  });
});

// =============================================================================
// Selector Tests
// =============================================================================

describe('eventSlice selectors', () => {
  describe('selectAllEvents', () => {
    it('should return all events as an array', () => {
      const state = createMockRootState({
        events: { 'event-1': mockEvent, 'event-2': mockRecurringEvent },
      });

      const result = selectAllEvents(state);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockEvent);
      expect(result).toContainEqual(mockRecurringEvent);
    });

    it('should return empty array when no events', () => {
      const state = createMockRootState();
      const result = selectAllEvents(state);

      expect(result).toEqual([]);
    });
  });

  describe('selectEventById', () => {
    it('should return event by ID', () => {
      const state = createMockRootState({
        events: { 'event-1': mockEvent },
      });

      const result = selectEventById(state, 'event-1');

      expect(result).toEqual(mockEvent);
    });

    it('should return undefined for non-existent ID', () => {
      const state = createMockRootState();
      const result = selectEventById(state, 'non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('selectEventsByDate', () => {
    it('should return events for a specific date', () => {
      const state = createMockRootState({
        events: { 'event-1': mockEvent },
        eventIdsByDate: { '2024-01-15': ['event-1'] },
      });

      const result = selectEventsByDate(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEvent);
    });

    it('should return empty array for date with no events', () => {
      const state = createMockRootState();
      const result = selectEventsByDate(state, '2024-01-15');

      expect(result).toEqual([]);
    });
  });

  describe('selectEventsWithRecurringInstances', () => {
    it('should return regular events when no recurring events', () => {
      const state = createMockRootState({
        events: { 'event-1': mockEvent },
        eventIdsByDate: { '2024-01-15': ['event-1'] },
        recurringParentEvents: {},
      });

      const result = selectEventsWithRecurringInstances(state, '2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEvent);
    });
  });

  describe('selectEventsLoading', () => {
    it('should return loading state', () => {
      const state = createMockRootState({ loading: true });
      expect(selectEventsLoading(state)).toBe(true);
    });
  });

  describe('selectEventsError', () => {
    it('should return error message', () => {
      const state = createMockRootState({ error: 'Test error' });
      expect(selectEventsError(state)).toBe('Test error');
    });
  });

  describe('selectEventsSyncStatus', () => {
    it('should return sync status', () => {
      const state = createMockRootState({ syncStatus: 'syncing' });
      expect(selectEventsSyncStatus(state)).toBe('syncing');
    });
  });

  describe('selectRecurringEventsLoaded', () => {
    it('should return recurring events loaded state', () => {
      const state = createMockRootState({ recurringEventsLoaded: true });
      expect(selectRecurringEventsLoaded(state)).toBe(true);
    });
  });

  describe('selectRecurringParentEvents', () => {
    it('should return recurring parent events', () => {
      const state = createMockRootState({
        recurringParentEvents: { 'event-2': mockRecurringEvent },
      });

      const result = selectRecurringParentEvents(state);

      expect(result).toEqual({ 'event-2': mockRecurringEvent });
    });
  });
});
