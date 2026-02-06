/**
 * DragHandle Component
 *
 * A visual drag handle (grip icon) for initiating drag operations.
 * Used with @dnd-kit for drag-and-drop functionality.
 */

import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

// =============================================================================
// Types
// =============================================================================

export interface DragHandleProps {
  /** Listener props from useSortable hook */
  listeners?: SyntheticListenerMap;
  /** Attributes from useSortable hook */
  attributes?: DraggableAttributes;
  /** Whether dragging is currently active */
  isDragging?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DragHandle - Visual grip for drag-and-drop
 *
 * Renders a six-dot grip icon that users can grab to drag items.
 * Passes through dnd-kit listeners and attributes for drag functionality.
 */
export function DragHandle({
  listeners,
  attributes,
  isDragging = false,
  testId = 'drag-handle',
}: DragHandleProps) {
  return (
    <>
      <button
        type="button"
        className={`
          flex items-center justify-center w-6 h-8 rounded
          -m-2 p-2
          text-gray-400 hover:text-gray-600 hover:bg-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          transition-colors duration-150
          touch-action-none select-none
          ${isDragging ? 'cursor-grabbing text-gray-600' : 'cursor-grab'}
        `}
        aria-label="Drag to reorder"
        aria-describedby="drag-handle-instructions"
        data-testid={testId}
        {...listeners}
        {...attributes}
      >
        {/* Six-dot grip icon */}
        <svg
          width="12"
          height="20"
          viewBox="0 0 12 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="3" cy="4" r="1.5" />
          <circle cx="9" cy="4" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="3" cy="16" r="1.5" />
          <circle cx="9" cy="16" r="1.5" />
        </svg>
      </button>
      {/* Screen reader instructions (rendered once globally) */}
      <span id="drag-handle-instructions" className="sr-only">
        Press space or enter to start dragging. While dragging, use arrow keys to move the item. Press space or enter again to drop.
      </span>
    </>
  );
}

export default DragHandle;
