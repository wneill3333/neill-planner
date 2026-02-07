/**
 * TaskItemRedesign Component
 *
 * New task item design with:
 * - Drag handle on the left
 * - Status dropdown for status selection
 * - Priority label
 * - Task title with dash separator
 * - Edit and Delete buttons on the right
 *
 * Layout: [DragHandle] [StatusDropdown] [Priority] - [Title] [Edit] [Delete]
 *
 * Styling: Cream background (amber-100) with orange left border
 */

import { memo, useCallback } from 'react';
import type { Task, Category } from '../../types';
import {
  formatPriorityLabel,
  isTaskComplete,
  isTaskRecurring,
} from '../../utils/taskUtils';
import { StatusDropdown } from './StatusDropdown';

// =============================================================================
// Types
// =============================================================================

export interface TaskItemRedesignProps {
  /** The task to display */
  task: Task;
  /** Optional category for the task (for color display) */
  category?: Category | null;
  /** Callback when the task is clicked (opens edit modal) */
  onClick?: (task: Task) => void;
  /** Callback when edit button is clicked */
  onEdit?: (task: Task) => void;
  /** Callback when delete button is clicked */
  onDelete?: (task: Task) => void;
  /** Callback when status is changed */
  onStatusChange?: (task: Task, newStatus: Task['status']) => void;
  /** Callback when forward status is selected (triggers date picker) */
  onForwardSelect?: (task: Task) => void;
  /** Whether to show the drag handle */
  showDragHandle?: boolean;
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
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskItemRedesign - New task row design
 *
 * Memoized to prevent unnecessary re-renders.
 */
function TaskItemRedesignComponent({
  task,
  category,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  onForwardSelect,
  showDragHandle = true,
  isUpdating = false,
  testId,
}: TaskItemRedesignProps) {
  const isComplete = isTaskComplete(task);
  const isForwarded = task.status === 'forward';
  const isCancelled = task.status === 'cancelled';
  const isDimmed = isComplete || isForwarded || isCancelled;
  const isRecurring = isTaskRecurring(task);
  const priorityLabel = formatPriorityLabel(task);

  // Get category color or default gray
  const categoryColor = category?.color || '#E5E7EB';
  const textColor = getContrastingTextColor(categoryColor);

  // Handle row click - opens edit modal
  const handleRowClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  // Handle edit button click
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  }, [onEdit, task]);

  // Handle delete button click
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(task);
  }, [onDelete, task]);

  // Handle status change
  const handleStatusChange = useCallback((newStatus: Task['status']) => {
    onStatusChange?.(task, newStatus);
  }, [onStatusChange, task]);

  // Handle forward select
  const handleForwardSelect = useCallback(() => {
    onForwardSelect?.(task);
  }, [onForwardSelect, task]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(task);
    }
  }, [onClick, task]);

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2.5 rounded-lg
        bg-amber-100 border-l-4 border-orange-500
        cursor-pointer
        transition-all duration-150
        hover:bg-amber-200 hover:shadow-sm
        ${isDimmed ? 'opacity-60' : ''}
      `}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}. Priority ${priorityLabel}. ${isRecurring ? 'Recurring task. ' : ''}${isComplete ? 'Completed. ' : ''}Press Enter to edit.`}
      data-testid={testId || `task-item-redesign-${task.id}`}
    >
      {/* Drag Handle */}
      {showDragHandle && (
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          aria-label="Drag to reorder"
          data-testid="drag-handle"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      )}

      {/* Status Dropdown */}
      <div onClick={(e) => e.stopPropagation()}>
        <StatusDropdown
          status={task.status}
          onStatusChange={handleStatusChange}
          onForwardSelect={handleForwardSelect}
          isUpdating={isUpdating}
          testId="task-status-dropdown"
        />
      </div>

      {/* Priority Label with Category Color */}
      <span
        className="font-mono font-semibold text-sm px-2 py-0.5 rounded flex-shrink-0 min-w-[2.5rem] text-center"
        style={{
          backgroundColor: categoryColor,
          color: textColor,
        }}
        data-testid="priority-label"
      >
        {priorityLabel}
      </span>

      {/* Separator */}
      <span className="text-gray-400 flex-shrink-0">-</span>

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

      {/* Edit Button */}
      <button
        type="button"
        onClick={handleEditClick}
        className="
          flex-shrink-0 p-1.5 rounded
          text-gray-500 hover:text-blue-600 hover:bg-blue-50
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors
        "
        aria-label={`Edit task: ${task.title}`}
        data-testid="edit-button"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>

      {/* Delete Button */}
      <button
        type="button"
        onClick={handleDeleteClick}
        className="
          flex-shrink-0 p-1.5 rounded
          text-gray-500 hover:text-red-600 hover:bg-red-50
          focus:outline-none focus:ring-2 focus:ring-red-500
          transition-colors
        "
        aria-label={`Delete task: ${task.title}`}
        data-testid="delete-button"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: TaskItemRedesignProps, nextProps: TaskItemRedesignProps): boolean {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.updatedAt.getTime() === nextProps.task.updatedAt.getTime() &&
    prevProps.category?.id === nextProps.category?.id &&
    prevProps.category?.color === nextProps.category?.color &&
    prevProps.isUpdating === nextProps.isUpdating &&
    prevProps.showDragHandle === nextProps.showDragHandle
  );
}

// Export memoized component
export const TaskItemRedesign = memo(TaskItemRedesignComponent, arePropsEqual);

export default TaskItemRedesign;
