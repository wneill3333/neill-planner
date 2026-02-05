/**
 * TaskPriorityGroup Component
 *
 * Displays a group of tasks under a priority letter header (A, B, C, or D).
 * Includes color-coded header and renders TaskItem for each task.
 */

import { memo } from 'react';
import type { Task, Category, PriorityLetter } from '../../types';
import { TaskItem } from './TaskItem';
import { getPriorityColor, getPriorityColorClasses, PRIORITY_LABELS } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface TaskPriorityGroupProps {
  /** The priority letter for this group */
  priorityLetter: PriorityLetter;
  /** Tasks in this priority group (should be pre-sorted by number) */
  tasks: Task[];
  /** Map of categories by ID for displaying category colors */
  categoriesMap?: Record<string, Category>;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when a task's status symbol is clicked (cycles forward) */
  onStatusClick?: (task: Task) => void;
  /** Callback when a task's status cycles backward (via arrow keys) */
  onStatusCycleBackward?: (task: Task) => void;
  /** ID of task currently being updated */
  updatingTaskId?: string | null;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskPriorityGroup - Displays tasks grouped under a priority letter
 */
function TaskPriorityGroupComponent({
  priorityLetter,
  tasks,
  categoriesMap = {},
  onTaskClick,
  onStatusClick,
  onStatusCycleBackward,
  updatingTaskId = null,
  testId,
}: TaskPriorityGroupProps) {
  const priorityColor = getPriorityColor(priorityLetter);
  const priorityClasses = getPriorityColorClasses(priorityLetter);
  const priorityLabel = PRIORITY_LABELS[priorityLetter];
  const taskCount = tasks.length;

  if (taskCount === 0) {
    return null;
  }

  return (
    <section
      className="mb-4"
      data-testid={testId || `priority-group-${priorityLetter}`}
      aria-labelledby={`priority-${priorityLetter}-header`}
    >
      {/* Priority Header */}
      <div
        id={`priority-${priorityLetter}-header`}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-t-lg border-l-4
          ${priorityClasses.bg} ${priorityClasses.border} bg-opacity-10
        `}
        data-testid="priority-header"
      >
        {/* Priority Badge */}
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: priorityColor }}
          data-testid="priority-badge"
          aria-hidden="true"
        >
          {priorityLetter}
        </span>

        {/* Priority Label and Count */}
        <h3 className={`font-medium ${priorityClasses.text} text-base`}>
          Priority {priorityLetter}: {priorityLabel}
        </h3>
        <span className="text-gray-500 text-sm" aria-label={`${taskCount} tasks in this group`}>
          ({taskCount} {taskCount === 1 ? 'task' : 'tasks'})
        </span>
      </div>

      {/* Tasks List */}
      <ul
        className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100 list-none m-0 p-0"
        data-testid="tasks-container"
        aria-label={`${priorityLabel} priority tasks`}
      >
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskItem
              task={task}
              category={task.categoryId ? categoriesMap[task.categoryId] : null}
              onClick={onTaskClick}
              onStatusClick={onStatusClick}
              onStatusCycleBackward={onStatusCycleBackward}
              isUpdating={updatingTaskId === task.id}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Custom comparison function for React.memo
 * Compares props that affect rendering, excluding callback functions
 * since they may be recreated on parent re-renders
 */
function arePropsEqual(
  prevProps: TaskPriorityGroupProps,
  nextProps: TaskPriorityGroupProps
): boolean {
  return (
    prevProps.priorityLetter === nextProps.priorityLetter &&
    prevProps.tasks === nextProps.tasks &&
    prevProps.categoriesMap === nextProps.categoriesMap &&
    prevProps.updatingTaskId === nextProps.updatingTaskId &&
    prevProps.testId === nextProps.testId
  );
}

export const TaskPriorityGroup = memo(TaskPriorityGroupComponent, arePropsEqual);

export default TaskPriorityGroup;
