/**
 * Toggle Component
 *
 * A reusable toggle switch for boolean on/off states.
 * Supports labels, disabled state, and full accessibility.
 */

import { useId, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ToggleProps {
  /** Whether the toggle is on */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Label text to display next to toggle */
  label?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Size Classes
// =============================================================================

const SIZE_CLASSES = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
    label: 'text-sm',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    label: 'text-base',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
    label: 'text-lg',
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * Toggle - Accessible toggle switch component
 *
 * @example
 * ```tsx
 * <Toggle
 *   label="Enable notifications"
 *   checked={enabled}
 *   onChange={setEnabled}
 * />
 * ```
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  testId,
}: ToggleProps) {
  const id = useId();
  const sizeClasses = SIZE_CLASSES[size];

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, onChange, checked]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  }, [disabled, onChange, checked]);

  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses.track}
          ${checked ? 'bg-amber-500' : 'bg-gray-300'}
        `}
        data-testid={testId || 'toggle'}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow
            transform transition-transform duration-200 ease-in-out
            ${sizeClasses.thumb}
            ${checked ? sizeClasses.translate : 'translate-x-0.5'}
          `}
        />
      </button>

      {label && (
        <label
          htmlFor={id}
          className={`
            font-medium text-gray-700 cursor-pointer select-none
            ${sizeClasses.label}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={handleClick}
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Toggle;
