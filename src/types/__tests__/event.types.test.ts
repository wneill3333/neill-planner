import { describe, it, expect } from 'vitest';
import { DEFAULT_EVENT_VALUES } from '../event.types';
import type { Event, CreateEventInput, UpdateEventInput, EventsByDate } from '../event.types';
import type { RecurrencePattern } from '../task.types';

describe('Event Types', () => {
  // ===========================================================================
  // Event Interface Tests
  // ===========================================================================
  describe('Event', () => {
    const createValidEvent = (): Event => ({
      id: 'event-123',
      userId: 'user-456',
      title: 'Team Meeting',
      description: 'Weekly team sync',
      categoryId: 'category-789',
      startTime: new Date('2026-01-25T09:00:00'),
      endTime: new Date('2026-01-25T10:00:00'),
      location: 'Conference Room A',
      isConfidential: false,
      alternateTitle: null,
      recurrence: null,
      linkedNoteIds: ['note-1'],
      linkedTaskIds: ['task-1', 'task-2'],
      googleCalendarId: 'gcal-abc123',
      isRecurringInstance: false,
      recurringParentId: null,
      instanceDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    it('should create a valid event with all required fields', () => {
      const event = createValidEvent();
      expect(event.id).toBe('event-123');
      expect(event.userId).toBe('user-456');
      expect(event.title).toBe('Team Meeting');
      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
    });

    it('should support confidential events', () => {
      const event: Event = {
        ...createValidEvent(),
        isConfidential: true,
        alternateTitle: 'Busy',
      };
      expect(event.isConfidential).toBe(true);
      expect(event.alternateTitle).toBe('Busy');
    });

    it('should support Google Calendar integration', () => {
      const event = createValidEvent();
      expect(event.googleCalendarId).toBe('gcal-abc123');
    });

    it('should allow null for optional fields', () => {
      const event: Event = {
        ...createValidEvent(),
        categoryId: null,
        alternateTitle: null,
        recurrence: null,
        googleCalendarId: null,
        recurringParentId: null,
        instanceDate: null,
        deletedAt: null,
      };
      expect(event.categoryId).toBeNull();
      expect(event.googleCalendarId).toBeNull();
    });

    it('should support recurring event instances', () => {
      const event: Event = {
        ...createValidEvent(),
        isRecurringInstance: true,
        recurringParentId: 'parent-event-123',
        instanceDate: new Date('2026-01-25'),
      };
      expect(event.isRecurringInstance).toBe(true);
      expect(event.recurringParentId).toBe('parent-event-123');
    });

    it('should support linked tasks and notes', () => {
      const event = createValidEvent();
      expect(event.linkedNoteIds).toHaveLength(1);
      expect(event.linkedTaskIds).toHaveLength(2);
    });

    it('should support recurrence patterns', () => {
      const recurrence: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5],
        dayOfMonth: null,
        monthOfYear: null,
        endCondition: { type: 'never', endDate: null, maxOccurrences: null },
        exceptions: [],
      };
      const event: Event = {
        ...createValidEvent(),
        recurrence,
      };
      expect(event.recurrence?.type).toBe('weekly');
      expect(event.recurrence?.daysOfWeek).toEqual([1, 3, 5]);
    });

    it('should support soft delete', () => {
      const deletedAt = new Date();
      const event: Event = {
        ...createValidEvent(),
        deletedAt,
      };
      expect(event.deletedAt).toEqual(deletedAt);
    });
  });

  // ===========================================================================
  // Input Types Tests
  // ===========================================================================
  describe('CreateEventInput', () => {
    it('should require title, startTime, and endTime', () => {
      const input: CreateEventInput = {
        title: 'New Event',
        startTime: new Date('2026-01-25T14:00:00'),
        endTime: new Date('2026-01-25T15:00:00'),
      };
      expect(input.title).toBe('New Event');
      expect(input.startTime).toBeInstanceOf(Date);
      expect(input.endTime).toBeInstanceOf(Date);
    });

    it('should allow optional fields', () => {
      const input: CreateEventInput = {
        title: 'New Event',
        startTime: new Date('2026-01-25T14:00:00'),
        endTime: new Date('2026-01-25T15:00:00'),
        description: 'Event description',
        categoryId: 'cat-123',
        location: 'Room 101',
        isConfidential: true,
        alternateTitle: 'Private',
        linkedNoteIds: ['note-1'],
        linkedTaskIds: ['task-1'],
      };
      expect(input.description).toBe('Event description');
      expect(input.isConfidential).toBe(true);
    });
  });

  describe('UpdateEventInput', () => {
    it('should require only id', () => {
      const input: UpdateEventInput = {
        id: 'event-123',
      };
      expect(input.id).toBe('event-123');
    });

    it('should allow partial updates', () => {
      const input: UpdateEventInput = {
        id: 'event-123',
        title: 'Updated Title',
        location: 'New Location',
      };
      expect(input.title).toBe('Updated Title');
      expect(input.location).toBe('New Location');
    });

    it('should allow updating time', () => {
      const input: UpdateEventInput = {
        id: 'event-123',
        startTime: new Date('2026-01-25T16:00:00'),
        endTime: new Date('2026-01-25T17:00:00'),
      };
      expect(input.startTime).toBeInstanceOf(Date);
      expect(input.endTime).toBeInstanceOf(Date);
    });
  });

  // ===========================================================================
  // Utility Types Tests
  // ===========================================================================
  describe('EventsByDate', () => {
    it('should organize events by date string', () => {
      const eventsByDate: EventsByDate = {
        '2026-01-25': [],
        '2026-01-26': [],
      };
      expect(Object.keys(eventsByDate)).toHaveLength(2);
    });
  });

  describe('DEFAULT_EVENT_VALUES', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_EVENT_VALUES.description).toBe('');
      expect(DEFAULT_EVENT_VALUES.categoryId).toBeNull();
      expect(DEFAULT_EVENT_VALUES.location).toBe('');
      expect(DEFAULT_EVENT_VALUES.isConfidential).toBe(false);
      expect(DEFAULT_EVENT_VALUES.alternateTitle).toBeNull();
      expect(DEFAULT_EVENT_VALUES.recurrence).toBeNull();
      expect(DEFAULT_EVENT_VALUES.linkedNoteIds).toEqual([]);
      expect(DEFAULT_EVENT_VALUES.linkedTaskIds).toEqual([]);
      expect(DEFAULT_EVENT_VALUES.googleCalendarId).toBeNull();
      expect(DEFAULT_EVENT_VALUES.isRecurringInstance).toBe(false);
      expect(DEFAULT_EVENT_VALUES.deletedAt).toBeNull();
    });
  });
});
