/**
 * TaskList Component
 *
 * Displays a list of tasks grouped by priority letter (A, B, C, D).
 * Shows an empty state when no tasks are available.
 */

import type { Task, Category, PriorityLetter } from '../../types';
import { TaskPriorityGroup } from './TaskPriorityGroup';
import { groupTasksByPriority, getNonEmptyPriorityGroups } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskListProps {
  /** Tasks to display */
  tasks: Task[];
  /** Map of categories by ID for displaying category colors */
  categoriesMap?: Record<string, Category>;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when a task's status symbol is clicked */
  onStatusClick?: (task: Task) => void;
  /** Whether to show category color indicators */
  showCategoryColors?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
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
      className="flex flex-col items-center justify-center py-12 text-gray-500"
      data-testid="empty-state"
    >
      <svg
        className="w-16 h-16 mb-4 text-gray-300"
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
      <p className="text-lg font-medium">{message}</p>
      <p className="text-sm text-gray-400 mt-1">
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
      className="flex flex-col items-center justify-center py-12"
      data-testid="loading-state"
    >
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-gray-500">Loading tasks...</p>
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
  showCategoryColors = true,
  emptyMessage,
  emptyComponent,
  loading = false,
  testId,
}: TaskListProps) {
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

  // Group tasks by priority
  const groupedTasks = groupTasksByPriority(tasks);
  const nonEmptyGroups = getNonEmptyPriorityGroups(groupedTasks);

  return (
    <div
      className="space-y-2"
      data-testid={testId || 'task-list'}
    >
      {nonEmptyGroups.map((priorityLetter: PriorityLetter) => (
        <TaskPriorityGroup
          key={priorityLetter}
          priorityLetter={priorityLetter}
          tasks={groupedTasks[priorityLetter]}
          categoriesMap={categoriesMap}
          onTaskClick={onTaskClick}
          onStatusClick={onStatusClick}
          showCategoryColors={showCategoryColors}
        />
      ))}
    </div>
  );
}

export default TaskList;
