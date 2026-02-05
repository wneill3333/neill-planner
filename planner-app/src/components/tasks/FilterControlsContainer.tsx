/**
 * FilterControlsContainer Component
 *
 * Container component that connects FilterControls to Redux store.
 * Handles fetching filter state and dispatching filter actions.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectStatusFilter,
  selectCategoryFilter,
  selectPriorityFilter,
  selectActiveFilterCount,
  setStatusFilter,
  setCategoryFilter,
  setPriorityFilter,
  clearAllFilters,
} from '../../features/filters/filterSlice';
import { selectAllCategories } from '../../features/categories/categorySlice';
import { FilterControls } from './FilterControls';
import type { TaskStatus, PriorityLetter } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface FilterControlsContainerProps {
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * FilterControlsContainer - Connects FilterControls to Redux store
 */
export function FilterControlsContainer({ testId }: FilterControlsContainerProps) {
  const dispatch = useAppDispatch();

  // Select filter state from Redux
  const statusFilter = useAppSelector(selectStatusFilter);
  const categoryFilter = useAppSelector(selectCategoryFilter);
  const priorityFilter = useAppSelector(selectPriorityFilter);
  const activeFilterCount = useAppSelector(selectActiveFilterCount);

  // Select categories for filter dropdown
  const categories = useAppSelector(selectAllCategories);

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (statuses: TaskStatus[] | null) => {
      dispatch(setStatusFilter(statuses));
    },
    [dispatch]
  );

  // Handle category filter change
  const handleCategoryFilterChange = useCallback(
    (categoryIds: string[] | null) => {
      dispatch(setCategoryFilter(categoryIds));
    },
    [dispatch]
  );

  // Handle priority filter change
  const handlePriorityFilterChange = useCallback(
    (priorities: PriorityLetter[] | null) => {
      dispatch(setPriorityFilter(priorities));
    },
    [dispatch]
  );

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    dispatch(clearAllFilters());
  }, [dispatch]);

  return (
    <FilterControls
      statusFilter={statusFilter}
      categoryFilter={categoryFilter}
      priorityFilter={priorityFilter}
      categories={categories}
      activeFilterCount={activeFilterCount}
      onStatusFilterChange={handleStatusFilterChange}
      onCategoryFilterChange={handleCategoryFilterChange}
      onPriorityFilterChange={handlePriorityFilterChange}
      onClearAllFilters={handleClearAllFilters}
      testId={testId}
    />
  );
}

export default FilterControlsContainer;
