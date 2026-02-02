/**
 * TaskItem Component
 *
 * Displays a single task with priority label, status symbol, title,
 * category color, and recurrence indicator.
 *
 * This component is memoized to prevent unnecessary re-renders when
 * parent components update but this task's data hasn't changed.
 */

import { memo } from 'react';
import type { Task, Category } from '../../types';
import {
  formatPriorityLabel,
  isTaskComplete,
  isTaskRecurring,
  getPriorityColorClasses,
} from '../../utils/taskUtils';
import { getStatusLabel } from '../../utils/statusUtils';
import { StatusSymbol } from './StatusSymbol';

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
  /** Callback when the status symbol is clicked (cycles forward) */
  onStatusClick?: (task: Task) => void;
  /** Callback when the status symbol cycles backward (via arrow keys) */
  onStatusCycleBackward?: (task: Task) => void;
  /** Whether to show the category color indicator */
  showCategoryColor?: boolean;
  /** Whether the task is currently being updated */
  isUpdating?: boolean;
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
  onStatusCycleBackward,
  showCategoryColor = true,
  isUpdating = false,
  testId,
}: TaskItemProps) {
  const isComplete = isTaskComplete(task);
  const isRecurring = isTaskRecurring(task);
  const priorityLabel = formatPriorityLabel(task);
  const priorityClasses = getPriorityColorClasses(task.priority.letter);

  // Simple inline handlers - no need for useCallback since task changes frequently
  const handleClick = () => onClick?.(task);
  const handleStatusClick = () => onStatusClick?.(task);
  const handleStatusCycleBackward = () => onStatusCycleBackward?.(task);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(task);
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
        transition-colors duration-150
        hover:bg-gray-50
        ${isComplete ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}. Priority ${priorityLabel}. Status: ${getStatusLabel(task.status)}${category ? `. Category: ${category.name}` : ''}${isRecurring ? '. Recurring task' : ''}${isComplete ? '. Completed' : ''}. Press Enter to edit or Tab to change status.`}
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
      <StatusSymbol
        status={task.status}
        onClick={handleStatusClick}
        onCycleBackward={handleStatusCycleBackward}
        isUpdating={isUpdating}
        showTooltip={true}
        testId="status-symbol"
      />

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
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.updatedAt.getTime() === nextProps.task.updatedAt.getTime() &&
    prevProps.category?.id === nextProps.category?.id &&
    prevProps.category?.color === nextProps.category?.color &&
    prevProps.showCategoryColor === nextProps.showCategoryColor &&
    prevProps.isUpdating === nextProps.isUpdating
  );
}

// Export memoized component
export const TaskItem = memo(TaskItemComponent, arePropsEqual);

export default TaskItem;
