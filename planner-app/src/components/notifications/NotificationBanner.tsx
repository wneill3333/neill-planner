/**
 * NotificationBanner Component
 *
 * Toast-style notification banner at top of screen.
 * Shows reminder title and time, with snooze and dismiss options.
 * Auto-dismisses after 10 seconds with slide-down animation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReminderNotification, SnoozeOption } from '../../types/reminder.types';
import { SNOOZE_OPTIONS, SNOOZE_OPTION_LABELS } from '../../types/reminder.types';
import { Select, type SelectOption } from '../common/Select';
import { Button } from '../common/Button';

// =============================================================================
// Types
// =============================================================================

export interface NotificationBannerProps {
  /** Notification to display */
  notification: ReminderNotification;
  /** Callback when notification is dismissed */
  onDismiss: (notificationId: string) => void;
  /** Callback when notification is snoozed */
  onSnooze: (notificationId: string, minutes: SnoozeOption) => void;
  /** Auto-dismiss duration in seconds (default: 10) */
  autoDismissSeconds?: number;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_AUTO_DISMISS_SECONDS = 10;

const SNOOZE_SELECT_OPTIONS: SelectOption[] = SNOOZE_OPTIONS.map((minutes) => ({
  value: minutes.toString(),
  label: SNOOZE_OPTION_LABELS[minutes],
}));

// =============================================================================
// Component
// =============================================================================

/**
 * NotificationBanner - In-app notification toast
 *
 * Displays at the top of the screen with slide-down animation.
 * Auto-dismisses after specified duration unless user interacts with it.
 *
 * @example
 * ```tsx
 * <NotificationBanner
 *   notification={notification}
 *   onDismiss={(id) => dismissNotification(id)}
 *   onSnooze={(id, minutes) => snoozeNotification(id, minutes)}
 * />
 * ```
 */
export function NotificationBanner({
  notification,
  onDismiss,
  onSnooze,
  autoDismissSeconds = DEFAULT_AUTO_DISMISS_SECONDS,
  testId,
}: NotificationBannerProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [selectedSnoozeMinutes, setSelectedSnoozeMinutes] = useState<SnoozeOption>(15);
  const [countdown, setCountdown] = useState<number>(autoDismissSeconds);

  // Ref to track latest handleDismiss to avoid stale closure in auto-dismiss
  const handleDismissRef = useRef<(() => void) | null>(null);

  // Slide in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Wait for animation before calling onDismiss
    setTimeout(() => {
      onDismiss(notification.reminderId);
    }, 300);
  }, [notification.reminderId, onDismiss]);

  // Keep ref updated with latest handleDismiss
  useEffect(() => {
    handleDismissRef.current = handleDismiss;
  }, [handleDismiss]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (autoDismissSeconds <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (handleDismissRef.current) {
            handleDismissRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoDismissSeconds]);

  // Handle snooze
  const handleSnooze = useCallback(() => {
    setVisible(false);
    // Wait for animation before calling onSnooze
    setTimeout(() => {
      onSnooze(notification.reminderId, selectedSnoozeMinutes);
    }, 300);
  }, [notification.reminderId, selectedSnoozeMinutes, onSnooze]);

  // Get priority color
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-amber-50 border-amber-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        transform transition-transform duration-300 ease-out
        ${visible ? 'translate-y-0' : '-translate-y-full'}
      `}
      role="alert"
      aria-live="assertive"
      data-testid={testId || 'notification-banner'}
    >
      <div className={`
        mx-4 mt-4 p-4 rounded-lg border shadow-lg
        ${getPriorityColor()}
      `}>
        <div className="max-w-7xl mx-auto">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            {/* Left: Icon and Content */}
            <div className="flex items-start gap-3 flex-1">
              {/* Bell Icon */}
              <div className="flex-shrink-0 mt-0.5">
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

              {/* Title and Time */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 mb-1">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600">
                  {notification.body}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.scheduledTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Right: Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="
                flex-shrink-0 p-1 rounded text-gray-400
                hover:text-gray-600 hover:bg-gray-200
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              "
              aria-label="Dismiss notification"
              data-testid="dismiss-notification-button"
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

          {/* Actions Row */}
          {notification.canSnooze && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Snooze Dropdown */}
              <div className="w-40">
                <Select
                  options={SNOOZE_SELECT_OPTIONS}
                  value={selectedSnoozeMinutes.toString()}
                  onChange={(e) => setSelectedSnoozeMinutes(parseInt(e.target.value, 10) as SnoozeOption)}
                  testId="snooze-select"
                  aria-label="Snooze duration"
                />
              </div>

              {/* Snooze Button */}
              <Button
                variant="secondary"
                onClick={handleSnooze}
                className="text-sm"
                data-testid="snooze-button"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Snooze
                </span>
              </Button>

              {/* Countdown */}
              {autoDismissSeconds > 0 && (
                <span
                  className="text-xs text-gray-500 ml-auto"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  Auto-dismiss in {countdown}s
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationBanner;
