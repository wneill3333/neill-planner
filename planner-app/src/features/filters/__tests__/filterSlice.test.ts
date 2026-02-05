/**
 * Filter Slice Tests
 *
 * Tests for the filter Redux slice, including reducers and selectors.
 */

import { describe, it, expect } from 'vitest';
import filterReducer, {
  setStatusFilter,
  setCategoryFilter,
  setPriorityFilter,
  clearAllFilters,
  selectStatusFilter,
  selectCategoryFilter,
  selectPriorityFilter,
  selectIsFiltersActive,
  selectActiveFilterCount,
  type FiltersState,
} from '../filterSlice';
import type { TaskStatus, PriorityLetter } from '../../../types';

// =============================================================================
// Test Setup
// =============================================================================

const initialState: FiltersState = {
  statusFilter: null,
  categoryFilter: null,
  priorityFilter: null,
};

// Mock RootState for selectors
const createMockRootState = (filtersState: FiltersState) => ({
  filters: filtersState,
  tasks: {},
  categories: {},
  events: {},
  notes: {},
  googleCalendar: {},
  reminders: {},
  sync: {},
  settings: {},
});

// =============================================================================
// Reducer Tests
// =============================================================================

describe('filterSlice reducer', () => {
  describe('setStatusFilter', () => {
    it('should set status filter', () => {
      const statuses: TaskStatus[] = ['in_progress', 'complete'];
      const nextState = filterReducer(initialState, setStatusFilter(statuses));

      expect(nextState.statusFilter).toEqual(statuses);
      expect(nextState.categoryFilter).toBeNull();
      expect(nextState.priorityFilter).toBeNull();
    });

    it('should clear status filter when passed null', () => {
      const stateWithFilter: FiltersState = {
        ...initialState,
        statusFilter: ['in_progress'],
      };
      const nextState = filterReducer(stateWithFilter, setStatusFilter(null));

      expect(nextState.statusFilter).toBeNull();
    });

    it('should handle empty array', () => {
      const nextState = filterReducer(initialState, setStatusFilter([]));

      expect(nextState.statusFilter).toEqual([]);
    });
  });

  describe('setCategoryFilter', () => {
    it('should set category filter', () => {
      const categories = ['cat-1', 'cat-2', 'cat-3'];
      const nextState = filterReducer(initialState, setCategoryFilter(categories));

      expect(nextState.categoryFilter).toEqual(categories);
      expect(nextState.statusFilter).toBeNull();
      expect(nextState.priorityFilter).toBeNull();
    });

    it('should clear category filter when passed null', () => {
      const stateWithFilter: FiltersState = {
        ...initialState,
        categoryFilter: ['cat-1'],
      };
      const nextState = filterReducer(stateWithFilter, setCategoryFilter(null));

      expect(nextState.categoryFilter).toBeNull();
    });

    it('should handle empty array', () => {
      const nextState = filterReducer(initialState, setCategoryFilter([]));

      expect(nextState.categoryFilter).toEqual([]);
    });
  });

  describe('setPriorityFilter', () => {
    it('should set priority filter', () => {
      const priorities: PriorityLetter[] = ['A', 'B'];
      const nextState = filterReducer(initialState, setPriorityFilter(priorities));

      expect(nextState.priorityFilter).toEqual(priorities);
      expect(nextState.statusFilter).toBeNull();
      expect(nextState.categoryFilter).toBeNull();
    });

    it('should clear priority filter when passed null', () => {
      const stateWithFilter: FiltersState = {
        ...initialState,
        priorityFilter: ['A'],
      };
      const nextState = filterReducer(stateWithFilter, setPriorityFilter(null));

      expect(nextState.priorityFilter).toBeNull();
    });

    it('should handle empty array', () => {
      const nextState = filterReducer(initialState, setPriorityFilter([]));

      expect(nextState.priorityFilter).toEqual([]);
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters', () => {
      const stateWithFilters: FiltersState = {
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: ['A'],
      };
      const nextState = filterReducer(stateWithFilters, clearAllFilters());

      expect(nextState.statusFilter).toBeNull();
      expect(nextState.categoryFilter).toBeNull();
      expect(nextState.priorityFilter).toBeNull();
    });

    it('should work when no filters are active', () => {
      const nextState = filterReducer(initialState, clearAllFilters());

      expect(nextState.statusFilter).toBeNull();
      expect(nextState.categoryFilter).toBeNull();
      expect(nextState.priorityFilter).toBeNull();
    });
  });

  describe('combined filter operations', () => {
    it('should allow setting multiple filters sequentially', () => {
      let state = initialState;
      state = filterReducer(state, setStatusFilter(['in_progress']));
      state = filterReducer(state, setCategoryFilter(['cat-1']));
      state = filterReducer(state, setPriorityFilter(['A']));

      expect(state.statusFilter).toEqual(['in_progress']);
      expect(state.categoryFilter).toEqual(['cat-1']);
      expect(state.priorityFilter).toEqual(['A']);
    });

    it('should allow updating existing filters', () => {
      let state: FiltersState = {
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: ['A'],
      };

      state = filterReducer(state, setStatusFilter(['complete', 'forward']));
      state = filterReducer(state, setCategoryFilter(['cat-2', 'cat-3']));
      state = filterReducer(state, setPriorityFilter(['B', 'C']));

      expect(state.statusFilter).toEqual(['complete', 'forward']);
      expect(state.categoryFilter).toEqual(['cat-2', 'cat-3']);
      expect(state.priorityFilter).toEqual(['B', 'C']);
    });
  });
});

