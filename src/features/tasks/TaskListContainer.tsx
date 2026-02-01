/**
 * TaskListContainer Component
 *
 * Container component that connects TaskList to Redux store.
 * Handles fetching tasks, loading states, and task interactions.
 */

import { useCallback } from 'react';
import { useAuth } from '../auth';
import { useSelectedDateTasks } from './hooks';
import { useAppDispatch } from '../../store/hooks';
import { updateTaskAsync } from './taskThunks';
import { TaskList } from '../../components/tasks';
import type { Task, TaskStatus } from '../../types';
import { getNextStatus } from '../../utils/statusUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskListContainerProps {
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Whether to show category colors */
  showCategoryColors?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
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
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="error-state"
    >
      <svg
        className="w-16 h-16 mb-4 text-red-400"
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
      <p className="text-lg font-medium text-gray-700 mb-2">Something went wrong</p>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
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
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="unauthenticated-state"
    >
      <svg
        className="w-16 h-16 mb-4 text-gray-400"
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
      <p className="text-lg font-medium text-gray-700">Please sign in</p>
      <p className="text-sm text-gray-500 mt-1">Sign in to view your tasks</p>
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
  emptyMessage,
  emptyComponent,
  testId,
}: TaskListContainerProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const {
    tasks,
    categoriesMap,
    loading,
    error,
    refetch,
  } = useSelectedDateTasks(userId);

  // Handle status click - cycle to next status
  const handleStatusClick = useCallback(
    async (task: Task) => {
      const nextStatus = getNextStatus(task.status);
      try {
        await dispatch(updateTaskAsync({ id: task.id, status: nextStatus }));
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    },
    [dispatch]
  );

  // Handle task click
  const handleTaskClick = useCallback(
    (task: Task) => {
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  // Show unauthenticated state if no user and not loading auth
  if (!authLoading && !user) {
    return <UnauthenticatedState />;
  }

  // Show error state
  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <TaskList
      tasks={tasks}
      categoriesMap={categoriesMap}
      onTaskClick={handleTaskClick}
      onStatusClick={handleStatusClick}
      showCategoryColors={showCategoryColors}
      emptyMessage={emptyMessage}
      emptyComponent={emptyComponent}
      loading={loading || authLoading}
      testId={testId}
    />
  );
}

export default TaskListContainer;
