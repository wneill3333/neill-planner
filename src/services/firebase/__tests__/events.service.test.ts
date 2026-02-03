import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CreateEventInput, UpdateEventInput } from '../../../types';

// Mock Firestore
const mockAddDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }),
  },
}));

vi.mock('../config', () => ({
  db: { name: 'mock-db' },
}));

describe('Events Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('events-collection');
    mockDoc.mockReturnValue('event-doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
    mockOrderBy.mockReturnValue('order-clause');
  });

  describe('createEvent', () => {
    it('should create an event with auto-generated fields', async () => {
      const { createEvent } = await import('../events.service');

      mockAddDoc.mockResolvedValue({ id: 'new-event-id' });

      const startTime = new Date('2026-01-25T09:00:00');
      const endTime = new Date('2026-01-25T10:00:00');

      const input: CreateEventInput = {
        title: 'Test Event',
        startTime,
        endTime,
      };

      const result = await createEvent(input, 'user-123');

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-event-id');
      expect(result.userId).toBe('user-123');
      expect(result.title).toBe('Test Event');
      expect(result.startTime).toEqual(startTime);
      expect(result.endTime).toEqual(endTime);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });

    it('should set default values for optional fields', async () => {
      const { createEvent } = await import('../events.service');

      mockAddDoc.mockResolvedValue({ id: 'new-event-id' });

      const input: CreateEventInput = {
        title: 'Minimal Event',
        startTime: new Date('2026-01-25T09:00:00'),
        endTime: new Date('2026-01-25T10:00:00'),
      };

      const result = await createEvent(input, 'user-123');

      expect(result.description).toBe('');
      expect(result.categoryId).toBeNull();
      expect(result.location).toBe('');
      expect(result.isConfidential).toBe(false);
      expect(result.alternateTitle).toBeNull();
      expect(result.recurrence).toBeNull();
      expect(result.linkedNoteIds).toEqual([]);
      expect(result.linkedTaskIds).toEqual([]);
      expect(result.googleCalendarId).toBeNull();
      expect(result.isRecurringInstance).toBe(false);
      expect(result.recurringParentId).toBeNull();
      expect(result.instanceDate).toBeNull();
    });

    it('should throw validation error for missing title', async () => {
      const { createEvent } = await import('../events.service');

      const input = {
        title: '',
        startTime: new Date('2026-01-25T09:00:00'),
        endTime: new Date('2026-01-25T10:00:00'),
      } as CreateEventInput;

      await expect(createEvent(input, 'user-123')).rejects.toThrow('Title is required');
    });

    it('should throw validation error when end time is before start time', async () => {
      const { createEvent } = await import('../events.service');

      const input: CreateEventInput = {
        title: 'Invalid Event',
        startTime: new Date('2026-01-25T10:00:00'),
        endTime: new Date('2026-01-25T09:00:00'),
      };

      await expect(createEvent(input, 'user-123')).rejects.toThrow('End time must be after start time');
    });
  });

  describe('getEvent', () => {
    it('should return event when found', async () => {
      const { getEvent } = await import('../events.service');

      const mockEvent = {
        userId: 'user-123',
        title: 'Found Event',
        description: 'Test description',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: 'Office',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => mockEvent,
      });

      const result = await getEvent('event-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('event-123');
      expect(result?.title).toBe('Found Event');
      expect(result?.location).toBe('Office');
    });

    it('should return null when event not found', async () => {
      const { getEvent } = await import('../events.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getEvent('non-existent', 'user-123');

      expect(result).toBeNull();
    });

    it('should throw authorization error when user does not own event', async () => {
      const { getEvent } = await import('../events.service');

      const mockEvent = {
        userId: 'other-user',
        title: 'Other User Event',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => mockEvent,
      });

      await expect(getEvent('event-123', 'user-123')).rejects.toThrow('Unauthorized access to event');
    });
  });

  describe('getUserEvents', () => {
    it('should return all events for user sorted by startTime', async () => {
      const { getUserEvents } = await import('../events.service');

      const mockEvents = [
        {
          id: 'event-1',
          data: () => ({
            userId: 'user-123',
            title: 'Event 1',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
        {
          id: 'event-2',
          data: () => ({
            userId: 'user-123',
            title: 'Event 2',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-25T11:00:00') },
            endTime: { toDate: () => new Date('2026-01-25T12:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockEvents });

      const result = await getUserEvents('user-123');

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Event 1');
      expect(result[1].title).toBe('Event 2');
    });

    it('should return empty array when no events found', async () => {
      const { getUserEvents } = await import('../events.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getUserEvents('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getEventsByDate', () => {
    it('should return events for a specific date', async () => {
      const { getEventsByDate } = await import('../events.service');

      const mockEvents = [
        {
          id: 'event-1',
          data: () => ({
            userId: 'user-123',
            title: 'Day Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      // First call for events starting in range
      mockGetDocs.mockResolvedValueOnce({ docs: mockEvents });
      // Second call for spanning events
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      const result = await getEventsByDate('user-123', new Date('2026-01-25'));

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Day Event');
    });

    it('should return empty array when no events for date', async () => {
      const { getEventsByDate } = await import('../events.service');

      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getEventsByDate('user-123', new Date('2026-01-25'));

      expect(result).toEqual([]);
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events within date range', async () => {
      const { getEventsByDateRange } = await import('../events.service');

      const mockEvents = [
        {
          id: 'event-1',
          data: () => ({
            userId: 'user-123',
            title: 'Range Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-15T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-15T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      // First call for events starting in range
      mockGetDocs.mockResolvedValueOnce({ docs: mockEvents });
      // Second call for spanning events
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const result = await getEventsByDateRange('user-123', startDate, endDate);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should include events that span into the range', async () => {
      const { getEventsByDateRange } = await import('../events.service');

      // Event starting in range
      const eventsInRange = [
        {
          id: 'event-1',
          data: () => ({
            userId: 'user-123',
            title: 'In Range Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-15T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-15T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      // Event spanning into range (starts before, ends during)
      const spanningEvents = [
        {
          id: 'event-2',
          data: () => ({
            userId: 'user-123',
            title: 'Spanning Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2025-12-30T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-05T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      // First call for events starting in range
      mockGetDocs.mockResolvedValueOnce({ docs: eventsInRange });
      // Second call for spanning events
      mockGetDocs.mockResolvedValueOnce({ docs: spanningEvents });

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const result = await getEventsByDateRange('user-123', startDate, endDate);

      expect(result).toHaveLength(2);
      // Should be sorted by startTime, so spanning event first
      expect(result[0].title).toBe('Spanning Event');
      expect(result[1].title).toBe('In Range Event');
    });
  });

  describe('updateEvent', () => {
    it('should update event and return updated version', async () => {
      const { updateEvent } = await import('../events.service');

      const existingEvent = {
        userId: 'user-123',
        title: 'Original Event',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => existingEvent,
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      const input: UpdateEventInput = {
        id: 'event-123',
        title: 'Updated Event',
        location: 'New Location',
      };

      const result = await updateEvent(input, 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.title).toBe('Updated Event');
      expect(result.location).toBe('New Location');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when event not found', async () => {
      const { updateEvent } = await import('../events.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const input: UpdateEventInput = {
        id: 'non-existent',
        title: 'Updated Event',
      };

      await expect(updateEvent(input, 'user-123')).rejects.toThrow('Event not found');
    });

    it('should throw authorization error when user does not own event', async () => {
      const { updateEvent } = await import('../events.service');

      const existingEvent = {
        userId: 'other-user',
        title: 'Other User Event',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => existingEvent,
      });

      const input: UpdateEventInput = {
        id: 'event-123',
        title: 'Updated Event',
      };

      await expect(updateEvent(input, 'user-123')).rejects.toThrow('Unauthorized access to event');
    });
  });

  describe('deleteEvent', () => {
    it('should set deletedAt timestamp (soft delete)', async () => {
      const { deleteEvent } = await import('../events.service');

      const existingEvent = {
        userId: 'user-123',
        title: 'Event to Delete',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => existingEvent,
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await deleteEvent('event-123', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toHaveProperty('deletedAt');
      expect(updateCall[1]).toHaveProperty('updatedAt');
    });

    it('should throw error when event not found', async () => {
      const { deleteEvent } = await import('../events.service');

      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(deleteEvent('non-existent', 'user-123')).rejects.toThrow('Event not found');
    });

    it('should throw authorization error when user does not own event', async () => {
      const { deleteEvent } = await import('../events.service');

      const existingEvent = {
        userId: 'other-user',
        title: 'Other User Event',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => existingEvent,
      });

      await expect(deleteEvent('event-123', 'user-123')).rejects.toThrow('Unauthorized access to event');
    });
  });

  describe('hardDeleteEvent', () => {
    it('should permanently delete the event', async () => {
      const { hardDeleteEvent } = await import('../events.service');

      const existingEvent = {
        userId: 'user-123',
        title: 'Event to Delete',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: null,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => existingEvent,
      });
      mockDeleteDoc.mockResolvedValue(undefined);

      await hardDeleteEvent('event-123', 'user-123');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('restoreEvent', () => {
    it('should clear deletedAt and return restored event', async () => {
      const { restoreEvent } = await import('../events.service');

      const existingEvent = {
        userId: 'user-123',
        title: 'Restored Event',
        description: '',
        categoryId: null,
        startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
        endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
        location: '',
        isConfidential: false,
        alternateTitle: null,
        recurrence: null,
        linkedNoteIds: [],
        linkedTaskIds: [],
        googleCalendarId: null,
        isRecurringInstance: false,
        recurringParentId: null,
        instanceDate: null,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        deletedAt: { toDate: () => new Date() },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'event-123',
        data: () => existingEvent,
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await restoreEvent('event-123', 'user-123');

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1].deletedAt).toBeNull();
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('getRecurringEvents', () => {
    it('should return only events with recurrence patterns', async () => {
      const { getRecurringEvents } = await import('../events.service');

      const mockEvents = [
        {
          id: 'event-1',
          data: () => ({
            userId: 'user-123',
            title: 'Non-recurring Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
        {
          id: 'event-2',
          data: () => ({
            userId: 'user-123',
            title: 'Recurring Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-25T11:00:00') },
            endTime: { toDate: () => new Date('2026-01-25T12:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: {
              type: 'weekly',
              interval: 1,
              daysOfWeek: [1],
              dayOfMonth: null,
              monthOfYear: null,
              endCondition: {
                type: 'never',
                endDate: null,
                occurrences: null,
              },
              exceptions: [],
            },
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockEvents });

      const result = await getRecurringEvents('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Recurring Event');
      expect(result[0].recurrence).not.toBeNull();
    });
  });

  describe('getAllEventsForUser', () => {
    it('should return all events including soft-deleted', async () => {
      const { getAllEventsForUser } = await import('../events.service');

      const mockEvents = [
        {
          id: 'event-1',
          data: () => ({
            userId: 'user-123',
            title: 'Active Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-25T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-25T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
          }),
        },
        {
          id: 'event-2',
          data: () => ({
            userId: 'user-123',
            title: 'Deleted Event',
            description: '',
            categoryId: null,
            startTime: { toDate: () => new Date('2026-01-24T09:00:00') },
            endTime: { toDate: () => new Date('2026-01-24T10:00:00') },
            location: '',
            isConfidential: false,
            alternateTitle: null,
            recurrence: null,
            linkedNoteIds: [],
            linkedTaskIds: [],
            googleCalendarId: null,
            isRecurringInstance: false,
            recurringParentId: null,
            instanceDate: null,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: { toDate: () => new Date() },
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockEvents });

      const result = await getAllEventsForUser('user-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('validation', () => {
    it('should reject invalid user ID', async () => {
      const { createEvent } = await import('../events.service');

      const input: CreateEventInput = {
        title: 'Test Event',
        startTime: new Date('2026-01-25T09:00:00'),
        endTime: new Date('2026-01-25T10:00:00'),
      };

      await expect(createEvent(input, '')).rejects.toThrow('userId is required');
    });

    it('should reject invalid event ID', async () => {
      const { getEvent } = await import('../events.service');

      await expect(getEvent('', 'user-123')).rejects.toThrow('eventId is required');
    });

    it('should reject invalid date range', async () => {
      const { getEventsByDateRange } = await import('../events.service');

      const startDate = new Date('2026-01-31');
      const endDate = new Date('2026-01-01');

      await expect(getEventsByDateRange('user-123', startDate, endDate)).rejects.toThrow(
        'Start date must be before or equal to end date'
      );
    });
  });

  describe('Firestore error handling', () => {
    it('should handle Firestore errors in createEvent', async () => {
      const { createEvent } = await import('../events.service');

      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      const input: CreateEventInput = {
        title: 'Test Event',
        startTime: new Date('2026-01-25T09:00:00'),
        endTime: new Date('2026-01-25T10:00:00'),
      };

      await expect(createEvent(input, 'user-123')).rejects.toThrow('Failed to create event');
    });

    it('should handle Firestore errors in getEvent', async () => {
      const { getEvent } = await import('../events.service');

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(getEvent('event-123', 'user-123')).rejects.toThrow('Failed to fetch event');
    });

    it('should handle Firestore errors in updateEvent', async () => {
      const { updateEvent } = await import('../events.service');

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      const input: UpdateEventInput = {
        id: 'event-123',
        title: 'Updated Event',
      };

      await expect(updateEvent(input, 'user-123')).rejects.toThrow('Failed to update event');
    });

    it('should handle Firestore errors in deleteEvent', async () => {
      const { deleteEvent } = await import('../events.service');

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(deleteEvent('event-123', 'user-123')).rejects.toThrow('Failed to soft delete event');
    });
  });
});
