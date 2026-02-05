/**
 * TimePicker Component
 *
 * A time input component with label, error states, and HH:MM format.
 * Uses native HTML time input for accessibility and mobile support.
 */

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TimePickerProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'className' | 'step'
  > {
  /** Time label */
  label?: string;
  /** Time value in HH:MM format (24-hour) */
  value?: string;
  /** Callback when time changes - returns HH:MM string */
  onChange?: (time: string) => void;
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
  /** Step interval in seconds (default 300 = 5 minutes) */
  step?: number;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate time string format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  if (!time) return true; // Empty is valid
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// =============================================================================
// Component
// =============================================================================

/**
 * TimePicker - Time input in HH:MM format
 *
 * Supports forwardRef for form libraries and direct DOM access.
 * Includes accessible ARIA attributes and time validation.
 *
 * @example
 * ```tsx
 * <TimePicker
 *   label="Scheduled Time"
 *   value={scheduledTime}
 *   onChange={setScheduledTime}
 *   helperText="Optional specific time"
 * />
 * ```
 */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      label,
      value = '',
      onChange,
      error,
      helperText,
      required = false,
      fullWidth = false,
      containerClassName = '',
      step = 300, // 5 minutes default
      id,
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

    // Round minutes to nearest step interval
    const roundToStep = (timeStr: string): string => {
      if (!timeStr || step <= 60) return timeStr; // No rounding needed for 1-minute or smaller steps

      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return timeStr;

      const stepMinutes = Math.floor(step / 60);
      const roundedMinutes = Math.round(minutes / stepMinutes) * stepMinutes;

      // Handle overflow (e.g., 60 minutes -> next hour)
      const finalHours = roundedMinutes >= 60 ? (hours + 1) % 24 : hours;
      const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;

      return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Validate format before calling onChange
      if (isValidTimeFormat(newValue) || newValue === '') {
        // Round to nearest step interval
        const roundedValue = newValue ? roundToStep(newValue) : newValue;
        onChange?.(roundedValue);
      }
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

        {/* Time Input Field */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="time"
            value={value}
            onChange={handleChange}
            step={step}
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

          {/* Clock Icon */}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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

TimePicker.displayName = 'TimePicker';

export default TimePicker;
