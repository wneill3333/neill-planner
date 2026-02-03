/**
 * SortablePriorityGroup Component
 *
 * A priority group that supports drag-and-drop reordering of tasks.
 * Uses @dnd-kit's SortableContext to enable sorting within the group.
 */

import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, Category, PriorityLetter } from '../../types';
import { SortableTaskItem } from './SortableTaskItem';
import { getPriorityColor, getPriorityColorClasses, PRIORITY_LABELS } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface SortablePriorityGroupProps {
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
  /** Whether to show category color indicators */
  showCategoryColors?: boolean;
  /** ID of task currently being updated */
  updatingTaskId?: string | null;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SortablePriorityGroup - Priority group with drag-and-drop support
 *
 * Renders a priority group header and wraps tasks in SortableContext
 * to enable reordering within the group.
 */
export const SortablePriorityGroup = React.memo(function SortablePriorityGroup({
  priorityLetter,
  tasks,
  categoriesMap = {},
  onTaskClick,
  onStatusClick,
  onStatusCycleBackward,
  showCategoryColors = true,
  updatingTaskId = null,
  testId,
}: SortablePriorityGroupProps) {
  const priorityColor = getPriorityColor(priorityLetter);
  const priorityClasses = getPriorityColorClasses(priorityLetter);
  const priorityLabel = PRIORITY_LABELS[priorityLetter];
  const taskCount = tasks.length;

  // Memoize task IDs to prevent recreating array on every render
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  if (taskCount === 0) {
    return null;
  }

  return (
    <section
      className="mb-4"
      data-testid={testId || `sortable-priority-group-${priorityLetter}`}
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

      {/* Sortable Tasks List */}
      <div
        className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100"
        data-testid="tasks-container"
        aria-label={`${priorityLabel} priority tasks`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              id={task.id}
              task={task}
              category={task.categoryId ? categoriesMap[task.categoryId] : null}
              onClick={onTaskClick}
              onStatusClick={onStatusClick}
              onStatusCycleBackward={onStatusCycleBackward}
              showCategoryColor={showCategoryColors}
              isUpdating={updatingTaskId === task.id}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
});

export default SortablePriorityGroup;
