/**
 * Backup Hooks
 *
 * Custom React hooks for Google Drive backup integration.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../auth/useAuth';
import { selectSettings } from '../settings';
import {
  checkDriveConnectionStatus,
  connectGoogleDrive,
  disconnectGoogleDrive,
  createBackupThunk,
  fetchBackupList,
  restoreBackupThunk,
  deleteBackupThunk,
  clearBackupError,
  clearLastBackupResult,
  clearLastRestoreResult,
  selectBackupIsConnected,
  selectIsBackingUp,
  selectIsRestoring,
  selectIsLoadingBackups,
  selectBackupError,
  selectBackups,
  selectLastBackupResult,
  selectLastRestoreResult,
} from './backupSlice';

/**
 * Main hook for Google Drive backup integration
 */
export function useGoogleDriveBackup() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const settings = useAppSelector(selectSettings);
  const isConnected = useAppSelector(selectBackupIsConnected);
  const isBackingUp = useAppSelector(selectIsBackingUp);
  const isRestoring = useAppSelector(selectIsRestoring);
  const isLoadingBackups = useAppSelector(selectIsLoadingBackups);
  const error = useAppSelector(selectBackupError);
  const backups = useAppSelector(selectBackups);
  const lastBackupResult = useAppSelector(selectLastBackupResult);
  const lastRestoreResult = useAppSelector(selectLastRestoreResult);

  // Check connection status on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(checkDriveConnectionStatus(user.id));
    }
  }, [dispatch, user?.id]);

  const connect = useCallback(
    (clientId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return dispatch(connectGoogleDrive({ userId: user.id, clientId }));
    },
    [dispatch, user?.id]
  );

  const disconnectDrive = useCallback(() => {
    if (!user?.id) throw new Error('User not authenticated');
    return dispatch(disconnectGoogleDrive(user.id));
  }, [dispatch, user?.id]);

  const backup = useCallback(() => {
    if (!user?.id) throw new Error('User not authenticated');
    const retentionCount = settings?.backupConfig?.retentionCount ?? 10;
    return dispatch(createBackupThunk({ userId: user.id, retentionCount }));
  }, [dispatch, user?.id, settings?.backupConfig?.retentionCount]);

  const fetchBackups = useCallback(() => {
    return dispatch(fetchBackupList());
  }, [dispatch]);

  const restore = useCallback(
    (fileId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return dispatch(restoreBackupThunk({ userId: user.id, fileId }));
    },
    [dispatch, user?.id]
  );

  const deleteBackup = useCallback(
    (fileId: string) => {
      return dispatch(deleteBackupThunk({ fileId }));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearBackupError());
  }, [dispatch]);

  const clearBackupResultMsg = useCallback(() => {
    dispatch(clearLastBackupResult());
  }, [dispatch]);

  const clearRestoreResultMsg = useCallback(() => {
    dispatch(clearLastRestoreResult());
  }, [dispatch]);

  return {
    isConnected,
    isBackingUp,
    isRestoring,
    isLoadingBackups,
    error,
    backups,
    lastBackupResult,
    lastRestoreResult,
    connect,
    disconnect: disconnectDrive,
    backup,
    fetchBackups,
    restore,
    deleteBackup,
    clearError,
    clearBackupResult: clearBackupResultMsg,
    clearRestoreResult: clearRestoreResultMsg,
  };
}

/**
 * Hook that checks if an auto-backup is due and triggers it silently on mount
 */
export function useAutoBackup() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const settings = useAppSelector(selectSettings);
  const isConnected = useAppSelector(selectBackupIsConnected);
  const isBackingUp = useAppSelector(selectIsBackingUp);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (
      !user?.id ||
      !isConnected ||
      isBackingUp ||
      hasChecked.current ||
      !settings?.backupConfig
    ) {
      return;
    }

    const { backupFrequency, nextBackupAt, retentionCount } = settings.backupConfig;

    // Skip if manual-only
    if (backupFrequency === 'manual') {
      hasChecked.current = true;
      return;
    }

    // Skip if no next backup time scheduled
    if (!nextBackupAt) {
      hasChecked.current = true;
      return;
    }

    // Check if backup is due
    const now = new Date();
    const nextBackupTime = new Date(nextBackupAt);

    if (now >= nextBackupTime) {
      hasChecked.current = true;
      dispatch(createBackupThunk({ userId: user.id, retentionCount }));
    } else {
      hasChecked.current = true;
    }
  }, [user?.id, isConnected, isBackingUp, settings?.backupConfig, dispatch]);
}

/**
 * Hook to get formatted last backup time
 */
export function useLastBackupTime() {
  const settings = useAppSelector(selectSettings);
  const lastBackupAt = settings?.backupConfig?.lastBackupAt;

  if (!lastBackupAt) {
    return null;
  }

  const backupDate = new Date(lastBackupAt);
  const now = new Date();
  const diffMs = now.getTime() - backupDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}
