/**
 * ConflictDialog Component
 *
 * Modal dialog that displays when sync conflicts are detected.
 * Allows users to resolve conflicts by choosing local, server, or merged versions.
 */

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ConflictItem } from './ConflictItem';
import type { ConflictItem as ConflictItemType, SyncConflictResolution, ConflictChoice } from '../../types/sync.types';

// =============================================================================
// Types
// =============================================================================

export interface ConflictDialogProps {
  /** List of conflicts to resolve */
  conflicts: ConflictItemType[];
  /** Callback when conflicts are resolved */
  onResolve: (resolutions: SyncConflictResolution[]) => void;
  /** Callback when dialog is closed without resolving */
  onClose: () => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ConflictDialog - Conflict resolution dialog
 *
 * Features:
 * - Displays all conflicts in a scrollable list
 * - Side-by-side comparison for each conflict
 * - Individual resolution choices per conflict
 * - Bulk actions: "Resolve All as Local" and "Resolve All as Server"
 * - Validation: ensures all conflicts have a resolution before submitting
 * - Accessible modal with keyboard navigation
 *
 * @example
 * ```tsx
 * <ConflictDialog
 *   conflicts={conflicts}
 *   onResolve={(resolutions) => handleResolve(resolutions)}
 *   onClose={() => setShowDialog(false)}
 * />
 * ```
 */
export function ConflictDialog({
  conflicts,
  onResolve,
  onClose,
  testId,
}: ConflictDialogProps) {
  // Track resolution choices for each conflict
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({});

  // Initialize with 'local' as default choice for all conflicts
  useEffect(() => {
    const initialChoices: Record<string, ConflictChoice> = {};
    conflicts.forEach((conflict) => {
      initialChoices[conflict.id] = 'local';
    });
    setChoices(initialChoices);
  }, [conflicts]);

  /**
   * Handle choice change for a specific conflict
   */
  const handleChoiceChange = (conflictId: string, choice: ConflictChoice) => {
    setChoices((prev) => ({
      ...prev,
      [conflictId]: choice,
    }));
  };

  /**
   * Resolve all conflicts with the same choice
   */
  const handleResolveAll = (choice: ConflictChoice) => {
    const allChoices: Record<string, ConflictChoice> = {};
    conflicts.forEach((conflict) => {
      allChoices[conflict.id] = choice;
    });
    setChoices(allChoices);
  };

  /**
   * Submit resolutions
   */
  const handleSubmit = () => {
    // Build resolution array
    const resolutions: SyncConflictResolution[] = conflicts.map((conflict) => ({
      conflictId: conflict.id,
      choice: choices[conflict.id] || 'local',
      // resolvedData would be populated here if merge is implemented
    }));

    onResolve(resolutions);
  };

  /**
   * Check if all conflicts have a resolution
   */
  const allResolved = conflicts.every((conflict) => choices[conflict.id] !== undefined);

  return (
    <Modal
      isOpen={conflicts.length > 0}
      onClose={onClose}
      title="Resolve Sync Conflicts"
      size="xl"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      testId={testId || 'conflict-dialog'}
    >
      <div className="space-y-4">
        {/* Info Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Sync conflicts detected
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  We found {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} between
                  your local data and the server. Please choose which version to keep for each
                  conflict.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700 self-center">Quick Actions:</span>
          <Button
            variant="secondary"
            onClick={() => handleResolveAll('local')}
            className="text-xs py-1 px-3"
          >
            Keep All Local
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleResolveAll('server')}
            className="text-xs py-1 px-3"
          >
            Keep All Server
          </Button>
        </div>

        {/* Conflict List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {conflicts.map((conflict, index) => (
            <div key={conflict.id}>
              <div className="text-sm font-medium text-gray-500 mb-2">
                Conflict {index + 1} of {conflicts.length}
              </div>
              <ConflictItem
                conflict={conflict}
                selectedChoice={choices[conflict.id] || 'local'}
                onChoiceChange={handleChoiceChange}
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!allResolved}
            className="sm:w-auto"
          >
            Resolve {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConflictDialog;
