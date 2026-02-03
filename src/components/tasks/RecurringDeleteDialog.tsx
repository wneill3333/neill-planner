/**
 * RecurringDeleteDialog Component
 *
 * Dialog shown when deleting a recurring task instance.
 * Allows user to choose between deleting this occurrence only or all future occurrences.
 */

import { memo } from 'react';
import { Modal } from '../common/Modal';
import type { Task } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface RecurringDeleteDialogProps {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Callback when user chooses to delete this occurrence only */
  onDeleteThisOnly: () => void;
  /** Callback when user chooses to delete all future occurrences */
  onDeleteAllFuture: () => void;
  /** The recurring task instance being deleted */
  task: Task;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurringDeleteDialog - Dialog for deleting recurring task instances
 *
 * Features:
 * - Two clear options for deletion scope
 * - Keyboard navigation (Tab, Enter, Escape)
 * - ARIA attributes for accessibility
 * - Consistent styling with other dialogs
 *
 * @example
 * ```tsx
 * <RecurringDeleteDialog
 *   isOpen={showRecurringDialog}
 *   onClose={() => setShowRecurringDialog(false)}
 *   onDeleteThisOnly={handleDeleteThisOnly}
 *   onDeleteAllFuture={handleDeleteAllFuture}
 *   task={recurringTask}
 * />
 * ```
 */
export const RecurringDeleteDialog = memo(function RecurringDeleteDialog({
  isOpen,
  onClose,
  onDeleteThisOnly,
  onDeleteAllFuture,
  task,
  testId,
}: RecurringDeleteDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Recurring Task"
      size="md"
      testId={testId || 'recurring-delete-dialog'}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      {/* Explanation Message */}
      <div className="mb-6">
        <p className="text-gray-700 text-base leading-relaxed mb-4">
          This is a recurring task. How would you like to delete it?
        </p>
        <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <strong className="font-medium text-red-900">Warning:</strong> Deletion
          is permanent and cannot be undone. Choose carefully which occurrences
          to delete.
        </p>
      </div>

      {/* Action Buttons - Three Equal Options */}
      <div className="flex flex-col gap-3">
        {/* Option 1: Delete All Future Occurrences */}
        <button
          type="button"
          onClick={onDeleteAllFuture}
          className="
            w-full px-6 py-4 rounded-lg text-left
            bg-white border-2 border-gray-300
            transition-all
            hover:border-red-500 hover:bg-red-50
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          "
          data-testid="delete-all-future-button"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-900">
                Delete all occurrences from this point forward
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Ends the recurring series. This occurrence and all future
                occurrences will be deleted.
              </p>
            </div>
          </div>
        </button>

        {/* Option 2: Delete This Occurrence Only */}
        <button
          type="button"
          onClick={onDeleteThisOnly}
          className="
            w-full px-6 py-4 rounded-lg text-left
            bg-white border-2 border-gray-300
            transition-all
            hover:border-orange-500 hover:bg-orange-50
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          "
          data-testid="delete-this-only-button"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-900">
                Delete only this occurrence
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Removes only{' '}
                {task.instanceDate
                  ? new Date(task.instanceDate).toLocaleDateString()
                  : 'this occurrence'}
                . Future occurrences will remain unchanged.
              </p>
            </div>
          </div>
        </button>

        {/* Option 3: Cancel */}
        <button
          type="button"
          onClick={onClose}
          className="
            w-full px-6 py-4 rounded-lg text-left
            bg-white border-2 border-gray-300
            transition-all
            hover:border-gray-500 hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          "
          data-testid="cancel-button"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-900">
                Cancel - Do nothing
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Close this dialog without making any changes.
              </p>
            </div>
          </div>
        </button>
      </div>
    </Modal>
  );
});

export default RecurringDeleteDialog;
