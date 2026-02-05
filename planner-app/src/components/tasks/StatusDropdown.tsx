/**
 * StatusDropdown Component
 *
 * A dropdown menu for selecting task status.
 * Displays all 5 status options with symbols and labels.
 * When "Forward" is selected, triggers a callback for date selection.
 */

import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import type { TaskStatus } from '../../types';
import {
  getStatusSymbol,
  getStatusColor,
  getStatusLabel,
  getAllStatuses,
} from '../../utils/statusUtils';

// =============================================================================
// Types
// =============================================================================

export interface StatusDropdownProps {
  /** Current task status */
  status: TaskStatus;
  /** Callback when status is changed */
  onStatusChange: (newStatus: TaskStatus) => void;
  /** Callback when forward status is selected (to trigger date picker) */
  onForwardSelect?: () => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Whether the component is in updating state */
  isUpdating?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StatusDropdown - Dropdown menu for status selection
 *
 * Features:
 * - Click to open dropdown menu
 * - Shows symbol + label for each status
 * - "Forward" triggers date selection callback
 * - Keyboard accessible
 */
function StatusDropdownComponent({
  status,
  onStatusChange,
  onForwardSelect,
  disabled = false,
  isUpdating = false,
  testId = 'status-dropdown',
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentSymbol = getStatusSymbol(status);
  const currentColor = getStatusColor(status);
  const currentLabel = getStatusLabel(status);
  const allStatuses = getAllStatuses();

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is outside both the button and the menu
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isUpdating) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  // Handle status selection
  const handleStatusSelect = (newStatus: TaskStatus) => {
    if (newStatus === 'forward' && onForwardSelect) {
      // Forward requires date selection
      setIsOpen(false);
      onForwardSelect();
    } else {
      onStatusChange(newStatus);
      setIsOpen(false);
    }
  };

  // Handle button click
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !isUpdating) {
      setIsOpen(!isOpen);
    }
  };

  const isDisabled = disabled || isUpdating;

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block"
      data-testid={testId}
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Status: ${currentLabel}. Click to change.`}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md
          border border-gray-300 bg-white
          transition-all duration-150
          hover:border-gray-400 hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300
          ${isOpen ? 'border-blue-500 shadow-sm' : ''}
        `}
        data-testid={`${testId}-button`}
      >
        {isUpdating ? (
          <span
            className="inline-block w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"
            aria-hidden="true"
            data-testid={`${testId}-spinner`}
          />
        ) : (
          <span
            className="text-lg leading-none"
            style={{ color: currentColor }}
            aria-hidden="true"
          >
            {currentSymbol}
          </span>
        )}
        {/* Dropdown arrow */}
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - rendered via Portal to escape stacking context */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="
            fixed z-[9999]
            min-w-[160px] py-1
            bg-white rounded-md shadow-lg
            border border-gray-200
          "
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          role="listbox"
          aria-label="Status options"
          data-testid={`${testId}-menu`}
        >
          {allStatuses.map((statusOption) => {
            const symbol = getStatusSymbol(statusOption);
            const color = getStatusColor(statusOption);
            const label = getStatusLabel(statusOption);
            const isSelected = statusOption === status;

            return (
              <button
                key={statusOption}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusSelect(statusOption);
                }}
                role="option"
                aria-selected={isSelected}
                className={`
                  w-full flex items-center gap-2 px-3 py-2
                  text-left text-sm
                  transition-colors duration-100
                  hover:bg-gray-100
                  focus:outline-none focus:bg-gray-100
                  ${isSelected ? 'bg-gray-50 font-medium' : ''}
                `}
                data-testid={`${testId}-option-${statusOption}`}
              >
                <span
                  className="text-lg leading-none"
                  style={{ color }}
                  aria-hidden="true"
                >
                  {symbol}
                </span>
                <span className="text-gray-800">{label}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 ml-auto text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: StatusDropdownProps, nextProps: StatusDropdownProps): boolean {
  return (
    prevProps.status === nextProps.status &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isUpdating === nextProps.isUpdating
  );
}

// Export memoized component
export const StatusDropdown = memo(StatusDropdownComponent, arePropsEqual);

export default StatusDropdown;
