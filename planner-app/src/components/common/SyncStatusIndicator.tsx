/**
 * SyncStatusIndicator Component
 *
 * A small, unobtrusive indicator showing the current sync status.
 * Displays an icon and tooltip based on the sync state.
 */

import { useState } from 'react';
import { SYNC_STATUS_INFO } from '../../types/common.types';
import { useAppSelector } from '../../store/hooks';
import { selectSyncStatus } from '../../features/sync/syncSlice';

// =============================================================================
// Types
// =============================================================================

export interface SyncStatusIndicatorProps {
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SyncStatusIndicator - Display current sync status
 *
 * Features:
 * - Shows icon and color based on sync status
 * - Tooltip with status label on hover
 * - Real-time updates from Redux state
 * - Spinning animation for 'syncing' status
 * - Small, unobtrusive design
 *
 * @example
 * ```tsx
 * <SyncStatusIndicator />
 * ```
 */
export function SyncStatusIndicator({ className, testId }: SyncStatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const syncStatus = useAppSelector(selectSyncStatus);
  const statusInfo = SYNC_STATUS_INFO[syncStatus];

  return (
    <div
      className={`relative inline-flex items-center ${className || ''}`}
      data-testid={testId || 'sync-status-indicator'}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      {/* Status Icon */}
      <div
        className={`
          flex items-center justify-center
          w-8 h-8 rounded-full
          transition-all duration-200
          ${syncStatus === 'syncing' ? 'animate-spin' : ''}
        `}
        style={{ color: statusInfo.color }}
        role="status"
        aria-label={`Sync status: ${statusInfo.label}`}
      >
        <span
          className="text-lg font-semibold"
          aria-hidden="true"
        >
          {statusInfo.icon}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="
            absolute top-full right-0 mt-2
            px-3 py-1.5 rounded-md
            bg-gray-900 text-white text-sm whitespace-nowrap
            shadow-lg z-50
            pointer-events-none
          "
          role="tooltip"
        >
          {statusInfo.label}
          {/* Tooltip arrow */}
          <div
            className="
              absolute bottom-full right-4
              w-0 h-0
              border-l-4 border-r-4 border-b-4
              border-transparent border-b-gray-900
            "
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
