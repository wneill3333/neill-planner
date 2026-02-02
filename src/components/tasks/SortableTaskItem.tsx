/**
 * SortableTaskItem Component
 *
 * Wraps TaskItem to make it draggable using @dnd-kit's sortable functionality.
 * Adds a drag handle and applies transform/transition styles for smooth dragging.
 */

import { useMemo } from 'react';
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
export function SortableTaskItem({ id, ...taskItemProps }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Memoize style object to prevent recreating on every render
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }), [transform, transition, isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-1
        ${isDragging ? 'shadow-lg bg-white rounded-lg' : ''}
      `}
      data-testid={`sortable-task-${id}`}
    >
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
}

export default SortableTaskItem;
