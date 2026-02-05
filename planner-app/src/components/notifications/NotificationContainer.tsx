/**
 * NotificationContainer Component
 *
 * Container that renders active notifications.
 * Stacks multiple notifications vertically.
 * Can use Redux state for active notifications or accept as props.
 */

import { NotificationBanner } from './NotificationBanner';
import type { ReminderNotification, SnoozeOption } from '../../types/reminder.types';

// =============================================================================
// Types
// =============================================================================

export interface NotificationContainerProps {
  /** Array of active notifications to display */
  notifications: ReminderNotification[];
  /** Callback when a notification is dismissed */
  onDismiss: (notificationId: string) => void;
  /** Callback when a notification is snoozed */
  onSnooze: (notificationId: string, minutes: SnoozeOption) => void;
  /** Maximum number of notifications to show at once */
  maxVisible?: number;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_VISIBLE = 3;

// =============================================================================
// Component
// =============================================================================

/**
 * NotificationContainer - Container for displaying multiple notifications
 *
 * Manages the display of multiple notification banners, stacking them vertically
 * and limiting the number visible at once.
 *
 * @example
 * ```tsx
 * <NotificationContainer
 *   notifications={activeNotifications}
 *   onDismiss={(id) => dismissNotification(id)}
 *   onSnooze={(id, minutes) => snoozeNotification(id, minutes)}
 *   maxVisible={3}
 * />
 * ```
 */
export function NotificationContainer({
  notifications,
  onDismiss,
  onSnooze,
  maxVisible = DEFAULT_MAX_VISIBLE,
  testId,
}: NotificationContainerProps) {
  // If no notifications, don't render
  if (notifications.length === 0) {
    return null;
  }

  // Sort notifications by priority (high -> medium -> low) and then by creation time
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.triggeredAt.getTime() - b.triggeredAt.getTime();
  });

  // Limit to max visible
  const visibleNotifications = sortedNotifications.slice(0, maxVisible);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      data-testid={testId || 'notification-container'}
    >
      <div className="space-y-2 pointer-events-auto">
        {visibleNotifications.map((notification, index) => (
          <div
            key={notification.reminderId}
            style={{
              // Stack notifications with slight offset
              transform: `translateY(${index * 4}px)`,
              zIndex: 50 - index,
            }}
          >
            <NotificationBanner
              notification={notification}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
              testId={`notification-banner-${notification.reminderId}`}
            />
          </div>
        ))}

        {/* Show count of hidden notifications if any */}
        {notifications.length > maxVisible && (
          <div className="mx-4 mt-2">
            <div className="max-w-7xl mx-auto">
              <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                <p className="text-xs text-gray-600 text-center">
                  +{notifications.length - maxVisible} more notification
                  {notifications.length - maxVisible !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationContainer;
