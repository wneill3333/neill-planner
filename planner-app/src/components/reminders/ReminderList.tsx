/**
 * ReminderList Component
 *
 * Display list of reminders for a task or event.
 * Shows type icon, time description, and delete button per reminder.
 */

import type { Reminder } from '../../types/reminder.types';
import { REMINDER_TYPE_LABELS } from '../../types/reminder.types';
import { getReminderTypeIcon, formatMinutesBefore } from '../../utils/reminderUtils';

// =============================================================================
// Types
// =============================================================================

export interface ReminderListProps {
  /** List of reminders to display */
  reminders: Reminder[];
  /** Callback when a reminder is deleted */
  onDelete?: (reminderId: string) => void;
  /** Whether the list is in read-only mode */
  readOnly?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ReminderList - Display list of reminders
 *
 * @example
 * ```tsx
 * <ReminderList
 *   reminders={taskReminders}
 *   onDelete={(id) => deleteReminder(id)}
 * />
 * ```
 */
export function ReminderList({
  reminders,
  onDelete,
  readOnly = false,
  testId,
}: ReminderListProps) {
  // If no reminders, show empty state
  if (reminders.length === 0) {
    return (
      <div
        className="text-center py-6 text-gray-500 text-sm"
        data-testid={testId || 'reminder-list'}
      >
        No reminders set
      </div>
    );
  }

  return (
    <div
      className="space-y-2"
      data-testid={testId || 'reminder-list'}
    >
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="
            flex items-center justify-between p-3
            bg-white border border-gray-200 rounded-lg
            hover:border-gray-300 transition-colors
          "
          data-testid={`reminder-item-${reminder.id}`}
        >
          {/* Left: Icon and Details */}
          <div className="flex items-center gap-3 flex-1">
            {/* Type Icon */}
            <div
              className="
                flex items-center justify-center w-10 h-10
                bg-gray-100 rounded-full
              "
              aria-label={REMINDER_TYPE_LABELS[reminder.type]}
            >
              <span className="text-xl">
                {getReminderTypeIcon(reminder.type)}
              </span>
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {REMINDER_TYPE_LABELS[reminder.type]}
              </span>
              <span className="text-xs text-gray-600">
                {formatMinutesBefore(reminder.minutesBefore)}
              </span>
              {/* Status badge if triggered or snoozed */}
              {reminder.status === 'triggered' && (
                <span className="text-xs text-blue-600 font-medium mt-1">
                  ● Triggered
                </span>
              )}
              {reminder.status === 'snoozed' && (
                <span className="text-xs text-amber-600 font-medium mt-1">
                  ⏰ Snoozed
                </span>
              )}
              {reminder.status === 'dismissed' && (
                <span className="text-xs text-gray-400 font-medium mt-1">
                  ✓ Dismissed
                </span>
              )}
            </div>
          </div>

          {/* Right: Delete Button */}
          {!readOnly && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(reminder.id)}
              className="
                p-2 rounded-lg text-gray-400
                hover:text-red-600 hover:bg-red-50
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
              aria-label="Delete reminder"
              data-testid={`delete-reminder-${reminder.id}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ReminderList;
