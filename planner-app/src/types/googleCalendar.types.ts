/**
 * Google Calendar Integration Types
 *
 * Type definitions for Google Calendar OAuth, sync, and event data.
 */

/**
 * Google Calendar OAuth credentials stored in Firestore
 */
export interface GoogleCalendarCredentials {
  /** OAuth 2.0 access token */
  accessToken: string;
  /** OAuth 2.0 refresh token for renewing access */
  refreshToken: string;
  /** Token expiration timestamp */
  expiresAt: Date;
  /** OAuth scope granted by user */
  scope: string;
  /** Timestamp when credentials were last updated */
  updatedAt: Date;
}

/**
 * Google Calendar event structure from Google API
 */
export interface GoogleCalendarEvent {
  /** Google Calendar event ID */
  id: string;
  /** Event title/summary */
  summary: string;
  /** Event description */
  description?: string;
  /** Event start time */
  start: {
    dateTime: string;
    timeZone?: string;
  };
  /** Event end time */
  end: {
    dateTime: string;
    timeZone?: string;
  };
  /** Event location */
  location?: string;
  /** Event status (confirmed, tentative, cancelled) */
  status?: string;
  /** Event color ID */
  colorId?: string;
  /** Event visibility (default, public, private, confidential) */
  visibility?: string;
}

/**
 * Sync status for Google Calendar operations
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Sync direction options
 */
export type SyncDirection = 'to_google' | 'from_google' | 'bidirectional';

/**
 * Result of a sync operation
 */
export interface SyncResult {
  /** Number of events successfully synced */
  synced: number;
  /** Number of events that failed to sync */
  failed: number;
  /** Array of error messages for failed syncs */
  errors: string[];
  /** Timestamp when sync completed */
  completedAt: Date;
}

/**
 * Conflict information when local and Google events differ
 */
export interface ConflictInfo {
  /** ID of the conflicting event */
  eventId: string;
  /** Local event title */
  localTitle: string;
  /** Google Calendar event title */
  googleTitle: string;
  /** Local event start time */
  localStart: Date;
  /** Google event start time */
  googleStart: Date;
  /** Local event end time */
  localEnd: Date;
  /** Google event end time */
  googleEnd: Date;
  /** Conflict type */
  conflictType: 'title' | 'time' | 'both';
}

/**
 * Conflict resolution choice for Google Calendar sync conflicts
 */
export type GoogleCalendarConflictResolution = 'keep_local' | 'keep_google' | 'keep_both';

/**
 * Google Calendar list entry from the calendarList API
 */
export interface GoogleCalendarListEntry {
  /** Calendar ID (use this for API calls) */
  id: string;
  /** Calendar name/title */
  summary: string;
  /** Calendar description */
  description?: string;
  /** Calendar timezone */
  timeZone?: string;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Foreground/text color (hex) */
  foregroundColor?: string;
  /** Whether this is the user's primary calendar */
  primary?: boolean;
  /** User's access level for this calendar */
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
}
