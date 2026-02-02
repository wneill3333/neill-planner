/**
 * TaskListContainer Component
 *
 * Container component that connects TaskList to Redux store.
 * Handles fetching tasks, loading states, and task interactions.
 */

import { useCallback, useState } from 'react';
import { useAuth } from '../auth';
import { useSelectedDateTasks } from './hooks';
import { useAppDispatch } from '../../store/hooks';
import { useAnnouncement } from '../../hooks';
import { updateTaskAsync } from './taskThunks';
import { reorderTasksLocal } from './taskSlice';
import { TaskList, DraggableTaskList } from '../../components/tasks';
import type { Task, PriorityLetter } from '../../types';
import { getNextStatus, getPreviousStatus, getStatusLabel } from '../../utils/statusUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskListContainerProps {
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Whether to show category colors */
  showCategoryColors?: boolean;
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
  showCategoryColors = true,
  testId,
}: TaskListContainerProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  // Track which task is being updated for UI feedback (e.g., loading spinners)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  // Announcement hook for screen readers
  const { announcement, announce, politeness } = useAnnouncement();

  const {
    tasks,
    categoriesMap,
    loading,
    error,
    refetch,
  } = useSelectedDateTasks(userId);

  // Common handler for status change
  const handleStatusChange = useCallback(
    async (task: Task, newStatus: ReturnType<typeof getNextStatus>) => {
      const statusLabel = getStatusLabel(newStatus);

      setUpdatingTaskId(task.id);
      announce(`Updating task status to ${statusLabel}`);

      try {
        await dispatch(updateTaskAsync({ id: task.id, status: newStatus })).unwrap();
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
    [dispatch, announce]
  );

  // Handle status click - cycle to next status
  const handleStatusClick = useCallback(
    (task: Task) => {
      const nextStatus = getNextStatus(task.status);
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
    (taskIds: string[], priorityLetter: PriorityLetter) => {
      // Optimistic local update - immediately reorder in UI
      dispatch(reorderTasksLocal({ taskIds, priorityLetter }));
      announce(`Tasks reordered in priority ${priorityLetter}`);

      // Note: Persistence will be added in Step 3.6.2
      // For now, the local state update provides immediate feedback
    },
    [dispatch, announce]
  );

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

      {isLoading ? (
        // Use non-draggable TaskList for loading state
        <TaskList
          tasks={tasks}
          categoriesMap={categoriesMap}
          onTaskClick={handleTaskClick}
          onStatusClick={handleStatusClick}
          onStatusCycleBackward={handleStatusCycleBackward}
          showCategoryColors={showCategoryColors}
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
          showCategoryColors={showCategoryColors}
          updatingTaskId={updatingTaskId}
          testId={testId}
        />
      )}
    </>
  );
}

export default TaskListContainer;
