/**
 * Select Component
 *
 * A reusable select dropdown component with label, error states, and accessibility features.
 * Supports option groups and placeholder text.
 */

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface SelectOption {
  /** Option value */
  value: string;
  /** Option display label */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  /** Select label */
  label?: string;
  /** Options array */
  options: SelectOption[];
  /** Error message to display */
  error?: string;
  /** Helper text to display below select */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to take full width of container */
  fullWidth?: boolean;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Additional CSS classes for the container */
  containerClassName?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Select - Reusable dropdown select with label and error states
 *
 * Supports forwardRef for form libraries and direct DOM access.
 * Includes accessible ARIA attributes for error states and required fields.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Priority"
 *   options={[
 *     { value: 'A', label: 'A - Vital' },
 *     { value: 'B', label: 'B - Important' },
 *   ]}
 *   value={priority}
 *   onChange={(e) => setPriority(e.target.value)}
 *   required
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      required = false,
      fullWidth = false,
      placeholder,
      containerClassName = '',
      id,
      disabled = false,
      testId,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Select Field */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            aria-required={required}
            data-testid={testId}
            className={`
              block w-full px-3 py-2 pr-10 rounded-lg border transition-colors
              text-gray-900 bg-white
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              appearance-none cursor-pointer
              ${
                hasError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            {...props}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow Icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        {hasError && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!hasError && helperText && (
          <p id={helperId} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
