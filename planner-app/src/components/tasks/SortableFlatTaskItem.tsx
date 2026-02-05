/**
 * SortableFlatTaskItem Component
 *
 * Wraps TaskItemRedesign to make it draggable using @dnd-kit's sortable functionality.
 * Used in the flat task list for cross-priority drag-and-drop.
 */

import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItemRedesign, type TaskItemRedesignProps } from './TaskItemRedesign';

// =============================================================================
// Types
// =============================================================================

export interface SortableFlatTaskItemProps extends Omit<TaskItemRedesignProps, 'showDragHandle'> {
  /** Unique ID for sortable context (typically task.id) */
  id: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SortableFlatTaskItem - Draggable wrapper for TaskItemRedesign
 *
 * Uses dnd-kit's useSortable hook to make tasks draggable in the flat list.
 * The drag handle is built into TaskItemRedesign and listeners are applied there.
 */
export const SortableFlatTaskItem = React.memo(function SortableFlatTaskItem({
  id,
  ...taskItemProps
}: SortableFlatTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  // Memoize style object to prevent recreating on every render
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
      zIndex: isDragging ? 1000 : 'auto',
    }),
    [transform, transition, isDragging]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative transition-all duration-200
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
      `}
      data-testid={`sortable-flat-task-${id}`}
      {...attributes}
      {...listeners}
    >
      {/* Drop Indicator Line - shows when hovering over this task */}
      {isOver && !isDragging && (
        <div
          className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-lg z-10"
          data-testid={`drop-indicator-${id}`}
          aria-hidden="true"
        />
      )}

      {/* Task Content */}
      <TaskItemRedesign
        {...taskItemProps}
        showDragHandle={true}
      />
    </div>
  );
});

export default SortableFlatTaskItem;
