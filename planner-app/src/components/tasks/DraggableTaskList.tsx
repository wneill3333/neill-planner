/**
 * DraggableTaskList Component
 *
 * Main orchestration component for drag-and-drop task reordering.
 * Provides DndContext and handles drag events with collision detection.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Task, Category, PriorityLetter } from '../../types';
import { SortablePriorityGroup } from './SortablePriorityGroup';
import { TaskItem } from './TaskItem';
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
  updatingTaskId = null,
  testId,
}: DraggableTaskListProps) {
  // Track the task being dragged for DragOverlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure sensors for mouse, touch, and keyboard interaction
  // MouseSensor for desktop (mouse-only), TouchSensor for mobile (touch-only)
  // Using separate sensors prevents PointerSensor from stealing touch events
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activating
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Press and hold 200ms to start dragging
        tolerance: 5, // Allow 5px movement during hold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start - set the active task for overlay
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t.id === active.id);
      setActiveTask(task || null);
    },
    [tasks]
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Clear active task
      setActiveTask(null);

      // No change or dropped outside valid area
      if (!over || active.id === over.id) {
        return;
      }

      // Find the tasks involved
      const draggedTask = tasks.find((t) => t.id === active.id);
      const overTask = tasks.find((t) => t.id === over.id);

      if (!draggedTask || !overTask) {
        return;
      }

      // Verify same priority group (no cross-priority dragging)
      if (draggedTask.priority.letter !== overTask.priority.letter) {
        return;
      }

      const priorityLetter = draggedTask.priority.letter;

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
      onDragStart={handleDragStart}
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
            updatingTaskId={updatingTaskId}
          />
        ))}
      </div>

      {/* Drag Overlay - shows a copy of the task being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 opacity-90"
            data-testid="drag-overlay"
          >
            <TaskItem
              task={activeTask}
              category={
                activeTask.categoryId && categoriesMap[activeTask.categoryId]
                  ? categoriesMap[activeTask.categoryId]
                  : null
              }
              onClick={() => {}}
              onStatusClick={() => {}}
              onStatusCycleBackward={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default DraggableTaskList;
