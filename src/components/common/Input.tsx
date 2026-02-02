/**
 * Input Component
 *
 * A reusable text input component with label, error states, and accessibility features.
 * Supports various HTML input types and full-width layout option.
 */

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to take full width of container */
  fullWidth?: boolean;
  /** Additional CSS classes for the container */
  containerClassName?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Input - Reusable text input with label and error states
 *
 * Supports forwardRef for form libraries and direct DOM access.
 * Includes accessible ARIA attributes for error states and required fields.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Task Title"
 *   value={title}
 *   onChange={(e) => setTitle(e.target.value)}
 *   required
 *   error={errors.title}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      fullWidth = false,
      containerClassName = '',
      id,
      type = 'text',
      disabled = false,
      testId,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
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

        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          aria-required={required}
          data-testid={testId}
          className={`
            block w-full px-3 py-2 rounded-lg border transition-colors
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
          {...props}
        />

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

Input.displayName = 'Input';

export default Input;
