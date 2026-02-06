/**
 * RestoreConfirmDialog Component
 *
 * Modal confirmation dialog shown before restoring from a backup.
 * Warns user that all current data will be replaced.
 */

import { useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';

interface RestoreConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Backup file name for display */
  backupName: string;
  /** Backup creation date for display */
  backupDate: string;
  /** Whether restore is in progress */
  isRestoring: boolean;
  /** Called when user confirms the restore */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Restore Confirmation Dialog
 */
export function RestoreConfirmDialog({
  isOpen,
  backupName,
  backupDate,
  isRestoring,
  onConfirm,
  onCancel,
}: RestoreConfirmDialogProps) {
  // Handle ESC key to cancel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRestoring) {
        onCancel();
      }
    },
    [isRestoring, onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const formattedDate = new Date(backupDate).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-dialog-title"
        className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 id="restore-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Restore Backup
          </h3>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm text-red-600 font-medium dark:text-red-400">
            This will replace ALL your current data with the backup data. This action cannot be undone.
          </p>
          <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">File:</span> {backupName}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Created:</span> {formattedDate}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            It is recommended to create a backup of your current data before restoring.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isRestoring}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </Button>
        </div>
      </div>
    </div>
  );
}
