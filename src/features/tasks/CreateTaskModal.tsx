/**
 * CreateTaskModal Component
 *
 * Modal wrapper for creating new tasks. Integrates TaskForm with Modal component
 * and handles Redux state management for task creation.
 */

import { useState, useCallback, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { TaskForm } from '../../components/tasks/TaskForm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTaskAsync } from './taskThunks';
import { selectAllCategories } from '../categories';
import { useAuth } from '../auth';
import type { CreateTaskInput } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CreateTaskModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when a task is successfully created */
  onSuccess?: () => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CreateTaskModal - Modal for creating new tasks
 *
 * Wraps the TaskForm component in a Modal and handles:
 * - Redux dispatch for createTaskAsync thunk
 * - Getting categories from Redux store
 * - Loading and error states
 * - Closing on success
 * - User authentication
 *
 * @example
 * ```tsx
 * <CreateTaskModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={() => {
 *     console.log('Task created!');
 *     setIsModalOpen(false);
 *   }}
 * />
 * ```
 */
export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  testId,
}: CreateTaskModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const categories = useAppSelector(selectAllCategories);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (data: CreateTaskInput) => {
      if (!user) {
        setError('You must be signed in to create tasks');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Dispatch the createTaskAsync thunk
        await dispatch(
          createTaskAsync({
            input: data,
            userId: user.id,
          })
        ).unwrap();

        // Success - call onSuccess callback and close modal
        onSuccess?.();
        onClose();
      } catch (err) {
        // Handle error
        console.error('Failed to create task:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create task';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, user, onSuccess, onClose]
  );

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      size="lg"
      testId={testId || 'create-task-modal'}
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Task Form */}
      <TaskForm
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}

export default CreateTaskModal;
