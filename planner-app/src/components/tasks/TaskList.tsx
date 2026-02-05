/**
 * TaskList Component
 *
 * Displays a list of tasks grouped by priority letter (A, B, C, D).
 * Shows an empty state when no tasks are available.
 */

import { useMemo } from 'react';
import type { Task, Category, PriorityLetter } from '../../types';
import { TaskPriorityGroup } from './TaskPriorityGroup';
import { groupTasksByPriority, getNonEmptyPriorityGroups } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskListProps {
  /** Tasks to display */
  tasks: Task[];
  /** Map of categories by ID for displaying category colors on priority labels */
  categoriesMap?: Record<string, Category>;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when a task's status symbol is clicked (cycles forward) */
  onStatusClick?: (task: Task) => void;
  /** Callback when a task's status cycles backward (via arrow keys) */
  onStatusCycleBackward?: (task: Task) => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** ID of task currently being updated */
  updatingTaskId?: string | null;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Empty State Component
// =============================================================================

interface EmptyStateProps {
  message?: string;
}

function EmptyState({ message = 'No tasks for this day' }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12 text-gray-500"
      data-testid="empty-state"
      role="status"
      aria-label="No tasks available"
    >
      <svg
        className="w-12 h-12 mb-4 text-gray-300 sm:w-16 sm:h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
      <p className="text-base font-medium sm:text-lg">{message}</p>
      <p className="mt-1 text-sm text-gray-400">
        Click the + button to add a new task
      </p>
    </div>
  );
}

// =============================================================================
// Loading State Component
// =============================================================================

function LoadingState() {
  return (
    <div
      className="space-y-4"
      data-testid="loading-state"
      role="status"
      aria-live="polite"
      aria-label="Loading tasks"
    >
      <span className="sr-only">Loading tasks...</span>
      {/* Skeleton for priority groups */}
      {[1, 2].map((groupIndex) => (
        <div key={groupIndex} className="rounded-lg border border-gray-200">
          {/* Skeleton header */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg border-l-4 border-gray-300 bg-gray-100 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gray-300" />
            <div className="h-4 w-32 rounded bg-gray-300" />
            <div className="h-3 w-16 rounded bg-gray-300" />
          </div>
          {/* Skeleton tasks */}
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((taskIndex) => (
              <div key={taskIndex} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="w-1 h-8 rounded-full bg-gray-200" />
                <div className="w-8 h-4 rounded bg-gray-300" />
                <div className="w-6 h-6 rounded-full bg-gray-300" />
                <div className="flex-1 h-4 rounded bg-gray-300" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskList - Displays tasks grouped by priority
 */
export function TaskList({
  tasks,
  categoriesMap = {},
  onTaskClick,
  onStatusClick,
  onStatusCycleBackward,
  emptyMessage,
  emptyComponent,
  loading = false,
  updatingTaskId = null,
  testId,
}: TaskListProps) {
  // Memoize grouped tasks - must be called before any early returns (rules of hooks)
  const groupedTasks = useMemo(() => groupTasksByPriority(tasks), [tasks]);
  const nonEmptyGroups = useMemo(() => getNonEmptyPriorityGroups(groupedTasks), [groupedTasks]);

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show empty state if no tasks
  if (tasks.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div
      className="space-y-2"
      data-testid={testId || 'task-list'}
      role="region"
      aria-label="Task list grouped by priority"
    >
      {nonEmptyGroups.map((priorityLetter: PriorityLetter) => (
        <TaskPriorityGroup
          key={priorityLetter}
          priorityLetter={priorityLetter}
          tasks={groupedTasks[priorityLetter]}
          categoriesMap={categoriesMap}
          onTaskClick={onTaskClick}
          onStatusClick={onStatusClick}
          onStatusCycleBackward={onStatusCycleBackward}
          updatingTaskId={updatingTaskId}
        />
      ))}
    </div>
  );
}

export default TaskList;
