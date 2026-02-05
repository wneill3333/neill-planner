/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  initializeGoogleAuth,
  requestCalendarAccess,
  isConnected,
  disconnect,
  refreshAccessToken,
  setAccessToken,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  _resetState,
} from '../googleCalendarService';
import type { GoogleCalendarEvent } from '../../../types/googleCalendar.types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Google Identity Services
const mockRequestAccessToken = vi.fn();
const mockTokenClient = {
  callback: vi.fn(),
  requestAccessToken: mockRequestAccessToken,
};

const mockInitTokenClient = vi.fn(() => mockTokenClient);

// Create the google global object
(global as any).google = {
  accounts: {
    oauth2: {
      initTokenClient: mockInitTokenClient,
    },
  },
};

describe('googleCalendarService', () => {
  const mockClientId = 'mock-client-id.apps.googleusercontent.com';
  const mockAccessToken = 'mock-access-token';
  const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    _resetState(); // Reset service state
    // Reset the module state
    (global as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeGoogleAuth', () => {
    it('should initialize Google auth with client ID', () => {
      initializeGoogleAuth(mockClientId);
      expect(mockInitTokenClient).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: mockClientId,
          scope: 'https://www.googleapis.com/auth/calendar',
        })
      );
    });

    it('should throw error when client ID is missing', () => {
      expect(() => initializeGoogleAuth('')).toThrow('Google OAuth client ID is required');
    });

    it('should throw error when Google Identity Services not loaded', () => {
      delete (global as any).google;
      expect(() => initializeGoogleAuth(mockClientId)).toThrow(
        'Google Identity Services script not loaded'
      );
    });
  });

  describe('requestCalendarAccess', () => {
    beforeEach(() => {
      initializeGoogleAuth(mockClientId);
    });

    it('should request calendar access and return credentials', async () => {
      const mockResponse = {
        access_token: mockAccessToken,
        expires_in: '3600',
        scope: 'https://www.googleapis.com/auth/calendar',
      };

      // Simulate callback being called
      mockRequestAccessToken.mockImplementation(() => {
        setTimeout(() => {
          mockTokenClient.callback(mockResponse);
        }, 0);
      });

      const promise = requestCalendarAccess();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for callback

      const credentials = await promise;

      expect(credentials).toMatchObject({
        accessToken: mockAccessToken,
        refreshToken: '',
        scope: mockResponse.scope,
      });
      expect(credentials.expiresAt).toBeInstanceOf(Date);
      expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' });
    });

    it('should reject when OAuth error occurs', async () => {
      const mockResponse = {
        error: 'access_denied',
        error_description: 'User denied access',
      };

      mockRequestAccessToken.mockImplementation(() => {
        setTimeout(() => {
          mockTokenClient.callback(mockResponse as any);
        }, 0);
      });

      const promise = requestCalendarAccess();

      // Await the rejection properly
      await expect(promise).rejects.toThrow('OAuth error: access_denied');
    });
  });

  describe('isConnected', () => {
    it('should return false when no token is set', () => {
      expect(isConnected()).toBe(false);
    });

    it('should return true when token is valid', () => {
      setAccessToken(mockAccessToken, futureDate);
      expect(isConnected()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000); // Past date
      setAccessToken(mockAccessToken, pastDate);
      expect(isConnected()).toBe(false);
    });

    it('should return false when token expires soon (within 5 minutes)', () => {
      const soonDate = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes from now
      setAccessToken(mockAccessToken, soonDate);
      expect(isConnected()).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should revoke token and clear credentials', async () => {
      setAccessToken(mockAccessToken, futureDate);
      mockFetch.mockResolvedValue({ ok: true } as Response);

      await disconnect();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('oauth2.googleapis.com/revoke'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(isConnected()).toBe(false);
    });

    it('should clear credentials even if revoke fails', async () => {
      setAccessToken(mockAccessToken, futureDate);
      // Mock fetch to reject but then resolve on retry
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // The function should not throw
      await expect(disconnect()).resolves.toBeUndefined();

      expect(isConnected()).toBe(false);
    });

    it('should do nothing when no token is set', async () => {
      await disconnect();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      initializeGoogleAuth(mockClientId);
    });

    it('should prompt for new access token', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: '3600',
        scope: 'https://www.googleapis.com/auth/calendar',
      };

      mockRequestAccessToken.mockImplementation(() => {
        setTimeout(() => {
          mockTokenClient.callback(mockResponse);
        }, 0);
      });

      const promise = refreshAccessToken();
      await new Promise(resolve => setTimeout(resolve, 10));

      const credentials = await promise;
      expect(credentials.accessToken).toBe('new-access-token');
    });
  });

  describe('getCalendarEvents', () => {
    beforeEach(() => {
      setAccessToken(mockAccessToken, futureDate);
    });

    it('should fetch calendar events for date range', async () => {
      const mockEvents: GoogleCalendarEvent[] = [
        {
          id: 'event1',
          summary: 'Test Event',
          start: { dateTime: '2026-02-05T10:00:00Z' },
          end: { dateTime: '2026-02-05T11:00:00Z' },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockEvents }),
      } as Response);

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');
      const events = await getCalendarEvents(startDate, endDate);

      expect(events).toEqual(mockEvents);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/primary/events'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      setAccessToken('', new Date()); // Clear token
      await expect(getCalendarEvents(new Date(), new Date())).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error when API call fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid credentials' }),
      } as Response);

      await expect(getCalendarEvents(new Date(), new Date())).rejects.toThrow(
        'Calendar API error'
      );
    });
  });

  describe('createCalendarEvent', () => {
    beforeEach(() => {
      setAccessToken(mockAccessToken, futureDate);
    });

    it('should create a calendar event', async () => {
      const newEvent = {
        summary: 'New Event',
        start: { dateTime: '2026-02-05T10:00:00Z' },
        end: { dateTime: '2026-02-05T11:00:00Z' },
      };

      const createdEvent = {
        id: 'created-event-id',
        ...newEvent,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => createdEvent,
      } as Response);

      const result = await createCalendarEvent(newEvent);

      expect(result).toEqual(createdEvent);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/primary/events'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newEvent),
        })
      );
    });
  });

  describe('updateCalendarEvent', () => {
    beforeEach(() => {
      setAccessToken(mockAccessToken, futureDate);
    });

    it('should update a calendar event', async () => {
      const eventId = 'event123';
      const updates = {
        summary: 'Updated Event',
      };

      const updatedEvent = {
        id: eventId,
        summary: 'Updated Event',
        start: { dateTime: '2026-02-05T10:00:00Z' },
        end: { dateTime: '2026-02-05T11:00:00Z' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => updatedEvent,
      } as Response);

      const result = await updateCalendarEvent(eventId, updates);

      expect(result).toEqual(updatedEvent);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/calendars/primary/events/${eventId}`),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
      );
    });
  });

  describe('deleteCalendarEvent', () => {
    beforeEach(() => {
      setAccessToken(mockAccessToken, futureDate);
    });

    it('should delete a calendar event', async () => {
      const eventId = 'event123';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await deleteCalendarEvent(eventId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/calendars/primary/events/${eventId}`),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
