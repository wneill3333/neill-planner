/**
 * EditTaskModal Component
 *
 * Modal wrapper for editing existing tasks. Integrates TaskForm with Modal component
 * and handles Redux state management for task updates and deletion.
 *
 * For the new pattern-based recurring system:
 * - Tasks with recurringPatternId are independent instances, edited directly
 * - No "this vs all" dialog needed for pattern-based instances
 *
 * For legacy recurring tasks (embedded recurrence):
 * - Shows RecurringEditDialog to choose "this only" or "all future"
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RecurringEditDialog } from '../../components/tasks/RecurringEditDialog';
import { AddTaskFormSimple } from '../../components/tasks/AddTaskFormSimple';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  updateTaskAsync,
  deleteTask,
  editRecurringInstanceOnly,
  editRecurringFuture,
  updateRecurringPatternThunk,
} from './taskThunks';
import { selectAllCategories } from '../categories';
import { selectRecurringParentTasks, selectTaskById, selectRecurringPatternById } from './taskSlice';
import { useAuth } from '../auth';
import type { Task, CreateTaskInput, RecurringPattern, RecurrencePattern as LegacyRecurrencePattern, NthWeekday } from '../../types';
import type { RootState } from '../../store';

// =============================================================================
// Helper Functions
// =============================================================================

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th'];

/**
 * Format a recurring pattern as a human-readable string
 */
function formatRecurrenceDescription(pattern: RecurringPattern): string {
  const { type, interval, daysOfWeek, dayOfMonth, monthOfYear, nthWeekday, specificDatesOfMonth, daysAfterCompletion } = pattern;

  switch (type) {
    case 'daily':
      if (interval === 1) return 'Daily';
      return `Every ${interval} days`;

    case 'weekly': {
      const dayList = daysOfWeek.length > 0
        ? daysOfWeek.sort((a, b) => a - b).map(d => DAY_NAMES[d]).join(', ')
        : 'every day';
      if (interval === 1) return `Weekly on ${dayList}`;
      return `Every ${interval} weeks on ${dayList}`;
    }

    case 'monthly': {
      // Handle nth weekday (e.g., "2nd Tuesday")
      if (nthWeekday) {
        const nth = formatNthWeekday(nthWeekday);
        if (interval === 1) return `Monthly on the ${nth}`;
        return `Every ${interval} months on the ${nth}`;
      }
      // Handle specific dates of month
      if (specificDatesOfMonth && specificDatesOfMonth.length > 0) {
        const dates = specificDatesOfMonth.sort((a, b) => a - b).map(d => formatOrdinal(d)).join(', ');
        if (interval === 1) return `Monthly on the ${dates}`;
        return `Every ${interval} months on the ${dates}`;
      }
      // Regular day of month
      const day = dayOfMonth || 1;
      if (interval === 1) return `Monthly on the ${formatOrdinal(day)}`;
      return `Every ${interval} months on the ${formatOrdinal(day)}`;
    }

    case 'yearly': {
      const month = monthOfYear ? getMonthName(monthOfYear) : 'January';
      const day = dayOfMonth || 1;
      if (interval === 1) return `Yearly on ${month} ${day}`;
      return `Every ${interval} years on ${month} ${day}`;
    }

    case 'afterCompletion': {
      const days = daysAfterCompletion || 1;
      if (days === 1) return 'Repeats 1 day after completion';
      if (days === 7) return 'Repeats 1 week after completion';
      if (days % 7 === 0) return `Repeats ${days / 7} weeks after completion`;
      return `Repeats ${days} days after completion`;
    }

    default:
      return 'Custom recurrence';
  }
}

function formatNthWeekday(nthWeekday: NthWeekday): string {
  const { n, weekday } = nthWeekday;
  const dayName = FULL_DAY_NAMES[weekday] || 'day';
  if (n === -1) return `last ${dayName}`;
  const ordinal = ORDINALS[n] || `${n}th`;
  return `${ordinal} ${dayName}`;
}

function formatOrdinal(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || 'January';
}

/**
 * Convert RecurringPattern (new system) to LegacyRecurrencePattern (form format)
 * This allows using the existing RecurrenceFormSimple component
 */
