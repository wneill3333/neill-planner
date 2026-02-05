/**
 * Google Calendar Sync Service
 *
 * Handles bidirectional synchronization between Neill Planner events and Google Calendar.
 * Supports confidential events with alternate titles.
 */

import type { Event } from '../../types';
import type {
  GoogleCalendarEvent,
  GoogleCalendarCredentials,
  SyncResult,
  ConflictInfo,
} from '../../types/googleCalendar.types';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  setAccessToken,
  isConnected,
} from './googleCalendarService';
import { sanitizeString } from '../../utils/validation';

/**
 * Convert Neill Planner event to Google Calendar event format
 *
 * @param event - Neill Planner event
 * @returns Google Calendar event (without ID)
 */
export function convertEventToGoogleEvent(
  event: Event
): Omit<GoogleCalendarEvent, 'id'> {
  // Use alternate title if event is confidential, otherwise use real title
  const summary = event.isConfidential && event.alternateTitle
    ? event.alternateTitle
    : event.title;

  const googleEvent: Omit<GoogleCalendarEvent, 'id'> = {
    summary,
    start: {
      dateTime: event.startTime.toISOString(),
    },
    end: {
      dateTime: event.endTime.toISOString(),
    },
  };

  // Add optional fields
  if (event.description) {
    let description = event.description;
    if (event.isConfidential) {
      description += '\n\n[This event contains confidential information in Neill Planner]';
    }
    googleEvent.description = description;
  }

  if (event.location) {
    googleEvent.location = event.location;
  }

  // Set visibility for confidential events
  if (event.isConfidential) {
    googleEvent.visibility = 'private';
  }

  return googleEvent;
}

/**
 * Convert Google Calendar event to Neill Planner event format
 *
 * @param googleEvent - Google Calendar event
 * @param userId - User ID who owns the event
 * @returns Neill Planner event (without id)
 */