// =============================================================================
// Selector Tests
// =============================================================================

describe('filterSlice selectors', () => {
  describe('selectStatusFilter', () => {
    it('should return null when no filter is set', () => {
      const rootState = createMockRootState(initialState);
      const result = selectStatusFilter(rootState);

      expect(result).toBeNull();
    });

    it('should return status filter when set', () => {
      const statuses: TaskStatus[] = ['in_progress', 'complete'];
      const rootState = createMockRootState({ ...initialState, statusFilter: statuses });
      const result = selectStatusFilter(rootState);

      expect(result).toEqual(statuses);
    });
  });

  describe('selectCategoryFilter', () => {
    it('should return null when no filter is set', () => {
      const rootState = createMockRootState(initialState);
      const result = selectCategoryFilter(rootState);

      expect(result).toBeNull();
    });

    it('should return category filter when set', () => {
      const categories = ['cat-1', 'cat-2'];
      const rootState = createMockRootState({ ...initialState, categoryFilter: categories });
      const result = selectCategoryFilter(rootState);

      expect(result).toEqual(categories);
    });
  });

  describe('selectPriorityFilter', () => {
    it('should return null when no filter is set', () => {
      const rootState = createMockRootState(initialState);
      const result = selectPriorityFilter(rootState);

      expect(result).toBeNull();
    });

    it('should return priority filter when set', () => {
      const priorities: PriorityLetter[] = ['A', 'B'];
      const rootState = createMockRootState({ ...initialState, priorityFilter: priorities });
      const result = selectPriorityFilter(rootState);

      expect(result).toEqual(priorities);
    });
  });

  describe('selectIsFiltersActive', () => {
    it('should return false when no filters are set', () => {
      const rootState = createMockRootState(initialState);
      const result = selectIsFiltersActive(rootState);

      expect(result).toBe(false);
    });

    it('should return false when filters are empty arrays', () => {
      const rootState = createMockRootState({
        statusFilter: [],
        categoryFilter: [],
        priorityFilter: [],
      });
      const result = selectIsFiltersActive(rootState);

      expect(result).toBe(false);
    });

    it('should return true when status filter is set', () => {
      const rootState = createMockRootState({
        ...initialState,
        statusFilter: ['in_progress'],
      });
      const result = selectIsFiltersActive(rootState);

      expect(result).toBe(true);
    });

    it('should return true when category filter is set', () => {
      const rootState = createMockRootState({
        ...initialState,
        categoryFilter: ['cat-1'],
      });
      const result = selectIsFiltersActive(rootState);

      expect(result).toBe(true);
    });

    it('should return true when priority filter is set', () => {
      const rootState = createMockRootState({
        ...initialState,
        priorityFilter: ['A'],
      });
      const result = selectIsFiltersActive(rootState);

      expect(result).toBe(true);
    });

    it('should return true when multiple filters are set', () => {
      const rootState = createMockRootState({
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: ['A'],
      });
      const result = selectIsFiltersActive(rootState);

      expect(result).toBe(true);
    });
  });

  describe('selectActiveFilterCount', () => {
    it('should return 0 when no filters are set', () => {
      const rootState = createMockRootState(initialState);
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(0);
    });

    it('should return 0 when filters are empty arrays', () => {
      const rootState = createMockRootState({
        statusFilter: [],
        categoryFilter: [],
        priorityFilter: [],
      });
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(0);
    });

    it('should return 1 when status filter is set', () => {
      const rootState = createMockRootState({
        ...initialState,
        statusFilter: ['in_progress'],
      });
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(1);
    });

    it('should return 1 when category filter is set', () => {
      const rootState = createMockRootState({
        ...initialState,
        categoryFilter: ['cat-1'],
      });
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(1);
    });

    it('should return 1 when priority filter is set', () => {
      const rootState = createMockRootState({
        ...initialState,
        priorityFilter: ['A'],
      });
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(1);
    });

    it('should return 2 when two filters are set', () => {
      const rootState = createMockRootState({
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: null,
      });
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(2);
    });

    it('should return 3 when all filters are set', () => {
      const rootState = createMockRootState({
        statusFilter: ['in_progress'],
        categoryFilter: ['cat-1'],
        priorityFilter: ['A'],
      });
      const result = selectActiveFilterCount(rootState);

      expect(result).toBe(3);
    });
  });
});
