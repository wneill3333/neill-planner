/**
 * CategoryListContainer Component Tests
 *
 * Tests for the CategoryListContainer component that connects to Redux.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CategoryListContainer } from '../CategoryListContainer';
import categoryReducer from '../categorySlice';
import type { Category } from '../../../types';

// =============================================================================
// Mock Auth Provider
// =============================================================================

// Mock the useAuth hook
const mockUser = { id: 'user-1', email: 'test@example.com', displayName: 'Test User' };
let mockAuthState = {
  user: mockUser,
  loading: false,
};

vi.mock('../../auth', () => ({
  useAuth: () => mockAuthState,
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#3B82F6',
    sortOrder: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockStore(initialState = {}) {
  return configureStore({
    reducer: {
      categories: categoryReducer,
    },
    preloadedState: {
      categories: {
        categories: {},
        categoryIds: [],
        loading: false,
        error: null,
        syncStatus: 'synced',
        initialized: false,
        ...initialState,
      },
    },
  });
}

function renderWithStore(ui: React.ReactElement, store = createMockStore()) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

// =============================================================================
// Unauthenticated State Tests
// =============================================================================

describe('CategoryListContainer', () => {
  beforeEach(() => {
    // Reset auth state before each test
    mockAuthState = {
      user: mockUser,
      loading: false,
    };
  });

  describe('Unauthenticated State', () => {
    it('should show unauthenticated state when no user', () => {
      mockAuthState = { user: null, loading: false };
      renderWithStore(<CategoryListContainer />);

      expect(screen.getByTestId('unauthenticated-state')).toBeInTheDocument();
    });

    it('should show sign in message when unauthenticated', () => {
      mockAuthState = { user: null, loading: false };
      renderWithStore(<CategoryListContainer />);

      expect(screen.getByText('Please sign in')).toBeInTheDocument();
      expect(screen.getByText('Sign in to manage your categories')).toBeInTheDocument();
    });

    it('should not show unauthenticated state when loading auth', () => {
      mockAuthState = { user: null, loading: true };
      renderWithStore(<CategoryListContainer />);

      expect(screen.queryByTestId('unauthenticated-state')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Error State Tests
  // =============================================================================

  describe('Error State', () => {
    it('should show error state when there is an error', () => {
      const store = createMockStore({ error: 'Failed to load categories', loading: false, initialized: true });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    it('should display error message', () => {
      const store = createMockStore({ error: 'Network error occurred', loading: false, initialized: true });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      const store = createMockStore({ error: 'Failed to load', loading: false, initialized: true });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByRole('button', { name: 'Retry loading categories' })).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Loading State Tests
  // =============================================================================

  describe('Loading State', () => {
    it('should show loading state when categories are loading', () => {
      const store = createMockStore({ loading: true });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show loading state when auth is loading', () => {
      mockAuthState = { user: null, loading: true };
      renderWithStore(<CategoryListContainer />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should not show categories while loading', () => {
      const categories = {
        'cat-1': createMockCategory(),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        loading: true,
      });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.queryByTestId('category-list')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering Categories', () => {
    it('should render category list when categories are loaded', () => {
      const categories = {
        'cat-1': createMockCategory(),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        initialized: true,
      });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    it('should render all categories from store', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1', name: 'Work' }),
        'cat-2': createMockCategory({ id: 'cat-2', name: 'Personal' }),
        'cat-3': createMockCategory({ id: 'cat-3', name: 'Health' }),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1', 'cat-2', 'cat-3'],
        initialized: true,
      });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
    });

    it('should show empty state when no categories', () => {
      const store = createMockStore({ initialized: true });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should use custom testId when provided', () => {
      const categories = {
        'cat-1': createMockCategory(),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        initialized: true,
      });
      renderWithStore(<CategoryListContainer testId="custom-categories" />, store);

      expect(screen.getByTestId('custom-categories')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Callback Tests
  // =============================================================================

  describe('Callbacks', () => {
    it('should call onEditCategory when edit button is clicked', () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Work' });
      const store = createMockStore({
        categories: { 'cat-1': category },
        categoryIds: ['cat-1'],
        initialized: true,
      });
      const handleEdit = vi.fn();

      renderWithStore(<CategoryListContainer onEditCategory={handleEdit} />, store);

      fireEvent.click(screen.getByTestId('edit-category-cat-1'));

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(category);
    });

    it('should call onAddCategory when add button is clicked', () => {
      const store = createMockStore({ initialized: true, loading: false });
      const handleAdd = vi.fn();

      renderWithStore(<CategoryListContainer onAddCategory={handleAdd} />, store);

      // Should show empty state with add button
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('add-category-button'));

      expect(handleAdd).toHaveBeenCalledTimes(1);
    });

    it('should handle delete category with confirmation', () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Work' });
      const store = createMockStore({
        categories: { 'cat-1': category },
        categoryIds: ['cat-1'],
        initialized: true,
      });

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => false); // User cancels

      renderWithStore(<CategoryListContainer />, store);

      fireEvent.click(screen.getByTestId('delete-category-cat-1'));

      expect(window.confirm).toHaveBeenCalled();

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration', () => {
    it('should pass categories from Redux to CategoryList', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1', name: 'Work', color: '#FF0000' }),
        'cat-2': createMockCategory({ id: 'cat-2', name: 'Personal', color: '#00FF00' }),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1', 'cat-2'],
        initialized: true,
      });

      renderWithStore(<CategoryListContainer />, store);

      // Verify both categories are rendered
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();

      // Verify color swatches
      const swatches = screen.getAllByTestId('category-color-swatch');
      expect(swatches[0]).toHaveStyle({ backgroundColor: '#FF0000' });
      expect(swatches[1]).toHaveStyle({ backgroundColor: '#00FF00' });
    });

    it('should maintain category order from Redux', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1', name: 'Zulu', sortOrder: 0 }),
        'cat-2': createMockCategory({ id: 'cat-2', name: 'Alpha', sortOrder: 1 }),
        'cat-3': createMockCategory({ id: 'cat-3', name: 'Beta', sortOrder: 2 }),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1', 'cat-2', 'cat-3'], // Order from Redux
        initialized: true,
      });

      renderWithStore(<CategoryListContainer />, store);

      const items = screen.getAllByTestId(/^category-item-/);
      expect(items[0]).toHaveTextContent('Zulu');
      expect(items[1]).toHaveTextContent('Alpha');
      expect(items[2]).toHaveTextContent('Beta');
    });

    it('should show edit and delete buttons for all categories', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1', name: 'Work' }),
        'cat-2': createMockCategory({ id: 'cat-2', name: 'Personal' }),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1', 'cat-2'],
        initialized: true,
      });
      const handleEdit = vi.fn();

      renderWithStore(<CategoryListContainer onEditCategory={handleEdit} />, store);

      expect(screen.getByTestId('edit-category-cat-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-category-cat-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-category-cat-2')).toBeInTheDocument();
      expect(screen.getByTestId('delete-category-cat-2')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle switching from loading to loaded', async () => {
      const categories = {
        'cat-1': createMockCategory(),
      };
      const store = createMockStore({ loading: true, initialized: false });
      const { rerender } = renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Simulate categories loaded - properly update loading state
      store.dispatch({
        type: 'categories/fetchCategories/fulfilled',
        payload: [categories['cat-1']],
      });

      rerender(
        <Provider store={store}>
          <CategoryListContainer />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    it('should show categories when store has categories', () => {
      const categories = {
        'cat-1': createMockCategory(),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        loading: false,
        initialized: true,
      });
      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('should handle user becoming unauthenticated', () => {
      const categories = {
        'cat-1': createMockCategory(),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        initialized: true,
      });

      const { rerender } = renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('category-list')).toBeInTheDocument();

      // User signs out
      mockAuthState = { user: null, loading: false };

      rerender(
        <Provider store={store}>
          <CategoryListContainer />
        </Provider>
      );

      expect(screen.queryByTestId('category-list')).not.toBeInTheDocument();
      expect(screen.getByTestId('unauthenticated-state')).toBeInTheDocument();
    });

    it('should handle many categories', () => {
      const categories: Record<string, Category> = {};
      const categoryIds: string[] = [];

      for (let i = 0; i < 50; i++) {
        const id = `cat-${i}`;
        categories[id] = createMockCategory({ id, name: `Category ${i}` });
        categoryIds.push(id);
      }

      const store = createMockStore({
        categories,
        categoryIds,
        initialized: true,
      });

      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getAllByTestId(/^category-item-/)).toHaveLength(50);
    });

    it('should not pass onEditCategory if not provided', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1' }),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        initialized: true,
      });

      renderWithStore(<CategoryListContainer />, store);

      expect(screen.queryByTestId('edit-category-cat-1')).not.toBeInTheDocument();
    });

    it('should always show delete button', () => {
      const categories = {
        'cat-1': createMockCategory({ id: 'cat-1' }),
      };
      const store = createMockStore({
        categories,
        categoryIds: ['cat-1'],
        initialized: true,
      });

      renderWithStore(<CategoryListContainer />, store);

      expect(screen.getByTestId('delete-category-cat-1')).toBeInTheDocument();
    });
  });
});
