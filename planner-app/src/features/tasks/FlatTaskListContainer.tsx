/**
 * FlatTaskListContainer Component
 *
 * Container component that connects the flat task list to Redux store.
 * Uses the new TaskItemRedesign component and flat list layout.
 * Handles task interactions, status changes, and forwarding.
 */

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { useSelectedDateTasks } from './hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAnnouncement } from '../../hooks';
import { updateTaskAsync, forwardTaskAsync, deleteTask, batchUpdateTasksAsync, deleteRecurringInstanceOnly, deleteRecurringFuture, editRecurringInstanceOnly, completeAfterCompletionTask, updateRecurringInstanceStatus } from './taskThunks';
import { selectRecurringPatterns } from './taskSlice';
import { selectHideCompletedTasks } from '../filters/filterSlice';
import { FlatTaskList, DraggableFlatTaskList, ForwardDateModal, RecurringDeleteDialog } from '../../components/tasks';
import type { Task, TaskStatus, PriorityLetter, UpdateTaskInput } from '../../types';
import { getStatusLabel } from '../../utils/statusUtils';
import { sortTasksByPriority } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface FlatTaskListContainerProps {
  /** Callback when a task is clicked (opens edit modal) */
  onTaskClick?: (task: Task) => void;
  /** Whether to enable drag-and-drop */
  enableDragAndDrop?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Error State Component
// =============================================================================

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12 text-center"
      data-testid="error-state"
      role="alert"
      aria-live="assertive"
    >
      <svg
        className="w-12 h-12 mb-4 text-red-400 sm:w-16 sm:h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="mb-2 text-base font-medium text-gray-700 sm:text-lg">Something went wrong</p>
      <p className="mb-4 text-sm text-gray-500 max-w-md">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="Retry loading tasks"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Unauthenticated State Component
// =============================================================================

function UnauthenticatedState() {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12 text-center"
      data-testid="unauthenticated-state"
      role="status"
      aria-label="User not signed in"
    >
      <svg
        className="w-12 h-12 mb-4 text-gray-400 sm:w-16 sm:h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <p className="text-base font-medium text-gray-700 sm:text-lg">Please sign in</p>
      <p className="mt-1 text-sm text-gray-500">Sign in to view your tasks</p>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * FlatTaskListContainer - Connects flat task list to Redux store
 *
 * Uses the new redesigned task item with:
 * - Status dropdown for status selection
 * - Forward date modal for forwarding tasks
 * - Edit and delete buttons on each task
 */
export function FlatTaskListContainer({
  onTaskClick,
  enableDragAndDrop = true,
  testId,
}: FlatTaskListContainerProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  // Track which task is being updated
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  // Track task being forwarded
  const [forwardingTask, setForwardingTask] = useState<Task | null>(null);
  // Track task being deleted (for recurring delete dialog)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Announcement hook for screen readers
  const { announcement, announce, politeness } = useAnnouncement();

  const {
    tasks,
    categoriesMap,
    loading,
    error,
    refetch,
    selectedDate,
  } = useSelectedDateTasks(userId);

  // Get recurring patterns to check for afterCompletion type
  const recurringPatterns = useAppSelector(selectRecurringPatterns);
  const hideCompleted = useAppSelector(selectHideCompletedTasks);

  // Sort tasks by priority for flat display
  const sortedTasks = sortTasksByPriority(tasks);

  // Filter out completed/forwarded/delegated tasks if toggle is active
  const visibleTasks = useMemo(
    () => hideCompleted
      ? sortedTasks.filter(t => t.status !== 'complete' && t.status !== 'forward' && t.status !== 'delegate' && t.status !== 'cancelled')
      : sortedTasks,
    [hideCompleted, sortedTasks]
  );

  // Handle status change from dropdown
  const handleStatusChange = useCallback(
    async (task: Task, newStatus: TaskStatus) => {
      if (!userId) return;

      const statusLabel = getStatusLabel(newStatus);
      setUpdatingTaskId(task.id);
      announce(`Updating task status to ${statusLabel}`);

      try {
        // Check if this is a virtual recurring instance (legacy system)
        const isVirtualInstance = task.isRecurringInstance && task.recurringParentId && task.id.includes('_');

        // Check if this is an afterCompletion recurring task being completed
        const pattern = task.recurringPatternId
          ? recurringPatterns[task.recurringPatternId]
          : null;
        const isAfterCompletionTask = pattern?.type === 'afterCompletion';

        if (isAfterCompletionTask && newStatus === 'complete') {
          // Use special thunk that creates the next instance
          await dispatch(
            completeAfterCompletionTask({
              taskId: task.id,
              patternId: task.recurringPatternId!,
              userId,
            })
          ).unwrap();
          announce('Task completed, next occurrence scheduled');
        } else if (isVirtualInstance && task.recurringParentId && task.instanceDate) {
          // Virtual instance: materialize it with the new status
          await dispatch(
            editRecurringInstanceOnly({
              userId,
              parentTaskId: task.recurringParentId,
              instanceDate: task.instanceDate,
              updates: { status: newStatus },
            })
          ).unwrap();
          announce(`Task status updated to ${statusLabel}`);
        } else if (task.recurrence !== null) {
          // Legacy recurring parent task: store as instance modification so
          // only this day is affected, not future occurrences
          await dispatch(
            updateRecurringInstanceStatus({
              userId,
              task,
              newStatus,
            })
          ).unwrap();
          announce(`Task status updated to ${statusLabel}`);
        } else {
          // Regular status update
          await dispatch(updateTaskAsync({ id: task.id, status: newStatus, userId })).unwrap();
          announce(`Task status updated to ${statusLabel}`);
        }
      } catch (err) {
        console.error('Failed to update task status:', err);
        announce('Failed to update task status');
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [dispatch, announce, userId, recurringPatterns]
  );

  // Handle forward select - open date modal
  const handleForwardSelect = useCallback((task: Task) => {
    setForwardingTask(task);
  }, []);

  // Handle forward confirm - execute forward
  const handleForwardConfirm = useCallback(
    async (newDate: Date) => {
      if (!forwardingTask || !userId) return;

      setUpdatingTaskId(forwardingTask.id);
      announce('Forwarding task to new date');

      try {
        await dispatch(
          forwardTaskAsync({
            task: forwardingTask,
            newDate,
            userId,
          })
        ).unwrap();
        announce('Task forwarded successfully');
        setForwardingTask(null);
      } catch (err) {
        console.error('Failed to forward task:', err);
        announce('Failed to forward task');
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [dispatch, announce, forwardingTask, userId]
  );

  // Handle forward modal close
  const handleForwardClose = useCallback(() => {
    setForwardingTask(null);
  }, []);

  // Handle task click - opens edit modal
  const handleTaskClick = useCallback(
    (task: Task) => {
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  // Handle edit button click - same as task click
  const handleEdit = useCallback(
    (task: Task) => {
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  // Handle delete button click
  const handleDelete = useCallback(
    async (task: Task) => {
      if (!userId) return;

      // Check if this is a virtual recurring instance or a recurring parent task
      const isVirtualInstance = task.isRecurringInstance && task.recurringParentId && task.id.includes('_');
      const isRecurringParent = task.recurrence !== null;
      const isRecurring = isVirtualInstance || isRecurringParent;

      if (isRecurring) {
        // For recurring tasks, show the delete dialog
        setDeletingTask(task);
        setShowDeleteDialog(true);
      } else {
        // Regular task - simple confirmation
        const confirmed = window.confirm(`Delete task "${task.title}"?`);
        if (!confirmed) return;

        setUpdatingTaskId(task.id);
        try {
          announce('Deleting task');
          await dispatch(deleteTask({ taskId: task.id, userId })).unwrap();
          announce('Task deleted');
        } catch (err) {
          console.error('Failed to delete task:', err);
          announce('Failed to delete task');
        } finally {
          setUpdatingTaskId(null);
        }
      }
    },
    [dispatch, announce, userId]
  );

  // Handle "Delete all future occurrences" from dialog
  const handleDeleteAllFuture = useCallback(async () => {
    if (!userId || !deletingTask || !selectedDate) return;

    const isVirtualInstance = deletingTask.isRecurringInstance && deletingTask.recurringParentId;
    const parentId = isVirtualInstance ? deletingTask.recurringParentId! : deletingTask.id;

    // Use selectedDate from UI to avoid timezone issues
    // Parse the date string (YYYY-MM-DD) to create a local date at midnight
    const [year, month, day] = selectedDate.split('-').map(Number);
    const instanceDate = new Date(year, month - 1, day); // month is 0-indexed

    setShowDeleteDialog(false);
    setUpdatingTaskId(deletingTask.id);

    try {
      announce('Ending recurring series');
      await dispatch(
        deleteRecurringFuture({
          userId,
          parentTaskId: parentId,
          instanceDate,
        })
      ).unwrap();
      announce('Recurring series ended');
    } catch (err) {
      console.error('Failed to end recurring series:', err);
      announce('Failed to end recurring series');
    } finally {
      setUpdatingTaskId(null);
      setDeletingTask(null);
    }
  }, [dispatch, announce, userId, deletingTask, selectedDate]);

  // Handle "Delete this occurrence only" from dialog
  const handleDeleteThisOnly = useCallback(async () => {
    if (!userId || !deletingTask || !selectedDate) return;

    const isVirtualInstance = deletingTask.isRecurringInstance && deletingTask.recurringParentId;
    const parentId = isVirtualInstance ? deletingTask.recurringParentId! : deletingTask.id;

    // Use selectedDate from UI to avoid timezone issues
    // Parse the date string (YYYY-MM-DD) to create a local date at midnight
    const [year, month, day] = selectedDate.split('-').map(Number);
    const instanceDate = new Date(year, month - 1, day); // month is 0-indexed

    setShowDeleteDialog(false);
    setUpdatingTaskId(deletingTask.id);

    try {
      announce('Skipping this occurrence');
      await dispatch(
        deleteRecurringInstanceOnly({
          userId,
          parentTaskId: parentId,
          instanceDate,
        })
      ).unwrap();
      announce('Occurrence skipped');
    } catch (err) {
      console.error('Failed to skip occurrence:', err);
      announce('Failed to skip occurrence');
    } finally {
      setUpdatingTaskId(null);
      setDeletingTask(null);
    }
  }, [dispatch, announce, userId, deletingTask, selectedDate]);

  // Handle cancel/close delete dialog
  const handleDeleteDialogClose = useCallback(() => {
    setShowDeleteDialog(false);
    setDeletingTask(null);
  }, []);

  // Handle task reorder (for drag-and-drop)
  const handleReorder = useCallback(
    async (reorderedTasks: Task[]) => {
      if (!userId) {
        console.error('Cannot reorder tasks: user not authenticated');
        announce('Failed to reorder tasks: not authenticated');
        return;
      }

      // Calculate new priority numbers for each task based on its position in the reordered list
      // We maintain the priority letter but renumber within each group based on order
      const priorityCounters: Record<PriorityLetter, number> = { A: 0, B: 0, C: 0, D: 0 };
      const updates: UpdateTaskInput[] = [];
      const virtualInstancesToMaterialize: Array<{
        task: Task;
        newPriority: { letter: PriorityLetter; number: number };
      }> = [];

      for (const task of reorderedTasks) {
        const letter = task.priority.letter;
        priorityCounters[letter]++;
        const newNumber = priorityCounters[letter];

        // Check if this is a virtual recurring instance (ID contains underscore with date)
        const isVirtualInstance = task.isRecurringInstance && task.recurringParentId && task.id.includes('_');

        if (isVirtualInstance) {
          // Virtual instances need to be materialized with the new priority
          virtualInstancesToMaterialize.push({
            task,
            newPriority: { letter, number: newNumber },
          });
        } else {
          // Regular tasks - only update if the number changed
          if (task.priority.number !== newNumber) {
            updates.push({
              id: task.id,
              priority: {
                letter,
                number: newNumber,
              },
            });
          }
        }
      }

      // If no changes needed, just announce success
      if (updates.length === 0 && virtualInstancesToMaterialize.length === 0) {
        announce('Tasks reordered');
        return;
      }

      // Persist to Firestore
      try {
        // Update regular tasks
        if (updates.length > 0) {
          await dispatch(batchUpdateTasksAsync({ updates, userId })).unwrap();
        }

        // Materialize virtual recurring instances with new priorities
        for (const { task, newPriority } of virtualInstancesToMaterialize) {
          if (!task.recurringParentId || !task.instanceDate) {
            console.warn('Virtual instance missing parent ID or instance date:', task.id);
            continue;
          }

          await dispatch(
            editRecurringInstanceOnly({
              userId,
              parentTaskId: task.recurringParentId,
              instanceDate: task.instanceDate,
              updates: {
                priority: newPriority,
              },
            })
          ).unwrap();
        }

        announce('Tasks reordered');
      } catch (err) {
        console.error('Failed to persist task reorder:', err);
        announce('Failed to save task order');
      }
    },
    [dispatch, announce, userId]
  );

  // Show unauthenticated state if no user and not loading auth
  if (!authLoading && !user) {
    return <UnauthenticatedState />;
  }

  // Show error state
  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  // Show loading state
  const isLoading = loading || authLoading;

  // Common props for both list types
  const listProps = {
    tasks: visibleTasks,
    categoriesMap,
    onTaskClick: handleTaskClick,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
    onForwardSelect: handleForwardSelect,
    updatingTaskId,
    testId,
  };

  return (
    <>
      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {isLoading ? (
        <FlatTaskList {...listProps} loading={true} />
      ) : enableDragAndDrop ? (
        <DraggableFlatTaskList {...listProps} onReorder={handleReorder} />
      ) : (
        <FlatTaskList {...listProps} />
      )}

      {/* Forward Date Modal */}
      <ForwardDateModal
        isOpen={forwardingTask !== null}
        onClose={handleForwardClose}
        onConfirm={handleForwardConfirm}
        currentDate={forwardingTask?.scheduledDate}
        isSubmitting={updatingTaskId === forwardingTask?.id}
        testId="forward-date-modal"
      />

      {/* Recurring Delete Dialog */}
      {deletingTask && (
        <RecurringDeleteDialog
          isOpen={showDeleteDialog}
          onClose={handleDeleteDialogClose}
          onDeleteThisOnly={handleDeleteThisOnly}
          onDeleteAllFuture={handleDeleteAllFuture}
          task={deletingTask}
          testId="recurring-delete-dialog"
        />
      )}
    </>
  );
}

export default FlatTaskListContainer;
