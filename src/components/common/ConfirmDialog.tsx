/**
 * ConfirmDialog Component
 *
 * A confirmation dialog built on top of the Modal component.
 * Provides variants for different action types (danger, primary, warning)
 * with appropriate visual styling and accessibility features.
 */

import { useEffect } from 'react';
import { Modal } from './Modal';

// =============================================================================
// Types
// =============================================================================

export type ConfirmDialogVariant = 'danger' | 'primary' | 'warning';

export interface ConfirmDialogProps {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Callback when the confirm button is clicked */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Text for the confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelText?: string;
  /** Visual variant for the confirm button */
  variant?: ConfirmDialogVariant;
  /** Whether the action is currently processing */
  isProcessing?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const VARIANT_STYLES: Record<ConfirmDialogVariant, string> = {
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  primary: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
  warning: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
};

// =============================================================================
// Component
// =============================================================================

/**
 * ConfirmDialog - Accessible confirmation dialog
 *
 * Features:
 * - Multiple visual variants (danger, primary, warning)
 * - Processing state with spinner
 * - Keyboard navigation (Enter to confirm, Escape to cancel)
 * - ARIA attributes for accessibility
 * - Screen reader announcements
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Task"
 *   message="Are you sure you want to delete this task? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="danger"
 *   isProcessing={isDeleting}
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isProcessing = false,
  testId,
}: ConfirmDialogProps) {
  // Handle Enter key to confirm
  useEffect(() => {
    if (!isOpen || isProcessing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onConfirm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      testId={testId || 'confirm-dialog'}
      closeOnBackdropClick={!isProcessing}
      closeOnEscape={!isProcessing}
    >
      {/* Message */}
      <div className="mb-6">
        <p className="text-gray-700 text-base leading-relaxed">
          {message}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {/* Cancel Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="
            w-full sm:w-auto px-6 py-2 rounded-lg
            bg-gray-200 text-gray-700 font-medium
            transition-colors
            hover:bg-gray-300
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label={cancelText}
        >
          {cancelText}
        </button>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={isProcessing}
          className={`
            w-full sm:w-auto px-6 py-2 rounded-lg
            text-white font-medium
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${VARIANT_STYLES[variant]}
          `}
          aria-label={confirmText}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <span
                className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"
                role="status"
                aria-label="Processing"
              />
              Processing...
            </span>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
