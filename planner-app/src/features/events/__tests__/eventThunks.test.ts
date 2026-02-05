/**
 * Event Thunks Tests
 *
 * Tests for the event async thunks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import eventReducer from '../eventSlice';
import {
  fetchUserEvents,
  fetchEventsByDate,
  createEventAsync,
  updateEventAsync,
  deleteEventAsync,
  fetchRecurringEvents,
  restoreEventAsync,
  hardDeleteEventAsync,
} from '../eventThunks';
import * as eventsService from '../../../services/firebase/events.service';
import type { Event, CreateEventInput, UpdateEventInput } from '../../../types';

// Mock the events service
vi.mock('../../../services/firebase/events.service');

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

function createTestStore() {
  return configureStore({
    reducer: {
      events: eventReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests with Date objects
      }),
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('eventThunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUserEvents', () => {
    it('should fetch all user events successfully', async () => {
      const mockEvents = [mockEvent, mockRecurringEvent];
      vi.mocked(eventsService.getUserEvents).mockResolvedValue(mockEvents);

      const store = createTestStore();
      const result = await store.dispatch(
        fetchUserEvents({ userId: 'user-1' })
      );

      expect(result.type).toBe(fetchUserEvents.fulfilled.type);
      expect(result.payload).toEqual(mockEvents);
      expect(eventsService.getUserEvents).toHaveBeenCalledWith('user-1');
    });

    it('should handle errors', async () => {
      const error = new Error('Fetch failed');
      vi.mocked(eventsService.getUserEvents).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        fetchUserEvents({ userId: 'user-1' })
      );

      expect(result.type).toBe(fetchUserEvents.rejected.type);
      expect(result.payload).toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchEventsByDate', () => {
    it('should fetch events for a specific date successfully', async () => {
      const date = new Date('2024-01-15');
      const mockEvents = [mockEvent];
      vi.mocked(eventsService.getEventsByDate).mockResolvedValue(mockEvents);

      const store = createTestStore();
      const result = await store.dispatch(
        fetchEventsByDate({ userId: 'user-1', date })
      );

      expect(result.type).toBe(fetchEventsByDate.fulfilled.type);
      expect(result.payload).toEqual({
        events: mockEvents,
        date: '2024-01-15',
      });
      expect(eventsService.getEventsByDate).toHaveBeenCalledWith('user-1', date);
    });

    it('should handle errors', async () => {
      const date = new Date('2024-01-15');
      const error = new Error('Fetch failed');
      vi.mocked(eventsService.getEventsByDate).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        fetchEventsByDate({ userId: 'user-1', date })
      );

      expect(result.type).toBe(fetchEventsByDate.rejected.type);
      expect(result.payload).toEqual({ message: 'Fetch failed' });
    });
  });

  describe('createEventAsync', () => {
    it('should create an event successfully', async () => {
      const input: CreateEventInput = {
        title: 'New Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
      };

      vi.mocked(eventsService.createEvent).mockResolvedValue(mockEvent);

      const store = createTestStore();
      const result = await store.dispatch(
        createEventAsync({ input, userId: 'user-1' })
      );

      expect(result.type).toBe(createEventAsync.fulfilled.type);
      expect(result.payload).toEqual(mockEvent);
      expect(eventsService.createEvent).toHaveBeenCalledWith(input, 'user-1');
    });

    it('should handle errors', async () => {
      const input: CreateEventInput = {
        title: 'New Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
      };

      const error = new Error('Create failed');
      vi.mocked(eventsService.createEvent).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        createEventAsync({ input, userId: 'user-1' })
      );

      expect(result.type).toBe(createEventAsync.rejected.type);
      expect(result.payload).toEqual({ message: 'Create failed' });
    });
  });

  describe('updateEventAsync', () => {
    it('should update an event successfully', async () => {
      const input: UpdateEventInput & { userId: string } = {
        id: 'event-1',
        title: 'Updated Title',
        userId: 'user-1',
      };

      const updatedEvent = { ...mockEvent, title: 'Updated Title' };
      vi.mocked(eventsService.updateEvent).mockResolvedValue(updatedEvent);

      const store = createTestStore();
      const result = await store.dispatch(updateEventAsync(input));

      expect(result.type).toBe(updateEventAsync.fulfilled.type);
      expect(result.payload).toEqual(updatedEvent);
      expect(eventsService.updateEvent).toHaveBeenCalledWith(
        { id: 'event-1', title: 'Updated Title' },
        'user-1'
      );
    });

    it('should handle errors', async () => {
      const input: UpdateEventInput & { userId: string } = {
        id: 'event-1',
        title: 'Updated Title',
        userId: 'user-1',
      };

      const error = new Error('Update failed');
      vi.mocked(eventsService.updateEvent).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(updateEventAsync(input));

      expect(result.type).toBe(updateEventAsync.rejected.type);
      expect(result.payload).toEqual({ message: 'Update failed' });
    });
  });

  describe('deleteEventAsync', () => {
    it('should delete an event successfully', async () => {
      vi.mocked(eventsService.deleteEvent).mockResolvedValue(undefined);

      const store = createTestStore();
      const result = await store.dispatch(
        deleteEventAsync({ eventId: 'event-1', userId: 'user-1' })
      );

      expect(result.type).toBe(deleteEventAsync.fulfilled.type);
      expect(result.payload).toBe('event-1');
      expect(eventsService.deleteEvent).toHaveBeenCalledWith('event-1', 'user-1');
    });

    it('should handle errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(eventsService.deleteEvent).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        deleteEventAsync({ eventId: 'event-1', userId: 'user-1' })
      );

      expect(result.type).toBe(deleteEventAsync.rejected.type);
      expect(result.payload).toEqual({ message: 'Delete failed' });
    });
  });

  describe('fetchRecurringEvents', () => {
    it('should fetch recurring events successfully', async () => {
      const mockEvents = [mockRecurringEvent];
      vi.mocked(eventsService.getRecurringEvents).mockResolvedValue(mockEvents);

      const store = createTestStore();
      const result = await store.dispatch(
        fetchRecurringEvents({ userId: 'user-1' })
      );

      expect(result.type).toBe(fetchRecurringEvents.fulfilled.type);
      expect(result.payload).toEqual(mockEvents);
      expect(eventsService.getRecurringEvents).toHaveBeenCalledWith('user-1');
    });

    it('should handle errors', async () => {
      const error = new Error('Fetch failed');
      vi.mocked(eventsService.getRecurringEvents).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        fetchRecurringEvents({ userId: 'user-1' })
      );

      expect(result.type).toBe(fetchRecurringEvents.rejected.type);
      expect(result.payload).toEqual({ message: 'Fetch failed' });
    });
  });

  describe('restoreEventAsync', () => {
    it('should restore a soft-deleted event successfully', async () => {
      const restoredEvent = { ...mockEvent, deletedAt: null };
      vi.mocked(eventsService.restoreEvent).mockResolvedValue(restoredEvent);

      const store = createTestStore();
      const result = await store.dispatch(
        restoreEventAsync({ eventId: 'event-1', userId: 'user-1' })
      );

      expect(result.type).toBe(restoreEventAsync.fulfilled.type);
      expect(result.payload).toEqual(restoredEvent);
      expect(eventsService.restoreEvent).toHaveBeenCalledWith('event-1', 'user-1');
    });

    it('should handle errors', async () => {
      const error = new Error('Restore failed');
      vi.mocked(eventsService.restoreEvent).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        restoreEventAsync({ eventId: 'event-1', userId: 'user-1' })
      );

      expect(result.type).toBe(restoreEventAsync.rejected.type);
      expect(result.payload).toEqual({ message: 'Restore failed' });
    });
  });

  describe('hardDeleteEventAsync', () => {
    it('should permanently delete an event successfully', async () => {
      vi.mocked(eventsService.hardDeleteEvent).mockResolvedValue(undefined);

      const store = createTestStore();
      const result = await store.dispatch(
        hardDeleteEventAsync({ eventId: 'event-1', userId: 'user-1' })
      );

      expect(result.type).toBe(hardDeleteEventAsync.fulfilled.type);
      expect(result.payload).toBe('event-1');
      expect(eventsService.hardDeleteEvent).toHaveBeenCalledWith('event-1', 'user-1');
    });

    it('should handle errors', async () => {
      const error = new Error('Hard delete failed');
      vi.mocked(eventsService.hardDeleteEvent).mockRejectedValue(error);

      const store = createTestStore();
      const result = await store.dispatch(
        hardDeleteEventAsync({ eventId: 'event-1', userId: 'user-1' })
      );

      expect(result.type).toBe(hardDeleteEventAsync.rejected.type);
      expect(result.payload).toEqual({ message: 'Hard delete failed' });
    });
  });
});
