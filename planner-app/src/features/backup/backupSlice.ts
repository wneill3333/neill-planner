/**
 * Backup Redux Slice
 *
 * Manages state for Google Drive backup/restore operations including
 * connection status, backup list, and operation progress.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../store/store';
import type { BackupFileInfo, BackupResult, RestoreResult } from '../../types/googleDrive.types';
import {
  initializeGoogleDriveAuth,
  requestDriveAccess,
  disconnect as disconnectDrive,
  setAccessToken,
} from '../../services/googleDrive/googleDriveService';
import {
  saveCredentials,
  getCredentials,
  deleteCredentials,
  hasCredentials,
} from '../../services/firebase/googleDriveCredentials.service';
import {
  createBackup,
  listBackups,
  restoreFromBackup,
  enforceRetention,
} from '../../services/googleDrive/backupService';
import { deleteBackupFile } from '../../services/googleDrive/googleDriveService';

// =============================================================================
// State
// =============================================================================

export interface BackupState {
  isConnected: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  isLoadingBackups: boolean;
  error: string | null;
  backups: BackupFileInfo[];
  lastBackupResult: BackupResult | null;
  lastRestoreResult: RestoreResult | null;
}

const initialState: BackupState = {
  isConnected: false,
  isBackingUp: false,
  isRestoring: false,
  isLoadingBackups: false,
  error: null,
  backups: [],
  lastBackupResult: null,
  lastRestoreResult: null,
};

// =============================================================================
// Thunks
// =============================================================================

/**
 * Check if user has valid Google Drive credentials
 */
export const checkDriveConnectionStatus = createAsyncThunk<
  boolean,
  string, // userId
  { state: RootState }
>('backup/checkConnectionStatus', async (userId) => {
  try {
    const hasStored = await hasCredentials(userId);
    if (!hasStored) {
      return false;
    }

    const credentials = await getCredentials(userId);
    if (!credentials) {
      return false;
    }

    // Check if credentials are expired
    const now = new Date();
    if (credentials.expiresAt <= now) {
      return false;
    }

    // Set the access token for Drive API calls
    setAccessToken(credentials.accessToken, credentials.expiresAt);
    return true;
  } catch (error) {
    console.error('Failed to check Drive connection status:', error);
    return false;
  }
});

/**
 * Connect Google Drive via OAuth
 */
export const connectGoogleDrive = createAsyncThunk<
  void,
  { userId: string; clientId: string },
  { state: RootState }
>('backup/connect', async ({ userId, clientId }, { rejectWithValue }) => {
  try {
    initializeGoogleDriveAuth(clientId);
    const credentials = await requestDriveAccess();
    await saveCredentials(userId, credentials);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect';
    return rejectWithValue(message);
  }
});

/**
 * Disconnect Google Drive
 */
export const disconnectGoogleDrive = createAsyncThunk<
  void,
  string, // userId
  { state: RootState }
