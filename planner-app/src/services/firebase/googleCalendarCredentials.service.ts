/**
 * Google Calendar Credentials Service
 *
 * Firestore service for storing and retrieving Google Calendar OAuth credentials.
 * Credentials are stored per-user with ownership-based access control.
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type { GoogleCalendarCredentials } from '../../types/googleCalendar.types';
import { validateUserId, ValidationError } from '../../utils/validation';

/** Firestore collection name for Google Calendar credentials */
const CREDENTIALS_COLLECTION = 'googleCalendarCredentials';

/**
 * Extended credentials with selected calendar
 */
export interface StoredGoogleCalendarCredentials extends GoogleCalendarCredentials {
  /** Selected calendar ID (null = use 'primary') */
  selectedCalendarId: string | null;
}

/**
 * Convert GoogleCalendarCredentials to Firestore document format
 */
function credentialsToFirestore(
  credentials: GoogleCalendarCredentials,
  selectedCalendarId?: string | null
): DocumentData {
  return {
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresAt: Timestamp.fromDate(credentials.expiresAt),
    scope: credentials.scope,
    updatedAt: Timestamp.fromDate(credentials.updatedAt),
    selectedCalendarId: selectedCalendarId ?? null,
  };
}

/**
 * Convert Firestore document to StoredGoogleCalendarCredentials
 */
function credentialsFromFirestore(data: DocumentData): StoredGoogleCalendarCredentials {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: (data.expiresAt as Timestamp).toDate(),
    scope: data.scope,
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    selectedCalendarId: data.selectedCalendarId ?? null,
  };
}

/**
 * Save Google Calendar credentials for a user
 *
 * @param userId - User ID who owns the credentials
 * @param credentials - OAuth credentials to save
 * @throws ValidationError if userId is invalid
 * @throws Error if Firestore operation fails
 */
export async function saveCredentials(
  userId: string,
  credentials: GoogleCalendarCredentials
): Promise<void> {
  validateUserId(userId);

  if (!credentials.accessToken || typeof credentials.accessToken !== 'string') {
    throw new ValidationError(
      'accessToken is required and must be a non-empty string',
      'accessToken',
      'INVALID_ACCESS_TOKEN'
    );
  }

  // Note: refreshToken may be empty for client-side OAuth (Google Identity Services)
  if (typeof credentials.refreshToken !== 'string') {
    throw new ValidationError(
      'refreshToken must be a string',
      'refreshToken',
      'INVALID_REFRESH_TOKEN'
    );
  }

  if (!(credentials.expiresAt instanceof Date) || isNaN(credentials.expiresAt.getTime())) {
    throw new ValidationError(
      'expiresAt must be a valid Date',
      'expiresAt',
      'INVALID_EXPIRES_AT'
    );
  }

  if (!credentials.scope || typeof credentials.scope !== 'string') {
    throw new ValidationError(
      'scope is required and must be a non-empty string',
      'scope',
      'INVALID_SCOPE'
    );
  }

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);
    const firestoreData = credentialsToFirestore(credentials);
    await setDoc(credentialsRef, firestoreData);
  } catch (error) {
    throw new Error(
      `Failed to save Google Calendar credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get Google Calendar credentials for a user
 *
 * @param userId - User ID to fetch credentials for
 * @returns Credentials if found (including selectedCalendarId), null if not found
 * @throws ValidationError if userId is invalid
 * @throws Error if Firestore operation fails
 */
export async function getCredentials(userId: string): Promise<StoredGoogleCalendarCredentials | null> {
  validateUserId(userId);

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);
    const credentialsDoc = await getDoc(credentialsRef);

    if (!credentialsDoc.exists()) {
      return null;
    }

    const data = credentialsDoc.data();
    return credentialsFromFirestore(data);
  } catch (error) {
    throw new Error(
      `Failed to get Google Calendar credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete Google Calendar credentials for a user
 *
 * @param userId - User ID whose credentials to delete
 * @throws ValidationError if userId is invalid
 * @throws Error if Firestore operation fails
 */
export async function deleteCredentials(userId: string): Promise<void> {
  validateUserId(userId);

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);
    await deleteDoc(credentialsRef);
  } catch (error) {
    throw new Error(
      `Failed to delete Google Calendar credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update access token and expiration time
 * Used when refreshing an expired token
 *
 * @param userId - User ID whose credentials to update
 * @param accessToken - New access token
 * @param expiresAt - New expiration time
 * @throws ValidationError if userId is invalid
 * @throws Error if Firestore operation fails or credentials don't exist
 */
export async function updateTokens(
  userId: string,
  accessToken: string,
  expiresAt: Date
): Promise<void> {
  validateUserId(userId);

  if (!accessToken || typeof accessToken !== 'string') {
    throw new ValidationError(
      'accessToken is required and must be a non-empty string',
      'accessToken',
      'INVALID_ACCESS_TOKEN'
    );
  }

  if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
    throw new ValidationError(
      'expiresAt must be a valid Date',
      'expiresAt',
      'INVALID_EXPIRES_AT'
    );
  }

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);

    // Check if credentials exist
    const credentialsDoc = await getDoc(credentialsRef);
    if (!credentialsDoc.exists()) {
      throw new Error('Credentials not found for user');
    }

    await updateDoc(credentialsRef, {
      accessToken,
      expiresAt: Timestamp.fromDate(expiresAt),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Credentials not found for user') {
      throw error;
    }
    throw new Error(
      `Failed to update Google Calendar tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if credentials exist for a user
 *
 * @param userId - User ID to check
 * @returns true if credentials exist, false otherwise
 * @throws ValidationError if userId is invalid
 */
export async function hasCredentials(userId: string): Promise<boolean> {
  validateUserId(userId);

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);
    const credentialsDoc = await getDoc(credentialsRef);
    return credentialsDoc.exists();
  } catch (error) {
    throw new Error(
      `Failed to check Google Calendar credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update selected calendar ID for a user
 *
 * @param userId - User ID whose selection to update
 * @param calendarId - Calendar ID to select (null = use 'primary')
 * @throws ValidationError if userId is invalid
 * @throws Error if Firestore operation fails or credentials don't exist
 */
export async function updateSelectedCalendar(
  userId: string,
  calendarId: string | null
): Promise<void> {
  validateUserId(userId);

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);

    // Check if credentials exist
    const credentialsDoc = await getDoc(credentialsRef);
    if (!credentialsDoc.exists()) {
      throw new Error('Credentials not found for user');
    }

    await updateDoc(credentialsRef, {
      selectedCalendarId: calendarId,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Credentials not found for user') {
      throw error;
    }
    throw new Error(
      `Failed to update selected calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
