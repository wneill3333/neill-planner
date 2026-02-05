/**
 * CategoryManagementPage Component
 *
 * Page for managing categories - create, edit, delete.
 * Uses CategoryListContainer and CategoryFormModal.
 */

import { useState, useCallback } from 'react';
import { AppLayout, type AppView } from '../../components/layout/AppLayout';
import { CategoryListContainer } from './CategoryListContainer';
import { CategoryFormModal } from './CategoryFormModal';
import type { Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CategoryManagementPageProps {
  /** Current active view */
  currentView?: AppView;
  /** Callback when navigation item is clicked */
  onNavigate?: (view: AppView) => void;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CategoryManagementPage - Page for managing categories
 *
 * Features:
 * - List all categories with edit/delete
 * - Create new categories via modal
 * - Edit existing categories via modal
 */
export function CategoryManagementPage({ currentView, onNavigate, testId }: CategoryManagementPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={onNavigate}
      className="max-w-4xl px-4 py-6 mx-auto sm:py-8"
    >
      <div data-testid={testId || 'category-management-page'}>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Manage Categories</h2>
        <div className="p-4 bg-white rounded-lg shadow-md">
          <CategoryListContainer
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
          />
        </div>
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
      />
    </AppLayout>
  );
}

export default CategoryManagementPage;
