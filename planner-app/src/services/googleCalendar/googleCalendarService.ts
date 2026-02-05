/**
 * Google Calendar Service
 *
 * Handles OAuth and API operations for Google Calendar integration.
 * Uses Google Identity Services (GIS) for OAuth 2.0 authentication.
 */

import type {
  GoogleCalendarCredentials,
  GoogleCalendarEvent,
  GoogleCalendarListEntry,
} from '../../types/googleCalendar.types';

/** Google Calendar API scope */
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

/** Google Calendar API base URL */
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/** Google Identity Services client */
let tokenClient: google.accounts.oauth2.TokenClient | null = null;

/** Current access token */
let currentAccessToken: string | null = null;

/** Token expiration time */
let tokenExpiresAt: Date | null = null;

/**
 * Reset the service state (for testing)
 * @internal
 */
export function _resetState(): void {
  tokenClient = null;
  currentAccessToken = null;
  tokenExpiresAt = null;
}

/**
 * Initialize Google Identity Services
 * Must be called before any other function
 *
 * @param clientId - Google OAuth client ID from environment
 * @throws Error if client ID is missing or initialization fails
 */
export function initializeGoogleAuth(clientId: string): void {
  if (!clientId) {
    throw new Error('Google OAuth client ID is required');
  }

  if (typeof google === 'undefined' || !google.accounts) {
    throw new Error('Google Identity Services script not loaded');
  }

  // Initialize the token client for OAuth
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: CALENDAR_SCOPE,
    callback: '', // Set dynamically in requestCalendarAccess
  });
}

/**
 * Request calendar access from user
 * Shows Google's consent screen
 *
 * @returns Promise resolving to credentials on success
 * @throws Error if not initialized or user denies access
 */
export function requestCalendarAccess(): Promise<GoogleCalendarCredentials> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google auth not initialized. Call initializeGoogleAuth first.'));
      return;
    }

    // Set up callback for this request
    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(`OAuth error: ${response.error}`));
        return;
      }

      // Calculate expiration time
      const expiresInMs = parseInt(response.expires_in) * 1000;
      const expiresAt = new Date(Date.now() + expiresInMs);

      // Store token
      currentAccessToken = response.access_token;
      tokenExpiresAt = expiresAt;

      const credentials: GoogleCalendarCredentials = {
        accessToken: response.access_token,
        // Note: GIS doesn't provide refresh tokens for client-side apps
        // We'll use the access token and prompt for re-auth when it expires
        refreshToken: '',
        expiresAt,
        scope: response.scope,
        updatedAt: new Date(),
      };

      resolve(credentials);
    };

    // Request token - this will show the consent screen
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Check if user is currently connected
 *
 * @returns true if we have a valid access token
 */
export function isConnected(): boolean {
  if (!currentAccessToken || !tokenExpiresAt) {
    return false;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return tokenExpiresAt.getTime() - now.getTime() > bufferMs;
}

/**
 * Disconnect from Google Calendar
 * Revokes the access token
 */
export async function disconnect(): Promise<void> {
  if (!currentAccessToken) {
    return;
  }

  try {
    // Revoke the token
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `token=${encodeURIComponent(currentAccessToken)}`,
    });
  } catch (error) {
    // Ignore revocation errors - we'll clear credentials anyway
    console.warn('Failed to revoke Google Calendar token:', error);
  } finally {
    // Clear stored credentials regardless of revoke success
    currentAccessToken = null;
    tokenExpiresAt = null;
  }
}

/**
 * Refresh access token
 * For client-side apps, this prompts user to re-authenticate
 *
 * @returns Promise resolving to new credentials
 */
export async function refreshAccessToken(): Promise<GoogleCalendarCredentials> {
  // Client-side apps can't refresh silently
  // Prompt for new token
  return requestCalendarAccess();
}

/**
 * Set access token manually
 * Used when loading credentials from Firestore
 *
 * @param accessToken - Access token to use
 * @param expiresAt - When the token expires
 */
export function setAccessToken(accessToken: string, expiresAt: Date): void {
  currentAccessToken = accessToken;
  tokenExpiresAt = expiresAt;
}

/**
 * Make an authenticated API call to Google Calendar
 *
 * @param endpoint - API endpoint (relative to base URL)
 * @param options - Fetch options
 * @returns Promise resolving to response data
 * @throws Error if not authenticated or API call fails
 */
async function callCalendarAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!currentAccessToken) {
    throw new Error('Not authenticated. Call requestCalendarAccess first.');
  }

  if (!isConnected()) {
    throw new Error('Access token expired. Please re-authenticate.');
  }

  const url = `${CALENDAR_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${currentAccessToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Calendar API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

/**
 * Get list of calendars the user has access to
 * Filters to only calendars with write access (writer or owner)
 *
 * @returns Array of calendars with write access
 */
export async function getCalendarList(): Promise<GoogleCalendarListEntry[]> {
  interface CalendarListResponse {
    items: GoogleCalendarListEntry[];
  }

  const response = await callCalendarAPI<CalendarListResponse>('/users/me/calendarList');

  // Filter to only calendars with write access
  const writableCalendars = (response.items || []).filter(
    (cal) => cal.accessRole === 'writer' || cal.accessRole === 'owner'
  );

  // Sort: primary first, then alphabetically by summary
  return writableCalendars.sort((a, b) => {
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    return (a.summary || '').localeCompare(b.summary || '');
  });
}

/**
 * Get calendar events within a date range
 *
 * @param startDate - Range start
 * @param endDate - Range end
 * @param calendarId - Calendar ID (default: primary)
 * @returns Array of Google Calendar events
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await callCalendarAPI<{ items: GoogleCalendarEvent[] }>(
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  );

  return response.items || [];
}

/**
 * Create a calendar event
 *
 * @param event - Event data to create
 * @param calendarId - Calendar ID (default: primary)
 * @returns Created event with Google Calendar ID
 */
export async function createCalendarEvent(
  event: Omit<GoogleCalendarEvent, 'id'>,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> {
  return callCalendarAPI<GoogleCalendarEvent>(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/**
 * Update a calendar event
 *
 * @param eventId - Google Calendar event ID
 * @param event - Updated event data
 * @param calendarId - Calendar ID (default: primary)
 * @returns Updated event
 */
export async function updateCalendarEvent(
  eventId: string,
  event: Partial<GoogleCalendarEvent>,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> {
  return callCalendarAPI<GoogleCalendarEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(event),
    }
  );
}

/**
 * Delete a calendar event
 *
 * @param eventId - Google Calendar event ID
 * @param calendarId - Calendar ID (default: primary)
 */
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  await callCalendarAPI<void>(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
}
