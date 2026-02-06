/**
 * Google Drive Service
 *
 * Handles OAuth and API operations for Google Drive integration.
 * Uses Google Identity Services (GIS) for OAuth 2.0 authentication.
 * Uses the drive.file scope (only accesses files the app creates).
 */

import type { GoogleDriveCredentials, BackupFileInfo } from '../../types/googleDrive.types';
import { BACKUP_FOLDER_NAME } from '../../types/googleDrive.types';

/** Google Drive API scope - only access files created by this app */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** Google Drive API base URL */
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/** Google Drive upload API base URL */
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

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
 * Initialize Google Identity Services for Drive
 */
export function initializeGoogleDriveAuth(clientId: string): void {
  if (!clientId) {
    throw new Error('Google OAuth client ID is required');
  }

  if (typeof google === 'undefined' || !google.accounts) {
    throw new Error('Google Identity Services script not loaded');
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: '', // Set dynamically in requestDriveAccess
  });
}

/**
 * Request Drive access from user
 * Shows Google's consent screen
 */
export function requestDriveAccess(): Promise<GoogleDriveCredentials> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google auth not initialized. Call initializeGoogleDriveAuth first.'));
      return;
    }

    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(`OAuth error: ${response.error}`));
        return;
      }

      const expiresInMs = parseInt(response.expires_in) * 1000;
      const expiresAt = new Date(Date.now() + expiresInMs);

      currentAccessToken = response.access_token;
      tokenExpiresAt = expiresAt;

      const credentials: GoogleDriveCredentials = {
        accessToken: response.access_token,
        refreshToken: '',
        expiresAt,
        scope: response.scope,
        updatedAt: new Date(),
      };

      resolve(credentials);
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Check if user is currently connected
 */
export function isConnected(): boolean {
  if (!currentAccessToken || !tokenExpiresAt) {
    return false;
  }

  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return tokenExpiresAt.getTime() - now.getTime() > bufferMs;
}

/**
 * Disconnect from Google Drive
 */
export async function disconnect(): Promise<void> {
  if (!currentAccessToken) {
    return;
  }

  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `token=${encodeURIComponent(currentAccessToken)}`,
    });
  } catch (error) {
    console.warn('Failed to revoke Google Drive token:', error);
  } finally {
    currentAccessToken = null;
    tokenExpiresAt = null;
  }
}

/**
 * Set access token manually
 * Used when loading credentials from Firestore
 */
export function setAccessToken(accessToken: string, expiresAt: Date): void {
  currentAccessToken = accessToken;
  tokenExpiresAt = expiresAt;
}

/**
 * Make an authenticated API call to Google Drive
 */
async function callDriveAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = DRIVE_API_BASE
): Promise<T> {
  if (!currentAccessToken) {
    throw new Error('Not authenticated. Call requestDriveAccess first.');
  }

  if (!isConnected()) {
    throw new Error('Access token expired. Please re-authenticate.');
  }

  const url = `${baseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${currentAccessToken}`,
    ...options.headers as Record<string, string>,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Drive API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  // Handle empty responses (e.g., DELETE)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/**
 * Find or create the backup folder on Google Drive
 */
export async function findOrCreateBackupFolder(): Promise<string> {
  // Search for existing folder
  const searchQuery = `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchResult = await callDriveAPI<{ files: { id: string; name: string }[] }>(
    `/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`
  );

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }

  // Create folder
  const folderMetadata = {
    name: BACKUP_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const folder = await callDriveAPI<{ id: string }>(
    '/files',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folderMetadata),
    }
  );

  return folder.id;
}

/**
 * Upload a backup file to Google Drive
 */
export async function uploadBackupFile(
  folderId: string,
  fileName: string,
  content: string
): Promise<{ id: string; name: string }> {
  // Use multipart upload
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
  };

  const boundary = '-------backup_boundary_' + Date.now();
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const result = await callDriveAPI<{ id: string; name: string }>(
    '/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
    DRIVE_UPLOAD_BASE
  );

  return result;
}

/**
 * List backup files in the backup folder, sorted by creation date (newest first)
 */
export async function listBackupFiles(folderId: string): Promise<BackupFileInfo[]> {
  const searchQuery = `'${folderId}' in parents and trashed=false`;
  const result = await callDriveAPI<{
    files: { id: string; name: string; createdTime: string; size: string }[];
  }>(
    `/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc&pageSize=100`
  );

  return (result.files || []).map((file) => ({
    id: file.id,
    name: file.name,
    createdAt: file.createdTime,
    sizeBytes: parseInt(file.size) || 0,
  }));
}

/**
 * Download a backup file's content
 */
export async function downloadBackupFile(fileId: string): Promise<string> {
  if (!currentAccessToken) {
    throw new Error('Not authenticated.');
  }

  if (!isConnected()) {
    throw new Error('Access token expired. Please re-authenticate.');
  }

  const url = `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${currentAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download backup file: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Delete a backup file from Google Drive
 */
export async function deleteBackupFile(fileId: string): Promise<void> {
  await callDriveAPI<void>(
    `/files/${encodeURIComponent(fileId)}`,
    { method: 'DELETE' }
  );
}
