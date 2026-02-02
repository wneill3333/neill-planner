/**
 * Category Async Thunks
 *
 * Redux Toolkit async thunks for category CRUD operations.
 * These thunks interact with the Firebase categories service.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types';
import * as categoriesService from '../../services/firebase/categories.service';
import type { RootState } from '../../store';

// =============================================================================
// Types
// =============================================================================

/**
 * Payload for creating a category
 */
export interface CreateCategoryPayload {
  input: CreateCategoryInput;
  userId: string;
}

/**
 * Error response from thunks
 */
export interface ThunkError {
  message: string;
  code?: string;
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch all categories for a user
 *
 * Retrieves all categories from Firestore for the given user.
 * Categories are returned sorted by sortOrder and name.
 */
export const fetchCategories = createAsyncThunk<
  Category[],
  string, // userId
  { state: RootState; rejectValue: ThunkError }
>('categories/fetchCategories', async (userId, { rejectWithValue }) => {
  try {
    const categories = await categoriesService.getCategories(userId);
    return categories;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    return rejectWithValue({ message });
  }
});

/**
 * Create a new category
 *
 * Creates a category in Firestore and adds it to the local state.
 */
export const createCategory = createAsyncThunk<
  Category,
  CreateCategoryPayload,
  { state: RootState; rejectValue: ThunkError }
>('categories/createCategory', async ({ input, userId }, { rejectWithValue }) => {
  try {
    // Check for duplicate name
    const nameExists = await categoriesService.categoryNameExists(userId, input.name);
    if (nameExists) {
      return rejectWithValue({ message: 'A category with this name already exists' });
    }

    const category = await categoriesService.createCategory(input, userId);
    return category;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return rejectWithValue({ message });
  }
});

/**
 * Update an existing category
 *
 * Updates a category in Firestore and reflects the changes in local state.
 */
export const updateCategoryAsync = createAsyncThunk<
  Category,
  UpdateCategoryInput & { userId: string },
  { state: RootState; rejectValue: ThunkError }
>('categories/updateCategoryAsync', async (input, { rejectWithValue }) => {
  try {
    const { userId, ...updateInput } = input;

    // Check for duplicate name if name is being updated
    if (updateInput.name) {
      const nameExists = await categoriesService.categoryNameExists(
        userId,
        updateInput.name,
        updateInput.id
      );
      if (nameExists) {
        return rejectWithValue({ message: 'A category with this name already exists' });
      }
    }

    const category = await categoriesService.updateCategory(updateInput, userId);
    return category;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return rejectWithValue({ message });
  }
});

/**
 * Delete a category
 *
 * Permanently removes the category from Firestore.
 * Note: Tasks using this category should have their categoryId set to null.
 */
export const deleteCategory = createAsyncThunk<
  string,
  { categoryId: string; userId: string },
  { state: RootState; rejectValue: ThunkError }
>('categories/deleteCategory', async ({ categoryId, userId }, { rejectWithValue }) => {
  try {
    await categoriesService.deleteCategory(categoryId, userId);
    return categoryId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return rejectWithValue({ message });
  }
});

/**
 * Check if a category name exists
 *
 * Utility thunk for form validation.
 */
export const checkCategoryNameExists = createAsyncThunk<
  boolean,
  { userId: string; name: string; excludeId?: string },
  { state: RootState; rejectValue: ThunkError }
>(
  'categories/checkCategoryNameExists',
  async ({ userId, name, excludeId }, { rejectWithValue }) => {
    try {
      const exists = await categoriesService.categoryNameExists(userId, name, excludeId);
      return exists;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check category name';
      return rejectWithValue({ message });
    }
  }
);
