/**
 * ForwardDateModal Component
 *
 * Modal for selecting a new date when forwarding a task.
 * Used by StatusDropdown when "Forward" status is selected.
 */

import { useState, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { DatePicker } from '../common/DatePicker';
import { addDays } from 'date-fns';

// =============================================================================
// Types
// =============================================================================

export interface ForwardDateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when date is confirmed */
  onConfirm: (newDate: Date) => void;
  /** Current task date (for reference) */
  currentDate?: Date | null;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ForwardDateModal - Date picker modal for forwarding tasks
 *
 * Features:
 * - Date picker for selecting new date
 * - Quick buttons for tomorrow, next week, etc.
 * - Cancel and Confirm buttons
 */
export function ForwardDateModal({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  isSubmitting = false,
  testId = 'forward-date-modal',
}: ForwardDateModalProps) {
  // Default to tomorrow
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    return addDays(new Date(), 1);
  });

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  }, [selectedDate, onConfirm]);

  // Quick date selection helpers
  const handleTomorrow = useCallback(() => {
    setSelectedDate(addDays(new Date(), 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setSelectedDate(addDays(new Date(), 7));
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(addDays(new Date(), 30));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forward Task"
      size="sm"
      testId={testId}
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-4">
        {/* Info text */}
        <p className="text-sm text-gray-600">
          Select a new date for this task. A copy will be created on the new date, and this task will be marked as forwarded.
        </p>

        {/* Quick date buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTomorrow}
            disabled={isSubmitting}
            className="
              px-3 py-1.5 text-sm font-medium rounded-full
              border border-gray-300 bg-white
              hover:bg-gray-50 hover:border-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            data-testid={`${testId}-tomorrow`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            disabled={isSubmitting}
            className="
              px-3 py-1.5 text-sm font-medium rounded-full
              border border-gray-300 bg-white
              hover:bg-gray-50 hover:border-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            data-testid={`${testId}-next-week`}
          >
            Next Week
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isSubmitting}
            className="
              px-3 py-1.5 text-sm font-medium rounded-full
              border border-gray-300 bg-white
              hover:bg-gray-50 hover:border-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            data-testid={`${testId}-next-month`}
          >
            Next Month
          </button>
        </div>

        {/* Date Picker */}
        <DatePicker
          label="Forward to date"
          value={selectedDate}
          onChange={setSelectedDate}
          minDate={addDays(new Date(), 1)} // Must be at least tomorrow
          required
          fullWidth
          disabled={isSubmitting}
          testId={`${testId}-date-picker`}
        />

        {currentDate && (
          <p className="text-xs text-gray-500">
            Currently scheduled for: {currentDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-gray-100 text-gray-700
              hover:bg-gray-200
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            data-testid={`${testId}-cancel`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedDate}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-amber-500 text-white
              hover:bg-amber-600
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
            data-testid={`${testId}-confirm`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Forwarding...
              </span>
            ) : (
              'Forward Task'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ForwardDateModal;
