/**
 * DraggableTaskList Component
 *
 * Main orchestration component for drag-and-drop task reordering.
 * Provides DndContext and handles drag events with collision detection.
 */

import { useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Task, Category, PriorityLetter } from '../../types';
import { SortablePriorityGroup } from './SortablePriorityGroup';
import { groupTasksByPriority, getNonEmptyPriorityGroups } from '../../utils/taskUtils';

// =============================================================================
// Types
// =============================================================================

export interface DraggableTaskListProps {
  /** Tasks to display */
  tasks: Task[];
  /** Map of categories by ID for displaying category colors */
  categoriesMap?: Record<string, Category>;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when a task's status symbol is clicked */
  onStatusClick?: (task: Task) => void;
  /** Callback when a task's status cycles backward */
  onStatusCycleBackward?: (task: Task) => void;
  /** Callback when tasks are reordered within a priority group */
  onReorder: (taskIds: string[], priorityLetter: PriorityLetter) => void;
  /** Whether to show category color indicators */
  showCategoryColors?: boolean;
  /** ID of task currently being updated */
  updatingTaskId?: string | null;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState() {
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
      <p className="text-base font-medium sm:text-lg">No tasks for this day</p>
      <p className="mt-1 text-sm text-gray-400">Click the + button to add a new task</p>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * DraggableTaskList - Task list with drag-and-drop reordering
 *
 * Provides the DndContext for drag operations and handles reordering
 * of tasks within their priority groups.
 */
export function DraggableTaskList({
  tasks,
  categoriesMap = {},
  onTaskClick,
  onStatusClick,
  onStatusCycleBackward,
  onReorder,
  showCategoryColors = true,
  updatingTaskId = null,
  testId,
}: DraggableTaskListProps) {
  // Configure sensors for pointer and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // No change or dropped outside valid area
      if (!over || active.id === over.id) {
        return;
      }

      // Find the tasks involved
      const activeTask = tasks.find((t) => t.id === active.id);
      const overTask = tasks.find((t) => t.id === over.id);

      if (!activeTask || !overTask) {
        return;
      }

      // Verify same priority group (no cross-priority dragging)
      if (activeTask.priority.letter !== overTask.priority.letter) {
        return;
      }

      const priorityLetter = activeTask.priority.letter;

      // Get tasks in this priority group, sorted by current number
      const priorityTasks = tasks
        .filter((t) => t.priority.letter === priorityLetter)
        .sort((a, b) => a.priority.number - b.priority.number);

      const taskIds = priorityTasks.map((t) => t.id);
      const oldIndex = taskIds.indexOf(active.id as string);
      const newIndex = taskIds.indexOf(over.id as string);

      // Reorder the array
      const reorderedIds = arrayMove(taskIds, oldIndex, newIndex);

      // Dispatch the reorder action
      onReorder(reorderedIds, priorityLetter);
    },
    [tasks, onReorder]
  );

  // Memoize grouped tasks calculation to prevent recalculating on every render
  const { groupedTasks, nonEmptyGroups } = useMemo(() => {
    const grouped = groupTasksByPriority(tasks);
    return {
      groupedTasks: grouped,
      nonEmptyGroups: getNonEmptyPriorityGroups(grouped),
    };
  }, [tasks]);

  // Show empty state if no tasks
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        className="space-y-2"
        data-testid={testId || 'draggable-task-list'}
        role="region"
        aria-label="Task list grouped by priority. Drag tasks to reorder within their priority group."
      >
        {nonEmptyGroups.map((priorityLetter: PriorityLetter) => (
          <SortablePriorityGroup
            key={priorityLetter}
            priorityLetter={priorityLetter}
            tasks={groupedTasks[priorityLetter]}
            categoriesMap={categoriesMap}
            onTaskClick={onTaskClick}
            onStatusClick={onStatusClick}
            onStatusCycleBackward={onStatusCycleBackward}
            showCategoryColors={showCategoryColors}
            updatingTaskId={updatingTaskId}
          />
        ))}
      </div>
    </DndContext>
  );
}

export default DraggableTaskList;
