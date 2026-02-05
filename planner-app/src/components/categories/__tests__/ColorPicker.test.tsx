/**
 * ColorPicker Component Tests
 *
 * Comprehensive test suite for the ColorPicker component.
 * Tests color selection, keyboard navigation, accessibility, and states.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '../ColorPicker';
import { CATEGORY_COLORS, CATEGORY_COLOR_NAMES } from '../../../types';

// =============================================================================
// Test Suite
// =============================================================================

describe('ColorPicker', () => {
  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          label="Pick a color"
        />
      );

      expect(screen.getByText('Pick a color')).toBeInTheDocument();
    });

    it('renders with default label when not provided', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} required />
      );

      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveTextContent('*');
    });

    it('renders all 8 predefined colors', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      CATEGORY_COLORS.forEach((color) => {
        const colorButton = screen.getByTestId(`color-option-${color}`);
        expect(colorButton).toBeInTheDocument();
        expect(colorButton).toHaveStyle({ backgroundColor: color });
      });
    });

    it('renders with custom testId', () => {
      const { container } = render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          testId="custom-picker"
        />
      );

      expect(container.querySelector('[data-testid="custom-picker"]')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Selection State Tests
  // ===========================================================================

  describe('Selection State', () => {
    it('marks the selected color with a checkmark', () => {
      const selectedColor = CATEGORY_COLORS[2];
      render(<ColorPicker value={selectedColor} onChange={vi.fn()} />);

      const selectedButton = screen.getByTestId(`color-option-${selectedColor}`);
      // The checkmark is an SVG element
      const checkmark = selectedButton.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
      expect(checkmark).toHaveClass('text-white');
    });

    it('only one color is selected at a time', () => {
      const selectedColor = CATEGORY_COLORS[3];
      render(<ColorPicker value={selectedColor} onChange={vi.fn()} />);

      // Check that only the selected color has aria-checked="true"
      CATEGORY_COLORS.forEach((color) => {
        const button = screen.getByTestId(`color-option-${color}`);
        if (color === selectedColor) {
          expect(button).toHaveAttribute('aria-checked', 'true');
        } else {
          expect(button).toHaveAttribute('aria-checked', 'false');
        }
      });
    });

    it('applies correct styling to selected color', () => {
      const selectedColor = CATEGORY_COLORS[0];
      render(<ColorPicker value={selectedColor} onChange={vi.fn()} />);

      const selectedButton = screen.getByTestId(`color-option-${selectedColor}`);
      expect(selectedButton).toHaveClass('ring-2', 'ring-gray-900', 'scale-110');
    });

    it('updates selection when value prop changes', () => {
      const { rerender } = render(
        <ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />
      );

      const firstButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[0]}`);
      expect(firstButton).toHaveAttribute('aria-checked', 'true');

      rerender(<ColorPicker value={CATEGORY_COLORS[1]} onChange={vi.fn()} />);

      const secondButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      expect(secondButton).toHaveAttribute('aria-checked', 'true');
      expect(firstButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  // ===========================================================================
  // Interaction Tests
  // ===========================================================================

  describe('Color Selection', () => {
    it('calls onChange when color is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const targetColor = CATEGORY_COLORS[4];

      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={handleChange} />);

      const colorButton = screen.getByTestId(`color-option-${targetColor}`);
      await user.click(colorButton);

      expect(handleChange).toHaveBeenCalledWith(targetColor);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onChange when disabled color is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={handleChange}
          disabled
        />
      );

      const colorButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      await user.click(colorButton);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('allows clicking already selected color', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const selectedColor = CATEGORY_COLORS[2];

      render(<ColorPicker value={selectedColor} onChange={handleChange} />);

      const colorButton = screen.getByTestId(`color-option-${selectedColor}`);
      await user.click(colorButton);

      expect(handleChange).toHaveBeenCalledWith(selectedColor);
    });
  });

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('selects color on Enter key press', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const targetColor = CATEGORY_COLORS[3];

      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={handleChange} />);

      const colorButton = screen.getByTestId(`color-option-${targetColor}`);
      colorButton.focus();
      await user.keyboard('{Enter}');

      expect(handleChange).toHaveBeenCalledWith(targetColor);
    });

    it('selects color on Space key press', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const targetColor = CATEGORY_COLORS[5];

      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={handleChange} />);

      const colorButton = screen.getByTestId(`color-option-${targetColor}`);
      colorButton.focus();
      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalledWith(targetColor);
    });

    it('does not trigger onChange on other keys', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={handleChange} />);

      const colorButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      colorButton.focus();
      await user.keyboard('a');
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not select on Enter when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={handleChange}
          disabled
        />
      );

      const colorButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      colorButton.focus();
      await user.keyboard('{Enter}');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Disabled State Tests
  // ===========================================================================

  describe('Disabled State', () => {
    it('disables all color buttons when disabled', () => {
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          disabled
        />
      );

      CATEGORY_COLORS.forEach((color) => {
        const button = screen.getByTestId(`color-option-${color}`);
        expect(button).toBeDisabled();
      });
    });

    it('applies disabled styling to buttons', () => {
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          disabled
        />
      );

      const button = screen.getByTestId(`color-option-${CATEGORY_COLORS[0]}`);
      // Tailwind conditional classes are present in the className
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('does not prevent visual selection of current color', () => {
      const selectedColor = CATEGORY_COLORS[1];
      render(
        <ColorPicker value={selectedColor} onChange={vi.fn()} disabled />
      );

      const selectedButton = screen.getByTestId(`color-option-${selectedColor}`);
      expect(selectedButton).toHaveAttribute('aria-checked', 'true');
    });
  });

  // ===========================================================================
  // Error State Tests
  // ===========================================================================

  describe('Error State', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Please select a color';
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error when error prop is undefined', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      const errorElements = screen.queryAllByRole('alert');
      expect(errorElements).toHaveLength(0);
    });

    it('error message has proper role', () => {
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          error="Error message"
        />
      );

      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('aria-live', 'polite');
    });

    it('sets aria-invalid when error is present', () => {
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          error="Error"
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-invalid', 'true');
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper radiogroup role', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });

    it('each color has radio role', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(CATEGORY_COLORS.length);
    });

    it('color buttons have accessible labels', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      CATEGORY_COLORS.forEach((color) => {
        const colorName = CATEGORY_COLOR_NAMES[color];
        const button = screen.getByLabelText(colorName);
        expect(button).toBeInTheDocument();
      });
    });

    it('selected color includes selection in label', () => {
      const selectedColor = CATEGORY_COLORS[0];
      render(<ColorPicker value={selectedColor} onChange={vi.fn()} />);

      const button = screen.getByTestId(`color-option-${selectedColor}`);
      const srText = within(button).getByText(/selected/i);
      expect(srText).toHaveClass('sr-only');
    });

    it('sets aria-required when required', () => {
      render(
        <ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} required />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-required', 'true');
    });

    it('associates error with radiogroup via aria-describedby', () => {
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          error="Error message"
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      const errorId = radioGroup.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();

      const errorElement = document.getElementById(errorId!);
      expect(errorElement).toHaveTextContent('Error message');
    });

    it('radiogroup has accessible label', () => {
      const labelText = 'Choose a color';
      render(
        <ColorPicker
          value={CATEGORY_COLORS[0]}
          onChange={vi.fn()}
          label={labelText}
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-label', labelText);
    });
  });

  // ===========================================================================
  // Visual/Layout Tests
  // ===========================================================================

  describe('Visual and Layout', () => {
    it('renders in a grid layout', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveClass('grid');
    });

    it('applies correct color to each button', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      CATEGORY_COLORS.forEach((color) => {
        const button = screen.getByTestId(`color-option-${color}`);
        // Check the inline style attribute rather than computed style
        // which returns RGB values instead of hex
        expect(button).toHaveStyle({ backgroundColor: color });
      });
    });

    it('shows hover effect styling on unselected colors', () => {
      render(<ColorPicker value={CATEGORY_COLORS[0]} onChange={vi.fn()} />);

      const unselectedButton = screen.getByTestId(`color-option-${CATEGORY_COLORS[1]}`);
      expect(unselectedButton).toHaveClass('hover:scale-105');
    });
  });
});
