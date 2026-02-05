/**
 * CategoryListContainer Component
 *
 * Container component that connects CategoryList to Redux store.
 * Handles fetching categories, loading states, and category interactions.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { DraggableCategoryList } from '../../components/categories';
import {
  selectAllCategories,
  selectCategoriesLoading,
  selectCategoriesError,
  selectCategoriesInitialized,
  reorderCategoriesLocal,
} from './categorySlice';
import { fetchCategories, deleteCategory, reorderCategoriesAsync } from './categoryThunks';
import type { Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CategoryListContainerProps {
  /** Callback when edit button is clicked */
  onEditCategory?: (category: Category) => void;
  /** Callback when add category button is clicked */
  onAddCategory?: () => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Error State Component
// =============================================================================

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12 text-center"
      data-testid="error-state"
      role="alert"
      aria-live="assertive"
    >
      <svg
        className="w-12 h-12 mb-4 text-red-400 sm:w-16 sm:h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="mb-2 text-base font-medium text-gray-700 sm:text-lg">Something went wrong</p>
      <p className="mb-4 text-sm text-gray-500 max-w-md">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="Retry loading categories"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Unauthenticated State Component
// =============================================================================

function UnauthenticatedState() {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12 text-center"
      data-testid="unauthenticated-state"
      role="status"
      aria-label="User not signed in"
    >
      <svg
        className="w-12 h-12 mb-4 text-gray-400 sm:w-16 sm:h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <p className="text-base font-medium text-gray-700 sm:text-lg">Please sign in</p>
      <p className="mt-1 text-sm text-gray-500">Sign in to manage your categories</p>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * CategoryListContainer - Connects CategoryList to Redux store
 */
export function CategoryListContainer({
  onEditCategory,
  onAddCategory,
  testId,
}: CategoryListContainerProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  // Track which category is being deleted for confirmation
  const [_deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Redux selectors
  const categories = useAppSelector(selectAllCategories);
  const loading = useAppSelector(selectCategoriesLoading);
  const error = useAppSelector(selectCategoriesError);
  const initialized = useAppSelector(selectCategoriesInitialized);

  // Fetch categories on mount or when user changes
  useEffect(() => {
    if (userId && !initialized) {
      dispatch(fetchCategories(userId));
    }
  }, [dispatch, userId, initialized]);

  // Refetch categories
  const handleRetry = useCallback(() => {
    if (userId) {
      dispatch(fetchCategories(userId));
    }
  }, [dispatch, userId]);

  // Handle delete category
  const handleDeleteCategory = useCallback(
    async (category: Category) => {
      if (!userId) {
        console.error('Cannot delete category: user not authenticated');
        return;
      }

      // Simple confirmation using browser confirm
      // TODO: Replace with a custom modal in future
      const confirmed = window.confirm(
        `Are you sure you want to delete "${category.name}"?\n\nThis action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      setDeletingCategoryId(category.id);

      try {
        await dispatch(deleteCategory({ categoryId: category.id, userId })).unwrap();
        // Success - category removed from store automatically
      } catch (err) {
        console.error('Failed to delete category:', err);

        // Provide specific error messages
        let errorMessage = 'Failed to delete category';

        if (err instanceof Error) {
          if (err.message.includes('permission') || err.message.includes('Unauthorized')) {
            errorMessage = 'You do not have permission to delete this category';
          } else if (err.message.includes('network') || err.message.includes('offline')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (err.message.includes('not found')) {
            errorMessage = 'Category not found. It may have been deleted already.';
          }
        }

        // Use browser alert for now
        // TODO: Replace with toast notification in future
        alert(errorMessage);
      } finally {
        setDeletingCategoryId(null);
      }
    },
    [dispatch, userId]
  );

  // Handle edit category - always call useCallback unconditionally
  const handleEditCategory = useCallback(
    (category: Category) => {
      onEditCategory?.(category);
    },
    [onEditCategory]
  );

  // Handle add category - always call useCallback unconditionally
  const handleAddCategory = useCallback(() => {
    onAddCategory?.();
  }, [onAddCategory]);

  // Handle category reorder
  const handleReorder = useCallback(
    async (categoryIds: string[]) => {
      if (!userId) {
        console.error('Cannot reorder categories: user not authenticated');
        return;
      }

      // Optimistic update - immediately update local state
      dispatch(reorderCategoriesLocal(categoryIds));

      // Sync with backend
      try {
        await dispatch(reorderCategoriesAsync({ userId, categoryIds })).unwrap();
      } catch (err) {
        console.error('Failed to save category order:', err);
        // Note: Could refetch categories here to restore correct order
        // For now, the optimistic update remains in place
      }
    },
    [dispatch, userId]
  );

  // Show error state first (before auth check)
  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  // Show unauthenticated state if no user and not loading auth
  if (!authLoading && !user) {
    return <UnauthenticatedState />;
  }

  // Show loading state or categories
  const isLoading = loading || authLoading;

  return (
    <DraggableCategoryList
      categories={categories}
      onEditCategory={onEditCategory ? handleEditCategory : undefined}
      onDeleteCategory={handleDeleteCategory}
      onAddCategory={onAddCategory ? handleAddCategory : undefined}
      onReorder={handleReorder}
      loading={isLoading}
      testId={testId}
    />
  );
}

export default CategoryListContainer;
