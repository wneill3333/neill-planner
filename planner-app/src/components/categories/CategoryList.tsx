/**
 * CategoryList Component
 *
 * Displays a list of user categories with color swatches, names, and action buttons.
 * Shows an empty state when no categories are available.
 */

import { memo } from 'react';
import type { Category } from '../../types';
import { NONE_CATEGORY_ID } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CategoryListProps {
  /** Categories to display */
  categories: Category[];
  /** Callback when edit button is clicked */
  onEditCategory?: (category: Category) => void;
  /** Callback when delete button is clicked */
  onDeleteCategory?: (category: Category) => void;
  /** Callback when add category button is clicked */
  onAddCategory?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Empty State Component
// =============================================================================

interface EmptyStateProps {
  message?: string;
  onAddCategory?: () => void;
}

function EmptyState({ message = 'No categories yet', onAddCategory }: EmptyStateProps) {
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
      <p className="text-base font-medium sm:text-lg">{message}</p>
      <p className="mt-1 text-sm text-gray-400">
        Create categories to organize your tasks
      </p>
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
      {/* Skeleton for category items */}
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white animate-pulse"
        >
          {/* Color swatch skeleton */}
          <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
          {/* Name skeleton */}
          <div className="flex-1 h-4 rounded bg-gray-300" />
          {/* Action buttons skeleton */}
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
// Category Item Component
// =============================================================================

interface CategoryItemProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

/**
 * CategoryItem - Memoized category item to prevent unnecessary re-renders
 */
const CategoryItem = memo(function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50"
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
      <div className="flex-1 text-sm font-medium text-gray-900">
        {category.name}
      </div>

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
  );
});

// =============================================================================
// Component
// =============================================================================

/**
 * CategoryList - Displays a list of categories with actions
 */
export function CategoryList({
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  loading = false,
  emptyMessage,
  emptyComponent,
  testId,
}: CategoryListProps) {
  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show empty state if no categories
  if (categories.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return <EmptyState message={emptyMessage} onAddCategory={onAddCategory} />;
  }

  return (
    <div
      className="space-y-2"
      data-testid={testId || 'category-list'}
      role="list"
      aria-label="Category list"
    >
      {/* Category items */}
      {categories.map((category) => {
        // Don't show edit/delete buttons for the virtual "None" category
        const isNoneCategory = category.id === NONE_CATEGORY_ID;

        return (
          <CategoryItem
            key={category.id}
            category={category}
            onEdit={!isNoneCategory ? onEditCategory : undefined}
            onDelete={!isNoneCategory ? onDeleteCategory : undefined}
          />
        );
      })}

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
  );
}

export default CategoryList;
