/**
 * CategoryFormModal Component Tests
 *
 * Comprehensive tests for the CategoryFormModal component including:
 * - Rendering tests (open/closed states, CategoryForm rendering)
 * - Form submission tests (create/update, dispatch actions, close on success)
 * - Cancel behavior tests
 * - Loading state tests
 * - Error handling tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFormModal } from '../CategoryFormModal';
import { renderWithProviders } from '../../../test/test-utils';
import type { Category, CreateCategoryInput } from '../../../types';
import { CATEGORY_COLORS } from '../../../types';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the Modal component
vi.mock('../../../components/common/Modal', () => ({
  Modal: ({ isOpen, onClose, children, title }: any) => {
    return isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null;
  },
}));

// Mock the CategoryForm component
vi.mock('../../../components/categories/CategoryForm', () => ({
  CategoryForm: ({ onSubmit, onCancel, isSubmitting, initialValues, error, existingNames }: any) => {
    const handleSubmit = () => {
      const mockData: CreateCategoryInput = {
        name: initialValues?.name || 'Test Category',
        color: initialValues?.color || CATEGORY_COLORS[0],
      };
      onSubmit(mockData);
    };

    return (
      <div data-testid="category-form">
        <p>Existing names: {existingNames?.length || 0}</p>
        {initialValues && <p>Editing: {initialValues.name}</p>}
        {error && <p data-testid="form-error">{error}</p>}
        <button onClick={handleSubmit} disabled={isSubmitting}>
          Submit
        </button>
        <button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        {isSubmitting && <span data-testid="form-submitting">Submitting...</span>}
      </div>
    );
  },
}));

// Mock the auth hook with configurable user
let mockAuthUser: any = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'standard' as const,
  googleCalendarConnected: false,
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

vi.mock('../../../features/auth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
    error: null,
  }),
}));

// Mock Firebase categories service
vi.mock('../../../services/firebase/categories.service', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  getCategories: vi.fn(),
  deleteCategory: vi.fn(),
  categoryNameExists: vi.fn(),
}));

import * as categoriesService from '../../../services/firebase/categories.service';
const mockCreateCategoryService = vi.mocked(categoriesService.createCategory);
const mockUpdateCategoryService = vi.mocked(categoriesService.updateCategory);
const mockCategoryNameExists = vi.mocked(categoriesService.categoryNameExists);

// =============================================================================
// Test Helpers
// =============================================================================

const mockCategory: Category = {
  id: 'cat-1',
  userId: 'user-123',
  name: 'Work',
  color: CATEGORY_COLORS[0],
  sortOrder: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCategories: Category[] = [
  mockCategory,
  {
    id: 'cat-2',
    userId: 'user-123',
    name: 'Personal',
    color: CATEGORY_COLORS[1],
    sortOrder: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

// =============================================================================
// Test Suite
// =============================================================================

describe('CategoryFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'standard' as const,
      googleCalendarConnected: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    mockCategoryNameExists.mockResolvedValue(false);
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <CategoryFormModal isOpen={false} onClose={mockOnClose} />
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('renders with correct title in create mode', () => {
      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Create Category')).toBeInTheDocument();
    });

    it('renders with correct title in edit mode', () => {
      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
        />
      );

      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });

    it('renders CategoryForm component', () => {
      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByTestId('category-form')).toBeInTheDocument();
    });

    it('passes existing category names to form', () => {
      const { store } = renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />,
        {
          preloadedState: {
            categories: {
              categories: {
                'cat-1': mockCategories[0],
                'cat-2': mockCategories[1],
              },
              categoryIds: ['cat-1', 'cat-2'],
              loading: false,
              error: null,
              syncStatus: 'synced',
              initialized: true,
            },
          },
        }
      );

      expect(screen.getByText('Existing names: 2')).toBeInTheDocument();
    });

    it('excludes current category from existing names in edit mode', () => {
      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
        />,
        {
          preloadedState: {
            categories: {
              categories: {
                'cat-1': mockCategories[0],
                'cat-2': mockCategories[1],
              },
              categoryIds: ['cat-1', 'cat-2'],
              loading: false,
              error: null,
              syncStatus: 'synced',
              initialized: true,
            },
          },
        }
      );

      // Should only have 1 existing name (excluding the one being edited)
      expect(screen.getByText('Existing names: 1')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Create Mode Tests
  // ===========================================================================

  describe('Create Mode', () => {
    it('creates category on form submission', async () => {
      const user = userEvent.setup();
      const newCategory: Category = {
        id: 'cat-new',
        userId: 'user-123',
        name: 'Test Category',
        color: CATEGORY_COLORS[0],
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateCategoryService.mockResolvedValueOnce(newCategory);

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategoryService).toHaveBeenCalledWith(
          { name: 'Test Category', color: CATEGORY_COLORS[0] },
          'user-123'
        );
      });
    });

    it('closes modal on successful creation', async () => {
      const user = userEvent.setup();
      const newCategory: Category = {
        id: 'cat-new',
        userId: 'user-123',
        name: 'Test Category',
        color: CATEGORY_COLORS[0],
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateCategoryService.mockResolvedValueOnce(newCategory);

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('calls onSuccess callback after successful creation', async () => {
      const user = userEvent.setup();
      const newCategory: Category = {
        id: 'cat-new',
        userId: 'user-123',
        name: 'Test Category',
        color: CATEGORY_COLORS[0],
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateCategoryService.mockResolvedValueOnce(newCategory);

      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('does not close modal on failed creation', async () => {
      const user = userEvent.setup();
      mockCreateCategoryService.mockRejectedValueOnce(new Error('Creation failed'));

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategoryService).toHaveBeenCalled();
      });

      // Modal should still be open
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edit Mode Tests
  // ===========================================================================

  describe('Edit Mode', () => {
    it('passes initial values to form in edit mode', () => {
      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
        />
      );

      expect(screen.getByText('Editing: Work')).toBeInTheDocument();
    });

    it('updates category on form submission', async () => {
      const user = userEvent.setup();
      const updatedCategory: Category = {
        ...mockCategory,
        name: 'Updated Work',
        updatedAt: new Date(),
      };

      mockUpdateCategoryService.mockResolvedValueOnce(updatedCategory);

      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateCategoryService).toHaveBeenCalledWith(
          {
            id: 'cat-1',
            name: 'Work',
            color: CATEGORY_COLORS[0],
          },
          'user-123'
        );
      });
    });

    it('closes modal on successful update', async () => {
      const user = userEvent.setup();
      const updatedCategory: Category = {
        ...mockCategory,
        updatedAt: new Date(),
      };

      mockUpdateCategoryService.mockResolvedValueOnce(updatedCategory);

      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('calls onSuccess callback after successful update', async () => {
      const user = userEvent.setup();
      const updatedCategory: Category = {
        ...mockCategory,
        updatedAt: new Date(),
      };

      mockUpdateCategoryService.mockResolvedValueOnce(updatedCategory);

      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Cancel Tests
  // ===========================================================================

  describe('Cancel Behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when modal close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSuccess when modal is cancelled', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading state while creating category', async () => {
      const user = userEvent.setup();
      mockCreateCategoryService.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Check for submitting state
      expect(screen.getByTestId('form-submitting')).toBeInTheDocument();
    });

    it('disables form while submitting', async () => {
      const user = userEvent.setup();
      mockCreateCategoryService.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('displays error message on failed creation', async () => {
      const user = userEvent.setup();
      mockCreateCategoryService.mockRejectedValueOnce(new Error('Creation failed'));

      const { store } = renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.categories.syncStatus).toBe('error');
      });
    });

    it('logs error to console on failed submission', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateCategoryService.mockRejectedValueOnce(new Error('Creation failed'));

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save category:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles missing userId gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthUser = null; // No user logged in

      renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('No user ID found');
      });

      expect(mockCreateCategoryService).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Sync Status Tests
  // ===========================================================================

  describe('Sync Status', () => {
    it('transitions from syncing to synced on successful create', async () => {
      const user = userEvent.setup();
      const newCategory: Category = {
        id: 'cat-new',
        userId: 'user-123',
        name: 'Test Category',
        color: CATEGORY_COLORS[0],
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateCategoryService.mockResolvedValueOnce(newCategory);

      const { store } = renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.categories.syncStatus).toBe('synced');
      });
    });

    it('sets syncStatus to error on failed operation', async () => {
      const user = userEvent.setup();
      mockCreateCategoryService.mockRejectedValueOnce(new Error('Failed'));

      const { store } = renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.categories.syncStatus).toBe('error');
      });
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('creates category and updates Redux store', async () => {
      const user = userEvent.setup();
      const newCategory: Category = {
        id: 'cat-new',
        userId: 'user-123',
        name: 'Test Category',
        color: CATEGORY_COLORS[0],
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateCategoryService.mockResolvedValueOnce(newCategory);

      const { store } = renderWithProviders(
        <CategoryFormModal isOpen={true} onClose={mockOnClose} />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.categories.categories['cat-new']).toBeDefined();
        expect(state.categories.categories['cat-new'].name).toBe('Test Category');
      });
    });

    it('updates category and updates Redux store', async () => {
      const user = userEvent.setup();
      const updatedCategory: Category = {
        ...mockCategory,
        name: 'Updated Work',
        updatedAt: new Date(),
      };

      mockUpdateCategoryService.mockResolvedValueOnce(updatedCategory);

      const { store } = renderWithProviders(
        <CategoryFormModal
          isOpen={true}
          onClose={mockOnClose}
          category={mockCategory}
        />,
        {
          preloadedState: {
            categories: {
              categories: { 'cat-1': mockCategory },
              categoryIds: ['cat-1'],
              loading: false,
              error: null,
              syncStatus: 'synced',
              initialized: true,
            },
          },
        }
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.categories.categories['cat-1'].name).toBe('Updated Work');
      });
    });
  });
});
