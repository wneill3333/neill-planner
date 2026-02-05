/**
 * ReminderForm Component
 *
 * Form to add/edit reminders on tasks or events.
 * Allows multiple reminders with different notification types and times.
 */

import { useState, useCallback } from 'react';
import type { ReminderType, CreateReminderInput } from '../../types/reminder.types';
import { REMINDER_TYPE_LABELS, REMINDER_TIME_PRESETS } from '../../types/reminder.types';
import { Select, type SelectOption } from '../common/Select';
import { Button } from '../common/Button';
import { getReminderTypeIcon, formatMinutesBefore } from '../../utils/reminderUtils';

// =============================================================================
// Types
// =============================================================================

export interface ReminderFormProps {
  /** Current reminders for the task/event */
  reminders: CreateReminderInput[];
  /** Callback when reminders are updated (supports functional updates) */
  onChange: (reminders: CreateReminderInput[] | ((prev: CreateReminderInput[]) => CreateReminderInput[])) => void;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const REMINDER_TYPE_OPTIONS: SelectOption[] = [
  { value: 'push', label: REMINDER_TYPE_LABELS.push },
  { value: 'email', label: REMINDER_TYPE_LABELS.email },
  { value: 'inApp', label: REMINDER_TYPE_LABELS.inApp },
];

const REMINDER_TIME_OPTIONS: SelectOption[] = REMINDER_TIME_PRESETS.map((preset) => ({
  value: preset.minutes.toString(),
  label: preset.label,
}));

// =============================================================================
// Component
// =============================================================================

/**
 * ReminderForm - Form for managing reminders on tasks/events
 *
 * @example
 * ```tsx
 * <ReminderForm
 *   reminders={reminders}
 *   onChange={(updated) => setReminders(updated)}
 * />
 * ```
 */
export function ReminderForm({
  reminders,
  onChange,
  disabled = false,
  testId,
}: ReminderFormProps) {
  // Local state for new reminder being added
  const [newReminderType, setNewReminderType] = useState<ReminderType>('inApp');
  const [newReminderMinutes, setNewReminderMinutes] = useState<number>(15);

  // Add a new reminder
  const handleAddReminder = useCallback(() => {
    const newReminder: CreateReminderInput = {
      type: newReminderType,
      minutesBefore: newReminderMinutes,
    };
    // Use functional update to avoid stale closure issues
    onChange((prevReminders) => [...prevReminders, newReminder]);
  }, [newReminderType, newReminderMinutes, onChange]);

  // Remove a reminder by index
  const handleRemoveReminder = useCallback(
    (index: number) => {
      const updated = reminders.filter((_, i) => i !== index);
      onChange(updated);
    },
    [reminders, onChange]
  );

  return (
    <div
      className="space-y-4"
      data-testid={testId || 'reminder-form'}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Reminders</h3>
        <p className="text-xs text-gray-500">
          {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Existing Reminders List */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              data-testid={`reminder-item-${index}`}
            >
              <div className="flex items-center gap-3">
                {/* Type Icon */}
                <span className="text-xl" aria-label={REMINDER_TYPE_LABELS[reminder.type]}>
                  {getReminderTypeIcon(reminder.type)}
                </span>

                {/* Details */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {REMINDER_TYPE_LABELS[reminder.type]}
                  </span>
                  <span className="text-xs text-gray-600">
                    {formatMinutesBefore(reminder.minutesBefore)}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveReminder(index)}
                disabled={disabled}
                className="
                  p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                aria-label="Remove reminder"
                data-testid={`remove-reminder-${index}`}
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
          ))}
        </div>
      )}

      {/* Add New Reminder Section */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Add New Reminder</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Reminder Type Select */}
          <Select
            label="Type"
            options={REMINDER_TYPE_OPTIONS}
            value={newReminderType}
            onChange={(e) => setNewReminderType(e.target.value as ReminderType)}
            disabled={disabled}
            fullWidth
            testId="reminder-type-select"
          />

          {/* Minutes Before Select */}
          <Select
            label="Time"
            options={REMINDER_TIME_OPTIONS}
            value={newReminderMinutes.toString()}
            onChange={(e) => setNewReminderMinutes(parseInt(e.target.value, 10))}
            disabled={disabled}
            fullWidth
            testId="reminder-time-select"
          />
        </div>

        {/* Add Button */}
        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddReminder}
            disabled={disabled}
            className="w-full sm:w-auto"
            data-testid="add-reminder-button"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Reminder
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReminderForm;
