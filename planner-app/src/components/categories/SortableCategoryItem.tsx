/**
 * SortableCategoryItem Component
 *
 * Wraps a category item to make it draggable using @dnd-kit's sortable functionality.
 * Adds a drag handle and applies transform/transition styles for smooth dragging.
 */

import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from '../common/DragHandle';
import type { Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface SortableCategoryItemProps {
  /** Unique ID for sortable context (typically category.id) */
  id: string;
  /** Category data */
  category: Category;
  /** Callback when edit button is clicked */
  onEdit?: (category: Category) => void;
  /** Callback when delete button is clicked */
  onDelete?: (category: Category) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SortableCategoryItem - Draggable wrapper for category item
 *
 * Uses dnd-kit's useSortable hook to make categories draggable.
 * Renders a drag handle on the left side.
 */
export const SortableCategoryItem = React.memo(function SortableCategoryItem({
  id,
  category,
  onEdit,
  onDelete,
}: SortableCategoryItemProps) {
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
      zIndex: isDragging ? 1000 : 'auto' as const,
    }),
    [transform, transition, isDragging]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex items-center gap-2 transition-all duration-200
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
      `}
      data-testid={`sortable-category-${id}`}
    >
      {/* Drop Indicator Line - shows when hovering over this category */}
      {isOver && !isDragging && (
        <div
          className="absolute -top-1 left-0 right-0 h-0.5 bg-amber-500 rounded-full shadow-lg z-10"
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

      {/* Category Content */}
      <div
        className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50"
        data-testid={`category-item-${category.id}`}
        role="listitem"
        aria-label={`Category: ${category.name}`}
      >
        {/* Color swatch */}
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 border border-gray-300"
          style={{ backgroundColor: category.color }}
          data-testid="category-color-swatch"
          aria-label={`Color: ${category.color}`}
        />

        {/* Category name */}
        <div className="flex-1 text-sm font-medium text-gray-900">{category.name}</div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label={`Edit ${category.name}`}
              data-testid={`edit-category-${category.id}`}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={`Delete ${category.name}`}
              data-testid={`delete-category-${category.id}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default SortableCategoryItem;
