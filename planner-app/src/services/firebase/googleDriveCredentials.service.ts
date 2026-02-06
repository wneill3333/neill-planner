/**
 * Google Drive Credentials Service
 *
 * Firestore service for storing and retrieving Google Drive OAuth credentials.
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
import type { GoogleDriveCredentials } from '../../types/googleDrive.types';
import { validateUserId, ValidationError } from '../../utils/validation';

/** Firestore collection name for Google Drive credentials */
const CREDENTIALS_COLLECTION = 'googleDriveCredentials';

/**
 * Convert GoogleDriveCredentials to Firestore document format
 */
function credentialsToFirestore(credentials: GoogleDriveCredentials): DocumentData {
  return {
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresAt: Timestamp.fromDate(credentials.expiresAt),
    scope: credentials.scope,
    updatedAt: Timestamp.fromDate(credentials.updatedAt),
  };
}

/**
 * Convert Firestore document to GoogleDriveCredentials
 */
function credentialsFromFirestore(data: DocumentData): GoogleDriveCredentials {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: (data.expiresAt as Timestamp).toDate(),
    scope: data.scope,
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

/**
 * Save Google Drive credentials for a user
 */
export async function saveCredentials(
  userId: string,
  credentials: GoogleDriveCredentials
): Promise<void> {
  validateUserId(userId);

  if (!credentials.accessToken || typeof credentials.accessToken !== 'string') {
    throw new ValidationError(
      'accessToken is required and must be a non-empty string',
      'accessToken',
      'INVALID_ACCESS_TOKEN'
    );
  }

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
      `Failed to save Google Drive credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get Google Drive credentials for a user
 */
export async function getCredentials(userId: string): Promise<GoogleDriveCredentials | null> {
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
      `Failed to get Google Drive credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete Google Drive credentials for a user
 */
export async function deleteCredentials(userId: string): Promise<void> {
  validateUserId(userId);

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);
    await deleteDoc(credentialsRef);
  } catch (error) {
    throw new Error(
      `Failed to delete Google Drive credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update access token and expiration time
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
      `Failed to update Google Drive tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if credentials exist for a user
 */
export async function hasCredentials(userId: string): Promise<boolean> {
  validateUserId(userId);

  try {
    const credentialsRef = doc(db, CREDENTIALS_COLLECTION, userId);
    const credentialsDoc = await getDoc(credentialsRef);
    return credentialsDoc.exists();
  } catch (error) {
    throw new Error(
      `Failed to check Google Drive credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
