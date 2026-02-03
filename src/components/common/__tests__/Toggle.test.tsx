/**
 * Toggle Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle, type ToggleProps } from '../Toggle';

// =============================================================================
// Test Helpers
// =============================================================================

const defaultProps: ToggleProps = {
  checked: false,
  onChange: vi.fn(),
};

function renderToggle(props: Partial<ToggleProps> = {}) {
  const mergedProps = { ...defaultProps, ...props };
  return render(<Toggle {...mergedProps} />);
}

// =============================================================================
// Tests
// =============================================================================

describe('Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Basic Rendering
  // ---------------------------------------------------------------------------

  describe('Basic Rendering', () => {
    it('renders toggle button', () => {
      renderToggle();

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders with testId', () => {
      renderToggle({ testId: 'my-toggle' });

      expect(screen.getByTestId('my-toggle')).toBeInTheDocument();
    });

    it('renders label when provided', () => {
      renderToggle({ label: 'Enable feature' });

      expect(screen.getByText('Enable feature')).toBeInTheDocument();
    });

    it('does not render label when not provided', () => {
      renderToggle();

      expect(screen.queryByText(/enable/i)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Checked State
  // ---------------------------------------------------------------------------

  describe('Checked State', () => {
    it('shows unchecked state when checked is false', () => {
      renderToggle({ checked: false });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('shows checked state when checked is true', () => {
      renderToggle({ checked: true });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('applies checked styling when checked', () => {
      renderToggle({ checked: true });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('bg-amber-500');
    });

    it('applies unchecked styling when not checked', () => {
      renderToggle({ checked: false });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('bg-gray-300');
    });
  });

  // ---------------------------------------------------------------------------
  // Click Interaction
  // ---------------------------------------------------------------------------

  describe('Click Interaction', () => {
    it('calls onChange with true when clicked while unchecked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderToggle({ checked: false, onChange });

      await user.click(screen.getByRole('switch'));

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when clicked while checked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderToggle({ checked: true, onChange });

      await user.click(screen.getByRole('switch'));

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('clicking label toggles the switch', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderToggle({ checked: false, onChange, label: 'Toggle me' });

      await user.click(screen.getByText('Toggle me'));

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Interaction
  // ---------------------------------------------------------------------------

  describe('Keyboard Interaction', () => {
    it('toggles on Enter key', () => {
      const onChange = vi.fn();
      renderToggle({ checked: false, onChange });

      const toggle = screen.getByRole('switch');
      fireEvent.keyDown(toggle, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('toggles on Space key', () => {
      const onChange = vi.fn();
      renderToggle({ checked: false, onChange });

      const toggle = screen.getByRole('switch');
      fireEvent.keyDown(toggle, { key: ' ' });

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle on other keys', () => {
      const onChange = vi.fn();
      renderToggle({ checked: false, onChange });

      const toggle = screen.getByRole('switch');
      fireEvent.keyDown(toggle, { key: 'a' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State
  // ---------------------------------------------------------------------------

  describe('Disabled State', () => {
    it('has disabled attribute when disabled', () => {
      renderToggle({ disabled: true });

      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('does not call onChange when clicked while disabled', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderToggle({ disabled: true, onChange });

      await user.click(screen.getByRole('switch'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange on Enter when disabled', () => {
      const onChange = vi.fn();
      renderToggle({ disabled: true, onChange });

      const toggle = screen.getByRole('switch');
      fireEvent.keyDown(toggle, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      renderToggle({ disabled: true });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('disabled:opacity-50');
    });
  });

  // ---------------------------------------------------------------------------
  // Size Variants
  // ---------------------------------------------------------------------------

  describe('Size Variants', () => {
    it('renders small size', () => {
      renderToggle({ size: 'sm' });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('w-8', 'h-4');
    });

    it('renders medium size (default)', () => {
      renderToggle({ size: 'md' });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('w-11', 'h-6');
    });

    it('renders large size', () => {
      renderToggle({ size: 'lg' });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('w-14', 'h-7');
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('has role="switch"', () => {
      renderToggle();

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('has aria-checked attribute', () => {
      renderToggle({ checked: true });

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('has aria-label when label provided', () => {
      renderToggle({ label: 'Enable feature' });

      expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Enable feature');
    });

    it('has default aria-label when no label', () => {
      renderToggle();

      expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Toggle');
    });

    it('label is associated with toggle via htmlFor', () => {
      renderToggle({ label: 'Test label' });

      const toggle = screen.getByRole('switch');
      const label = screen.getByText('Test label');

      expect(label).toHaveAttribute('for', toggle.id);
    });
  });
});
