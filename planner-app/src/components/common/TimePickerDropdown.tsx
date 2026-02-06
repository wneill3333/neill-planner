/**
 * TimePickerDropdown Component
 *
 * A dropdown-based time picker with hour, minute, and AM/PM controls.
 * More user-friendly than native <input type="time"> on desktop browsers.
 * Uses the same value/onChange interface as TimePicker (HH:MM 24-hour format).
 */

import { useId, useCallback, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TimePickerDropdownProps {
  /** Time label */
  label?: string;
  /** Time value in HH:MM format (24-hour) */
  value?: string;
  /** Callback when time changes - returns HH:MM string */
  onChange?: (time: string) => void;
  /** Callback when any dropdown loses focus */
  onBlur?: () => void;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to take full width of container */
  fullWidth?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse a 24-hour HH:MM string into 12-hour components
 */
function parse24to12(value: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  if (!value) {
    return { hour12: 12, minute: 0, period: 'AM' };
  }

  const [h, m] = value.split(':').map(Number);
  const hour24 = isNaN(h) ? 0 : h;
  const minute = isNaN(m) ? 0 : m;

  // Round minute to nearest 5
  const roundedMinute = Math.round(minute / 5) * 5;
  const finalMinute = roundedMinute >= 60 ? 0 : roundedMinute;

  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  return { hour12, minute: finalMinute, period };
}

/**
 * Convert 12-hour components back to 24-hour HH:MM string
 */
function to24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let hour24 = hour12 % 12; // 12 -> 0
  if (period === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// =============================================================================
// Component
// =============================================================================

export function TimePickerDropdown({
  label,
  value = '',
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  fullWidth = false,
  disabled = false,
  testId,
}: TimePickerDropdownProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const helperId = `${generatedId}-helper`;
  const hasError = Boolean(error);

  const { hour12, minute, period } = useMemo(() => parse24to12(value), [value]);

  const emit = useCallback(
    (h: number, m: number, p: 'AM' | 'PM') => {
      onChange?.(to24(h, m, p));
    },
    [onChange]
  );

  const handleHourChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      emit(Number(e.target.value), minute, period);
    },
    [emit, minute, period]
  );

  const handleMinuteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      emit(hour12, Number(e.target.value), period);
    },
    [emit, hour12, period]
  );

  const handlePeriodChange = useCallback(
    (newPeriod: 'AM' | 'PM') => {
      emit(hour12, minute, newPeriod);
    },
    [emit, hour12, minute]
  );

  const selectClasses = `
    px-2 py-2 rounded-lg border transition-colors
    text-gray-900 bg-white appearance-none cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    ${hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
  `;

  const periodButtonBase = `
    px-3 py-2 text-sm font-medium transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''} data-testid={testId}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Dropdowns Row */}
      <div className="flex items-center gap-1.5">
        {/* Hour Select */}
        <select
          value={hour12}
          onChange={handleHourChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-label="Hour"
          data-testid={testId ? `${testId}-hour` : undefined}
          className={selectClasses}
        >
          {HOURS_12.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span className="text-gray-500 font-medium">:</span>

        {/* Minute Select */}
        <select
          value={minute}
          onChange={handleMinuteChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-label="Minute"
          data-testid={testId ? `${testId}-minute` : undefined}
          className={selectClasses}
        >
          {MINUTES_5.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>

        {/* AM/PM Toggle */}
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden ml-1">
          <button
            type="button"
            onClick={() => handlePeriodChange('AM')}
            disabled={disabled}
            aria-pressed={period === 'AM'}
            data-testid={testId ? `${testId}-am` : undefined}
            className={`${periodButtonBase} rounded-l-lg border-r border-gray-300 ${
              period === 'AM'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('PM')}
            disabled={disabled}
            aria-pressed={period === 'PM'}
            data-testid={testId ? `${testId}-pm` : undefined}
            className={`${periodButtonBase} rounded-r-lg ${
              period === 'PM'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            PM
          </button>
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

export default TimePickerDropdown;
