/**
 * Categories Feature Index
 *
 * Central export point for the categories feature module.
 */

// Slice and reducer
export { default as categoryReducer } from './categorySlice';

// Actions
export {
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setLoading,
  setError,
  setSyncStatus,
  clearCategories,
} from './categorySlice';

// Selectors
export {
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
} from './categorySlice';

// Types
export type { CategoriesState } from './categorySlice';

// Async Thunks
export {
  fetchCategories,
  createCategory as createCategoryAsync,
  updateCategoryAsync,
  deleteCategory,
  checkCategoryNameExists,
} from './categoryThunks';

// Thunk Types
export type { CreateCategoryPayload, ThunkError } from './categoryThunks';
