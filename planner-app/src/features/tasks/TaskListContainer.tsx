/**
 * TaskListContainer Component
 *
 * Container component that connects TaskList to Redux store.
 * Handles fetching tasks, loading states, and task interactions.
 */

import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '../auth';
import { useSelectedDateTasks } from './hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAnnouncement } from '../../hooks';
import { updateTaskAsync, reorderTasksAsync, deleteRecurringInstanceOnly, deleteRecurringFuture, updateRecurringInstanceStatus } from './taskThunks';
import { reorderTasksLocal, selectFilteredTasks } from './taskSlice';
import { selectIsFiltersActive } from '../../features/filters/filterSlice';
import { TaskList, DraggableTaskList } from '../../components/tasks';
import { RecurringDeleteDialog } from '../../components/tasks/RecurringDeleteDialog';
import { FilterControlsContainer } from '../../components/tasks/FilterControlsContainer';
import type { Task, PriorityLetter } from '../../types';
import { getNextStatus, getPreviousStatus, getStatusLabel } from '../../utils/statusUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskListContainerProps {
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
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
 * TaskListContainer - Connects TaskList to Redux store
 */
export function TaskListContainer({
  onTaskClick,
  testId,
}: TaskListContainerProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  // Track which task is being updated for UI feedback (e.g., loading spinners)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  // Announcement hook for screen readers
  const { announcement, announce, politeness } = useAnnouncement();
  // Recurring delete dialog state
  const [showRecurringDeleteDialog, setShowRecurringDeleteDialog] = useState(false);
  const [recurringDeleteTask, setRecurringDeleteTask] = useState<Task | null>(null);

  const {
    tasks: allTasks,
    categoriesMap,
    loading,
    error,
    refetch,
    selectedDate,
  } = useSelectedDateTasks(userId);

  // Check if filters are active
  const isFiltersActive = useAppSelector(selectIsFiltersActive);

  // Use filtered tasks selector when filters are active
  const filteredTasks = useAppSelector((state) =>
    selectFilteredTasks(state, selectedDate)
  );

  // Determine which tasks to display
  const tasks = useMemo(() => {
    return isFiltersActive ? filteredTasks : allTasks;
  }, [isFiltersActive, filteredTasks, allTasks]);

  // Calculate filtered task count for display
  const totalTaskCount = allTasks.length;
  const filteredTaskCount = tasks.length;

  // Common handler for status change
  const handleStatusChange = useCallback(
    async (task: Task, newStatus: ReturnType<typeof getNextStatus>) => {
      const statusLabel = getStatusLabel(newStatus);

      setUpdatingTaskId(task.id);
      announce(`Updating task status to ${statusLabel}`);

      try {
        // For recurring instances OR recurring parent tasks, use the special thunk
        // that handles instance modifications
        const isRecurringInstance = task.isRecurringInstance && task.recurringParentId;
        const isRecurringParent = !task.isRecurringInstance && task.recurrence !== null;

        if (isRecurringInstance || isRecurringParent) {
          await dispatch(updateRecurringInstanceStatus({
            userId: userId!,
            task,
            newStatus,
          })).unwrap();
        } else {
          // Regular non-recurring task - update normally
          await dispatch(updateTaskAsync({ id: task.id, status: newStatus, userId: userId! })).unwrap();
        }
        announce(`Task status updated to ${statusLabel}`);
      } catch (err) {
        console.error('Failed to update task status:', err);

        // Provide specific error messages based on error type
        let errorMessage = 'Failed to update task status';

        if (err instanceof Error) {
          if (err.message.includes('permission')) {
            errorMessage = 'You do not have permission to update this task';
          } else if (err.message.includes('network') || err.message.includes('offline')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (err.message.includes('not found')) {
            errorMessage = 'Task not found. It may have been deleted.';
          }
        }

        announce(errorMessage);
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [dispatch, announce, userId]
  );

  // Handle status click - cycle to next status
  const handleStatusClick = useCallback(
    (task: Task) => {
      const nextStatus = getNextStatus(task.status);

      // Intercept delete status for any recurring task (instance OR parent)
      const isRecurring = task.isRecurringInstance || task.recurrence !== null;
      if (nextStatus === 'delete' && isRecurring) {
        setRecurringDeleteTask(task);
        setShowRecurringDeleteDialog(true);
        return;
      }

      handleStatusChange(task, nextStatus);
    },
    [handleStatusChange]
  );

  // Handle status cycle backward - cycle to previous status
  const handleStatusCycleBackward = useCallback(
    (task: Task) => {
      const prevStatus = getPreviousStatus(task.status);
      handleStatusChange(task, prevStatus);
    },
    [handleStatusChange]
  );

  // Handle task click
  const handleTaskClick = useCallback(
    (task: Task) => {
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  // Handle task reordering within a priority group
  const handleReorder = useCallback(
    async (taskIds: string[], priorityLetter: PriorityLetter) => {
      if (!userId) {
        console.error('Cannot reorder tasks: user not authenticated');
        announce('Failed to reorder tasks: not authenticated');
        return;
      }

      // Optimistic local update - immediately reorder in UI
      dispatch(reorderTasksLocal({ taskIds, priorityLetter }));
      announce(`Tasks reordered in priority ${priorityLetter}`);

      // Persist to Firestore
      try {
        await dispatch(reorderTasksAsync({ taskIds, priorityLetter, userId })).unwrap();
        // Success - optimistic update is confirmed
      } catch (err) {
        console.error('Failed to persist task reorder:', err);

        // Provide specific error messages
        let errorMessage = 'Failed to save task order';

        if (err instanceof Error) {
          if (err.message.includes('permission') || err.message.includes('Unauthorized')) {
            errorMessage = 'You do not have permission to reorder these tasks';
          } else if (err.message.includes('network') || err.message.includes('offline')) {
            errorMessage = 'Network error. Changes may not be saved.';
          } else if (err.message.includes('not found')) {
            errorMessage = 'Task not found. It may have been deleted.';
          }
        }

        announce(errorMessage);
        // Note: Optimistic update remains in place
        // A future enhancement could revert to server state on error
      }
    },
    [dispatch, announce, userId]
  );

  // Handle recurring delete dialog close
  const handleRecurringDeleteClose = useCallback(() => {
    setShowRecurringDeleteDialog(false);
    setRecurringDeleteTask(null);
  }, []);

  // Handle delete this occurrence only
  const handleDeleteThisOnly = useCallback(async () => {
    if (!userId || !recurringDeleteTask || !selectedDate) {
      announce('Failed to delete task: not authenticated or task not found');
      return;
    }

    // Determine parent task ID:
    // - For recurring instances: use recurringParentId
    // - For recurring parent tasks: use the task's own id
    const isParentTask = recurringDeleteTask.recurrence !== null && !recurringDeleteTask.isRecurringInstance;
    const parentTaskId = isParentTask ? recurringDeleteTask.id : recurringDeleteTask.recurringParentId;

    if (!parentTaskId) {
      console.error('Cannot delete recurring instance: missing parent task ID');
      announce('Failed to delete task: invalid recurring task');
      setRecurringDeleteTask(null);
      return;
    }

    // Use selectedDate from UI to avoid timezone issues
    // Parse the date string (YYYY-MM-DD) to create a local date at midnight
    const [year, month, day] = selectedDate.split('-').map(Number);
    const instanceDate = new Date(year, month - 1, day); // month is 0-indexed

    setShowRecurringDeleteDialog(false);
    announce('Deleting this occurrence only');

    console.log('Deleting recurring instance:', { parentTaskId, instanceDate, selectedDate, isParentTask });

    try {
      const result = await dispatch(
        deleteRecurringInstanceOnly({
          userId,
          parentTaskId,
          instanceDate,
        })
      ).unwrap();
      console.log('Delete result:', result);
      console.log('Updated exceptions:', result.recurrence?.exceptions);
      announce('Task occurrence deleted');
    } catch (err) {
      console.error('Failed to delete recurring instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task occurrence';
      announce(errorMessage);
    } finally {
      setRecurringDeleteTask(null);
    }
  }, [dispatch, announce, userId, recurringDeleteTask, selectedDate]);

  // Handle delete all future occurrences
  const handleDeleteAllFuture = useCallback(async () => {
    if (!userId || !recurringDeleteTask || !selectedDate) {
      announce('Failed to delete tasks: not authenticated or task not found');
      return;
    }

    // Determine parent task ID:
    // - For recurring instances: use recurringParentId
    // - For recurring parent tasks: use the task's own id
    const isParentTask = recurringDeleteTask.recurrence !== null && !recurringDeleteTask.isRecurringInstance;
    const parentTaskId = isParentTask ? recurringDeleteTask.id : recurringDeleteTask.recurringParentId;

    if (!parentTaskId) {
      console.error('Cannot delete recurring instances: missing parent task ID');
      announce('Failed to delete tasks: invalid recurring task');
      setRecurringDeleteTask(null);
      return;
    }

    // Use selectedDate from UI to avoid timezone issues
    // Parse the date string (YYYY-MM-DD) to create a local date at midnight
    const [year, month, day] = selectedDate.split('-').map(Number);
    const instanceDate = new Date(year, month - 1, day); // month is 0-indexed

    setShowRecurringDeleteDialog(false);
    announce('Deleting all future occurrences');

    try {
      await dispatch(
        deleteRecurringFuture({
          userId,
          parentTaskId,
          instanceDate,
        })
      ).unwrap();
      announce('Future task occurrences deleted');
    } catch (err) {
      console.error('Failed to delete future recurring instances:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete future task occurrences';
      announce(errorMessage);
    } finally {
      setRecurringDeleteTask(null);
    }
  }, [dispatch, announce, userId, recurringDeleteTask, selectedDate]);

  // Show unauthenticated state if no user and not loading auth
  if (!authLoading && !user) {
    return <UnauthenticatedState />;
  }

  // Show error state
  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  // Show loading state with non-draggable TaskList
  const isLoading = loading || authLoading;

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

      {/* Recurring Delete Dialog */}
      {recurringDeleteTask && (
        <RecurringDeleteDialog
          isOpen={showRecurringDeleteDialog}
          onClose={handleRecurringDeleteClose}
          onDeleteThisOnly={handleDeleteThisOnly}
          onDeleteAllFuture={handleDeleteAllFuture}
          task={recurringDeleteTask}
          testId={testId ? `${testId}-recurring-delete-dialog` : undefined}
        />
      )}

      {/* Filter Controls */}
      <FilterControlsContainer testId={testId ? `${testId}-filters` : undefined} />

      {/* Filtered Task Count Message */}
      {isFiltersActive && totalTaskCount > 0 && (
        <div
          className="mb-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800"
          role="status"
          aria-live="polite"
          data-testid={testId ? `${testId}-filter-message` : 'filter-message'}
        >
          Showing {filteredTaskCount} of {totalTaskCount} task{totalTaskCount === 1 ? '' : 's'}
        </div>
      )}

      {isLoading ? (
        // Use non-draggable TaskList for loading state
        <TaskList
          tasks={tasks}
          categoriesMap={categoriesMap}
          onTaskClick={handleTaskClick}
          onStatusClick={handleStatusClick}
          onStatusCycleBackward={handleStatusCycleBackward}
          loading={true}
          updatingTaskId={updatingTaskId}
          testId={testId}
        />
      ) : (
        // Use DraggableTaskList when loaded
        <DraggableTaskList
          tasks={tasks}
          categoriesMap={categoriesMap}
          onTaskClick={handleTaskClick}
          onStatusClick={handleStatusClick}
          onStatusCycleBackward={handleStatusCycleBackward}
          onReorder={handleReorder}
          updatingTaskId={updatingTaskId}
          testId={testId}
        />
      )}
    </>
  );
}

export default TaskListContainer;
