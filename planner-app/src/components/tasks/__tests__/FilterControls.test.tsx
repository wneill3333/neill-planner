/**
 * FilterControls Component Tests
 *
 * Tests for the FilterControls UI component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterControls } from '../FilterControls';
import type { Category, TaskStatus, PriorityLetter } from '../../../types';

// =============================================================================
// Test Setup
// =============================================================================

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#EF4444',
    sortOrder: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cat-2',
    userId: 'user-1',
    name: 'Personal',
    color: '#3B82F6',
    sortOrder: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cat-3',
    userId: 'user-1',
    name: 'Health',
    color: '#22C55E',
    sortOrder: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const defaultProps = {
  statusFilter: null,
  categoryFilter: null,
  priorityFilter: null,
  categories: mockCategories,
  activeFilterCount: 0,
  onStatusFilterChange: vi.fn(),
  onCategoryFilterChange: vi.fn(),
  onPriorityFilterChange: vi.fn(),
  onClearAllFilters: vi.fn(),
};

// =============================================================================
// Component Rendering Tests
// =============================================================================

describe('FilterControls', () => {
  describe('rendering', () => {
    it('should render collapsed by default', () => {
      render(<FilterControls {...defaultProps} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-controls-panel')).not.toBeInTheDocument();
    });

    it('should expand when toggle button clicked', () => {
      render(<FilterControls {...defaultProps} />);

      const toggleButton = screen.getByTestId('filter-controls-toggle');
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('filter-controls-panel')).toBeInTheDocument();
    });

    it('should show active filter count badge when filters are active', () => {
      render(<FilterControls {...defaultProps} activeFilterCount={2} />);

      const badge = screen.getByTestId('filter-controls-count-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2');
    });

    it('should not show badge when no filters are active', () => {
      render(<FilterControls {...defaultProps} activeFilterCount={0} />);

      expect(screen.queryByTestId('filter-controls-count-badge')).not.toBeInTheDocument();
    });

    it('should show clear all button when filters are active', () => {
      render(<FilterControls {...defaultProps} activeFilterCount={1} />);

      expect(screen.getByTestId('filter-controls-clear-all')).toBeInTheDocument();
    });

    it('should not show clear all button when no filters are active', () => {
      render(<FilterControls {...defaultProps} activeFilterCount={0} />);

      expect(screen.queryByTestId('filter-controls-clear-all')).not.toBeInTheDocument();
    });

    it('should render all status checkboxes when expanded', () => {
      render(<FilterControls {...defaultProps} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      expect(screen.getByTestId('filter-controls-status-in_progress')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-status-complete')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-status-forward')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-status-delegate')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-status-delete')).toBeInTheDocument();
    });

    it('should render all category checkboxes when expanded', () => {
      render(<FilterControls {...defaultProps} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      expect(screen.getByTestId('filter-controls-category-cat-1')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-category-cat-2')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-category-cat-3')).toBeInTheDocument();
    });

    it('should render all priority checkboxes when expanded', () => {
      render(<FilterControls {...defaultProps} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      expect(screen.getByTestId('filter-controls-priority-A')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-priority-B')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-priority-C')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-priority-D')).toBeInTheDocument();
    });

    it('should show message when no categories available', () => {
      render(<FilterControls {...defaultProps} categories={[]} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      expect(screen.getByText('No categories available')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Status Filter Tests
  // =============================================================================

  describe('status filter', () => {
    it('should check selected status checkboxes', () => {
      const statusFilter: TaskStatus[] = ['in_progress', 'complete'];
      render(<FilterControls {...defaultProps} statusFilter={statusFilter} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const inProgressCheckbox = screen.getByTestId('filter-controls-status-in_progress') as HTMLInputElement;
      const completeCheckbox = screen.getByTestId('filter-controls-status-complete') as HTMLInputElement;
      const forwardCheckbox = screen.getByTestId('filter-controls-status-forward') as HTMLInputElement;

      expect(inProgressCheckbox.checked).toBe(true);
      expect(completeCheckbox.checked).toBe(true);
      expect(forwardCheckbox.checked).toBe(false);
    });

    it('should call onStatusFilterChange when status checkbox clicked', () => {
      const onStatusFilterChange = vi.fn();
      render(<FilterControls {...defaultProps} onStatusFilterChange={onStatusFilterChange} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const inProgressCheckbox = screen.getByTestId('filter-controls-status-in_progress');
      fireEvent.click(inProgressCheckbox);

      expect(onStatusFilterChange).toHaveBeenCalledWith(['in_progress']);
    });

    it('should add status to existing filter', () => {
      const onStatusFilterChange = vi.fn();
      const statusFilter: TaskStatus[] = ['in_progress'];
      render(
        <FilterControls
          {...defaultProps}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const completeCheckbox = screen.getByTestId('filter-controls-status-complete');
      fireEvent.click(completeCheckbox);

      expect(onStatusFilterChange).toHaveBeenCalledWith(['in_progress', 'complete']);
    });

    it('should remove status from filter', () => {
      const onStatusFilterChange = vi.fn();
      const statusFilter: TaskStatus[] = ['in_progress', 'complete'];
      render(
        <FilterControls
          {...defaultProps}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const inProgressCheckbox = screen.getByTestId('filter-controls-status-in_progress');
      fireEvent.click(inProgressCheckbox);

      expect(onStatusFilterChange).toHaveBeenCalledWith(['complete']);
    });

    it('should pass null when last status is removed', () => {
      const onStatusFilterChange = vi.fn();
      const statusFilter: TaskStatus[] = ['in_progress'];
      render(
        <FilterControls
          {...defaultProps}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const inProgressCheckbox = screen.getByTestId('filter-controls-status-in_progress');
      fireEvent.click(inProgressCheckbox);

      expect(onStatusFilterChange).toHaveBeenCalledWith(null);
    });
  });

  // =============================================================================
  // Category Filter Tests
  // =============================================================================

  describe('category filter', () => {
    it('should check selected category checkboxes', () => {
      const categoryFilter = ['cat-1', 'cat-3'];
      render(<FilterControls {...defaultProps} categoryFilter={categoryFilter} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const cat1Checkbox = screen.getByTestId('filter-controls-category-cat-1') as HTMLInputElement;
      const cat2Checkbox = screen.getByTestId('filter-controls-category-cat-2') as HTMLInputElement;
      const cat3Checkbox = screen.getByTestId('filter-controls-category-cat-3') as HTMLInputElement;

      expect(cat1Checkbox.checked).toBe(true);
      expect(cat2Checkbox.checked).toBe(false);
      expect(cat3Checkbox.checked).toBe(true);
    });

    it('should call onCategoryFilterChange when category checkbox clicked', () => {
      const onCategoryFilterChange = vi.fn();
      render(<FilterControls {...defaultProps} onCategoryFilterChange={onCategoryFilterChange} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const cat1Checkbox = screen.getByTestId('filter-controls-category-cat-1');
      fireEvent.click(cat1Checkbox);

      expect(onCategoryFilterChange).toHaveBeenCalledWith(['cat-1']);
    });

    it('should add category to existing filter', () => {
      const onCategoryFilterChange = vi.fn();
      const categoryFilter = ['cat-1'];
      render(
        <FilterControls
          {...defaultProps}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const cat2Checkbox = screen.getByTestId('filter-controls-category-cat-2');
      fireEvent.click(cat2Checkbox);

      expect(onCategoryFilterChange).toHaveBeenCalledWith(['cat-1', 'cat-2']);
    });

    it('should remove category from filter', () => {
      const onCategoryFilterChange = vi.fn();
      const categoryFilter = ['cat-1', 'cat-2'];
      render(
        <FilterControls
          {...defaultProps}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const cat1Checkbox = screen.getByTestId('filter-controls-category-cat-1');
      fireEvent.click(cat1Checkbox);

      expect(onCategoryFilterChange).toHaveBeenCalledWith(['cat-2']);
    });

    it('should pass null when last category is removed', () => {
      const onCategoryFilterChange = vi.fn();
      const categoryFilter = ['cat-1'];
      render(
        <FilterControls
          {...defaultProps}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const cat1Checkbox = screen.getByTestId('filter-controls-category-cat-1');
      fireEvent.click(cat1Checkbox);

      expect(onCategoryFilterChange).toHaveBeenCalledWith(null);
    });
  });

  // =============================================================================
  // Priority Filter Tests
  // =============================================================================

  describe('priority filter', () => {
    it('should check selected priority checkboxes', () => {
      const priorityFilter: PriorityLetter[] = ['A', 'C'];
      render(<FilterControls {...defaultProps} priorityFilter={priorityFilter} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const priorityACheckbox = screen.getByTestId('filter-controls-priority-A') as HTMLInputElement;
      const priorityBCheckbox = screen.getByTestId('filter-controls-priority-B') as HTMLInputElement;
      const priorityCCheckbox = screen.getByTestId('filter-controls-priority-C') as HTMLInputElement;

      expect(priorityACheckbox.checked).toBe(true);
      expect(priorityBCheckbox.checked).toBe(false);
      expect(priorityCCheckbox.checked).toBe(true);
    });

    it('should call onPriorityFilterChange when priority checkbox clicked', () => {
      const onPriorityFilterChange = vi.fn();
      render(<FilterControls {...defaultProps} onPriorityFilterChange={onPriorityFilterChange} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const priorityACheckbox = screen.getByTestId('filter-controls-priority-A');
      fireEvent.click(priorityACheckbox);

      expect(onPriorityFilterChange).toHaveBeenCalledWith(['A']);
    });

    it('should add priority to existing filter', () => {
      const onPriorityFilterChange = vi.fn();
      const priorityFilter: PriorityLetter[] = ['A'];
      render(
        <FilterControls
          {...defaultProps}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={onPriorityFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const priorityBCheckbox = screen.getByTestId('filter-controls-priority-B');
      fireEvent.click(priorityBCheckbox);

      expect(onPriorityFilterChange).toHaveBeenCalledWith(['A', 'B']);
    });

    it('should remove priority from filter', () => {
      const onPriorityFilterChange = vi.fn();
      const priorityFilter: PriorityLetter[] = ['A', 'B'];
      render(
        <FilterControls
          {...defaultProps}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={onPriorityFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const priorityACheckbox = screen.getByTestId('filter-controls-priority-A');
      fireEvent.click(priorityACheckbox);

      expect(onPriorityFilterChange).toHaveBeenCalledWith(['B']);
    });

    it('should pass null when last priority is removed', () => {
      const onPriorityFilterChange = vi.fn();
      const priorityFilter: PriorityLetter[] = ['A'];
      render(
        <FilterControls
          {...defaultProps}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={onPriorityFilterChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const priorityACheckbox = screen.getByTestId('filter-controls-priority-A');
      fireEvent.click(priorityACheckbox);

      expect(onPriorityFilterChange).toHaveBeenCalledWith(null);
    });
  });

  // =============================================================================
  // Clear All Filters Tests
  // =============================================================================

  describe('clear all filters', () => {
    it('should call onClearAllFilters when clear button clicked', () => {
      const onClearAllFilters = vi.fn();
      render(
        <FilterControls
          {...defaultProps}
          activeFilterCount={1}
          onClearAllFilters={onClearAllFilters}
        />
      );

      const clearButton = screen.getByTestId('filter-controls-clear-all');
      fireEvent.click(clearButton);

      expect(onClearAllFilters).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('accessibility', () => {
    it('should have accessible badge label', () => {
      render(<FilterControls {...defaultProps} activeFilterCount={2} />);

      const badge = screen.getByTestId('filter-controls-count-badge');
      expect(badge).toHaveAttribute('aria-label', '2 active filters');
    });

    it('should have singular label for one filter', () => {
      render(<FilterControls {...defaultProps} activeFilterCount={1} />);

      const badge = screen.getByTestId('filter-controls-count-badge');
      expect(badge).toHaveAttribute('aria-label', '1 active filter');
    });

    it('should have correct aria-expanded attribute', () => {
      const { rerender } = render(<FilterControls {...defaultProps} />);

      const toggleButton = screen.getByTestId('filter-controls-toggle');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton);
      rerender(<FilterControls {...defaultProps} />);

      // After click, it should be expanded
      expect(screen.getByTestId('filter-controls-toggle')).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper checkbox labels', () => {
      render(<FilterControls {...defaultProps} />);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      // Check that labels are associated with checkboxes
      expect(screen.getByLabelText(/In Progress/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Complete/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Work/)).toBeInTheDocument();
      expect(screen.getByLabelText(/A - Vital/)).toBeInTheDocument();
    });
  });
});
