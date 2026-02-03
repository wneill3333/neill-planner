/**
 * SortableTaskItem Component
 *
 * Wraps TaskItem to make it draggable using @dnd-kit's sortable functionality.
 * Adds a drag handle and applies transform/transition styles for smooth dragging.
 */

import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem, type TaskItemProps } from './TaskItem';
import { DragHandle } from '../common/DragHandle';

// =============================================================================
// Types
// =============================================================================

export interface SortableTaskItemProps extends TaskItemProps {
  /** Unique ID for sortable context (typically task.id) */
  id: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SortableTaskItem - Draggable wrapper for TaskItem
 *
 * Uses dnd-kit's useSortable hook to make tasks draggable within
 * their priority group. Renders a drag handle on the left side.
 */
export const SortableTaskItem = React.memo(function SortableTaskItem({ id, ...taskItemProps }: SortableTaskItemProps) {
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
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    zIndex: isDragging ? 1000 : 'auto',
  }), [transform, transition, isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex items-center gap-1 transition-all duration-200
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
      `}
      data-testid={`sortable-task-${id}`}
    >
      {/* Drop Indicator Line - shows when hovering over this task */}
      {isOver && !isDragging && (
        <div
          className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-lg z-10"
          data-testid={`drop-indicator-${id}`}
          aria-hidden="true"
        />
      )}

      {/* Drag Handle */}
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        testId={`drag-handle-${id}`}
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <TaskItem {...taskItemProps} />
      </div>
    </div>
  );
});

export default SortableTaskItem;
