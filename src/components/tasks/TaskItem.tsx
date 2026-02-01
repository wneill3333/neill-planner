/**
 * TaskItem Component
 *
 * Displays a single task with priority label, status symbol, title,
 * category color, and recurrence indicator.
 *
 * This component is memoized to prevent unnecessary re-renders when
 * parent components update but this task's data hasn't changed.
 */

import { memo, useCallback } from 'react';
import type { Task, Category } from '../../types';
import {
  formatPriorityLabel,
  getStatusSymbol,
  getStatusColor,
  isTaskComplete,
  isTaskRecurring,
  getPriorityColorClasses,
} from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskItemProps {
  /** The task to display */
  task: Task;
  /** Optional category for the task (for color display) */
  category?: Category | null;
  /** Callback when the task is clicked */
  onClick?: (task: Task) => void;
  /** Callback when the status symbol is clicked */
  onStatusClick?: (task: Task) => void;
  /** Whether to show the category color indicator */
  showCategoryColor?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskItem - Displays a single task row
 *
 * Memoized to prevent unnecessary re-renders when parent updates
 * but this task hasn't changed. Uses custom comparison to check
 * only the relevant task properties.
 *
 * @param props - TaskItemProps
 * @returns JSX element representing a task row
 */
function TaskItemComponent({
  task,
  category,
  onClick,
  onStatusClick,
  showCategoryColor = true,
  testId,
}: TaskItemProps) {
  const isComplete = isTaskComplete(task);
  const isRecurring = isTaskRecurring(task);
  const priorityLabel = formatPriorityLabel(task);
  const statusSymbol = getStatusSymbol(task.status);
  const statusColor = getStatusColor(task.status);
  const priorityClasses = getPriorityColorClasses(task.priority.letter);

  // Memoized click handler to prevent creating new function on each render
  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  // Memoized status click handler with event propagation prevention
  const handleStatusClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the task click
      onStatusClick?.(task);
    },
    [onStatusClick, task]
  );

  // Memoized keyboard handler for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(task);
      }
    },
    [onClick, task]
  );

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        hover:bg-gray-50 cursor-pointer
        transition-colors duration-150
        ${isComplete ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}, Priority ${priorityLabel}, Status ${task.status}`}
      data-testid={testId || `task-item-${task.id}`}
    >
      {/* Category Color Indicator */}
      {showCategoryColor && (
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: category?.color || '#E5E7EB' }}
          aria-hidden="true"
          data-testid="category-color"
        />
      )}

      {/* Priority Label */}
      <span
        className={`
          font-mono font-semibold text-sm w-8 flex-shrink-0
          ${priorityClasses.text}
        `}
        data-testid="priority-label"
      >
        {priorityLabel}
      </span>

      {/* Status Symbol */}
      <button
        type="button"
        className={`
          w-6 h-6 flex items-center justify-center
          rounded-full text-lg flex-shrink-0
          hover:bg-gray-200 transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
        `}
        style={{ color: statusColor }}
        onClick={handleStatusClick}
        aria-label={`Status: ${task.status}. Click to change.`}
        data-testid="status-symbol"
      >
        {statusSymbol}
      </button>

      {/* Task Title */}
      <span
        className={`
          flex-1 text-gray-800 truncate
          ${isComplete ? 'line-through text-gray-500' : ''}
        `}
        data-testid="task-title"
      >
        {task.title}
      </span>

      {/* Recurrence Indicator */}
      {isRecurring && (
        <span
          className="text-gray-400 flex-shrink-0"
          title="Recurring task"
          aria-label="This is a recurring task"
          data-testid="recurrence-icon"
        >
          ↻
        </span>
      )}
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 *
 * Only re-renders when task data that affects display has changed,
 * ignoring changes to callback function references.
 */
function arePropsEqual(prevProps: TaskItemProps, nextProps: TaskItemProps): boolean {
  // Compare task properties that affect rendering
  const taskEqual =
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority.letter === nextProps.task.priority.letter &&
    prevProps.task.priority.number === nextProps.task.priority.number &&
    prevProps.task.recurrence === nextProps.task.recurrence;

  // Compare category (if present)
  const categoryEqual =
    prevProps.category?.id === nextProps.category?.id &&
    prevProps.category?.color === nextProps.category?.color;

  // Compare display options
  const optionsEqual = prevProps.showCategoryColor === nextProps.showCategoryColor;

  return taskEqual && categoryEqual && optionsEqual;
}

// Export memoized component
export const TaskItem = memo(TaskItemComponent, arePropsEqual);

export default TaskItem;
