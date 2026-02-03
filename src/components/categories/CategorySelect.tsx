/**
 * CategorySelect Component
 *
 * Custom dropdown component for selecting categories with color indicators.
 * Unlike native <select>, this allows displaying color dots next to category names.
 */

import { useState, useRef, useEffect, useId, useCallback, useMemo, memo } from 'react';
import type { Category } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CategorySelectProps {
  /** Currently selected category ID (null for uncategorized) */
  value: string | null;
  /** Callback when category selection changes */
  onChange: (value: string | null) => void;
  /** Available categories to select from */
  categories: Category[];
  /** Label for the select field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below select */
  helperText?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CategorySelect - Custom dropdown with color indicators
 *
 * Features:
 * - Color dots next to category names
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Accessibility with ARIA attributes
 * - Matches existing form field styling
 *
 * @example
 * ```tsx
 * <CategorySelect
 *   value={categoryId}
 *   onChange={(id) => setCategoryId(id)}
 *   categories={categories}
 *   label="Category"
 * />
 * ```
 */
function CategorySelectComponent({
  value,
  onChange,
  categories,
  label = 'Category',
  required = false,
  disabled = false,
  error,
  helperText,
  testId,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectId = useId();
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = Boolean(error);

  // Find selected category
  const selectedCategory = categories.find((cat) => cat.id === value);

  // All options (uncategorized + categories)
  const options = useMemo(
    () => [
      { id: null, name: 'None (Uncategorized)', color: null },
      ...categories.map((cat) => ({ id: cat.id, name: cat.name, color: cat.color })),
    ],
    [categories]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key to close dropdown
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Reset focused index when dropdown closes
  // This is a legitimate use of setState in effect - responding to external state change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Handle category selection
  const handleSelect = useCallback((categoryId: string | null) => {
    onChange(categoryId);
    setIsOpen(false);
    buttonRef.current?.focus();
  }, [onChange]);

  // Handle keyboard navigation in dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        // Open dropdown on Enter, Space, or Arrow Down when closed
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      // Navigation when dropdown is open
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    },
    [isOpen, focusedIndex, options, handleSelect]
  );

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const optionElement = dropdownRef.current?.querySelector(
        `[data-option-index="${focusedIndex}"]`
      );
      if (optionElement && typeof optionElement.scrollIntoView === 'function') {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="w-full" data-testid={testId}>
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

      {/* Trigger Button */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={selectId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          aria-required={required}
          className={`
            block w-full px-3 py-2 pr-10 rounded-lg border transition-colors
            text-left bg-white
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
          data-testid={testId ? `${testId}-trigger` : 'category-select-trigger'}
        >
          <div className="flex items-center gap-2">
            {/* Color Dot */}
            {selectedCategory && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedCategory.color }}
                aria-hidden="true"
              />
            )}

            {/* Selected Text */}
            <span className={`flex-1 truncate ${!selectedCategory ? 'text-gray-500' : 'text-gray-900'}`}>
              {selectedCategory ? selectedCategory.name : 'Select category'}
            </span>
          </div>

          {/* Dropdown Arrow */}
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
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={label}
            className="
              absolute z-50 mt-1 w-full
              bg-white rounded-lg shadow-lg
              border border-gray-200
              max-h-60 overflow-auto
            "
            data-testid={testId ? `${testId}-dropdown` : 'category-select-dropdown'}
          >
            {options.map((option, index) => {
              const isSelected = option.id === value;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={option.id || 'uncategorized'}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.id)}
                  data-option-index={index}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2
                    transition-colors
                    ${isFocused ? 'bg-gray-100' : ''}
                    ${isSelected ? 'bg-amber-50' : ''}
                    hover:bg-gray-100
                    focus:outline-none
                  `}
                  data-testid={`category-option-${option.id || 'uncategorized'}`}
                >
                  {/* Color Dot (or placeholder for uncategorized) */}
                  {option.color ? (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  )}

                  {/* Category Name */}
                  <span className="flex-1 text-sm text-gray-900 truncate">
                    {option.name}
                  </span>

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-amber-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
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

export const CategorySelect = memo(CategorySelectComponent);

export default CategorySelect;
