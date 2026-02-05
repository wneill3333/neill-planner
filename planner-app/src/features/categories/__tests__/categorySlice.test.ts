/**
 * Category Slice Tests
 *
 * Comprehensive tests for the category Redux slice.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import categoryReducer, {
  initialState,
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setLoading,
  setError,
  setSyncStatus,
  clearCategories,
  selectAllCategories,
  selectCategoryById,
  selectCategoryIds,
  selectCategoriesLoading,
  selectCategoriesError,
  selectCategoriesSyncStatus,
  selectCategoriesInitialized,
  selectCategoryCount,
  selectCategoryByName,
  selectCategoriesMap,
} from '../categorySlice';
import type { Category } from '../../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestStore(preloadedState?: Partial<typeof initialState>) {
  return configureStore({
    reducer: {
      categories: categoryReducer,
    },
    preloadedState: preloadedState
      ? { categories: { ...initialState, ...preloadedState } }
      : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ['categories.categories'],
        },
      }),
  });
}

function createMockCategory(overrides: Partial<Category> = {}): Category {
  const now = new Date();
  return {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#3B82F6',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Category Slice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().categories;

      expect(state.categories).toEqual({});
      expect(state.categoryIds).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('synced');
      expect(state.initialized).toBe(false);
    });
  });

  describe('setCategories reducer', () => {
    it('should set categories and mark as initialized', () => {
      const store = createTestStore();
      const categories = [
        createMockCategory({ id: 'cat-1', name: 'Work', sortOrder: 0 }),
        createMockCategory({ id: 'cat-2', name: 'Personal', sortOrder: 1 }),
      ];

      store.dispatch(setCategories(categories));

      const state = store.getState().categories;
      expect(Object.keys(state.categories)).toHaveLength(2);
      expect(state.categoryIds).toHaveLength(2);
      expect(state.initialized).toBe(true);
    });

    it('should sort categories by sortOrder then name', () => {
      const store = createTestStore();
      const categories = [
        createMockCategory({ id: 'cat-1', name: 'Zebra', sortOrder: 1 }),
        createMockCategory({ id: 'cat-2', name: 'Alpha', sortOrder: 1 }),
        createMockCategory({ id: 'cat-3', name: 'Beta', sortOrder: 0 }),
      ];

      store.dispatch(setCategories(categories));

      const state = store.getState().categories;
      // sortOrder 0 first, then sortOrder 1 alphabetically
      expect(state.categoryIds).toEqual(['cat-3', 'cat-2', 'cat-1']);
    });

    it('should replace existing categories', () => {
      const oldCategory = createMockCategory({ id: 'old-cat', name: 'Old' });
      const store = createTestStore({
        categories: { 'old-cat': oldCategory },
        categoryIds: ['old-cat'],
      });

      const newCategory = createMockCategory({ id: 'new-cat', name: 'New' });
      store.dispatch(setCategories([newCategory]));

      const state = store.getState().categories;
      expect(state.categories['old-cat']).toBeUndefined();
      expect(state.categories['new-cat']).toBeDefined();
    });
  });

  describe('addCategory reducer', () => {
    it('should add a category', () => {
      const store = createTestStore();
      const category = createMockCategory();

      store.dispatch(addCategory(category));

      const state = store.getState().categories;
      expect(state.categories['cat-1']).toBeDefined();
      expect(state.categoryIds).toContain('cat-1');
    });

    it('should not duplicate category ID if already exists', () => {
      const category = createMockCategory();
      const store = createTestStore({
        categories: { 'cat-1': category },
        categoryIds: ['cat-1'],
      });

      store.dispatch(addCategory({ ...category, name: 'Updated' }));

      const state = store.getState().categories;
      expect(state.categoryIds.filter((id) => id === 'cat-1')).toHaveLength(1);
    });

    it('should maintain sort order when adding', () => {
      const cat1 = createMockCategory({ id: 'cat-1', name: 'Work', sortOrder: 0 });
      const store = createTestStore({
        categories: { 'cat-1': cat1 },
        categoryIds: ['cat-1'],
      });

      const cat2 = createMockCategory({ id: 'cat-2', name: 'Alpha', sortOrder: 0 });
      store.dispatch(addCategory(cat2));

      const state = store.getState().categories;
      // Alpha should come before Work (both sortOrder 0, alphabetically)
      expect(state.categoryIds).toEqual(['cat-2', 'cat-1']);
    });
  });

  describe('updateCategory reducer', () => {
    it('should update category fields', () => {
      const category = createMockCategory();
      const store = createTestStore({
        categories: { 'cat-1': category },
        categoryIds: ['cat-1'],
      });

      store.dispatch(updateCategory({ id: 'cat-1', name: 'Personal', color: '#22C55E' }));

      const state = store.getState().categories;
      expect(state.categories['cat-1'].name).toBe('Personal');
      expect(state.categories['cat-1'].color).toBe('#22C55E');
    });

    it('should not update non-existent category', () => {
      const store = createTestStore();

      store.dispatch(updateCategory({ id: 'non-existent', name: 'New Name' }));

      const state = store.getState().categories;
      expect(state.categories['non-existent']).toBeUndefined();
    });

    it('should re-sort when sortOrder changes', () => {
      const cat1 = createMockCategory({ id: 'cat-1', name: 'Work', sortOrder: 0 });
      const cat2 = createMockCategory({ id: 'cat-2', name: 'Personal', sortOrder: 1 });
      const store = createTestStore({
        categories: { 'cat-1': cat1, 'cat-2': cat2 },
        categoryIds: ['cat-1', 'cat-2'],
      });

      store.dispatch(updateCategory({ id: 'cat-2', sortOrder: -1 }));

      const state = store.getState().categories;
      expect(state.categoryIds[0]).toBe('cat-2');
    });

    it('should re-sort when name changes', () => {
      const cat1 = createMockCategory({ id: 'cat-1', name: 'Beta', sortOrder: 0 });
      const cat2 = createMockCategory({ id: 'cat-2', name: 'Alpha', sortOrder: 0 });
      const store = createTestStore({
        categories: { 'cat-1': cat1, 'cat-2': cat2 },
        categoryIds: ['cat-2', 'cat-1'], // Alpha, Beta
      });

      store.dispatch(updateCategory({ id: 'cat-1', name: 'AAA' }));

      const state = store.getState().categories;
      expect(state.categoryIds[0]).toBe('cat-1'); // AAA comes first
    });
  });

  describe('removeCategory reducer', () => {
    it('should remove category', () => {
      const category = createMockCategory();
      const store = createTestStore({
        categories: { 'cat-1': category },
        categoryIds: ['cat-1'],
      });

      store.dispatch(removeCategory('cat-1'));

      const state = store.getState().categories;
      expect(state.categories['cat-1']).toBeUndefined();
      expect(state.categoryIds).not.toContain('cat-1');
    });

    it('should not fail when removing non-existent category', () => {
      const store = createTestStore();

      store.dispatch(removeCategory('non-existent'));

      const state = store.getState().categories;
      expect(state.categoryIds).toEqual([]);
    });
  });

  describe('setLoading reducer', () => {
    it('should set loading state', () => {
      const store = createTestStore();

      store.dispatch(setLoading(true));
      expect(store.getState().categories.loading).toBe(true);

      store.dispatch(setLoading(false));
      expect(store.getState().categories.loading).toBe(false);
    });
  });

  describe('setError reducer', () => {
    it('should set error message', () => {
      const store = createTestStore();

      store.dispatch(setError('Something went wrong'));
      expect(store.getState().categories.error).toBe('Something went wrong');

      store.dispatch(setError(null));
      expect(store.getState().categories.error).toBeNull();
    });
  });

  describe('setSyncStatus reducer', () => {
    it('should set sync status', () => {
      const store = createTestStore();

      store.dispatch(setSyncStatus('syncing'));
      expect(store.getState().categories.syncStatus).toBe('syncing');

      store.dispatch(setSyncStatus('error'));
      expect(store.getState().categories.syncStatus).toBe('error');

      store.dispatch(setSyncStatus('synced'));
      expect(store.getState().categories.syncStatus).toBe('synced');
    });
  });

  describe('clearCategories reducer', () => {
    it('should clear all categories', () => {
      const category = createMockCategory();
      const store = createTestStore({
        categories: { 'cat-1': category },
        categoryIds: ['cat-1'],
        initialized: true,
        error: 'Some error',
      });

      store.dispatch(clearCategories());

      const state = store.getState().categories;
      expect(state.categories).toEqual({});
      expect(state.categoryIds).toEqual([]);
      expect(state.initialized).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const cat1 = createMockCategory({ id: 'cat-1', name: 'Work', sortOrder: 0 });
    const cat2 = createMockCategory({ id: 'cat-2', name: 'Personal', sortOrder: 1 });

    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore({
        categories: { 'cat-1': cat1, 'cat-2': cat2 },
        categoryIds: ['cat-1', 'cat-2'],
        loading: false,
        error: 'Test error',
        syncStatus: 'synced',
        initialized: true,
      });
    });

    describe('selectAllCategories', () => {
      it('should return all categories as array including None category', () => {
        const result = selectAllCategories(store.getState());
        expect(result).toHaveLength(3); // None + 2 user categories
        expect(result[0].id).toBe('none'); // None category always first
        expect(result[0].name).toBe('None');
        expect(result[1].id).toBe('cat-1');
        expect(result[2].id).toBe('cat-2');
      });
    });

    describe('selectCategoryById', () => {
      it('should return category by ID', () => {
        const result = selectCategoryById(store.getState(), 'cat-1');
        expect(result?.name).toBe('Work');
      });

      it('should return undefined for non-existent ID', () => {
        const result = selectCategoryById(store.getState(), 'non-existent');
        expect(result).toBeUndefined();
      });
    });

    describe('selectCategoryIds', () => {
      it('should return category IDs in order', () => {
        const result = selectCategoryIds(store.getState());
        expect(result).toEqual(['cat-1', 'cat-2']);
      });
    });

    describe('selectCategoriesLoading', () => {
      it('should return loading state', () => {
        const result = selectCategoriesLoading(store.getState());
        expect(result).toBe(false);
      });
    });

    describe('selectCategoriesError', () => {
      it('should return error state', () => {
        const result = selectCategoriesError(store.getState());
        expect(result).toBe('Test error');
      });
    });

    describe('selectCategoriesSyncStatus', () => {
      it('should return sync status', () => {
        const result = selectCategoriesSyncStatus(store.getState());
        expect(result).toBe('synced');
      });
    });

    describe('selectCategoriesInitialized', () => {
      it('should return initialized state', () => {
        const result = selectCategoriesInitialized(store.getState());
        expect(result).toBe(true);
      });
    });

    describe('selectCategoryCount', () => {
      it('should return category count', () => {
        const result = selectCategoryCount(store.getState());
        expect(result).toBe(2);
      });
    });

    describe('selectCategoryByName', () => {
      it('should find category by name (case-insensitive)', () => {
        const result = selectCategoryByName(store.getState(), 'work');
        expect(result?.id).toBe('cat-1');
      });

      it('should return undefined if not found', () => {
        const result = selectCategoryByName(store.getState(), 'NonExistent');
        expect(result).toBeUndefined();
      });
    });

    describe('selectCategoriesMap', () => {
      it('should return categories as record', () => {
        const result = selectCategoriesMap(store.getState());
        expect(result['cat-1']).toBeDefined();
        expect(result['cat-2']).toBeDefined();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty category list', () => {
      const store = createTestStore();

      const allCategories = selectAllCategories(store.getState());
      const count = selectCategoryCount(store.getState());

      // selectAllCategories always includes the None category
      expect(allCategories).toHaveLength(1);
      expect(allCategories[0].id).toBe('none');
      expect(allCategories[0].name).toBe('None');
      // selectCategoryCount only counts user categories (not None)
      expect(count).toBe(0);
    });

    it('should handle special characters in category name', () => {
      const store = createTestStore();
      const category = createMockCategory({
        id: 'cat-1',
        name: 'Work & Personal <Projects>',
      });

      store.dispatch(addCategory(category));

      const state = store.getState().categories;
      expect(state.categories['cat-1'].name).toBe('Work & Personal <Projects>');
    });

    it('should handle Unicode in category name', () => {
      const store = createTestStore();
      const category = createMockCategory({
        id: 'cat-1',
        name: '仕事 📋',
      });

      store.dispatch(addCategory(category));

      const result = selectCategoryByName(store.getState(), '仕事 📋');
      expect(result).toBeDefined();
    });
  });
});
