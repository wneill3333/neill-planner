/**
 * DraggableFlatTaskList Component
 *
 * Flat task list with drag-and-drop reordering capability.
 * Tasks can be reordered across priority groups.
 * Provides DndContext and handles drag events with collision detection.
 */

import { useCallback, useState } from 'react';
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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Task, Category } from '../../types';
import { SortableFlatTaskItem } from './SortableFlatTaskItem';
import { TaskItemRedesign } from './TaskItemRedesign';

// =============================================================================
// Types
// =============================================================================

export interface DraggableFlatTaskListProps {
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
  /** Callback when tasks are reordered - receives new task order */
  onReorder: (reorderedTasks: Task[]) => void;
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
 * DraggableFlatTaskList - Flat task list with drag-and-drop reordering
 *
 * Provides DndContext for drag operations and handles reordering
 * of tasks in a flat list (no priority groups).
 */
export function DraggableFlatTaskList({
  tasks,
  categoriesMap = {},
  onTaskClick,
  onEdit,
  onDelete,
  onStatusChange,
  onForwardSelect,
  onReorder,
  updatingTaskId = null,
  testId,
}: DraggableFlatTaskListProps) {
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

      // Find indices
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Reorder the array
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);

      // Dispatch the reorder callback
      onReorder(reorderedTasks);
    },
    [tasks, onReorder]
  );

  // Get task IDs for SortableContext
  const taskIds = tasks.map((t) => t.id);

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
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          className="space-y-2"
          data-testid={testId || 'draggable-flat-task-list'}
          role="region"
          aria-label="Task list. Drag tasks to reorder."
        >
          {tasks.map((task) => (
            <SortableFlatTaskItem
              key={task.id}
              id={task.id}
              task={task}
              category={task.categoryId ? categoriesMap[task.categoryId] : null}
              onClick={onTaskClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onForwardSelect={onForwardSelect}
              isUpdating={task.id === updatingTaskId}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - shows a copy of the task being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 opacity-90"
            data-testid="drag-overlay"
          >
            <TaskItemRedesign
              task={activeTask}
              category={
                activeTask.categoryId && categoriesMap[activeTask.categoryId]
                  ? categoriesMap[activeTask.categoryId]
                  : null
              }
              showDragHandle={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default DraggableFlatTaskList;
