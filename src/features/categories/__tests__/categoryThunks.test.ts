/**
 * Category Thunks Tests
 *
 * Comprehensive tests for async thunks in the categories feature.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import categoryReducer, { initialState } from '../categorySlice';
import {
  fetchCategories,
  createCategory,
  updateCategoryAsync,
  deleteCategory,
  checkCategoryNameExists,
} from '../categoryThunks';
import type { Category, CreateCategoryInput } from '../../../types';
import * as categoriesService from '../../../services/firebase/categories.service';

// Mock the categories service
vi.mock('../../../services/firebase/categories.service');

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

describe('Category Thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // fetchCategories
  // ===========================================================================

  describe('fetchCategories', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(categoriesService.getCategories).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchCategories('user-1'));

      const state = store.getState().categories;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('syncing');
    });

    it('should fetch categories successfully', async () => {
      const store = createTestStore();
      const mockCategories = [
        createMockCategory({ id: 'cat-1', name: 'Work' }),
        createMockCategory({ id: 'cat-2', name: 'Personal' }),
      ];

      vi.mocked(categoriesService.getCategories).mockResolvedValue(mockCategories);

      await store.dispatch(fetchCategories('user-1'));

      const state = store.getState().categories;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('synced');
      expect(state.initialized).toBe(true);
      expect(Object.keys(state.categories)).toHaveLength(2);
    });

    it('should sort categories by sortOrder and name', async () => {
      const store = createTestStore();
      const mockCategories = [
        createMockCategory({ id: 'cat-1', name: 'Zebra', sortOrder: 0 }),
        createMockCategory({ id: 'cat-2', name: 'Alpha', sortOrder: 0 }),
        createMockCategory({ id: 'cat-3', name: 'Beta', sortOrder: 1 }),
      ];

      vi.mocked(categoriesService.getCategories).mockResolvedValue(mockCategories);

      await store.dispatch(fetchCategories('user-1'));

      const state = store.getState().categories;
      expect(state.categoryIds).toEqual(['cat-2', 'cat-1', 'cat-3']);
    });

    it('should handle fetch error', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.getCategories).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(fetchCategories('user-1'));

      const state = store.getState().categories;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.syncStatus).toBe('error');
    });

    it('should replace existing categories', async () => {
      const oldCategory = createMockCategory({ id: 'old-cat', name: 'Old' });
      const store = createTestStore({
        categories: { 'old-cat': oldCategory },
        categoryIds: ['old-cat'],
      });

      const newCategory = createMockCategory({ id: 'new-cat', name: 'New' });
      vi.mocked(categoriesService.getCategories).mockResolvedValue([newCategory]);

      await store.dispatch(fetchCategories('user-1'));

      const state = store.getState().categories;
      expect(state.categories['old-cat']).toBeUndefined();
      expect(state.categories['new-cat']).toBeDefined();
    });
  });

  // ===========================================================================
  // createCategory
  // ===========================================================================

  describe('createCategory', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);
      vi.mocked(categoriesService.createCategory).mockImplementation(
        () => new Promise(() => {})
      );

      const input: CreateCategoryInput = {
        name: 'New Category',
        color: '#EF4444',
      };

      store.dispatch(createCategory({ input, userId: 'user-1' }));

      // Allow the first promise to resolve
      setTimeout(() => {
        const state = store.getState().categories;
        expect(state.syncStatus).toBe('syncing');
      }, 0);
    });

    it('should create category successfully', async () => {
      const store = createTestStore();

      const input: CreateCategoryInput = {
        name: 'New Category',
        color: '#EF4444',
      };

      const createdCategory = createMockCategory({
        id: 'new-cat-id',
        name: 'New Category',
        color: '#EF4444',
      });

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);
      vi.mocked(categoriesService.createCategory).mockResolvedValue(createdCategory);

      await store.dispatch(createCategory({ input, userId: 'user-1' }));

      const state = store.getState().categories;
      expect(state.syncStatus).toBe('synced');
      expect(state.categories['new-cat-id']).toBeDefined();
      expect(state.categories['new-cat-id'].name).toBe('New Category');
      expect(state.categoryIds).toContain('new-cat-id');
    });

    it('should reject if name already exists', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(true);

      const input: CreateCategoryInput = {
        name: 'Existing Name',
        color: '#EF4444',
      };

      await store.dispatch(createCategory({ input, userId: 'user-1' }));

      const state = store.getState().categories;
      expect(state.error).toBe('A category with this name already exists');
      expect(state.syncStatus).toBe('error');
    });

    it('should handle create error', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);
      vi.mocked(categoriesService.createCategory).mockRejectedValue(
        new Error('Create failed')
      );

      await store.dispatch(
        createCategory({
          input: { name: 'Test', color: '#3B82F6' },
          userId: 'user-1',
        })
      );

      const state = store.getState().categories;
      expect(state.error).toBe('Create failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // updateCategoryAsync
  // ===========================================================================

  describe('updateCategoryAsync', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(categoriesService.updateCategory).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(
        updateCategoryAsync({ id: 'cat-1', name: 'Updated', userId: 'user-1' })
      );

      const state = store.getState().categories;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should update category successfully', async () => {
      const existingCategory = createMockCategory({
        id: 'cat-1',
        name: 'Original',
      });

      const store = createTestStore({
        categories: { 'cat-1': existingCategory },
        categoryIds: ['cat-1'],
      });

      const updatedCategory = createMockCategory({
        id: 'cat-1',
        name: 'Updated Name',
        color: '#22C55E',
      });

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);
      vi.mocked(categoriesService.updateCategory).mockResolvedValue(updatedCategory);

      await store.dispatch(
        updateCategoryAsync({
          id: 'cat-1',
          name: 'Updated Name',
          color: '#22C55E',
          userId: 'user-1',
        })
      );

      const state = store.getState().categories;
      expect(state.syncStatus).toBe('synced');
      expect(state.categories['cat-1'].name).toBe('Updated Name');
      expect(state.categories['cat-1'].color).toBe('#22C55E');
    });

    it('should check for duplicate name when updating name', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(true);

      await store.dispatch(
        updateCategoryAsync({
          id: 'cat-1',
          name: 'Duplicate Name',
          userId: 'user-1',
        })
      );

      const state = store.getState().categories;
      expect(state.error).toBe('A category with this name already exists');
    });

    it('should not check duplicate if name not being updated', async () => {
      const existingCategory = createMockCategory({ id: 'cat-1' });
      const store = createTestStore({
        categories: { 'cat-1': existingCategory },
        categoryIds: ['cat-1'],
      });

      const updatedCategory = createMockCategory({
        id: 'cat-1',
        color: '#22C55E',
      });

      vi.mocked(categoriesService.updateCategory).mockResolvedValue(updatedCategory);

      await store.dispatch(
        updateCategoryAsync({
          id: 'cat-1',
          color: '#22C55E',
          userId: 'user-1',
        })
      );

      expect(categoriesService.categoryNameExists).not.toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.updateCategory).mockRejectedValue(
        new Error('Update failed')
      );

      await store.dispatch(
        updateCategoryAsync({
          id: 'cat-1',
          color: '#EF4444',
          userId: 'user-1',
        })
      );

      const state = store.getState().categories;
      expect(state.error).toBe('Update failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // deleteCategory
  // ===========================================================================

  describe('deleteCategory', () => {
    it('should handle pending state', () => {
      const store = createTestStore();

      vi.mocked(categoriesService.deleteCategory).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(deleteCategory({ categoryId: 'cat-1', userId: 'user-1' }));

      const state = store.getState().categories;
      expect(state.syncStatus).toBe('syncing');
    });

    it('should delete category successfully', async () => {
      const existingCategory = createMockCategory({ id: 'cat-1' });
      const store = createTestStore({
        categories: { 'cat-1': existingCategory },
        categoryIds: ['cat-1'],
      });

      vi.mocked(categoriesService.deleteCategory).mockResolvedValue();

      await store.dispatch(deleteCategory({ categoryId: 'cat-1', userId: 'user-1' }));

      const state = store.getState().categories;
      expect(state.syncStatus).toBe('synced');
      expect(state.categories['cat-1']).toBeUndefined();
      expect(state.categoryIds).not.toContain('cat-1');
    });

    it('should handle delete error', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.deleteCategory).mockRejectedValue(
        new Error('Delete failed')
      );

      await store.dispatch(deleteCategory({ categoryId: 'cat-1', userId: 'user-1' }));

      const state = store.getState().categories;
      expect(state.error).toBe('Delete failed');
      expect(state.syncStatus).toBe('error');
    });
  });

  // ===========================================================================
  // checkCategoryNameExists
  // ===========================================================================

  describe('checkCategoryNameExists', () => {
    it('should return true if name exists', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(true);

      const result = await store.dispatch(
        checkCategoryNameExists({ userId: 'user-1', name: 'Existing' })
      );

      expect(result.payload).toBe(true);
    });

    it('should return false if name does not exist', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);

      const result = await store.dispatch(
        checkCategoryNameExists({ userId: 'user-1', name: 'New' })
      );

      expect(result.payload).toBe(false);
    });

    it('should pass excludeId when provided', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);

      await store.dispatch(
        checkCategoryNameExists({
          userId: 'user-1',
          name: 'Test',
          excludeId: 'cat-1',
        })
      );

      expect(categoriesService.categoryNameExists).toHaveBeenCalledWith(
        'user-1',
        'Test',
        'cat-1'
      );
    });

    it('should handle error', async () => {
      const store = createTestStore();

      vi.mocked(categoriesService.categoryNameExists).mockRejectedValue(
        new Error('Check failed')
      );

      const result = await store.dispatch(
        checkCategoryNameExists({ userId: 'user-1', name: 'Test' })
      );

      expect(result.payload).toEqual({ message: 'Check failed' });
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('should clear error after successful operation', async () => {
      const store = createTestStore({ error: 'Previous error' });

      vi.mocked(categoriesService.getCategories).mockResolvedValue([]);

      await store.dispatch(fetchCategories('user-1'));

      const state = store.getState().categories;
      expect(state.error).toBeNull();
    });

    it('should maintain state consistency through CRUD cycle', async () => {
      const store = createTestStore();

      // Create
      const createdCategory = createMockCategory({
        id: 'new-cat',
        name: 'New Category',
      });
      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);
      vi.mocked(categoriesService.createCategory).mockResolvedValue(createdCategory);

      await store.dispatch(
        createCategory({
          input: { name: 'New Category', color: '#3B82F6' },
          userId: 'user-1',
        })
      );

      let state = store.getState().categories;
      expect(state.categories['new-cat']).toBeDefined();

      // Update
      const updatedCategory = createMockCategory({
        id: 'new-cat',
        name: 'Updated Category',
      });
      vi.mocked(categoriesService.updateCategory).mockResolvedValue(updatedCategory);

      await store.dispatch(
        updateCategoryAsync({
          id: 'new-cat',
          name: 'Updated Category',
          userId: 'user-1',
        })
      );

      state = store.getState().categories;
      expect(state.categories['new-cat'].name).toBe('Updated Category');

      // Delete
      vi.mocked(categoriesService.deleteCategory).mockResolvedValue();

      await store.dispatch(deleteCategory({ categoryId: 'new-cat', userId: 'user-1' }));

      state = store.getState().categories;
      expect(state.categories['new-cat']).toBeUndefined();
    });

    it('should handle multiple concurrent operations', async () => {
      const store = createTestStore();

      const cat1 = createMockCategory({ id: 'cat-1', name: 'Cat 1' });
      const cat2 = createMockCategory({ id: 'cat-2', name: 'Cat 2' });

      vi.mocked(categoriesService.categoryNameExists).mockResolvedValue(false);
      vi.mocked(categoriesService.createCategory)
        .mockResolvedValueOnce(cat1)
        .mockResolvedValueOnce(cat2);

      await Promise.all([
        store.dispatch(
          createCategory({ input: { name: 'Cat 1', color: '#3B82F6' }, userId: 'user-1' })
        ),
        store.dispatch(
          createCategory({ input: { name: 'Cat 2', color: '#22C55E' }, userId: 'user-1' })
        ),
      ]);

      const state = store.getState().categories;
      expect(Object.keys(state.categories)).toHaveLength(2);
    });
  });
});
