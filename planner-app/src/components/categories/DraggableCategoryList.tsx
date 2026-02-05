/**
 * DraggableCategoryList Component
 *
 * Category list with drag-and-drop reordering capability.
 * Provides DndContext and handles drag events with collision detection.
 */

import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import type { Category } from '../../types';
import { NONE_CATEGORY_ID } from '../../types';
import { SortableCategoryItem } from './SortableCategoryItem';

// =============================================================================
// Types
// =============================================================================

export interface DraggableCategoryListProps {
  /** Categories to display (should include both None and user categories) */
  categories: Category[];
  /** Callback when edit button is clicked */
  onEditCategory?: (category: Category) => void;
  /** Callback when delete button is clicked */
  onDeleteCategory?: (category: Category) => void;
  /** Callback when add category button is clicked */
  onAddCategory?: () => void;
  /** Callback when categories are reordered - receives new category ID order (excluding None) */
  onReorder: (categoryIds: string[]) => void;
  /** Loading state */
  loading?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Empty State Component
// =============================================================================

interface EmptyStateProps {
  onAddCategory?: () => void;
}

function EmptyState({ onAddCategory }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12 text-gray-500"
      data-testid="empty-state"
      role="status"
      aria-label="No categories available"
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
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
      <p className="text-base font-medium sm:text-lg">No categories yet</p>
      <p className="mt-1 text-sm text-gray-400">Create categories to organize your tasks</p>
      {onAddCategory && (
        <button
          type="button"
          onClick={onAddCategory}
          className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="Add your first category"
          data-testid="add-category-button"
        >
          Add Category
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Loading State Component
// =============================================================================

function LoadingState() {
  return (
    <div
      className="space-y-3"
      data-testid="loading-state"
      role="status"
      aria-live="polite"
      aria-label="Loading categories"
    >
      <span className="sr-only">Loading categories...</span>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white animate-pulse"
        >
          <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="flex-1 h-4 rounded bg-gray-300" />
          <div className="flex gap-2">
            <div className="w-16 h-8 rounded bg-gray-300" />
            <div className="w-16 h-8 rounded bg-gray-300" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Non-Draggable Category Item (for "None" category)
// =============================================================================

interface StaticCategoryItemProps {
  category: Category;
}

function StaticCategoryItem({ category }: StaticCategoryItemProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50"
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
      <div className="flex-1 text-sm font-medium text-gray-500">{category.name}</div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * DraggableCategoryList - Category list with drag-and-drop reordering
 *
 * Provides DndContext for drag operations. The "None" category is displayed
 * first but is not draggable. User-created categories can be reordered.
 */
export function DraggableCategoryList({
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  onReorder,
  loading = false,
  testId,
}: DraggableCategoryListProps) {
  // Separate None category from user categories
  const noneCategory = categories.find((c) => c.id === NONE_CATEGORY_ID);
  const userCategories = categories.filter((c) => c.id !== NONE_CATEGORY_ID);

  // Track the category being dragged for DragOverlay
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

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

  // Handle drag start - set the active category for overlay
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const category = userCategories.find((c) => c.id === active.id);
      setActiveCategory(category || null);
    },
    [userCategories]
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Clear active category
      setActiveCategory(null);

      // No change or dropped outside valid area
      if (!over || active.id === over.id) {
        return;
      }

      // Find indices
      const oldIndex = userCategories.findIndex((c) => c.id === active.id);
      const newIndex = userCategories.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Reorder the array
      const reorderedCategories = arrayMove(userCategories, oldIndex, newIndex);

      // Dispatch the reorder callback with new ID order
      onReorder(reorderedCategories.map((c) => c.id));
    },
    [userCategories, onReorder]
  );

  // Get category IDs for SortableContext (only user categories)
  const categoryIds = userCategories.map((c) => c.id);

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show empty state if no user categories (None doesn't count)
  if (userCategories.length === 0) {
    return <EmptyState onAddCategory={onAddCategory} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div
          className="space-y-2"
          data-testid={testId || 'draggable-category-list'}
          role="list"
          aria-label="Category list. Drag categories to reorder."
        >
          {/* None category (static, not draggable) */}
          {noneCategory && <StaticCategoryItem category={noneCategory} />}

          {/* User categories (draggable) */}
          {userCategories.map((category) => (
            <SortableCategoryItem
              key={category.id}
              id={category.id}
              category={category}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
            />
          ))}

          {/* Add category button */}
          {onAddCategory && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onAddCategory}
                className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-white text-sm font-medium text-gray-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                aria-label="Add a new category"
                data-testid="add-category-button"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Category
                </span>
              </button>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Drag Overlay - shows a copy of the category being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeCategory ? (
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-amber-500 opacity-90"
            data-testid="drag-overlay"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 border border-gray-300"
                style={{ backgroundColor: activeCategory.color }}
              />
              <div className="flex-1 text-sm font-medium text-gray-900">
                {activeCategory.name}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default DraggableCategoryList;
