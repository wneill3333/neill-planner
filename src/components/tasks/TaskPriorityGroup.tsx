/**
 * TaskPriorityGroup Component
 *
 * Displays a group of tasks under a priority letter header (A, B, C, or D).
 * Includes color-coded header and renders TaskItem for each task.
 */

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
  /** Callback when a task's status symbol is clicked */
  onStatusClick?: (task: Task) => void;
  /** Whether the group is initially collapsed */
  defaultCollapsed?: boolean;
  /** Whether to show category color indicators */
  showCategoryColors?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskPriorityGroup - Displays tasks grouped under a priority letter
 */
export function TaskPriorityGroup({
  priorityLetter,
  tasks,
  categoriesMap = {},
  onTaskClick,
  onStatusClick,
  showCategoryColors = true,
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
    <div
      className="mb-4"
      data-testid={testId || `priority-group-${priorityLetter}`}
    >
      {/* Priority Header */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-t-lg
          ${priorityClasses.bg} bg-opacity-10
          border-l-4 ${priorityClasses.border}
        `}
        data-testid="priority-header"
      >
        {/* Priority Badge */}
        <span
          className={`
            inline-flex items-center justify-center
            w-7 h-7 rounded-full text-white font-bold text-sm
          `}
          style={{ backgroundColor: priorityColor }}
          data-testid="priority-badge"
        >
          {priorityLetter}
        </span>

        {/* Priority Label and Count */}
        <span className={`font-medium ${priorityClasses.text}`}>
          {priorityLabel}
        </span>
        <span className="text-gray-500 text-sm">
          ({taskCount} {taskCount === 1 ? 'task' : 'tasks'})
        </span>
      </div>

      {/* Tasks List */}
      <div
        className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100"
        data-testid="tasks-container"
      >
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            category={task.categoryId ? categoriesMap[task.categoryId] : null}
            onClick={onTaskClick}
            onStatusClick={onStatusClick}
            showCategoryColor={showCategoryColors}
          />
        ))}
      </div>
    </div>
  );
}

export default TaskPriorityGroup;