function patternToLegacyFormat(pattern: RecurringPattern): LegacyRecurrencePattern {
  return {
    type: pattern.type,
    interval: pattern.interval,
    daysOfWeek: pattern.daysOfWeek,
    dayOfMonth: pattern.dayOfMonth,
    monthOfYear: pattern.monthOfYear,
    nthWeekday: pattern.nthWeekday,
    specificDatesOfMonth: pattern.specificDatesOfMonth,
    daysAfterCompletion: pattern.daysAfterCompletion,
    endCondition: pattern.endCondition,
    exceptions: [],
  };
}

/**
 * Safely convert a date-like value to a timestamp for comparison.
 * Handles Date objects, strings (from JSON), Firestore Timestamps, and null/undefined.
 */
function toTimestamp(date: Date | string | { toDate?: () => Date } | null | undefined): number | null {
  if (date == null) return null;
  // Handle Firestore Timestamp objects
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate().getTime();
  }
  // Handle Date objects
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.getTime();
  }
  // Handle string dates
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  return null;
}

/**
 * Check if two recurrence patterns are equal (for detecting changes)
 */
function areRecurrencePatternsEqual(a: LegacyRecurrencePattern | null, b: LegacyRecurrencePattern | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.type === b.type &&
    a.interval === b.interval &&
    JSON.stringify(a.daysOfWeek?.slice().sort()) === JSON.stringify(b.daysOfWeek?.slice().sort()) &&
    a.dayOfMonth === b.dayOfMonth &&
    a.monthOfYear === b.monthOfYear &&
    JSON.stringify(a.nthWeekday) === JSON.stringify(b.nthWeekday) &&
    JSON.stringify(a.specificDatesOfMonth?.slice().sort()) === JSON.stringify(b.specificDatesOfMonth?.slice().sort()) &&
    a.daysAfterCompletion === b.daysAfterCompletion &&
    a.endCondition.type === b.endCondition.type &&
    a.endCondition.maxOccurrences === b.endCondition.maxOccurrences &&
    toTimestamp(a.endCondition.endDate) === toTimestamp(b.endCondition.endDate)
  );
}

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
  const recurringParentTasks = useAppSelector(selectRecurringParentTasks);

  // For new system: get the pattern if this task has one
  const recurringPattern = useAppSelector((state: RootState) =>
    task.recurringPatternId ? selectRecurringPatternById(state, task.recurringPatternId) : undefined
  );

  // For legacy system: check regular tasks store for the parent
  const parentFromTasks = useAppSelector((state: RootState) =>
    task.recurringParentId ? selectTaskById(state, task.recurringParentId) : undefined
  );

  // Get the parent task if this is a LEGACY recurring instance
  const parentTask = useMemo(() => {
    if (task.recurringParentId) {
      return recurringParentTasks[task.recurringParentId] || parentFromTasks || null;
    }
    return null;
  }, [task.recurringParentId, recurringParentTasks, parentFromTasks]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editMode, setEditMode] = useState<'thisOnly' | 'allFuture' | null>(null);

  // Original recurrence pattern for comparison (new system pattern-based instances)
  const [originalRecurrence, setOriginalRecurrence] = useState<LegacyRecurrencePattern | null>(null);

  // Check if this is a pattern-based instance (new system)
  const isPatternBasedInstance = useMemo(
    () => task.recurringPatternId !== null && task.recurringPatternId !== undefined,
    [task.recurringPatternId]
  );

  // Check if this is a LEGACY recurring instance (old system with embedded recurrence)
  const isLegacyRecurringInstance = useMemo(
    () => !isPatternBasedInstance && (task.isRecurringInstance || (task.recurrence !== null && task.recurringParentId != null)),
    [isPatternBasedInstance, task.isRecurringInstance, task.recurrence, task.recurringParentId]
  );

  // Show recurring dialog when modal opens ONLY for LEGACY recurring instances
  // Pattern-based instances can be edited directly (they're independent)
  useEffect(() => {
    if (isOpen && isLegacyRecurringInstance) {
      setShowRecurringDialog(true);
      setShowTaskForm(false);
      setEditMode(null);
      setOriginalRecurrence(null);
    } else if (isOpen) {
      // For pattern-based instances or non-recurring tasks, show form directly
      setShowRecurringDialog(false);
      setShowTaskForm(true);
      setEditMode(null);

      // Initialize recurrence state for pattern-based instances
      if (isPatternBasedInstance && recurringPattern) {
        const legacyFormat = patternToLegacyFormat(recurringPattern);
        setOriginalRecurrence(legacyFormat);
      } else {
        setOriginalRecurrence(null);
      }
    }
  }, [isOpen, isLegacyRecurringInstance, isPatternBasedInstance, recurringPattern]);

  /**
   * Handle choice to edit this occurrence only
   */
  const handleEditThisOnly = useCallback(() => {
    setEditMode('thisOnly');
    setShowRecurringDialog(false);
    setShowTaskForm(true);
  }, []);

  /**
   * Handle choice to edit all future occurrences
   */
  const handleEditAllFuture = useCallback(() => {
    setEditMode('allFuture');
    setShowRecurringDialog(false);
    setShowTaskForm(true);
  }, []);

  /**
   * Handle recurring dialog close
   */
  const handleRecurringDialogClose = useCallback(() => {
    setShowRecurringDialog(false);
    onClose();
  }, [onClose]);

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
        // Pattern-based instances: edit task directly, and optionally update pattern
        // NOTE: These are two separate operations. If the pattern update fails after
        // the task update succeeds, we show a partial success message.
        if (isPatternBasedInstance) {
          // Check if user is trying to disable recurrence on a pattern-based instance
          const recurrenceWasRemoved = originalRecurrence !== null && !data.recurrence;
          if (recurrenceWasRemoved && task.recurringPatternId) {
            // Prevent removing recurrence from a pattern-based instance
            // User should delete the pattern via Recurring Tasks Manager instead
            setError('Cannot remove recurrence from a recurring task instance. To stop the recurrence, use the Recurring Tasks Manager to delete the pattern.');
            setIsSubmitting(false);
            return;
          }

          // Update the task instance
          await dispatch(
            updateTaskAsync({
              id: task.id,
              userId: user.id,
              title: data.title,
              description: data.description,
              priority: data.priority,
              categoryId: data.categoryId,
              scheduledDate: data.scheduledDate,
            })
          ).unwrap();

          // If recurrence pattern was modified via the form, update the pattern
          const formRecurrenceChanged = !areRecurrencePatternsEqual(originalRecurrence, data.recurrence ?? null);
          if (formRecurrenceChanged && data.recurrence && task.recurringPatternId) {
            try {
              // Determine if schedule itself changed (not just end date) to trigger full regeneration
              const scheduleChanged = originalRecurrence !== null && (
                originalRecurrence.type !== data.recurrence.type ||
                originalRecurrence.interval !== data.recurrence.interval ||
                JSON.stringify(originalRecurrence.daysOfWeek?.slice().sort()) !== JSON.stringify(data.recurrence.daysOfWeek?.slice().sort()) ||
                originalRecurrence.dayOfMonth !== data.recurrence.dayOfMonth ||
                originalRecurrence.nthWeekday?.n !== data.recurrence.nthWeekday?.n ||
                originalRecurrence.nthWeekday?.weekday !== data.recurrence.nthWeekday?.weekday
              );

              // Convert undefined to null for Firestore compatibility
              await dispatch(
                updateRecurringPatternThunk({
                  input: {
                    id: task.recurringPatternId,
                    type: data.recurrence.type,
                    interval: data.recurrence.interval,
                    daysOfWeek: data.recurrence.daysOfWeek,
                    dayOfMonth: data.recurrence.dayOfMonth ?? null,
                    monthOfYear: data.recurrence.monthOfYear ?? null,
                    nthWeekday: data.recurrence.nthWeekday ?? null,
                    specificDatesOfMonth: data.recurrence.specificDatesOfMonth ?? null,
                    daysAfterCompletion: data.recurrence.daysAfterCompletion ?? null,
                    endCondition: data.recurrence.endCondition,
                    regenerateFutureInstances: scheduleChanged,
                  },
                  userId: user.id,
                })
              ).unwrap();
            } catch (patternErr) {
              // Task was updated but pattern update failed - show partial success
              console.error('Failed to update recurrence pattern:', patternErr);
              const errorMsg = patternErr instanceof Error ? patternErr.message : 'Unknown error';
              setError(`Task updated, but recurrence pattern update failed: ${errorMsg}. Please try editing the recurrence again.`);
              // Still call onSuccess since task was saved, but don't close modal so user sees the error
              onSuccess?.();
              return;
            }
          }
        }
        // Legacy recurring instance: use edit mode
        else if (isLegacyRecurringInstance && editMode === 'thisOnly') {
          await dispatch(
            editRecurringInstanceOnly({
              userId: user.id,
              parentTaskId: task.recurringParentId || task.id,
              instanceDate: task.instanceDate || task.scheduledDate || new Date(),
              updates: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                categoryId: data.categoryId,
                scheduledDate: data.scheduledDate,
              },
            })
          ).unwrap();
        } else if (isLegacyRecurringInstance && editMode === 'allFuture') {
          await dispatch(
            editRecurringFuture({
              userId: user.id,
              parentTaskId: task.recurringParentId || task.id,
              updates: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                categoryId: data.categoryId,
                scheduledDate: data.scheduledDate,
                recurrence: data.recurrence,
              },
            })
          ).unwrap();
        } else {
          // Regular task update (non-recurring)
          await dispatch(
            updateTaskAsync({
              id: task.id,
              userId: user.id,
              title: data.title,
              description: data.description,
              priority: data.priority,
              categoryId: data.categoryId,
              scheduledDate: data.scheduledDate,
              recurrence: data.recurrence,
            })
          ).unwrap();
        }

        onSuccess?.();
        onClose();
      } catch (err) {
        console.error('Failed to update task:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update task';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, user, task, isPatternBasedInstance, isLegacyRecurringInstance, editMode, originalRecurrence, onSuccess, onClose]
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

  // Determine the recurrence to show in the form
  // - Pattern-based instances: use originalRecurrence (from pattern, editable via form toggle)
  // - Legacy "all future" mode: use parent's recurrence
  // - Legacy "this only" mode: don't show recurrence (editing single instance)
  // - Regular tasks: use the task's own recurrence
  const formRecurrence = useMemo(() => {
    // Pattern-based instances: show the pattern's recurrence in the form
    if (isPatternBasedInstance) {
      return originalRecurrence;
    }
    if (isLegacyRecurringInstance && editMode === 'allFuture') {
      return parentTask?.recurrence || null;
    }
    if (isLegacyRecurringInstance && editMode === 'thisOnly') {
      return null;
    }
    // Regular task - use its own recurrence
    return task.recurrence;
  }, [isPatternBasedInstance, isLegacyRecurringInstance, editMode, parentTask, task.recurrence, originalRecurrence]);

  return (
    <>
      {/* Recurring Edit Dialog - shown first for recurring instances */}
      <RecurringEditDialog
        isOpen={showRecurringDialog}
        onClose={handleRecurringDialogClose}
        onEditThisOnly={handleEditThisOnly}
        onEditAllFuture={handleEditAllFuture}
        task={task}
        testId={testId ? `${testId}-recurring-dialog` : undefined}
      />

      {/* Edit Task Modal - shown after user chooses edit mode */}
      <Modal
        isOpen={showTaskForm}
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

        {/* Task Form - key forces re-mount when edit mode changes */}
        <AddTaskFormSimple
          key={`edit-form-${editMode || 'regular'}`}
          task={{
            title: task.title,
            priority: task.priority,
            categoryId: task.categoryId,
            recurrence: formRecurrence,
          }}
          categories={categories}
          defaultDate={task.scheduledDate}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          testId="edit-task-form"
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={
          isPatternBasedInstance
            ? `Are you sure you want to delete this instance of "${task.title}"? This will only delete this specific occurrence. Other instances from this recurring pattern will not be affected.`
            : isLegacyRecurringInstance
              ? `Are you sure you want to delete this occurrence of "${task.title}"? This will only affect this instance.`
              : `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
        }
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
