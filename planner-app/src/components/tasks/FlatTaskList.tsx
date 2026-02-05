/**
 * FlatTaskList Component
 *
 * Displays a flat list of tasks without priority group headers.
 * Tasks are sorted by priority (A1, A2, B1, B2, etc.).
 * Uses the new TaskItemRedesign component.
 */

import type { Task, Category } from '../../types';
import { TaskItemRedesign } from './TaskItemRedesign';

// =============================================================================
// Types
// =============================================================================

export interface FlatTaskListProps {
  /** Tasks to display (should be pre-sorted by priority) */
  tasks: Task[];
  /** Map of categories by ID for displaying category colors */
  categoriesMap?: Record<string, Category>;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when edit button is clicked */
  onEdit?: (task: Task) => void;
  /** Callback when delete button is clicked */
  onDelete?: (task: Task) => void;
  /** Callback when status is changed */
  onStatusChange?: (task: Task, newStatus: Task['status']) => void;
  /** Callback when forward status is selected */
  onForwardSelect?: (task: Task) => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** ID of task currently being updated */
  updatingTaskId?: string | null;
  /** Whether to show drag handles */
  showDragHandles?: boolean;
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
      <p className="mt-1 text-sm text-gray-400">Click the + button to add a new task</p>
    </div>
  );
}

// =============================================================================
// Loading State Component
// =============================================================================

function LoadingState() {
  return (
    <div
      className="space-y-3"
      data-testid="loading-state"
      role="status"
      aria-live="polite"
      aria-label="Loading tasks"
    >
      <span className="sr-only">Loading tasks...</span>
      {[1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-100 border-l-4 border-orange-500 animate-pulse"
        >
          {/* Drag handle skeleton */}
          <div className="w-5 h-5 rounded bg-gray-300" />
          {/* Status dropdown skeleton */}
          <div className="w-10 h-7 rounded bg-gray-300" />
          {/* Priority skeleton */}
          <div className="w-8 h-5 rounded bg-gray-300" />
          {/* Separator */}
          <div className="w-2 h-4 rounded bg-gray-200" />
          {/* Title skeleton */}
          <div className="flex-1 h-4 rounded bg-gray-300" />
          {/* Edit button skeleton */}
          <div className="w-7 h-7 rounded bg-gray-200" />
          {/* Delete button skeleton */}
          <div className="w-7 h-7 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * FlatTaskList - Flat task list without priority headers
 *
 * Displays tasks in a single flat list sorted by priority.
 * Uses the new TaskItemRedesign component with cream background
 * and orange left border styling.
 */
export function FlatTaskList({
  tasks,
  categoriesMap = {},
  onTaskClick,
  onEdit,
  onDelete,
  onStatusChange,
  onForwardSelect,
  emptyMessage,
  emptyComponent,
  loading = false,
  updatingTaskId = null,
  showDragHandles = true,
  testId,
}: FlatTaskListProps) {
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
      data-testid={testId || 'flat-task-list'}
      role="region"
      aria-label="Task list"
    >
      {tasks.map((task) => (
        <TaskItemRedesign
          key={task.id}
          task={task}
          category={task.categoryId ? categoriesMap[task.categoryId] : null}
          onClick={onTaskClick}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onForwardSelect={onForwardSelect}
          showDragHandle={showDragHandles}
          isUpdating={task.id === updatingTaskId}
          testId={`task-item-${task.id}`}
        />
      ))}
    </div>
  );
}

export default FlatTaskList;
