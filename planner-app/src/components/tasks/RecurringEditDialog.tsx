/**
 * RecurringEditDialog Component
 *
 * Dialog shown when editing a recurring task instance.
 * Allows user to choose between editing this occurrence only or all future occurrences.
 */

import { memo } from 'react';
import { Modal } from '../common/Modal';
import type { Task } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface RecurringEditDialogProps {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Callback when user chooses to edit this occurrence only */
  onEditThisOnly: () => void;
  /** Callback when user chooses to edit all future occurrences */
  onEditAllFuture: () => void;
  /** The recurring task instance being edited */
  task: Task;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurringEditDialog - Dialog for editing recurring task instances
 *
 * Features:
 * - Two clear options for editing scope
 * - Keyboard navigation (Tab, Enter, Escape)
 * - ARIA attributes for accessibility
 * - Consistent styling with other dialogs
 *
 * @example
 * ```tsx
 * <RecurringEditDialog
 *   isOpen={showRecurringDialog}
 *   onClose={() => setShowRecurringDialog(false)}
 *   onEditThisOnly={handleEditThisOnly}
 *   onEditAllFuture={handleEditAllFuture}
 *   task={recurringTask}
 * />
 * ```
 */
export const RecurringEditDialog = memo(function RecurringEditDialog({
  isOpen,
  onClose,
  onEditThisOnly,
  onEditAllFuture,
  task,
  testId,
}: RecurringEditDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Recurring Task"
      size="md"
      testId={testId || 'recurring-edit-dialog'}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      {/* Explanation Message */}
      <div className="mb-6">
        <p className="text-gray-700 text-base leading-relaxed mb-4">
          This is a recurring task. How would you like to edit it?
        </p>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <strong className="font-medium text-gray-900">Note:</strong> Changes
          will affect either this single occurrence or all future occurrences
          of this task.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Edit This Occurrence Only */}
        <button
          type="button"
          onClick={onEditThisOnly}
          className="
            w-full px-6 py-4 rounded-lg text-left
            bg-white border-2 border-gray-300
            transition-all
            hover:border-amber-500 hover:bg-amber-50
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          "
          data-testid="edit-this-only-button"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-amber-600"
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
                Edit this occurrence only
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Changes will only apply to{' '}
                {task.instanceDate
                  ? new Date(task.instanceDate).toLocaleDateString()
                  : 'this occurrence'}
                . Future occurrences will remain unchanged.
              </p>
            </div>
          </div>
        </button>

        {/* Edit All Future Occurrences */}
        <button
          type="button"
          onClick={onEditAllFuture}
          className="
            w-full px-6 py-4 rounded-lg text-left
            bg-white border-2 border-gray-300
            transition-all
            hover:border-blue-500 hover:bg-blue-50
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          data-testid="edit-all-future-button"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-900">
                Edit all future occurrences
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Changes will apply to this occurrence and all future
                occurrences. Past occurrences will not be affected.
              </p>
            </div>
          </div>
        </button>

        {/* Cancel Button */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="
              px-6 py-2 rounded-lg
              bg-gray-200 text-gray-700 font-medium
              transition-colors
              hover:bg-gray-300
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            "
            data-testid="cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default RecurringEditDialog;
