/**
 * CategorySelect Component Tests
 *
 * Tests for the custom category dropdown with color indicators.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelect } from '../CategorySelect';
import type { Category } from '../../../types';

// =============================================================================
// Test Data
// =============================================================================

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Work',
    color: '#EF4444',
    sortOrder: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'cat-2',
    userId: 'user-1',
    name: 'Personal',
    color: '#3B82F6',
    sortOrder: 2,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
  {
    id: 'cat-3',
    userId: 'user-1',
    name: 'Shopping',
    color: '#22C55E',
    sortOrder: 3,
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03'),
  },
];

// =============================================================================
// Tests
// =============================================================================

describe('CategorySelect', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Task Category"
        />
      );

      expect(screen.getByText('Task Category')).toBeInTheDocument();
    });

    it('shows "Select category" placeholder when no selection', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      expect(screen.getByText('Select category')).toBeInTheDocument();
    });

    it('shows selected category name with color dot', () => {
      render(
        <CategorySelect
          value="cat-1"
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      expect(screen.getByText('Work')).toBeInTheDocument();

      // Check that color dot is rendered with correct color
      const trigger = screen.getByTestId('category-select-trigger');
      const colorDot = trigger.querySelector('[style*="background-color"]');
      expect(colorDot).toBeInTheDocument();
      expect(colorDot).toHaveStyle({ backgroundColor: '#EF4444' });
    });

    it('renders required asterisk when required', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          required
        />
      );

      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('shows helper text when provided', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          helperText="Choose a category for organization"
        />
      );

      expect(screen.getByText('Choose a category for organization')).toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          error="Category is required"
        />
      );

      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');

      // Dropdown should not be visible initially
      expect(screen.queryByTestId('category-select-dropdown')).not.toBeInTheDocument();

      // Click to open
      await user.click(trigger);

      // Dropdown should now be visible
      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();
    });

    it('lists all categories with color dots', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      // Open dropdown
      await user.click(screen.getByTestId('category-select-trigger'));

      // Check for uncategorized option
      expect(screen.getByText('None (Uncategorized)')).toBeInTheDocument();

      // Check for all categories
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Shopping')).toBeInTheDocument();

      // Check that options have proper test IDs
      expect(screen.getByTestId('category-option-uncategorized')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-cat-1')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-cat-2')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-cat-3')).toBeInTheDocument();
    });

    it('calls onChange with category id when selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategorySelect
          value={null}
          onChange={handleChange}
          categories={mockCategories}
          label="Category"
        />
      );

      // Open dropdown
      await user.click(screen.getByTestId('category-select-trigger'));

      // Select "Work" category
      await user.click(screen.getByTestId('category-option-cat-1'));

      expect(handleChange).toHaveBeenCalledWith('cat-1');
    });

    it('calls onChange with null when "Uncategorized" selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategorySelect
          value="cat-1"
          onChange={handleChange}
          categories={mockCategories}
          label="Category"
        />
      );

      // Open dropdown
      await user.click(screen.getByTestId('category-select-trigger'));

      // Select "Uncategorized"
      await user.click(screen.getByTestId('category-option-uncategorized'));

      expect(handleChange).toHaveBeenCalledWith(null);
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      // Open dropdown
      await user.click(screen.getByTestId('category-select-trigger'));
      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();

      // Select a category
      await user.click(screen.getByTestId('category-option-cat-1'));

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByTestId('category-select-dropdown')).not.toBeInTheDocument();
      });
    });

    it('closes on outside click', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <div data-testid="outside">Outside</div>
          <CategorySelect
            value={null}
            onChange={vi.fn()}
            categories={mockCategories}
            label="Category"
          />
        </div>
      );

      // Open dropdown
      await user.click(screen.getByTestId('category-select-trigger'));
      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByTestId('category-select-dropdown')).not.toBeInTheDocument();
      });
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      // Open dropdown
      await user.click(screen.getByTestId('category-select-trigger'));
      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByTestId('category-select-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens on Enter key when focused', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Press Enter
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();
    });

    it('opens on Space key when focused', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Press Space
      await user.keyboard(' ');

      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();
    });

    it('opens on ArrowDown key when focused', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Press ArrowDown
      await user.keyboard('{ArrowDown}');

      expect(screen.getByTestId('category-select-dropdown')).toBeInTheDocument();
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Open dropdown
      await user.keyboard('{Enter}');

      // First option (Uncategorized) should be focused
      const uncategorizedOption = screen.getByTestId('category-option-uncategorized');
      expect(uncategorizedOption).toHaveClass('bg-gray-100');

      // Navigate down
      await user.keyboard('{ArrowDown}');
      const workOption = screen.getByTestId('category-option-cat-1');
      expect(workOption).toHaveClass('bg-gray-100');

      // Navigate down again
      await user.keyboard('{ArrowDown}');
      const personalOption = screen.getByTestId('category-option-cat-2');
      expect(personalOption).toHaveClass('bg-gray-100');

      // Navigate up
      await user.keyboard('{ArrowUp}');
      expect(workOption).toHaveClass('bg-gray-100');
    });

    it('selects focused option on Enter', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategorySelect
          value={null}
          onChange={handleChange}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Open dropdown and navigate to second option
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}'); // Focus on "Work"

      // Select with Enter
      await user.keyboard('{Enter}');

      expect(handleChange).toHaveBeenCalledWith('cat-1');
    });

    it('selects focused option on Space', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategorySelect
          value={null}
          onChange={handleChange}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Open dropdown and navigate to second option
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}'); // Focus on "Work"

      // Select with Space
      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalledWith('cat-1');
    });

    it('jumps to first option on Home key', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Open dropdown and navigate down
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Press Home
      await user.keyboard('{Home}');

      // First option should be focused
      const uncategorizedOption = screen.getByTestId('category-option-uncategorized');
      expect(uncategorizedOption).toHaveClass('bg-gray-100');
    });

    it('jumps to last option on End key', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      trigger.focus();

      // Open dropdown
      await user.keyboard('{Enter}');

      // Press End
      await user.keyboard('{End}');

      // Last option should be focused
      const lastOption = screen.getByTestId('category-option-cat-3');
      expect(lastOption).toHaveClass('bg-gray-100');
    });
  });

  describe('Disabled State', () => {
    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategorySelect
          value={null}
          onChange={handleChange}
          categories={mockCategories}
          label="Category"
          disabled
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');

      // Try to click
      await user.click(trigger);

      // Dropdown should not open
      expect(screen.queryByTestId('category-select-dropdown')).not.toBeInTheDocument();
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('shows disabled styling', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          disabled
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveClass('disabled:bg-gray-100');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          required
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');

      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-required', 'true');
    });

    it('sets aria-expanded to true when open', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets aria-invalid when error is present', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          error="Required field"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates error message with trigger', () => {
      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
          error="Required field"
        />
      );

      const trigger = screen.getByTestId('category-select-trigger');
      const errorId = trigger.getAttribute('aria-describedby');

      expect(errorId).toBeTruthy();
      expect(screen.getByRole('alert')).toHaveAttribute('id', errorId);
    });

    it('options have proper roles', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      await user.click(screen.getByTestId('category-select-trigger'));

      const dropdown = screen.getByTestId('category-select-dropdown');
      expect(dropdown).toHaveAttribute('role', 'listbox');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4); // Uncategorized + 3 categories
    });

    it('sets aria-selected on selected option', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value="cat-1"
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      await user.click(screen.getByTestId('category-select-trigger'));

      const selectedOption = screen.getByTestId('category-option-cat-1');
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Visual Indicators', () => {
    it('shows checkmark on selected option', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value="cat-1"
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      await user.click(screen.getByTestId('category-select-trigger'));

      const selectedOption = screen.getByTestId('category-option-cat-1');
      // Check for checkmark SVG
      const checkmark = selectedOption.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });

    it('highlights selected option with amber background', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value="cat-1"
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      await user.click(screen.getByTestId('category-select-trigger'));

      const selectedOption = screen.getByTestId('category-option-cat-1');
      expect(selectedOption).toHaveClass('bg-amber-50');
    });

    it('does not show color dot for uncategorized option', async () => {
      const user = userEvent.setup();

      render(
        <CategorySelect
          value={null}
          onChange={vi.fn()}
          categories={mockCategories}
          label="Category"
        />
      );

      await user.click(screen.getByTestId('category-select-trigger'));

      const uncategorizedOption = screen.getByTestId('category-option-uncategorized');
      const colorDot = uncategorizedOption.querySelector('[style*="background-color"]');
      expect(colorDot).not.toBeInTheDocument();
    });
  });
});
