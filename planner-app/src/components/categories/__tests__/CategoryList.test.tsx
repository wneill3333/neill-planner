/**
 * CategoryList Component Tests
 *
 * Comprehensive tests for the CategoryList component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryList } from '../CategoryList';
import type { Category } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#3B82F6',
    sortOrder: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// =============================================================================
// Empty State Tests
// =============================================================================

describe('CategoryList', () => {
  describe('Empty State', () => {
    it('should render empty state when no categories', () => {
      render(<CategoryList categories={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show default empty message', () => {
      render(<CategoryList categories={[]} />);

      expect(screen.getByText('No categories yet')).toBeInTheDocument();
    });

    it('should show hint about creating categories', () => {
      render(<CategoryList categories={[]} />);

      expect(screen.getByText('Create categories to organize your tasks')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      render(<CategoryList categories={[]} emptyMessage="Create your first category!" />);

      expect(screen.getByText('Create your first category!')).toBeInTheDocument();
    });

    it('should render custom empty component', () => {
      const customEmpty = <div data-testid="custom-empty">Custom Empty State</div>;
      render(<CategoryList categories={[]} emptyComponent={customEmpty} />);

      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('should render empty state icon', () => {
      render(<CategoryList categories={[]} />);

      const icon = screen.getByTestId('empty-state').querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show add category button in empty state when callback provided', () => {
      const handleAdd = vi.fn();
      render(<CategoryList categories={[]} onAddCategory={handleAdd} />);

      const button = screen.getByRole('button', { name: 'Add your first category' });
      expect(button).toBeInTheDocument();
    });

    it('should call onAddCategory when empty state button clicked', () => {
      const handleAdd = vi.fn();
      render(<CategoryList categories={[]} onAddCategory={handleAdd} />);

      fireEvent.click(screen.getByRole('button', { name: 'Add your first category' }));

      expect(handleAdd).toHaveBeenCalledTimes(1);
    });

    it('should not show add button in empty state when no callback provided', () => {
      render(<CategoryList categories={[]} />);

      expect(screen.queryByRole('button', { name: 'Add your first category' })).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Loading State Tests
  // =============================================================================

  describe('Loading State', () => {
    it('should render loading state when loading is true', () => {
      render(<CategoryList categories={[]} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show loading skeleton with animation', () => {
      render(<CategoryList categories={[]} loading={true} />);

      const skeleton = screen.getByTestId('loading-state').querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should show loading text for screen readers', () => {
      render(<CategoryList categories={[]} loading={true} />);

      expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });

    it('should show loading state instead of empty state when loading', () => {
      render(<CategoryList categories={[]} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('should show loading state instead of categories when loading', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('category-list')).not.toBeInTheDocument();
    });

    it('should render three skeleton items', () => {
      render(<CategoryList categories={[]} loading={true} />);

      const skeletons = screen.getByTestId('loading-state').querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });
  });

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('should render category list with categories', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} />);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    it('should render all categories', () => {
      const categories = [
        createMockCategory({ id: '1', name: 'Work' }),
        createMockCategory({ id: '2', name: 'Personal' }),
        createMockCategory({ id: '3', name: 'Health' }),
      ];
      render(<CategoryList categories={categories} />);

      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} testId="custom-list" />);

      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
    });

    it('should render default testId', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} />);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    it('should render category items with correct testIds', () => {
      const categories = [
        createMockCategory({ id: 'cat-1', name: 'Work' }),
        createMockCategory({ id: 'cat-2', name: 'Personal' }),
      ];
      render(<CategoryList categories={categories} />);

      expect(screen.getByTestId('category-item-cat-1')).toBeInTheDocument();
      expect(screen.getByTestId('category-item-cat-2')).toBeInTheDocument();
    });

    it('should have proper ARIA role for list', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} />);

      const list = screen.getByTestId('category-list');
      expect(list).toHaveAttribute('role', 'list');
    });

    it('should have proper ARIA role for list items', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} />);

      const item = screen.getByTestId('category-item-cat-1');
      expect(item).toHaveAttribute('role', 'listitem');
    });
  });

  // =============================================================================
  // Color Swatch Tests
  // =============================================================================

  describe('Color Swatches', () => {
    it('should display color swatch for each category', () => {
      const categories = [createMockCategory({ color: '#FF5733' })];
      render(<CategoryList categories={categories} />);

      const swatch = screen.getByTestId('category-color-swatch');
      expect(swatch).toBeInTheDocument();
    });

    it('should apply correct background color to swatch', () => {
      const categories = [createMockCategory({ color: '#FF5733' })];
      render(<CategoryList categories={categories} />);

      const swatch = screen.getByTestId('category-color-swatch');
      expect(swatch).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should render color swatches for multiple categories', () => {
      const categories = [
        createMockCategory({ id: '1', color: '#FF0000' }),
        createMockCategory({ id: '2', color: '#00FF00' }),
        createMockCategory({ id: '3', color: '#0000FF' }),
      ];
      render(<CategoryList categories={categories} />);

      const swatches = screen.getAllByTestId('category-color-swatch');
      expect(swatches).toHaveLength(3);
      expect(swatches[0]).toHaveStyle({ backgroundColor: '#FF0000' });
      expect(swatches[1]).toHaveStyle({ backgroundColor: '#00FF00' });
      expect(swatches[2]).toHaveStyle({ backgroundColor: '#0000FF' });
    });

    it('should render color swatch with rounded full class', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} />);

      const swatch = screen.getByTestId('category-color-swatch');
      expect(swatch).toHaveClass('rounded-full');
    });
  });

  // =============================================================================
  // Action Button Tests
  // =============================================================================

  describe('Action Buttons', () => {
    it('should render edit button when onEditCategory is provided', () => {
      const categories = [createMockCategory({ id: 'cat-1', name: 'Work' })];
      const handleEdit = vi.fn();

      render(<CategoryList categories={categories} onEditCategory={handleEdit} />);

      expect(screen.getByTestId('edit-category-cat-1')).toBeInTheDocument();
    });

    it('should not render edit button when onEditCategory is not provided', () => {
      const categories = [createMockCategory({ id: 'cat-1' })];

      render(<CategoryList categories={categories} />);

      expect(screen.queryByTestId('edit-category-cat-1')).not.toBeInTheDocument();
    });

    it('should render delete button when onDeleteCategory is provided', () => {
      const categories = [createMockCategory({ id: 'cat-1', name: 'Work' })];
      const handleDelete = vi.fn();

      render(<CategoryList categories={categories} onDeleteCategory={handleDelete} />);

      expect(screen.getByTestId('delete-category-cat-1')).toBeInTheDocument();
    });

    it('should not render delete button when onDeleteCategory is not provided', () => {
      const categories = [createMockCategory({ id: 'cat-1' })];

      render(<CategoryList categories={categories} />);

      expect(screen.queryByTestId('delete-category-cat-1')).not.toBeInTheDocument();
    });

    it('should call onEditCategory when edit button is clicked', () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Work' });
      const handleEdit = vi.fn();

      render(<CategoryList categories={[category]} onEditCategory={handleEdit} />);

      fireEvent.click(screen.getByTestId('edit-category-cat-1'));

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(category);
    });

    it('should call onDeleteCategory when delete button is clicked', () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Work' });
      const handleDelete = vi.fn();

      render(<CategoryList categories={[category]} onDeleteCategory={handleDelete} />);

      fireEvent.click(screen.getByTestId('delete-category-cat-1'));

      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledWith(category);
    });

    it('should render edit and delete buttons for multiple categories', () => {
      const categories = [
        createMockCategory({ id: '1', name: 'Work' }),
        createMockCategory({ id: '2', name: 'Personal' }),
      ];
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <CategoryList
          categories={categories}
          onEditCategory={handleEdit}
          onDeleteCategory={handleDelete}
        />
      );

      expect(screen.getByTestId('edit-category-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-category-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-category-2')).toBeInTheDocument();
      expect(screen.getByTestId('delete-category-2')).toBeInTheDocument();
    });

    it('should have correct ARIA labels for edit buttons', () => {
      const categories = [createMockCategory({ id: 'cat-1', name: 'Work' })];
      const handleEdit = vi.fn();

      render(<CategoryList categories={categories} onEditCategory={handleEdit} />);

      const button = screen.getByTestId('edit-category-cat-1');
      expect(button).toHaveAttribute('aria-label', 'Edit Work');
    });

    it('should have correct ARIA labels for delete buttons', () => {
      const categories = [createMockCategory({ id: 'cat-1', name: 'Work' })];
      const handleDelete = vi.fn();

      render(<CategoryList categories={categories} onDeleteCategory={handleDelete} />);

      const button = screen.getByTestId('delete-category-cat-1');
      expect(button).toHaveAttribute('aria-label', 'Delete Work');
    });
  });

  // =============================================================================
  // Add Category Button Tests
  // =============================================================================

  describe('Add Category Button', () => {
    it('should render add category button when onAddCategory is provided', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      expect(screen.getByTestId('add-category-button')).toBeInTheDocument();
    });

    it('should not render add category button when onAddCategory is not provided', () => {
      const categories = [createMockCategory()];

      render(<CategoryList categories={categories} />);

      expect(screen.queryByTestId('add-category-button')).not.toBeInTheDocument();
    });

    it('should call onAddCategory when add button is clicked', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      fireEvent.click(screen.getByTestId('add-category-button'));

      expect(handleAdd).toHaveBeenCalledTimes(1);
    });

    it('should display "Add Category" text on button', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    it('should render add button with plus icon', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      const button = screen.getByTestId('add-category-button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct ARIA label for add button', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      const button = screen.getByTestId('add-category-button');
      expect(button).toHaveAttribute('aria-label', 'Add a new category');
    });

    it('should render add button with dashed border', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      const button = screen.getByTestId('add-category-button');
      expect(button).toHaveClass('border-dashed');
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle single category', () => {
      const categories = [createMockCategory()];
      render(<CategoryList categories={categories} />);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('should handle many categories', () => {
      const categories = Array.from({ length: 20 }, (_, i) =>
        createMockCategory({
          id: `cat-${i}`,
          name: `Category ${i}`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        })
      );

      render(<CategoryList categories={categories} />);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^category-item-/)).toHaveLength(20);
    });

    it('should handle switching from loading to categories', () => {
      const categories = [createMockCategory()];
      const { rerender } = render(<CategoryList categories={[]} loading={true} />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      rerender(<CategoryList categories={categories} loading={false} />);

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    it('should handle switching from categories to empty', () => {
      const categories = [createMockCategory()];
      const { rerender } = render(<CategoryList categories={categories} />);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();

      rerender(<CategoryList categories={[]} />);

      expect(screen.queryByTestId('category-list')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should handle category with long name', () => {
      const categories = [
        createMockCategory({
          name: 'This is a very long category name that should still display properly',
        }),
      ];

      render(<CategoryList categories={categories} />);

      expect(
        screen.getByText('This is a very long category name that should still display properly')
      ).toBeInTheDocument();
    });

    it('should handle category with special characters in name', () => {
      const categories = [createMockCategory({ name: 'Work & Personal (2024)' })];

      render(<CategoryList categories={categories} />);

      expect(screen.getByText('Work & Personal (2024)')).toBeInTheDocument();
    });

    it('should maintain sort order of categories', () => {
      const categories = [
        createMockCategory({ id: '1', name: 'Alpha', sortOrder: 2 }),
        createMockCategory({ id: '2', name: 'Beta', sortOrder: 1 }),
        createMockCategory({ id: '3', name: 'Gamma', sortOrder: 0 }),
      ];

      render(<CategoryList categories={categories} />);

      const items = screen.getAllByTestId(/^category-item-/);
      expect(items[0]).toHaveTextContent('Alpha');
      expect(items[1]).toHaveTextContent('Beta');
      expect(items[2]).toHaveTextContent('Gamma');
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels for empty state', () => {
      render(<CategoryList categories={[]} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('role', 'status');
      expect(emptyState).toHaveAttribute('aria-label', 'No categories available');
    });

    it('should have proper ARIA labels for loading state', () => {
      render(<CategoryList categories={[]} loading={true} />);

      const loadingState = screen.getByTestId('loading-state');
      expect(loadingState).toHaveAttribute('role', 'status');
      expect(loadingState).toHaveAttribute('aria-live', 'polite');
      expect(loadingState).toHaveAttribute('aria-label', 'Loading categories');
    });

    it('should have screen reader text for loading', () => {
      render(<CategoryList categories={[]} loading={true} />);

      const srText = screen.getByText('Loading categories...');
      expect(srText).toHaveClass('sr-only');
    });

    it('should have proper ARIA labels for category items', () => {
      const categories = [createMockCategory({ name: 'Work' })];

      render(<CategoryList categories={categories} />);

      const item = screen.getByTestId('category-item-cat-1');
      expect(item).toHaveAttribute('aria-label', 'Category: Work');
    });

    it('should have proper ARIA labels for color swatches', () => {
      const categories = [createMockCategory({ color: '#FF5733' })];

      render(<CategoryList categories={categories} />);

      const swatch = screen.getByTestId('category-color-swatch');
      expect(swatch).toHaveAttribute('aria-label', 'Color: #FF5733');
    });

    it('should mark decorative icons as aria-hidden', () => {
      render(<CategoryList categories={[]} />);

      const icon = screen.getByTestId('empty-state').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should mark add button icon as aria-hidden', () => {
      const categories = [createMockCategory()];
      const handleAdd = vi.fn();

      render(<CategoryList categories={categories} onAddCategory={handleAdd} />);

      const button = screen.getByTestId('add-category-button');
      const icon = button.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