>('backup/disconnect', async (userId, { rejectWithValue }) => {
  try {
    await disconnectDrive();
    await deleteCredentials(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect';
    return rejectWithValue(message);
  }
});

/**
 * Create a backup and upload to Google Drive
 */
export const createBackupThunk = createAsyncThunk<
  BackupResult,
  { userId: string; retentionCount: number },
  { state: RootState }
>('backup/createBackup', async ({ userId, retentionCount }, { rejectWithValue }) => {
  try {
    const result = await createBackup(userId);
    if (!result.success) {
      return rejectWithValue(result.error || 'Backup failed');
    }

    // Enforce retention after successful backup
    await enforceRetention(retentionCount);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    return rejectWithValue(message);
  }
});

/**
 * Fetch the list of available backups
 */
export const fetchBackupList = createAsyncThunk<
  BackupFileInfo[],
  void,
  { state: RootState }
>('backup/fetchBackupList', async (_, { rejectWithValue }) => {
  try {
    return await listBackups();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch backups';
    return rejectWithValue(message);
  }
});

/**
 * Restore from a backup file
 */
export const restoreBackupThunk = createAsyncThunk<
  RestoreResult,
  { userId: string; fileId: string },
  { state: RootState }
>('backup/restore', async ({ userId, fileId }, { rejectWithValue }) => {
  try {
    const result = await restoreFromBackup(userId, fileId);
    if (!result.success) {
      return rejectWithValue(result.error || 'Restore failed');
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Restore failed';
    return rejectWithValue(message);
  }
});

/**
 * Delete a backup file
 */
export const deleteBackupThunk = createAsyncThunk<
  string, // fileId that was deleted
  { fileId: string },
  { state: RootState }
>('backup/deleteBackup', async ({ fileId }, { rejectWithValue }) => {
  try {
    await deleteBackupFile(fileId);
    return fileId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete backup';
    return rejectWithValue(message);
  }
});

// =============================================================================
// Slice
// =============================================================================

export const backupSlice = createSlice({
  name: 'backup',
  initialState,
  reducers: {
    clearBackupError: (state) => {
      state.error = null;
    },
    clearLastBackupResult: (state) => {
      state.lastBackupResult = null;
    },
    clearLastRestoreResult: (state) => {
      state.lastRestoreResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check connection status
      .addCase(checkDriveConnectionStatus.fulfilled, (state, action) => {
        state.isConnected = action.payload;
      })

      // Connect
      .addCase(connectGoogleDrive.pending, (state) => {
        state.error = null;
      })
      .addCase(connectGoogleDrive.fulfilled, (state) => {
        state.isConnected = true;
        state.error = null;
      })
      .addCase(connectGoogleDrive.rejected, (state, action) => {
        state.isConnected = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to connect';
      })

      // Disconnect
      .addCase(disconnectGoogleDrive.pending, (state) => {
        state.error = null;
      })
      .addCase(disconnectGoogleDrive.fulfilled, (state) => {
        state.isConnected = false;
        state.backups = [];
        state.lastBackupResult = null;
        state.lastRestoreResult = null;
        state.error = null;
      })
      .addCase(disconnectGoogleDrive.rejected, (state, action) => {
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to disconnect';
      })

      // Create backup
      .addCase(createBackupThunk.pending, (state) => {
        state.isBackingUp = true;
        state.error = null;
      })
      .addCase(createBackupThunk.fulfilled, (state, action) => {
        state.isBackingUp = false;
        state.lastBackupResult = action.payload;
        state.error = null;
      })
      .addCase(createBackupThunk.rejected, (state, action) => {
        state.isBackingUp = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Backup failed';
      })

      // Fetch backup list
      .addCase(fetchBackupList.pending, (state) => {
        state.isLoadingBackups = true;
      })
      .addCase(fetchBackupList.fulfilled, (state, action) => {
        state.isLoadingBackups = false;
        state.backups = action.payload;
      })
      .addCase(fetchBackupList.rejected, (state, action) => {
        state.isLoadingBackups = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to load backups';
      })

      // Restore
      .addCase(restoreBackupThunk.pending, (state) => {
        state.isRestoring = true;
        state.error = null;
      })
      .addCase(restoreBackupThunk.fulfilled, (state, action) => {
        state.isRestoring = false;
        state.lastRestoreResult = action.payload;
        state.error = null;
      })
      .addCase(restoreBackupThunk.rejected, (state, action) => {
        state.isRestoring = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Restore failed';
      })

      // Delete backup
      .addCase(deleteBackupThunk.fulfilled, (state, action) => {
        state.backups = state.backups.filter((b) => b.id !== action.payload);
      })
      .addCase(deleteBackupThunk.rejected, (state, action) => {
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to delete backup';
      });
  },
});

export const { clearBackupError, clearLastBackupResult, clearLastRestoreResult } =
  backupSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

export const selectBackupIsConnected = (state: RootState) => state.backup.isConnected;
export const selectIsBackingUp = (state: RootState) => state.backup.isBackingUp;
export const selectIsRestoring = (state: RootState) => state.backup.isRestoring;
export const selectIsLoadingBackups = (state: RootState) => state.backup.isLoadingBackups;
export const selectBackupError = (state: RootState) => state.backup.error;
export const selectBackups = (state: RootState) => state.backup.backups;
export const selectLastBackupResult = (state: RootState) => state.backup.lastBackupResult;
export const selectLastRestoreResult = (state: RootState) => state.backup.lastRestoreResult;

export default backupSlice.reducer;