export function convertGoogleEventToEvent(
  googleEvent: GoogleCalendarEvent,
  userId: string
): Omit<Event, 'id'> {
  return {
    userId,
    title: sanitizeString(googleEvent.summary),
    description: googleEvent.description ? sanitizeString(googleEvent.description) : '',
    categoryId: null,
    startTime: new Date(googleEvent.start.dateTime),
    endTime: new Date(googleEvent.end.dateTime),
    location: googleEvent.location ? sanitizeString(googleEvent.location) : '',
    isConfidential: googleEvent.visibility === 'private',
    alternateTitle: null,
    recurrence: null,
    googleCalendarId: googleEvent.id,
    isRecurringInstance: false,
    recurringParentId: null,
    instanceDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

/**
 * Sync a single event to Google Calendar
 *
 * @param event - Event to sync
 * @param credentials - Google Calendar credentials
 * @param calendarId - Calendar ID to sync to (null = 'primary')
 * @returns Google Calendar event ID on success, null on failure
 */
export async function syncEventToGoogle(
  event: Event,
  credentials: GoogleCalendarCredentials,
  calendarId: string | null = null
): Promise<string | null> {
  try {
    // Set access token
    setAccessToken(credentials.accessToken, credentials.expiresAt);

    if (!isConnected()) {
      throw new Error('Access token expired');
    }

    const googleEvent = convertEventToGoogleEvent(event);
    const targetCalendarId = calendarId || 'primary';

    // If event already has a Google Calendar ID, update it
    if (event.googleCalendarId) {
      await updateCalendarEvent(event.googleCalendarId, googleEvent, targetCalendarId);
      return event.googleCalendarId;
    } else {
      // Create new event in Google Calendar
      const createdEvent = await createCalendarEvent(googleEvent, targetCalendarId);
      return createdEvent.id;
    }
  } catch (error) {
    console.error('Failed to sync event to Google:', error);
    return null;
  }
}

/**
 * Sync multiple events to Google Calendar
 *
 * @param events - Events to sync
 * @param credentials - Google Calendar credentials
 * @param calendarId - Calendar ID to sync to (null = 'primary')
 * @returns Sync result with success/failure counts
 */
export async function syncEventsToGoogle(
  events: Event[],
  credentials: GoogleCalendarCredentials,
  calendarId: string | null = null
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    failed: 0,
    errors: [],
    completedAt: new Date(),
  };

  for (const event of events) {
    const googleCalendarId = await syncEventToGoogle(event, credentials, calendarId);
    if (googleCalendarId) {
      result.synced++;
    } else {
      result.failed++;
      result.errors.push(`Failed to sync event: ${event.title}`);
    }
  }

  return result;
}

/**
 * Update an event in Google Calendar
 *
 * @param event - Event with updated data
 * @param credentials - Google Calendar credentials
 * @param calendarId - Calendar ID to update in (null = 'primary')
 * @returns true on success, false on failure
 */
export async function updateEventInGoogle(
  event: Event,
  credentials: GoogleCalendarCredentials,
  calendarId: string | null = null
): Promise<boolean> {
  if (!event.googleCalendarId) {
    // Event not synced yet, create it
    const googleCalendarId = await syncEventToGoogle(event, credentials, calendarId);
    return googleCalendarId !== null;
  }

  try {
    setAccessToken(credentials.accessToken, credentials.expiresAt);

    if (!isConnected()) {
      throw new Error('Access token expired');
    }

    const googleEvent = convertEventToGoogleEvent(event);
    const targetCalendarId = calendarId || 'primary';
    await updateCalendarEvent(event.googleCalendarId, googleEvent, targetCalendarId);
    return true;
  } catch (error) {
    console.error('Failed to update event in Google:', error);
    return false;
  }
}

/**
 * Delete an event from Google Calendar
 *
 * @param googleCalendarId - Google Calendar event ID
 * @param credentials - Google Calendar credentials
 * @param calendarId - Calendar ID to delete from (null = 'primary')
 * @returns true on success, false on failure
 */
export async function deleteEventFromGoogle(
  googleCalendarId: string,
  credentials: GoogleCalendarCredentials,
  calendarId: string | null = null
): Promise<boolean> {
  try {
    setAccessToken(credentials.accessToken, credentials.expiresAt);

    if (!isConnected()) {
      throw new Error('Access token expired');
    }

    const targetCalendarId = calendarId || 'primary';
    await deleteCalendarEvent(googleCalendarId, targetCalendarId);
    return true;
  } catch (error) {
    console.error('Failed to delete event from Google:', error);
    return false;
  }
}

/**
 * Import events from Google Calendar
 *
 * @param userId - User ID who owns the events
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @param credentials - Google Calendar credentials
 * @param calendarId - Calendar ID to import from (null = 'primary')
 * @returns Array of Neill Planner events
 */
export async function importEventsFromGoogle(
  userId: string,
  startDate: Date,
  endDate: Date,
  credentials: GoogleCalendarCredentials,
  calendarId: string | null = null
): Promise<Omit<Event, 'id'>[]> {
  try {
    setAccessToken(credentials.accessToken, credentials.expiresAt);

    if (!isConnected()) {
      throw new Error('Access token expired');
    }

    const targetCalendarId = calendarId || 'primary';
    const googleEvents = await getCalendarEvents(startDate, endDate, targetCalendarId);
    return googleEvents.map(googleEvent => convertGoogleEventToEvent(googleEvent, userId));
  } catch (error) {
    console.error('Failed to import events from Google:', error);
    return [];
  }
}

/**
 * Detect conflicts between local and Google Calendar events
 * Compares events that exist in both places and identifies differences
 *
 * @param localEvents - Events from Neill Planner
 * @param googleEvents - Events from Google Calendar
 * @returns Array of conflict information
 */
export function detectConflicts(
  localEvents: Event[],
  googleEvents: GoogleCalendarEvent[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  // Create map of Google events by ID for quick lookup
  const googleEventMap = new Map(googleEvents.map(e => [e.id, e]));

  // Check each local event that has a Google Calendar ID
  for (const localEvent of localEvents) {
    if (!localEvent.googleCalendarId) {
      continue; // Skip events not synced to Google
    }

    const googleEvent = googleEventMap.get(localEvent.googleCalendarId);
    if (!googleEvent) {
      continue; // Event deleted from Google or not found
    }

    const googleStart = new Date(googleEvent.start.dateTime);
    const googleEnd = new Date(googleEvent.end.dateTime);

    // Check for title differences (accounting for confidential events)
    const expectedTitle = localEvent.isConfidential && localEvent.alternateTitle
      ? localEvent.alternateTitle
      : localEvent.title;

    const titleConflict = expectedTitle !== googleEvent.summary;

    // Check for time differences (allow 1 second tolerance for rounding)
    const startDiff = Math.abs(localEvent.startTime.getTime() - googleStart.getTime());
    const endDiff = Math.abs(localEvent.endTime.getTime() - googleEnd.getTime());
    const timeConflict = startDiff > 1000 || endDiff > 1000;

    if (titleConflict || timeConflict) {
      conflicts.push({
        eventId: localEvent.id,
        localTitle: localEvent.title,
        googleTitle: googleEvent.summary,
        localStart: localEvent.startTime,
        googleStart,
        localEnd: localEvent.endTime,
        googleEnd,
        conflictType: titleConflict && timeConflict ? 'both' :
                      titleConflict ? 'title' : 'time',
      });
    }
  }

  return conflicts;
}
