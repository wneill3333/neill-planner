/**
 * EventForm Component
 *
 * Main form for creating and editing events.
 * Includes title, description, start/end times, location, category, confidential toggle, and recurrence.
 */

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import type {
  Event,
  Category,
  CreateEventInput,
  RecurrencePattern,
} from '../../types';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { TimePicker } from '../common/TimePicker';
import { Toggle } from '../common/Toggle';
import { CategorySelect } from '../categories/CategorySelect';
import { RecurrenceForm } from '../tasks/RecurrenceForm';

// =============================================================================
// Types
// =============================================================================

export interface EventFormProps {
  /** Existing event to edit (null for create mode) */
  event?: Event | null;
  /** Available categories for selection */
  categories?: Category[];
  /** Default start time for new events */
  defaultStartTime?: Date | null;
  /** Callback when form is submitted */
  onSubmit: (data: CreateEventInput) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether form is in submitting state */
  isSubmitting?: boolean;
  /** Test ID for testing */
  testId?: string;
}

interface FormData {
  title: string;
  description: string;
  startTime: Date | null;
  endTime: Date | null;
  location: string;
  categoryId: string;
  isConfidential: boolean;
  alternateTitle: string;
  recurrence: RecurrencePattern | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  alternateTitle?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TITLE_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 5000;
const LOCATION_MAX_LENGTH = 500;
const ALTERNATE_TITLE_MAX_LENGTH = 500;

/**
 * Default recurrence pattern used when enabling recurrence for the first time
 */
const DEFAULT_RECURRENCE_PATTERN: RecurrencePattern = {
  type: 'daily',
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  endCondition: {
    type: 'never',
    endDate: null,
    maxOccurrences: null,
  },
  exceptions: [],
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert Date to HH:MM format
 */
function dateToTimeString(date: Date | null): string {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Create Date from time string (HH:MM) and optional base date
 */
function timeStringToDate(timeStr: string, baseDate?: Date): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const date = baseDate ? new Date(baseDate) : new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Validate form data
 */
function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  // Title is required
  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
  }

  // Description max length check
  if (data.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`;
  }

  // Start time is required
  if (!data.startTime) {
    errors.startTime = 'Start time is required';
  }

  // End time is required
  if (!data.endTime) {
    errors.endTime = 'End time is required';
  }

  // End time must be after start time
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    errors.endTime = 'End time must be after start time';
  }

  // Location max length check
  if (data.location.length > LOCATION_MAX_LENGTH) {
    errors.location = `Location must be ${LOCATION_MAX_LENGTH} characters or less`;
  }

  // Alternate title is required when confidential
  if (data.isConfidential && !data.alternateTitle.trim()) {
    errors.alternateTitle = 'Alternate title is required for confidential events';
  } else if (data.alternateTitle.length > ALTERNATE_TITLE_MAX_LENGTH) {
    errors.alternateTitle = `Alternate title must be ${ALTERNATE_TITLE_MAX_LENGTH} characters or less`;
  }

  return errors;
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
function formatCreatedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Convert form data to CreateEventInput
 */
function formDataToEventInput(data: FormData): CreateEventInput {
  const input: CreateEventInput = {
    title: data.title.trim(),
    description: data.description.trim(),
    categoryId: data.categoryId || null,
    startTime: data.startTime!,
    endTime: data.endTime!,
    location: data.location.trim(),
    isConfidential: data.isConfidential,
    alternateTitle: data.isConfidential && data.alternateTitle.trim() ? data.alternateTitle.trim() : null,
    recurrence: data.recurrence,
  };

  return input;
}

/**
 * Create initial form data from an event or defaults
 * @param e - Existing event to populate from, or null for defaults
 * @param defaultStart - Default start time for new events
 * @returns FormData object with populated values
 */
function createFormDataFromEvent(e: Event | null, defaultStart?: Date | null): FormData {
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

  return {
    title: e?.title || '',
    description: e?.description || '',
    startTime: e?.startTime || defaultStart || now,
    endTime: e?.endTime || defaultEnd,
    location: e?.location || '',
    categoryId: e?.categoryId || '',
    isConfidential: e?.isConfidential || false,
    alternateTitle: e?.alternateTitle || '',
    recurrence: e?.recurrence || null,
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * EventForm - Form for creating and editing events
 *
 * Handles form validation, state management, and submission.
 * Supports both create and edit modes based on the event prop.
 *
 * @example
 * ```tsx
 * <EventForm
 *   categories={categories}
 *   onSubmit={(data) => createEvent(data)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export function EventForm({
  event = null,
  categories = [],
  defaultStartTime = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  testId,
}: EventFormProps) {
  // Track previous event ID to detect when event prop changes
  const prevEventIdRef = useRef<string | null>(event?.id ?? null);

  // Form state
  const [formData, setFormData] = useState<FormData>(() => createFormDataFromEvent(event, defaultStartTime));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Determine if we're in edit mode
  const isEditMode = Boolean(event);

  // Update form when event changes (edit mode) - sync props to state
  // This is a legitimate pattern for responding to prop changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (event && event.id !== prevEventIdRef.current) {
      prevEventIdRef.current = event.id;
      setFormData(createFormDataFromEvent(event, defaultStartTime));
      setErrors({});
      setTouched({});
    }
  }, [event, defaultStartTime]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Handle field changes - memoized to prevent unnecessary child re-renders
  const handleChange = useCallback((field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    setErrors((prev) => {
      if (prev[field as keyof FormErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  // Handle field blur (mark as touched) - memoized
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  // Handle time changes
  const handleStartTimeChange = useCallback(
    (timeStr: string) => {
      const newStartTime = timeStringToDate(timeStr, formData.startTime || new Date());
      handleChange('startTime', newStartTime);
    },
    [formData.startTime, handleChange]
  );

  const handleEndTimeChange = useCallback(
    (timeStr: string) => {
      const newEndTime = timeStringToDate(timeStr, formData.endTime || new Date());
      handleChange('endTime', newEndTime);
    },
    [formData.endTime, handleChange]
  );

  // Handle recurrence toggle - enables/disables recurrence with default pattern
  const handleRecurrenceToggle = useCallback(
    (checked: boolean) => {
      handleChange('recurrence', checked ? DEFAULT_RECURRENCE_PATTERN : null);
    },
    [handleChange]
  );

  // Handle confidential toggle
  const handleConfidentialToggle = useCallback(
    (checked: boolean) => {
      handleChange('isConfidential', checked);
      // Clear alternate title if unchecking confidential
      if (!checked) {
        handleChange('alternateTitle', '');
      }
    },
    [handleChange]
  );

  // Handle form submission - memoized
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate form
      const validationErrors = validateForm(formData);
      setErrors(validationErrors);

      // Mark all fields as touched
      setTouched({
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        location: true,
        alternateTitle: formData.isConfidential,
      });

      // If validation fails, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      // Convert form data and submit
      const eventInput = formDataToEventInput(formData);
      onSubmit(eventInput);
    },
    [formData, onSubmit]
  );

  // Show errors only for touched fields
  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid={testId || 'event-form'}
      noValidate
    >
      {/* Form Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode
            ? 'Update event details below'
            : 'Fill in the details to create a new event'}
        </p>
      </div>

      {/* Title Field */}
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        onBlur={() => handleBlur('title')}
        error={getFieldError('title')}
        placeholder="Enter event title"
        required
        fullWidth
        maxLength={TITLE_MAX_LENGTH}
        disabled={isSubmitting}
        autoFocus
        testId="event-title"
      />

      {/* Description Field */}
      <TextArea
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        onBlur={() => handleBlur('description')}
        error={getFieldError('description')}
        placeholder="Enter event description (optional)"
        helperText="Optional details about the event"
        rows={4}
        fullWidth
        maxLength={DESCRIPTION_MAX_LENGTH}
        disabled={isSubmitting}
        testId="event-description"
      />

      {/* Time Row - Start and End */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TimePicker
          label="Start Time"
          value={dateToTimeString(formData.startTime)}
          onChange={handleStartTimeChange}
          onBlur={() => handleBlur('startTime')}
          error={getFieldError('startTime')}
          required
          fullWidth
          disabled={isSubmitting}
          testId="event-start-time"
        />

        <TimePicker
          label="End Time"
          value={dateToTimeString(formData.endTime)}
          onChange={handleEndTimeChange}
          onBlur={() => handleBlur('endTime')}
          error={getFieldError('endTime')}
          required
          fullWidth
          disabled={isSubmitting}
          testId="event-end-time"
        />
      </div>

      {/* Location Field */}
      <Input
        label="Location"
        value={formData.location}
        onChange={(e) => handleChange('location', e.target.value)}
        onBlur={() => handleBlur('location')}
        error={getFieldError('location')}
        placeholder="Enter event location (optional)"
        helperText="Optional location or meeting link"
        fullWidth
        maxLength={LOCATION_MAX_LENGTH}
        disabled={isSubmitting}
        testId="event-location"
      />

      {/* Category Select */}
      <CategorySelect
        label="Category"
        categories={categories}
        value={formData.categoryId || null}
        onChange={(categoryId) => handleChange('categoryId', categoryId || '')}
        helperText="Optional category for organization"
        disabled={isSubmitting}
        testId="event-category"
      />

      {/* Confidential Section */}
      <div className="space-y-4">
        <Toggle
          label="Confidential"
          checked={formData.isConfidential}
          onChange={handleConfidentialToggle}
          disabled={isSubmitting}
          helperText="Hide event details in Google Calendar"
          testId="event-confidential-toggle"
        />

        {formData.isConfidential && (
          <Input
            label="Alternate Title"
            value={formData.alternateTitle}
            onChange={(e) => handleChange('alternateTitle', e.target.value)}
            onBlur={() => handleBlur('alternateTitle')}
            error={getFieldError('alternateTitle')}
            placeholder="Title to show in Google Calendar"
            helperText="This title will appear in Google Calendar instead of the real title"
            required
            fullWidth
            maxLength={ALTERNATE_TITLE_MAX_LENGTH}
            disabled={isSubmitting}
            testId="event-alternate-title"
          />
        )}
      </div>

      {/* Recurrence Section */}
      <div className="space-y-4">
        <Toggle
          label="Repeat"
          checked={formData.recurrence !== null}
          onChange={handleRecurrenceToggle}
          disabled={isSubmitting}
          testId="event-repeat-toggle"
        />

        {formData.recurrence !== null && (
          <RecurrenceForm
            value={formData.recurrence}
            onChange={(pattern) => handleChange('recurrence', pattern)}
            disabled={isSubmitting}
            testId="event-recurrence-form"
          />
        )}
      </div>

      {/* Edit Mode Only: Created Date */}
      {isEditMode && event?.createdAt && (
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Created
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
            {formatCreatedDate(new Date(event.createdAt))}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            w-full sm:w-auto px-6 py-2 rounded-lg
            bg-gray-200 text-gray-700 font-medium
            transition-colors
            hover:bg-gray-300
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full sm:w-auto px-6 py-2 rounded-lg
            bg-amber-500 text-white font-medium
            transition-colors
            hover:bg-amber-600
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{isEditMode ? 'Update Event' : 'Create Event'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default EventForm;
