/**
 * CreateTaskModal Component
 *
 * Modal wrapper for creating new tasks. Integrates TaskForm with Modal component
 * and handles Redux state management for task creation.
 *
 * For recurring tasks, uses the new pattern system (createRecurringPatternThunk)
 * which creates a RecurringPattern document and generates materialized instances.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { AddTaskFormSimple } from '../../components/tasks/AddTaskFormSimple';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTaskAsync, createRecurringPatternThunk } from './taskThunks';
import { selectAllCategories } from '../categories';
import { selectSelectedDate, selectTasksForSelectedDate } from './taskSlice';
import { useAuth } from '../auth';
import { sortTasksByPriority } from '../../utils/taskUtils';
import { parseISODateString } from '../../utils/firestoreUtils';
import type { CreateTaskInput, CreateRecurringPatternInput, RecurrencePattern } from '../../types';

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
  const selectedDateString = useAppSelector(selectSelectedDate);
  const tasksForDate = useAppSelector(selectTasksForSelectedDate);

  // Convert ISO date string to Date object for TaskForm
  // IMPORTANT: Use parseISODateString to create a Date at LOCAL midnight
  // Using new Date("2026-02-05") would create UTC midnight, which is the previous day in western timezones!
  const selectedDate = selectedDateString ? parseISODateString(selectedDateString) : null;

  // Get the last task's priority to use as default for new tasks
  const defaultPriority = useMemo(() => {
    if (tasksForDate.length === 0) {
      return 'B'; // Default to B if no tasks exist
    }
    const sortedTasks = sortTasksByPriority(tasksForDate);
    const lastTask = sortedTasks[sortedTasks.length - 1];
    // Return the priority letter + number (e.g., "A1", "B2")
    return `${lastTask.priority.letter}${lastTask.priority.number}`;
  }, [tasksForDate]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  /**
   * Convert legacy RecurrencePattern to CreateRecurringPatternInput
   */
  const convertToPatternInput = useCallback(
    (data: CreateTaskInput, recurrence: RecurrencePattern): CreateRecurringPatternInput => {
      return {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        priority: data.priority,
        startTime: data.startTime,
        duration: data.duration,
        type: recurrence.type,
        interval: recurrence.interval,
        daysOfWeek: recurrence.daysOfWeek,
        dayOfMonth: recurrence.dayOfMonth,
        monthOfYear: recurrence.monthOfYear,
        nthWeekday: recurrence.nthWeekday,
        specificDatesOfMonth: recurrence.specificDatesOfMonth,
        daysAfterCompletion: recurrence.daysAfterCompletion,
        endCondition: recurrence.endCondition,
        startDate: data.scheduledDate || new Date(),
      };
    },
    []
  );

  /**
   * Handle form submission
   *
   * For recurring tasks, uses the new pattern system which creates
   * a RecurringPattern document and generates materialized instances.
   * For non-recurring tasks, creates a single task document.
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
        if (data.recurrence) {
          // Use new pattern system for recurring tasks
          const patternInput = convertToPatternInput(data, data.recurrence);
          await dispatch(
            createRecurringPatternThunk({
              input: patternInput,
              userId: user.id,
            })
          ).unwrap();
        } else {
          // Non-recurring task - use standard createTaskAsync
          await dispatch(
            createTaskAsync({
              input: data,
              userId: user.id,
            })
          ).unwrap();
        }

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
    [dispatch, user, convertToPatternInput, onSuccess, onClose]
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
      title="Add Task"
      size="md"
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

      {/* Simplified Task Form */}
      <AddTaskFormSimple
        categories={categories}
        defaultDate={selectedDate}
        defaultPriority={defaultPriority}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}

export default CreateTaskModal;
