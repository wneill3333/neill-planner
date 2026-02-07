/**
 * TaskItem Component
 *
 * Displays a single task with status symbol, priority label (with category color),
 * and title.
 *
 * Layout: ● A1 Buy Groceries
 *         Status | Priority | Title
 *
 * The priority box background uses the category color for visual grouping.
 *
 * This component is memoized to prevent unnecessary re-renders when
 * parent components update but this task's data hasn't changed.
 */

import { memo } from 'react';
import type { Task, Category } from '../../types';
import { NONE_CATEGORY } from '../../types';
import {
  formatPriorityLabel,
  isTaskComplete,
  isTaskRecurring,
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
  /** Whether the task is currently being updated */
  isUpdating?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get contrasting text color (black or white) based on background color
 */
function getContrastingTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskItem - Displays a single task row
 *
 * Layout: Status Symbol | Priority (colored by category) | Task Title
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
  isUpdating = false,
  testId,
}: TaskItemProps) {
  const isComplete = isTaskComplete(task);
  const isForwarded = task.status === 'forward';
  const isCancelled = task.status === 'cancelled';
  const isDimmed = isComplete || isForwarded || isCancelled;
  const isRecurring = isTaskRecurring(task);
  const priorityLabel = formatPriorityLabel(task);

  // Get category color or default uncategorized gray
  const categoryColor = category?.color || NONE_CATEGORY.color;
  const textColor = getContrastingTextColor(categoryColor);

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
        ${isDimmed ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}. Priority ${priorityLabel}. Status: ${getStatusLabel(task.status)}${category ? `. Category: ${category.name}` : ''}${isRecurring ? '. Recurring task' : ''}${isComplete ? '. Completed' : ''}. Press Enter to edit or Tab to change status.`}
      data-testid={testId || `task-item-${task.id}`}
    >
      {/* Status Symbol */}
      <StatusSymbol
        status={task.status}
        onClick={handleStatusClick}
        onCycleBackward={handleStatusCycleBackward}
        isUpdating={isUpdating}
        showTooltip={true}
        testId="status-symbol"
      />

      {/* Priority Label with Category Color Background */}
      <span
        className={`
          font-mono font-semibold text-sm px-2 py-0.5 rounded flex-shrink-0 min-w-[2.5rem] text-center
        `}
        style={{
          backgroundColor: categoryColor,
          color: textColor,
        }}
        data-testid="priority-label"
      >
        {priorityLabel}
      </span>

      {/* Task Title */}
      <span
        className={`
          flex-1 text-gray-800 truncate
          ${isDimmed ? 'line-through text-gray-500' : ''}
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
    prevProps.isUpdating === nextProps.isUpdating
  );
}

// Export memoized component
export const TaskItem = memo(TaskItemComponent, arePropsEqual);

export default TaskItem;
