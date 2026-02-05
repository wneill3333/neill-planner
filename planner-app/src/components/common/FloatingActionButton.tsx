/**
 * FloatingActionButton Component
 *
 * A fixed-position circular action button typically used for primary actions.
 * Positioned at the bottom-right of the viewport.
 */

import type { ReactNode, ReactElement } from 'react';

// =============================================================================
// Types
// =============================================================================

export type FABIcon = 'plus' | 'edit' | 'save';

export interface FloatingActionButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Icon to display */
  icon?: FABIcon;
  /** Custom icon element (overrides icon prop) */
  customIcon?: ReactNode;
  /** Accessible label for screen readers */
  ariaLabel: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Icon Components
// =============================================================================

function PlusIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
  );
}

const ICON_MAP: Record<FABIcon, () => ReactElement> = {
  plus: PlusIcon,
  edit: EditIcon,
  save: SaveIcon,
};

// =============================================================================
// Component
// =============================================================================

/**
 * FloatingActionButton - Fixed circular action button
 *
 * A prominent circular button fixed to the bottom-right corner of the viewport.
 * Used for primary or frequent actions like creating new items.
 *
 * Features:
 * - Fixed positioning at bottom-right
 * - Icon variants (plus, edit, save) or custom icon
 * - Hover and focus states
 * - Accessibility support with aria-label
 *
 * @example
 * ```tsx
 * <FloatingActionButton
 *   icon="plus"
 *   ariaLabel="Create new task"
 *   onClick={() => setShowCreateModal(true)}
 * />
 * ```
 */
export function FloatingActionButton({
  onClick,
  icon = 'plus',
  customIcon,
  ariaLabel,
  disabled = false,
  testId,
}: FloatingActionButtonProps) {
  const IconComponent = customIcon || ICON_MAP[icon];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId || 'floating-action-button'}
      className="
        fixed bottom-6 right-6 z-40
        w-14 h-14 sm:w-16 sm:h-16
        rounded-full shadow-lg
        bg-amber-500 text-white
        flex items-center justify-center
        transition-all duration-200
        hover:bg-amber-600 hover:shadow-xl hover:scale-110
        focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-offset-2
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
      "
    >
      {customIcon || <IconComponent />}
    </button>
  );
}

export default FloatingActionButton;
