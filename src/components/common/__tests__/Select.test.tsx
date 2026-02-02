/**
 * Select Component Tests
 *
 * Comprehensive tests for the Select component including:
 * - Rendering with label and options
 * - Error message display
 * - ARIA attributes for accessibility
 * - onChange event handling
 * - Required field indicator
 * - Disabled state
 * - Helper text
 * - Placeholder
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, type SelectOption } from '../Select';

// =============================================================================
// Test Data
// =============================================================================

const mockOptions: SelectOption[] = [
  { value: 'A', label: 'Option A' },
  { value: 'B', label: 'Option B' },
  { value: 'C', label: 'Option C' },
];

const priorityOptions: SelectOption[] = [
  { value: 'A', label: 'A - Vital (must do today)' },
  { value: 'B', label: 'B - Important (should do today)' },
  { value: 'C', label: 'C - Optional (nice to do)' },
  { value: 'D', label: 'D - Delegate (can be deferred)' },
];

// =============================================================================
// Rendering Tests
// =============================================================================

describe('Select - Rendering', () => {
  it('should render select with label', () => {
    render(<Select label="Priority" options={mockOptions} />);

    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<Select label="Priority" options={mockOptions} />);

    const select = screen.getByLabelText('Priority');
    expect(select).toBeInTheDocument();

    // Check each option is rendered
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(<Select label="Category" options={mockOptions} placeholder="Select a category" />);

    expect(screen.getByText('Select a category')).toBeInTheDocument();
  });

  it('should render placeholder as disabled option', () => {
    render(<Select label="Category" options={mockOptions} placeholder="Select a category" />);

    const placeholderOption = screen.getByText('Select a category');
    expect(placeholderOption).toHaveAttribute('disabled');
  });

  it('should render select without label', () => {
    render(<Select options={mockOptions} testId="no-label-select" />);

    const select = screen.getByTestId('no-label-select');
    expect(select).toBeInTheDocument();
  });

  it('should render with controlled value', () => {
    render(<Select label="Priority" options={mockOptions} value="B" onChange={() => {}} />);

    const select = screen.getByLabelText('Priority') as HTMLSelectElement;
    expect(select.value).toBe('B');
  });

  it('should render with custom testId', () => {
    render(<Select label="Priority" options={mockOptions} testId="custom-select" />);

    expect(screen.getByTestId('custom-select')).toBeInTheDocument();
  });

  it('should render as full width', () => {
    const { container } = render(<Select label="Priority" options={mockOptions} fullWidth />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full');
  });

  it('should apply custom container className', () => {
    const { container } = render(
      <Select label="Priority" options={mockOptions} containerClassName="mt-4" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('mt-4');
  });

  it('should render disabled options', () => {
    const optionsWithDisabled: SelectOption[] = [
      { value: 'A', label: 'Option A' },
      { value: 'B', label: 'Option B', disabled: true },
      { value: 'C', label: 'Option C' },
    ];

    render(<Select label="Priority" options={optionsWithDisabled} />);

    const optionB = screen.getByText('Option B');
    expect(optionB).toHaveAttribute('disabled');
  });
});

// =============================================================================
// Label and Required Indicator Tests
// =============================================================================

describe('Select - Label and Required', () => {
  it('should show required indicator when required is true', () => {
    render(<Select label="Priority" options={mockOptions} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText('required')).toBeInTheDocument();
  });

  it('should not show required indicator when required is false', () => {
    render(<Select label="Priority" options={mockOptions} required={false} />);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should associate label with select via htmlFor', () => {
    render(<Select label="Priority" options={mockOptions} id="priority-select" />);

    const label = screen.getByText('Priority');
    const select = screen.getByLabelText('Priority');

    expect(label).toHaveAttribute('for', 'priority-select');
    expect(select).toHaveAttribute('id', 'priority-select');
  });

  it('should generate unique ID when id prop is not provided', () => {
    const { container } = render(<Select label="Priority" options={mockOptions} />);
    const select = container.querySelector('select');

    expect(select).toHaveAttribute('id');
    expect(select?.id).toBeTruthy();
  });
});

// =============================================================================
// Error State Tests
// =============================================================================

describe('Select - Error State', () => {
  it('should show error message when error prop is provided', () => {
    render(<Select label="Priority" options={mockOptions} error="Priority is required" />);

    expect(screen.getByText('Priority is required')).toBeInTheDocument();
  });

  it('should not show error message when error prop is undefined', () => {
    render(<Select label="Priority" options={mockOptions} />);

    const errorElements = screen.queryAllByRole('alert');
    expect(errorElements).toHaveLength(0);
  });

  it('should apply error styles when error is present', () => {
    render(<Select label="Priority" options={mockOptions} error="Priority is required" />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveClass('border-red-300');
  });

  it('should apply normal styles when no error', () => {
    render(<Select label="Priority" options={mockOptions} />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveClass('border-gray-300');
  });

  it('should display error with role="alert"', () => {
    render(<Select label="Priority" options={mockOptions} error="Priority is required" />);

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Priority is required');
  });

  it('should have aria-live="polite" on error message', () => {
    render(<Select label="Priority" options={mockOptions} error="Priority is required" />);

    const error = screen.getByRole('alert');
    expect(error).toHaveAttribute('aria-live', 'polite');
  });

  it('should not show helper text when error is present', () => {
    render(
      <Select
        label="Priority"
        options={mockOptions}
        helperText="Select a priority"
        error="Priority is required"
      />
    );

    expect(screen.getByText('Priority is required')).toBeInTheDocument();
    expect(screen.queryByText('Select a priority')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Helper Text Tests
// =============================================================================

describe('Select - Helper Text', () => {
  it('should show helper text when provided', () => {
    render(<Select label="Priority" options={mockOptions} helperText="Select your task priority" />);

    expect(screen.getByText('Select your task priority')).toBeInTheDocument();
  });

  it('should not show helper text when not provided', () => {
    const { container } = render(<Select label="Priority" options={mockOptions} />);

    const helperText = container.querySelector('.text-gray-500');
    expect(helperText).not.toBeInTheDocument();
  });

  it('should have correct ID for helper text', () => {
    render(
      <Select label="Priority" options={mockOptions} id="test-select" helperText="Helper text" />
    );

    const helperText = screen.getByText('Helper text');
    expect(helperText).toHaveAttribute('id', 'test-select-helper');
  });
});

// =============================================================================
// ARIA Attributes Tests
// =============================================================================

describe('Select - ARIA Attributes', () => {
  it('should have aria-invalid="false" when no error', () => {
    render(<Select label="Priority" options={mockOptions} />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveAttribute('aria-invalid', 'false');
  });

  it('should have aria-invalid="true" when error is present', () => {
    render(<Select label="Priority" options={mockOptions} error="Priority is required" />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have aria-required when required is true', () => {
    render(<Select label="Priority" options={mockOptions} required />);

    const select = screen.getByLabelText(/Priority/);
    expect(select).toHaveAttribute('aria-required', 'true');
  });

  it('should have aria-describedby pointing to error when error is present', () => {
    render(
      <Select label="Priority" options={mockOptions} id="test-select" error="Priority is required" />
    );

    const select = screen.getByLabelText('Priority');
    const errorId = 'test-select-error';

    expect(select).toHaveAttribute('aria-describedby', errorId);
    expect(screen.getByText('Priority is required')).toHaveAttribute('id', errorId);
  });

  it('should have aria-describedby pointing to helper when helper text is present', () => {
    render(
      <Select label="Priority" options={mockOptions} id="test-select" helperText="Select a priority" />
    );

    const select = screen.getByLabelText('Priority');
    const helperId = 'test-select-helper';

    expect(select).toHaveAttribute('aria-describedby', helperId);
    expect(screen.getByText('Select a priority')).toHaveAttribute('id', helperId);
  });

  it('should not have aria-describedby when no error or helper text', () => {
    render(<Select label="Priority" options={mockOptions} />);

    const select = screen.getByLabelText('Priority');
    expect(select).not.toHaveAttribute('aria-describedby');
  });
});

// =============================================================================
// Interaction Tests
// =============================================================================

describe('Select - Interactions', () => {
  it('should call onChange when user selects an option', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Select label="Priority" options={mockOptions} onChange={handleChange} />);

    const select = screen.getByLabelText('Priority');
    await user.selectOptions(select, 'B');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should update value on user selection', async () => {
    const user = userEvent.setup();

    render(<Select label="Priority" options={mockOptions} defaultValue="A" />);

    const select = screen.getByLabelText('Priority') as HTMLSelectElement;
    expect(select.value).toBe('A');

    await user.selectOptions(select, 'C');
    expect(select.value).toBe('C');
  });

  it('should call onBlur when select loses focus', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<Select label="Priority" options={mockOptions} onBlur={handleBlur} />);

    const select = screen.getByLabelText('Priority');
    await user.click(select);
    await user.tab();

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should call onFocus when select receives focus', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();

    render(<Select label="Priority" options={mockOptions} onFocus={handleFocus} />);

    const select = screen.getByLabelText('Priority');
    await user.click(select);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// Disabled State Tests
// =============================================================================

describe('Select - Disabled State', () => {
  it('should render as disabled when disabled prop is true', () => {
    render(<Select label="Priority" options={mockOptions} disabled />);

    const select = screen.getByLabelText('Priority');
    expect(select).toBeDisabled();
  });

  it('should not render as disabled when disabled prop is false', () => {
    render(<Select label="Priority" options={mockOptions} disabled={false} />);

    const select = screen.getByLabelText('Priority');
    expect(select).not.toBeDisabled();
  });

  it('should apply disabled styles when disabled', () => {
    render(<Select label="Priority" options={mockOptions} disabled />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveClass('disabled:bg-gray-100');
    expect(select).toHaveClass('disabled:text-gray-500');
    expect(select).toHaveClass('disabled:cursor-not-allowed');
  });

  it('should not allow selection when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select label="Priority" options={mockOptions} disabled onChange={handleChange} value="A" />
    );

    const select = screen.getByLabelText('Priority');

    // Try to select - should not work
    await user.selectOptions(select, 'B');

    expect(handleChange).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Ref Tests
// =============================================================================

describe('Select - Ref Forwarding', () => {
  it('should forward ref to select element', () => {
    const ref = { current: null as HTMLSelectElement | null };

    render(<Select label="Priority" options={mockOptions} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    expect(ref.current?.tagName).toBe('SELECT');
  });

  it('should allow calling focus on ref', () => {
    const ref = { current: null as HTMLSelectElement | null };

    render(<Select label="Priority" options={mockOptions} ref={ref} />);

    ref.current?.focus();

    expect(document.activeElement).toBe(ref.current);
  });
});

// =============================================================================
// Options Rendering Tests
// =============================================================================

describe('Select - Options Rendering', () => {
  it('should render priority options correctly', () => {
    render(<Select label="Priority" options={priorityOptions} />);

    expect(screen.getByText('A - Vital (must do today)')).toBeInTheDocument();
    expect(screen.getByText('B - Important (should do today)')).toBeInTheDocument();
    expect(screen.getByText('C - Optional (nice to do)')).toBeInTheDocument();
    expect(screen.getByText('D - Delegate (can be deferred)')).toBeInTheDocument();
  });

  it('should render empty options array without crashing', () => {
    render(<Select label="Empty" options={[]} />);

    const select = screen.getByLabelText('Empty');
    expect(select).toBeInTheDocument();
  });

  it('should render options with special characters', () => {
    const specialOptions: SelectOption[] = [
      { value: '1', label: 'Option with "quotes"' },
      { value: '2', label: "Option with 'apostrophe'" },
      { value: '3', label: 'Option with <brackets>' },
    ];

    render(<Select label="Special" options={specialOptions} />);

    expect(screen.getByText('Option with "quotes"')).toBeInTheDocument();
    expect(screen.getByText("Option with 'apostrophe'")).toBeInTheDocument();
    expect(screen.getByText('Option with <brackets>')).toBeInTheDocument();
  });

  it('should preserve option order', () => {
    render(<Select label="Priority" options={mockOptions} testId="ordered-select" />);

    const select = screen.getByTestId('ordered-select');
    const options = select.querySelectorAll('option');

    expect(options[0]).toHaveTextContent('Option A');
    expect(options[1]).toHaveTextContent('Option B');
    expect(options[2]).toHaveTextContent('Option C');
  });
});

// =============================================================================
// Additional Props Tests
// =============================================================================

describe('Select - Additional Props', () => {
  it('should pass through name attribute', () => {
    render(<Select label="Priority" options={mockOptions} name="task-priority" />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveAttribute('name', 'task-priority');
  });

  it('should pass through autoFocus attribute', () => {
    render(<Select label="Priority" options={mockOptions} autoFocus />);

    const select = screen.getByLabelText('Priority');
    expect(select).toHaveFocus();
  });
});
