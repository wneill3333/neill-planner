/**
 * Category Slice
 *
 * Redux Toolkit slice for category state management.
 * Handles normalized category storage and CRUD operations.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Category, SyncStatus } from '../../types';
import type { RootState } from '../../store';
import {
  fetchCategories,
  createCategory as createCategoryThunk,
  updateCategoryAsync,
  deleteCategory,
} from './categoryThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the categories slice
 */
export interface CategoriesState {
  /** Normalized categories storage - categories indexed by ID */
  categories: Record<string, Category>;
  /** Array of category IDs in sort order */
  categoryIds: string[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sync status with backend */
  syncStatus: SyncStatus;
  /** Whether categories have been loaded */
  initialized: boolean;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: CategoriesState = {
  categories: {},
  categoryIds: [],
  loading: false,
  error: null,
  syncStatus: 'synced',
  initialized: false,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sort category IDs by sortOrder, then by name alphabetically.
 *
 * This helper is used across multiple reducers to maintain consistent
 * category ordering. Extracted to reduce code duplication.
 *
 * @param categoryIds - Array of category IDs to sort
 * @param categories - Record of categories indexed by ID
 */
function sortCategoryIds(
  categoryIds: string[],
  categories: Record<string, Category>
): void {
  categoryIds.sort((a, b) => {
    const catA = categories[a];
    const catB = categories[b];
    if (catA.sortOrder !== catB.sortOrder) {
      return catA.sortOrder - catB.sortOrder;
    }
    return catA.name.localeCompare(catB.name);
  });
}

// =============================================================================
// Slice
// =============================================================================

export const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    /**
     * Set all categories (replaces existing)
     */
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = {};
      state.categoryIds = [];

      for (const category of action.payload) {
        state.categories[category.id] = category;
        state.categoryIds.push(category.id);
      }

      sortCategoryIds(state.categoryIds, state.categories);
      state.initialized = true;
    },

    /**
     * Add a single category
     */
    addCategory: (state, action: PayloadAction<Category>) => {
      const category = action.payload;
      state.categories[category.id] = category;

      if (!state.categoryIds.includes(category.id)) {
        state.categoryIds.push(category.id);
        sortCategoryIds(state.categoryIds, state.categories);
      }
    },

    /**
     * Update an existing category
     */
    updateCategory: (state, action: PayloadAction<Partial<Category> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const existingCategory = state.categories[id];

      if (!existingCategory) return;

      state.categories[id] = { ...existingCategory, ...updates };

      // Re-sort if sortOrder or name changed
      if ('sortOrder' in updates || 'name' in updates) {
        sortCategoryIds(state.categoryIds, state.categories);
      }
    },

    /**
     * Remove a category
     */
    removeCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;

      if (!state.categories[categoryId]) return;

      delete state.categories[categoryId];
      state.categoryIds = state.categoryIds.filter((id) => id !== categoryId);
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Set sync status
     */
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },

    /**
     * Clear all categories (useful for logout)
     */
    clearCategories: (state) => {
      state.categories = {};
      state.categoryIds = [];
      state.error = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    // ==========================================================================
    // fetchCategories
    // ==========================================================================
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.syncStatus = 'syncing';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.syncStatus = 'synced';
        state.initialized = true;

        // Clear and reset categories
        state.categories = {};
        state.categoryIds = [];

        for (const category of action.payload) {
          state.categories[category.id] = category;
          state.categoryIds.push(category.id);
        }

        // Sort using helper function
        sortCategoryIds(state.categoryIds, state.categories);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch categories';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // createCategory
    // ==========================================================================
    builder
      .addCase(createCategoryThunk.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        const category = action.payload;
        state.categories[category.id] = category;
        state.categoryIds.push(category.id);

        // Re-sort using helper function
        sortCategoryIds(state.categoryIds, state.categories);

        state.syncStatus = 'synced';
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to create category';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // updateCategoryAsync
    // ==========================================================================
    builder
      .addCase(updateCategoryAsync.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        const updatedCategory = action.payload;
        state.categories[updatedCategory.id] = updatedCategory;

        // Re-sort using helper function
        sortCategoryIds(state.categoryIds, state.categories);

        state.syncStatus = 'synced';
      })
      .addCase(updateCategoryAsync.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update category';
        state.syncStatus = 'error';
      });

    // ==========================================================================
    // deleteCategory
    // ==========================================================================
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const categoryId = action.payload;
        delete state.categories[categoryId];
        state.categoryIds = state.categoryIds.filter((id) => id !== categoryId);
        state.syncStatus = 'synced';
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete category';
        state.syncStatus = 'error';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setLoading,
  setError,
  setSyncStatus,
  clearCategories,
} = categorySlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all categories as an array (sorted)
 */
export const selectAllCategories = (state: RootState): Category[] =>
  state.categories.categoryIds.map((id) => state.categories.categories[id]);

/**
 * Select a category by ID
 */
export const selectCategoryById = (state: RootState, categoryId: string): Category | undefined =>
  state.categories.categories[categoryId];

/**
 * Select all category IDs
 */
export const selectCategoryIds = (state: RootState): string[] => state.categories.categoryIds;

/**
 * Select categories loading state
 */
export const selectCategoriesLoading = (state: RootState): boolean => state.categories.loading;

/**
 * Select categories error state
 */
export const selectCategoriesError = (state: RootState): string | null => state.categories.error;

/**
 * Select categories sync status
 */
export const selectCategoriesSyncStatus = (state: RootState): SyncStatus =>
  state.categories.syncStatus;

/**
 * Select whether categories have been initialized
 */
export const selectCategoriesInitialized = (state: RootState): boolean =>
  state.categories.initialized;

/**
 * Select category count
 */
export const selectCategoryCount = (state: RootState): number => state.categories.categoryIds.length;

/**
 * Select category by name (case-insensitive)
 */
export const selectCategoryByName = (state: RootState, name: string): Category | undefined =>
  Object.values(state.categories.categories).find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );

/**
 * Select categories as a map for quick lookup
 */
export const selectCategoriesMap = (state: RootState): Record<string, Category> =>
  state.categories.categories;

// =============================================================================
// Reducer Export
// =============================================================================

export default categorySlice.reducer;
