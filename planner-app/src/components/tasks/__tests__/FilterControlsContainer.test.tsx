/**
 * FilterControlsContainer Component Tests
 *
 * Tests for the FilterControlsContainer Redux integration component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FilterControlsContainer } from '../FilterControlsContainer';
import filterReducer from '../../../features/filters/filterSlice';
import categoryReducer from '../../../features/categories/categorySlice';
import type { Category } from '../../../types';

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
];

function createMockStore(initialFiltersState = {}, initialCategoriesState = {}) {
  return configureStore({
    reducer: {
      filters: filterReducer,
      categories: categoryReducer,
    },
    preloadedState: {
      filters: {
        statusFilter: null,
        categoryFilter: null,
        priorityFilter: null,
        ...initialFiltersState,
      },
      categories: {
        categories: {},
        categoryIds: [],
        initialized: false,
        loading: false,
        error: null,
        syncStatus: 'synced',
        ...initialCategoriesState,
      },
    },
  });
}

function renderWithStore(ui: React.ReactElement, store: ReturnType<typeof createMockStore>) {
  return render(<Provider store={store}>{ui}</Provider>);
}

// =============================================================================
// Component Tests
// =============================================================================

describe('FilterControlsContainer', () => {
  describe('rendering', () => {
    it('should render without errors', () => {
      const store = createMockStore();
      renderWithStore(<FilterControlsContainer />, store);

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should pass categories from Redux to FilterControls', () => {
      const categoriesMap = {
        'cat-1': mockCategories[0],
        'cat-2': mockCategories[1],
      };
      const store = createMockStore({}, {
        categories: categoriesMap,
        categoryIds: ['cat-1', 'cat-2'],
        initialized: true,
      });
      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      expect(screen.getByTestId('filter-controls-category-cat-1')).toBeInTheDocument();
      expect(screen.getByTestId('filter-controls-category-cat-2')).toBeInTheDocument();
    });

    it('should reflect filter state from Redux', () => {
      const store = createMockStore({
        statusFilter: ['in_progress'],
        categoryFilter: null,
        priorityFilter: ['A'],
      });
      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const statusCheckbox = screen.getByTestId('filter-controls-status-in_progress') as HTMLInputElement;
      const priorityCheckbox = screen.getByTestId('filter-controls-priority-A') as HTMLInputElement;

      expect(statusCheckbox.checked).toBe(true);
      expect(priorityCheckbox.checked).toBe(true);
    });

    it('should show active filter count from Redux', () => {
      const store = createMockStore({
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: null,
      });
      renderWithStore(<FilterControlsContainer />, store);

      const badge = screen.getByTestId('filter-controls-count-badge');
      expect(badge).toHaveTextContent('2');
    });
  });

  describe('filter interactions', () => {
    it('should dispatch setStatusFilter when status checkbox is clicked', () => {
      const store = createMockStore();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const statusCheckbox = screen.getByTestId('filter-controls-status-in_progress');
      fireEvent.click(statusCheckbox);

      expect(dispatchSpy).toHaveBeenCalled();

      // Check that the store state was updated
      const state = store.getState();
      expect(state.filters.statusFilter).toEqual(['in_progress']);
    });

    it('should dispatch setCategoryFilter when category checkbox is clicked', () => {
      const categoriesMap = { 'cat-1': mockCategories[0] };
      const store = createMockStore({}, {
        categories: categoriesMap,
        categoryIds: ['cat-1'],
        initialized: true,
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const categoryCheckbox = screen.getByTestId('filter-controls-category-cat-1');
      fireEvent.click(categoryCheckbox);

      expect(dispatchSpy).toHaveBeenCalled();

      // Check that the store state was updated
      const state = store.getState();
      expect(state.filters.categoryFilter).toEqual(['cat-1']);
    });

    it('should dispatch setPriorityFilter when priority checkbox is clicked', () => {
      const store = createMockStore();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      const priorityCheckbox = screen.getByTestId('filter-controls-priority-A');
      fireEvent.click(priorityCheckbox);

      expect(dispatchSpy).toHaveBeenCalled();

      // Check that the store state was updated
      const state = store.getState();
      expect(state.filters.priorityFilter).toEqual(['A']);
    });

    it('should dispatch clearAllFilters when clear button is clicked', () => {
      const store = createMockStore({
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: ['A'],
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderWithStore(<FilterControlsContainer />, store);

      const clearButton = screen.getByTestId('filter-controls-clear-all');
      fireEvent.click(clearButton);

      expect(dispatchSpy).toHaveBeenCalled();

      // Check that all filters were cleared
      const state = store.getState();
      expect(state.filters.statusFilter).toBeNull();
      expect(state.filters.categoryFilter).toBeNull();
      expect(state.filters.priorityFilter).toBeNull();
    });
  });

  describe('multiple filter changes', () => {
    it('should handle setting multiple filters sequentially', () => {
      const store = createMockStore();

      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      // Set status filter
      fireEvent.click(screen.getByTestId('filter-controls-status-in_progress'));

      // Set priority filter
      fireEvent.click(screen.getByTestId('filter-controls-priority-A'));

      // Check state
      const state = store.getState();
      expect(state.filters.statusFilter).toEqual(['in_progress']);
      expect(state.filters.priorityFilter).toEqual(['A']);
    });

    it('should handle adding and removing filters', () => {
      const store = createMockStore({
        statusFilter: ['in_progress'],
      });

      renderWithStore(<FilterControlsContainer />, store);

      fireEvent.click(screen.getByTestId('filter-controls-toggle'));

      // Add another status
      fireEvent.click(screen.getByTestId('filter-controls-status-complete'));

      let state = store.getState();
      expect(state.filters.statusFilter).toEqual(['in_progress', 'complete']);

      // Remove the first status
      fireEvent.click(screen.getByTestId('filter-controls-status-in_progress'));

      state = store.getState();
      expect(state.filters.statusFilter).toEqual(['complete']);
    });
  });

  describe('testId prop', () => {
    it('should pass custom testId to FilterControls', () => {
      const store = createMockStore();
      renderWithStore(<FilterControlsContainer testId="custom-filters" />, store);

      expect(screen.getByTestId('custom-filters')).toBeInTheDocument();
      expect(screen.getByTestId('custom-filters-toggle')).toBeInTheDocument();
    });
  });
});
