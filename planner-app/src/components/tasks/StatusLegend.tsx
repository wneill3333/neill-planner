/**
 * StatusLegend Component
 *
 * Displays a legend showing all task status symbols with their labels.
 * Useful for helping users understand what each status symbol means.
 */

import { memo } from 'react';
import {
  getStatusSymbol,
  getStatusColor,
  getStatusLabel,
  getAllStatuses,
} from '../../utils/statusUtils';

// =============================================================================
// Types
// =============================================================================

export interface StatusLegendProps {
  /** Whether to show in a compact horizontal layout */
  compact?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StatusLegend - Shows all status symbols with labels
 *
 * Two layout modes:
 * - Default: Horizontal row with all statuses
 * - Compact: Smaller text, tighter spacing
 */
function StatusLegendComponent({
  compact = false,
  className = '',
  testId = 'status-legend',
}: StatusLegendProps) {
  const allStatuses = getAllStatuses();

  return (
    <div
      className={`
        flex flex-wrap items-center gap-4
        ${compact ? 'text-xs gap-3' : 'text-sm gap-4'}
        ${className}
      `}
      role="list"
      aria-label="Task status legend"
      data-testid={testId}
    >
      {allStatuses.map((status) => {
        const symbol = getStatusSymbol(status);
        const color = getStatusColor(status);
        const label = getStatusLabel(status);

        return (
          <div
            key={status}
            className="flex items-center gap-1.5"
            role="listitem"
          >
            <span
              className={compact ? 'text-base' : 'text-lg'}
              style={{ color }}
              aria-hidden="true"
            >
              {symbol}
            </span>
            <span className="text-gray-600">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Export memoized component
export const StatusLegend = memo(StatusLegendComponent);

export default StatusLegend;
