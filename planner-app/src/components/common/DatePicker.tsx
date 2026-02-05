/**
 * DatePicker Component
 *
 * A date input component with label, error states, and date constraints.
 * Uses native HTML date input with date-fns for formatting and validation.
 */

import { forwardRef, useId, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { format, parse, isValid } from 'date-fns';

// =============================================================================
// Types
// =============================================================================

export interface DatePickerProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'className'
  > {
  /** Date label */
  label?: string;
  /** Selected date value */
  value?: Date | null;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
  /** Minimum allowed date */
  minDate?: Date;
  /** Maximum allowed date */
  maxDate?: Date;
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
  /** Automatically open the native calendar picker on mount */
  autoOpen?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert Date to YYYY-MM-DD format for input value
 */
function dateToInputValue(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse input value (YYYY-MM-DD) to Date object
 */
function inputValueToDate(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DatePicker - Date input with constraints and formatting
 *
 * Supports forwardRef for form libraries and direct DOM access.
 * Includes accessible ARIA attributes and date validation.
 *
 * @example
 * ```tsx
 * <DatePicker
 *   label="Scheduled Date"
 *   value={scheduledDate}
 *   onChange={setScheduledDate}
 *   minDate={new Date()}
 *   required
 * />
 * ```
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      minDate,
      maxDate,
      error,
      helperText,
      required = false,
      fullWidth = false,
      containerClassName = '',
      id,
      disabled = false,
      testId,
      autoOpen = false,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const generatedId = useId();
    const internalRef = useRef<HTMLInputElement>(null);

    // Auto-open the native calendar picker when autoOpen is true
    useEffect(() => {
      if (autoOpen && internalRef.current) {
        // Small delay to ensure the input is rendered and focused
        const timer = setTimeout(() => {
          try {
            internalRef.current?.showPicker();
          } catch {
            // showPicker() may not be supported in all browsers, fail silently
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [autoOpen]);
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    // Convert Date values to string format for input
    const inputValue = dateToInputValue(value || null);
    const minDateStr = minDate ? dateToInputValue(minDate) : undefined;
    const maxDateStr = maxDate ? dateToInputValue(maxDate) : undefined;

    // Handle input change
    // Note: min/max constraints are handled by the native HTML5 date input via min/max attributes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const newDate = inputValueToDate(newValue);
      onChange?.(newDate);
    };

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

        {/* Date Input Field */}
        <div className="relative">
          <input
            ref={(node) => {
              // Handle both internal ref and forwarded ref
              internalRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            type="date"
            value={inputValue}
            onChange={handleChange}
            min={minDateStr}
            max={maxDateStr}
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
              ${
                hasError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            {...props}
          />

          {/* Calendar Icon */}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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

DatePicker.displayName = 'DatePicker';

export default DatePicker;
