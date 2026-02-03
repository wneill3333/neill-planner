/**
 * ColorPicker Component
 *
 * A color selection grid for picking from predefined category colors.
 * Supports keyboard navigation and accessibility features.
 */

import { useId } from 'react';
import { CATEGORY_COLORS, CATEGORY_COLOR_NAMES, type CategoryColor } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface ColorPickerProps {
  /** Currently selected color */
  value: string;
  /** Callback when color is selected */
  onChange: (color: string) => void;
  /** Label for the color picker */
  label?: string;
  /** Whether the picker is required */
  required?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ColorPicker - Grid of selectable colors
 *
 * Displays the predefined category colors in a responsive grid.
 * Keyboard navigable with arrow keys and Enter/Space to select.
 *
 * @example
 * ```tsx
 * <ColorPicker
 *   value={selectedColor}
 *   onChange={(color) => setSelectedColor(color)}
 *   label="Category Color"
 *   required
 * />
 * ```
 */
export function ColorPicker({
  value,
  onChange,
  label = 'Color',
  required = false,
  disabled = false,
  error,
  testId,
}: ColorPickerProps) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const hasError = Boolean(error);

  // Handle color selection
  const handleColorSelect = (color: string) => {
    if (!disabled) {
      onChange(color);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, color: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleColorSelect(color);
    }
  };

  return (
    <div className="w-full" data-testid={testId}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Color Grid */}
      <div
        role="radiogroup"
        aria-label={label}
        aria-required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className="grid grid-cols-4 gap-3 sm:grid-cols-8"
      >
        {CATEGORY_COLORS.map((color) => {
          const isSelected = value === color;
          const colorName = CATEGORY_COLOR_NAMES[color as CategoryColor];

          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={colorName}
              onClick={() => handleColorSelect(color)}
              onKeyDown={(e) => handleKeyDown(e, color)}
              disabled={disabled}
              className={`
                relative w-full aspect-square rounded-lg
                transition-all
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'hover:scale-105'}
              `}
              style={{ backgroundColor: color }}
              data-testid={`color-option-${color}`}
            >
              {/* Checkmark for selected color */}
              {isSelected && (
                <svg
                  className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}

              {/* Screen reader text */}
              <span className="sr-only">
                {colorName} {isSelected ? '(selected)' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {hasError && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default ColorPicker;
