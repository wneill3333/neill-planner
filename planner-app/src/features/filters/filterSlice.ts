/**
 * Filter Slice
 *
 * Redux Toolkit slice for task filter state management.
 * Supports filtering tasks by status, category, and priority with AND logic.
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { TaskStatus, PriorityLetter } from '../../types';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the filters slice
 */
export interface FiltersState {
  /** Filter by task status (null = no filter, array = filter by these statuses) */
  statusFilter: TaskStatus[] | null;
  /** Filter by category ID (null = no filter, array = filter by these categories) */
  categoryFilter: string[] | null;
  /** Filter by priority letter (null = no filter, array = filter by these priorities) */
  priorityFilter: PriorityLetter[] | null;
  /** Hide tasks with status 'complete', 'forward', or 'delegate' */
  hideCompletedTasks: boolean;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: FiltersState = {
  statusFilter: null,
  categoryFilter: null,
  priorityFilter: null,
  hideCompletedTasks: false,
};

// =============================================================================
// Slice
// =============================================================================

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    /**
     * Set status filter
     * Pass null to clear, or array of statuses to filter by
     */
    setStatusFilter: (state, action: PayloadAction<TaskStatus[] | null>) => {
      state.statusFilter = action.payload;
    },

    /**
     * Set category filter
     * Pass null to clear, or array of category IDs to filter by
     */
    setCategoryFilter: (state, action: PayloadAction<string[] | null>) => {
      state.categoryFilter = action.payload;
    },

    /**
     * Set priority filter
     * Pass null to clear, or array of priority letters to filter by
     */
    setPriorityFilter: (state, action: PayloadAction<PriorityLetter[] | null>) => {
      state.priorityFilter = action.payload;
    },

    /**
     * Toggle hide completed tasks
     */
    toggleHideCompletedTasks: (state) => {
      state.hideCompletedTasks = !state.hideCompletedTasks;
    },

    /**
     * Clear all active filters
     */
    clearAllFilters: (state) => {
      state.statusFilter = null;
      state.categoryFilter = null;
      state.priorityFilter = null;
      state.hideCompletedTasks = false;
    },
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  setStatusFilter,
  setCategoryFilter,
  setPriorityFilter,
  toggleHideCompletedTasks,
  clearAllFilters,
} = filterSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select status filter
 */
export const selectStatusFilter = (state: RootState): TaskStatus[] | null =>
  state.filters.statusFilter;

/**
 * Select category filter
 */
export const selectCategoryFilter = (state: RootState): string[] | null =>
  state.filters.categoryFilter;

/**
 * Select priority filter
 */
export const selectPriorityFilter = (state: RootState): PriorityLetter[] | null =>
  state.filters.priorityFilter;

/**
 * Select hide completed tasks toggle state
 */
export const selectHideCompletedTasks = (state: RootState): boolean =>
  state.filters.hideCompletedTasks;

/**
 * Select whether any filters are active
 */
export const selectIsFiltersActive = createSelector(
  [selectStatusFilter, selectCategoryFilter, selectPriorityFilter, selectHideCompletedTasks],
  (statusFilter, categoryFilter, priorityFilter, hideCompleted): boolean => {
    return (
      (statusFilter !== null && statusFilter.length > 0) ||
      (categoryFilter !== null && categoryFilter.length > 0) ||
      (priorityFilter !== null && priorityFilter.length > 0) ||
      hideCompleted
    );
  }
);

/**
 * Select count of active filters
 */
export const selectActiveFilterCount = createSelector(
  [selectStatusFilter, selectCategoryFilter, selectPriorityFilter, selectHideCompletedTasks],
  (statusFilter, categoryFilter, priorityFilter, hideCompleted): number => {
    let count = 0;
    if (statusFilter !== null && statusFilter.length > 0) count++;
    if (categoryFilter !== null && categoryFilter.length > 0) count++;
    if (priorityFilter !== null && priorityFilter.length > 0) count++;
    if (hideCompleted) count++;
    return count;
  }
);

// =============================================================================
// Reducer
// =============================================================================

export default filterSlice.reducer;
