/**
 * Icon Components
 *
 * Simple SVG icon components for use throughout the application.
 * Icons follow the same sizing (24x24 viewBox) and stroke pattern.
 */

import { memo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface IconProps {
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the icon */
  ariaLabel?: string;
}

// =============================================================================
// Icon Components
// =============================================================================

/**
 * CheckIcon - Task completion/checklist icon
 *
 * @param props - IconProps
 * @returns JSX element representing a check/task icon
 */
function CheckIconComponent({ className = 'w-5 h-5', ariaLabel }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

/**
 * CalendarIcon - Calendar/date icon
 *
 * @param props - IconProps
 * @returns JSX element representing a calendar icon
 */
function CalendarIconComponent({ className = 'w-5 h-5', ariaLabel }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * NoteIcon - Notes/document icon
 *
 * @param props - IconProps
 * @returns JSX element representing a note/document icon
 */
function NoteIconComponent({ className = 'w-5 h-5', ariaLabel }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

// Export memoized components
export const CheckIcon = memo(CheckIconComponent);
export const CalendarIcon = memo(CalendarIconComponent);
export const NoteIcon = memo(NoteIconComponent);
