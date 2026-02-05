/**
 * NotificationPermissionBanner Component
 *
 * Banner shown when notifications are not enabled.
 * Includes "Enable Notifications" button and dismiss option.
 * Shows at top of app.
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '../common/Button';

// =============================================================================
// Types
// =============================================================================

export interface NotificationPermissionBannerProps {
  /** Callback when user enables notifications */
  onEnable: () => Promise<boolean>;
  /** Callback when user dismisses the banner */
  onDismiss?: () => void;
  /** Whether to show the banner initially */
  show?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Local Storage Key
// =============================================================================

const DISMISSED_KEY = 'notification-permission-banner-dismissed';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if notification permission banner has been dismissed
 */
function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark notification permission banner as dismissed
 */
function setDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, 'true');
  } catch {
    // Fail silently
  }
}

/**
 * Clear dismissed state (for testing or settings reset)
 */
export function clearNotificationPermissionDismissed(): void {
  try {
    localStorage.removeItem(DISMISSED_KEY);
  } catch {
    // Fail silently
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * NotificationPermissionBanner - Banner to request notification permissions
 *
 * Shows at the top of the app when notification permissions haven't been granted.
 * Can be dismissed, which stores a flag in localStorage.
 *
 * @example
 * ```tsx
 * <NotificationPermissionBanner
 *   onEnable={async () => {
 *     const granted = await requestNotificationPermission();
 *     return granted;
 *   }}
 *   onDismiss={() => console.log('Dismissed')}
 * />
 * ```
 */
export function NotificationPermissionBanner({
  onEnable,
  onDismiss,
  show = true,
  testId,
}: NotificationPermissionBannerProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Check if banner should be shown on mount
  useEffect(() => {
    if (show && !isDismissed()) {
      setVisible(true);
    }
  }, [show]);

  // Handle enable button click
  const handleEnable = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await onEnable();
      if (granted) {
        setVisible(false);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [onEnable]);

  // Handle dismiss button click
  const handleDismiss = useCallback(() => {
    setDismissed();
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <div
      className="
        bg-gradient-to-r from-amber-50 to-amber-100
        border-b border-amber-200
        px-4 py-3
      "
      role="alert"
      data-testid={testId || 'notification-permission-banner'}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Icon and Message */}
        <div className="flex items-center gap-3 flex-1">
          {/* Bell Icon */}
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Enable notifications to get reminders
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Stay on top of your tasks and events with timely notifications
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleEnable}
            disabled={loading}
            className="text-sm"
            data-testid="enable-notifications-button"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enabling...
              </span>
            ) : (
              'Enable Notifications'
            )}
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="
              p-2 rounded-lg text-gray-500
              hover:text-gray-700 hover:bg-amber-200
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label="Dismiss notification banner"
            data-testid="dismiss-banner-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionBanner;
