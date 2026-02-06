/**
 * GoogleDriveBackupSettings Component
 *
 * Self-contained component for Google Drive backup settings,
 * placed in the Integrations section of SettingsPage.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  HardDrive,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '../common/Button';
import { RestoreConfirmDialog } from './RestoreConfirmDialog';
import { useGoogleDriveBackup, useLastBackupTime } from '../../features/backup/hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../features/auth/useAuth';
import { selectSettings, saveSettings } from '../../features/settings';
import type { BackupFrequency, BackupRetentionCount } from '../../types/googleDrive.types';
import {
  BACKUP_FREQUENCY_OPTIONS,
  BACKUP_RETENTION_OPTIONS,
} from '../../types/googleDrive.types';
import { calculateNextBackupTime } from '../../services/googleDrive/backupService';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Google Drive Backup Settings Component
 */
export function GoogleDriveBackupSettings() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const settings = useAppSelector(selectSettings);
  const lastBackupTimeStr = useLastBackupTime();

  const {
    isConnected,
    isBackingUp,
    isRestoring,
    isLoadingBackups,
    error,
    backups,
    lastBackupResult,
    lastRestoreResult,
    connect,
    disconnect,
    backup,
    fetchBackups,
    restore,
    deleteBackup,
    clearError,
    clearBackupResult,
    clearRestoreResult,
  } = useGoogleDriveBackup();

  // Local state for restore confirmation dialog
  const [restoreTarget, setRestoreTarget] = useState<{
    fileId: string;
    name: string;
    createdAt: string;
  } | null>(null);

  // Fetch backups when connected
  useEffect(() => {
    if (isConnected && backups.length === 0 && !isLoadingBackups) {
      fetchBackups();
    }
  }, [isConnected, backups.length, isLoadingBackups, fetchBackups]);

  // Update settings after successful backup
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (lastBackupResult?.success && user?.id && settings) {
      const bc = settings.backupConfig || {};
      const lastBackupAt = lastBackupResult.completedAt;
      const nextBackupAt = calculateNextBackupTime(
        lastBackupAt,
        bc.backupFrequency || 'weekly'
      );

      dispatch(
        saveSettings({
          userId: user.id,
          updates: {
            backupConfig: {
              ...bc,
              googleDriveConnected: true,
              lastBackupAt,
              nextBackupAt,
            },
          },
        })
      );

      fetchBackups();
      timer = setTimeout(() => clearBackupResult(), 5000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [lastBackupResult, user?.id, settings, dispatch, fetchBackups, clearBackupResult]);

  // Handle successful restore
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (lastRestoreResult?.success) {
      timer = setTimeout(() => clearRestoreResult(), 5000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [lastRestoreResult, clearRestoreResult]);

  const handleConnect = useCallback(async () => {
    try {
      await connect(GOOGLE_CLIENT_ID);
      // Update settings
      if (user?.id) {
        dispatch(
          saveSettings({
            userId: user.id,
            updates: {
              backupConfig: {
                ...(settings?.backupConfig || {}),
                googleDriveConnected: true,
              },
            },
          })
        );
      }
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  }, [connect, dispatch, user?.id, settings?.backupConfig]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      if (user?.id) {
        dispatch(
          saveSettings({
            userId: user.id,
            updates: {
              backupConfig: {
                googleDriveConnected: false,
                lastBackupAt: null,
                nextBackupAt: null,
              },
            },
          })
        );
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, [disconnect, dispatch, user?.id]);

  const handleFrequencyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!user?.id || !settings) return;
      const frequency = e.target.value as BackupFrequency;
      const nextBackupAt = calculateNextBackupTime(
        settings.backupConfig?.lastBackupAt || null,
        frequency
      );
      dispatch(
        saveSettings({
          userId: user.id,
          updates: {
            backupConfig: {
              ...(settings.backupConfig || {}),
              backupFrequency: frequency,
              nextBackupAt,
            },
          },
        })
      );
    },
    [dispatch, user?.id, settings]
  );

  const handleRetentionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!user?.id || !settings) return;
      const retentionCount = parseInt(e.target.value) as BackupRetentionCount;
      dispatch(
        saveSettings({
          userId: user.id,
          updates: {
            backupConfig: {
              ...(settings.backupConfig || {}),
              retentionCount,
            },
          },
        })
      );
    },
    [dispatch, user?.id, settings]
  );

  const handleRestore = useCallback(
    async (fileId: string) => {
      setRestoreTarget(null);
      try {
        await restore(fileId);
      } catch (err) {
        console.error('Failed to restore:', err);
      }
    },
    [restore]
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      try {
        await deleteBackup(fileId);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    },
    [deleteBackup]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const backupConfig = settings?.backupConfig;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDrive className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Google Drive Backup</h3>
            <p className="text-sm text-muted-foreground">
              Back up and restore your planner data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Success messages */}
      {lastBackupResult?.success && (
        <div className="rounded-md bg-green-50 p-3 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-300">
            Backup created successfully!
            {lastBackupResult.counts && (
              <span className="text-xs ml-2">
                ({lastBackupResult.counts.tasks} tasks, {lastBackupResult.counts.events} events,{' '}
                {lastBackupResult.counts.notes} notes)
              </span>
            )}
          </p>
        </div>
      )}

      {lastRestoreResult?.success && (
        <div className="rounded-md bg-green-50 p-3 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-300">
            Restore completed successfully! Please refresh the page to see your restored data.
          </p>
        </div>
      )}

      {/* Connected state: settings and backup list */}
      {isConnected && (
        <>
          {/* Last backup time */}
          {lastBackupTimeStr && (
            <p className="text-sm text-muted-foreground">
              Last backup: {lastBackupTimeStr}
            </p>
          )}

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="backup-frequency" className="block text-sm font-medium mb-1">
                Backup Frequency
              </label>
              <select
                id="backup-frequency"
                value={backupConfig?.backupFrequency || 'weekly'}
                onChange={handleFrequencyChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {BACKUP_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="backup-retention" className="block text-sm font-medium mb-1">
                Retention
              </label>
              <select
                id="backup-retention"
                value={backupConfig?.retentionCount ?? 10}
                onChange={handleRetentionChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {BACKUP_RETENTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Backup now button */}
          <div>
            <Button onClick={backup} disabled={isBackingUp || isRestoring}>
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Back Up Now
                </>
              )}
            </Button>
          </div>

          {/* Backup history */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Backup History</h4>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => fetchBackups()}
                disabled={isLoadingBackups}
              >
                {isLoadingBackups ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {isLoadingBackups && backups.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading backups...
              </div>
            ) : backups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No backups found. Create your first backup above.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {backups.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {new Date(file.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.sizeBytes)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Restore from this backup"
                        onClick={() =>
                          setRestoreTarget({
                            fileId: file.id,
                            name: file.name,
                            createdAt: file.createdAt,
                          })
                        }
                        disabled={isRestoring || isBackingUp}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete this backup"
                        onClick={() => handleDelete(file.id)}
                        disabled={isRestoring || isBackingUp}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Connect/Disconnect buttons */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={handleConnect} disabled={isBackingUp}>
            Connect Google Drive
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleDisconnect} disabled={isBackingUp || isRestoring}>
            Disconnect
          </Button>
        )}
      </div>

      {!GOOGLE_CLIENT_ID && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your environment
            variables.
          </p>
        </div>
      )}

      {/* Restore confirmation dialog */}
      {restoreTarget && (
        <RestoreConfirmDialog
          isOpen={true}
          backupName={restoreTarget.name}
          backupDate={restoreTarget.createdAt}
          isRestoring={isRestoring}
          onConfirm={() => handleRestore(restoreTarget.fileId)}
          onCancel={() => setRestoreTarget(null)}
        />
      )}
    </div>
  );
}
