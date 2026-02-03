/**
 * CategoryFormModal Component
 *
 * Modal wrapper for CategoryForm with Redux integration.
 * Handles category creation and editing with state management.
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { CategoryForm } from '../../components/categories/CategoryForm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../auth';
import { createCategory, updateCategoryAsync } from './categoryThunks';
import {
  selectAllCategories,
  selectCategoriesSyncStatus,
  selectCategoriesError,
} from './categorySlice';
import type { Category, CreateCategoryInput } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CategoryFormModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Category to edit (null for create mode) */
  category?: Category | null;
  /** Callback when category is successfully created/updated */
  onSuccess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CategoryFormModal - Modal for creating/editing categories
 *
 * Integrates with Redux to handle category CRUD operations.
 * Automatically closes on successful submission.
 *
 * @example
 * ```tsx
 * <CategoryFormModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   category={selectedCategory}
 *   onSuccess={() => console.log('Category saved!')}
 * />
 * ```
 */
export function CategoryFormModal({
  isOpen,
  onClose,
  category = null,
  onSuccess,
}: CategoryFormModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Select data from Redux store
  const allCategories = useAppSelector(selectAllCategories);
  const syncStatus = useAppSelector(selectCategoriesSyncStatus);
  const categoriesError = useAppSelector(selectCategoriesError);

  // Determine loading state
  const isSubmitting = syncStatus === 'syncing';

  // Get existing category names (excluding current category if editing)
  const existingNames = useMemo(
    () =>
      allCategories
        .filter((cat) => cat.id !== category?.id)
        .map((cat) => cat.name),
    [allCategories, category?.id]
  );

  // Track previous sync status to detect success
  const prevSyncStatusRef = useRef(syncStatus);

  // Close modal on successful sync
  useEffect(() => {
    // Detect transition from syncing to synced (successful operation)
    if (prevSyncStatusRef.current === 'syncing' && syncStatus === 'synced') {
      onClose();
      onSuccess?.();
    }
    prevSyncStatusRef.current = syncStatus;
  }, [syncStatus, onClose, onSuccess]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateCategoryInput) => {
      const userId = user?.id;
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      try {
        if (category) {
          // Edit mode - update existing category
          await dispatch(
            updateCategoryAsync({
              id: category.id,
              name: data.name,
              color: data.color,
              userId,
            })
          ).unwrap();
        } else {
          // Create mode - create new category
          await dispatch(
            createCategory({
              input: data,
              userId,
            })
          ).unwrap();
        }
      } catch (error) {
        // Error is handled by Redux state
        console.error('Failed to save category:', error);
      }
    },
    [dispatch, category, user?.id]
  );

  // Get initial values for edit mode
  const initialValues = category
    ? {
        name: category.name,
        color: category.color,
      }
    : null;

  // Get error message from sync status
  const error =
    syncStatus === 'error'
      ? categoriesError || 'Failed to save category. Please try again.'
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
      size="md"
      testId="category-form-modal"
    >
      <CategoryForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
        existingNames={existingNames}
      />
    </Modal>
  );
}

export default CategoryFormModal;
