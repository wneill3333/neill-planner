/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  convertEventToGoogleEvent,
  convertGoogleEventToEvent,
  syncEventToGoogle,
  syncEventsToGoogle,
  updateEventInGoogle,
  deleteEventFromGoogle,
  importEventsFromGoogle,
  detectConflicts,
} from '../syncService';
import type { Event } from '../../../types';
import type { GoogleCalendarEvent, GoogleCalendarCredentials } from '../../../types/googleCalendar.types';
import * as googleCalendarService from '../googleCalendarService';

// Mock the Google Calendar service
vi.mock('../googleCalendarService', () => ({
  setAccessToken: vi.fn(),
  isConnected: vi.fn(() => true),
  createCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  getCalendarEvents: vi.fn(),
}));

describe('syncService', () => {
  const mockUserId = 'user123';
  const mockCredentials: GoogleCalendarCredentials = {
    accessToken: 'mock-token',
    refreshToken: '',
    expiresAt: new Date(Date.now() + 3600000),
    scope: 'https://www.googleapis.com/auth/calendar',
    updatedAt: new Date(),
  };

  const mockEvent: Event = {
    id: 'event1',
    userId: mockUserId,
    title: 'Team Meeting',
    description: 'Quarterly planning session',
    categoryId: 'cat1',
    startTime: new Date('2026-02-05T10:00:00Z'),
    endTime: new Date('2026-02-05T11:00:00Z'),
    location: 'Conference Room A',
    isConfidential: false,
    alternateTitle: null,
    color: null,
    recurrence: null,
    googleCalendarId: null,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date('2026-02-01T00:00:00Z'),
    updatedAt: new Date('2026-02-01T00:00:00Z'),
    deletedAt: null,
  };

  const mockGoogleEvent: GoogleCalendarEvent = {
    id: 'gcal123',
    summary: 'Team Meeting',
    description: 'Quarterly planning session',
    start: { dateTime: '2026-02-05T10:00:00Z' },
    end: { dateTime: '2026-02-05T11:00:00Z' },
    location: 'Conference Room A',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset isConnected to return true by default
    vi.mocked(googleCalendarService.isConnected).mockReturnValue(true);
  });

  describe('convertEventToGoogleEvent', () => {
    it('should convert normal event to Google format', () => {
      const result = convertEventToGoogleEvent(mockEvent);

      expect(result).toEqual({
        summary: 'Team Meeting',
        description: 'Quarterly planning session',
        start: { dateTime: mockEvent.startTime.toISOString() },
        end: { dateTime: mockEvent.endTime.toISOString() },
        location: 'Conference Room A',
      });
    });

    it('should use alternate title for confidential events', () => {
      const confidentialEvent = {
        ...mockEvent,
        isConfidential: true,
        alternateTitle: 'Private Meeting',
      };

      const result = convertEventToGoogleEvent(confidentialEvent);

      expect(result.summary).toBe('Private Meeting');
      expect(result.visibility).toBe('private');
      expect(result.description).toContain('[This event contains confidential information in Neill Planner]');
    });

    it('should handle events without description or location', () => {
      const minimalEvent = {
        ...mockEvent,
        description: '',
        location: '',
      };

      const result = convertEventToGoogleEvent(minimalEvent);

      expect(result.description).toBeUndefined();
      expect(result.location).toBeUndefined();
    });

    it('should set visibility for confidential events without alternate title', () => {
      const confidentialEvent = {
        ...mockEvent,
        isConfidential: true,
        alternateTitle: null,
      };

      const result = convertEventToGoogleEvent(confidentialEvent);

      expect(result.summary).toBe('Team Meeting');
      expect(result.visibility).toBe('private');
    });
  });

  describe('convertGoogleEventToEvent', () => {
    it('should convert Google event to Neill Planner format', () => {
      const result = convertGoogleEventToEvent(mockGoogleEvent, mockUserId);

      expect(result.userId).toBe(mockUserId);
      expect(result.title).toBe('Team Meeting');
      expect(result.description).toBe('Quarterly planning session');
      expect(result.location).toBe('Conference Room A');
      expect(result.googleCalendarId).toBe('gcal123');
      expect(result.startTime).toEqual(new Date('2026-02-05T10:00:00Z'));
      expect(result.endTime).toEqual(new Date('2026-02-05T11:00:00Z'));
    });

    it('should handle private Google events', () => {
      const privateGoogleEvent = {
        ...mockGoogleEvent,
        visibility: 'private',
      };

      const result = convertGoogleEventToEvent(privateGoogleEvent, mockUserId);

      expect(result.isConfidential).toBe(true);
    });

    it('should handle events without optional fields', () => {
      const minimalGoogleEvent: GoogleCalendarEvent = {
        id: 'gcal456',
        summary: 'Quick Meeting',
        start: { dateTime: '2026-02-05T10:00:00Z' },
        end: { dateTime: '2026-02-05T11:00:00Z' },
      };

      const result = convertGoogleEventToEvent(minimalGoogleEvent, mockUserId);

      expect(result.description).toBe('');
      expect(result.location).toBe('');
    });
  });

  describe('syncEventToGoogle', () => {
    it('should create new event in Google Calendar', async () => {
      const createdEvent = { ...mockGoogleEvent, id: 'new-gcal-id' };
      vi.mocked(googleCalendarService.createCalendarEvent).mockResolvedValue(createdEvent);

      const result = await syncEventToGoogle(mockEvent, mockCredentials);

      expect(result).toBe('new-gcal-id');
      expect(googleCalendarService.setAccessToken).toHaveBeenCalledWith(
        mockCredentials.accessToken,
        mockCredentials.expiresAt
      );
      expect(googleCalendarService.createCalendarEvent).toHaveBeenCalled();
    });

    it('should update existing event in Google Calendar', async () => {
      const eventWithGoogleId = { ...mockEvent, googleCalendarId: 'existing-gcal-id' };
      vi.mocked(googleCalendarService.updateCalendarEvent).mockResolvedValue(mockGoogleEvent);

      const result = await syncEventToGoogle(eventWithGoogleId, mockCredentials);

      expect(result).toBe('existing-gcal-id');
      expect(googleCalendarService.updateCalendarEvent).toHaveBeenCalledWith(
        'existing-gcal-id',
        expect.any(Object),
        'primary'
      );
    });

    it('should return null when token is expired', async () => {
      vi.mocked(googleCalendarService.isConnected).mockReturnValue(false);

      const result = await syncEventToGoogle(mockEvent, mockCredentials);

      expect(result).toBeNull();
    });

    it('should return null when sync fails', async () => {
      vi.mocked(googleCalendarService.createCalendarEvent).mockRejectedValue(
        new Error('API error')
      );

      const result = await syncEventToGoogle(mockEvent, mockCredentials);

      expect(result).toBeNull();
    });
  });

  describe('syncEventsToGoogle', () => {
    it('should sync multiple events and return result', async () => {
      const events = [mockEvent, { ...mockEvent, id: 'event2', title: 'Another Meeting' }];
      const createdEvent = { ...mockGoogleEvent, id: 'new-gcal-id' };
      vi.mocked(googleCalendarService.createCalendarEvent).mockResolvedValue(createdEvent);

      const result = await syncEventsToGoogle(events, mockCredentials);

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(googleCalendarService.createCalendarEvent).toHaveBeenCalledTimes(2);
    });

    it('should track failures in sync result', async () => {
      const events = [mockEvent, { ...mockEvent, id: 'event2', title: 'Another Meeting' }];
      vi.mocked(googleCalendarService.createCalendarEvent)
        .mockResolvedValueOnce({ ...mockGoogleEvent, id: 'gcal1' })
        .mockRejectedValueOnce(new Error('API error'));

      const result = await syncEventsToGoogle(events, mockCredentials);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Another Meeting');
    });
  });

  describe('updateEventInGoogle', () => {
    it('should update event with Google Calendar ID', async () => {
      const eventWithGoogleId = { ...mockEvent, googleCalendarId: 'gcal123' };
      vi.mocked(googleCalendarService.updateCalendarEvent).mockResolvedValue(mockGoogleEvent);

      const result = await updateEventInGoogle(eventWithGoogleId, mockCredentials);

      expect(result).toBe(true);
      expect(googleCalendarService.updateCalendarEvent).toHaveBeenCalled();
    });

    it('should create event if no Google Calendar ID exists', async () => {
      const createdEvent = { ...mockGoogleEvent, id: 'new-gcal-id' };
      vi.mocked(googleCalendarService.createCalendarEvent).mockResolvedValue(createdEvent);

      const result = await updateEventInGoogle(mockEvent, mockCredentials);

      expect(result).toBe(true);
      expect(googleCalendarService.createCalendarEvent).toHaveBeenCalled();
    });

    it('should return false when update fails', async () => {
      const eventWithGoogleId = { ...mockEvent, googleCalendarId: 'gcal123' };
      vi.mocked(googleCalendarService.updateCalendarEvent).mockRejectedValue(
        new Error('API error')
      );

      const result = await updateEventInGoogle(eventWithGoogleId, mockCredentials);

      expect(result).toBe(false);
    });
  });

  describe('deleteEventFromGoogle', () => {
    it('should delete event from Google Calendar', async () => {
      vi.mocked(googleCalendarService.deleteCalendarEvent).mockResolvedValue(undefined);

      const result = await deleteEventFromGoogle('gcal123', mockCredentials);

      expect(result).toBe(true);
      expect(googleCalendarService.deleteCalendarEvent).toHaveBeenCalledWith('gcal123', 'primary');
    });

    it('should return false when delete fails', async () => {
      vi.mocked(googleCalendarService.deleteCalendarEvent).mockRejectedValue(
        new Error('API error')
      );

      const result = await deleteEventFromGoogle('gcal123', mockCredentials);

      expect(result).toBe(false);
    });
  });

  describe('importEventsFromGoogle', () => {
    it('should import events from Google Calendar', async () => {
      const googleEvents = [mockGoogleEvent, { ...mockGoogleEvent, id: 'gcal456' }];
      vi.mocked(googleCalendarService.getCalendarEvents).mockResolvedValue(googleEvents);

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');
      const result = await importEventsFromGoogle(mockUserId, startDate, endDate, mockCredentials);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(mockUserId);
      expect(result[0].googleCalendarId).toBe('gcal123');
      expect(googleCalendarService.getCalendarEvents).toHaveBeenCalledWith(startDate, endDate, 'primary');
    });

    it('should return empty array when import fails', async () => {
      vi.mocked(googleCalendarService.getCalendarEvents).mockRejectedValue(
        new Error('API error')
      );

      const result = await importEventsFromGoogle(
        mockUserId,
        new Date(),
        new Date(),
        mockCredentials
      );

      expect(result).toEqual([]);
    });
  });

  describe('detectConflicts', () => {
    it('should detect title conflicts', () => {
      const localEvent = { ...mockEvent, googleCalendarId: 'gcal123' };
      const googleEvent = { ...mockGoogleEvent, summary: 'Different Title' };

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('title');
      expect(conflicts[0].localTitle).toBe('Team Meeting');
      expect(conflicts[0].googleTitle).toBe('Different Title');
    });

    it('should detect time conflicts', () => {
      const localEvent = { ...mockEvent, googleCalendarId: 'gcal123' };
      const googleEvent = {
        ...mockGoogleEvent,
        start: { dateTime: '2026-02-05T09:00:00Z' },
      };

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('time');
    });

    it('should detect both title and time conflicts', () => {
      const localEvent = { ...mockEvent, googleCalendarId: 'gcal123' };
      const googleEvent = {
        ...mockGoogleEvent,
        summary: 'Different Title',
        start: { dateTime: '2026-02-05T09:00:00Z' },
      };

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('both');
    });

    it('should not detect conflicts for matching events', () => {
      const localEvent = { ...mockEvent, googleCalendarId: 'gcal123' };
      const googleEvent = mockGoogleEvent;

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(0);
    });

    it('should skip events without Google Calendar ID', () => {
      const localEvent = mockEvent; // No googleCalendarId
      const googleEvent = mockGoogleEvent;

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle confidential events with alternate titles', () => {
      const localEvent = {
        ...mockEvent,
        googleCalendarId: 'gcal123',
        isConfidential: true,
        alternateTitle: 'Private Meeting',
      };
      const googleEvent = { ...mockGoogleEvent, summary: 'Private Meeting' };

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(0); // Should not conflict
    });

    it('should allow 1 second tolerance for time differences', () => {
      const localEvent = {
        ...mockEvent,
        googleCalendarId: 'gcal123',
        startTime: new Date('2026-02-05T10:00:00.500Z'),
      };
      const googleEvent = {
        ...mockGoogleEvent,
        start: { dateTime: '2026-02-05T10:00:00Z' },
      };

      const conflicts = detectConflicts([localEvent], [googleEvent]);

      expect(conflicts).toHaveLength(0); // 500ms difference should be tolerated
    });
  });
});
