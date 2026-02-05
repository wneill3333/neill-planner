/**
 * Input Component Tests
 *
 * Comprehensive tests for the Input component including:
 * - Rendering with label
 * - Error message display
 * - ARIA attributes for accessibility
 * - onChange event handling
 * - Required field indicator
 * - Disabled state
 * - Helper text
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

// =============================================================================
// Rendering Tests
// =============================================================================

describe('Input - Rendering', () => {
  it('should render input with label', () => {
    render(<Input label="Task Title" />);

    expect(screen.getByLabelText('Task Title')).toBeInTheDocument();
  });

  it('should render input without label', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(<Input label="Title" placeholder="Enter task title" />);

    expect(screen.getByPlaceholderText('Enter task title')).toBeInTheDocument();
  });

  it('should render with default value', () => {
    render(<Input label="Title" defaultValue="Default text" />);

    expect(screen.getByDisplayValue('Default text')).toBeInTheDocument();
  });

  it('should render with controlled value', () => {
    render(<Input label="Title" value="Controlled value" onChange={() => {}} />);

    expect(screen.getByDisplayValue('Controlled value')).toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    render(<Input label="Title" testId="custom-input" />);

    expect(screen.getByTestId('custom-input')).toBeInTheDocument();
  });

  it('should render as full width', () => {
    const { container } = render(<Input label="Title" fullWidth />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full');
  });

  it('should apply custom container className', () => {
    const { container } = render(<Input label="Title" containerClassName="mt-4" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('mt-4');
  });
});

// =============================================================================
// Label and Required Indicator Tests
// =============================================================================

describe('Input - Label and Required', () => {
  it('should show required indicator when required is true', () => {
    render(<Input label="Task Title" required />);

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText('required')).toBeInTheDocument();
  });

  it('should not show required indicator when required is false', () => {
    render(<Input label="Task Title" required={false} />);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should associate label with input via htmlFor', () => {
    render(<Input label="Task Title" id="task-title-input" />);

    const label = screen.getByText('Task Title');
    const input = screen.getByLabelText('Task Title');

    expect(label).toHaveAttribute('for', 'task-title-input');
    expect(input).toHaveAttribute('id', 'task-title-input');
  });

  it('should generate unique ID when id prop is not provided', () => {
    const { container } = render(<Input label="Title 1" />);
    const input = container.querySelector('input');

    expect(input).toHaveAttribute('id');
    expect(input?.id).toBeTruthy();
  });
});

// =============================================================================
// Error State Tests
// =============================================================================

describe('Input - Error State', () => {
  it('should show error message when error prop is provided', () => {
    render(<Input label="Title" error="Title is required" />);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('should not show error message when error prop is undefined', () => {
    render(<Input label="Title" />);

    const errorElements = screen.queryAllByRole('alert');
    expect(errorElements).toHaveLength(0);
  });

  it('should apply error styles when error is present', () => {
    render(<Input label="Title" error="Title is required" />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveClass('border-red-300');
  });

  it('should apply normal styles when no error', () => {
    render(<Input label="Title" />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveClass('border-gray-300');
  });

  it('should display error with role="alert"', () => {
    render(<Input label="Title" error="Title is required" />);

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Title is required');
  });

  it('should have aria-live="polite" on error message', () => {
    render(<Input label="Title" error="Title is required" />);

    const error = screen.getByRole('alert');
    expect(error).toHaveAttribute('aria-live', 'polite');
  });

  it('should not show helper text when error is present', () => {
    render(<Input label="Title" helperText="Enter a title" error="Title is required" />);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter a title')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Helper Text Tests
// =============================================================================

describe('Input - Helper Text', () => {
  it('should show helper text when provided', () => {
    render(<Input label="Title" helperText="Enter a descriptive title" />);

    expect(screen.getByText('Enter a descriptive title')).toBeInTheDocument();
  });

  it('should not show helper text when not provided', () => {
    const { container } = render(<Input label="Title" />);

    const helperText = container.querySelector('.text-gray-500');
    expect(helperText).not.toBeInTheDocument();
  });

  it('should have correct ID for helper text', () => {
    render(<Input label="Title" id="test-input" helperText="Helper text" />);

    const helperText = screen.getByText('Helper text');
    expect(helperText).toHaveAttribute('id', 'test-input-helper');
  });
});

// =============================================================================
// ARIA Attributes Tests
// =============================================================================

describe('Input - ARIA Attributes', () => {
  it('should have aria-invalid="false" when no error', () => {
    render(<Input label="Title" />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should have aria-invalid="true" when error is present', () => {
    render(<Input label="Title" error="Title is required" />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have aria-required when required is true', () => {
    render(<Input label="Title" required />);

    const input = screen.getByLabelText(/Title/);
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should have aria-describedby pointing to error when error is present', () => {
    render(<Input label="Title" id="test-input" error="Title is required" />);

    const input = screen.getByLabelText('Title');
    const errorId = 'test-input-error';

    expect(input).toHaveAttribute('aria-describedby', errorId);
    expect(screen.getByText('Title is required')).toHaveAttribute('id', errorId);
  });

  it('should have aria-describedby pointing to helper when helper text is present', () => {
    render(<Input label="Title" id="test-input" helperText="Enter a title" />);

    const input = screen.getByLabelText('Title');
    const helperId = 'test-input-helper';

    expect(input).toHaveAttribute('aria-describedby', helperId);
    expect(screen.getByText('Enter a title')).toHaveAttribute('id', helperId);
  });

  it('should not have aria-describedby when no error or helper text', () => {
    render(<Input label="Title" />);

    const input = screen.getByLabelText('Title');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});

// =============================================================================
// Interaction Tests
// =============================================================================

describe('Input - Interactions', () => {
  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input label="Title" onChange={handleChange} />);

    const input = screen.getByLabelText('Title');
    await user.type(input, 'New task');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('New task');
  });

  it('should update value on user input', async () => {
    const user = userEvent.setup();

    render(<Input label="Title" defaultValue="" />);

    const input = screen.getByLabelText('Title');
    await user.type(input, 'Task title');

    expect(input).toHaveValue('Task title');
  });

  it('should call onBlur when input loses focus', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<Input label="Title" onBlur={handleBlur} />);

    const input = screen.getByLabelText('Title');
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should call onFocus when input receives focus', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();

    render(<Input label="Title" onFocus={handleFocus} />);

    const input = screen.getByLabelText('Title');
    await user.click(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// Disabled State Tests
// =============================================================================

describe('Input - Disabled State', () => {
  it('should render as disabled when disabled prop is true', () => {
    render(<Input label="Title" disabled />);

    const input = screen.getByLabelText('Title');
    expect(input).toBeDisabled();
  });

  it('should not render as disabled when disabled prop is false', () => {
    render(<Input label="Title" disabled={false} />);

    const input = screen.getByLabelText('Title');
    expect(input).not.toBeDisabled();
  });

  it('should apply disabled styles when disabled', () => {
    render(<Input label="Title" disabled />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveClass('disabled:bg-gray-100');
    expect(input).toHaveClass('disabled:text-gray-500');
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('should not accept input when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input label="Title" disabled onChange={handleChange} />);

    const input = screen.getByLabelText('Title');

    // Try to type - should not work
    await user.type(input, 'Text');

    expect(handleChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });
});

// =============================================================================
// Input Types Tests
// =============================================================================

describe('Input - Input Types', () => {
  it('should render as text input by default', () => {
    render(<Input label="Title" />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render as email input when type="email"', () => {
    render(<Input label="Email" type="email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render as password input when type="password"', () => {
    render(<Input label="Password" type="password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render as number input when type="number"', () => {
    render(<Input label="Age" type="number" />);

    const input = screen.getByLabelText('Age');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should render as date input when type="date"', () => {
    render(<Input label="Date" type="date" />);

    const input = screen.getByLabelText('Date');
    expect(input).toHaveAttribute('type', 'date');
  });
});

// =============================================================================
// Ref Tests
// =============================================================================

describe('Input - Ref Forwarding', () => {
  it('should forward ref to input element', () => {
    const ref = { current: null as HTMLInputElement | null };

    render(<Input label="Title" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('should allow calling focus on ref', () => {
    const ref = { current: null as HTMLInputElement | null };

    render(<Input label="Title" ref={ref} />);

    ref.current?.focus();

    expect(document.activeElement).toBe(ref.current);
  });
});

// =============================================================================
// Additional Props Tests
// =============================================================================

describe('Input - Additional Props', () => {
  it('should pass through maxLength attribute', () => {
    render(<Input label="Title" maxLength={100} />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('maxLength', '100');
  });

  it('should pass through minLength attribute', () => {
    render(<Input label="Title" minLength={3} />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('minLength', '3');
  });

  it('should pass through autoComplete attribute', () => {
    render(<Input label="Email" type="email" autoComplete="email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });

  it('should pass through autoFocus attribute', () => {
    render(<Input label="Title" autoFocus />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveFocus();
  });

  it('should pass through name attribute', () => {
    render(<Input label="Title" name="task-title" />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('name', 'task-title');
  });

  it('should pass through pattern attribute', () => {
    render(<Input label="Code" pattern="[0-9]{4}" />);

    const input = screen.getByLabelText('Code');
    expect(input).toHaveAttribute('pattern', '[0-9]{4}');
  });

  it('should pass through readOnly attribute', () => {
    render(<Input label="Title" readOnly />);

    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('readOnly');
  });
});
