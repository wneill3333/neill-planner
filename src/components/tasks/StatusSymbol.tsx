/**
 * StatusSymbol Component
 *
 * A clickable status symbol that displays the current task status
 * and allows cycling through statuses on click.
 *
 * Features:
 * - Visual representation with colored unicode symbols
 * - Click-to-cycle through statuses
 * - Keyboard navigation (arrow keys to cycle forward/backward)
 * - Tooltip showing current status and next status
 * - Loading state during updates
 * - Size variants (sm, md, lg)
 */

import { memo } from 'react';
import type { TaskStatus } from '../../types';
import {
  getStatusSymbol,
  getStatusColor,
  getStatusLabel,
  getStatusDescription,
  getNextStatus,
} from '../../utils/statusUtils';

// =============================================================================
// Types
// =============================================================================

export interface StatusSymbolProps {
  /** Current task status */
  status: TaskStatus;
  /** Callback when symbol is clicked (cycles to next status) */
  onClick?: () => void;
  /** Callback for cycling backward (used with arrow keys) */
  onCycleBackward?: () => void;
  /** Whether the status is being updated */
  isUpdating?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Size Configurations
// =============================================================================

const SIZE_CLASSES = {
  sm: 'w-5 h-5 text-sm',
  md: 'w-6 h-6 text-lg',
  lg: 'w-8 h-8 text-2xl',
} as const;

const SPINNER_SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const;

// =============================================================================
// Component
// =============================================================================

/**
 * StatusSymbol - Displays a clickable task status indicator
 *
 * @param props - StatusSymbolProps
 * @returns JSX element representing a status symbol button
 */
function StatusSymbolComponent({
  status,
  onClick,
  onCycleBackward,
  isUpdating = false,
  disabled = false,
  size = 'md',
  showTooltip = true,
  testId = 'status-symbol',
}: StatusSymbolProps) {
  const symbol = getStatusSymbol(status);
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  const description = getStatusDescription(status);
  const nextStatus = getNextStatus(status);
  const nextLabel = getStatusLabel(nextStatus);

  // Build tooltip text
  const tooltipText = showTooltip
    ? `${label}: ${description}. Click to change to ${nextLabel}.`
    : undefined;

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUpdating && !disabled) {
      onClick?.();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isUpdating || disabled) return;

    // Arrow right/down cycles forward
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      onClick?.();
    }
    // Arrow left/up cycles backward
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      onCycleBackward?.();
    }
  };

  const isDisabled = isUpdating || disabled;

  return (
    <button
      type="button"
      className={`
        flex items-center justify-center rounded-full flex-shrink-0
        transition-all duration-150
        hover:bg-gray-200 hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-transparent
        ${SIZE_CLASSES[size]}
      `}
      style={{ color: isDisabled ? undefined : color }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      title={tooltipText}
      aria-label={`Status: ${label}. ${isUpdating ? 'Updating...' : 'Click to change.'}`}
      aria-busy={isUpdating}
      aria-disabled={isDisabled}
      data-testid={testId}
      data-status={status}
    >
      {isUpdating ? (
        <span
          className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${SPINNER_SIZES[size]}`}
          aria-hidden="true"
          data-testid="status-spinner"
        />
      ) : (
        <span aria-hidden="true">{symbol}</span>
      )}
    </button>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: StatusSymbolProps, nextProps: StatusSymbolProps): boolean {
  return (
    prevProps.status === nextProps.status &&
    prevProps.isUpdating === nextProps.isUpdating &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.size === nextProps.size &&
    prevProps.showTooltip === nextProps.showTooltip
  );
}

// Export memoized component
export const StatusSymbol = memo(StatusSymbolComponent, arePropsEqual);

export default StatusSymbol;
