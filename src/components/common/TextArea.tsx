/**
 * TextArea Component
 *
 * A reusable textarea component with label, error states, and accessibility features.
 * Supports configurable rows and resize behavior.
 */

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /** Textarea label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below textarea */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to take full width of container */
  fullWidth?: boolean;
  /** Number of visible text rows */
  rows?: number;
  /** Whether the textarea is resizable */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Additional CSS classes for the container */
  containerClassName?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TextArea - Reusable textarea with label and error states
 *
 * Supports forwardRef for form libraries and direct DOM access.
 * Includes accessible ARIA attributes for error states and required fields.
 *
 * @example
 * ```tsx
 * <TextArea
 *   label="Description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   rows={4}
 *   helperText="Optional task details"
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      fullWidth = false,
      rows = 3,
      resize = 'vertical',
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
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const hasError = Boolean(error);

    // Map resize prop to Tailwind class
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
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

        {/* Textarea Field */}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
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
            ${resizeClass}
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

TextArea.displayName = 'TextArea';

export default TextArea;
