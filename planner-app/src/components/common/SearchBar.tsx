/**
 * SearchBar Component
 *
 * Search input with debouncing, clear button, and keyboard accessibility.
 * Designed for the application header.
 */

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface SearchBarProps {
  /** Current search query value */
  value: string;
  /** Callback when search value changes (debounced) */
  onChange: (value: string) => void;
  /** Callback when search is cleared */
  onClear?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether search is in progress */
  isSearching?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SearchBar - Debounced search input component
 *
 * Features:
 * - Debounced input (default 300ms)
 * - Clear button when text present
 * - Escape key to clear
 * - Search icon
 * - Loading indicator
 * - Full keyboard accessibility
 * - ARIA labels for screen readers
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={handleSearch}
 *   placeholder="Search tasks, events, notes..."
 * />
 * ```
 */
export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  debounceMs = 300,
  isSearching = false,
  className = '',
  testId = 'search-bar',
}: SearchBarProps) {
  // Local input value (not debounced)
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop value changes externally
  useEffect(() => {
    setInputValue(value);
    // Clear any pending debounce when value is externally changed
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [value]);

  // Handle input change with debouncing
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to call onChange after debounce delay
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  // Handle clear button click
  const handleClear = () => {
    setInputValue('');
    onChange('');
    onClear?.();
    // Focus input after clearing
    inputRef.current?.focus();
  };

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Clear on Escape key
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} data-testid={testId}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {isSearching ? (
          // Loading spinner
          <svg
            className="w-5 h-5 text-gray-400 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          // Search icon
          <svg
            className="w-5 h-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          w-full py-2 pl-10 pr-10 text-sm
          bg-white border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
          placeholder-gray-400
          transition-colors duration-150
        "
        aria-label="Search"
        aria-describedby={inputValue ? 'search-clear-btn' : undefined}
        data-testid="search-input"
      />

      {/* Clear Button */}
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute inset-y-0 right-0 flex items-center pr-3
            text-gray-400 hover:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            transition-colors duration-150
          "
          aria-label="Clear search"
          id="search-clear-btn"
          data-testid="search-clear-button"
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
