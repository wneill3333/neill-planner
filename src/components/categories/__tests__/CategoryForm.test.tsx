/**
 * CategoryForm Component Tests
 *
 * Comprehensive test suite for the CategoryForm component.
 * Tests form validation, submission, editing, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../CategoryForm';
import { CATEGORY_COLORS } from '../../../types';

// =============================================================================
// Test Suite
// =============================================================================

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders in create mode by default', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Create New Category')).toBeInTheDocument();
      expect(screen.getByText('Create a category to organize your tasks')).toBeInTheDocument();
      expect(screen.getByText('Create Category')).toBeInTheDocument();
    });

    it('renders in edit mode when initialValues provided', () => {
      const initialValues = {
        name: 'Work',
        color: CATEGORY_COLORS[0],
      };

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
        />
      );

      expect(screen.getByText('Edit Category')).toBeInTheDocument();
      expect(screen.getByText('Update category details below')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category color/i)).toBeInTheDocument();
    });

    it('renders with custom testId', () => {
      const { container } = render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          testId="custom-form"
        />
      );

      expect(container.querySelector('[data-testid="custom-form"]')).toBeInTheDocument();
    });

    it('renders cancel and submit buttons', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Category')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Initial Values Tests
  // ===========================================================================

  describe('Initial Values', () => {
    it('populates form with initial values in edit mode', () => {
      const initialValues = {
        name: 'Personal',
        color: CATEGORY_COLORS[2],
      };

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
        />
      );

      const nameInput = screen.getByLabelText(/category name/i);
      expect(nameInput).toHaveValue('Personal');

      const selectedColor = screen.getByTestId(`color-option-${CATEGORY_COLORS[2]}`);
      expect(selectedColor).toHaveAttribute('aria-checked', 'true');
    });

    it('uses default color when not provided', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const defaultColor = screen.getByTestId(`color-option-${CATEGORY_COLORS[0]}`);
      expect(defaultColor).toHaveAttribute('aria-checked', 'true');
    });

    it('starts with empty name in create mode', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      expect(nameInput).toHaveValue('');
    });
  });

  // ===========================================================================
  // Form Interaction Tests
  // ===========================================================================

  describe('Form Interactions', () => {
    it('updates name input on change', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'New Category');

      expect(nameInput).toHaveValue('New Category');
    });

    it('updates color on selection', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const targetColor = CATEGORY_COLORS[3];
      const colorButton = screen.getByTestId(`color-option-${targetColor}`);
      await user.click(colorButton);

      expect(colorButton).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('focuses name input on mount', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      expect(nameInput).toHaveFocus();
    });
  });

  // ===========================================================================
  // Validation Tests - Name Field
  // ===========================================================================

  describe('Name Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when name is only whitespace', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, '   ');

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeInTheDocument();
      });
    });

    it('enforces max length on input field', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i) as HTMLInputElement;
      const longName = 'A'.repeat(51); // Max is 50
      await user.type(nameInput, longName);

      // The input maxLength attribute prevents entering more than 50 chars
      expect(nameInput.value).toHaveLength(50);
      expect(nameInput).toHaveAttribute('maxlength', '50');
    });

    it('shows error when name is duplicate (case-insensitive)', async () => {
      const user = userEvent.setup();
      const existingNames = ['Work', 'Personal', 'Shopping'];

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          existingNames={existingNames}
        />
      );

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'work'); // Lowercase version

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('A category with this name already exists')).toBeInTheDocument();
      });
    });

    it('allows duplicate name when editing same category', async () => {
      const user = userEvent.setup();
      const existingNames = ['Work', 'Personal'];
      const initialValues = { name: 'Work', color: CATEGORY_COLORS[0] };

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          existingNames={existingNames}
          initialValues={initialValues}
        />
      );

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
      expect(screen.queryByText('A category with this name already exists')).not.toBeInTheDocument();
    });

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'N');

      await waitFor(() => {
        expect(screen.queryByText('Category name is required')).not.toBeInTheDocument();
      });
    });

    it('only shows error after field is touched', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);

      // Initially no error
      expect(screen.queryByText('Category name is required')).not.toBeInTheDocument();

      // Blur without value
      await user.click(nameInput);
      await user.tab();

      // Still no error until submit
      expect(screen.queryByText('Category name is required')).not.toBeInTheDocument();

      // Error appears on submit
      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Form Submission Tests
  // ===========================================================================

  describe('Form Submission', () => {
    it('submits with valid data in create mode', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'New Category');

      const colorButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      await user.click(colorButton);

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'New Category',
          color: CATEGORY_COLORS[1],
        });
      });
    });

    it('submits with trimmed name', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, '  Work  ');

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Work',
          color: CATEGORY_COLORS[0],
        });
      });
    });

    it('submits with updated values in edit mode', async () => {
      const user = userEvent.setup();
      const initialValues = { name: 'Old Name', color: CATEGORY_COLORS[0] };

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
        />
      );

      const nameInput = screen.getByLabelText(/category name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Name',
          color: CATEGORY_COLORS[0],
        });
      });
    });

    it('prevents default form submission', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'Category');

      const form = screen.getByTestId('category-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      form.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not submit when validation fails', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Loading/Submitting State Tests
  // ===========================================================================

  describe('Submitting State', () => {
    it('disables inputs when isSubmitting is true', () => {
      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting
        />
      );

      const nameInput = screen.getByLabelText(/category name/i);
      expect(nameInput).toBeDisabled();
    });

    it('disables buttons when isSubmitting is true', () => {
      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting
        />
      );

      const submitButton = screen.getByTestId('category-form-submit');
      const cancelButton = screen.getByTestId('category-form-cancel');

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading text on submit button when submitting', () => {
      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting
        />
      );

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('shows "Saving..." in edit mode when submitting', () => {
      const initialValues = { name: 'Work', color: CATEGORY_COLORS[0] };

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialValues={initialValues}
          isSubmitting
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows loading spinner when submitting', () => {
      const { container } = render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Error Display Tests
  // ===========================================================================

  describe('Error Display', () => {
    it('displays server error message when error prop provided', () => {
      const errorMessage = 'Failed to create category';

      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error when error prop is null', () => {
      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error={null}
        />
      );

      const alerts = screen.queryAllByRole('alert');
      // Should only have form field alerts, not server error
      const serverErrorAlert = alerts.find((alert) =>
        alert.classList.contains('bg-red-50')
      );
      expect(serverErrorAlert).toBeUndefined();
    });

    it('error message has proper accessibility attributes', () => {
      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error="Server error"
        />
      );

      const errorContainer = screen.getByText('Server error').closest('div');
      expect(errorContainer).toHaveAttribute('role', 'alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('has novalidate attribute on form', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = screen.getByTestId('category-form');
      expect(form).toHaveAttribute('novalidate');
    });

    it('required fields are marked with asterisk', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameLabel = screen.getByText(/category name/i);
      const asterisk = nameLabel.querySelector('[aria-label="required"]');
      expect(asterisk).toBeInTheDocument();
    });

    it('form fields have proper labels', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category color/i)).toBeInTheDocument();
    });

    it('submit button has proper text for screen readers', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByTestId('category-form-submit');
      expect(submitButton).toHaveTextContent('Create Category');
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByTestId('category-form-cancel');
      cancelButton.focus();

      await user.keyboard('{Enter}');
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles rapid color changes', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const color1 = screen.getByTestId(`color-option-${CATEGORY_COLORS[0]}`);
      const color2 = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      const color3 = screen.getByTestId(`color-option-${CATEGORY_COLORS[2]}`);

      await user.click(color1);
      await user.click(color2);
      await user.click(color3);

      expect(color3).toHaveAttribute('aria-checked', 'true');
    });

    it('handles name at exact max length', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      const maxLengthName = 'A'.repeat(50);
      await user.type(nameInput, maxLengthName);

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: maxLengthName,
          color: CATEGORY_COLORS[0],
        });
      });
    });

    it('handles empty existingNames array', async () => {
      const user = userEvent.setup();
      render(
        <CategoryForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          existingNames={[]}
        />
      );

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'Any Name');

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('handles special characters in name', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/category name/i);
      await user.type(nameInput, 'Work/Personal #2024');

      const submitButton = screen.getByText('Create Category');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Work/Personal #2024',
          color: CATEGORY_COLORS[0],
        });
      });
    });
  });
});
