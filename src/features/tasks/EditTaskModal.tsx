/**
 * EditTaskModal Component
 *
 * Modal wrapper for editing existing tasks. Integrates TaskForm with Modal component
 * and handles Redux state management for task updates and deletion.
 */

import { useState, useCallback } from 'react';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TaskForm } from '../../components/tasks/TaskForm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateTaskAsync, deleteTask } from './taskThunks';
import { selectAllCategories } from '../categories';
import { useAuth } from '../auth';
import type { Task, CreateTaskInput } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface EditTaskModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** The task being edited */
  task: Task;
  /** Callback when a task is successfully updated or deleted */
  onSuccess?: () => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * EditTaskModal - Modal for editing existing tasks
 *
 * Wraps the TaskForm component in a Modal and handles:
 * - Redux dispatch for updateTaskAsync thunk
 * - Redux dispatch for deleteTask thunk
 * - Getting categories from Redux store
 * - Loading and error states for both update and delete
 * - Confirmation dialog for delete action
 * - Closing on success
 * - User authentication
 *
 * @example
 * ```tsx
 * <EditTaskModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   task={selectedTask}
 *   onSuccess={() => {
 *     console.log('Task updated!');
 *     setIsModalOpen(false);
 *   }}
 * />
 * ```
 */
export function EditTaskModal({
  isOpen,
  onClose,
  task,
  onSuccess,
  testId,
}: EditTaskModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const categories = useAppSelector(selectAllCategories);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Handle form submission (update)
   */
  const handleSubmit = useCallback(
    async (data: CreateTaskInput) => {
      if (!user) {
        setError('You must be signed in to update tasks');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Dispatch the updateTaskAsync thunk
        await dispatch(
          updateTaskAsync({
            id: task.id,
            userId: user.id,
            title: data.title,
            description: data.description,
            priority: data.priority,
            categoryId: data.categoryId,
            scheduledDate: data.scheduledDate,
            scheduledTime: data.scheduledTime,
          })
        ).unwrap();

        // Success - call onSuccess callback and close modal
        onSuccess?.();
        onClose();
      } catch (err) {
        // Handle error
        console.error('Failed to update task:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update task';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, user, task.id, onSuccess, onClose]
  );

  /**
   * Handle delete button click - show confirmation dialog
   */
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to delete tasks');
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Dispatch the deleteTask thunk
      await dispatch(
        deleteTask({
          taskId: task.id,
          userId: user.id,
        })
      ).unwrap();

      // Success - close confirm dialog, call onSuccess callback, and close modal
      setShowDeleteConfirm(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      // Handle error
      console.error('Failed to delete task:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, user, task.id, onSuccess, onClose]);

  /**
   * Handle delete cancel
   */
  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    if (!isSubmitting && !isDeleting) {
      setError(null);
      setShowDeleteConfirm(false);
      onClose();
    }
  }, [isSubmitting, isDeleting, onClose]);

  // Determine if any operation is in progress
  const isProcessing = isSubmitting || isDeleting;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit Task"
        size="lg"
        testId={testId || 'edit-task-modal'}
        closeOnBackdropClick={!isProcessing}
        closeOnEscape={!isProcessing}
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

        {/* Delete Button */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isProcessing}
            className="
              px-4 py-2 rounded-lg
              bg-red-50 text-red-600 font-medium
              transition-colors
              hover:bg-red-100
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            data-testid="delete-task-button"
          >
            Delete Task
          </button>
        </div>

        {/* Task Form */}
        <TaskForm
          task={task}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isProcessing={isDeleting}
        testId="delete-task-confirm-dialog"
      />
    </>
  );
}

export default EditTaskModal;
